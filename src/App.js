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
  Newspaper, Brain, ExternalLink, Clock, TrendingDown, Play, Search
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
function DashboardPage() {
  const mob = useWindowSize() < 768;
  const [sel, setSel] = useState("강남구");
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
          const FALLBACK_CHANNELS = [
            {
              channel: "부읽남TV", subs: "123만", color: "#3b82f6", avatar: "부",
              link: "https://www.youtube.com/@부읽남TV",
              videos: [
                { date: "2026.02", title: "10·15 대책 이후 3개월, 서울 부동산 실제 변화", summary: "투기과열지구 지정 후 거래량 감소했으나 핵심 입지 실거래가는 소폭 상승. 대출 규제로 매수 진입 어려워졌지만 매물 잠김 현상으로 가격 하방 경직. 급매물 포착 전략 유효.", tag: "정책분석", link: "https://www.youtube.com/@부읽남TV" },
                { date: "2026.01", title: "2026 부동산 시장 흐름과 정책 방향", summary: "주산연 보고서 기반 분석. 서울·수도권 매매가 상승 전망, 입주물량 감소로 전월세 난 가능성. 금리 인하 기대 있으나 DSR 강화로 대출 여건 개선 제한적.", tag: "시장전망", link: "https://www.youtube.com/@부읽남TV" },
                { date: "2025.12", title: "2026년 달라지는 부동산 제도 총정리", summary: "주담대 위험가중치 상향(15→20%), 외국인 거래 관리 강화, 비수도권 미분양 양도세 완화 연장, 다주택자 양도세 중과 배제 2026.5월 종료 예정.", tag: "제도변경", link: "https://www.youtube.com/@부읽남TV" },
              ]
            },
            {
              channel: "월급쟁이부자들TV", subs: "149만", color: "#10b981", avatar: "월",
              link: "https://www.youtube.com/@월급쟁이부자들TV",
              videos: [
                { date: "2026.02", title: "구리시 잠실 20분 생활권, 저평가 아파트 분석", summary: "구리시 핵심 입지 분석. 8호선 연장 수혜지역, 잠실·강남 접근성 대비 가격 갭이 큰 아파트 선별. 전세가율 높은 단지 위주 매수 타이밍 제안.", tag: "지역분석", link: "https://www.youtube.com/@월급쟁이부자들TV" },
                { date: "2026.01", title: "2026 부동산 투자, 무주택자가 반드시 알아야 할 것", summary: "금리 인하 기대와 실제 대출 환경 괴리 설명. 스트레스 DSR로 대출한도 축소된 상황에서 자금계획 수립법. 전세가율·입지·공급량 체크리스트 제공.", tag: "투자전략", link: "https://www.youtube.com/@월급쟁이부자들TV" },
                { date: "2025.12", title: "서울 아파트, 지금 사도 될까? 2030 내집마련 로드맵", summary: "2030세대 소득 대비 내집마련 전략. 청약 vs 매매 비교분석, 생애최초 특별공급 활용법, 3년 내 내집마련 실행 플랜 제시.", tag: "내집마련", link: "https://www.youtube.com/@월급쟁이부자들TV" },
              ]
            },
          ];

          // eslint-disable-next-line
          const [ytChannels, setYtChannels] = React.useState(FALLBACK_CHANNELS);
          const [ytUpdated, setYtUpdated] = React.useState("수동 입력");
          // eslint-disable-next-line
          React.useEffect(() => {
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
      {page === "news" && <NewsPage />}
      {page === "prediction" && <PredictionPage />}
      <Footer />
    </>
  );
}
