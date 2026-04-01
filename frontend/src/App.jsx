import { useState, useEffect } from "react";
import CheckEmail from "./components/CheckEmail";
import Dashboard from "./components/Dashboard";
import AlertPanel from "./components/AlertPanel";
import BreachDB from "./components/BreachDB";
import MonitoredList from "./components/MonitoredList";
import "./App.css";

const NAV = [
  { id: "check", label: "SCAN", icon: "⬡" },
  { id: "dashboard", label: "DASHBOARD", icon: "◈" },
  { id: "alerts", label: "ALERTS", icon: "◉" },
  { id: "breaches", label: "BREACH DB", icon: "◫" },
  { id: "monitored", label: "MONITORED", icon: "◎" },
];

export default function App() {
  const [active, setActive] = useState("check");
  const [stats, setStats] = useState(null);
  const [pulse, setPulse] = useState(false);

  const fetchStats = async () => {
    try {
      const r = await fetch("http://localhost:5000/api/stats");
      const d = await r.json();
      setStats(d);
    } catch {
      setStats(null);
    }
  };

  useEffect(() => {
    fetchStats();
    const iv = setInterval(fetchStats, 10000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(t);
  }, [stats?.unread_alerts]);

  return (
    <div className="app">
      {/* Scanline overlay */}
      <div className="scanlines" />

      {/* Grid background */}
      <div className="grid-bg" />

      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo-mark">⬡</div>
          <div>
            <h1 className="logo-title">DARKWATCH</h1>
            <p className="logo-sub">BREACH INTELLIGENCE SYSTEM</p>
          </div>
        </div>

        <div className="header-center">
          <div className="status-bar">
            <span className="status-dot" />
            <span className="status-text">MONITORING ACTIVE</span>
          </div>
        </div>

        <div className="header-right">
          {stats && (
            <div className="header-stats">
              <div className="hstat">
                <span className="hstat-val">{stats.total_breaches_db}</span>
                <span className="hstat-label">KNOWN BREACHES</span>
              </div>
              <div className="hstat-divider" />
              <div className="hstat">
                <span className="hstat-val text-danger">{stats.total_breached}</span>
                <span className="hstat-label">COMPROMISED</span>
              </div>
              <div className="hstat-divider" />
              <div className={`hstat ${pulse ? "pulse-anim" : ""}`}>
                <span className="hstat-val text-warn">{stats.unread_alerts}</span>
                <span className="hstat-label">ALERTS</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Nav */}
      <nav className="nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`nav-btn ${active === n.id ? "active" : ""}`}
            onClick={() => setActive(n.id)}
          >
            <span className="nav-icon">{n.icon}</span>
            <span>{n.label}</span>
            {n.id === "alerts" && stats?.unread_alerts > 0 && (
              <span className="badge">{stats.unread_alerts}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main className="main">
        {active === "check" && <CheckEmail onScan={fetchStats} />}
        {active === "dashboard" && <Dashboard stats={stats} onRefresh={fetchStats} />}
        {active === "alerts" && <AlertPanel onRead={fetchStats} />}
        {active === "breaches" && <BreachDB />}
        {active === "monitored" && <MonitoredList onDelete={fetchStats} />}
      </main>

      <footer className="footer">
        <span>DARKWATCH v2.4.1</span>
        <span className="footer-dot">◆</span>
        <span>SIMULATED BREACH INTELLIGENCE — FOR EDUCATIONAL PURPOSES ONLY</span>
        <span className="footer-dot">◆</span>
        <span>{new Date().toUTCString()}</span>
      </footer>
    </div>
  );
}
