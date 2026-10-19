import { brandKey } from "../audit/match";
import type { RunSummary, TodoItem } from "./types";

export interface AlertDraft {
  kind: "visibility" | "competitor" | "website" | "speed" | "backlinks" | "report" | "baseline";
  title: string;
  body: string;
}

const RANK: Record<string, number> = { good: 0, info: 0, warn: 1, bad: 2 };

const pct = (n: number) => `${Math.round(n * 100)}%`;
const of = (a: number, b: number) => `${a} of ${b}`;

// Turns two consecutive check summaries into the changes worth telling the
// customer about. Small wobble is ignored: AI answers vary from run to run, so
// only meaningful shifts raise an alert.
export function diffSummaries(prev: RunSummary | null, cur: RunSummary, company: string): AlertDraft[] {
  if (!prev) {
    return [
      {
        kind: "baseline",
        title: `Your first check for ${company} is ready`,
        body:
          cur.answers > 0
            ? `${company} was recommended in ${of(cur.clientMentions, cur.answers)} AI answers. We will tell you when this changes.`
            : "Your first check is ready. We will tell you when something changes.",
      },
    ];
  }
  const out: AlertDraft[] = [];

  if (cur.mentionRate !== null && prev.mentionRate !== null) {
    const delta = cur.mentionRate - prev.mentionRate;
    const crossed = (prev.mentionRate === 0) !== (cur.mentionRate === 0);
    if (Math.abs(delta) >= 0.2 || crossed) {
      out.push({
        kind: "visibility",
        title: delta > 0 ? "AI recommends you more often" : "AI recommends you less often",
        body: `${company} was recommended in ${of(cur.clientMentions, cur.answers)} answers (${pct(cur.mentionRate)}), compared with ${of(prev.clientMentions, prev.answers)} (${pct(prev.mentionRate)}) last time.`,
      });
    }
  }

  // Companies that entered or left the top five.
  const top = (s: RunSummary) => new Map(s.topBrands.slice(0, 5).map((b) => [brandKey(b.name), b.name]));
  const before = top(prev);
  const after = top(cur);
  const entered = [...after].filter(([k]) => !before.has(k)).map(([, n]) => n);
  const left = [...before].filter(([k]) => !after.has(k)).map(([, n]) => n);
  if (entered.length || left.length) {
    const parts = [
      entered.length ? `Newly recommended: ${entered.join(", ")}.` : "",
      left.length ? `No longer in the top five: ${left.join(", ")}.` : "",
    ].filter(Boolean);
    out.push({ kind: "competitor", title: "The AI top five changed", body: parts.join(" ") });
  }

  if (prev.checks && cur.checks) {
    const worse = cur.checks.filter((c) => {
      const p = prev.checks?.find((x) => x.n === c.n);
      return p && (RANK[c.status] ?? 0) > (RANK[p.status] ?? 0);
    });
    if (worse.length) {
      out.push({
        kind: "website",
        title: "Your website checks got worse",
        body: `These checks are now worse than last time: ${worse.map((c) => c.title).join(", ")}.`,
      });
    }
  }

  if (prev.speedScore !== null && cur.speedScore !== null && prev.speedScore - cur.speedScore >= 10) {
    out.push({
      kind: "speed",
      title: "Your website got slower",
      body: `Your mobile speed score dropped from ${prev.speedScore} to ${cur.speedScore}.`,
    });
  }

  if (prev.backlinks && cur.backlinks) {
    for (const row of cur.backlinks) {
      const old = prev.backlinks.find((b) => b.domain === row.domain);
      if (!old || old.referringDomains === null || row.referringDomains === null || old.referringDomains === 0) continue;
      const change = (row.referringDomains - old.referringDomains) / old.referringDomains;
      if (Math.abs(change) >= 0.1 && Math.abs(row.referringDomains - old.referringDomains) >= 5) {
        out.push({
          kind: "backlinks",
          title: `${row.domain} ${change > 0 ? "gained" : "lost"} referring websites`,
          body: `${row.domain} now has ${row.referringDomains.toLocaleString("en-US")} referring websites, compared with ${old.referringDomains.toLocaleString("en-US")} last time.`,
        });
      }
    }
  }

  if (prev.refreshCompetitors && cur.refreshCompetitors) {
    const old = new Set(prev.refreshCompetitors.map(brandKey));
    const now = new Set(cur.refreshCompetitors.map(brandKey));
    const added = cur.refreshCompetitors.filter((n) => !old.has(brandKey(n)));
    const dropped = prev.refreshCompetitors.filter((n) => !now.has(brandKey(n)));
    if (added.length || dropped.length) {
      out.push({
        kind: "report",
        title: "Your competitor list changed",
        body: [
          added.length ? `New in your refreshed report: ${added.join(", ")}.` : "",
          dropped.length ? `No longer in your top competitors: ${dropped.join(", ")}.` : "",
        ]
          .filter(Boolean)
          .join(" "),
      });
    }
  }
  return out;
}

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `t${(h >>> 0).toString(36)}`;
};

// Keeps the checklist in step with each new check: new advice becomes new
// to-dos, website problems become to-dos that tick themselves off once the
// next check shows them fixed, and anything the customer ticked stays ticked.
export function syncTodo(
  existing: TodoItem[],
  advice: string[],
  checks: RunSummary["checks"],
  now = new Date().toISOString()
): TodoItem[] {
  const items = existing.map((t) => ({ ...t }));
  const has = (id: string) => items.some((t) => t.id === id);

  // The first line of the advice is a status sentence, not a task.
  for (const text of advice.slice(1)) {
    const id = hash(text);
    if (!has(id)) items.push({ id, text, done: false, doneAt: null, auto: false });
  }

  for (const c of checks ?? []) {
    const id = `site-${c.n}`;
    const problem = c.status === "warn" || c.status === "bad";
    const found = items.find((t) => t.id === id);
    if (problem && !found) {
      items.push({ id, text: `Fix on your website: ${c.title}`, done: false, doneAt: null, auto: false });
    } else if (!problem && found && !found.done && c.status === "good") {
      found.done = true;
      found.doneAt = now;
      found.auto = true;
    } else if (problem && found && found.auto) {
      // It regressed after being fixed.
      found.done = false;
      found.doneAt = null;
      found.auto = false;
    }
  }
  return items;
}
