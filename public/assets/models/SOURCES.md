# ShopNet 3D asset sources

This directory is reserved for locally stored GLB assets. Do not hotlink preview pages as if they were model files.

## Verified CC0 starting assets

These source pages describe downloadable GLB files and explicitly state CC0 / public-domain terms. Download the GLB from the source page, retain the manifest/credit information, inspect it in Blender, optimise it, then place it under `public/assets/models/`.

| Asset | Source page | Published file | Source-reported size | Intended use |
|---|---|---|---:|---|
| Standing mannequin | https://www.innerscene.com/tools/library/3d-parts/standing-mannequin-original-retail-fixture-84ea17f0 | standing-mannequin-original-retail-fixture.glb | 426 KB | Store mannequins |
| Female dress form | https://www.innerscene.com/tools/library/3d-parts/female-dress-form-mannequin-365616e7 | female-dress-form-mannequin.glb | 1.9 MB | Women's tailoring and dress displays |
| Straight clothing rack | https://www.innerscene.com/tools/library/3d-parts/straight-clothing-rack-original-retail-fixture-0a4e8040 | straight-clothing-rack-original-retail-fixture.glb | 344 KB | Garment rails |
| Round clothing rack | https://www.innerscene.com/tools/library/3d-parts/round-clothing-rack-original-retail-fixture-628042a4 | round-clothing-rack-original-retail-fixture.glb | 381 KB | Boutique displays |
| Glass display case | https://www.innerscene.com/tools/library/3d-parts/glass-display-case-original-retail-fixture-1575bba9 | glass-display-case-original-retail-fixture.glb | 722 KB | Watches and accessories |
| Wall shelving bay | https://www.innerscene.com/tools/library/3d-parts/wall-shelving-bay-original-retail-fixture-30d3074b | wall-shelving-bay-original-retail-fixture.glb | 947 KB | Folded apparel and shoes |
| Denim jacket on hanger | https://grab3d.com/models/props/jacket/ | jacket.glb | 2.0 MB (full) / 927 KB (light) | Example hanging outerwear garment |

## Important asset rules

- These are source references, not files already installed in this repository.
- The mannequin and rack models are fixtures, not substitutes for actual garments.
- The denim jacket is one garment only; it does not supply a complete clothing collection.
- Verify the licence shown at download time and keep the source's `LICENSE.txt` / manifest beside the asset.
- Do not represent a mannequin, rack, or placeholder mesh as a realistic garment.
- Do not commit downloaded models until they have been checked for scale, materials, orientation, polygon count and file size.

## Proposed local layout

```text
public/assets/models/
  fixtures/
    standing-mannequin-original-retail-fixture.glb
    female-dress-form-mannequin.glb
    straight-clothing-rack-original-retail-fixture.glb
    round-clothing-rack-original-retail-fixture.glb
    glass-display-case-original-retail-fixture.glb
    wall-shelving-bay-original-retail-fixture.glb
  garments/
    jacket.glb
  LICENSES/
    <source-provided licence and attribution files>
```
