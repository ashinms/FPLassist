"use client";

import { useEffect, useRef, useState } from "react";
import PlayerAutocomplete, { PlayerResult } from "@/components/PlayerAutocomplete";
import VerdictCard, { DebateResult } from "@/components/VerdictCard";

const LOADING_MESSAGES = [
  "Fetching live FPL data…",
  "Bull is building the case…",
  "Bear is stress-testing it…",
  "Arbiter is weighing the verdict…",
];

interface TeamData {
  squad: PlayerResult[];
  bankM: number;
  teamValueM: number;
}

function AffordabilityNote({
  bankM,
  sellPlayer,
  buyPlayer,
}: {
  bankM: number;
  sellPlayer: PlayerResult;
  buyPlayer: PlayerResult;
}) {
  const netCost = Number((buyPlayer.priceM - sellPlayer.priceM).toFixed(1));
  const affordable = netCost <= bankM;
  const costLine =
    netCost <= 0
      ? `frees up £${Math.abs(netCost)}m`
      : `costs £${netCost}m, you have £${bankM}m in the bank`;
  return (
    <p className={`mt-3 text-sm ${affordable ? "text-emerald-400" : "text-rose-400"}`}>
      {affordable ? `✓ Affordable — this transfer ${costLine}.` : `✗ Over budget — this transfer ${costLine}.`}
    </p>
  );
}

export default function Home() {
  const [sellPlayer, setSellPlayer] = useState<PlayerResult | null>(null);
  const [buyPlayer, setBuyPlayer] = useState<PlayerResult | null>(null);
  const [gwWindow, setGwWindow] = useState(3);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<DebateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [teamIdInput, setTeamIdInput] = useState("");
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  async function loadTeam() {
    const id = Number(teamIdInput);
    if (!id || id < 1) {
      setTeamError("Enter a valid team ID");
      return;
    }
    setTeamLoading(true);
    setTeamError(null);
    try {
      const res = await fetch(`/api/team/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setTeamError(data.error ?? "Could not load team");
        return;
      }
      setTeamData(data);
      setSellPlayer(null);
    } catch {
      setTeamError("Network error loading team");
    } finally {
      setTeamLoading(false);
    }
  }

  function clearTeam() {
    setTeamData(null);
    setTeamIdInput("");
    setTeamError(null);
    setSellPlayer(null);
  }

  useEffect(() => {
    if (!loading) return;
    intervalRef.current = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_MESSAGES.length - 1));
    }, 1600);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loading]);

  async function runDebate() {
    if (!sellPlayer || !buyPlayer) return;
    setLoadingStep(0);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `/api/debate?out=${sellPlayer.id}&in=${buyPlayer.id}&gws=${gwWindow}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error — is the dev server running?");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = sellPlayer && buyPlayer && sellPlayer.id !== buyPlayer.id && !loading;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10 sm:px-6">
      <header className="relative mb-8 overflow-hidden rounded-2xl">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "url('/chevron.svg')", backgroundSize: "110px 110px" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-zinc-950" />
        <div className="relative px-6 py-10 text-center sm:py-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            FPLassist
          </h1>
          <p className="mt-2 text-sm text-zinc-200">
            Three agents debate your transfer using live FPL data — not vibes.
          </p>
        </div>
      </header>

      <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
        {teamData ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-zinc-300">
              Squad loaded —{" "}
              <span className="text-zinc-400">
                Bank £{teamData.bankM}m · Team value £{teamData.teamValueM}m
              </span>
            </p>
            <button
              onClick={clearTeam}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400 sm:mr-1">
              FPL Team ID (optional)
            </label>
            <input
              value={teamIdInput}
              onChange={(e) => setTeamIdInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadTeam()}
              placeholder="e.g. 1234567"
              inputMode="numeric"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-500"
            />
            <button
              onClick={loadTeam}
              disabled={teamLoading}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
            >
              {teamLoading ? "Loading…" : "Load my team"}
            </button>
          </div>
        )}
        {teamError && <p className="mt-2 text-xs text-rose-400">{teamError}</p>}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 sm:flex-row sm:p-5">
        <PlayerAutocomplete
          label="Transfer in"
          accent="buy"
          selected={buyPlayer}
          onSelect={setBuyPlayer}
        />
        <PlayerAutocomplete
          label="Transfer out"
          accent="sell"
          selected={sellPlayer}
          onSelect={setSellPlayer}
          squad={teamData?.squad}
        />
      </div>

      {teamData && sellPlayer && buyPlayer && (
        <AffordabilityNote bankM={teamData.bankM} sellPlayer={sellPlayer} buyPlayer={buyPlayer} />
      )}

      <div className="mt-4 flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          Gameweek window
          <select
            value={gwWindow}
            onChange={(e) => setGwWindow(Number(e.target.value))}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-200 outline-none"
          >
            <option value={3}>Next 3</option>
            <option value={5}>Next 5</option>
            <option value={8}>Next 8</option>
          </select>
        </label>

        <button
          onClick={runDebate}
          disabled={!canSubmit}
          className="rounded-lg bg-zinc-100 px-5 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          Debate this transfer
        </button>
      </div>

      <div className="mt-8">
        {loading && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 py-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-200" />
            <p className="text-sm text-zinc-400">{LOADING_MESSAGES[loadingStep]}</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {result && !loading && <VerdictCard result={result} />}
      </div>
    </div>
  );
}
