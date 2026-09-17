function approvedMaterials(topic) {
  return topic.materials.filter((m) => m.status === "approved").length;
}
function pendingMaterials(topic) {
  return topic.materials.filter((m) => m.status === "pending").length;
}
function coverageGap(topic) {
  return approvedMaterials(topic) === 0;
}
const latestAttempt = (u) => u.attempts[u.attempts.length - 1];
const finalScoreOf = (u) => {
  const d = latestAttempt(u).decision;
  return u.status === "final" && d ? d.finalScore : null;
};
const NOW = Date.now();
const ago = (hours) => new Date(NOW - hours * 36e5).toISOString();
const at = (iso) => new Date(iso).toISOString();
function studentTopicMastery(student, topic) {
  if (student.gaps.includes(topic.id)) return Math.max(5, Math.min(39, student.avg - 8));
  return Math.max(40, Math.min(95, Math.round(topic.pct * 0.4 + student.avg * 0.6)));
}
function fmtWhen(iso, lang) {
  const d = new Date(iso);
  const date = d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}
function fmtAgo(iso, lang) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 6e4));
  if (mins < 60) return lang === "ar" ? `منذ ${mins} د` : `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return lang === "ar" ? `منذ ${h} س` : `${h}h ago`;
  const d = Math.round(h / 24);
  return lang === "ar" ? `منذ ${d} يوم` : `${d}d ago`;
}
const INSTRUCTOR_NAME = "Prof. Dr. Nadia Al-Manea";
const DEMO_STUDENT_ID = "st-sarah";
const ANALYTICS_AS_OF = at("2026-09-09T23:40:00");
const mat = (id, title, status = "approved") => ({ id, title, status, addedAt: ago(600) });
const COURSES = [
  {
    id: "CS301",
    title: { en: "Data Structures & Algorithms", ar: "هياكل البيانات والخوارزميات" },
    isPersonal: false,
    week: 9,
    weeksTotal: 15,
    enrolled: 47,
    instructor: INSTRUCTOR_NAME,
    overall: 54,
    topics: [
      {
        id: "bst",
        short: "Binary Trees",
        label: { en: "Binary Trees & BST", ar: "الأشجار الثنائية وBST" },
        pct: 36,
        evidence: 24,
        materials: [mat("mat-bst1", "Lecture 5 §1 — BST invariant"), mat("mat-bst2", "Lecture 5 §3 — Traversals")]
      },
      {
        id: "avl",
        short: "AVL Balancing",
        label: { en: "Binary Tree Balancing (AVL)", ar: "موازنة الأشجار (AVL)" },
        pct: 36,
        evidence: 24,
        materials: [mat("mat-avl1", "Lecture 5 §5 — Rotations")]
      },
      {
        id: "bfs",
        short: "BFS",
        label: { en: "BFS / Graph Traversal", ar: "اجتياز الرسوم — BFS" },
        pct: 74,
        evidence: 8,
        materials: [mat("mat-bfs1", "Lecture 6 §2 — Queue-based traversal")]
      },
      {
        id: "dfs",
        short: "DFS",
        label: { en: "DFS & Cycle Detection", ar: "DFS وكشف الدورات" },
        pct: 44,
        evidence: 17,
        materials: [mat("mat-dfs1", "Lecture 6 §4 — Back edges")]
      },
      {
        id: "graphs",
        short: "Graphs",
        label: { en: "Graph Representation", ar: "تمثيل الرسوم" },
        pct: 63,
        evidence: 6,
        materials: [mat("mat-gr1", "Lecture 6 §1 — Adjacency models")]
      },
      {
        id: "hash",
        short: "Hash Tables",
        label: { en: "Hash Table Internals", ar: "داخل جداول التجزئة" },
        pct: 29,
        evidence: 31,
        materials: [mat("mat-h1", "Lecture 7 — Collision resolution")]
      },
      {
        id: "dp",
        short: "Dynamic Programming",
        label: { en: "Dynamic Programming", ar: "البرمجة الديناميكية" },
        pct: 51,
        evidence: 11,
        materials: [mat("mat-dp1", "Lecture 8 — Substructure")]
      },
      { id: "dijkstra", short: "Dijkstra", label: { en: "Dijkstra / Shortest Path", ar: "أقصر مسار — ديكسترا" }, pct: 22, evidence: 38, materials: [] }
    ]
  },
  {
    id: "CS401",
    title: { en: "Operating Systems", ar: "نظم التشغيل" },
    isPersonal: false,
    week: 7,
    weeksTotal: 15,
    enrolled: 52,
    instructor: INSTRUCTOR_NAME,
    overall: 61,
    topics: [
      { id: "processes", short: "Processes", label: { en: "Processes & PCB", ar: "العمليات وPCB" }, pct: 78, evidence: 9, materials: [mat("mat-p1", "Lecture 2 — Process model")] },
      { id: "threads", short: "Threads", label: { en: "Threads & Concurrency", ar: "الخيوط والتزامن" }, pct: 64, evidence: 7, materials: [mat("mat-t3", "Lecture 3 — Threads")] },
      { id: "scheduling", short: "Scheduling", label: { en: "CPU Scheduling", ar: "جدولة المعالج" }, pct: 49, evidence: 5, materials: [mat("mat-s1", "Lecture 4 — Scheduling criteria")] },
      { id: "memory", short: "Memory", label: { en: "Memory Management", ar: "إدارة الذاكرة" }, pct: 31, evidence: 3, materials: [mat("mat-m1", "Lecture 5 — Paging")] },
      { id: "deadlocks", short: "Deadlocks", label: { en: "Deadlocks", ar: "الجمود" }, pct: 0, evidence: 0, materials: [] }
    ]
  },
  {
    id: "CS303",
    title: { en: "Databases", ar: "قواعد البيانات" },
    isPersonal: false,
    week: 9,
    weeksTotal: 15,
    enrolled: 38,
    instructor: INSTRUCTOR_NAME,
    overall: 66,
    topics: [
      { id: "relational", short: "Relational Model", label: { en: "Relational Model", ar: "النموذج العلائقي" }, pct: 72, evidence: 10, materials: [mat("mat-r1", "Lecture 2 — Relations")] },
      { id: "sql", short: "SQL & Joins", label: { en: "SQL & Joins", ar: "SQL والوصلات" }, pct: 68, evidence: 9, materials: [mat("mat-sql1", "Lecture 3 — SQL")] },
      { id: "indexing", short: "Indexing", label: { en: "Indexing & B+ Trees", ar: "الفهارس وأشجار B+" }, pct: 57, evidence: 6, materials: [mat("mat-i1", "Lecture 5 — Indexes")] },
      { id: "normalization", short: "Normalization", label: { en: "Normalization", ar: "التطبيع" }, pct: 61, evidence: 7, materials: [mat("mat-n1", "Lecture 6 — Normal forms")] }
    ]
  },
  {
    id: "LIN101",
    title: { en: "Self-Study · Linear Algebra Foundations", ar: "دراسة ذاتية · أساسات الجبر الخطي" },
    isPersonal: true,
    week: 4,
    weeksTotal: 10,
    enrolled: 1,
    instructor: "—",
    overall: 52,
    topics: [
      { id: "vectors", short: "Vectors", label: { en: "Vectors & Span", ar: "المتجهات والفضاء" }, pct: 61, evidence: 5, materials: [] },
      { id: "matrices", short: "Matrices", label: { en: "Matrix Operations", ar: "عمليات المصفوفات" }, pct: 44, evidence: 3, materials: [] }
    ]
  }
];
const COURSE_SESSIONS = { CS301: 312, CS401: 188, CS303: 96, LIN101: 14 };
const INSTRUCTOR_COURSE_IDS = ["CS301", "CS401", "CS303"];
const STUDENT_INSTITUTIONAL_IDS = ["CS301", "CS401"];
const STUDENT_PERSONAL_IDS = ["LIN101"];
const STUDENTS = [
  { id: "st-moh", name: "Mohammed Al-Rashidi", studentNumber: "202341872", cohort: "2023", avg: 27, trend: "stable", gaps: ["dijkstra", "hash"], sessions: 2 },
  { id: "st-lina", name: "Lina Hassan", studentNumber: "202338021", cohort: "2023", avg: 31, trend: "improving", gaps: ["bst", "bfs"], sessions: 4 },
  { id: "st-tariq", name: "Tariq Al-Nasser", studentNumber: "202340155", cohort: "2023", avg: 34, trend: "declining", gaps: ["dijkstra", "dfs"], sessions: 1 },
  { id: "st-nour", name: "Nour Al-Qahtani", studentNumber: "202341003", cohort: "2023", avg: 36, trend: "stable", gaps: ["hash", "dfs"], sessions: 3 },
  { id: "st-faris", name: "Faris Ibrahim", studentNumber: "202342210", cohort: "2024", avg: 38, trend: "improving", gaps: ["dp"], sessions: 5 },
  { id: "st-omar", name: "Omar Khaled", studentNumber: "202340512", cohort: "2023", avg: 62, trend: "improving", gaps: ["avl"], sessions: 6 },
  { id: "st-youssef", name: "Youssef Nasser", studentNumber: "202341266", cohort: "2024", avg: 58, trend: "stable", gaps: ["dp"], sessions: 3 },
  { id: "st-mariam", name: "Mariam Adel", studentNumber: "202339870", cohort: "2023", avg: 44, trend: "stable", gaps: ["bst"], sessions: 2 },
  { id: "st-karim", name: "Karim Fathi", studentNumber: "202343118", cohort: "2024", avg: 42, trend: "declining", gaps: ["bst", "hash"], sessions: 1 },
  { id: "st-hana", name: "Hana Saeed", studentNumber: "202337654", cohort: "2023", avg: 71, trend: "improving", gaps: [], sessions: 7 },
  { id: "st-tarek", name: "Tarek Aziz", studentNumber: "202342901", cohort: "2022", avg: 41, trend: "stable", gaps: ["bst"], sessions: 2 },
  { id: DEMO_STUDENT_ID, name: "Sarah Al-Rashidi", studentNumber: "202341872", cohort: "2023", avg: 57, trend: "improving", gaps: ["hash"], sessions: 23 }
];
const MISCONCEPTIONS = [
  { id: "mc-bst-inorder", text: "Confuses in-order output with pre-order output", topicId: "bst", markers: ["pre-order", "preorder", "root first"], prevalence: 7, tag: "BST", citation: "CS301 · Lec 5 §1" },
  { id: "mc-bst-invariant", text: "Omits the invariant check after insert", topicId: "bst", markers: ["without checking", "no check", "skip the check"], prevalence: 4, tag: "BST", citation: "CS301 · Lec 5 §1" },
  { id: "mc-bst-dup", text: "Believes inserting a duplicate key rotates the tree", topicId: "bst", markers: ["duplicate rotates", "rotates on duplicate"], prevalence: 3, tag: "BST", citation: "CS301 · Lec 5 §2" },
  { id: "mc-bfs-stack", text: "Belief that BFS uses a stack rather than a queue", topicId: "bfs", markers: ["stack"], prevalence: 24, tag: "BFS", citation: "CS301 · Lec 6 §2" },
  { id: "mc-dijkstra-negative", text: "Dijkstra's algorithm works correctly with negative edge weights", topicId: "dijkstra", markers: ["negative"], prevalence: 19, tag: "Dijkstra", citation: "CS301 · Lec 9 §3" },
  { id: "mc-hash-chaining", text: "Worst-case of separate chaining is O(1)", topicId: "hash", markers: ["chaining is o(1)", "constant worst"], prevalence: 17, tag: "Hash Tables", citation: "CS301 · Lec 7 §4" },
  { id: "mc-avl", text: "Confusing AVL and BST height invariants", topicId: "avl", markers: ["same invariant"], prevalence: 11, tag: "BST", citation: "CS301 · Lec 5 §3" },
  { id: "mc-graphs-v2", text: "All graph traversals are O(V²) regardless of representation", topicId: "graphs", markers: ["o(v²) always", "always quadratic"], prevalence: 9, tag: "Graphs", citation: "CS301 · Lec 6 §1" },
  { id: "mc-sched-quantum", text: "Assumes round-robin ignores the time quantum", topicId: "scheduling", markers: ["quantum does not matter", "ignores quantum"], prevalence: 6, tag: "Scheduling", citation: "CS401 · Lec 4 §2" }
];
const ASSIGNMENTS = [
  {
    id: "as-bst",
    courseId: "CS301",
    title: { en: "BST Invariants & Traversal", ar: "ثوابت BST والاجتياز" },
    status: "open",
    showScoreToStudent: false,
    createdAt: ago(120),
    questions: [
      {
        id: "q1",
        topicId: "bst",
        maxScore: 10,
        prompt: { en: "Insert 45 into the BST rooted at 50 with left child 30 and right child 70. Which nodes are visited, and what invariant is preserved at each step?", ar: "أدرج 45 في شجرة جذرها 50 وابنها الأيسر 30 والأيمن 70. ما العقد المزورة وأي ثابت يُحفظ في كل خطوة؟" },
        referenceAnswer: "Visit 50, go left to 30 (45 < 50), then right from 30 (45 > 30), insert as right child of 30. The ordering invariant — left subtree smaller, right subtree larger — holds at every visited node.",
        rubric: "4 pts visit path · 4 pts invariant named per step · 2 pts placement.",
        keyTerms: ["invariant", "left", "right", "30", "50", "order"]
      },
      {
        id: "q2",
        topicId: "bst",
        maxScore: 10,
        prompt: { en: "State the BST ordering invariant and give one example where inserting sorted data breaks balance.", ar: "اذكر ثابت الترتيب في BST وأعطِ مثالاً واحدًا يكسر فيه إدراج بيانات مرتبة التوازن." },
        referenceAnswer: "Every node's left subtree holds smaller values and its right subtree larger ones. Inserting 1..n in order yields a degenerate chain of height n−1 with no branching.",
        rubric: "5 pts invariant · 5 pts sorted-insert consequence.",
        keyTerms: ["invariant", "sorted", "chain", "balance", "left", "right"]
      },
      {
        id: "q3",
        topicId: "bst",
        kind: "multiple_choice",
        maxScore: 5,
        prompt: { en: "Which traversal of a BST visits the keys in ascending sorted order?", ar: "أي اجتياز لشجرة BST يزور المفاتيح بترتيب تصاعدي؟" },
        options: ["In-order", "Pre-order", "Post-order", "Level-order"],
        referenceAnswer: "In-order traversal (left, node, right) yields ascending sorted order because of the BST ordering invariant.",
        rubric: "5 pts correct option.",
        keyTerms: ["in-order", "ascending", "sorted"]
      },
      {
        id: "q4",
        topicId: "bst",
        kind: "true_false",
        maxScore: 2,
        prompt: { en: "True or false: inserting sorted keys 1..n into an empty BST keeps it balanced.", ar: "صح أم خطأ: إدراج مفاتيح مرتبة 1..n في شجرة BST فارغة يبقيها متوازنة." },
        referenceAnswer: "False — sorted inserts produce a degenerate right-only chain of height n−1.",
        rubric: "2 pts correct verdict.",
        keyTerms: ["false", "degenerate", "chain"]
      }
    ]
  },
  {
    id: "as-hash",
    courseId: "CS301",
    title: { en: "Hash Tables in Practice", ar: "جداول التجزئة عملياً" },    status: "open",
    showScoreToStudent: true,
    createdAt: ago(200),
    questions: [
      {
        id: "q1",
        topicId: "hash",
        maxScore: 10,
        prompt: { en: "Compare separate chaining and open addressing under a rising load factor. When does each degrade?", ar: "قارن السلاسل المنفصلة والعنونة المفتوحة مع ارتفاع معامل الحمل. متى يتدهور كل منهما؟" },
        referenceAnswer: "Chaining degrades gradually as average chain length grows with α; worst case O(n). Open addressing degrades sharply near α→1 due to clustering; most implementations rehash at α≈0.75.",
        rubric: "4 pts chaining · 4 pts clustering · 2 pts resize threshold.",
        keyTerms: ["load factor", "chain", "clustering", "resize", "collision"]
      },
      {
        id: "q2",
        topicId: "hash",
        maxScore: 8,
        prompt: { en: "Insert 5, 15, 25 into a table of size 5 using linear probing. Show the probe computation and state whether a resize is urgent.", ar: "أدرج 5 و15 و25 في جدول حجمه 5 بالسوندة الخطية. اعرض حساب السوندات وقل هل إعادة التحجيم عاجلة." },
        rubric: "4 pts slots · 2 pts probe arithmetic · 2 pts resize judgement.",
        keyTerms: ["probe", "slot", "mod", "resize", "collision"]
      }
    ]
  },
  {
    id: "as-quiz",
    courseId: "CS301",
    title: { en: "Graph Traversal Quiz", ar: "اختبار اجتياز الرسوم" },
    status: "closed",
    showScoreToStudent: true,
    createdAt: ago(480),
    questions: [
      {
        id: "q1",
        topicId: "bfs",
        maxScore: 5,
        prompt: { en: "Which structure does BFS use to visit nodes level by level, and why?", ar: "ما البنية التي يستخدمها BFS لزيارة العقد مستوى بمستوى ولماذا؟" },
        referenceAnswer: "A FIFO queue: vertices expand in discovery order, which is exactly the level-order guarantee.",
        rubric: "3 pts queue · 2 pts justification.",
        keyTerms: ["queue", "fifo", "level", "order"]
      },
      {
        id: "q2",
        topicId: "dfs",
        maxScore: 5,
        prompt: { en: "Which edge class proves a cycle in a directed DFS?", ar: "أي صنف من الحواف يثبت دورة في DFS موجه؟" },
        referenceAnswer: "A back edge to an ancestor still active on the recursion stack.",
        rubric: "5 pts back edge + active ancestor.",
        keyTerms: ["back edge", "ancestor", "cycle", "stack"]
      }
    ]
  },
  {
    id: "as-sched",
    courseId: "CS401",
    title: { en: "CPU Scheduling Worksheet", ar: "ورقة جدولة المعالج" },
    status: "open",
    showScoreToStudent: false,
    createdAt: ago(140),
    questions: [
      {
        id: "q1",
        topicId: "scheduling",
        maxScore: 10,
        prompt: { en: "For the given arrival/burst table compute the average waiting time under RR with quantum 2.", ar: "لجدول الوصول/التنفيذ المعطى احسب متوسط الانتظار باستخدام RR بكمّ 2." },
        rubric: "6 pts Gantt · 4 pts average.",
        keyTerms: ["quantum", "gantt", "waiting", "preempt"]
      },
      {
        id: "q2",
        topicId: "scheduling",
        maxScore: 8,
        prompt: { en: "When can SJF starve a process and what does ageing fix?", ar: "متى يجوّع SJF عملية وماذا يصلح التقادم؟" },
        rubric: "4 pts starvation · 4 pts ageing.",
        keyTerms: ["starvation", "ageing", "priority", "wait"]
      }
    ]
  },
  {
    id: "as-sql",
    courseId: "CS303",
    title: { en: "SQL Joins & Indexes", ar: "وصلات SQL والفهارس" },
    status: "open",
    showScoreToStudent: true,
    createdAt: ago(110),
    questions: [
      {
        id: "q1",
        topicId: "sql",
        maxScore: 10,
        prompt: { en: "Write a query listing students with no enrolments, and explain the join choice.", ar: "اكتب استعلاماً يسرد الطلاب بلا تسجيلات واشرح اختيار الوصل." },
        referenceAnswer: "LEFT JOIN ... WHERE enrolments.id IS NULL (or NOT EXISTS); keeps unmatched students.",
        rubric: "6 pts query · 4 pts justification.",
        keyTerms: ["left join", "null", "exists", "unmatched"]
      },
      {
        id: "q2",
        topicId: "indexing",
        maxScore: 10,
        prompt: { en: "Why does a B+ tree index keep range scans cheap?", ar: "لماذا يبقي فهرس B+ scans النطاق رخيصاً؟" },
        referenceAnswer: "Leaf pages are linked in order, so a range is one sequential leaf walk after a single root-to-leaf descent.",
        rubric: "5 pts linked leaves · 5 pts descent cost.",
        keyTerms: ["leaf", "range", "sequential", "height"]
      }
    ]
  }
];
const unit = (id, assignmentId, courseId, questionId, studentId, studentName, status, attempts) => ({ id, assignmentId, courseId, questionId, studentId, studentName, status, attempts });
const att = (n, text, submittedAt, ev, extra) => ({ n, text, submittedAt, eval: ev, ...extra });
const SEED_UNITS = [
  unit("u-bst-q1-omar", "as-bst", "CS301", "q1", "st-omar", "Omar Khaled", "awaiting_review", [
    att(
      1,
      "Visit 50, then left to 30 because 45 < 50, then right from 30 because 45 > 30; insert as right child of 30. At each visited node the ordering invariant still holds: everything left stays smaller, everything right stays larger.",
      ago(30),
      { aiScore: 9, confidence: "high", feedback: "Correct visit order and invariant stated at each step. Minor wording gap on final placement.", misconceptions: [], sources: ["CS301 · Lec 5 §1"] }
    )
  ]),
  unit("u-bst-q1-lina", "as-bst", "CS301", "q1", "st-lina", "Lina Hassan", "awaiting_review", [
    att(
      1,
      "Path: 50 → 30 → insert right of 30. Comparisons: 45 < 50 go left, 45 > 30 go right. The invariant preserved at each step is that the left subtree of every visited node holds only smaller keys and the right only larger.",
      ago(29),
      { aiScore: 10, confidence: "high", feedback: "Complete path with exact comparisons and a clean invariant statement.", misconceptions: [], sources: ["CS301 · Lec 5 §1", "CS301 · Lec 5 §3"] }
    )
  ]),
  unit("u-bst-q1-youssef", "as-bst", "CS301", "q1", "st-youssef", "Youssef Nasser", "awaiting_review", [
    att(
      1,
      "50 then 30 then place right of 30. Invariant: left < node < right at every step. Sorted insert example: inserting 1,2,3 builds a right-only chain, so balance breaks.",
      ago(28),
      { aiScore: 9, confidence: "high", feedback: "Invariant correct and sorted-insert example precise. Consequence stated briefly.", misconceptions: [], sources: ["CS301 · Lec 5 §1"] }
    )
  ]),
  unit("u-bst-q1-mariam", "as-bst", "CS301", "q1", "st-mariam", "Mariam Adel", "awaiting_review", [
    att(
      1,
      "BST keeps things ordered. Inserting sorted numbers makes it unbalanced because everything piles on one side.",
      ago(27),
      { aiScore: 5, confidence: "medium", feedback: "Captures the consequence but never states the ordering invariant formally.", misconceptions: ["mc-bst-inorder"], sources: ["CS301 · Lec 5 §1"] }
    )
  ]),
  unit("u-bst-q2-karim", "as-bst", "CS301", "q2", "st-karim", "Karim Fathi", "awaiting_review", [
    att(
      1,
      "The tree stays sorted somehow. Sorted data is fine because the tree rebalances itself.",
      ago(26),
      { aiScore: 2, confidence: "insufficient_evidence", feedback: "Answer contradicts the grounded material (a plain BST does not rebalance) and is too thin to score against the rubric; manual review required.", misconceptions: ["mc-bst-inorder", "mc-bst-invariant"], sources: [] }
    )
  ]),
  unit("u-bst-q1-hana", "as-bst", "CS301", "q1", "st-hana", "Hana Saeed", "final", [
    att(
      1,
      "50 → 30 → right of 30; invariant checked at each visit: left subtree keys < node key < right subtree keys, so the insert preserves order.",
      ago(44),
      { aiScore: 10, confidence: "high", feedback: "Textbook-correct path and invariant.", misconceptions: [], sources: ["CS301 · Lec 5 §1"] },
      { decision: { action: "approve", finalScore: 10, finalFeedback: "Textbook-correct path and invariant.", decidedBy: INSTRUCTOR_NAME, decidedAt: at("2026-09-08T18:02:00") } }
    )
  ]),
  unit("u-bst-q2-tarek", "as-bst", "CS301", "q2", "st-tarek", "Tarek Aziz", "final", [
    att(
      1,
      "Invariant: left smaller, right larger. Sorted insert is bad-ish because the tree gets tall.",
      ago(43),
      { aiScore: 6, confidence: "high", feedback: "Invariant stated; the sorted-insert consequence is vague and lacks the degenerate-chain argument.", misconceptions: ["mc-bst-invariant"], sources: ["CS301 · Lec 5 §1"] },
      { decision: { action: "edit", finalScore: 4, finalFeedback: "Lowered to 4: the example never shows why height becomes n−1, so half the rubric is unmet.", decidedBy: INSTRUCTOR_NAME, decidedAt: at("2026-09-08T18:20:00") } }
    )
  ]),
  unit("u-hash-q1-nour", "as-hash", "CS301", "q1", "st-nour", "Nour Al-Qahtani", "awaiting_review", [
    att(
      1,
      "Chaining degrades gradually: average chain length tracks α and worst case is O(n) if everything collides. Open addressing hits clustering as α→1, so most implementations rehash around α = 0.75.",
      ago(24),
      { aiScore: 9, confidence: "high", feedback: "Both degradation profiles correct with the resize threshold named.", misconceptions: [], sources: ["CS301 · Lec 7"] }
    )
  ]),
  unit("u-hash-q1-faris", "as-hash", "CS301", "q1", "st-faris", "Faris Ibrahim", "awaiting_review", [
    att(
      1,
      "Chaining: chains grow with load factor, search slows linearly in the worst case. Open addressing: probes cluster near full tables; resize before α gets high.",
      ago(23),
      { aiScore: 8, confidence: "high", feedback: "Correct model; the clustering mechanism could be named (primary clustering) for full marks.", misconceptions: [], sources: ["CS301 · Lec 7"] }
    )
  ]),
  unit("u-hash-q1-moh", "as-hash", "CS301", "q1", "st-moh", "Mohammed Al-Rashidi", "awaiting_review", [
    att(
      1,
      "Chaining is always O(1) because each bucket is a list. Open addressing is slower but fine.",
      ago(22),
      { aiScore: 4, confidence: "medium", feedback: "The O(1) worst-case claim for chaining is the known class-wide error; chain length grows with α.", misconceptions: ["mc-hash-chaining"], sources: ["CS301 · Lec 7"] }
    )
  ]),
  unit("u-hash-q2-sarah", "as-hash", "CS301", "q2", DEMO_STUDENT_ID, "Sarah Al-Rashidi", "resubmission_requested", [
    att(
      1,
      "5 → slot 0, 15 → slot 1, 25 → slot 2. Final [5, 15, 25, –, –]. Load factor 0.6 so probably fine.",
      ago(21),
      { aiScore: 5, confidence: "high", feedback: "Layout is right but the probe arithmetic for 25 (0 → 1 → 2) is not shown and the resize judgement is unargued.", misconceptions: [], sources: ["CS301 · Lec 7"] },
      { resubmitReason: "Show the computation and state whether a resize is urgent." }
    )
  ]),
  unit("u-quiz-q1-tariq", "as-quiz", "CS301", "q2", "st-tariq", "Tariq Al-Nasser", "final", [
    att(
      1,
      "Any edge back to a visited node proves a cycle.",
      ago(400),
      { aiScore: 3, confidence: "high", feedback: "Visited-node reasoning is insufficient for directed graphs; the proving class is a back edge to an active ancestor.", misconceptions: [], sources: ["CS301 · Lec 6 §4"] },
      { decision: { action: "reject", finalScore: 2, finalFeedback: "Manual grade 2: the back-edge condition is missing entirely.", decidedBy: INSTRUCTOR_NAME, decidedAt: at("2026-08-28T16:31:00") } }
    )
  ]),
  unit("u-quiz-q1-hana", "as-quiz", "CS301", "q1", "st-hana", "Hana Saeed", "final", [
    att(
      1,
      "A FIFO queue, because expanding vertices in discovery order is what produces level-by-level visitation.",
      ago(399),
      { aiScore: 5, confidence: "high", feedback: "Precise.", misconceptions: [], sources: ["CS301 · Lec 6 §2"] },
      { decision: { action: "approve", finalScore: 5, finalFeedback: "Precise.", decidedBy: INSTRUCTOR_NAME, decidedAt: at("2026-08-28T16:40:00") } }
    )
  ]),
  unit("u-quiz-q2-omar", "as-quiz", "CS301", "q2", "st-omar", "Omar Khaled", "final", [
    att(
      1,
      "A back edge to an ancestor on the recursion stack.",
      ago(398),
      { aiScore: 4, confidence: "high", feedback: "Correct class; the active-ancestor condition is implied but not stated.", misconceptions: [], sources: ["CS301 · Lec 6 §4"] },
      { decision: { action: "edit", finalScore: 5, finalFeedback: "Raised to 5 after re-reading: recursion-stack mention covers the condition.", decidedBy: INSTRUCTOR_NAME, decidedAt: at("2026-08-28T16:45:00") } }
    )
  ]),
  unit("u-sched-q1-nour", "as-sched", "CS401", "q1", "st-nour", "Nour Al-Qahtani", "awaiting_review", [
    att(
      1,
      "Gantt: P1(0-2) P2(2-4) P1(4-5) P3(5-7) P2(7-8); waiting times 3, 2, 2 → average 2.33.",
      ago(18),
      { aiScore: 9, confidence: "high", feedback: "Gantt and arithmetic verified against the reference.", misconceptions: [], sources: ["CS401 · Lec 4"] }
    )
  ]),
  unit("u-sched-q1-faris", "as-sched", "CS401", "q1", "st-faris", "Faris Ibrahim", "awaiting_review", [
    att(
      1,
      "RR(2): P1 0-2, P2 2-4, P1 4-5, P3 5-7, P2 7-8. Average waiting 2.33.",
      ago(17),      { aiScore: 9, confidence: "high", feedback: "Correct; presentation terse but complete.", misconceptions: [], sources: ["CS401 · Lec 4"] }
    )
  ]),
  unit("u-sched-q2-hana", "as-sched", "CS401", "q2", "st-hana", "Hana Saeed", "awaiting_review", [
    att(
      1,
      "SJF starves long jobs while short jobs keep arriving; ageing raises priority with wait time so everyone eventually runs.",
      ago(16),
      { aiScore: 8, confidence: "high", feedback: "Both halves correct and concise.", misconceptions: [], sources: ["CS401 · Lec 4"] }
    )
  ]),
  unit("u-sched-q1-moh", "as-sched", "CS401", "q1", "st-moh", "Mohammed Al-Rashidi", "awaiting_review", [
    att(
      1,
      "Average waiting 4.33 with quantum 2; the quantum does not matter much here.",
      ago(15),
      { aiScore: 4, confidence: "medium", feedback: "Average is off by one context switch and the quantum remark contradicts RR preemption.", misconceptions: ["mc-sched-quantum"], sources: ["CS401 · Lec 4"] }
    )
  ]),
  unit("u-sched-q2-tariq", "as-sched", "CS401", "q2", "st-tariq", "Tariq Al-Nasser", "final", [
    att(
      1,
      "SJF starves long processes.",
      ago(14),
      { aiScore: 3, confidence: "low", feedback: "Starvation named but ageing never addressed.", misconceptions: [], sources: ["CS401 · Lec 4"] },
      { decision: { action: "edit", finalScore: 4, finalFeedback: "Raised to 4: starvation is correctly named; ageing omitted but the trade-off is stated.", decidedBy: INSTRUCTOR_NAME, decidedAt: at("2026-09-07T09:12:00") } }
    )
  ]),
  unit("u-sched-q2-karim", "as-sched", "CS401", "q2", "st-karim", "Karim Fathi", "final", [
    att(
      1,
      "Ageing fixes priority inversion I think.",
      ago(13),
      { aiScore: 2, confidence: "insufficient_evidence", feedback: "Too thin to ground a score; manual review required.", misconceptions: [], sources: [] },
      { decision: { action: "reject", finalScore: 1, finalFeedback: "Rejected: ageing addresses starvation, not priority inversion — the answer conflates the two.", decidedBy: INSTRUCTOR_NAME, decidedAt: at("2026-09-07T09:20:00") } }
    )
  ]),
  unit("u-sched-q1-sarah", "as-sched", "CS401", "q1", DEMO_STUDENT_ID, "Sarah Al-Rashidi", "awaiting_review", [
    att(
      1,
      "RR(2): P1 0-2, P2 2-4, P1 4-5, P3 5-7, P2 7-8; waiting times 2, 3, 2 → average 2.33. The quantum matters: with quantum 4, P1 completes in a single slice and the average waiting time rises.",
      ago(20),
      { aiScore: 6, confidence: "medium", feedback: "Trace is correct but the quantum comparison is asserted rather than computed.", misconceptions: [], sources: ["CS401 · Lec 4"] }
    )
  ]),
  unit("u-sched-q2-sarah", "as-sched", "CS401", "q2", DEMO_STUDENT_ID, "Sarah Al-Rashidi", "awaiting_review", [
    att(
      1,
      "SJF minimises average waiting time but starves long jobs; ageing fixes that by raising priority with wait time.",
      ago(20),
      { aiScore: 7, confidence: "medium", feedback: "Both halves named; the mechanism of ageing needs one more sentence to be complete.", misconceptions: [], sources: ["CS401 · Lec 4"] }
    )
  ]),
  unit("u-sql-q1-lina", "as-sql", "CS303", "q1", "st-lina", "Lina Hassan", "awaiting_review", [
    att(
      1,
      "SELECT s.id FROM students s LEFT JOIN enrolments e ON e.student_id = s.id WHERE e.id IS NULL; the left join keeps students with no matching enrolment row.",
      ago(12),
      { aiScore: 9, confidence: "high", feedback: "Query and justification both correct.", misconceptions: [], sources: ["CS303 · Lec 3"] }
    )
  ]),
  unit("u-sql-q2-mariam", "as-sql", "CS303", "q2", "st-mariam", "Mariam Adel", "awaiting_review", [
    att(
      1,
      "Because the tree is balanced, ranges are fast.",
      ago(11),
      { aiScore: 4, confidence: "medium", feedback: "Balance alone is not the reason; the linked leaf level is what makes a range scan sequential.", misconceptions: [], sources: ["CS303 · Lec 5"] }
    )
  ])
];
const SEED_DRAFTS = {};
const SEED_AUDIT = [
  { id: "au-1", at: at("2026-09-08T18:02:00"), courseId: "CS301", assignmentId: "as-bst", assignmentTitle: "BST Invariants & Traversal", studentName: "Hana Saeed", questionLabel: "Q1 · Insert 45 into the BST", action: "approve", aiScore: 10, finalScore: 10, instructor: INSTRUCTOR_NAME },
  { id: "au-2", at: at("2026-09-08T18:20:00"), courseId: "CS301", assignmentId: "as-bst", assignmentTitle: "BST Invariants & Traversal", studentName: "Tarek Aziz", questionLabel: "Q2 · Ordering invariant", action: "edit", aiScore: 6, finalScore: 4, instructor: INSTRUCTOR_NAME, note: "Lowered: degenerate-chain argument missing." },
  { id: "au-3", at: at("2026-09-07T21:44:00"), courseId: "CS301", assignmentId: "as-hash", assignmentTitle: "Hash Tables in Practice", studentName: "Sarah Al-Rashidi", questionLabel: "Q2 · Linear probing insert", action: "resubmit", aiScore: 5, finalScore: null, instructor: INSTRUCTOR_NAME, note: "Show the computation and state whether a resize is urgent." },
  { id: "au-4", at: at("2026-09-05T10:15:00"), courseId: "CS301", assignmentId: "as-hash", assignmentTitle: "Hash Tables in Practice", studentName: "—", questionLabel: "—", action: "visibility", aiScore: null, finalScore: null, instructor: INSTRUCTOR_NAME, visibilityBefore: false, visibilityAfter: true, note: "Scores published after re-checking Q1 grades." },
  { id: "au-5", at: at("2026-08-28T16:31:00"), courseId: "CS301", assignmentId: "as-quiz", assignmentTitle: "Graph Traversal Quiz", studentName: "Tariq Al-Nasser", questionLabel: "Q2 · Cycle-proving edge", action: "reject", aiScore: 3, finalScore: 2, instructor: INSTRUCTOR_NAME, note: "Manual grade: back-edge condition missing." }
];
const SEED_REMEDIAL = [
  {
    id: "rem-seed-1",
    courseId: "CS301",
    topicId: "bst",
    misconceptionId: "mc-bst-invariant",
    type: "explanation",
    title: "Focused explanation — Binary Trees & BST",
    body: "The invariant check after every insert…",
    audience: "affected",
    manualIds: [],
    status: "published",
    createdAt: at("2026-09-06T09:00:00")
  },
  {
    id: "rem-seed-2",
    courseId: "CS301",
    topicId: "hash",
    misconceptionId: "mc-hash-chaining",
    type: "practice",
    title: "Additional practice — Hash Table Internals",
    body: "Three questions on chain length vs load factor…",
    audience: "affected",
    manualIds: [],
    status: "published",
    createdAt: at("2026-09-04T09:00:00")
  },
  {
    id: "rem-seed-3",
    courseId: "CS301",
    topicId: "avl",
    misconceptionId: "mc-avl",
    type: "explanation",
    title: "Focused explanation — Binary Tree Balancing (AVL)",
    body: "Balance factor vs ordering invariant…",
    audience: "all",
    manualIds: [],
    status: "published",
    createdAt: at("2026-09-03T09:00:00")
  },
  {
    id: "rem-seed-4",
    courseId: "CS301",
    topicId: "graphs",
    misconceptionId: "mc-graphs-v2",
    type: "practice",
    title: "Additional practice — Graph Representation",
    body: "Adjacency list vs matrix traversal costs…",
    audience: "all",
    manualIds: [],
    status: "published",
    createdAt: at("2026-09-02T09:00:00")
  }
];
function evaluateAnswer(question, answerText, course) {
  const topic = course.topics.find((t) => t.id === question.topicId);
  const text = (answerText || "").trim();
  if (!topic || approvedMaterials(topic) === 0) {
    return {
      aiScore: null,
      criteria: [],
      confidence: "insufficient_evidence",
      feedback: `No approved course material exists for ${topic ? topic.label.en : question.topicId}, so this evaluation cannot be grounded. Mandatory manual review — no suggested score is issued.`,
      misconceptions: [],
      sources: []
    };
  }
  const words = text.toLowerCase();
  const misconceptions = MISCONCEPTIONS.filter((m) => m.topicId === question.topicId && m.markers.some((k) => words.includes(k))).map((m) => m.id);
  if (text.length === 0) {
    return { aiScore: 0, confidence: "low", feedback: "Empty answer — nothing to evaluate.", misconceptions, sources: [], criteria: [] };
  }
  const matched = question.keyTerms.filter((k) => words.includes(k));
  const coverage = question.keyTerms.length ? matched.length / question.keyTerms.length : Math.min(1, text.length / 400);
  const structured = /(first|then|step|\d\s*[).]|because|therefore|so that)/.test(words) ? 1 : 0.45;
  const lengthFactor = Math.min(1, text.length / 600);
  const raw = 0.55 * coverage + 0.25 * structured + 0.2 * lengthFactor;
  const aiScore = Math.max(0, Math.min(question.maxScore, Math.round(raw * question.maxScore)));
  let confidence;
  const hasRef = Boolean(question.referenceAnswer);
  const hasRubric = Boolean(question.rubric);
  if (hasRef && hasRubric) confidence = coverage >= 0.5 ? "high" : "medium";
  else if (hasRubric) confidence = coverage >= 0.75 ? "high" : coverage >= 0.4 ? "medium" : "low";
  else confidence = text.length > 240 ? "medium" : "low";
  const rubricLines = (question.rubric ?? "").split(/\n|•|;-/).map((l) => l.replace(/^[-*\d.)\s]+/, "").trim()).filter((l) => l.length > 3).slice(0, 5);
  let criteria = [];
  if (rubricLines.length) {
    const perMax = Math.max(1, Math.round(question.maxScore / rubricLines.length));
    const weights = rubricLines.map((line) => {
      const kw = line.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? [];
      const hit = kw.filter((w) => words.includes(w)).length;
      return 0.25 + (kw.length ? hit / kw.length : 0.5);
    });
    const wSum = weights.reduce((a, b) => a + b, 0);
    let assigned = 0;
    criteria = rubricLines.map((line, i) => {
      const share = weights[i] / wSum;
      let earned = i === rubricLines.length - 1 ? aiScore - assigned : Math.round(aiScore * share);
      earned = Math.max(0, Math.min(perMax, earned));
      assigned += earned;
      return { label: line, earned, max: perMax };
    });
  }
  const missing = question.keyTerms.filter((k) => !words.includes(k));
  const parts = [];
  parts.push(
    matched.length ? `Grounded on ${matched.length}/${question.keyTerms.length} expected concepts (${matched.join(", ")}).` : "None of the expected key concepts for this topic appear in the answer."
  );
  if (missing.length) parts.push(`Not addressed: ${missing.join(", ")}.`);
  if (misconceptions.length) parts.push("Detected misconception(s) consistent with a known class-wide error pattern.");
  if (!hasRef && !hasRubric) parts.push("No reference answer or rubric was provided, so confidence is capped.");
  parts.push(`Suggested score ${aiScore}/${question.maxScore}.`);
  return {
    aiScore,
    confidence,
    feedback: parts.join(" "),
    misconceptions,
    sources: topic.materials.filter((m) => m.status === "approved").slice(0, 2).map((m) => `${course.id} · ${m.title}`),
    criteria
  };
}
const COURSE_BY_ID = (id) => COURSES.find((c) => c.id === id) ?? COURSES[0];
function misconceptionText(id, _lang) {
  const m = MISCONCEPTIONS.find((x) => x.id === id);
  return m ? m.text : id;
}
const QUESTION_KINDS = Object.freeze({
  MULTIPLE_CHOICE: "multiple_choice",
  MULTIPLE_SELECT: "multiple_select",
  TRUE_FALSE: "true_false",
  SHORT_ANSWER: "short_answer",
  LONG_ANSWER: "long_answer",
  ESSAY: "essay",
  PROBLEM_SOLVING: "problem_solving"
});
const QUESTION_KIND_LABELS = {
  multiple_choice: { en: "Multiple choice", ar: "اختيار من متعدد" },
  multiple_select: { en: "Multiple select", ar: "اختيار متعدد الإجابات" },
  true_false: { en: "True / False", ar: "صح / خطأ" },
  short_answer: { en: "Short answer", ar: "إجابة قصيرة" },
  long_answer: { en: "Long answer", ar: "إجابة طويلة" },
  essay: { en: "Essay", ar: "مقال" },
  problem_solving: { en: "Problem-solving", ar: "حل مسألة" }
};
const kindOf = (q) => q?.kind ?? QUESTION_KINDS.LONG_ANSWER;
const kindNeedsOptions = (kind) => kind === QUESTION_KINDS.MULTIPLE_CHOICE || kind === QUESTION_KINDS.MULTIPLE_SELECT;
const isChoiceKind = (kind) => kindNeedsOptions(kind) || kind === QUESTION_KINDS.TRUE_FALSE;
const kindRows = (kind) => (kind === QUESTION_KINDS.SHORT_ANSWER ? 2 : kind === QUESTION_KINDS.ESSAY ? 9 : kind === QUESTION_KINDS.PROBLEM_SOLVING ? 7 : 5);
const kindLabel = (kind, lang) => QUESTION_KIND_LABELS[kind] ? QUESTION_KIND_LABELS[kind][lang] : kind;
export {
  ANALYTICS_AS_OF,
  ASSIGNMENTS,
  COURSES,
  COURSE_BY_ID,
  COURSE_SESSIONS,
  DEMO_STUDENT_ID,
  INSTRUCTOR_COURSE_IDS,
  INSTRUCTOR_NAME,
  MISCONCEPTIONS,
  QUESTION_KINDS,
  QUESTION_KIND_LABELS,
  SEED_AUDIT,
  SEED_DRAFTS,
  SEED_REMEDIAL,
  SEED_UNITS,
  STUDENTS,
  STUDENT_INSTITUTIONAL_IDS,
  STUDENT_PERSONAL_IDS,
  ago,
  approvedMaterials,
  coverageGap,
  evaluateAnswer,
  finalScoreOf,
  fmtAgo,
  fmtWhen,
  isChoiceKind,
  kindLabel,
  kindNeedsOptions,
  kindOf,
  kindRows,
  latestAttempt,
  misconceptionText,
  pendingMaterials,
  studentTopicMastery
};