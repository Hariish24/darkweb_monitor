import { useState, useEffect } from "react";

export default function BreachDB() {
  const [breaches, setBreaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/breaches")
      .then((r) => r.json())
      .then(setBreaches)
      .catch(() => setBreaches([]))
      .finally(() => setLoading(false));
  }, []);

  const SEVERITIES = ["ALL", "Critical", "High", "Medium", "Low"];

  const filtered = breaches.filter((b) => {
    const matchSev = filter === "ALL" || b.severity === filter;
    const matchSearch =
      !search ||
      b.breach_name.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase());
    return matchSev && matchSearch;
  });

  const getSevClass = (s) => ({ Critical: "tag-critical", High: "tag-high", Medium: "tag-medium", Low: "tag-low" }[s] || "tag-low");

  if (loading) return <div className="loader"><div className="loader-ring" /><div className="loader-text">LOADING BREACH DATABASE...</div></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-24">
        <div className="font-sans" style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "0.2em", color: "var(--text2)" }}>
          KNOWN BREACH DATABASE — {breaches.length} RECORDS
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-8 mb-16 items-center" style={{ flexWrap: "wrap" }}>
        <input
          className="input"
          style={{ maxWidth: 260, padding: "8px 14px" }}
          placeholder="SEARCH BREACHES..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-8">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              className={`btn ${filter === s ? "btn-primary" : "btn-ghost"} text-xs`}
              style={{ padding: "6px 14px" }}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
        {filtered.map((b, i) => (
          <div
            key={i}
            className="card"
            style={{
              borderColor: b.severity === "Critical" ? "rgba(255,45,85,0.3)" : b.severity === "High" ? "rgba(255,107,53,0.3)" : "var(--border2)",
            }}
          >
            <div className="flex justify-between items-center mb-12">
              <span className="font-sans" style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.1em", color: "var(--text)" }}>
                {b.breach_name}
              </span>
              <span className={`tag ${getSevClass(b.severity)}`}>{b.severity}</span>
            </div>

            <p className="text-xs" style={{ color: "var(--text3)", lineHeight: 1.6, marginBottom: 12 }}>
              {b.description}
            </p>

            <div className="flex gap-6" style={{ flexWrap: "wrap", marginBottom: 10 }}>
              {b.data_classes.map((dc, j) => (
                <span key={j} className="tag tag-low" style={{ fontSize: "0.55rem" }}>{dc}</span>
              ))}
            </div>

            <div className="text-xs color-muted">
              BREACH DATE: <span style={{ color: "var(--text2)" }}>{b.breach_date}</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "60px" }}>
          <div className="color-muted">NO MATCHING RECORDS FOUND</div>
        </div>
      )}
    </div>
  );
}
