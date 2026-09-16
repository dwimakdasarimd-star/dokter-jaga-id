"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, FileText, HeartPulse, Info, Loader2, Save, Search, ShieldCheck, Stethoscope, Trash2 } from "lucide-react";
import { listClinicalEncounters, loadClinicalEncounter, saveClinicalEncounter, deleteClinicalEncounter, type ClinicalEncounter } from "../../lib/clinical-storage";
import { runClinicalEngine, type ClinicalEngineResult, type QuestionAnswer, type Vitals } from "../../lib/clinical-engine";

type Patient = { name: string; medicalRecordNumber: string; birthDate: string; sex: "Laki-laki" | "Perempuan" | "" };
type Snapshot = { complaint: string; vitals: Vitals; answers: Record<string, QuestionAnswer> };

const emptyPatient: Patient = { name: "", medicalRecordNumber: "", birthDate: "", sex: "" };
const emptyVitals: Vitals = { bp: "", hr: "", rr: "", temp: "", spo2: "" };
const steps = ["Pasien", "Keluhan", "Anamnesis", "Pemeriksaan", "Analisis", "Rencana"];

export default function ClinicalWorkspace() {
  const [step, setStep] = useState(0);
  const [patient, setPatient] = useState<Patient>(emptyPatient);
  const [complaint, setComplaint] = useState("");
  const [vitals, setVitals] = useState<Vitals>({ ...emptyVitals });
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [analysis, setAnalysis] = useState<ClinicalEngineResult | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [selectedDx, setSelectedDx] = useState("");
  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [savedCases, setSavedCases] = useState<ClinicalEncounter[]>([]);
  const [savedAt, setSavedAt] = useState("");
  const [notice, setNotice] = useState("");
  const [showCases, setShowCases] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setSavedCases(listClinicalEncounters()); }, []);

  const preview = useMemo(() => runClinicalEngine({ complaint, vitals, questionAnswers: answers }), [complaint, vitals, answers]);
  const stale = Boolean(analysis && snapshot && JSON.stringify({ complaint: complaint.trim(), vitals, answers }) !== JSON.stringify(snapshot));
  const selected = analysis?.differentials.find((d) => d.name === selectedDx) ?? analysis?.differentials[0];
  const patientReady = Boolean(patient.name.trim() || patient.medicalRecordNumber.trim());

  const runAnalysis = () => {
    if (!patientReady) { setNotice("Isi nama pasien atau nomor rekam medis terlebih dahulu."); setStep(0); return; }
    if (!complaint.trim()) { setNotice("Keluhan pasien belum diisi."); setStep(1); return; }
    const next: Snapshot = { complaint: complaint.trim(), vitals: { ...vitals }, answers: { ...answers } };
    const result = runClinicalEngine(next);
    setSnapshot(next);
    setAnalysis(result);
    setSelectedDx(result.differentials[0]?.name ?? "");
    setSavedAt("");
    setStep(4);
    setNotice(`Analisis selesai: ${result.differentials.length} pertimbangan klinis.`);
  };

  const saveCase = () => {
    if (!patientReady) { setNotice("Isi nama pasien atau nomor rekam medis sebelum menyimpan."); setStep(0); return; }
    if (!complaint.trim()) { setNotice("Keluhan pasien belum diisi."); setStep(1); return; }
    setSaving(true);
    const result = saveClinicalEncounter({
      patientId: encounterId ? savedCases.find((x) => x.id === encounterId)?.patientId : undefined,
      patient: { id: "", name: patient.name.trim(), medicalRecordNumber: patient.medicalRecordNumber.trim(), birthDate: patient.birthDate, sex: patient.sex, createdAt: "", updatedAt: "" },
      complaint: complaint.trim(),
      vitals: { ...vitals },
      answers: { ...answers },
      selectedDx: selected?.name ?? selectedDx,
      analysisSnapshot: snapshot,
      reviewed: true,
    });
    setEncounterId(result.id);
    setSavedAt(result.updatedAt);
    setSavedCases(listClinicalEncounters());
    setSaving(false);
    setNotice("Encounter berhasil disimpan di browser ini.");
    setShowCases(true);
  };

  const loadCase = (id: string) => {
    const result = loadClinicalEncounter(id);
    if (!result) return;
    setEncounterId(result.id);
    setPatient({ name: result.patient.name, medicalRecordNumber: result.patient.medicalRecordNumber, birthDate: result.patient.birthDate, sex: result.patient.sex });
    setComplaint(result.complaint);
    setVitals(result.vitals);
    setAnswers(result.answers);
    setSelectedDx(result.selectedDx);
    setSnapshot(result.analysisSnapshot);
    setAnalysis(result.analysisSnapshot ? runClinicalEngine(result.analysisSnapshot) : null);
    setSavedAt(result.updatedAt);
    setStep(result.analysisSnapshot ? 4 : 1);
    setShowCases(false);
    setNotice(`Encounter ${result.patient.name || result.patient.medicalRecordNumber} dimuat.`);
  };

  const newCase = () => {
    setStep(0); setPatient({ ...emptyPatient }); setComplaint(""); setVitals({ ...emptyVitals }); setAnswers({}); setAnalysis(null); setSnapshot(null); setSelectedDx(""); setEncounterId(null); setSavedAt(""); setNotice("Kasus baru siap diisi.");
  };

  const removeCase = (id: string) => {
    deleteClinicalEncounter(id);
    setSavedCases(listClinicalEncounters());
    if (id === encounterId) newCase();
    setNotice("Encounter dihapus.");
  };

  return <main style={styles.page}>
    <header style={styles.header}>
      <a href="/" style={styles.back}><ArrowLeft size={15}/> Dashboard</a>
      <div style={styles.brand}><div style={styles.logo}><HeartPulse size={18}/></div><div><b style={styles.brandTitle}>Dokter Jaga</b><span style={styles.brandSub}>Clinical Assistant</span></div></div>
      <span style={{ marginLeft: "auto", fontSize: 9, color: savedAt ? "#16816c" : "#78859a" }}>{savedAt ? "● Encounter tersimpan" : "● Draft"}</span>
    </header>

    <div style={styles.container}>
      <div style={styles.titleRow}><div><div style={styles.eyebrow}>CLINICAL WORKSPACE</div><h1 style={styles.h1}>Clinical Encounter</h1><p style={styles.muted}>Data pasien → keluhan → anamnesis → pemeriksaan → analisis → rencana.</p></div><button type="button" onClick={() => setShowCases((v) => !v)} style={styles.secondary}><Search size={13}/> {savedCases.length} kasus tersimpan</button></div>

      {notice && <div style={styles.notice}><Info size={14}/><span style={{ flex: 1 }}>{notice}</span><button type="button" onClick={() => setNotice("")} style={styles.linkButton}>Tutup</button></div>}

      {showCases && <section style={styles.card}><div style={styles.cardHead}><div><div style={styles.eyebrow}>STORED ENCOUNTERS</div><h2 style={styles.h2}>Kasus tersimpan</h2></div><button type="button" onClick={() => setShowCases(false)} style={styles.linkButton}>Tutup</button></div>{savedCases.length === 0 ? <div style={styles.empty}>Belum ada kasus. Klik Simpan Encounter setelah mengisi data.</div> : savedCases.map((x) => <div key={x.id} style={styles.savedRow}><div style={styles.avatar}>{(x.patient.name || "PS").slice(0,2).toUpperCase()}</div><div style={{ flex: 1 }}><b style={{ display: "block", fontSize: 10 }}>{x.patient.name || "Tanpa nama"}</b><span style={styles.small}>{x.patient.medicalRecordNumber || "No. RM —"} · {new Date(x.updatedAt).toLocaleString("id-ID")}</span></div><button type="button" onClick={() => loadCase(x.id)} style={styles.secondary}>Buka</button><button type="button" onClick={() => removeCase(x.id)} style={styles.danger} title="Hapus"><Trash2 size={13}/></button></div>)}</section>}

      <section style={styles.card}>
        <div style={styles.cardHead}><div><div style={styles.eyebrow}>PATIENT RECORD</div><h2 style={styles.h2}>Data Pasien</h2><span style={styles.small}>Minimal isi nama pasien atau nomor rekam medis.</span></div><span style={savedAt ? styles.statusGood : styles.statusDraft}>{savedAt ? "Tersimpan" : "Draft"}</span></div>
        <div style={styles.patientGrid}>
          <label style={styles.label}>Nama pasien<input value={patient.name} onChange={(e) => setPatient({ ...patient, name: e.target.value })} placeholder="Nama lengkap" style={styles.input}/></label>
          <label style={styles.label}>No. rekam medis<input value={patient.medicalRecordNumber} onChange={(e) => setPatient({ ...patient, medicalRecordNumber: e.target.value })} placeholder="No. RM" style={styles.input}/></label>
          <label style={styles.label}>Tanggal lahir<input type="date" value={patient.birthDate} onChange={(e) => setPatient({ ...patient, birthDate: e.target.value })} style={styles.input}/></label>
          <label style={styles.label}>Jenis kelamin<select value={patient.sex} onChange={(e) => setPatient({ ...patient, sex: e.target.value as Patient["sex"] })} style={styles.input}><option value="">Pilih</option><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></label>
        </div>
        <div style={styles.actions}><button type="button" onClick={newCase} style={styles.secondary}><FileText size={13}/> Kasus Baru</button><button type="button" onClick={saveCase} disabled={saving} style={styles.primary}>{saving ? <Loader2 size={13}/> : <Save size={13}/>} {saving ? "Menyimpan…" : "Simpan Encounter"}</button></div>
      </section>

      <nav style={styles.steps}>{steps.map((x, i) => <button type="button" key={x} onClick={() => setStep(i)} style={{ ...styles.step, color: i === step ? "#2563eb" : i < step ? "#15957e" : "#9aa5b6" }}><span style={{ ...styles.stepCircle, background: i === step ? "#2563eb" : i < step ? "#eaf9f4" : "#fff", color: i === step ? "#fff" : i < step ? "#15957e" : "#98a3b4", borderColor: i === step ? "#2563eb" : i < step ? "#a9e5d8" : "#dce2eb" }}>{i < step ? <Check size={11}/> : i + 1}</span>{x}</button>)}</nav>

      <div style={styles.grid}>
        <div>
          <section style={styles.card}>
            <div style={styles.cardHead}><div><div style={styles.eyebrow}>STEP 01 · KELUHAN</div><h2 style={styles.h2}>Keluhan & gambaran awal</h2><span style={styles.small}>Masukkan keluhan dalam bahasa bebas.</span></div><span style={styles.chip}>{preview.engineVersion}</span></div>
            <textarea value={complaint} onChange={(e) => { setComplaint(e.target.value); setSavedAt(""); }} placeholder="Contoh: demam sejak 3 hari, sakit kepala, nyeri badan, mual…" style={styles.textarea}/>
            <div style={styles.tags}>{preview.extracted.length ? preview.extracted.map((x) => <span key={x} style={styles.tag}>{x}</span>) : <span style={styles.small}>Belum ada temuan terstruktur.</span>}</div>
            <div style={styles.actions}><button type="button" onClick={runAnalysis} style={styles.primary}><Stethoscope size={14}/> Jalankan Analisis <ArrowRight size={14}/></button></div>
          </section>

          <section style={styles.card}>
            <div style={styles.cardHead}><div><div style={styles.eyebrow}>STEP 02 · ANAMNESIS</div><h2 style={styles.h2}>Anamnesis terarah</h2><span style={styles.small}>Pertanyaan mengikuti gejala yang terdeteksi.</span></div><span style={styles.chipAmber}>{preview.questions.length} aktif</span></div>
            {!preview.questions.length ? <div style={styles.empty}>Isi keluhan untuk memunculkan pertanyaan klinis.</div> : preview.questions.map((q) => <div key={q.id} style={styles.question}><div><b style={{ fontSize: 10 }}>{q.text}</b><span style={styles.small}>{q.whyItMatters}</span></div><div style={styles.answerRow}>{(["yes", "no", "unknown"] as QuestionAnswer[]).map((a) => <button type="button" key={a} onClick={() => { setAnswers({ ...answers, [q.id]: a }); setSavedAt(""); }} style={{ ...styles.answer, background: answers[q.id] === a ? "#edf4ff" : "#fff", borderColor: answers[q.id] === a ? "#9dbbf5" : "#dce3ee" }}>{a === "yes" ? "Ya" : a === "no" ? "Tidak" : "Belum tahu"}</button>)}</div></div>)}
          </section>

          <section style={styles.card}>
            <div style={styles.cardHead}><div><div style={styles.eyebrow}>STEP 03 · PEMERIKSAAN</div><h2 style={styles.h2}>Tanda vital</h2></div></div>
            <div style={styles.vitals}>{([ ["bp","TD","mmHg"], ["hr","Nadi","/menit"], ["rr","RR","/menit"], ["temp","Suhu","°C"], ["spo2","SpO₂","%"] ] as const).map(([key, name, unit]) => <label key={key} style={styles.label}>{name}<div style={{ position: "relative" }}><input value={vitals[key] || ""} onChange={(e) => { setVitals({ ...vitals, [key]: e.target.value }); setSavedAt(""); }} placeholder="—" inputMode="decimal" style={{ ...styles.input, paddingRight: 38 }}/><span style={styles.unit}>{unit}</span></div></label>)}</div>
            <div style={styles.warning}><AlertTriangle size={14}/> Kolom kosong diperlakukan sebagai data belum tersedia.</div>
            <div style={styles.actions}><button type="button" onClick={runAnalysis} style={styles.primary}>{analysis ? "Analisis Ulang" : "Jalankan Analisis"}<ArrowRight size={13}/></button></div>
          </section>

          <section style={styles.card}>
            <div style={styles.cardHead}><div><div style={styles.eyebrow}>STEP 04 · CLINICAL REASONING</div><h2 style={styles.h2}>Analisis kasus</h2><span style={styles.small}>Hasil dibuat dari snapshot ketika tombol analisis ditekan.</span></div><span style={analysis ? styles.statusGood : styles.statusDraft}>{analysis ? "Analisis tersedia" : "Belum dianalisis"}</span></div>
            {!analysis ? <div style={styles.empty}><Stethoscope size={20}/><div><b>Belum ada hasil analisis</b><span style={styles.small}>Isi pasien dan keluhan, lalu klik Jalankan Analisis.</span></div></div> : <>
              {stale && <div style={styles.warning}><AlertTriangle size={14}/><span style={{ flex: 1 }}>Data berubah sejak analisis terakhir.</span><button type="button" onClick={runAnalysis} style={styles.primarySmall}>Analisis ulang</button></div>}
              <div style={styles.metrics}><Metric value={String(analysis.differentials.length)} label="Differential"/><Metric value={String(analysis.missing.length)} label="Data kurang"/><Metric value={String(analysis.redFlags.length)} label="Safety flags"/></div>
              {analysis.differentials.map((d, i) => <button key={d.name} type="button" onClick={() => setSelectedDx(d.name)} style={{ ...styles.dx, borderColor: selected?.name === d.name ? "#9fbcfb" : "#e2e8f0", background: selected?.name === d.name ? "#f8fbff" : "#fff" }}><span style={styles.rank}>{i + 1}</span><span style={{ flex: 1, textAlign: "left" }}><b style={{ display: "block", fontSize: 10 }}>{d.name}</b><span style={styles.small}>{d.reason}</span><small style={{ display: "block", color: "#71809a", marginTop: 4 }}>{d.tags.join(" · ")}</small></span><em style={{ fontStyle: "normal", fontSize: 8, color: "#22826f" }}>{d.level}</em><ArrowRight size={13}/></button>)}
              <div style={styles.dxBox}><div style={styles.eyebrow}>DIAGNOSIS KERJA</div><select value={selected?.name || ""} onChange={(e) => setSelectedDx(e.target.value)} style={styles.input}>{analysis.differentials.map((d) => <option key={d.name}>{d.name}</option>)}</select></div>
              <div style={styles.warning}><AlertTriangle size={14}/><span>{analysis.disposition.title} — {analysis.disposition.reason}</span></div>
              <div style={styles.actions}><button type="button" onClick={() => setStep(5)} style={styles.primary}>Lanjut ke Rencana <ArrowRight size={13}/></button></div>
            </>}
          </section>

          <section style={styles.card}>
            <div style={styles.cardHead}><div><div style={styles.eyebrow}>STEP 05 · RENCANA</div><h2 style={styles.h2}>Clinical plan & SOAP</h2></div></div>
            {!analysis ? <div style={styles.empty}>Jalankan analisis terlebih dahulu.</div> : <><div style={styles.planList}>{analysis.investigations.map((x) => <div key={x.name} style={styles.planRow}><Check size={13}/><div style={{ flex: 1 }}><b>{x.name}</b><span style={styles.small}>{x.reason}</span></div><em>{x.priority}</em></div>)}{analysis.management.map((x) => <div key={x} style={styles.planRow}><ShieldCheck size={13}/><div style={{ flex: 1 }}><b>Clinical consideration</b><span style={styles.small}>{x}</span></div></div>)}</div><details style={{ marginTop: 12 }}><summary style={{ cursor: "pointer", fontSize: 9, fontWeight: 700 }}>Lihat SOAP draft</summary><div style={{ marginTop: 8, display: "grid", gap: 7 }}>{([ ["S", analysis.soap.subjective], ["O", analysis.soap.objective], ["A", analysis.soap.assessment], ["P", analysis.soap.plan] ] as const).map(([k,v]) => <div key={k} style={{ display: "flex", gap: 8 }}><b style={styles.soapKey}>{k}</b><span style={styles.small}>{v}</span></div>)}</div></details><div style={styles.actions}><button type="button" onClick={saveCase} disabled={saving} style={styles.primary}>{saving ? "Menyimpan…" : "Review & Simpan Encounter"}<Save size={13}/></button></div></>}
          </section>
        </div>

        <aside>
          <section style={{ ...styles.card, position: "sticky", top: 12 }}><div style={styles.eyebrow}>CASE SUMMARY</div><h2 style={styles.h2}>{patient.name || "Pasien baru"}</h2><span style={styles.small}>{patient.medicalRecordNumber || "No. RM belum diisi"}</span><SummaryRow label="Keluhan" value={complaint ? "Terisi" : "Belum"}/><SummaryRow label="Anamnesis" value={`${Object.keys(answers).length} jawaban`}/><SummaryRow label="Tanda vital" value={`${Object.values(vitals).filter(Boolean).length}/5`}/><SummaryRow label="Analisis" value={analysis ? "Tersedia" : "Belum"}/><SummaryRow label="Diagnosis kerja" value={selected?.name || "Belum dipilih"}/></section>
          <div style={styles.doctorNote}><ShieldCheck size={14}/><span><b>Doctor-in-the-loop</b><br/>Sistem menyusun pertimbangan. Keputusan klinis tetap direview dokter.</span></div>
        </aside>
      </div>
    </div>
  </main>;
}

function Metric({ value, label }: { value: string; label: string }) { return <div style={styles.metric}><b>{value}</b><span>{label}</span></div>; }
function SummaryRow({ label, value }: { label: string; value: string }) { return <div style={styles.summaryRow}><span>{label}</span><b>{value}</b></div>; }

const styles: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "#f5f8fc", color: "#16213d", fontFamily: "Inter,Arial,sans-serif" },
  header: { height: 64, background: "#fff", borderBottom: "1px solid #e5eaf2", display: "flex", alignItems: "center", padding: "0 26px", gap: 15 },
  back: { display: "flex", alignItems: "center", gap: 6, color: "#65728a", textDecoration: "none", fontSize: 10 },
  brand: { display: "flex", alignItems: "center", gap: 9 }, logo: { width: 34, height: 34, borderRadius: 11, display: "grid", placeItems: "center", background: "#eaf3ff", color: "#2563eb" }, brandTitle: { display: "block", fontSize: 14, color: "#10295b" }, brandSub: { display: "block", fontSize: 8, color: "#8b96a8", marginTop: 2 },
  container: { maxWidth: 1180, margin: "0 auto", padding: "24px 22px 50px" }, titleRow: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 15 }, eyebrow: { fontSize: 8, fontWeight: 800, letterSpacing: ".12em", color: "#6a81a7" }, h1: { margin: 0, fontSize: 27, color: "#10295b", letterSpacing: "-.03em" }, h2: { margin: "3px 0 0", fontSize: 14, color: "#10295b" }, muted: { margin: "7px 0 0", fontSize: 10, color: "#7b8799", lineHeight: 1.5 }, small: { display: "block", marginTop: 4, fontSize: 8, color: "#8792a4", lineHeight: 1.45 }, card: { background: "#fff", border: "1px solid #e1e7f0", borderRadius: 14, padding: 14, marginBottom: 12 }, cardHead: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 11 }, notice: { background: "#eef5ff", border: "1px solid #d7e5ff", color: "#315b9f", borderRadius: 9, padding: "9px 11px", display: "flex", gap: 7, alignItems: "center", fontSize: 9, marginBottom: 12 }, linkButton: { border: 0, background: "transparent", color: "#516a92", cursor: "pointer", fontSize: 9 }, savedRow: { display: "flex", alignItems: "center", gap: 9, borderTop: "1px solid #edf0f4", padding: "8px 0" }, avatar: { width: 31, height: 31, borderRadius: 9, background: "#eff5ff", color: "#2d61b4", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 800 }, danger: { border: "1px solid #f0d2d2", background: "#fff", color: "#bf4d4d", borderRadius: 7, padding: "7px 8px", cursor: "pointer" }, statusGood: { background: "#eaf9f4", color: "#16816c", padding: "5px 7px", borderRadius: 6, fontSize: 8, fontWeight: 700 }, statusDraft: { background: "#f2f5f9", color: "#7c8799", padding: "5px 7px", borderRadius: 6, fontSize: 8, fontWeight: 700 }, chip: { background: "#eef4ff", color: "#506b9a", borderRadius: 5, padding: "5px 7px", fontSize: 7, fontWeight: 700 }, chipAmber: { background: "#fff7e7", color: "#a96e11", borderRadius: 5, padding: "5px 7px", fontSize: 7, fontWeight: 700 }, patientGrid: { display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1fr", gap: 8 }, label: { display: "block", fontSize: 8, fontWeight: 700, color: "#69768b" }, input: { width: "100%", boxSizing: "border-box", marginTop: 5, border: "1px solid #dce3ee", borderRadius: 7, padding: "8px 9px", background: "#fff", color: "#1f3155", fontSize: 9, outline: 0 }, textarea: { width: "100%", minHeight: 108, boxSizing: "border-box", resize: "vertical", border: 0, outline: 0, background: "#f8fafc", borderRadius: 9, padding: 11, fontSize: 10, lineHeight: 1.6 }, actions: { display: "flex", justifyContent: "flex-end", gap: 7, marginTop: 11 }, primary: { border: "1px solid #2563eb", background: "linear-gradient(135deg,#2563eb,#1f58d5)", color: "#fff", borderRadius: 8, padding: "8px 10px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 8, fontWeight: 700, cursor: "pointer" }, primarySmall: { border: 0, background: "#a36f18", color: "#fff", borderRadius: 6, padding: "5px 7px", fontSize: 7 }, secondary: { border: "1px solid #dce3ee", background: "#fff", color: "#617089", borderRadius: 8, padding: "8px 10px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 8, fontWeight: 700, cursor: "pointer" }, steps: { display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 3, marginBottom: 13 }, step: { border: 0, background: "transparent", cursor: "pointer", fontSize: 8, padding: "7px 3px", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontWeight: 600 }, stepCircle: { width: 20, height: 20, borderRadius: "50%", border: "1px solid", display: "grid", placeItems: "center" }, grid: { display: "grid", gridTemplateColumns: "minmax(0,1.75fr) minmax(270px,.75fr)", gap: 13 }, tags: { display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }, tag: { background: "#eef4ff", color: "#4c6798", padding: "4px 6px", borderRadius: 5, fontSize: 7 }, question: { borderTop: "1px solid #edf0f4", padding: "10px 0", display: "grid", gap: 7 }, answerRow: { display: "flex", gap: 5 }, answer: { border: "1px solid", borderRadius: 7, padding: "6px 8px", fontSize: 8, color: "#5f6e85", cursor: "pointer" }, vitals: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 7 }, unit: { position: "absolute", right: 7, top: 9, fontSize: 7, color: "#9aa4b4" }, warning: { marginTop: 9, background: "#fff8ec", color: "#996919", borderRadius: 8, padding: 9, fontSize: 8, display: "flex", alignItems: "center", gap: 7 }, empty: { minHeight: 62, border: "1px dashed #dfe6ef", borderRadius: 9, padding: 11, display: "flex", alignItems: "center", gap: 8, color: "#8490a3", fontSize: 9 }, metrics: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginBottom: 9 }, metric: { background: "#f8fafc", border: "1px solid #eef1f5", borderRadius: 8, padding: 9 }, metricValue: { fontSize: 16 }, dx: { width: "100%", display: "flex", alignItems: "center", gap: 8, textAlign: "left", border: "1px solid", borderRadius: 9, padding: 9, marginTop: 6, cursor: "pointer" }, rank: { width: 21, height: 21, borderRadius: "50%", background: "#eff3f8", color: "#6d7a91", display: "grid", placeItems: "center", fontSize: 8, fontWeight: 800, flex: "0 0 auto" }, dxBox: { marginTop: 10, border: "1px solid #d9e3f3", background: "#f9fbff", borderRadius: 9, padding: 10 }, planList: { display: "grid", gap: 5 }, planRow: { display: "flex", alignItems: "flex-start", gap: 7, padding: "8px 0", borderTop: "1px solid #edf0f4", fontSize: 8, color: "#1b6f60" }, soapKey: { width: 20, height: 20, borderRadius: 5, background: "#eef4ff", color: "#3364c4", display: "grid", placeItems: "center", fontSize: 8 }, summaryRow: { display: "flex", justifyContent: "space-between", gap: 8, padding: "7px 0", borderTop: "1px solid #edf0f4", fontSize: 8, color: "#8792a4" }, doctorNote: { background: "#eef9f6", border: "1px solid #ccebe2", color: "#227967", borderRadius: 10, padding: 10, fontSize: 8, display: "flex", gap: 7, lineHeight: 1.5 }
};
