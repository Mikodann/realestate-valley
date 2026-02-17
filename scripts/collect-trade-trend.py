#!/usr/bin/env python3
"""서울 권역별 월별 아파트 실거래가 + 거래량 수집 (Vercel API 경유)"""

import json, time, urllib.request
from datetime import datetime

API_BASE = "https://realestate-valley.vercel.app/api/apt-trade"

DISTRICTS = {
    "종로구": "11110", "중구": "11140", "용산구": "11170",
    "성동구": "11200", "광진구": "11215", "동대문구": "11230",
    "중랑구": "11260", "성북구": "11290", "강북구": "11305",
    "도봉구": "11320", "노원구": "11350", "은평구": "11380",
    "서대문구": "11410", "마포구": "11440", "양천구": "11470",
    "강서구": "11500", "구로구": "11530", "금천구": "11545",
    "영등포구": "11560", "동작구": "11590", "관악구": "11620",
    "서초구": "11650", "강남구": "11680", "송파구": "11710",
    "강동구": "11740"
}

ZONES = {
    "도심권": ["종로구", "중구", "용산구"],
    "동북권": ["성동구", "광진구", "동대문구", "중랑구", "성북구", "강북구", "도봉구", "노원구"],
    "서북권": ["은평구", "서대문구", "마포구"],
    "서남권": ["양천구", "강서구", "구로구", "금천구", "영등포구", "동작구", "관악구"],
    "동남권": ["서초구", "강남구", "송파구", "강동구"]
}

def fetch(region, ym):
    url = f"{API_BASE}?region={region}&year_month={ym}"
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            d = json.loads(r.read())
            return d.get("data", [])
    except Exception as e:
        print(f"  ❌ {region} {ym}: {e}")
        return []

def parse_price(item):
    try:
        return int(str(item.get("price", "0")).strip().replace(",", ""))
    except:
        return 0

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
    print(f"📍 서울 {len(DISTRICTS)}개 구\n")

    district_monthly = {}

    for gu, code in DISTRICTS.items():
        print(f"🔍 {gu} 수집 중...", end=" ", flush=True)
        district_monthly[gu] = {}
        total = 0
        for ym in months:
            items = fetch(code, ym)
            district_monthly[gu][ym] = items
            total += len(items)
            time.sleep(0.5)
        print(f"✅ {total}건")

    # 권역별 월별 집계
    result = {
        "updated": now.strftime("%Y-%m-%d %H:%M"),
        "period": {"start": months[0], "end": months[-1]},
        "zones": {},
        "districts": {},
        "months": months
    }

    for zone, gus in ZONES.items():
        result["zones"][zone] = {"districts": gus, "monthly": []}
        for ym in months:
            prices = []
            count = 0
            for gu in gus:
                items = district_monthly.get(gu, {}).get(ym, [])
                count += len(items)
                for item in items:
                    p = parse_price(item)
                    if p > 0:
                        prices.append(p)
            avg = round(sum(prices) / len(prices)) if prices else 0
            mid = sorted(prices)[len(prices)//2] if prices else 0
            result["zones"][zone]["monthly"].append({
                "month": ym,
                "avg": avg,
                "median": mid,
                "count": count,
                "max": max(prices) if prices else 0,
                "min": min(prices) if prices else 0
            })

    for gu in DISTRICTS:
        result["districts"][gu] = {"monthly": []}
        for ym in months:
            items = district_monthly.get(gu, {}).get(ym, [])
            prices = [parse_price(i) for i in items if parse_price(i) > 0]
            avg = round(sum(prices) / len(prices)) if prices else 0
            result["districts"][gu]["monthly"].append({
                "month": ym,
                "avg": avg,
                "count": len(items)
            })

    out_path = "public/data/trade-trend.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    total_trades = sum(
        sum(len(district_monthly[gu].get(ym, [])) for ym in months)
        for gu in DISTRICTS
    )
    print(f"\n🎉 수집 완료! 총 {total_trades:,}건")
    print(f"📁 저장: {out_path}")

if __name__ == "__main__":
    main()
