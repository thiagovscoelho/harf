# Test report

## Executed checks

**22 dependency-free Node tests pass** with `npm test`. They cover every card's canonical answer and aliases, stable IDs, valid letter shapes, alphabet/vowel filtering, lowercase/emphatic distinctions, vowel length, hamza position, shadda, tanwin, pause forms, article assimilation, all sun/moon-letter examples, review scheduling, statistics, profile validation, and failed/corrupt storage.

The Chromium browser smoke suite passes for the application bundle. It covers correct and incorrect submissions, retry counting, hints and reveals, keypad insertion, letter presets, empty-deck recovery, word/rule categories, alphabet search and letter details, dialogs, settings, dark mode, complete sessions, summaries, progress review, export, malformed-import rejection, confirmed import, and state serialization/reinitialization. Desktop (1440px), tablet (768px), and phone (390px) layouts were checked for horizontal overflow.

An additional renderer edge suite passes. It checks automatic advance and cancellation, waiting after assisted answers, one-time recording of abandoned attempts, the last-vowel guard, dialog overflow at widths from 320 to 768px, native dialog keyboard-focus containment, every curated Arabic word fitting at 320px, and graceful operation when native localStorage is denied.

No JavaScript page errors or external practice requests were observed in these browser checks. The standalone bundle also rendered and graded an answer with network access disabled. Desktop, mobile, and dark-mode screens were visually inspected.

## Important limitation of this run

The execution environment's managed Chromium policy blocks normal navigation to **all HTTP and local-file URLs**. It was not changed. Consequently the browser suites were run by loading the self-contained HTML into a renderer with `set_content`.

For persistence-related integration checks, the main suite injects an in-memory Storage adapter before loading the unmodified app. Serializing a profile and reinitializing from it tests the app's save/load contract, but does **not** verify real browser disk persistence. A separate check uses the renderer's actual, denied localStorage to verify the fallback. Native file/HTTP navigation, OS-specific Arabic font availability, and browser-backed persistence should still be checked in the target browser.

These are Chromium checks, not a claim of independently tested Safari/Firefox support or a full accessibility audit. No native-speaker certification of the lesson bank is claimed. The local development HTTP server was separately checked for delivery of the app resources.

## Reproduce

The core tests require only Node.js 18+:

```sh
npm test
```

The optional browser tests require Python, Playwright, and a Chromium installation. These are test dependencies only and are not used by the web app:

```sh
python -m pip install playwright
python -m playwright install chromium
npm run build
npm start
# In a second terminal:
python tests/browser_smoke.py
```

`HARF_URL` changes the server URL, and `CHROMIUM_PATH` selects a browser executable. The default runner uses the Chromium installed by Playwright unless `CHROMIUM_PATH` is specified.

For a navigation-restricted renderer, the exact test mode used here is:

```sh
CHROMIUM_PATH=/usr/bin/chromium HARF_RENDER_ONLY=1 python tests/browser_smoke.py
CHROMIUM_PATH=/usr/bin/chromium python tests/browser_edges.py
```

The edge suite is explicitly renderer-only. Test screenshots, JSON exports, and reports are written under `test-results/`. A standalone screenshot of the interface is included as `preview.png`.

## Suggested target-browser check

Open the downloaded `dist/harf.html`, complete two cards, reload, and check the totals. Export the profile, open the app from a fixed local HTTP address, import the profile, and confirm the totals match. Check the script's vowel marks and joins in the target operating system's Arabic fonts. This covers the native storage/navigation/font behaviors the restricted test environment could not establish.
