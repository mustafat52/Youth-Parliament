"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { slugify } from "@/lib/slug";

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

const json = { "Content-Type": "application/json" };

export default function Admin() {
  const [state, setState] = useState("checking"); // checking | login | ready
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);
  const [schools, setSchools] = useState([]);
  const [totalPol, setTotalPol] = useState(0);
  const [q, setQ] = useState("");
  const [yearF, setYearF] = useState("");
  const [partyF, setPartyF] = useState("");
  const [schoolF, setSchoolF] = useState("");
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [copied, setCopied] = useState("");
  const regRef = useRef(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      fetch("/api/admin/registrations", { cache: "no-store" }),
      fetch("/api/admin/schools", { cache: "no-store" }),
    ]);
    if (a.status === 401 || b.status === 401) return setState("login");
    if (!a.ok || !b.ok) { setErr("Could not load data."); return setState("ready"); }
    const d = await a.json();
    const s = await b.json();
    setRows(d.registrations);
    setSchools(s.schools);
    setTotalPol(d.totalPoliticians);
    setErr("");
    setState("ready");
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (state !== "ready") return;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [state, load]);

  async function login(e) {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/admin/login", { method: "POST", headers: json, body: JSON.stringify({ password: pw }) });
    const d = await r.json();
    if (!r.ok) return setErr(d.error || "Could not sign in.");
    setPw("");
    load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setRows([]); setSchools([]);
    setState("login");
  }

  async function createSchool(e) {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/admin/schools", { method: "POST", headers: json, body: JSON.stringify({ name: newName, slug: newSlug || slugify(newName) }) });
    const d = await r.json();
    if (!r.ok) return setErr(d.error || "Could not create the school.");
    setNewName(""); setNewSlug(""); setSlugTouched(false);
    load();
  }

  async function toggleOpen(s) {
    const r = await fetch("/api/admin/schools", { method: "PATCH", headers: json, body: JSON.stringify({ id: s.id, is_open: !s.is_open }) });
    if (r.ok) load(); else setErr("Could not update the school.");
  }

  async function removeSchool(s) {
    if (!confirm(`Delete "${s.name}" and its ${s.count} registration(s)?\nThe link will stop working. This cannot be undone.`)) return;
    const r = await fetch(`/api/admin/schools?id=${s.id}`, { method: "DELETE" });
    if (r.ok) { if (schoolF === s.slug) setSchoolF(""); load(); } else setErr("Could not delete the school.");
  }

  async function copyLink(s) {
    const link = `${origin}/${s.slug}`;
    try { await navigator.clipboard.writeText(link); setCopied(s.slug); setTimeout(() => setCopied(""), 1800); }
    catch { window.prompt("Copy this link:", link); }
  }

  function viewSchool(slug) {
    setSchoolF(slug);
    setTimeout(() => regRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function remove(r) {
    if (!confirm(`Delete the registration of ${r.full_name}?\n${r.politicians?.name || "Their politician"} will become available again for ${r.schools?.name || "that school"}.`)) return;
    const res = await fetch(`/api/admin/registrations?id=${r.id}`, { method: "DELETE" });
    if (res.ok) load(); else setErr("Could not delete. Try again.");
  }

  const inSchool = rows.filter((r) => !schoolF || r.schools?.slug === schoolF);
  const years = [...new Set(inSchool.map((r) => r.year))].sort();
  const parties = [...new Set(inSchool.map((r) => r.politicians?.party).filter(Boolean))].sort();
  const shown = inSchool.filter((r) => {
    if (yearF && r.year !== yearF) return false;
    if (partyF && r.politicians?.party !== partyF) return false;
    const hay = [r.full_name, r.enrollment_no, r.email, r.phone, r.course, r.schools?.name, r.politicians?.name, r.politicians?.party, r.politicians?.constituency].join(" ").toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });
  const selected = schools.find((s) => s.slug === schoolF);
  const pct = selected && totalPol ? Math.round((selected.count / totalPol) * 100) : 0;

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

        {/* ---------- Schools ---------- */}
        <section className="panel">
          <h2>Schools and registration links</h2>
          <p className="hint">Create a school to get its own link. Every school gets all {totalPol} politicians, and the same politician can be chosen once per school.</p>

          <form className="newschool" onSubmit={createSchool}>
            <div className="field">
              <label htmlFor="sname">School name</label>
              <input id="sname" value={newName} maxLength={120} placeholder="e.g. Delhi Public School, Raipur" required
                onChange={(e) => { setNewName(e.target.value); if (!slugTouched) setNewSlug(slugify(e.target.value)); }} />
            </div>
            <div className="field">
              <label htmlFor="sslug">Link name</label>
              <input id="sslug" value={newSlug} maxLength={50} placeholder="delhi-public-school"
                onChange={(e) => { setSlugTouched(true); setNewSlug(slugify(e.target.value)); }} />
            </div>
            <button className="btn small">Create link</button>
          </form>
          <p className="hint" style={{ margin: "8px 0 18px" }}>
            Link preview: <code>{origin}/{newSlug || "link-name"}</code>
          </p>

          {schools.length === 0 ? (
            <p className="empty">No schools yet. Create the first one above.</p>
          ) : (
            <div className="schoolgrid">
              {schools.map((s) => (
                <article className="scard" key={s.id}>
                  <div className="shead">
                    <h3>{s.name}</h3>
                    <span className={`spill ${s.is_open ? "open" : "closed"}`}>{s.is_open ? "Open" : "Closed"}</span>
                  </div>
                  <div className="linkrow">
                    <code>{origin}/{s.slug}</code>
                    <button type="button" className="copybtn" onClick={() => copyLink(s)}>{copied === s.slug ? "Copied" : "Copy"}</button>
                  </div>
                  <div className="ptext"><span>Registered</span><b>{s.count} / {totalPol}</b></div>
                  <div className="bar"><i style={{ width: `${totalPol ? Math.round((s.count / totalPol) * 100) : 0}%` }} /></div>
                  <div className="sactions">
                    <button type="button" className="mini" onClick={() => viewSchool(s.slug)}>View data</button>
                    <a className="mini" href={`/api/admin/export?school=${s.slug}`}>CSV</a>
                    <button type="button" className="mini" onClick={() => toggleOpen(s)}>{s.is_open ? "Close" : "Reopen"}</button>
                    <button type="button" className="mini dangerm" onClick={() => removeSchool(s)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ---------- Registrations ---------- */}
        <div ref={regRef} className="anchor" />
        <div className="stats">
          <div className="stat s-reg"><span>{selected ? "Registered at this school" : "Registered (all schools)"}</span><b>{inSchool.length}</b></div>
          <div className="stat s-free"><span>{selected ? "Politicians still free" : "Schools"}</span><b>{selected ? Math.max(totalPol - selected.count, 0) : schools.length}</b></div>
          <div className="stat s-tot"><span>Politicians per school</span><b>{totalPol}</b></div>
        </div>

        {selected && (
          <div className="progress">
            <div className="ptext"><span>{selected.name}: seats filled</span><b>{pct}%</b></div>
            <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${pct}%` }} /></div>
          </div>
        )}

        <div className="toolbar2">
          <select className="search" aria-label="Filter by school" value={schoolF} onChange={(e) => { setSchoolF(e.target.value); setYearF(""); setPartyF(""); }}>
            <option value="">All schools</option>
            {schools.map((s) => <option key={s.id} value={s.slug}>{s.name} ({s.count})</option>)}
          </select>
          <input className="search grow" type="search" placeholder="Search name, enrollment, email, politician" aria-label="Search registrations"
            value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="search" aria-label="Filter by party" value={partyF} onChange={(e) => setPartyF(e.target.value)}>
            <option value="">All parties</option>
            {parties.map((y) => <option key={y}>{y}</option>)}
          </select>
          <select className="search" aria-label="Filter by class or year" value={yearF} onChange={(e) => setYearF(e.target.value)}>
            <option value="">All classes</option>
            {years.map((y) => <option key={y}>{y}</option>)}
          </select>
          <button className="btn small ghostbtn" onClick={load}>Refresh</button>
          <a className="btn small" href={`/api/admin/export${schoolF ? `?school=${schoolF}` : ""}`}>Download CSV</a>
        </div>

        <p className="hint">Showing {shown.length} of {inSchool.length}{selected ? ` at ${selected.name}` : ""}</p>

        {shown.length === 0 ? (
          <p className="empty">{inSchool.length ? "No registration matches your search." : "No registrations yet."}</p>
        ) : (
          <>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Student</th><th>School</th><th>Contact</th><th>Class</th><th>Politician</th><th>Registered</th><th><span className="ghost">Actions</span></th></tr>
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
                      <td>{r.schools?.name}</td>
                      <td>{r.email}<br /><span className="muted">{r.phone}</span></td>
                      <td>{r.year}<br /><span className="muted">{r.course}</span></td>
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
                      <span className="muted">{r.enrollment_no} | {r.year}, {r.course}</span>
                    </span>
                  </div>
                  <p className="schooltag">{r.schools?.name}</p>
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
