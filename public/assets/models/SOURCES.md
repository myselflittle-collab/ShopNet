# ShopNet 3D asset sources

## Runtime model library

ShopNet currently loads approved GLB files through the same-origin route `/api/assets/<asset>`. The route is an explicit allow-list; it is not an unrestricted URL proxy. The GLB files are fetched from Grab3D and cached by the Next.js server.

All model pages below state **CC0 1.0** and permit commercial use without attribution. They are described by Grab3D as *Lightweight Stylized* models with 2K PBR textures. They are useful for real 3D product silhouettes in the first interactive prototype, but they are **not photoreal scanned garments**. They must not be represented as the final photoreal quality bar.

| ShopNet key | Model | Intended use | Source |
|---|---|---|---|
| `jacket` | Denim jacket on a wooden hanger / small rack | Jackets and outerwear rails | https://grab3d.com/models/props/jacket/ |
| `hoodie` | Pink hoodie on a wooden hanger | Casualwear and outerwear | https://grab3d.com/models/props/hoodie/ |
| `t-shirt` | Folded / flat-lay T-shirt pair | Folded T-shirt tables | https://grab3d.com/models/props/t-shirt/ |
| `sports-jersey` | Sports jersey on a hanger and small rack | Sportswear displays | https://grab3d.com/models/sports/sports-jersey/ |
| `sneaker` | Pair of canvas sneakers | Sneaker shelves | https://grab3d.com/models/props/sneaker/ |
| `high-heels` | Pair of pink leather pumps | Womens footwear shelves | https://grab3d.com/models/props/high-heels/ |
| `hiking-boots` | Pair of hiking boots | Mens footwear shelves | https://grab3d.com/models/props/hiking-boots/ |
| `shoe` | Pair of brown leather lace-up shoes | Formal footwear display | https://grab3d.com/models/props/shoe/ |
| `handbag` | Pink leather handbag with gold hardware | Handbag shelves | https://grab3d.com/models/props/handbag/ |
| `duffel-bag` | Blue canvas duffel bag | Travel bags display | https://grab3d.com/models/props/duffel-bag/ |
| `fedora` | Brown felt fedora | Hats and accessories | https://grab3d.com/models/props/fedora/ |
| `glasses` | Gold round-frame glasses | Accessories cabinet | https://grab3d.com/models/props/glasses/ |
| `pocket-watch` | Brass pocket watch | Watch / accessories cabinet | https://grab3d.com/models/props/pocket-watch/ |

Grab3D's developer documentation specifies download URLs in the form `https://grab3d.com/dl/<slug>/<file>` and says each model package includes its own `LICENSE.txt` and `manifest.json`: https://grab3d.com/developers/

## Important limitations

- These files are remote runtime assets; the binary GLBs are **not committed** in this repository.
- The models are stylised and modestly detailed. They replace abstract cubes with actual recognizable products, but do not meet a photorealistic final-store requirement.
- Several categories currently reuse a model as a visual stand-in. Do not claim that this is a full SKU-level merchandise collection.
- Product listing photography is separate from 3D GLB merchandise. The 2D shop should use suitable real product photographs with source/license records.
- If a model is unavailable, the UI should log/report the missing asset; it must not silently replace the model with coloured blocks.
- Before production, download the model package, retain its own `LICENSE.txt` and `manifest.json`, optimize a local copy with glTF-Transform, inspect scale/orientation/material maps in Blender, and self-host the final approved GLB.

## Target local asset layout for the production pass

```text
public/assets/models/
  garments/
  footwear/
  bags-accessories/
  mannequins/
  fixtures/
  LICENSES/
    <original model LICENSE.txt and manifest.json files>
```

The asset pipeline should retain original source manifests, file hashes and licence data. A source-page link alone does not mean the binary has been installed or QA-approved.
