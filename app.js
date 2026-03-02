const DATA = {"organization":"Royal Academy of Dance","levels":{"Pre-Primary in Dance":[{"term":"Parallel Position","definition":"Feet placed hip-width apart and parallel."},{"term":"First Position","definition":"Heels together, toes turned out."},{"term":"Second Position","definition":"Feet apart and turned out."},{"term":"Demi-Plié","definition":"Small bend of the knees."},{"term":"Rise","definition":"Lifting onto the balls of the feet."},{"term":"Skip","definition":"Light step-hop movement."},{"term":"Gallop","definition":"Sideways traveling step with closing action."},{"term":"Spring","definition":"Small jump from two feet."},{"term":"March","definition":"Rhythmic walking step."},{"term":"Clap","definition":"Hands striking together rhythmically."}],"Primary in Dance":[{"term":"First Position of Arms","definition":"Rounded arms in front."},{"term":"Second Position of Arms","definition":"Arms open to the side."},{"term":"Third Position of Arms","definition":"One arm in first, one in second."},{"term":"Demi-Plié","definition":"Half bend of the knees."},{"term":"Battement Tendu","definition":"Foot brushing along the floor to a point."},{"term":"Chassé","definition":"One foot chasing the other."},{"term":"Galop","definition":"Traveling side step."},{"term":"Sauté","definition":"Jump from two feet landing on two feet."},{"term":"Polka Step","definition":"Light skipping character step."}],"Grade 1":[{"term":"Third Position","definition":"Heel to instep placement."},{"term":"Battement Glissé","definition":"Brush that leaves the floor slightly."},{"term":"Spring Point","definition":"Small jump finishing with one foot pointed."},{"term":"Balance","definition":"Sustained controlled hold."},{"term":"Turn","definition":"Rotation of the body."},{"term":"Mazurka Step","definition":"Character step with accent."},{"term":"Waltz Step","definition":"Traveling three-count step."}],"Grade 2":[{"term":"Fourth Position","definition":"Feet separated front and back."},{"term":"Grand Plié","definition":"Full bend of the knees."},{"term":"Rond de Jambe à Terre","definition":"Circular movement on the floor."},{"term":"Retiré","definition":"Foot drawn to the knee."},{"term":"Pas de Bourrée","definition":"Three-step linking movement."},{"term":"Assemblé","definition":"Jump joining feet in air."},{"term":"Character Walk","definition":"Stylised theatrical walk."}],"Grade 3":[{"term":"Fifth Position","definition":"Heel to toe placement fully crossed."},{"term":"Battement Fondu","definition":"Bend and stretch of both legs."},{"term":"Frappé","definition":"Striking action from ankle."},{"term":"Arabesque","definition":"Leg extended behind body."},{"term":"Glissade","definition":"Gliding connecting step."},{"term":"Sissonne","definition":"Jump from two feet to one."},{"term":"Entrechat Quatre","definition":"Beaten jump crossing twice."}],"Grade 4":[{"term":"Développé","definition":"Unfolding extension of leg."},{"term":"Attitude","definition":"Bent leg lifted position."},{"term":"Piqué","definition":"Pricked step onto straight leg."},{"term":"Pirouette Preparation","definition":"Preparation for turning movement."},{"term":"Grand Jeté","definition":"Large traveling leap."},{"term":"Cabriole","definition":"Beaten jump striking legs."},{"term":"Ballonné","definition":"Springing extension jump."}],"Grade 5":[{"term":"Pirouette en Dehors","definition":"Turn outward from supporting leg."},{"term":"Pirouette en Dedans","definition":"Turn inward toward supporting leg."},{"term":"Fouetté Preparation","definition":"Whipping preparation action."},{"term":"Grand Battement","definition":"Large controlled kick."},{"term":"Ballotté","definition":"Rocking jump alternating legs."},{"term":"Temps Levé","definition":"Jump from one foot landing same foot."},{"term":"Révérence","definition":"Bow or curtsy to conclude class."}]},"vocational_grades":{"Intermediate Foundation":[{"term":"Adage","definition":"Slow controlled center work."},{"term":"Petit Allegro","definition":"Small quick jumps."},{"term":"Chaînés","definition":"Linked half turns."},{"term":"Pas de Basque","definition":"Circular traveling step."}],"Intermediate":[{"term":"Grand Allegro","definition":"Large traveling jumps."},{"term":"Double Pirouette","definition":"Two rotations on one leg."},{"term":"Temps Lié","definition":"Linked flowing transfer of weight."}],"Advanced Foundation":[{"term":"Fouetté en Tournant","definition":"Whipping turning movement."},{"term":"Grand Fouetté","definition":"Large sweeping leg movement with turn."},{"term":"Tour en l'air","definition":"Turn in the air."}],"Advanced 1":[{"term":"Triple Pirouette","definition":"Three rotations on one leg."},{"term":"Brisé","definition":"Beaten gliding jump."},{"term":"Grand Sissonne","definition":"Large sissonne traveling jump."}],"Advanced 2":[{"term":"Manège","definition":"Circular traveling sequence."},{"term":"Grand Pirouette","definition":"Large turning movement."},{"term":"Multiple Fouettés","definition":"Series of whipping turns."}]}};

// Flatten all terms
const allLevels = { ...DATA.levels, ...DATA.vocational_grades };
const ALL_KEY = "All Levels";
const levelNames = [ALL_KEY, ...Object.keys(allLevels)];

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

const levelSelect = document.getElementById('level-select');
const quizLevelSelect = document.getElementById('quiz-level');
populateSelect(levelSelect, true);
populateSelect(quizLevelSelect, true);

// --- BROWSE ---
function renderBrowse() {
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
levelSelect.addEventListener('change', renderBrowse);
renderBrowse();

// --- QUIZ STATE ---
let quizMode = 'term'; // 'term' | 'def'
let quizQuestions = [];
let qIndex = 0;
let score = 0;
let answered = false;
let savedConfig = null;

// Mode toggle
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    quizMode = btn.dataset.mode;
  });
});

// Shuffle helper
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);
document.getElementById('next-btn').addEventListener('click', nextQuestion);
document.getElementById('retry-btn').addEventListener('click', retryQuiz);
document.getElementById('new-quiz-btn').addEventListener('click', () => {
  showQuizSetup();
});

function startQuiz() {
  const level = quizLevelSelect.value;
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
    document.getElementById('q-label').textContent = 'What is the definition of…';
    document.getElementById('q-prompt').textContent = q.item.term;
  } else {
    document.getElementById('q-label').textContent = 'Which term matches this definition…';
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
  fb.textContent = correct ? '✓ Correct!' : `✗ The answer was: "${q.mode === 'term' ? q.item.definition : q.item.term}"`;
  fb.className = 'feedback-msg ' + (correct ? 'correct' : 'wrong');

  const feedbackRow = document.getElementById('feedback-row');
  feedbackRow.classList.remove('hidden');
  const nextBtn = document.getElementById('next-btn');
  nextBtn.textContent = qIndex + 1 < quizQuestions.length ? 'Next →' : 'See Results';
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
  let heading = pct === 100 ? '🌟 Perfect score!' : pct >= 80 ? '🎉 Great work!' : pct >= 60 ? '👍 Good effort!' : '💪 Keep practising!';
  document.getElementById('result-heading').textContent = heading;
}

function retryQuiz() {
  // Rebuild same quiz with same settings
  if (!savedConfig) return;
  quizLevelSelect.value = savedConfig.level;
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
