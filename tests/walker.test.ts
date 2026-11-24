import { strict as assert } from "node:assert";
import { test } from "node:test";
import { addMouseLook, addSwipeLook, addSwipeWalk, addWheel, resetLimits, setPose, stepWalker, walker } from "../mall/navigation/walker";
import { PATH_LENGTH, PLAZA, offsetAt, pointAt } from "../lib/config/path";
import { SECTIONS } from "../lib/config/sections";
import { occluderSegments } from "../lib/config/architecture";

const run = (seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWalker(1 / 60);
};
const fresh = (s = 20, headYaw = 0) => {
  resetLimits();
  walker.keys.clear();
  walker.pad = 0;
  setPose({ s, headYaw, pitch: 0 });
};

test("scroll DOWN walks forward and scroll UP walks backward", () => {
  fresh(20);
  addWheel(100);
  run(0.5);
  assert.ok(walker.s > 20.2, `forward expected, got ${walker.s}`);
  fresh(20);
  addWheel(-100);
  run(0.5);
  assert.ok(walker.s < 19.8, `backward expected, got ${walker.s}`);
});

test("swipe UP on a touchscreen walks forward, swipe DOWN walks back", () => {
  fresh(20);
  addSwipeWalk(-40);
  run(0.5);
  assert.ok(walker.s > 20.2);
  fresh(20);
  addSwipeWalk(40);
  run(0.5);
  assert.ok(walker.s < 19.8);
});

test("swipe LEFT looks LEFT, swipe RIGHT looks RIGHT", () => {
  fresh(20);
  addSwipeLook(-50);
  assert.ok(walker.headYaw > 0, "left swipe must turn left (positive yaw)");
  fresh(20);
  addSwipeLook(50);
  assert.ok(walker.headYaw < 0);
});

test("mouse moving right turns right; yaw is continuous through many full turns", () => {
  fresh(20);
  for (let i = 0; i < 2000; i++) addMouseLook(20, 0);
  assert.ok(walker.headYaw < -Math.PI * 4, "no wrapping or snapping");
  const before = walker.headYaw;
  addMouseLook(-1, 0);
  assert.ok(Math.abs(walker.headYaw - before) < 0.01);
});

test("looking around never moves the body, and the head is not pulled back while walking", () => {
  fresh(30, 1.2);
  walker.keys.add("KeyW");
  run(2);
  walker.keys.clear();
  assert.ok(walker.s > 32);
  assert.equal(walker.headYaw, 1.2);
});

test("keyboard walking is a little faster than before (2 m/s)", () => {
  fresh(20);
  walker.keys.add("KeyW");
  run(3);
  walker.keys.clear();
  assert.ok(walker.s - 20 > 5.2, `walked ${walker.s - 20} m in 3 s`);
});

test("the path is the locked R14 / 210° S with a 10 m plaza", () => {
  assert.ok(Math.abs(PATH_LENGTH - 126.63) < 0.05, `length ${PATH_LENGTH}`);
  assert.ok(Math.abs(PLAZA.end - PLAZA.start - 10) < 1e-6);
  const end = pointAt(PATH_LENGTH);
  assert.ok(Math.abs(((end.heading * 180) / Math.PI) % 360 - 90) < 0.5, "exits heading north");
});

test("women are all on the customer's left, men all on the right, and the plaza has no store", () => {
  for (const s of SECTIONS) {
    assert.equal(s.side, s.gender === "women" ? -1 : 1);
    assert.ok(s.s1 <= PLAZA.start || s.s0 >= PLAZA.end, `${s.code} intrudes into the plaza`);
  }
  assert.equal(SECTIONS.filter((s) => s.gender === "women").length, 13);
  assert.equal(SECTIONS.filter((s) => s.gender === "men").length, 11);
});

test("no store faces another store across the walkway", () => {
  for (const a of SECTIONS) {
    for (const b of SECTIONS) {
      if (a === b || a.side === b.side) continue;
      const overlap = Math.min(a.s1, b.s1) - Math.max(a.s0, b.s0);
      assert.ok(overlap <= 0, `${a.code} faces ${b.code}`);
    }
  }
});

test("stores never overlap each other or the 4 m walkway", () => {
  const sorted = [...SECTIONS].sort((a, b) => a.s0 - b.s0);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].side !== sorted[i - 1].side) continue;
    assert.ok(sorted[i].s0 >= sorted[i - 1].s1 - 1e-6);
  }
  // every store's facade origin sits at the walkway edge (2.0 m), within the chord sag
  for (const s of SECTIONS) {
    const p = pointAt(s.sMid);
    const d = Math.hypot(s.origin.x - p.x, s.origin.z - p.z);
    assert.ok(d > 1.99 && d < 2.05, `${s.code} facade at ${d.toFixed(2)} m from the centreline`);
  }
});

test("the visibility model has walls everywhere along both sides", () => {
  const segs = occluderSegments();
  assert.ok(segs.length > 400);
  // a sight line straight across lobe 1 from the walkway hits a wall (the atrium core)
  const a = offsetAt(30, 0);
  const b = offsetAt(30, -12);
  const hit = segs.some((g) => {
    const rx = b.x - a.x;
    const rz = b.z - a.z;
    const sx = g.bx - g.ax;
    const sz = g.bz - g.az;
    const den = rx * sz - rz * sx;
    if (Math.abs(den) < 1e-12) return false;
    const t = ((g.ax - a.x) * sz - (g.az - a.z) * sx) / den;
    const v = ((g.ax - a.x) * rz - (g.az - a.z) * rx) / den;
    return t > 0 && t < 1 && v >= 0 && v <= 1;
  });
  assert.ok(hit);
});
