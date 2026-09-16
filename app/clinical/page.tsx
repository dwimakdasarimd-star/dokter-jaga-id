"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  HeartPulse,
  Info,
  Loader2,
  Save,
  Search,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  listClinicalEncounters,
  loadClinicalEncounter,
  saveClinicalEncounter,
  deleteClinicalEncounter,
  type ClinicalEncounter,
} from "../../lib/clinical-storage";
import { runClinicalEngine, type ClinicalEngineResult, type QuestionAnswer, type Vitals } from "../../lib/clinical-engine";

const emptyVitals: Vitals = { bp: "", hr: "", rr: "", temp: "", spo2: "" };
const steps = ["Pasien", "Keluhan", "Anamnesis", "Pemeriksaan", "Analisis", "Rencana"];

type Snapshot = { complaint: string; vitals: Vitals; answers: Record<string, QuestionAnswer> };

type PatientDraft = {
  name: string;
  medicalRecordNumber: string;
  birthDate: string;
  sex: "Laki-laki" | "Perempuan" | "";
};

const emptyPatient: PatientDraft = { name: "", medicalRecordNumber: "", birthDate: "", sex: "" };

export default function ClinicalWorkspace() {
  const [step, setStep] = useState(0);
  const [patient, setPatient] = useState<PatientDraft>(emptyPatient);
  const [complaint, setComplaint] = useState("");
  const [vitals, setVitals] = useState<Vitals>({ ...emptyVitals });
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [analysis, setAnalysis] = useState<ClinicalEngineResult | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [selectedDx, setSelectedDx] = useState("");
  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState("");
  const [savedCases, setSavedCases] = useState<ClinicalEncounter[]>([]);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    setSavedCases(listClinicalEncounters());
  }, []);

  const preview = useMemo(() => runClinicalEngine({ complaint, vitals, questionAnswers: answers }), [complaint, vitals, answers]);
  const analysisStale = useMemo(() => {
    if (!analysis || !snapshot) return false;
    return JSON.stringify({ complaint: complaint.trim(), vitals, answers }) !== JSON.stringify(snapshot);
  }, [analysis, snapshot, complaint, vitals, answers]);
  const selected = analysis?.differentials.find((d) => d.name === selectedDx) ?? analysis?.differentials[0];
  const patientReady = Boolean(patient.name.trim() || patient.medicalRecordNumber.trim());

  function updatePatient(key: keyof PatientDraft, value: string) {
    setPatient((p) => ({ ...p, [key]: value } as PatientDraft));
    setSavedAt("");
  }

  function runAnalysis() {
    if (!patientReady) {
      setNotice("Isi nama pasien atau nomor rekam medis terlebih dahulu.");
      setStep(0);
      return;
    }
    if (!complaint.trim()) {
      setNotice("Keluhan pasien belum diisi.");
      setStep(1);
      return;
    }

    const nextSnapshot: Snapshot = {
      complaint: complaint.trim(),
      vitals: { ...vitals },
      answers: { ...answers },
    };
    const result = runClinicalEngine(nextSnapshot);
    setSnapshot(nextSnapshot);
    setAnalysis(result);
    setSelectedDx(result.differentials[0]?.name ?? "");
    setSavedAt("");
    setStep(4);
    setNotice(`Analisis selesai: ${result.differentials.length} pertimbangan klinis ditemukan.`);
  }

  function saveCase() {
    if (!patientReady) {
      setNotice("Isi nama pasien atau nomor rekam medis sebelum menyimpan.");
      setStep(0);
      return;
    }
    if (!complaint.trim()) {
      setNotice("Keluhan pasien belum diisi.");
      setStep(1);
      return;
    }

    setSaving(true);
    const result = saveClinicalEncounter({
      patientId: encounterId ? savedCases.find((x) => x.id === encounterId)?.patientId : undefined,
      patient: {
        id: "",
        name: patient.name.trim(),
        medicalRecordNumber: patient.medicalRecordNumber.trim(),
        birthDate: patient.birthDate,
        sex: patient.sex,
        createdAt: "",
        updatedAt: "",
      },
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
    setNotice("Encounter tersimpan. Data dapat dibuka kembali dari daftar kasus.");
    setShowSaved(true);
  }

  function loadCase(id: string) {
    const result = loadClinicalEncounter(id);
    if (!result) return;
    setEncounterId(result.id);
    setPatient({
      name: result.patient.name,
      medicalRecordNumber: result.patient.medicalRecordNumber,
      birthDate: result.patient.birthDate,
      sex: result.patient.sex,
    });
    setComplaint(result.complaint);
    setVitals(result.vitals);
    setAnswers(result.answers);
    setSelectedDx(result.selectedDx);
    setSnapshot(result.analysisSnapshot);
    setAnalysis(result.analysisSnapshot ? runClinicalEngine(result.analysisSnapshot) : null);
    setSavedAt(result.updatedAt);
    setStep(result.analysisSnapshot ? 4 : 1);
    setShowSaved(false);
    setNotice(`Encounter ${result.patient.name || result.patient.medicalRecordNumber} dimuat.`);
  }

  function newCase() {
    setStep(0);
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

  function removeCase(id: string) {
    deleteClinicalEncounter(id);
    const next = listClinicalEncounters();
    setSavedCases(next);
    if (encounterId === id) newCase();
    setNotice("Encounter dihapus dari penyimpanan browser.");
  }

  function answerQuestion(id: string, answer: QuestionAnswer) {
    setAnswers((prev) => ({ ...prev, [id]: answer }));
    setSavedAt("");
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f5f8fc", color: "#16213d", fontFamily: "Inter, Arial, sans-serif" }}>
      <header style={{ height: 66, background: "#fff", borderBottom: "1px solid #e5eaf2", display: "flex", alignItems: "center", padding: "0 28px", gap: 16 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 7, color: "#5c6a83", textDecoration: "none", fontSize: 11 }}><ArrowLeft size={15} /> Dashboard</a>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 11, background: "#e9f3ff", color: "#2563eb", display: "grid", placeItems: "center" }}><HeartPulse size={18} /></div>
          <div><b style={{ display: "block", fontSize: 14, color: "#10295b" }}>Dokter Jaga</b><span style={{ fontSize: 9, color: "#8793a7" }}>Clinical Assistant · Encounter</span></div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a" }} />
          <span style={{ fontSize: 10, color: "#657188" }}>{savedAt ? `Tersimpan ${new Date(savedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : "Draft"}</span>
        </div>
      </header>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 24px 48px" }}>
        <section style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start" }}>
          <div><div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: "#6880a8", marginBottom: 6 }}>CLINICAL WORKSPACE</div><h1 style={{ margin: 0, fontSize: 27, color: "#10295b", letterSpacing: "-.03em" }}>Clinical Encounter</h1><p style={{ margin: "7px 0 0", color: "#738097", fontSize: 11, lineHeight: 1.6 }}>Susun data pasien, jalankan clinical reasoning, lalu simpan encounter agar dapat dibuka kembali.</p></div>
          <button type="button" onClick={() => setShowSaved((v) => !v)} style={{ border: "1px solid #dce3ee", background: "#fff", borderRadius: 10, padding: "9px 12px", display: "flex", gap: 8, alignItems: "center", color: "#516079", cursor: "pointer", fontSize: 10 }}><Search size={14} /> {savedCases.length} Kasus tersimpan</button>
        </section>

        {notice && <div style={{ background: "#eef5ff", border: "1px solid #d7e5ff", color: "#315b9f", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, fontSize: 10, marginBottom: 14 }}><Info size={15} /><span style={{ flex: 1 }}>{notice}</span><button onClick={() => setNotice("")} style={{ border: 0, background: "transparent", color: "inherit", cursor: "pointer" }}>Tutup</button></div>}

        {showSaved && <section style={{ background: "#fff", border: "1px solid #e3e9f2", borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><b style={{ fontSize: 12 }}>Kasus tersimpan</b><button onClick={() => setShowSaved(false)} style={{ border: 0, background: "transparent", color: "#8793a7", cursor: "pointer" }}>Tutup</button></div>
          {!savedCases.length ? <p style={{ margin: 0, color: "#8793a7", fontSize: 10 }}>Belum ada encounter tersimpan di browser ini.</p> : savedCases.map((item) => <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: "1px solid #eef1f5" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#eff5ff", color: "#2f64bd", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 800 }}>{(item.patient.name || item.patient.medicalRecordNumber || "PS").slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1 }}><b style={{ display: "block", fontSize: 10 }}>{item.patient.name || "Tanpa nama"}</b><span style={{ fontSize: 8, color: "#8a95a7" }}>{item.patient.medicalRecordNumber || "No RM —"} · {new Date(item.updatedAt).toLocaleString("id-ID")}</span></div>
            <button onClick={() => loadCase(item.id)} style={{ border: "1px solid #dce3ee", background: "#fff", borderRadius: 7, padding: "7px 9px", fontSize: 9, cursor: "pointer" }}>Buka</button>
            <button onClick={() => removeCase(item.id)} style={{ border: "1px solid #f0d5d5", background: "#fff", color: "#c24d4d", borderRadius: 7, padding: "7px 9px", cursor: "pointer" }} title="Hapus"><Trash2 size={13} /></button>
          </div>)}
        </section>}

        <section style={{ background: "#fff", border: "1px solid #e1e7f0", borderRadius: 15, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 13 }}><div><div style={{ fontSize: 8, fontWeight: 800, letterSpacing: ".13em", color: "#6d81a5", marginBottom: 4 }}>PATIENT RECORD</div><h2 style={{ margin: 0, fontSize: 15, color: "#10295b" }}>Data Pasien</h2></div><span style={{ fontSize: 9, background: savedAt ? "#eaf9f4" : "#f2f5f9", color: savedAt ? "#16816c" : "#7c8799", borderRadius: 6, padding: "5px 7px", fontWeight: 700 }}>{savedAt ? "Tersimpan" : "Draft"}</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1fr", gap: 9 }}>
            <label style={labelStyle}>Nama pasien<input value={patient.name} onChange={(e) => updatePatient("name", e.target.value)} placeholder="Nama lengkap" style={inputStyle} /></label>
            <label style={labelStyle}>No. rekam medis<input value={patient.medicalRecordNumber} onChange={(e) => updatePatient("medicalRecordNumber", e.target.value)} placeholder="No. RM" style={inputStyle} /></label>
            <label style={labelStyle}>Tanggal lahir<input type="date" value={patient.birthDate} onChange={(e) => updatePatient("birthDate", e.target.value)} style={inputStyle} /></label>
            <label style={labelStyle}>Jenis kelamin<select value={patient.sex} onChange={(e) => updatePatient("sex", e.target.value as PatientDraft["sex"])} style={inputStyle}><option value="">Pilih</option><option>Laki-laki</option><option>Perempuan</option></select></label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}><button type="button" onClick={newCase} style={secondaryStyle}><FileText size={13} /> Kasus Baru</button><button type="button" onClick={saveCase} disabled={saving} style={primaryStyle}>{saving ? <><Loader2 size={13} /> Menyimpan…</> : <><Save size={13} /> Simpan Encounter</>}</button></div>
        </section>

        <nav style={{ display: "grid", gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: 4, margin: "0 3px 14px" }}>
          {steps.map((name, i) => <button key={name} type="button" onClick={() => setStep(i)} style={{ border: 0, background: "transparent", cursor: "pointer", color: i === step ? "#2563eb" : i < step ? "#0f9a83" : "#99a5b6", fontWeight: i === step ? 700 : 500, fontSize: 9, padding: "8px 4px" }}><span style={{ display: "inline-grid", placeItems: "center", width: 20, height: 20, borderRadius: "50%", marginRight: 5, border: `1px solid ${i === step ? "#2563eb" : i < step ? "#9fe2d3" : "#dce2ea"}`, background: i === step ? "#2563eb" : i < step ? "#eafaf6" : "#fff", color: i === step ? "#fff" : i < step ? "#0f9a83" : "#98a3b4" }}>{i < step ? <Check size={11} /> : i + 1}</span>{name}</button>)}
        </nav>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.7fr) minmax(280px, .8fr)", gap: 14 }}>
          <div>
            <section style={cardStyle}>
              <div style={sectionHead}><div><div style={eyebrow}>STEP 01 · KELUHAN</div><h3 style={h3}>Keluhan & gambaran awal</h3><span style={sub}>Tulis bebas dengan bahasa klinis. Sistem akan mengekstrak gejala yang dikenali.</span></div><span style={chipStyle}>{preview.engineVersion}</span></div>
              <textarea value={complaint} onChange={(e) => { setComplaint(e.target.value); setSavedAt(""); }} placeholder="Contoh: laki-laki 58 tahun, nyeri dada sejak 2 jam, menjalar ke lengan kiri, keringat dingin..." style={{ width: "100%", minHeight: 108, resize: "vertical", border: 0, outline: 0, borderRadius: 10, background: "#f8fafc", padding: 12, fontSize: 11, lineHeight: 1.6, boxSizing: "border-box" }} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 9 }}>{preview.extracted.length ? preview.extracted.map((x) => <span key={x} style={{ background: "#eef4ff", color: "#3c619b", borderRadius: 5, padding: "4px 6px", fontSize: 8 }}>{x}</span>) : <span style={{ color: "#98a2b1", fontSize: 9 }}>Belum ada temuan terstruktur</span>}</div>
              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}><button type="button" onClick={runAnalysis} style={primaryStyle}><Stethoscope size={14} /> Jalankan Analisis</button></div>
            </section>

            <section style={cardStyle}>
              <div style={sectionHead}><div><div style={eyebrow}>STEP 02 · ANAMNESIS</div><h3 style={h3}>Pertanyaan terarah</h3><span style={sub}>Pertanyaan muncul mengikuti gejala yang terdeteksi. Pilih Ya, Tidak, atau Belum tahu.</span></div><span style={{ ...chipStyle, background: "#fff7e6", color: "#ad7110" }}>{preview.questions.length} aktif</span></div>
              {!preview.questions.length ? <div style={emptyStyle}>Masukkan keluhan terlebih dahulu untuk memunculkan anamnesis terarah.</div> : preview.questions.map((q) => <div key={q.id} style={{ borderTop: "1px solid #edf0f4", padding: "11px 0" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><div><b style={{ display: "block", fontSize: 10 }}>{q.text}</b><span style={{ display: "block", marginTop: 4, color: "#8792a4", fontSize: 8, lineHeight: 1.45 }}>{q.whyItMatters}</span></div><span style={{ height: "fit-content", fontSize: 7, padding: "3px 5px", borderRadius: 4, background: q.category === "safety" ? "#fff2f2" : q.category === "disposition" ? "#fff8e9" : "#f0f5ff", color: q.category === "safety" ? "#c45555" : q.category === "disposition" ? "#a16d17" : "#5474a8" }}>{q.category}</span></div><div style={{ display: "flex", gap: 6, marginTop: 8 }}>{(["yes", "no", "unknown"] as QuestionAnswer[]).map((a) => <button key={a} type="button" onClick={() => answerQuestion(q.id, a)} style={{ border: "1px solid #dce3ee", borderRadius: 7, padding: "6px 9px", background: answers[q.id] === a ? (a === "yes" ? "#eaf9f4" : "#eef4ff") : "#fff", color: answers[q.id] === a ? "#236aa0" : "#69768d", fontSize: 8, cursor: "pointer" }}>{a === "yes" ? "Ya" : a === "no" ? "Tidak" : "Belum tahu"}</button>)}</div></div>)}
              <div style={{ display: "flex", justifyContent: "flex-end" }}><button type="button" onClick={() => setStep(3)} style={secondaryStyle}>Lanjut ke pemeriksaan <ArrowRight size={13} /></button></div>
            </section>

            <section style={cardStyle}>
              <div style={sectionHead}><div><div style={eyebrow}>STEP 03 · PEMERIKSAAN</div><h3 style={h3}>Tanda vital</h3><span style={sub}>Masukkan nilai yang tersedia. Data kosong tetap dianggap belum tersedia.</span></div></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>{([["bp", "TD", "mmHg"], ["hr", "Nadi", "/menit"], ["rr", "RR", "/menit"], ["temp", "Suhu", "°C"], ["spo2", "SpO₂", "%"]] as const).map(([key, name, unit]) => <label key={key} style={labelStyle}>{name}<div style={{ position: "relative" }}><input value={vitals[key] ?? ""} onChange={(e) => { setVitals((v) => ({ ...v, [key]: e.target.value })); setSavedAt(""); }} inputMode="decimal" placeholder="—" style={{ ...inputStyle, paddingRight: 46 }} /><span style={{ position: "absolute", right: 8, top: 9, color: "#9aa4b4", fontSize: 7 }}>{unit}</span></div></label>)}</div>
              <div style={{ marginTop: 10, background: "#fff8ec", color: "#996919", borderRadius: 8, padding: 9, fontSize: 8, display: "flex", gap: 7 }}><AlertTriangle size={14} /><span>Jangan menganggap kolom kosong sebagai normal. Review kembali data sebelum mengambil keputusan klinis.</span></div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}><button type="button" onClick={() => setStep(1)} style={secondaryStyle}>Kembali</button><button type="button" onClick={runAnalysis} style={primaryStyle}>{analysis ? "Analisis Ulang" : "Jalankan Analisis"}<ArrowRight size={13} /></button></div>
            </section>

            <section style={cardStyle}>
              <div style={sectionHead}><div><div style={eyebrow}>STEP 04 · CLINICAL REASONING</div><h3 style={h3}>Analisis kasus</h3><span style={sub}>{analysis ? "Hasil diambil dari snapshot saat tombol analisis ditekan." : "Hasil belum dibuat. Jalankan analisis dari data pasien."}</span></div><span style={{ ...chipStyle, background: analysis ? "#eaf9f4" : "#f2f5f9", color: analysis ? "#16816c" : "#7c8799" }}>{analysis ? "Analisis tersedia" : "Belum dianalisis"}</span></div>
              {!analysis ? <div style={emptyStyle}><Stethoscope size={20} /><div><b>Belum ada hasil analisis</b><span>Isi pasien + keluhan, lalu klik <strong>Jalankan Analisis</strong>. Hasil akan muncul di area ini.</span></div></div> : <>
                {analysisStale && <div style={{ background: "#fff7e8", color: "#9a6916", borderRadius: 9, padding: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 9, marginBottom: 10 }}><AlertTriangle size={14} /><span style={{ flex: 1 }}>Data berubah sejak analisis terakhir.</span><button type="button" onClick={runAnalysis} style={{ border: 0, background: "#9a6916", color: "#fff", borderRadius: 6, padding: "6px 8px", fontSize: 8 }}>Analisis ulang</button></div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}><metric value={String(analysis.differentials.length)} label="Differential" /><metric value={String(analysis.missing.length)} label="Data belum lengkap" /><metric value={String(analysis.redFlags.length)} label="Safety flags" /></div>
                {analysis.differentials.map((d, i) => <button key={d.name} type="button" onClick={() => setSelectedDx(d.name)} style={{ width: "100%", display: "flex", gap: 9, alignItems: "center", textAlign: "left", border: selected?.name === d.name ? "1px solid #b8cdfb" : "1px solid #e3e9f2", background: selected?.name === d.name ? "#f8fbff" : "#fff", borderRadius: 9, padding: 10, marginTop: 7, cursor: "pointer" }}><span style={{ width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", background: "#eff3f8", color: "#6c7a91", fontSize: 8, fontWeight: 800 }}>{i + 1}</span><span style={{ flex: 1 }}><b style={{ display: "block", fontSize: 10, color: "#22375f" }}>{d.name}</b><span style={{ display: "block", marginTop: 3, color: "#8792a4", fontSize: 8, lineHeight: 1.45 }}>{d.reason}</span><small style={{ display: "block", marginTop: 5, color: "#70809a", fontSize: 7 }}>{d.tags.join(" · ")}</small></span><em style={{ fontStyle: "normal", fontSize: 8, color: "#20836f" }}>{d.level}</em></button>)}
                <div style={{ marginTop: 12, border: "1px solid #d9e4f5", borderRadius: 10, padding: 11, background: "#f9fbff" }}><div style={eyebrow}>DIAGNOSIS KERJA</div><select value={selected?.name ?? ""} onChange={(e) => setSelectedDx(e.target.value)} style={{ ...inputStyle, marginTop: 5, fontWeight: 700 }} >{analysis.differentials.map((d) => <option key={d.name}>{d.name}</option>)}</select></div>
                <div style={{ marginTop: 10, background: "#fffaf0", borderRadius: 9, padding: 10 }}><b style={{ fontSize: 9, color: "#956a1e" }}>Data yang masih dibutuhkan</b>{analysis.missing.slice(0, 8).map((x) => <div key={x} style={{ display: "flex", gap: 6, marginTop: 6, fontSize: 8, color: "#8c6d32" }}><AlertTriangle size={12} /><span>{x}</span></div>)}</div>
                <div style={{ marginTop: 10, borderRadius: 10, padding: 11, background: analysis.disposition.status === "stabilize-first" ? "#fff1f1" : analysis.disposition.status === "urgent-review" ? "#fff8e9" : "#eefaf7" }}><div style={eyebrow}>DISPOSITION SUPPORT</div><b style={{ display: "block", marginTop: 3, fontSize: 11 }}>{analysis.disposition.title}</b><span style={{ display: "block", marginTop: 4, fontSize: 8, color: "#6f7b8f", lineHeight: 1.5 }}>{analysis.disposition.reason}</span></div>
              </>}
            </section>

            <section style={cardStyle}>
              <div style={sectionHead}><div><div style={eyebrow}>STEP 05 · RENCANA</div><h3 style={h3}>Clinical plan & SOAP</h3><span style={sub}>Rencana ditampilkan hanya dari hasil analisis yang tersedia.</span></div></div>
              {!analysis ? <div style={emptyStyle}>Jalankan analisis untuk membentuk clinical plan.</div> : <>
                <div style={{ display: "grid", gap: 8 }}>{analysis.investigations.map((x) => <div key={x.name} style={rowStyle}><Check size={14} /><div style={{ flex: 1 }}><b>{x.name}</b><span>{x.reason}</span></div><em>{x.priority}</em></div>)}</div>
                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>{analysis.management.map((x) => <div key={x} style={rowStyle}><ShieldCheck size={14} /><div style={{ flex: 1 }}><b>Clinical consideration</b><span>{x}</span></div></div>)}</div>
                {analysis.redFlags.map((x) => <div key={x} style={{ marginTop: 8, background: "#fff2f2", color: "#a14848", borderRadius: 8, padding: 9, fontSize: 8, display: "flex", gap: 7 }}><AlertTriangle size={14} /><span>{x}</span></div>)}
                <details style={{ marginTop: 11 }}><summary style={{ cursor: "pointer", fontSize: 9, fontWeight: 700 }}>Lihat SOAP draft</summary><div style={{ marginTop: 8, borderTop: "1px solid #edf0f4", paddingTop: 9, display: "grid", gap: 8 }}>{([['S', analysis.soap.subjective], ['O', analysis.soap.objective], ['A', analysis.soap.assessment], ['P', analysis.soap.plan]] as const).map(([k,v]) => <div key={k} style={{ display: "flex", gap: 8 }}><b style={{ width: 20, height: 20, borderRadius: 5, background: "#eef4ff", color: "#3364c4", display: "grid", placeItems: "center", fontSize: 8 }}>{k}</b><span style={{ fontSize: 8, lineHeight: 1.5, color: "#657188" }}>{v}</span></div>)}</div></details>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 13 }}><button type="button" onClick={saveCase} disabled={saving} style={primaryStyle}>{saving ? "Menyimpan…" : "Review & Simpan Encounter"}<Save size={13} /></button></div>
              </>}
            </section>
          </div>

          <aside style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ ...cardStyle, position: "sticky", top: 12 }}><div style={eyebrow}>CASE SUMMARY</div><h3 style={{ ...h3, marginTop: 5 }}>{patient.name || "Pasien baru"}</h3><span style={sub}>{patient.medicalRecordNumber || "No. RM belum diisi"}</span><div style={{ marginTop: 11, display: "grid", gap: 7 }}><summaryRow label="Keluhan" value={complaint ? "Terisi" : "Belum"} /><summaryRow label="Anamnesis" value={`${Object.keys(answers).length} jawaban`} /><summaryRow label="Tanda vital" value={Object.values(vitals).filter(Boolean).length + "/5"} /><summaryRow label="Analisis" value={analysis ? "Siap" : "Belum"} /><summaryRow label="Diagnosis kerja" value={selected?.name ?? "Belum dipilih"} /></div></div>
            <div style={{ background: "#eef9f6", border: "1px solid #ccebe2", borderRadius: 11, padding: 11, color: "#227967", fontSize: 8, lineHeight: 1.55 }}><div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, marginBottom: 4 }}><ShieldCheck size={14} /> Doctor-in-the-loop</div>Sistem menyusun pertimbangan dan dokumentasi. Diagnosis final, terapi, dan disposition tetap harus direview dokter.</div>
          </aside>
        </div>
      </div>
    </main>
  );
}

const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e1e7f0", borderRadius: 14, padding: 15, marginBottom: 12 };
const sectionHead: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 11 };
const eyebrow: React.CSSProperties = { fontSize: 8, fontWeight: 800, letterSpacing: ".12em", color: "#6d81a5" };
const h3: React.CSSProperties = { margin: "3px 0 0", fontSize: 14, color: "#10295b" };
const sub: React.CSSProperties = { display: "block", marginTop: 4, fontSize: 8, color: "#8994a6", lineHeight: 1.5 };
const chipStyle: React.CSSProperties = { background: "#eef4ff", color: "#4e6a98", borderRadius: 5, padding: "5px 7px", fontSize: 7, fontWeight: 700, whiteSpace: "nowrap" };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", marginTop: 5, border: "1px solid #dce3ee", background: "#fff", borderRadius: 7, padding: "8px 9px", outline: 0, color: "#1e3156", fontSize: 9 };
const labelStyle: React.CSSProperties = { display: "block", color: "#6b778e", fontSize: 8, fontWeight: 700 };
const primaryStyle: React.CSSProperties = { border: "1px solid #2563eb", background: "linear-gradient(135deg,#2563eb,#1f58d5)", color: "#fff", borderRadius: 8, padding: "9px 12px", display: "inline-flex", alignItems: "center", gap: 7, fontSize: 9, fontWeight: 700, cursor: "pointer" };
const secondaryStyle: React.CSSProperties = { border: "1px solid #dce3ee", background: "#fff", color: "#607089", borderRadius: 8, padding: "8px 10px", display: "inline-flex", alignItems: "center", gap: 7, fontSize: 9, fontWeight: 700, cursor: "pointer" };
const emptyStyle: React.CSSProperties = { minHeight: 76, display: "flex", alignItems: "center", gap: 10, border: "1px dashed #dfe5ee", borderRadius: 10, padding: 12, color: "#8290a4", fontSize: 9 };
const rowStyle: React.CSSProperties = { display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 0", borderTop: "1px solid #edf0f4", color: "#1b6f60", fontSize: 8 };

function metric({ value, label }: { value: string; label: string }) {
  return <div style={{ background: "#f8fafc", border: "1px solid #eef1f5", borderRadius: 9, padding: 9 }}><b style={{ display: "block", fontSize: 16, color: "#10295b" }}>{value}</b><span style={{ display: "block", marginTop: 2, fontSize: 7, color: "#7e899b" }}>{label}</span></div>;
}

function summaryRow({ label, value }: { label: string; value: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0", borderTop: "1px solid #eef1f5" }}><span style={{ fontSize: 8, color: "#8691a3" }}>{label}</span><b style={{ fontSize: 8, color: "#334768", textAlign: "right" }}>{value}</b></div>;
}
