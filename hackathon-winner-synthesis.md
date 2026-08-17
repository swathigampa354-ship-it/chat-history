# 🏆 Competitive Repo Deep-Dive → THE Winning Product Synthesis
**16 Aug 2026 · deadline Aug 17, 11:45 AM EDT**

---

## 1. THE THREE REPOS — WHAT MAKES EACH ONE SPECIAL

### 🔮 FaceForge (cyh7789) — "bad scores are good"
**What it is:** selfie → 15 skin metrics → rarity from *weirdness* → RPG card class → battle (BO3 stat duel, PvP rooms).

**Why it's dangerous:**
- **Inverts the entire frame.** Every other app says "your flaws"; FaceForge says "your weirdness is a legendary pull." The API's full 15-metric output — including metrics everyone hides — becomes the star of the game.
- **Engineering rigor:** uses `raw_score` (not the flattering `ui_score`), committed experiment fixtures, deterministic card identity (FNV-1a hash of raw scores — no farming), MediaPipe local face-gate firewall (prevents the 78-second API death-loop), measured rarity thresholds from real data.
- **Memorability:** it's the demo people remember. "Most Creative" lock.

### 🗣️ Aloud (StephenSook) — "beauty, aloud"
**What it is:** voice-first skincare assistant for blind shoppers — screen-off. WebRTC voice (OpenAI Realtime), barcode scan, audio-guided selfie capture (hot-cold tonal cues), spoken skin read with honest uncertainty, native iOS/Android shells.

**Why it's dangerous:**
- **Real human impact** (blind shoppers, Sephora/Fenty/Ulta lawsuits cited) → hits the "Impact" criterion harder than anyone.
- **Submission craft is elite:** live URL, 3-min demo video, 87 unit + 16 e2e tests, CI, claim-linter guardrail (blocks medical language), FACTS.md wiring ledger, "judge quick access" table. This is the gold standard of *presentation*.
- **Safety engineered:** "never medicine" linter. Judges (API makers) love seeing guardrails.

### 📏 TOLERANCE (Biniyoyo) — "this measures the number"
**What it is:** re-photographs you 81 ways, relights, runs identical analysis → **error bar on every beauty score** → tells you which scores you can trust. Second axis: scores your face against 4 beauty canons and shows a 53-point spread with citations.

**Why it's dangerous:**
- **The most intellectually sophisticated idea in the field.** "Oiliness moved 16 raw points between captures of the same unchanged skin — the noise floor is the same order of magnitude as the effects being claimed." That's a *killer* insight.
- **Critical thinking the judges will respect**: it audits the API itself, with evidence and citations, and refuses to emit an attractiveness verdict. The "honesty contract" is a flex.
- Highly likely technical/innovation winner.

---

## 2. THE SYNTHESIS — WHAT TO BUILD

Combine the three winning axes into ONE product we can actually ship by tomorrow:

> ## 🔍 GLOW + VERDICT — "the beauty score that tells you when to trust it"
> (working name: **GLOW Verdict** / **Verdict Skin**)

**Keep (already built in Glow):** 14-concern skin analysis · masks · skin age · Fitzpatrick · tone · season · routine · progress tracking · dark mode · Stitch-designed UI.

**ADD AXIS 1 — TOLERANCE's error bars (the "honesty" play):**
- Run the scan **3× on slightly different captures** (or 2–3 crops of the same selfie — the "relight/re-capture" trick, ~46–140 units per session; show it's honest about variance)
- Each metric gets: **score ± spread** + verdict label: **trustworthy / borderline / noise / saturated**
- A banner: *"Some numbers survive re-capture. Most don't. GLOW tells you which of your scores you can trust."*
- Optional "Whose ideal?" panel: score vs 2–3 beauty canons with citations (TOLERANCE's 53-point spread insight, compressed)

**ADD AXIS 2 — FaceForge's fun/inversion (the shareable "signature"):**
- **"Your skin signature" card**: your rarest/most-unusual metric becomes a persona (e.g., "Night Assassin — dark circles +12") — but reframed *kindly* ("your most distinctive feature"), not a roast
- **Shareable result card** with the signature + verdicts → drives virality in the demo
- Optional mini-game: "scan 2× → which score survived?" — gamifies the honesty message

**ADD AXIS 3 — Aloud's craft (the presentation bar):**
- Live URL + demo video + tests + "judge quick access" README table + honest-claims guardrail (we already avoid medical claims)

**Why this wins:**
| Criterion | How we hit it |
|---|---|
| Technical | Multi-scan pipeline, variance math, honest UI — sophisticated |
| Innovation | The error-bar idea + signature inversion = fresh, nobody else has BOTH |
| UX | Stitch-designed UI + shareable signature cards |
| Impact | "Stop trusting unverifiable numbers" is a consumer-protection story |
| Presentation | Mirror Aloud's README/video craft |

**Differentiation check:** ~30 skin-scan apps exist, but **none combine honest uncertainty + shareable identity**. TOLERANCE has the math but no product loop; FaceForge has the game but no honesty; we'd have both.

---

## 3. FEASIBILITY (vs tomorrow's deadline)

| Work item | Effort | Risk |
|---|---|---|
| Multi-scan variance (3 scans → ± spread + verdicts) | ~2–3h | Low — we already have the scan pipeline (crop fix + 3-API fullScan) |
| Verdict engine (trustworthy/borderline/noise/saturated thresholds) | ~1h | Low — pure logic, unit-testable |
| "Skin signature" persona + share card | ~2h | Low — UI + text templates |
| "Whose ideal?" canon panel (2–3 canons + citations) | ~1h | Low — static content |
| UI integration into Glow's Stitch design | ~2h | Medium — careful with existing dashboard |
| README/video polish (Aloud-style judge table) | ~1h | Low |
| **Total** | **~9–10h** | Achievable if we start now |

**Unit budget:** each 3× scan ≈ 138 units (3 × 46). With the key's remaining balance, plan ~4–6 full sessions for demo + testing. Demo mode (no key) must still work — the variance data can be simulated honestly-labeled ("GENERATED") like TOLERANCE does.

---

## 4. MY RECOMMENDATION

**Build "GLOW Verdict"** — it's the one move that takes us from "another solid skin app" (1 of ~30) to "the honest beauty mirror" (1 of 1), and it reuses ~80% of Glow's existing code. The three strongest repos in the competition each prove one axis; we combine all three in one product, ship it by tomorrow.

**Suggested build order (highest demo-impact first):**
1. Multi-scan variance + verdict labels (the core differentiator)
2. "Skin signature" persona + shareable card (the memorable wow)
3. "Whose ideal?" canon panel (the intellectual flex)
4. README + demo-video polish (the Aloud bar)

---

*Sources: github.com/cyh7789/faceforge · github.com/StephenSook/aloud · github.com/Biniyoyo/tolerance (READMEs + file trees, fetched 16 Aug 2026) · public-apis/public-apis (general API list, no direct need).*
