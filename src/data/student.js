export const STUDENT_STATS = {
  avgMastery: 46,
  evidenceItems: 32,
  streakDays: 6,
  studyMinutes: 187,
  goalMinutes: 240,
  topicsCovered: 5,
  topicsTotal: 6,
};

export const UPCOMING_TASKS = [
  { id: "t1", kind: "diagnostic", course: "CS301", due: { en: "Today", ar: "اليوم" }, label: { en: "Complete Diagnostic B", ar: "أكمل التشخيص ب" } },
  { id: "t2", kind: "reassessment", course: "CS301", due: { en: "Fri", ar: "الجمعة" }, label: { en: "Midterm Reassessment", ar: "إعادة تقييم منتصف الفصل" } },
  { id: "t3", kind: "practice", course: "CS301", due: { en: "Sat", ar: "السبت" }, label: { en: "Graphs practice set", ar: "تدريبات الرسوم البيانية" } },
];

export const TASK_KIND_LABELS = {
  diagnostic: { en: "Diagnostic", ar: "تشخيص" },
  reassessment: { en: "Reassessment", ar: "إعادة تقييم" },
  practice: { en: "Practice", ar: "تدريب" },
};

export const TUTOR_SEED = [
  {
    id: "m1",
    from: "ai",
    text: { en: "Hi Sarah. I see Binary Trees & BST is at 38% with only 4 evidence items — that's your biggest gap. Want to close it?", ar: "أهلاً سارة. لاحظت أن الأشجار الثنائية و BST عند 38% مع 4 أدلة فقط — دي أكبر فجوة عندك. تحبي نسدها؟" },
    sources: [],
  },
];

export const TUTOR_REPLIES = [
  {
    text: {
      en: "A BST keeps values ordered: every node's left subtree holds smaller values, the right subtree holds larger ones. That invariant makes search O(log n) on average.",
      ar: "شجرة البحث الثنائي بتحافظ على الترتيب: كل قيم الشجرة اليسرى أصغر من العقدة، وقيم اليمنى أكبر. وده اللي بيخلي البحث O(log n) في المتوسط.",
    },
    sources: [
      { label: "Lecture 6 · p.23", ref: "CS301/lecture06.pdf#page=23" },
      { label: "Textbook §4.2", ref: "CS301/textbook.pdf#page=112" },
    ],
  },
  {
    text: {
      en: "Great question. My answers only use your approved CS301 materials — I won't invent content outside the course.",
      ar: "سؤال ممتاز. إجاباتي مش بتستخدم غير مواد CS301 المعتمدة — مش بختلق محتوى خارج المقرر.",
    },
    sources: [{ label: "Syllabus · p.2", ref: "CS301/syllabus.pdf#page=2" }],
  },
  {
    text: {
      en: "Let's anchor it with evidence: try the practice set on Binary Trees — 4 questions, immediate feedback, and each correct one adds evidence to your mastery map.",
      ar: "نثبّتها بالدليل: جرب تدريبات الأشجار الثنائية — 4 أسئلة بتصحيح فوري، وكل إجابة صحيحة بتضيف دليل لخريطة إتقانك.",
    },
    sources: [
      { label: "Practice Set B", ref: "CS301/practice-b.pdf" },
      { label: "Lecture 7 · p.31", ref: "CS301/lecture07.pdf#page=31" },
    ],
  },
];

export const TUTOR_TOPICS = [
  { id: "bst", label: { en: "Binary Trees & BST", ar: "الأشجار الثنائية و BST" } },
  { id: "bfs", label: { en: "BFS / Graph Traversal", ar: "BFS / اجتياز الرسوم" } },
  { id: "hash", label: { en: "Hash Tables", ar: "الجداول المبعثرة" } },
  { id: "dijkstra", label: { en: "Dijkstra", ar: "دايكسترا" } },
];

export const DIAGNOSTIC_QUESTIONS = [
  { id: "d1", topicId: "bfs", stem: { en: "Which structure does BFS use to visit nodes level by level?", ar: "ما الهيكل الذي يستخدمه BFS لزيارة العقد مستوى بمستوى؟" }, options: [{ en: "Stack", ar: "مكدس" }, { en: "Queue", ar: "طابور" }, { en: "Priority queue", ar: "طابور أولوية" }, { en: "Hash table", ar: "جدول مبعثر" }], correct: 1 },
  { id: "d2", topicId: "bst", stem: { en: "In a BST, every value in the left subtree of a node is:", ar: "في شجرة بحث ثنائي، كل قيمة في الشجرة اليسرى لعقدة هي:" }, options: [{ en: "Greater than the node", ar: "أكبر من العقدة" }, { en: "Smaller than the node", ar: "أصغر من العقدة" }, { en: "Unordered", ar: "غير مرتبة" }, { en: "A duplicate", ar: "مكرر" }], correct: 1 },
  { id: "d3", topicId: "dfs", stem: { en: "DFS typically relies on which auxiliary structure?", ar: "على أي بنية مساعدة يعتمد DFS عادة؟" }, options: [{ en: "Queue", ar: "طابور" }, { en: "Stack / call stack", ar: "مكدس / مكدس الاستدعاء" }, { en: "Min-heap", ar: "كومة دنيا" }, { en: "Linked list", ar: "قائمة مترابطة" }], correct: 1 },
  { id: "d4", topicId: "hash", stem: { en: "Average lookup cost in a well-sized hash table is:", ar: "متوسط تكلفة البحث في جدول مبعثر بحجم مناسب:" }, options: [{ en: "O(n)", ar: "O(n)" }, { en: "O(log n)", ar: "O(log n)" }, { en: "O(1)", ar: "O(1)" }, { en: "O(n log n)", ar: "O(n log n)" }], correct: 2 },
];

export const PRACTICE_QUESTIONS = [
  { id: "p1", topicId: "bst", stem: { en: "You search for 45 in a BST rooted at 50 with left child 30 and right child 70. Which node is visited next?", ar: "تبحث عن 45 في شجرة جذرها 50 وابنها الأيسر 30 والأيمن 70. أي عقدة تُزار تالياً؟" }, options: [{ en: "30", ar: "30" }, { en: "70", ar: "70" }, { en: "50", ar: "50" }, { en: "Done at root", ar: "انتهى عند الجذر" }], correct: 0, explanation: { en: "45 < 50, so you move left to 30.", ar: "45 أصغر من 50، لذلك تنتقل يساراً إلى 30." } },
  { id: "p2", topicId: "bfs", stem: { en: "BFS from a single source explores vertices in order of:", ar: "BFS من مصدر واحد يستكشف الرءوس بترتيب:" }, options: [{ en: "Increasing distance", ar: "زيادة المسافة" }, { en: "Decreasing weight", ar: "تناقص الوزن" }, { en: "Reverse insertion", ar: "عكس الإدراج" }, { en: "Random order", ar: "ترتيب عشوائي" }], correct: 0, explanation: { en: "BFS visits nodes by hop distance from the source.", ar: "BFS يزور العقد حسب عدد القفزات من المصدر." } },
  { id: "p3", topicId: "hash", stem: { en: "Two distinct keys hash to the same bucket. This is called a:", ar: "مفتاحان مختلفان ينتجان نفس الجرافة. هذا يسمى:" }, options: [{ en: "Collision", ar: "تصادم" }, { en: "Overflow", ar: "فائض" }, { en: "Spill", ar: "انسكاب" }, { en: "Merge", ar: "دمج" }], correct: 0, explanation: { en: "The hash function maps both to the same index; chaining resolves it.", ar: "دالة التجزئة أعطتهما نفس الفهرس؛ السلسلة تحل التصادم." } },
  { id: "p4", topicId: "dfs", stem: { en: "Recursive DFS on a graph uses which structure implicitly?", ar: "DFS العودي على رسم بياني يستخدم أي بنية ضمنياً؟" }, options: [{ en: "Call stack", ar: "مكدس الاستدعاء" }, { en: "Queue", ar: "طابور" }, { en: "Min-heap", ar: "كومة دنيا" }, { en: "Nothing", ar: "لا شيء" }], correct: 0, explanation: { en: "Each recursive call pushes a frame onto the call stack.", ar: "كل استدعاء عودي يدفع إطاراً على مكدس الاستدعاء." } },
];

export const REASSESSMENT_QUESTIONS = [
  { id: "r1", topicId: "bst", stem: { en: "In-order traversal of a BST produces values in:", ar: "الاجتياز بالترتيب لشجرة بحث ثنائي ينتج القيم:" }, options: [{ en: "Ascending order", ar: "مرتبة تصاعدياً" }, { en: "Descending order", ar: "مرتبة تنازلياً" }, { en: "Random order", ar: "عشوائياً" }, { en: "By depth", ar: "حسب العمق" }], correct: 0 },
  { id: "r2", topicId: "bfs", stem: { en: "Time complexity of BFS on V vertices and E edges is:", ar: "تعقيد BFS مع V رأساً و E حرفاً هو:" }, options: [{ en: "O(V + E)", ar: "O(V + E)" }, { en: "O(V·E)", ar: "O(V·E)" }, { en: "O(V²)", ar: "O(V²)" }, { en: "O(log V)", ar: "O(log V)" }], correct: 0 },
  { id: "r3", topicId: "hash", stem: { en: "Load factor α of a table with n keys and m buckets is:", ar: "معامل الحمل α لجدول فيه n مفتاحاً و m جرافة هو:" }, options: [{ en: "n / m", ar: "n / m" }, { en: "m / n", ar: "m / n" }, { en: "n · m", ar: "n · m" }, { en: "n − m", ar: "n − m" }], correct: 0 },
  { id: "r4", topicId: "dfs", stem: { en: "DFS can be implemented iteratively using:", ar: "يمكن تنفيذ DFS تكرارياً باستخدام:" }, options: [{ en: "An explicit stack", ar: "مكدس صريح" }, { en: "A single queue", ar: "طابور واحد" }, { en: "Two queues", ar: "طابوران" }, { en: "An array", ar: "مصفوفة" }], correct: 0 },
];

export const RECOMMENDED_NEXT = [
  { id: "n1", en: "Review lecture 6 pages 23–31 on BST invariants", ar: "راجع المحاضرة 6 صفحات 23–31 عن قواعد BST" },
  { id: "n2", en: "Redo the Graphs practice set before Friday", ar: "أعد تدريبات الرسوم قبل الجمعة" },
];