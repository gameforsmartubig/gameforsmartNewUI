// ============================================================
// _utils/metadata.ts
// Helpers for generating and combining quiz metadata
// ============================================================

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  math: ["matematik", "math", "aljabar", "geometri", "kalkulus", "statistik"],
  science: ["fisika", "kimia", "biologi", "science", "sains"],
  history: ["sejarah", "history"],
  geography: ["geografi", "geography"],
  language: ["bahasa", "language", "indonesia", "english"],
  technology: ["teknologi", "technology", "komputer", "programming", "informatika", "coding"],
  sports: ["olahraga", "sports"],
  entertainment: ["hiburan", "entertainment", "film", "musik"],
  business: ["bisnis", "business", "ekonomi", "economy"],
};

const COMMON_WORDS = [
  "buatkan", "buat", "saya", "soal", "pertanyaan", "quiz", "tentang",
  "untuk", "dari", "yang", "dan", "atau",
  "make", "create", "questions", "about", "for", "from", "the", "and",
  "or", "of", "to", "in",
];

export function detectCategory(prompt: string): string {
  const lower = prompt.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "general";
}

export function extractTopicFromPrompt(prompt: string): string {
  const words = prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(
      (w) => w.length > 2 && !COMMON_WORDS.includes(w) && !/^\d+$/.test(w)
    )
    .slice(0, 3);

  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function generateBasicMetadata(prompt: string, language: string) {
  const category = detectCategory(prompt);
  const promptWords = prompt.split(" ").slice(0, 4);
  const mainTopic = promptWords.slice(0, 3).join(" ");
  const capitalized =
    promptWords.join(" ").charAt(0).toUpperCase() +
    promptWords.join(" ").slice(1);

  const title =
    language === "id" ? `Quiz ${capitalized}` : `${capitalized} Quiz`;

  const description =
    language === "id"
      ? `Tes pengetahuan ${mainTopic.toLowerCase()}`
      : `Knowledge test about ${mainTopic.toLowerCase()}`;

  return { title, description, category };
}

export function determineMainCategory(cat1: string, cat2: string): string {
  if (cat1 === cat2) return cat1;
  if (cat1 === "general") return cat2;
  if (cat2 === "general") return cat1;
  return "general";
}

export function combineMetadata(
  existingFormData: { title: string; description: string; category: string },
  newMetadata: { title?: string; description?: string; category?: string },
  currentPrompt: string,
  language: string,
  shouldCombine: boolean
) {
  if (!shouldCombine || !existingFormData.title.trim()) {
    return newMetadata;
  }

  const existingTitle = existingFormData.title.replace(/^Quiz\s*/i, "").trim();
  const newTopic = extractTopicFromPrompt(currentPrompt);

  if (existingTitle.toLowerCase().includes(newTopic.toLowerCase())) {
    return {
      title: existingFormData.title,
      description: existingFormData.description,
      category: newMetadata.category || existingFormData.category,
    };
  }

  const combinedTitle =
    language === "id"
      ? `Quiz ${existingTitle} dan ${newTopic}`
      : `${existingTitle} and ${newTopic} Quiz`;

  const combinedDescription =
    language === "id"
      ? `Tes pengetahuan ${existingTitle.toLowerCase()} dan ${newTopic.toLowerCase()}`
      : `Knowledge test about ${existingTitle.toLowerCase()} and ${newTopic.toLowerCase()}`;

  return {
    title: combinedTitle,
    description: combinedDescription,
    category: determineMainCategory(
      existingFormData.category,
      newMetadata.category || "general"
    ),
  };
}
