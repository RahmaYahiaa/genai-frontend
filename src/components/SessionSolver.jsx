import { useState } from "react";
import { MONO } from "@/constants/tokens";
import { Btn, Card, Chip, ConfidencePill, bFontFor, textareaStyle, inputStyle } from "@/components/ModuleUI";

const CORRECTNESS_LABELS = {
  CORRECT: { en: "Correct", ar: "صحيح" },
  PARTIAL: { en: "Partial", ar: "جزئي" },
  INCORRECT: { en: "Incorrect", ar: "غير صحيح" },
};

export function EvaluationCard({ evaluation, tokens, lang }) {
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRtl = lang === "ar";
  const bFont = bFontFor(lang);
  if (!evaluation) return null;
  const correctness = evaluation.correctness ?? null;
  return (
    <div style={{ background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, padding: "10px 12px", marginTop: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6, flexDirection: isRtl ? "row-reverse" : "row" }}>
        {correctness && (
          <Chip tokens={tokens} tone={correctness === "CORRECT" ? "primary" : correctness === "PARTIAL" ? "slate" : "violet"}>
            {lang === "ar" ? CORRECTNESS_LABELS[correctness]?.ar ?? correctness : CORRECTNESS_LABELS[correctness]?.en ?? correctness}
          </Chip>
        )}
        {evaluation.confidence && (
          <ConfidencePill confidence={String(evaluation.confidence).toLowerCase()} tokens={tokens} lang={lang} short />
        )}
        <span style={{ fontFamily: MONO, fontSize: 10.5, color: tokens.textSecondary }}>
          {t("score", "الدرجة")}: {evaluation.score}
        </span>
      </div>
      {evaluation.feedback && (
        <p style={{ fontFamily: bFont, fontSize: 12, color: tokens.textSecondary, lineHeight: 1.65, margin: 0, textAlign: isRtl ? "right" : "left" }}>
          {evaluation.feedback}
        </p>
      )}
      {(evaluation.misconceptions ?? []).length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
          {evaluation.misconceptions.map((item) => (
            <Chip key={item.code ?? item} tokens={tokens} tone="violet">{item.code ?? item}</Chip>
          ))}
        </div>
      )}
    </div>
  );
}

export function QuestionFlow({ questions, evaluations, answeredIds, busyId, onSubmit, tokens, lang, mobile, doneNote }) {
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRtl = lang === "ar";
  const bFont = bFontFor(lang);
  const [texts, setTexts] = useState({});
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {questions.map((question, index) => {
        const answered = answeredIds.includes(question.id);
        return (
          <Card tokens={tokens} key={question.id} style={{ padding: mobile ? "12px 14px" : "14px 16px" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8, flexDirection: isRtl ? "row-reverse" : "row" }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint }}>Q{index + 1}</span>
              {question.difficulty && <Chip tokens={tokens} tone="slate">{question.difficulty}</Chip>}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: tokens.textPrimary, lineHeight: 1.6, marginBottom: 8, textAlign: isRtl ? "right" : "left" }}>
              {question.prompt}
            </div>
            <textarea
              value={texts[question.id] ?? ""}
              disabled={answered}
              onChange={(event) => setTexts((prev) => ({ ...prev, [question.id]: event.target.value }))}
              rows={4}
              placeholder={t("Write your answer…", "اكتب إجابتك…")}
              style={{ ...textareaStyle(tokens, bFont), width: "100%", minHeight: 80, resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
              <Btn
                tokens={tokens}
                lang={lang}
                disabled={answered || busyId === question.id || !(texts[question.id] ?? "").trim()}
                onClick={() => onSubmit(question.id, texts[question.id])}
              >
                {busyId === question.id
                  ? t("Evaluating…", "جاري التقييم…")
                  : answered
                    ? t("Answered", "تمت الإجابة")
                    : t("Submit answer", "تسليم الإجابة")}
              </Btn>
            </div>
            <EvaluationCard evaluation={evaluations[question.id] ?? null} tokens={tokens} lang={lang} />
          </Card>
        );
      })}
      {doneNote}
    </div>
  );
}

export function TopicSelect({ topics, value, onChange, tokens, lang, placeholder }) {
  const bFont = bFontFor(lang);
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} style={{ ...inputStyle(tokens, bFont), minWidth: 180, flex: 1 }}>
      <option value="">{placeholder}</option>
      {topics.map((topic) => (
        <option key={topic.id} value={topic.id}>{topic.label?.en ?? topic.title ?? topic.id}</option>
      ))}
    </select>
  );
}

export function CourseSelect({ courses, value, onChange, tokens, lang, placeholder }) {
  const bFont = bFontFor(lang);
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} style={{ ...inputStyle(tokens, bFont), minWidth: 180, flex: 1 }}>
      <option value="">{placeholder}</option>
      {courses.map((course) => (
        <option key={course.id} value={course.id}>{course.title?.en ?? course.title}</option>
      ))}
    </select>
  );
}

export function LearnerSessionTabs({ tab, onChange, tokens, lang }) {
  const bFont = bFontFor(lang);
  const items = [
    ["new", lang === "ar" ? "جلسة جديدة" : "New session"],
    ["history", lang === "ar" ? "الجلسات السابقة" : "History"],
  ];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14, flexDirection: lang === "ar" ? "row-reverse" : "row" }}>
      {items.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{
            fontFamily: bFont,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            padding: "7px 14px",
            borderRadius: 8,
            color: tab === key ? tokens.primary : tokens.textSecondary,
            background: tab === key ? tokens.primaryLight : tokens.inset,
            border: `1px solid ${tab === key ? tokens.primary : tokens.cardBorder}`,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
