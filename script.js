// =============================================
// DEVPATH – script.js  (shared across all pages)
// =============================================

// ── Sidebar Toggle (Mobile) ──
const sidebar   = document.getElementById('sidebar');
const hamburger = document.getElementById('hamburger');
const sideClose = document.getElementById('sidebar-close');
const overlay   = document.getElementById('overlay');

function openSidebar()  { sidebar.classList.add('open'); overlay.classList.add('show'); }
function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('show'); }
if (hamburger) hamburger.addEventListener('click', openSidebar);
if (sideClose) sideClose.addEventListener('click', closeSidebar);
if (overlay)   overlay.addEventListener('click', closeSidebar);

// ── Helpers ──
function dpGet(key, fallback = '') {
  return localStorage.getItem('devpath_' + key) ?? fallback;
}
function dpSet(key, val) {
  localStorage.setItem('devpath_' + key, val);
}
function dpGetInt(key, fallback = 0) {
  return parseInt(dpGet(key, String(fallback)), 10);
}

// ── Daily Streak Engine ──
function computeStreak() {
  const today = new Date().toDateString();
  const lastVisit = dpGet('lastVisit');
  let streak = dpGetInt('streak', 0);

  if (lastVisit === today) {
    return streak; // already computed today
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (lastVisit === yesterday.toDateString()) {
    streak += 1; // consecutive day
  } else if (lastVisit === '') {
    streak = 1;  // very first visit ever
  } else {
    streak = 1;  // broke streak → reset to 1 (today counts)
  }

  dpSet('streak', streak);
  dpSet('lastVisit', today);
  return streak;
}

// ── Level Calculator ──
function getLevel(pts) {
  if (pts >= 500) return { lv: 'Level 6', name: 'Senior Dev', next: null, nextPts: 0 };
  if (pts >= 350) return { lv: 'Level 5', name: 'Mid Dev',    next: 500,  nextPts: 500 - pts };
  if (pts >= 200) return { lv: 'Level 4', name: 'Junior Dev', next: 350,  nextPts: 350 - pts };
  if (pts >= 100) return { lv: 'Level 3', name: 'Apprentice', next: 200,  nextPts: 200 - pts };
  if (pts >= 50)  return { lv: 'Level 2', name: 'Starter',    next: 100,  nextPts: 100 - pts };
  return           { lv: 'Level 1', name: 'Newbie',     next: 50,   nextPts: 50  - pts };
}

// ── Update All Shared UI Elements ──
function updateSharedStats() {
  const streak = computeStreak();
  const pts    = dpGetInt('points', 0);
  const { lv, name } = getLevel(pts);

  // Sidebar stats
  const ids = {
    'sidebar-streak':    streak,
    'sidebar-points':    pts,
    'sidebar-level':     lv,
    'streak-count':      streak,  // index.html legacy
    'streak-top':        streak,  // index.html legacy
    'streak-display':    streak,  // index.html legacy
    'streak-hero-num':   streak,  // daily.html
  };
  Object.entries(ids).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });

  const sll = document.getElementById('sidebar-level-lbl');
  if (sll) sll.textContent = name;

  // Topbar streak badge
  const tb = document.getElementById('topbar-streak-badge');
  if (tb) tb.textContent = `🔥 ${streak} Hari`;
  // Legacy topbar
  const tbLeg = document.querySelector('.fire-badge');
  if (tbLeg) tbLeg.innerHTML = `🔥 <span id="streak-top-sync">${streak}</span> Hari`;

  return { streak, pts, lv, name };
}

// ── Render Dashboard Streak Week Dots ──
function renderStreakDots(containerId = 'streak-dots') {
  const el = document.getElementById(containerId);
  if (!el) return;

  const streak = dpGetInt('streak', 0);
  const today  = new Date();
  const dayAbbr = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

  el.innerHTML = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const isToday  = i === 0;
    const isDone   = !isToday && i < streak;
    const dailyDoneToday = dpGet('daily_done') === today.toDateString();
    const isTodayDone = isToday && dailyDoneToday;
    const isTodayPending = isToday && !dailyDoneToday;

    const span = document.createElement('span');
    span.className = 'sdot';
    if (isDone || isTodayDone) span.classList.add('done');
    if (isTodayPending) span.classList.add('today');
    span.textContent = dayAbbr[d.getDay()][0]; // First letter
    span.title = `${dayAbbr[d.getDay()]} ${isDone || isTodayDone ? '✅' : isTodayPending ? '⭕ Hari ini!' : ''}`;
    el.appendChild(span);
  }
}

// ── Dashboard: update progress from localStorage ──
function updateDashboardProgress() {
  const progMap = {
    'prog-html': dpGetInt('prog_html', 80),
    'prog-css':  dpGetInt('prog_css', 55),
    'prog-js':   dpGetInt('prog_js', 20),
  };
  Object.entries(progMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = 0;
    let cur = 0;
    const interval = setInterval(() => {
      cur = Math.min(cur + 2, val);
      el.value = cur;
      const pctEl = el.closest('.pcard-item')?.querySelector('.pct');
      if (pctEl) pctEl.textContent = cur + '%';
      if (cur >= val) clearInterval(interval);
    }, 16);
  });
}

// ── Dashboard: update streak card & stats ──
function updateDashboardStats() {
  const streak = dpGetInt('streak', 0);
  const pts    = dpGetInt('points', 0);
  const { lv, name } = getLevel(pts);

  const streakDisp = document.getElementById('streak-display');
  if (streakDisp) streakDisp.textContent = streak;

  const ptsDisp = document.querySelector('#stat-poin .stat-val');
  if (ptsDisp) ptsDisp.textContent = pts;

  const lvDisp = document.querySelector('#stat-level .stat-val');
  if (lvDisp) lvDisp.textContent = lv;
  const lvLbl = document.querySelector('#stat-level .stat-lbl');
  if (lvLbl) lvLbl.textContent = name;

  // Challenge card day number
  const chalHeader = document.querySelector('#card-challenge h3');
  const today = new Date();
  const dayOfYear = Math.ceil((today - new Date(today.getFullYear(), 0, 1)) / 86400000);
  if (chalHeader) chalHeader.textContent = `Daily Challenge #${dayOfYear}`;

  const chalBadge = document.querySelector('#card-challenge .badge-orange');
  if (chalBadge) chalBadge.textContent = `⚡ Hari ini`;

  // Quiz completed badge in quick-quiz card
  const completedQuizzes = JSON.parse(localStorage.getItem('devpath_completed_quizzes') || '[]');
  const qpItems = document.querySelectorAll('.qp-item');
  const cats = ['html', 'css', 'javascript'];
  const labels = ['📝 HTML Basics — 5 soal', '🎨 CSS Styling — 5 soal', '⚡ JavaScript — 5 soal'];
  qpItems.forEach((el, i) => {
    if (completedQuizzes.includes(cats[i])) {
      el.textContent = labels[i] + ' ✅';
      el.classList.remove('qp-locked');
      el.style.color = 'var(--green)';
    } else if (i > 0 && !completedQuizzes.includes(cats[i-1])) {
      el.innerHTML = '🔒 ' + (cats[i] === 'javascript' ? 'JavaScript' : cats[i].toUpperCase()) + ' — Terkunci';
      el.classList.add('qp-locked');
    }
  });
}

// ── Scroll Reveal Animation ──
function initScrollReveal() {
  const revealEls = document.querySelectorAll(
    '.dcard, .quiz-card, .archive-card, .road-island, .daily-hero-card, .topic-pill, .quiz-block, .qcat-card, .streak-hero, .ai-quiz-card, .dq-question-card'
  );

  const styleEl = document.createElement('style');
  styleEl.textContent = '.revealed { opacity: 1 !important; transform: translateY(0) !important; }';
  document.head.appendChild(styleEl);

  revealEls.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.5s ease ${i * 0.06}s, transform 0.5s ease ${i * 0.06}s`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  revealEls.forEach(el => observer.observe(el));
}

// ── Daily Challenge "Mark Done" (legacy index.html) ──
function markDone() {
  const btn = document.getElementById('btn-selesai');
  const msg = document.getElementById('done-msg');
  if (!btn || !msg) return;

  btn.disabled = true;
  btn.textContent = '✅ Sudah Selesai!';
  btn.style.opacity = '0.6';
  msg.style.display = 'block';

  const pts = dpGetInt('points', 0);
  dpSet('points', pts + 30);
  dpSet('daily_done', new Date().toDateString());
  updateSharedStats();
}

// ── Quiz Checker (legacy quiz.html – kept for fallback) ──
function checkQuiz() {
  const questions = [
    { name: 'q1', correct: 'b' },
    { name: 'q2', correct: 'c' },
    { name: 'q3', correct: 'b' },
  ];
  let answered = 0, correct = 0;
  questions.forEach((q, i) => {
    const selected = document.querySelector(`input[name="${q.name}"]:checked`);
    const fb = document.getElementById(`fb-${i + 1}`);
    if (!selected) return;
    answered++;
    if (selected.value === q.correct) {
      correct++;
      if (fb) { fb.textContent = '✅ Benar!'; fb.style.color = '#57CC99'; }
    } else {
      if (fb) { fb.textContent = '❌ Salah. Jawaban yang benar sudah ditandai hijau.'; fb.style.color = '#E63946'; }
    }
  });
  const result = document.getElementById('result-html');
  if (!result) return;
  if (answered < questions.length) {
    result.style.display = 'block';
    result.style.background = 'rgba(244,162,97,0.15)'; result.style.borderColor = '#F4A261'; result.style.color = '#F4A261';
    result.textContent = `⚠️ Kamu belum menjawab semua soal (${answered}/${questions.length}).`;
    return;
  }
  result.style.display = 'block';
  if (correct === questions.length) {
    result.style.background = 'rgba(87,204,153,0.18)'; result.style.borderColor = '#57CC99'; result.style.color = '#57CC99';
    result.textContent = `🎉 Sempurna! Semua ${correct}/${questions.length} jawaban benar. +20 Poin ditambahkan!`;
    dpSet('points', dpGetInt('points', 0) + 20);
  } else {
    result.style.background = 'rgba(230,57,70,0.12)'; result.style.borderColor = '#E63946'; result.style.color = '#E63946';
    result.textContent = `📊 Skor kamu: ${correct}/${questions.length}. Coba lagi untuk jawaban yang salah!`;
  }
}

// ── INIT on DOMContentLoaded ──
document.addEventListener('DOMContentLoaded', () => {
  updateSharedStats();
  renderStreakDots('streak-dots');        // dashboard
  updateDashboardStats();                 // dashboard specific
  initScrollReveal();

  // Progress bars animate on dashboard
  const hasProg = document.getElementById('prog-html');
  if (hasProg) updateDashboardProgress();
});
