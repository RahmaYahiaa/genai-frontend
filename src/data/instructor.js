export const INSTRUCTOR_STATS = {
  students: 68,
  avgMastery: 42,
  atRisk: 9,
  misconceptionCount: 3,
};

export const TOPIC_GAPS = [
  { id: "trees", en: "Binary Trees & BST", ar: "الأشجار الثنائية و BST", severity: "high", struggling: 41 },
  { id: "hash", en: "Hash Tables", ar: "الجداول المبعثرة", severity: "high", struggling: 34 },
  { id: "dfs", en: "DFS & Recursion", ar: "DFS والعودية", severity: "medium", struggling: 22 },
  { id: "arrays", en: "Arrays & Linked Lists", ar: "المصفوفات والقوائم", severity: "low", struggling: 8 },
];

export const MISCONCEPTIONS = [
  { id: "m1", en: "Confuses DFS visit order with BFS order", ar: "يخلط بين ترتيب زيارة DFS و BFS", students: 12 },
  { id: "m2", en: "Believes hash tables store keys sorted", ar: "يعتقد أن الجداول المبعثرة تخزن المفاتيح مرتبة", students: 8 },
  { id: "m3", en: "Thinks a BST is always balanced", ar: "يعتقد أن شجرة البحث الثنائي متوازنة دائماً", students: 6 },
];

export const SEVERITY_LABELS = {
  high: { en: "High severity", ar: "خطورة عالية" },
  medium: { en: "Medium", ar: "متوسطة" },
  low: { en: "Low", ar: "منخفضة" },
};