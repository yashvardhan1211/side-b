"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { RARITY_CONFIG, RARITY_ORDER } from "@/lib/config";
import { markOnboardingComplete } from "@/lib/storage";
import Button from "@/components/ui/Button";

const STEPS = [
  {
    number: "01",
    title: "Read the cultural clue.",
    body: "Each question comes from Indian music, cinema, food, internet history, advertising, cricket, or regional culture. It is a prompt, not a trick.",
  },
  {
    number: "02",
    title: "Make one guess.",
    body: "You get one submission per question. Spelling is normalised. Punctuation is ignored. Think before you submit.",
  },
  {
    number: "03",
    title: "Discover the answer and its rarity.",
    body: "Every answer comes with its rarity tier and a small piece of context. Even a wrong answer teaches you something.",
  },
  {
    number: "04",
    title: "Complete the edition and share your score.",
    body: "Five questions make one edition. Your final score and rank can be shared. A new cut drops every day.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length;

  const handleNext = () => {
    if (step < STEPS.length) {
      setStep(step + 1);
    } else {
      markOnboardingComplete();
      router.push("/play");
    }
  };

  const handleSkip = () => {
    markOnboardingComplete();
    router.push("/play");
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-content mx-auto w-full px-5 md:px-0 py-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-8">
          <h1
            className="font-serif font-black text-2xl"
            style={{ color: "var(--color-ink)" }}
          >
            SIDE B
          </h1>
          <button
            onClick={handleSkip}
            className="label-caps underline underline-offset-2 hover:opacity-60 transition-opacity"
          >
            Skip intro
          </button>
        </div>

        <div className="rule-heavy mb-8" />

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-0.5 flex-1 transition-all duration-300"
              style={{
                backgroundColor:
                  i < step
                    ? "var(--color-ink)"
                    : i === step
                    ? "var(--color-dust)"
                    : "var(--color-dust-border)",
              }}
            />
          ))}
        </div>

        {/* Content */}
        {!isLast ? (
          <div className="flex-1 animate-fade-in" key={step}>
            <p className="label-caps mb-2" style={{ color: "var(--color-oxblood)" }}>
              How it works · {STEPS[step].number}
            </p>
            <h2
              className="font-serif text-3xl md:text-4xl font-bold leading-snug mb-6"
              style={{ color: "var(--color-ink)" }}
            >
              {STEPS[step].title}
            </h2>
            <p
              className="text-base leading-relaxed mb-8 max-w-prose-sm"
              style={{ color: "var(--color-dust)" }}
            >
              {STEPS[step].body}
            </p>

            {/* Rarity intro on last step */}
            {step === 2 && (
              <div className="mb-8">
                <p className="label-caps mb-3">The six rarity tiers</p>
                <div
                  className="space-y-px"
                  style={{ backgroundColor: "var(--color-dust-border)" }}
                >
                  {RARITY_ORDER.map((tierId) => {
                    const config = RARITY_CONFIG[tierId];
                    return (
                      <div
                        key={tierId}
                        className="flex items-center justify-between px-4 py-3"
                        style={{ backgroundColor: "var(--color-paper)" }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-block rounded-full flex-shrink-0"
                            style={{
                              width: "8px",
                              height: "8px",
                              backgroundColor: config.dotColor,
                            }}
                          />
                          <span
                            className="font-mono text-xs font-medium"
                            style={{ color: "var(--color-ink)" }}
                          >
                            {config.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="label-caps">{config.shortDesc}</span>
                          <span
                            className="font-mono text-xs ml-4"
                            style={{ color: "var(--color-ink)" }}
                          >
                            {config.points} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center animate-fade-in">
            <div
              className="w-12 h-12 flex items-center justify-center mb-6"
              style={{ backgroundColor: "var(--color-ink)" }}
            >
              <Check size={20} color="var(--color-paper)" />
            </div>
            <h2
              className="font-serif text-3xl font-bold mb-3"
              style={{ color: "var(--color-ink)" }}
            >
              You're ready.
            </h2>
            <p
              className="text-base mb-8"
              style={{ color: "var(--color-dust)" }}
            >
              The Daily Cut is waiting. One guess per question. Good luck.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-auto">
          <Button fullWidth size="lg" onClick={handleNext} className="group">
            {isLast ? "Start playing" : "Next →"}
            <ArrowRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" />
          </Button>

          {step > 0 && !isLast && (
            <button
              onClick={() => setStep(step - 1)}
              className="w-full mt-3 py-2 label-caps text-center hover:opacity-60 transition-opacity"
              style={{ color: "var(--color-dust)" }}
            >
              ← Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
