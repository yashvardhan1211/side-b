"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";

interface GoodsProductProps {
  product: Product;
}

const SIZE_GUIDE: Record<string, { chest: string; length: string }> = {
  XS:  { chest: "38″", length: "26″" },
  S:   { chest: "40″", length: "27″" },
  M:   { chest: "43″", length: "28″" },
  L:   { chest: "46″", length: "29″" },
  XL:  { chest: "50″", length: "30″" },
  XXL: { chest: "54″", length: "31″" },
};

export default function GoodsProduct({ product }: GoodsProductProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [orderState, setOrderState] = useState<"idle" | "confirming" | "done">("idle");
  const [sizeError, setSizeError] = useState(false);

  const handlePreorder = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    setOrderState("confirming");
  };

  const handleConfirm = () => {
    setOrderState("done");
  };

  const handleCancel = () => {
    setOrderState("idle");
  };

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-start">
        {/* Product visual */}
        <div>
          <div
            className="aspect-[3/4] flex flex-col items-center justify-between p-8"
            style={{ backgroundColor: "#1a1a18" }}
          >
            {/* Front */}
            <div className="flex-1 flex items-center justify-center w-full">
              <div className="text-center">
                <p
                  className="font-serif font-black text-5xl mb-2"
                  style={{ color: "rgba(242,235,221,0.15)" }}
                >
                  SB
                </p>
              </div>
            </div>

            {/* Back print preview */}
            <div
              className="w-full border-t pt-6"
              style={{ borderColor: "rgba(242,235,221,0.1)" }}
            >
              <p
                className="font-mono text-xs tracking-widest uppercase text-center"
                style={{ color: "rgba(242,235,221,0.6)", letterSpacing: "0.25em", fontSize: "0.5rem" }}
              >
                INDIA, BEYOND THE OBVIOUS.
              </p>
              <p
                className="font-mono text-2xs text-center mt-1"
                style={{ color: "rgba(242,235,221,0.3)", fontSize: "0.45rem", letterSpacing: "0.15em" }}
              >
                A STUDY IN THINGS OVERLOOKED · FIELD ARCHIVE 001 · FIRST PRESS 001
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div className="mt-3 flex items-center gap-2">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs tracking-widest uppercase"
              style={{
                backgroundColor:
                  product.status === "preorder"
                    ? "var(--color-oxblood)"
                    : "var(--color-dust-light)",
                color:
                  product.status === "preorder"
                    ? "var(--color-paper)"
                    : "var(--color-ink)",
              }}
            >
              <span
                className="inline-block rounded-full"
                style={{
                  width: "5px",
                  height: "5px",
                  backgroundColor: "currentColor",
                  opacity: 0.7,
                }}
              />
              {product.status === "preorder" ? "Pre-order open" : product.status}
            </div>
            <span className="label-caps">{product.edition}</span>
          </div>
        </div>

        {/* Product details */}
        <div>
          <p className="label-caps mb-2" style={{ color: "var(--color-oxblood)" }}>
            {product.collection}
          </p>
          <h2
            className="font-serif text-3xl font-black mb-2"
            style={{ color: "var(--color-ink)" }}
          >
            {product.name}
          </h2>
          <p
            className="font-mono text-2xl font-medium mb-4"
            style={{ color: "var(--color-ink)" }}
          >
            ₹{product.priceInr.toLocaleString("en-IN")}
          </p>
          <p
            className="text-sm leading-relaxed mb-6"
            style={{ color: "var(--color-dust)" }}
          >
            {product.description}
          </p>

          {/* Details list */}
          <div className="mb-6">
            <p className="label-caps mb-2">Details</p>
            <ul className="space-y-1">
              {product.details.map((d) => (
                <li
                  key={d}
                  className="text-sm"
                  style={{ color: "var(--color-dust)" }}
                >
                  — {d}
                </li>
              ))}
            </ul>
          </div>

          <div className="rule mb-6" />

          {/* Size selection */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="label-caps">Select size</p>
              <button
                onClick={() => setShowSizeGuide(!showSizeGuide)}
                className="label-caps underline underline-offset-2 hover:opacity-60 transition-opacity"
              >
                {showSizeGuide ? "Hide guide" : "Size guide"}
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {product.variants.map(({ size, available }) => (
                <button
                  key={size}
                  onClick={() => {
                    if (!available) return;
                    setSelectedSize(size);
                    setSizeError(false);
                  }}
                  disabled={!available}
                  aria-pressed={selectedSize === size}
                  className="w-12 h-12 font-mono text-sm transition-all"
                  style={{
                    backgroundColor:
                      selectedSize === size
                        ? "var(--color-ink)"
                        : "transparent",
                    color:
                      !available
                        ? "var(--color-dust)"
                        : selectedSize === size
                        ? "var(--color-paper)"
                        : "var(--color-ink)",
                    border: `1px solid ${
                      !available
                        ? "var(--color-dust-border)"
                        : selectedSize === size
                        ? "var(--color-ink)"
                        : "var(--color-dust)"
                    }`,
                    opacity: available ? 1 : 0.4,
                    cursor: available ? "pointer" : "not-allowed",
                    textDecoration: available ? "none" : "line-through",
                  }}
                >
                  {size}
                </button>
              ))}
            </div>

            {sizeError && (
              <p
                className="text-xs mt-2 font-mono"
                style={{ color: "var(--color-oxblood)" }}
              >
                Please select a size.
              </p>
            )}
          </div>

          {/* Size guide */}
          {showSizeGuide && (
            <div
              className="border p-4 mb-4 text-xs"
              style={{ borderColor: "var(--color-dust-border)" }}
            >
              <p className="label-caps mb-2">Measurements (approx, relaxed fit)</p>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left font-mono pb-1" style={{ color: "var(--color-dust)" }}>Size</th>
                    <th className="text-left font-mono pb-1" style={{ color: "var(--color-dust)" }}>Chest</th>
                    <th className="text-left font-mono pb-1" style={{ color: "var(--color-dust)" }}>Length</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(SIZE_GUIDE).map(([sz, m]) => (
                    <tr key={sz}>
                      <td className="py-0.5 font-mono" style={{ color: "var(--color-ink)" }}>{sz}</td>
                      <td className="py-0.5 font-mono" style={{ color: "var(--color-ink)" }}>{m.chest}</td>
                      <td className="py-0.5 font-mono" style={{ color: "var(--color-ink)" }}>{m.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Purchase action */}
          {orderState === "idle" && (
            <button
              onClick={handlePreorder}
              className="w-full py-4 font-mono text-xs tracking-widest uppercase transition-opacity hover:opacity-85"
              style={{
                backgroundColor: "var(--color-ink)",
                color: "var(--color-paper)",
                letterSpacing: "0.1em",
              }}
            >
              Pre-order — ₹{product.priceInr.toLocaleString("en-IN")}
            </button>
          )}

          {orderState === "confirming" && (
            <div
              className="border p-5"
              style={{ borderColor: "var(--color-dust-border)" }}
            >
              <p className="label-caps mb-2">Confirm pre-order</p>
              <p className="text-sm mb-4" style={{ color: "var(--color-dust)" }}>
                <strong style={{ color: "var(--color-ink)" }}>
                  This is a demo. No payment will be processed.
                </strong>{" "}
                Real pre-orders and payment will be available at launch.
                Selected size: {selectedSize} · ₹{product.priceInr.toLocaleString("en-IN")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 font-mono text-xs tracking-widest uppercase"
                  style={{
                    backgroundColor: "var(--color-oxblood)",
                    color: "var(--color-paper)",
                  }}
                >
                  Confirm (demo)
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 font-mono text-xs tracking-widest uppercase border"
                  style={{
                    borderColor: "var(--color-dust-border)",
                    color: "var(--color-ink)",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {orderState === "done" && (
            <div
              className="border p-5"
              style={{
                borderColor: "var(--color-dust-border)",
                backgroundColor: "rgba(36,36,33,0.04)",
              }}
            >
              <p className="label-caps mb-2" style={{ color: "var(--color-oxblood)" }}>
                Demo pre-order noted
              </p>
              <p className="text-sm" style={{ color: "var(--color-dust)" }}>
                This is a demo interaction. No real order has been placed and
                no payment has been processed. Real pre-orders will open at
                launch. Thank you for your interest in First Press 001.
              </p>
            </div>
          )}

          <p
            className="text-xs mt-3 text-center"
            style={{ color: "var(--color-dust)" }}
          >
            Pre-orders are not charged until the product ships. No real payment
            is being processed in this demo.
          </p>
        </div>
      </div>
    </div>
  );
}
