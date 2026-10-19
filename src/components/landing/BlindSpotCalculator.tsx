"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { SectionHeading } from "@/components/site/SectionHeading";
import { REPORT_PRICE_CENTS } from "@/lib/pricing";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function BlindSpotCalculator() {
  const [lostPerMonth, setLostPerMonth] = useState(3);
  const [dealValue, setDealValue] = useState(5000);

  const yearly = lostPerMonth * 12 * dealValue;
  const reportsPerDeal = Math.floor(dealValue / (REPORT_PRICE_CENTS / 100));

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
      <div>
        <SectionHeading
          label="The cost of guessing"
          title="What are competitors you cannot name costing you?"
          body="Move the sliders to match your business. It is simple arithmetic on your own numbers."
        />

        <div className="mt-8 space-y-7">
          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="lost" className="text-sm font-medium text-navy-800">
                Deals you lose each month to rivals you cannot name
              </label>
              <span className="font-mono text-sm font-semibold text-brass-600">
                {lostPerMonth}
              </span>
            </div>
            <input
              id="lost"
              type="range"
              min={1}
              max={20}
              step={1}
              value={lostPerMonth}
              onChange={(e) => setLostPerMonth(Number(e.target.value))}
              className="mt-3 w-full accent-brass-500"
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="value" className="text-sm font-medium text-navy-800">
                Average value of a deal
              </label>
              <span className="font-mono text-sm font-semibold text-brass-600">
                {money.format(dealValue)}
              </span>
            </div>
            <input
              id="value"
              type="range"
              min={500}
              max={50000}
              step={500}
              value={dealValue}
              onChange={(e) => setDealValue(Number(e.target.value))}
              className="mt-3 w-full accent-brass-500"
            />
          </div>
        </div>
      </div>

      <div className="instrument-panel card-glow relative p-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brass-400">
          Revenue at stake each year
        </p>
        <p
          className="mt-3 font-display text-5xl font-semibold text-cream-50 sm:text-6xl"
          aria-live="polite"
        >
          {money.format(yearly)}
        </p>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-cream-200">
          At these numbers, winning back a single deal is worth about{" "}
          <span className="font-semibold text-brass-300">{reportsPerDeal}</span> reports.
        </p>
        <div className="mt-6">
          <ButtonLink href="/onboarding/1" size="lg">
            Find out who they are
            <ArrowRight size={16} />
          </ButtonLink>
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-cream-300">
          Simple arithmetic from your inputs. Not a forecast.
        </p>
      </div>
    </div>
  );
}
