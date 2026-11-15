import { strict as assert } from "node:assert";
import { test } from "node:test";
import { WALKABLE } from "../lib/config/mall";
import { setPose, stepWalker, walker } from "../mall/navigation/walker";

const run = (seconds: number) => {
  for (let i = 0; i < seconds * 60; i++) stepWalker(1 / 60);
};

test("cannot walk through the women's side (left) bays", () => {
  setPose({ x: 0, z: -10, yaw: Math.PI / 2, pitch: 0 }); // facing left
  walker.keys.add("KeyW");
  run(5);
  walker.keys.clear();
  assert.equal(walker.x, WALKABLE.minX);
});

test("cannot walk through the men's side (right) bays", () => {
  setPose({ x: 0, z: -10, yaw: -Math.PI / 2, pitch: 0 });
  walker.keys.add("KeyW");
  run(5);
  walker.keys.clear();
  assert.equal(walker.x, WALKABLE.maxX);
});

test("slides along the wall instead of stopping dead", () => {
  setPose({ x: 0, z: -10, yaw: Math.PI / 4, pitch: 0 }); // diagonal toward left wall and forward
  walker.keys.add("KeyW");
  run(4);
  walker.keys.clear();
  assert.equal(walker.x, WALKABLE.minX);
  assert.ok(walker.z < -12, `kept moving forward along the wall (z=${walker.z})`);
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
});

test("scroll up walks forward, scroll down walks back", async () => {
  const { addWheel } = await import("../mall/navigation/walker");
  setPose({ x: 0, z: 0, yaw: 0, pitch: 0 });
  addWheel(-120);
  run(1);
  assert.ok(walker.z < 0);
  const z = walker.z;
  addWheel(120);
  addWheel(120);
  run(1);
  assert.ok(walker.z > z);
});
