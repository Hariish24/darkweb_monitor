import { useState, useEffect } from "react";

const DEMO_EMAILS = [
  "john.doe@gmail.com",
  "alice@yahoo.com",
  "test@example.com",
  "bob@gmail.com",
  "safe_user@example.com",
];

const SCAN_STEPS = [
  "INITIALIZING SCAN ENGINE...",
  "CONNECTING TO BREACH DATABASE...",
  "HASHING QUERY...",
  "CROSS-REFERENCING LEAKED RECORDS...",
  "SCANNING DARK WEB INDICES...",
  "ANALYZING CREDENTIAL DUMPS...",
  "COMPILING THREAT REPORT...",
];

export default function CheckEmail({ onScan }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [expandedBreach, setExpandedBreach] = useState(null);

  useEffect(() => {
    let iv;
    if (loading && stepIdx < SCAN_STEPS.length) {
      iv = setTimeout(() => setStepIdx((i) => i + 1), 400);
    }
    return () => clearTimeout(iv);
  }, [loading, stepIdx]);

  const scan = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    setLogs([]);
    setStepIdx(0);

    const start = Date.now();
    try {
      const r = await fetch("http://localhost:5000/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = await r.json();
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);

      if (!r.ok) throw new Error(d.error || "Scan failed");

      const newLogs = [
        { type: "prompt", text: `> SCAN TARGET: ${email}` },
        { type: "info", text: `> SCAN DURATION: ${elapsed}s` },
        { type: d.breached ? "error" : "success", text: `> STATUS: ${d.breached ? `⚠ COMPROMISED — ${d.breach_count} BREACH(ES) FOUND` : "✓ NO BREACHES DETECTED"}` },
        { type: "info", text: `> RISK SCORE: ${d.risk_score}/100` },
      ];
      setLogs(newLogs);
      setResult(d);
      onScan?.();
    } catch (e) {
      setError(e.message);
      setLogs([{ type: "error", text: `> ERROR: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 20) return "progress-fill-danger";
    if (score >= 7) return "progress-fill-warn";
    return "progress-fill-safe";
  };

  const getSeverityClass = (sev) => ({
    Critical: "tag-critical",
    High: "tag-high",
    Medium: "tag-medium",
    Low: "tag-low",
  }[sev] || "tag-low");

  return (
    <div>
      <div className="card mb-16">
        <div className="card-title">EMAIL BREACH SCANNER</div>

        <div className="flex gap-12 mb-16" style={{ flexWrap: "wrap" }}>
          <div className="input-wrap" style={{ flex: 1, minWidth: 260 }}>
            <input
              className="input"
              type="email"
              placeholder="TARGET EMAIL ADDRESS"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && scan()}
              disabled={loading}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={scan}
            disabled={loading || !email.trim()}
          >
            {loading ? "SCANNING..." : "⬡ INITIATE SCAN"}
          </button>
        </div>

        <div className="flex gap-8 items-center" style={{ flexWrap: "wrap" }}>
          <span className="text-xs color-muted">DEMO TARGETS:</span>
          {DEMO_EMAILS.map((e) => (
            <button
              key={e}
              className="btn btn-ghost text-xs"
              style={{ padding: "4px 10px", fontSize: "0.65rem" }}
              onClick={() => setEmail(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Scan terminal */}
      {(loading || logs.length > 0) && (
        <div className="card mb-16">
          <div className="card-title">SCAN TERMINAL</div>
          <div className="terminal">
            {loading &&
              SCAN_STEPS.slice(0, stepIdx + 1).map((step, i) => (
                <div key={i} className="terminal-line">
                  <span className="terminal-prompt">[{String(i).padStart(2, "0")}]</span>
                  <span className="terminal-text" style={{ color: i === stepIdx ? "var(--accent)" : "var(--text3)" }}>
                    {step}
                  </span>
                </div>
              ))}
            {!loading &&
              logs.map((log, i) => (
                <div key={i} className="terminal-line">
                  <span className="terminal-prompt">$</span>
                  <span
                    className={
                      log.type === "error"
                        ? "terminal-error"
                        : log.type === "success"
                        ? "terminal-success"
                        : log.type === "warn"
                        ? "terminal-warn"
                        : "terminal-text"
                    }
                  >
                    {log.text}
                  </span>
                </div>
              ))}
            {!loading && <div className="terminal-line"><span className="terminal-prompt">$</span><span className="terminal-text" style={{ animation: "textBlink 1s infinite" }}>█</span></div>}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          {/* Risk summary */}
          <div
            className="card mb-16"
            style={{
              borderColor: result.breached ? "var(--danger)" : "var(--accent)",
              background: result.breached
                ? "rgba(255,45,85,0.04)"
                : "rgba(0,255,157,0.04)",
            }}
          >
            <div className="flex justify-between items-center mb-16">
              <div>
                <div
                  className="font-sans"
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    color: result.breached ? "var(--danger)" : "var(--accent)",
                    letterSpacing: "0.1em",
                    textShadow: result.breached
                      ? "var(--danger-glow)"
                      : "var(--glow)",
                  }}
                >
                  {result.breached
                    ? `⚠ ACCOUNT COMPROMISED`
                    : "✓ NO BREACHES FOUND"}
                </div>
                <div className="text-xs color-muted mt-12">
                  {result.email} — scanned {new Date(result.checked_at).toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  className="font-sans"
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: 700,
                    color:
                      result.risk_score >= 20
                        ? "var(--danger)"
                        : result.risk_score >= 7
                        ? "var(--warn)"
                        : "var(--accent)",
                    lineHeight: 1,
                  }}
                >
                  {result.risk_score}
                </div>
                <div className="text-xs color-muted">RISK SCORE</div>
              </div>
            </div>

            <div className="progress-bar mb-16">
              <div
                className={`progress-fill ${getRiskColor(result.risk_score)}`}
                style={{ width: `${Math.min(result.risk_score, 100)}%` }}
              />
            </div>

            <div className="grid-3">
              <div style={{ textAlign: "center" }}>
                <div
                  className="font-sans"
                  style={{ fontSize: "1.4rem", fontWeight: 700, color: result.breach_count > 0 ? "var(--danger)" : "var(--accent)" }}
                >
                  {result.breach_count}
                </div>
                <div className="text-xs color-muted">BREACHES</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  className="font-sans"
                  style={{ fontSize: "1.4rem", fontWeight: 700, color: result.breaches.some((b) => b.password_exposed) ? "var(--danger)" : "var(--accent)" }}
                >
                  {result.breaches.filter((b) => b.password_exposed).length}
                </div>
                <div className="text-xs color-muted">PASSWORDS EXPOSED</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <span
                  className={`tag ${result.status === "critical" ? "tag-critical" : result.status === "at_risk" ? "tag-medium" : "tag-safe"}`}
                  style={{ fontSize: "0.75rem" }}
                >
                  {result.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Breach details */}
          {result.breaches.length > 0 && (
            <div className="card">
              <div className="card-title">BREACH DETAILS — {result.breach_count} INCIDENT(S)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {result.breaches.map((b, i) => (
                  <div
                    key={i}
                    style={{
                      border: `1px solid ${b.severity === "Critical" ? "var(--danger)" : "var(--border2)"}`,
                      background:
                        b.severity === "Critical"
                          ? "rgba(255,45,85,0.04)"
                          : "var(--bg)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="flex justify-between items-center"
                      style={{ padding: "12px 16px", cursor: "pointer" }}
                      onClick={() => setExpandedBreach(expandedBreach === i ? null : i)}
                    >
                      <div className="flex items-center gap-12">
                        <span className="font-sans" style={{ fontWeight: 600, letterSpacing: "0.1em", color: "var(--text)" }}>
                          {b.breach_name}
                        </span>
                        <span className={`tag ${getSeverityClass(b.severity)}`}>{b.severity}</span>
                        {b.password_exposed && (
                          <span className="tag tag-critical">⚠ PASSWORD LEAKED</span>
                        )}
                      </div>
                      <div className="flex items-center gap-12">
                        <span className="text-xs color-muted">{b.breach_date}</span>
                        <span style={{ color: "var(--text3)", fontSize: "0.8rem" }}>
                          {expandedBreach === i ? "▲" : "▼"}
                        </span>
                      </div>
                    </div>

                    {expandedBreach === i && (
                      <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--border)" }}>
                        <p className="text-sm" style={{ color: "var(--text2)", margin: "12px 0 12px" }}>
                          {b.description}
                        </p>
                        <div className="flex gap-8" style={{ flexWrap: "wrap", marginBottom: 8 }}>
                          <span className="text-xs color-muted">EXPOSED DATA:</span>
                          {b.data_classes.map((dc, j) => (
                            <span key={j} className="tag tag-medium">{dc}</span>
                          ))}
                        </div>
                        {b.password_exposed && b.exposed_password && (
                          <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(255,45,85,0.1)", border: "1px solid var(--danger)", borderRadius: 2 }}>
                            <span className="text-xs color-danger">⚠ EXPOSED PASSWORD: </span>
                            <span className="font-sans" style={{ color: "var(--danger)", fontWeight: 600, fontSize: "0.85rem" }}>
                              {b.exposed_password}
                            </span>
                            <span className="text-xs color-muted" style={{ marginLeft: 12 }}>CHANGE IMMEDIATELY</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {result.breaches.some((b) => b.password_exposed) && (
                <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(255,45,85,0.06)", border: "1px solid var(--danger)", borderRadius: 2 }}>
                  <div className="text-sm color-danger" style={{ fontWeight: "bold", marginBottom: 6 }}>
                    ⚠ IMMEDIATE ACTION REQUIRED
                  </div>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                    {["Change your password immediately on all affected platforms", "Enable Two-Factor Authentication (2FA)", "Check for unauthorized account access", "Use a unique password for each service"].map((t, i) => (
                      <li key={i} className="text-xs color-muted">
                        <span className="color-accent" style={{ marginRight: 8 }}>→</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="card" style={{ borderColor: "var(--danger)" }}>
          <div className="text-sm color-danger">⚠ {error}</div>
        </div>
      )}
    </div>
  );
}
