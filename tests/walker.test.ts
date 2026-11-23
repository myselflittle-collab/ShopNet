import { strict as assert } from "node:assert";
import { test } from "node:test";
import { MALL } from "../lib/config/mall";
import { SECTIONS } from "../lib/config/sections";
import { MALL_PATH_LENGTH, pathFrameAt } from "../mall/navigation/path";
import { addLook, addWheel, setPose, stepWalker, walker } from "../mall/navigation/walker";

const run = (seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWalker(1 / 60);
};

test("the path is the locked 126.63 m S with two opposite 210-degree lobes", () => {
  assert.ok(Math.abs(MALL_PATH_LENGTH - 126.62536) < 0.01);
  assert.ok(Math.abs(pathFrameAt(0).yaw) < 0.01);
  assert.ok(Math.abs(pathFrameAt(MALL_PATH_LENGTH).yaw) < 0.02);
  assert.ok(pathFrameAt(35).curvature < 0);
  assert.ok(pathFrameAt(91).curvature > 0);
});

test("women are only on the left outer wall of lobe one; men are only on the right outer wall of lobe two", () => {
  const women = SECTIONS.filter((s) => s.gender === "women");
  const men = SECTIONS.filter((s) => s.gender === "men");
  assert.equal(women.length, 13);
  assert.equal(men.length, 11);
  assert.ok(women.every((s) => s.side === -1 && s.sCenter < MALL.womenEndS));
  assert.ok(men.every((s) => s.side === 1 && s.sCenter > MALL.plazaEndS));
  assert.ok(Math.min(...men.map((s) => s.s0)) >= MALL.plazaEndS + 1.8);
});

test("scroll down walks forward and scroll up walks backward", () => {
  setPose({ s: 30, yaw: 0, pitch: 0 });
  addWheel(120);
  run(1);
  assert.ok(walker.s > 31.5, `scroll down should walk forward; s=${walker.s}`);
  const afterForward = walker.s;
  addWheel(-120);
  run(1);
  assert.ok(walker.s < afterForward, `scroll up should walk backward; s=${walker.s}`);
});

test("mouse yaw remains unwrapped after multiple full revolutions", () => {
  setPose({ s: 55, yaw: 0, pitch: 0 });
  addLook(-1400, 0);
  run(0.1);
  assert.ok(walker.yaw > 6);
  const firstTurn = walker.yaw;
  addLook(1400, 0);
  run(0.1);
  assert.ok(walker.yaw < firstTurn - 6);
});

test("normal wheel notches move a useful distance and never change the path coordinate sideways", () => {
  setPose({ s: 2, yaw: 1.2, pitch: 0 });
  addWheel(120);
  run(1);
  assert.ok(walker.s > 3.5);
  assert.ok(walker.s < MALL_PATH_LENGTH);
});
