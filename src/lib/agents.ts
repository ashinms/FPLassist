import Groq from "groq-sdk";
import { Comparison } from "./compare";

const MODEL = "openai/gpt-oss-120b";

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");
  return new Groq({ apiKey });
}

const GROUNDING_RULE =
  "You must reason ONLY from the JSON stats provided below. Do not use any outside " +
  "knowledge you may have about these players, their clubs, injuries, or transfers — " +
  "that knowledge may be stale. If the JSON doesn't mention something (e.g. an injury), " +
  "treat it as not a factor. Every claim you make must trace back to a specific field " +
  "in the JSON.";

function statsBlock(comparison: Comparison): string {
  return JSON.stringify(
    {
      gwWindow: comparison.gwWindow,
      sell: comparison.out,
      buy: comparison.in,
      scoreDelta: comparison.scoreDelta,
      priceDelta: comparison.priceDelta,
    },
    null,
    2
  );
}

export interface AgentVerdict {
  verdict: string;
  reasoning: string;
  keyStat: string;
}

export interface ArbiterVerdict {
  verdict: "BUY" | "SELL" | "HOLD";
  scoreDelta: number;
  riskRating: "Low" | "Medium" | "High";
  reasoning: string;
}

async function callJsonAgent(
  systemPrompt: string,
  userPrompt: string,
  temperature: number
): Promise<Record<string, unknown>> {
  const groq = getClient();
  const res = await groq.chat.completions.create({
    model: MODEL,
    temperature,
    max_tokens: 700,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  const content = res.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from agent");
  return JSON.parse(content);
}

export async function runBull(comparison: Comparison): Promise<AgentVerdict> {
  const systemPrompt = `You are "The Bull" — a Fantasy Premier League form-and-fixture optimist. ${GROUNDING_RULE}

You argue FOR making the transfer (selling "sell", buying "buy"), using the strongest
supporting evidence available in the stats: xGI90 (expected goal involvements per 90),
fixtureEasiness (higher = easier upcoming fixtures), minutesReliability (share of
available minutes played), and price.

Respond ONLY with a JSON object: { "verdict": "make the move" | "move is not justified",
"reasoning": "2-3 sentences, cite specific numbers from the JSON", "keyStat": "the single
strongest stat backing your case, phrased for a UI badge, e.g. 'xGI90 0.77 vs 0.14'" }`;

  const userPrompt = `Stats:\n${statsBlock(comparison)}\n\nMake the strongest case FOR this transfer.`;

  const result = await callJsonAgent(systemPrompt, userPrompt, 0.8);
  return {
    verdict: String(result.verdict ?? "unknown"),
    reasoning: String(result.reasoning ?? ""),
    keyStat: String(result.keyStat ?? ""),
  };
}

export async function runBear(comparison: Comparison): Promise<AgentVerdict> {
  const systemPrompt = `You are "The Bear" — a Fantasy Premier League risk-and-trap skeptic. ${GROUNDING_RULE}

You argue AGAINST making the transfer, or for rolling it instead. Focus on downside
signals in the stats: low minutesReliability (rotation/injury risk), poor fixtureEasiness,
the price paid (priceDelta), and whether the scoreDelta is actually large enough to be
worth giving up squad flexibility for. If status is not "a" (available) or news is
non-empty, treat that as a real red flag.

Respond ONLY with a JSON object: { "verdict": "trap, avoid" | "risk is acceptable",
"reasoning": "2-3 sentences, cite specific numbers from the JSON", "keyStat": "the single
strongest risk signal backing your case, phrased for a UI badge" }`;

  const userPrompt = `Stats:\n${statsBlock(comparison)}\n\nMake the strongest case AGAINST this transfer.`;

  const result = await callJsonAgent(systemPrompt, userPrompt, 0.8);
  return {
    verdict: String(result.verdict ?? "unknown"),
    reasoning: String(result.reasoning ?? ""),
    keyStat: String(result.keyStat ?? ""),
  };
}

export async function runArbiter(
  comparison: Comparison,
  bull: AgentVerdict,
  bear: AgentVerdict
): Promise<ArbiterVerdict> {
  const systemPrompt = `You are "The Arbiter" — Chief Scout. You synthesize a debate between
two FPL analysts (Bull, arguing for the transfer, and Bear, arguing against) into one final
verdict. ${GROUNDING_RULE} Weigh both arguments against the raw stats — do not simply average
them or default to the middle; make a real call.

Respond ONLY with a JSON object: { "verdict": "BUY" | "SELL" | "HOLD", "riskRating":
"Low" | "Medium" | "High", "reasoning": "2-3 sentences explaining the final call and why
one side's argument won out" }

"BUY" means make the transfer now. "HOLD" means roll the transfer / don't make this move.
"SELL" means only applicable if the stats clearly favor keeping the current player and
actively moving away from the target — otherwise prefer HOLD.`;

  const userPrompt = `Stats:\n${statsBlock(comparison)}\n\nBull's case: ${JSON.stringify(
    bull
  )}\n\nBear's case: ${JSON.stringify(bear)}\n\nGive the final verdict.`;

  const result = await callJsonAgent(systemPrompt, userPrompt, 0.3);
  const verdict = String(result.verdict ?? "HOLD").toUpperCase();
  const riskRating = String(result.riskRating ?? "Medium");

  return {
    verdict: verdict === "BUY" || verdict === "SELL" ? (verdict as "BUY" | "SELL") : "HOLD",
    scoreDelta: comparison.scoreDelta,
    riskRating:
      riskRating === "Low" || riskRating === "High" ? (riskRating as "Low" | "High") : "Medium",
    reasoning: String(result.reasoning ?? ""),
  };
}
