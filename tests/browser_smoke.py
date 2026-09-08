"""Optional end-to-end tests. Requires Python Playwright and Chromium.
Run npm start first, then: python tests/browser_smoke.py
Set HARF_URL or CHROMIUM_PATH to override the defaults.
"""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get('HARF_URL', 'http://127.0.0.1:8080')
RENDER_ONLY = os.environ.get('HARF_RENDER_ONLY') == '1'
BROWSER = os.environ.get('CHROMIUM_PATH')
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'test-results'
OUT.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(**({'executable_path':BROWSER} if BROWSER else {}), headless=True, args=['--no-sandbox'])
    context = browser.new_context(viewport={'width':1440, 'height':1040}, reduced_motion='reduce')
    page = context.new_page()
    page.set_default_timeout(8000)
    errors = []
    external = []
    page.on('pageerror', lambda err: errors.append(str(err)))
    page.on('request', lambda req: external.append(req.url) if not req.url.startswith(BASE) and not req.url.startswith('data:') else None)
    def load_rendered(target, seed=None):
        # For locked-down renderers that prohibit all URL/file navigation.
        # An in-memory Storage adapter tests the UI/storage integration, not native persistence.
        shim = """<script>
        (function() {
          const values = new Map(Object.entries(SEED));
          Object.defineProperty(window, 'localStorage', {configurable: true, value: {
            getItem(key) { return values.has(key) ? values.get(key) : null; },
            setItem(key, value) { values.set(String(key), String(value)); },
            removeItem(key) { values.delete(key); },
            clear() { values.clear(); }
          }});
        })();
        </script>""".replace('SEED', json.dumps(seed or {}))
        html = (ROOT/'dist'/'harf.html').read_text()
        target.set_content(html.replace('<head>', '<head>' + shim), wait_until='load')
    if RENDER_ONLY:
        load_rendered(page)
    else:
        page.goto(BASE)
    page.wait_for_selector('#arabic-prompt[data-card-id]')
    page.screenshot(path=str(OUT/'desktop-initial.png'),full_page=True)
    assert page.locator('.mode-button[aria-pressed="true"]').inner_text().startswith('Short vowels')
    assert page.locator('.letter-chip').count()==6
    assert page.locator('#question-count').inner_text()=='1 / 20'

    def current_answer():
        return page.evaluate("HarfCore.cardMap.get(document.getElementById('arabic-prompt').dataset.cardId).answer")
    def record_total():
        return page.evaluate("HarfCore.totals(JSON.parse(localStorage.getItem(HarfCore.STORAGE_KEY))).seen")
    def correct():
        page.locator('#answer-input').fill(current_answer())
        page.locator('#answer-input').press('Enter')
    def advance():
        page.locator('#check-button').click()

    # Empty input does not count; an unassisted correct answer counts exactly once.
    page.locator('#answer-input').press('Enter')
    assert 'Type a sound first' in page.locator('#feedback').inner_text()
    correct()
    assert 'Nicely read' in page.locator('#feedback').inner_text()
    assert record_total()==1
    assert page.locator('#session-streak').inner_text()=='1'
    advance()
    assert record_total()==1

    # Retries count as one reviewed card, not multiple attempts or a clean answer.
    page.locator('#answer-input').fill('wrong')
    page.locator('#answer-input').press('Enter')
    assert page.locator('#answer-input').get_attribute('aria-invalid')=='true'
    correct()
    assert 'You got there' in page.locator('#feedback').inner_text()
    assert record_total()==2
    assert page.locator('#session-accuracy').text_content()=='50%'
    advance()

    # Reveal and hint are explicitly assisted; keyboard helpers insert at the cursor.
    page.locator('[data-insert="H"]').click()
    assert page.locator('#answer-input').input_value()=='H'
    page.locator('#hint-button').click()
    assert 'assisted' in page.locator('#feedback').inner_text()
    correct()
    assert record_total()==3
    advance()
    page.locator('#reveal-button').click()
    assert record_total()==4
    assert page.locator('#answer-input').get_attribute('readonly') is not None
    advance()

    # Empty selections are protected, but impossible shapes give a helpful empty deck.
    page.locator('[data-action="letters"]:visible').first.click()
    page.locator('[data-preset="none"]').click()
    assert page.locator('#apply-letters').is_disabled()
    page.locator('[data-preset="all"]').click()
    assert page.locator('#apply-letters').is_enabled()
    page.locator('#apply-letters').click()
    assert page.locator('.letter-chip').count()==13
    assert not page.locator('#modal').is_visible()
    page.locator('[data-mode="letters"]').click()
    page.locator('[data-action="letters"]:visible').first.click()
    page.locator('[data-preset="none"]').click()
    page.locator('input[name="letter"][value="alif"]').check()
    page.locator('input[name="form"][value="isolated"]').uncheck()
    page.locator('input[name="form"][value="medial"]').check()
    page.locator('#apply-letters').click()
    assert page.locator('#empty-deck').is_visible()
    page.locator('#empty-action').click()
    page.locator('[data-preset="starter"]').click()
    page.locator('input[name="form"][value="medial"]').uncheck()
    page.locator('input[name="form"][value="isolated"]').check()
    page.locator('#apply-letters').click()

    # Words/rules use independent curated banks, unaffected by a tiny letter selection.
    page.locator('[data-mode="words"]').click()
    assert page.locator('#empty-deck').is_hidden()
    page.locator('#category-select').select_option('actions')
    assert '14 curated cards' in page.locator('#set-content').inner_text()
    correct()
    assert '—' in page.locator('#feedback').inner_text()
    advance()
    page.locator('[data-mode="rules"]').click()
    page.locator('#category-select').select_option('article')
    assert '28 curated cards' in page.locator('#set-content').inner_text()
    correct()
    assert 'Nicely read' in page.locator('#feedback').inner_text()

    # Letter reference and the practice-this-letter shortcut.
    page.locator('.nav-item[data-view="alphabet"]').click()
    assert page.locator('.alphabet-tile').count()==29
    page.locator('#alphabet-search').fill('kh')
    assert page.locator('.alphabet-tile').count()==1
    page.locator('.alphabet-tile').click()
    assert page.locator('#modal-title').inner_text()=='Khaa'
    page.locator('[data-practice-letter="kha"]').click()
    assert 'Khaa' not in page.locator('#arabic-prompt').inner_text()
    assert page.locator('.letter-chip').count()==1

    # Keyboard guide has a native modal focus trap and closes with Escape.
    page.locator('.topbar [data-action="guide"]').click()
    assert page.locator('#modal').is_visible()
    assert 'Capital letters matter' in page.locator('#modal-body').inner_text()
    page.keyboard.press('Escape')
    assert page.locator('#modal').is_hidden()

    # Settings change length, enable dark mode, and support a complete ten-card session.
    page.locator('[data-action="settings"]').click()
    page.locator('#setting-length').select_option('10')
    page.locator('#setting-theme').select_option('dark')
    page.locator('#setting-adaptive').uncheck()
    page.locator('#settings-form button[type="submit"]').click()
    assert page.locator('html').get_attribute('data-theme')=='dark'
    assert page.locator('#question-count').inner_text()=='1 / 10'
    for i in range(10):
        correct()
        advance()
    assert page.locator('#modal').is_visible()
    assert page.locator('#modal-eyebrow').inner_text()=='SESSION COMPLETE'
    assert '100%' in page.locator('.summary-stats').inner_text()
    page.screenshot(path=str(OUT/'session-summary-dark.png'),full_page=True)
    page.locator('[data-action="summary-progress"]').click()
    assert page.locator('#progress-view').is_visible()
    assert page.locator('.metric-card').count()==4
    assert page.locator('.week-day').count()==7
    assert page.locator('[data-action="review-all"]').is_visible()
    page.locator('[data-action="review-all"]').click()
    assert page.locator('#review-label').is_visible()
    assert 'Focused review' in page.locator('#set-content').inner_text()

    # Completed history and settings survive a reload.
    total=record_total()
    if RENDER_ONLY:
        seed=page.evaluate('({[HarfCore.STORAGE_KEY]:localStorage.getItem(HarfCore.STORAGE_KEY)})')
        page.goto('about:blank')
        load_rendered(page,seed)
    else:
        page.reload()
    assert record_total()==total
    assert page.locator('html').get_attribute('data-theme')=='dark'
    assert page.locator('#question-count').inner_text()=='1 / 10'

    # Export a valid profile and reject a malformed import without losing progress.
    page.locator('[data-action="settings"]').click()
    with page.expect_download() as dl:
        page.locator('#modal [data-action="export"]').click()
    downloaded=dl.value
    backup_path=OUT/'exported-progress.json'
    downloaded.save_as(str(backup_path))
    backup=json.loads(backup_path.read_text())
    assert backup['app']=='harf' and backup['version']==1
    invalid=OUT/'invalid.json'
    invalid.write_text('{"app":"not-harf","version":1}')
    page.locator('#import-file').set_input_files(str(invalid))
    page.wait_for_timeout(150)
    assert record_total()==total
    assert 'Could not import' in page.locator('#toast').inner_text()
    # Valid import must ask for confirmation and must restore the total.
    page.locator('#import-file').set_input_files(str(backup_path))
    page.wait_for_selector('[data-action="import-confirm"]')
    page.locator('[data-action="import-confirm"]').click()
    assert record_total()==total
    assert not page.locator('#modal').is_visible()

    # Restore light appearance and the starter set for viewport checks.
    page.locator('[data-action="settings"]').click()
    page.locator('#setting-theme').select_option('light')
    page.locator('#setting-length').select_option('20')
    page.locator('#settings-form button[type="submit"]').click()
    page.locator('[data-action="letters"]:visible').first.click()
    page.locator('[data-preset="starter"]').click()
    page.locator('#apply-letters').click()
    page.locator('[data-mode="short"]').click()
    for width,height,name in [(390,844,'mobile'),(768,1024,'tablet'),(1440,1040,'desktop')]:
        page.set_viewport_size({'width':width,'height':height})
        page.screenshot(path=str(OUT/f'{name}.png'),full_page=True)
        overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth')
        assert not overflow, f'{name} must not overflow horizontally'
        assert page.locator('#arabic-prompt').is_visible()
    assert not errors,errors
    assert not external,external

    # Single-file artifact opens directly and works with no network connection.
    offline=browser.new_context(viewport={'width':1440,'height':1000},offline=True)
    off=offline.new_page()
    if RENDER_ONLY:
        load_rendered(off)
    else:
        off.goto((ROOT/'dist'/'harf.html').as_uri())
    off.wait_for_selector('#arabic-prompt[data-card-id]')
    answer=off.evaluate("HarfCore.cardMap.get(document.getElementById('arabic-prompt').dataset.cardId).answer")
    off.locator('#answer-input').fill(answer)
    off.locator('#answer-input').press('Enter')
    assert 'Nicely read' in off.locator('#feedback').inner_text()
    print(json.dumps({'status':'passed','javascript_errors':errors,'external_requests':external,'persisted_completions':total,'viewports':[390,768,1440],'offline_bundle_rendering':'passed','navigation_mode':'renderer harness with Storage adapter' if RENDER_ONLY else 'HTTP and file URLs'},indent=2))
    browser.close()
