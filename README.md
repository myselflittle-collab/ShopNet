# ShopNet — immersive 3D fashion mall

ShopNet is a 3D fashion-mall shopping prototype. Customers enter a two-lobe S-shaped mall, walk the centreline while looking independently in any direction, discover 24 category storefronts, and open a 2D catalogue attached to the selected store.

The current implementation branch contains the S-path, 13 women's storefronts, 11 men's storefronts, divider fins, the five-step first-entry tutorial, centreline camera controls, and a visibility-driven campaign-video manager. It is still a development branch, not a release.

## Run locally

Requirements:
- Node.js 24 (the CI build uses Node 24).
- Git LFS installed and enabled, because the original campaign MP4 masters are stored with Git LFS.
- Windows PowerShell and FFmpeg for the optional lossless video-preparation step.

\`\`\`powershell
git lfs install
git lfs pull
npm ci
npm run dev
\`\`\`

Open http://localhost:3000.

## Navigation

The first visit begins with the five-step, action-gated tutorial.

| Input | Action |
| --- | --- |
| Mouse movement | Look around; pointer lock is requested by the Enter the mall button |
| Scroll down | Walk forward along the S-path |
| Scroll up | Walk backward along the S-path |
| W / Arrow Up | Walk forward |
| S / Arrow Down | Walk backward |
| A / Arrow Left | Turn the head left |
| D / Arrow Right | Turn the head right |
| Double-click empty walkway | Stop free-look and release pointer lock |
| Look Around | Resume looking after the tutorial |
| Click a highlighted storefront | Open its 2D category catalogue |
| Back to mall | Close the catalogue and restore the saved camera pose |

On touch screens, horizontal swipes look left/right and vertical swipes walk forward/back. A double-tap on the empty walkway stops free-look; the visible Look Around control resumes it. Store taps are handled separately from walkway double-taps.

The customer's body remains on the path centreline. Looking does not steer the walking route.

## Campaign videos

The source masters are kept unchanged in \`public/videos/sections/\`. They are the reference files and must not be overwritten.

The repository includes a PowerShell preparation script for a **lossless picture-stream copy**:

\`\`\`powershell
npm run videos:prepare
\`\`\`

For every one of the 24 campaign videos, the script:
1. Copies the H.264 video stream without re-encoding or changing resolution.
2. Removes the unused audio stream and moves the MP4 index to the front (\`faststart\`).
3. Decodes both source and prepared files and compares the checksum of every video frame.
4. Extracts a separate 960×540 WebP poster.

The generated files go to:
- \`public/videos/optimized/\` — prepared MP4s.
- \`public/videos/posters/\` — poster stills.

The script stops if a source is missing, FFmpeg fails, frame counts differ, any decoded-picture checksum differs, or an output is empty. The original masters remain unchanged.

After a successful run, add the generated outputs to Git and push the branch so deployments receive them:

\`\`\`powershell
git add public/videos/optimized public/videos/posters
git commit -m "Add verified campaign MP4s and offline posters"
git push
\`\`\`

The generated MP4s are covered by Git LFS through the repository's \`.gitattributes\`. The WebP posters are ordinary Git files.

**Not included:** the proposed 720p/540p lossy encoding ladder. It remains unapproved and is not performed by this script.

## Verification

\`\`\`powershell
npm run typecheck
npm test
npm run build
\`\`\`

CI runs the same three checks on the implementation branch. The last verified run passed all three.

## Project checkpoints and branches

- \`checkpoint/updated-checkpoint-2\` — restore point at baseline commit \`a4f9c70\`.
- \`feature/shopnet-blueprint-0.7\` — current unmerged implementation branch.
- \`checkpoint/pre-ci-repair-2026-11-23\` — safety checkpoint immediately before the latest CI repair.

Do not merge the implementation branch into \`main\` or deploy it as a release until the staged benchmark, device checks, visual review, and Little's approval are complete.

## Remaining verification

- Add and run the fixed-route \`/bench\` baseline on the original checkpoint and record results on a laptop, Android phone, and iPhone where available.
- Generate the 24 optimized MP4s and poster stills locally, verify the output, then add them to the branch.
- Complete sustained browser tests and compare the S-path/screenshots with the approved visual reference.
