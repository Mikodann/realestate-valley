#!/usr/bin/env python3
"""한국은행 ECOS API - 기준금리 + 주택담보대출 금리 수집"""

import json, urllib.request, subprocess, os
from datetime import datetime

ECOS_KEY = "O54TU8XB4EJAC3SPME3S"
ECOS_URL = "https://ecos.bok.or.kr/api/StatisticSearch"
REPO_DIR = os.path.expanduser("~/realestate-valley")

def fetch(stat_code, cycle, start, end, item_code, retries=3):
    url = f"{ECOS_URL}/{ECOS_KEY}/json/kr/1/100/{stat_code}/{cycle}/{start}/{end}/{item_code}"
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(url, timeout=15) as r:
                d = json.loads(r.read())
                return d.get("StatisticSearch", {}).get("row", [])
        except Exception as e:
            if attempt < retries - 1:
                import time; time.sleep(1)
            else:
                print(f"  ❌ {stat_code}/{item_code}: {e}")
                return []

def main():
    now = datetime.now()
    start_d = "20240101"
    end_d = now.strftime("%Y%m%d")
    start_m = "202401"
    end_m = now.strftime("%Y%m")

    print("📊 한국은행 ECOS 금리 데이터 수집\n")

    result = {
        "updated": now.strftime("%Y-%m-%d %H:%M"),
        "기준금리": [],
        "주택담보대출": [],
        "가계대출": [],
    }

    # 1. 기준금리 (일별 → 월별 마지막 값만 추출)
    print("🔍 기준금리 수집 중...", end=" ", flush=True)
    rows = fetch("722Y001", "D", start_d, end_d, "0101000")
    monthly = {}
    for r in rows:
        t = r.get("TIME", "")
        ym = t[:6]
        val = r.get("DATA_VALUE")
        if ym and val:
            monthly[ym] = float(val)
    for ym in sorted(monthly.keys()):
        result["기준금리"].append({"month": ym, "value": monthly[ym]})
    print(f"✅ {len(result['기준금리'])}개월")

    # 2. 주택담보대출 금리 (월별)
    print("🔍 주택담보대출 금리 수집 중...", end=" ", flush=True)
    rows = fetch("121Y006", "M", start_m, end_m, "BECBLA0302")
    for r in rows:
        val = r.get("DATA_VALUE")
        if val:
            result["주택담보대출"].append({"month": r["TIME"], "value": float(val)})
    print(f"✅ {len(result['주택담보대출'])}개월")

    # 3. 가계대출 금리 (월별)
    print("🔍 가계대출 금리 수집 중...", end=" ", flush=True)
    rows = fetch("121Y006", "M", start_m, end_m, "BECBLA03")
    for r in rows:
        val = r.get("DATA_VALUE")
        if val:
            result["가계대출"].append({"month": r["TIME"], "value": float(val)})
    print(f"✅ {len(result['가계대출'])}개월")

    # JSON 저장
    out_path = os.path.join(REPO_DIR, "public/data/interest-rate.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\n🎉 수집 완료! 저장: {out_path}")

    # Git push
    print("\n📤 Git push 중...")
    os.chdir(REPO_DIR)
    subprocess.run(["git", "pull", "origin", "master", "--rebase"], check=True)
    subprocess.run(["git", "add", "public/data/interest-rate.json"], check=True)
    rc = subprocess.run(["git", "diff", "--cached", "--quiet"])
    if rc.returncode != 0:
        subprocess.run(["git", "commit", "-m", f"금리 데이터 갱신 ({now.strftime('%Y-%m-%d')})"], check=True)
        subprocess.run(["git", "push", "origin", "master"], check=True)
        print("✅ Git push 완료!")
    else:
        print("ℹ️ 변경사항 없음")

if __name__ == "__main__":
    main()
