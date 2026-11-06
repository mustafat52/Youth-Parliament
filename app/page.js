export default function Home() {
  return (
    <>
      <header className="hero">
        <div className="logobadge">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src="/itm-logo.png" alt="ITM University logo" />
        </div>
        <div className="uni">ITM University, Raipur</div>
        <h1>Youth Parliament Registration</h1>
      </header>
      <main className="wrap">
        <section className="panel success">
          <h2>Use your school's registration link</h2>
          <p>Every participating school has its own registration link. Please ask your teacher or coordinator for it and open that link to register.</p>
        </section>
      </main>
      <p className="foot">ITM University Raipur | Youth Parliament</p>
    </>
  );
}
