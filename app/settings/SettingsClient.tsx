"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { resetAllData } from "@/lib/storage";

export default function SettingsClient() {
  const [reportText, setReportText] = useState("");
  const [reportCategory, setReportCategory] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [reportError, setReportError] = useState("");

  const [resetStep, setResetStep] = useState<"idle" | "confirm">("idle");
  const [resetDone, setResetDone] = useState(false);

  const handleReport = () => {
    if (!reportText.trim()) {
      setReportError("Please describe the issue.");
      return;
    }
    if (!reportCategory) {
      setReportError("Please select an issue type.");
      return;
    }
    setReportError("");
    // Local demo only — nothing is sent to a server
    console.log("[SIDE B] Report submitted (demo):", { reportText, reportCategory });
    setReportSent(true);
  };

  const handleReset = () => {
    resetAllData();
    setResetStep("idle");
    setResetDone(true);
  };

  return (
    <div>
      {/* Report an issue */}
      <section id="report" className="mb-10">
        <h2
          className="font-serif text-2xl font-bold mb-4"
          style={{ color: "var(--color-ink)" }}
        >
          Report an answer issue
        </h2>

        {reportSent ? (
          <div
            className="border p-4"
            style={{
              borderColor: "var(--color-dust-border)",
              backgroundColor: "rgba(36,36,33,0.04)",
            }}
          >
            <p className="label-caps mb-1">Report noted</p>
            <p className="text-sm" style={{ color: "var(--color-dust)" }}>
              <strong>This is a demo.</strong> No report has been sent to a
              server. In a production version, this would be submitted for
              editorial review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="report-type"
                className="label-caps block mb-2"
              >
                Issue type
              </label>
              <select
                id="report-type"
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                className="w-full px-4 py-3 font-sans text-sm border focus:outline-none"
                style={{
                  backgroundColor: "var(--color-paper)",
                  borderColor: "var(--color-dust-border)",
                  color: "var(--color-ink)",
                  borderRadius: "2px",
                }}
              >
                <option value="">Select a type</option>
                <option value="wrong-answer">My correct answer was rejected</option>
                <option value="factual-error">The answer or explanation has a factual error</option>
                <option value="rarity">The rarity tier seems wrong</option>
                <option value="other">Something else</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="report-text"
                className="label-caps block mb-2"
              >
                Description
              </label>
              <textarea
                id="report-text"
                rows={4}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Describe the issue, including the question and your answer..."
                className="w-full px-4 py-3 font-sans text-sm border focus:outline-none resize-none"
                style={{
                  backgroundColor: "var(--color-paper)",
                  borderColor: "var(--color-dust-border)",
                  color: "var(--color-ink)",
                  borderRadius: "2px",
                }}
              />
            </div>

            {reportError && (
              <p
                className="text-xs font-mono"
                style={{ color: "var(--color-oxblood)" }}
              >
                {reportError}
              </p>
            )}

            <button
              onClick={handleReport}
              className="px-6 py-3 font-mono text-xs tracking-widest uppercase transition-opacity hover:opacity-80"
              style={{
                backgroundColor: "var(--color-ink)",
                color: "var(--color-paper)",
                borderRadius: "2px",
              }}
            >
              Submit report (demo)
            </button>

            <p className="label-caps" style={{ color: "var(--color-dust)" }}>
              Reports are not sent to a server in this demo version.
            </p>
          </div>
        )}
      </section>

      {/* Reset data */}
      <section id="reset" className="mb-10">
        <h2
          className="font-serif text-2xl font-bold mb-4"
          style={{ color: "var(--color-ink)" }}
        >
          Reset local data
        </h2>

        {resetDone ? (
          <div
            className="border p-4"
            style={{ borderColor: "var(--color-dust-border)" }}
          >
            <p className="label-caps mb-1">Data cleared</p>
            <p className="text-sm" style={{ color: "var(--color-dust)" }}>
              All local game data, stats, and settings have been removed. Reload
              the page to start fresh.
            </p>
          </div>
        ) : resetStep === "idle" ? (
          <div>
            <p className="text-sm mb-4" style={{ color: "var(--color-dust)" }}>
              This will permanently delete all your local game history,
              statistics, and settings. This cannot be undone.
            </p>
            <button
              onClick={() => setResetStep("confirm")}
              className="px-6 py-3 font-mono text-xs tracking-widest uppercase transition-opacity hover:opacity-80 border"
              style={{
                borderColor: "var(--color-oxblood)",
                color: "var(--color-oxblood)",
                backgroundColor: "transparent",
                borderRadius: "2px",
              }}
            >
              Reset all data
            </button>
          </div>
        ) : (
          <div
            className="border p-5"
            style={{ borderColor: "var(--color-oxblood)" }}
          >
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle
                size={16}
                style={{ color: "var(--color-oxblood)", flexShrink: 0, marginTop: "2px" }}
              />
              <div>
                <p
                  className="font-serif font-bold mb-1"
                  style={{ color: "var(--color-ink)" }}
                >
                  Are you sure?
                </p>
                <p className="text-sm" style={{ color: "var(--color-dust)" }}>
                  This will permanently delete your streak, all scores, and your
                  entire game history. It cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 font-mono text-xs tracking-widest uppercase"
                style={{
                  backgroundColor: "var(--color-oxblood)",
                  color: "var(--color-paper)",
                  borderRadius: "2px",
                }}
              >
                Yes, delete everything
              </button>
              <button
                onClick={() => setResetStep("idle")}
                className="flex-1 py-3 font-mono text-xs tracking-widest uppercase border"
                style={{
                  borderColor: "var(--color-dust-border)",
                  color: "var(--color-ink)",
                  borderRadius: "2px",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
