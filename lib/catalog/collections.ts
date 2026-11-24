import type { Colour, ProductPhoto } from "./types";

/**
 * Section catalogues, rebuilt so every product has its own photograph of exactly that kind of item.
 * All photographs are free to use under the Unsplash License (https://unsplash.com/license);
 * alt text is the caption on Unsplash, names and colours follow what each photo shows.
 * Prices, stock and ratings are demo data until the real seller feed replaces them.
 */

export interface Item {
  name: string;
  colour: Colour;
  photo: string; // Unsplash photo id
  alt: string;
  by: string; // photographer
  fabric?: string;
  /** focal point for the close-up crop */
  fy?: number;
}

export interface Collection {
  fabric: string;
  fit: string;
  brand: string;
  basePrice: number;
  sizes?: string[];
  blurb: string;
  items: Item[];
}

const col = (name: string, hex: string): Colour => ({ name, hex });
const K = {
  black: col("Black", "#1E1E22"),
  white: col("White", "#F1EFEA"),
  ivory: col("Ivory", "#ECE8E0"),
  cream: col("Cream", "#E6DCC6"),
  sand: col("Sand", "#CBB497"),
  camel: col("Camel", "#B89772"),
  tan: col("Tan", "#B08A5E"),
  brown: col("Brown", "#74533F"),
  olive: col("Olive", "#6B6B3E"),
  green: col("Green", "#4E7A55"),
  sage: col("Sage", "#A7B89A"),
  navy: col("Navy", "#25304A"),
  blue: col("Blue", "#5A7897"),
  sky: col("Sky Blue", "#9DBBD6"),
  denim: col("Denim", "#385B83"),
  grey: col("Grey", "#8A8A8C"),
  red: col("Red", "#A8323A"),
  pink: col("Pink", "#D9A2A8"),
  rose: col("Rose", "#C78F91"),
  orange: col("Orange", "#D9692F"),
  terracotta: col("Terracotta", "#B5603F"),
  yellow: col("Yellow", "#D9B640"),
  lilac: col("Lilac", "#B9A6CC"),
  purple: col("Purple", "#6B3F7A"),
  silver: col("Silver", "#B9BCC0"),
  gold: col("Gold", "#C9A45C"),
  stripe: col("Stripe", "#6B6B6B"),
  floral: col("Floral print", "#C98A8F"),
  multi: col("Multicolour", "#9A7B6A"),
};
export const COLOURS = K;

const i = (name: string, colour: Colour, photo: string, alt: string, by: string, extra: Partial<Item> = {}): Item => ({
  name,
  colour,
  photo,
  alt,
  by,
  ...extra,
});

export const COLLECTIONS: Record<string, Collection> = {
  // ───────────────────────────── WOMEN ─────────────────────────────
  "women-trousers": {
    fabric: "Woven blend", fit: "Wide-leg fit", brand: "Aurelle", basePrice: 2799,
    blurb: "High-rise trousers with a clean front and an easy, fluid leg.",
    items: [
      i("Blush Pink Tailored Trousers", K.pink, "photo-1594633312681-425c7b97ccd1", "Woman in pink trousers and white shoes", "engin akyurt"),
      i("Orange Wide-Leg Trousers", K.orange, "photo-1551854838-212c50b4c184", "Woman in orange trousers", "Emmeline T."),
      i("Blue Straight Trousers", K.blue, "photo-1580651214613-f4692d6d138f", "Woman in a white shirt and blue trousers", "Vladimir Fedotov"),
      i("Olive Utility Trousers", K.olive, "photo-1565396488538-0cdbd7c7ef18", "Olive green trousers", "Felix Uresti"),
      i("Brown Linen Trousers", K.brown, "photo-1789110520148-bb52ba37759b", "Brown linen trousers", "engin akyurt", { fabric: "Linen" }),
      i("Yellow Wide-Leg Trousers", K.yellow, "photo-1789110519976-ea1f044db897", "Yellow trousers", "engin akyurt"),
    ],
  },
  "women-tshirts": {
    fabric: "Cotton jersey", fit: "Regular fit", brand: "Kora Atelier", basePrice: 899,
    blurb: "Soft, breathable cotton with a neat neckline that keeps its shape.",
    items: [
      i("Black Crew-Neck T-shirt", K.black, "photo-1583744946564-b52ac1c389c8", "Woman in a black T-shirt and jeans", "Faith & Yarn"),
      i("Black Everyday Tee", K.black, "photo-1583744999783-efe9dc5eac91", "Woman in a black T-shirt", "Faith & Yarn"),
      i("Red Printed T-shirt", K.red, "photo-1551799517-eb8f03cb5e6a", "Woman in a red printed T-shirt", "Josue Escoto"),
      i("White Essential Tee", K.white, "photo-1581655353564-df123a1eb820", "White crew-neck T-shirt", "Haryo Setyadi"),
      i("Mint Green Cotton Tee", K.sage, "photo-1759572095329-1dcf9522762b", "Light green T-shirt", "tian dayong"),
    ],
  },
  "women-shirts": {
    fabric: "Cotton poplin", fit: "Relaxed fit", brand: "Northbay Women", basePrice: 1599,
    blurb: "Button-through shirts in crisp cotton and soft prints.",
    items: [
      i("Blue Heart-Print Shirt", K.blue, "photo-1596755094514-f87e34085b2c", "Blue button-down shirt with a white heart pattern on a hanger", "Santhosh Kumar"),
      i("Blue & White Striped Shirt", K.stripe, "photo-1589810635657-232948472d98", "Blue and white striped shirt", "engin akyurt"),
      i("Floral Print Blouse", K.floral, "photo-1764337593519-c51a77b4fc3d", "Woman in a floral blouse", "IMANA", { fabric: "Viscose" }),
      i("Paisley Print Shirt", K.multi, "photo-1766471524299-016b52512780", "Woman in a paisley shirt", "IMANA", { fabric: "Viscose" }),
      i("Floral Bow-Neck Blouse", K.floral, "photo-1763559053411-80ae3727443e", "Floral blouse with a bow", "IMANA", { fabric: "Georgette" }),
      i("Sky Blue Classic Shirt", K.sky, "photo-1635650804247-8efb9b39f735", "Woman in a blue shirt", "Bailey Alexander"),
    ],
  },
  "women-dresses": {
    fabric: "Crepe", fit: "Regular fit", brand: "Maison Kaya", basePrice: 3299,
    blurb: "Easy dresses with movement, from day prints to evening colour.",
    items: [
      i("Black & White Floral Dress", K.floral, "photo-1616313253719-c46514cddee1", "Woman in a black and white floral dress", "Roman Holoschchuk"),
      i("Floral Sundress", K.floral, "photo-1762154057377-cc9d3dd6900c", "Woman in a floral sundress", "Sanskrutihomes", { fabric: "Cotton" }),
      i("Red Evening Dress", K.red, "photo-1633077705107-8f53a004218f", "Woman in a red dress", "Joeyy Lee", { fabric: "Satin" }),
      i("Blue & White Floral Dress", K.blue, "photo-1614098097306-c67b8020c04e", "Blue and white floral dress", "Suits Me Online"),
      i("White Summer Dress", K.white, "photo-1753192104240-209f3fb568ef", "Woman in a white dress by a pool", "Muhammad Nadir", { fabric: "Cotton voile" }),
      i("Terracotta Button-Down Dress", K.terracotta, "photo-1789110853872-f416085557fa", "Terracotta button-down dress", "engin akyurt", { fabric: "Linen blend" }),
    ],
  },
  "women-jeans": {
    fabric: "Denim", fit: "Straight fit", brand: "Studio Vane", basePrice: 2199,
    blurb: "Rigid-look denim with a little stretch, cut high at the waist.",
    items: [
      i("Light Wash Straight Jeans", K.denim, "photo-1602293589930-45aad59ba3ab", "Jeans on a hanger", "Jason Leung"),
      i("Classic Blue High-Rise Jeans", K.denim, "photo-1475178626620-a4d074967452", "Woman in blue jeans and a white top", "Tamara Bellis"),
      i("Mid Blue Everyday Jeans", K.denim, "photo-1541099649105-f69ad21f3246", "Person wearing blue jeans", "Alicia Petresc"),
      i("Denim Trio Edit", K.blue, "photo-1542272604-787c3835535d", "Three denim bottoms in assorted washes", "Mnz"),
      i("Relaxed Straight Jeans", K.denim, "photo-1600219823854-f3bfee26ea9c", "Woman in denim jeans and a white shirt", "Matt Koffel"),
    ],
  },
  "women-ethnic": {
    fabric: "Silk blend", fit: "Classic drape", brand: "Aurelle", basePrice: 4499,
    blurb: "Six yards of colour, woven for festive days and family occasions.",
    items: [
      i("Classic Draped Saree", K.multi, "photo-1727430228383-aa1fb59db8bf", "Woman wearing a saree", "shades by 43"),
      i("Festive Colour Saree", K.multi, "photo-1769275061202-cf3ef67d7279", "Colourful saree", "Dhruv vishwakarma"),
      i("Emerald Green Saree", K.green, "photo-1679006831648-7c9ea12e5807", "Woman in a green saree", "Sabesh Photography LTD"),
      i("Pink & Orange Saree", K.pink, "photo-1617627143750-d86bc21e42bb", "Pink and orange saree", "Sabesh Photography LTD"),
      i("Red & Brown Silk Saree", K.red, "photo-1610030469983-98e550d6193c", "Red and brown saree", "Bulbul Ahmed", { fabric: "Silk" }),
      i("Purple & Gold Saree", K.purple, "photo-1641699862936-be9f49b1c38d", "Purple and gold saree", "Bella Pon Fruitsia", { fabric: "Silk" }),
    ],
  },
  "women-skirts": {
    fabric: "Cotton", fit: "A-line fit", brand: "Maison Kaya", basePrice: 1899,
    blurb: "Skirts with a defined waist and a skirt that moves when you do.",
    items: [
      i("White Tiered Midi Skirt", K.white, "photo-1772723347968-33fe581852b7", "Woman in a white tiered skirt outdoors", "Brooke Balentine"),
      i("White Mini Skirt", K.white, "photo-1594633313515-7ad9334a2349", "Woman in a white mini skirt", "engin akyurt"),
      i("Yellow Check Skirt", K.yellow, "photo-1509182469511-7f0b50bfa63e", "Woman in a yellow and white checked skirt", "Tamara Bellis"),
      i("Ivory Midi Skirt", K.ivory, "photo-1582142306909-195724d33ffc", "Woman in a grey cardigan and white skirt", "Lensabl"),
      i("Floral Print Skirt", K.floral, "photo-1782786982102-81a4a9332080", "Person in a floral skirt and sneakers", "Alexander Mass"),
      i("White Linen Skirt", K.white, "photo-1762342666147-97027524c876", "Woman in a black top and white skirt", "Zulfugar Karimov", { fabric: "Linen" }),
    ],
  },
  "women-jackets": {
    fabric: "Leather / denim", fit: "Regular fit", brand: "Northbay Women", basePrice: 3999,
    blurb: "Outer layers with character: leather, denim and warm trims.",
    items: [
      i("Brown Leather Jacket", K.brown, "photo-1615233500570-c5d7576b4262", "Woman in a brown leather jacket", "Shayna Douglas", { fabric: "Leather" }),
      i("Black Leather Biker Jacket", K.black, "photo-1615397815341-bb06f6d55c94", "Woman in a black leather jacket", "Khalid Boutchich", { fabric: "Leather" }),
      i("Grey Zip Jacket", K.grey, "photo-1715408153725-186c6c77fb45", "Woman in a grey jacket and black trousers", "Behrooz", { fabric: "Cotton blend" }),
      i("Black Fur-Collar Jacket", K.black, "photo-1672529279723-a11dbbbc7782", "Woman in a black jacket with a fur collar", "Venrick Azcueta", { fabric: "Wool blend" }),
      i("Blue Denim Jacket", K.denim, "photo-1571445556382-453d9e858ea9", "Woman in a blue denim jacket", "Carlos Macías", { fabric: "Denim" }),
      i("Brown Bomber Jacket", K.brown, "photo-1591047139829-d91aecb6caea", "Brown bomber jacket on a hanger", "Tobias Tullius", { fabric: "Nylon" }),
    ],
  },
  "women-innerwear": {
    fabric: "Mulberry silk", fit: "Relaxed fit", brand: "Kora Atelier", basePrice: 2499,
    blurb: "Sleep and lounge sets in smooth silk with contrast piping.",
    items: [
      i("Navy Silk Pajama Set", K.navy, "photo-1766056278944-ca0e4f49e61f", "Woman wearing navy silk pajamas with white trim", "MANITO SILK"),
      i("White Silk Pajama Set", K.white, "photo-1766056278842-b754f1e093c0", "Woman in white pajamas standing by a bed", "MANITO SILK"),
      i("Striped Pajama Set", K.stripe, "photo-1766056278967-c0646b1bfd67", "Woman wearing striped pajamas", "MANITO SILK"),
      i("Lilac Silk Pajama Set", K.lilac, "photo-1766056278825-55168658f120", "Woman wearing a light purple silk pajama set", "MANITO SILK"),
      i("White Silk Nightgown", K.white, "photo-1770294759243-664b21a8ac38", "Woman in a white nightgown by a door", "MANITO SILK"),
      i("Light Blue Satin Robe", K.sky, "photo-1770294759006-356f25f4f156", "Woman in a light blue satin robe with white trim", "MANITO SILK", { fabric: "Satin" }),
    ],
  },
  "women-shoes": {
    fabric: "Leather", fit: "Standard fit", brand: "Studio Vane", basePrice: 2499, sizes: ["36", "37", "38", "39", "40", "41"],
    blurb: "Heels and sandals with cushioned insoles and leather uppers.",
    items: [
      i("Yellow Ankle-Strap Sandals", K.yellow, "photo-1534653299134-96a171b61581", "Yellow leather ankle-strap sandals", "Tyron Harkiss-Foster"),
      i("Brown Peep-Toe Heels", K.brown, "photo-1621996659490-3275b4d0d951", "Brown leather peep-toe heels", "Kier in Sight Archives"),
      i("White Stiletto Heels", K.white, "photo-1670938258821-2956d4ce9c9b", "White high heels", "Jean Jacobs"),
      i("Silver Party Heels", K.silver, "photo-1632761298177-51e35403e27e", "Silver high heels", "Fray Bekele", { fabric: "Metallic leather" }),
      i("Tan Strappy Sandals", K.tan, "photo-1535659513767-f1a7b068ebc1", "Brown ankle-strap sandals", "Lauren Rund"),
      i("Brown Open-Toe Heeled Sandals", K.brown, "photo-1630386474440-8f2e6d752a98", "Brown leather open-toe heeled sandals", "Nischal Kanishk"),
    ],
  },
  "women-handbags": {
    fabric: "Leather", fit: "One size", brand: "Maison Kaya", basePrice: 3499, sizes: ["One Size"],
    blurb: "Structured leather bags with polished hardware.",
    items: [
      i("Brown Leather Handbag", K.brown, "photo-1598532163257-ae3c6b2524b6", "Brown leather handbag", "Irene Kredenets"),
      i("Red Leather Handbag", K.red, "photo-1584917865442-de89df76afd3", "Red leather handbag on a white table", "Arno Senoner"),
      i("Black Leather Shoulder Bag", K.black, "photo-1614179689702-355944cd0918", "Black leather handbag with silver hardware", "Laura Chouette"),
      i("Tan Leather Sling Bag", K.tan, "photo-1600857062241-98e5dba7f214", "Brown leather sling bag", "Aurélia Dubois"),
      i("Beige Quilted Handbag", K.sand, "photo-1758171692659-024183c2c272", "Quilted beige handbag with a charm", "Amari Shutters"),
      i("Grey Leather Satchel", K.grey, "photo-1605733513597-a8f8341084e6", "Grey leather satchel with gold buckles", "mostafa mahmoudi"),
    ],
  },
  "women-accessories": {
    fabric: "Mixed materials", fit: "One size", brand: "Kora Atelier", basePrice: 1299, sizes: ["One Size"],
    blurb: "Finishing pieces: jewellery, eyewear and watches.",
    items: [
      i("Gold & Silver Jewellery Set", K.gold, "photo-1606760227091-3dd870d97f1d", "Gold and silver necklaces, earrings and rings", "Martin de Arriba", { fabric: "Gold-plated brass" }),
      i("Gold Milanese Watch", K.gold, "photo-1576053139778-7e32f2ae3cfd", "White and gold analog watch with a Milanese band", "Harper Sunday", { fabric: "Stainless steel" }),
      i("Tortoiseshell Sunglasses", K.brown, "photo-1537832816519-689ad163238b", "Tortoiseshell sunglasses beside a beaded necklace", "S O C I A L . C U T", { fabric: "Acetate" }),
      i("Gold Accessory Edit", K.gold, "photo-1569388330338-53ecda03dfa1", "Gold-coloured accessories", "Harper Sunday"),
      i("Rose Gold Watch & Metallic Bag", K.rose, "photo-1589363358751-ab05797e5629", "Metallic handbag and rose gold watch on a trench coat", "Laura Chouette"),
    ],
  },

  // ────────────────────────────── MEN ──────────────────────────────
  "men-blazers": {
    fabric: "Wool blend", fit: "Tailored fit", brand: "Northbay Men", basePrice: 5499,
    blurb: "Half-canvas blazers with soft shoulders and functional cuffs.",
    items: [
      i("Navy Two-Piece Suit Blazer", K.navy, "photo-1617137984095-74e4e5e3613f", "Man in a blue suit", "Mohamad Khosravi"),
      i("Black Tailored Blazer", K.black, "photo-1617127365659-c47fa864d8bc", "Man in a black suit jacket and sunglasses", "Mohamad Khosravi"),
      i("Blue City Blazer", K.blue, "photo-1617137968427-85924c800a22", "Man in a blue suit on a sidewalk", "Mohamad Khosravi"),
      i("Grey Suit Blazer", K.grey, "photo-1622497170185-5d668f816a56", "Man in a grey suit jacket on concrete stairs", "Mohamad Khosravi"),
      i("Blue Plaid Blazer", K.blue, "photo-1593030942428-a5451dca4b42", "Man in a blue plaid blazer", "Benjamin R."),
      i("Black Suit Jacket", K.black, "photo-1592343516109-362f7bd871aa", "Black suit jacket on a hanger", "Victoria Priessnitz"),
    ],
  },
  "men-trousers": {
    fabric: "Cotton twill", fit: "Slim fit", brand: "Aurelle", basePrice: 2299,
    blurb: "Chinos and smart trousers with a clean, tapered leg.",
    items: [
      i("Black Slim Chinos", K.black, "photo-1584865288642-42078afe6942", "Man in a white T-shirt and black trousers", "Santhosh Vaithiyanathan"),
      i("Grey Stretch Trousers", K.grey, "photo-1499202977705-65f436dac18a", "Man in a black shirt and grey trousers", "Caleb Woods"),
      i("Beige Chinos", K.sand, "photo-1788380944948-f5fe4a3b3a13", "Man in a striped polo and beige trousers", "MOHAMMAD AL JANNAT RAKIN"),
      i("Stone Relaxed Chinos", K.sand, "photo-1791573391881-98b6b072e7ff", "Man in a black polo and beige trousers", "Ernest Flowers"),
      i("Tan Pleated Trousers", K.tan, "photo-1789238052416-d6c439162025", "Person in a white shirt and tan trousers", "Henry Rodrigues"),
      i("Black Tapered Trousers", K.black, "photo-1584864783592-f1d6d4fcd1d0", "Man in black trousers", "Santhosh Vaithiyanathan"),
    ],
  },
  "men-tshirts": {
    fabric: "Cotton jersey", fit: "Regular fit", brand: "Studio Vane", basePrice: 899,
    blurb: "Heavyweight cotton tees that hold their shape wash after wash.",
    items: [
      i("White Crew-Neck T-shirt", K.white, "photo-1586790170083-2f9ceadc732d", "Man in a white crew-neck T-shirt", "Sahil Moosa"),
      i("Black Crew-Neck T-shirt", K.black, "photo-1571455786673-9d9d6c194f90", "Man wearing a black crew-neck T-shirt", "Luis Quintero"),
      i("Black Essential Tee", K.black, "photo-1502389614483-e475fc34407e", "Man in a black T-shirt by a white wall", "ian dooley"),
      i("White Cotton Tee", K.white, "photo-1601608319973-2bbf90f917b5", "Man in a white T-shirt by a brick wall", "Chukwuebuka Nwaju"),
      i("Black Heavyweight Tee", K.black, "photo-1618354691373-d851c5c3a990", "Black crew-neck T-shirt", "Ryan Hoffman"),
      i("Green Cotton Tee", K.green, "photo-1633966887768-64f9a867bdba", "Green T-shirt", "Hamed darzi"),
    ],
  },
  "men-shirts": {
    fabric: "Cotton poplin", fit: "Slim fit", brand: "Northbay Men", basePrice: 1799,
    blurb: "Shirts in fine cotton with a structured collar.",
    items: [
      i("Blue Oxford Shirt", K.blue, "photo-1740711152088-88a009e877bb", "Blue shirt hanging on a white wall", "Robert Richman", { fabric: "Oxford cotton" }),
      i("White Formal Shirt", K.white, "photo-1602810318383-e386cc2a3ccf", "White button-up shirt on a wooden table", "Nimble Made"),
      i("Blue Button-Up Shirt", K.blue, "photo-1602810316693-3667c854239a", "Blue button-up shirt", "Nimble Made"),
      i("White & Purple Check Shirt", K.lilac, "photo-1603252110481-7ba873bf42ab", "White and purple button-up shirt", "Nimble Made"),
      i("Polka Dot Shirt", K.white, "photo-1602810319428-019690571b5b", "White and black polka dot shirt", "Nimble Made"),
      i("Red Striped Shirt", K.red, "photo-1791631064348-0337580f80d1", "Red and white striped shirt", "Arlind Photography"),
    ],
  },
  "men-jeans": {
    fabric: "Denim", fit: "Straight fit", brand: "Kora Atelier", basePrice: 2299,
    blurb: "Selvedge-look denim with a straight, comfortable leg.",
    items: [
      i("Mid Blue Straight Jeans", K.denim, "photo-1714143136372-ddaf8b606da7", "A pair of blue jeans", "TuanAnh Blue"),
      i("Dark Indigo Jeans", K.navy, "photo-1714143164072-7646ef5cb24d", "Dark blue jeans", "TuanAnh Blue"),
      i("Classic Blue Jeans", K.denim, "photo-1605518216938-7c31b7b14ad0", "Blue denim jeans on a black surface", "Eduardo Pastor"),
      i("Washed Denim Stack", K.blue, "photo-1565084888279-aca607ecce0c", "Pile of blue denim jeans", "Waldemar Brandt"),
      i("Relaxed Fit Jeans", K.denim, "photo-1617114919297-3c8ddb01f599", "Man in a tan jacket and blue jeans", "Mohamad Khosravi"),
      i("Light Wash Jeans", K.sky, "photo-1715758890151-2c15d5d482aa", "Jeans hanging on a clothes rack", "TuanAnh Blue"),
    ],
  },
  "men-kurtas": {
    fabric: "Cotton", fit: "Regular fit", brand: "Aurelle", basePrice: 1999,
    blurb: "Kurtas with a band collar, cut long for festive days.",
    items: [
      i("Blue Cotton Kurta Set", K.blue, "photo-1770359993283-a2c2f386584e", "Man in a blue kurta and pants", "Noor Alam"),
      i("Blue Kurta with Printed Vest", K.blue, "photo-1767775498862-d4740ce574ce", "Man in a blue kurta and patterned vest", "Noor Alam"),
      i("Sky Blue Kurta", K.sky, "photo-1772736243289-872f9ac73cf8", "Man in a blue kurta", "AJOY DAS"),
      i("Lilac Kurta with Embellished Vest", K.lilac, "photo-1774267230662-575d1f4ec1bd", "Man in a light purple kurta and embellished vest", "Noor Alam", { fabric: "Silk blend" }),
      i("Cream Kurta", K.cream, "photo-1781106785213-ee999c3edf50", "Man in a cream kurta", "MOHAMMAD AL JANNAT RAKIN"),
      i("Yellow Festive Kurta", K.yellow, "photo-1701365676249-9d7ab5022dec", "Man in a yellow kurta", "Abhishek Rai"),
    ],
  },
  "men-jackets": {
    fabric: "Leather / denim", fit: "Regular fit", brand: "Northbay Men", basePrice: 3999,
    blurb: "Jackets for every season: leather, denim and technical shells.",
    items: [
      i("Blue Denim Jacket", K.denim, "photo-1611312449408-fcece27cdbb7", "Blue denim button-up jacket", "Caio Coelho", { fabric: "Denim" }),
      i("Black Leather Jacket", K.black, "photo-1675877879221-871aa9f7c314", "Man in a black leather jacket", "Mohamad Khosravi", { fabric: "Leather" }),
      i("Brown Zip Hoodie Jacket", K.brown, "photo-1548883354-94bcfe321cbb", "Man in a brown full-zip jacket", "Kyle Loftus", { fabric: "Cotton fleece" }),
      i("Black Leather Biker", K.black, "photo-1725106028906-695e57afb682", "Man in a black leather jacket over a green sweater", "Julia Kadel", { fabric: "Leather" }),
      i("Yellow Outdoor Shell", K.yellow, "photo-1649768722562-c4d276b82dcb", "Man in a yellow jacket", "Romain Gal", { fabric: "Nylon" }),
      i("Black Casual Jacket", K.black, "photo-1705514234104-b3cf64c3bf4e", "Man in a black jacket", "Mohanraja C"),
    ],
  },
  "men-innerwear": {
    fabric: "Combed cotton", fit: "Comfort fit", brand: "Kora Atelier", basePrice: 499,
    blurb: "Everyday essentials in soft, breathable cotton.",
    items: [
      i("White Cotton Undershirt", K.white, "photo-1651761179569-4ba2aa054997", "White T-shirt on a white background", "mockupbee"),
      i("Thermal Long-Sleeve Base Layer", K.white, "photo-1620799140408-edc6dcb6d633", "White crew-neck long-sleeve shirt", "Mediamodifier"),
      i("Blue & Black Socks Pack", K.navy, "photo-1615486364462-ef6363adbc18", "Blue and black socks", "Mockup Graphics", { fabric: "Cotton blend" }),
      i("Grey Cotton Socks", K.grey, "photo-1613151848917-80e67f421fff", "Grey sock", "Nynne Schrøder", { fabric: "Cotton blend" }),
      i("Striped Crew Socks", K.multi, "photo-1585499583264-491df5142e83", "Blue, white and yellow socks", "Nick Page", { fabric: "Cotton blend" }),
      i("Essentials Multipack Tees", K.multi, "photo-1562157873-818bc0726f68", "Assorted colour folded T-shirts", "Md Salman"),
    ],
  },
  "men-accessories": {
    fabric: "Leather", fit: "One size", brand: "Studio Vane", basePrice: 1499, sizes: ["One Size"],
    blurb: "Wallets, belts and finishing pieces in full-grain leather.",
    items: [
      i("Black Bifold Wallet", K.black, "photo-1629139033414-76f3c0eacf84", "Black leather bifold wallets beside eyeglasses", "Kai Cheng"),
      i("Leather Wallet Collection", K.brown, "photo-1775379557015-938546264440", "Assorted leather wallets", "Timo K"),
      i("Brown Leather Belt", K.brown, "photo-1664286074176-5206ee5dc878", "Leather belt on a black surface", "seeetz"),
      i("Classic Buckle Belt", K.brown, "photo-1664286074240-d7059e004dff", "Close-up of a leather belt", "seeetz"),
      i("Shoes, Wallet & Belt Set", K.brown, "photo-1637868796504-32f45a96d5a0", "Shoes, a wallet and a belt laid out on a table", "Marcin Kempa"),
      i("Evening Accessory Set", K.black, "photo-1777606310851-5b28cca6676f", "A watch, bow tie, cologne and shoe", "Gabriel Rojas", { fabric: "Mixed materials" }),
    ],
  },
  "men-shoes": {
    fabric: "Leather", fit: "Standard fit", brand: "Northbay Men", basePrice: 3499, sizes: ["6", "7", "8", "9", "10", "11"],
    blurb: "Goodyear-style leather shoes and boots with stitched soles.",
    items: [
      i("Brown Leather Boots", K.brown, "photo-1605733160314-4fc7dac4bb16", "Brown leather boots", "mostafa mahmoudi"),
      i("Black Leather Formal Shoes", K.black, "photo-1668069226492-508742b03147", "Black leather shoes", "Davinder Singh"),
      i("Tan Leather Brogues", K.tan, "photo-1614253429340-98120bd6d753", "Brown leather shoes on tiles", "Noah Smith"),
      i("Brown Lace-Up Shoes", K.brown, "photo-1614252235316-8c857d38b5f4", "Brown leather lace-up shoes", "Ayrus Hill"),
      i("Black & Brown Lace-Up Boots", K.brown, "photo-1621996659546-b0dd8b7e57af", "Black and brown lace-up boots", "Kier in Sight Archives"),
      i("Brown Dress Shoes", K.brown, "photo-1563434649554-58f91d22ec2c", "Brown leather dress shoes", "rupixen"),
      i("Cognac Oxford Shoes", K.camel, "photo-1616696038562-574c18066055", "Brown leather shoes on teal", "Ayrus Hill"),
      i("Chestnut Derby Shoes", K.brown, "photo-1616663308968-58162d332720", "Brown leather shoes on blue fabric", "Noah Smith"),
    ],
  },
  "men-watches": {
    fabric: "Stainless steel", fit: "One size", brand: "Aurelle", basePrice: 6999, sizes: ["One Size"],
    blurb: "Chronographs and dress watches with sapphire-coated glass.",
    items: [
      i("Silver Chronograph, Brown Strap", K.brown, "photo-1542496658-e33a6d0d50f6", "Silver chronograph watch with a brown leather band", "Fabian Heimann", { fabric: "Steel / leather" }),
      i("Steel Link Dress Watch", K.silver, "photo-1547996160-81dfa63595aa", "Silver analog watch with a link band", "Ryan Waring"),
      i("Black & Silver Chronograph", K.black, "photo-1622434641406-a158123450f9", "Black and silver chronograph watch", "Shreesha bhat"),
      i("Steel Bracelet Chronograph", K.silver, "photo-1629581678313-36cf745a9af9", "Silver link bracelet chronograph watch", "VVS ™"),
      i("Grey Dial, Brown Leather", K.grey, "photo-1557531365-e8b22d93dbd0", "Grey analog watch with a brown band", "Rick Muigo", { fabric: "Steel / leather" }),
      i("Two-Tone Chronograph", K.gold, "photo-1587925358603-c2eea5305bbc", "Silver and gold chronograph watch", "LOGAN WEAVER"),
      i("Gold & Black Chronograph", K.gold, "photo-1573261821759-fdd1b36d9ca5", "Gold-coloured and black chronograph with a link bracelet", "Josh Miller"),
      i("Black & White Chronograph", K.black, "photo-1539874754764-5a96559165b0", "Black and white chronograph with a brown leather band", "Pixel Bee", { fabric: "Steel / leather" }),
    ],
  },
};

export function itemPhotos(it: Item): ProductPhoto[] {
  const credit = {
    name: it.by,
    profile: `https://unsplash.com/s/users/${encodeURIComponent(it.by)}`,
    page: `https://images.unsplash.com/${it.photo}`,
  };
  return [
    { id: it.photo, alt: it.alt, credit, kind: "look" },
    { id: it.photo, alt: `${it.alt} — close-up`, credit, kind: "detail", fx: 0.5, fy: it.fy ?? 0.5 },
  ];
}
