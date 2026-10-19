(() => {
  "use strict";

  const LEVELS = [
    { name: "Easy", max: 9, minScore: 0, noSolutionChance: 0 },
    { name: "Medium", max: 12, minScore: 2, noSolutionChance: 0 },
    { name: "Hard", max: 20, minScore: 4, noSolutionChance: 0 },
    { name: "Expert", max: 40, minScore: 6, noSolutionChance: 0.16 },
    { name: "Brutal", max: 99, minScore: 8, noSolutionChance: 0.34 },
  ];

  const OP_FUNCTIONS = {
    "+": (a, b) => add(a, b),
    "−": (a, b) => subtract(a, b),
    "×": (a, b) => multiply(a, b),
    "÷": (a, b) => (b.n === 0 ? null : divide(a, b)),
  };

  const state = {
    level: 0,
    target: 24,
    round: 1,
    cards: [],
    selectedId: null,
    selectedOp: null,
    history: [],
    steps: [],
    solution: null,
    solved: false,
    stats: loadStats(),
  };

  const els = {
    board: document.querySelector("#numberBoard"),
    instruction: document.querySelector("#instruction"),
    feedback: document.querySelector("#feedback"),
    targetValue: document.querySelector("#targetValue"),
    roundLabel: document.querySelector("#roundLabel"),
    progress: document.querySelector("#progressBar"),
    steps: document.querySelector("#steps"),
    undo: document.querySelector("#undoButton"),
    reveal: document.querySelector("#revealButton"),
    impossible: document.querySelector("#impossibleButton"),
    newPuzzle: document.querySelector("#newPuzzleButton"),
    streak: document.querySelector("#streakStat"),
    solved: document.querySelector("#solvedStat"),
    gameCard: document.querySelector(".game-card"),
    customTarget: document.querySelector("#customTarget"),
  };

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a || 1;
  }

  function fraction(n, d = 1) {
    if (d < 0) { n = -n; d = -d; }
    const factor = gcd(n, d);
    return { n: n / factor, d: d / factor };
  }

  function add(a, b) { return fraction(a.n * b.d + b.n * a.d, a.d * b.d); }
  function subtract(a, b) { return fraction(a.n * b.d - b.n * a.d, a.d * b.d); }
  function multiply(a, b) { return fraction(a.n * b.n, a.d * b.d); }
  function divide(a, b) { return fraction(a.n * b.d, a.d * b.n); }
  function equal(a, b) { return a.n === b.n && a.d === b.d; }
  function keyOf(value) { return `${value.n}/${value.d}`; }
  function display(value) { return value.d === 1 ? String(value.n) : `${value.n}/${value.d}`; }

  function solve(numbers, target, limit = 80) {
    const start = numbers.map((number) => ({
      value: fraction(number),
      expression: String(number),
      score: 0,
    }));
    const solutions = [];
    const seen = new Map();

    function visit(items) {
      if (solutions.length >= limit) return;
      const signature = items.map((item) => keyOf(item.value)).sort().join("|");
      const best = seen.get(signature);
      const currentScore = items.reduce((total, item) => total + item.score, 0);
      if (best !== undefined && best <= currentScore) return;
      seen.set(signature, currentScore);

      if (items.length === 1) {
        if (equal(items[0].value, fraction(target))) solutions.push(items[0]);
        return;
      }

      for (let i = 0; i < items.length; i += 1) {
        for (let j = i + 1; j < items.length; j += 1) {
          const a = items[i];
          const b = items[j];
          const rest = items.filter((_, index) => index !== i && index !== j);
          const variants = [
            [add(a.value, b.value), `(${a.expression} + ${b.expression})`, 0],
            [multiply(a.value, b.value), `(${a.expression} × ${b.expression})`, 0],
            [subtract(a.value, b.value), `(${a.expression} − ${b.expression})`, 1],
            [subtract(b.value, a.value), `(${b.expression} − ${a.expression})`, 1],
          ];
          if (b.value.n !== 0) variants.push([divide(a.value, b.value), `(${a.expression} ÷ ${b.expression})`, 2]);
          if (a.value.n !== 0) variants.push([divide(b.value, a.value), `(${b.expression} ÷ ${a.expression})`, 2]);

          for (const [value, expression, opCost] of variants) {
            if (Math.abs(value.n / value.d) > 100000) continue;
            const fractionCost = value.d !== 1 ? 3 : 0;
            const negativeCost = value.n < 0 ? 2 : 0;
            visit([...rest, {
              value,
              expression,
              score: a.score + b.score + opCost + fractionCost + negativeCost,
            }]);
          }
        }
      }
    }

    visit(start);
    solutions.sort((a, b) => a.score - b.score || a.expression.length - b.expression.length);
    return solutions;
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function makeCandidate(level) {
    const config = LEVELS[level];
    const floor = level >= 4 ? 2 : 1;
    const values = Array.from({ length: 4 }, () => randomInt(floor, config.max));
    return values.sort((a, b) => a - b);
  }

  function generatePuzzle() {
    const config = LEVELS[state.level];
    const seekImpossible = state.level >= 3 && Math.random() < config.noSolutionChance;
    let fallback = null;

    for (let attempt = 0; attempt < 650; attempt += 1) {
      const numbers = makeCandidate(state.level);
      const solutions = solve(numbers, state.target, 24);
      const result = { numbers, solutions };
      fallback ||= result;

      if (seekImpossible && solutions.length === 0) return result;
      if (!seekImpossible && solutions.length) {
        const best = solutions[0].score;
        const scarcityBonus = solutions.length <= 2 ? 2 : solutions.length <= 6 ? 1 : 0;
        const adjusted = best + scarcityBonus;
        if (state.level === 0 && adjusted <= 3) return result;
        if (state.level > 0 && adjusted >= config.minScore) return result;
        fallback = result;
      }
    }

    if (fallback?.solutions.length || seekImpossible) return fallback;
    const safeNumbers = state.target === 24 ? [1, 3, 4, 6] : [1, 2, state.target - 2, 1];
    return { numbers: safeNumbers, solutions: solve(safeNumbers, state.target) };
  }

  function startPuzzle({ advance = false } = {}) {
    if (advance) state.round += 1;
    const puzzle = generatePuzzle();
    state.cards = puzzle.numbers.map((number, index) => ({
      id: `${Date.now()}-${index}`,
      value: fraction(number),
      expression: String(number),
      label: String(number),
    }));
    state.solution = puzzle.solutions[0] || null;
    state.selectedId = null;
    state.selectedOp = null;
    state.history = [];
    state.steps = [];
    state.solved = false;
    els.reveal.textContent = "Reveal solution";
    setInstruction("Choose a number, an operation, then another number.");
    hideFeedback();
    render();
  }

  function chooseCard(id) {
    if (state.solved) return;
    if (!state.selectedId) {
      state.selectedId = id;
      setInstruction("Now choose an operation.");
      renderBoard();
      renderOperations();
      return;
    }
    if (state.selectedId === id) {
      state.selectedId = null;
      state.selectedOp = null;
      setInstruction("Choose a number, an operation, then another number.");
      renderBoard();
      renderOperations();
      return;
    }
    if (!state.selectedOp) {
      state.selectedId = id;
      setInstruction("Choose an operation for this number.");
      renderBoard();
      return;
    }
    combineCards(state.selectedId, id, state.selectedOp);
  }

  function chooseOperation(operation) {
    if (!state.selectedId || state.solved) return;
    state.selectedOp = operation;
    setInstruction("Choose the second number. Order matters.");
    renderOperations();
  }

  function combineCards(firstId, secondId, operation) {
    const a = state.cards.find((card) => card.id === firstId);
    const b = state.cards.find((card) => card.id === secondId);
    const value = OP_FUNCTIONS[operation](a.value, b.value);
    if (!value) {
      showFeedback("Division by zero is undefined. Try another route.", "error");
      pulseError();
      return;
    }

    state.history.push({
      cards: state.cards.map(cloneCard),
      steps: [...state.steps],
    });

    const expression = `(${a.expression} ${operation} ${b.expression})`;
    const equation = `${display(a.value)} ${operation} ${display(b.value)} = ${display(value)}`;
    const newCard = {
      id: `${Date.now()}-${Math.random()}`,
      value,
      expression,
      label: display(value),
      fresh: true,
    };
    state.cards = state.cards.filter((card) => card.id !== firstId && card.id !== secondId);
    state.cards.push(newCard);
    state.steps.push(equation);
    state.selectedId = null;
    state.selectedOp = null;
    hideFeedback();

    if (state.cards.length === 1) finishAttempt();
    else setInstruction(`${state.cards.length} values remain. Keep going.`);
    render();
  }

  function finishAttempt() {
    const won = equal(state.cards[0].value, fraction(state.target));
    if (won) {
      state.solved = true;
      state.stats.solved += 1;
      state.stats.streak += 1;
      state.stats.best = Math.max(state.stats.best, state.stats.streak);
      saveStats();
      showFeedback(`Exactly ${state.target}. Beautifully forged.`, "success");
      setInstruction("Solved. Ready for the next one?");
      els.reveal.textContent = "Next puzzle";
    } else {
      state.stats.streak = 0;
      saveStats();
      showFeedback(`You made ${display(state.cards[0].value)}, not ${state.target}. Undo and try another path.`, "error");
      setInstruction("Close—rewind one move or reveal the route.");
    }
  }

  function undo() {
    const previous = state.history.pop();
    if (!previous) return;
    state.cards = previous.cards.map(cloneCard);
    state.steps = [...previous.steps];
    state.selectedId = null;
    state.selectedOp = null;
    state.solved = false;
    els.reveal.textContent = "Reveal solution";
    hideFeedback();
    setInstruction("Rewound. Choose a new route.");
    render();
  }

  function claimImpossible() {
    if (state.solved) return;
    if (!state.solution) {
      state.solved = true;
      state.stats.solved += 1;
      state.stats.streak += 1;
      saveStats();
      showFeedback("Correct—this puzzle has no solution. Spotting that is part of the game.", "success");
      setInstruction("Strong read. You proved there is no route.");
      els.reveal.textContent = "Next puzzle";
    } else {
      state.stats.streak = 0;
      saveStats();
      showFeedback("There is a route. Keep searching—or reveal it when you’re ready.", "error");
      pulseError();
    }
    renderStats();
  }

  function reveal() {
    if (state.solved) {
      startPuzzle({ advance: true });
      return;
    }
    state.stats.streak = 0;
    saveStats();
    if (state.solution) {
      showFeedback(`One route: ${stripOuterParens(state.solution.expression)} = ${state.target}`, "success");
      setInstruction("Study the structure, then try a fresh puzzle.");
    } else {
      showFeedback("No solution exists for these four numbers. Your instinct was right.", "success");
      setInstruction("Impossible rounds reward recognition, not guesswork.");
    }
    els.reveal.textContent = "New puzzle";
    state.solved = true;
    renderStats();
  }

  function stripOuterParens(expression) {
    return expression.startsWith("(") && expression.endsWith(")")
      ? expression.slice(1, -1)
      : expression;
  }

  function cloneCard(card) {
    return { ...card, value: { ...card.value }, fresh: false };
  }

  function render() {
    els.targetValue.textContent = state.target;
    els.roundLabel.textContent = `${LEVELS[state.level].name} · Round ${state.round}`;
    els.progress.style.width = `${((state.round - 1) % 4 + 1) * 25}%`;
    els.impossible.hidden = state.level < 3;
    els.undo.disabled = state.history.length === 0 || state.solved;
    renderBoard();
    renderOperations();
    renderSteps();
    renderStats();
  }

  function renderBoard() {
    els.board.replaceChildren();
    state.cards.forEach((card, index) => {
      const button = document.createElement("button");
      button.className = "number-card";
      button.type = "button";
      button.dataset.id = card.id;
      button.classList.toggle("selected", card.id === state.selectedId);
      button.classList.toggle("fresh", Boolean(card.fresh));
      button.disabled = state.solved;
      button.setAttribute("aria-pressed", card.id === state.selectedId ? "true" : "false");
      button.setAttribute("aria-label", `Number ${display(card.value)}`);

      const cardIndex = document.createElement("span");
      cardIndex.className = "card-index";
      cardIndex.textContent = String(index + 1).padStart(2, "0");

      const cardValue = document.createElement("strong");
      cardValue.className = "card-value";
      cardValue.textContent = display(card.value);

      const expression = document.createElement("small");
      expression.className = "card-expression";
      expression.textContent = card.expression === display(card.value) ? "" : card.expression;
      button.append(cardIndex, cardValue, expression);
      button.addEventListener("click", () => chooseCard(card.id));
      els.board.append(button);
    });
  }

  function renderOperations() {
    document.querySelectorAll("[data-op]").forEach((button) => {
      button.disabled = !state.selectedId || state.solved;
      button.classList.toggle("active", state.selectedOp === button.dataset.op);
    });
  }

  function renderSteps() {
    if (!state.steps.length) {
      els.steps.innerHTML = '<span class="empty-step">Your equations will appear here</span>';
      return;
    }
    els.steps.replaceChildren(...state.steps.map((step) => {
      const span = document.createElement("span");
      span.className = "step-item";
      span.textContent = step;
      return span;
    }));
  }

  function renderStats() {
    els.streak.textContent = state.stats.streak;
    els.solved.textContent = state.stats.solved;
  }

  function setInstruction(message) { els.instruction.textContent = message; }

  function showFeedback(message, type) {
    els.feedback.textContent = message;
    els.feedback.className = `feedback ${type}`;
    els.feedback.hidden = false;
  }

  function hideFeedback() {
    els.feedback.hidden = true;
    els.feedback.textContent = "";
  }

  function pulseError() {
    els.gameCard.classList.remove("shake");
    requestAnimationFrame(() => els.gameCard.classList.add("shake"));
  }

  function loadStats() {
    try {
      return { streak: 0, solved: 0, best: 0, ...JSON.parse(localStorage.getItem("number-forge-stats")) };
    } catch {
      return { streak: 0, solved: 0, best: 0 };
    }
  }

  function saveStats() {
    localStorage.setItem("number-forge-stats", JSON.stringify(state.stats));
    renderStats();
  }

  document.querySelectorAll(".difficulty-option").forEach((button) => {
    button.addEventListener("click", () => {
      state.level = Number(button.dataset.level);
      state.round = 1;
      document.querySelectorAll(".difficulty-option").forEach((option) => {
        option.setAttribute("aria-checked", option === button ? "true" : "false");
      });
      startPuzzle();
    });
  });

  document.querySelectorAll(".target-option").forEach((button) => {
    button.addEventListener("click", () => {
      state.target = Number(button.dataset.target);
      state.round = 1;
      els.customTarget.value = "";
      document.querySelectorAll(".target-option").forEach((option) => option.classList.toggle("selected", option === button));
      startPuzzle();
    });
  });

  els.customTarget.addEventListener("change", () => {
    const target = Math.max(1, Math.min(999, Number(els.customTarget.value) || 24));
    els.customTarget.value = target;
    state.target = target;
    state.round = 1;
    document.querySelectorAll(".target-option").forEach((option) => option.classList.remove("selected"));
    startPuzzle();
  });

  document.querySelectorAll("[data-op]").forEach((button) => button.addEventListener("click", () => chooseOperation(button.dataset.op)));
  els.undo.addEventListener("click", undo);
  els.reveal.addEventListener("click", reveal);
  els.impossible.addEventListener("click", claimImpossible);
  els.newPuzzle.addEventListener("click", () => startPuzzle({ advance: true }));

  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input")) return;
    const opMap = { "+": "+", "-": "−", "*": "×", "/": "÷" };
    if (opMap[event.key]) chooseOperation(opMap[event.key]);
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      undo();
    }
  });

  startPuzzle();
})();
