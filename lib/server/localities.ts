import "server-only";
import { AU_STATES } from "../data";
import type { Locality } from "../types";
import raw from "./au-localities.json";

type Entry = Locality & { key: string };

/** Australia Post delivery localities ("Name|STATE|POSTCODE"), from github.com/matthewproctor/australianpostcodes. */
const LOCALITIES: Entry[] = (raw as string[]).map((row) => {
  const [suburb, state, postcode] = row.split("|");
  return { suburb, state, postcode, key: suburb.toLowerCase() };
});

/**
 * Suburbs matching `q`: a postcode prefix when `q` is digits, otherwise a suburb name.
 * Names that start with `q` come first, then names with a word starting with `q`. `state` narrows the results.
 */
export function searchLocalities(q: string, state?: string, limit = 8): Locality[] {
  const query = q.trim().toLowerCase().replace(/\s+/g, " ");
  if (!query) return [];
  const inState = state && (AU_STATES as readonly string[]).includes(state) ? (l: Locality) => l.state === state : () => true;

  if (/^\d+$/.test(query)) {
    return LOCALITIES.filter((l) => inState(l) && l.postcode.startsWith(query))
      .sort((a, b) => a.postcode.localeCompare(b.postcode) || a.key.localeCompare(b.key))
      .slice(0, limit)
      .map(strip);
  }

  const starts: Entry[] = [];
  const words: Entry[] = [];
  for (const l of LOCALITIES) {
    if (!inState(l)) continue;
    if (l.key.startsWith(query)) starts.push(l);
    else if (words.length < limit && l.key.includes(` ${query}`)) words.push(l);
  }
  // Shorter names first, so "Parramatta" comes before "Parramatta Park".
  starts.sort((a, b) => a.key.length - b.key.length || a.key.localeCompare(b.key));
  return [...starts, ...words].slice(0, limit).map(strip);
}

function strip({ suburb, state, postcode }: Locality): Locality {
  return { suburb, state, postcode };
}
