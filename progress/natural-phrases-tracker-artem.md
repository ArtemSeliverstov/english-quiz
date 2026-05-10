# Natural Phrases Tracker — Artem

> **Generated file.** Regenerated from `players/artem.phrase_tracker`. Never hand-edit — changes will be overwritten.

**Baseline source**: first `phrase_swap_drill` session.
**Last refresh**: 2026-05-09
**Refresh trigger**: any `stats-review` skill run or manual regeneration after a session.

---

## Status legend

- ⚪ **first-pass** — captured once in `recent_observations`, awaiting 2nd hit
- 🔵 **active** — in `weak_patterns`, drilling now
- 🟡 **retest-due** — demoted; retest window open (≥21 days since demotion)
- 🟢 **mastered** — passed first retest, no failures since
- 🏆 **owned** — passed 2nd retest 6+ weeks after first; out of rotation
- ✗ **failed-retest** — last retest failed; back in active rotation

---

## Context tags

`[biz_oil]` — business meetings, O&G operations, Bahrain settings
`[leisure_sport]` — cycling, F1, gym, sports talk
`[brit_expat]` — pubs, padel club, dinner parties, expat banter
`[claude_collab]` — CC prompts, project vocab, system-behaviour talk, git/CLI collab

---

## Coverage

| Tag | ⚪ | 🔵 | 🟡 | 🟢 | 🏆 | ✗ | Total |
|---|---|---|---|---|---|---|---|
| `[biz_oil]` | 0 | 6 | 0 | 0 | 0 | 0 | 6 |
| `[leisure_sport]` | 0 | 2 | 0 | 0 | 0 | 0 | 2 |
| `[brit_expat]` | 0 | 1 | 0 | 0 | 0 | 0 | 1 |
| `[claude_collab]` | 0 | 20 | 0 | 0 | 0 | 0 | 20 |
| **Total** | 0 | 29 | 0 | 0 | 0 | 0 | 29 |

---

## Inventory

### `[biz_oil]`

| Awkward | Natural | First seen | Last drill | Status | Reps | Sources |
|---|---|---|---|---|---|---|
| invent something | make something up / come up with something | 2026-05-06 | 2026-05-06 | 🔵 active | 1 | psd |
| in the future | going forward | 2026-05-06 | — | 🔵 active | 0 | wrap |
| sit the issue unattended | let this slide / sit on this | 2026-05-09 | — | 🔵 active | 0 | fw |
| impact us mainly by delayed revenue | hit us mainly through delayed revenue | 2026-05-09 | — | 🔵 active | 0 | fw |
| always overbudget and time delay | always over budget and behind schedule | 2026-05-09 | — | 🔵 active | 0 | fw |
| bringing the issue up to the execs | getting this in front of the execs | 2026-05-09 | — | 🔵 active | 0 | fw |

### `[leisure_sport]`

| Awkward | Natural | First seen | Last drill | Status | Reps | Sources |
|---|---|---|---|---|---|---|
| race in Zwift | race on Zwift | 2026-05-06 | 2026-05-06 | 🔵 active | 1 | psd |
| my achievement of 4 years ago | my best from 4 years ago / what I hit 4 years ago | 2026-05-06 | 2026-05-06 | 🔵 active | 0 | psd |

### `[brit_expat]`

| Awkward | Natural | First seen | Last drill | Status | Reps | Sources |
|---|---|---|---|---|---|---|
| go out of my villa | leave the villa / step outside | 2026-05-06 | 2026-05-06 | 🔵 active | 1 | psd |

### `[claude_collab]`

| Awkward | Natural | First seen | Last drill | Status | Reps | Sources |
|---|---|---|---|---|---|---|
| we agreed | CC and I agreed | 2026-05-06 | 2026-05-06 | 🔵 active | 1 | wrap, psd |
| is not relevant for my context | isn't relevant to me | 2026-05-06 | 2026-05-06 | 🔵 active | 0 | wrap, psd |
| audit my mistake | review my mistake | 2026-05-06 | — | 🔵 active | 0 | wrap |
| propose whether X is relevant | tell me whether X is relevant | 2026-05-06 | — | 🔵 active | 0 | wrap |
| follow steps in the learning process | follow the learning ladder | 2026-05-06 | — | 🔵 active | 0 | wrap |
| required topics and required distribution | subtopics and type distribution | 2026-05-06 | — | 🔵 active | 0 | wrap |
| said to my notes | wrote in my notes / added to my notes | 2026-05-06 | — | 🔵 active | 0 | wrap |
| what is needed | what we need | 2026-05-06 | — | 🔵 active | 0 | wrap |
| clean these branches | clean up these branches | 2026-05-07 | — | 🔵 active | 0 | wrap |
| delete what is safe | delete whatever's safe | 2026-05-07 | — | 🔵 active | 0 | wrap |
| that's not I meant | that's not what I meant | 2026-05-07 | — | 🔵 active | 0 | wrap |
| not sure what is 'wk cats' | not sure what 'wk cats' means | 2026-05-07 | — | 🔵 active | 0 | wrap |
| you're restricted to a number of words | you have a word limit | 2026-05-07 | — | 🔵 active | 0 | wrap |
| can only test with 6 phrases | is capped at 6 phrases | 2026-05-07 | — | 🔵 active | 0 | wrap |
| a larger figure | a higher count | 2026-05-07 | — | 🔵 active | 0 | wrap |
| at par with best practices | on par with best practices | 2026-05-09 | — | 🔵 active | 0 | wrap |
| per topic vs per category, is it the same? | is per-topic the same as per-category? | 2026-05-09 | — | 🔵 active | 0 | wrap |
| forget these ideas | drop these ideas | 2026-05-09 | — | 🔵 active | 0 | wrap |
| if new info appears | if anything new comes up | 2026-05-09 | — | 🔵 active | 0 | wrap |
| I prefer to have | I'd rather just have | 2026-05-09 | — | 🔵 active | 0 | wrap |

---

## Lifecycle

See `references/coach-notes-schema.md` "Phrase tracker lifecycle" for the state machine, retest cadences (21d / 42d), and worker selection rule.

**Source codes**: `psd` = phrase_swap_drill (PWA) · `wrap` = end-of-session wrap · `fw` = free_write (CC)
