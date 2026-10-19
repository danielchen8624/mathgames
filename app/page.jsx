import Script from "next/script";

const difficulties = ["Easy", "Medium", "Hard", "Expert", "Brutal"];

function RefreshIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.34 5.66M20 4v7h-7" /></svg>;
}

export default function Home() {
  return (
    <main className="game-shell">
      <header className="page-header">
        <div>
          <p className="kicker">Number game</p>
          <h1>Make the target</h1>
          <p className="subtitle">Use all four numbers once to reach the target.</p>
        </div>
        <div className="session-stats" aria-label="Session statistics">
          <span>Streak <strong id="streakStat">0</strong></span>
          <span>Solved <strong id="solvedStat">0</strong></span>
        </div>
      </header>

      <section className="settings" aria-label="Game settings">
        <div className="setting-group">
          <span className="setting-label">Difficulty</span>
          <div className="difficulty-list" id="difficultyList" role="radiogroup" aria-label="Difficulty">
            {difficulties.map((name, level) => (
              <button
                className="difficulty-option"
                data-level={level}
                role="radio"
                aria-checked={level === 0}
                key={name}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-group target-settings">
          <span className="setting-label">Target</span>
          <div className="target-grid" id="targetGrid">
            {[24, 36, 72, 73].map((target) => (
              <button className={`target-option${target === 24 ? " selected" : ""}`} data-target={target} key={target}>{target}</button>
            ))}
          </div>
          <label className="custom-target">
            <span className="sr-only">Custom target</span>
            <input id="customTarget" type="number" inputMode="numeric" min="1" max="999" placeholder="Custom" />
          </label>
        </div>
      </section>

      <section className="game-card" aria-labelledby="gameHeading">
        <div className="game-topline">
          <div>
            <span className="round-label" id="roundLabel">Easy · Round 1</span>
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
          <div className="steps" id="steps"><span className="empty-step">Your equations will appear here.</span></div>
        </div>

        <div className="game-actions">
          <button className="secondary-button" id="undoButton" type="button" disabled>Undo</button>
          <button className="secondary-button" id="impossibleButton" type="button" hidden>No solution</button>
          <span className="action-spacer" />
          <button className="primary-button" id="revealButton" type="button">Reveal solution</button>
        </div>
      </section>

      <p className="rules">Use every number exactly once. You may add, subtract, multiply, or divide. Fractions and negative numbers are allowed.</p>
      <Script src="/game.js" strategy="afterInteractive" />
    </main>
  );
}
