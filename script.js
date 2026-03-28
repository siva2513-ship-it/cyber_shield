/**
 * CyberShield — script.js
 * ============================================================
 * Handles all interactivity for both index.html (login) and
 * home.html (dashboard).
 *
 * Sections:
 *  A. Shared utilities
 *  B. Login page logic
 *  C. Home page — auth guard & profile
 *  D. Home page — URL verification engine
 *  E. Home page — navbar & scroll behaviour
 *  F. Home page — FAQ accordion
 *  G. Home page — scroll-to-top button
 *  H. Home page — activity stats & history
 *  I. Initialisation
 * ============================================================
 */

'use strict';


/* ============================================================
   A. SHARED UTILITIES
============================================================ */

/**
 * Shorthand for querySelector.
 * @param {string} selector
 * @param {Document|Element} [ctx=document]
 * @returns {Element|null}
 */
const $ = (selector, ctx = document) => ctx.querySelector(selector);

/**
 * Shorthand for querySelectorAll (returns Array).
 * @param {string} selector
 * @param {Document|Element} [ctx=document]
 * @returns {Element[]}
 */
const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

/**
 * Detect which page is currently loaded by checking a
 * distinctive element that only exists on that page.
 */
const PAGE = {
  isLogin: () => Boolean($('#loginForm')),
  isHome:  () => Boolean($('#verifyBtn')),
};

/**
 * Session storage helpers — persist lightweight user data
 * between the two pages without a backend.
 */
const Session = {
  set:    (key, value) => sessionStorage.setItem(`cs_${key}`, JSON.stringify(value)),
  get:    (key)        => { try { return JSON.parse(sessionStorage.getItem(`cs_${key}`)); } catch { return null; } },
  remove: (key)        => sessionStorage.removeItem(`cs_${key}`),
  clear:  ()           => { ['user', 'stats', 'history'].forEach(k => Session.remove(k)); },
};


/* ============================================================
   B. LOGIN PAGE LOGIC
============================================================ */

/**
 * Demo credentials — in a real app these would be verified
 * server-side. Here we simulate an authenticated session.
 */
const DEMO_USERS = [
  { username: 'admin',         password: 'admin123',     name: 'Admin User',      email: 'admin@cybershield.gov.in',    id: 'CS-2024-00001' },
  { username: 'user',          password: 'user123',      name: 'Demo Citizen',    email: 'citizen@example.com',         id: 'CS-2024-00042' },
  { username: 'test@test.com', password: 'password123',  name: 'Test Account',    email: 'test@test.com',               id: 'CS-2024-00099' },
];

/** Initialise the login page. */
function initLoginPage() {
  const form           = $('#loginForm');
  const usernameInput  = $('#username');
  const passwordInput  = $('#password');
  const usernameGroup  = $('#usernameGroup');
  const passwordGroup  = $('#passwordGroup');
  const usernameError  = $('#usernameError');
  const passwordError  = $('#passwordError');
  const authError      = $('#authError');
  const togglePassBtn  = $('#togglePassword');
  const togglePassIcon = $('#togglePasswordIcon');
  const loginBtnText   = $('#loginBtnText');
  const loginBtnLoader = $('#loginBtnLoader');
  const loginBtn       = $('#loginBtn');

  if (!form) return; // Safety check

  /* ── Live validation on blur ── */

  usernameInput.addEventListener('blur', () => validateUsername(usernameInput, usernameGroup, usernameError));
  passwordInput.addEventListener('blur', () => validatePassword(passwordInput, passwordGroup, passwordError));

  /* Clear errors on input */
  usernameInput.addEventListener('input', () => clearFieldError(usernameGroup, usernameError));
  passwordInput.addEventListener('input', () => clearFieldError(passwordGroup, passwordError));

  /* ── Toggle password visibility ── */
  togglePassBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePassIcon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
  });

  /* ── Form submission ── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear general auth error
    authError.textContent = '';

    // Validate both fields
    const usernameOk = validateUsername(usernameInput, usernameGroup, usernameError);
    const passwordOk = validatePassword(passwordInput, passwordGroup, passwordError);

    if (!usernameOk || !passwordOk) return;

    // Simulate async authentication
    setLoginLoading(true, loginBtn, loginBtnText, loginBtnLoader);

    await simulateDelay(1200);

    // Accept any input — build a session from whatever the user typed
    const enteredUsername = usernameInput.value.trim();

    Session.set('user', {
      name:  enteredUsername,
      email: enteredUsername.includes('@') ? enteredUsername : `${enteredUsername}@cybershield.gov.in`,
      id:    'CS-' + Date.now(),
    });
    Session.set('stats',   { verified: 0, safe: 0, unsafe: 0, warning: 0 });
    Session.set('history', []);

    // Brief success flash before redirect
    loginBtn.style.background = 'linear-gradient(135deg, #00a854, #00d4b4)';
    loginBtnText.innerHTML    = '<i class="fas fa-check"></i> Login Successful!';
    loginBtnLoader.classList.add('hidden');

    await simulateDelay(600);
    window.location.href = 'home.html';
  });
}

/** Returns true if username is valid, else shows error and returns false. */
function validateUsername(input, group, errorEl) {
  const val = input.value.trim();
  if (!val) {
    setFieldError(group, errorEl, 'Username or email is required.');
    return false;
  }
  if (val.length < 3) {
    setFieldError(group, errorEl, 'Must be at least 3 characters.');
    return false;
  }
  setFieldSuccess(group, errorEl);
  return true;
}

/** Returns true if password is valid, else shows error and returns false. */
function validatePassword(input, group, errorEl) {
  const val = input.value;
  if (!val) {
    setFieldError(group, errorEl, 'Password is required.');
    return false;
  }
  if (val.length < 6) {
    setFieldError(group, errorEl, 'Password must be at least 6 characters.');
    return false;
  }
  setFieldSuccess(group, errorEl);
  return true;
}

function setFieldError(group, errorEl, msg) {
  group.classList.remove('success');
  group.classList.add('error');
  errorEl.innerHTML = `<i class="fas fa-circle-exclamation"></i> ${msg}`;
}

function setFieldSuccess(group, errorEl) {
  group.classList.remove('error');
  group.classList.add('success');
  errorEl.textContent = '';
}

function clearFieldError(group, errorEl) {
  group.classList.remove('error', 'success');
  errorEl.textContent = '';
}

function setLoginLoading(loading, btn, textEl, loaderEl) {
  btn.disabled = loading;
  textEl.classList.toggle('hidden', loading);
  loaderEl.classList.toggle('hidden', !loading);
}


/* ============================================================
   C. HOME PAGE — AUTH GUARD & PROFILE
============================================================ */

/** Redirect to login if no session exists. */
function guardHome() {
  const user = Session.get('user');
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

/** Populate navbar and profile section with stored user data. */
function populateUserData(user) {
  const initial = (user.name || 'U').charAt(0).toUpperCase();

  // Navbar
  const navAvatar   = $('#navAvatar');
  const navUsername = $('#navUsername');
  if (navAvatar)   navAvatar.textContent   = initial;
  if (navUsername) navUsername.textContent = user.name.split(' ')[0]; // First name only

  // Profile section
  const profileAvatar = $('#profileAvatar');
  const profileName   = $('#profileName');
  const profileEmail  = $('#profileEmail');
  const profileId     = $('#profileId');

  if (profileAvatar) profileAvatar.textContent = initial;
  if (profileName)   profileName.textContent   = user.name;
  if (profileEmail)  profileEmail.textContent  = user.email;
  if (profileId)     profileId.textContent     = user.id;
}

/** Wire up the logout button. */
function initLogout() {
  const logoutBtn = $('#logoutBtn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', () => {
    Session.clear();
    window.location.href = 'index.html';
  });
}


/* ============================================================
   D. HOME PAGE — URL VERIFICATION ENGINE
============================================================ */

/**
 * Government-approved domain suffixes and exact whitelisted hosts.
 * In a real application this list would be fetched from a live API.
 */
const APPROVED_SUFFIXES = [
  '.gov.in', '.nic.in', '.gov', '.gov.uk', '.gov.au', '.gov.ca',
  '.gov.sg', '.gov.nz', '.gov.za', '.gov.bd', '.gov.pk',
  '.gov.lk', '.gov.np', '.gov.my', '.gov.ph',
  '.mil', '.mil.in',
];

const APPROVED_EXACT_HOSTS = new Set([
  'mygov.in', 'india.gov.in', 'digitalindia.gov.in',
  'incometax.gov.in', 'uidai.gov.in', 'digilocker.gov.in',
  'cowin.gov.in', 'passport.gov.in', 'epfindia.gov.in',
  'indianrailways.gov.in', 'irctc.co.in', 'niti.gov.in',
  'pmindia.gov.in', 'mha.gov.in', 'meity.gov.in',
  'moef.gov.in', 'dopt.gov.in', 'finmin.gov.in',
  'rbi.org.in', 'sebi.gov.in', 'trai.gov.in',
  'cbi.gov.in', 'ncrb.gov.in', 'cybercrime.gov.in',
  'pmjay.gov.in', 'nhm.gov.in', 'mohfw.gov.in',
  'ncert.nic.in', 'ugc.ac.in', 'aicte-india.org',
  'who.int', 'un.org', 'unicef.org', 'worldbank.org',
  'census.gov', 'irs.gov', 'usa.gov', 'whitehouse.gov',
  'fbi.gov', 'cdc.gov', 'nih.gov',
]);

/**
 * Suspicious TLDs that are frequently abused by threat actors.
 */
const SUSPICIOUS_TLDS = new Set([
  '.xyz', '.tk', '.ml', '.cf', '.ga', '.gq',
  '.click', '.download', '.win', '.party', '.accountant',
  '.faith', '.review', '.science', '.date', '.stream',
  '.gdn', '.icu', '.buzz', '.monster',
]);

/**
 * Known phishing / lookalike keyword patterns in hostnames.
 * Regex tests are run against the hostname (lowercased).
 */
const PHISHING_PATTERNS = [
  { re: /^\d{1,3}(\.\d{1,3}){3}$/,        reason: 'URL uses a raw IP address (not a domain name)' },
  { re: /\bgov\b(?!\.in|\.uk|\.au|$)/,     reason: 'Fake "gov" keyword in non-government domain' },
  { re: /login[-._]?verify/,               reason: 'Suspicious "login-verify" pattern detected' },
  { re: /secure[-._]?update/,              reason: 'Suspicious "secure-update" pattern detected' },
  { re: /account[-._]?confirm/,            reason: 'Suspicious "account-confirm" pattern detected' },
  { re: /(paypal|amazon|flipkart|paytm|sbi|hdfc|icici|axis|kotak)[^.]*\.(xyz|tk|ml|cf|gq|ga|click|win)/i, reason: 'Brand-name used with suspicious TLD (possible phishing)' },
  { re: /-{3,}/,                           reason: 'Excessive hyphens — common in phishing domains' },
  { re: /(.)\1{5,}/,                       reason: 'Abnormally repeated characters in domain' },
  { re: /\d{6,}/,                          reason: 'Long numeric string in domain — unusual for legitimate sites' },
];

/**
 * Attempt to parse a URL string. Accepts bare domains, e.g. "google.com".
 * Returns a URL object or null if unparseable.
 * @param {string} raw
 * @returns {URL|null}
 */
function parseUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Try as-is
  try { return new URL(trimmed); } catch {}

  // Try with https://
  try { return new URL(`https://${trimmed}`); } catch {}

  return null;
}

/**
 * Core verification function.
 * Returns a result object: { status, title, domain, body, tags, recommendation }
 * status: 'safe' | 'warning' | 'danger'
 *
 * @param {string} rawUrl
 * @returns {{ status: string, title: string, domain: string, fullUrl: string, body: string, tags: string[], recommendation: string }}
 */
function verifyUrl(rawUrl) {
  const parsed = parseUrl(rawUrl);

  if (!parsed) {
    return {
      status: 'danger',
      title:  'Invalid URL',
      domain: rawUrl,
      fullUrl: rawUrl,
      body: 'The URL you entered could not be parsed. It may be malformed, missing a protocol (http/https), or contain invalid characters.',
      tags: ['Invalid Format', 'Parse Error'],
      recommendation: 'Double-check the URL and ensure it starts with https:// or http://. Do not visit this link.',
    };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const fullUrl  = parsed.href;

  /* ── Check 1: exact approved host ── */
  if (APPROVED_EXACT_HOSTS.has(hostname)) {
    return {
      status: 'safe',
      title:  '✅ Government Approved — Safe Link',
      domain: hostname,
      fullUrl,
      body: `This URL belongs to <strong>${hostname}</strong>, which is an officially whitelisted government or trusted international domain. It has been verified against the Central Government Approved Domain Registry.`,
      tags: ['Government Approved', 'Whitelisted', 'SSL Expected', 'Verified'],
      recommendation: 'This link is safe to visit. Always ensure the connection is HTTPS before entering any personal information.',
    };
  }

  /* ── Check 2: approved suffix ── */
  const matchedSuffix = APPROVED_SUFFIXES.find(sfx => hostname.endsWith(sfx));
  if (matchedSuffix) {
    return {
      status: 'safe',
      title:  '✅ Government Domain — Approved',
      domain: hostname,
      fullUrl,
      body: `This URL uses the <strong>${matchedSuffix}</strong> domain suffix, which is reserved exclusively for official government use. Links under this domain are administered by the respective national or state government authority.`,
      tags: [`Suffix: ${matchedSuffix}`, 'Government TLD', 'Official', 'Approved'],
      recommendation: 'This link appears safe. Verify the full domain matches the official site you intend to visit, especially if received via SMS or email.',
    };
  }

  /* ── Check 3: phishing patterns ── */
  for (const { re, reason } of PHISHING_PATTERNS) {
    if (re.test(hostname)) {
      return {
        status: 'danger',
        title:  '🚨 Unsafe — Phishing Detected',
        domain: hostname,
        fullUrl,
        body: `This URL triggered a phishing detection rule: <strong>${reason}</strong>. This type of link is commonly used by cyber criminals to steal personal information, banking credentials, and OTPs.`,
        tags: ['Phishing Pattern', 'High Risk', 'Do Not Click', 'Report Immediately'],
        recommendation: 'Do NOT open this link. If you received it via SMS, email, or WhatsApp, delete the message immediately. Report this link to cybercrime.gov.in or call 1930.',
      };
    }
  }

  /* ── Check 4: suspicious TLD ── */
  const dotParts = hostname.split('.');
  const tld      = `.${dotParts[dotParts.length - 1]}`;
  if (SUSPICIOUS_TLDS.has(tld)) {
    return {
      status: 'danger',
      title:  '⚠️ Unsafe — Suspicious Domain Extension',
      domain: hostname,
      fullUrl,
      body: `The domain extension <strong>${tld}</strong> is frequently associated with malicious websites, spam, and phishing campaigns. Legitimate government or banking services never use this extension.`,
      tags: [`TLD: ${tld}`, 'Suspicious Extension', 'High Risk', 'Unverified'],
      recommendation: 'Avoid visiting this link. If a government agency or bank sent you a link with this extension, treat it as suspicious and verify through official channels.',
    };
  }

  /* ── Check 5: known popular but non-government sites ── */
  const trustedCommercial = [
    'google.com', 'youtube.com', 'github.com', 'microsoft.com',
    'apple.com', 'amazon.com', 'linkedin.com', 'twitter.com',
    'facebook.com', 'instagram.com', 'wikipedia.org', 'stackoverflow.com',
  ];
  if (trustedCommercial.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
    return {
      status: 'warning',
      title:  '⚠️ Not Government Approved — Known Site',
      domain: hostname,
      fullUrl,
      body: `<strong>${hostname}</strong> is a well-known commercial website but is <em>not part of the Government Approved Domain Registry</em>. It is generally considered trustworthy, but any official government communication should never redirect you here for sensitive actions.`,
      tags: ['Not Government', 'Known Commercial Site', 'Use with Caution'],
      recommendation: 'This site is generally safe for normal use. However, if you received this link in a message claiming to be from a government body, bank, or official authority — treat it with suspicion.',
    };
  }

  /* ── Default: unknown / unverified ── */
  return {
    status: 'warning',
    title:  '⚠️ Not Approved — Unverified Domain',
    domain: hostname,
    fullUrl,
    body: `<strong>${hostname}</strong> is not found in the Government Approved Domain Registry. This does not necessarily mean the site is malicious, but it has not been verified as an official government or approved portal.`,
    tags: ['Not in Registry', 'Unverified', 'Caution Advised'],
    recommendation: 'Proceed with caution. Do not enter sensitive information (Aadhaar, PAN, banking details) on unverified sites. If in doubt, contact the official organisation directly.',
  };
}

/**
 * Renders the verification result object into the DOM.
 * @param {{ status, title, domain, fullUrl, body, tags, recommendation }} result
 */
function renderResult(result) {
  const container = $('#verifyResult');
  if (!container) return;

  const iconMap = {
    safe:    { icon: 'fa-shield-halved', label: 'Safe' },
    warning: { icon: 'fa-triangle-exclamation', label: 'Warning' },
    danger:  { icon: 'fa-skull-crossbones', label: 'Danger' },
  };

  const { icon, label } = iconMap[result.status];

  const tagsHTML = result.tags
    .map(t => `<span class="result-tag"><i class="fas fa-tag" aria-hidden="true"></i>${t}</span>`)
    .join('');

  container.className = `verify-result result-${result.status}`;
  container.innerHTML = `
    <div class="result-header">
      <div class="result-icon" aria-hidden="true">
        <i class="fas ${icon}"></i>
      </div>
      <div>
        <p class="result-title">${result.title}</p>
        <p class="result-domain">
          <i class="fas fa-globe" aria-hidden="true"></i>
          ${escapeHtml(result.domain)}
        </p>
      </div>
    </div>

    <p class="result-body">${result.body}</p>

    <div class="result-tags" role="list" aria-label="Result tags">
      ${tagsHTML}
    </div>

    <div class="result-recommendation">
      <i class="fas fa-circle-info" style="margin-top:2px;flex-shrink:0;" aria-hidden="true"></i>
      <span>${result.recommendation}</span>
    </div>
  `;

  container.classList.remove('hidden');
  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * The loading steps shown sequentially during the fake scan.
 */
const LOADING_STEPS = [
  'Connecting to verification database…',
  'Parsing URL structure…',
  'Checking government domain registry…',
  'Scanning for phishing patterns…',
  'Cross-referencing threat intelligence…',
  'Finalising report…',
];

/**
 * Initialise the URL verifier: input events + button click.
 */
function initVerifier() {
  const urlInput       = $('#urlInput');
  const verifyBtn      = $('#verifyBtn');
  const clearBtn       = $('#clearUrlBtn');
  const loadingSpinner = $('#loadingSpinner');
  const loadingStep    = $('#loadingStep');
  const resultBox      = $('#verifyResult');

  if (!urlInput || !verifyBtn) return;

  /* Show/hide clear button as user types */
  urlInput.addEventListener('input', () => {
    clearBtn.classList.toggle('hidden', !urlInput.value.trim());
  });

  /* Clear input */
  clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    clearBtn.classList.add('hidden');
    resultBox.classList.add('hidden');
    urlInput.focus();
  });

  /* Verify on Enter key */
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifyBtn.click();
  });

  /* Main verify action */
  verifyBtn.addEventListener('click', async () => {
    const raw = urlInput.value.trim();

    if (!raw) {
      urlInput.focus();
      urlInput.style.borderColor = 'var(--danger)';
      setTimeout(() => { urlInput.style.borderColor = ''; }, 1500);
      return;
    }

    // Hide previous result, show loading
    resultBox.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');
    verifyBtn.disabled = true;

    // Cycle through loading step messages for realism
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      if (stepIdx < LOADING_STEPS.length - 1) {
        stepIdx++;
        loadingStep.textContent = LOADING_STEPS[stepIdx];
      }
    }, 300);

    // Simulated verification delay (1.8 – 2.2s for realism)
    const delay = 1800 + Math.random() * 400;
    await simulateDelay(delay);

    clearInterval(stepInterval);
    loadingSpinner.classList.add('hidden');
    verifyBtn.disabled = false;

    // Run the verification engine
    const result = verifyUrl(raw);

    // Render the result
    renderResult(result);

    // Update session stats and history
    updateStats(result.status);
    addToHistory(raw, result);
  });
}


/* ============================================================
   E. HOME PAGE — NAVBAR & SCROLL BEHAVIOUR
============================================================ */

function initNavbar() {
  const navbar     = $('#navbar');
  const hamburger  = $('#hamburger');
  const navLinks   = $('#navLinks');
  const navLinkEls = $$('.nav-link');

  if (!navbar) return;

  /* ── Hamburger toggle ── */
  hamburger?.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('nav-open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  /* Close mobile menu on link click */
  navLinkEls.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('nav-open');
      hamburger?.classList.remove('open');
      hamburger?.setAttribute('aria-expanded', 'false');
    });
  });

  /* ── Sticky navbar style change on scroll ── */
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
    highlightActiveNavLink();
    toggleScrollTopBtn();
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Run once on load
}

/**
 * Highlights the nav link whose section is currently in view.
 */
function highlightActiveNavLink() {
  const sections   = $$('section[id]');
  const navLinkEls = $$('.nav-link[data-section]');
  const scrollMid  = window.scrollY + window.innerHeight / 2;

  let active = null;

  sections.forEach(section => {
    const top    = section.offsetTop;
    const bottom = top + section.offsetHeight;
    if (scrollMid >= top && scrollMid < bottom) {
      active = section.id;
    }
  });

  navLinkEls.forEach(link => {
    link.classList.toggle('active', link.dataset.section === active);
  });
}


/* ============================================================
   F. HOME PAGE — FAQ ACCORDION
============================================================ */

function initFAQs() {
  const faqItems = $$('.faq-item');

  faqItems.forEach(item => {
    const btn    = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all open FAQs (accordion behaviour)
      faqItems.forEach(other => {
        if (other !== item && other.classList.contains('open')) {
          other.classList.remove('open');
          other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
          other.querySelector('.faq-answer')?.setAttribute('hidden', '');
        }
      });

      // Toggle this item
      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));

      if (isOpen) {
        answer.setAttribute('hidden', '');
      } else {
        answer.removeAttribute('hidden');
      }
    });
  });
}


/* ============================================================
   G. HOME PAGE — SCROLL-TO-TOP BUTTON
============================================================ */

function toggleScrollTopBtn() {
  const btn = $('#scrollTopBtn');
  if (!btn) return;
  btn.classList.toggle('hidden', window.scrollY < 400);
}

function initScrollTop() {
  const btn = $('#scrollTopBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


/* ============================================================
   H. HOME PAGE — ACTIVITY STATS & HISTORY
============================================================ */

/** Increment the appropriate stat counter and persist to session. */
function updateStats(status) {
  const stats = Session.get('stats') || { verified: 0, safe: 0, unsafe: 0, warning: 0 };

  stats.verified++;
  if (status === 'safe')    stats.safe++;
  if (status === 'danger')  stats.unsafe++;
  if (status === 'warning') stats.warning++;

  Session.set('stats', stats);
  renderStats(stats);
}

/** Add a verification entry to the history list. */
function addToHistory(rawUrl, result) {
  const history = Session.get('history') || [];
  const MAX_HISTORY = 10;

  history.unshift({
    url:    rawUrl.length > 50 ? rawUrl.substring(0, 47) + '…' : rawUrl,
    status: result.status,
    label:  result.status === 'safe' ? 'Safe' : result.status === 'danger' ? 'Unsafe' : 'Warning',
    time:   new Date().toLocaleTimeString(),
  });

  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;

  Session.set('history', history);
  renderHistory(history);
}

/** Render the profile stats panel from a stats object. */
function renderStats(stats) {
  const el = (id) => $(id);

  const statVerified = el('#statVerified');
  const statSafe     = el('#statSafe');
  const statUnsafe   = el('#statUnsafe');
  const statWarning  = el('#statWarning');

  if (statVerified) animateCounter(statVerified, stats.verified);
  if (statSafe)     animateCounter(statSafe,     stats.safe);
  if (statUnsafe)   animateCounter(statUnsafe,   stats.unsafe);
  if (statWarning)  animateCounter(statWarning,  stats.warning);
}

/** Render the history list in the profile section. */
function renderHistory(history) {
  const list = $('#historyList');
  if (!list) return;

  if (!history || history.length === 0) {
    list.innerHTML = `
      <li class="history-empty">
        <i class="fas fa-magnifying-glass" aria-hidden="true"></i>
        <span>No verifications yet. Try verifying a link!</span>
      </li>`;
    return;
  }

  list.innerHTML = history.map(entry => `
    <li class="history-item hi-${entry.status}" role="listitem">
      <span class="history-item-dot" aria-hidden="true"></span>
      <span class="history-item-url" title="${escapeHtml(entry.url)}">${escapeHtml(entry.url)}</span>
      <span class="history-item-status">${entry.label}</span>
    </li>
  `).join('');
}

/**
 * Smoothly animate a counter from 0 to its target value.
 * @param {Element} el
 * @param {number} target
 */
function animateCounter(el, target) {
  const duration  = 500;
  const startTime = performance.now();
  const startVal  = parseInt(el.textContent, 10) || 0;

  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(startVal + (target - startVal) * eased);
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

/** Load persisted stats/history when the home page loads. */
function loadPersistedData() {
  const stats   = Session.get('stats')   || { verified: 0, safe: 0, unsafe: 0, warning: 0 };
  const history = Session.get('history') || [];
  renderStats(stats);
  renderHistory(history);
}


/* ============================================================
   I. SHARED HELPERS
============================================================ */

/**
 * Simple Promise-based delay.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function simulateDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Escape HTML special characters to prevent XSS when inserting
 * user-supplied strings into innerHTML.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str).replace(/[&<>"']/g, ch => map[ch]);
}


/* ============================================================
   J. INITIALISATION — Entry point
============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Login Page ── */
  if (PAGE.isLogin()) {
    initLoginPage();
    return; // Nothing else needed on the login page
  }

  /* ── Home Page ── */
  if (PAGE.isHome()) {
    // 1. Auth guard — redirect to login if not authenticated
    const user = guardHome();
    if (!user) return;

    // 2. Populate user data in navbar & profile section
    populateUserData(user);

    // 3. Load previously saved stats and history
    loadPersistedData();

    // 4. Wire up all interactive features
    initVerifier();
    initNavbar();
    initFAQs();
    initScrollTop();
    initLogout();
  }

});
