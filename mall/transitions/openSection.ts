import { useMallStore } from "@/lib/bridge/mallStore";
import { SECTION_BY_ID, sectionHref, viewingPose } from "@/lib/config/sections";
import { getPose, setPose, tweenTo, walker } from "@/mall/navigation/walker";

export const OPEN_DURATION = 1.0;
export const RETURN_DURATION = 0.9;

/** Click on a section: save the exact pose, step toward the bay, then hand over to the shop route. */
export function openSection(id: string) {
  const s = SECTION_BY_ID[id];
  const st = useMallStore.getState();
  if (!s || !s.live || st.mode !== "walking") return;
  st.savePose(getPose());
  st.setHovered(null);
  st.setMode("opening");
  tweenTo(viewingPose(s), OPEN_DURATION, () => {
    useMallStore.getState().setMode("shop");
    useMallStore.getState().requestRoute(sectionHref(s));
  });
}

/** Shop closed: glide back to the exact saved pose. */
export function returnToMall() {
  const st = useMallStore.getState();
  if (st.mode === "walking" || st.mode === "returning") return;
  const saved = st.savedPose;
  if (!saved) {
    st.setMode("walking");
    return;
  }
  st.setMode("returning");
  tweenTo(saved, RETURN_DURATION, () => {
    setPose(saved); // exact restore
    useMallStore.getState().setMode("walking");
  });
}

/** Arriving directly on a shop URL: place the camera at that bay behind the shop panel. */
export function enterFromDeepLink(id: string) {
  const s = SECTION_BY_ID[id];
  if (!s) return;
  const st = useMallStore.getState();
  const p = viewingPose(s);
  setPose(p);
  walker.tween = null;
  if (!st.savedPose) st.savePose(p);
  st.setMode("shop");
}
