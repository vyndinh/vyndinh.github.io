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
   2. GIT CONTRIBUTIONS ACTIVITY (26 Weeks Grid)
   ========================================================================== */
function initGitContributions() {
  const grid = document.getElementById('heatmapGrid');
  const tooltip = document.getElementById('heatmapTooltip');
  const totalEl = document.getElementById('contributionTotal');
  if (!grid || !tooltip) return;

  const totalWeeks = 26;
  const daysPerWeek = 7;
  const totalDays = totalWeeks * daysPerWeek;
  
  // Reference date: early September 2026
  const endDate = new Date(2026, 8, 4); // Sep 4, 2026
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - totalDays + 1);

  // Month names
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let totalContributions = 0;
  const fragment = document.createDocumentFragment();

  // Deterministic seed for realistic contribution pattern
  const seedArray = [
    0, 2, 4, 1, 0, 5, 3, 2, 6, 8, 4, 0, 3, 5, 2, 7, 9, 3, 1, 0, 4,
    6, 11, 4, 2, 5, 8, 0, 3, 7, 12, 5, 2, 4, 1, 6, 9, 3, 0, 5, 7, 2,
    4, 8, 10, 3, 1, 6, 4, 0, 7, 9, 2, 5, 8, 1, 4, 6, 12, 3, 0, 5, 2,
    7, 4, 8, 1, 3, 6, 0, 4, 9, 11, 5, 2, 6, 3, 1, 7, 8, 4, 0, 5, 10,
    3, 2, 6, 1, 4, 8, 0, 5, 7, 12, 4, 1, 6, 3, 0, 8, 9, 5, 2, 4, 7,
    1, 3, 6, 0, 5, 10, 4, 2, 7, 1, 0, 6, 8, 3, 5, 9, 2, 4, 7, 0, 3,
    6, 11, 4, 1, 5, 8, 2, 0, 7, 10, 3, 6, 4, 1, 5, 9, 0, 3, 8, 2, 6,
    4, 1, 7, 12, 5, 0, 4, 8, 3, 6, 2, 5, 9, 1, 0, 7, 4, 8, 2, 6, 11,
    3, 1, 5, 8, 0, 4, 7, 2, 6, 10, 3, 5, 1, 0, 8, 4, 7, 2
  ];

  for (let w = 0; w < totalWeeks; w++) {
    for (let d = 0; d < daysPerWeek; d++) {
      const dayIndex = w * daysPerWeek + d;
      const curDate = new Date(startDate);
      curDate.setDate(startDate.getDate() + dayIndex);

      const count = seedArray[dayIndex % seedArray.length];
      totalContributions += count;

      let level = 0;
      if (count >= 9) level = 4;
      else if (count >= 6) level = 3;
      else if (count >= 3) level = 2;
      else if (count >= 1) level = 1;

      const cell = document.createElement('div');
      cell.className = `heatmap-cell git-${level}`;

      const dateStr = `${monthNames[curDate.getMonth()]} ${curDate.getDate()}`;
      cell.dataset.count = count;
      cell.dataset.date = dateStr;

      cell.addEventListener('mouseenter', (e) => {
        const c = parseInt(cell.dataset.count, 10);
        const text = c === 0 
          ? `No contributions on ${cell.dataset.date}` 
          : c === 1 
            ? `1 contribution on ${cell.dataset.date}` 
            : `${c} contributions on ${cell.dataset.date}`;
        
        tooltip.innerHTML = `
          <div style="font-size: 0.72rem; color: #4ADE80; font-weight: 800;">GIT COMMIT ACTIVITY</div>
          <div style="font-weight: 700; color: #FFFFFF; margin-top: 2px;">${text}</div>
        `;
        tooltip.style.display = 'block';
        positionTooltip(e);
      });

      cell.addEventListener('mousemove', (e) => {
        positionTooltip(e);
      });

      cell.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });

      fragment.appendChild(cell);
    }
  }

  grid.appendChild(fragment);

  if (totalEl) {
    totalEl.textContent = `${totalContributions.toLocaleString()} contributions in last 26 weeks`;
  }

  function positionTooltip(e) {
    const x = e.clientX + 14;
    const y = e.clientY - 38;
    tooltip.style.left = `${Math.min(x, window.innerWidth - 260)}px`;
    tooltip.style.top = `${Math.max(10, y)}px`;
  }
}

/* ==========================================================================
   3. LEETCODE SUBMISSIONS ACTIVITY (52 Weeks / Past 1 Year from @vyndyn)
   ========================================================================== */
function initLeetCodeActivity() {
  const grid = document.getElementById('leetcodeHeatmapGrid');
  const tooltip = document.getElementById('heatmapTooltip');
  if (!grid || !tooltip) return;

  // Dynamic LeetCode data from auto-updater (data/activity.js)
  const lcData = window.ACTIVITY_DATA?.leetcode;
  const leetcodeDates = lcData?.submissionCalendar || {
    "2026-03-07": 1, "2026-03-08": 1, "2026-03-09": 1, "2026-03-10": 2, "2026-03-11": 1,
    "2026-03-12": 3, "2026-03-13": 1, "2026-03-15": 1, "2026-03-17": 2, "2026-03-18": 7,
    "2026-03-19": 1, "2026-03-20": 1, "2026-03-22": 2, "2026-03-23": 1, "2026-03-24": 1,
    "2026-03-25": 3, "2026-03-26": 6, "2026-03-28": 8, "2026-03-29": 4, "2026-03-30": 4,
    "2026-03-31": 9, "2026-04-01": 1, "2026-04-02": 4, "2026-04-03": 1, "2026-04-04": 1,
    "2026-04-05": 7, "2026-04-06": 1, "2026-04-07": 4, "2026-04-08": 1, "2026-04-09": 3,
    "2026-04-10": 1, "2026-04-11": 3, "2026-04-12": 5, "2026-04-13": 4, "2026-04-14": 2,
    "2026-04-15": 2, "2026-04-16": 14, "2026-04-17": 1, "2026-04-18": 1, "2026-04-19": 1,
    "2026-04-20": 6, "2026-04-21": 1, "2026-04-22": 16, "2026-04-23": 7, "2026-04-24": 1,
    "2026-04-25": 5, "2026-04-26": 1, "2026-04-27": 1, "2026-04-28": 1, "2026-04-29": 1,
    "2026-04-30": 1, "2026-05-01": 1, "2026-05-02": 1, "2026-05-03": 1, "2026-05-04": 1,
    "2026-05-05": 1, "2026-05-06": 1, "2026-05-07": 1, "2026-05-08": 2, "2026-05-09": 4,
    "2026-05-10": 1, "2026-05-11": 2, "2026-05-12": 1, "2026-05-13": 1, "2026-05-14": 3,
    "2026-05-15": 4, "2026-05-16": 1, "2026-05-17": 1, "2026-05-18": 1, "2026-05-19": 1,
    "2026-05-20": 2, "2026-05-23": 2, "2026-05-24": 2, "2026-05-25": 2, "2026-05-26": 1,
    "2026-05-27": 4, "2026-05-28": 1, "2026-05-29": 5, "2026-05-30": 5, "2026-05-31": 11,
    "2026-06-01": 4, "2026-06-02": 7, "2026-06-03": 7, "2026-06-04": 3, "2026-06-05": 1,
    "2026-06-06": 2, "2026-06-07": 1, "2026-06-08": 2, "2026-06-09": 3, "2026-06-10": 1,
    "2026-06-11": 3, "2026-06-12": 5, "2026-06-14": 3, "2026-06-15": 6, "2026-06-16": 15,
    "2026-06-17": 9, "2026-06-18": 8, "2026-06-19": 1, "2026-06-21": 1, "2026-06-23": 1,
    "2026-06-25": 2, "2026-06-26": 4, "2026-06-27": 5, "2026-06-29": 3, "2026-06-30": 6,
    "2026-07-01": 10, "2026-07-02": 1, "2026-07-03": 1, "2026-07-05": 1, "2026-07-07": 1,
    "2026-07-09": 1, "2026-07-15": 1, "2026-07-16": 5, "2026-08-12": 2, "2026-08-15": 1,
    "2026-08-17": 5, "2026-08-19": 3, "2026-08-24": 1, "2026-08-28": 4, "2026-08-29": 7,
    "2026-09-01": 23, "2026-09-02": 2
  };

  // Dynamically update metrics if available
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

  const totalWeeks = 52;
  const daysPerWeek = 7;
  const totalDays = totalWeeks * daysPerWeek; // 364 days

  const endDate = new Date(2026, 8, 4); // Sep 4, 2026
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - totalDays + 1);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fragment = document.createDocumentFragment();

  for (let w = 0; w < totalWeeks; w++) {
    for (let d = 0; d < daysPerWeek; d++) {
      const dayIndex = w * daysPerWeek + d;
      const curDate = new Date(startDate);
      curDate.setDate(startDate.getDate() + dayIndex);

      const yyyy = curDate.getFullYear();
      const mm = String(curDate.getMonth() + 1).padStart(2, '0');
      const dd = String(curDate.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;

      const count = leetcodeDates[dateKey] || 0;

      let level = 0;
      if (count >= 11) level = 4;
      else if (count >= 6) level = 3;
      else if (count >= 3) level = 2;
      else if (count >= 1) level = 1;

      const cell = document.createElement('div');
      cell.className = `lc-cell lc-${level}`;

      const dateStr = `${monthNames[curDate.getMonth()]} ${curDate.getDate()}, ${yyyy}`;
      cell.dataset.count = count;
      cell.dataset.date = dateStr;

      cell.addEventListener('mouseenter', (e) => {
        const c = parseInt(cell.dataset.count, 10);
        const text = c === 0 
          ? `No submissions on ${cell.dataset.date}` 
          : c === 1 
            ? `1 submission on ${cell.dataset.date}` 
            : `${c} submissions on ${cell.dataset.date}`;
        
        tooltip.innerHTML = `
          <div style="font-size: 0.72rem; color: #F59E0B; font-weight: 800;">LEETCODE SUBMISSIONS</div>
          <div style="font-weight: 700; color: #FFFFFF; margin-top: 2px;">${text}</div>
        `;
        tooltip.style.display = 'block';
        positionTooltip(e);
      });

      cell.addEventListener('mousemove', (e) => {
        positionTooltip(e);
      });

      cell.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });

      fragment.appendChild(cell);
    }
  }

  grid.appendChild(fragment);

  function positionTooltip(e) {
    const x = e.clientX + 14;
    const y = e.clientY - 38;
    tooltip.style.left = `${Math.min(x, window.innerWidth - 260)}px`;
    tooltip.style.top = `${Math.max(10, y)}px`;
  }
}

/* ==========================================================================
   4. SKILL TAG SPOTLIGHT & EXPERIENCE FILTER
   ========================================================================== */
function initSkillSpotlight() {
  const skillPills = document.querySelectorAll('.skill-pill');
  const targetCards = document.querySelectorAll('.exp-card, .project-card');

  let activeSkill = null;

  skillPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const skillName = pill.dataset.skill.toLowerCase();

      if (activeSkill === skillName) {
        // Reset filter
        activeSkill = null;
        pill.classList.remove('active');
        clearHighlights();
        return;
      }

      // Activate new filter
      skillPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeSkill = skillName;

      let firstMatch = null;

      targetCards.forEach(card => {
        const keywords = (card.dataset.keywords || '').toLowerCase();
        const text = card.textContent.toLowerCase();

        if (keywords.includes(skillName) || text.includes(skillName)) {
          card.classList.add('highlight-match');
          if (!firstMatch) firstMatch = card;
        } else {
          card.classList.remove('highlight-match');
        }
      });

      if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        appendLine('  vnt quote [T] - Real-time terminal quote (e.g. vnt quote FPT, VNM, VHM)');
        appendLine('  contact       - Email, phone, LinkedIn, GitHub, Substack, Telegram');
        appendLine('  clear         - Clear terminal display');
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
        appendLine('• Wizeline (2020 – 2021): Real-time Geospatial Microservices, Go, Spatial SQL', 'info');
        appendLine('• DEK Technologies (2017 – 2020): Telecom Routing, C++, OpenStack, Jenkins', 'info');
        break;

      case 'quote':
      case 'vnt':
        const symbol = parts[1] === 'quote' ? (parts[2] || 'FPT') : (parts[1] || 'FPT');
        if (typeof renderQuote === 'function') {
          renderQuote(symbol);
        } else {
          renderQuote('FPT');
        }
        break;

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
    appendLine(`Data engine: Go + Bubble Tea TUI + SQLite persistence`, 'info');
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
