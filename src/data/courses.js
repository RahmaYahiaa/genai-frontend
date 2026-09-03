export const COURSES = [
  {
    id: "CS301",
    title: {
      en: "Data Structures & Algorithms",
      ar: "هياكل البيانات والخوارزميات",
    },
    week: 9,
    overall: 46,
    topics: [
      { id: "arrays", label: { en: "Arrays & Linked Lists", ar: "المصفوفات والقوائم المترابطة" }, pct: 91, evidence: 12 },
      { id: "bfs", label: { en: "BFS / Graph Traversal", ar: "BFS / اجتياز الرسوم" }, pct: 74, evidence: 8 },
      { id: "dfs", label: { en: "DFS & Recursion", ar: "DFS والعودية" }, pct: 55, evidence: 6 },
      { id: "trees", label: { en: "Binary Trees & BST", ar: "الأشجار الثنائية و BST" }, pct: 38, evidence: 4 },
      { id: "hash", label: { en: "Hash Tables", ar: "الجداول المبعثرة" }, pct: 22, evidence: 2 },
      { id: "dijkstra", label: { en: "Dijkstra / Shortest Path", ar: "دايكسترا / أقصر مسار" }, pct: 0, evidence: 0 },
    ],
  },
  {
    id: "CS302",
    title: {
      en: "Computer Architecture",
      ar: "بنية الحاسوب",
    },
    week: 7,
    overall: 0,
    topics: [],
  },
];

export function getCourse(id) {
  return COURSES.find((c) => c.id === id) ?? COURSES[0];
}

export function getCourseTopics(id) {
  return getCourse(id).topics;
}