/* ==========================================================================
   VY DINH - NEOBRUTALIST PERSONAL RESUME WEBSITE
   Interactive Application Logic & Components
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initGitContributions();
  initLeetCodeActivity();
  initSkillSpotlight();
  initTerminal();
  initEmailCopy();
  initSmoothScroll();
});

/* ==========================================================================
   1. THEME TOGGLE (Light / Dark Mode with Persistence)
   ========================================================================== */
function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  if (!themeToggle || !themeIcon) return;

  const savedTheme = localStorage.getItem('vy_resume_theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

  applyTheme(initialTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('vy_resume_theme', newTheme);
  });

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

/* ==========================================================================
   2. CALENDAR HEATMAP RENDERING (shared by GitHub & LeetCode grids)
   Data comes from data/activity.js (window.ACTIVITY_DATA), refreshed daily
   by GitHub Actions. Columns run Sunday → Saturday like GitHub's own graph.
   ========================================================================== */
function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateKey(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

/**
 * Builds week columns (oldest → newest) ending at the latest date present in
 * `days`, so the grid always reflects the freshest data instead of a frozen
 * hardcoded window.
 */
function buildCalendarColumns(days, totalWeeks) {
  const keys = Object.keys(days).sort();
  const latest = keys.length ? parseDateKey(keys[keys.length - 1]) : new Date();
  const endOfWeek = new Date(latest);
  endOfWeek.setDate(latest.getDate() + (6 - latest.getDay())); // Saturday
  const start = new Date(endOfWeek);
  start.setDate(endOfWeek.getDate() - (totalWeeks * 7 - 1)); // Sunday

  const columns = [];
  for (let w = 0; w < totalWeeks; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + w * 7 + d);
      if (cur > latest) {
        week.push(null); // future day in the current week
      } else {
        week.push({ date: cur, count: days[toDateKey(cur)] || 0 });
      }
    }
    columns.push(week);
  }
  return columns;
}

function positionTooltip(e) {
  const tooltip = document.getElementById('heatmapTooltip');
  if (!tooltip) return;
  const x = e.clientX + 14;
  const y = e.clientY - 38;
  tooltip.style.left = `${Math.min(x, window.innerWidth - 260)}px`;
  tooltip.style.top = `${Math.max(10, y)}px`;
}

function renderCalendarHeatmap(opts) {
  const {
    grid, tooltip, monthsEl, daysCol, columns,
    cellSize, gap, cellBaseClass, levelClass,
    tooltipTitle, tooltipColor, noun,
  } = opts;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const singular = noun.replace(/s$/, '');
  const fragment = document.createDocumentFragment();
  let prevMonth = null;
  const monthLabels = [];

  columns.forEach((week, w) => {
    const firstVisible = week.find(Boolean);
    if (firstVisible) {
      const m = firstVisible.date.getMonth();
      if (prevMonth === null || m !== prevMonth) {
        monthLabels.push({ column: w, label: monthNames[m] });
        prevMonth = m;
      }
    }

    week.forEach((day) => {
      const cell = document.createElement('div');
      if (!day) {
        cell.className = cellBaseClass;
        cell.style.visibility = 'hidden';
      } else {
        cell.className = `${cellBaseClass} ${levelClass(day.count)}`;
        const dateStr = `${monthNames[day.date.getMonth()]} ${day.date.getDate()}, ${day.date.getFullYear()}`;

        cell.addEventListener('mouseenter', (e) => {
          const text = day.count === 0
            ? `No ${noun} on ${dateStr}`
            : day.count === 1
              ? `1 ${singular} on ${dateStr}`
              : `${day.count} ${noun} on ${dateStr}`;

          tooltip.innerHTML = `
            <div style="font-size: 0.72rem; color: ${tooltipColor}; font-weight: 800;">${tooltipTitle}</div>
            <div style="font-weight: 700; color: #FFFFFF; margin-top: 2px;">${text}</div>
          `;
          tooltip.style.display = 'block';
          positionTooltip(e);
        });

        cell.addEventListener('mousemove', positionTooltip);
        cell.addEventListener('mouseleave', () => {
          tooltip.style.display = 'none';
        });
      }
      fragment.appendChild(cell);
    });
  });

  grid.appendChild(fragment);

  // Day-of-week labels pinned to exact grid rows (Sunday-first)
  if (daysCol) {
    daysCol.innerHTML = '';
    daysCol.style.display = 'grid';
    daysCol.style.gridTemplateRows = `repeat(7, ${cellSize}px)`;
    daysCol.style.gap = `${gap}px`;
    ['Mon', 'Wed', 'Fri'].forEach((label, i) => {
      const span = document.createElement('span');
      span.textContent = label;
      span.style.gridRowStart = i * 2 + 2; // rows 2, 4, 6
      span.style.lineHeight = `${cellSize}px`;
      daysCol.appendChild(span);
    });
  }

  // Month labels laid out on a grid matching the cell columns
  if (monthsEl) {
    monthsEl.innerHTML = '';
    monthsEl.style.display = 'grid';
    monthsEl.style.gridTemplateColumns = `repeat(${columns.length}, ${cellSize}px)`;
    monthsEl.style.gap = `${gap}px`;
    const container = grid.parentElement;
    const containerGap = container
      ? parseFloat(getComputedStyle(container).columnGap || getComputedStyle(container).gap) || 0
      : 0;
    monthsEl.style.paddingLeft = `${(daysCol ? daysCol.offsetWidth : 0) + containerGap}px`;
    monthLabels.forEach(({ column, label }) => {
      const span = document.createElement('span');
      span.textContent = label;
      span.style.gridColumnStart = column + 1;
      monthsEl.appendChild(span);
    });
  }
}

/* ==========================================================================
   3. GIT CONTRIBUTIONS ACTIVITY (26 Weeks, real GitHub data)
   ========================================================================== */
function initGitContributions() {
  const grid = document.getElementById('heatmapGrid');
  const tooltip = document.getElementById('heatmapTooltip');
  const totalEl = document.getElementById('contributionTotal');
  if (!grid || !tooltip) return;

  const gh = window.ACTIVITY_DATA?.github || {};
  const days = gh.contributionDays || {};

  if (Object.keys(days).length === 0) {
    if (totalEl) {
      totalEl.textContent = gh.totalContributions
        ? `${gh.totalContributions.toLocaleString()} contributions in the past year`
        : 'Contribution data syncs daily';
    }
    return;
  }

  const columns = buildCalendarColumns(days, 26);
  renderCalendarHeatmap({
    grid,
    tooltip,
    monthsEl: document.querySelector('.heatmap-card .heatmap-months'),
    daysCol: document.querySelector('.heatmap-card .heatmap-days-col'),
    columns,
    cellSize: 15,
    gap: 5,
    cellBaseClass: 'heatmap-cell',
    levelClass: (count) => {
      if (count >= 9) return 'git-4';
      if (count >= 6) return 'git-3';
      if (count >= 3) return 'git-2';
      if (count >= 1) return 'git-1';
      return 'git-0';
    },
    tooltipTitle: 'GIT COMMIT ACTIVITY',
    tooltipColor: '#4ADE80',
    noun: 'contributions',
  });

  if (totalEl) {
    const total = columns.flat().reduce((sum, day) => sum + (day ? day.count : 0), 0);
    totalEl.textContent = `${total.toLocaleString()} contributions in last 26 weeks`;
  }
}

/* ==========================================================================
   4. LEETCODE SUBMISSIONS ACTIVITY (52 Weeks / Past 1 Year from @vyndyn)
   ========================================================================== */
function initLeetCodeActivity() {
  const grid = document.getElementById('leetcodeHeatmapGrid');
  const tooltip = document.getElementById('heatmapTooltip');
  if (!grid || !tooltip) return;

  // Dynamic LeetCode data from auto-updater (data/activity.js)
  const lcData = window.ACTIVITY_DATA?.leetcode;
  const days = lcData?.submissionCalendar || {};

  // Dynamically update metrics when data is available (HTML holds a static snapshot as fallback)
  if (lcData) {
    const totalEl = document.getElementById('lcTotalSolved');
    const easyEl = document.getElementById('lcEasySolved');
    const medEl = document.getElementById('lcMediumSolved');
    const hardEl = document.getElementById('lcHardSolved');
    const streakEl = document.getElementById('lcStreak');
    const activeDaysEl = document.getElementById('lcActiveDays');
    const subCountEl = document.getElementById('lcSubmissionsCount');

    if (totalEl) totalEl.textContent = `🏆 ${lcData.totalSolved} Solved`;
    if (easyEl) easyEl.textContent = `${lcData.easySolved} Easy`;
    if (medEl) medEl.textContent = `${lcData.mediumSolved} Med`;
    if (hardEl) hardEl.textContent = `${lcData.hardSolved} Hard`;
    if (streakEl) streakEl.textContent = `🔥 ${lcData.streak}-Day Streak`;
    if (activeDaysEl) activeDaysEl.textContent = `📅 ${lcData.activeDays} Active Days`;
    if (subCountEl) subCountEl.textContent = `${lcData.submissionsPastYear} submissions in the past one year`;

    // Dynamic bar widths and labels
    const total = lcData.totalSolved || 1;
    const easyPct = ((lcData.easySolved / total) * 100).toFixed(1);
    const medPct = ((lcData.mediumSolved / total) * 100).toFixed(1);
    const hardPct = Math.max(0, (100 - parseFloat(easyPct) - parseFloat(medPct))).toFixed(1);

    const barEasy = document.getElementById('lcBarEasy');
    const barMed = document.getElementById('lcBarMedium');
    const barHard = document.getElementById('lcBarHard');
    const labelEasy = document.getElementById('lcLabelEasy');
    const labelMed = document.getElementById('lcLabelMedium');
    const labelHard = document.getElementById('lcLabelHard');

    if (barEasy) {
      barEasy.style.width = `${easyPct}%`;
      barEasy.title = `Easy: ${lcData.easySolved} (${easyPct}%)`;
    }
    if (barMed) {
      barMed.style.width = `${medPct}%`;
      barMed.title = `Medium: ${lcData.mediumSolved} (${medPct}%)`;
    }
    if (barHard) {
      barHard.style.width = `${hardPct}%`;
      barHard.title = `Hard: ${lcData.hardSolved} (${hardPct}%)`;
    }
    if (labelEasy) labelEasy.textContent = `Easy ${lcData.easySolved} (${Math.round(easyPct)}%)`;
    if (labelMed) labelMed.textContent = `Medium ${lcData.mediumSolved} (${Math.round(medPct)}%)`;
    if (labelHard) labelHard.textContent = `Hard ${lcData.hardSolved} (${Math.round(hardPct)}%)`;
  }

  if (Object.keys(days).length === 0) return;

  renderCalendarHeatmap({
    grid,
    tooltip,
    monthsEl: document.querySelector('.leetcode-card .heatmap-months'),
    daysCol: document.querySelector('.leetcode-card .heatmap-days-col'),
    columns: buildCalendarColumns(days, 52),
    cellSize: 11,
    gap: 3,
    cellBaseClass: 'lc-cell',
    levelClass: (count) => {
      if (count >= 11) return 'lc-4';
      if (count >= 6) return 'lc-3';
      if (count >= 3) return 'lc-2';
      if (count >= 1) return 'lc-1';
      return 'lc-0';
    },
    tooltipTitle: 'LEETCODE SUBMISSIONS',
    tooltipColor: '#F59E0B',
    noun: 'submissions',
  });
}

/* ==========================================================================
   4. SKILL TAG SPOTLIGHT & EXPERIENCE FILTER
   ========================================================================== */
function initSkillSpotlight() {
  const skillPills = document.querySelectorAll('.skill-pill');
  const targetCards = document.querySelectorAll('.exp-card, .project-card');

  let activeSkill = null;

  skillPills.forEach(pill => pill.setAttribute('aria-pressed', 'false'));

  skillPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const skillName = pill.dataset.skill.toLowerCase();

      if (activeSkill === skillName) {
        // Reset filter
        activeSkill = null;
        pill.classList.remove('active');
        pill.setAttribute('aria-pressed', 'false');
        clearHighlights();
        return;
      }

      // Activate new filter
      skillPills.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-pressed', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-pressed', 'true');
      activeSkill = skillName;

      let firstMatch = null;
      let matchCount = 0;

      targetCards.forEach(card => {
        const keywords = (card.dataset.keywords || '').toLowerCase();
        const text = card.textContent.toLowerCase();

        if (keywords.includes(skillName) || text.includes(skillName)) {
          card.classList.add('highlight-match');
          if (!firstMatch) firstMatch = card;
          matchCount++;
        } else {
          card.classList.remove('highlight-match');
        }
      });

      if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        showToast(`No career highlights for "${pill.textContent.trim()}"`);
      }
    });
  });

  function clearHighlights() {
    targetCards.forEach(b => b.classList.remove('highlight-match'));
  }
}

/* ==========================================================================
   5. MINI-CLI TERMINAL EMULATOR
   ========================================================================== */
function initTerminal() {
  const terminalBody = document.getElementById('terminalBody');
  const terminalInput = document.getElementById('terminalInput');
  const quickButtons = document.querySelectorAll('.term-btn');
  if (!terminalBody || !terminalInput) return;

  const commandHistory = [];
  let historyIndex = -1;

  quickButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.cmd;
      runCommand(cmd);
    });
  });

  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const cmd = terminalInput.value.trim();
      if (cmd) {
        commandHistory.push(cmd);
        historyIndex = commandHistory.length;
        runCommand(cmd);
        terminalInput.value = '';
      }
    } else if (e.key === 'ArrowUp') {
      if (historyIndex > 0) {
        historyIndex--;
        terminalInput.value = commandHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        terminalInput.value = commandHistory[historyIndex];
      } else {
        historyIndex = commandHistory.length;
        terminalInput.value = '';
      }
    }
  });

  function runCommand(rawCmd) {
    const cmd = rawCmd.trim();
    appendLine(`guest@vyndinh:~$ ${cmd}`, 'prompt');

    const parts = cmd.toLowerCase().split(' ');
    const mainCmd = parts[0];

    switch (mainCmd) {
      case 'help':
        appendLine('Available commands:', 'info');
        appendLine('  summary       - Overview & background');
        appendLine('  skills        - Core languages, databases, & distributed stack');
        appendLine('  substack      - Engineering writing on Substack');
        appendLine('  telegram      - Daily Engineering News Telegram Bot (@dy_engineering_bot)');
        appendLine('  leetcode      - LeetCode problem solving metrics');
        appendLine('  experience    - Overview of 8+ years across companies');
        appendLine('  education     - Academic background & embedded systems roots');
        appendLine('  vnt quote [T] - Stock quote demo (e.g. vnt quote FPT, VNM, VHM)');
        appendLine('  contact       - Email, phone, LinkedIn, GitHub, Substack, Telegram');
        appendLine('  clear         - Clear terminal display');
        break;

      case 'education':
      case 'academic':
        appendLine('Academic Background & Embedded Systems (2011 – 2016):', 'warning');
        appendLine('• B.S. in Physics and Engineering — University of Science, HCMC', 'success');
        appendLine('• Dept. of Electronics Physics Technology and Informatics', 'info');
        appendLine('• Hands-on focus: End-to-end embedded systems across both hardware (custom PCB design) and software (low-level C/C++ firmware).', 'info');
        break;

      case 'summary':
      case 'about':
        appendLine('Vy Dinh — Software Engineer (8+ years experience).', 'success');
        appendLine('• 5 years at Axon Enterprise (promoted to Software Engineer II).');
        appendLine('• High-throughput distributed systems, Kafka/Flink event streams, and GitOps.');
        appendLine('• Kubernetes HPA autoscaling, ~18K RPM peak throughput, Go & Java microservices.');
        break;

      case 'substack':
      case 'blog':
      case 'writing':
        appendLine('Engineering Writing & Substack:', 'warning');
        appendLine('• Substack: https://substack.com/@vyndyn', 'success');
        appendLine('Technical deep-dives, architectural teardowns, and lessons learned.', 'info');
        break;

      case 'telegram':
      case 'bot':
      case 'news':
        appendLine('🤖 Daily Engineering News Telegram Bot:', 'warning');
        appendLine('• Channel / Bot: https://t.me/dy_engineering_bot', 'info');
        appendLine('• Daily curated digest: architecture teardowns, distributed systems & backend engineering.', 'success');
        break;

      case 'skills':
        appendLine('Languages: Golang, Java, C++, SQL, Spatial SQL', 'warning');
        appendLine('Distributed & Data: Kafka, Flink, Elasticsearch, ActiveMQ, Blob Storage, Redis', 'info');
        appendLine('Cloud & DevOps: Kubernetes, Docker, Helm, Argo CD, Terraform, AWS, OpenStack', 'info');
        appendLine('AI & ML: RAG, Qdrant vector storage, nomic-embed-text, Qwen2.5-Coder', 'success');
        break;

      case 'leetcode':
        const lcTerm = window.ACTIVITY_DATA?.leetcode;
        const totalS = lcTerm?.totalSolved ?? 222;
        const easyS = lcTerm?.easySolved ?? 87;
        const medS = lcTerm?.mediumSolved ?? 114;
        const hardS = lcTerm?.hardSolved ?? 21;
        const streakS = lcTerm?.streak ?? 54;
        const subsS = lcTerm?.submissionsPastYear ?? 394;
        const activeS = lcTerm?.activeDays ?? 122;

        appendLine('LeetCode Algorithmic Problem Solving:', 'warning');
        appendLine(`• Total Solved: ${totalS} (Easy: ${easyS} | Medium: ${medS} | Hard: ${hardS})`, 'success');
        appendLine(`• Past 1-Year Submissions: ${subsS} across ${activeS} active days`, 'info');
        appendLine(`• Max Streak: ${streakS} days 🔥`, 'warning');
        break;

      case 'experience':
        appendLine('Career Journey:', 'warning');
        appendLine('• Axon Enterprise (2021 – 2026, 5 yrs): Video Transcoding Orchestration, Go, Kafka, Flink', 'success');
        appendLine('• Pascalia Asia (2020 – 2021): Backend services & real-time ingestion, Java, Spring Boot, AWS', 'info');
        appendLine('• DEK Technologies (2017 – 2020): Telecom Routing, C++, OpenStack, Jenkins', 'info');
        break;

      case 'quote':
      case 'vnt': {
        const arg = parts[1] === 'quote' ? parts[2] : parts[1];
        renderQuote((arg || 'FPT').toUpperCase());
        break;
      }

      case 'contact':
        appendLine('Email:    dnthuyvy@gmail.com', 'success');
        appendLine('Substack: https://substack.com/@vyndyn', 'warning');
        appendLine('Telegram: https://t.me/dy_engineering_bot', 'info');
        appendLine('Phone:    (+84) 90-2464-075', 'info');
        appendLine('LinkedIn: https://linkedin.com/in/vydinhtn', 'info');
        appendLine('GitHub:   https://github.com/vyndinh', 'info');
        appendLine('Location: Ho Chi Minh City, Vietnam', 'info');
        break;

      case 'clear':
        terminalBody.innerHTML = '';
        return;

      default:
        appendLine(`Command not found: "${cmd}". Type 'help' for available commands.`, 'warning');
        break;
    }

    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  function renderQuote(ticker) {
    const quotes = {
      FPT: { price: '138,500', change: '+2,500 (+1.84%)', vol: '4,280,100', rsi: '64.2', signal: 'STRONG BUY' },
      VNM: { price: '68,200', change: '+400 (+0.59%)', vol: '2,150,000', rsi: '52.1', signal: 'ACCUMULATE' },
      VHM: { price: '42,100', change: '-300 (-0.71%)', vol: '6,410,200', rsi: '46.8', signal: 'NEUTRAL' }
    };

    const q = quotes[ticker] || { price: '95,000', change: '+1,200 (+1.28%)', vol: '1,890,000', rsi: '58.5', signal: 'BUY' };
    appendLine(`─── [VN STOCK CLI • HOSE:${ticker}] ─────────────────────────`, 'info');
    appendLine(`Price: ${q.price} VND | Change: ${q.change} | Vol: ${q.vol}`, 'success');
    appendLine(`TA Metrics: RSI(14) = ${q.rsi} | MACD = Bullish Cross | Signal: ${q.signal}`, 'warning');
    appendLine(`Data engine: Go + Bubble Tea TUI + SQLite persistence (demo data)`, 'info');
  }

  function appendLine(text, className = '') {
    const line = document.createElement('div');
    line.className = `term-line ${className}`;
    line.textContent = text;
    terminalBody.appendChild(line);
  }
}

/* ==========================================================================
   6. EMAIL COPY & TOAST NOTIFICATION
   ========================================================================== */
function initEmailCopy() {
  const copyBtn = document.getElementById('copyEmailBtn');
  if (!copyBtn) return;

  copyBtn.addEventListener('click', () => {
    const email = 'dnthuyvy@gmail.com';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(() => {
        showToast('✓ dnthuyvy@gmail.com copied to clipboard!');
      }).catch(() => {
        window.location.href = `mailto:${email}`;
      });
    } else {
      window.location.href = `mailto:${email}`;
    }
  });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

/* ==========================================================================
   7. SMOOTH SCROLL FOR ANCHORS
   ========================================================================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}
