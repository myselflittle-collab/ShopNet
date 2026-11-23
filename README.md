# ShopNet — Layout 2 / Option 3

A 3D fashion mall with an S-shaped customer route and two distinct retail lobes. This rebuild starts from the preserved Updated checkpoint 2 commit and follows the accepted ShopNet Blueprint Draft 0.7.

## Locked layout

- Women’s stores occupy the **outer-left wall of the first right-turning lobe**.
- Men’s stores occupy the **outer-right wall of the second left-turning lobe**.
- The inside of each lobe is an open landscaped atrium strip, not an enclosed room.
- The central 10 m plaza is store-free and continues the same architectural language.
- Centreline route: 126.63 m; 14 m nominal radius; 210° lobe brief; 5 m clothoid transitions; 8 m foyer; 10 m plaza; 6 m exit.
- Walkway width is 4.000 m. Store depth is 3.800 m. The inner atrium band is 1.344 m.
- Store placement uses the locked Draft 0.7 intervals: W1–W13 on the first lobe, M1–M11 on the second.

## Run locally (Windows PowerShell)

```powershell
git fetch origin
git switch feature/shopnet-layout2-rebuild
git pull --ff-only origin feature/shopnet-layout2-rebuild
git lfs pull
npm ci
npm run dev
```

Open http://localhost:3000.

## Controls

| Desktop | Touch |
| --- | --- |
| Scroll **down** — walk forward | Swipe up — walk forward |
| Scroll **up** — walk backward | Swipe down — walk backward |
| Move mouse — look around; full 360° turns with no yaw clamp | Swipe left/right — look left/right |
| W / Arrow Up — forward; S / Arrow Down — backward | The on-screen arrows can also walk |
| Click a highlighted storefront — open its catalogue | Tap a storefront — open its catalogue |
| Double-click empty walkway — stop free-look | Double-tap empty walkway — stop free-look |

Pointer lock is requested from the Enter-the-mall button. If the browser denies it, uncaptured mouse look remains available. Store clicks do not request pointer lock.

## First-entry tutorial

1. Start at centreline s=2.0 and head yaw +20°.
2. Scroll down to s=12.4.
3. Scroll up to s=11.4.
4. Look left to at least +100°, then look right by at least 30° and hold the W1 LCD direction inside its computed viewing window for 300 ms.
5. Double-click/double-tap the empty walkway while facing W1. The scrim retracts inside the portal; the customer’s camera pose does not move.

## Storefronts, walls and screens

Standard 4 m stores have a 2.8 m clear portal with 0.6 m returns on each side. The 8 m men’s shoes and watches stores have a 5.6 m portal and 1.2 m returns. Returns frame the portal; they do not close it with a wall. Rear walls continue behind the storefront row so neighbouring portals do not reveal the outside.

Each LCD is mounted in front of the rear wall, inside the store. The campaign manager activates only the featured screen; other screens retain a static designed fallback. Original campaign MP4 masters are in Git LFS at public/videos/sections/. They are loaded only when the lifecycle manager makes a screen READY/PLAYING. The original masters are not re-encoded or overwritten.

## Checks

```powershell
npm run typecheck
npm test
npm run build
```

The automated checks validate TypeScript, the locked path/store-side assignments, scroll direction, walking response and unwrapped camera yaw. They do not replace visual review in desktop Chrome and on touch devices.

## Checkpoints and branches

- checkpoint/updated-checkpoint-2 — original restore point, unchanged.
- checkpoint/experimental-s-path-broken-2026-11-23 — preserved backup of the rejected experimental S-path.
- feature/shopnet-layout2-rebuild — current Layout 2 rebuild branch.

No changes are made to main. The original 1080p MP4 masters remain intact. The proposed lossy 720p/540p encoding ladder is not included or run; it remains subject to explicit approval.
