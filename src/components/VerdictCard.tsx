"use client";

import Image from "next/image";
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
  BUY: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/40",
  SELL: "bg-rose-500/15 text-rose-400 ring-rose-500/40",
  HOLD: "bg-amber-500/15 text-amber-400 ring-amber-500/40",
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

const STATUS_LABELS: Record<string, string> = {
  d: "Doubtful",
  i: "Injured",
  s: "Suspended",
  u: "Unavailable",
  n: "Not in squad",
};

function AvailabilityFlag({ player }: { player: PlayerScore }) {
  if (player.status === "a") return null;
  const label = STATUS_LABELS[player.status] ?? "Availability risk";
  return (
    <div className="max-w-[9rem] rounded-md bg-rose-500/15 px-2 py-1 text-center text-[10px] font-medium leading-tight text-rose-300">
      ⚠ {player.news || label}
    </div>
  );
}

function HeadshotCard({ player, side }: { player: PlayerScore; side: "sell" | "buy" }) {
  const accent = side === "sell" ? "rose" : "emerald";
  return (
    <div className="flex flex-1 flex-col items-center gap-2 text-center">
      <div className="relative">
        <div
          className={`relative h-20 w-20 overflow-hidden rounded-full bg-zinc-800 ring-2 sm:h-24 sm:w-24 ${
            accent === "rose" ? "ring-rose-500/40" : "ring-emerald-500/40"
          }`}
        >
          <Image
            src={player.photoUrl}
            alt={player.webName}
            fill
            unoptimized
            className="object-cover object-top"
          />
        </div>
        <div className="absolute -bottom-1 -right-1 h-7 w-7 overflow-hidden rounded-full bg-zinc-950 ring-2 ring-zinc-950">
          <Image
            src={player.badgeUrl}
            alt={player.teamShortName}
            width={28}
            height={28}
            unoptimized
            className="h-full w-full object-contain p-0.5"
          />
        </div>
      </div>
      <div>
        <div className="font-semibold text-zinc-100">{player.webName}</div>
        <div className="text-xs text-zinc-500">
          {player.teamShortName} · £{player.priceM}m
        </div>
      </div>
      <AvailabilityFlag player={player} />
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
          accent === "rose" ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
        }`}
      >
        {side === "sell" ? "Transfer Out" : "Transfer In"}
      </span>
    </div>
  );
}

export default function VerdictCard({ result }: { result: DebateResult }) {
  const [showDebate, setShowDebate] = useState(false);
  const { comparison, bull, bear, arbiter } = result;

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
      <div className="relative overflow-hidden px-5 py-6 sm:px-6">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "url('/chevron.svg')", backgroundSize: "100px 100px" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/55 to-zinc-900/95" />
        <div className="relative flex items-center justify-between gap-3 sm:gap-6">
          <HeadshotCard player={comparison.out} side="sell" />

          <div className="flex flex-shrink-0 flex-col items-center gap-1.5">
            <span
              className={`rounded-full px-4 py-1.5 text-base font-bold ring-1 sm:text-lg ${VERDICT_STYLES[arbiter.verdict]}`}
            >
              {arbiter.verdict}
            </span>
            <div
              className={`text-lg font-bold ${
                arbiter.scoreDelta > 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {arbiter.scoreDelta > 0 ? "+" : ""}
              {arbiter.scoreDelta}
            </div>
            <div className="text-center text-[10px] leading-tight text-zinc-500">
              score delta
              <br />
              Risk:{" "}
              <span className={`font-semibold ${RISK_STYLES[arbiter.riskRating]}`}>
                {arbiter.riskRating}
              </span>
            </div>
          </div>

          <HeadshotCard player={comparison.in} side="buy" />
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-zinc-300">{arbiter.reasoning}</p>

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
          {(comparison.out.position === "GKP" ||
            comparison.out.position === "DEF" ||
            comparison.in.position === "GKP" ||
            comparison.in.position === "DEF") && (
            <p className="mt-2 text-[11px] leading-relaxed text-amber-500/70">
              ⚠ This model only measures attacking output (xGI). It doesn&apos;t account for
              clean sheets or saves, so scores for goalkeepers/defenders will understate their
              real FPL value.
            </p>
          )}
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
    </div>
  );
}
