# Doc style

Caps (CI-enforced via `node tools/check_doc_caps.js`): CLAUDE.md 550, SKILL 800.
The last 30 words below each cap are reserved buffer — landing inside it also fails CI.
References are uncapped; courtesy ceilings: schema ≲3000, design ≲2500.
Verify with the node checker, not `wc -w` (git-bash undercounts em-dashes and Cyrillic).
Editing: net word count never increases unless adding new info.
Trim safety: cap trims never remove Forbidden items, operational-rules cross-references, or Firestore write-field lists — diff-review those sections on any trim. A 2026-05-20 trim compressed a write-field list hours before that write path wiped a player doc (`references/bug-log.md`).
No headers for <3 paragraphs. Bullets for ≥3 parallel items only.
Audience knows the project — skip preamble, restating, caveats.
History goes in design-decisions.md; never inline.
Banned: "note that", "Important:", "(legacy)", parenthetical dates.
