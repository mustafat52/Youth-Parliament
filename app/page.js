"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

const PAGE = 24;
const partyOf = (p) => p.party || "Other";

const EMPTY = {
  full_name: "", enrollment_no: "", email: "", phone: "",
  course: "", year: "", politician_id: "", website: "",
};

/* Parliament seating: three curved rows. Seats are lit left to right as politicians get taken. */
function Hemicycle({ total, taken }) {
  const seats = useMemo(() => {
    const radii = [60, 88, 116];
    const sum = radii.reduce((a, b) => a + b, 0);
    const all = [];
    radii.forEach((r) => {
      const n = Math.max(1, Math.round((total * r) / sum));
      for (let i = 0; i < n; i++) {
        const a = Math.PI - (Math.PI * (n === 1 ? 0.5 : i / (n - 1)));
        all.push({ x: 150 + r * Math.cos(a), y: 135 - r * Math.sin(a), a });
      }
    });
    return all.sort((p, q) => q.a - p.a);
  }, [total]);

  return (
    <svg className="hemi" viewBox="0 0 300 145" role="img"
      aria-label={`${taken} of ${total} seats filled`}>
      {seats.map((s, i) => (
        <circle key={i} className={i < Math.round((taken / Math.max(total, 1)) * seats.length) ? "seat on" : "seat"}
          cx={s.x} cy={s.y} r="6" />
      ))}
    </svg>
  );
}

export default function Home() {
  const [form, setForm] = useState(EMPTY);
  const [list, setList] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [party, setParty] = useState("");
  const [onlyFree, setOnlyFree] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/politicians", { cache: "no-store" });
      if (r.ok) setList(await r.json());
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const takenCount = list.filter((p) => p.taken).length;

  const partyList = useMemo(() => {
    const m = {};
    list.forEach((p) => {
      const k = partyOf(p);
      m[k] = m[k] || { total: 0, free: 0 };
      m[k].total += 1;
      if (!p.taken) m[k].free += 1;
    });
    return Object.entries(m).sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]));
  }, [list]);
  const topParties = partyList.slice(0, 5);
  const otherParties = partyList.slice(5);

  const shown = list.filter((p) => {
    if (party && partyOf(p) !== party) return false;
    if (onlyFree && p.taken) return false;
    return [p.name, p.party, p.constituency, p.role].join(" ").toLowerCase().includes(query.trim().toLowerCase());
  });
  const visible = shown.slice(0, limit);
  const chosen = list.find((p) => String(p.id) === String(form.politician_id));

  const pickParty = (v) => { setParty(v); setLimit(PAGE); };

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    if (!form.politician_id) return setMsg("Choose a politician from the list below.");
    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(list.find((p) => String(p.id) === String(form.politician_id)));
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setMsg(data.error || "Something went wrong.");
        if (res.status === 409) setForm((f) => ({ ...f, politician_id: "" }));
        load();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setMsg("No connection. Check your internet and try again.");
    }
    setBusy(false);
  }

  return (
    <>
      <header className="hero">
        <div className="uni">ITM University, Raipur</div>
        <h1>Youth Parliament Registration</h1>
        <p>Fill in your details and claim the politician you will represent. Each politician can be chosen by one student only.</p>
        <Hemicycle total={list.length} taken={takenCount} />
        <div className="count" aria-live="polite">
          {loaded ? <><strong>{takenCount}</strong> of <strong>{list.length}</strong> seats filled</> : "Loading seats..."}
        </div>
      </header>

      <main className="wrap">
        {done !== null ? (
          <section className="panel success" aria-live="polite">
            <h2>You are registered</h2>
            <p>Thank you for joining the ITM University Youth Parliament.</p>
            {done && <div className="chosen">Your politician: {done.name}{done.constituency ? `, ${done.constituency}` : ""}{done.party ? ` (${done.party})` : ""}</div>}
            <p className="hint" style={{ marginTop: 16 }}>Keep this screen for your records. The organisers will contact you by email or phone.</p>
          </section>
        ) : (
          <form onSubmit={submit} noValidate={false}>
            {msg && <div className="error" role="alert">{msg}</div>}

            <section className="panel">
              <h2>Your details</h2>
              <p className="hint">Use the same email and phone number that the organisers can reach you on.</p>
              <div className="grid two">
                <div className="field full">
                  <label htmlFor="full_name">Full name</label>
                  <input id="full_name" autoComplete="name" value={form.full_name} onChange={set("full_name")} required maxLength={100} />
                </div>
                <div className="field">
                  <label htmlFor="enrollment_no">Enrollment number</label>
                  <input id="enrollment_no" value={form.enrollment_no} onChange={set("enrollment_no")} required maxLength={40} />
                </div>
                <div className="field">
                  <label htmlFor="phone">Mobile number</label>
                  <input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10 digits" value={form.phone} onChange={set("phone")} required maxLength={14} />
                </div>
                <div className="field full">
                  <label htmlFor="email">Email address</label>
                  <input id="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} required />
                </div>
                <div className="field">
                  <label htmlFor="course">Course and branch</label>
                  <input id="course" placeholder="e.g. B.Tech CSE" value={form.course} onChange={set("course")} required maxLength={100} />
                </div>
                <div className="field">
                  <label htmlFor="year">Year of study</label>
                  <select id="year" value={form.year} onChange={set("year")} required>
                    <option value="">Select year</option>
                    {["1st year", "2nd year", "3rd year", "4th year", "5th year"].map((y) => <option key={y}>{y}</option>)}
                  </select>
                </div>
                {/* Honeypot: real students never see or fill this */}
                <div className="ghost" aria-hidden="true">
                  <label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} /></label>
                </div>
              </div>
            </section>

            <section className="panel">
              <h2>Choose your politician</h2>
              <p className="hint">Greyed names are already taken. The list updates automatically. Numbers show seats still free.</p>

              <div className="chips" role="group" aria-label="Filter by party">
                <button type="button" className="chip" aria-pressed={party === ""} onClick={() => pickParty("")}>
                  All <span>{list.length - takenCount}</span>
                </button>
                {topParties.map(([name, c]) => (
                  <button type="button" key={name} className="chip" aria-pressed={party === name} onClick={() => pickParty(name)}>
                    {name} <span>{c.free}</span>
                  </button>
                ))}
                {otherParties.length > 0 && (
                  <select className="chip chipselect" aria-label="Other parties"
                    value={otherParties.some(([n]) => n === party) ? party : ""} onChange={(e) => pickParty(e.target.value)}>
                    <option value="">Other parties...</option>
                    {otherParties.map(([name, c]) => <option key={name} value={name}>{name} ({c.free})</option>)}
                  </select>
                )}
              </div>

              <div className="filterrow">
                <input className="search" type="search" placeholder="Search by name or constituency" aria-label="Search politicians"
                  value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} />
                <label className="check">
                  <input type="checkbox" checked={onlyFree} onChange={(e) => { setOnlyFree(e.target.checked); setLimit(PAGE); }} />
                  Show available only
                </label>
              </div>

              {chosen && (
                <div className="picked" aria-live="polite">
                  Your choice: <b>{chosen.name}</b>{chosen.party ? ` (${chosen.party})` : ""}
                  <button type="button" className="linkclear" onClick={() => setForm((f) => ({ ...f, politician_id: "" }))}>Clear</button>
                </div>
              )}

              <fieldset className="tiles" style={{ minInlineSize: 0 }}>
                <legend className="ghost">Politician</legend>
                {visible.map((p) => (
                  <label className="tile" key={p.id}>
                    <input type="radio" name="politician" value={p.id} disabled={p.taken}
                      checked={String(form.politician_id) === String(p.id)} onChange={set("politician_id")} />
                    <span className="box">
                      <span>
                        <span className="nm">{p.name}</span>
                        <span className="pt">{[p.role, p.party, p.constituency].filter(Boolean).join(" | ")}</span>
                      </span>
                      <span className="tag">{p.taken ? "Taken" : form.politician_id == p.id ? "Selected" : "Available"}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              {shown.length > limit && (
                <button type="button" className="more" onClick={() => setLimit((l) => l + PAGE)}>
                  Show more ({shown.length - limit} left)
                </button>
              )}
              {loaded && shown.length === 0 && <p className="empty">{list.length ? "No politician matches your search." : "No politicians have been added yet."}</p>}
              {loaded && list.length > 0 && takenCount === list.length && <p className="empty">All seats are filled. Registration is full.</p>}
            </section>

            <button className="btn" disabled={busy || (loaded && takenCount === list.length)}>
              {busy ? "Registering..." : "Register now"}
            </button>
          </form>
        )}
      </main>
      <p className="foot">ITM University Raipur | Youth Parliament</p>
    </>
  );
}