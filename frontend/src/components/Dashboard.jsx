import { useEffect, useRef } from "react";

const StatCard = ({ label, value, sub, color = "var(--accent)", icon }) => (
  <div className="card" style={{ borderColor: `${color}33` }}>
    <div className="flex justify-between items-center mb-12">
      <span className="text-xs color-muted" style={{ letterSpacing: "0.2em" }}>{label}</span>
      <span style={{ fontSize: "1.1rem", color }}>{icon}</span>
    </div>
    <div className="font-sans" style={{ fontSize: "2.2rem", fontWeight: 700, color, lineHeight: 1, textShadow: `0 0 20px ${color}50` }}>
      {value ?? "—"}
    </div>
    {sub && <div className="text-xs color-muted mt-12">{sub}</div>}
  </div>
);

function DonutChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext("2d");
    const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
    const segments = [
      { label: "CRITICAL", value: data.critical, color: "#ff2d55" },
      { label: "AT RISK", value: data.at_risk, color: "#ffaa00" },
      { label: "SAFE", value: data.safe, color: "#00ff9d" },
    ];

    const cx = 80, cy = 80, r = 60, inner = 35;
    ctx.clearRect(0, 0, 160, 160);

    let angle = -Math.PI / 2;
    segments.forEach((seg) => {
      if (!seg.value) return;
      const slice = (seg.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + slice);
      ctx.fillStyle = seg.color;
      ctx.fill();
      angle += slice;
    });

    // Donut hole
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = "#040f0c";
    ctx.fill();

    // Center text
    ctx.fillStyle = "#b8ffe0";
    ctx.font = "bold 18px Rajdhani";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(total, cx, cy - 6);
    ctx.font = "9px Share Tech Mono";
    ctx.fillStyle = "#3d7a60";
    ctx.fillText("SCANNED", cx, cy + 10);
  }, [data]);

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
      <canvas ref={canvasRef} width={160} height={160} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { label: "CRITICAL", value: data?.critical ?? 0, color: "#ff2d55" },
          { label: "AT RISK", value: data?.at_risk ?? 0, color: "#ffaa00" },
          { label: "SAFE", value: data?.safe ?? 0, color: "#00ff9d" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-8">
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <span className="text-xs color-muted">{s.label}</span>
            <span className="font-sans" style={{ color: s.color, fontWeight: 700, marginLeft: "auto" }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }) {
  if (!data) return null;
  const max = Math.max(...Object.values(data), 1);
  const entries = Object.entries(data);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {entries.map(([label, val]) => (
        <div key={label}>
          <div className="flex justify-between mb-12">
            <span className="text-xs color-muted">{label.toUpperCase()}</span>
            <span className="text-xs color-accent">{val}</span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${label === "critical" ? "progress-fill-danger" : label === "at_risk" ? "progress-fill-warn" : "progress-fill-safe"}`}
              style={{ width: `${(val / max) * 100}%`, transition: "width 1s ease-out" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ stats, onRefresh }) {
  if (!stats) {
    return (
      <div className="loader">
        <div className="loader-ring" />
        <div className="loader-text">CONNECTING TO BACKEND...</div>
        <div className="text-xs color-muted mt-12">Ensure the Flask server is running on port 5000</div>
        <button className="btn btn-ghost mt-16" onClick={onRefresh}>RETRY CONNECTION</button>
      </div>
    );
  }

  const pct = stats.total_monitored > 0
    ? Math.round((stats.total_breached / stats.total_monitored) * 100)
    : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-24">
        <div className="font-sans" style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "0.2em", color: "var(--text2)" }}>
          THREAT INTELLIGENCE DASHBOARD
        </div>
        <button className="btn btn-ghost text-xs" onClick={onRefresh}>↻ REFRESH</button>
      </div>

      <div className="grid-4 mb-16">
        <StatCard label="EMAILS MONITORED" value={stats.total_monitored} icon="◎" color="var(--accent)" sub="Total tracked emails" />
        <StatCard label="COMPROMISED" value={stats.total_breached} icon="⚠" color="var(--danger)" sub={`${pct}% of monitored`} />
        <StatCard label="KNOWN BREACHES" value={stats.total_breaches_db} icon="◫" color="var(--info)" sub="In local database" />
        <StatCard label="ACTIVE ALERTS" value={stats.unread_alerts} icon="◉" color="var(--warn)" sub={`${stats.total_alerts} total generated`} />
      </div>

      <div className="grid-2 mb-16">
        <div className="card">
          <div className="card-title">RISK DISTRIBUTION</div>
          <DonutChart data={stats.severity_distribution} />
        </div>

        <div className="card">
          <div className="card-title">SEVERITY BREAKDOWN</div>
          <BarChart data={stats.severity_distribution} />

          <div style={{ marginTop: 20, padding: "12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 2 }}>
            <div className="flex justify-between mb-12">
              <span className="text-xs color-muted">COMPROMISE RATE</span>
              <span className="text-xs color-accent">{pct}%</span>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-fill ${pct >= 50 ? "progress-fill-danger" : pct >= 25 ? "progress-fill-warn" : "progress-fill-safe"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* System status */}
      <div className="card">
        <div className="card-title">SYSTEM STATUS</div>
        <div className="grid-3">
          {[
            { label: "FLASK API", status: "ONLINE", color: "var(--accent)" },
            { label: "MONGODB", status: "CONNECTED", color: "var(--accent)" },
            { label: "BREACH DB", status: `${stats.total_breaches_db} RECORDS`, color: "var(--info)" },
            { label: "SCAN ENGINE", status: "ACTIVE", color: "var(--accent)" },
            { label: "ALERT SYSTEM", status: "RUNNING", color: "var(--accent)" },
            { label: "SIMULATION MODE", status: "ENABLED", color: "var(--warn)" },
          ].map((s) => (
            <div key={s.label} className="flex justify-between items-center" style={{ padding: "8px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 2 }}>
              <span className="text-xs color-muted">{s.label}</span>
              <div className="flex items-center gap-8">
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
                <span className="text-xs" style={{ color: s.color }}>{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
