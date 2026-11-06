"use client";
import { useCallback, useEffect, useState } from "react";

const ADMIN_NAME = "Alefiyah";

const when = (d) =>
  new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const today = () =>
  new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long", year: "numeric" });

const initials = (n = "") =>
  n.trim().split(/\s+/).slice(0, 2).map((w) => (w[0] || "").toUpperCase()).join("");

const partyColor = (name = "") => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h}, 60%, 42%)`;
};

function Party({ p }) {
  if (!p) return null;
  return (
    <span className="apparty">
      <i className="pdot" style={{ background: partyColor(p.party || "") }} />
      {p.party}{p.party && p.constituency ? " | " : ""}{p.constituency}
    </span>
  );
}

export default function Admin() {
  const [state, setState] = useState("checking"); // checking | login | ready
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);
  const [totalPol, setTotalPol] = useState(0);
  const [q, setQ] = useState("");
  const [yearF, setYearF] = useState("");
  const [partyF, setPartyF] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/registrations", { cache: "no-store" });
    if (r.status === 401) return setState("login");
    if (!r.ok) { setErr("Could not load data."); return setState("ready"); }
    const d = await r.json();
    setRows(d.registrations);
    setTotalPol(d.totalPoliticians);
    setErr("");
    setState("ready");
  }, []);

  useEffect(() => { load(); }, [load]);

  // Keep the list fresh while the admin page stays open
  useEffect(() => {
    if (state !== "ready") return;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [state, load]);

  async function login(e) {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/admin/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }),
    });
    const d = await r.json();
    if (!r.ok) return setErr(d.error || "Could not sign in.");
    setPw("");
    load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setRows([]);
    setState("login");
  }

  async function remove(r) {
    if (!confirm(`Delete the registration of ${r.full_name}?\n${r.politicians?.name || "Their politician"} will become available again.`)) return;
    const res = await fetch(`/api/admin/registrations?id=${r.id}`, { method: "DELETE" });
    if (res.ok) load(); else setErr("Could not delete. Try again.");
  }

  const years = [...new Set(rows.map((r) => r.year))].sort();
  const parties = [...new Set(rows.map((r) => r.politicians?.party).filter(Boolean))].sort();
  const shown = rows.filter((r) => {
    if (yearF && r.year !== yearF) return false;
    if (partyF && r.politicians?.party !== partyF) return false;
    const hay = [r.full_name, r.enrollment_no, r.email, r.phone, r.course, r.politicians?.name, r.politicians?.party, r.politicians?.constituency].join(" ").toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });
  const pct = totalPol ? Math.round((rows.length / totalPol) * 100) : 0;

  if (state === "checking") return <main className="wrap"><p>Loading...</p></main>;

  if (state === "login")
    return (
      <main className="wrap loginwrap">
        <section className="panel logincard">
          <span className="alogo big"><img src="/itm-logo.png" alt="ITM University" /></span>
          <h2>Welcome, {ADMIN_NAME}</h2>
          <p className="hint">Sign in to manage the Youth Parliament registrations.</p>
          {err && <div className="error" role="alert">{err}</div>}
          <form onSubmit={login}>
            <div className="field" style={{ marginBottom: 16, textAlign: "left" }}>
              <label htmlFor="pw">Password</label>
              <input id="pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required autoFocus />
            </div>
            <button className="btn">Sign in</button>
          </form>
        </section>
      </main>
    );

  return (
    <>
      <header className="adminbar">
        <div className="abrand">
          <span className="alogo"><img src="/itm-logo.png" alt="ITM University" /></span>
          <div>
            <strong>Youth Parliament Admin</strong>
            <span className="sub">ITM University, Raipur</span>
          </div>
        </div>
        <button className="linkbtn" onClick={logout}>Sign out</button>
      </header>

      <main className="wrap admin">
        <section className="welcome">
          <div className="wavatar" aria-hidden="true">{ADMIN_NAME[0]}</div>
          <div>
            <h1>Welcome, {ADMIN_NAME}</h1>
            <p>{today()} | Here is how the registrations are going.</p>
          </div>
        </section>

        {err && <div className="error" role="alert">{err}</div>}

        <div className="stats">
          <div className="stat s-reg"><span>Registered students</span><b>{rows.length}</b></div>
          <div className="stat s-free"><span>Politicians still free</span><b>{Math.max(totalPol - rows.length, 0)}</b></div>
          <div className="stat s-tot"><span>Total politicians</span><b>{totalPol}</b></div>
        </div>

        <div className="progress">
          <div className="ptext"><span>Seats filled</span><b>{pct}%</b></div>
          <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${pct}%` }} /></div>
        </div>

        <div className="toolbar">
          <input className="search" type="search" placeholder="Search name, enrollment, email, politician" aria-label="Search registrations"
            value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="search" aria-label="Filter by party" value={partyF} onChange={(e) => setPartyF(e.target.value)}>
            <option value="">All parties</option>
            {parties.map((y) => <option key={y}>{y}</option>)}
          </select>
          <select className="search" aria-label="Filter by year" value={yearF} onChange={(e) => setYearF(e.target.value)}>
            <option value="">All years</option>
            {years.map((y) => <option key={y}>{y}</option>)}
          </select>
          <button className="btn small ghostbtn" onClick={load}>Refresh</button>
          <a className="btn small" href="/api/admin/export">Download CSV</a>
        </div>

        <p className="hint">Showing {shown.length} of {rows.length}</p>

        {shown.length === 0 ? (
          <p className="empty">{rows.length ? "No registration matches your search." : "No registrations yet."}</p>
        ) : (
          <>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Student</th><th>Contact</th><th>Course</th><th>Politician</th><th>Registered</th><th><span className="ghost">Actions</span></th></tr>
                </thead>
                <tbody>
                  {shown.map((r, i) => (
                    <tr key={r.id}>
                      <td className="muted">{shown.length - i}</td>
                      <td>
                        <div className="person">
                          <span className="av">{initials(r.full_name)}</span>
                          <span><b>{r.full_name}</b><br /><span className="muted">{r.enrollment_no}</span></span>
                        </div>
                      </td>
                      <td>{r.email}<br /><span className="muted">{r.phone}</span></td>
                      <td>{r.course}<br /><span className="muted">{r.year}</span></td>
                      <td><b>{r.politicians?.name}</b><br /><Party p={r.politicians} /></td>
                      <td className="muted">{when(r.created_at)}</td>
                      <td><button className="danger" onClick={() => remove(r)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="cards">
              {shown.map((r) => (
                <article className="rcard" key={r.id}>
                  <div className="person">
                    <span className="av">{initials(r.full_name)}</span>
                    <span>
                      <h3>{r.full_name}</h3>
                      <span className="muted">{r.enrollment_no} | {r.course}, {r.year}</span>
                    </span>
                  </div>
                  <p><a href={`mailto:${r.email}`}>{r.email}</a><br /><a href={`tel:${r.phone}`}>{r.phone}</a></p>
                  <p className="pol">{r.politicians?.name}</p>
                  <p><Party p={r.politicians} /></p>
                  <p className="muted">{when(r.created_at)}</p>
                  <button className="danger" onClick={() => remove(r)}>Delete</button>
                </article>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}