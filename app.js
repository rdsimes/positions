// Data is fetched from positions.json at startup
let allLevels = {};
const ALL_KEY = "All Levels";
let levelNames = [ALL_KEY];

function getTerms(levelKey) {
  if (levelKey === ALL_KEY) {
    return Object.values(allLevels).flat();
  }
  return allLevels[levelKey] || [];
}

// Returns all terms from the first level up to and including levelKey.
// Used by the quiz so questions can draw on all previously learned vocabulary.
function getTermsUpTo(levelKey) {
  if (levelKey === ALL_KEY) {
    return Object.values(allLevels).flat();
  }
  const keys = Object.keys(allLevels);
  const idx = keys.indexOf(levelKey);
  if (idx === -1) return allLevels[levelKey] || [];
  return keys.slice(0, idx + 1).flatMap(k => allLevels[k]);
}

// Build level selects
function populateSelect(el, includeAll) {
  el.innerHTML = '';
  (includeAll ? levelNames : Object.keys(allLevels)).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    el.appendChild(opt);
  });
}

// --- BROWSE ---
function renderBrowse(levelSelect) {
  const level = levelSelect.value;
  const terms = getTerms(level);
  const grid = document.getElementById('terms-grid');
  grid.innerHTML = '';
  terms.forEach(({ term, definition }) => {
    const levelLabel = (level === ALL_KEY)
      ? Object.entries(allLevels).find(([, arr]) => arr.some(t => t.term === term))?.[0] || ''
      : level;
    const card = document.createElement('div');
    card.className = 'term-card';
    card.innerHTML = `<div class="level-badge">${levelLabel}</div><div class="term-name">${term}</div><div class="term-def">${definition}</div>`;
    grid.appendChild(card);
  });
}

// --- QUIZ STATE ---
let quizMode = 'term'; // 'term' | 'def'
let quizQuestions = [];
let qIndex = 0;
let score = 0;
let answered = false;
let savedConfig = null;
let _quizLevelSelect = null;

// Shuffle helper
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startQuiz() {
  const level = _quizLevelSelect.value;
  const countVal = document.getElementById('quiz-count').value;
  const pool = getTermsUpTo(level);

  if (pool.length < 4) {
    alert('This level has too few terms for a quiz (need at least 4).');
    return;
  }

  let count = countVal === 'all' ? pool.length : Math.min(parseInt(countVal), pool.length);

  savedConfig = { level, countVal, mode: quizMode };
  quizQuestions = buildQuestions(shuffle(pool).slice(0, count), pool, quizMode);
  qIndex = 0;
  score = 0;

  document.getElementById('quiz-setup').classList.add('hidden');
  document.getElementById('quiz-result').classList.add('hidden');
  document.getElementById('quiz-active').classList.remove('hidden');
  renderQuestion();
}

function buildQuestions(selected, pool, mode) {
  return selected.map(item => {
    const distractors = shuffle(pool.filter(t => t.term !== item.term)).slice(0, 3);
    const options = shuffle([item, ...distractors]);
    return { item, options, mode };
  });
}

function renderQuestion() {
  answered = false;
  const q = quizQuestions[qIndex];
  const total = quizQuestions.length;

  document.getElementById('q-counter').textContent = `Question ${qIndex + 1} of ${total}`;
  document.getElementById('progress-fill').style.width = `${(qIndex / total) * 100}%`;
  document.getElementById('score-display').textContent = `Score: ${score} / ${qIndex}`;
  document.getElementById('feedback-row').classList.add('hidden');

  if (q.mode === 'term') {
    document.getElementById('q-label').textContent = 'What is the definition of\u2026';
    document.getElementById('q-prompt').textContent = q.item.term;
  } else {
    document.getElementById('q-label').textContent = 'Which term matches this definition\u2026';
    document.getElementById('q-prompt').textContent = q.item.definition;
  }

  const list = document.getElementById('options-list');
  list.innerHTML = '';
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = q.mode === 'term' ? opt.definition : opt.term;
    btn.addEventListener('click', () => handleAnswer(btn, opt, q));
    list.appendChild(btn);
  });
}

function handleAnswer(clickedBtn, chosen, q) {
  if (answered) return;
  answered = true;
  const correct = chosen.term === q.item.term;

  const allBtns = document.querySelectorAll('.option-btn');
  allBtns.forEach((btn, i) => {
    btn.disabled = true;
    const opt = q.options[i];
    if (opt.term === q.item.term) btn.classList.add(btn === clickedBtn ? 'correct' : 'reveal');
  });
  if (!correct) clickedBtn.classList.add('wrong');

  if (correct) score++;

  const fb = document.getElementById('feedback-msg');
  fb.textContent = correct ? '\u2713 Correct!' : `\u2717 The answer was: "${q.mode === 'term' ? q.item.definition : q.item.term}"`;
  fb.className = 'feedback-msg ' + (correct ? 'correct' : 'wrong');

  const feedbackRow = document.getElementById('feedback-row');
  feedbackRow.classList.remove('hidden');
  const nextBtn = document.getElementById('next-btn');
  nextBtn.textContent = qIndex + 1 < quizQuestions.length ? 'Next \u2192' : 'See Results';
}

function nextQuestion() {
  qIndex++;
  if (qIndex >= quizQuestions.length) {
    showResult();
  } else {
    renderQuestion();
  }
}

function showResult() {
  document.getElementById('quiz-active').classList.add('hidden');
  const result = document.getElementById('quiz-result');
  result.classList.remove('hidden');
  const total = quizQuestions.length;
  const pct = Math.round((score / total) * 100);
  document.getElementById('result-score').textContent = `${score} / ${total}`;
  document.getElementById('result-label').textContent = `${pct}% correct`;
  let heading = pct === 100 ? '\uD83C\uDF1F Perfect score!' : pct >= 80 ? '\uD83C\uDF89 Great work!' : pct >= 60 ? '\uD83D\uDC4D Good effort!' : '\uD83D\uDCAA Keep practising!';
  document.getElementById('result-heading').textContent = heading;
}

function retryQuiz() {
  if (!savedConfig) return;
  _quizLevelSelect.value = savedConfig.level;
  document.getElementById('quiz-count').value = savedConfig.countVal;
  quizMode = savedConfig.mode;
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === quizMode);
  });
  startQuiz();
}

function showQuizSetup() {
  document.getElementById('quiz-active').classList.add('hidden');
  document.getElementById('quiz-result').classList.add('hidden');
  document.getElementById('quiz-setup').classList.remove('hidden');
}

// --- INIT ---
fetch('positions.json')
  .then(r => r.json())
  .then(data => {
    Object.assign(allLevels, { ...data.levels, ...data.vocational_grades });
    levelNames.push(...Object.keys(allLevels));

    const levelSelect = document.getElementById('level-select');
    _quizLevelSelect = document.getElementById('quiz-level');
    populateSelect(levelSelect, true);
    populateSelect(_quizLevelSelect, true);

    levelSelect.addEventListener('change', () => renderBrowse(levelSelect));
    renderBrowse(levelSelect);

    // Mode toggle
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        quizMode = btn.dataset.mode;
      });
    });

    document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
    document.getElementById('retry-btn').addEventListener('click', retryQuiz);
    document.getElementById('new-quiz-btn').addEventListener('click', showQuizSetup);

    // --- TABS ---
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const id = tab.dataset.tab;
        document.getElementById('tab-browse').classList.toggle('hidden', id !== 'browse');
        document.getElementById('tab-quiz').classList.toggle('hidden', id !== 'quiz');
      });
    });
  })
  .catch(err => {
    console.error('Failed to load positions.json:', err);
    document.body.innerHTML = '<p style="padding:2rem;color:red">Error: could not load positions.json. Open this page via a local server (e.g. VS Code Live Server).</p>';
  });
