"""Renderer-only edge checks for the offline bundle. See TESTING.md."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import os

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'dist'/'harf.html').read_text()
SHIM="""<script>Object.defineProperty(window,'localStorage',{configurable:true,value:{v:null,getItem(){return this.v},setItem(k,v){this.v=v}}});</script>"""
with sync_playwright() as p:
    browser_path=os.environ.get('CHROMIUM_PATH')
    b=p.chromium.launch(**({'executable_path':browser_path} if browser_path else {}),headless=True,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(HTML.replace('<head>','<head>'+SHIM))
    def current(): return page.locator('#arabic-prompt').get_attribute('data-card-id')
    def correct():
        answer=page.evaluate("HarfCore.cardMap.get(document.getElementById('arabic-prompt').dataset.cardId).answer")
        page.locator('#answer-input').fill(answer)
        page.locator('#answer-input').press('Enter')
    def click_action(action): page.locator(f'[data-action="{action}"]:visible').first.click()

    # Auto-advance occurs only on a clean answer, and pauses for a modal or hidden page.
    click_action('settings')
    page.locator('#setting-auto').check()
    page.locator('#settings-form button[type="submit"]').click()
    old=current();correct();page.wait_for_timeout(1400)
    assert current()!=old
    old=current();correct();click_action('guide');page.wait_for_timeout(1400)
    assert current()==old
    page.keyboard.press('Escape')
    page.locator('#check-button').click()
    old=current()
    page.locator('#answer-input').fill('wrong');page.locator('#answer-input').press('Enter');correct()
    page.wait_for_timeout(1400)
    assert current()==old
    page.locator('#check-button').click()

    # An unfinished failed card is settled exactly once when switching modes.
    page.locator('#answer-input').fill('wrong');page.locator('#answer-input').press('Enter')
    before=page.evaluate('HarfCore.totals(JSON.parse(localStorage.v)).seen')
    page.locator('[data-mode="words"]').click()
    after=page.evaluate('HarfCore.totals(JSON.parse(localStorage.v)).seen')
    assert after==before+1
    page.locator('[data-mode="short"]').click()
    assert page.evaluate('HarfCore.totals(JSON.parse(localStorage.v)).seen')==after

    # The final vowel cannot be deselected accidentally.
    page.locator('[data-vowel="i"]').click();page.locator('[data-vowel="u"]').click()
    page.locator('[data-vowel="a"]').click()
    assert page.locator('[data-vowel="a"]').get_attribute('aria-pressed')=='true'
    assert 'at least one vowel' in page.locator('#toast').inner_text()

    # Modal controls stay within small viewports, and native dialog traps keyboard focus.
    for width in [320,390,560,768]:
        page.set_viewport_size({'width':width,'height':844})
        for action in ['guide','settings','letters']:
            click_action(action)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            assert page.evaluate('document.getElementById("modal").scrollWidth <= document.getElementById("modal").clientWidth'), (width,action)
            for _ in range(15): page.keyboard.press('Tab')
            assert page.evaluate('document.getElementById("modal").contains(document.activeElement)')
            page.keyboard.press('Escape')

    # Every curated word fits at the minimum supported phone width.
    page.set_viewport_size({'width':320,'height':844})
    page.locator('[data-mode="rules"]').click()
    fits=page.evaluate("""() => {
        const el=document.getElementById('arabic-prompt');
        return HarfData.cards.filter(c=>['words','rules'].includes(c.mode)).map(c=>{
            el.textContent=c.ar;
            return {id:c.id,fit:el.scrollWidth<=el.clientWidth+1};
        });
    }""")
    assert all(x['fit'] for x in fits),[x for x in fits if not x['fit']]

    # Native localStorage is blocked on this renderer's opaque origin. Graceful fallback works.
    blocked=b.new_page()
    blocked.set_content(HTML)
    assert blocked.locator('#storage-label').inner_text()=='Session-only progress'
    answer=blocked.evaluate("HarfCore.cardMap.get(document.getElementById('arabic-prompt').dataset.cardId).answer")
    blocked.locator('#answer-input').fill(answer);blocked.locator('#answer-input').press('Enter')
    assert 'Nicely read' in blocked.locator('#feedback').inner_text()
    assert 'storage is unavailable' in blocked.locator('#toast').inner_text()
    assert not errors,errors
    print(json.dumps({'status':'passed','checks':['auto-advance and cancellation','assisted answer waits','abandoned attempt recorded once','last-vowel guard','320–768px dialog overflow','modal focus containment','all curated Arabic words fit at 320px','native storage-denied fallback'],'javascript_errors':errors},indent=2))
    b.close()
