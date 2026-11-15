/** Animation state for the section that is opening (shared by the bay, the light and the transition). */
export const openState = {
  id: null as string | null,
  /** 0 = closed, 1 = fully open; the bay eases `value` toward `target` */
  target: 0,
  value: 0,
};
