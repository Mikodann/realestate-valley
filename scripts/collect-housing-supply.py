#!/usr/bin/env python3
"""KOSIS - 주택건설 인허가 실적 수집 (서울/수도권/전국)"""

import json, re, os, subprocess, urllib.request, urllib.parse
from datetime import datetime

KOSIS_KEY = "MzRkMGRlMGQ0MzhjOGMyOGE0YTc2NDdmMTdmZTA1MTQ="
BASE_URL = "https://kosis.kr/openapi/Param/statisticsParameterData.do"
REPO_DIR = os.path.expanduser("~/realestate-valley")

# DT_MLTM_2080: 주택건설 인허가
# objL1=지역, objL2=부문(총합), objL3=규모(총합)
REGIONS = {
    "전국": "13102792722A.0001",
    "수도권": "13102792722A.0002",
    "서울": "13102792722A.0003",
}

def parse_kosis(raw):
    try: return json.loads(raw)
    except:
        normalized = re.sub(r'([\{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:', r'\1"\2":', raw)
        return json.loads(normalized)

def fetch(region_code, start, end, retries=3):
    params = {
        "method": "getList", "apiKey": KOSIS_KEY,
        "itmId": "13103792722T1 ",
        "objL1": region_code,
        "objL2": "13102792722B.0001",
        "objL3": "13102792722C.0001",
        "objL4": "", "objL5": "", "objL6": "", "objL7": "", "objL8": "",
        "format": "json", "jsonVD": "Y", "prdSe": "M",
        "startPrdDe": start, "endPrdDe": end,
        "orgId": "116", "tblId": "DT_MLTM_2080",
    }
    url = BASE_URL + "?" + urllib.parse.urlencode(params)
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as r:
                raw = r.read().decode("utf-8")
            data = parse_kosis(raw)
            if isinstance(data, list): return data
            return []
        except Exception as e:
            if attempt < retries - 1:
                import time; time.sleep(1)
            else:
                print(f"  fail: {e}")
                return []

def main():
    now = datetime.now()
    start, end = "202401", now.strftime("%Y%m")
    print("KOSIS housing supply\n")

    result = {"updated": now.strftime("%Y-%m-%d %H:%M"), "period": {"start": start, "end": end}}

    for name, code in REGIONS.items():
        print(f"{name}...", end=" ", flush=True)
        rows = fetch(code, start, end)
        arr = []
        for r in rows:
            m, v = r.get("PRD_DE",""), r.get("DT","")
            if m and v: arr.append({"month": m, "value": int(v)})
        result[name] = arr
        print(f"{len(arr)} months")

    out_path = os.path.join(REPO_DIR, "public/data/housing-supply.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\nSaved: {out_path}")

    print("\nGit push...")
    os.chdir(REPO_DIR)
    subprocess.run(["git","pull","origin","master","--rebase"], check=True)
    subprocess.run(["git","add","public/data/housing-supply.json","scripts/collect-housing-supply.py"], check=True)
    rc = subprocess.run(["git","diff","--cached","--quiet"])
    if rc.returncode != 0:
        subprocess.run(["git","commit","-m",f"주택 인허가 데이터 ({now.strftime('%Y-%m-%d')})"], check=True)
        subprocess.run(["git","push","origin","master"], check=True)
        print("Done!")
    else:
        print("No changes")

if __name__ == "__main__":
    main()
