import { useState, useEffect } from "react";

export default function AlertPanel({ onRead }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const r = await fetch("http://localhost:5000/api/alerts");
      setAlerts(await r.json());
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    await fetch("http://localhost:5000/api/alerts/mark-read", { method: "POST" });
    fetchAlerts();
    onRead?.();
  };

  useEffect(() => { fetchAlerts(); }, []);

  const unread = alerts.filter((a) => !a.read).length;

  if (loading) return <div className="loader"><div className="loader-ring" /><div className="loader-text">LOADING ALERTS...</div></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-24">
        <div>
          <div className="font-sans" style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "0.2em", color: "var(--text2)" }}>
            ALERT MANAGEMENT
          </div>
          {unread > 0 && (
            <div className="text-xs" style={{ color: "var(--warn)", marginTop: 4 }}>
              {unread} UNREAD ALERT{unread !== 1 ? "S" : ""}
            </div>
          )}
        </div>
        {unread > 0 && (
          <button className="btn btn-ghost text-xs" onClick={markAllRead}>
            ✓ MARK ALL READ
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "2rem", color: "var(--accent)", marginBottom: 16 }}>◉</div>
          <div className="font-sans" style={{ color: "var(--accent)", letterSpacing: "0.2em", marginBottom: 8 }}>NO ALERTS GENERATED</div>
          <div className="text-xs color-muted">Run an email scan to generate alerts</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {alerts.map((alert, i) => (
            <div
              key={i}
              className="card"
              style={{
                borderColor: !alert.read ? (alert.severity === "Critical" ? "var(--danger)" : "var(--warn)") : "var(--border)",
                background: !alert.read ? (alert.severity === "Critical" ? "rgba(255,45,85,0.04)" : "rgba(255,170,0,0.03)") : "var(--surface)",
                opacity: alert.read ? 0.6 : 1,
                padding: "14px 18px",
              }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-12">
                  {!alert.read && (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: alert.severity === "Critical" ? "var(--danger)" : "var(--warn)", flexShrink: 0 }} />
                  )}
                  <div>
                    <div className="flex items-center gap-8 mb-12">
                      <span className={`tag ${alert.severity === "Critical" ? "tag-critical" : "tag-medium"}`}>{alert.severity}</span>
                      <span className="text-xs color-muted">{alert.alert_type.replace(/_/g, " ").toUpperCase()}</span>
                    </div>
                    <div className="text-sm" style={{ color: "var(--text)" }}>{alert.message}</div>
                  </div>
                </div>
                <div className="text-xs color-muted" style={{ textAlign: "right", whiteSpace: "nowrap", marginLeft: 20 }}>
                  <div>{new Date(alert.created_at).toLocaleDateString()}</div>
                  <div>{new Date(alert.created_at).toLocaleTimeString()}</div>
                  {alert.read && <div style={{ color: "var(--text3)", marginTop: 2 }}>READ</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
