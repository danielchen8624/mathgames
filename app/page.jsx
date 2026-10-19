import Script from "next/script";

const difficulties = [
  ["Warm-up", "Friendly paths"],
  ["Focused", "A little friction"],
  ["Sharp", "Trickier routes"],
  ["Expert", "May be impossible"],
  ["Brutal", "No promises"],
];

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#" aria-label="Number Forge home">
        <span className="brand-mark" aria-hidden="true">
          <span /><span /><span /><span />
        </span>
        <span>NUMBER FORGE</span>
      </a>
      <div className="session-stats" aria-label="Session statistics">
        <div><span className="stat-label">Streak</span><strong id="streakStat">0</strong></div>
        <span className="stat-rule" aria-hidden="true" />
        <div><span className="stat-label">Solved</span><strong id="solvedStat">0</strong></div>
      </div>
    </header>
  );
}

function Controls() {
  return (
    <aside className="control-panel" aria-label="Game settings">
      <div className="panel-section">
        <div className="section-heading"><span>01</span><h2>Difficulty</h2></div>
        <div className="difficulty-list" id="difficultyList" role="radiogroup" aria-label="Difficulty">
          {difficulties.map(([name, description], level) => (
            <button className="difficulty-option" data-level={level} role="radio" aria-checked={level === 0} key={name}>
              <span className="level-dot" />
              <span><strong>{name}</strong><small>{description}</small></span>
            </button>
          ))}
        </div>
      </div>
      <div className="panel-section target-section">
        <div className="section-heading"><span>02</span><h2>Target</h2></div>
        <div className="target-grid" id="targetGrid">
          {[24, 36, 72, 73].map((target) => (
            <button className={`target-option${target === 24 ? " selected" : ""}`} data-target={target} key={target}>{target}</button>
          ))}
        </div>
        <label className="custom-target">
          <span>Custom target</span>
          <input id="customTarget" type="number" inputMode="numeric" min="1" max="999" placeholder="Enter 1–999" />
        </label>
      </div>
    </aside>
  );
}

function RefreshIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.34 5.66M20 4v7h-7" /></svg>;
}

function Game() {
  return (
    <section className="game-card" aria-labelledby="gameHeading">
      <div className="game-topline">
        <div>
          <span className="round-label" id="roundLabel">Warm-up · Round 1</span>
          <h2 id="gameHeading">Build <span id="targetValue">24</span></h2>
        </div>
        <button className="icon-button" id="newPuzzleButton" type="button" aria-label="New puzzle" title="New puzzle"><RefreshIcon /></button>
      </div>
      <div className="progress-track" aria-hidden="true"><span id="progressBar" /></div>
      <div className="status-area" aria-live="polite">
        <p id="instruction">Choose a number, an operation, then another number.</p>
        <div className="feedback" id="feedback" hidden />
      </div>
      <div className="number-board" id="numberBoard" aria-label="Number cards" />
      <div className="operation-row" id="operationRow" aria-label="Operations">
        <button data-op="+" aria-label="Add">+</button>
        <button data-op="−" aria-label="Subtract">−</button>
        <button data-op="×" aria-label="Multiply">×</button>
        <button data-op="÷" aria-label="Divide">÷</button>
      </div>
      <div className="workbench" id="workbench" aria-live="polite">
        <span className="workbench-label">Your work</span>
        <div className="steps" id="steps"><span className="empty-step">Your equations will appear here</span></div>
      </div>
      <div className="game-actions">
        <button className="text-button" id="undoButton" type="button" disabled>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7 4 12l5 5M5 12h9a5 5 0 0 1 5 5" /></svg>Undo
        </button>
        <button className="text-button" id="impossibleButton" type="button" hidden>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" /></svg>No solution
        </button>
        <span className="action-spacer" />
        <button className="reveal-button" id="revealButton" type="button">Reveal solution</button>
      </div>
    </section>
  );
}

function Rules() {
  return (
    <section className="rules-strip" aria-label="How to play">
      <div className="rules-title"><span>THE RULES</span><strong>Four cards.<br />One target.</strong></div>
      <div className="rule"><span>1</span><p>Use all four number cards exactly once.</p></div>
      <div className="rule"><span>2</span><p>Add, subtract, multiply, or divide.</p></div>
      <div className="rule"><span>3</span><p>Intermediate fractions and negative values are fair game.</p></div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="page-shell">
      <Header />
      <main>
        <section className="hero" aria-labelledby="pageTitle">
          <div className="eyebrow"><span />Daily arithmetic training</div>
          <h1 id="pageTitle">Make the target.</h1>
          <p>Use every number exactly once. Combine them with basic operations. Think sharp.</p>
        </section>
        <section className="game-layout"><Controls /><Game /></section>
        <Rules />
      </main>
      <footer><span>NUMBER FORGE / MENTAL MATH LAB</span><span>Progress saves on this device</span></footer>
      <template id="numberCardTemplate">
        <button className="number-card" type="button">
          <span className="card-index" /><strong className="card-value" /><small className="card-expression" />
        </button>
      </template>
      <Script src="/game.js" strategy="afterInteractive" />
    </div>
  );
}
