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

export default function Home() {
  const [sellPlayer, setSellPlayer] = useState<PlayerResult | null>(null);
  const [buyPlayer, setBuyPlayer] = useState<PlayerResult | null>(null);
  const [gwWindow, setGwWindow] = useState(3);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<DebateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) {
      setLoadingStep(0);
      intervalRef.current = setInterval(() => {
        setLoadingStep((s) => Math.min(s + 1, LOADING_MESSAGES.length - 1));
      }, 1600);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loading]);

  async function runDebate() {
    if (!sellPlayer || !buyPlayer) return;
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
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
          FPL Transfer Dilemma Engine
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Three agents debate your transfer using live FPL data — not vibes.
        </p>
      </header>

      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 sm:flex-row sm:p-5">
        <PlayerAutocomplete
          label="Transfer out"
          accent="sell"
          selected={sellPlayer}
          onSelect={setSellPlayer}
        />
        <PlayerAutocomplete
          label="Transfer in"
          accent="buy"
          selected={buyPlayer}
          onSelect={setBuyPlayer}
        />
      </div>

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
