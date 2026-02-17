#!/usr/bin/env python3
"""서울 아파트 매매/전세 가격지수 수집 (한국부동산원 R-ONE API)"""

import json, time, urllib.request, subprocess, os
from datetime import datetime

RONE_KEY = "6a38db12e18a447f9f822a510b3a8616"
RONE_URL = "https://www.reb.or.kr/r-one/openapi/SttsApiTblData.do"
REPO_DIR = os.path.expanduser("~/realestate-valley")

# 통계 테이블 ID
TABLES = {
    "매매지수": "A_2024_00178",
    "전세지수": "A_2024_00182",
}

# 서울 관련 CLS_ID만 필터
SEOUL_CLS = {
    500007: "서울",
    510008: "도심권",
    510009: "동북권",
    510010: "서북권",
    510011: "서남권",
    510012: "동남권",
}

def fetch_month(statbl_id, ym, retries=3):
    url = f"{RONE_URL}?KEY={RONE_KEY}&STATBL_ID={statbl_id}&Type=json&pIndex=1&pSize=100&DTACYCLE_CD=MM&WRTTIME_IDTFR_ID={ym}"
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(url, timeout=20) as r:
                d = json.loads(r.read())
                if "SttsApiTblData" in d:
                    return d["SttsApiTblData"][1]["row"]
                return []
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2)
            else:
                print(f"  ❌ {statbl_id} {ym}: {e}")
                return []

def main():
    now = datetime.now()
    months = []
    y, m = 2024, 1
    while (y < now.year) or (y == now.year and m <= now.month):
        months.append(f"{y}{m:02d}")
        m += 1
        if m > 12:
            m = 1
            y += 1

    print(f"📊 수집 기간: {months[0]} ~ {months[-1]} ({len(months)}개월)")
    print(f"📍 서울 아파트 매매/전세 가격지수\n")

    result = {
        "updated": now.strftime("%Y-%m-%d %H:%M"),
        "period": {"start": months[0], "end": months[-1]},
        "months": months,
        "매매지수": {},
        "전세지수": {},
    }

    for label, statbl_id in TABLES.items():
        print(f"🔍 {label} 수집 중...")

        # 지역별 데이터 초기화
        for cls_id, name in SEOUL_CLS.items():
            result[label][name] = []

        for ym in months:
            rows = fetch_month(statbl_id, ym)
            found = {}
            for r in rows:
                cls_id = r.get("CLS_ID")
                if cls_id in SEOUL_CLS:
                    found[SEOUL_CLS[cls_id]] = r.get("DTA_VAL", 0)

            for name in SEOUL_CLS.values():
                val = found.get(name, None)
                result[label][name].append({
                    "month": ym,
                    "value": round(val, 2) if val else None
                })

            time.sleep(0.3)

        cnt = sum(1 for name in SEOUL_CLS.values() for m in result[label][name] if m["value"])
        print(f"  ✅ {label}: {cnt}건")

    # JSON 저장
    out_path = os.path.join(REPO_DIR, "public/data/price-index.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 수집 완료!")
    print(f"📁 저장: {out_path}")

    # Git push
    print("\n📤 Git push 중...")
    os.chdir(REPO_DIR)
    subprocess.run(["git", "add", "public/data/price-index.json"], check=True)
    rc = subprocess.run(["git", "diff", "--cached", "--quiet"])
    if rc.returncode != 0:
        subprocess.run(["git", "commit", "-m", f"가격지수 자동 갱신 ({now.strftime('%Y-%m-%d')})"], check=True)
        subprocess.run(["git", "push", "origin", "master"], check=True)
        print("✅ Git push 완료!")
    else:
        print("ℹ️ 변경사항 없음")

if __name__ == "__main__":
    main()
