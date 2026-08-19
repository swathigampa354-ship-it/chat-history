#!/usr/bin/env node
// chat-history exporter: reads opencode.db and renders clean per-session markdown.
"use strict";
const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");
const fs = require("node:fs");

const HOME = process.env.HOME;
const DB = path.join(HOME, ".local/share/opencode/opencode.db");
const REPO = path.join(HOME, "chat-history");
const TRANSCRIPTS = path.join(REPO, "transcripts");
const README = path.join(REPO, "README.md");
const TOOL_OUTPUT_LIMIT = 4000;
const TOOL_INPUT_LIMIT = 1200;

// Secrets are collected at runtime ONLY (never hardcoded in this repo).
function runtimeSecrets() {
  const found = [];
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(HOME, ".config/opencode/opencode.jsonc"), "utf8")
      .replaceAll('//', ""));
    const stitch = cfg.mcp?.stitch?.headers?.["X-Goog-Api-Key"];
    if (stitch) found.push([stitch, "STITCH_API_KEY_REDACTED"]);
  } catch {}
  try {
    const sm = JSON.parse(fs.readFileSync(path.join(HOME, ".config/opencode/supermemory.json"), "utf8"));
    if (sm.apiKey) found.push([sm.apiKey, "SUPERMEMORY_API_KEY_REDACTED"]);
  } catch {}
  const extra = [];
  try {
    const red = JSON.parse(fs.readFileSync(path.join(HOME, ".config/opencode/redactions.json"), "utf8"));
    for (const [k, v] of Object.entries(red)) extra.push([k, v]);
  } catch {}
  return found.concat(extra);
}

const STATIC_SECRETS = [
  [/sm_[A-Za-z0-9_\-]{8,}/g, "sm_***REDACTED***"],
  [/cfk_[A-Za-z0-9_-]{5,}/g, "cfk_***REDACTED***"],
  [/ghp_[A-Za-z0-9]{20,}/g, "ghp_***REDACTED***"],
  [/gho_[A-Za-z0-9]{20,}/g, "gho_***REDACTED***"],
  [/sk-[A-Za-z0-9\-_]{16,}/g, "sk-***REDACTED***"],
  [/AKIA[0-9A-Z]{16}/g, "AKIA***REDACTED***"],
  [/AIza[0-9A-Za-z\-_]{30,}/g, "AIza***REDACTED***"],
  [/AQ\.[A-Za-z0-9_-]{8,}/g, "GOOGLE_STITCH_KEY_REDACTED"],
  [/xox[baprs]-[A-Za-z0-9\-]{10,}/g, "xox***REDACTED***"],
  [/eyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{10,}/g, "JWT***REDACTED***"],
  [/"apiKey"\s*:\s*"[^"]+"/g, '"apiKey": "***REDACTED***"'],
  [/"X-Goog-Api-Key"\s*:\s*"[^"]+"/g, '"X-Goog-Api-Key": "***REDACTED***"'],
  [/sk-[A-Za-z0-9]+/g, "sk-***REDACTED***"],
];

function redact(s) {
  if (typeof s !== "string") return s;
  let out = s;
  const secrets = runtimeSecrets().concat(STATIC_SECRETS);
  for (const [pat, rep] of secrets) {
    if (pat instanceof RegExp) out = out.replace(pat, rep);
    else out = out.split(pat).join(rep);
  }
  return out;
}

function escapeMd(s) {
  return String(s).replace(/([\\`*_[\]])/g, "\\$1");
}

function slugify(title) {
  const s = String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return (s || "untitled").slice(0, 60);
}

function fmtTs(ms) {
  if (!ms) return "?";
  const d = new Date(ms);
  const p = (n, l = 2) => String(n).padStart(l, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function fmtDate(ms) {
  if (!ms) return "unknown";
  const d = new Date(ms);
  const p = (n, l = 2) => String(n).padStart(l, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function truncate(s, n) {
  if (!s) return "";
  s = String(s);
  if (s.length <= n) return s;
  return s.slice(0, n) + `\n… [truncated: ${s.length - n} more chars]`;
}

function renderModel(m) {
  if (!m) return "?";
  try {
    const o = typeof m === "string" ? JSON.parse(m) : m;
    return `${o.providerID || "?"}/${o.id || "?"}` + (o.variant && o.variant !== "default" ? ` (${o.variant})` : "");
  } catch {
    return m;
  }
}

function renderPart(pd) {
  const type = pd.type;
  const out = [];
  if (type === "text") {
    const text = redact(pd.text || "");
    if (text && text.trim()) out.push(text.replace(/\n+$/g, ""));
  } else if (type === "reasoning") {
    const t = redact(pd.text || "");
    if (t && t.trim()) {
      out.push(`\n<details>\n<summary><small>reasoning</small></summary>\n\n${t.trim()}\n\n</details>\n`);
    }
  } else if (type === "tool") {
    const tool = pd.tool || "tool";
    const st = pd.state || {};
    const meta = st.metadata || {};
    const input = truncate(redact(JSON.stringify(st.input ?? pd.input ?? "", null, 2)), TOOL_INPUT_LIMIT);
    const output = truncate(redact(meta.output ?? ""), TOOL_OUTPUT_LIMIT);
    const status = st.status ?? "?";
    const exit = meta.exit ?? "";
    const desc = redact(meta.description ?? "");
    out.push(`\n<details open>\n<summary><code>${escapeMd(tool)}</code> <small>· ${status}${exit !== "" ? ` · exit ${exit}` : ""}</small></summary>`);
    if (desc) out.push(`\n<small>${escapeMd(desc)}</small>\n`);
    if (input && input !== "\"\"") out.push(`\n\`\`\`js\n${input}\n\`\`\``);
    if (output) out.push(`\n\`\`\`\n${output}\n\`\`\``);
    out.push(`\n</details>\n`);
  } else if (type === "patch") {
    const p2 = redact(JSON.stringify(pd, null, 2));
    out.push(`\n<details>\n<summary><small>patch</small></summary>\n\n\`\`\`diff\n${truncate(p2, TOOL_OUTPUT_LIMIT)}\n\`\`\`\n\n</details>\n`);
  }
  return out.join("\n");
}

function renderSession(sid, title, projectName, agent, model, created, updated, messages, partsByMsg) {
  const L = [];
  L.push(`# ${title}`);
  L.push("");
  L.push(`- **Session:** \`${sid}\``);
  L.push(`- **Project:** ${projectName}`);
  L.push(`- **Agent:** ${agent} · **Model:** ${renderModel(model)}`);
  L.push(`- **Started:** ${fmtTs(created)} · **Updated:** ${fmtTs(updated)}`);
  L.push(`- **Messages:** ${messages.length}`);
  L.push("");
  L.push("---");
  L.push("");

  let lastRole = null;
  for (const m of messages) {
    const d = m.dataJSON || {};
    const role = d.role || "unknown";
    const parts = partsByMsg[m.id] || [];
    const body = parts.map((p) => renderPart(p)).join("\n").trim();
    if (role === "user") {
      L.push(`## 👤 User`);
      L.push("");
      L.push(body || "_*[empty message]*_");
      L.push("");
    } else if (role === "assistant") {
      if (lastRole !== "assistant" || true) L.push(`## 🤖 Assistant`);
      L.push("");
      if (body) L.push(body);
      L.push("");
    }
    lastRole = role;
  }
  L.push("---");
  L.push("");
  return L.join("\n");
}

function main() {
  const db = new DatabaseSync(DB, { readOnly: true });
  const sessions = db.prepare(
    "SELECT id, project_id, title, agent, model, time_created, time_updated FROM session ORDER BY time_created ASC"
  ).all();

  const projects = {};
  for (const p of db.prepare("SELECT id, worktree, name FROM project").all()) {
    projects[p.id] = p.name || p.worktree || p.id;
  }

  const summary = [];
  const indexByDate = {};
  let totalMsgs = 0;

  for (const s of sessions) {
    const msgs = db.prepare("SELECT * FROM message WHERE session_id = ? ORDER BY time_created ASC").all(s.id);
    const partsByMsg = {};
    for (const msg of msgs) {
      let d = {};
      try { d = JSON.parse(msg.data); } catch {}
      msg.dataJSON = d;
      partsByMsg[msg.id] = db.prepare("SELECT data FROM part WHERE message_id = ? ORDER BY time_created ASC").all(msg.id).map((p) => {
        try { return JSON.parse(p.data); } catch { return { type: "text", text: p.data }; }
      });
    }
    if (msgs.length === 0) continue;

    const title = redact(s.title || "Untitled");
    const projectName = redact(projects[s.project_id] || s.project_id || "global");
    const md = renderSession(s.id, title, projectName, s.agent, s.model, s.time_created, s.time_updated, msgs, partsByMsg);

    const day = fmtDate(s.time_created);
    const dir = path.join(TRANSCRIPTS, day);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${slugify(title)}-${s.id.slice(-8)}.md`);
    fs.writeFileSync(file, md);

    totalMsgs += msgs.length;
    indexByDate[day] = (indexByDate[day] || 0) + 1;
    summary.push({ id: s.id, day, file, title, projectName, agent: s.agent, model: renderModel(s.model), created: s.time_created, msgs: msgs.length });
  }

  // README index
  const R = [];
  R.push("# Chat History");
  R.push("");
  R.push(`Complete, auto-synced conversation history from opencode.\n`);
  R.push(`- **Sessions exported:** ${summary.length}`);
  R.push(`- **Total messages:** ${totalMsgs}`);
  R.push("");
  R.push("## Layout");
  R.push("");
  R.push("```");
  R.push("transcripts/           readable per-session markdown, one file per session");
  R.push("  YYYY-MM-DD/          grouped by start date");
  R.push("archive/               legacy raw transcript dumps");
  R.push("scripts/               exporter + sync tooling");
  R.push("```");
  R.push("");
  R.push("## Sessions");
  R.push("");
  R.push("| Date | Session | Project | Agent / Model | Messages | File |");
  R.push("|---|---|---|---|---|---|");
  const rows = summary.slice().reverse().map((s) => {
    const rel = path.relative(REPO, s.file);
    return `| ${fmtDate(s.created)} | ${s.title.replace(/\|/g, "\\|")} | ${s.projectName.replace(/\|/g, "\\|")} | ${s.agent} / ${s.model} | ${s.msgs} | [link](${rel}) |`;
  });
  R.push(rows.join("\n"));
  R.push("");
  R.push("---");
  R.push("");
  R.push("_Auto-generated. Do not edit by hand._");
  R.push("");
  fs.writeFileSync(README, R.join("\n"));

  console.log(`Exported ${summary.length} sessions (${totalMsgs} msgs) to ${TRANSCRIPTS}`);
}

main();
