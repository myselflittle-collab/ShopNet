"""Interaction test: walk, look, keys, collision, hover preview, open shop, filters, cart, return to exact pose."""
import json, sys, time
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
OUT = sys.argv[2] if len(sys.argv) > 2 else "."
errors = []

def W(pg):
    return pg.evaluate("() => { const w = window.__shopnet.walker; return {x:w.x,z:w.z,yaw:w.yaw,pitch:w.pitch} }")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome",
        args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    pg.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
    pg.goto(URL)
    pg.wait_for_selector(".loading.is-done", state="attached", timeout=60000)
    pg.wait_for_timeout(1500)
    pg.screenshot(path=f"{OUT}/01-entrance.png")
    r = {"start": W(pg)}
    r["fps_in_this_test_browser"] = pg.evaluate("() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(Math.round(n / ((performance.now() - t0) / 1000))); }; requestAnimationFrame(f); })")

    # scroll up = walk forward
    pg.mouse.move(720, 450)
    for _ in range(8):
        pg.mouse.wheel(0, -120); pg.wait_for_timeout(60)
    pg.wait_for_timeout(1800)
    r["afterScrollUp"] = W(pg)
    pg.screenshot(path=f"{OUT}/02-walked.png")
    # scroll down = walk back
    for _ in range(3):
        pg.mouse.wheel(0, 120); pg.wait_for_timeout(60)
    pg.wait_for_timeout(1500)
    r["afterScrollDown"] = W(pg)

    # drag to look left
    pg.mouse.move(720, 450); pg.mouse.down(); pg.mouse.move(520, 440, steps=12); pg.mouse.up()
    pg.wait_for_timeout(500)
    r["afterDrag"] = W(pg)
    pg.screenshot(path=f"{OUT}/03-look-left.png")

    # keyboard + collision: strafe hard into the left side for 4 s
    pg.keyboard.down("KeyA"); pg.wait_for_timeout(4000); pg.keyboard.up("KeyA")
    pg.keyboard.down("KeyW"); pg.wait_for_timeout(800); pg.keyboard.up("KeyW")
    pg.wait_for_timeout(600)
    r["afterKeys"] = W(pg)

    # guided walk to Women's Blazers, then hover the display
    pg.get_by_role("button", name="Walk to Women's Blazers").click()
    pg.wait_for_timeout(2400)
    pg.mouse.move(700, 470, steps=6)
    pg.wait_for_timeout(900)
    pg.screenshot(path=f"{OUT}/04-hover-preview.png")
    r["previewVisible"] = pg.evaluate("() => document.querySelector('.preview-card')?.dataset.visible")
    r["previewText"] = pg.evaluate("() => document.querySelector('.preview-card')?.innerText.slice(0,160)")

    # moving the mouse slightly must keep the preview
    pg.mouse.move(760, 500, steps=8); pg.wait_for_timeout(400)
    r["previewStableAfterMove"] = pg.evaluate("() => document.querySelector('.preview-card')?.dataset.visible")

    # a drag over the display must NOT open it
    before = pg.url
    pg.mouse.move(700, 470); pg.mouse.down(); pg.mouse.move(640, 470, steps=6); pg.mouse.up()
    pg.wait_for_timeout(1200)
    r["urlAfterDrag"] = pg.url
    # look back at the display and wait for the highlight again
    pg.mouse.move(700, 470); pg.mouse.down(); pg.mouse.move(760, 470, steps=6); pg.mouse.up()
    pg.wait_for_timeout(700)
    pg.mouse.move(705, 475, steps=3); pg.wait_for_timeout(700)

    poseBefore = W(pg)
    r["poseBeforeOpen"] = poseBefore
    pg.mouse.click(705, 475)
    pg.wait_for_url("**/shop/women/blazers", timeout=8000)
    pg.wait_for_timeout(900)
    r["shopUrl"] = pg.url
    r["savedPose"] = pg.evaluate("() => JSON.parse(sessionStorage.getItem('shopnet:savedPose'))")
    r["gridCount"] = pg.locator("article.card").count()
    pg.screenshot(path=f"{OUT}/05-shop.png")

    # filters + sort
    pg.locator("aside").get_by_role("button", name="M", exact=True).click()
    pg.select_option("#sort", "priceAsc")
    pg.wait_for_timeout(300)
    prices = pg.evaluate("() => [...document.querySelectorAll('article.card .tabular-nums span:first-child')].map(e => +e.textContent.replace(/[^0-9]/g,''))")
    r["filteredCount"] = len(prices)
    r["sortedAsc"] = prices == sorted(prices)
    # add to cart
    card = pg.locator("article.card").first
    card.locator("[aria-label='Size'] button").first.click()
    card.get_by_role("button", name="Add to cart").click()
    pg.wait_for_timeout(300)
    r["toast"] = pg.locator(".toast").inner_text()
    r["bag"] = pg.locator(".shop-head .chip").inner_text()
    pg.screenshot(path=f"{OUT}/06-shop-filtered.png")

    # close and return
    pg.get_by_role("button", name="Back to mall").first.click()
    pg.wait_for_url(URL.rstrip("/") + "/", timeout=8000)
    pg.wait_for_timeout(2200)
    r["poseAfterReturn"] = W(pg)
    r["mode"] = pg.evaluate("() => document.querySelector('.mall-stage').className")
    pg.screenshot(path=f"{OUT}/07-returned.png")

    # deep link
    pg.goto(URL.rstrip("/") + "/shop/women/blazers")
    pg.wait_for_timeout(2500)
    r["deepLinkCards"] = pg.locator("article.card").count()

    # mobile viewport
    m = b.new_page(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    m.on("pageerror", lambda e: errors.append(f"mobile pageerror: {e}"))
    m.goto(URL); m.wait_for_selector(".loading.is-done", state="attached", timeout=60000); m.wait_for_timeout(1500)
    m.screenshot(path=f"{OUT}/08-mobile.png")
    b.close()

def same(a, b): return all(abs(a[k]-b[k]) < 1e-9 for k in ("x","z","yaw","pitch"))
r["exactReturn"] = same(r["poseBeforeOpen"], r["poseAfterReturn"])
r["errors"] = errors
print(json.dumps(r, indent=1))
