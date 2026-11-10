/**
 * Génère les captures du guide interactif (public/guide/<langue>/*.webp) et la position de chaque
 * élément expliqué (src/data/guide_shots.json).
 *
 * À relancer quand une page change :
 *   1. démarrer le site sur la base de test : MONGODB_DB=codemaroc_test npm run dev
 *   2. node scripts/capture-guide.mjs
 *
 * Le script crée un compte jetable sur la base de test, puis le supprime à la fin.
 * Il refuse toute adresse qui n'est pas locale. Aucune dépendance : Chrome piloté par le protocole DevTools.
 */
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.GUIDE_BASE ?? "http://localhost:3000";
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) throw new Error("Adresse locale obligatoire : " + BASE);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ONLY = process.argv[2]?.split(",");
const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find(existsSync);
if (!CHROME) throw new Error("Chrome introuvable");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ───────────── Chrome ───────────── */
const PORT = 9333;
const profile = mkdtempSync(join(tmpdir(), "guide-"));
const proc = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--disable-gpu", "--mute-audio", "about:blank"], { stdio: "ignore" });

let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) {
  await sleep(250);
  wsUrl = await fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.json()).then((j) => j.webSocketDebuggerUrl).catch(() => null);
}
if (!wsUrl) throw new Error("Chrome ne répond pas");

const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});
let nextId = 1;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id);
    pending.delete(m.id);
    if (m.error) rej(new Error(JSON.stringify(m.error)));
    else res(m.result);
  }
};
const raw = (method, params = {}, sessionId) =>
  new Promise((res, rej) => {
    const id = nextId++;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

const { targetId } = await raw("Target.createTarget", { url: "about:blank" });
const { sessionId } = await raw("Target.attachToTarget", { targetId, flatten: true });
const cdp = (m, p) => raw(m, p, sessionId);
await cdp("Page.enable");
await cdp("Runtime.enable");

async function evaluate(expression) {
  const r = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
}
async function waitFor(expression, ms = 20000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await evaluate(`!!(${expression})`).catch(() => false)) return true;
    await sleep(120);
  }
  return false;
}
async function viewport(width, height, scale, mobile) {
  await cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile });
  await cdp("Emulation.setScrollbarsHidden", { hidden: true });
}
async function goto(path) {
  await cdp("Page.navigate", { url: BASE + path });
  await sleep(350);
  await waitFor(`document.readyState === "complete"`);
  await installHelpers();
}

const HELPERS = `
if (!document.getElementById("guide-css")) {
  const st = document.createElement("style");
  st.id = "guide-css";
  st.textContent = "nextjs-portal{display:none!important} *{scroll-behavior:auto!important}";
  document.head.appendChild(st);
}
window.__stable = async () => {
  let last = -1, same = 0;
  for (let i = 0; i < 60 && same < 5; i++) {
    const v = scrollY + document.documentElement.scrollHeight;
    same = v === last ? same + 1 : 0;
    last = v;
    await new Promise((r) => setTimeout(r, 100));
  }
};
window.__vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
window.__el = (sel, txt, n = 0) => {
  let els = [...document.querySelectorAll(sel)].filter(__vis);
  if (txt) els = els.filter((e) => e.textContent.includes(txt)).sort((a, b) => a.textContent.length - b.textContent.length);
  return els[n] ?? null;
};
window.__click = (sel, txt, n = 0) => { const e = __el(sel, txt, n); if (!e) return false; e.click(); return true; };
window.__ready = () => [...document.images].every((i) => i.complete);
`;
const installHelpers = () => evaluate(HELPERS + ";1");

/* ───────────── Compte de test et progression d'exemple ───────────── */
const suffix = randomBytes(4).toString("hex");
const account = { name: "Salma", email: `salma-${suffix}@example.test`, password: randomBytes(12).toString("hex") };

async function seed() {
  await viewport(390, 844, 1, true);
  await goto("/");
  const seedFn = `(async () => {
    const reg = await fetch("/api/auth/register/", { method: "POST", headers: { "Content-Type": "application/json" }, body: ${JSON.stringify(JSON.stringify(account))} });
    if (!reg.ok) throw new Error("register " + reg.status);
    const quiz = await (await fetch("/data/quiz.json")).json();
    const DAY = 86400000, now = Date.now();
    const iso = (i) => new Date(now - i * DAY).toISOString().slice(0, 10);
    const answers = {}, srs = {};
    quiz.slice(0, 120).forEach((q, i) => {
      const bad = i % 5 === 0;
      answers["r:" + q.id] = { seen: bad ? 2 : 1, ok: bad ? 0 : 1, ko: bad ? 2 : 0, last: now - (i % 6) * DAY, lastOk: !bad };
    });
    quiz.slice(0, 120).filter((_, i) => i % 5 === 0).slice(0, 9).forEach((q, i) => {
      const box = [1, 1, 1, 1, 2, 2, 3, 4, 5][i];
      srs["r:" + q.id] = { box, due: now + (i < 5 ? -DAY : (i + 1) * DAY), added: now - 6 * DAY, chapter: q.t };
    });
    const days = {};
    [34, 28, 41, 22, 36, 30, 12].forEach((n, i) => (days[iso(i)] = n));
    const slug = "01_signalisation_verticale";
    const done = {};
    [1, 2, 3].forEach((k, i) => (done[slug + "." + k] = { ts: now - i * DAY, acc: 0.9 }));
    const exams = [[34, 2], [29, 4], [26, 6]].map(([score, d]) => ({ ts: now - d * DAY, score, total: 40, seconds: 980, wrong: [] }));
    const state = {
      v: 1, answers, srs, exams, days, flags: {},
      read: { [slug]: now - 3 * DAY, "02_dangers_priorites": now - DAY },
      settings: { dailyGoal: 40, timer: true, autoAudio: false, theme: "system" },
      game: { done, xp: 185, xpDays: { [iso(0)]: 35 }, lessonDays: { [iso(0)]: 2 }, comboDays: { [iso(0)]: 7 }, sound: false, onboarded: now },
    };
    const put = await fetch("/api/progress/", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state }) });
    if (!put.ok) throw new Error("progress " + put.status);
    return quiz.length;
  })()`;
  console.log("Questions de la banque :", await evaluate(seedFn));
}

async function removeAccount() {
  await goto("/");
  await evaluate(`fetch("/api/auth/me/", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: ${JSON.stringify(JSON.stringify({ password: account.password }))} }).then((r) => r.status)`).then((s) => console.log("Compte de test supprimé :", s));
}

/* ───────────── Écrans ───────────── */
const L = (fr, ar) => ({ fr, ar });
const pageReady = (txt) => `document.querySelector("main")?.textContent.length > ${txt ?? 80}`;

/** Une réponse fausse dans une étape : on essaie jusqu'à tomber sur une erreur. */
const failLesson = `(async () => {
  for (let i = 0; i < 8; i++) {
    const tiles = [...document.querySelectorAll(".duo-tile")];
    tiles[tiles.length - 1].click();
    await new Promise((r) => setTimeout(r, 120));
    [...document.querySelectorAll("button.duo-btn")].find((b) => !b.disabled && b.closest(".fixed")).click();
    await new Promise((r) => setTimeout(r, 450));
    if (document.querySelector(".duo-sheet.bg-\\\\[var\\\\(--duo-red-50\\\\)\\\\]")) return true;
    document.querySelector(".duo-sheet button.duo-btn").click();
    await new Promise((r) => setTimeout(r, 450));
  }
  return false;
})()`;

const failQuiz = `(async () => {
  for (let i = 0; i < 12; i++) {
    const opts = [...document.querySelectorAll('[role=radiogroup] button, [role=group] button, [role=radio], [role=checkbox]')];
    opts[opts.length - 1].click();
    await new Promise((r) => setTimeout(r, 120));
    const bar = document.querySelector(".sticky.bottom-0");
    [...bar.querySelectorAll("button")].reverse().find((b) => !b.disabled).click();
    await new Promise((r) => setTimeout(r, 500));
    if (document.body.textContent.includes(${JSON.stringify("Réponse incorrecte")}) || document.body.textContent.includes(${JSON.stringify("جواب خاطئ")})) return true;
    [...bar.querySelectorAll("button")].reverse()[0].click();
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
})()`;

const finishQuiz = `(async () => {
  const bank = await (await fetch("/data/quiz.json")).json();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 25; i++) {
    const bar = document.querySelector(".sticky.bottom-0");
    if (!bar) return true;
    const buttons = [...bar.querySelectorAll("button")].reverse();
    if (buttons[0].disabled) {
      const title = document.querySelector("h2")?.textContent.trim();
      const q = bank.find((x) => x.q === title || x.qa === title);
      const opts = [...document.querySelectorAll('[role=radiogroup] button, [role=group] button, [role=radio], [role=checkbox]')];
      if (q) for (const k of q.a) opts.find((o) => o.textContent.includes(q.o[k]) || (q.oa && o.textContent.includes(q.oa[k])))?.click();
      else opts[0].click();
      await wait(120);
    }
    [...bar.querySelectorAll("button")].reverse()[0].click();
    await wait(350);
  }
  return !document.querySelector(".sticky.bottom-0");
})()`;

const CURRENT = '[data-status="current"]';
const HOME_SPOTS = [
  { id: "streak", sel: 'header span[title]', n: 0 },
  { id: "xp", sel: 'header span[title="XP"]' },
  { id: "crown", sel: 'header span[title]', n: 2 },
  { id: "lang", sel: "header .shrink-0 > *", n: 0 },
  { id: "avatar", sel: 'header a[href*="profil"]' },
  { id: "tab-path", sel: "nav.fixed a", n: 0 },
  { id: "tab-courses", sel: "nav.fixed a", n: 1 },
  { id: "tab-exam", sel: "nav.fixed a", n: 2 },
  { id: "tab-errors", sel: "nav.fixed a", n: 3 },
  { id: "tab-more", sel: "nav.fixed button" },
];

const SHOTS = [
  { id: "home", path: "/", wait: CURRENT, spots: HOME_SPOTS },
  {
    id: "path",
    path: "/",
    h: 1320,
    wait: CURRENT,
    prep: `(() => { const u = document.querySelector(".zellige.sticky"); window.scrollTo(0, 0); window.scrollTo(0, u.getBoundingClientRect().top - 70); })()`,
    spots: [
      { id: "unit", sel: ".zellige.sticky" },
      { id: "guide", sel: '.zellige.sticky a[href*="/cours/"]' },
      { id: "done", sel: '[data-status="done"]' },
      { id: "current", sel: CURRENT },
      { id: "locked", sel: '[data-status="locked"]' },
    ],
  },
  {
    id: "more",
    path: "/",
    wait: CURRENT,
    prep: `(async () => { document.querySelector("nav.fixed button").click(); await new Promise((r) => setTimeout(r, 500)); })()`,
    spots: [
      { id: "list", sel: "[data-more-list]" },
      { id: "guide", sel: "[data-more-guide]" },
    ],
  },
  {
    id: "popover",
    path: "/",
    wait: CURRENT,
    prep: `document.querySelector('${CURRENT}').click()`,
    spots: [
      { id: "card", sel: '[role="dialog"]' },
      { id: "start", sel: '[role="dialog"] button' },
    ],
  },
  {
    id: "home-cards",
    path: "/",
    h: 1560,
    wait: CURRENT,
    prep: `(() => { const h = [...document.querySelectorAll("h2")].find((x) => /Défis du jour|تحديات اليوم/.test(x.textContent)); h.scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -90); })()`,
    spots: [
      { id: "quests", sel: "section.duo-card", txt: L("Défis du jour", "تحديات اليوم") },
      { id: "badges", sel: "section.duo-card", txt: L("Mes badges", "شاراتي") },
      { id: "backup", sel: "section.duo-card", txt: L("Ta progression", "تقدمك") },
    ],
  },
  {
    id: "lesson-intro",
    h: 1480,
    path: "/",
    wait: CURRENT,
    prep: `(async () => {
      localStorage.removeItem("codemaroc-etape-en-cours");
      document.querySelector('${CURRENT}').click();
      await new Promise((r) => setTimeout(r, 300));
      document.querySelector('[role="dialog"] button').click();
      await new Promise((r) => setTimeout(r, 1200));
      document.querySelectorAll("section ul.columns-2 > li").forEach((li, i) => i > 3 && li.remove());
    })()`,
    waitAfter: ".duo-card",
    spots: [
      { id: "quit", sel: 'button[aria-label]' },
      { id: "scene", sel: "div:has(> .duo-mascot-in)" },
      { id: "content", sel: "section ul, section ol" },
      { id: "fiche", sel: 'a[href*="/cours/"]' },
      { id: "go", sel: ".fixed button.duo-btn" },
    ],
  },
  {
    id: "lesson-q",
    h: 844,
    path: "same",
    prep: `(async () => {
      document.querySelector(".fixed button.duo-btn").click();
      await new Promise((r) => setTimeout(r, 600));
      const tiles = document.querySelectorAll(".duo-tile");
      tiles[tiles.length > 1 ? 1 : 0].click();
    })()`,
    spots: [
      { id: "quit", sel: "button[aria-label]" },
      { id: "bar", sel: ".duo-progress" },
      { id: "points", sel: "span[title]" },
      { id: "tile", sel: '.duo-tile[data-state="selected"]' },
      { id: "check", sel: ".fixed button.duo-btn" },
    ],
  },
  {
    id: "lesson-ko",
    h: 844,
    path: "same",
    prep: `(async () => { document.querySelector('.duo-tile[data-state="selected"]').click(); await new Promise((r) => setTimeout(r, 100)); return ${failLesson}; })()`,
    spots: [
      { id: "points", sel: "span[title]" },
      { id: "sheet", sel: ".duo-sheet" },
      { id: "next", sel: ".duo-sheet button.duo-btn" },
    ],
  },
  {
    id: "catalog",
    path: "/cours/",
    wait: `document.querySelectorAll("a[href*='/cours/']").length > 10`,
    spots: [
      { id: "filters", sel: "button", txt: L("Filtres", "التصفية") },
      { id: "search", sel: "input" },
      { id: "sort", sel: "select" },
      { id: "card", sel: 'main a[href*="/cours/0"]' },
    ],
  },
  {
    id: "chapter",
    path: "/cours/02_dangers_priorites/",
    h: 1120,
    wait: ".fiche-card",
    spots: [
      { id: "quiz", sel: "a", txt: L("Commencer le quiz", "ابدأ الاختبار") },
      { id: "read", sel: "button", txt: L("Fiche lue", "تمت القراءة") },
      { id: "info", sel: ".divide-line.rounded-\\[16px\\]" },
      { id: "tabs", sel: '[role="tablist"]' },
      { id: "outline", sel: 'nav[aria-label] .rounded-full, nav.no-scrollbar' },
    ],
  },
  {
    id: "fiche",
    path: "/cours/02_dangers_priorites/",
    h: 1000,
    wait: ".fiche-card",
    prep: `(() => { document.querySelector("#s-1").scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -150); })()`,
    spots: [
      { id: "section", sel: "#s-1 h2, #s-1 h3" },
      { id: "image", sel: "#s-1 img[data-zoom]" },
    ],
  },
  {
    id: "tips",
    path: "/cours/04_obligations/",
    h: 1200,
    wait: ".fiche-card",
    prep: `(() => { document.querySelector("#s-tips").scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -150); })()`,
    spots: [
      { id: "tips", sel: "#s-tips" },
      { id: "traps", sel: "#s-traps" },
    ],
  },
  {
    id: "mindmap",
    path: "/cours/02_dangers_priorites/",
    wait: ".fiche-card",
    prep: `(async () => { __click('[role="tab"]', ${JSON.stringify("Mindmap")}) || __click('[role="tab"]', ${JSON.stringify("الخريطة الذهنية")}); await new Promise((r) => setTimeout(r, 900)); document.querySelector('[role="tablist"]').scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -80); __click("button", ${JSON.stringify("Recentrer")}) || __click("button", ${JSON.stringify("إعادة التوسيط")}); await new Promise((r) => setTimeout(r, 700)); })()`,
    spots: [
      { id: "unfold", sel: "button", txt: L("Tout déplier", "فتح الكل") },
      { id: "center", sel: "button", txt: L("Recentrer", "إعادة التوسيط") },
    ],
  },
  {
    id: "signs",
    path: "/cours/03_interdictions/",
    wait: ".fiche-card",
    prep: `(async () => { __click('[role="tab"]', ${JSON.stringify("Panneaux")}) || __click('[role="tab"]', ${JSON.stringify("العلامات")}); await new Promise((r) => setTimeout(r, 900)); document.querySelector('[role="tablist"]').scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -80); })()`,
    spots: [
      { id: "search", sel: "label input" },
      { id: "test", sel: "button", txt: L("Me tester", "اختبر نفسي") },
      { id: "card", sel: "button img[data-zoom]" },
    ],
  },
  {
    id: "training",
    path: "/entrainement/",
    h: 2560,
    spots: [
      { id: "mix", sel: 'a[href*="mode=mix"]' },
      { id: "official", sel: 'a[href*="mode=official"]' },
      { id: "weak", sel: 'a[href*="mode=weak"]' },
      { id: "new", sel: 'a[href*="mode=new"]' },
    ],
  },
  {
    id: "quiz",
    path: "/entrainement/session/?mode=rules&n=5",
    wait: '[role="radio"], [role="checkbox"], [role=radiogroup] button, [role=group] button',
    spots: [
      { id: "counter", sel: "p.text-lg" },
      { id: "bar", sel: '[role="progressbar"]' },
      { id: "end", sel: ".sticky.bottom-0 button", n: 0 },
      { id: "ok", sel: ".sticky.bottom-0 button", n: 1 },
    ],
  },
  {
    id: "correction",
    path: "same",
    h: 1500,
    prep: failQuiz,
    spots: [
      { id: "answer", sel: ".animate-pop.space-y-3 > *", n: 0 },
      { id: "tip", sel: ".animate-pop.space-y-3 > *", n: 1 },
      { id: "links", sel: ".animate-pop.space-y-3 > .flex" },
      { id: "next", sel: ".sticky.bottom-0 button" },
    ],
  },
  {
    id: "results",
    path: "same",
    h: 1000,
    prep: finishQuiz,
    spots: [
      { id: "note", sel: "section" },
      { id: "again", sel: "button", txt: L("Recommencer", "إعادة المحاولة") },
      { id: "weak", sel: "section", n: 1 },
    ],
  },
  {
    id: "exam",
    path: "/examen/",
    h: 1300,
    spots: [
      { id: "rules", sel: "dl" },
      { id: "start", sel: "button", txt: L("Commencer l'examen", "ابدأ الامتحان") },
      { id: "settings", sel: "section", txt: L("Réglages", "الإعدادات") },
      { id: "history", sel: "table" },
    ],
  },
  {
    id: "exam-q",
    path: "/examen/",
    h: 1100,
    wait: `[...document.querySelectorAll("button")].some((b) => !b.disabled && /Commencer l'examen|ابدأ الامتحان/.test(b.textContent))`,
    prep: `(async () => { [...document.querySelectorAll("button")].find((b) => /Commencer l'examen|ابدأ الامتحان/.test(b.textContent)).click(); await new Promise((r) => setTimeout(r, 900)); })()`,
    spots: [
      { id: "timer", js: `[...document.querySelectorAll("main span, main div")].filter((e) => /^\\d+ (s|ث)$/.test(e.textContent.trim())).sort((a, b) => a.textContent.length - b.textContent.length || b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0]` },
      { id: "image", sel: "img[data-zoom]" },
      { id: "boxes", sel: ".grid.grid-cols-2.gap-3" },
      { id: "ok", sel: ".sticky.bottom-0 button" },
    ],
  },
  {
    id: "notebook",
    path: "/erreurs/",
    h: 1400,
    wait: ".divide-y button[aria-expanded]",
    spots: [
      { id: "review", sel: 'a[href*="mode=notebook"]' },
      { id: "reminders", sel: "main ul" },
      { id: "tabs", sel: '[role="tablist"]' },
      { id: "item", sel: ".divide-y button[aria-expanded]" },
      { id: "remove", sel: ".divide-y button[aria-label]:not([aria-expanded])" },
    ],
  },
  {
    id: "schemas",
    path: "/schemas/",
    spots: [{ id: "card", sel: "main .grid > button" }],
  },
  {
    id: "schema-open",
    path: "/schemas/",
    wait: "main .grid > button",
    prep: `(async () => { document.querySelector("main .grid > button").click(); await new Promise((r) => setTimeout(r, 1000)); })()`,
    spots: [],
  },
  {
    id: "memo",
    path: "/memo/",
    h: 1200,
    spots: [
      { id: "test", sel: "button", txt: L("Test éclair", "اختبار سريع") },
      { id: "groups", sel: '[role="tablist"]' },
      { id: "answer", sel: "ol li p", n: 0 },
      { id: "hook", sel: "ol li .mt-auto" },
    ],
  },
  {
    id: "dashboard",
    path: "/tableau-de-bord/",
    h: 1800,
    spots: [
      { id: "exam", sel: 'a[href="/examen/"]' },
      { id: "resume", sel: "a", txt: L("Reprendre le cours", "تابع الدرس") },
      { id: "program", sel: "section", txt: L("Ton programme du jour", "برنامجك اليوم") },
    ],
  },
  {
    id: "progress",
    path: "/progression/",
    h: 2200,
    spots: [
      { id: "stats", sel: ".grid.grid-cols-2.gap-3" },
      { id: "activity", sel: "section", txt: L("Activité des 30 derniers jours", "النشاط خلال آخر 30 يوما") },
      { id: "axes", sel: "section", txt: L("Maîtrise par axe", "الإتقان حسب المحور") },
      { id: "settings", sel: "section", txt: L("Objectif quotidien", "الهدف اليومي") },
      { id: "backup", sel: "section", txt: L("Exporter", "تصدير") },
    ],
  },
  {
    id: "profile",
    path: "/profil/",
    h: 1500,
    wait: `document.querySelector('[role="tablist"]')`,
    spots: [
      { id: "rank", sel: "main section .grid" },
      { id: "tabs", sel: '[role="tablist"]' },
      { id: "numbers", sel: ".grid.grid-cols-2.gap-2\\.5" },
      { id: "activity", sel: "section", txt: L("Mon activité", "نشاطي") },
    ],
  },
  {
    id: "account",
    path: "/profil/",
    h: 1600,
    wait: `document.querySelector('[role="tablist"]')`,
    prep: `(async () => { document.querySelectorAll('[role="tab"]')[1].click(); await new Promise((r) => setTimeout(r, 300)); })()`,
    spots: [
      { id: "save", sel: "button", txt: L("Sauvegarder", "حفظ") },
      { id: "name", sel: "section", txt: L("Mon nom", "اسمي") },
      { id: "password", sel: "section", txt: L("Mot de passe", "كلمة المرور") },
      { id: "logout", sel: "button", txt: L("Déconnexion", "خروج") },
    ],
  },
  {
    id: "desktop",
    path: "/",
    w: 1280,
    h: 800,
    scale: 1,
    mobile: false,
    wait: CURRENT,
    spots: [
      { id: "close", sel: "aside button" },
      { id: "nav", sel: "aside nav" },
      { id: "profile", sel: 'aside a[href*="profil"]', n: 1 },
      { id: "numbers", sel: "aside.duo-side-scroll > div" },
      { id: "quests", sel: "aside.duo-side-scroll section", txt: L("Défis du jour", "تحديات اليوم") },
    ],
  },
];

/* ───────────── Capture ───────────── */
const out = { shots: {} };
const outFile = join(ROOT, "src/data/guide_shots.json");

async function capture(shot, lang) {
  const w = shot.w ?? 390;
  const h = shot.h ?? 844;
  const scale = shot.scale ?? 1.5;
  await viewport(w, h, scale, shot.mobile ?? true);
  if (shot.path !== "same") {
    await goto(shot.path);
    const ok = await waitFor(shot.wait ? (/^[.\[#a-z]/i.test(shot.wait) && !shot.wait.includes("(") ? `document.querySelector(${JSON.stringify(shot.wait)})` : shot.wait) : pageReady());
    if (!ok) console.warn(`  ! attente dépassée pour ${shot.id}`);
    await sleep(500);
  }
  await installHelpers();
  if (shot.prep) {
    const r = await evaluate(shot.prep);
    if (r === false) console.warn(`  ! préparation sans résultat pour ${shot.id}`);
    await sleep(450);
  }
  if (shot.waitAfter) {
    await sleep(900);
    await waitFor(`document.querySelector(${JSON.stringify(shot.waitAfter)})`);
    await installHelpers();
  }
  await waitFor("__ready()", 8000);
  await sleep(700);
  await evaluate("__stable()");

  // La mise en page peut encore bouger (images dans le texte) : on mesure avant et après la capture.
  const measure = () => evaluate(`(() => {
    const out = {}, missing = [];
    for (const s of ${JSON.stringify(shot.spots.map((s) => ({ ...s, txt: s.txt?.[lang] })))}) {
      const e = s.js ? eval(s.js) : __el(s.sel, s.txt, s.n ?? 0);
      if (!e) { missing.push(s.id); continue; }
      const r = e.getBoundingClientRect();
      const x0 = Math.max(0, r.left), y0 = Math.max(0, r.top), x1 = Math.min(innerWidth, r.right), y1 = Math.min(innerHeight, r.bottom);
      if (x1 <= x0 || y1 <= y0) { missing.push(s.id + " (hors écran)"); continue; }
      out[s.id] = [x0 / innerWidth, y0 / innerHeight, (x1 - x0) / innerWidth, (y1 - y0) / innerHeight].map((v) => Math.round(v * 10000) / 100);
    }
    return { out, missing };
  })()`);
  let spots, shotData;
  for (let attempt = 0; attempt < 6; attempt++) {
    spots = await measure();
    ({ data: shotData } = await cdp("Page.captureScreenshot", { format: "webp", quality: 72, captureBeyondViewport: false }));
    if (JSON.stringify(await measure()) === JSON.stringify(spots)) break;
    await sleep(600);
  }
  if (spots.missing.length) console.warn(`  ! ${shot.id} (${lang}) introuvables : ${spots.missing.join(", ")}`);

  const dir = join(ROOT, "public/guide", lang);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${shot.id}.webp`), Buffer.from(shotData, "base64"));
  out.shots[shot.id] ??= { w, h, spots: {} };
  out.shots[shot.id].spots[lang] = spots.out;
  console.log(`  ${shot.id} (${lang})`);
}

try {
  await seed();
  for (const lang of ["fr", "ar"]) {
    await goto("/");
    await evaluate(`localStorage.setItem("codemaroc-lang", ${JSON.stringify(lang)}); 1`);
    await goto("/");
    await waitFor(`document.documentElement.lang === ${JSON.stringify(lang)}`);
    for (const shot of SHOTS) {
      if (ONLY && !ONLY.includes(shot.id)) continue;
      try {
        await capture(shot, lang);
      } catch (e) {
        console.error(`  X ${shot.id} (${lang}) : ${e.message}`);
      }
    }
  }
  if (!ONLY) writeFileSync(outFile, JSON.stringify(out));
  else {
    const { readFileSync } = await import("node:fs");
    const cur = existsSync(outFile) ? JSON.parse(readFileSync(outFile, "utf8")) : { shots: {} };
    writeFileSync(outFile, JSON.stringify({ shots: { ...cur.shots, ...out.shots } }));
  }
  await viewport(390, 844, 1, true);
  await removeAccount();
} finally {
  ws.close();
  proc.kill();
  await sleep(400);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
}
