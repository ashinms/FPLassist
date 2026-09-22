"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export interface PlayerResult {
  id: number;
  webName: string;
  teamShortName: string;
  position: string;
  priceM: number;
  photoUrl: string;
  badgeUrl: string;
  status: string;
}

function AvailabilityDot({ status }: { status: string }) {
  if (status === "a") return null;
  return (
    <span
      title="Doubtful or unavailable"
      className="ml-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500"
    />
  );
}

interface Props {
  label: string;
  accent: "buy" | "sell";
  onSelect: (player: PlayerResult) => void;
  selected: PlayerResult | null;
}

function PlayerAvatar({ player, size }: { player: PlayerResult; size: number }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <Image
        src={player.photoUrl}
        alt={player.webName}
        width={size}
        height={size}
        unoptimized
        className="rounded-full bg-zinc-800 object-cover object-top"
        style={{ width: size, height: size }}
      />
      <Image
        src={player.badgeUrl}
        alt={player.teamShortName}
        width={Math.round(size * 0.42)}
        height={Math.round(size * 0.42)}
        unoptimized
        className="absolute -bottom-0.5 -right-0.5 rounded-full bg-zinc-950 p-0.5 ring-2 ring-zinc-950"
      />
    </div>
  );
}

export default function PlayerAutocomplete({ label, accent, onSelect, selected }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim() || selected) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/players/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        // ignore aborted/failed requests
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, selected]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const accentRing = accent === "buy" ? "focus-within:ring-emerald-500" : "focus-within:ring-rose-500";

  return (
    <div ref={containerRef} className="relative flex-1">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </label>

      {selected ? (
        <div
          className={`flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 ring-1 ${
            accent === "buy" ? "ring-emerald-500/40" : "ring-rose-500/40"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <PlayerAvatar player={selected} size={36} />
            <div>
              <div className="flex items-center font-medium text-zinc-100">
                {selected.webName}
                <AvailabilityDot status={selected.status} />
              </div>
              <div className="text-xs text-zinc-400">
                {selected.teamShortName} · {selected.position} · £{selected.priceM}m
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              onSelect(null as unknown as PlayerResult);
              setQuery("");
              setResults([]);
            }}
            className="text-xs text-zinc-500 hover:text-zinc-300"
            aria-label={`Clear ${label}`}
          >
            change
          </button>
        </div>
      ) : (
        <input
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            if (!value.trim()) setResults([]);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search player name…"
          className={`w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-zinc-100 placeholder-zinc-500 outline-none ring-1 ring-transparent transition ${accentRing}`}
        />
      )}

      {open && results.length > 0 && !selected && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
          {results.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => {
                  onSelect(p);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800"
              >
                <PlayerAvatar player={p} size={30} />
                <span className="flex flex-1 items-center">
                  {p.webName}
                  <AvailabilityDot status={p.status} />
                </span>
                <span className="text-xs text-zinc-400">
                  {p.teamShortName} · {p.position} · £{p.priceM}m
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
