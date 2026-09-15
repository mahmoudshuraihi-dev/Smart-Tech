export interface MatchableQA {
  q: string;
  a: string;
}

// lightweight keyword-overlap heuristic — not real NLP (no stemming/morphology), good enough
// for matching a chat message against this site's own small FAQ list as a demo auto-responder
const STOPWORDS = new Set([
  // Arabic
  "في", "من", "على", "الى", "إلى", "عن", "مع", "هل", "ما", "ماذا", "كيف", "متى", "هذا",
  "هذه", "ذلك", "التي", "الذي", "او", "أو", "و", "ثم", "لكن", "ان", "أن", "لا", "نعم",
  "كل", "بعد", "قبل", "عند", "يا", "لي", "لك", "له", "لها", "انا", "أنا", "انت", "أنت",
  // English
  "the", "a", "an", "is", "are", "do", "does", "how", "what", "when", "will", "my", "your",
  "i", "you", "it", "to", "for", "of", "and", "or", "in", "on", "at", "this", "that",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

const MIN_OVERLAP_WORDS = 2;
const MIN_OVERLAP_RATIO = 0.4;

export function findFaqMatch<T extends MatchableQA>(message: string, items: T[]): T | null {
  const messageTokens = new Set(tokenize(message));
  if (messageTokens.size === 0) return null;

  let best: { item: T; score: number } | null = null;
  for (const item of items) {
    const questionTokens = tokenize(item.q);
    if (questionTokens.length === 0) continue;
    const overlap = questionTokens.filter((w) => messageTokens.has(w)).length;
    const score = overlap / questionTokens.length;
    if (overlap >= MIN_OVERLAP_WORDS && score >= MIN_OVERLAP_RATIO && score > (best?.score ?? 0)) {
      best = { item, score };
    }
  }
  return best?.item ?? null;
}
