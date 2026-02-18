import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
  Home, TrendingUp, Calculator, MapPin, ChevronRight, ArrowUpRight,
  ArrowDownRight, Building2, DollarSign, Percent, Lock, BarChart3,
  PiggyBank, FileText, Shield, Zap, ArrowRight, Eye, EyeOff,
  Sparkles, LogOut, Menu, X, RefreshCw, Loader2, Database, Wifi, WifiOff,
  Newspaper, Brain, ExternalLink, Clock, TrendingDown, Play, Search, Map
} from "lucide-react";

/* ================================================================
   CONFIG
   ================================================================ */
const INVITE_CODE = "VALLEY2025";
const STORAGE_KEY = "rv_authenticated";
const API_BASE = "https://realestate-valley.vercel.app/api/apt-trade";

/* ================================================================
   서울시 25개 구 지역코드
   ================================================================ */
const REGION_CODES = {
  "강남구":"11680","강동구":"11740","강북구":"11305","강서구":"11500",
  "관악구":"11620","광진구":"11215","구로구":"11530","금천구":"11545",
  "노원구":"11350","도봉구":"11320","동대문구":"11230","동작구":"11590",
  "마포구":"11440","서대문구":"11410","서초구":"11650","성동구":"11200",
  "성북구":"11290","송파구":"11710","양천구":"11470","영등포구":"11560",
  "용산구":"11170","은평구":"11380","종로구":"11110","중구":"11140",
  "중랑구":"11260"
};

const DISTRICTS = Object.keys(REGION_CODES);

/* ================================================================
   HOOK — useWindowSize
   ================================================================ */
function useWindowSize() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

/* ================================================================
   HOOK — useApiData (fetch real trade data)
   ================================================================ */
function useApiData(region, yearMonth) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cacheRef = useRef({});

  const fetchData = useCallback(async () => {
    const code = REGION_CODES[region];
    if (!code) return;
    const key = `${code}_${yearMonth}`;
    if (cacheRef.current[key]) { setData(cacheRef.current[key]); return; }

    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}?region=${code}&year_month=${yearMonth}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      cacheRef.current[key] = json.data;
      setData(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [region, yearMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/* ================================================================
   HOOK — useMultiMonthData (여러 달 데이터 집계)
   ================================================================ */
function useMultiMonthData(region, months) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef({});

  useEffect(() => {
    const code = REGION_CODES[region];
    if (!code) return;

    const fetchAll = async () => {
      setLoading(true);
      const results = [];
      for (const ym of months) {
        const key = `${code}_${ym}`;
        if (cacheRef.current[key]) { results.push({ ym, data: cacheRef.current[key] }); continue; }
        try {
          const res = await fetch(`${API_BASE}?region=${code}&year_month=${ym}`);
          const json = await res.json();
          const items = json.data || [];
          cacheRef.current[key] = items;
          results.push({ ym, data: items });
        } catch (_) {
          results.push({ ym, data: [] });
        }
      }
      setData(results);
      setLoading(false);
    };
    fetchAll();
  }, [region, months]);

  return { data, loading };
}

/* ================================================================
   HELPERS
   ================================================================ */
function getRecentMonths(count) {
  const months = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months.reverse();
}

function formatYM(ym) {
  return `${ym.slice(0, 4)}.${ym.slice(4)}`;
}

function priceToEok(priceStr) {
  const num = parseInt(String(priceStr).replace(/,/g, ""), 10);
  return isNaN(num) ? 0 : num / 10000;
}

const fmt = v => {
  if (v >= 1e8) return `${(v / 1e8).toFixed(1)}억원`;
  if (v >= 1e4) return `${Math.round(v / 1e4).toLocaleString()}만원`;
  return `${v.toLocaleString()}원`;
};

/* ================================================================
   COLOURS & STYLES
   ================================================================ */
const C = {
  primary: "#0066FF", secondary: "#00D68F", danger: "#FF4757",
  dark: "#0A0E1A", darkCard: "#131729", darkBorder: "#1E2338",
  darkText: "#8B92A5", darkTextLight: "#C5CAD6",
  accent1: "#7C5CFC", accent2: "#00B8D9",
  gradient1: "linear-gradient(135deg,#0066FF 0%,#7C5CFC 100%)",
};
const CC = ["#0066FF","#7C5CFC","#00D68F","#FF4757","#FFA502","#00B8D9","#FF6B9D","#C084FC"];
const ttStyle = { background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 10, color: "#fff", fontSize: 12 };

const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:'Noto Sans KR','Outfit',sans-serif;background:${C.dark};color:#E8ECF4;-webkit-font-smoothing:antialiased;overflow-x:hidden}
::selection{background:rgba(0,102,255,.3)}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2A3050;border-radius:3px}
@keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeScaleIn{from{opacity:0;transform:scale(.95) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes gradientSlide{0%{background-position:0% 50%}100%{background-position:200% 50%}}
@keyframes floatGlow{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-20px) scale(1.05)}66%{transform:translate(-20px,15px) scale(.95)}}
@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
.ani{animation:fadeInUp .7s cubic-bezier(.16,1,.3,1) forwards;opacity:0}
.d1{animation-delay:.1s}.d2{animation-delay:.2s}.d3{animation-delay:.3s}.d4{animation-delay:.4s}.d5{animation-delay:.5s}
input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:3px;background:${C.darkBorder};outline:none;cursor:pointer}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;border-radius:50%;background:${C.primary};cursor:pointer;border:3px solid ${C.dark}}
select{-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238B92A5' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px!important}
`;

/* ================================================================
   LOGIN
   ================================================================ */
function AnimatedBackground() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext("2d");
    let w = (canvas.width = window.innerWidth), h = (canvas.height = window.innerHeight);
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    const count = Math.min(60, Math.floor((w * h) / 20000));
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3,
      r: Math.random() * 2 + .5, o: Math.random() * .5 + .1, p: Math.random() * Math.PI * 2,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      pts.forEach((a, i) => {
        a.p += .01; a.x += a.vx; a.y += a.vy;
        if (a.x < 0) a.x = w; if (a.x > w) a.x = 0;
        if (a.y < 0) a.y = h; if (a.y > h) a.y = 0;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100,160,255,${a.o + Math.sin(a.p) * .15})`; ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 140) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = `rgba(80,140,255,${.06 * (1 - d / 140)})`; ctx.lineWidth = .5; ctx.stroke(); }
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

function LoginPage({ onAuth }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sk, setSk] = useState(0);
  const [mounted, setMounted] = useState(false);
  const mob = useWindowSize() < 480;
  useEffect(() => setMounted(true), []);

  const submit = useCallback(() => {
    if (!code.trim()) { setError("초대 코드를 입력해주세요"); setSk(k => k + 1); return; }
    setLoading(true); setError("");
    setTimeout(() => {
      if (code.trim().toUpperCase() === INVITE_CODE) {
        try { sessionStorage.setItem(STORAGE_KEY, "true"); } catch (_) {}
        onAuth();
      } else { setError("유효하지 않은 초대 코드입니다"); setSk(k => k + 1); setLoading(false); }
    }, 800);
  }, [code, onAuth]);

  return (
    <>
      <AnimatedBackground />
      <div style={{ position: "fixed", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", zIndex: 0, width: mob ? 300 : 500, height: mob ? 300 : 500, top: "-10%", left: "-5%", background: "radial-gradient(circle,rgba(0,102,255,.12),transparent)", animation: "floatGlow 12s ease-in-out infinite" }} />
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1, padding: mob ? 16 : 24 }}>
        <div style={{ width: "100%", maxWidth: 420, background: "rgba(19,23,41,.85)", backdropFilter: "blur(40px) saturate(180%)", border: "1px solid rgba(30,35,56,.8)", borderRadius: mob ? 20 : 24, padding: mob ? "32px 20px 28px" : "40px 36px 32px", position: "relative", overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.03) inset", animation: mounted ? "fadeScaleIn .8s cubic-bezier(.16,1,.3,1) forwards" : "none" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#0066FF,#7C5CFC,#00D68F)", backgroundSize: "200% 100%", animation: "gradientSlide 4s linear infinite" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: mob ? 24 : 32 }}>
            <div style={{ width: mob ? 42 : 48, height: mob ? 42 : 48, borderRadius: mob ? 12 : 14, background: C.gradient1, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(0,102,255,.25)", flexShrink: 0 }}>
              <Building2 size={mob ? 22 : 28} color="white" strokeWidth={2.5} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: mob ? 18 : 20 }}>부동산<span style={{ color: C.primary }}>Valley</span></span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: C.darkText, letterSpacing: ".04em", textTransform: "uppercase" }}><Shield size={10} />Private Access</span>
            </div>
          </div>
          <h1 style={{ fontSize: mob ? 20 : 24, fontWeight: 800, marginBottom: 8 }}>초대 코드 입력</h1>
          <p style={{ fontSize: 14, color: C.darkText, lineHeight: 1.5, marginBottom: mob ? 20 : 28 }}>초대받은 코드를 입력하여 접속하세요</p>
          <div key={sk} style={{ display: "flex", alignItems: "center", background: "rgba(10,14,26,.6)", border: `1.5px solid ${error ? "#FF4757" : "rgba(30,35,56,.9)"}`, borderRadius: 14, padding: "0 16px", height: 56, animation: error && sk > 0 ? "shake .5s ease" : "none" }}>
            <Lock size={18} style={{ color: C.darkText, marginRight: 12, flexShrink: 0 }} />
            <input type={show ? "text" : "password"} value={code} onChange={e => { setCode(e.target.value.toUpperCase()); if (error) setError(""); }} onKeyDown={e => e.key === "Enter" && submit()} placeholder="초대 코드를 입력하세요" autoComplete="off" spellCheck={false} disabled={loading} maxLength={20} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#E8ECF4", fontSize: 16, fontFamily: "'Outfit',sans-serif", fontWeight: 500, letterSpacing: ".08em", caretColor: C.primary, opacity: loading ? .5 : 1 }} />
            <button onClick={() => setShow(!show)} tabIndex={-1} style={{ background: "transparent", border: "none", color: "#4A5068", cursor: "pointer", padding: 4, display: "flex" }}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
          <div style={{ height: error ? 32 : 0, opacity: error ? 1 : 0, marginTop: error ? 8 : 0, overflow: "hidden", transition: "all .3s" }}>{error && <span style={{ fontSize: 13, color: "#FF4757", fontWeight: 500 }}>{error}</span>}</div>
          <button onClick={submit} disabled={loading} style={{ width: "100%", height: 52, marginTop: 20, background: "linear-gradient(135deg,#0066FF,#4D8FFF)", border: "none", borderRadius: 14, color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "'Noto Sans KR',sans-serif", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 8px 25px rgba(0,102,255,.25)", opacity: loading ? .8 : 1 }}>
            {loading ? <div style={{ width: 22, height: 22, border: "2.5px solid rgba(255,255,255,.25)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> : <>접속하기 <ArrowRight size={18} /></>}
          </button>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: mob ? 12 : 16, marginTop: mob ? 20 : 28, paddingTop: mob ? 16 : 20, borderTop: "1px solid rgba(30,35,56,.6)", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4A5068", fontWeight: 500 }}><Sparkles size={12} />초대 코드 필요</span>
            <div style={{ width: 1, height: 12, background: "rgba(30,35,56,.8)" }} />
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4A5068", fontWeight: 500 }}><Shield size={12} />비공개 서비스</span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ================================================================
   SHARED — KPICard
   ================================================================ */
function KPICard({ title, value, unit, change, icon: Icon, color, delay = 0, isLive }) {
  return (
    <div className={`ani d${delay}`} style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 20, position: "relative", overflow: "hidden" }}>
      {isLive && <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: C.secondary, animation: "pulse 2s infinite" }} /><span style={{ fontSize: 10, color: C.secondary, fontWeight: 600 }}>LIVE</span></div>}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color || C.primary}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={16} color={color || C.primary} />
        </div>
        <span style={{ fontSize: 12, color: C.darkText, fontWeight: 500 }}>{title}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Outfit',sans-serif", marginBottom: 4 }}>
        {value}<span style={{ fontSize: 13, fontWeight: 400, color: C.darkText, marginLeft: 4 }}>{unit}</span>
      </div>
      {change !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: change >= 0 ? C.danger : C.secondary }}>
          {change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {change >= 0 ? "+" : ""}{change}%
          <span style={{ color: C.darkText, fontWeight: 400, marginLeft: 4 }}>전월 대비</span>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   Loading indicator
   ================================================================ */
function LoadingBar({ text = "실거래 데이터 불러오는 중..." }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 20px", color: C.darkText }}>
      <div style={{ width: 20, height: 20, border: `2px solid ${C.darkBorder}`, borderTopColor: C.primary, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <span style={{ fontSize: 14, fontWeight: 500 }}>{text}</span>
    </div>
  );
}

/* ================================================================
   NAV
   ================================================================ */
function Nav({ currentPage, setCurrentPage, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const mob = useWindowSize() < 768;

  useEffect(() => { const h = () => setScrolled(window.scrollY > 20); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);
  useEffect(() => setMenuOpen(false), [currentPage]);
  useEffect(() => { document.body.style.overflow = menuOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [menuOpen]);

  const items = [
    { id: "home", label: "홈", icon: Home },
    { id: "dashboard", label: "실거래가", icon: BarChart3 },
    { id: "calculator", label: "계산기", icon: Calculator },
    { id: "analysis", label: "지역분석", icon: MapPin },
    { id: "redevelop", label: "재개발지도", icon: Map },
    { id: "listings", label: "매물검색", icon: Search },
    { id: "news", label: "뉴스", icon: Newspaper },
    { id: "prediction", label: "시세예측", icon: Brain },
  ];

  return (
    <>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, background: scrolled || menuOpen ? "rgba(10,14,26,.95)" : "transparent", backdropFilter: scrolled || menuOpen ? "blur(20px) saturate(180%)" : "none", borderBottom: scrolled ? "1px solid rgba(30,35,56,.6)" : "1px solid transparent", transition: "all .4s", padding: "0 20px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setCurrentPage("home")}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.gradient1, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 15px rgba(0,102,255,.3)" }}><Building2 size={17} color="white" /></div>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 18 }}>부동산<span style={{ color: C.primary }}>Valley</span></span>
          </div>
          {mob ? (
            <button onClick={() => setMenuOpen(v => !v)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", padding: 8, display: "flex", zIndex: 1001 }}>{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
          ) : (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {items.map(it => { const Ic = it.icon, a = currentPage === it.id; return (
                <button key={it.id} onClick={() => setCurrentPage(it.id)} style={{ background: a ? "rgba(0,102,255,.12)" : "transparent", border: "none", color: a ? C.primary : C.darkTextLight, padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Noto Sans KR',sans-serif" }}><Ic size={16} />{it.label}</button>
              ); })}
              <button onClick={onLogout} style={{ background: "transparent", border: "1px solid transparent", color: C.darkText, padding: "8px 12px", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 500, marginLeft: 8, fontFamily: "'Noto Sans KR',sans-serif" }}><LogOut size={15} />나가기</button>
            </div>
          )}
        </div>
      </nav>
      {mob && menuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(10,14,26,.98)", backdropFilter: "blur(20px)", paddingTop: 80, animation: "fadeIn .2s ease" }}>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((it, i) => { const Ic = it.icon, a = currentPage === it.id; return (
              <button key={it.id} onClick={() => setCurrentPage(it.id)} style={{ background: a ? "rgba(0,102,255,.12)" : "rgba(255,255,255,.03)", border: `1px solid ${a ? C.primary + "30" : "transparent"}`, color: a ? C.primary : "#fff", padding: "16px 20px", borderRadius: 14, cursor: "pointer", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 12, fontFamily: "'Noto Sans KR',sans-serif", width: "100%", textAlign: "left", animation: `slideDown .3s ease ${i * .05}s both` }}><Ic size={20} />{it.label}</button>
            ); })}
            <div style={{ borderTop: `1px solid ${C.darkBorder}`, marginTop: 12, paddingTop: 16 }}>
              <button onClick={onLogout} style={{ background: "rgba(255,71,87,.08)", border: "1px solid rgba(255,71,87,.2)", color: "#FF4757", padding: "16px 20px", borderRadius: 14, cursor: "pointer", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 12, fontFamily: "'Noto Sans KR',sans-serif", width: "100%", animation: "slideDown .3s ease .2s both" }}><LogOut size={20} />로그아웃</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ================================================================
   LANDING PAGE
   ================================================================ */
function LandingPage({ setCurrentPage }) {
  const mob = useWindowSize() < 768;
  const features = [
    { icon: BarChart3, title: "실거래가 대시보드", desc: "서울 25개 구의 실시간 실거래가 데이터를 분석합니다", color: C.primary },
    { icon: Calculator, title: "투자 계산기", desc: "대출 상환, 취득세, 수익률을 한번에 계산하세요", color: C.accent1 },
    { icon: MapPin, title: "지역 분석", desc: "지역별 가격 추이, 거래량 비교 분석을 제공합니다", color: C.secondary },
    { icon: Database, title: "공공데이터 연동", desc: "국토교통부 실거래가 API 기반 실제 데이터를 제공합니다", color: C.accent2 },
  ];
  const stats = [
    { label: "서울 전체", value: "25", unit: "개 구" },
    { label: "데이터 출처", value: "국토부", unit: "API" },
    { label: "분석 도구", value: "10", unit: "가지+" },
    { label: "데이터", value: "실시간", unit: "" },
  ];
  return (
    <div>
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: mob ? "100px 20px 60px" : "120px 24px 80px" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% -20%,rgba(0,102,255,.15),transparent)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        <div style={{ maxWidth: 800, textAlign: "center", position: "relative", zIndex: 1 }}>
          <div className="ani" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,214,143,.08)", border: "1px solid rgba(0,214,143,.2)", borderRadius: 24, padding: mob ? "6px 14px" : "8px 20px", marginBottom: mob ? 20 : 32, fontSize: mob ? 12 : 14, fontWeight: 500, color: C.secondary }}><Wifi size={14} />국토교통부 실거래가 API 연동</div>
          <h1 className="ani d1" style={{ fontSize: mob ? 32 : "clamp(36px,6vw,64px)", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-.04em", marginBottom: 20, background: "linear-gradient(135deg,#FFF,#C5CAD6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            실거래 데이터 기반<br /><span style={{ background: C.gradient1, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>부동산 투자</span>
          </h1>
          <p className="ani d2" style={{ fontSize: mob ? 15 : 18, color: C.darkText, lineHeight: 1.7, marginBottom: 32, maxWidth: 560, margin: "0 auto 32px", padding: mob ? "0 12px" : 0 }}>국토교통부 공공데이터 API 기반<br />서울시 아파트 실거래가 분석 플랫폼</p>
          <div className="ani d3" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", padding: mob ? "0 12px" : 0 }}>
            <button onClick={() => setCurrentPage("dashboard")} style={{ background: C.gradient1, border: "none", color: "#fff", padding: mob ? "12px 24px" : "14px 32px", borderRadius: 12, fontSize: mob ? 15 : 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 30px rgba(0,102,255,.3)", fontFamily: "'Noto Sans KR',sans-serif", flex: mob ? 1 : "none", justifyContent: "center" }}>실거래가 보기 <ChevronRight size={18} /></button>
            <button onClick={() => setCurrentPage("calculator")} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#fff", padding: mob ? "12px 24px" : "14px 32px", borderRadius: 12, fontSize: mob ? 15 : 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Noto Sans KR',sans-serif", flex: mob ? 1 : "none", justifyContent: "center" }}><Calculator size={18} />계산기</button>
          </div>
        </div>
      </section>
      <section style={{ padding: mob ? "0 16px 60px" : "0 24px 80px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4,1fr)", gap: mob ? 12 : 20 }}>
          {stats.map((s, i) => (
            <div key={i} className={`ani d${i + 1}`} style={{ textAlign: "center", padding: mob ? "20px 12px" : "32px 20px", background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16 }}>
              <div style={{ fontSize: mob ? 28 : 36, fontWeight: 800, fontFamily: "'Outfit',sans-serif" }}>{s.value}<span style={{ fontSize: mob ? 12 : 16, color: C.darkText }}>{s.unit}</span></div>
              <div style={{ fontSize: mob ? 12 : 14, color: C.darkText, marginTop: 6, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>
      <section style={{ padding: mob ? "40px 16px" : "80px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <div style={{ marginBottom: mob ? 28 : 40, textAlign: "center" }}>
            <h2 style={{ fontSize: mob ? 24 : 32, fontWeight: 800, marginBottom: 12 }}>부동산 투자에 필요한 모든 도구</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fit,minmax(240px,1fr))", gap: mob ? 12 : 20 }}>
            {features.map((f, i) => { const Ic = f.icon; return (
              <div key={i} className={`ani d${i + 1}`} style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 20, padding: mob ? 24 : 32 }}>
                <div style={{ width: mob ? 44 : 52, height: mob ? 44 : 52, borderRadius: 14, marginBottom: 16, background: `${f.color}12`, border: `1px solid ${f.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}><Ic size={mob ? 20 : 24} color={f.color} /></div>
                <h3 style={{ fontSize: mob ? 16 : 18, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: mob ? 13 : 14, color: C.darkText, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ); })}
          </div>
        </div>
      </section>
      <section style={{ padding: mob ? "40px 16px 80px" : "80px 24px 120px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", background: "linear-gradient(135deg,rgba(0,102,255,.1),rgba(124,92,252,.1))", border: "1px solid rgba(0,102,255,.2)", borderRadius: mob ? 20 : 24, padding: mob ? "40px 24px" : "60px 40px" }}>
          <h2 style={{ fontSize: mob ? 22 : 28, fontWeight: 800, marginBottom: 12 }}>지금 바로 시작하세요</h2>
          <p style={{ fontSize: mob ? 14 : 16, color: C.darkText, marginBottom: 28, lineHeight: 1.7 }}>서울 부동산 시장의 실제 데이터를<br />한눈에 분석하세요</p>
          <button onClick={() => setCurrentPage("dashboard")} style={{ background: C.gradient1, border: "none", color: "#fff", padding: mob ? "12px 28px" : "14px 36px", borderRadius: 12, fontSize: mob ? 15 : 16, fontWeight: 600, cursor: "pointer", boxShadow: "0 8px 30px rgba(0,102,255,.3)", fontFamily: "'Noto Sans KR',sans-serif" }}>대시보드 바로가기 <ChevronRight size={18} style={{ verticalAlign: "middle", marginLeft: 4 }} /></button>
        </div>
      </section>
    </div>
  );
}

/* ================================================================
   DASHBOARD — Real API data
   ================================================================ */






function RentTrendChart({ mob }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("zone");
  const [selectedZone, setSelectedZone] = useState("동남권");
  const [selectedDist, setSelectedDist] = useState("강남구");

  const ZONES = {
    "도심권": ["종로구","중구","용산구"],
    "동북권": ["성동구","광진구","동대문구","중랑구","성북구","강북구","도봉구","노원구"],
    "서북권": ["은평구","서대문구","마포구"],
    "서남권": ["양천구","강서구","구로구","금천구","영등포구","동작구","관악구"],
    "동남권": ["서초구","강남구","송파구","강동구"],
  };
  const ZONE_COLORS = { "도심권": "#FF6B6B", "동북권": "#4ECDC4", "서북권": "#45B7D1", "서남권": "#FFA07A", "동남권": "#DDA0DD" };

  useEffect(() => {
    fetch("./data/rent-trend.json")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const chartData = useMemo(() => {
    if (!data || !data.districts) return [];
    const months = data.months || [];
    if (viewMode === "zone") {
      return months.map((m, i) => {
        const row = { month: m.slice(0,4) + "." + m.slice(4) };
        Object.entries(ZONES).forEach(([zone, dists]) => {
          let total = 0, cnt = 0;
          dists.forEach(d => {
            const dd = data.districts[d];
            if (dd && dd[i] && dd[i].jeonse_avg > 0) { total += dd[i].jeonse_avg; cnt++; }
          });
          row[zone] = cnt > 0 ? Math.round(total / cnt) : 0;
        });
        return row;
      });
    } else {
      const dists = ZONES[selectedZone] || [];
      return months.map((m, i) => {
        const row = { month: m.slice(0,4) + "." + m.slice(4) };
        dists.forEach(d => {
          const dd = data.districts[d];
          row[d] = dd && dd[i] ? dd[i].jeonse_avg : 0;
        });
        return row;
      });
    }
  }, [data, viewMode, selectedZone]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#8B92A5" }}>전월세 데이터 로딩 중...</div>;
  if (!data) return null;

  const cardS = { background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: mob ? 16 : 24 };
  const btnS = (active) => ({ padding: "6px 14px", borderRadius: 8, border: "1px solid " + (active ? "#0066FF" : "rgba(255,255,255,.1)"), background: active ? "rgba(0,102,255,.15)" : "transparent", color: active ? "#4A90D9" : "#8B92A5", fontSize: 12, cursor: "pointer" });

  const lines = viewMode === "zone"
    ? Object.keys(ZONES)
    : (ZONES[selectedZone] || []);
  const colors = viewMode === "zone"
    ? ZONE_COLORS
    : Object.fromEntries((ZONES[selectedZone] || []).map((d, i) => [d, ["#FF6B6B","#4ECDC4","#45B7D1","#FFA07A","#DDA0DD","#98D8C8","#F7DC6F","#BB8FCE"][i % 8]]));

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: mob ? 18 : 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={20} />전세 평균가 추이
        </h2>
        <p style={{ fontSize: 12, color: "#5a6480", marginTop: 4 }}>아파트 전세 실거래 평균 보증금 (만원)</p>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => setViewMode("zone")} style={btnS(viewMode === "zone")}>권역별</button>
        <button onClick={() => setViewMode("district")} style={btnS(viewMode === "district")}>구별</button>
        {viewMode === "district" && Object.keys(ZONES).map(z => (
          <button key={z} onClick={() => { setSelectedZone(z); }} style={btnS(selectedZone === z)}>{z}</button>
        ))}
      </div>
      <div style={cardS}>
        <ResponsiveContainer width="100%" height={mob ? 280 : 340}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8B92A5" }} interval={mob ? 3 : 1} angle={-30} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 10, fill: "#8B92A5" }} tickFormatter={v => (v/10000).toFixed(1) + "억"} />
            <Tooltip contentStyle={{ background: "#1a1f36", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 12 }}
              formatter={(val) => (val/10000).toFixed(2) + "억"} />
            {lines.map(key => (
              <Line key={key} type="monotone" dataKey={key} stroke={colors[key] || "#ccc"} strokeWidth={2} dot={{ r: 2 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 10, fontSize: 11, color: "#5a6480", textAlign: "right" }}>
          출처: 국토교통부 전월세 실거래가 · 갱신: {data.updated}
        </div>
      </div>
    </div>
  );
}



function HousingSupplyChart({ mob }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const COLORS = { "전국": "#8B92A5", "수도권": "#4ECDC4", "서울": "#0066FF" };

  useEffect(() => {
    fetch("./data/housing-supply.json")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [];
    const seoul = data["서울"] || [];
    const sudo = data["수도권"] || [];
    const all = data["전국"] || [];
    return seoul.map((s, i) => ({
      month: s.month.slice(0,4) + "." + s.month.slice(4),
      서울: s.value,
      수도권: sudo[i] ? sudo[i].value : 0,
      전국: all[i] ? all[i].value : 0,
    }));
  }, [data]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#8B92A5" }}>인허가 데이터 로딩 중...</div>;
  if (!data) return null;

  const cardS = { background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: mob ? 16 : 24 };

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: mob ? 18 : 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={20} />주택 인허가 실적
        </h2>
        <p style={{ fontSize: 12, color: "#5a6480", marginTop: 4 }}>월별 주택건설 인허가 호수 (향후 2~3년 공급 선행지표)</p>
      </div>
      <div style={cardS}>
        <ResponsiveContainer width="100%" height={mob ? 260 : 320}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8B92A5" }} interval={mob ? 3 : 1} angle={-30} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 10, fill: "#8B92A5" }} tickFormatter={v => (v/1000).toFixed(0) + "k"} />
            <Tooltip contentStyle={{ background: "#1a1f36", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 12 }}
              formatter={(val) => val.toLocaleString() + "호"} />
            <Bar dataKey="전국" fill="#8B92A5" radius={[2,2,0,0]} opacity={0.4} />
            <Bar dataKey="수도권" fill="#4ECDC4" radius={[2,2,0,0]} opacity={0.6} />
            <Bar dataKey="서울" fill="#0066FF" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 10, fontSize: 11, color: "#5a6480", textAlign: "right" }}>
          출처: 국토교통부 주택건설실적통계 (KOSIS) · 갱신: {data.updated}
        </div>
      </div>
    </div>
  );
}


function PopulationMoveDistrictChart({ mob }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [mode, setMode] = useState('순이동'); // 순이동 | 총전입 | 총전출

  useEffect(() => {
    fetch('/data/population-move-district.json')
      .then(r => r.json())
      .then(json => {
        setData(json.data);
        // 가장 최근 월 자동 선택
        const first = Object.values(json.data)[0];
        const months = Object.keys(first).sort();
        setSelectedMonth(months[months.length - 1]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const GU_COORDS = {
    '종로구':[37.5735,126.9790],'중구':[37.5641,126.9979],'용산구':[37.5326,126.9906],
    '성동구':[37.5634,127.0370],'광진구':[37.5385,127.0823],'동대문구':[37.5744,127.0396],
    '중랑구':[37.6066,127.0927],'성북구':[37.5894,127.0167],'강북구':[37.6397,127.0255],
    '도봉구':[37.6688,127.0472],'노원구':[37.6542,127.0568],'은평구':[37.6027,126.9292],
    '서대문구':[37.5791,126.9368],'마포구':[37.5664,126.9014],'양천구':[37.5170,126.8664],
    '강서구':[37.5510,126.8495],'구로구':[37.4955,126.8876],'금천구':[37.4568,126.8956],
    '영등포구':[37.5264,126.8963],'동작구':[37.5124,126.9393],'관악구':[37.4784,126.9516],
    '서초구':[37.4837,127.0324],'강남구':[37.5173,127.0473],'송파구':[37.5146,127.1060],
    '강동구':[37.5301,127.1238],
  };

  const cardS = { background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: mob ? 16 : 24 };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#8B92A5" }}>구별 인구이동 로딩 중...</div>;
  if (!data) return null;

  // 선택 월 데이터 계산
  const guValues = Object.entries(data).map(([name, months]) => {
    const m = months[selectedMonth] || {};
    return { name, value: m[mode] || 0 };
  });

  const vals = guValues.map(g => g.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);

  const getColor = (v) => {
    if (maxV === minV) return 'rgba(100,150,255,0.6)';
    const ratio = (v - minV) / (maxV - minV);
    if (mode === '순이동') {
      // 음수(전출>전입)=빨강, 양수(전입>전출)=파랑
      if (v < 0) {
        const r = Math.abs(v) / Math.abs(minV);
        return `rgba(255,${Math.round(100*(1-r))},${Math.round(80*(1-r))},${0.4+r*0.5})`;
      } else {
        return `rgba(${Math.round(100*(1-ratio))},${Math.round(150+ratio*50)},255,${0.4+ratio*0.5})`;
      }
    }
    return `rgba(${Math.round(255*(1-ratio))},${Math.round(100+ratio*100)},255,${0.4+ratio*0.5})`;
  };

  const months = data['강남구'] ? Object.keys(data['강남구']).sort() : [];
  const fmtMonth = (ym) => ym ? ym.slice(0,4)+'년 '+parseInt(ym.slice(4))+'월' : '';

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ marginBottom: 16, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <div>
          <h2 style={{ fontSize: mob ? 18 : 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            🗺️ 서울 구별 인구이동 히트맵
          </h2>
          <p style={{ fontSize: 12, color: "#5a6480", marginTop: 4 }}>구별 전입·전출·순이동 현황 (KOSIS)</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {['순이동','총전입','총전출'].map(m => (
            <button key={m} onClick={()=>setMode(m)}
              style={{ padding:'4px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12,
                background: mode===m ? '#0066FF' : 'rgba(255,255,255,.08)',
                color: mode===m ? '#fff' : '#8B92A5' }}>
              {m}
            </button>
          ))}
          <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}
            style={{ padding:'4px 8px', borderRadius:8, border:'1px solid rgba(255,255,255,.1)',
              background:'rgba(255,255,255,.05)', color:'#ccc', fontSize:12 }}>
            {months.map(ym => <option key={ym} value={ym}>{fmtMonth(ym)}</option>)}
          </select>
        </div>
      </div>
      <div style={cardS}>
        {/* 버블 맵 */}
        <div style={{ position:'relative', width:'100%', paddingBottom: mob?'80%':'60%', background:'rgba(0,40,80,0.3)', borderRadius:12, overflow:'hidden' }}>
          <svg viewBox="126.82 37.28 0.34 0.32" style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}
            preserveAspectRatio="xMidYMid meet">
            {guValues.map(({ name, value }) => {
              const coords = GU_COORDS[name];
              if (!coords) return null;
              const [lat, lng] = coords;
              const size = Math.abs(value) / Math.max(Math.abs(minV), Math.abs(maxV)) * (mob ? 0.032 : 0.026) + 0.006;
              return (
                <g key={name}>
                  <circle cx={lng} cy={-lat+75} r={size} fill={getColor(value)} stroke="rgba(255,255,255,0.2)" strokeWidth="0.001" />
                  <text x={lng} y={-lat+75+0.003} textAnchor="middle" fontSize={mob?"0.006":"0.005"} fill="rgba(255,255,255,0.85)">
                    {name.replace(/구$/,'')}
                  </text>
                  <text x={lng} y={-lat+75+0.008} textAnchor="middle" fontSize={mob?"0.005":"0.004"} fill="rgba(255,255,255,0.6)">
                    {value > 0 ? '+' : ''}{value.toLocaleString()}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        {/* 순위 TOP5 / BOTTOM5 */}
        <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <div style={{ fontSize:11, color:'#4ECDC4', marginBottom:6 }}>▲ TOP 5 (유입)</div>
            {[...guValues].sort((a,b)=>b.value-a.value).slice(0,5).map((g,i)=>(
              <div key={g.name} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#ccc', marginBottom:3 }}>
                <span>{i+1}. {g.name}</span>
                <span style={{color:'#4ECDC4'}}>{g.value > 0 ? '+' : ''}{g.value.toLocaleString()}명</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:11, color:'#FF6B6B', marginBottom:6 }}>▼ BOTTOM 5 (유출)</div>
            {[...guValues].sort((a,b)=>a.value-b.value).slice(0,5).map((g,i)=>(
              <div key={g.name} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#ccc', marginBottom:3 }}>
                <span>{i+1}. {g.name}</span>
                <span style={{color:'#FF6B6B'}}>{g.value.toLocaleString()}명</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PopulationMoveChart({ mob }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("./data/population-move.json")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [];
    const inMap = {};
    const outMap = {};
    const netMap = {};
    (data.inbound || []).forEach(x => { inMap[x.month] = x.value; });
    (data.outbound || []).forEach(x => { outMap[x.month] = x.value; });
    (data.net || []).forEach(x => { netMap[x.month] = x.value; });
    const months = [...new Set([...Object.keys(inMap), ...Object.keys(outMap)])].sort();
    return months.map(m => ({
      month: m.slice(0,4) + "." + m.slice(4),
      전입: inMap[m] || 0,
      전출: -(outMap[m] || 0),
      순이동: netMap[m] || 0,
    }));
  }, [data]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#8B92A5" }}>인구이동 로딩 중...</div>;
  if (!data) return null;

  const cardS = { background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: mob ? 16 : 24 };

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: mob ? 18 : 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={20} />서울 인구이동 추이
        </h2>
        <p style={{ fontSize: 12, color: "#5a6480", marginTop: 4 }}>전입(파란색) vs 전출(빨간색), 순이동(초록선)</p>
      </div>
      <div style={cardS}>
        <ResponsiveContainer width="100%" height={mob ? 280 : 340}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }} stackOffset="sign">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8B92A5" }} interval={mob ? 3 : 1} angle={-30} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 10, fill: "#8B92A5" }} tickFormatter={v => (v/1000).toFixed(0) + "k"} />
            <Tooltip contentStyle={{ background: "#1a1f36", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 12 }}
              formatter={(val) => Math.abs(val).toLocaleString() + "명"} />
            <Bar dataKey="전입" fill="#4A90D9" stackId="stack" radius={[2,2,0,0]} />
            <Bar dataKey="전출" fill="#E57373" stackId="stack" radius={[0,0,2,2]} />
            <Line type="monotone" dataKey="순이동" stroke="#66BB6A" strokeWidth={2} dot={{ r: 3, fill: "#66BB6A" }} yAxisId={0} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: "#5a6480" }}>
          <span>※ 2월 이사철에만 순유입, 나머지 순유출 추세</span>
          <span>출처: 통계청 KOSIS · 갱신: {data.updated}</span>
        </div>
      </div>
    </div>
  );
}

function InterestRateChart({ mob }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("./data/interest-rate.json")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [];
    const mortgage = data["주택담보대출"] || [];
    const household = data["가계대출"] || [];
    const base = data["기준금리"] || [];
    const baseMap = {};
    base.forEach(b => { baseMap[b.month] = b.value; });

    return mortgage.map((m, idx) => {
      let baseVal = baseMap[m.month];
      if (!baseVal) {
        const sorted = Object.keys(baseMap).sort();
        for (const k of sorted) {
          if (k <= m.month) baseVal = baseMap[k];
        }
      }
      return {
        month: m.month.slice(0, 4) + "." + m.month.slice(4),
        주택담보대출: m.value,
        가계대출: household[idx] ? household[idx].value : null,
        기준금리: baseVal || null
      };
    });
  }, [data]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#8B92A5" }}>금리 데이터 로딩 중...</div>;
  if (!data) return null;

  const cardS = { background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: mob ? 16 : 24 };

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: mob ? 18 : 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={20} />금리 추이
        </h2>
      </div>
      <div style={cardS}>
        <ResponsiveContainer width="100%" height={mob ? 260 : 320}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8B92A5" }} interval={mob ? 3 : 1} angle={-30} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 10, fill: "#8B92A5" }} domain={["auto", "auto"]} unit="%" />
            <Tooltip contentStyle={{ background: "#1a1f36", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 12 }}
              formatter={(val) => val ? val.toFixed(2) + "%" : "-"} />
            <Line type="stepAfter" dataKey="기준금리" name="한은 기준금리" stroke="#FF6B6B" strokeWidth={3} dot={false} connectNulls strokeDasharray="8 4" />
            <Line type="monotone" dataKey="주택담보대출" name="주택담보대출" stroke="#0066FF" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} connectNulls />
            <Line type="monotone" dataKey="가계대출" name="가계대출" stroke="#4ECDC4" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 10, fontSize: 11, color: "#5a6480", textAlign: "right" }}>
          출처: 한국은행 ECOS · 신규취급액 기준 연리(%) · 갱신: {data.updated}
        </div>
      </div>
    </div>
  );
}

function PriceIndexChart({ mob }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState("매매지수");
  const [selectedRegions, setSelectedRegions] = useState(["서울", "동남권", "도심권"]);

  const REGION_COLORS = {
    "서울": "#0066FF",
    "도심권": "#FF6B6B",
    "동북권": "#4ECDC4",
    "서북권": "#45B7D1",
    "서남권": "#FFA07A",
    "동남권": "#DDA0DD"
  };

  const ALL_REGIONS = ["서울", "도심권", "동북권", "서북권", "서남권", "동남권"];

  useEffect(() => {
    fetch("./data/price-index.json")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggleRegion = (region) => {
    setSelectedRegions(prev =>
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };

  const chartData = useMemo(() => {
    if (!data) return [];
    const months = data.months || [];
    const typeData = data[chartType] || {};
    return months.map((m, idx) => {
      const point = { month: m.slice(0, 4) + "." + m.slice(4) };
      ALL_REGIONS.forEach(region => {
        const arr = typeData[region];
        if (arr && arr[idx]) {
          point[region] = arr[idx].value;
        }
      });
      return point;
    });
  }, [data, chartType]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#8B92A5" }}>가격지수 로딩 중...</div>;
  if (!data) return null;

  const cardS = { background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, padding: mob ? 16 : 24 };

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: mob ? 18 : 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={20} />아파트 가격지수 추이
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          {["매매지수", "전세지수"].map(t => (
            <button key={t} onClick={() => setChartType(t)}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
                background: chartType === t ? "#0066FF" : "rgba(255,255,255,.06)",
                color: chartType === t ? "#fff" : "#8B92A5"
              }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {ALL_REGIONS.map(r => (
          <button key={r} onClick={() => toggleRegion(r)}
            style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
              border: selectedRegions.includes(r) ? "none" : "1px solid rgba(255,255,255,.1)",
              background: selectedRegions.includes(r) ? REGION_COLORS[r] + "22" : "transparent",
              color: selectedRegions.includes(r) ? REGION_COLORS[r] : "#5a6480"
            }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: REGION_COLORS[r], marginRight: 6 }} />
            {r}
          </button>
        ))}
      </div>

      <div style={cardS}>
        <ResponsiveContainer width="100%" height={mob ? 280 : 360}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8B92A5" }} interval={mob ? 3 : 1} angle={-30} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 10, fill: "#8B92A5" }} domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ background: "#1a1f36", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 12 }}
              formatter={(val) => val ? val.toFixed(2) : "-"} />
            {selectedRegions.map(r => (
              <Line key={r} type="monotone" dataKey={r} name={r}
                stroke={REGION_COLORS[r]} strokeWidth={r === "서울" ? 3 : 2}
                dot={{ r: 2 }} activeDot={{ r: 5 }}
                strokeDasharray={r === "서울" ? "" : ""} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div style={{ marginTop: 10, fontSize: 11, color: "#5a6480", textAlign: "right" }}>
          출처: 한국부동산원 R-ONE · 기준시점 100.0 · 갱신: {data.updated}
        </div>
      </div>
    </div>
  );
}

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


function DashboardPage() {
  const mob = useWindowSize() < 768;
  const [sel, setSel] = useState("강남구");

  const FALLBACK_CHANNELS = [
    { channel: "부읽남TV", subs: "123만", color: "#3b82f6", avatar: "부", link: "https://www.youtube.com/@부읽남TV", videos: [
      { date: "2026.02", title: "10·15 대책 이후 3개월, 서울 부동산 실제 변화", summary: "투기과열지구 지정 후 거래량 감소했으나 핵심 입지 실거래가는 소폭 상승.", tag: "정책분석", link: "https://www.youtube.com/@부읽남TV" },
      { date: "2026.01", title: "2026 부동산 시장 흐름과 정책 방향", summary: "주산연 보고서 기반 분석. 서울·수도권 매매가 상승 전망.", tag: "시장전망", link: "https://www.youtube.com/@부읽남TV" },
    ]},
    { channel: "월급쟁이부자들TV", subs: "149만", color: "#10b981", avatar: "월", link: "https://www.youtube.com/@월급쟁이부자들TV", videos: [
      { date: "2026.02", title: "구리시 잠실 20분 생활권, 저평가 아파트 분석", summary: "구리시 핵심 입지 분석. 8호선 연장 수혜지역.", tag: "지역분석", link: "https://www.youtube.com/@월급쟁이부자들TV" },
      { date: "2026.01", title: "2026 부동산 투자, 무주택자가 반드시 알아야 할 것", summary: "금리 인하 기대와 실제 대출 환경 괴리 설명.", tag: "투자전략", link: "https://www.youtube.com/@월급쟁이부자들TV" },
    ]},
  ];
  const [ytChannels, setYtChannels] = useState(FALLBACK_CHANNELS);
  const [ytUpdated, setYtUpdated] = useState("수동 입력");
  useEffect(() => {
    fetch(`${API_BASE.replace('/apt-trade', '/youtube-insights')}`)
      .then(r => r.json())
      .then(d => {
        if (d.channels && d.channels.length > 0 && d.channels.some(c => c.videos && c.videos.length > 0)) {
          setYtChannels(d.channels);
          setYtUpdated(d.updated_at || "자동 수집");
        }
      })
      .catch(() => {});
  }, []);

  const now = new Date();
  const curYM = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevYM = (() => { const d = new Date(now.getFullYear(), now.getMonth() - 1, 1); return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`; })();

  const months = useMemo(() => getRecentMonths(6), []);
  const { data: multiData, loading: multiLoading } = useMultiMonthData(sel, months);
  const { data: curData, loading: curLoading, error: curError } = useApiData(sel, prevYM);

  // 월별 집계
  const trendData = useMemo(() => {
    if (!multiData.length) return [];
    return multiData.map(({ ym, data }) => {
      if (!data.length) return { date: formatYM(ym), avgPrice: 0, volume: 0 };
      const prices = data.map(d => priceToEok(d.price)).filter(p => p > 0);
      const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
      return { date: formatYM(ym), avgPrice: Math.round(avg * 100) / 100, volume: data.length };
    });
  }, [multiData]);

  // 현재 월 KPI
  const kpi = useMemo(() => {
    if (!curData || !curData.length) return { avgPrice: 0, volume: 0, avgArea: 0 };
    const prices = curData.map(d => priceToEok(d.price)).filter(p => p > 0);
    const areas = curData.map(d => parseFloat(d.area)).filter(a => !isNaN(a) && a > 0);
    return {
      avgPrice: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100 : 0,
      volume: curData.length,
      avgArea: areas.length ? Math.round(areas.reduce((a, b) => a + b, 0) / areas.length) : 0,
    };
  }, [curData]);

  // 최근 거래 TOP
  const topTrades = useMemo(() => {
    if (!curData) return [];
    return [...curData]
      .sort((a, b) => parseInt(String(b.price).replace(/,/g, "")) - parseInt(String(a.price).replace(/,/g, "")))
      .slice(0, 20);
  }, [curData]);

  return (
    <div style={{ paddingTop: 70, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: mob ? "24px 16px" : "40px 24px" }}>
        <div className="ani" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: mob ? 22 : 28, fontWeight: 800, marginBottom: 6 }}>실거래가 대시보드</h1>
              <p style={{ color: C.darkText, fontSize: mob ? 13 : 15, display: "flex", alignItems: "center", gap: 6 }}>
                <Database size={14} />국토교통부 실거래가 API · {formatYM(prevYM)} 데이터
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,214,143,.08)", border: "1px solid rgba(0,214,143,.2)", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: C.secondary }}>
              <Wifi size={12} />실시간 연동
            </div>
          </div>
        </div>

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4,1fr)", gap: mob ? 10 : 16, marginBottom: 24 }}>
          <KPICard title="평균 매매가" value={kpi.avgPrice.toFixed(1)} unit="억원" icon={DollarSign} color={C.primary} delay={1} isLive />
          <KPICard title="거래량" value={kpi.volume.toLocaleString()} unit="건" icon={BarChart3} color={C.accent1} delay={2} isLive />
          <KPICard title="평균 면적" value={kpi.avgArea} unit="㎡" icon={Home} color={C.secondary} delay={3} />
          <KPICard title="조회 기간" value={formatYM(prevYM)} unit="" icon={Database} color={C.accent2} delay={4} />
        </div>

        {/* District selector */}
        <div className="ani d2" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <select value={sel} onChange={e => setSel(e.target.value)} style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, color: "#fff", padding: "10px 16px", borderRadius: 10, fontSize: 14, fontFamily: "'Noto Sans KR',sans-serif", cursor: "pointer", outline: "none", flex: mob ? 1 : "none" }}>
            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Charts */}
        {multiLoading ? <LoadingBar /> : (
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 12 : 20, marginBottom: 24 }}>
            <div className="ani d3" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? "20px 8px" : 24 }}>
              <h3 style={{ fontSize: mob ? 14 : 16, fontWeight: 700, marginBottom: 16, paddingLeft: mob ? 8 : 0 }}>{sel} 평균 매매가 추이 (최근 6개월)</h3>
              <ResponsiveContainer width="100%" height={mob ? 220 : 280}>
                <AreaChart data={trendData}>
                  <defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={.25} /><stop offset="95%" stopColor={C.primary} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                  <XAxis dataKey="date" tick={{ fill: C.darkText, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.darkText, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}억`} width={40} />
                  <Tooltip contentStyle={ttStyle} formatter={v => [`${v}억원`, "평균 매매가"]} />
                  <Area type="monotone" dataKey="avgPrice" stroke={C.primary} strokeWidth={2} fill="url(#dg)" dot={{ fill: C.primary, r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="ani d4" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? "20px 8px" : 24 }}>
              <h3 style={{ fontSize: mob ? 14 : 16, fontWeight: 700, marginBottom: 16, paddingLeft: mob ? 8 : 0 }}>월별 거래량</h3>
              <ResponsiveContainer width="100%" height={mob ? 220 : 280}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                  <XAxis dataKey="date" tick={{ fill: C.darkText, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.darkText, fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip contentStyle={ttStyle} formatter={v => [`${v}건`, "거래량"]} />
                  <Bar dataKey="volume" fill={C.accent1} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Real trade table */}
        {curLoading ? <LoadingBar text="거래 내역 불러오는 중..." /> : curError ? (
          <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 24, textAlign: "center" }}>
            <WifiOff size={24} color={C.danger} style={{ marginBottom: 8 }} />
            <p style={{ color: C.danger, fontWeight: 600 }}>데이터 로딩 실패</p>
            <p style={{ color: C.darkText, fontSize: 13, marginTop: 4 }}>{curError}</p>
          </div>
        ) : (
          <div className="ani d5" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? 16 : 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: mob ? 14 : 16, fontWeight: 700 }}>실거래 내역 TOP 20 · {sel}</h3>
              <span style={{ fontSize: 12, color: C.darkText }}>총 {curData?.length || 0}건</span>
            </div>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: mob ? 600 : "auto" }}>
                <thead><tr>{["#","아파트명","매매가","면적(㎡)","층","동","거래일","건축년도"].map(h => <th key={h} style={{ padding: "10px 10px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.darkText, borderBottom: `1px solid ${C.darkBorder}`, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {topTrades.map((t, i) => (
                    <tr key={i}>
                      <td style={{ padding: "12px 10px", fontSize: 13, fontWeight: 700, color: i < 3 ? C.primary : C.darkTextLight }}>{i + 1}</td>
                      <td style={{ padding: "12px 10px", fontSize: 13, fontWeight: 600, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.aptName}</td>
                      <td style={{ padding: "12px 10px", fontSize: 13, fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: C.primary }}>{priceToEok(t.price).toFixed(1)}억</td>
                      <td style={{ padding: "12px 10px", fontSize: 13, color: C.darkTextLight }}>{parseFloat(t.area).toFixed(1)}</td>
                      <td style={{ padding: "12px 10px", fontSize: 13, color: C.darkTextLight }}>{t.floor}층</td>
                      <td style={{ padding: "12px 10px", fontSize: 13, color: C.darkTextLight }}>{t.dong}</td>
                      <td style={{ padding: "12px 10px", fontSize: 13, color: C.darkTextLight }}>{t.month}/{t.day}</td>
                      <td style={{ padding: "12px 10px", fontSize: 13, color: C.darkTextLight }}>{t.buildYear}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 유튜브 인사이트 (API 자동 + 폴백) */}
        {(() => {

          const tagColors = {
            "정책분석": "#3b82f6", "시장전망": "#f59e0b", "제도변경": "#ef4444",
            "지역분석": "#10b981", "투자전략": "#8b5cf6", "내집마련": "#ec4899", "경매": "#f97316",
          };

          return (
            <div className="ani d5" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? 20 : 24, marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(239,68,68,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Play size={18} color="#ef4444" />
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: mob ? 16 : 18, fontWeight: 800, marginBottom: 2 }}>유튜브 인사이트</h2>
                  <p style={{ fontSize: 12, color: C.darkText }}>부동산 유튜버 핵심 영상 요약</p>
                </div>
                <span style={{ fontSize: 10, color: C.darkText, background: "rgba(255,255,255,.04)", padding: "4px 8px", borderRadius: 6 }}>🔄 {ytUpdated}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {ytChannels.map((ch, ci) => (
                  <div key={ci} style={{ background: "rgba(255,255,255,.02)", border: `1px solid ${C.darkBorder}`, borderRadius: 14, padding: mob ? 16 : 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: ch.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>{ch.avatar}</div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{ch.channel}</span>
                        <span style={{ fontSize: 11, color: C.darkText, marginLeft: 8 }}>구독자 {ch.subs}</span>
                      </div>
                      <a href={ch.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: ch.color, textDecoration: "none", fontWeight: 600 }}>채널 →</a>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {(ch.videos || []).map((v, vi) => (
                        <a key={vi} href={v.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", background: "rgba(255,255,255,.02)", borderRadius: 10, padding: mob ? "12px 14px" : "14px 16px", display: "block", borderLeft: `3px solid ${tagColors[v.tag] || ch.color}`, transition: "all .15s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.05)"; e.currentTarget.style.transform = "translateX(2px)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.02)"; e.currentTarget.style.transform = "translateX(0)"; }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: C.darkText, fontFamily: "'Outfit',sans-serif" }}>{v.date}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: (tagColors[v.tag] || ch.color) + "18", color: tagColors[v.tag] || ch.color, border: `1px solid ${(tagColors[v.tag] || ch.color)}30` }}>{v.tag}</span>
                          </div>
                          <h4 style={{ fontSize: mob ? 13 : 14, fontWeight: 700, marginBottom: 4, lineHeight: 1.4 }}>{v.title}</h4>
                          <p style={{ fontSize: mob ? 11 : 12, color: C.darkText, lineHeight: 1.5 }}>{v.summary}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: C.darkText, textAlign: "center", marginTop: 16, fontStyle: "italic" }}>
                ※ AI 요약 기반 정리입니다. 투자 판단은 원본 영상을 참고하세요.
              </p>
            </div>
          );
        })()}

      {/* ── 권역별 월별 실거래가 추이 ── */}
      <ZoneTrendChart mob={mob} />

      {/* ── 아파트 가격지수 추이 ── */}
      <PriceIndexChart mob={mob} />

      {/* ── 금리 추이 ── */}
      <InterestRateChart mob={mob} />

      {/* ── 인구이동 추이 ── */}
      <PopulationMoveChart mob={mob} />

      {/* ── 구별 인구이동 히트맵 ── */}
      <PopulationMoveDistrictChart mob={mob} />

      {/* ── 주택 인허가 실적 ── */}
      <HousingSupplyChart mob={mob} />

      {/* ── 전세 평균가 추이 ── */}
      <RentTrendChart mob={mob} />

      </div>
    </div>
  );
}

/* ================================================================
   CALCULATOR PAGE
   ================================================================ */
function CalculatorPage() {
  const [tab, setTab] = useState("loan");
  const [loanAmt, setLoanAmt] = useState(300000000);
  const [loanRate, setLoanRate] = useState(3.5);
  const [loanYrs, setLoanYrs] = useState(30);
  const [loanType, setLoanType] = useState("equal");
  const [purchPrice, setPurchPrice] = useState(900000000);
  const [firstHome, setFirstHome] = useState(true);
  const [homeCnt, setHomeCnt] = useState(1);
  const [yPrice, setYPrice] = useState(500000000);
  const [mRent, setMRent] = useState(1500000);
  const [jeonse, setJeonse] = useState(300000000);
  const mob = useWindowSize() < 768;

  const loanRes = useMemo(() => {
    const P = loanAmt, r = loanRate / 100 / 12, n = loanYrs * 12;
    if (loanType === "equal") { const m = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1); return { monthly: Math.round(m), totalPaid: Math.round(m * n), totalInterest: Math.round(m * n - P) }; }
    const pm = P / n; let ti = 0; for (let i = 0; i < n; i++) ti += (P - pm * i) * r;
    return { monthly: Math.round(pm + P * r), totalPaid: Math.round(P + ti), totalInterest: Math.round(ti) };
  }, [loanAmt, loanRate, loanYrs, loanType]);

  const loanChart = useMemo(() => {
    const d = [], P = loanAmt, r = loanRate / 100 / 12, n = loanYrs * 12; let b = P;
    for (let y = 1; y <= loanYrs; y++) {
      if (loanType === "equal") { const m = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1); for (let i = 0; i < 12; i++) b -= (m - b * r); }
      else { for (let i = 0; i < 12; i++) b -= P / n; }
      d.push({ year: `${y}년`, balance: Math.max(0, Math.round(b / 1e4)) });
    }
    return d;
  }, [loanAmt, loanRate, loanYrs, loanType]);

  const taxRes = useMemo(() => {
    let rate; if (homeCnt >= 3) rate = .12; else if (homeCnt >= 2) rate = .08;
    else if (purchPrice <= 6e8) rate = .01; else if (purchPrice <= 9e8) rate = firstHome ? .01 : .02; else rate = firstHome ? .02 : .03;
    const at = Math.round(purchPrice * rate), le = Math.round(at * .1), sr = purchPrice > 6e8 ? Math.round(at * .2) : 0;
    return { rate: (rate * 100).toFixed(1), at, le, sr, total: at + le + sr };
  }, [purchPrice, firstHome, homeCnt]);

  const yieldRes = useMemo(() => {
    const ar = mRent * 12, gi = yPrice - jeonse;
    return { ar, gross: (ar / yPrice * 100).toFixed(2), gi, gap: gi > 0 ? (ar / gi * 100).toFixed(2) : "0" };
  }, [yPrice, mRent, jeonse]);

  const Slider = ({ label, value, onChange, min, max, step, unit, format }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: C.darkTextLight }}>{label}</label>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "'Outfit',sans-serif" }}>{format ? format(value) : value}{unit || ""}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </div>
  );

  const tabs = [{ id: "loan", label: "대출 상환", icon: PiggyBank }, { id: "tax", label: "취득세", icon: FileText }, { id: "yield", label: "수익률", icon: TrendingUp }];

  return (
    <div style={{ paddingTop: 70, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: mob ? "24px 16px" : "40px 24px" }}>
        <div className="ani" style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: mob ? 22 : 28, fontWeight: 800, marginBottom: 6 }}>투자 계산기</h1>
          <p style={{ color: C.darkText, fontSize: mob ? 13 : 15 }}>대출 상환, 취득세, 수익률을 한번에</p>
        </div>
        <div className="ani d1" style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 4 }}>
          {tabs.map(t => { const Ic = t.icon, a = tab === t.id; return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background: a ? "rgba(0,102,255,.12)" : C.darkCard, border: `1px solid ${a ? C.primary + "40" : C.darkBorder}`, color: a ? C.primary : C.darkTextLight, padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Noto Sans KR',sans-serif", whiteSpace: "nowrap", flexShrink: 0 }}><Ic size={15} />{t.label}</button>
          ); })}
        </div>

        {tab === "loan" && (
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 12 : 24 }}>
            <div className="ani d2" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? 20 : 28 }}>
              <h3 style={{ fontSize: mob ? 16 : 18, fontWeight: 700, marginBottom: 20 }}>대출 조건 설정</h3>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {["equal","principal"].map(t => (
                  <button key={t} onClick={() => setLoanType(t)} style={{ flex: 1, background: loanType === t ? C.primary : "transparent", border: `1px solid ${loanType === t ? C.primary : C.darkBorder}`, color: loanType === t ? "#fff" : C.darkTextLight, padding: "10px 8px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" }}>{t === "equal" ? "원리금균등" : "원금균등"}</button>
                ))}
              </div>
              <Slider label="대출금액" value={loanAmt} onChange={setLoanAmt} min={1e7} max={1e9} step={1e7} format={fmt} />
              <Slider label="금리" value={loanRate} onChange={setLoanRate} min={1} max={10} step={.1} unit="%" />
              <Slider label="대출기간" value={loanYrs} onChange={setLoanYrs} min={5} max={40} step={1} unit="년" />
            </div>
            <div className="ani d3" style={{ display: "flex", flexDirection: "column", gap: mob ? 12 : 20 }}>
              <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? 20 : 28 }}>
                <h3 style={{ fontSize: mob ? 16 : 18, fontWeight: 700, marginBottom: 16 }}>상환 결과</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "rgba(0,102,255,.08)", borderRadius: 12, padding: mob ? 16 : 20, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: C.darkText, marginBottom: 6 }}>월 상환금</div>
                    <div style={{ fontSize: mob ? 18 : 22, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: C.primary }}>{fmt(loanRes.monthly)}</div>
                  </div>
                  <div style={{ background: "rgba(124,92,252,.08)", borderRadius: 12, padding: mob ? 16 : 20, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: C.darkText, marginBottom: 6 }}>총 이자</div>
                    <div style={{ fontSize: mob ? 18 : 22, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: C.accent1 }}>{fmt(loanRes.totalInterest)}</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, background: "rgba(255,255,255,.03)", borderRadius: 12, padding: 14, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: C.darkText }}>총 상환금</span>
                  <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>{fmt(loanRes.totalPaid)}</span>
                </div>
              </div>
              <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? "16px 8px" : 24, flex: 1 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: C.darkTextLight }}>잔금 변화</h4>
                <ResponsiveContainer width="100%" height={mob ? 160 : 180}>
                  <AreaChart data={loanChart}>
                    <defs><linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent1} stopOpacity={.2} /><stop offset="95%" stopColor={C.accent1} stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                    <XAxis dataKey="year" tick={{ fill: C.darkText, fontSize: 10 }} axisLine={false} tickLine={false} interval={mob ? 6 : 4} />
                    <YAxis tick={{ fill: C.darkText, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}만`} width={35} />
                    <Tooltip contentStyle={ttStyle} formatter={v => [`${v.toLocaleString()}만원`]} />
                    <Area type="monotone" dataKey="balance" stroke={C.accent1} strokeWidth={2} fill="url(#bg2)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {tab === "tax" && (
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 12 : 24 }}>
            <div className="ani d2" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? 20 : 28 }}>
              <h3 style={{ fontSize: mob ? 16 : 18, fontWeight: 700, marginBottom: 20 }}>취득세 계산</h3>
              <Slider label="매매가" value={purchPrice} onChange={setPurchPrice} min={1e8} max={5e9} step={5e7} format={fmt} />
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: C.darkTextLight, marginBottom: 10, display: "block" }}>보유 주택 수</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 2, 3].map(n => (
                    <button key={n} onClick={() => setHomeCnt(n)} style={{ flex: 1, background: homeCnt === n ? C.primary : "transparent", border: `1px solid ${homeCnt === n ? C.primary : C.darkBorder}`, color: homeCnt === n ? "#fff" : C.darkTextLight, padding: "10px 6px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" }}>{n === 3 ? "3주택+" : `${n}주택`}</button>
                  ))}
                </div>
              </div>
              {homeCnt === 1 && (
                <div style={{ display: "flex", gap: 8 }}>
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => setFirstHome(v)} style={{ flex: 1, background: firstHome === v ? C.secondary : "transparent", border: `1px solid ${firstHome === v ? C.secondary : C.darkBorder}`, color: firstHome === v ? "#fff" : C.darkTextLight, padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" }}>{v ? "생애최초" : "일반"}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="ani d3" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? 20 : 28 }}>
              <h3 style={{ fontSize: mob ? 16 : 18, fontWeight: 700, marginBottom: 20 }}>세금 내역</h3>
              <div style={{ background: "rgba(0,102,255,.08)", borderRadius: 14, padding: mob ? 20 : 24, textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: C.darkText, marginBottom: 6 }}>총 취득세</div>
                <div style={{ fontSize: mob ? 26 : 32, fontWeight: 800, fontFamily: "'Outfit',sans-serif", color: C.primary }}>{fmt(taxRes.total)}</div>
                <div style={{ fontSize: 12, color: C.darkText, marginTop: 4 }}>세율 {taxRes.rate}%</div>
              </div>
              {[{ l: "취득세", v: taxRes.at }, { l: "지방교육세", v: taxRes.le }, { l: "농어촌특별세", v: taxRes.sr }].map((x, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i < 2 ? `1px solid ${C.darkBorder}` : "none" }}>
                  <span style={{ fontSize: 13, color: C.darkText }}>{x.l}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{fmt(x.v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "yield" && (
          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: mob ? 12 : 24 }}>
            <div className="ani d2" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? 20 : 28 }}>
              <h3 style={{ fontSize: mob ? 16 : 18, fontWeight: 700, marginBottom: 20 }}>수익률 계산</h3>
              <Slider label="매매가" value={yPrice} onChange={setYPrice} min={1e8} max={3e9} step={5e7} format={fmt} />
              <Slider label="월세" value={mRent} onChange={setMRent} min={1e5} max={1e7} step={5e4} format={fmt} />
              <Slider label="전세 보증금" value={jeonse} onChange={setJeonse} min={0} max={yPrice} step={1e7} format={fmt} />
            </div>
            <div className="ani d3" style={{ display: "flex", flexDirection: "column", gap: mob ? 12 : 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? 16 : 24, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: C.darkText, marginBottom: 6 }}>총 수익률</div>
                  <div style={{ fontSize: mob ? 24 : 28, fontWeight: 800, fontFamily: "'Outfit',sans-serif", color: C.secondary }}>{yieldRes.gross}%</div>
                  <div style={{ fontSize: 11, color: C.darkText, marginTop: 4 }}>연간</div>
                </div>
                <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? 16 : 24, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: C.darkText, marginBottom: 6 }}>갭투자 수익률</div>
                  <div style={{ fontSize: mob ? 24 : 28, fontWeight: 800, fontFamily: "'Outfit',sans-serif", color: C.accent2 }}>{yieldRes.gap}%</div>
                  <div style={{ fontSize: 11, color: C.darkText, marginTop: 4 }}>연간</div>
                </div>
              </div>
              <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? 16 : 24 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: C.darkTextLight }}>투자 분석 요약</h4>
                {[{ l: "연간 임대 수입", v: fmt(yieldRes.ar) }, { l: "갭투자 금액", v: fmt(yieldRes.gi) }, { l: "월세 대비 매매가", v: `${(yPrice / mRent / 12).toFixed(1)}배` }, { l: "전세가율", v: `${(jeonse / yPrice * 100).toFixed(1)}%` }].map((x, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: i < 3 ? `1px solid ${C.darkBorder}` : "none" }}>
                    <span style={{ fontSize: 13, color: C.darkText }}>{x.l}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{x.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   ANALYSIS PAGE — Real API multi-district comparison
   ================================================================ */
function AnalysisPage() {
  const mob = useWindowSize() < 768;
  const [sel, setSel] = useState("강남구");
  const [selApt, setSelApt] = useState(null);
  const [step, setStep] = useState("list"); // "list" | "detail"
  const now = new Date();
  const prevYM = (() => { const d = new Date(now.getFullYear(), now.getMonth() - 1, 1); return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`; })();
  const { data: rawData, loading, error } = useApiData(sel, prevYM);
  const [searchTerm, setSearchTerm] = useState("");

  // 아파트별 집계
  const aptList = useMemo(() => {
    if (!rawData) return [];
    const map = {};
    rawData.forEach(t => {
      const name = t.aptName;
      if (!map[name]) map[name] = { name, dong: t.dong, buildYear: t.buildYear, trades: [], totalPrice: 0 };
      const p = priceToEok(t.price);
      map[name].trades.push(t);
      map[name].totalPrice += p;
    });
    return Object.values(map).map(a => ({
      ...a,
      count: a.trades.length,
      avgPrice: Math.round(a.totalPrice / a.trades.length * 100) / 100,
      maxPrice: Math.max(...a.trades.map(t => priceToEok(t.price))),
      minPrice: Math.min(...a.trades.map(t => priceToEok(t.price))),
    })).sort((a, b) => b.count - a.count);
  }, [rawData]);

  // 검색 필터
  const filteredApts = useMemo(() => {
    if (!searchTerm) return aptList;
    return aptList.filter(a => a.name.includes(searchTerm) || a.dong.includes(searchTerm));
  }, [aptList, searchTerm]);

  // 선택된 아파트 상세
  const aptDetail = useMemo(() => {
    if (!selApt || !rawData) return null;
    const trades = rawData.filter(t => t.aptName === selApt)
      .map(t => ({ ...t, priceEok: priceToEok(t.price), areaNum: parseFloat(t.area) }))
      .sort((a, b) => b.priceEok - a.priceEok);
    if (!trades.length) return null;
    const prices = trades.map(t => t.priceEok);
    const areas = trades.map(t => t.areaNum).filter(a => !isNaN(a));
    // 면적별 그룹
    const byArea = {};
    trades.forEach(t => {
      const key = `${Math.round(t.areaNum)}㎡`;
      if (!byArea[key]) byArea[key] = { area: key, trades: [], total: 0 };
      byArea[key].trades.push(t);
      byArea[key].total += t.priceEok;
    });
    const areaGroups = Object.values(byArea).map(g => ({
      ...g, count: g.trades.length, avg: Math.round(g.total / g.trades.length * 100) / 100
    })).sort((a, b) => b.count - a.count);

    return {
      name: selApt, trades, count: trades.length,
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100,
      max: Math.max(...prices), min: Math.min(...prices),
      dong: trades[0].dong, buildYear: trades[0].buildYear,
      avgArea: areas.length ? Math.round(areas.reduce((a, b) => a + b, 0) / areas.length) : 0,
      areaGroups,
      chartData: areaGroups.map((g, i) => ({ name: g.area, 평균가: g.avg, 거래수: g.count })),
    };
  }, [selApt, rawData]);

  // 시세 추이 (과거 12개월)
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = useCallback(async (aptName, district) => {
    setHistoryLoading(true);
    const code = REGION_CODES[district];
    const months = [];
    for (let i = 12; i >= 1; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const results = [];
    for (const ym of months) {
      try {
        const res = await fetch(`${API_BASE}?region=${code}&year_month=${ym}`);
        const json = await res.json();
        const aptTrades = (json.data || []).filter(t => t.aptName === aptName);
        if (aptTrades.length > 0) {
          const prices = aptTrades.map(t => priceToEok(t.price));
          results.push({
            date: formatYM(ym), ym,
            avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100,
            max: Math.max(...prices), min: Math.min(...prices),
            count: aptTrades.length,
          });
        } else {
          results.push({ date: formatYM(ym), ym, avg: null, max: null, min: null, count: 0 });
        }
      } catch (_) {
        results.push({ date: formatYM(ym), ym, avg: null, max: null, min: null, count: 0 });
      }
    }
    setHistoryData(results);
    setHistoryLoading(false);
  }, [now]);

  const goDetail = (name) => { setSelApt(name); setStep("detail"); fetchHistory(name, sel); };
  const goBack = () => { setSelApt(null); setStep("list"); setHistoryData([]); };

  return (
    <div style={{ paddingTop: 70, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: mob ? "24px 16px" : "40px 24px" }}>
        <div className="ani" style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: mob ? 22 : 28, fontWeight: 800, marginBottom: 6 }}>지역 분석</h1>
          <p style={{ color: C.darkText, fontSize: mob ? 13 : 15, display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} />구 선택 → 아파트별 실거래 시세</p>
        </div>

        {/* 구 선택 */}
        <div className="ani d1" style={{ marginBottom: 20 }}>
          <select value={sel} onChange={e => { setSel(e.target.value); goBack(); }} style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, color: "#fff", padding: "10px 16px", borderRadius: 10, fontSize: 14, fontFamily: "'Noto Sans KR',sans-serif", cursor: "pointer", outline: "none", width: mob ? "100%" : "auto" }}>
            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <span style={{ fontSize: 13, color: C.darkText, marginLeft: 12 }}>{formatYM(prevYM)} 기준</span>
        </div>

        {loading ? <LoadingBar text={`${sel} 데이터 불러오는 중...`} /> : error ? (
          <div style={{ textAlign: "center", padding: 40, color: C.danger }}>데이터 로딩 실패: {error}</div>
        ) : step === "list" ? (
          /* ===== 아파트 목록 ===== */
          <>
            <div className="ani d2" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="아파트명 또는 동 검색..." style={{ flex: 1, background: C.darkCard, border: `1px solid ${C.darkBorder}`, color: "#fff", padding: "10px 16px", borderRadius: 10, fontSize: 14, fontFamily: "'Noto Sans KR',sans-serif", outline: "none" }} />
              <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, color: C.primary, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                <Building2 size={14} />{aptList.length}개 단지
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: mob ? 8 : 10 }}>
              {filteredApts.slice(0, 30).map((apt, i) => (
                <div key={apt.name} className={`ani d${Math.min(i + 1, 5)}`} onClick={() => goDetail(apt.name)}
                  style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 14, padding: mob ? "16px 14px" : "18px 20px", cursor: "pointer", transition: "all .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary + "40"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.darkBorder; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: mob ? 15 : 16, fontWeight: 700 }}>{apt.name}</span>
                        <span style={{ fontSize: 11, color: C.darkText, background: "rgba(255,255,255,.05)", padding: "2px 8px", borderRadius: 4 }}>{apt.dong}</span>
                      </div>
                      <div style={{ display: "flex", gap: mob ? 12 : 20, fontSize: 13, color: C.darkTextLight, flexWrap: "wrap" }}>
                        <span>평균 <b style={{ color: C.primary, fontFamily: "'Outfit',sans-serif" }}>{apt.avgPrice.toFixed(1)}억</b></span>
                        <span>{apt.minPrice.toFixed(1)}억 ~ {apt.maxPrice.toFixed(1)}억</span>
                        <span>거래 {apt.count}건</span>
                        <span>{apt.buildYear}년식</span>
                      </div>
                    </div>
                    <ChevronRight size={18} color={C.darkText} />
                  </div>
                </div>
              ))}
              {filteredApts.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.darkText }}>검색 결과 없음</div>}
              {filteredApts.length > 30 && <div style={{ textAlign: "center", padding: 16, color: C.darkText, fontSize: 13 }}>상위 30개 표시 중 (총 {filteredApts.length}개)</div>}
            </div>
          </>
        ) : aptDetail && (
          /* ===== 아파트 상세 ===== */
          <>
            <button onClick={goBack} className="ani" style={{ background: "rgba(255,255,255,.05)", border: `1px solid ${C.darkBorder}`, color: C.darkTextLight, padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Noto Sans KR',sans-serif", marginBottom: 16 }}>
              <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />목록으로
            </button>

            {/* 아파트 헤더 */}
            <div className="ani d1" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? 20 : 24, marginBottom: 20 }}>
              <h2 style={{ fontSize: mob ? 20 : 24, fontWeight: 800, marginBottom: 8 }}>{aptDetail.name}</h2>
              <div style={{ display: "flex", gap: 16, fontSize: 13, color: C.darkText, flexWrap: "wrap" }}>
                <span>{sel} {aptDetail.dong}</span>
                <span>{aptDetail.buildYear}년 건축</span>
                <span>평균 {aptDetail.avgArea}㎡</span>
                <span>{formatYM(prevYM)} 거래 {aptDetail.count}건</span>
              </div>
            </div>

            {/* KPI */}
            <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4,1fr)", gap: mob ? 10 : 16, marginBottom: 20 }}>
              <div className="ani d2" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 14, padding: 18, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.darkText, marginBottom: 6 }}>평균 매매가</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: C.primary }}>{aptDetail.avg.toFixed(1)}<span style={{ fontSize: 12, color: C.darkText }}>억</span></div>
              </div>
              <div className="ani d3" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 14, padding: 18, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.darkText, marginBottom: 6 }}>최고가</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: C.danger }}>{aptDetail.max.toFixed(1)}<span style={{ fontSize: 12, color: C.darkText }}>억</span></div>
              </div>
              <div className="ani d4" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 14, padding: 18, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.darkText, marginBottom: 6 }}>최저가</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: C.secondary }}>{aptDetail.min.toFixed(1)}<span style={{ fontSize: 12, color: C.darkText }}>억</span></div>
              </div>
              <div className="ani d5" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 14, padding: 18, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.darkText, marginBottom: 6 }}>거래 건수</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>{aptDetail.count}<span style={{ fontSize: 12, color: C.darkText }}>건</span></div>
              </div>
            </div>

            {/* 시세 추이 + 예측 (12개월 실적 + 6개월 예측) */}
            {(() => {
              // 선형 회귀 계산
              const validData = historyData.filter(d => d.avg !== null);
              let predData = [], predKPI = null;
              if (validData.length >= 3) {
                const n = validData.length;
                const xs = validData.map((_, i) => i);
                const ys = validData.map(d => d.avg);
                const xMean = xs.reduce((a, b) => a + b, 0) / n;
                const yMean = ys.reduce((a, b) => a + b, 0) / n;
                const num = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0);
                const den = xs.reduce((s, x) => s + (x - xMean) ** 2, 0);
                const slope = den ? num / den : 0;
                const intercept = yMean - slope * xMean;

                // 과거 데이터에 예측선 추가
                const combined = historyData.map((d, i) => ({
                  ...d,
                  예측: d.avg !== null ? Math.round((slope * i + intercept) * 100) / 100 : null,
                }));

                // 6개월 미래 예측
                const lastDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                for (let j = 1; j <= 6; j++) {
                  const fd = new Date(lastDate.getFullYear(), lastDate.getMonth() + j, 1);
                  const label = `${fd.getFullYear()}.${String(fd.getMonth() + 1).padStart(2, "0")}`;
                  const predVal = Math.round((slope * (n - 1 + j) + intercept) * 100) / 100;
                  combined.push({ date: label, avg: null, max: null, min: null, count: 0, 예측: predVal > 0 ? predVal : null });
                }

                predData = combined;
                const currentAvg = ys[ys.length - 1];
                const pred6m = Math.round((slope * (n + 5) + intercept) * 100) / 100;
                const changeRate = currentAvg ? Math.round((pred6m - currentAvg) / currentAvg * 10000) / 100 : 0;
                predKPI = { currentAvg, pred6m, changeRate, slope, trend: slope > 0.01 ? "상승" : slope < -0.01 ? "하락" : "보합" };
              }

              return (
                <div className="ani d3" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? "16px 6px" : 24, marginBottom: 20 }}>
                  <h3 style={{ fontSize: mob ? 14 : 16, fontWeight: 700, marginBottom: 4, paddingLeft: mob ? 10 : 0 }}>시세 추이 및 예측</h3>
                  <p style={{ fontSize: 12, color: C.darkText, marginBottom: 16, paddingLeft: mob ? 10 : 0 }}>12개월 실거래 + 6개월 선형 회귀 예측</p>

                  {historyLoading ? <LoadingBar text="과거 거래 데이터 수집 중..." /> : predData.length > 0 ? (
                    <>
                      {/* 예측 KPI */}
                      {predKPI && (
                        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4,1fr)", gap: mob ? 8 : 12, marginBottom: 16, padding: mob ? "0 6px" : 0 }}>
                          <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 10, padding: 14, textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: C.darkText, marginBottom: 4 }}>현재 평균</div>
                            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: C.primary }}>{predKPI.currentAvg.toFixed(1)}<span style={{ fontSize: 11, color: C.darkText }}>억</span></div>
                          </div>
                          <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 10, padding: 14, textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: C.darkText, marginBottom: 4 }}>6개월 후 예측</div>
                            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: "#a855f7" }}>{predKPI.pred6m.toFixed(1)}<span style={{ fontSize: 11, color: C.darkText }}>억</span></div>
                          </div>
                          <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 10, padding: 14, textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: C.darkText, marginBottom: 4 }}>예상 변동률</div>
                            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: predKPI.changeRate > 0 ? C.danger : predKPI.changeRate < 0 ? C.secondary : C.darkTextLight }}>{predKPI.changeRate > 0 ? "+" : ""}{predKPI.changeRate}%</div>
                          </div>
                          <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 10, padding: 14, textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: C.darkText, marginBottom: 4 }}>예측 트렌드</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: predKPI.trend === "상승" ? C.danger : predKPI.trend === "하락" ? C.secondary : C.darkTextLight }}>
                              {predKPI.trend === "상승" ? "📈" : predKPI.trend === "하락" ? "📉" : "➡️"} {predKPI.trend}
                            </div>
                          </div>
                        </div>
                      )}

                      <ResponsiveContainer width="100%" height={mob ? 280 : 340}>
                        <LineChart data={predData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                          <XAxis dataKey="date" tick={{ fill: C.darkText, fontSize: 9 }} axisLine={false} tickLine={false} interval={mob ? 2 : 1} />
                          <YAxis tick={{ fill: C.darkText, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}억`} width={45} domain={["auto", "auto"]} />
                          <Tooltip contentStyle={ttStyle} formatter={(v, name) => v !== null ? [`${v}억원`, name] : ["-", name]} />
                          <Line type="monotone" dataKey="max" name="최고가" stroke={C.danger} strokeWidth={1.5} dot={{ r: 2 }} connectNulls />
                          <Line type="monotone" dataKey="avg" name="평균가" stroke={C.primary} strokeWidth={2.5} dot={{ fill: C.primary, r: 3.5 }} connectNulls />
                          <Line type="monotone" dataKey="min" name="최저가" stroke={C.secondary} strokeWidth={1.5} dot={{ r: 2 }} connectNulls />
                          <Line type="monotone" dataKey="예측" name="예측가" stroke="#a855f7" strokeWidth={2} strokeDasharray="6 3" dot={{ fill: "#a855f7", r: 3 }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                      <div style={{ display: "flex", gap: mob ? 10 : 20, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
                        {[{label:"최고가",color:C.danger,dash:false},{label:"평균가",color:C.primary,dash:false},{label:"최저가",color:C.secondary,dash:false},{label:"예측",color:"#a855f7",dash:true}].map(l => (
                          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.darkTextLight }}>
                            <div style={{ width: 14, height: 3, borderRadius: 2, background: l.color, borderTop: l.dash ? `2px dashed ${l.color}` : "none" }} />{l.label}
                          </div>
                        ))}
                      </div>
                      {historyData.some(d => d.count === 0) && (
                        <p style={{ fontSize: 11, color: C.darkText, textAlign: "center", marginTop: 8 }}>
                          ※ 거래 없는 달: {historyData.filter(d => d.count === 0).map(d => d.date).join(", ")}
                        </p>
                      )}
                      <p style={{ fontSize: 11, color: C.darkText, textAlign: "center", marginTop: 8, fontStyle: "italic" }}>
                        ⚠️ 선형 회귀 기반 참고용 예측입니다. 실제 시장과 다를 수 있습니다.
                      </p>
                    </>
                  ) : historyData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={mob ? 260 : 320}>
                        <LineChart data={historyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                          <XAxis dataKey="date" tick={{ fill: C.darkText, fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: C.darkText, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}억`} width={45} domain={["auto", "auto"]} />
                          <Tooltip contentStyle={ttStyle} formatter={(v, name) => v !== null ? [`${v}억원`, name] : ["-", name]} />
                          <Line type="monotone" dataKey="avg" name="평균가" stroke={C.primary} strokeWidth={2.5} dot={{ fill: C.primary, r: 3.5 }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                      <p style={{ fontSize: 11, color: C.darkText, textAlign: "center", marginTop: 8 }}>거래 데이터가 3개월 미만이라 예측을 제공할 수 없습니다</p>
                    </>
                  ) : <div style={{ textAlign: "center", padding: 40, color: C.darkText }}>데이터를 불러오는 중 오류가 발생했습니다</div>}
                </div>
              );
            })()}

            {/* 면적별 평균가 차트 */}
            {aptDetail.chartData.length > 1 && (
              <div className="ani d3" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? "16px 6px" : 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: mob ? 14 : 16, fontWeight: 700, marginBottom: 16, paddingLeft: mob ? 10 : 0 }}>면적별 평균 매매가</h3>
                <ResponsiveContainer width="100%" height={mob ? 220 : 280}>
                  <BarChart data={aptDetail.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                    <XAxis dataKey="name" tick={{ fill: C.darkText, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: C.darkText, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}억`} width={40} />
                    <Tooltip contentStyle={ttStyle} formatter={(v, name) => [name === "평균가" ? `${v}억원` : `${v}건`, name]} />
                    <Bar dataKey="평균가" fill={C.primary} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 면적별 요약 */}
            <div className="ani d4" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? 16 : 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: mob ? 14 : 16, fontWeight: 700, marginBottom: 14 }}>면적별 시세</h3>
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
                {aptDetail.areaGroups.map((g, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,.03)", borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: CC[i % CC.length] }}>{g.area}</div>
                    <div style={{ fontSize: 13, color: C.darkTextLight, display: "flex", flexDirection: "column", gap: 4 }}>
                      <span>평균 <b style={{ color: "#fff" }}>{g.avg.toFixed(1)}억</b></span>
                      <span>거래 {g.count}건</span>
                      {g.trades.length > 1 && <span>{Math.min(...g.trades.map(t=>t.priceEok)).toFixed(1)}억 ~ {Math.max(...g.trades.map(t=>t.priceEok)).toFixed(1)}억</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 전체 거래 내역 */}
            <div className="ani d5" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? 16 : 24 }}>
              <h3 style={{ fontSize: mob ? 14 : 16, fontWeight: 700, marginBottom: 14 }}>전체 거래 내역</h3>
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: mob ? 500 : "auto" }}>
                  <thead><tr>{["매매가","면적(㎡)","층","동","거래일","거래유형"].map(h => <th key={h} style={{ padding: "10px 10px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.darkText, borderBottom: `1px solid ${C.darkBorder}`, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {aptDetail.trades.map((t, i) => (
                      <tr key={i}>
                        <td style={{ padding: "10px", fontSize: 13, fontFamily: "'Outfit',sans-serif", fontWeight: 700, color: C.primary }}>{t.priceEok.toFixed(1)}억</td>
                        <td style={{ padding: "10px", fontSize: 13, color: C.darkTextLight }}>{t.areaNum.toFixed(1)}</td>
                        <td style={{ padding: "10px", fontSize: 13, color: C.darkTextLight }}>{t.floor}층</td>
                        <td style={{ padding: "10px", fontSize: 13, color: C.darkTextLight }}>{t.aptDong || "-"}</td>
                        <td style={{ padding: "10px", fontSize: 13, color: C.darkTextLight }}>{t.month}/{t.day}</td>
                        <td style={{ padding: "10px", fontSize: 13, color: C.darkTextLight }}>{t.dealType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   NEWS PAGE — Naver News API
   ================================================================ */
function NewsPage() {
  const mob = useWindowSize() < 768;
  const [tab, setTab] = useState("news"); // "news" | "policy"
  const [news, setNews] = useState([]);
  const [policy, setPolicy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("서울 아파트 매매");
  const [searchInput, setSearchInput] = useState("서울 아파트 매매");
  const newsQueries = ["서울 아파트 매매", "부동산 정책", "전세 시장", "재건축 재개발", "금리 부동산"];

  const fetchNews = useCallback(async (q) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE.replace('/apt-trade', '/news')}?query=${encodeURIComponent(q)}&count=10`);
      const json = await res.json();
      setNews(json.data || []);
    } catch (_) { setNews([]); }
    setLoading(false);
  }, []);

  const fetchPolicy = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE.replace('/apt-trade', '/policy')}`);
      const json = await res.json();
      setPolicy(json.data || []);
    } catch (_) { setPolicy([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "news") fetchNews(query);
    else fetchPolicy();
  }, [tab, query, fetchNews, fetchPolicy]);

  const timeAgo = (dateStr) => {
    const now = new Date();
    const pub = new Date(dateStr);
    const diff = Math.floor((now - pub) / 60000);
    if (diff < 60) return `${diff}분 전`;
    if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
    return `${Math.floor(diff / 1440)}일 전`;
  };

  const items = tab === "news" ? news : policy;

  return (
    <div style={{ paddingTop: 70, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: mob ? "24px 16px" : "40px 24px" }}>
        <div className="ani" style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: mob ? 22 : 28, fontWeight: 800, marginBottom: 6 }}>뉴스 / 정책</h1>
          <p style={{ color: C.darkText, fontSize: mob ? 13 : 15 }}>부동산 뉴스와 국토부 정책을 한눈에</p>
        </div>

        {/* Tabs */}
        <div className="ani d1" style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[{ id: "news", label: "부동산 뉴스", icon: Newspaper }, { id: "policy", label: "국토부 정책", icon: Shield }].map(t => {
            const Ic = t.icon; const a = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ background: a ? "rgba(0,102,255,.12)" : C.darkCard, border: `1px solid ${a ? C.primary + "40" : C.darkBorder}`, color: a ? C.primary : C.darkTextLight, padding: "10px 16px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Noto Sans KR',sans-serif", flex: mob ? 1 : "none", justifyContent: "center" }}><Ic size={16} />{t.label}</button>
            );
          })}
        </div>

        {/* News: Quick tags + Search */}
        {tab === "news" && (
          <>
            <div className="ani d1" style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 4 }}>
              {newsQueries.map(q => (
                <button key={q} onClick={() => { setQuery(q); setSearchInput(q); }} style={{ background: query === q ? "rgba(0,102,255,.12)" : C.darkCard, border: `1px solid ${query === q ? C.primary + "40" : C.darkBorder}`, color: query === q ? C.primary : C.darkTextLight, padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif", whiteSpace: "nowrap", flexShrink: 0 }}>{q}</button>
              ))}
            </div>
            <div className="ani d2" style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === "Enter" && setQuery(searchInput)} placeholder="검색어 입력..." style={{ flex: 1, background: C.darkCard, border: `1px solid ${C.darkBorder}`, color: "#fff", padding: "12px 16px", borderRadius: 12, fontSize: 14, fontFamily: "'Noto Sans KR',sans-serif", outline: "none" }} />
              <button onClick={() => setQuery(searchInput)} style={{ background: C.gradient1, border: "none", color: "#fff", padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif", flexShrink: 0 }}>검색</button>
            </div>
          </>
        )}

        {/* Policy: archive + info */}
        {tab === "policy" && (
          <>
            {/* 주요 정책 원문 아카이브 */}
            <div className="ani d1" style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: mob ? 15 : 17, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={16} color={C.warning || "#f59e0b"} />주요 정책 원문
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: mob ? 8 : 10 }}>
                {[
                  { date: "2026.02.12", title: "다주택자 양도세 중과 유예 종료 및 보완방안 (2·12 대책)", summary: "양도세 중과 유예 종료, 임대등록 말소 물량 매물 유도, 전세보호 보완", link: "https://www.korea.kr/briefing/pressReleaseList.do?srchDeptNm=%EA%B5%AD%ED%86%A0%EA%B5%90%ED%86%B5%EB%B6%80", tag: "세제" },
                  { date: "2026.01.29", title: "도심 주택공급 방안 (1·29 대책)", summary: "서울 5.9만호 공급 - 용산 1.2만, 과천 경마장 9,800호, 태릉CC 6,800호, 노후청사 복합개발", link: "https://www.korea.kr/news/policyNewsView.do?newsId=148950973", tag: "공급" },
                  { date: "2025.10.15", title: "주택시장 안정화 대책 (10·15 대책)", summary: "서울 전역·경기 12곳 투기과열지구 지정, 토지거래허가구역 확대, 주담대 한도 축소(15억 초과 2~4억), 부동산감독원 설립", link: "https://www.korea.kr/news/policyNewsView.do?newsId=148950973", tag: "규제" },
                  { date: "2025.09.07", title: "수도권 주택공급 확대방안 (9·7 대책)", summary: "2026~2030년 수도권 135만호 착공 계획, LH 개혁·직접 시행, 3기 신도시 속도전, 민간 정비사업 절차 개선", link: "https://www.korea.kr/briefing/policyBriefingView.do?newsId=148865571", tag: "공급" },
                  { date: "2025.06.27", title: "가계부채 관리 방안 (6·27 대책)", summary: "수도권·규제지역 주담대 한도 6억 제한, 스트레스 DSR 3단계 시행, 전세대출 규제 강화", link: "https://www.korea.kr/briefing/policyBriefingView.do?newsId=148865571", tag: "금융" },
                ].map((p, i) => {
                  const tagColors = { "규제": { bg: "rgba(239,68,68,.1)", border: "rgba(239,68,68,.2)", text: "#ef4444" }, "공급": { bg: "rgba(0,102,255,.1)", border: "rgba(0,102,255,.2)", text: C.primary }, "금융": { bg: "rgba(168,85,247,.1)", border: "rgba(168,85,247,.2)", text: "#a855f7" }, "세제": { bg: "rgba(245,158,11,.1)", border: "rgba(245,158,11,.2)", text: "#f59e0b" } };
                  const tc = tagColors[p.tag] || tagColors["규제"];
                  return (
                    <a key={i} href={p.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderLeft: `3px solid ${tc.text}`, borderRadius: "4px 14px 14px 4px", padding: mob ? "14px 14px" : "16px 20px", display: "block", transition: "all .2s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = tc.text + "60"; e.currentTarget.style.transform = "translateX(2px)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.darkBorder; e.currentTarget.style.borderLeftColor = tc.text; e.currentTarget.style.transform = "translateX(0)"; }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: C.darkText, fontFamily: "'Outfit',sans-serif" }}>{p.date}</span>
                            <span style={{ display: "inline-block", background: tc.bg, border: `1px solid ${tc.border}`, color: tc.text, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4 }}>{p.tag}</span>
                            <span style={{ fontSize: 10, background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.15)", color: "#f59e0b", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>원문</span>
                          </div>
                          <h4 style={{ fontSize: mob ? 14 : 15, fontWeight: 700, marginBottom: 4, lineHeight: 1.4 }}>{p.title}</h4>
                          <p style={{ fontSize: mob ? 12 : 13, color: C.darkText, lineHeight: 1.5 }}>{p.summary}</p>
                        </div>
                        <ExternalLink size={14} color={C.darkText} style={{ flexShrink: 0, marginTop: 4 }} />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* 실시간 정책 뉴스 헤더 */}
            <h3 style={{ fontSize: mob ? 15 : 17, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <Newspaper size={16} color={C.secondary} />실시간 정책 뉴스
            </h3>
          </>
        )}

        {/* Article list */}
        {loading ? <LoadingBar text={tab === "news" ? "뉴스 불러오는 중..." : "정책 불러오는 중..."} /> : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: C.darkText }}>결과가 없습니다</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: mob ? 12 : 16 }}>
            {items.map((item, i) => (
              <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className={`ani d${Math.min(i + 1, 5)}`} style={{ textDecoration: "none", color: "inherit", background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? 20 : 24, display: "block", transition: "all .2s", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = (tab === "policy" ? C.secondary : C.primary) + "40"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.darkBorder; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    {tab === "policy" && <span style={{ display: "inline-block", background: "rgba(0,214,143,.1)", border: "1px solid rgba(0,214,143,.2)", color: C.secondary, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, marginBottom: 8 }}>국토부 정책</span>}
                    <h3 style={{ fontSize: mob ? 15 : 17, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{item.title}</h3>
                    <p style={{ fontSize: mob ? 13 : 14, color: C.darkText, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 12, color: C.darkText }}>
                      <Clock size={12} />
                      <span>{timeAgo(item.pubDate)}</span>
                    </div>
                  </div>
                  <ExternalLink size={16} color={C.darkText} style={{ flexShrink: 0, marginTop: 4 }} />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   PREDICTION PAGE — 시세 예측 (실거래 트렌드 기반)
   ================================================================ */
function PredictionPage() {
  const mob = useWindowSize() < 768;
  const [sel, setSel] = useState("강남구");
  const months12 = useMemo(() => getRecentMonths(12), []);
  const { data: multiData, loading } = useMultiMonthData(sel, months12);

  // 과거 데이터 집계 + 예측
  const chartData = useMemo(() => {
    if (!multiData.length) return [];
    const historical = multiData.map(({ ym, data }) => {
      if (!data.length) return { date: formatYM(ym), avgPrice: 0, type: "actual" };
      const prices = data.map(d => priceToEok(d.price)).filter(p => p > 0);
      const avg = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100 : 0;
      return { date: formatYM(ym), avgPrice: avg, type: "actual" };
    }).filter(d => d.avgPrice > 0);

    if (historical.length < 3) return historical;

    // 단순 선형 회귀 예측 (6개월)
    const n = historical.length;
    const xs = historical.map((_, i) => i);
    const ys = historical.map(d => d.avgPrice);
    const xMean = xs.reduce((a, b) => a + b, 0) / n;
    const yMean = ys.reduce((a, b) => a + b, 0) / n;
    const num = xs.reduce((sum, x, i) => sum + (x - xMean) * (ys[i] - yMean), 0);
    const den = xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
    const slope = den ? num / den : 0;
    const intercept = yMean - slope * xMean;

    const lastDate = new Date();
    const predictions = [];
    for (let i = 1; i <= 6; i++) {
      const futureDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + i, 1);
      const ym = `${futureDate.getFullYear()}.${String(futureDate.getMonth() + 1).padStart(2, "0")}`;
      const predicted = Math.round((intercept + slope * (n - 1 + i)) * 100) / 100;
      predictions.push({ date: ym, predicted: Math.max(0, predicted), type: "predicted" });
    }

    // Merge: 마지막 실제 데이터에 predicted도 넣어서 연결
    const last = historical[historical.length - 1];
    last.predicted = last.avgPrice;

    return [...historical, ...predictions];
  }, [multiData]);

  const stats = useMemo(() => {
    const actual = chartData.filter(d => d.type === "actual" && d.avgPrice > 0);
    const predicted = chartData.filter(d => d.type === "predicted");
    if (!actual.length) return null;

    const current = actual[actual.length - 1].avgPrice;
    const prev3 = actual.length >= 4 ? actual[actual.length - 4].avgPrice : current;
    const change3m = prev3 ? ((current - prev3) / prev3 * 100).toFixed(1) : "0";
    const future6 = predicted.length ? predicted[predicted.length - 1].predicted : current;
    const changeFuture = ((future6 - current) / current * 100).toFixed(1);
    const trend = parseFloat(changeFuture) > 1 ? "상승" : parseFloat(changeFuture) < -1 ? "하락" : "보합";
    const trendColor = trend === "상승" ? C.danger : trend === "하락" ? C.secondary : C.accent2;

    return { current, change3m, future6, changeFuture, trend, trendColor };
  }, [chartData]);

  return (
    <div style={{ paddingTop: 70, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: mob ? "24px 16px" : "40px 24px" }}>
        <div className="ani" style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: mob ? 22 : 28, fontWeight: 800, marginBottom: 6 }}>시세 예측</h1>
          <p style={{ color: C.darkText, fontSize: mob ? 13 : 15, display: "flex", alignItems: "center", gap: 6 }}><Brain size={14} />실거래 데이터 기반 6개월 가격 예측</p>
        </div>

        <div className="ani d1" style={{ background: "rgba(124,92,252,.06)", border: "1px solid rgba(124,92,252,.15)", borderRadius: 12, padding: mob ? "12px 16px" : "14px 20px", marginBottom: 20, fontSize: 13, color: C.accent1, display: "flex", alignItems: "center", gap: 8 }}>
          <Brain size={16} />
          선형 회귀 분석 기반 예측입니다. 실제 시장 변동과 다를 수 있으며, 투자 판단의 참고용으로만 활용하세요.
        </div>

        <div className="ani d2" style={{ marginBottom: 20 }}>
          <select value={sel} onChange={e => setSel(e.target.value)} style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, color: "#fff", padding: "10px 16px", borderRadius: 10, fontSize: 14, fontFamily: "'Noto Sans KR',sans-serif", cursor: "pointer", outline: "none", width: mob ? "100%" : "auto" }}>
            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {loading ? <LoadingBar text="12개월 데이터 분석 중..." /> : (
          <>
            {/* KPI */}
            {stats && (
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4,1fr)", gap: mob ? 10 : 16, marginBottom: 24 }}>
                <div className="ani d2" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 12, color: C.darkText, marginBottom: 8 }}>현재 평균가</div>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: C.primary }}>{stats.current.toFixed(1)}<span style={{ fontSize: 13, color: C.darkText }}>억</span></div>
                </div>
                <div className="ani d3" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 12, color: C.darkText, marginBottom: 8 }}>3개월 변동</div>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: parseFloat(stats.change3m) >= 0 ? C.danger : C.secondary }}>{stats.change3m > 0 ? "+" : ""}{stats.change3m}%</div>
                </div>
                <div className="ani d4" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 12, color: C.darkText, marginBottom: 8 }}>6개월 후 예측가</div>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: C.accent1 }}>{stats.future6.toFixed(1)}<span style={{ fontSize: 13, color: C.darkText }}>억</span></div>
                </div>
                <div className="ani d5" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 12, color: C.darkText, marginBottom: 8 }}>예측 트렌드</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: stats.trendColor, display: "flex", alignItems: "center", gap: 6 }}>
                    {stats.trend === "상승" ? <ArrowUpRight size={20} /> : stats.trend === "하락" ? <TrendingDown size={20} /> : <ArrowRight size={20} />}
                    {stats.trend}
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="ani d3" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? "20px 8px" : 24, marginBottom: 24 }}>
              <h3 style={{ fontSize: mob ? 14 : 16, fontWeight: 700, marginBottom: 16, paddingLeft: mob ? 8 : 0 }}>{sel} 매매가 추이 + 6개월 예측</h3>
              <ResponsiveContainer width="100%" height={mob ? 300 : 400}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={.25} /><stop offset="95%" stopColor={C.primary} stopOpacity={0} /></linearGradient>
                    <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent1} stopOpacity={.2} /><stop offset="95%" stopColor={C.accent1} stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                  <XAxis dataKey="date" tick={{ fill: C.darkText, fontSize: 10 }} axisLine={false} tickLine={false} interval={mob ? 2 : 1} />
                  <YAxis tick={{ fill: C.darkText, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}억`} width={40} />
                  <Tooltip contentStyle={ttStyle} formatter={(v, name) => [`${v}억원`, name === "avgPrice" ? "실거래 평균" : "예측가"]} />
                  <Area type="monotone" dataKey="avgPrice" stroke={C.primary} strokeWidth={2.5} fill="url(#actualGrad)" dot={{ fill: C.primary, r: 3 }} connectNulls={false} />
                  <Area type="monotone" dataKey="predicted" stroke={C.accent1} strokeWidth={2.5} strokeDasharray="8 4" fill="url(#predGrad)" dot={{ fill: C.accent1, r: 3 }} connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 20, marginTop: 12, justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.darkTextLight }}>
                  <div style={{ width: 20, height: 3, borderRadius: 2, background: C.primary }} />실거래 평균
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.darkTextLight }}>
                  <div style={{ width: 20, height: 3, borderRadius: 2, background: C.accent1, borderTop: "2px dashed " + C.accent1 }} />예측 가격
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div className="ani d4" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: mob ? 20 : 24 }}>
              <h3 style={{ fontSize: mob ? 14 : 16, fontWeight: 700, marginBottom: 16 }}>분석 요약</h3>
              <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : "1fr 1fr", gap: 16 }}>
                <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 12, padding: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: C.primary }}>과거 12개월 분석</h4>
                  {(() => {
                    const actual = chartData.filter(d => d.type === "actual" && d.avgPrice > 0);
                    if (actual.length < 2) return <p style={{ color: C.darkText, fontSize: 13 }}>데이터 부족</p>;
                    const prices = actual.map(d => d.avgPrice);
                    const maxP = Math.max(...prices);
                    const minP = Math.min(...prices);
                    const volatility = ((maxP - minP) / minP * 100).toFixed(1);
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {[{ l: "최고가", v: `${maxP.toFixed(1)}억` }, { l: "최저가", v: `${minP.toFixed(1)}억` }, { l: "변동폭", v: `${volatility}%` }, { l: "데이터 수", v: `${actual.length}개월` }].map((x, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                            <span style={{ color: C.darkText }}>{x.l}</span>
                            <span style={{ fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{x.v}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 12, padding: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: C.accent1 }}>6개월 예측</h4>
                  {(() => {
                    const predicted = chartData.filter(d => d.type === "predicted");
                    if (!predicted.length || !stats) return <p style={{ color: C.darkText, fontSize: 13 }}>예측 불가</p>;
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {[{ l: "예측 방향", v: stats.trend }, { l: "예상 변동률", v: `${stats.changeFuture > 0 ? "+" : ""}${stats.changeFuture}%` }, { l: "현재 → 6개월 후", v: `${stats.current.toFixed(1)}억 → ${stats.future6.toFixed(1)}억` }, { l: "모델", v: "선형 회귀" }].map((x, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                            <span style={{ color: C.darkText }}>{x.l}</span>
                            <span style={{ fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{x.v}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   FOOTER
   ================================================================ */
/* ================================================================
   REDEVELOPMENT MAP PAGE — 서울 재개발·재건축 지도
   ================================================================ */
const REDEV_PROJECTS = [
  { name:"압구정 2구역", type:"재건축", district:"강남구", dong:"압구정동", lat:37.5285, lng:127.0260, units:2296, status:"시공사 선정 완료", stage:"사업시행인가 추진", cost:"2.7조원", desc:"현대건설(디에이치) 수주. 최고 70층, 현대아파트 1·2·3차 통합 재건축." },
  { name:"압구정 3구역", type:"재건축", district:"강남구", dong:"압구정동", lat:37.5275, lng:127.0310, units:5175, status:"정비구역 지정 고시", stage:"시공사 선정 추진", cost:"약 7조원", desc:"2026년 1월 고시 완료. 최고 70층, 5,175세대. 현대건설·삼성물산 경합." },
  { name:"압구정 4구역", type:"재건축", district:"강남구", dong:"압구정동", lat:37.5265, lng:127.0230, units:1722, status:"시공사 입찰 공고", stage:"시공사 선정 추진", cost:"약 2조원", desc:"최고 69층·1,664가구. 삼성물산·현대건설·DL이앤씨 경합. 2026 상반기 선정." },
  { name:"압구정 5구역", type:"재건축", district:"강남구", dong:"압구정동", lat:37.5255, lng:127.0200, units:1401, status:"시공사 선정 준비", stage:"시공사 선정 추진", cost:"약 1.5조원", desc:"한양1·2차 통합. 최고 68층. 삼성물산·현대건설·DL이앤씨·포스코이앤씨 검토." },
  { name:"여의도 시범아파트", type:"재건축", district:"영등포구", dong:"여의도동", lat:37.5218, lng:126.9265, units:2493, status:"사업시행인가 추진", stage:"사업시행인가", cost:"-", desc:"1971년 준공. 신통기획 1호. 삼성물산·현대건설·대우건설 3파전. 2029 착공 목표." },
  { name:"여의도 대교·한양", type:"재건축", district:"영등포구", dong:"여의도동", lat:37.5238, lng:126.9230, units:1800, status:"사업시행인가 완료", stage:"관리처분인가 추진", cost:"-", desc:"여의도 재건축 중 사업 속도 가장 빠름." },
  { name:"여의도 공작·삼부", type:"재건축", district:"영등포구", dong:"여의도동", lat:37.5260, lng:126.9295, units:1400, status:"정비구역 지정", stage:"조합설립 추진", cost:"-", desc:"여의도 재건축 16개 단지 중 추진 구역. 한강변 프리미엄 입지." },
  { name:"목동 6단지", type:"재건축", district:"양천구", dong:"목동", lat:37.5440, lng:126.8745, units:2640, status:"시공사 선정 추진", stage:"시공사 선정", cost:"-", desc:"목동 14개 단지 중 가장 빠름. 삼성물산·DL이앤씨·포스코이앤씨 경쟁." },
  { name:"목동 13단지", type:"재건축", district:"양천구", dong:"목동", lat:37.5395, lng:126.8685, units:1848, status:"시공사 입찰 공고", stage:"시공사 선정", cost:"-", desc:"2026년 3월 시공사 선정 공고 예정." },
  { name:"목동 1~3단지", type:"재건축", district:"양천구", dong:"목동", lat:37.5480, lng:126.8650, units:8500, status:"정비구역 지정 완료", stage:"조합설립 추진", cost:"-", desc:"2025년 12월 지정 완료. 14개 단지 전체 재건축 퍼즐 완성. 총 47,438세대." },
  { name:"성수 1지구", type:"재개발", district:"성동구", dong:"성수동", lat:37.5450, lng:127.0580, units:3200, status:"시공사 선정 추진", stage:"시공사 선정", cost:"2.15조원", desc:"강북 최대 재개발. 현대건설·GS건설·HDC현산·금호건설 경합." },
  { name:"성수 2지구", type:"재개발", district:"성동구", dong:"성수동", lat:37.5430, lng:127.0540, units:2500, status:"재입찰 추진", stage:"시공사 선정", cost:"1.8조원", desc:"1차 유찰 후 재입찰 준비. 삼성물산·DL이앤씨·포스코이앤씨 관심." },
  { name:"성수 3지구", type:"재개발", district:"성동구", dong:"성수동", lat:37.5415, lng:127.0510, units:1600, status:"설계사 선정 완료", stage:"사업시행인가 추진", cost:"-", desc:"2026년 2월 설계사 선정. 사업 재개." },
  { name:"성수 4지구", type:"재개발", district:"성동구", dong:"성수동", lat:37.5470, lng:127.0620, units:2128, status:"시공사 선정 추진", stage:"시공사 선정", cost:"1.36조원", desc:"최고 70층 초고층 확정. 대우건설·롯데건설 2파전." },
  { name:"한남 3구역", type:"재개발", district:"용산구", dong:"한남동", lat:37.5345, lng:127.0020, units:5816, status:"시공사 선정 완료", stage:"관리처분인가 추진", cost:"5.6조원", desc:"서울 최대 규모 재개발. 현대건설 시공. 최고 35층, 5,816세대." },
  { name:"한남 2구역", type:"재개발", district:"용산구", dong:"한남동", lat:37.5365, lng:127.0050, units:2000, status:"조합설립인가", stage:"사업시행인가 추진", cost:"-", desc:"한남뉴타운 내 주요 재개발 구역." },
  { name:"용산정비창", type:"재개발", district:"용산구", dong:"한강로3가", lat:37.5285, lng:126.9650, units:8000, status:"개발계획 수립", stage:"마스터플랜 수립", cost:"-", desc:"49.7만㎡ 초대형 부지. 국제업무·문화·주거 복합개발." },
  { name:"대치 쌍용1차", type:"재건축", district:"강남구", dong:"대치동", lat:37.4975, lng:127.0625, units:999, status:"시공사 선정 추진", stage:"시공사 선정", cost:"-", desc:"최고 49층, 999가구. 삼성물산 수주 유력." },
  { name:"반포주공1단지", type:"재건축", district:"서초구", dong:"반포동", lat:37.5065, lng:127.0015, units:5610, status:"이주 진행", stage:"착공 준비", cost:"-", desc:"대규모 재건축. 이주 및 철거 진행 중." },
  { name:"송파 한양2차", type:"재건축", district:"송파구", dong:"송파동", lat:37.5040, lng:127.1085, units:1346, status:"시공사 선정 추진", stage:"시공사 선정", cost:"-", desc:"GS건설 단독 입찰." },
  { name:"고덕주공9단지", type:"재건축", district:"강동구", dong:"고덕동", lat:37.5565, lng:127.1590, units:2400, status:"관리용역 진행", stage:"사업시행인가 추진", cost:"-", desc:"고덕지구 재건축 추진." },
  { name:"상계동 154-3", type:"재개발", district:"노원구", dong:"상계동", lat:37.6565, lng:127.0630, units:1200, status:"조합설립 추진", stage:"조합설립 추진", cost:"-", desc:"신통기획 재개발. 주민협의체 선거 진행." },
  { name:"쌍문 2구역", type:"재개발", district:"도봉구", dong:"쌍문동", lat:37.6480, lng:127.0290, units:950, status:"정비구역 지정", stage:"조합설립 추진", cost:"-", desc:"쌍문동 81번지 일대 재개발." },
  { name:"중계그린아파트", type:"재건축", district:"노원구", dong:"중계동", lat:37.6425, lng:127.0720, units:1500, status:"추진위 구성 중", stage:"추진위 구성", cost:"-", desc:"추진위원회 구성 입후보 등록 진행." },
  { name:"신림 8구역", type:"재개발", district:"관악구", dong:"신림동", lat:37.4755, lng:126.9285, units:800, status:"추진위 승인", stage:"조합설립 추진", cost:"-", desc:"2026년 2월 추진위 승인 고시. 신통기획 재개발." },
  { name:"신당 9구역", type:"재개발", district:"중구", dong:"신당동", lat:37.5610, lng:127.0110, units:2000, status:"정비구역 지정", stage:"사업시행인가 추진", cost:"-", desc:"서울시 '주택 공급 촉진 방안' 사업 가속화 대상." },
  { name:"수색·증산 뉴타운", type:"재정비촉진", district:"은평구", dong:"수색동", lat:37.5825, lng:126.8980, units:12000, status:"단계별 추진", stage:"구역별 상이", cost:"-", desc:"서북부 최대 재정비촉진. GTX-A 수색역 호재." },
  { name:"북아현 뉴타운", type:"재정비촉진", district:"서대문구", dong:"북아현동", lat:37.5595, lng:126.9550, units:8000, status:"일부 준공", stage:"구역별 상이", cost:"-", desc:"일부 준공(e편한·래미안). 잔여 구역 진행." },
  { name:"이문·휘경 뉴타운", type:"재정비촉진", district:"동대문구", dong:"이문동", lat:37.5960, lng:127.0570, units:15000, status:"구역별 진행", stage:"구역별 상이", cost:"-", desc:"동북부 최대 재정비촉진. 일부 입주, 잔여 추진." },
  { name:"장위 뉴타운", type:"재정비촉진", district:"성북구", dong:"장위동", lat:37.6145, lng:127.0525, units:18000, status:"구역별 진행", stage:"구역별 상이", cost:"-", desc:"서울 최대 뉴타운. 15개 구역 단계별 진행." },
  { name:"영등포 1-2구역", type:"재정비촉진", district:"영등포구", dong:"영등포동", lat:37.5160, lng:126.9075, units:3500, status:"사업 정상화 추진", stage:"사업 정상화", cost:"-", desc:"조합 내부 갈등. 사업 정상화 노력 중." },
  { name:"고척동 모아타운", type:"모아타운", district:"구로구", dong:"고척동", lat:37.4975, lng:126.8620, units:647, status:"시공사 선정", stage:"사업시행인가 추진", cost:"7,680억", desc:"동부건설 수주. 최고 25층 647가구." },
  { name:"석수역세권 모아타운", type:"모아타운", district:"금천구", dong:"시흥동", lat:37.4690, lng:126.9080, units:576, status:"시공사 선정", stage:"사업시행인가 추진", cost:"-", desc:"동부건설 수주. 최고 15층 576가구." },
  { name:"마장동 모아타운", type:"모아타운", district:"성동구", dong:"마장동", lat:37.5650, lng:127.0400, units:400, status:"시공사 선정", stage:"사업시행인가 추진", cost:"-", desc:"코오롱글로벌 수주." },
  { name:"방화 6구역", type:"재개발", district:"강서구", dong:"방화동", lat:37.5745, lng:126.8130, units:1100, status:"조합설립인가", stage:"사업시행인가 추진", cost:"-", desc:"마곡지구 인접 개발 호재." },
];

const REDEV_COLORS = {
  "재개발":  { color:"#FF6B35", glow:"rgba(255,107,53,0.35)", bg:"rgba(255,107,53,0.12)" },
  "재건축":  { color:"#00D68F", glow:"rgba(0,214,143,0.35)", bg:"rgba(0,214,143,0.12)" },
  "재정비촉진":{ color:"#A78BFA", glow:"rgba(167,139,250,0.35)", bg:"rgba(167,139,250,0.12)" },
  "모아타운": { color:"#FFA502", glow:"rgba(255,165,2,0.35)",  bg:"rgba(255,165,2,0.12)" },
};

function RedevelopmentMapPage() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const articleMarkersRef = useRef([]);
  const mob = useWindowSize() < 768;

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [panelOpen, setPanelOpen] = useState(!mob);

  // 매물 관련 state
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [tradFilter, setTradFilter] = useState("A1:B1:B2"); // 전체
  const [showArticles, setShowArticles] = useState(false);
  const [articleTarget, setArticleTarget] = useState(null);

  const filtered = useMemo(() => {
    return REDEV_PROJECTS.filter(p => {
      const typeOk = filter === "all" || p.type === filter;
      const searchOk = !search || p.name.includes(search) || p.district.includes(search) || p.dong.includes(search);
      return typeOk && searchOk;
    });
  }, [filter, search]);

  const totalUnits = useMemo(() => filtered.reduce((s, p) => s + p.units, 0), [filtered]);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, { center: [37.5665, 126.978], zoom: 12, zoomControl: false });
    L.control.zoom({ position: "topright" }).addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; CARTO", subdomains: "abcd", maxZoom: 19
    }).addTo(map);
    mapInstance.current = map;

    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  // Update markers
  useEffect(() => {
    const L = window.L;
    const map = mapInstance.current;
    if (!L || !map) return;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    filtered.forEach((p, idx) => {
      const c = REDEV_COLORS[p.type] || REDEV_COLORS["재개발"];
      const sz = Math.min(Math.max(p.units / 250, 10), 32);

      const icon = L.divIcon({
        className: "",
        html: `<div style="position:relative;width:${sz*2}px;height:${sz*2}px">
          <div style="position:absolute;width:100%;height:100%;border-radius:50%;background:radial-gradient(circle,${c.color}66 0%,${c.color}00 70%);animation:pulse 2s ease-in-out infinite"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:${sz}px;height:${sz}px;border-radius:50%;background:${c.color};border:2px solid rgba(255,255,255,.3);box-shadow:0 0 10px ${c.glow}"></div>
        </div>`,
        iconSize: [sz*2, sz*2], iconAnchor: [sz, sz]
      });

      const popupHtml = `
        <div style="font-family:'Noto Sans KR',sans-serif;padding:14px;min-width:230px;background:#131729;color:#E8ECF4;border-radius:10px">
          <div style="display:inline-block;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;background:${c.bg};color:${c.color};margin-bottom:8px;letter-spacing:1px">${p.type}</div>
          <div style="font-size:15px;font-weight:700;margin-bottom:3px">${p.name}</div>
          <div style="font-size:11px;color:#8B92A5;margin-bottom:10px">${p.district} ${p.dong}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            <div style="background:rgba(255,255,255,.04);padding:7px 9px;border-radius:7px"><div style="font-size:9px;color:#8B92A5">세대수</div><div style="font-size:12px;font-weight:600">${p.units.toLocaleString()}</div></div>
            <div style="background:rgba(255,255,255,.04);padding:7px 9px;border-radius:7px"><div style="font-size:9px;color:#8B92A5">단계</div><div style="font-size:12px;font-weight:600">${p.stage}</div></div>
            ${p.cost !== "-" ? `<div style="background:rgba(255,255,255,.04);padding:7px 9px;border-radius:7px;grid-column:span 2"><div style="font-size:9px;color:#8B92A5">사업비</div><div style="font-size:12px;font-weight:600">${p.cost}</div></div>` : ""}
          </div>
          <div style="margin-top:10px;padding:7px 10px;border-radius:7px;font-size:11px;background:${c.bg};color:${c.color};border-left:3px solid ${c.color}">📌 ${p.status}</div>
        </div>`;

      const marker = L.marker([p.lat, p.lng], { icon })
        .addTo(map)
        .bindPopup(popupHtml, { maxWidth: 280, className: "redev-popup" });

      marker.on("click", () => setSelected(idx));
      markersRef.current.push(marker);
    });
  }, [filtered]);

  const focusProject = (idx) => {
    const p = filtered[idx];
    if (!p || !mapInstance.current) return;
    mapInstance.current.flyTo([p.lat, p.lng], 15, { duration: 0.6 });
    if (markersRef.current[idx]) markersRef.current[idx].openPopup();
    setSelected(idx);
    if (mob) setPanelOpen(false);
  };

  // 매물 조회
  // 클라이언트 캐시
  const articleCacheRef = useRef({});

  const fetchArticles = async (p, tradTp) => {
    const ck = `${p.lat}_${p.lng}_${tradTp}`;
    if (articleCacheRef.current[ck]) {
      setArticles(articleCacheRef.current[ck]);
      setShowArticles(true);
      setArticleTarget(p.name);
      return;
    }
    setArticlesLoading(true);
    setShowArticles(true);
    setArticleTarget(p.name);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(`/api/naver-land?lat=${p.lat}&lng=${p.lng}&tradTp=${tradTp}&z=15`, { signal: ctrl.signal });
      clearTimeout(timer);
      const json = await res.json();
      const items = json.success ? (json.articles || []) : [];
      articleCacheRef.current[ck] = items;
      setArticles(items);
    } catch (_) {
      clearTimeout(timer);
      setArticles([]);
    } finally {
      setArticlesLoading(false);
    }
  };

  // 매물 마커 그리기
  useEffect(() => {
    const L = window.L;
    const map = mapInstance.current;
    if (!L || !map) return;
    articleMarkersRef.current.forEach(m => map.removeLayer(m));
    articleMarkersRef.current = [];

    if (!showArticles) return;

    articles.forEach(a => {
      if (!a.lat || !a.lng) return;
      const tradColor = a.trade === "매매" ? "#FF4757" : a.trade === "전세" ? "#0066FF" : "#FFA502";
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:18px;height:18px;border-radius:3px;background:${tradColor};border:1.5px solid rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.4)">${a.trade === "매매" ? "매" : a.trade === "전세" ? "전" : "월"}</div>`,
        iconSize: [18, 18], iconAnchor: [9, 9]
      });
      const popup = `
        <div style="font-family:'Noto Sans KR',sans-serif;padding:10px;min-width:200px;background:#131729;color:#E8ECF4;border-radius:8px;font-size:12px">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px">${a.name || a.complex}</div>
          <div style="color:#8B92A5;font-size:11px;margin-bottom:8px">${a.type} · ${a.trade}</div>
          <div style="font-size:16px;font-weight:800;color:${tradColor};margin-bottom:6px">${a.price}${a.deposit && a.deposit !== "0" ? " / " + a.deposit : ""}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:10px;color:#C5CAD6">
            ${a.area2 ? `<span>전용 ${a.area2}㎡</span>` : ""}
            ${a.floor ? `<span>${a.floor}</span>` : ""}
            ${a.direction ? `<span>${a.direction}</span>` : ""}
          </div>
          ${a.desc ? `<div style="margin-top:6px;font-size:10px;color:#8B92A5">${a.desc}</div>` : ""}
          ${a.link ? `<a href="https://search.naver.com/search.naver?query=${encodeURIComponent((a.name||a.complex)+' 아파트 매물')}" target="_blank" style="display:inline-block;margin-top:8px;font-size:11px;color:#0066FF;text-decoration:none">네이버 부동산에서 보기 →</a>` : ""}
        </div>`;
      const marker = L.marker([a.lat, a.lng], { icon }).addTo(map).bindPopup(popup, { maxWidth: 250, className: "redev-popup" });
      articleMarkersRef.current.push(marker);
    });
  }, [articles, showArticles]);

  const types = ["all", "재건축", "재개발", "재정비촉진", "모아타운"];

  const s = {
    page: { paddingTop: 60, minHeight: "100vh", background: C.dark, position: "relative" },
    mapWrap: { position: "relative", height: mob ? "50vh" : "calc(100vh - 60px)", display: "flex" },
    map: { flex: 1, background: "#0a0e17", position: "relative" },
    filterBar: { position: "absolute", top: 12, left: 12, right: mob ? 12 : 392, zIndex: 500, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" },
    filterBtn: (active, type) => {
      const base = { padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif", transition: "all .2s", whiteSpace: "nowrap" };
      if (!active) return { ...base, background: "rgba(17,23,41,.85)", backdropFilter: "blur(8px)", color: "#8B92A5" };
      if (type === "all") return { ...base, background: "linear-gradient(135deg,#FF6B35,#00D68F)", color: "#fff", border: "1px solid transparent" };
      const c = REDEV_COLORS[type];
      return { ...base, background: c ? c.color : C.primary, color: "#fff", border: "1px solid transparent", boxShadow: c ? `0 0 14px ${c.glow}` : "none" };
    },
    searchInput: { padding: "6px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", background: "rgba(17,23,41,.85)", backdropFilter: "blur(8px)", color: "#E8ECF4", fontSize: 12, fontFamily: "'Noto Sans KR',sans-serif", outline: "none", width: mob ? "100%" : 180 },
    statsBar: { position: "absolute", bottom: 12, left: 12, zIndex: 500, display: "flex", gap: 10, alignItems: "center" },
    statBadge: { background: "rgba(17,23,41,.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "8px 14px", display: "flex", flexDirection: "column", alignItems: "center" },
    statVal: { fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 16, color: "#E8ECF4" },
    statLbl: { fontSize: 9, color: "#8B92A5", letterSpacing: 1, textTransform: "uppercase" },
    panel: { width: mob ? "100%" : 380, height: mob ? "50vh" : "calc(100vh - 60px)", background: C.darkCard, borderLeft: mob ? "none" : `1px solid ${C.darkBorder}`, borderTop: mob ? `1px solid ${C.darkBorder}` : "none", overflowY: "auto", flexShrink: 0 },
    panelHead: { padding: "16px 18px", borderBottom: `1px solid ${C.darkBorder}`, position: "sticky", top: 0, background: C.darkCard, zIndex: 5, display: "flex", justifyContent: "space-between", alignItems: "center" },
    card: (isActive) => ({ padding: "12px 14px", borderRadius: 10, border: isActive ? `1px solid rgba(255,255,255,.12)` : "1px solid transparent", cursor: "pointer", transition: "all .15s", marginBottom: 3, background: isActive ? "rgba(255,255,255,.04)" : "transparent" }),
    cardName: { fontSize: 13, fontWeight: 600, color: "#E8ECF4" },
    cardDistrict: { fontSize: 10, color: "#8B92A5", background: "rgba(255,255,255,.04)", padding: "1px 7px", borderRadius: 4 },
    dot: (type) => { const c = REDEV_COLORS[type]; return { width: 7, height: 7, borderRadius: "50%", background: c ? c.color : "#666", boxShadow: c ? `0 0 5px ${c.glow}` : "none", flexShrink: 0 }; },
    meta: { fontSize: 10, color: "#8B92A5" },
    metaLabel: { color: "#5a6480", marginRight: 3 },
    detail: { padding: 16, background: "rgba(255,255,255,.02)", borderBottom: `1px solid ${C.darkBorder}` },
    detailName: { fontSize: 16, fontWeight: 700, marginBottom: 3 },
    detailDistrict: { fontSize: 12, color: "#8B92A5", marginBottom: 14 },
    detailGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 },
    detailStat: { background: "rgba(255,255,255,.03)", padding: "10px 12px", borderRadius: 9 },
    detailStatLabel: { fontSize: 9, color: "#8B92A5", letterSpacing: .5, textTransform: "uppercase", marginBottom: 3 },
    detailStatVal: { fontSize: 14, fontWeight: 600 },
    detailDesc: (type) => { const c = REDEV_COLORS[type]; return { fontSize: 12, lineHeight: 1.7, color: "#C5CAD6", padding: "10px 12px", background: "rgba(255,255,255,.02)", borderRadius: 9, borderLeft: `3px solid ${c ? c.color : "#666"}` }; },
    legend: { display: "flex", gap: 10, flexWrap: "wrap" },
    legendItem: { display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#8B92A5" },
    legendDot: (type) => { const c = REDEV_COLORS[type]; return { width: 6, height: 6, borderRadius: "50%", background: c ? c.color : "#666" }; },
    toggleBtn: { position: "absolute", top: 12, right: 12, zIndex: 600, background: "rgba(17,23,41,.9)", backdropFilter: "blur(8px)", border: `1px solid ${C.darkBorder}`, borderRadius: 10, padding: "8px 12px", color: "#E8ECF4", cursor: "pointer", fontSize: 12, fontFamily: "'Noto Sans KR',sans-serif", display: mob ? "block" : "none" },
  };

  return (
    <div style={s.page}>
      <style>{`
        .redev-popup .leaflet-popup-content-wrapper{background:${C.darkCard}!important;border:1px solid ${C.darkBorder}!important;border-radius:12px!important;box-shadow:0 8px 32px rgba(0,0,0,.5)!important;padding:0!important;color:#E8ECF4!important}
        .redev-popup .leaflet-popup-content{margin:0!important}
        .redev-popup .leaflet-popup-tip{background:${C.darkCard}!important;border:1px solid ${C.darkBorder}!important}
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
      `}</style>

      <div style={s.mapWrap}>
        {/* Map */}
        <div style={s.map}>
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

          {/* Filter */}
          <div style={s.filterBar}>
            {types.map(t => (
              <button key={t} style={s.filterBtn(filter === t, t)} onClick={() => setFilter(t)}>
                {t === "all" ? "전체" : t}
              </button>
            ))}
            <input
              type="text" placeholder="🔍 구역명 검색..." style={s.searchInput}
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Stats */}
          <div style={s.statsBar}>
            <div style={s.statBadge}>
              <div style={s.statVal}>{filtered.length}</div>
              <div style={s.statLbl}>구역</div>
            </div>
            <div style={s.statBadge}>
              <div style={s.statVal}>{totalUnits.toLocaleString()}</div>
              <div style={s.statLbl}>세대</div>
            </div>
            <div style={{ ...s.statBadge, flexDirection: "row", gap: 8 }}>
              {Object.entries(REDEV_COLORS).map(([t, c]) => (
                <div key={t} style={s.legendItem}>
                  <div style={s.legendDot(t)} />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile toggle */}
          {mob && (
            <button style={s.toggleBtn} onClick={() => setPanelOpen(v => !v)}>
              {panelOpen ? "지도 보기 ▲" : `목록 보기 ▼ (${filtered.length})`}
            </button>
          )}
        </div>

        {/* Panel */}
        {(!mob || panelOpen) && (
          <div style={s.panel}>
            {/* Detail */}
            {selected !== null && filtered[selected] && (() => {
              const p = filtered[selected];
              const c = REDEV_COLORS[p.type];
              return (
                <div style={s.detail}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "inline-block", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: c?.bg, color: c?.color, marginBottom: 6, letterSpacing: 1 }}>{p.type}</div>
                      <div style={s.detailName}>{p.name}</div>
                      <div style={s.detailDistrict}>{p.district} {p.dong}</div>
                    </div>
                    <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#8B92A5", fontSize: 16, cursor: "pointer", padding: 4 }}>✕</button>
                  </div>
                  <div style={s.detailGrid}>
                    <div style={s.detailStat}><div style={s.detailStatLabel}>세대수</div><div style={{ ...s.detailStatVal, color: c?.color }}>{p.units.toLocaleString()}</div></div>
                    <div style={s.detailStat}><div style={s.detailStatLabel}>현재 단계</div><div style={s.detailStatVal}>{p.stage}</div></div>
                    <div style={s.detailStat}><div style={s.detailStatLabel}>사업비</div><div style={s.detailStatVal}>{p.cost}</div></div>
                    <div style={s.detailStat}><div style={s.detailStatLabel}>현황</div><div style={s.detailStatVal}>{p.status}</div></div>
                  </div>
                  <div style={s.detailDesc(p.type)}>{p.desc}</div>
                  {/* 매물 조회 버튼 */}
                  <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[
                      { label: "전체 매물", val: "A1:B1:B2" },
                      { label: "매매", val: "A1" },
                      { label: "전세", val: "B1" },
                      { label: "월세", val: "B2" },
                    ].map(t => (
                      <button key={t.val} onClick={() => { setTradFilter(t.val); fetchArticles(p, t.val); }}
                        style={{ padding: "6px 12px", borderRadius: 8, border: tradFilter === t.val && showArticles ? "1px solid " + C.primary : `1px solid ${C.darkBorder}`, background: tradFilter === t.val && showArticles ? "rgba(0,102,255,.12)" : "rgba(255,255,255,.03)", color: tradFilter === t.val && showArticles ? C.primary : "#C5CAD6", fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" }}>
                        {t.label}
                      </button>
                    ))}
                    {showArticles && (
                      <button onClick={() => { setShowArticles(false); setArticles([]); }}
                        style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid rgba(255,71,87,.2)`, background: "rgba(255,71,87,.08)", color: "#FF4757", fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" }}>
                        매물 숨기기
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            <div style={s.panelHead}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>정비사업 구역 목록</div>
                <div style={{ fontSize: 11, color: "#8B92A5" }}>{filtered.length}개 구역 · {totalUnits.toLocaleString()}세대</div>
              </div>
            </div>

            {/* 매물 결과 */}
            {showArticles && (
              <div style={{ borderBottom: `1px solid ${C.darkBorder}` }}>
                <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,102,255,.04)" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>📍 {articleTarget} 주변 매물</div>
                    <div style={{ fontSize: 11, color: "#8B92A5" }}>
                      {articlesLoading ? "조회 중..." : `${articles.length}건`}
                      <span style={{ marginLeft: 8, fontSize: 10 }}>
                        <span style={{ color: "#FF4757" }}>●</span> 매매 &nbsp;
                        <span style={{ color: "#0066FF" }}>●</span> 전세 &nbsp;
                        <span style={{ color: "#FFA502" }}>●</span> 월세
                      </span>
                    </div>
                  </div>
                </div>
                {articlesLoading ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#8B92A5", fontSize: 13 }}>
                    <div style={{ display: "inline-block", width: 20, height: 20, border: "2px solid #8B92A5", borderTopColor: C.primary, borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 8 }} />
                    <div>매물 조회 중...</div>
                  </div>
                ) : articles.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: "#8B92A5", fontSize: 12 }}>주변 매물이 없습니다</div>
                ) : (
                  <div style={{ maxHeight: 300, overflowY: "auto", padding: 6 }}>
                    {articles.slice(0, 30).map((a, i) => {
                      const tradColor = a.trade === "매매" ? "#FF4757" : a.trade === "전세" ? "#0066FF" : "#FFA502";
                      return (
                        <div key={i} style={{ padding: "10px 12px", borderRadius: 8, marginBottom: 3, cursor: "pointer", transition: "background .15s" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.04)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          onClick={() => { if (a.lat && a.lng && mapInstance.current) { mapInstance.current.flyTo([a.lat, a.lng], 17, { duration: 0.5 }); const m = articleMarkersRef.current[i]; if (m) m.openPopup(); } }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: tradColor, padding: "1px 6px", borderRadius: 3 }}>{a.trade}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#E8ECF4", flex: 1 }}>{a.name || a.complex}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 6, paddingLeft: 0 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: tradColor }}>{a.price}</span>
                            {a.deposit && a.deposit !== "0" && <span style={{ fontSize: 12, color: "#C5CAD6" }}>/ {a.deposit}</span>}
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 3, fontSize: 10, color: "#8B92A5" }}>
                            {a.area2 && <span>전용 {a.area2}㎡</span>}
                            {a.floor && <span>{a.floor}</span>}
                            {a.direction && <span>{a.direction}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div style={{ padding: 6 }}>
              {filtered.map((p, i) => {
                const c = REDEV_COLORS[p.type];
                return (
                  <div key={i} style={s.card(selected === i)} onClick={() => focusProject(i)}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
                    onMouseLeave={e => { if (selected !== i) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={s.dot(p.type)} />
                      <div style={s.cardName}>{p.name}</div>
                      <div style={s.cardDistrict}>{p.district}</div>
                    </div>
                    <div style={{ display: "flex", gap: 10, paddingLeft: 15 }}>
                      <span style={s.meta}><span style={s.metaLabel}>세대</span>{p.units.toLocaleString()}</span>
                      <span style={s.meta}><span style={s.metaLabel}>단계</span>{p.stage}</span>
                      {p.cost !== "-" && <span style={s.meta}><span style={s.metaLabel}>사업비</span>{p.cost}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   LISTINGS PAGE — 네이버부동산 매물 검색
   ================================================================ */
const LISTING_DISTRICTS = {
  "강남구":{lat:37.5172,lng:127.0473,code:"1168000000"},
  "강동구":{lat:37.5301,lng:127.1238,code:"1174000000"},
  "강북구":{lat:37.6397,lng:127.0255,code:"1130500000"},
  "강서구":{lat:37.5510,lng:126.8495,code:"1150000000"},
  "관악구":{lat:37.4784,lng:126.9516,code:"1162000000"},
  "광진구":{lat:37.5385,lng:127.0823,code:"1121500000"},
  "구로구":{lat:37.4955,lng:126.8876,code:"1153000000"},
  "금천구":{lat:37.4568,lng:126.8956,code:"1154500000"},
  "노원구":{lat:37.6542,lng:127.0568,code:"1135000000"},
  "도봉구":{lat:37.6688,lng:127.0472,code:"1132000000"},
  "동대문구":{lat:37.5744,lng:127.0396,code:"1123000000"},
  "동작구":{lat:37.5124,lng:126.9393,code:"1159000000"},
  "마포구":{lat:37.5664,lng:126.9014,code:"1144000000"},
  "서대문구":{lat:37.5791,lng:126.9368,code:"1141000000"},
  "서초구":{lat:37.4837,lng:127.0324,code:"1165000000"},
  "성동구":{lat:37.5634,lng:127.0370,code:"1120000000"},
  "성북구":{lat:37.5894,lng:127.0167,code:"1129000000"},
  "송파구":{lat:37.5146,lng:127.1060,code:"1171000000"},
  "양천구":{lat:37.5170,lng:126.8664,code:"1147000000"},
  "영등포구":{lat:37.5264,lng:126.8963,code:"1156000000"},
  "용산구":{lat:37.5326,lng:126.9906,code:"1117000000"},
  "은평구":{lat:37.6027,lng:126.9292,code:"1138000000"},
  "종로구":{lat:37.5735,lng:126.9790,code:"1111000000"},
  "중구":{lat:37.5641,lng:126.9979,code:"1114000000"},
  "중랑구":{lat:37.6066,lng:127.0927,code:"1126000000"},
};

function ListingsPage() {
  const mob = useWindowSize() < 768;
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const mkRef = useRef([]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [district, setDistrict] = useState("강남구");
  const [tradFilter, setTradFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  // Fetch JSON data (from Pi cron job)
  useEffect(() => {
    fetch("./data/naver-listings.json")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Init map (data 로드 후 실행)
  useEffect(() => {
    if (loading || !data) return;
    if (!mapRef.current || mapInst.current) return;
    const L = window.L;
    if (!L) return;
    const map = L.map(mapRef.current, { center: [37.5665, 126.978], zoom: 12, zoomControl: false });
    L.control.zoom({ position: "topright" }).addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; CARTO", subdomains: "abcd", maxZoom: 19
    }).addTo(map);
    mapInst.current = map;
    return () => { map.remove(); mapInst.current = null; };
  }, [loading, data]);

  const districtData = data?.districts?.[district];
  const articles = useMemo(() => {
    if (!districtData) return [];
    let arr = [...(districtData.articles || [])];
    if (tradFilter !== "all") arr = arr.filter(a => a.trade === tradFilter);
    const pn = s => parseFloat(String(s).replace(/[^0-9.]/g, "")) || 0;
    if (sortBy === "priceAsc") arr.sort((a, b) => pn(a.price) - pn(b.price));
    else if (sortBy === "priceDesc") arr.sort((a, b) => pn(b.price) - pn(a.price));
    else if (sortBy === "areaDesc") arr.sort((a, b) => parseFloat(b.area2 || 0) - parseFloat(a.area2 || 0));
    else if (sortBy === "areaAsc") arr.sort((a, b) => parseFloat(a.area2 || 0) - parseFloat(b.area2 || 0));
    return arr;
  }, [districtData, tradFilter, sortBy]);

  const stats = useMemo(() => {
    if (!districtData) return { total: 0, sale: 0, lease: 0, rent: 0 };
    return { total: districtData.count || 0, sale: districtData.sale || 0, lease: districtData.lease || 0, rent: districtData.rent || 0 };
  }, [districtData]);

  // Update markers when district changes
  useEffect(() => {
    const drawMarkers = () => {
      const L = window.L;
      const map = mapInst.current;
      if (!L || !map || !districtData) return;

      map.flyTo([districtData.lat, districtData.lng], 14, { duration: 0.6 });
      mkRef.current.forEach(m => map.removeLayer(m));
      mkRef.current = [];

      articles.forEach((a, i) => {
        if (!a.lat || !a.lng) return;
        const tc = a.trade === "매매" ? "#FF4757" : a.trade === "전세" ? "#0066FF" : "#FFA502";
        const lbl = a.trade === "매매" ? "매" : a.trade === "전세" ? "전" : "월";
        const icon = L.divIcon({
          className: "",
          html: `<div style="min-width:42px;padding:2px 6px;border-radius:6px;background:${tc};color:#fff;font-size:10px;font-weight:700;font-family:'Noto Sans KR',sans-serif;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.4);white-space:nowrap;border:1.5px solid rgba(255,255,255,.5)">${lbl} ${(a.price || "").split(" ")[0]}</div>`,
          iconSize: [50, 20], iconAnchor: [25, 10]
        });
        const popup = `<div style="font-family:'Noto Sans KR',sans-serif;padding:12px;min-width:220px;background:#131729;color:#E8ECF4;border-radius:8px">
          <div style="font-weight:700;font-size:14px;margin-bottom:2px">${a.name || a.complex}</div>
          <div style="color:#8B92A5;font-size:11px;margin-bottom:8px">${a.type} · ${a.trade}</div>
          <div style="font-size:18px;font-weight:800;color:${tc};margin-bottom:6px">${a.price}${a.deposit && a.deposit !== "0" ? " / " + a.deposit : ""}</div>
          <div style="display:flex;gap:10px;font-size:11px;color:#C5CAD6;flex-wrap:wrap">
            ${a.area2 ? `<span>전용 ${a.area2}㎡</span>` : ""}${a.floor ? `<span>${a.floor}</span>` : ""}${a.direction ? `<span>${a.direction}</span>` : ""}
          </div>
          ${a.desc ? `<div style="margin-top:6px;font-size:11px;color:#8B92A5">${a.desc}</div>` : ""}
          ${a.link ? `<a href="https://search.naver.com/search.naver?query=${encodeURIComponent((a.name||a.complex)+' 아파트 매물')}" target="_blank" style="display:inline-block;margin-top:8px;font-size:11px;color:#0066FF;text-decoration:none">네이버 부동산에서 보기 →</a>` : ""}
        </div>`;
        const marker = L.marker([a.lat, a.lng], { icon }).addTo(map).bindPopup(popup, { maxWidth: 270, className: "redev-popup" });
        mkRef.current.push(marker);
      });
    };
    // 지도 초기화 직후면 약간 딜레이
    if (mapInst.current) drawMarkers();
    else setTimeout(drawMarkers, 300);
  }, [articles, districtData]);

  const cardS = { background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 14, overflow: "hidden" };
  const pillS = (active, color) => ({ padding: "6px 14px", borderRadius: 20, border: active ? "1px solid transparent" : `1px solid ${C.darkBorder}`, background: active ? (color || C.primary) : "transparent", color: active ? "#fff" : "#8B92A5", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif", transition: "all .15s", whiteSpace: "nowrap" });

  if (loading) return (
    <div style={{ paddingTop: 120, minHeight: "100vh", background: C.dark, textAlign: "center" }}>
      <div style={{ display: "inline-block", width: 32, height: 32, border: "3px solid #2A3050", borderTopColor: C.primary, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <div style={{ color: "#8B92A5", marginTop: 12, fontSize: 14 }}>매물 데이터 로딩 중...</div>
    </div>
  );

  if (!data) return (
    <div style={{ paddingTop: 120, minHeight: "100vh", background: C.dark, textAlign: "center" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🏠</div>
      <div style={{ color: "#8B92A5", fontSize: 14 }}>매물 데이터를 불러올 수 없습니다</div>
      <div style={{ color: "#5a6480", fontSize: 12, marginTop: 4 }}>데이터 수집이 아직 진행되지 않았을 수 있습니다</div>
    </div>
  );

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh", background: C.dark }}>
      <style>{`
        .redev-popup .leaflet-popup-content-wrapper{background:${C.darkCard}!important;border:1px solid ${C.darkBorder}!important;border-radius:12px!important;box-shadow:0 8px 32px rgba(0,0,0,.5)!important;padding:0!important;color:#E8ECF4!important}
        .redev-popup .leaflet-popup-content{margin:0!important}
        .redev-popup .leaflet-popup-tip{background:${C.darkCard}!important;border:1px solid ${C.darkBorder}!important}
      `}</style>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: mob ? "0 12px" : "0 24px" }}>
        {/* Header */}
        <div className="ani" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: mob ? 22 : 28, fontWeight: 800, fontFamily: "'Outfit','Noto Sans KR',sans-serif" }}>
                <Search size={mob ? 22 : 26} style={{ verticalAlign: "middle", marginRight: 8, color: C.primary }} />
                매물<span style={{ color: C.primary }}>검색</span>
              </div>
              <div style={{ fontSize: 13, color: C.darkText, marginTop: 2 }}>네이버 부동산 매물 · 갱신: {data.updated_display || "알 수 없음"}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ fontSize: 11, color: "#8B92A5", background: "rgba(0,102,255,.08)", padding: "4px 10px", borderRadius: 6 }}>
                전체 {data.summary?.total_articles?.toLocaleString() || 0}건
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="ani d1" style={{ ...cardS, padding: mob ? 14 : 18, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
            <select value={district} onChange={e => setDistrict(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.darkBorder}`, background: C.darkCard, color: "#E8ECF4", fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", cursor: "pointer", outline: "none", minWidth: 120 }}>
              {Object.keys(LISTING_DISTRICTS).map(d => {
                const dd = data.districts?.[d];
                return <option key={d} value={d}>{d} ({dd?.count || 0})</option>;
              })}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.darkBorder}`, background: C.darkCard, color: "#E8ECF4", fontSize: 13, fontFamily: "'Noto Sans KR',sans-serif", cursor: "pointer", outline: "none" }}>
              <option value="default">기본순</option>
              <option value="priceAsc">가격 낮은순</option>
              <option value="priceDesc">가격 높은순</option>
              <option value="areaDesc">면적 큰순</option>
              <option value="areaAsc">면적 작은순</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { label: "전체", val: "all" },
              { label: `매매 ${stats.sale}`, val: "매매", color: "#FF4757" },
              { label: `전세 ${stats.lease}`, val: "전세", color: "#0066FF" },
              { label: `월세 ${stats.rent}`, val: "월세", color: "#FFA502" },
            ].map(t => (
              <button key={t.val} style={pillS(tradFilter === t.val, t.color)} onClick={() => setTradFilter(t.val)}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Map + List */}
        <div style={{ display: "flex", gap: 16, flexDirection: mob ? "column" : "row" }}>
          {/* Map */}
          <div className="ani d2" style={{ ...cardS, flex: mob ? "none" : 1, height: mob ? 300 : 560 }}>
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
          </div>

          {/* List */}
          <div className="ani d3" style={{ ...cardS, width: mob ? "100%" : 400, flexShrink: 0, display: "flex", flexDirection: "column", maxHeight: mob ? "none" : 560 }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.darkBorder}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{district}</span>
                <span style={{ fontSize: 12, color: C.primary, fontWeight: 700 }}>{articles.length}건</span>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 6 }}>
              {articles.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🏠</div>
                  <div style={{ fontSize: 13, color: "#8B92A5" }}>해당 조건의 매물이 없습니다</div>
                </div>
              ) : articles.map((a, i) => {
                const tc = a.trade === "매매" ? "#FF4757" : a.trade === "전세" ? "#0066FF" : "#FFA502";
                return (
                  <div key={a.id || i} style={{ padding: "12px 14px", borderRadius: 10, marginBottom: 4, cursor: "pointer", transition: "background .15s", borderLeft: `3px solid ${tc}` }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    onClick={() => { if (a.lat && a.lng && mapInst.current) { mapInst.current.flyTo([a.lat, a.lng], 17, { duration: 0.5 }); const m = mkRef.current[i]; if (m) setTimeout(() => m.openPopup(), 600); } }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: tc, padding: "1px 7px", borderRadius: 4 }}>{a.trade}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#E8ECF4", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name || a.complex || "매물"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 17, fontWeight: 800, color: tc }}>{a.price}</span>
                      {a.deposit && a.deposit !== "0" && <span style={{ fontSize: 12, color: "#C5CAD6" }}>/ {a.deposit}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#8B92A5", flexWrap: "wrap" }}>
                      {a.type && <span>{a.type}</span>}
                      {a.area2 && <span>전용 {a.area2}㎡</span>}
                      {a.floor && <span>{a.floor}</span>}
                      {a.direction && <span>{a.direction}</span>}
                    </div>
                    {a.link && (
                      <a href={`https://search.naver.com/search.naver?query=${encodeURIComponent((a.name || a.complex) + ' 아파트 매물')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 6, fontSize: 11, color: C.primary, textDecoration: "none" }}>
                        네이버 부동산 <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  const mob = useWindowSize() < 768;
  return (
    <footer style={{ borderTop: `1px solid ${C.darkBorder}`, padding: mob ? "28px 16px" : "40px 24px", marginTop: 40 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, flexDirection: mob ? "column" : "row" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: C.gradient1, display: "flex", alignItems: "center", justifyContent: "center" }}><Building2 size={12} color="white" /></div>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 14 }}>부동산<span style={{ color: C.primary }}>Valley</span></span>
        </div>
        <div style={{ fontSize: 12, color: C.darkText, textAlign: mob ? "center" : "right" }}>국토교통부 실거래가 API 기반 · © 2025 부동산Valley</div>
      </div>
    </footer>
  );
}

/* ================================================================
   APP
   ================================================================ */
export default function App() {
  const [authed, setAuthed] = useState(false);
  const [page, setPage] = useState("home");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try { if (sessionStorage.getItem(STORAGE_KEY) === "true") setAuthed(true); } catch (_) {}
    setChecking(false);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);

  const logout = () => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (_) {}
    setAuthed(false); setPage("home");
  };

  if (checking) return null;
  if (!authed) return (<><style>{globalStyles}</style><LoginPage onAuth={() => setAuthed(true)} /></>);

  return (
    <>
      <style>{globalStyles}</style>
      <Nav currentPage={page} setCurrentPage={setPage} onLogout={logout} />
      {page === "home" && <LandingPage setCurrentPage={setPage} />}
      {page === "dashboard" && <DashboardPage />}
      {page === "calculator" && <CalculatorPage />}
      {page === "analysis" && <AnalysisPage />}
      {page === "redevelop" && <RedevelopmentMapPage />}
      {page === "listings" && <ListingsPage />}
      {page === "news" && <NewsPage />}
      {page === "prediction" && <PredictionPage />}
      <Footer />
    </>
  );
}
