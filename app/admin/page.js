"use client";
import { useCallback, useEffect, useState } from "react";

const when = (d) =>
  new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Admin() {
  const [state, setState] = useState("checking"); // checking | login | ready
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);
  const [totalPol, setTotalPol] = useState(0);
  const [q, setQ] = useState("");
  const [yearF, setYearF] = useState("");

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
  const shown = rows.filter((r) => {
    if (yearF && r.year !== yearF) return false;
    const hay = [r.full_name, r.enrollment_no, r.email, r.phone, r.course, r.politicians?.name, r.politicians?.party].join(" ").toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  if (state === "checking") return <main className="wrap"><p>Loading...</p></main>;

  if (state === "login")
    return (
      <main className="wrap" style={{ maxWidth: 420, paddingTop: 48 }}>
        <section className="panel">
          <h2>Admin sign in</h2>
          <p className="hint">Youth Parliament, ITM University Raipur</p>
          {err && <div className="error" role="alert">{err}</div>}
          <form onSubmit={login}>
            <div className="field" style={{ marginBottom: 16 }}>
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
        <div>
          <strong>Youth Parliament admin</strong>
          <span className="sub">ITM University, Raipur</span>
        </div>
        <button className="linkbtn" onClick={logout}>Sign out</button>
      </header>

      <main className="wrap admin">
        {err && <div className="error" role="alert">{err}</div>}

        <div className="stats">
          <div className="stat"><b>{rows.length}</b><span>Registered students</span></div>
          <div className="stat"><b>{Math.max(totalPol - rows.length, 0)}</b><span>Politicians still free</span></div>
          <div className="stat"><b>{totalPol}</b><span>Total politicians</span></div>
        </div>

        <div className="tools">
          <input className="search" type="search" placeholder="Search name, enrollment, email, politician" aria-label="Search registrations"
            value={q} onChange={(e) => setQ(e.target.value)} />
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
                      <td>{shown.length - i}</td>
                      <td><b>{r.full_name}</b><br /><span className="muted">{r.enrollment_no}</span></td>
                      <td>{r.email}<br /><span className="muted">{r.phone}</span></td>
                      <td>{r.course}<br /><span className="muted">{r.year}</span></td>
                      <td><b>{r.politicians?.name}</b><br /><span className="muted">{r.politicians?.party}</span></td>
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
                  <h3>{r.full_name}</h3>
                  <p className="muted">{r.enrollment_no} | {r.course}, {r.year}</p>
                  <p><a href={`mailto:${r.email}`}>{r.email}</a><br /><a href={`tel:${r.phone}`}>{r.phone}</a></p>
                  <p className="pol">{r.politicians?.name}{r.politicians?.party ? ` (${r.politicians.party})` : ""}</p>
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
