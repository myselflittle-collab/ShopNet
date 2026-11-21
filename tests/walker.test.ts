import { strict as assert } from "node:assert";
import { test } from "node:test";
import { WALKABLE } from "../lib/config/mall";
import { addLook, addWheel, setPose, stepWalker, walker } from "../mall/navigation/walker";

const run = (seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWalker(1 / 60);
};

test("walking remains on the fixed centreline while looking left", () => {
  setPose({ x: 0, z: -10, yaw: Math.PI / 2, pitch: 0 });
  walker.keys.add("KeyW");
  run(2.5);
  walker.keys.clear();
  assert.ok(walker.z < -12);
  assert.equal(walker.x, 0);
});

test("walking remains on the fixed centreline while looking right", () => {
  setPose({ x: 0, z: -10, yaw: -Math.PI / 2, pitch: 0 });
  walker.keys.add("KeyW");
  run(2.5);
  walker.keys.clear();
  assert.ok(walker.z < -12);
  assert.equal(walker.x, 0);
});

test("A/D rotate the head and never move the customer's body sideways", () => {
  setPose({ x: 0, z: -16, yaw: 0, pitch: 0 });
  walker.keys.add("KeyA");
  walker.keys.add("KeyW");
  run(1.5);
  walker.keys.clear();
  assert.ok(walker.z < -17);
  assert.ok(walker.yaw > 0);
  assert.equal(walker.x, 0);
});

test("cannot pass the far end wall or leave through the entrance", () => {
  setPose({ x: 0, z: -40, yaw: 0, pitch: 0 });
  walker.keys.add("KeyW");
  run(20);
  walker.keys.clear();
  assert.equal(walker.z, WALKABLE.minZ);
  setPose({ x: 0, z: 0, yaw: 0, pitch: 0 });
  walker.keys.add("KeyS");
  run(10);
  walker.keys.clear();
  assert.equal(walker.z, WALKABLE.maxZ);
  assert.equal(walker.x, 0);
});

test("scroll up walks forward and scroll down walks back on the centreline", () => {
  setPose({ x: 0, z: 0, yaw: 1.4, pitch: 0 });
  addWheel(-120);
  run(1);
  assert.ok(walker.z < 0);
  const z = walker.z;
  addWheel(120);
  addWheel(120);
  run(1);
  assert.ok(walker.z > z);
  assert.equal(walker.x, 0);
});

test("mouse look can rotate through a full 360 degrees without angle clamping", () => {
  setPose({ x: 0, z: 0, yaw: 0, pitch: 0 });
  addLook(1200, 0, 0.0055);
  run(1);
  assert.ok(walker.yaw < -6, `yaw should pass one full revolution; got ${walker.yaw}`);
  assert.equal(walker.x, 0);
});

test("a normal wheel burst produces a noticeable forward distance without lateral drift", () => {
  setPose({ x: 0, z: 0, yaw: Math.PI / 3, pitch: 0 });
  addWheel(-120);
  run(1);
  assert.ok(walker.z < -0.5, `expected a meaningful forward walk, got z=${walker.z}`);
  assert.equal(walker.x, 0);
});
