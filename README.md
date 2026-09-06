# Vy Dinh — Personal Portfolio & Engineering Lab

[![Website](https://img.shields.io/badge/website-vyndinh.github.io-FBBF24?style=flat-square&logo=google-chrome&logoColor=black)](https://vyndinh.github.io/)
[![Update Activity](https://github.com/vyndinh/vyndinh.github.io/actions/workflows/update-activity.yml/badge.svg)](https://github.com/vyndinh/vyndinh.github.io/actions/workflows/update-activity.yml)

Live deployment: [**https://vyndinh.github.io/**](https://vyndinh.github.io/)

---

## 🎨 Design & Features

- **Modern Neobrutalism Aesthetic**: High-contrast typography, bold 2.5px borders, hard offset drop shadows, playful accent colors, and tactile micro-interactions.
- **Dark & Light Mode**: Seamless theme toggling with smooth transitions and persistent state (applied before first paint — no flash).
- **Real Activity Heatmaps**: GitHub contribution calendar (26 weeks) and LeetCode submission calendar (52 weeks) rendered from live data, with tooltips and auto-generated month/day labels.
- **Interactive Mini-Terminal (`vnt`)**: A browser-based CLI emulator supporting interactive commands (`summary`, `skills`, `substack`, `telegram`, `leetcode`, `vnt quote [SYMBOL]`, `contact`, `help`).
- **Automated Daily Activity Sync**: A GitHub Actions cron workflow queries LeetCode and GitHub stats every 24 hours, generating `data/activity.json` and `data/activity.js` so metrics stay fresh automatically without manual updates.
- **Core Competencies Filter**: Interactive skill tags to dynamically filter career milestones and projects.
- **Social Share Card**: `og-image.png` (1200×630) for rich link previews on LinkedIn, X, and Telegram.
- **Zero Framework Bloat**: Built purely with vanilla HTML5, CSS3, and JavaScript for blazing-fast performance, zero client-side dependencies, and instant initial paint.

---

## 📂 Project Structure

```text
vyndinh.github.io/
├── index.html                 # Main portfolio markup & semantic structure
├── styles.css                 # Neobrutalism design system tokens & responsive rules
├── app.js                     # Heatmap renderers, terminal simulator, theme toggle, interactive UI logic
├── avatar.jpg                 # Profile avatar image (256×256 source, displayed at 68px)
├── og-image.png               # 1200×630 social share card (Open Graph / Twitter)
├── data/
│   ├── activity.json          # Daily snapshot of GitHub & LeetCode metrics
│   └── activity.js            # Global JavaScript bundle for static zero-CORS loading
├── scripts/
│   └── update-activity.js     # Node.js data fetcher querying LeetCode & GitHub GraphQL
├── .github/
│   └── workflows/
│       └── update-activity.yml # GitHub Actions cron running daily at 00:00 UTC
├── .gitignore                 # Standard repository hygiene & ignore rules
└── README.md                  # Project overview & documentation
```

---

## 🛠️ Local Development

Because this is a pure static web application, no build step or package installation is required:

```bash
# Clone repository
git clone https://github.com/vyndinh/vyndinh.github.io.git
cd vyndinh.github.io

# Option A: Open directly in your default browser
open index.html

# Option B: Run a lightweight local HTTP server
python3 -m http.server 8080
# then visit http://localhost:8080
```

### Running Activity Sync Locally

To test the automated stats fetcher locally:

```bash
node scripts/update-activity.js
```
