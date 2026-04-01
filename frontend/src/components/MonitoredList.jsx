import { useState, useEffect } from "react";

export default function MonitoredList({ onDelete }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchEmails = async () => {
    try {
      const r = await fetch("http://localhost:5000/api/monitored");
      setEmails(await r.json());
    } catch {
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteEmail = async (email) => {
    setDeleting(email);
    await fetch("http://localhost:5000/api/delete-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    await fetchEmails();
    onDelete?.();
    setDeleting(null);
  };

  useEffect(() => { fetchEmails(); }, []);

  const getStatusColor = (s) => ({ critical: "var(--danger)", at_risk: "var(--warn)", safe: "var(--accent)" }[s] || "var(--text3)");
  const getRiskBarClass = (score) => score >= 20 ? "progress-fill-danger" : score >= 7 ? "progress-fill-warn" : "progress-fill-safe";

  if (loading) return <div className="loader"><div className="loader-ring" /><div className="loader-text">LOADING MONITORED EMAILS...</div></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-24">
        <div>
          <div className="font-sans" style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "0.2em", color: "var(--text2)" }}>
            MONITORED EMAIL REGISTRY
          </div>
          <div className="text-xs color-muted mt-12">{emails.length} EMAIL(S) TRACKED</div>
        </div>
        <button className="btn btn-ghost text-xs" onClick={fetchEmails}>↻ REFRESH</button>
      </div>

      {emails.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px" }}>
          <div style={{ fontSize: "2rem", color: "var(--accent)", marginBottom: 16 }}>◎</div>
          <div className="font-sans" style={{ color: "var(--accent)", letterSpacing: "0.2em", marginBottom: 8 }}>NO EMAILS MONITORED</div>
          <div className="text-xs color-muted">Scan an email address to begin monitoring</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>EMAIL ADDRESS</th>
                <th>STATUS</th>
                <th>BREACHES</th>
                <th>RISK SCORE</th>
                <th>LAST SCANNED</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {emails.map((e, i) => (
                <tr key={i}>
                  <td style={{ color: "var(--text)", fontFamily: "var(--mono)" }}>{e.email}</td>
                  <td>
                    <span
                      className={`tag ${e.status === "critical" ? "tag-critical" : e.status === "at_risk" ? "tag-medium" : "tag-safe"}`}
                    >
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: getStatusColor(e.status), display: "inline-block", marginRight: 5 }} />
                      {e.status?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: e.breach_count > 0 ? "var(--danger)" : "var(--accent)", fontFamily: "var(--sans)", fontWeight: 700 }}>
                      {e.breach_count}
                    </span>
                  </td>
                  <td style={{ minWidth: 120 }}>
                    <div className="flex items-center gap-8">
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className={`progress-fill ${getRiskBarClass(e.risk_score)}`} style={{ width: `${e.risk_score}%` }} />
                      </div>
                      <span className="text-xs" style={{ color: e.risk_score >= 20 ? "var(--danger)" : e.risk_score >= 7 ? "var(--warn)" : "var(--accent)" }}>
                        {e.risk_score}
                      </span>
                    </div>
                  </td>
                  <td className="text-xs color-muted">
                    {e.checked_at ? new Date(e.checked_at).toLocaleString() : "—"}
                  </td>
                  <td>
                    <button
                      className="btn btn-danger"
                      style={{ padding: "4px 12px", fontSize: "0.6rem" }}
                      onClick={() => deleteEmail(e.email)}
                      disabled={deleting === e.email}
                    >
                      {deleting === e.email ? "..." : "REMOVE"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
