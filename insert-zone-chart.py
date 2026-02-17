#!/usr/bin/env python3
"""App.js의 DashboardPage에 권역별 추이 차트 삽입"""

import os

path = os.path.expanduser("~/realestate-valley/src/App.js")
with open(path, "r") as f:
    lines = f.readlines()

# 675줄(인덱스 674) "      </div>" 뒤에 삽입
# DashboardPage return의 마지막 </div></div> 앞에 추가

CHART_CODE = '''
      {/* ── 권역별 월별 실거래가 추이 ── */}
      <ZoneTrendChart mob={mob} />
'''

# 674번 인덱스(675줄) 앞에 삽입
insert_idx = 674
lines.insert(insert_idx, CHART_CODE + "\n")

# DashboardPage 함수 앞에 ZoneTrendChart 컴포넌트 추가 (454줄 = 인덱스 453)
ZONE_COMPONENT = '''
function ZoneTrendChart({ mob }) {
  const [trendData, setTrendData] = useState(null);
  const [trendLoading, setTrendLoading] = useState(true);
  const [viewMode, setViewMode] = useState("zone"); // "zone" or "district"
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("강남구");

  const ZONE_COLORS = {
    "도심권": "#FF6B6B",
    "동북권": "#4ECDC4",
    "서북권": "#45B7D1",
    "서남권": "#FFA07A",
    "동남권": "#DDA0DD"
  };

  const ZONE_LIST = ["도심권", "동북권", "서북권", "서남권", "동남권"];
  const DISTRICT_LIST = [
    "종로구","중구","용산구","성동구","광진구","동대문구","중랑구","성북구","강북구",
    "도봉구","노원구","은평구","서대문구","마포구","양천구","강서구","구로구","금천구",
    "영등포구","동작구","관악구","서초구","강남구","송파구","강동구"
  ];

  useEffect(() => {
    fetch("./data/trade-trend.json")
      .then(r => r.json())
      .then(d => { setTrendData(d); setTrendLoading(false); })
      .catch(() => setTrendLoading(false));
  }, []);

  const chartData = useMemo(() => {
    if (!trendData) return [];
    const months = trendData.months || [];

    if (viewMode === "zone") {
      return months.map((m, idx) => {
        const point = { month: m.slice(0,4) + "." + m.slice(4) };
        const zones = selectedZone === "all" ? ZONE_LIST : [selectedZone];
        zones.forEach(z => {
          const zd = trendData.zones?.[z]?.monthly?.[idx];
          if (zd) {
            point[z + "_avg"] = Math.round(zd.avg / 10000 * 100) / 100;
            point[z + "_count"] = zd.count;
          }
        });
        // 전체 거래량
        let totalCount = 0;
        ZONE_LIST.forEach(z => {
          const zd = trendData.zones?.[z]?.monthly?.[idx];
          if (zd) totalCount += zd.count;
        });
        point.totalCount = totalCount;
        return point;
      });
    } else {
      return months.map((m, idx) => {
        const dd = trendData.districts?.[selectedDistrict]?.monthly?.[idx];
        return {
          month: m.slice(0,4) + "." + m.slice(4),
          avg: dd ? Math.round(dd.avg / 10000 * 100) / 100 : 0,
          count: dd ? dd.count : 0
        };
      });
    }
  }, [trendData, viewMode, selectedZone, selectedDistrict]);

  if (trendLoading) return <div style={{ padding: 40, textAlign: "center", color: "#8B92A5" }}>권역별 데이터 로딩 중...</div>;
  if (!trendData) return null;

  const cardS = { background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: mob ? 16 : 24 };
  const zones = selectedZone === "all" ? ZONE_LIST : [selectedZone];

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: mob ? 18 : 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={20} />권역별 실거래가 추이
        </h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={viewMode} onChange={e => setViewMode(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "#E8ECF4", fontSize: 12, cursor: "pointer", outline: "none" }}>
            <option value="zone">권역별</option>
            <option value="district">구별</option>
          </select>
          {viewMode === "zone" ? (
            <select value={selectedZone} onChange={e => setSelectedZone(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "#E8ECF4", fontSize: 12, cursor: "pointer", outline: "none" }}>
              <option value="all">전체 권역</option>
              {ZONE_LIST.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          ) : (
            <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "#E8ECF4", fontSize: 12, cursor: "pointer", outline: "none" }}>
              {DISTRICT_LIST.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexDirection: mob ? "column" : "row" }}>
        {/* 가격 추이 차트 */}
        <div style={{ ...cardS, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "#C5CAD6" }}>평균 매매가 (억원)</div>
          <ResponsiveContainer width="100%" height={mob ? 250 : 320}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8B92A5" }} interval={mob ? 3 : 1} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10, fill: "#8B92A5" }} />
              <Tooltip contentStyle={{ background: "#1a1f36", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 12 }} />
              {viewMode === "zone" ? (
                zones.map(z => (
                  <Line key={z} type="monotone" dataKey={z + "_avg"} name={z} stroke={ZONE_COLORS[z]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                ))
              ) : (
                <Line type="monotone" dataKey="avg" name={selectedDistrict} stroke="#0066FF" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 거래량 차트 */}
        <div style={{ ...cardS, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "#C5CAD6" }}>월별 거래량 (건)</div>
          <ResponsiveContainer width="100%" height={mob ? 250 : 320}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8B92A5" }} interval={mob ? 3 : 1} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10, fill: "#8B92A5" }} />
              <Tooltip contentStyle={{ background: "#1a1f36", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 12 }} />
              {viewMode === "zone" ? (
                zones.map(z => (
                  <Bar key={z} dataKey={z + "_count"} name={z} fill={ZONE_COLORS[z]} opacity={0.8} radius={[2, 2, 0, 0]} />
                ))
              ) : (
                <Bar dataKey="count" name={selectedDistrict} fill="#0066FF" opacity={0.8} radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 11, color: "#5a6480", textAlign: "right" }}>
        데이터: 국토교통부 실거래가 · {trendData.period?.start?.slice(0,4)}.{trendData.period?.start?.slice(4)}~{trendData.period?.end?.slice(0,4)}.{trendData.period?.end?.slice(4)} · 총 {Object.values(trendData.districts || {}).reduce((s, d) => s + d.monthly.reduce((ss, m) => ss + m.count, 0), 0).toLocaleString()}건 · 갱신: {trendData.updated}
      </div>
    </div>
  );
}

'''

# DashboardPage 함수 선언(455줄 = 인덱스 454) 앞에 ZoneTrendChart 삽입
dash_idx = None
for i, line in enumerate(lines):
    if line.strip().startswith("function DashboardPage()"):
        dash_idx = i
        break

if dash_idx is not None:
    lines.insert(dash_idx, ZONE_COMPONENT + "\n")
    print(f"✅ ZoneTrendChart 컴포넌트 삽입 (line {dash_idx + 1})")
else:
    print("❌ DashboardPage 못 찾음")

with open(path, "w") as f:
    f.writelines(lines)

print("✅ App.js 업데이트 완료!")
