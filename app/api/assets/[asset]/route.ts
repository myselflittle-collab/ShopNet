/**
 * Allow-listed same-origin proxy for CC0 GLB assets from Grab3D.
 * This is intentionally not an open proxy. Only model slugs with verified source pages are allowed.
 */
const MODEL_URLS: Record<string, string> = {
  jacket: "https://grab3d.com/dl/jacket/jacket.glb",
  hoodie: "https://grab3d.com/dl/hoodie/hoodie.glb",
  "t-shirt": "https://grab3d.com/dl/t-shirt/t-shirt.glb",
  "sports-jersey": "https://grab3d.com/dl/sports-jersey/sports-jersey.glb",
  sneaker: "https://grab3d.com/dl/sneaker/sneaker.glb",
  "high-heels": "https://grab3d.com/dl/high-heels/high-heels.glb",
  "hiking-boots": "https://grab3d.com/dl/hiking-boots/hiking-boots.glb",
  shoe: "https://grab3d.com/dl/shoe/shoe.glb",
  handbag: "https://grab3d.com/dl/handbag/handbag.glb",
  "duffel-bag": "https://grab3d.com/dl/duffel-bag/duffel-bag.glb",
  fedora: "https://grab3d.com/dl/fedora/fedora.glb",
  glasses: "https://grab3d.com/dl/glasses/glasses.glb",
  "pocket-watch": "https://grab3d.com/dl/pocket-watch/pocket-watch.glb",
  "dress-form-mannequin": "https://grab3d.com/dl/dress-form-mannequin/dress-form-mannequin.glb",
};

export const revalidate = 86400;

export async function GET(
  _request: Request,
  context: { params: Promise<{ asset: string }> },
) {
  const { asset } = await context.params;
  const source = MODEL_URLS[asset];

  if (!source) {
    return new Response("Unknown ShopNet model asset.", { status: 404 });
  }

  try {
    const upstream = await fetch(source, { cache: "force-cache" });
    if (!upstream.ok || !upstream.body) {
      return new Response(`Model source returned HTTP ${upstream.status}.`, { status: 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "model/gltf-binary",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-ShopNet-Asset-License": "CC0-1.0",
        "X-ShopNet-Asset-Source": "Grab3D",
      },
    });
  } catch (error) {
    console.error(`ShopNet model proxy failed for ${asset}`, error);
    return new Response("The model could not be loaded. Please try again.", { status: 502 });
  }
}
