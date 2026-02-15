import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Home, TrendingUp, Calculator, MapPin, ChevronRight, ArrowUpRight, ArrowDownRight, Building2, DollarSign, Percent, Lock, X, Search, BarChart3, PiggyBank, FileText, Star, Users, Award, ChevronDown, ExternalLink, Shield, Zap, Target, ArrowRight, Eye, EyeOff, Sparkles, LogOut } from "lucide-react";

// ============================================================
// CONFIG - 초대 코드 변경은 여기서
// ============================================================
const INVITE_CODE = "VALLEY2025";
const STORAGE_KEY = "rv_authenticated";

// ============================================================
// DATA
// ============================================================
const DISTRICTS = ["강남구","서초구","송파구","마포구","용산구","성동구","광진구","영등포구","강동구","노원구","강서구","양천구","은평구","중구","종로구"];

const generateTransactionData = () => {
  const data = [];
  const basePrice = {"강남구":24,"서초구":21,"송파구":18,"마포구":14,"용산구":17,"성동구":13,"광진구":12,"영등포구":11,"강동구":13,"노원구":7,"강서구":9,"양천구":10,"은평구":7,"중구":12,"종로구":13};
  for (let year = 2020; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      DISTRICTS.forEach(d => {
        const base = basePrice[d];
        const trend = (year - 2020) * 0.8 + Math.sin((month + year * 12) * 0.3) * 1.5;
        const noise = (Math.random() - 0.5) * 2;
        data.push({ district: d, year, month, date: `${year}-${String(month).padStart(2,'0')}`, price: Math.round((base + trend + noise) * 1000) / 1000, volume: Math.floor(Math.random() * 800 + 200), area: Math.floor(Math.random() * 50 + 59) });
      });
    }
  }
  return data;
};

const MONTHLY_TREND = (() => {
  const arr = [];
  for (let y = 2020; y <= 2025; y++) {
    for (let m = 1; m <= 12; m++) {
      const base = 15 + (y - 2020) * 1.2 + Math.sin((m + y * 12) * 0.25) * 1.8;
      arr.push({ date: `${y}.${String(m).padStart(2,'0')}`, price: Math.round(base * 100) / 100, volume: Math.floor(Math.random() * 5000 + 3000) });
    }
  }
  return arr;
})();

const DISTRICT_SUMMARY = DISTRICTS.map(d => {
  const base = {"강남구":26,"서초구":23,"송파구":19,"마포구":15,"용산구":18,"성동구":14,"광진구":13,"영등포구":12,"강동구":14,"노원구":8,"강서구":10,"양천구":11,"은평구":8,"중구":13,"종로구":14};
  const p = base[d];
  const change = (Math.random() * 8 - 2).toFixed(1);
  return { name: d, avgPrice: p, change: parseFloat(change), volume: Math.floor(Math.random() * 3000 + 500), avgArea: Math.floor(Math.random() * 30 + 60) };
});

const C = {
  primary: "#0066FF", primaryLight: "#E8F0FE", secondary: "#00D68F", danger: "#FF4757",
  warning: "#FFA502", dark: "#0A0E1A", darkCard: "#131729", darkBorder: "#1E2338",
  darkText: "#8B92A5", darkTextLight: "#C5CAD6", accent1: "#7C5CFC", accent2: "#00B8D9",
  gradient1: "linear-gradient(135deg, #0066FF 0%, #7C5CFC 100%)",
  gradient2: "linear-gradient(135deg, #00D68F 0%, #00B8D9 100%)",
};
const CHART_COLORS = ["#0066FF","#7C5CFC","#00D68F","#FF4757","#FFA502","#00B8D9","#FF6B9D","#C084FC"];

// ============================================================
// GLOBAL STYLES
// ============================================================
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  html{scroll-behavior:smooth;}
  body{font-family:'Noto Sans KR','Outfit',sans-serif;background:${C.dark};color:#E8ECF4;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
  ::selection{background:rgba(0,102,255,0.3);}
  ::-webkit-scrollbar{width:6px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#2A3050;border-radius:3px;}
  @keyframes fadeInUp{from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);}}
  @keyframes fadeScaleIn{from{opacity:0;transform:scale(0.95) translateY(20px);}to{opacity:1;transform:scale(1) translateY(0);}}
  @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
  @keyframes shake{0%,100%{transform:translateX(0);}20%{transform:translateX(-8px);}40%{transform:translateX(8px);}60%{transform:translateX(-5px);}80%{transform:translateX(5px);}}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes gradientSlide{0%{background-position:0% 50%;}100%{background-position:200% 50%;}}
  @keyframes floatGlow{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(30px,-20px) scale(1.05);}66%{transform:translate(-20px,15px) scale(0.95);}}
  .animate-in{animation:fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;}
  .delay-1{animation-delay:0.1s;}.delay-2{animation-delay:0.2s;}.delay-3{animation-delay:0.3s;}.delay-4{animation-delay:0.4s;}.delay-5{animation-delay:0.5s;}
`;

// ============================================================
// LOGIN: Animated Background
// ============================================================
function AnimatedBackground() {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const mouse = useRef({ x: -1000, y: -1000 });
  const raf = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    const count = Math.min(80, Math.floor((w * h) / 15000));
    particles.current = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 0.5, opacity: Math.random() * 0.5 + 0.1, pulse: Math.random() * Math.PI * 2,
    }));
    const handleMouse = e => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", handleMouse);
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.current.forEach((p, i) => {
        p.pulse += 0.01; p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0; if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100,160,255,${p.opacity + Math.sin(p.pulse) * 0.15})`; ctx.fill();
        for (let j = i + 1; j < particles.current.length; j++) {
          const p2 = particles.current[j];
          const dist = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
          if (dist < 140) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.strokeStyle = `rgba(80,140,255,${0.06 * (1 - dist / 140)})`; ctx.lineWidth = 0.5; ctx.stroke(); }
        }
        const mDist = Math.sqrt((p.x - mouse.current.x) ** 2 + (p.y - mouse.current.y) ** 2);
        if (mDist < 200) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 1, 0, Math.PI * 2); ctx.fillStyle = `rgba(0,102,255,${0.3 * (1 - mDist / 200)})`; ctx.fill(); }
      });
      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", handleMouse); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

// ============================================================
// LOGIN PAGE
// ============================================================
function LoginPage({ onAuth }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = useCallback(() => {
    if (!code.trim()) { setError("초대 코드를 입력해주세요"); setShakeKey(k => k + 1); return; }
    setIsLoading(true); setError("");
    setTimeout(() => {
      if (code.trim().toUpperCase() === INVITE_CODE) {
        try { sessionStorage.setItem(STORAGE_KEY, "true"); } catch (e) {}
        onAuth();
      } else {
        setError("유효하지 않은 초대 코드입니다"); setShakeKey(k => k + 1); setIsLoading(false);
      }
    }, 800);
  }, [code, onAuth]);

  return (
    <>
      <AnimatedBackground />
      <div style={{ position: "fixed", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", zIndex: 0, width: 500, height: 500, top: "-10%", left: "-5%", background: "radial-gradient(circle,rgba(0,102,255,0.12),transparent)", animation: "floatGlow 12s ease-in-out infinite" }} />
      <div style={{ position: "fixed", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", zIndex: 0, width: 400, height: 400, bottom: "-10%", right: "-5%", background: "radial-gradient(circle,rgba(124,92,252,0.08),transparent)", animation: "floatGlow 15s ease-in-out infinite reverse" }} />

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1, padding: 24 }}>
        <div style={{
          width: "100%", maxWidth: 420, background: "rgba(19,23,41,0.85)", backdropFilter: "blur(40px) saturate(180%)",
          border: "1px solid rgba(30,35,56,0.8)", borderRadius: 24, padding: "40px 36px 32px",
          position: "relative", overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
          animation: mounted ? "fadeScaleIn 0.8s cubic-bezier(0.16,1,0.3,1) forwards" : "none",
        }}>
          {/* Accent line */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#0066FF,#7C5CFC,#00D68F)", backgroundSize: "200% 100%", animation: "gradientSlide 4s linear infinite" }} />

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: C.gradient1, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(0,102,255,0.25)", flexShrink: 0 }}>
              <Building2 size={28} color="white" strokeWidth={2.5} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em" }}>부동산<span style={{ color: C.primary }}>Valley</span></span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: C.darkText, letterSpacing: "0.04em", textTransform: "uppercase" }}><Shield size={10} />Private Access</span>
            </div>
          </div>

          {/* Heading */}
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>초대 코드 입력</h1>
          <p style={{ fontSize: 14, color: C.darkText, lineHeight: 1.5, marginBottom: 28 }}>초대받은 코드를 입력하여 접속하세요</p>

          {/* Input */}
          <div key={shakeKey} style={{
            display: "flex", alignItems: "center", background: "rgba(10,14,26,0.6)",
            border: `1.5px solid ${error ? "#FF4757" : "rgba(30,35,56,0.9)"}`,
            borderRadius: 14, padding: "0 16px", height: 56, transition: "all 0.3s",
            animation: error && shakeKey > 0 ? "shake 0.5s ease" : "none",
          }}>
            <Lock size={18} style={{ color: C.darkText, marginRight: 12, flexShrink: 0 }} />
            <input
              type={showCode ? "text" : "password"} value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); if (error) setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="초대 코드를 입력하세요" autoComplete="off" spellCheck={false} disabled={isLoading} maxLength={20}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#E8ECF4", fontSize: 16, fontFamily: "'Outfit',sans-serif", fontWeight: 500, letterSpacing: "0.08em", caretColor: C.primary, opacity: isLoading ? 0.5 : 1 }}
            />
            <button onClick={() => setShowCode(!showCode)} tabIndex={-1} style={{ background: "transparent", border: "none", color: "#4A5068", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
              {showCode ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Error */}
          <div style={{ height: error ? 32 : 0, opacity: error ? 1 : 0, marginTop: error ? 8 : 0, overflow: "hidden", transition: "all 0.3s" }}>
            {error && <span style={{ fontSize: 13, color: "#FF4757", fontWeight: 500 }}>{error}</span>}
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={isLoading} style={{
            width: "100%", height: 52, marginTop: 20, background: "linear-gradient(135deg,#0066FF 0%,#4D8FFF 100%)",
            border: "none", borderRadius: 14, color: "white", fontSize: 16, fontWeight: 700,
            fontFamily: "'Noto Sans KR',sans-serif", cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 8px 25px rgba(0,102,255,0.25)", transition: "all 0.3s", opacity: isLoading ? 0.8 : 1,
          }}>
            {isLoading ? <div style={{ width: 22, height: 22, border: "2.5px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> : <>접속하기 <ArrowRight size={18} /></>}
          </button>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 28, paddingTop: 20, borderTop: "1px solid rgba(30,35,56,0.6)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4A5068", fontWeight: 500 }}><Sparkles size={12} />초대 코드가 필요합니다</span>
            <div style={{ width: 1, height: 12, background: "rgba(30,35,56,0.8)" }} />
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4A5068", fontWeight: 500 }}><Shield size={12} />비공개 서비스</span>
          </div>
        </div>
        <div style={{ marginTop: 32, fontSize: 12, color: "#2A3050", textAlign: "center", animation: mounted ? "fadeIn 1s ease 0.5s forwards" : "none", opacity: 0 }}>
          © 2025 부동산Valley · 데이터 기반 부동산 투자 플랫폼
        </div>
      </div>
    </>
  );
}

// ============================================================
// SHARED UI COMPONENTS
// ============================================================
function KPICard({ title, value, unit, change, icon: Icon, color, delay = 0 }) {
  return (
    <div className={`animate-in delay-${delay}`} style={{
      background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 24,
      position: "relative", overflow: "hidden", transition: "all 0.3s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color || C.primary; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.darkBorder; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, background: `radial-gradient(circle,${color || C.primary}08,transparent)` }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color || C.primary}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={color || C.primary} />
        </div>
        <span style={{ fontSize: 13, color: C.darkText, fontWeight: 500 }}>{title}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Outfit',sans-serif", letterSpacing: "-0.02em", marginBottom: 4 }}>
        {value}<span style={{ fontSize: 14, fontWeight: 400, color: C.darkText, marginLeft: 4 }}>{unit}</span>
      </div>
      {change !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: change >= 0 ? C.danger : C.secondary }}>
          {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change >= 0 ? "+" : ""}{change}%
          <span style={{ color: C.darkText, fontWeight: 400, marginLeft: 4 }}>전월 대비</span>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ badge, title, subtitle }) {
  return (
    <div style={{ marginBottom: 40, textAlign: "center" }}>
      {badge && <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,102,255,0.1)", border: "1px solid rgba(0,102,255,0.2)", borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 600, color: C.primary, marginBottom: 16 }}>{badge}</div>}
      <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.3, marginBottom: 12 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 16, color: C.darkText, lineHeight: 1.6, maxWidth: 560, margin: "0 auto" }}>{subtitle}</p>}
    </div>
  );
}

const tooltipStyle = { background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 10, color: "#fff", fontSize: 13 };

// ============================================================
// NAV
// ============================================================
function Nav({ currentPage, setCurrentPage, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 20); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);
  const items = [
    { id: "home", label: "홈", icon: Home },
    { id: "dashboard", label: "실거래가", icon: BarChart3 },
    { id: "calculator", label: "투자계산기", icon: Calculator },
    { id: "analysis", label: "지역분석", icon: MapPin },
  ];
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      background: scrolled ? "rgba(10,14,26,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
      borderBottom: scrolled ? "1px solid rgba(30,35,56,0.6)" : "1px solid transparent",
      transition: "all 0.4s", padding: "0 24px",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setCurrentPage("home")}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.gradient1, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 15px rgba(0,102,255,0.3)" }}>
            <Building2 size={20} color="white" />
          </div>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em" }}>부동산<span style={{ color: C.primary }}>Valley</span></span>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {items.map(item => {
            const Icon = item.icon; const active = currentPage === item.id;
            return (
              <button key={item.id} onClick={() => setCurrentPage(item.id)} style={{
                background: active ? "rgba(0,102,255,0.12)" : "transparent", border: "none",
                color: active ? C.primary : C.darkTextLight, padding: "8px 16px", borderRadius: 10,
                cursor: "pointer", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.2s", fontFamily: "'Noto Sans KR',sans-serif",
              }}
                onMouseEnter={e => { if (!active) { e.target.style.background = "rgba(255,255,255,0.05)"; e.target.style.color = "#fff"; }}}
                onMouseLeave={e => { if (!active) { e.target.style.background = "transparent"; e.target.style.color = C.darkTextLight; }}}
              ><Icon size={16} />{item.label}</button>
            );
          })}
          <button onClick={onLogout} title="로그아웃" style={{
            background: "transparent", border: "1px solid transparent", color: C.darkText,
            padding: "8px 12px", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            fontSize: 13, fontWeight: 500, marginLeft: 8, transition: "all 0.2s", fontFamily: "'Noto Sans KR',sans-serif",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#FF475740"; e.currentTarget.style.color = "#FF4757"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = C.darkText; }}
          ><LogOut size={15} />나가기</button>
        </div>
      </div>
    </nav>
  );
}

// ============================================================
// LANDING PAGE
// ============================================================
function LandingPage({ setCurrentPage }) {
  const features = [
    { icon: BarChart3, title: "실거래가 대시보드", desc: "서울 25개 구의 실거래가 데이터를 시각화하고 트렌드를 분석하세요", color: C.primary },
    { icon: Calculator, title: "투자 계산기", desc: "대출 상환, 취득세, 양도세, 수익률을 한번에 계산하세요", color: C.accent1 },
    { icon: MapPin, title: "지역 분석", desc: "지역별 가격 추이, 거래량, 면적별 분석을 제공합니다", color: C.secondary },
    { icon: TrendingUp, title: "시세 예측", desc: "AI 기반 가격 예측과 트렌드 분석으로 투자 타이밍을 잡으세요", color: C.accent2 },
  ];
  const stats = [
    { label: "분석 가능 지역", value: "25", unit: "개 구" },
    { label: "누적 거래 데이터", value: "120K", unit: "+" },
    { label: "분석 도구", value: "10", unit: "가지+" },
    { label: "데이터 업데이트", value: "실시간", unit: "" },
  ];
  return (
    <div>
      {/* Hero */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "120px 24px 80px" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% -20%,rgba(0,102,255,0.15),transparent)" }} />
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 400, height: 400, background: "radial-gradient(circle,rgba(124,92,252,0.08),transparent)", borderRadius: "50%", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "10%", width: 350, height: 350, background: "radial-gradient(circle,rgba(0,214,143,0.06),transparent)", borderRadius: "50%", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        <div style={{ maxWidth: 800, textAlign: "center", position: "relative", zIndex: 1 }}>
          <div className="animate-in" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,102,255,0.08)", border: "1px solid rgba(0,102,255,0.2)", borderRadius: 24, padding: "8px 20px", marginBottom: 32, fontSize: 14, fontWeight: 500, color: C.primary }}><Zap size={14} />서울 부동산 투자의 새로운 기준</div>
          <h1 className="animate-in delay-1" style={{ fontSize: "clamp(36px,6vw,64px)", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.04em", marginBottom: 24, background: "linear-gradient(135deg,#FFFFFF 0%,#C5CAD6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            근거 있는 부동산 투자의<br /><span style={{ background: C.gradient1, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>첫 걸음</span>
          </h1>
          <p className="animate-in delay-2" style={{ fontSize: 18, color: C.darkText, lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: "0 auto 40px" }}>실거래가 분석부터 수익률 계산까지<br />데이터 기반 부동산 투자 솔루션</p>
          <div className="animate-in delay-3" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setCurrentPage("dashboard")} style={{ background: C.gradient1, border: "none", color: "white", padding: "14px 32px", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 30px rgba(0,102,255,0.3)", fontFamily: "'Noto Sans KR',sans-serif" }}>시작하기 <ChevronRight size={18} /></button>
            <button onClick={() => setCurrentPage("calculator")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "14px 32px", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Noto Sans KR',sans-serif" }}><Calculator size={18} />투자 계산기</button>
          </div>
        </div>
      </section>
      {/* Stats */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 20 }}>
          {stats.map((s, i) => (
            <div key={i} className={`animate-in delay-${i + 1}`} style={{ textAlign: "center", padding: "32px 20px", background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16 }}>
              <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "'Outfit',sans-serif", letterSpacing: "-0.03em" }}>{s.value}<span style={{ fontSize: 16, color: C.darkText }}>{s.unit}</span></div>
              <div style={{ fontSize: 14, color: C.darkText, marginTop: 8, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>
      {/* Features */}
      <section style={{ padding: "80px 24px", position: "relative" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <SectionHeader badge="핵심 기능" title="부동산 투자에 필요한 모든 도구" subtitle="데이터 기반의 투자 분석 도구로 근거 있는 투자를 시작하세요" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className={`animate-in delay-${i + 1}`} style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 20, padding: 32, cursor: "pointer", transition: "all 0.3s", position: "relative", overflow: "hidden" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = f.color; e.currentTarget.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.darkBorder; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, background: `radial-gradient(circle,${f.color}10,transparent)`, borderRadius: "50%" }} />
                  <div style={{ width: 52, height: 52, borderRadius: 14, marginBottom: 20, background: `${f.color}12`, border: `1px solid ${f.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={24} color={f.color} /></div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, letterSpacing: "-0.02em" }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: C.darkText, lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* Chart Preview */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <SectionHeader badge="실거래가 트렌드" title="서울 아파트 평균 매매가 추이" />
          <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 20, padding: "32px 24px" }}>
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={MONTHLY_TREND.slice(-24)}>
                <defs><linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={0.3} /><stop offset="95%" stopColor={C.primary} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: C.darkText, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.darkText, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}억`} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v.toFixed(2)}억원`, "평균 매매가"]} />
                <Area type="monotone" dataKey="price" stroke={C.primary} strokeWidth={2.5} fill="url(#priceGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
      {/* CTA */}
      <section style={{ padding: "80px 24px 120px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", background: "linear-gradient(135deg,rgba(0,102,255,0.1),rgba(124,92,252,0.1))", border: "1px solid rgba(0,102,255,0.2)", borderRadius: 24, padding: "60px 40px", position: "relative", overflow: "hidden" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, letterSpacing: "-0.03em" }}>지금 바로 시작하세요</h2>
          <p style={{ fontSize: 16, color: C.darkText, marginBottom: 32, lineHeight: 1.7 }}>서울 부동산 시장의 모든 데이터를 한눈에 분석하세요</p>
          <button onClick={() => setCurrentPage("dashboard")} style={{ background: C.gradient1, border: "none", color: "white", padding: "14px 36px", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer", boxShadow: "0 8px 30px rgba(0,102,255,0.3)", fontFamily: "'Noto Sans KR',sans-serif" }}>대시보드 바로가기 <ChevronRight size={18} style={{ verticalAlign: "middle", marginLeft: 4 }} /></button>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// DASHBOARD PAGE
// ============================================================
function DashboardPage() {
  const [selectedDistrict, setSelectedDistrict] = useState("강남구");
  const [period, setPeriod] = useState("1Y");
  const allData = useMemo(() => generateTransactionData(), []);
  const filteredTrend = useMemo(() => {
    const districtData = allData.filter(d => d.district === selectedDistrict);
    const mm = {};
    districtData.forEach(d => { if (!mm[d.date]) mm[d.date] = { prices: [], volumes: 0 }; mm[d.date].prices.push(d.price); mm[d.date].volumes += d.volume; });
    let arr = Object.entries(mm).map(([date, v]) => ({ date, price: Math.round(v.prices.reduce((a, b) => a + b, 0) / v.prices.length * 100) / 100, volume: v.volumes })).sort((a, b) => a.date.localeCompare(b.date));
    const sl = { "6M": 6, "1Y": 12, "3Y": 36, "ALL": arr.length };
    return arr.slice(-(sl[period] || 12));
  }, [selectedDistrict, period, allData]);
  const currentInfo = DISTRICT_SUMMARY.find(d => d.name === selectedDistrict);
  return (
    <div style={{ paddingTop: 80, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        <div className="animate-in" style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>실거래가 대시보드</h1>
          <p style={{ color: C.darkText, fontSize: 15 }}>서울시 아파트 실거래가 분석</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 32 }}>
          <KPICard title="평균 매매가" value={currentInfo?.avgPrice || 0} unit="억원" change={currentInfo?.change} icon={DollarSign} color={C.primary} delay={1} />
          <KPICard title="거래량" value={currentInfo?.volume.toLocaleString() || 0} unit="건" change={2.3} icon={BarChart3} color={C.accent1} delay={2} />
          <KPICard title="평균 면적" value={currentInfo?.avgArea || 0} unit="㎡" icon={Home} color={C.secondary} delay={3} />
          <KPICard title="전세가율" value="68.5" unit="%" change={-1.2} icon={Percent} color={C.accent2} delay={4} />
        </div>
        <div className="animate-in delay-2" style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, color: "#fff", padding: "10px 16px", borderRadius: 10, fontSize: 14, fontFamily: "'Noto Sans KR',sans-serif", cursor: "pointer", outline: "none" }}>
            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div style={{ display: "flex", gap: 4, background: C.darkCard, borderRadius: 10, padding: 4, border: `1px solid ${C.darkBorder}` }}>
            {["6M","1Y","3Y","ALL"].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ background: period === p ? C.primary : "transparent", border: "none", color: period === p ? "#fff" : C.darkText, padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{p}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
          <div className="animate-in delay-3" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{selectedDistrict} 매매가 추이</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={filteredTrend}>
                <defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={0.25} /><stop offset="95%" stopColor={C.primary} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: C.darkText, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.darkText, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}억`} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}억원`, "매매가"]} />
                <Area type="monotone" dataKey="price" stroke={C.primary} strokeWidth={2} fill="url(#dg)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="animate-in delay-4" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>거래량 추이</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={filteredTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: C.darkText, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.darkText, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}건`, "거래량"]} />
                <Bar dataKey="volume" fill={C.accent1} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="animate-in delay-5" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>구별 평균 매매가 랭킹</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["순위","지역","평균 매매가","변동률","거래량","평균 면적"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: C.darkText, borderBottom: `1px solid ${C.darkBorder}` }}>{h}</th>)}</tr></thead>
              <tbody>
                {[...DISTRICT_SUMMARY].sort((a, b) => b.avgPrice - a.avgPrice).map((d, i) => (
                  <tr key={d.name} style={{ cursor: "pointer" }} onClick={() => setSelectedDistrict(d.name)}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700, color: i < 3 ? C.primary : C.darkTextLight }}>{i + 1}</td>
                    <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600 }}>{d.name}</td>
                    <td style={{ padding: "14px 16px", fontSize: 14, fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{d.avgPrice}억원</td>
                    <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: d.change >= 0 ? C.danger : C.secondary }}>{d.change >= 0 ? "+" : ""}{d.change}%</td>
                    <td style={{ padding: "14px 16px", fontSize: 14, color: C.darkTextLight }}>{d.volume.toLocaleString()}건</td>
                    <td style={{ padding: "14px 16px", fontSize: 14, color: C.darkTextLight }}>{d.avgArea}㎡</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CALCULATOR PAGE
// ============================================================
function CalculatorPage() {
  const [activeCalc, setActiveCalc] = useState("loan");
  const [loanAmount, setLoanAmount] = useState(300000000);
  const [loanRate, setLoanRate] = useState(3.5);
  const [loanYears, setLoanYears] = useState(30);
  const [loanType, setLoanType] = useState("equal");
  const [purchasePrice, setPurchasePrice] = useState(900000000);
  const [isFirstHome, setIsFirstHome] = useState(true);
  const [homeCount, setHomeCount] = useState(1);
  const [yieldPrice, setYieldPrice] = useState(500000000);
  const [monthlyRent, setMonthlyRent] = useState(1500000);
  const [jeonse, setJeonse] = useState(300000000);

  const loanResult = useMemo(() => {
    const P = loanAmount, r = loanRate / 100 / 12, n = loanYears * 12;
    if (loanType === "equal") {
      const monthly = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
      return { monthly: Math.round(monthly), totalPaid: Math.round(monthly * n), totalInterest: Math.round(monthly * n - P) };
    } else {
      const pm = P / n; const first = pm + P * r;
      let ti = 0; for (let i = 0; i < n; i++) ti += (P - pm * i) * r;
      return { monthly: Math.round(first), totalPaid: Math.round(P + ti), totalInterest: Math.round(ti) };
    }
  }, [loanAmount, loanRate, loanYears, loanType]);

  const loanChartData = useMemo(() => {
    const data = []; const P = loanAmount, r = loanRate / 100 / 12, n = loanYears * 12; let balance = P;
    for (let year = 1; year <= loanYears; year++) {
      if (loanType === "equal") { const m = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1); for (let i = 0; i < 12; i++) { balance -= (m - balance * r); } }
      else { for (let i = 0; i < 12; i++) balance -= P / n; }
      data.push({ year: `${year}년`, balance: Math.max(0, Math.round(balance / 10000)) });
    }
    return data;
  }, [loanAmount, loanRate, loanYears, loanType]);

  const taxResult = useMemo(() => {
    let rate;
    if (homeCount >= 3) rate = 0.12; else if (homeCount >= 2) rate = 0.08;
    else if (purchasePrice <= 600000000) rate = 0.01;
    else if (purchasePrice <= 900000000) rate = isFirstHome ? 0.01 : 0.02;
    else rate = isFirstHome ? 0.02 : 0.03;
    const at = Math.round(purchasePrice * rate);
    const le = Math.round(at * 0.1);
    const sr = purchasePrice > 600000000 ? Math.round(at * 0.2) : 0;
    return { rate: (rate * 100).toFixed(1), acquisitionTax: at, localEduTax: le, specialRuralTax: sr, total: at + le + sr };
  }, [purchasePrice, isFirstHome, homeCount]);

  const yieldResult = useMemo(() => {
    const annualRent = monthlyRent * 12;
    const gapInvest = yieldPrice - jeonse;
    return { annualRent, grossYield: (annualRent / yieldPrice * 100).toFixed(2), gapInvest, gapYield: gapInvest > 0 ? (annualRent / gapInvest * 100).toFixed(2) : "0" };
  }, [yieldPrice, monthlyRent, jeonse]);

  const fmt = v => { if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억원`; if (v >= 10000) return `${Math.round(v / 10000).toLocaleString()}만원`; return `${v.toLocaleString()}원`; };

  const InputRow = ({ label, value, onChange, min, max, step, unit, format }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <label style={{ fontSize: 14, fontWeight: 500, color: C.darkTextLight }}>{label}</label>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", fontFamily: "'Outfit',sans-serif" }}>{format ? format(value) : value}{unit || ""}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: C.primary, height: 6, borderRadius: 3, outline: "none", cursor: "pointer" }} />
    </div>
  );

  const tabs = [{ id: "loan", label: "대출 상환", icon: PiggyBank }, { id: "tax", label: "취득세", icon: FileText }, { id: "yield", label: "수익률", icon: TrendingUp }];

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        <div className="animate-in" style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>투자 계산기</h1>
          <p style={{ color: C.darkText, fontSize: 15 }}>대출 상환, 취득세, 수익률을 한번에 계산하세요</p>
        </div>
        <div className="animate-in delay-1" style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
          {tabs.map(t => { const Icon = t.icon; const a = activeCalc === t.id; return (
            <button key={t.id} onClick={() => setActiveCalc(t.id)} style={{ background: a ? "rgba(0,102,255,0.12)" : C.darkCard, border: `1px solid ${a ? C.primary + "40" : C.darkBorder}`, color: a ? C.primary : C.darkTextLight, padding: "10px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Noto Sans KR',sans-serif" }}><Icon size={16} />{t.label}</button>
          ); })}
        </div>

        {activeCalc === "loan" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div className="animate-in delay-2" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 28 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>대출 조건 설정</h3>
              <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                {[{ id: "equal", label: "원리금균등" }, { id: "principal", label: "원금균등" }].map(t => (
                  <button key={t.id} onClick={() => setLoanType(t.id)} style={{ flex: 1, background: loanType === t.id ? C.primary : "transparent", border: `1px solid ${loanType === t.id ? C.primary : C.darkBorder}`, color: loanType === t.id ? "#fff" : C.darkTextLight, padding: 10, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" }}>{t.label}</button>
                ))}
              </div>
              <InputRow label="대출금액" value={loanAmount} onChange={setLoanAmount} min={10000000} max={1000000000} step={10000000} format={fmt} />
              <InputRow label="금리" value={loanRate} onChange={setLoanRate} min={1} max={10} step={0.1} unit="%" />
              <InputRow label="대출기간" value={loanYears} onChange={setLoanYears} min={5} max={40} step={1} unit="년" />
            </div>
            <div className="animate-in delay-3" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 28 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>상환 결과</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ background: "rgba(0,102,255,0.08)", borderRadius: 12, padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: C.darkText, marginBottom: 8 }}>월 상환금</div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: C.primary }}>{fmt(loanResult.monthly)}</div>
                  </div>
                  <div style={{ background: "rgba(124,92,252,0.08)", borderRadius: 12, padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: C.darkText, marginBottom: 8 }}>총 이자</div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: C.accent1 }}>{fmt(loanResult.totalInterest)}</div>
                  </div>
                </div>
                <div style={{ marginTop: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, color: C.darkText }}>총 상환금</span>
                  <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>{fmt(loanResult.totalPaid)}</span>
                </div>
              </div>
              <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 24, flex: 1 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: C.darkTextLight }}>잔금 변화</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={loanChartData}>
                    <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent1} stopOpacity={0.2} /><stop offset="95%" stopColor={C.accent1} stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="year" tick={{ fill: C.darkText, fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                    <YAxis tick={{ fill: C.darkText, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}만`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v.toLocaleString()}만원`]} />
                    <Area type="monotone" dataKey="balance" stroke={C.accent1} strokeWidth={2} fill="url(#bg)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeCalc === "tax" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div className="animate-in delay-2" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 28 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>취득세 계산</h3>
              <InputRow label="매매가" value={purchasePrice} onChange={setPurchasePrice} min={100000000} max={5000000000} step={50000000} format={fmt} />
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 500, color: C.darkTextLight, marginBottom: 12, display: "block" }}>보유 주택 수</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 2, 3].map(n => (
                    <button key={n} onClick={() => setHomeCount(n)} style={{ flex: 1, background: homeCount === n ? C.primary : "transparent", border: `1px solid ${homeCount === n ? C.primary : C.darkBorder}`, color: homeCount === n ? "#fff" : C.darkTextLight, padding: 10, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" }}>{n === 3 ? "3주택+" : `${n}주택`}</button>
                  ))}
                </div>
              </div>
              {homeCount === 1 && (
                <div style={{ display: "flex", gap: 8 }}>
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => setIsFirstHome(v)} style={{ flex: 1, background: isFirstHome === v ? C.secondary : "transparent", border: `1px solid ${isFirstHome === v ? C.secondary : C.darkBorder}`, color: isFirstHome === v ? "#fff" : C.darkTextLight, padding: 10, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" }}>{v ? "생애최초" : "일반"}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="animate-in delay-3" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 28 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>세금 내역</h3>
              <div style={{ background: "rgba(0,102,255,0.08)", borderRadius: 14, padding: 24, textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: C.darkText, marginBottom: 8 }}>총 취득세</div>
                <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Outfit',sans-serif", color: C.primary }}>{fmt(taxResult.total)}</div>
                <div style={{ fontSize: 13, color: C.darkText, marginTop: 4 }}>세율 {taxResult.rate}%</div>
              </div>
              {[{ label: "취득세", value: taxResult.acquisitionTax }, { label: "지방교육세", value: taxResult.localEduTax }, { label: "농어촌특별세", value: taxResult.specialRuralTax }].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderBottom: i < 2 ? `1px solid ${C.darkBorder}` : "none" }}>
                  <span style={{ fontSize: 14, color: C.darkText }}>{item.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{fmt(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeCalc === "yield" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div className="animate-in delay-2" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 28 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>수익률 계산</h3>
              <InputRow label="매매가" value={yieldPrice} onChange={setYieldPrice} min={100000000} max={3000000000} step={50000000} format={fmt} />
              <InputRow label="월세" value={monthlyRent} onChange={setMonthlyRent} min={100000} max={10000000} step={50000} format={fmt} />
              <InputRow label="전세 보증금" value={jeonse} onChange={setJeonse} min={0} max={yieldPrice} step={10000000} format={fmt} />
            </div>
            <div className="animate-in delay-3" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 24, textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: C.darkText, marginBottom: 8 }}>총 수익률</div>
                  <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Outfit',sans-serif", color: C.secondary }}>{yieldResult.grossYield}%</div>
                  <div style={{ fontSize: 12, color: C.darkText, marginTop: 4 }}>연간</div>
                </div>
                <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 24, textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: C.darkText, marginBottom: 8 }}>갭투자 수익률</div>
                  <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Outfit',sans-serif", color: C.accent2 }}>{yieldResult.gapYield}%</div>
                  <div style={{ fontSize: 12, color: C.darkText, marginTop: 4 }}>연간</div>
                </div>
              </div>
              <div style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: C.darkTextLight }}>투자 분석 요약</h4>
                {[{ label: "연간 임대 수입", value: fmt(yieldResult.annualRent) }, { label: "갭투자 금액", value: fmt(yieldResult.gapInvest) }, { label: "월세 대비 매매가", value: `${(yieldPrice / monthlyRent / 12).toFixed(1)}배` }, { label: "전세가율", value: `${(jeonse / yieldPrice * 100).toFixed(1)}%` }].map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i < 3 ? `1px solid ${C.darkBorder}` : "none" }}>
                    <span style={{ fontSize: 14, color: C.darkText }}>{item.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{item.value}</span>
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

// ============================================================
// ANALYSIS PAGE
// ============================================================
function AnalysisPage() {
  const [selectedDistricts, setSelectedDistricts] = useState(["강남구", "마포구", "송파구"]);
  const toggleDistrict = d => {
    if (selectedDistricts.includes(d)) { if (selectedDistricts.length > 1) setSelectedDistricts(selectedDistricts.filter(x => x !== d)); }
    else if (selectedDistricts.length < 5) setSelectedDistricts([...selectedDistricts, d]);
  };
  const comparisonData = useMemo(() => {
    const months = [];
    for (let y = 2023; y <= 2025; y++) {
      for (let m = 1; m <= 12; m++) {
        const entry = { date: `${y}.${String(m).padStart(2, '0')}` };
        selectedDistricts.forEach(d => {
          const base = {"강남구":24,"서초구":21,"송파구":18,"마포구":14,"용산구":17,"성동구":13,"광진구":12,"영등포구":11,"강동구":13,"노원구":7,"강서구":9,"양천구":10,"은평구":7,"중구":12,"종로구":13}[d] || 10;
          entry[d] = Math.round((base + (y - 2023) * 0.8 + Math.sin((m + y * 12) * 0.3) * 1.5 + (Math.random() - 0.5)) * 100) / 100;
        });
        months.push(entry);
      }
    }
    return months;
  }, [selectedDistricts]);
  const pieData = DISTRICT_SUMMARY.slice(0, 8).map(d => ({ name: d.name, value: d.volume }));

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        <div className="animate-in" style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>지역 분석</h1>
          <p style={{ color: C.darkText, fontSize: 15 }}>지역별 가격 비교 및 거래 분석</p>
        </div>
        <div className="animate-in delay-1" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.darkTextLight, marginBottom: 16 }}>비교 지역 선택 (최대 5개)</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {DISTRICTS.map(d => {
              const a = selectedDistricts.includes(d);
              return <button key={d} onClick={() => toggleDistrict(d)} style={{ background: a ? "rgba(0,102,255,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${a ? C.primary + "50" : C.darkBorder}`, color: a ? C.primary : C.darkTextLight, padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif" }}>{d}</button>;
            })}
          </div>
        </div>
        <div className="animate-in delay-2" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>지역별 매매가 비교</h3>
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: C.darkText, fontSize: 11 }} axisLine={false} tickLine={false} interval={5} />
              <YAxis tick={{ fill: C.darkText, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}억`} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}억원`]} />
              {selectedDistricts.map((d, i) => <Line key={d} type="monotone" dataKey={d} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2.5} dot={false} />)}
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 20, marginTop: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {selectedDistricts.map((d, i) => (
              <div key={d} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.darkTextLight }}>
                <div style={{ width: 12, height: 3, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length] }} />{d}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div className="animate-in delay-3" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>지역별 거래량 비중</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie><Tooltip contentStyle={tooltipStyle} formatter={v => [`${v.toLocaleString()}건`]} /></PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              {pieData.map((d, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.darkTextLight }}><div style={{ width: 8, height: 8, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length] }} />{d.name}</div>)}
            </div>
          </div>
          <div className="animate-in delay-4" style={{ background: C.darkCard, border: `1px solid ${C.darkBorder}`, borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>선택 지역 비교</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["지역","평균가","변동률","거래량"].map(h => <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: C.darkText, borderBottom: `1px solid ${C.darkBorder}` }}>{h}</th>)}</tr></thead>
              <tbody>{selectedDistricts.map(d => { const info = DISTRICT_SUMMARY.find(x => x.name === d); return (
                <tr key={d}>
                  <td style={{ padding: 12, fontSize: 14, fontWeight: 600 }}>{d}</td>
                  <td style={{ padding: 12, fontSize: 14, fontFamily: "'Outfit',sans-serif" }}>{info?.avgPrice}억</td>
                  <td style={{ padding: 12, fontSize: 13, fontWeight: 600, color: info?.change >= 0 ? C.danger : C.secondary }}>{info?.change >= 0 ? "+" : ""}{info?.change}%</td>
                  <td style={{ padding: 12, fontSize: 14, color: C.darkTextLight }}>{info?.volume.toLocaleString()}</td>
                </tr>
              ); })}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FOOTER
// ============================================================
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${C.darkBorder}`, padding: "40px 24px", marginTop: 60 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: C.gradient1, display: "flex", alignItems: "center", justifyContent: "center" }}><Building2 size={14} color="white" /></div>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 15 }}>부동산<span style={{ color: C.primary }}>Valley</span></span>
        </div>
        <div style={{ fontSize: 13, color: C.darkText }}>데이터는 학습용 샘플 데이터입니다 · © 2025 부동산Valley</div>
      </div>
    </footer>
  );
}

// ============================================================
// APP - Entry Point
// ============================================================
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    try { if (sessionStorage.getItem(STORAGE_KEY) === "true") setIsAuthenticated(true); } catch (e) {}
    setCheckingAuth(false);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [currentPage]);

  const handleLogout = () => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
    setIsAuthenticated(false);
    setCurrentPage("home");
  };

  if (checkingAuth) return null;

  if (!isAuthenticated) {
    return (<><style>{globalStyles}</style><LoginPage onAuth={() => setIsAuthenticated(true)} /></>);
  }

  return (
    <>
      <style>{globalStyles}</style>
      <Nav currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />
      {currentPage === "home" && <LandingPage setCurrentPage={setCurrentPage} />}
      {currentPage === "dashboard" && <DashboardPage />}
      {currentPage === "calculator" && <CalculatorPage />}
      {currentPage === "analysis" && <AnalysisPage />}
      <Footer />
    </>
  );
}
