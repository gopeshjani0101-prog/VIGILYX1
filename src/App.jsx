
import { useState } from "react";
import "./App.css";

const initialPasses = [
  { id: "VG-1042", visitor: "Aarav Sharma", resident: "Flat A-204", expires: "18:00", status: "Expired" },
  { id: "VG-1043", visitor: "Meera Patel", resident: "Flat B-110", expires: "21:00", status: "Valid" },
  { id: "VG-1044", visitor: "Delivery Partner", resident: "Flat C-302", expires: "20:30", status: "Valid" },
];

const initialEvents = [
  { time: "18:14:08", type: "GATE SENSOR", title: "Gate entry signal received", detail: "Simulated gate controller · Entry observed", level: "warning" },
  { time: "18:13:51", type: "RING SIMULATION", title: "Motion event detected", detail: "Simulated Ring event · Does not confirm identity or entry", level: "info" },
  { time: "18:00:00", type: "ACCESS POLICY", title: "Visitor pass expired", detail: "VG-1042 · Resident approval required for a new pass", level: "danger" },
];

export default function App() {
  const [passes, setPasses] = useState(initialPasses);
  const [events, setEvents] = useState(initialEvents);
  const [selected, setSelected] = useState("VG-1042");
  const [visitor, setVisitor] = useState("");
  const [resident, setResident] = useState("");
  const [aiText, setAiText] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const flagged = passes.filter(p => p.status === "Expired").length;

const hasGateEntry = events.some(
  ev =>
    ev.type === "GATE SENSOR" &&
    /entry/i.test(`${ev.title} ${ev.detail}`)
);

const triage = (() => {
  if (flagged > 0 && hasGateEntry) {
    return {
      level: "REVIEW REQUIRED",
      title: "Expired pass + gate-entry signal",
      reason: `${flagged} expired pass(es) and a gate-entry signal are present in the demo records.`,
      action:
        "Verify visitor authorization, gate logs, and available camera evidence."
    };
  }

  if (flagged > 0) {
    return {
      level: "CHECK PASSES",
      title: "Expired visitor pass detected",
      reason: `${flagged} pass(es) require verification.`,
      action:
        "Check authorization records and request resident approval if needed."
    };
  }

  if (hasGateEntry) {
    return {
      level: "ROUTINE REVIEW",
      title: "Gate-entry signal recorded",
      reason: "A gate-entry signal exists, but no expired passes are recorded.",
      action: "Verify the associated authorization and gate records."
    };
  }

  return {
    level: "NO ACTIVE FLAGS",
    title: "No rule-based flags detected",
    reason: "The current demo records do not match the configured triage rules.",
    action:
      "Continue monitoring. This does not guarantee that the site is secure."
  };
})();


  function simulateEvent() {
    const now = new Date().toLocaleTimeString("en-GB", { hour12: false });
    setEvents(prev => [
      { time: now, type: "RING SIMULATION", title: "New simulated motion event", detail: "Motion alone does not establish unauthorized entry.", level: "info" },
      ...prev,
    ]);
    setNotice("Simulated event added. This is not a live Ring feed.");
  }

  function createPass(e) {
    e.preventDefault();
    if (!visitor.trim() || !resident.trim()) return;
    const id = `VG-${Math.floor(1000 + Math.random() * 9000)}`;
    setPasses(prev => [
      { id, visitor: visitor.trim(), resident: resident.trim(), expires: "23:59", status: "Valid" },
      ...prev,
    ]);
    setSelected(id);
    setVisitor("");
    setResident("");
    setNotice(`Demo pass ${id} created. Resident approval is simulated.`);
  }

  async function investigate() {
    setLoading(true);
    setAiText("");
    const prompt = `You are VIGILYX, an assistant for a residential security guard. Analyze only these simulated records: gate entry signal at 18:14:08, camera motion event at 18:13:51, visitor pass VG-1042 expired at 18:00. State confirmed facts, uncertainties, and safe next steps. Do not claim camera motion proves identity or entry. Recommend human review. Keep under 160 words.`;
    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "qwen2.5:3b", prompt, stream: false }),
      });
      if (!response.ok) throw new Error("Ollama API returned an error");
      const data = await response.json();
      setAiText(data.response || "No response returned.");
    } catch {
      setAiText("Local AI could not be reached. Check that Ollama is running and that qwen2.5:3b is installed. Meanwhile: verify the pass and gate records manually. Motion alone does not prove entry or identity.");
    } finally {
      setLoading(false);
    }
  }

  function reviewPass(id) {
    setNotice(`Guard review requested for ${id}. No gate action was taken.`);
    setEvents(prev => [
      { time: new Date().toLocaleTimeString("en-GB", { hour12: false }), type: "GUARD REVIEW", title: `Review requested for ${id}`, detail: "Human verification required · No automatic access decision", level: "warning" },
      ...prev,
    ]);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">V</span><div><b>VIGILYX</b><small>RESIDENTIAL SECURITY</small></div></div>
        <div className="live-pill"><span /> DEMO ENVIRONMENT</div>
        <nav><div className="nav-item active">◈ <span>Security overview</span></div><div className="nav-item">▤ <span>Visitor passes</span></div><div className="nav-item">◎ <span>Incident investigator</span></div></nav>
        <div className="side-note"><b>System status</b><p>Local AI: Qwen 2.5 3B</p><p>Events: Simulated</p><p>Gate control: Not connected</p></div>
        <div className="side-footer">Every Entry Verified.<br/>Every Threat Flagged.<br/>Every Incident Explained.</div>
      </aside>

      <main className="main">
        <header className="topbar"><div><small>SECURITY OPERATIONS / OVERVIEW</small><h1>Security overview</h1><p>Monitor access anomalies and investigate suspicious sequences.</p></div><div className="demo-label">● SIMULATED DATA</div></header>

        {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")}>Dismiss</button></div>}

        <section className="metrics">
          <article className="metric"><span>VISITOR PASSES</span><strong>{passes.length}</strong><small>Total demo records</small></article>
          <article className="metric"><span>EXPIRED PASSES</span><strong className="red">{flagged}</strong><small>Require verification</small></article>
          <article className="metric"><span>SECURITY EVENTS</span><strong>{events.length}</strong><small>Simulated event log</small></article>
          <article className="metric"><span>GATE STATUS</span><strong className="amber">REVIEW</strong><small>No automatic gate control</small></article>
        </section>

        <div className="content-grid">
          
<section className="panel triage-panel">
  <div className="panel-head">
    <div>
      <h2>Automatic Incident Triage</h2>
      <p>Rule-based assessment of available demo records</p>
    </div>
    <span className="triage-badge">{triage.level}</span>
  </div>

  <h3>{triage.title}</h3>
  <p>{triage.reason}</p>

  <div className="triage-action">
    <b>Recommended next step</b>
    <p>{triage.action}</p>
  </div>

  <button
    className="secondary"
    onClick={() => reviewPass(selected)}
  >
    Request guard review
  </button>

  <div className="safety-note">
    Automated triage identifies patterns, not proof of unauthorized entry.
    Human verification is required.
  </div>
</section>

          <section className="panel">
            <div className="panel-head"><div><h2>Incident timeline</h2><p>Correlated demo events · newest first</p></div><button className="secondary" onClick={simulateEvent}>＋ Simulate event</button></div>
            <div className="timeline">{events.map((ev, i) => <div className="event" key={`${ev.time}-${i}`}><div className={`event-dot ${ev.level}`}/><div className="event-body"><div className="event-meta"><b>{ev.type}</b><time>{ev.time}</time></div><h3>{ev.title}</h3><p>{ev.detail}</p></div></div>)}</div>
            <div className="panel-foot">Demo data only · Ring device is not connected</div>
          </section>

          <section className="panel">
            <div className="panel-head"><div><h2>AI incident investigator</h2><p>Local model · no paid AI API</p></div><span className="model-chip">QWEN 2.5 3B</span></div>
            <div className="incident-card"><span className="severity">NEEDS REVIEW</span><h3>Expired pass + entry signal</h3><p>VG-1042 · Gate signal 18:14 · Pass expired 18:00</p></div>
            <button className="primary full" onClick={investigate} disabled={loading}>{loading ? "Investigating…" : "✦ Investigate with local AI"}</button>
            {aiText && <div className="ai-result"><b>Investigation result</b><p>{aiText}</p></div>}
            <div className="safety-note">AI assists investigation; it does not authorize entry. Verify evidence and follow site policy.</div>
          </section>
        </div>

        <div className="lower-grid">
          <section className="panel">
            <div className="panel-head"><div><h2>Guest pass register</h2><p>Time-limited demo authorization records</p></div></div>
            <div className="pass-list">{passes.map(p => <button key={p.id} className={`pass-row ${selected === p.id ? "chosen" : ""}`} onClick={() => setSelected(p.id)}><span className="pass-icon">ID</span><span className="pass-info"><b>{p.visitor}</b><small>{p.id} · {p.resident} · Expires {p.expires}</small></span><span className={`status ${p.status === "Valid" ? "valid" : "expired"}`}>{p.status}</span></button>)}</div>
            <button className="secondary full" onClick={() => reviewPass(selected)}>Request guard review for selected pass</button>
          </section>
          <section className="panel">
            <div className="panel-head"><div><h2>Create a guest pass</h2><p>Demo only; approval is not verified</p></div></div>
            <form className="pass-form" onSubmit={createPass}><label>Visitor name<input value={visitor} onChange={e => setVisitor(e.target.value)} placeholder="e.g. Riya Shah" required /></label><label>Resident / flat<input value={resident} onChange={e => setResident(e.target.value)} placeholder="e.g. Flat A-102" required /></label><button className="primary full" type="submit">＋ Create demo pass</button></form>
          </section>
        </div>

        <footer>VIGILYX · LOCAL PROTOTYPE · SIMULATED EVENTS · HUMAN OVERSIGHT REQUIRED</footer>
      </main>
    </div>
  );
}
