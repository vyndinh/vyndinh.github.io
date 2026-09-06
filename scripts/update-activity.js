/**
 * scripts/update-activity.js
 * Automated daily fetcher for LeetCode (@vyndyn) and GitHub (@vyndinh) activity metrics.
 * Runs in GitHub Actions every 24 hours to keep the portfolio up to date.
 */

const fs = require('fs');
const path = require('path');

const LEETCODE_USERNAME = 'vyndyn';
const GITHUB_USERNAME = 'vyndinh';

const DATA_DIR = path.join(__dirname, '..', 'data');
const JSON_PATH = path.join(DATA_DIR, 'activity.json');
const JS_PATH = path.join(DATA_DIR, 'activity.js');

async function main() {
  console.log('🚀 Starting daily activity metrics update...');

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Read existing data as fallback baseline
  let baseline = {
    updatedAt: new Date().toISOString(),
    leetcode: {
      username: LEETCODE_USERNAME,
      totalSolved: 222,
      easySolved: 87,
      mediumSolved: 114,
      hardSolved: 21,
      streak: 54,
      activeDays: 122,
      submissionsPastYear: 394,
      submissionCalendar: {}
    },
    github: {
      username: GITHUB_USERNAME,
      totalContributions: 0,
      contributionDays: {}
    }
  };

  if (fs.existsSync(JSON_PATH)) {
    try {
      const raw = fs.readFileSync(JSON_PATH, 'utf-8');
      baseline = JSON.parse(raw);
    } catch (err) {
      console.warn('⚠️ Could not parse existing activity.json, using defaults.');
    }
  }

  // 1. Fetch LeetCode Data
  const leetcodeData = await fetchLeetCodeStats(LEETCODE_USERNAME, baseline.leetcode);

  // 2. Fetch GitHub Data
  const githubData = await fetchGitHubStats(GITHUB_USERNAME, baseline.github);

  // 3. Assemble Output
  const result = {
    updatedAt: new Date().toISOString(),
    leetcode: leetcodeData,
    github: githubData
  };

  // Write activity.json
  fs.writeFileSync(JSON_PATH, JSON.stringify(result, null, 2) + '\n', 'utf-8');
  console.log(`✅ Updated ${JSON_PATH}`);

  // Write activity.js (for direct client script include without CORS limitations)
  const jsContent = `// Auto-generated activity data for GitHub and LeetCode\n// Updated daily via GitHub Actions (.github/workflows/update-activity.yml)\nwindow.ACTIVITY_DATA = ${JSON.stringify(result, null, 2)};\n`;
  fs.writeFileSync(JS_PATH, jsContent, 'utf-8');
  console.log(`✅ Updated ${JS_PATH}`);

  console.log('🎉 Activity update completed successfully!');
}

/**
 * Queries LeetCode public GraphQL endpoint for user submission calendar and solved counts
 */
async function fetchLeetCodeStats(username, fallback) {
  console.log(`📡 Fetching LeetCode stats for @${username}...`);
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        userCalendar {
          streak
          totalActiveDays
          submissionCalendar
        }
      }
    }
  `;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `https://leetcode.com/u/${username}/`
      },
      body: JSON.stringify({
        query,
        variables: { username }
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`LeetCode API responded with HTTP ${response.status}`);
    }

    const data = await response.json();
    const matchedUser = data?.data?.matchedUser;

    if (!matchedUser) {
      throw new Error(`LeetCode user @${username} not found in response`);
    }

    const acSubmissions = matchedUser.submitStatsGlobal?.acSubmissionNum || [];
    let totalSolved = fallback.totalSolved;
    let easySolved = fallback.easySolved;
    let mediumSolved = fallback.mediumSolved;
    let hardSolved = fallback.hardSolved;

    acSubmissions.forEach(item => {
      if (item.difficulty === 'All') totalSolved = item.count;
      if (item.difficulty === 'Easy') easySolved = item.count;
      if (item.difficulty === 'Medium') mediumSolved = item.count;
      if (item.difficulty === 'Hard') hardSolved = item.count;
    });

    const streak = matchedUser.userCalendar?.streak ?? fallback.streak;
    const activeDays = matchedUser.userCalendar?.totalActiveDays ?? fallback.activeDays;
    
    // Parse raw unix timestamp map to date map
    const rawCalendarStr = matchedUser.userCalendar?.submissionCalendar || '{}';
    const rawCalendar = JSON.parse(rawCalendarStr);
    
    const now = Math.floor(Date.now() / 1000);
    const oneYearAgo = now - (365 * 24 * 60 * 60);

    const dateMap = {};
    let submissionsPastYear = 0;

    for (const [timestampStr, count] of Object.entries(rawCalendar)) {
      const ts = parseInt(timestampStr, 10);
      const c = parseInt(count, 10) || 0;

      const dateObj = new Date(ts * 1000);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;

      dateMap[key] = (dateMap[key] || 0) + c;

      if (ts >= oneYearAgo) {
        submissionsPastYear += c;
      }
    }

    console.log(`✨ LeetCode data parsed: ${totalSolved} solved (${easySolved}E / ${mediumSolved}M / ${hardSolved}H), ${submissionsPastYear} submissions in past year, streak ${streak}`);

    return {
      username,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      streak,
      activeDays,
      submissionsPastYear: submissionsPastYear > 0 ? submissionsPastYear : fallback.submissionsPastYear,
      submissionCalendar: Object.keys(dateMap).length > 0 ? dateMap : fallback.submissionCalendar
    };
  } catch (err) {
    console.warn(`⚠️ Failed to fetch LeetCode stats: ${err.message}. Retaining baseline.`);
    return fallback;
  }
}

/**
 * Queries GitHub for user contribution statistics.
 * Primary source: GraphQL API (requires a token). Fallback: the embedded JSON
 * on the public profile page, which needs no authentication.
 */
async function fetchGitHubStats(username, fallback) {
  console.log(`📡 Fetching GitHub stats for @${username}...`);

  // 1. GraphQL with token
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    try {
      const query = `
        query($login: String!) {
          user(login: $login) {
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    date
                    contributionCount
                  }
                }
              }
            }
          }
        }
      `;

      const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `bearer ${token}`,
          'User-Agent': 'Portfolio-Updater'
        },
        body: JSON.stringify({
          query,
          variables: { login: username }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const calendar = data?.data?.user?.contributionsCollection?.contributionCalendar;
        if (calendar?.weeks?.length) {
          console.log(`✨ GitHub total contributions: ${calendar.totalContributions}`);
          return {
            username,
            totalContributions: calendar.totalContributions,
            contributionDays: flattenContributionWeeks(calendar.weeks)
          };
        }
      } else {
        console.warn(`⚠️ GitHub GraphQL responded with HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn(`⚠️ GitHub GraphQL query failed: ${err.message}`);
    }
  } else {
    console.warn('⚠️ No GITHUB_TOKEN set, falling back to public profile page.');
  }

  // 2. Public profile page (no auth required)
  try {
    const scraped = await scrapePublicCalendar(username);
    if (scraped) {
      console.log(`✨ GitHub total contributions (public page): ${scraped.totalContributions}`);
      return {
        username,
        totalContributions: scraped.totalContributions,
        contributionDays: scraped.contributionDays
      };
    }
  } catch (err) {
    console.warn(`⚠️ Public profile scrape failed: ${err.message}`);
  }

  // Fallback to baseline
  return fallback;
}

/** Converts GraphQL calendar weeks into a flat { 'YYYY-MM-DD': count } map */
function flattenContributionWeeks(weeks) {
  const days = {};
  for (const week of weeks) {
    for (const day of week.contributionDays || []) {
      const key = String(day.date).slice(0, 10);
      days[key] = (days[key] || 0) + (day.contributionCount || 0);
    }
  }
  return days;
}

/** Parses the public contributions page https://github.com/users/<user>/contributions (no token needed).
 *  Each day is rendered as a cell with data-date, and its exact count lives in an
 *  accessibility tooltip like "5 contributions on September 1st." */
async function scrapePublicCalendar(username) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const res = await fetch(`https://github.com/users/${username}/contributions`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html'
    },
    signal: controller.signal
  });
  clearTimeout(timeout);

  if (!res.ok) {
    throw new Error(`GitHub contributions page responded with HTTP ${res.status}`);
  }

  const html = await res.text();

  // Map cell id → date (cells): data-date="2026-09-01" ... id="contribution-day-component-2-51"
  const dateById = new Map();
  const cellRe = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*?id="(contribution-day-component-[\d-]+)"/g;
  for (const [, date, id] of html.matchAll(cellRe)) {
    dateById.set(id, date);
  }
  if (dateById.size === 0) throw new Error('no contribution cells found on page');

  // Map cell id → tooltip text: for="contribution-day-component-0-0" ... >No contributions on September 7th.<
  const days = {};
  const tooltipRe = /for="(contribution-day-component-[\d-]+)"[^>]*>([^<]+)</g;
  for (const [, id, text] of html.matchAll(tooltipRe)) {
    const date = dateById.get(id);
    if (!date) continue;
    const countMatch = text.match(/(\d+)\s+contributions?\s+on/i);
    days[date] = countMatch ? parseInt(countMatch[1], 10) : 0;
  }

  const totalContributions = Object.values(days).reduce((sum, c) => sum + c, 0);
  if (totalContributions === 0) throw new Error('parsed calendar is empty');

  return {
    totalContributions,
    contributionDays: days
  };
}

main().catch(err => {
  console.error('❌ Error executing activity updater:', err);
  process.exit(1);
});
