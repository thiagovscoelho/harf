# Harf

**A little Arabic, every day.**

A self-contained, keyboard-first web app for learning to read Modern Standard Arabic. It follows a simple loop: choose a set, see Arabic, type its sound, and get useful feedback. The interface and lesson data are original.

## Start reading

The easiest option is **`dist/harf.html`**. Save that file and open it in a modern web browser. It contains the interface, styles, lesson bank, answer checker, and review logic. It has no external scripts, fonts, images, or runtime dependencies. An Arabic-capable system font is used automatically.

For development, or a stable browser-storage origin, run the source version with Node.js 18 or later:

```sh
npm start
```

Then open `http://localhost:8080`. There is **no `npm install` step**: the app, build script, development server, and logic tests use no npm dependencies. The server binds to the local machine only. An occupied port can be changed with the `PORT` environment variable.

You can also open the source `index.html` directly, provided its `src` folder remains beside it. The standalone HTML file is easier to move between devices.

## What is included

| Practice | Cards | Purpose |
| --- | ---: | --- |
| Letters | 101 | Sound recognition in valid isolated, beginning, middle, and final shapes |
| Short vowels | 84 | Consonants with fatha, kasra, and damma |
| Long vowels | 84 | Contrasting `aa`, `ii`, and `uu` with short vowels |
| Combinations | 2,187 | Two-letter sound exercises with natural joining and explicit vowels or sukun |
| Words | 58 | Everyday vocabulary, nature, and actions; meanings appear after answering |
| Reading rules | 56 | Shadda, tanwin, all 14 sun and 14 moon letters, hamza seats, and special vowel spellings |
| **Total** | **2,570** | Stable, individually tracked practice cards |

The default set is six letters with all three short vowels. There are presets for familiar and distinctive sounds, plus individual letter selection. Word and rule banks are independent of the beginner letter filter so they do not unexpectedly become empty.

Combinations are explicitly **sound-building exercises**, not necessarily real words. Short and long vowel drills select consonants; a long-vowel carrier is included automatically. Bare alif is therefore not generated as an independent consonant syllable. Artificial medial hamza spellings are not generated.

## Typing convention

Harf uses its own practical ASCII sound notation, rather than claiming to implement a universal romanization standard.

| Sound or symbol | Main input | Alternative input |
| --- | --- | --- |
| Short vowels | `a`, `i`, `u` | — |
| Long vowels | `aa`, `ii`, `uu` | — |
| ث ذ ش خ غ | `th`, `dh`, `sh`, `kh`, `gh` | — |
| ح | `H` | `7` or `h.` |
| ص | `S` | `s.` |
| ض | `D` | `d.` |
| ط | `T` | `t.` |
| ظ | `Z` | `dh.` or `z.` |
| ع | `3` | — |
| ء | `'` | `2` |

Ordinary consonants use their familiar lowercase Latin equivalents. The in-app guide contains the complete map and pronunciation notes. The special-sound buttons insert characters at the cursor, which is useful on a phone.

**Case is meaningful.** `H` and `h`, for example, do not represent the same sound. This distinction is not discarded by the answer checker. Dot and numeric aliases work inside words: `ba7r` and `bah.r` both match `baHr`.

Spaces and hyphens are ignored, and curly apostrophes are accepted. Unrecognized punctuation is not silently discarded. Vowel length and consonant doubling are checked.

### Reading conventions

Arabic vowel marks remain visible: this is a decoding trainer, not a guessing exercise over unvoweled text. A card always has an explicit answer key.

The Letters drill tests **sounds, not letter names**: ب is `b`, not `baa`. Bare ا represents `aa` in that drill; و and ي represent consonant `w` and `y`. Their vowel uses are taught separately.

Noun vocabulary cards use pause forms, often with an explicit final sukun for clarity. Verb cards retain all their displayed vowels. Taa marbuta at a pause accepts `a` or `ah`, but not `at`. Tanwin cards explicitly instruct the learner to pronounce the ending; `madrasatun` is consequently distinct from `madrasa`.

Sun-letter cards require the assimilated sound: `ash-shams`, not `al-shams`. The doubled consonant is preserved, including complete digraphs. Cards start afresh: cross-word hamzat-al-wasl linking is outside the scope of this version.

Initial hamza is optional on vowel-bearing cards, but not inside or at the end of a word. `akala` and `'akala` both work; `saala` does not match `sa'ala`. A standalone hamza requires `'` or `2`. A hamza following the article is internal and must still be written: `al-'arD`.

## Practice and progress

Press **Enter** to check, and Enter again to continue. Sessions contain 10, 20, or 50 cards, or can be endless. The flag button ends a session and opens its summary. Automatic advance is optional and occurs only after a clean correct answer; a hint, retry, reveal, or skip always leaves time to read the feedback.

The alphabet reference includes letter shapes, sound descriptions, vowel examples, a search field, and a “practice this sound” shortcut. Settings include light, dark, or device-matched appearance, Arabic font style, daily goal, session length, and scheduling behavior.

Adaptive practice favors new or due cards. Missed cards return after two intervening cards when the set is large enough. Immediate repeats are avoided when alternatives exist. Turning adaptation off gives shuffled rounds without replacement.

A **clean** answer is correct on the first try with no hint or guide use. Hints, guide use, retries, reveals, and skips are recorded as assisted. Repeated guesses at one card are counted once when it is completed, not as multiple cards. An attempted or assisted card abandoned by changing the session is settled as a skip. An untouched card is not counted.

Clean recalls advance a simple review box through intervals of 10 minutes, 1 day, 3 days, 7 days, and 21 days. An assisted result returns the card to the first box. “Comfortable” means at least three clean recalls in a row; it is a heuristic, **not a proficiency certification**. Practice is never blocked because a card is not due.

Daily goals count all completed cards, including assisted practice. The progress page shows first-try accuracy, best session streak, distinct cards explored, weekly activity, and a focused review set.

## Storage and privacy

No account, API key, backend, analytics, microphone, or audio service is used. During practice the app makes **no network requests**. The About dialog contains external reference links; those navigate to other sites only when clicked.

Settings and completed-card history are stored under `harf.reader.v1` in `localStorage`. The current in-progress sequence is not resumed after reloading. Browser data is local to its browser profile and origin; it is not cloud-synced.

Storage for `file:` URLs varies by browser. Renaming or moving a standalone HTML file may also change its storage context. For consistent storage, use the local server or a fixed static-hosting URL. **Export a JSON backup** before clearing browser data or switching devices. Import validates the file and requests confirmation before replacing the profile; it does not merge profiles.

When storage is blocked, unavailable, or full, the practice session continues and displays a warning. An export can still preserve the current in-memory profile. Use one active practice tab per origin to avoid competing writes.

## Development

```sh
npm test       # Dependency-free answer/data/scheduler/storage tests
npm run build  # Rebuild dist/harf.html
npm start      # Serve index.html and src on localhost:8080
```

| File | Responsibility |
| --- | --- |
| `index.html` | Semantic app shell and view containers |
| `src/styles.css` | Responsive layout, themes, focus styles, and Arabic typography |
| `src/data.js` | Letter inventory, generators, curated vocabulary/rules, and references |
| `src/core.js` | Pure answer checking, deck filtering, scheduling, stats, and validation |
| `src/app.js` | Browser interaction, dialogs, settings, persistence, and import/export |
| `tools/build.cjs` | Creates one standalone HTML file without a bundler |
| `tools/serve.cjs` | Local development server |
| `tests/` | Logic and optional browser integration tests |

Add vocabulary with `word(...)` and reading rules with `rule(...)` in `src/data.js`. Give each card a unique stable ID, Arabic text, an ASCII answer, a precise reading convention, and a helpful explanation. Keep existing IDs stable so saved practice records retain their meaning. Run the tests and rebuild after editing.

For deployment, upload `dist/harf.html` as `index.html` to a static host, or publish the root `index.html` together with `src/`. Do not use the local development server as a production internet-facing service.

## Scope and references

This version trains recognition and typed decoding. It does **not** listen to or grade speech, supply native-speaker audio, infer vowels in arbitrary text, teach dialects, or implement a full grammar/tajweed course. Text descriptions cannot replace listening to actual Arabic speakers. Lesson data is original and reference-informed, but has not been independently certified by an Arabic-language teacher.

Foundational reading references used for the teaching conventions:

- [Madinah Arabic: reading course](https://madinaharabic.com/free-content/reading)
- [Madinah Arabic: sukun and shadda](https://madinaharabic.com/free-content/reading/lesson-1/part-14)
- [Madinah Arabic: moon and sun letters](https://madinaharabic.com/free-content/grammar/lesson-3/part-7)
- [University of Oregon: short vowels](https://opentext.uoregon.edu/introarabic/chapter/alphabet-short-vowels/)
- [Lebanese Arabic Institute: Arabic phonology and orthography](https://www.lebanesearabicinstitute.com/arabic-alphabet/) — the Modern Standard Arabic sections, not dialect sections
- [MDN: localStorage behavior, including local files](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

See **`TESTING.md`** for the executed checks and their limits. MIT licensed; see `LICENSE`.
