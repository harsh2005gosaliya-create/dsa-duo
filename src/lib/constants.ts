export const PLATFORMS = [
  "LeetCode",
  "GeeksforGeeks",
  "HackerRank",
  "Codeforces",
  "CodeChef",
  "AtCoder",
  "Other",
] as const;

export const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;

export const TOPICS = [
  "Arrays",
  "Strings",
  "Hashing",
  "Two Pointers",
  "Sliding Window",
  "Binary Search",
  "Sorting",
  "Linked List",
  "Stack",
  "Queue",
  "Deque",
  "Recursion",
  "Backtracking",
  "Trees",
  "BST",
  "Heap / Priority Queue",
  "Greedy",
  "Graphs",
  "BFS",
  "DFS",
  "Topological Sort",
  "Union Find",
  "Trie",
  "Dynamic Programming",
  "Bit Manipulation",
  "Math",
  "Intervals",
  "Prefix Sum",
  "Monotonic Stack",
  "Advanced",
] as const;

export const PATTERNS = [
  "Two Pointers",
  "Sliding Window",
  "Fast & Slow Pointer",
  "Prefix Sum",
  "Hash Map",
  "Binary Search",
  "Binary Search on Answer",
  "Merge Intervals",
  "Monotonic Stack",
  "Backtracking",
  "Divide and Conquer",
  "Greedy",
  "BFS",
  "DFS",
  "Topological Sort",
  "Union Find",
  "Trie",
  "Top-K",
  "Memoization",
  "Tabulation",
  "Dynamic Programming",
  "Shortest Path",
  "Expand Around Center",
  "Iterative Pointers",
  "Merge",
  "Design",
  "XOR",
  "Math",
  "Stack",
  "Other",
] as const;

export const MISTAKE_CATEGORIES = [
  "Concept misunderstanding",
  "Pattern not recognized",
  "Wrong approach",
  "Edge case",
  "Implementation bug",
  "Syntax issue",
  "Time management",
  "Complexity mistake",
  "Forgot formula",
  "Off-by-one",
  "Data structure misuse",
] as const;

export const LANGUAGES = ["C++", "Java", "Python", "JavaScript", "TypeScript", "Go", "Rust", "C#"];
export const DSA_LEVELS = ["Beginner", "Intermediate", "Advanced"];
export const TARGET_ROLES = [
  "Software Engineer",
  "SDE Intern",
  "Backend Developer",
  "Full Stack Developer",
  "Other",
];

export const OUTCOMES = [
  { value: "solved_independently", label: "Yes — independently" },
  { value: "solved_with_hint", label: "Yes — with a hint" },
  { value: "solved_after_solution", label: "Yes — after seeing the solution" },
  { value: "failed", label: "No — not solved" },
] as const;

export const REVIEW_INTERVALS = [1, 3, 7, 14, 30];

export const QUOTES = [
  "Consistency beats intelligence when intelligence is inconsistent.",
  "Don't memorize solutions. Build recognition.",
  "Your future interview is trained in today's session.",
  "Easy problems build vocabulary. Medium problems build judgment.",
  "Speed comes after understanding.",
  "One solved problem is progress. One understood pattern is leverage.",
  "The pattern you skip today is the question you fail tomorrow.",
  "Reps beat inspiration. Show up.",
  "Understanding is the only score that compounds.",
  "Re-solving is where retention is actually built.",
];

export function quoteForDate(date: Date) {
  const day = Math.floor(date.getTime() / 86400000);
  return QUOTES[day % QUOTES.length];
}

export function platformFromUrl(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("leetcode.")) return "LeetCode";
  if (u.includes("geeksforgeeks.")) return "GeeksforGeeks";
  if (u.includes("hackerrank.")) return "HackerRank";
  if (u.includes("codeforces.")) return "Codeforces";
  if (u.includes("codechef.")) return "CodeChef";
  if (u.includes("atcoder.")) return "AtCoder";
  return "Other";
}

/** Best-effort title guess from the URL slug. No scraping — purely string parsing. */
export function titleFromUrl(url: string): string {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    const slug = parts.reverse().find((p) => p.length > 2 && !/^\d+$/.test(p)) ?? "";
    return slug
      .replace(/\.(html?|php)$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  } catch {
    return "";
  }
}

export const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: "text-easy border-easy/30 bg-easy/10",
  Medium: "text-medium border-medium/30 bg-medium/10",
  Hard: "text-hard border-hard/30 bg-hard/10",
};

export const MASTERY_LABEL: Record<string, string> = {
  unseen: "Unseen",
  attempted: "Attempted",
  solved: "Solved",
  understood: "Understood",
  resolved: "Re-solved",
  mastered: "Mastered",
};

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
