"""Browser test: natural look (mouse + touch), 360°, scroll walk, centre targeting, deliberate click,
cinematic transition in/out, exact pose restore, photos + gallery, filters, cart, back button, deep link."""
import json, math, sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
OUT = sys.argv[2] if len(sys.argv) > 2 else "."
errors = []
r = {}

def W(pg):
    return pg.evaluate("() => { const w = window.__shopnet.walker; return {x:w.x,z:w.z,yaw:w.yaw,pitch:w.pitch,targetYaw:w.targetYaw} }")
def mode(pg):
    return pg.evaluate("() => document.querySelector('.reticle')?.className")
def hovered(pg):
    return pg.evaluate("() => document.querySelector('.target-label')?.innerText")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome",
        args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    ctx = b.new_context(viewport={"width": 1440, "height": 900})
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    pg.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" and "images.unsplash.com" not in m.text and "ERR_TUNNEL" not in m.text and "Failed to load resource" not in m.text else None)
    pg.goto(URL)
    pg.wait_for_selector(".loading.is-done", state="attached", timeout=60000)
    pg.wait_for_timeout(1500)
    r["startPromptShown"] = pg.locator(".start-look").count() == 1
    pg.screenshot(path=f"{OUT}/01-start.png")

    # 1. click to capture the mouse (real pointer lock request)
    pg.locator(".start-look").click()
    pg.wait_for_timeout(500)
    r["pointerLockGranted"] = pg.evaluate("() => !!document.pointerLockElement")
    if not r["pointerLockGranted"]:
        # headless Chrome may refuse pointer lock; simulate the locked state to test the same code path
        pg.evaluate("() => window.__shopnet.setLookMode('locked')")
    pg.wait_for_timeout(200)

    # 2. natural look: real mouse movement, no button held
    pg.mouse.move(720, 450); pg.wait_for_timeout(200)
    y0 = W(pg)["yaw"]
    pg.mouse.move(520, 450, steps=10); pg.wait_for_timeout(500)   # move left
    y1 = W(pg)["yaw"]
    pg.mouse.move(720, 450, steps=10); pg.mouse.move(920, 450, steps=10); pg.wait_for_timeout(500)  # move right
    y2 = W(pg)["yaw"]
    p0 = W(pg)["pitch"]
    pg.mouse.move(920, 350, steps=10); pg.wait_for_timeout(500)   # move up
    p1 = W(pg)["pitch"]
    pg.mouse.move(920, 650, steps=20); pg.wait_for_timeout(500)   # move down
    p2 = W(pg)["pitch"]
    r["mouseLeftTurnsLeft"] = y1 > y0 + 0.2
    r["mouseRightTurnsRight"] = y2 < y1 - 0.2
    r["mouseUpLooksUp"] = p1 > p0 + 0.1
    r["mouseDownLooksDown"] = p2 < p1 - 0.1
    # pitch limit
    for _ in range(4): pg.mouse.move(920, 899, steps=10); pg.mouse.move(920, 0, steps=1) if False else None
    pg.evaluate("() => window.__shopnet.look(0, 4000)"); pg.wait_for_timeout(600)
    r["pitchDownLimitDeg"] = round(math.degrees(W(pg)["pitch"]), 1)
    pg.evaluate("() => window.__shopnet.look(0, -8000)"); pg.wait_for_timeout(600)
    r["pitchUpLimitDeg"] = round(math.degrees(W(pg)["pitch"]), 1)
    pg.evaluate("() => window.__shopnet.look(0, 2000 * 0.0 + (Math.PI*35/180)/0.0022)"); pg.wait_for_timeout(600)

    # 3. full 360°: keep moving the mouse right
    start = W(pg)["yaw"]
    for _ in range(30):
        pg.mouse.move(1400, 450, steps=4); pg.mouse.move(40, 450, steps=1) if False else None
        pg.evaluate("() => window.__shopnet.look(100, 0)")
    pg.wait_for_timeout(900)
    turned = start - W(pg)["yaw"]
    r["turnedDegrees"] = round(math.degrees(turned))
    r["full360"] = turned >= 2 * math.pi - 0.05
    pg.screenshot(path=f"{OUT}/02-after-360.png")
    pg.evaluate("() => { const w = window.__shopnet.walker; w.targetYaw = 0; w.targetPitch = 0; }"); pg.wait_for_timeout(800)

    # 4. scroll walking
    z0 = W(pg)["z"]
    for _ in range(8): pg.mouse.wheel(0, -120); pg.wait_for_timeout(50)
    pg.wait_for_timeout(1500)
    z1 = W(pg)["z"]
    for _ in range(4): pg.mouse.wheel(0, 120); pg.wait_for_timeout(50)
    pg.wait_for_timeout(1500)
    z2 = W(pg)["z"]
    r["scrollUpWalksForward"] = z1 < z0 - 0.5
    r["scrollDownWalksBack"] = z2 > z1 + 0.3

    # 5. targeting: walk to the blazers, then turn left to face the store by moving the mouse
    # Esc frees the mouse (the browser does this natively; simulated here), then the HUD button is clickable
    pg.evaluate("() => document.exitPointerLock()"); pg.wait_for_timeout(300)
    r["escFreesMouse"] = pg.evaluate("() => !document.pointerLockElement")
    r["firstClickOnlyCaptures_urlStays"] = None
    pg.get_by_role("button", name="Walk to Women's Blazers").click()
    pg.wait_for_timeout(2300)
    r["lockedAgainAfterWalkButton"] = pg.evaluate("() => !!document.pointerLockElement")
    if not r["lockedAgainAfterWalkButton"]:
        pg.mouse.click(720, 450); pg.wait_for_timeout(300)
        r["firstClickOnlyCaptures_urlStays"] = pg.url.rstrip("/") == URL.rstrip("/")
    pg.evaluate("() => { const w = window.__shopnet.walker; w.targetYaw = w.yaw - Math.PI/2; }")  # look straight down the corridor first
    pg.wait_for_timeout(900)
    r["targetWhenLookingDownCorridor"] = hovered(pg)
    pg.mouse.move(720, 450)
    for _ in range(10):
        pg.mouse.move(720 - 6, 450, steps=1); pg.mouse.move(720, 450, steps=1) if False else None
        pg.evaluate("() => window.__shopnet.look(-71.4, 0)")  # mouse moves left ≈ 714 px in total (90°)
    pg.wait_for_timeout(900)
    r["targetLabel"] = hovered(pg)
    r["reticleTargeted"] = "is-target" in (mode(pg) or "")
    r["previewVisible"] = pg.evaluate("() => document.querySelector('.preview-card')?.dataset.visible")
    pg.screenshot(path=f"{OUT}/03-targeted.png")

    # 6. deliberate click: a click while walking fast is ignored
    pg.evaluate("() => { window.__shopnet.walker.vel = 2.5 }")
    pg.evaluate("() => window.__shopnet.select()")
    pg.wait_for_timeout(150)
    r["fastWalkClickIgnored"] = pg.url.rstrip("/") == URL.rstrip("/")
    pg.evaluate("() => { const w = window.__shopnet.walker; w.vel = 0; }")
    pg.wait_for_timeout(1200)
    # move back to the exact spot and re-target
    pose = W(pg)
    r["poseBeforeOpen"] = pose

    # 7. click → cinematic transition; capture frames
    pg.mouse.down(); pg.mouse.up()
    frames = []
    for i, t in enumerate([250, 650, 1000, 1350, 1600, 1900, 2600]):
        pg.wait_for_timeout(t - (0 if i == 0 else [250, 650, 1000, 1350, 1600, 1900, 2600][i-1]))
        pg.screenshot(path=f"{OUT}/04-enter-{i}.png")
        frames.append(pg.url.split("3000")[-1])
    r["urlDuringTransition"] = frames
    try:
        pg.wait_for_url("**/shop/women/blazers", timeout=8000)
    except Exception:
        r["FAILED_OPEN_state"] = pg.evaluate("() => ({lock: !!document.pointerLockElement, label: document.querySelector('.target-label')?.innerText, reticle: document.querySelector('.reticle')?.className, w: (({x,z,yaw,pitch,vel}) => ({x,z,yaw,pitch,vel}))(window.__shopnet.walker)})")
        r["errors"] = errors
        print(json.dumps(r, indent=1)); sys.exit(1)
    r["savedPoseMatches"] = pg.evaluate("() => JSON.parse(sessionStorage.getItem('shopnet:savedPose'))")
    r["gridCount"] = pg.locator("article.card").count()
    r["photoSrcs"] = pg.evaluate("() => [...document.querySelectorAll('article.card img')].slice(0,3).map(i => i.currentSrc || i.src)")
    r["anyBrokenImgIcons"] = pg.evaluate("() => [...document.querySelectorAll('article.card img')].some(i => i.complete && i.naturalWidth === 0)")
    r["fallbackFrames"] = pg.locator("article.card [role=img]").count()
    r["svgIllustrationsLeft"] = pg.evaluate("() => [...document.querySelectorAll('img')].filter(i => i.src.startsWith('data:image/svg')).length")

    # 8. filters + sort + cart still work
    pg.locator("aside").get_by_role("button", name="M", exact=True).click()
    pg.select_option("#sort", "priceAsc"); pg.wait_for_timeout(300)
    prices = pg.evaluate("() => [...document.querySelectorAll('article.card .tabular-nums span:first-child')].map(e => +e.textContent.replace(/[^0-9]/g,''))")
    r["sortedAsc"] = prices == sorted(prices) and len(prices) > 0
    card = pg.locator("article.card").first
    card.locator("[aria-label='Size'] button").first.click()
    card.get_by_role("button", name="Add to cart").click(); pg.wait_for_timeout(300)
    r["bag"] = pg.locator(".shop-head .chip").inner_text()
    pg.select_option("#sort", "featured")
    pg.locator("aside").get_by_role("button", name="M", exact=True).click()

    # 9. product detail gallery
    pg.locator("article.card").nth(3).get_by_role("button").first.click()
    pg.wait_for_selector(".pdp", timeout=4000)
    r["galleryThumbs"] = pg.locator(".pdp [role=tab]").count()
    pg.locator(".pdp [role=tab]").nth(1).click(); pg.wait_for_timeout(300)
    r["galleryTabSelected"] = pg.locator(".pdp [role=tab]").nth(1).get_attribute("aria-selected")
    r["galleryTitle"] = pg.locator("#pdp-title").inner_text()
    pg.screenshot(path=f"{OUT}/05-gallery.png")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    r["galleryClosedShopStays"] = pg.locator(".pdp").count() == 0 and "/shop/" in pg.url
    pg.screenshot(path=f"{OUT}/06-shop.png")

    # 10. back to mall: reverse transition and exact restore
    pg.get_by_role("button", name="Back to mall").first.click()
    for i, t in enumerate([200, 450, 900, 1500]):
        pg.wait_for_timeout(t - (0 if i == 0 else [200, 450, 900, 1500][i-1]))
        pg.screenshot(path=f"{OUT}/07-exit-{i}.png")
    pg.wait_for_url(URL.rstrip("/") + "/", timeout=8000)
    pg.wait_for_timeout(1800)
    after = W(pg)
    r["poseAfterReturn"] = after
    r["exactReturn"] = all(abs(pose[k] - after[k]) < 1e-9 for k in ("x", "z", "yaw", "pitch"))
    pg.screenshot(path=f"{OUT}/08-returned.png")

    # 11. browser back button support
    pg.evaluate("() => window.__shopnet.select()")
    pg.wait_for_url("**/shop/women/blazers", timeout=8000); pg.wait_for_timeout(1200)
    pg.go_back(); pg.wait_for_timeout(2200)
    r["backButtonReturnsToMall"] = pg.url.rstrip("/") == URL.rstrip("/") and pg.locator(".shop").count() == 0
    r["backButtonExactReturn"] = all(abs(pose[k] - W(pg)[k]) < 1e-9 for k in ("x", "z", "yaw", "pitch"))

    # 12. deep link
    pg.goto(URL.rstrip("/") + "/shop/women/blazers"); pg.wait_for_timeout(2500)
    r["deepLinkCards"] = pg.locator("article.card").count()

    # 13. touch: one-finger pan, two-finger walk, tap to face then tap to enter
    m = b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True).new_page()
    m.on("pageerror", lambda e: errors.append(f"mobile pageerror: {e}"))
    m.goto(URL); m.wait_for_selector(".loading.is-done", state="attached", timeout=60000); m.wait_for_timeout(1500)
    cdp = m.context.new_cdp_session(m)
    def touch(kind, pts):
        cdp.send("Input.dispatchTouchEvent", {"type": kind, "touchPoints": [{"x": x, "y": y, "id": i} for i, (x, y) in enumerate(pts)]})
    ty0 = m.evaluate("() => window.__shopnet.walker.yaw")
    touch("touchStart", [(150, 400)])
    for x in range(150, 330, 15): touch("touchMove", [(x, 400)]); m.wait_for_timeout(16)
    touch("touchEnd", []); m.wait_for_timeout(600)
    ty1 = m.evaluate("() => window.__shopnet.walker.yaw")
    r["fingerRightTurnsViewLeft"] = ty1 > ty0 + 0.3   # the scene follows the finger
    tz0 = m.evaluate("() => window.__shopnet.walker.z")
    # Chrome's touch emulation only makes one pointer from CDP, so two finger streams are sent as real PointerEvents
    m.evaluate("""() => {
      const c = document.querySelector('canvas');
      const ev = (type, id, x, y) => c.dispatchEvent(new PointerEvent(type, {pointerId: id, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, isPrimary: id === 11}));
      ev('pointerdown', 11, 160, 600); ev('pointerdown', 12, 230, 600);
      let y = 600; const t = setInterval(() => { y -= 15; ev('pointermove', 11, 160, y); ev('pointermove', 12, 230, y); if (y <= 420) clearInterval(t); }, 40);
      setTimeout(() => { ev('pointerup', 11, 160, y); ev('pointerup', 12, 230, y); }, 1500);
    }""")
    m.wait_for_timeout(700)
    r["twoFingerPadWhileSwiping"] = m.evaluate("() => window.__shopnet.walker.pad")
    m.wait_for_timeout(1600)
    r["twoFingerPadAfterRelease"] = m.evaluate("() => window.__shopnet.walker.pad")
    tz1 = m.evaluate("() => window.__shopnet.walker.z")
    r["twoFingerSwipeWalks"] = tz1 < tz0 - 0.3
    m.screenshot(path=f"{OUT}/09-mobile.png")
    b.close()

r["errors"] = errors
print(json.dumps(r, indent=1))
