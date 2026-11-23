import { strict as assert } from "node:assert";
import { test } from "node:test";
import { MALL_PATH_LENGTH, pathFrameAt } from "../mall/navigation/path";
import { addLook, addWheel, angleInRange, setPose, stepWalker, walker } from "../mall/navigation/walker";

const run = (seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWalker(1 / 60);
};

test("S-path starts at the entrance and ends at the exit", () => {
  const start = pathFrameAt(0);
  const end = pathFrameAt(MALL_PATH_LENGTH);
  assert.ok(Math.abs(start.x) < 0.02);
  assert.ok(Math.abs(start.z) < 0.02);
  assert.ok(Math.abs(start.yaw) < 0.02);
  assert.ok(Math.abs(end.x - 50.03) < 0.1);
  assert.ok(Math.abs(end.z + 0.59) < 0.1);
  assert.ok(Math.abs(end.yaw) < 0.02);
});

test("walking down the path follows its centreline while looking left", () => {
  setPose({ s: 18, yaw: Math.PI / 2, pitch: 0 });
  walker.keys.add("KeyW");
  run(2.5);
  walker.keys.clear();
  assert.ok(walker.s > 19.5);
  assert.ok(walker.s < 22);
  assert.equal(walker.yaw, Math.PI / 2);
});

test("head look does not change the customer's path position", () => {
  setPose({ s: 36, yaw: 0, pitch: 0 });
  addLook(-600, 0);
  run(0.25);
  assert.ok(walker.yaw > 2.5);
  assert.equal(walker.s, 36);
});

test("scroll down moves forward and scroll up moves backward", () => {
  setPose({ s: 30, yaw: 1.4, pitch: 0 });
  addWheel(120);
  run(1);
  assert.ok(walker.s > 30);
  const forward = walker.s;
  addWheel(-240);
  run(1);
  assert.ok(walker.s < forward);
});

test("full 360-degree and multiple-turn look is unwrapped", () => {
  setPose({ s: 60, yaw: 0, pitch: 0 });
  addLook(-1400, 0);
  run(0.1);
  assert.ok(walker.yaw > 6);
  assert.ok(angleInRange(walker.yaw, (53.5 * Math.PI) / 180, (117.5 * Math.PI) / 180));
  const once = walker.yaw;
  addLook(1400, 0);
  run(0.1);
  assert.ok(walker.yaw < once - 6);
});

test("walking remains within the entrance and exit path bounds", () => {
  setPose({ s: 0, yaw: 0, pitch: 0 });
  addWheel(-240);
  run(10);
  assert.equal(walker.s, 0);
  setPose({ s: MALL_PATH_LENGTH, yaw: 0, pitch: 0 });
  addWheel(240);
  run(10);
  assert.ok(Math.abs(walker.s - MALL_PATH_LENGTH) < 1e-6);
});
