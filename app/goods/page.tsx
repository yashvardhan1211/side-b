import type { Metadata } from "next";
import { PRODUCTS } from "@/data/goods";
import GoodsProduct from "./GoodsProduct";

export const metadata: Metadata = {
  title: "SIDE B Goods",
  description: "Objects from the SIDE B archive.",
};

export default function GoodsPage() {
  return (
    <div className="flex-1">
      <div className="max-w-wide mx-auto px-5 md:px-8 py-10">
        {/* Header */}
        <span className="label-caps block mb-2">SIDE B Goods</span>
        <div className="rule-heavy mb-6" />

        <h1
          className="font-serif text-4xl md:text-5xl font-black mb-3"
          style={{ color: "var(--color-ink)" }}
        >
          Objects from the archive.
        </h1>
        <p
          className="text-sm mb-10 max-w-prose-sm"
          style={{ color: "var(--color-dust)" }}
        >
          A small, curated collection. Things made for people who know the
          B-side. Starting with the first press.
        </p>

        {/* Products */}
        <div className="space-y-16">
          {PRODUCTS.map((product) => (
            <GoodsProduct key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
