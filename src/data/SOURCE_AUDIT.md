# Source audit — bundled scripture & commentary

**Not legal advice.** This file is an engineering inventory plus risk notes for your counsel. App Store / Play review does not replace copyright clearance for third-party text.

## Policy goal

Ship only layers you can **redistribute in the client** with a **documented** chain: license file in-repo, permission letter, or verified public-domain / government-open edition with citation.

## Bundled text assets (inventory)


| Asset                                                                   | Role                                                                                         | Documented license in-repo?                                                                                      | Risk note                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bhagavad-gita.json`                                                    | Sanskrit, transliteration, `translation_english`, `word_meanings`, verse-level English notes | **No** single LICENSE block inside this file tying English to a named PD/edition                                 | English gloss + translation style can resemble **copyrighted modern editions** (e.g. widely distributed ISKCON/BBT-style layouts). **Do not** assume “scripture = PD” for a particular English rendering.                      |
| `purports.json`                                                         | English “spiritual meaning”, “in your life”, extended commentary strings                     | **No** provenance header in file                                                                                 | Long “Extended Commentary” blocks need **traceable** origin (PD scan, publisher license, or your own copy).                                                                                                                    |
| `purports_hi.json`                                                      | Hindi extended purport / ṭīkā-style text                                                     | Partially implied by app copy (Ramsukhdas tradition); **verify byte-for-byte** match to a redistributable source | Gita Press / major publishers often restrict commercial reuse; **Unlicense** applies only to text **actually** taken from [The Gita Initiative](https://github.com/gita/gita) (or another open repo), not to “any Hindi Gita”. |
| `src/data/languages/hi.json` (and related)                              | UI strings; may name translators                                                             | N/A (your strings)                                                                                               | Keep attributions **accurate**; do not claim Unlicense for text that did not come from that repo.                                                                                                                              |
| Chapter summaries / titles (if loaded from shared JSON with Initiative) | Metadata                                                                                     | Matches **gita/gita** only if imported from that repo                                                            | Confirm import path in your ETL docs.                                                                                                                                                                                          |
| `public/audio/`** (if ever bundled; `.gitignore` may exclude)           | TTS / narration                                                                              | Per file / per vendor                                                                                            | Voice + **script** read aloud both need rights.                                                                                                                                                                                |


## What is **not** in this repo (from this audit)

- **GPL** commentary database (e.g. `vedicscriptures/bhagavad-gita-data`) — referenced in `verseTextProvenance.ts` as **not** for blind client embed. No evidence in `src/data/*.json` of that corpus being bundled.

## Recommended actions before treating the build as “safe”

1. **English verse layer** — Either: (a) written permission from rights holder, (b) replace `translation_english` / `word_meanings` with a **named** public-domain English translation (e.g. Wikisource-sourced Arnold / Besant / Telang, each with its own copyright rules—verify), or (c) commission original translation and keep work-for-hire documentation.
2. **Purports** — Trace each extended block to a source; remove or replace anything without clearance. Short, original summaries you wrote are lower risk than long third-party commentary.
3. **Hindi pack** — If you rely on **The Gita Initiative**, keep a copy of their `LICENSE`/Unlicense text in-repo and a short `IMPORT_LOG.md` stating commit hash / date of export.
4. **Product copy** — Align `gita_master_manifest.md`, paywall strings, and store listings with **only** what is documented after the steps above (avoid “classical scholarly” unless true and cited).

## Secrets (non-copyright but critical)

Firebase / service account JSON patterns belong in `.gitignore` (already listed). If any key was ever pushed to a remote, **rotate** it; ignoring locally is not enough for history.

## Maintainer checklist

- Counsel sign-off on English `bhagavad-gita.json` layer  
- Counsel sign-off on `purports.json` / `purports_hi.json`  
- Import log + LICENSE for Hindi if sourced from gita/gita  
- Store listing text matches this audit

