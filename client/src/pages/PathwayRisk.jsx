import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import { Wind, Thermometer, AlertTriangle, Activity, Zap, FileText, Wifi, WifiOff, Leaf } from "lucide-react";

/* ─── helpers ─────────────────────────────────────────────────── */
function aqiMeta(aqi) {
  if (aqi <= 50) return { border: "#16a34a", text: "#15803d", bg: "rgba(220,252,231,0.90)", label: "Good" };
  if (aqi <= 100) return { border: "#ca8a04", text: "#a16207", bg: "rgba(254,249,195,0.90)", label: "Moderate" };
  if (aqi <= 150) return { border: "#ea580c", text: "#c2410c", bg: "rgba(255,237,213,0.90)", label: "Sensitive" };
  if (aqi <= 200) return { border: "#dc2626", text: "#b91c1c", bg: "rgba(254,226,226,0.90)", label: "Unhealthy" };
  if (aqi <= 300) return { border: "#7c3aed", text: "#6d28d9", bg: "rgba(243,232,255,0.90)", label: "V.Unhealthy" };
  return { border: "#be185d", text: "#9d174d", bg: "rgba(252,231,243,0.90)", label: "Hazardous" };
}
function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}
function riskBadge(level) {
  return level === "HIGH" ? "bg-red-50 text-red-700 border-red-200" :
    level === "MEDIUM" ? "bg-amber-50 text-amber-700 border-amber-200" :
      "bg-emerald-50 text-emerald-700 border-emerald-200";
}

/* ─── AQI Gauge ────────────────────────────────────────────────── */
function AqiGauge({ aqi }) {
  const pct = Math.min(aqi / 500, 1);
  const R = 52, C = 2 * Math.PI * R;
  const m = aqiMeta(aqi);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: 130, height: 130 }}>
      <svg width="130" height="130" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="65" cy="65" r={R} strokeWidth="9" stroke="rgba(255,255,255,0.3)" fill="none" />
        <circle cx="65" cy="65" r={R} strokeWidth="9" stroke={m.border} fill="none"
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.5s ease" }} />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-black" style={{ color: m.text }}>{aqi}</div>
        <div className="text-[10px] font-bold" style={{ color: m.text }}>AQI</div>
        <div className="text-[9px] text-slate-500 mt-0.5">{m.label}</div>
      </div>
    </div>
  );
}

function GlassCard({ children, className = "" }) {
  return (
    <div className={`bg-white/70 backdrop-blur-md rounded-xl border border-white/40 shadow-xl ${className}`}>
      {children}
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const aqi = payload[0]?.value;
  const m = aqiMeta(aqi || 0);
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-slate-100 px-3 py-2 text-sm">
      <p className="text-slate-400 text-[10px] mb-0.5">{fmtTime(label)}</p>
      <p className="font-bold" style={{ color: m.text }}>AQI {aqi}</p>
      <p className="text-[10px] text-slate-400">{m.label}</p>
    </div>
  );
}

const ALL_CITIES = [
  "Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata",
  "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
];

export default function PathwayRisk() {
  const [riskData, setRiskData] = useState([]);
  const [selected, setSelected] = useState("Delhi");
  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [inputAqi, setInputAqi] = useState("");
  const [inputHeat, setInputHeat] = useState("");
  const [status, setStatus] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    function connect() {
      const ws = new WebSocket("ws://localhost:5001");
      ws.onopen = () => setConnected(true);
      ws.onclose = () => { setConnected(false); setTimeout(connect, 3000); };
      ws.onerror = () => { };
      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (Array.isArray(d) && d.length) { setRiskData(d); setLastUpdated(new Date()); }
        } catch { }
      };
      return ws;
    }
    const ws = connect();
    return () => ws.close();
  }, []);

  const displayData = riskData.find(c => c.city === selected) || null;

  useEffect(() => {
    if (displayData) { setInputAqi(String(displayData.aqi)); setInputHeat(String(displayData.heat_index)); setStatus(null); }
  }, [selected, displayData?.aqi, displayData?.heat_index]);

  const handleInput = useCallback((aqiVal, heatVal) => {
    setInputAqi(aqiVal); setInputHeat(heatVal);
    if (!aqiVal || !heatVal) return;
    clearTimeout(debounceRef.current);
    setStatus("sending");
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/pathway/risk/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city: selected, aqi: parseInt(aqiVal, 10), heat_index: parseFloat(heatVal) }),
        });
        if (res.ok) { setRiskData(await res.json()); setLastUpdated(new Date()); setStatus("sent"); setTimeout(() => setStatus(null), 2000); }
        else setStatus("error");
      } catch { setStatus("error"); }
    }, 600);
  }, [selected]);

  const m = displayData ? aqiMeta(displayData.aqi) : aqiMeta(0);

  return (
    <div
      className="w-screen min-h-screen relative left-[calc(-50vw+50%)] -mb-8 bg-cover bg-center bg-fixed overflow-x-hidden"
      style={{ backgroundImage: "url('/images/back.jpg')" }}
    >
      {/* floating leaves */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div key={i}
            initial={{ y: "110vh", opacity: 0 }}
            animate={{ y: "-10vh", opacity: [0, 0.55, 0], rotate: 360 }}
            transition={{ duration: 16 + Math.random() * 16, repeat: Infinity, delay: Math.random() * 14, ease: "linear" }}
            className="absolute w-6 h-6 text-emerald-400/40"
            style={{ left: `${Math.random() * 100}%` }}
          >
            <Leaf className="w-full h-full" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-white/30 pb-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 drop-shadow-sm">Live AQI &amp; Health Risk</h2>
            <p className="text-slate-600 text-sm mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Powered by Pathway real-time streaming
            </p>
          </div>
          <div className="text-right space-y-1">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${connected ? "bg-emerald-50/80 border-emerald-300 text-emerald-700" : "bg-red-50/80 border-red-300 text-red-600"
              }`}>
              {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {connected ? "Pathway Live" : "Reconnecting…"}
            </div>
            {lastUpdated && <p className="text-[11px] text-slate-500">Updated {lastUpdated.toLocaleTimeString()}</p>}
          </div>
        </div>

        {/* ── Horizontal All-Cities cards (5 × 2 grid, full width) ── */}
        <div className="grid grid-cols-5 gap-3">
          {ALL_CITIES.map(c => {
            const city = riskData.find(r => r.city === c);
            const aqi = city?.aqi ?? "—";
            const cm = typeof aqi === "number" ? aqiMeta(aqi) : null;
            const isActive = selected === c;
            return (
              <motion.button key={c}
                whileHover={{ y: -3, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(c)}
                className="relative rounded-xl p-3 text-left border-2 transition-all duration-200 focus:outline-none"
                style={{
                  background: isActive && cm ? cm.bg : "rgba(255,255,255,0.65)",
                  borderColor: isActive && cm ? cm.border : "rgba(255,255,255,0.5)",
                  backdropFilter: "blur(12px)",
                  boxShadow: isActive ? `0 0 0 3px ${cm?.border}30, 0 4px 12px rgba(0,0,0,0.08)` : "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                {/* city name */}
                <p className="text-xs font-semibold text-slate-500 mb-1 truncate">{c}</p>
                {/* AQI big number */}
                <p className="text-2xl font-black leading-none mb-1" style={{ color: cm?.text ?? "#64748b" }}>
                  {aqi}
                </p>
                {/* label + heat row */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold" style={{ color: cm?.text ?? "#94a3b8" }}>
                    {cm?.label ?? "—"}
                  </span>
                  {city && (
                    <span className="text-[10px] text-slate-400">{city.heat_index}°C</span>
                  )}
                </div>
                {/* risk badge */}
                {city && (
                  <span className={`mt-1.5 inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${riskBadge(city.asthma_risk)}`}>
                    {city.asthma_risk}
                    {city.heatwave_alert && " 🔥"}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {riskData.length === 0 ? (
          <div className="flex items-center justify-center py-24 gap-3 text-slate-600">
            <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            Waiting for Pathway stream…
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ── Left 2/3: detail + chart ── */}
            <div className="lg:col-span-2 space-y-5">
              {displayData && (
                <>
                  {/* City detail card */}
                  <GlassCard className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-2xl font-black text-slate-800">{displayData.city}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold border"
                            style={{ background: m.bg, color: m.text, borderColor: m.border }}>
                            {m.label}
                          </span>
                          {displayData.heatwave_alert && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300 font-bold animate-pulse">
                              🔥 Heatwave
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { icon: Thermometer, label: "Heat Index", value: `${displayData.heat_index}°C`, color: displayData.heat_index > 40 ? "#dc2626" : "#ea580c" },
                            { icon: AlertTriangle, label: "Asthma Risk", value: displayData.asthma_risk, color: displayData.asthma_risk === "HIGH" ? "#dc2626" : displayData.asthma_risk === "MEDIUM" ? "#d97706" : "#16a34a" },
                            { icon: Activity, label: "Hospital Surge", value: displayData.hospital_surge, color: displayData.hospital_surge === "HIGH" ? "#dc2626" : displayData.hospital_surge === "MEDIUM" ? "#d97706" : "#16a34a" },
                            { icon: Zap, label: "Energy Spike", value: `+${displayData.energy_demand_spike?.toFixed(1)}%`, color: "#7c3aed" },
                          ].map(({ icon: Icon, label, value, color }) => (
                            <div key={label} className="flex items-center gap-2 bg-white/50 rounded-lg px-3 py-2 border border-white/60">
                              <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                              <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
                                <p className="text-sm font-bold" style={{ color }}>{value}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 items-start bg-emerald-50/60 rounded-lg px-3 py-2 border border-emerald-200/50">
                          <FileText className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <p className="text-slate-600 text-xs leading-relaxed">{displayData.advisory}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <AqiGauge aqi={displayData.aqi} />
                      </div>
                    </div>
                  </GlassCard>

                  {/* AQI Trend chart */}
                  {displayData.history?.length > 1 && (
                    <GlassCard className="p-5">
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                          <Activity className="w-4 h-4 text-emerald-600" />
                          AQI Trend — {displayData.city}
                        </h3>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke={m.border} strokeWidth="2.5" strokeLinecap="round" /></svg>
                            AQI
                          </span>
                          <span className="flex items-center gap-1">
                            <svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke="#ca8a04" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
                            Moderate (100)
                          </span>
                          <span className="flex items-center gap-1">
                            <svg width="18" height="4"><line x1="0" y1="2" x2="18" y2="2" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
                            Unhealthy (200)
                          </span>
                        </div>
                      </div>
                      <div style={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={displayData.history} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="time" tickFormatter={fmtTime} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 500]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                            <Tooltip content={<ChartTip />} />
                            <ReferenceLine y={100} stroke="#ca8a04" strokeDasharray="4 2" strokeOpacity={0.5} />
                            <ReferenceLine y={200} stroke="#dc2626" strokeDasharray="4 2" strokeOpacity={0.5} />
                            <Line type="monotoneX" dataKey="aqi" stroke={m.border} strokeWidth={2.5}
                              dot={{ r: 3, fill: m.border, strokeWidth: 0 }} activeDot={{ r: 5 }}
                              animationDuration={400} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </GlassCard>
                  )}
                </>
              )}
            </div>

            {/* ── Right 1/3: Inject Data ── */}
            <div>
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Wind className="w-4 h-4 text-emerald-600" /> Inject Data
                  </h3>
                  {status === "sending" && <span className="text-[11px] text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />Sending…</span>}
                  {status === "sent" && <span className="text-[11px] text-emerald-600 font-semibold">✓ Updated</span>}
                  {status === "error" && <span className="text-[11px] text-red-500">⚠ Error</span>}
                </div>
                <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                  Change a value → Pathway detects it → dashboard auto-updates
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">City</label>
                    <div className="w-full px-3 py-2 rounded-lg bg-white/60 border border-slate-200 text-sm font-semibold text-slate-700">{selected}</div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">AQI (0 – 500)</label>
                    <input type="number" min="0" max="500" value={inputAqi}
                      onChange={e => handleInput(e.target.value, inputHeat)}
                      className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-xl font-black bg-white/80 focus:outline-none focus:border-emerald-400 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Heat Index (°C)</label>
                    <input type="number" min="0" max="60" step="0.1" value={inputHeat}
                      onChange={e => handleInput(inputAqi, e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-xl font-black bg-white/80 focus:outline-none focus:border-emerald-400 transition-colors" />
                  </div>
                </div>
                <p className="text-slate-400 text-[10px] mt-4 leading-relaxed">
                  Or edit <code className="bg-slate-100 px-1 rounded">risk_inputs.csv</code> — Pathway watches it live.
                </p>
              </GlassCard>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
