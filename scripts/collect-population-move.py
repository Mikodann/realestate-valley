#!/usr/bin/env python3
"""KOSIS OpenAPI에서 서울 월별 전입/전출 데이터를 수집해 JSON으로 저장한다."""

from __future__ import annotations

import argparse
import ast
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

META_URL = "https://kosis.kr/openapi/statisticsData.do"
DATA_URL = "https://kosis.kr/openapi/Param/statisticsParameterData.do"
DEFAULT_API_KEY = "MzRkMGRlMGQ0MzhjOGMyOGE0YTc2NDdmMTdmZTA1MTQ="
DEFAULT_ORG_ID = "101"
DEFAULT_TBL_ID = "DT_1B26001"


@dataclass
class MoveCodes:
    seoul_obj_l1: str
    inbound_itm: str
    outbound_itm: str


def http_get(base_url: str, params: dict[str, str], timeout: int = 30) -> str:
    query = urllib.parse.urlencode(params)
    url = f"{base_url}?{query}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        raw = res.read()
    return raw.decode("utf-8", errors="replace").strip()


def parse_kosis_maybe_nonstandard(payload: str) -> Any:
    text = payload.strip()
    if not text:
        return []

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # KOSIS 응답 중 key 쿼팅이 없는 형태를 보정
    normalized = text
    normalized = re.sub(r"([\{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:", r'\1"\2":', normalized)
    normalized = normalized.replace("'", '"')

    try:
        return json.loads(normalized)
    except json.JSONDecodeError:
        # 마지막 fallback (파이썬 literal 형태 허용)
        return ast.literal_eval(text)


def ensure_list(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, list):
        return [x for x in data if isinstance(x, dict)]
    if isinstance(data, dict):
        return [data]
    return []


def fetch_meta(api_key: str, org_id: str, tbl_id: str, meta_type: str) -> list[dict[str, Any]]:
    payload = http_get(
        META_URL,
        {
            "method": "getMeta",
            "type": meta_type,
            "apiKey": api_key,
            "orgId": org_id,
            "tblId": tbl_id,
            "format": "json",
        },
    )
    return ensure_list(parse_kosis_maybe_nonstandard(payload))


def pick_codes(itm_meta: list[dict[str, Any]], org_meta: list[dict[str, Any]]) -> MoveCodes:
    seoul = next(
        (
            x
            for x in org_meta
            if "서울" in str(x.get("C1_NM", "")) or "서울" in str(x.get("ORG_NM", ""))
        ),
        None,
    )
    if not seoul:
        raise RuntimeError("ORG 메타에서 서울 코드를 찾지 못했습니다.")

    inbound = next(
        (
            x
            for x in itm_meta
            if "전입" in str(x.get("ITM_NM", "")) or "전입" in str(x.get("NM", ""))
        ),
        None,
    )
    outbound = next(
        (
            x
            for x in itm_meta
            if "전출" in str(x.get("ITM_NM", "")) or "전출" in str(x.get("NM", ""))
        ),
        None,
    )

    if not inbound or not outbound:
        raise RuntimeError("ITM 메타에서 전입/전출 항목 코드를 찾지 못했습니다.")

    obj_l1 = str(seoul.get("C1", seoul.get("OBJ_L1")))
    in_id = str(inbound.get("ITM_ID", inbound.get("ITM")))
    out_id = str(outbound.get("ITM_ID", outbound.get("ITM")))

    if not obj_l1 or not in_id or not out_id:
        raise RuntimeError("필수 코드(objL1/itmId) 파싱에 실패했습니다.")

    return MoveCodes(seoul_obj_l1=obj_l1, inbound_itm=in_id, outbound_itm=out_id)


def fetch_data(
    api_key: str,
    org_id: str,
    tbl_id: str,
    start_ym: str,
    end_ym: str,
    obj_l1: str,
    itm_id: str,
) -> list[dict[str, Any]]:
    payload = http_get(
        DATA_URL,
        {
            "method": "getList",
            "apiKey": api_key,
            "format": "json",
            "jsonVD": "Y",
            "userStatsId": "",
            "prdSe": "M",
            "startPrdDe": start_ym,
            "endPrdDe": end_ym,
            "orgId": org_id,
            "tblId": tbl_id,
            "objL1": obj_l1,
            "itmId": itm_id,
        },
    )
    data = ensure_list(parse_kosis_maybe_nonstandard(payload))

    if data and any("err" in "".join(map(str, d.keys())).lower() for d in data):
        raise RuntimeError(f"KOSIS 오류 응답: {data}")
    return data


def this_month() -> str:
    now = datetime.now()
    return f"{now.year}{now.month:02d}"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-key", default=os.getenv("KOSIS_API_KEY", DEFAULT_API_KEY))
    parser.add_argument("--org-id", default=DEFAULT_ORG_ID)
    parser.add_argument("--tbl-id", default=DEFAULT_TBL_ID)
    parser.add_argument("--start", default="202401")
    parser.add_argument("--end", default=this_month())
    parser.add_argument("--out", default="public/data/population-move.json")
    args = parser.parse_args()

    itm_meta = fetch_meta(args.api_key, args.org_id, args.tbl_id, "ITM")
    org_meta = fetch_meta(args.api_key, args.org_id, args.tbl_id, "ORG")
    codes = pick_codes(itm_meta, org_meta)

    inbound = fetch_data(
        args.api_key,
        args.org_id,
        args.tbl_id,
        args.start,
        args.end,
        codes.seoul_obj_l1,
        codes.inbound_itm,
    )
    outbound = fetch_data(
        args.api_key,
        args.org_id,
        args.tbl_id,
        args.start,
        args.end,
        codes.seoul_obj_l1,
        codes.outbound_itm,
    )

    out = {
        "updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "source": {"orgId": args.org_id, "tblId": args.tbl_id, "objL1": codes.seoul_obj_l1},
        "period": {"start": args.start, "end": args.end},
        "codes": {"inboundItmId": codes.inbound_itm, "outboundItmId": codes.outbound_itm},
        "meta": {"itm": itm_meta, "org": org_meta},
        "data": {"inbound": inbound, "outbound": outbound},
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"✅ 저장 완료: {out_path}")
    print("\n[서울 전입 curl]")
    print(
        "curl -s '"
        + DATA_URL
        + "?method=getList&apiKey={api}&format=json&jsonVD=Y&prdSe=M&startPrdDe={s}&endPrdDe={e}&orgId={org}&tblId={tbl}&objL1={obj}&itmId={itm}'".format(
            api=args.api_key,
            s=args.start,
            e=args.end,
            org=args.org_id,
            tbl=args.tbl_id,
            obj=codes.seoul_obj_l1,
            itm=codes.inbound_itm,
        )
    )
    print("\n[서울 전출 curl]")
    print(
        "curl -s '"
        + DATA_URL
        + "?method=getList&apiKey={api}&format=json&jsonVD=Y&prdSe=M&startPrdDe={s}&endPrdDe={e}&orgId={org}&tblId={tbl}&objL1={obj}&itmId={itm}'".format(
            api=args.api_key,
            s=args.start,
            e=args.end,
            org=args.org_id,
            tbl=args.tbl_id,
            obj=codes.seoul_obj_l1,
            itm=codes.outbound_itm,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"❌ 실패: {exc}", file=sys.stderr)
        raise
