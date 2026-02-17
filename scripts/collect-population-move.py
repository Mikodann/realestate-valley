#!/usr/bin/env python3
"""KOSIS OpenAPI - 서울 인구이동(전입/전출) 월별 데이터 수집

사용법:
  python3 scripts/collect-population-move.py                  # 데이터 수집
  python3 scripts/collect-population-move.py --meta            # 테이블 메타정보 조회
  python3 scripts/collect-population-move.py --meta --type ITM # 특정 메타 타입만 조회
"""

import json, os, re, sys, time, urllib.request, urllib.parse
from datetime import datetime

API_KEY = "MzRkMGRlMGQ0MzhjOGMyOGE0YTc2NDdmMTdmZTA1MTQ="
ORG_ID = "101"  # 통계청
TBL_ID = "DT_1B26001"  # 시군구/성/연령별 이동자수

REPO_DIR = os.path.expanduser("~/realestate-valley")
OUT_PATH = os.path.join(REPO_DIR, "public/data/population-move.json")

# API endpoints
META_URL = "https://kosis.kr/openapi/statisticsData.do"
DATA_URL = "https://kosis.kr/openapi/Param/statisticsParameterData.do"


def fix_nonstandard_json(text):
    """KOSIS가 비표준 JSON을 반환할 경우 키에 따옴표를 추가하여 파싱"""
    text = text.strip()
    if not text:
        return text
    # 이미 유효한 JSON이면 그대로 반환
    try:
        json.loads(text)
        return text
    except json.JSONDecodeError:
        pass
    # 따옴표 없는 키에 따옴표 추가: {key: "val"} -> {"key": "val"}
    fixed = re.sub(r'(?<=[{,])\s*([a-zA-Z_]\w*)\s*:', r' "\1":', text)
    # 따옴표 없는 값 처리: {"key": value} (숫자/boolean/null 제외)
    fixed = re.sub(
        r':\s*(?![\d"{\[\-]|true|false|null)([a-zA-Z_]\w*)',
        r': "\1"',
        fixed,
    )
    return fixed


def api_request(base_url, params, retries=3):
    """KOSIS API 호출 (재시도 포함)"""
    query = urllib.parse.urlencode(params, quote_via=urllib.parse.quote)
    url = f"{base_url}?{query}"

    for attempt in range(retries):
        try:
            req = urllib.request.Request(url)
            req.add_header("User-Agent", "Mozilla/5.0 (realestate-valley)")
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8")
                if not raw.strip():
                    print(f"  [경고] 빈 응답 수신 (시도 {attempt + 1}/{retries})")
                    if attempt < retries - 1:
                        time.sleep(2 ** attempt)
                        continue
                    return None
                fixed = fix_nonstandard_json(raw)
                try:
                    return json.loads(fixed)
                except json.JSONDecodeError as e:
                    print(f"  [경고] JSON 파싱 실패: {e}")
                    print(f"  응답 앞 500자: {raw[:500]}")
                    return raw
        except Exception as e:
            print(f"  [에러] 요청 실패 (시도 {attempt + 1}/{retries}): {e}")
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                return None


def get_meta(meta_type="ORG"):
    """getMeta API: 테이블 메타정보 조회

    type 값:
      TBL   - 통계표명
      ORG   - 기관 정보
      PRD   - 수록주기/기간
      ITM   - 항목(itmId) 목록
      CMMT  - 주석
      UNIT  - 단위
      SOURCE - 출처
      NCD   - 분류코드(objL) 정보
    """
    params = {
        "method": "getMeta",
        "apiKey": API_KEY,
        "format": "json",
        "jsonVD": "Y",
        "type": meta_type,
        "orgId": ORG_ID,
        "tblId": TBL_ID,
    }
    print(f"\n--- getMeta type={meta_type} ---")
    data = api_request(META_URL, params)
    if data and isinstance(data, list):
        for item in data[:20]:
            print(f"  {json.dumps(item, ensure_ascii=False)}")
        if len(data) > 20:
            print(f"  ... 외 {len(data) - 20}건")
    elif data and isinstance(data, dict):
        if "err" in data:
            print(f"  에러: {json.dumps(data['err'], ensure_ascii=False)}")
        else:
            print(f"  {json.dumps(data, ensure_ascii=False, indent=2)[:2000]}")
    elif isinstance(data, str):
        print(f"  원본 응답: {data[:1000]}")
    else:
        print("  응답 없음")
    return data


def fetch_data(start_prd="202401", end_prd=None, obj_l1="ALL", obj_l2="",
               obj_l3="", itm_id="ALL", prd_se="M"):
    """statisticsParameterData API: 통계자료 조회"""
    if end_prd is None:
        end_prd = datetime.now().strftime("%Y%m")

    params = {
        "method": "getList",
        "apiKey": API_KEY,
        "format": "json",
        "jsonVD": "Y",
        "orgId": ORG_ID,
        "tblId": TBL_ID,
        "itmId": itm_id,
        "objL1": obj_l1,
        "objL2": obj_l2,
        "objL3": obj_l3,
        "objL4": "",
        "objL5": "",
        "objL6": "",
        "objL7": "",
        "objL8": "",
        "prdSe": prd_se,
        "startPrdDe": start_prd,
        "endPrdDe": end_prd,
    }
    print(f"\n데이터 요청: objL1={obj_l1}, objL2={obj_l2}, "
          f"objL3={obj_l3}, itmId={itm_id}, prdSe={prd_se}, "
          f"기간={start_prd}~{end_prd}")
    return api_request(DATA_URL, params)


def try_fetch_with_fallback(start_prd="202401", end_prd=None):
    """여러 파라미터 조합을 시도하여 서울 인구이동 데이터 가져오기

    DT_1B26001 테이블 구조 (예상):
      - objL1: 전출지 시도 (11=서울)
      - objL2: 전입지 시도 (11=서울)
      - objL3: 성별/연령 등 추가 분류
      - itmId: 이동자수 항목 (T10=총이동, T20=전입, T30=전출 등)
    """
    if end_prd is None:
        end_prd = datetime.now().strftime("%Y%m")

    # 시도 순서대로 여러 파라미터 조합을 시도
    strategies = [
        # 전략 1: 서울(11) 관련 전체 데이터 (objL1=ALL → 서울 전입/전출 모두 포함)
        {"desc": "서울(11) objL1만", "objL1": "11", "objL2": "", "objL3": "", "itmId": "ALL"},
        # 전략 2: objL2도 ALL
        {"desc": "서울(11) + objL2=ALL", "objL1": "11", "objL2": "ALL", "objL3": "", "itmId": "ALL"},
        # 전략 3: objL1=ALL, objL2=11 (전입지가 서울인 데이터)
        {"desc": "전입지=서울(11)", "objL1": "ALL", "objL2": "11", "objL3": "", "itmId": "ALL"},
        # 전략 4: 전국(00)으로 넓혀서 시도
        {"desc": "전국(00)", "objL1": "00", "objL2": "", "objL3": "", "itmId": "ALL"},
        # 전략 5: 전체 ALL
        {"desc": "전체 ALL", "objL1": "ALL", "objL2": "", "objL3": "", "itmId": "ALL"},
        # 전략 6: 전체 ALL + objL2 ALL
        {"desc": "전체 ALL + ALL", "objL1": "ALL", "objL2": "ALL", "objL3": "", "itmId": "ALL"},
        # 전략 7: 전체 ALL + objL2 ALL + objL3 ALL
        {"desc": "전체 ALL*3", "objL1": "ALL", "objL2": "ALL", "objL3": "ALL", "itmId": "ALL"},
    ]

    for i, s in enumerate(strategies):
        print(f"\n{'='*60}")
        print(f"전략 {i+1}: {s['desc']}")
        print(f"{'='*60}")

        data = fetch_data(
            start_prd=start_prd, end_prd=end_prd,
            obj_l1=s["objL1"], obj_l2=s["objL2"],
            obj_l3=s["objL3"], itm_id=s["itmId"],
        )

        if data is None:
            print("  -> 응답 없음, 다음 전략 시도")
            continue

        if isinstance(data, str):
            print(f"  -> 비JSON 응답: {data[:300]}")
            continue

        if isinstance(data, dict) and "err" in data:
            err = data["err"]
            err_msg = err.get("errMsg", "") if isinstance(err, dict) else str(err)
            err_code = err.get("errCd", "") if isinstance(err, dict) else ""
            print(f"  -> 에러 {err_code}: {err_msg}")
            continue

        if isinstance(data, list):
            if len(data) == 0:
                print("  -> 빈 배열, 다음 전략 시도")
                continue
            print(f"  -> 성공! {len(data)}건 수신")
            print(f"  샘플: {json.dumps(data[0], ensure_ascii=False)[:300]}")
            return data, s

    print("\n모든 전략 실패. getMeta로 테이블 구조를 먼저 확인하세요:")
    print("  python3 scripts/collect-population-move.py --meta")
    return None, None


def parse_seoul_data(raw_data, strategy):
    """원시 데이터에서 서울 전입/전출 월별 데이터 추출"""
    if not raw_data or not isinstance(raw_data, list):
        return None

    # 응답 필드 구조 파악 (첫 번째 레코드 키 확인)
    sample = raw_data[0] if raw_data else {}
    print(f"\n응답 필드: {list(sample.keys())}")

    # KOSIS 통계자료 응답 필드명 (일반적):
    # TBL_NM: 통계표명, TBL_ID: 통계표ID
    # ORG_ID: 기관코드, PRD_DE: 수록시점
    # PRD_SE: 수록주기, C1/C1_NM: 분류1 코드/이름
    # C2/C2_NM: 분류2 코드/이름, ITM_ID/ITM_NM: 항목ID/이름
    # DT: 데이터값, UNIT_NM: 단위

    monthly = {}  # {YYYYMM: {"전입": val, "전출": val, ...}}

    for row in raw_data:
        period = row.get("PRD_DE", row.get("TM", row.get("prdDe", "")))
        itm_nm = row.get("ITM_NM", row.get("itmNm", ""))
        itm_id = row.get("ITM_ID", row.get("itmId", ""))
        c1 = row.get("C1", row.get("c1", ""))
        c1_nm = row.get("C1_NM", row.get("c1Nm", ""))
        c2 = row.get("C2", row.get("c2", ""))
        c2_nm = row.get("C2_NM", row.get("c2Nm", ""))
        dt = row.get("DT", row.get("dt", ""))

        if not period:
            continue

        if period not in monthly:
            monthly[period] = {"items": {}}

        # 항목명으로 전입/전출 구분
        key = itm_nm or itm_id
        if key:
            try:
                val = int(dt.replace(",", "")) if dt and dt.strip() and dt != "-" else None
            except (ValueError, AttributeError):
                val = None
            monthly[period]["items"][key] = val
            monthly[period]["c1"] = c1
            monthly[period]["c1_nm"] = c1_nm
            monthly[period]["c2"] = c2
            monthly[period]["c2_nm"] = c2_nm

    return monthly


def build_output(monthly_data):
    """프론트엔드에서 사용하기 좋은 형태로 데이터 변환"""
    now = datetime.now()
    months_sorted = sorted(monthly_data.keys())

    if not months_sorted:
        return None

    # 항목명 자동 탐지
    all_items = set()
    for m_data in monthly_data.values():
        all_items.update(m_data.get("items", {}).keys())

    print(f"\n발견된 항목: {all_items}")

    # 전입/전출 관련 항목 자동 매핑
    move_in_keys = [k for k in all_items if "전입" in k]
    move_out_keys = [k for k in all_items if "전출" in k]
    total_keys = [k for k in all_items if "총" in k or "이동" in k]

    result = {
        "updated": now.strftime("%Y-%m-%d %H:%M"),
        "source": "KOSIS 국가통계포털 (통계청, 국내인구이동통계)",
        "table": f"{ORG_ID}/{TBL_ID}",
        "period": {"start": months_sorted[0], "end": months_sorted[-1]},
        "region": "서울특별시",
        "items": sorted(all_items),
        "monthly": [],
    }

    for month in months_sorted:
        m_data = monthly_data[month]
        items = m_data.get("items", {})

        entry = {"month": month}

        # 전입 합산
        if move_in_keys:
            move_in_total = sum(v for k in move_in_keys
                                for v in [items.get(k)] if v is not None)
            entry["전입"] = move_in_total if move_in_total else None
        # 전출 합산
        if move_out_keys:
            move_out_total = sum(v for k in move_out_keys
                                 for v in [items.get(k)] if v is not None)
            entry["전출"] = move_out_total if move_out_total else None
        # 순이동 계산
        if entry.get("전입") is not None and entry.get("전출") is not None:
            entry["순이동"] = entry["전입"] - entry["전출"]

        # 모든 원본 항목도 포함
        entry["detail"] = {k: v for k, v in items.items()}

        result["monthly"].append(entry)

    return result


def run_meta_mode(meta_type=None):
    """메타정보 조회 모드"""
    print("KOSIS 테이블 메타정보 조회")
    print(f"  orgId: {ORG_ID}")
    print(f"  tblId: {TBL_ID}")

    types = [meta_type] if meta_type else ["TBL", "ORG", "PRD", "ITM", "NCD"]
    for t in types:
        get_meta(t)
        time.sleep(0.5)


def main():
    # 명령행 인자 처리
    if "--meta" in sys.argv:
        meta_type = None
        if "--type" in sys.argv:
            idx = sys.argv.index("--type")
            if idx + 1 < len(sys.argv):
                meta_type = sys.argv[idx + 1].upper()
        run_meta_mode(meta_type)
        return

    now = datetime.now()
    start_prd = "202401"
    end_prd = now.strftime("%Y%m")

    print("=" * 60)
    print("KOSIS 서울 인구이동(전입/전출) 월별 데이터 수집")
    print(f"  기간: {start_prd} ~ {end_prd}")
    print(f"  테이블: {ORG_ID}/{TBL_ID}")
    print("=" * 60)

    # 1단계: 데이터 조회
    raw_data, strategy = try_fetch_with_fallback(start_prd, end_prd)

    if raw_data is None:
        print("\n데이터 수집 실패.")
        sys.exit(1)

    # 2단계: 데이터 파싱
    print(f"\n총 {len(raw_data)}건 데이터 파싱 중...")
    monthly = parse_seoul_data(raw_data, strategy)

    if not monthly:
        print("파싱된 데이터가 없습니다.")
        # 원본 데이터 저장 (디버깅용)
        debug_path = OUT_PATH.replace(".json", "-raw.json")
        os.makedirs(os.path.dirname(debug_path), exist_ok=True)
        with open(debug_path, "w", encoding="utf-8") as f:
            json.dump(raw_data[:50], f, ensure_ascii=False, indent=2)
        print(f"원본 데이터 저장: {debug_path}")
        sys.exit(1)

    # 3단계: 출력 형식 변환
    result = build_output(monthly)

    if not result:
        print("출력 데이터 구성 실패.")
        sys.exit(1)

    # 4단계: JSON 저장
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n수집 완료!")
    print(f"  저장: {OUT_PATH}")
    print(f"  기간: {result['period']['start']} ~ {result['period']['end']}")
    print(f"  월수: {len(result['monthly'])}개월")
    if result["monthly"]:
        last = result["monthly"][-1]
        print(f"  최신: {last.get('month')} - "
              f"전입={last.get('전입', 'N/A')}, "
              f"전출={last.get('전출', 'N/A')}, "
              f"순이동={last.get('순이동', 'N/A')}")


if __name__ == "__main__":
    main()
