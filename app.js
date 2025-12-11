/* app.js - shared for main + game + teachers pages */

/** ✅ BACKGROUND */
(function setBackground() {
  const pageRoot = document.getElementById("pageRoot");
  if (!pageRoot) return;
  document.documentElement.style.setProperty(
    "--bg-url",
    `url("./background2.png")`
  );
})();

/* ===== Local progress manager (localStorage) ===== */
(function progressManager() {
  const KEY = 'studyfirst_progress';

  function defaultProgress() {
    return {
      totalScore: 0,
      stars: 0,
      gamesPlayed: 0,
      games: {
        'reading-race': { score: 0, level: 0, stars: 0, played: 0 },
        'quiz-quest': { score: 0, level: 0, stars: 0, played: 0 },
        'word-reveal': { score: 0, level: 0, stars: 0, played: 0 },
      },
      badges: {
        firstWin: false,
        speedReader: false,
        quizMaster: false,
        wordExpert: false,
        perfectScore: false,
        dailyPlayer: false,
      },
      lastUpdated: null,
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultProgress();
      return Object.assign(defaultProgress(), JSON.parse(raw));
    } catch (e) {
      console.error('progress load error', e);
      return defaultProgress();
    }
  }

  function save(obj) {
    try {
      obj.lastUpdated = new Date().toISOString();
      localStorage.setItem(KEY, JSON.stringify(obj));
    } catch (e) {
      console.error('progress save error', e);
    }
  }

  function reset() {
    const p = defaultProgress();
    save(p);
    render(p);
    return p;
  }

  function render(p) {
    // main values
    const total = document.getElementById('totalScoreValue');
    const stars = document.getElementById('starsValue');
    const games = document.getElementById('gamesPlayedValue');
    if (total) total.textContent = String(p.totalScore || 0);
    if (stars) stars.textContent = String(p.stars || 0);
    if (games) games.textContent = String(p.gamesPlayed || 0);

    // per-game
    const m = p.games || {};
    const rr = document.getElementById('readingRaceScore');
    const rq = document.getElementById('quizQuestScore');
    const wr = document.getElementById('wordRevealScore');
    const rrLevel = document.getElementById('readingRaceLevel');
    const rqLevel = document.getElementById('quizQuestLevel');
    const wrLevel = document.getElementById('wordRevealLevel');
    const rrPlayed = document.getElementById('readingRacePlayed');
    const rqPlayed = document.getElementById('quizQuestPlayed');
    const wrPlayed = document.getElementById('wordRevealPlayed');
    const rrStars = document.getElementById('readingRaceStars');
    const rqStars = document.getElementById('quizQuestStars');
    const wrStars = document.getElementById('wordRevealStars');
    if (rr) rr.textContent = String(m['reading-race']?.score ?? 0);
    if (rq) rq.textContent = String(m['quiz-quest']?.score ?? 0);
    if (wr) wr.textContent = String(m['word-reveal']?.score ?? 0);
    if (rrPlayed) rrPlayed.innerHTML = `<strong>${m['reading-race']?.played || 0} times</strong>`;
    if (rqPlayed) rqPlayed.innerHTML = `<strong>${m['quiz-quest']?.played || 0} times</strong>`;
    if (wrPlayed) wrPlayed.innerHTML = `<strong>${m['word-reveal']?.played || 0} times</strong>`;

    // render levels
    if (rrLevel) rrLevel.textContent = String(m['reading-race']?.level || 0);
    if (rqLevel) rqLevel.textContent = String(m['quiz-quest']?.level || 0);
    if (wrLevel) wrLevel.textContent = String(m['word-reveal']?.level || 0);

    // show best stars (as ★) and cumulative stars in parentheses when available
    const rrBest = m['reading-race']?.stars || 0;
    const rqBest = m['quiz-quest']?.stars || 0;
    const wrBest = m['word-reveal']?.stars || 0;
    const rrTotal = m['reading-race']?.starsTotal || 0;
    const rqTotal = m['quiz-quest']?.starsTotal || 0;
    const wrTotal = m['word-reveal']?.starsTotal || 0;

    if (rrStars) rrStars.innerHTML = rrBest ? '★'.repeat(rrBest) + (rrTotal > rrBest ? ` <small>(${rrTotal})</small>` : '') : (rrTotal ? `<small>${rrTotal} ★ total</small>` : 'Locked');
    if (rqStars) rqStars.innerHTML = rqBest ? '★'.repeat(rqBest) + (rqTotal > rqBest ? ` <small>(${rqTotal})</small>` : '') : (rqTotal ? `<small>${rqTotal} ★ total</small>` : 'Locked');
    if (wrStars) wrStars.innerHTML = wrBest ? '★'.repeat(wrBest) + (wrTotal > wrBest ? ` <small>(${wrTotal})</small>` : '') : (wrTotal ? `<small>${wrTotal} ★ total</small>` : 'Locked');

    // badges
    const grid = document.getElementById('badgesGrid');
    if (grid) {
      const badges = p.badges || {};
      grid.querySelectorAll('[data-badge]').forEach((el) => {
        const key = el.getAttribute('data-badge');
        const status = badges[key];
        el.classList.toggle('badgeCard--earned', !!status);
        el.classList.toggle('badgeCard--locked', !status);
        const st = el.querySelector('.badgeCard__status');
        if (st) st.textContent = status ? '✓ Earned!' : 'Locked';
      });
    }
  }

  function saveResult(gameSlug, { won = false, score = 0, stars = 0, level = 0 } = {}) {
    const p = load();
    // add total score
    p.totalScore = (p.totalScore || 0) + (Number(score) || 0);
    p.gamesPlayed = (p.gamesPlayed || 0) + 1;
    p.games = p.games || {};
    p.games[gameSlug] = p.games[gameSlug] || { score: 0, level: 0, stars: 0, played: 0 };
    p.games[gameSlug].played = (p.games[gameSlug].played || 0) + 1;
    // keep best score for the game
    p.games[gameSlug].score = Math.max(p.games[gameSlug].score || 0, Number(score) || 0);
    if (level) p.games[gameSlug].level = Math.max(p.games[gameSlug].level || 0, Number(level) || 0);

    // stars: increment total stars by stars earned this play, keep best per-game stars, and track cumulative per-game stars
    const earned = Number(stars) || 0;
    p.stars = (p.stars || 0) + earned;
    // best stars for display (max single-run stars)
    if (earned) p.games[gameSlug].stars = Math.max(p.games[gameSlug].stars || 0, earned);
    // cumulative stars earned for this game
    p.games[gameSlug].starsTotal = (p.games[gameSlug].starsTotal || 0) + earned;

    // badges: only award the First Win badge on the first win. Do NOT auto-unlock other badges here.
    p.badges = p.badges || {};
    if (won && !p.badges.firstWin) p.badges.firstWin = true;

    save(p);
    render(p);
  }

  // Periodic UI sync (pages may load before this script)
  setTimeout(() => {
    const p = load();
    render(p);

    // wire clear button if present
    const clearBtn = document.getElementById('clearProgressBtn');
    const clearMsg = document.getElementById('clearMsg');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        reset();
        if (clearMsg) clearMsg.textContent = 'Progress cleared locally.';
      });
    }

    // Watch for win screens in pages that include app.js (quizquest, wordreveal)
    const seen = new Set();
    function computeStarsFor(gameSlug, score) {
      const s = Number(score) || 0;
      // simple heuristics per game
      if (gameSlug === 'quiz-quest') return Math.min(3, Math.max(0, Math.floor(s / 4)));
      if (gameSlug === 'word-reveal') return Math.min(3, Math.max(0, Math.floor(s / 4)));
      if (gameSlug === 'reading-race') return Math.min(3, Math.max(0, Math.floor(s / 30)));
      return 0;
    }

    function computeLevelFor(gameSlug, score) {
      const s = Number(score) || 0;
      if (gameSlug === 'quiz-quest') {
        // score 0..10 -> level 1..4
        return 1 + Math.min(3, Math.floor(s / 3));
      }
      if (gameSlug === 'word-reveal') {
        // words solved 0..10 -> level 1..4
        return 1 + Math.min(3, Math.floor(s / 3));
      }
      if (gameSlug === 'reading-race') {
        // reading percentage 0..100 -> level 1..6
        return 1 + Math.min(5, Math.floor(s / 20));
      }
      return 1;
    }
    function checkScreens() {
      const qWin = document.getElementById('qqWin');
      const qLose = document.getElementById('qqLose');

      if (qWin && !qWin.classList.contains('rrHidden') && !seen.has('qqWin')) {
        seen.add('qqWin');
        if (qWin.dataset.progressSaved !== '1') {
          const el = document.getElementById('qqWinScore');
          const score = el ? Number(el.textContent || 0) : 0;
          const stars = computeStarsFor('quiz-quest', score);
          const level = computeLevelFor('quiz-quest', score);
          const winStarsEl = document.getElementById('qqWinStars');
          if (winStarsEl) winStarsEl.textContent = stars ? '★'.repeat(stars) + ` (${stars})` : '—';
          saveResult('quiz-quest', { won: true, score, stars, level });
          qWin.dataset.progressSaved = '1';
        }
      }

      if (qLose && !qLose.classList.contains('rrHidden') && !seen.has('qqLose')) {
        seen.add('qqLose');
        if (qLose.dataset.progressSaved !== '1') {
          const el = document.getElementById('qqLoseScore');
          const score = el ? Number(el.textContent || 0) : 0;
          const stars = computeStarsFor('quiz-quest', score);
          const level = computeLevelFor('quiz-quest', score);
          const loseStarsEl = document.getElementById('qqLoseStars');
          if (loseStarsEl) loseStarsEl.textContent = stars ? '★'.repeat(stars) + ` (${stars})` : '—';
          saveResult('quiz-quest', { won: false, score, stars, level });
          qLose.dataset.progressSaved = '1';
        }
      }

      // word reveal
      const wWin = document.getElementById('wrWin');
      const wLose = document.getElementById('wrLose');
      if (wWin && !wWin.classList.contains('rrHidden') && !seen.has('wrWin')) {
        seen.add('wrWin');
        if (wWin.dataset.progressSaved !== '1') {
          const el = document.getElementById('wrWinScore');
          const txt = el ? String(el.textContent || '') : '';
          const num = Number((txt.match(/(\d+)/) || [0])[0]);
          const stars = computeStarsFor('word-reveal', num);
          const level = computeLevelFor('word-reveal', num);
          const wrWinStars = document.getElementById('wrWinStars');
          if (wrWinStars) wrWinStars.textContent = stars ? '★'.repeat(stars) + ` (${stars})` : '—';
          saveResult('word-reveal', { won: true, score: num, stars, level });
          wWin.dataset.progressSaved = '1';
        }
      }
      if (wLose && !wLose.classList.contains('rrHidden') && !seen.has('wrLose')) {
        seen.add('wrLose');
        if (wLose.dataset.progressSaved !== '1') {
          const el = document.getElementById('wrLoseScore');
          const txt = el ? String(el.textContent || '') : '';
          const num = Number((txt.match(/(\d+)/) || [0])[0]);
          const stars = computeStarsFor('word-reveal', num);
          const level = computeLevelFor('word-reveal', num);
          const wrLoseStars = document.getElementById('wrLoseStars');
          if (wrLoseStars) wrLoseStars.textContent = stars ? '★'.repeat(stars) + ` (${stars})` : '—';
          saveResult('word-reveal', { won: false, score: num, stars, level });
          wLose.dataset.progressSaved = '1';
        }
      }

      // Reading Race finish (finalScore)
      const rrWin = document.getElementById('screenWin');
      if (rrWin && !rrWin.classList.contains('rrHidden') && !seen.has('rrWin')) {
        seen.add('rrWin');
        if (rrWin.dataset.progressSaved !== '1') {
          const el = document.getElementById('finalScore');
          const score = el ? Number(el.textContent || 0) : 0;
          const stars = computeStarsFor('reading-race', score);
          const level = computeLevelFor('reading-race', score);
          const finalStarsEl = document.getElementById('finalStars');
          if (finalStarsEl) finalStarsEl.textContent = stars ? '★'.repeat(stars) + ` (${stars})` : '—';
          saveResult('reading-race', { won: true, score, stars, level });
          rrWin.dataset.progressSaved = '1';
        }
      }
    }

    // run check periodically while app is running
    const t = setInterval(checkScreens, 600);
    // stop after some time so we don't poll forever
    setTimeout(() => clearInterval(t), 1000 * 60 * 10);
  }, 200);

  // Cross-tab sync: when localStorage changes in another tab, re-render
  window.addEventListener('storage', (ev) => {
    try {
      if (ev.key === KEY) {
        const newP = load();
        render(newP);
      }
    } catch (e) {
      console.error('storage event render error', e);
    }
  });

  // expose for manual use
  window.studyProgress = {
    load,
    saveResult,
    reset,
  };
})();

/** ✅ MAIN PAGE: Play Now + Teachers button */
(function wireMainButtons() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;

    // --- Play buttons for each game ---
    if (action === "play") {
      const slug = btn.dataset.slug || "";
      const map = {
        "reading-race": "readingrace.html",
        "quiz-quest": "quizquest.html",
        "word-reveal": "wordreveal.html",
      };
      if (map[slug]) window.location.href = map[slug];
      return;
    }

    // --- OLD settings button => go to Teachers Dashboard ---
    if (action === "teachers" || action === "settings") {
      // baguhin mo kung ibang file name/router ang gamit mo
      window.location.href = "teachers.html";
      return;
    }

    // --- Explore tools (coming soon) ---
    if (action === "explore") {
      const tool = btn.dataset.tool || "Tool";
      alert(`${tool} is coming soon!`);
    }
  });
})();

/** ================================
 *  QUIZ QUEST GAME LOGIC (quizquest.html)
 *  ================================ */
(function quizQuest() {
  const root = document.getElementById("quizQuestRoot");
  if (!root) return;

  // Sections
  const secTutorial = document.getElementById("qqTutorial");
  const secSubject = document.getElementById("qqSubject");
  const secGame = document.getElementById("qqGame");
  const secWin = document.getElementById("qqWin");
  const secLose = document.getElementById("qqLose");
  const secTryAgain = document.getElementById("qqTryAgain");
  const secGoodJob = document.getElementById("qqGoodJob");
  const secVeryGood = document.getElementById("qqVeryGood");

  // Top UI
  const scoreEl = document.getElementById("qqScore");
  const livesEl = document.getElementById("qqLives");

  // Subject UI
  const subjectBtns = [...document.querySelectorAll("[data-qq-subject]")];
  const subjectTagEl = document.getElementById("qqSubjectTag");

  // Board UI
  const gridEl = document.getElementById("qqGrid");
  const progressEl = document.getElementById("qqProgressText");

  // Question UI
  const qSubjectEl = document.getElementById("qqQSubject");
  const qTextEl = document.getElementById("qqQText");
  const choicesEl = document.getElementById("qqChoices");
  const submitBtn = document.getElementById("qqSubmit");
  const feedbackEl = document.getElementById("qqFeedback");

  // Win/Lose UI
  const winScoreEl = document.getElementById("qqWinScore");
  const loseScoreEl = document.getElementById("qqLoseScore");
  const tryAgainScoreEl = document.getElementById("qqTryAgainScore");
  const goodJobScoreEl = document.getElementById("qqGoodJobScore");
  const veryGoodScoreEl = document.getElementById("qqVeryGoodScore");
  const playAgainBtns = [...document.querySelectorAll("[data-qq-play-again]")];

  // Tutorial button
  const startBtn = document.querySelector(
    '[data-action="start-game"][data-game="Quiz Quest"]'
  );

  // ====== Broken heart flash overlay (create once) ======
  const heartFlash = document.createElement("div");
  heartFlash.className = "qqHeartFlash";
  heartFlash.innerHTML = `
    <div class="qqHeartFlashBox">
      <div class="qqBroken">💔</div>
      <div class="qqHeartText">Wrong!</div>
    </div>
  `;
  document.body.appendChild(heartFlash);

  function showBrokenHeart() {
    heartFlash.classList.add("qqHeartFlash--on");
    window.clearTimeout(showBrokenHeart._t);
    showBrokenHeart._t = window.setTimeout(() => {
      heartFlash.classList.remove("qqHeartFlash--on");
    }, 650);
  }

  // === Question banks (10 per subject) ===
  const BANK = {
    Math: [
      { q: "What is 5 + 7?", a: "12", c: ["10", "12", "13", "15"] },
      { q: "What is 9 - 4?", a: "5", c: ["3", "4", "5", "6"] },
      { q: "What is 6 + 8?", a: "14", c: ["12", "13", "14", "15"] },
      { q: "What is 12 - 7?", a: "5", c: ["4", "5", "6", "7"] },
      { q: "What is 3 + 9?", a: "12", c: ["10", "11", "12", "13"] },
      { q: "What is 10 - 3?", a: "7", c: ["6", "7", "8", "9"] },
      { q: "What is 4 + 4?", a: "8", c: ["6", "7", "8", "9"] },
      { q: "What is 15 - 5?", a: "10", c: ["9", "10", "11", "12"] },
      { q: "What is 2 + 11?", a: "13", c: ["12", "13", "14", "15"] },
      { q: "What is 18 - 9?", a: "9", c: ["7", "8", "9", "10"] },
    ],
    Science: [
      {
        q: "What do plants need to make food?",
        a: "Sunlight",
        c: ["Sunlight", "Candy", "Dust", "Ice"],
      },
      { q: "Which body part helps you see?", a: "Eyes", c: ["Eyes", "Ears", "Nose", "Teeth"] },
      { q: "Which one is a liquid?", a: "Water", c: ["Rock", "Water", "Chair", "Paper"] },
      { q: "Which one is an animal?", a: "Dog", c: ["Spoon", "Dog", "Shoes", "Phone"] },
      {
        q: "What do we breathe in to live?",
        a: "Oxygen",
        c: ["Oxygen", "Sand", "Milk", "Smoke"],
      },
      { q: "What is the opposite of hot?", a: "Cold", c: ["Cold", "Fast", "Loud", "Tall"] },
      { q: "Which one is a planet?", a: "Earth", c: ["Earth", "Bread", "Book", "Ball"] },
      { q: "Which one is a source of light?", a: "Sun", c: ["Sun", "Cloud", "Rock", "Mud"] },
      {
        q: "What do we call frozen water?",
        a: "Ice",
        c: ["Ice", "Steam", "Juice", "Soap"],
      },
      { q: "Where do fish live?", a: "Water", c: ["Water", "Sand", "Sky", "Tree"] },
    ],
    English: [
      { q: "Which one is a noun?", a: "Book", c: ["Run", "Book", "Fast", "Blue"] },
      {
        q: "Choose the correct spelling:",
        a: "School",
        c: ["Skool", "School", "Scool", "Shool"],
      },
      { q: "Which one is a verb?", a: "Jump", c: ["Happy", "Jump", "Green", "Table"] },
      { q: "Which one is a color?", a: "Red", c: ["Red", "Dog", "Eat", "Chair"] },
      { q: "Opposite of 'big'?", a: "Small", c: ["Small", "Tall", "Round", "Bright"] },
      { q: "Which one is a fruit?", a: "Apple", c: ["Apple", "Car", "Pencil", "Shoe"] },
      {
        q: "Finish: I ___ to school.",
        a: "go",
        c: ["go", "gone", "going", "goes"],
      },
      { q: "Which one is an animal?", a: "Cat", c: ["Cat", "Hat", "Bat", "Mat"] },
      { q: "Which one is a place?", a: "Park", c: ["Park", "Sleep", "Red", "Quick"] },
      {
        q: "Which is correct?",
        a: "I like books.",
        c: [
          "I like books.",
          "Like I books.",
          "Books like I.",
          "I books like."
        ],
      },
    ],
    History: [
      {
        q: "What do we call a story about the past?",
        a: "History",
        c: ["History", "Science", "Math", "Music"],
      },
      { q: "Who writes books?", a: "Author", c: ["Author", "Doctor", "Pilot", "Chef"] },
      {
        q: "Old things from the past are called:",
        a: "Artifacts",
        c: ["Artifacts", "Snacks", "Toys", "Clouds"],
      },
      {
        q: "Where do we keep old objects?",
        a: "Museum",
        c: ["Museum", "Kitchen", "Garage", "Garden"],
      },
      {
        q: "A long time ago is the:",
        a: "Past",
        c: ["Past", "Future", "Today", "Now"],
      },
      {
        q: "Who studies the past?",
        a: "Historian",
        c: ["Historian", "Baker", "Singer", "Driver"],
      },
      {
        q: "A map helps with:",
        a: "Finding places",
        c: ["Finding places", "Cooking", "Painting", "Sleeping"],
      },
      {
        q: "A very old building is:",
        a: "Ancient",
        c: ["Ancient", "Modern", "New", "Tiny"],
      },
      {
        q: "People from your family long ago:",
        a: "Ancestors",
        c: ["Ancestors", "Neighbors", "Students", "Coaches"],
      },
      {
        q: "A timeline shows:",
        a: "Order of events",
        c: ["Order of events", "Colors", "Weather", "Food"],
      },
    ],
  };

  // Load custom questions from teacher dashboard
  function loadTeacherQuestions(subj) {
    try {
      const LS_KEY = "studyfirst_questions";
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return BANK[subj] || [];
      const all = JSON.parse(raw);
      const filtered = all.filter(q => q.game === "quiz-quest" && q.subject === subj);
      // If no teacher questions, use BANK
      if (filtered.length === 0) return BANK[subj] || [];
      // Keep questions in the order they were added (do not shuffle)
      // Take first 10 from teacher questions
      // Convert teacher format to game format { q, a, c }
      return filtered.slice(0, 10).map(q => ({
        q: q.question,
        a: q.options[q.correctIndex],
        c: q.options
      }));
    } catch (err) {
      console.warn("Error loading teacher questions:", err);
      return BANK[subj] || [];
    }
  }

  // === Game state ===
  let subject = null;
  let lives = 3;
  let correctCount = 0; // how many correct out of 10
  let step = 0; // 0..9
  let selectedChoice = null;

  // track completion status per step
  let completed = new Array(10).fill(false);

  // score display = final after penalties (shown live)
  let scoreShown = 0;

  // Helpers
  const show = (el) => el && el.classList.remove("rrHidden");
  const hide = (el) => el && el.classList.add("rrHidden");

  function updateTopUI() {
    // live score shown (correct minus lives used)
    scoreEl.textContent = String(scoreShown);
    livesEl.innerHTML =
      "❤️".repeat(lives) + "🤍".repeat(Math.max(0, 3 - lives));
  }

  function computeShownScore() {
    // Score is simply the number of correct answers
    scoreShown = correctCount;
  }

  function resetAll() {
    subject = null;
    lives = 3;
    correctCount = 0;
    scoreShown = 0;
    step = 0;
    selectedChoice = null;
    completed = new Array(10).fill(false);

    updateTopUI();

    show(secTutorial);
    hide(secSubject);
    hide(secGame);
    hide(secWin);
    hide(secLose);
    hide(secTryAgain);
    hide(secGoodJob);
    hide(secVeryGood);

    feedbackEl.textContent = "";
    feedbackEl.className = "qqFeedback";
    subjectTagEl.textContent = "";
  }

  function updateProgressText() {
    progressEl.textContent = `Progress: ${
      completed.filter(Boolean).length
    } / 10`;
  }

  function makeBoard() {
    gridEl.innerHTML = "";

    for (let i = 0; i < 10; i++) {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "qqTile";
      tile.dataset.index = String(i);

      // Icons: start, trophy, unknown, done
      const icon = document.createElement("div");
      icon.className = "qqTileIcon";
      if (i === 0) icon.textContent = "🎮";
      else if (i === 9) icon.textContent = "🏆";
      else icon.textContent = completed[i] ? "✅" : "❓";

      const badge = document.createElement("div");
      badge.className = "qqTileBadge";
      badge.appendChild(icon);

      const num = document.createElement("div");
      num.className = "qqTileNum";
      num.textContent = String(i + 1);

      // Avatar inside the current tile
      const avatar = document.createElement("div");
      avatar.className = "qqAvatar";
      avatar.textContent = "🧙‍♂️";
      avatar.style.display = i === step ? "grid" : "none";

      tile.appendChild(badge);
      tile.appendChild(avatar);
      tile.appendChild(num);

      // state classes
      tile.classList.toggle("qqTile--active", i === step);
      tile.classList.toggle("qqTile--done", completed[i]);

      // allow click only on current tile
      tile.disabled = i !== step;

      gridEl.appendChild(tile);
    }

    updateProgressText();
  }

  function loadQuestion() {
    selectedChoice = null;
    submitBtn.disabled = true;

    feedbackEl.textContent = "";
    feedbackEl.className = "qqFeedback";

    const qbank = loadTeacherQuestions(subject);
    const item = qbank[step];
    qSubjectEl.textContent = subject;
    qTextEl.textContent = item.q;

    // Keep choices in the same order as defined by teacher
    const choices = [...item.c];

    choicesEl.innerHTML = "";
    for (let i = 0; i < choices.length; i++) {
      const v = choices[i];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "qqChoice";
      btn.dataset.choice = v;

      const letter = String.fromCharCode(65 + i);
      btn.innerHTML = `
        <span class="qqChoiceLetter">${letter}</span>
        <span class="qqChoiceText">${v}</span>
      `;

      btn.addEventListener("click", () => {
        [...choicesEl.querySelectorAll(".qqChoice")].forEach((b) =>
          b.classList.remove("qqChoice--selected")
        );
        btn.classList.add("qqChoice--selected");
        selectedChoice = v;
        submitBtn.disabled = false;
      });

      choicesEl.appendChild(btn);
    }
  }

  function setFeedback(ok, msg) {
    feedbackEl.textContent = msg;
    feedbackEl.className =
      "qqFeedback " + (ok ? "qqFeedback--good" : "qqFeedback--bad");
  }

  function finishWin() {
    // Determine which screen to show based on score
    hide(secTutorial);
    hide(secSubject);
    hide(secGame);
    hide(secWin);
    hide(secLose);
    hide(secTryAgain);
    hide(secGoodJob);
    hide(secVeryGood);

    let won = false;
    let screenToShow = null;
    let scoreEl = null;

    if (correctCount === 0) {
      // Score 0 - Try Again
      screenToShow = secTryAgain;
      scoreEl = tryAgainScoreEl;
      won = false;
    } else if (correctCount >= 1 && correctCount <= 5) {
      // Score 1-5 - Good Job
      screenToShow = secGoodJob;
      scoreEl = goodJobScoreEl;
      won = false;
    } else if (correctCount >= 6 && correctCount <= 9) {
      // Score 6-9 - Very Good
      screenToShow = secVeryGood;
      scoreEl = veryGoodScoreEl;
      won = true;
    } else if (correctCount === 10) {
      // Score 10 - You Won
      screenToShow = secWin;
      scoreEl = winScoreEl;
      won = true;
    }

    if (scoreEl) {
      scoreEl.textContent = `${scoreShown} / 10`;
    }
    if (screenToShow) {
      show(screenToShow);
    }

    // save progress
    try {
      if (window.studyProgress && typeof window.studyProgress.saveResult === 'function') {
        const runStars = Math.min(3, Math.max(0, Math.floor(correctCount / 4)));
        const runLevel = 1 + Math.min(3, Math.floor(correctCount / 3));
        window.studyProgress.saveResult('quiz-quest', { won: won, score: correctCount, stars: runStars, level: runLevel });
        if (screenToShow) {
          screenToShow.dataset.progressSaved = '1';
        }
      }
    } catch (e) {
      console.error('saveResult quiz finish error', e);
    }
  }

  function finishLose() {
    hide(secTutorial);
    hide(secSubject);
    hide(secGame);
    hide(secWin);
    hide(secLose);
    hide(secTryAgain);
    hide(secGoodJob);
    hide(secVeryGood);

    // Show Try Again screen for when lives run out
    tryAgainScoreEl.textContent = `${scoreShown} / 10`;
    show(secTryAgain);

    // save progress
    try {
      if (window.studyProgress && typeof window.studyProgress.saveResult === 'function') {
        const runStars = Math.min(3, Math.max(0, Math.floor(correctCount / 4)));
        const runLevel = 1 + Math.min(3, Math.floor(correctCount / 3));
        window.studyProgress.saveResult('quiz-quest', { won: false, score: correctCount, stars: runStars, level: runLevel });
        secTryAgain.dataset.progressSaved = '1';
      }
    } catch (e) {
      console.error('saveResult quiz lose error', e);
    }
  }

  // Events
  startBtn?.addEventListener("click", () => {
    hide(secTutorial);
    show(secSubject);
  });

  subjectBtns.forEach((b) => {
    b.addEventListener("click", () => {
      subject = b.dataset.qqSubject;
      const qbank = loadTeacherQuestions(subject);
      if (!qbank || qbank.length !== 10) {
        alert(`Question bank for ${subject} must be exactly 10 items.`);
        return;
      }

      lives = 3;
      correctCount = 0;
      scoreShown = 0;
      step = 0;
      selectedChoice = null;
      completed = new Array(10).fill(false);

      subjectTagEl.textContent = subject;

      hide(secSubject);
      show(secGame);

      updateTopUI();
      makeBoard();
      loadQuestion();
    });
  });

  gridEl.addEventListener("click", (e) => {
    const tile = e.target.closest(".qqTile");
    if (!tile) return;
    const idx = Number(tile.dataset.index || "0");
    if (idx !== step) return;
    loadQuestion();
  });

  submitBtn.addEventListener("click", () => {
    if (!subject || !selectedChoice) return;

    const qbank = loadTeacherQuestions(subject);
    const item = qbank[step];
    const correct = selectedChoice === item.a;

    if (correct) {
      correctCount += 1;
      completed[step] = true;

      // move forward
      setFeedback(true, "Correct! ✅");

      // compute score shown
      computeShownScore();
      updateTopUI();

      // next step
      step += 1;
      if (step >= 10) {
        makeBoard();
        // All 10 questions answered - show finish screen based on score
        setTimeout(finishWin, 450);
        return;
      }

      makeBoard();
      loadQuestion();
      return;
    }

    // wrong
    lives -= 1;

    // show broken heart flash immediately
    showBrokenHeart();

    computeShownScore();
    updateTopUI();

    if (lives <= 0) {
      setFeedback(false, `Wrong ❌ Correct answer: ${item.a}`);
      setTimeout(finishLose, 450);
      return;
    }

    setFeedback(false, `Wrong ❌ Try again! (${lives} lives left)`);

    // keep same step, same question
    setTimeout(() => loadQuestion(), 550);
  });

  playAgainBtns.forEach((b) => b.addEventListener("click", resetAll));

  // init
  resetAll();
})();

/** ================================
 *  WORD REVEAL GAME LOGIC (wordreveal.html) #2
 *  - alternative layout (wordRevealRoot)
 *  ================================ */
(function wordReveal() {
  const root = document.getElementById("wordRevealRoot");
  if (!root) return;

  // Sections
  const secTutorial = document.getElementById("wrTutorial");
  const secSubject = document.getElementById("wrSubject");
  const secGame = document.getElementById("wrGame");
  const secWin = document.getElementById("wrWin");
  const secLose = document.getElementById("wrLose");

  // Top UI
  const scoreEl = document.getElementById("wrScore");
  const wordsEl = document.getElementById("wrWords");
  const livesEl = document.getElementById("wrLives");

  // Subject
  const subjectBtns = [...document.querySelectorAll("[data-wr-subject]")];

  // Game UI
  const dotsEl = document.getElementById("wrDots");
  const faceEl = document.getElementById("wrFace");
  const wrongEl = document.getElementById("wrWrong");
  const wrongDotsEl = document.getElementById("wrWrongDots");
  const hintEl = document.getElementById("wrHintText");
  const wordEl = document.getElementById("wrWord");
  const lettersCountEl = document.getElementById("wrLettersCount");
  const keyboardEl = document.getElementById("wrKeyboard");
  const feedbackEl = document.getElementById("wrFeedback");
  const skipBtn = document.getElementById("wrSkip");
  const exitBtn = document.getElementById("wrExit");

  // Win/Lose UI
  const winScoreEl = document.getElementById("wrWinScore");
  const loseScoreEl = document.getElementById("wrLoseScore");
  const playAgainBtns = [...document.querySelectorAll("[data-wr-play-again]")];

  // Tutorial button
  const startBtn = document.querySelector(
    '[data-action="start-game"][data-game="Word Reveal"]'
  );

  // Heart flash overlay
  const heartFlash = document.createElement("div");
  heartFlash.className = "wrHeartFlash";
  heartFlash.innerHTML = `
    <div class="wrHeartFlashBox">
      <div class="wrBroken">💔</div>
      <div class="wrHeartText">Wrong!</div>
    </div>
  `;
  document.body.appendChild(heartFlash);

  function showBrokenHeart() {
    heartFlash.classList.add("wrHeartFlash--on");
    window.clearTimeout(showBrokenHeart._t);
    showBrokenHeart._t = window.setTimeout(() => {
      heartFlash.classList.remove("wrHeartFlash--on");
    }, 650);
  }

  // Helpers
  const show = (el) => el && el.classList.remove("rrHidden");
  const hide = (el) => el && el.classList.add("rrHidden");
  const clamp0 = (n) => Math.max(0, n);

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // BANK: at least 10 each (we will slice to 10)
  const BANK = {
    English: [
      { w: "BUTTERFLY", hint: "Colorful insect with wings" },
      { w: "RAINBOW", hint: "Colorful arc in the sky after rain" },
      { w: "HOSPITAL", hint: "Place where doctors help sick people" },
      { w: "ELEPHANT", hint: "Huge gray animal with a trunk" },
      { w: "COMPUTER", hint: "A machine used for typing and learning" },
      { w: "DICTIONARY", hint: "Book used to find word meanings" },
      { w: "LIBRARY", hint: "Place full of books" },
      { w: "SANDWICH", hint: "Food with bread and filling" },
      { w: "NOTEBOOK", hint: "You write lessons here" },
      { w: "HOMEWORK", hint: "School tasks you do at home" },
      { w: "FRIEND", hint: "Someone you like and trust" },
      { w: "TEACHER", hint: "Person who helps you learn" },
    ],
    Math: [
      { w: "ADD", hint: "Combine numbers to get a total" },
      { w: "SUBTRACT", hint: "Take away numbers" },
      { w: "MULTIPLY", hint: "Repeated addition" },
      { w: "DIVIDE", hint: "Split into equal parts" },
      { w: "FRACTION", hint: "A part of a whole" },
      { w: "NUMBER", hint: "Used for counting" },
      { w: "EQUAL", hint: "Same value on both sides" },
      { w: "SHAPE", hint: "Circle, square, triangle" },
      { w: "ANGLE", hint: "Corner made by two lines" },
      { w: "MEASURE", hint: "Find length, weight, or time" },
      { w: "GRAPH", hint: "Shows data with lines or bars" },
    ],
    Science: [
      { w: "OXYGEN", hint: "Gas we breathe to live" },
      { w: "PLANET", hint: "Earth is one of these" },
      { w: "ENERGY", hint: "Power to move or do work" },
      { w: "MAGNET", hint: "Object that attracts iron" },
      { w: "WEATHER", hint: "Rainy, sunny, cloudy" },
      { w: "VOLCANO", hint: "Mountain that can erupt" },
      { w: "ELECTRIC", hint: "Power that lights a bulb" },
      { w: "NATURE", hint: "Plants, animals, and outdoors" },
      { w: "GRAVITY", hint: "Pulls things down to Earth" },
      { w: "SOLAR", hint: "Related to the Sun" },
      { w: "WATER", hint: "Liquid we drink every day" },
    ],
    Animals: [
      { w: "LION", hint: "King of the jungle" },
      { w: "GIRAFFE", hint: "Tall animal with long neck" },
      { w: "DOLPHIN", hint: "Smart sea animal" },
      { w: "KANGAROO", hint: "Jumps and has a pouch" },
      { w: "CROCODILE", hint: "Big reptile with strong jaws" },
      { w: "PENGUIN", hint: "Bird that cannot fly; lives in cold places" },
      { w: "ELEPHANT", hint: "Large animal with trunk" },
      { w: "CHEETAH", hint: "Fast land animal" },
      { w: "RABBIT", hint: "Small animal that hops" },
      { w: "TURTLE", hint: "Animal with a shell" },
      { w: "MONKEY", hint: "Animal that climbs trees" },
    ],
  };

  // Load teacher words from localStorage, fall back to BANK
  function loadTeacherWords(subj) {
    try {
      // Use loadAll() so any migration (filling missing hints) runs first
      const all = loadAll();
      const filtered = all.filter((q) => q.game === "word-reveal" && q.subject === subj);
      
      // If no teacher words, use BANK
      if (filtered.length === 0) return BANK[subj] || [];
      
      // Map teacher format to game format { w, hint }
      const teacherItems = filtered.map((q) => {
        const word = (q.word || "").toString().trim();
        let hint = (q.hint || q.h || "").toString().trim();
        // If hint equals the word, prefer a default hint
        if (hint && word && hint.toUpperCase() === word.toUpperCase()) {
          const def = (BANK[subj] || []).find((b) => String(b.w || b).toUpperCase() === word.toUpperCase());
          hint = def && (def.hint || def.h) ? String(def.hint || def.h) : "(no hint)";
        }
        return { w: word, hint: hint || (DEFAULT_HINTS[word.toUpperCase()] || "(no hint)") };
      });

      // Shuffle teacher items and take first 10
      const shuffled = teacherItems.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 10);
    } catch (err) {
      console.warn("Error loading teacher words:", err);
      return BANK[subj] || [];
    }
  }

  // State
  let subject = null;
  let rounds = []; // 10 selected word objects
  let iRound = 0; // 0..9
  let lives = 3; // ❤️❤️❤️
  let correctWords = 0; // correct out of 10
  let wordsDone = 0; // finished words (attempted)
  let displayedScore = 0; // correctWords - livesUsed

  let currentWord = "";
  let currentHint = "";
  let revealed = new Set(); // letters revealed (correct)
  let guessed = new Set(); // letters already clicked
  let wrongThisWord = 0; // 0..3

  let doneFlags = new Array(10).fill(false);

  function computeScore() {
    // Score is simply the number of correct words guessed
    displayedScore = correctWords;
  }

  function updateTop() {
    computeScore();
    scoreEl.textContent = String(displayedScore);
    wordsEl.textContent = String(wordsDone);
    livesEl.textContent =
      "❤️".repeat(lives) + "🤍".repeat(Math.max(0, 3 - lives));
  }

  function renderDots() {
    dotsEl.innerHTML = "";
    for (let k = 0; k < 10; k++) {
      const d = document.createElement("div");
      d.className = "wrDot";
      if (doneFlags[k]) d.classList.add("wrDot--done");
      if (k === iRound) d.classList.add("wrDot--active");
      dotsEl.appendChild(d);
    }
  }

  function renderWrongUI() {
    wrongEl.textContent = String(wrongThisWord);
    wrongDotsEl.innerHTML = "";
    for (let k = 0; k < 3; k++) {
      const d = document.createElement("div");
      d.className = "wrWrongDot";
      if (k < wrongThisWord) d.classList.add("wrWrongDot--filled");
      wrongDotsEl.appendChild(d);
    }

    // face
    if (wrongThisWord === 0) faceEl.textContent = "😊";
    else if (wrongThisWord === 1) faceEl.textContent = "😬";
    else if (wrongThisWord === 2) faceEl.textContent = "😟";
    else faceEl.textContent = "😵";
  }

  function renderWord() {
    wordEl.innerHTML = "";
    const w = currentWord;
    for (const ch of w) {
      const box = document.createElement("div");
      box.className = "wrChar";
      if (ch === " ") {
        box.style.borderBottom = "0";
        box.style.width = "12px";
        box.textContent = "";
      } else {
        box.textContent = revealed.has(ch) ? ch : "";
      }
      wordEl.appendChild(box);
    }
    const letters = w.replace(/[^A-Z]/g, "");
    lettersCountEl.textContent = `${letters.length} letters`;
  }

  function renderKeyboard() {
    keyboardEl.innerHTML = "";
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    letters.forEach((L) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "wrKey";
      b.textContent = L;
      b.disabled = guessed.has(L);

      b.addEventListener("click", () => onGuess(L, b));
      keyboardEl.appendChild(b);
    });
  }

  function setFeedback(ok, msg) {
    feedbackEl.textContent = msg;
    feedbackEl.className =
      "wrFeedback " + (ok ? "wrFeedback--good" : "wrFeedback--bad");
  }

  function clearFeedback() {
    feedbackEl.textContent = "";
    feedbackEl.className = "wrFeedback";
  }

  function loadRound() {
    clearFeedback();
    wrongThisWord = 0;
    revealed = new Set();
    guessed = new Set();

    const item = rounds[iRound];
    currentWord = String(item.w || "").toUpperCase();
    currentHint = String(item.hint || "—");

    hintEl.textContent = currentHint;

    renderDots();
    renderWrongUI();
    renderWord();
    renderKeyboard();
    updateTop();
  }

  function isWordSolved() {
    for (const ch of currentWord) {
      if (/[A-Z]/.test(ch) && !revealed.has(ch)) return false;
    }
    return true;
  }

  function finishWin() {
    hide(secTutorial);
    hide(secSubject);
    hide(secGame);
    hide(secLose);
    winScoreEl.textContent = `${displayedScore} / 10`;
    show(secWin);
    try {
      if (window.studyProgress && typeof window.studyProgress.saveResult === 'function') {
        const runStars = Math.min(3, Math.max(0, Math.floor(correctWords / 4)));
        const runLevel = 1 + Math.min(3, Math.floor(correctWords / 3));
        window.studyProgress.saveResult('word-reveal', { won: true, score: correctWords, stars: runStars, level: runLevel });
        secWin.dataset.progressSaved = '1';
      }
    } catch (e) {
      console.error('saveResult word win error', e);
    }
  }

  function finishLose() {
    hide(secTutorial);
    hide(secSubject);
    hide(secGame);
    hide(secWin);
    loseScoreEl.textContent = `${displayedScore} / 10`;
    show(secLose);
    try {
      if (window.studyProgress && typeof window.studyProgress.saveResult === 'function') {
        const runStars = Math.min(3, Math.max(0, Math.floor(correctWords / 4)));
        const runLevel = 1 + Math.min(3, Math.floor(correctWords / 3));
        window.studyProgress.saveResult('word-reveal', { won: false, score: correctWords, stars: runStars, level: runLevel });
        secLose.dataset.progressSaved = '1';
      }
    } catch (e) {
      console.error('saveResult word lose error', e);
    }
  }

  function nextRound() {
    doneFlags[iRound] = true;
    wordsDone += 1;
    updateTop();

    iRound += 1;
    if (iRound >= 10) {
      renderDots();
      setTimeout(finishWin, 450);
      return;
    }
    loadRound();
  }

  function onGuess(L, btn) {
    if (guessed.has(L)) return;
    guessed.add(L);

    const hit = currentWord.includes(L);

    if (hit) {
      // reveal all occurrences
      for (let idx = 0; idx < currentWord.length; idx++) {
        const ch = currentWord[idx];
        if (ch === L) revealed.add(L);
      }

      btn.classList.add("wrKey--good");
      btn.disabled = true;

      renderWord();

      if (isWordSolved()) {
        correctWords += 1;
        updateTop();
        setFeedback(true, "Correct word! ✅ Next word...");
        setTimeout(nextRound, 700);
      } else {
        setFeedback(true, "Correct letter! ✅");
      }
      return;
    }

    // wrong guess -> consumes 1 life
    wrongThisWord += 1;
    lives -= 1;

    btn.classList.add("wrKey--bad");
    btn.disabled = true;

    showBrokenHeart();
    renderWrongUI();
    updateTop();

    if (lives <= 0) {
      setFeedback(false, "Wrong! ❌ You ran out of lives.");
      setTimeout(finishLose, 600);
      return;
    }

    if (wrongThisWord >= 3) {
      setFeedback(false, "Too many wrong guesses for this word ❌ Next word...");
      setTimeout(nextRound, 700);
      return;
    }

    setFeedback(false, `Wrong letter ❌ Lives left: ${lives}`);
  }

  function resetAll() {
    subject = null;
    rounds = [];
    iRound = 0;
    lives = 3;
    correctWords = 0;
    wordsDone = 0;
    displayedScore = 0;

    currentWord = "";
    currentHint = "";
    revealed = new Set();
    guessed = new Set();
    wrongThisWord = 0;
    doneFlags = new Array(10).fill(false);

    updateTop();

    // show tutorial first (like your other game)
    show(secTutorial);
    hide(secSubject);
    hide(secGame);
    hide(secWin);
    hide(secLose);

    hintEl.textContent = "—";
    dotsEl.innerHTML = "";
    wrongDotsEl.innerHTML = "";
    wordEl.innerHTML = "";
    keyboardEl.innerHTML = "";
    clearFeedback();
  }

  // Events
  startBtn?.addEventListener("click", () => {
    hide(secTutorial);
    show(secSubject);
  });

  subjectBtns.forEach((b) => {
    b.addEventListener("click", () => {
      subject = b.dataset.wrSubject;
      const bank = loadTeacherWords(subject) || [];
      if (bank.length < 10) {
        alert(`${subject} needs at least 10 words.`);
        return;
      }

      // pick 10 random
      rounds = shuffle(bank).slice(0, 10);
      // Normalize hints: ensure each round has a proper hint and it isn't accidentally the word itself
      rounds.forEach((r) => {
        const word = (r.w || "").toString();
        const hint = (r.hint || "").toString();
        if (!hint || hint.trim() === "" || hint.trim().toUpperCase() === word.trim().toUpperCase()) {
          // try to find a default hint in BANK for this subject
          const def = (BANK[subject] || []).find((b) => String(b.w || b).toUpperCase() === word.trim().toUpperCase());
          r.hint = (def && (def.hint || def.h)) ? String(def.hint || def.h) : "(no hint)";
        }
      });
      iRound = 0;
      lives = 3;
      correctWords = 0;
      wordsDone = 0;
      doneFlags = new Array(10).fill(false);

      hide(secSubject);
      show(secGame);

      loadRound();
    });
  });

  skipBtn?.addEventListener("click", () => {
    if (!secGame || secGame.classList.contains("rrHidden")) return;
    setFeedback(false, "Skipped ❌ Next word...");
    setTimeout(nextRound, 600);
  });

  exitBtn?.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  playAgainBtns.forEach((b) => b.addEventListener("click", resetAll));

  // init
  resetAll();
})();

/** ================================
 *  TEACHERS DASHBOARD (teachers.html)
 *  ================================ */
(function teachersDashboard() {
  const root = document.getElementById("teachersRoot");
  if (!root) return;

  // --- helpers ---
  const $ = (id) => document.getElementById(id);
  const show = (el) => el && el.classList.remove("rrHidden");
  const hide = (el) => el && el.classList.add("rrHidden");

  // Top game buttons
  const gameBtns = [...root.querySelectorAll("[data-td-game]")];

  // Add question panel + title
  const addSection = $("tdAddSection");
  const addTitleEl = $("tdAddTitle");
  const addBtn = $("tdAddBtn");

  // Forms
  const formRR = $("tdFormReadingRace");
  const formQQ = $("tdFormQuizQuest");
  const formWR = $("tdFormWordReveal");

  // Existing questions list
  const listEl = $("tdQuestionList");
  const emptyEl = $("tdEmptyState");

  let currentGame = "reading-race"; // default

  // ===== STORAGE HELPERS =====
  const LS_KEY = "studyfirst_questions";

  // Default hints map used by migrations and rendering for word-reveal
  const DEFAULT_HINTS = {
    BUTTERFLY: "Colorful insect with wings",
    RAINBOW: "Colorful arc in the sky after rain",
    HOSPITAL: "Place where doctors help sick people",
    ELEPHANT: "Huge gray animal with a trunk",
    COMPUTER: "A machine used for typing and learning",
    DICTIONARY: "Book used to find word meanings",
    LIBRARY: "Place full of books",
    SANDWICH: "Food with bread and filling",
    NOTEBOOK: "You write lessons here",
    HOMEWORK: "School tasks you do at home",
    FRIEND: "Someone you like and trust",
    TEACHER: "Person who helps you learn",
    ADD: "Combine numbers to get a total",
    SUBTRACT: "Take away numbers",
    MULTIPLY: "Repeated addition",
    DIVIDE: "Split into equal parts",
    FRACTION: "A part of a whole",
    NUMBER: "Used for counting",
    EQUAL: "Same value on both sides",
    SHAPE: "Circle, square, triangle",
    ANGLE: "Corner made by two lines",
    MEASURE: "Find length, weight, or time",
    GRAPH: "Shows data with lines or bars",
    OXYGEN: "Gas we breathe to live",
    PLANET: "Earth is one of these",
    ENERGY: "Power to move or do work",
    MAGNET: "Object that attracts iron",
    WEATHER: "Rainy, sunny, cloudy",
    VOLCANO: "Mountain that can erupt",
    ELECTRIC: "Power that lights a bulb",
    NATURE: "Plants, animals, and outdoors",
    GRAVITY: "Pulls things down to Earth",
    SOLAR: "Related to the Sun",
    WATER: "Liquid we drink every day",
    LION: "King of the jungle",
    GIRAFFE: "Tall animal with long neck",
    DOLPHIN: "Smart sea animal",
    KANGAROO: "Jumps and has a pouch",
    CROCODILE: "Big reptile with strong jaws",
    PENGUIN: "Bird that cannot fly; lives in cold places",
    CHEETAH: "Fast land animal",
    RABBIT: "Small animal that hops",
    TURTLE: "Animal with a shell",
    MONKEY: "Animal that climbs trees"
  };

  function loadAll() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Fix any word-reveal questions that have incorrect hints
      if (Array.isArray(parsed)) {
        parsed.forEach(q => {
          if (q.game === "word-reveal") {
            const word = (q.word || "").toString().trim().toUpperCase();
            const hint = (q.hint || q.h || "").toString().trim();
            // If hint is missing, equals the word, or contains "— hint", replace with DEFAULT_HINTS
            if (!hint || hint.toUpperCase() === word || hint.includes("— hint")) {
              q.hint = DEFAULT_HINTS[word] || "(no hint)";
            }
          }
        });
      }
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("loadAll questions error:", err);
      return [];
    }
  }

  function saveAll(items) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch (err) {
      console.error("saveAll questions error:", err);
    }
  }

  // ===== Fix Hints admin action =====
  function fixHints() {
    try {
      const all = loadAll();
      if (!Array.isArray(all) || !all.length) {
        alert('No questions found to fix.');
        return;
      }
      let changed = 0;
      for (const q of all) {
        if (q.game === 'word-reveal') {
          const word = (q.word || '').toString().trim();
          const hint = (q.hint || q.h || '').toString().trim();
          if (!hint || hint.toUpperCase() === word.toUpperCase()) {
            const def = DEFAULT_HINTS[word.toUpperCase()];
            const newHint = def || '(no hint)';
            if (hint !== newHint) {
              q.hint = newHint;
              changed++;
            }
          }
        }
      }
      if (changed > 0) saveAll(all);
      renderList();
      alert(`Hints fixed: ${changed}`);
    } catch (err) {
      console.error('fixHints error', err);
      alert('Error fixing hints (open console).');
    }
  }

  // Fix hints button removed from UI; keep `fixHints()` as an internal utility.

  function deleteQuestion(id) {
    // ask for confirmation before deleting
    try {
      const ok = window.confirm?.("Delete this question? This action cannot be undone.");
      if (!ok) return;
    } catch (e) {
      // if confirm not available, proceed cautiously
    }

    const all = loadAll().filter((q) => q.id !== id);
    saveAll(all);
    renderList();
  }

  // Seed default questions into localStorage so the Teachers dashboard
  // shows editable copies of the built-in question banks. This merges
  // defaults with any existing teacher questions to avoid overwriting
  // user-created content.
  function ensureDefaultQuestions() {
    try {
      const existing = loadAll() || [];
      
      // Check if defaults are already initialized (if we have at least 10 items per game/subject)
      const gameSubjects = {
        'reading-race': ['English', 'Math', 'Science', 'History'],
        'quiz-quest': ['Math', 'English', 'Science', 'History'],
        'word-reveal': ['English', 'Math', 'Science', 'Animals']
      };
      
      // Always ensure all defaults are present; merge with user data to avoid data loss
      // (This guards against incomplete initialization or localStorage wipes)

      const now = Date.now();
      let idCounter = now + 1;

      // Hints data for word-reveal - ALL words from BANK
      const hints = {
        BUTTERFLY: "Colorful insect with wings",
        RAINBOW: "Colorful arc in the sky after rain",
        HOSPITAL: "Place where doctors help sick people",
        ELEPHANT: "Huge gray animal with a trunk",
        COMPUTER: "A machine used for typing and learning",
        DICTIONARY: "Book used to find word meanings",
        LIBRARY: "Place full of books",
        SANDWICH: "Food with bread and filling",
        NOTEBOOK: "You write lessons here",
        HOMEWORK: "School tasks you do at home",
        FRIEND: "Someone you like and trust",
        TEACHER: "Person who helps you learn",
        ADD: "Combine numbers to get a total",
        SUBTRACT: "Take away numbers",
        MULTIPLY: "Repeated addition",
        DIVIDE: "Split into equal parts",
        FRACTION: "A part of a whole",
        NUMBER: "Used for counting",
        EQUAL: "Same value on both sides",
        SHAPE: "Circle, square, triangle",
        ANGLE: "Corner made by two lines",
        MEASURE: "Find length, weight, or time",
        GRAPH: "Shows data with lines or bars",
        OXYGEN: "Gas we breathe to live",
        PLANET: "Earth is one of these",
        ENERGY: "Power to move or do work",
        MAGNET: "Object that attracts iron",
        WEATHER: "Rainy, sunny, cloudy",
        VOLCANO: "Mountain that can erupt",
        ELECTRIC: "Power that lights a bulb",
        NATURE: "Plants, animals, and outdoors",
        GRAVITY: "Pulls things down to Earth",
        SOLAR: "Related to the Sun",
        WATER: "Liquid we drink every day",
        LION: "King of the jungle",
        GIRAFFE: "Tall animal with long neck",
        DOLPHIN: "Smart sea animal",
        KANGAROO: "Jumps and has a pouch",
        CROCODILE: "Big reptile with strong jaws",
        PENGUIN: "Bird that cannot fly; lives in cold places",
        CHEETAH: "Fast land animal",
        RABBIT: "Small animal that hops",
        TURTLE: "Animal with a shell",
        MONKEY: "Animal that climbs trees"
      };

      // Full 10-item banks per game/subject
      const banks = {
        'reading-race': {
          English: [
            'I see a red ball.','The sun is bright.','My dog is big.','I like ice cream.','Please sit down.',
            'This is my book.','We can play now.','Open the door.','She reads a book.','They are happy.'
          ],
          Math: [
            '12 + 5 = 17','48 ÷ 6 = 8','9 - 4 = 5','7 × 3 = 21','100',
            '3.5','25 + 25 = 50','60 ÷ 10 = 6','2 + 2 = 4','6 × 2 = 12'
          ],
          Science: [
            'Plants need sunlight to grow.','Gravity pulls objects down.','We breathe oxygen to live.','Rain comes from clouds in the sky.','Water freezes at 0°C.',
            'The Earth orbits the Sun.','Seeds grow into plants.','Light travels fast.','Birds can fly.','Fish live in water.'
          ],
          History: [
            'History teaches us about the past.','Explorers traveled to new lands.','A map shows places on Earth.','Artifacts tell us ancient stories.','Ancient people used tools.',
            'Cities changed over time.','Kings ruled lands long ago.','People made discoveries.','Stories pass from elders.','Past events shape today.'
          ]
        },
        'quiz-quest': {
          Math: [
            { q: 'What is 5 + 7?', options: ['10','12','13','15'], correctIndex: 1 },
            { q: 'What is 9 - 4?', options: ['3','4','5','6'], correctIndex: 2 },
            { q: 'What is 6 + 8?', options: ['12','13','14','15'], correctIndex: 2 },
            { q: 'What is 12 - 7?', options: ['4','5','6','7'], correctIndex: 1 },
            { q: 'What is 3 + 9?', options: ['10','11','12','13'], correctIndex: 2 },
            { q: 'What is 10 - 3?', options: ['6','7','8','9'], correctIndex: 1 },
            { q: 'What is 4 + 4?', options: ['6','7','8','9'], correctIndex: 2 },
            { q: 'What is 15 - 5?', options: ['9','10','11','12'], correctIndex: 1 },
            { q: 'What is 2 + 11?', options: ['12','13','14','15'], correctIndex: 1 },
            { q: 'What is 18 - 9?', options: ['7','8','9','10'], correctIndex: 2 }
          ],
          English: [
            { q: 'Which one is a noun?', options: ['Run','Book','Fast','Blue'], correctIndex: 1 },
            { q: 'Choose the correct spelling:', options: ['Skool','School','Scool','Shool'], correctIndex: 1 },
            { q: 'Which one is a verb?', options: ['Happy','Jump','Green','Table'], correctIndex: 1 },
            { q: 'Which one is a color?', options: ['Red','Dog','Eat','Chair'], correctIndex: 0 },
            { q: 'Opposite of big?', options: ['Small','Tall','Round','Bright'], correctIndex: 0 },
            { q: 'Which one is a fruit?', options: ['Apple','Car','Pencil','Shoe'], correctIndex: 0 },
            { q: 'Finish: I ___ to school.', options: ['go','gone','going','goes'], correctIndex: 0 },
            { q: 'Which one is an animal?', options: ['Cat','Hat','Bat','Mat'], correctIndex: 0 },
            { q: 'Which one is a place?', options: ['Park','Sleep','Red','Quick'], correctIndex: 0 },
            { q: 'Which is correct?', options: ['I like books.','Like I books.','Books like I.','I books like.'], correctIndex: 0 }
          ],
          Science: [
            { q: 'What do plants need to make food?', options: ['Sunlight','Candy','Dust','Ice'], correctIndex: 0 },
            { q: 'Which body part helps you see?', options: ['Eyes','Ears','Nose','Teeth'], correctIndex: 0 },
            { q: 'Which one is a liquid?', options: ['Rock','Water','Chair','Paper'], correctIndex: 1 },
            { q: 'Which one is an animal?', options: ['Spoon','Dog','Shoes','Phone'], correctIndex: 1 },
            { q: 'What do we breathe in to live?', options: ['Oxygen','Sand','Milk','Smoke'], correctIndex: 0 },
            { q: 'What is the opposite of hot?', options: ['Cold','Fast','Loud','Tall'], correctIndex: 0 },
            { q: 'Which one is a planet?', options: ['Earth','Bread','Book','Ball'], correctIndex: 0 },
            { q: 'Which one is a source of light?', options: ['Sun','Cloud','Rock','Mud'], correctIndex: 0 },
            { q: 'What do we call frozen water?', options: ['Ice','Steam','Juice','Soap'], correctIndex: 0 },
            { q: 'Where do fish live?', options: ['Water','Sand','Sky','Tree'], correctIndex: 0 }
          ],
          History: [
            { q: 'What do we call a story about the past?', options: ['History','Science','Math','Music'], correctIndex: 0 },
            { q: 'Who writes books?', options: ['Author','Doctor','Pilot','Chef'], correctIndex: 0 },
            { q: 'Old things from the past are called:', options: ['Artifacts','Snacks','Toys','Clouds'], correctIndex: 0 },
            { q: 'Where do we keep old objects?', options: ['Museum','Kitchen','Garage','Garden'], correctIndex: 0 },
            { q: 'A long time ago is the:', options: ['Past','Future','Today','Now'], correctIndex: 0 },
            { q: 'Who studies the past?', options: ['Historian','Baker','Singer','Driver'], correctIndex: 0 },
            { q: 'A map helps with:', options: ['Finding places','Cooking','Painting','Sleeping'], correctIndex: 0 },
            { q: 'A very old building is:', options: ['Ancient','Modern','New','Tiny'], correctIndex: 0 },
            { q: 'People from your family long ago:', options: ['Ancestors','Neighbors','Students','Coaches'], correctIndex: 0 },
            { q: 'A timeline shows:', options: ['Order of events','Colors','Weather','Food'], correctIndex: 0 }
          ]
        },
        'word-reveal': {
          English: ['BUTTERFLY','RAINBOW','HOSPITAL','ELEPHANT','COMPUTER','DICTIONARY','LIBRARY','SANDWICH','NOTEBOOK','HOMEWORK','FRIEND','TEACHER'],
          Math: ['ADD','SUBTRACT','MULTIPLY','DIVIDE','FRACTION','NUMBER','EQUAL','SHAPE','ANGLE','MEASURE','GRAPH'],
          Science: ['OXYGEN','PLANET','ENERGY','MAGNET','WEATHER','VOLCANO','ELECTRIC','NATURE','GRAVITY','SOLAR','WATER'],
          Animals: ['LION','GIRAFFE','DOLPHIN','KANGAROO','CROCODILE','PENGUIN','ELEPHANT','CHEETAH','RABBIT','TURTLE','MONKEY']
        }
      };

      // For each game/subject, add ALL items from banks (not just 10)
      const out = [];
      const keyOf = (q) => {
        if (q.game === "reading-race") return `${q.game}::${q.subject}::${String(q.sentence || "").trim()}`;
        if (q.game === "quiz-quest") return `${q.game}::${q.subject}::${String(q.question || "").trim()}`;
        if (q.game === "word-reveal") return `${q.game}::${q.subject}::${String(q.word || "").trim()}`;
        return `${q.game}::${q.subject}`;
      };
      const seen = new Set();

      // Add existing user-created questions first (preserve non-default items)
      for (const item of existing) {
        const k = keyOf(item);
        if (!seen.has(k)) {
          out.push(item);
          seen.add(k);
        }
      }

      // Now add all defaults - ALL items per game/subject from banks
      for (const game of Object.keys(banks)) {
        for (const subject of Object.keys(banks[game])) {
          const pool = banks[game][subject];
          for (let i = 0; i < pool.length; i++) {
            let item = {};
            if (game === 'reading-race') {
              item = { game, subject, sentence: pool[i] };
            } else if (game === 'quiz-quest') {
              const q = pool[i];
              item = { game, subject, question: q.q, options: q.options, correctIndex: q.correctIndex };
            } else if (game === 'word-reveal') {
              const word = pool[i];
              // Always use hints for word-reveal
              const hint = hints[word.toUpperCase && typeof word === 'string' ? word.toUpperCase() : word] || hints[word] || 'Hint not available';
              item = { game, subject, word, hint };
            }
            const k = keyOf(item);
            if (seen.has(k)) continue;
            item.id = String(idCounter++);
            out.push(item);
            seen.add(k);
          }
        }
      }

      saveAll(out);
      console.log(`ensureDefaultQuestions: seeded ${out.length} questions into localStorage`);
    } catch (err) {
      console.error("ensureDefaultQuestions error:", err);
    }
  }

  function addQuestion(q) {
    const all = loadAll();
    // No limit on questions per subject; games will shuffle and pick 10 randomly
    if (!q.id) q.id = String(Date.now());
    all.push(q);
    saveAll(all);
    renderList();
  }

  function deleteQuestion(id) {
    const all = loadAll().filter((q) => q.id !== id);
    saveAll(all);
    renderList();
  }

  function prettyGame(game) {
    if (game === "reading-race") return "Reading Race";
    if (game === "quiz-quest") return "Quiz Quest";
    if (game === "word-reveal") return "Word Reveal";
    return game;
  }

  // ===== RENDER EXISTING QUESTIONS =====
  function renderList() {
    const all = loadAll().filter((q) => q.game === currentGame);

    listEl.innerHTML = "";

    // If nothing at all, show empty state
    if (!all.length) {
      show(emptyEl);
      return;
    }

    hide(emptyEl);

    // Group by subject and render a header + cards per subject
    const subjectsOrder = ["English", "Math", "Science", "History", "Animals"];
    // Also include any other subjects found
    const foundSubjects = Array.from(new Set(all.map((q) => q.subject))).sort();
    const subjects = subjectsOrder.concat(foundSubjects.filter(s => !subjectsOrder.includes(s)));

    subjects.forEach((subj) => {
      const items = all.filter((q) => q.subject === subj);
      if (!items || !items.length) return;

      const subjHeader = document.createElement("div");
      subjHeader.className = "tdSubjectHeader";
      subjHeader.textContent = `${subj} (${items.length})`;
      listEl.appendChild(subjHeader);

      // Display all items in the dashboard
      const displayItems = items;

      displayItems.forEach((q) => {
        const card = document.createElement("div");
        card.className = "tdQuestionCard";
        card.dataset.id = q.id;

        const header = document.createElement("div");
        header.className = "tdQuestionCardHeader";
        header.textContent = `${prettyGame(q.game)} · ${q.subject}`;

        const body = document.createElement("div");
        body.className = "tdQuestionCardBody";

        if (q.game === "reading-race") {
          body.textContent = q.sentence;
        } else if (q.game === "quiz-quest") {
          body.textContent = q.question;
        } else if (q.game === "word-reveal") {
          // show word and hint separately; normalize hint display
          const wordEl = document.createElement("div");
          wordEl.className = "tdWRWord";
          wordEl.textContent = q.word || "";

          // Normalize hint sources: prefer q.hint, fall back to legacy q.h, then defaults
          const rawHint = q.hint ?? q.h ?? q.hintText ?? "";
          let finalHint = String(rawHint || "").trim();
          const wordStr = String(q.word || "").trim();
          // If hint is empty or accidentally equals the answer, try DEFAULT_HINTS
          if (!finalHint) {
            const def = DEFAULT_HINTS[wordStr.toUpperCase()];
            finalHint = def || "(no hint)";
          } else if (wordStr && finalHint.toUpperCase() === wordStr.toUpperCase()) {
            const def = DEFAULT_HINTS[wordStr.toUpperCase()];
            finalHint = def || "(no hint)";
          }

          const hintEl = document.createElement("div");
          hintEl.className = "tdWRHint";
          hintEl.textContent = finalHint || "(no hint)";

          body.appendChild(wordEl);
          body.appendChild(hintEl);
        }

        const footer = document.createElement("div");
        footer.className = "tdQuestionCardFooter";

        const badge = document.createElement("span");
        badge.className = "tdQuestionMeta";
        badge.textContent =
          q.game === "quiz-quest" && typeof q.correctIndex === "number"
            ? `Correct: Option ${q.correctIndex + 1}`
            : "";

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "tdQuestionDelete";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", () => deleteQuestion(q.id));

        footer.appendChild(badge);
        footer.appendChild(delBtn);

        card.appendChild(header);
        card.appendChild(body);
        card.appendChild(footer);
        listEl.appendChild(card);
      });
    });
  }

  // ===== GAME SWITCHING =====
  function setGame(game) {
    currentGame = game;

    gameBtns.forEach((btn) => {
      btn.classList.toggle(
        "tdGameBtn--active",
        btn.dataset.tdGame === game
      );
    });

    // change title text
    if (addTitleEl) {
      addTitleEl.textContent = `Add Question - ${prettyGame(game)}`;
    }

    // show correct form
    hide(formRR);
    hide(formQQ);
    hide(formWR);

    if (game === "reading-race") show(formRR);
    else if (game === "quiz-quest") show(formQQ);
    else if (game === "word-reveal") show(formWR);

    renderList();
  }

  gameBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const game = btn.dataset.tdGame;
      setGame(game);
    });
  });

  // ===== SUBJECT GROUP HELPERS =====
  function wireSubjectGroup(rootEl, activeClass) {
    if (!rootEl) return;
    const btns = [...rootEl.querySelectorAll("[data-td-subject]")];
    btns.forEach((b) => {
      b.addEventListener("click", () => {
        btns.forEach((x) => x.classList.remove(activeClass));
        b.classList.add(activeClass);
      });
    });
  }

  wireSubjectGroup(formRR, "tdSubjectBtn--active");
  wireSubjectGroup(formQQ, "tdSubjectBtn--active");
  wireSubjectGroup(formWR, "tdSubjectBtn--active");

  function getSelectedSubject(formEl) {
    const btn = formEl.querySelector(".tdSubjectBtn--active");
    return btn ? btn.dataset.tdSubject : null;
  }

  // ===== FORM: READING RACE =====
  if (formRR) {
    const sentenceEl = $("tdRRSentence");
    const saveBtn = $("tdRRSave");
    const cancelBtn = $("tdRRCancel");

    cancelBtn?.addEventListener("click", () => {
      sentenceEl.value = "";
      hide(addSection);
    });

    saveBtn?.addEventListener("click", () => {
      const subject = getSelectedSubject(formRR) || "Math";
      const sentence = (sentenceEl.value || "").trim();

      if (!sentence) {
        alert("Please enter a sentence.");
        return;
      }

      addQuestion({
        id: Date.now().toString(),
        game: "reading-race",
        subject,
        sentence,
      });

      sentenceEl.value = "";
      hide(addSection);
    });
  }

  // ===== FORM: QUIZ QUEST =====
  if (formQQ) {
    const qEl = $("tdQQQuestion");
    const opt1 = $("tdQQOpt1");
    const opt2 = $("tdQQOpt2");
    const opt3 = $("tdQQOpt3");
    const opt4 = $("tdQQOpt4");
    const radios = [
      $("tdQQCorrect1"),
      $("tdQQCorrect2"),
      $("tdQQCorrect3"),
      $("tdQQCorrect4"),
    ];
    const saveBtn = $("tdQQSave");
    const cancelBtn = $("tdQQCancel");

    cancelBtn?.addEventListener("click", () => {
      qEl.value = "";
      opt1.value = "";
      opt2.value = "";
      opt3.value = "";
      opt4.value = "";
      radios.forEach((r, i) => (r.checked = i === 0));
      hide(addSection);
    });

    saveBtn?.addEventListener("click", () => {
      const subject = getSelectedSubject(formQQ) || "Math";
      const question = (qEl.value || "").trim();
      const options = [opt1.value, opt2.value, opt3.value, opt4.value].map(
        (s) => (s || "").trim()
      );
      const correctIndex = radios.findIndex((r) => r && r.checked);

      if (!question) {
        alert("Please enter a question.");
        return;
      }
      if (options.some((o) => !o)) {
        alert("Please fill in all four options.");
        return;
      }
      if (correctIndex < 0) {
        alert("Please select the correct answer.");
        return;
      }

      addQuestion({
        id: Date.now().toString(),
        game: "quiz-quest",
        subject,
        question,
        options,
        correctIndex,
      });

      qEl.value = "";
      opt1.value = "";
      opt2.value = "";
      opt3.value = "";
      opt4.value = "";
      radios.forEach((r, i) => (r.checked = i === 0));
      hide(addSection);
    });
  }

  // ===== FORM: WORD REVEAL =====
  if (formWR) {
    const wordEl = $("tdWRWord");
    const hintEl = $("tdWRHint");
    const saveBtn = $("tdWRSave");
    const cancelBtn = $("tdWRCancel");

    cancelBtn?.addEventListener("click", () => {
      wordEl.value = "";
      hintEl.value = "";
      hide(addSection);
    });

    saveBtn?.addEventListener("click", () => {
      const subject = getSelectedSubject(formWR) || "Math";
      const word = (wordEl.value || "").trim().toUpperCase();
      const hint = (hintEl.value || "").trim();

      if (!word || !/^[A-Z]+$/.test(word)) {
        alert("Please enter the word (letters only, no spaces).");
        return;
      }
      if (!hint) {
        alert("Please enter a hint.");
        return;
      }

      addQuestion({
        id: Date.now().toString(),
        game: "word-reveal",
        subject,
        word,
        hint,
      });

      wordEl.value = "";
      hintEl.value = "";
      hide(addSection);
    });
  }

  // ===== "Add New Question" BUTTON =====
  addBtn?.addEventListener("click", () => {
    show(addSection);
    // optional: scroll into view
    addSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // initial state
  hide(addSection);
  // ensure built-in questions are available in the Teachers dashboard
  try {
    ensureDefaultQuestions();
    renderList();
  } catch (e) {
    console.warn('ensureDefaultQuestions/renderList error', e);
  }

  setGame(currentGame);
})();
