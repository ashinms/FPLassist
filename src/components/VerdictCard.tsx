"use client";

import { useState } from "react";
import type { Comparison } from "@/lib/compare";
import type { AgentVerdict, ArbiterVerdict } from "@/lib/agents";
import type { PlayerScore } from "@/lib/scoring";

export interface DebateResult {
  comparison: Comparison;
  bull: AgentVerdict;
  bear: AgentVerdict;
  arbiter: ArbiterVerdict;
}

const VERDICT_STYLES: Record<ArbiterVerdict["verdict"], string> = {
  BUY: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  SELL: "bg-rose-500/15 text-rose-400 ring-rose-500/30",
  HOLD: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
};

const RISK_STYLES: Record<ArbiterVerdict["riskRating"], string> = {
  Low: "text-emerald-400",
  Medium: "text-amber-400",
  High: "text-rose-400",
};

function StatRow({
  label,
  sellValue,
  buyValue,
  format,
}: {
  label: string;
  sellValue: number;
  buyValue: number;
  format?: (n: number) => string;
}) {
  const fmt = format ?? ((n: number) => n.toString());
  const buyBetter = buyValue > sellValue;
  return (
    <tr className="border-b border-zinc-800 last:border-0">
      <td className="py-2 pr-3 text-xs text-zinc-400">{label}</td>
      <td className="py-2 pr-3 text-right text-sm text-zinc-300">{fmt(sellValue)}</td>
      <td
        className={`py-2 text-right text-sm font-medium ${
          buyBetter ? "text-emerald-400" : "text-zinc-300"
        }`}
      >
        {fmt(buyValue)}
      </td>
    </tr>
  );
}

function PlayerFixtures({ player }: { player: PlayerScore }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {player.upcomingFixtures.map((f) => (
        <span
          key={f.gw}
          title={`GW${f.gw} vs ${f.opponent} (${f.isHome ? "H" : "A"}), opponent strength ${f.opponentStrength}`}
          className="rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] text-zinc-400"
        >
          {f.opponent}
          {f.isHome ? "(H)" : "(A)"}
        </span>
      ))}
    </div>
  );
}

export default function VerdictCard({ result }: { result: DebateResult }) {
  const [showDebate, setShowDebate] = useState(false);
  const { comparison, bull, bear, arbiter } = result;

  return (
    <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-4 py-1.5 text-lg font-bold ring-1 ${VERDICT_STYLES[arbiter.verdict]}`}
          >
            {arbiter.verdict}
          </span>
          <span className="text-sm text-zinc-400">
            Risk:{" "}
            <span className={`font-semibold ${RISK_STYLES[arbiter.riskRating]}`}>
              {arbiter.riskRating}
            </span>
          </span>
        </div>
        <div className="text-right">
          <div
            className={`text-xl font-bold ${
              arbiter.scoreDelta > 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {arbiter.scoreDelta > 0 ? "+" : ""}
            {arbiter.scoreDelta}
          </div>
          <div className="text-[11px] text-zinc-500">model score delta</div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-zinc-300">{arbiter.reasoning}</p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500">
              <th className="pb-2 text-left font-normal">Model inputs</th>
              <th className="pb-2 text-right font-normal text-rose-400">
                Sell · {comparison.out.webName}
              </th>
              <th className="pb-2 text-right font-normal text-emerald-400">
                Buy · {comparison.in.webName}
              </th>
            </tr>
          </thead>
          <tbody>
            <StatRow
              label="Price"
              sellValue={comparison.out.priceM}
              buyValue={comparison.in.priceM}
              format={(n) => `£${n}m`}
            />
            <StatRow
              label="xGI per 90"
              sellValue={comparison.out.xGI90}
              buyValue={comparison.in.xGI90}
            />
            <StatRow
              label="Fixture easiness"
              sellValue={comparison.out.fixtureEasiness}
              buyValue={comparison.in.fixtureEasiness}
            />
            <StatRow
              label="Minutes reliability"
              sellValue={comparison.out.minutesReliability}
              buyValue={comparison.in.minutesReliability}
            />
            <StatRow
              label="Model score"
              sellValue={comparison.out.score}
              buyValue={comparison.in.score}
            />
          </tbody>
        </table>
        <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
          <PlayerFixtures player={comparison.out} />
          <div className="sm:flex sm:justify-end">
            <PlayerFixtures player={comparison.in} />
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
          Model score = (xGI per 90) × (fixture easiness) × (minutes reliability), computed
          directly from live FPL data — not an LLM estimate. Fixture easiness is derived from
          opponent strength over the next {comparison.gwWindow} gameweeks.
        </p>
      </div>

      <button
        onClick={() => setShowDebate((v) => !v)}
        className="mt-5 flex w-full items-center justify-between rounded-lg border border-zinc-800 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/50"
      >
        <span>See the full debate</span>
        <span className="text-zinc-500">{showDebate ? "−" : "+"}</span>
      </button>

      {showDebate && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-emerald-400">Bull</span>
              <span className="text-[11px] uppercase tracking-wide text-emerald-500/70">
                {bull.verdict}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-300">{bull.reasoning}</p>
            <p className="mt-2 text-xs text-emerald-500/80">{bull.keyStat}</p>
          </div>
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-rose-400">Bear</span>
              <span className="text-[11px] uppercase tracking-wide text-rose-500/70">
                {bear.verdict}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-300">{bear.reasoning}</p>
            <p className="mt-2 text-xs text-rose-500/80">{bear.keyStat}</p>
          </div>
        </div>
      )}
    </div>
  );
}
