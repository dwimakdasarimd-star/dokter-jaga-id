"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, FileText, HeartPulse, Info, Loader2, Save, Search, Stethoscope, Trash2 } from "lucide-react";
import { runClinicalEngine, type ClinicalEngineResult, type QuestionAnswer, type Vitals } from "../../lib/clinical-engine";
import { deleteClinicalEncounter, listClinicalEncounters, loadClinicalEncounter, saveClinicalEncounter, type ClinicalEncounter } from "../../lib/clinical-storage";

type Patient = { name: string; medicalRecordNumber: string; birthDate: string; sex: "Laki-laki" | "Perempuan" | "" };
type Snapshot = { complaint: string; vitals: Vitals; answers: Record<string, QuestionAnswer> };

const emptyPatient: Patient = { name: "", medicalRecordNumber: "", birthDate: "", sex: "" };
const emptyVitals: Vitals = { bp: "", hr: "", rr: "", temp: "", spo2: "" };

export default function ClinicalWorkspace() {
  const [patient, setPatient] = useState<Patient>(emptyPatient);
  const [complaint, setComplaint] = useState("");
  const [vitals, setVitals] = useState<Vitals>({ ...emptyVitals });
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [analysis, setAnalysis] = useState<ClinicalEngineResult | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [selectedDx, setSelectedDx] = useState("");
  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState("");
  const [savedCases, setSavedCases] = useState<ClinicalEncounter[]>([]);
  const [showCases, setShowCases] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => setSavedCases(listClinicalEncounters()), []);

  const preview = useMemo(() => runClinicalEngine({ complaint, vitals, questionAnswers: answers }), [complaint, vitals, answers]);
  const hasCurrentAnalysis = Boolean(analysis && snapshot && JSON.stringify({ complaint: complaint.trim(), vitals, answers }) === JSON.stringify(snapshot));
  const selected = analysis?.differentials.find(d => d.name === selectedDx) ?? analysis?.differentials[0];

  function invalidateAnalysis() {
    setAnalysis(null);
    setSnapshot(null);
    setSelectedDx("");
    setSavedAt("");
  }

  function runAnalysis() {
    if (!patient.name.trim() && !patient.medicalRecordNumber.trim()) {
      setNotice("Isi nama pasien atau nomor rekam medis terlebih dahulu.");
      return;
    }
    if (!complaint.trim()) {
      setNotice("Isi keluhan pasien terlebih dahulu.");
      return;
    }
    const next: Snapshot = { complaint: complaint.trim(), vitals: { ...vitals }, answers: { ...answers } };
    const result = runClinicalEngine(next);
    setSnapshot(next);
    setAnalysis(result);
    setSelectedDx(result.differentials[0]?.name ?? "");
    setSavedAt("");
    setNotice(`Analisis baru dibuat dari input saat ini: ${result.extracted.length} temuan terstruktur.`);
    document.getElementById("analysis-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function saveCase() {
    if (!patient.name.trim() && !patient.medicalRecordNumber.trim()) {
      setNotice("Isi nama pasien atau nomor rekam medis sebelum menyimpan.");
      return;
    }
    if (!complaint.trim()) {
      setNotice("Isi keluhan sebelum menyimpan encounter.");
      return;
    }
    setSaving(true);
    const result = saveClinicalEncounter({
      patientId: encounterId ? savedCases.find(x => x.id === encounterId)?.patientId : undefined,
      patient: { id: "", ...patient, createdAt: "", updatedAt: "" },
      complaint: complaint.trim(),
      vitals: { ...vitals },
      answers: { ...answers },
      selectedDx: selected?.name ?? "",
      analysisSnapshot: hasCurrentAnalysis ? snapshot : null,
      reviewed: Boolean(hasCurrentAnalysis),
    });
    setEncounterId(result.id);
    setSavedAt(result.updatedAt);
    setSavedCases(listClinicalEncounters());
    setSaving(false);
    setNotice("Encounter tersimpan di browser ini.");
  }

  function loadCase(id: string) {
    const record = loadClinicalEncounter(id);
    if (!record) return;
    setEncounterId(record.id);
    setPatient({ name: record.patient.name, medicalRecordNumber: record.patient.medicalRecordNumber, birthDate: record.patient.birthDate, sex: record.patient.sex });
    setComplaint(record.complaint);
    setVitals(record.vitals);
    setAnswers(record.answers);
    setSelectedDx(record.selectedDx);
    setSnapshot(record.analysisSnapshot);
    setAnalysis(record.analysisSnapshot ? runClinicalEngine(record.analysisSnapshot) : null);
    setSavedAt(record.updatedAt);
    setShowCases(false);
    setNotice(`Encounter ${record.patient.name || record.patient.medicalRecordNumber} dimuat.`);
  }

  function newCase() {
    setPatient({ ...emptyPatient });
    setComplaint("");
    setVitals({ ...emptyVitals });
    setAnswers({});
    setAnalysis(null);
    setSnapshot(null);
    setSelectedDx("");
    setEncounterId(null);
    setSavedAt("");
    setNotice("Kasus baru siap diisi.");
  }

  function updateComplaint(value: string) { setComplaint(value); invalidateAnalysis(); }
  function updateVital(key: keyof Vitals, value: string) { setVitals(prev => ({ ...prev, [key]: value })); invalidateAnalysis(); }
  function updateAnswer(id: string, value: QuestionAnswer) { setAnswers(prev => ({ ...prev, [id]: value })); invalidateAnalysis(); }

  return (
    <main style={s.page}>
      <header style={s.header}>
        <a href="/" style={s.back}><ArrowLeft size={15} /> Dashboard</a>
        <div style={s.brand}><div style={s.logo}><HeartPulse size={18} /></div><div><b style={s.brandTitle}>Dokter Jaga</b><span style={s.brandSub}>Clinical Assistant</span></div></div>
        <span style={{ marginLeft: "auto", fontSize: 9, color: savedAt ? "#16816c" : "#7b879b" }}>{savedAt ? "● Tersimpan" : "● Draft"}</span>
      </header>

      <div style={s.container}>
        <div style={s.titleRow}><div><div style={s.eyebrow}>CLINICAL WORKSPACE</div><h1 style={s.h1}>Clinical Encounter</h1><p style={s.muted}>Input pasien → gejala → pertanyaan terarah → tanda vital → analisis → rencana.</p></div><button type="button" onClick={() => setShowCases(v => !v)} style={s.secondary}><Search size={13} /> {savedCases.length} kasus tersimpan</button></div>

        {notice && <div style={s.notice}><Info size={14} /><span style={{ flex: 1 }}>{notice}</span><button type="button" onClick={() => setNotice("")} style={s.link}>Tutup</button></div>}

        {showCases && <section style={s.card}><div style={s.cardHead}><div><div style={s.eyebrow}>STORED ENCOUNTERS</div><h2 style={s.h2}>Kasus tersimpan</h2></div><button type="button" onClick={() => setShowCases(false)} style={s.link}>Tutup</button></div>{savedCases.length === 0 ? <div style={s.empty}>Belum ada encounter tersimpan.</div> : savedCases.map(x => <div key={x.id} style={s.savedRow}><div style={s.avatar}>{(x.patient.name || "PS").slice(0,2).toUpperCase()}</div><div style={{ flex: 1 }}><b style={{ display: "block", fontSize: 10 }}>{x.patient.name || "Tanpa nama"}</b><span style={s.small}>{x.patient.medicalRecordNumber || "No. RM —"} · {new Date(x.updatedAt).toLocaleString("id-ID")}</span></div><button type="button" onClick={() => loadCase(x.id)} style={s.secondary}>Buka</button><button type="button" onClick={() => { deleteClinicalEncounter(x.id); setSavedCases(listClinicalEncounters()); }} style={s.danger}><Trash2 size={12} /></button></div>)}</section>}

        <section style={s.card}>
          <div style={s.cardHead}><div><div style={s.eyebrow}>PATIENT RECORD</div><h2 style={s.h2}>Data pasien</h2><span style={s.small}>Data ini ikut disimpan bersama encounter.</span></div><span style={savedAt ? s.good : s.draft}>{savedAt ? "Tersimpan" : "Draft"}</span></div>
          <div style={s.patientGrid}>
            <label style={s.label}>Nama pasien<input style={s.input} value={patient.name} onChange={e => { setPatient({ ...patient, name: e.target.value }); setSavedAt(""); }} placeholder="Nama lengkap" /></label>
            <label style={s.label}>No. rekam medis<input style={s.input} value={patient.medicalRecordNumber} onChange={e => { setPatient({ ...patient, medicalRecordNumber: e.target.value }); setSavedAt(""); }} placeholder="No. RM" /></label>
            <label style={s.label}>Tanggal lahir<input style={s.input} type="date" value={patient.birthDate} onChange={e => { setPatient({ ...patient, birthDate: e.target.value }); setSavedAt(""); }} /></label>
            <label style={s.label}>Jenis kelamin<select style={s.input} value={patient.sex} onChange={e => { setPatient({ ...patient, sex: e.target.value as Patient["sex"] }); setSavedAt(""); }}><option value="">Pilih</option><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></label>
          </div>
          <div style={s.actions}><button type="button" onClick={newCase} style={s.secondary}><FileText size={13} /> Kasus Baru</button><button type="button" onClick={saveCase} disabled={saving} style={s.primary}>{saving ? <Loader2 size={13} /> : <Save size={13} />} {saving ? "Menyimpan…" : "Simpan Encounter"}</button></div>
        </section>

        <section style={s.card}>
          <div style={s.cardHead}><div><div style={s.eyebrow}>STEP 01 · KELUHAN</div><h2 style={s.h2}>Keluhan & gambaran awal</h2><span style={s.small}>Ketik bebas. Engine akan membaca gejala yang disebutkan.</span></div><span style={s.chip}>{preview.engineVersion}</span></div>
          <textarea value={complaint} onChange={e => updateComplaint(e.target.value)} placeholder="Contoh: lelah sejak 2 minggu, tidur cukup tetapi tetap mengantuk, berdebar saat aktivitas…" style={s.textarea} />
          <div style={s.tags}>{preview.extracted.length ? preview.extracted.map(x => <span key={x} style={s.tag}><Check size={10} /> {x}</span>) : <span style={s.small}>Belum ada gejala terstruktur.</span>}</div>
          <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
            {[["Contoh fatigue", "Lelah sejak 2 minggu, mudah mengantuk, berdebar saat aktivitas"],["Contoh demam", "Demam 3 hari, sakit kepala, nyeri badan, mual"],["Contoh nyeri dada", "Nyeri dada sejak 2 jam, tertekan, keringat dingin"]].map(([label, value]) => <button key={label} type="button" onClick={() => updateComplaint(value)} style={s.example}>{label}</button>)}
          </div>
          <div style={s.analysisLaunch}><div><b>Analisis memakai data saat tombol ditekan</b><span style={s.small}>Hasil lama dihapus setiap kali input berubah.</span></div><button type="button" onClick={runAnalysis} style={s.primary}><Stethoscope size={14} /> Jalankan Analisis</button></div>
        </section>

        <section style={s.card}>
          <div style={s.cardHead}><div><div style={s.eyebrow}>STEP 02 · ANAMNESIS</div><h2 style={s.h2}>Pertanyaan terarah</h2><span style={s.small}>Pertanyaan berubah mengikuti gejala yang ditemukan.</span></div><span style={s.chipAmber}>{preview.questions.length} pertanyaan</span></div>
          {!preview.questions.length ? <div style={s.empty}>Masukkan keluhan untuk memunculkan pertanyaan.</div> : preview.questions.map(q => <div key={q.id} style={s.question}><div><b style={{ fontSize: 10 }}>{q.text}</b><span style={s.small}>{q.whyItMatters}</span></div><div style={s.answerRow}>{(["yes","no","unknown"] as QuestionAnswer[]).map(a => <button key={a} type="button" onClick={() => updateAnswer(q.id, a)} style={{ ...s.answer, ...(answers[q.id] === a ? s.answerActive : {}) }}>{a === "yes" ? "Ya" : a === "no" ? "Tidak" : "Belum tahu"}</button>)}</div></div>)}
        </section>

        <section style={s.card}>
          <div style={s.cardHead}><div><div style={s.eyebrow}>STEP 03 · PEMERIKSAAN</div><h2 style={s.h2}>Tanda vital</h2></div></div>
          <div style={s.vitals}>{([ ["bp","TD","mmHg"],["hr","Nadi","/menit"],["rr","RR","/menit"],["temp","Suhu","°C"],["spo2","SpO₂","%"] ] as const).map(([key,label,unit]) => <label key={key} style={s.label}>{label}<div style={{ position: "relative" }}><input value={vitals[key] || ""} onChange={e => updateVital(key, e.target.value)} inputMode="decimal" placeholder="—" style={{ ...s.input, paddingRight: 40 }} /><span style={s.unit}>{unit}</span></div></label>)}</div>
          <div style={s.warning}><AlertTriangle size={14} /> Nilai yang kosong tetap dianggap data belum tersedia.</div>
        </section>

        <section id="analysis-result" style={s.card}>
          <div style={s.cardHead}><div><div style={s.eyebrow}>STEP 04 · CLINICAL REASONING</div><h2 style={s.h2}>Hasil analisis</h2><span style={s.small}>Hasil hanya dianggap aktif bila cocok dengan input saat ini.</span></div><span style={hasCurrentAnalysis ? s.good : s.draft}>{hasCurrentAnalysis ? "Analisis aktif" : "Belum dianalisis"}</span></div>
          {!hasCurrentAnalysis ? <div style={s.empty}><Stethoscope size={20} /><div><b>{analysis ? "Input berubah — analisis perlu diulang" : "Belum ada hasil analisis"}</b><span style={s.small}>Isi pasien dan keluhan, lalu tekan “Jalankan Analisis”.</span></div></div> : <>
            <div style={s.metrics}><Metric value={String(analysis!.extracted.length)} label="Temuan" /><Metric value={String(analysis!.differentials.length)} label="Pertimbangan" /><Metric value={String(analysis!.missing.length)} label="Data kurang" /><Metric value={String(analysis!.redFlags.length)} label="Safety flags" /></div>
            <div style={s.inputProof}><b>Input yang dianalisis</b><span>“{snapshot?.complaint}”</span></div>
            {analysis!.differentials.map((d, i) => <button key={d.name} type="button" onClick={() => setSelectedDx(d.name)} style={{ ...s.dx, borderColor: selected?.name === d.name ? "#9bbcff" : "#e2e8f0", background: selected?.name === d.name ? "#f7faff" : "#fff" }}><span style={s.rank}>{i + 1}</span><span style={{ flex: 1, textAlign: "left" }}><b style={{ display: "block", fontSize: 10 }}>{d.name}</b><span style={s.small}>{d.reason}</span><small style={{ display: "block", marginTop: 4, color: "#71809a" }}>{d.tags.join(" · ")}</small></span><em style={s.level}>{d.level}</em></button>)}
            <div style={s.dxBox}><div style={s.eyebrow}>DIAGNOSIS KERJA</div><select value={selected?.name || ""} onChange={e => setSelectedDx(e.target.value)} style={s.input}>{analysis!.differentials.map(d => <option key={d.name}>{d.name}</option>)}</select></div>
            <div style={s.warning}><AlertTriangle size={14} /><span>{analysis!.disposition.title}: {analysis!.disposition.reason}</span></div>
            {analysis!.redFlags.map(x => <div key={x} style={{ ...s.warning, background: "#fff1f1", color: "#b33d3d" }}><AlertTriangle size={14} /><span>{x}</span></div>)}
          </>}
        </section>

        <section style={s.card}>
          <div style={s.cardHead}><div><div style={s.eyebrow}>STEP 05 · RENCANA</div><h2 style={s.h2}>Clinical plan & SOAP</h2></div></div>
          {!hasCurrentAnalysis ? <div style={s.empty}>Jalankan analisis untuk membuat rencana dan SOAP draft.</div> : <><div style={s.planList}>{analysis!.investigations.map(x => <div key={x.name} style={s.planRow}><Check size={13} /><div><b>{x.name}</b><span style={s.small}>{x.reason}</span></div><em>{x.priority}</em></div>)}{analysis!.management.map(x => <div key={x} style={s.planRow}><Check size={13} /><div><b>Clinical consideration</b><span style={s.small}>{x}</span></div></div>)}</div><details style={{ marginTop: 11 }}><summary style={{ cursor: "pointer", fontSize: 9, fontWeight: 700 }}>Lihat SOAP draft</summary><div style={{ marginTop: 8, display: "grid", gap: 7 }}>{([ ["S", analysis!.soap.subjective],["O", analysis!.soap.objective],["A", analysis!.soap.assessment],["P", analysis!.soap.plan] ] as const).map(([k,v]) => <div key={k} style={{ display: "flex", gap: 8 }}><b style={s.soapKey}>{k}</b><span style={s.small}>{v}</span></div>)}</div></details><div style={s.actions}><button type="button" onClick={saveCase} disabled={saving} style={s.primary}>{saving ? "Menyimpan…" : "Simpan Encounter"}<Save size={13} /></button></div></>}
        </section>
      </div>
    </main>
  );
}

function Metric({ value, label }: { value: string; label: string }) { return <div style={s.metric}><b>{value}</b><span>{label}</span></div>; }

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f5f8fc", color: "#16213d", fontFamily: "Inter, Arial, sans-serif" },
  header: { height: 64, background: "#fff", borderBottom: "1px solid #e5eaf2", display: "flex", alignItems: "center", padding: "0 26px", gap: 15 },
  back: { display: "flex", alignItems: "center", gap: 6, color: "#65728a", textDecoration: "none", fontSize: 10 },
  brand: { display: "flex", alignItems: "center", gap: 9 }, logo: { width: 34, height: 34, borderRadius: 11, display: "grid", placeItems: "center", background: "#eaf3ff", color: "#2563eb" }, brandTitle: { display: "block", fontSize: 14, color: "#10295b" }, brandSub: { display: "block", fontSize: 8, color: "#8b96a8", marginTop: 2 },
  container: { maxWidth: 1180, margin: "0 auto", padding: "24px 22px 50px" }, titleRow: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 15 }, eyebrow: { fontSize: 8, fontWeight: 800, letterSpacing: ".12em", color: "#6a81a7" }, h1: { margin: 0, fontSize: 27, color: "#10295b", letterSpacing: "-.03em" }, h2: { margin: "3px 0 0", fontSize: 14, color: "#10295b" }, muted: { margin: "7px 0 0", fontSize: 10, color: "#7b8799" }, small: { display: "block", marginTop: 4, fontSize: 8, color: "#8792a4", lineHeight: 1.45 }, card: { background: "#fff", border: "1px solid #e1e7f0", borderRadius: 14, padding: 14, marginBottom: 12 }, cardHead: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 10 }, notice: { background: "#eef5ff", border: "1px solid #d7e5ff", color: "#315b9f", borderRadius: 9, padding: "9px 11px", display: "flex", alignItems: "center", gap: 7, fontSize: 9, marginBottom: 12 }, link: { border: 0, background: "transparent", color: "inherit", cursor: "pointer", fontSize: 9 }, secondary: { border: "1px solid #dce3ee", background: "#fff", color: "#617089", borderRadius: 8, padding: "8px 10px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 8, fontWeight: 700, cursor: "pointer" }, primary: { border: "1px solid #2563eb", background: "linear-gradient(135deg,#2563eb,#1f58d5)", color: "#fff", borderRadius: 8, padding: "8px 10px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 8, fontWeight: 700, cursor: "pointer" }, label: { display: "block", fontSize: 8, fontWeight: 700, color: "#69768b" }, input: { width: "100%", boxSizing: "border-box", marginTop: 5, border: "1px solid #dce3ee", borderRadius: 7, padding: "8px 9px", background: "#fff", color: "#1f3155", fontSize: 9, outline: 0 }, patientGrid: { display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1fr", gap: 8 }, actions: { display: "flex", justifyContent: "flex-end", gap: 7, marginTop: 11 }, draft: { background: "#f2f5f9", color: "#7c8799", padding: "5px 7px", borderRadius: 6, fontSize: 8, fontWeight: 700 }, good: { background: "#eaf9f4", color: "#16816c", padding: "5px 7px", borderRadius: 6, fontSize: 8, fontWeight: 700 }, chip: { background: "#eef4ff", color: "#506b9a", borderRadius: 5, padding: "5px 7px", fontSize: 7, fontWeight: 700 }, chipAmber: { background: "#fff7e7", color: "#a96e11", borderRadius: 5, padding: "5px 7px", fontSize: 7, fontWeight: 700 }, textarea: { width: "100%", minHeight: 110, boxSizing: "border-box", border: 0, outline: 0, resize: "vertical", background: "#f8fafc", borderRadius: 9, padding: 11, fontSize: 10, lineHeight: 1.6 }, tags: { display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }, tag: { background: "#eef9f6", color: "#1a7f6d", padding: "4px 6px", borderRadius: 5, fontSize: 7, display: "inline-flex", alignItems: "center", gap: 3 }, example: { border: "1px solid #dce3ee", background: "#fff", borderRadius: 7, padding: "6px 8px", fontSize: 8, color: "#647188", cursor: "pointer" }, analysisLaunch: { marginTop: 11, padding: 10, border: "1px solid #dce6f5", borderRadius: 9, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }, question: { borderTop: "1px solid #edf0f4", padding: "10px 0", display: "grid", gap: 7 }, answerRow: { display: "flex", gap: 5, flexWrap: "wrap" }, answer: { border: "1px solid #dce3ee", background: "#fff", color: "#617089", borderRadius: 7, padding: "6px 8px", fontSize: 8, cursor: "pointer" }, answerActive: { background: "#eef4ff", borderColor: "#9dbcf4", color: "#255dcc", fontWeight: 700 }, vitals: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 7 }, unit: { position: "absolute", right: 7, top: 9, fontSize: 7, color: "#9aa4b4" }, warning: { marginTop: 9, background: "#fff8ec", color: "#996919", borderRadius: 8, padding: 9, fontSize: 8, display: "flex", alignItems: "center", gap: 7, lineHeight: 1.45 }, empty: { minHeight: 62, border: "1px dashed #dfe6ef", borderRadius: 9, padding: 11, display: "flex", alignItems: "center", gap: 8, color: "#8490a3", fontSize: 9 }, metrics: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7, marginBottom: 9 }, metric: { background: "#f8fafc", border: "1px solid #eef1f5", borderRadius: 8, padding: 9 }, inputProof: { background: "#f8fbff", border: "1px solid #dce7f7", borderRadius: 8, padding: 9, marginBottom: 8, fontSize: 9 }, dx: { width: "100%", display: "flex", alignItems: "center", gap: 8, border: "1px solid", borderRadius: 9, padding: 9, marginTop: 6, cursor: "pointer" }, rank: { width: 21, height: 21, borderRadius: "50%", background: "#eff3f8", color: "#6d7a91", display: "grid", placeItems: "center", fontSize: 8, fontWeight: 800, flex: "0 0 auto" }, level: { fontStyle: "normal", fontSize: 8, color: "#22826f" }, dxBox: { marginTop: 10, border: "1px solid #d9e3f3", background: "#f9fbff", borderRadius: 9, padding: 10 }, planList: { display: "grid", gap: 5 }, planRow: { display: "flex", alignItems: "flex-start", gap: 7, padding: "8px 0", borderTop: "1px solid #edf0f4", fontSize: 8, color: "#1b6f60" }, soapKey: { width: 20, height: 20, borderRadius: 5, background: "#eef4ff", color: "#3364c4", display: "grid", placeItems: "center", fontSize: 8 }, savedRow: { display: "flex", alignItems: "center", gap: 9, borderTop: "1px solid #edf0f4", padding: "8px 0" }, avatar: { width: 31, height: 31, borderRadius: 9, background: "#eff5ff", color: "#2d61b4", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 800 }, danger: { border: "1px solid #f0d2d2", background: "#fff", color: "#bf4d4d", borderRadius: 7, padding: "7px 8px", cursor: "pointer" }
};
