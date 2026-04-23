# Source audit — bundled scripture & commentary

**Not legal advice.** Engineering inventory plus risk notes for your counsel. App Store / Play review does not replace copyright clearance for third-party text.

## Policy goal

Ship only layers you can **redistribute in the client** with a **documented** chain: license file in-repo, permission letter, or verified public-domain / government-open edition with citation.

## Bundled text assets (inventory)

| Asset | Role | Documented license in-repo? | Risk note |
|--------|------|------------------------------|-----------|
| `bhagavad-gita.json` | Sanskrit, transliteration, `translation_english`, `word_meanings` | Align with whatever edition you actually ship | If `translation_english` was synced from **The Gita Initiative** (`github.com/gita/gita`, Unlicense), keep their `LICENSE` + an import note (commit hash / date). Do not claim Unlicense for bytes that did not come from that repo. |
| `purports.json` | Optional English commentary strings | Per-file | Long third-party commentary needs traceable rights or your own writing. |
| `purports_hi.json` | Optional Hindi extended purport | Only if present & sourced | If bundled, verify match to a redistributable edition (e.g. Initiative pack), not “any Hindi Gita.” |
| `commentary.json` | Verse-level “spiritual meaning” copy in app | Per-file | Treat like any other expressive text: document source or write originals. |
| `src/data/languages/hi.json` | UI strings; may name translators | N/A | Keep attributions accurate. |
| Chapter summaries / titles | Metadata | Matches Initiative only if imported from `gita/gita` | Confirm ETL path. |
| `public/audio/` (if bundled) | TTS / narration | Per asset | Voice + script both need rights. |

## What is **not** in this repo (typical)

- **GPL** commentary database (e.g. `vedicscriptures/bhagavad-gita-data`) — not for blind client embed without a separate compliance story.

## Recommended actions before calling the build “cleared”

1. **English verse layer** — Document the exact source for `translation_english` / gloss fields (Initiative export, PD edition + citation, publisher permission, or commissioned work).
2. **Commentary / purports** — Same: trace or replace with safe copy.
3. **Hindi pack** — If from **The Gita Initiative**, keep `LICENSE` (Unlicense) + short `IMPORT_LOG.md` (commit hash / export date).
4. **Store & marketing copy** — Must match what is actually bundled (`docs/MARKETING_LAUNCH_KIT.md`, store listings).

## Secrets (non-copyright but critical)

Service account JSON and raw API keys belong in **environment / secret managers**, not in git. If a key was ever committed, **rotate** it; `.gitignore` alone does not fix history.

## Maintainer checklist

- [ ] Counsel or publisher sign-off on English + commentary layers you ship  
- [ ] Import log + LICENSE for any Initiative-sourced pack  
- [ ] Store listing text matches this audit and `docs/STORE_LAUNCH_CHECKLIST.md`  
