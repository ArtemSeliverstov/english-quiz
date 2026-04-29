# Coverage Matrix and Targets

Question bank coverage targets and current state. Numbers are dynamically
generated in the source KB — this file describes the **targets and priorities**.

For current actual counts, run:
```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('index.html', 'utf8');
const ids = (src.match(/id:'([^']+)'/g) || []).length;
const lvls = ['B1','B2','C1','C2'].map(l => ({l, n:(src.match(new RegExp(\`lvl:'\${l}'\`,'g'))||[]).length}));
console.log('Total:', ids);
lvls.forEach(({l,n}) => console.log(\` \${l}: \${n}\`));
"
```

---

## Level distribution targets

| Level | Target | Priority |
|---|---|---|
| B1 | 451 ✓ | Met (post-S31 expansion) |
| B2 | 624 | Stable |
| C1 | 330 (+80 needed) | Active priority |
| C2 | 240 (+224 needed) | Long-term, low priority |

C2 is genuine ceiling content — rarely encountered, low practical value for the family
at current levels. Don't sprint on C2 unless Artem specifically requests.

---

## Per-category input share — ≥20% target

The ≥20% input share applies at category level, not just overall. Categories falling
below this are priorities for input authoring.

The full per-category table lives in the source KB → "Per-category input target" section.
Update it whenever input questions are added.

**Current priority gaps** (as of s86):

| Category | Total | Input | Input % | Status |
|---|---|---|---|---|
| Word Formation | 40 | 0 | 0.0% | ❌ zero — top priority |
| Passive Voice | 28 | 4 | 14.3% | ⚠ below — priority |
| Used To | 48 | 3 | 6.3% | ❌ below — priority |
| Emphasis | 18 | 3 | 16.7% | ⚠ below |
| Idioms | 35 | 6 | 17.1% | ⚠ below |
| Word Order | 22 | 4 | 18.2% | ⚠ borderline |
| Linking Words | 80 | 15 | 18.8% | ⚠ borderline |
| Reported Speech | 32 | 6 | 18.8% | ⚠ borderline |
| Modal Verbs | 74 | 14 | 18.9% | ⚠ borderline |
| Articles | 152 | 29 | 19.1% | ⚠ borderline |
| Indirect Questions | 36 | 6 | 16.7% | ⚠ below (post-split) |
| Vocabulary | 185 | 36 | 19.5% | ⚠ borderline |
| Question Formation | 36 | 7 | 19.4% | ⚠ borderline |
| Tenses | 157 | 34 | 21.7% | ✓ (post-split) |

14 categories below target. Top priorities: Word Formation (+9), Used To (+7), Passive Voice (+2), then borderline categories.

---

## Type distribution targets

| Type | Target share | Current actual |
|---|---|---|
| input | ≥20% per category, currently 20.4% overall | ✓ on track |
| gap | ~55–60% | Stable |
| multi | ~5% (expand cautiously) | At target |
| mcq | ~8% (reduce over time) | Above — reduce when adding |

When adding new questions to a category, weight toward `input` until per-category
share reaches ≥20%.

---

## Content backlog priorities (Phase 1 — post-s87)

From source KB Roadmap → "Phase 1 Content priorities":

| # | What | Estimate | Status | Why |
|---|---|---|---|---|
| 1 | B2 Idioms | ~15 q | New questions | Idioms entirely C1; B2 absent |
| 2 | C1 expansion (Reported Speech, Relative Clauses, G&I, Collocations) | ~60 q | Scraped exercises partial | C1 at 250/330. Egor IELTS focus. |
| 3 | C2 — initial batch | ~40 q | New questions | C2 at 16; needed for Artem ceiling |
| 4 | Everyday English — new category | ~30 q | New questions | Pragmatics, register. Anna engagement driver. |

Done items (from S31): B1 Grammar expansion, B1 Articles expansion, Used To category,
C1 Indirect Questions, C1 Modal Verbs, C1 Linking Words, C1 Vocabulary.

---

## Audit protocol

After every stats upload, before authoring new questions, run a coverage review:

1. Per-category breakdown: question count, level distribution, type distribution, input ratio vs 20% target
2. Cross-reference against Phase 1 backlog
3. Flag any question with ≥60% error rate across 3+ players for quality review
4. Show proposed changes table BEFORE applying

The audit protocol (S69 standard, expanded S79) lives in the source KB.

---

## When category structure changes

If adding a new category:
1. Verify the cat string is consistent with existing naming
2. Add a `cat-btn` chip to `cat-filter-wrap` in HTML (alphabetical order)
3. Update LEVEL_TOTALS, CAT_TOTALS in `renderCoverage()` and `playerCoverageHTML()`
4. Update per-category input share table

If splitting a category (e.g., Used To split off from Grammar in S31):
1. Move the question entries (preserve IDs)
2. Old prefix continues in original category for backward stats compat
3. Update both old and new category counts
