#!/usr/bin/env python3
"""전월세 실거래가 수집 - Vercel API 경유"""

import json, os, subprocess, time, xml.etree.ElementTree as ET
from datetime import datetime
from urllib.request import urlopen, Request

VERCEL_URL = "https://realestate-valley.vercel.app/api/apt-rent"
REPO_DIR = os.path.expanduser("~/realestate-valley")

DISTRICTS = {
    "종로구":"11110","중구":"11140","용산구":"11170","성동구":"11200",
    "광진구":"11215","동대문구":"11230","중랑구":"11260","성북구":"11290",
    "강북구":"11305","도봉구":"11320","노원구":"11350","은평구":"11380",
    "서대문구":"11410","마포구":"11440","양천구":"11470","강서구":"11500",
    "구로구":"11530","금천구":"11545","영등포구":"11560","동작구":"11590",
    "관악구":"11620","서초구":"11650","강남구":"11680","송파구":"11710",
    "강동구":"11740",
}

def fetch_rent(lawd_cd, deal_ymd, retries=3):
    url = f"{VERCEL_URL}?LAWD_CD={lawd_cd}&DEAL_YMD={deal_ymd}&numOfRows=5000"
    for attempt in range(retries):
        try:
            req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
            raw = urlopen(req, timeout=30).read().decode("utf-8")
            root = ET.fromstring(raw)
            items = root.findall(".//item")
            results = []
            for item in items:
                deposit = item.findtext("deposit", "").strip().replace(",", "")
                monthly = item.findtext("monthlyRent", "").strip().replace(",", "")
                area = item.findtext("excluUseAr", "").strip()
                if deposit and area:
                    try:
                        dep = int(deposit)
                        mon = int(monthly) if monthly else 0
                        ar = float(area)
                        # 전세: 월세=0, 월세: 월세>0
                        results.append({"deposit": dep, "monthly": mon, "area": ar, "type": "전세" if mon == 0 else "월세"})
                    except:
                        pass
            return results
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2)
            else:
                print(f"    fail: {e}")
                return []

def main():
    now = datetime.now()
    months = []
    for y in range(2024, now.year + 1):
        for m in range(1, 13):
            ym = f"{y}{m:02d}"
            if ym <= now.strftime("%Y%m"):
                months.append(ym)

    print(f"전월세 실거래가 수집 ({len(months)}개월 x {len(DISTRICTS)}구)\n")

    result = {"updated": now.strftime("%Y-%m-%d %H:%M"), "months": months, "districts": {}}

    for name, code in DISTRICTS.items():
        print(f"{name}...", end=" ", flush=True)
        monthly_data = []
        for ym in months:
            items = fetch_rent(code, ym)
            jeonse = [x for x in items if x["type"] == "전세"]
            avg_jeonse = int(sum(x["deposit"] for x in jeonse) / len(jeonse)) if jeonse else 0
            monthly_data.append({
                "month": ym,
                "jeonse_avg": avg_jeonse,
                "jeonse_count": len(jeonse),
                "wolse_count": len([x for x in items if x["type"] == "월세"]),
                "total": len(items),
            })
            time.sleep(0.3)
        result["districts"][name] = monthly_data
        cnt = sum(x["total"] for x in monthly_data)
        print(f"{cnt}건")

    out_path = os.path.join(REPO_DIR, "public/data/rent-trend.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\nSaved: {out_path}")

    print("\nGit push...")
    os.chdir(REPO_DIR)
    subprocess.run(["git", "pull", "origin", "master", "--rebase"], check=True)
    subprocess.run(["git", "add", "public/data/rent-trend.json", "scripts/collect-rent-trend.py"], check=True)
    rc = subprocess.run(["git", "diff", "--cached", "--quiet"])
    if rc.returncode != 0:
        subprocess.run(["git", "commit", "-m", f"전월세 데이터 ({now.strftime('%Y-%m-%d')})"], check=True)
        subprocess.run(["git", "push", "origin", "master"], check=True)
        print("Done!")
    else:
        print("No changes")

if __name__ == "__main__":
    main()
