import { useRef, useState } from "react";
import { MONO } from "@/constants/tokens";
import { useInstructorModule } from "@/store/InstructorProvider";
import { Btn, inputStyle, bFontFor, toast } from "@/components/ModuleUI";
import { IconUpload, IconX, IconDoc } from "@/components/Icons";
import { fmtBytes, fileKind } from "@/utils/fileMeta";

const MAX_BYTES = 25 * 1024 * 1024;

export default function MaterialUploader({ courseId, topicId, tokens, lang, style }) {
  const { addMaterial } = useInstructorModule();
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [queue, setQueue] = useState([]);
  const bFont = bFontFor(lang);
  const isRtl = lang === "ar";

  const addFiles = (list) => {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    const ok = [];
    for (const f of files) {
      if (f.size > MAX_BYTES) {
        toast(lang === "ar" ? `«${f.name}» أكبر من 25MB — تم تجاوزه.` : `"${f.name}" is over 25 MB — skipped.`);
        continue;
      }
      ok.push({ key: `${f.name}-${f.size}-${Date.now()}-${ok.length}`, file: f, title: f.name.replace(/\.[^.]+$/, "") });
    }
    if (ok.length) setQueue((q) => [...q, ...ok]);
  };

  const upload = () => {
    if (!queue.length) return;
    for (const item of queue) {
      addMaterial(courseId, topicId, item.title.trim() || item.file.name, {
        fileName: item.file.name,
        size: item.file.size,
        mime: item.file.type,
        url: URL.createObjectURL(item.file)
      });
    }
    toast(
      lang === "ar"
        ? `تم رفع ${queue.length === 1 ? "مادة واحدة" : `${queue.length} مواد`} كمسودات بانتظار الاعتماد.`
        : `Uploaded ${queue.length} material${queue.length === 1 ? "" : "s"} as pending approval.`
    );
    setQueue([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={style}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        style={{
          border: `1.5px dashed ${drag ? tokens.primary : tokens.cardBorder}`,
          background: drag ? tokens.primaryLight : tokens.inset,
          borderRadius: 12,
          padding: "22px 16px",
          textAlign: "center",
          cursor: "pointer",
          transition: "border-color 0.15s, background 0.15s",
          outline: "none"
        }}
      >
        <IconUpload size={20} color={drag ? tokens.primary : tokens.textMuted} />
        <div style={{ fontFamily: bFont, fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginTop: 8 }}>
          {lang === "ar" ? "أفلتى الملفات هنا أو اضغطى للاختيار" : "Drop files here or click to browse"}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10.5, color: tokens.textMuted, marginTop: 5 }}>
          {lang === "ar" ? "PDF · شرائح · مستندات · فيديو — حتى 25MB للملف" : "PDF · slides · docs · video — up to 25 MB per file"}
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {queue.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {queue.map((item) => {
            const kind = fileKind(item.file.name, item.file.type);
            return (
              <div key={item.key} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", background: tokens.inset, border: `1px solid ${tokens.cardBorder}`, borderRadius: 10, flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                <IconDoc size={16} color={kind.color} />
                <div style={{ minWidth: 0, flex: "1 1 140px", textAlign: isRtl ? "right" : "left" }}>
                  <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: tokens.textPrimary }}>{item.file.name}</span>
                    <span style={{ fontFamily: MONO, fontSize: 9.5, color: kind.color, border: `1px solid ${kind.color}55`, borderRadius: 5, padding: "1px 6px" }}>{kind.tag}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textMuted }}>{fmtBytes(item.file.size)}</span>
                  </div>
                  <input
                    value={item.title}
                    onChange={(e) => setQueue((q) => q.map((x) => (x.key === item.key ? { ...x, title: e.target.value } : x)))}
                    placeholder={lang === "ar" ? "عنوان المادة كما سيظهر للطلاب" : "Material title as students will see it"}
                    style={{ ...inputStyle(tokens, bFont), marginTop: 7, fontSize: 12 }}
                    className="genai-input"
                  />
                </div>
                <Btn tokens={tokens} lang={lang} variant="ghost" style={{ padding: "5px 8px", flexShrink: 0 }}
                  onClick={() => setQueue((q) => q.filter((x) => x.key !== item.key))}>
                  <IconX size={13} color={tokens.textMuted} />
                </Btn>
              </div>
            );
          })}
          <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", flexDirection: isRtl ? "row-reverse" : "row" }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: tokens.textFaint }}>
              {lang === "ar" ? "نسخة أولية: الملفات تعيش في جلسة المتصفح هذه — لا خادم بعد." : "Prototype: files live in this browser session — no backend yet."}
            </span>
            <Btn tokens={tokens} lang={lang} variant="solid" disabled={!queue.length} onClick={upload}>
              <IconUpload size={13} color="#fff" />
              {lang === "ar" ? `رفع ${queue.length === 1 ? "ملف واحد" : `${queue.length} ملفات`}` : `Upload ${queue.length} file${queue.length === 1 ? "" : "s"}`}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}