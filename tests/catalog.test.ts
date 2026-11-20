import assert from "node:assert/strict";
import test from "node:test";
import { SECTIONS } from "../lib/config/sections";
import { catalog } from "../lib/catalog/mockCatalog";

test("every mall category is enabled and has demo products", () => {
  for (const section of SECTIONS) {
    assert.equal(section.live, true, `${section.id} should be enterable`);
    const products = catalog.listBySection(section.id);
    assert.ok(products.length > 0, `${section.id} should have a demo collection`);
  }
});

test("every demo product has an image, size and valid sample price", () => {
  for (const section of SECTIONS) {
    for (const product of catalog.listBySection(section.id)) {
      assert.ok(product.photos.length > 0, `${product.id} needs photography`);
      assert.ok(product.sizes.length > 0, `${product.id} needs a selectable size`);
      assert.ok(product.price > 0 && product.mrp >= product.price, `${product.id} has invalid sample pricing`);
    }
  }
});
