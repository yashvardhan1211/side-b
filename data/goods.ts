/**
 * SIDE B Goods — merchandise catalog.
 *
 * Commerce is in demo/preorder mode only.
 * No real payment, inventory, or shipping data is represented here.
 */

import type { Product } from "@/lib/types";

export const PRODUCTS: Product[] = [
  {
    id: "first-press-001",
    name: "First Press 001",
    collection: "Field Archive",
    description: "An oversized washed-black T-shirt for people who know the B-side. The first object in the SIDE B archive.",
    details: [
      "Oversized fit, drop shoulder",
      "100% cotton, enzyme-washed",
      "Small SIDE B wordmark, front chest",
      "Archival back print: 'INDIA, BEYOND THE OBVIOUS.'",
      "FIELD ARCHIVE 001 · FIRST PRESS 001",
      "Printed in India",
      "Pre-shrunk, cold wash recommended",
    ],
    priceInr: 999,
    variants: [
      { size: "XS", available: false },
      { size: "S",  available: true  },
      { size: "M",  available: true  },
      { size: "L",  available: true  },
      { size: "XL", available: true  },
      { size: "XXL",available: false },
    ],
    status: "preorder",
    images: [],   // No external URLs — placeholder handled in component
    edition: "FIRST PRESS 001",
  },
];

export function getProductById(id: string): Product | null {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}
