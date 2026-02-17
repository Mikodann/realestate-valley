#!/usr/bin/env python3
"""KOSIS OpenAPI - 서울 월별 전입/전출 인구이동 수집"""

import json, re, os, subprocess, urllib.request, urllib.parse
from datetime import datetime

KOSIS_KEY = "MzRkMGRlMGQ0MzhjOGMyOGE0YTc2NDdmMTdmZTA1MTQ="
BASE_URL = "https://kosis.kr/openapi/Param/statisticsParameterData.do"
REPO_DIR = os.path.expanduser("~/realestate-valley")

def parse_kosis(raw):
    try:
        return json.loads(raw)
    except:
        normalized = re.sub(r'([\{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:', r'\1"\2":', raw)
        return json.loads(normalized)

def fetch(obj_l1, obj_l2, start, end, retries=3):
    params = {
        "method": "getList", "apiKey": KOSIS_KEY,
        "itmId": "T70 ", "objL1": obj_l1, "objL2": obj_l2,
        "objL3": "0", "objL4": "000",
        "objL5": "", "objL6": "", "objL7": "", "objL8": "",
        "format": "json", "jsonVD": "Y", "prdSe": "M",
        "startPrdDe": start, "endPrdDe": end,
        "orgId": "101", "tblId": "DT_1B26003",
    }
    url = BASE_URL + "?" + urllib.parse.urlencode(params)
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as r:
                raw = r.read().decode("utf-8")
            data = parse_kosis(raw)
            if isinstance(data, list): return data
            if isinstance(data, dict) and "err" in data:
                print(f"  warn: {data}")
                return []
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
    print("KOSIS population move\n")
    result = {"updated": now.strftime("%Y-%m-%d %H:%M"), "period": {"start": start, "end": end}, "inbound": [], "outbound": [], "net": []}

    print("inbound...", end=" ", flush=True)
    for r in fetch("00", "11", start, end):
        m, v = r.get("PRD_DE",""), r.get("DT","")
        if m and v: result["inbound"].append({"month": m, "value": int(v)})
    print(f"{len(result['inbound'])} months")

    print("outbound...", end=" ", flush=True)
    for r in fetch("11", "00", start, end):
        m, v = r.get("PRD_DE",""), r.get("DT","")
        if m and v: result["outbound"].append({"month": m, "value": int(v)})
    print(f"{len(result['outbound'])} months")

    im = {x["month"]: x["value"] for x in result["inbound"]}
    om = {x["month"]: x["value"] for x in result["outbound"]}
    for m in sorted(set(im)|set(om)):
        result["net"].append({"month": m, "value": im.get(m,0)-om.get(m,0)})

    out_path = os.path.join(REPO_DIR, "public/data/population-move.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\nSaved: {out_path}")
    for x in result["net"]:
        s = "+" if x["value"]>0 else ""
        print(f"  {x['month'][:4]}.{x['month'][4:]}: {s}{x['value']:,}")

    print("\nGit push...")
    os.chdir(REPO_DIR)
    subprocess.run(["git","pull","origin","master","--rebase"], check=True)
    subprocess.run(["git","add","public/data/population-move.json"], check=True)
    rc = subprocess.run(["git","diff","--cached","--quiet"])
    if rc.returncode != 0:
        subprocess.run(["git","commit","-m",f"인구이동 데이터 ({now.strftime('%Y-%m-%d')})"], check=True)
        subprocess.run(["git","push","origin","master"], check=True)
        print("Done!")
    else:
        print("No changes")

if __name__ == "__main__":
    main()
