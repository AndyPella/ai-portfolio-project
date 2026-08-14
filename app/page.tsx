import snapshot from "../data/northstar-ridge-demo-data.json";
import { validateNorthstarRidgeDataset } from "../data/northstar-ridge-data";

validateNorthstarRidgeDataset(snapshot);

const ArrowIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20">
    <path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" />
  </svg>
);

const HeadsetIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M4 13v-1a8 8 0 0 1 16 0v1M4 13h3v6H5a1 1 0 0 1-1-1v-5Zm16 0h-3v6h2a1 1 0 0 0 1-1v-5ZM17 19c0 1.1-.9 2-2 2h-3" />
  </svg>
);

const WrenchIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M14.5 6.5a4 4 0 0 0-5-5L12 4 9 7 6.5 4.5a4 4 0 0 0 5 5L4 17l3 3 7.5-7.5a4 4 0 0 0 5-5L17 10l-3-3 2.5-2.5" />
  </svg>
);

const MountainMark = () => (
  <svg aria-hidden="true" className="brand-mark" viewBox="0 0 48 48">
    <path d="M5 36 18.3 12l5.8 10.2L29.5 14 43 36H5Z" />
    <path d="m13 36 11-20 11 20" />
  </svg>
);

export default function Home() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#main" aria-label="Northstar Ridge home">
          <MountainMark />
          <span><strong>Northstar Ridge</strong><small>Equipment Group</small></span>
        </a>
        <span className="demo-label">Self-guided demo</span>
      </header>

      <main id="main">
        <section className="hero" aria-labelledby="page-title">
          <div className="eyebrow"><span /> Equipment readiness</div>
          <h1 id="page-title">The right equipment.<br /><em>Ready when it matters.</em></h1>
          <p className="hero-copy">
            Explore how Northstar Ridge teams will assess equipment status, surface
            operational needs, and coordinate the work that keeps the fleet moving.
          </p>
          <div className="notice" role="note">
            <span aria-hidden="true">i</span>
            <div><strong>Demo uses fictional data</strong><p>No customer, employee, or equipment records shown in this experience are real.</p></div>
          </div>
        </section>

        <section className="workflows" aria-labelledby="workflow-title">
          <div className="section-heading">
            <div><p className="section-kicker">Choose your role</p><h2 id="workflow-title">How would you like to begin?</h2></div>
            <p>Select a workspace to preview its planned equipment-readiness workflow.</p>
          </div>
          <div className="card-grid">
            <article className="workflow-card">
              <div className="icon-box"><HeadsetIcon /></div>
              <div className="card-copy"><p className="card-number">Workspace 01</p><h3>Customer Service</h3><p>Find suitable equipment and review readiness in the context of a customer request.</p></div>
              <span className="coming-soon">Coming soon</span>
              <span className="card-link" aria-hidden="true">Enter workspace <ArrowIcon /></span>
            </article>
            <article className="workflow-card">
              <div className="icon-box"><WrenchIcon /></div>
              <div className="card-copy"><p className="card-number">Workspace 02</p><h3>Mechanic</h3><p>Review required work, document service evidence, and return equipment to operation.</p></div>
              <span className="coming-soon">Coming soon</span>
              <span className="card-link" aria-hidden="true">Enter workspace <ArrowIcon /></span>
            </article>
          </div>
        </section>
      </main>

      <footer><p>Northstar Ridge Equipment Group</p><p>Operational Readiness Demo · Foundation release</p></footer>
    </div>
  );
}
