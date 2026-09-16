"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  FileText,
  HeartPulse,
  Info,
  Loader2,
  Pill,
  Save,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { runClinicalEngine, type ClinicalEngineResult, type QuestionAnswer, type Vitals } from "../../lib/clinical-engine";
import {
  listClinicalEncounters,
  loadClinicalEncounter,
  saveClinicalEncounter,
  type ClinicalEncounter,
} from "../../lib/clinical-storage";

const steps = ["Pasien", "Keluhan", "Anamnesis", "Pemeriksaan", "Analisis", "Rencana"];

const emptyVitals: Vitals = { bp: "", hr: "", rr: "", temp: "", spo2: "" };

export default function ClinicalWorkspace() {
  const [step, setStep] = useState(0);
  const [patientName, setPatientName] = useState("");
  const [medicalRecordNumber, setMedicalRecordNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState<"Laki-laki" | "Perempuan" | "">("");
  const [complaint, setComplaint] = useState("");
  const [vitals, setVitals] = useState<Vitals>(emptyVitals);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [analysis, setAnalysis] = useState<ClinicalEngineResult | null>(null);
  const [analysisSnapshot, setAnalysisSnapshot] = useState<{
    complaint: string;
    vitals: Vitals;
    answers: Record<string, QuestionAnswer>;
  } | null>(null);
  const [selectedDx, setSelectedDx] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [showSoap, setShowSoap] = useState(false);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [savedCases, setSavedCases] = useState<ClinicalEncounter[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  useEffect(() => {
    setSavedCases(listClinicalEncounters());
    setLoadingSaved(false);
  }, []);

  const preview = useMemo(
    () => runClinicalEngine({ complaint, vitals, questionAnswers: answers }),
    [complaint, vitals, answers],
  );

  const draftKey = JSON.stringify({ complaint: complaint.trim(), vitals, answers });
  const snapshotKey = analysisSnapshot
    ? JSON.stringify({ complaint: analysisSnapshot.complaint.trim(), vitals: analysisSnapshot.vitals, answers: analysisSnapshot.answers })
    : "";
  const analysisStale = Boolean(analysis && draftKey !== snapshotKey);
  const vitalsComplete = Object.values(vitals).every(Boolean);
  const patientReady = Boolean(patientName.trim() || medicalRecordNumber.trim());
  const selected = analysis?.differentials.find((d) => d.name === selectedDx) ?? analysis?.differentials[0];

  const runAnalysis = () => {
    if (!patientReady) {
      setNotice("Isi minimal nama pasien atau nomor rekam medis sebelum analisis.");
      setStep(0);
      return;
    }
    if (!complaint.trim()) {
      setNotice("Masukkan keluhan pasien terlebih dahulu sebelum menjalankan analisis.");
      setStep(1);
      return;
    }

    const nextSnapshot = {
      complaint: complaint.trim(),
      vitals: { ...vitals },
      answers: { ...answers },
    };
    const result = runClinicalEngine(nextSnapshot);
    setAnalysisSnapshot(nextSnapshot);
    setAnalysis(result);
    setSelectedDx(result.differentials[0]?.name ?? "");
    setReviewed(false);
    setNotice("Analisis selesai. Hasil berasal dari data saat tombol analisis ditekan.");
    setStep(4);
  };

  const saveCase = () => {
    if (!patientName.trim() && !medicalRecordNumber.trim()) {
      setNotice("Isi minimal nama pasien atau nomor rekam medis sebelum menyimpan.");
      setStep(0);
      return;
    }
    if (!complaint.trim()) {
      setNotice("Keluhan belum diisi. Lengkapi data klinis sebelum menyimpan encounter.");
      setStep(1);
      return;
    }

    setSaving(true);
    const encounter = saveClinicalEncounter({
      patientId: savedCases.find((x) => x.patient.medicalRecordNumber === medicalRecordNumber)?.patientId,
      patient: {
        id: "",
        name: patientName.trim(),
        medicalRecordNumber: medicalRecordNumber.trim(),
        birthDate,
        sex,
        createdAt: "",
        updatedAt: "",
      },
      complaint: complaint.trim(),
      vitals: { ...vitals },
      answers: { ...answers },
      selectedDx: selected?.name ?? selectedDx,
      analysisSnapshot,
      reviewed,
    });
    setSavedCases(listClinicalEncounters());
    setSavedAt(encounter.updatedAt);
    setNotice("Kasus berhasil disimpan di browser perangkat ini.");
    setSaving(false);
    setReviewed(true);
  };

  const loadCase = (id: string) => {
    if (!id) return;
    const record = loadClinicalEncounter(id);
    if (!record) return;
    setPatientName(record.patient.name);
    setMedicalRecordNumber(record.patient.medicalRecordNumber);
    setBirthDate(record.patient.birthDate);
    setSex(record.patient.sex);
    setComplaint(record.complaint);
    setVitals(record.vitals);
    setAnswers(record.answers);
    setSelectedDx(record.selectedDx);
    setReviewed(record.reviewed);
    setAnalysisSnapshot(record.analysisSnapshot);
    setAnalysis(record.analysisSnapshot ? runClinicalEngine(record.analysisSnapshot) : null);
    setSavedAt(record.updatedAt);
    setNotice(`Kasus ${record.patient.name || record.patient.medicalRecordNumber} dimuat.`);
    setStep(record.analysisSnapshot ? 4 : 1);
  };

  const resetCase = () => {
    setStep(0);
    setPatientName("");
    setMedicalRecordNumber("");
    setBirthDate("");
    setSex("");
    setComplaint("");
    setVitals(emptyVitals);
    setAnswers({});
    setAnalysis(null);
    setAnalysisSnapshot(null);
    setSelectedDx("");
    setReviewed(false);
    setSavedAt("");
    setNotice("Form kasus baru siap digunakan.");
  };

  return (
    <main className="clinical-v1">
      <header className="clinical-topbar">
        <a href="/" className="back-link"><ArrowLeft size={16} /> Dashboard</a>
        <div className="clinical-brand">
          <div className="clinical-mark"><HeartPulse size={18} /></div>
          <div><b>Dokter Jaga</b><span>Clinical Assistant</span></div>
        </div>
        <div className="encounter-meta"><span className="live-dot" /> Clinical Encounter</div>
      </header>

      <div className="clinical-body">
        <section className="clinical-header">
          <div>
            <p className="clinical-eyebrow">CLINICAL WORKSPACE</p>
            <h1>Analisis Kasus & RME</h1>
            <p>Data pasien, analisis, dan draft SOAP dapat disimpan sebagai satu encounter sehingga kasus dapat dibuka kembali pada perangkat yang sama.</p>
          </div>
          <div className="patient-mini">
            <div className="patient-initial">{patientName.trim().slice(0, 2).toUpperCase() || "DJ"}</div>
            <div><b>{patientName || "Pasien baru"}</b><span>{medicalRecordNumber || "No. RM belum diisi"}</span></div>
          </div>
        </section>

        {notice && <div className="clinical-notice"><Info size={15} /><span>{notice}</span><button type="button" onClick={() => setNotice("")}>Tutup</button></div>}

        <div className="clinical-card" style={{ marginBottom: 14 }}>
          <div className="card-title">
            <div><p className="clinical-eyebrow">PATIENT RECORD</p><h2>Data Pasien</h2><span>Isi identitas minimal sebelum menjalankan analisis atau menyimpan encounter.</span></div>
            <span className="status green"><ShieldCheck size={13} /> {savedAt ? "Tersimpan" : "Draft"}</span>
          </div>
          <div className="vital-grid" style={{ gridTemplateColumns: "2fr 1.2fr 1fr 1fr" }}>
            <label>Nama pasien<div><input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Nama lengkap" /></div></label>
            <label>No. rekam medis<div><input value={medicalRecordNumber} onChange={(e) => setMedicalRecordNumber(e.target.value)} placeholder="No. RM" /></div></label>
            <label>Tanggal lahir<div><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></div></label>
            <label>Jenis kelamin<div><select value={sex} onChange={(e) => setSex(e.target.value as typeof sex)}><option value="">Pilih</option><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div></label>
          </div>
          <div className="action-row">
            <button className="secondary" type="button" onClick={resetCase}><FileText size={14} /> Kasus Baru</button>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
              <select aria-label="Kasus tersimpan" disabled={loadingSaved || savedCases.length === 0} defaultValue="" onChange={(e) => loadCase(e.target.value)}>
                <option value="">{loadingSaved ? "Memuat kasus…" : savedCases.length ? "Buka kasus tersimpan" : "Belum ada kasus tersimpan"}</option>
                {savedCases.map((item) => <option key={item.id} value={item.id}>{item.patient.name || item.patient.medicalRecordNumber || "Kasus"} · {new Date(item.updatedAt).toLocaleString("id-ID")}</option>)}
              </select>
              <button className={saving ? "secondary" : "primary"} type="button" onClick={saveCase} disabled={saving}><Save size={14} /> {saving ? "Menyimpan…" : "Simpan Kasus"}</button>
            </div>
          </div>
        </div>

        <nav className="clinical-stepper">
          {steps.map((label, i) => <button key={label} type="button" onClick={() => setStep(i)} className={i === step ? "active" : i < step ? "done" : ""}><span>{i < step ? <Check size={12} /> : i + 1}</span>{label}</button>)}
        </nav>

        <div className="clinical-layout">
          <section className="clinical-main">
            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 01</p><h2>Keluhan & Gambaran Awal</h2><span>Masukkan keluhan utama dan informasi klinis awal dengan bahasa bebas.</span></div><span className="status">{preview.engineVersion}</span></div>
              <label className="field-label">Keluhan awal pasien<textarea value={complaint} onChange={(e) => { setComplaint(e.target.value); setReviewed(false); }} placeholder="Contoh: laki-laki 58 tahun, nyeri dada sejak 2 jam, menjalar ke lengan kiri, keringat dingin..." /></label>
              <div className="quick-tags">{preview.extracted.length ? preview.extracted.map((tag) => <span key={tag}>{tag}</span>) : <span>Belum ada temuan terstruktur</span>}</div>
              <div className="analysis-launch">
                <div><b>Clinical reasoning siap dijalankan</b><span>Engine membaca keluhan, jawaban anamnesis, dan tanda vital saat tombol ditekan.</span></div>
                <button className="primary" type="button" onClick={runAnalysis}><Stethoscope size={15} /> Jalankan Analisis</button>
              </div>
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 02</p><h2>Anamnesis Terarah</h2><span>Pertanyaan aktif berubah mengikuti sindrom yang terdeteksi dari keluhan.</span></div><span className="status amber">{preview.questions.length} pertanyaan</span></div>
              <div className="question-list">
                {preview.questions.length === 0 && <div className="analysis-placeholder">Masukkan keluhan untuk memunculkan pertanyaan terarah.</div>}
                {preview.questions.map((q) => <div key={q.id} className="adaptive-question"><div className="question-main"><div><b>{q.text}</b><span>{q.whyItMatters}</span></div><span className={`question-category ${q.category}`}>{q.category === "safety" ? "Safety" : q.category === "disposition" ? "Disposition" : "Differential"}</span></div><div className="answer-row"><button type="button" className={answers[q.id] === "yes" ? "answer active yes" : "answer"} onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: "yes" }))}>Ya</button><button type="button" className={answers[q.id] === "no" ? "answer active no" : "answer"} onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: "no" }))}>Tidak</button><button type="button" className={answers[q.id] === "unknown" ? "answer active" : "answer"} onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: "unknown" }))}>Belum tahu</button></div></div>)}
              </div>
              <button className="primary" type="button" onClick={() => setStep(3)}><UserRound size={15} /> Lanjut ke Pemeriksaan</button>
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 03</p><h2>Pemeriksaan & Tanda Vital</h2><span>Data objektif yang tersedia akan ikut masuk ke analisis berikutnya.</span></div><span className={vitalsComplete ? "status green" : "status amber"}>{vitalsComplete ? "Lengkap" : "Belum lengkap"}</span></div>
              <div className="vital-grid">{([["bp","TD","mmHg"],["hr","Nadi","/menit"],["rr","RR","/menit"],["temp","Suhu","°C"],["spo2","SpO₂","%"]] as const).map(([key,label,unit]) => <label key={key}>{label}<div><input value={vitals[key] ?? ""} onChange={(e) => setVitals((prev) => ({ ...prev, [key]: e.target.value }))} placeholder="—" inputMode="decimal" /><span>{unit}</span></div></label>)}</div>
              <div className="safety-inline"><AlertTriangle size={16} /><span>Kolom kosong diperlakukan sebagai data belum tersedia, bukan sebagai nilai normal.</span></div>
              <div className="action-row"><button className="secondary" type="button" onClick={() => setStep(1)}>Kembali</button><button className="primary" type="button" onClick={runAnalysis}>{analysis ? "Analisis Ulang" : "Jalankan Analisis"} <ArrowRight size={15} /></button></div>
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 04 · DECISION SUPPORT</p><h2>Clinical Reasoning</h2><span>{analysis ? "Hasil berasal dari snapshot data saat analisis dijalankan." : "Belum ada hasil analisis."}</span></div></div>

              {!analysis && <div className="analysis-empty"><div className="reason-icon"><Stethoscope size={20} /></div><div><h3>Belum ada hasil analisis</h3><p>Isi identitas pasien dan keluhan, lalu tekan <b>Jalankan Analisis</b>. Hasil akan tampil langsung di panel ini.</p><button type="button" className="primary" onClick={runAnalysis}>Jalankan Analisis Sekarang <ArrowRight size={15} /></button></div></div>}

              {analysis && analysisStale && <div className="stale-banner"><AlertTriangle size={16} /><div><b>Data berubah sejak analisis terakhir.</b><span>Hasil di bawah masih menggunakan snapshot sebelumnya.</span></div><button type="button" onClick={runAnalysis}>Analisis Ulang</button></div>}

              {analysis && <>
                <div className="reason-banner"><div className="reason-icon"><Stethoscope size={18} /></div><div><b>Analisis berhasil dijalankan</b><span>{analysis.differentials.length} pertimbangan klinis, {analysis.missing.length} data belum lengkap, dan {analysis.redFlags.length} safety flag terdeteksi.</span></div></div>
                {analysis.differentials.map((d, i) => <button key={d.name} type="button" className={selected?.name === d.name ? "ddx selected" : "ddx"} onClick={() => setSelectedDx(d.name)}><span className="ddx-rank">{i + 1}</span><div><b>{d.name}</b><span>{d.reason}</span><small>{d.tags.join(" · ")}</small></div><em>{d.level}</em><ArrowRight size={15} /></button>)}
                <div className="selected-plan"><div><p className="clinical-eyebrow">DIAGNOSIS KERJA · DOCTOR SELECTION</p><h3>{selected?.name || "Belum dipilih"}</h3><span>{selected?.reason || "Pilih salah satu pertimbangan di atas untuk melanjutkan review."}</span></div><select value={selected?.name ?? ""} onChange={(e) => setSelectedDx(e.target.value)}>{analysis.differentials.map((x) => <option key={x.name} value={x.name}>{x.name}</option>)}</select></div>
                <div className="missing-panel"><b>Data yang masih perlu dilengkapi</b>{analysis.missing.length ? analysis.missing.slice(0, 10).map((item) => <div key={item}><AlertTriangle size={14} /><span>{item}</span></div>) : <div><Check size={14} /><span>Data yang dibutuhkan oleh rules saat ini sudah tersedia.</span></div>}</div>
                <div className={`disposition-box ${analysis.disposition.status}`}><div><p className="clinical-eyebrow">DISPOSITION SUPPORT</p><h3>{analysis.disposition.title}</h3><span>{analysis.disposition.reason}</span></div>{analysis.disposition.triggers.length > 0 && <div className="trigger-list">{analysis.disposition.triggers.map((t) => <span key={t}>• {t}</span>)}</div>}</div>
                <button className="primary" type="button" onClick={() => setStep(5)}>Lanjut ke Clinical Plan <ArrowRight size={15} /></button>
              </>}
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 05</p><h2>Clinical Plan</h2><span>Output pendukung untuk review dokter.</span></div><span className="status green">Doctor review</span></div>
              {!analysis && <div className="analysis-placeholder">Jalankan analisis kasus untuk menampilkan clinical plan.</div>}
              {analysis && <>
                <div className="plan-section"><h4><ClipboardCheck size={15} /> Pemeriksaan yang dipertimbangkan</h4>{analysis.investigations.map((item) => <div className="plan-row" key={item.name}><Check size={15} /><div><b>{item.name}</b><span>{item.reason}</span></div><em className={`priority ${item.priority.toLowerCase()}`}>{item.priority}</em></div>)}</div>
                <div className="plan-section"><h4><Pill size={15} /> Tatalaksana</h4>{analysis.management.map((item) => <div className="plan-row" key={item}><ShieldCheck size={15} /><div><b>Clinical consideration</b><span>{item}</span></div></div>)}</div>
                <div className="plan-section"><h4><ShieldCheck size={15} /> Medication safety</h4>{analysis.medicationSafety.map((item) => <div className="plan-row" key={item}><ShieldCheck size={15} /><div><b>Safety check</b><span>{item}</span></div></div>)}</div>
                {analysis.redFlags.map((flag) => <div className="red-flag" key={flag}><AlertTriangle size={17} /><div><b>Safety flag</b><span>{flag}</span></div></div>)}
                <div className="action-row"><button className="secondary" type="button" onClick={() => setShowSoap((v) => !v)}><FileText size={14} /> {showSoap ? "Tutup SOAP" : "Lihat SOAP draft"}</button><button className={reviewed ? "reviewed" : "primary"} type="button" onClick={saveCase} disabled={saving}>{saving ? <Loader2 size={15} className="spin" /> : reviewed ? <Check size={15} /> : <Save size={15} />} {saving ? "Menyimpan…" : reviewed ? "Tersimpan" : "Review & Simpan RME"}</button></div>
                {savedAt && <div className="signed"><Check size={15} /> Encounter terakhir disimpan {new Date(savedAt).toLocaleString("id-ID")} di perangkat ini.</div>}
                {showSoap && <div className="soap-panel"><div><b>S — Subjective</b><p>{analysis.soap.subjective}</p></div><div><b>O — Objective</b><p>{analysis.soap.objective}</p></div><div><b>A — Assessment</b><p>{analysis.soap.assessment}</p></div><div><b>P — Plan</b><p>{analysis.soap.plan}</p></div></div>}
              </>}
            </div>
          </section>

          <aside className="clinical-side">
            <div className="clinical-card side-card">
              <div className="card-title"><div><p className="clinical-eyebrow">ENCOUNTER STATUS</p><h2>{analysis ? (analysisStale ? "Perlu analisis ulang" : "Analisis tersedia") : "Belum dianalisis"}</h2><span>{patientName || "Pasien baru"}</span></div></div>
              <div className="status-list">
                <div><span>Identitas</span><b>{patientReady ? "Terisi" : "Belum"}</b></div>
                <div><span>Keluhan</span><b>{complaint.trim() ? "Terisi" : "Belum"}</b></div>
                <div><span>Anamnesis</span><b>{Object.keys(answers).length ? "Ada jawaban" : "Belum"}</b></div>
                <div><span>Tanda vital</span><b>{vitalsComplete ? "Lengkap" : "Belum lengkap"}</b></div>
                <div><span>Penyimpanan</span><b>{savedAt ? "Tersimpan lokal" : "Belum disimpan"}</b></div>
              </div>
              <div className="safety-card"><AlertTriangle size={15} /><div><b>Catatan</b><p>Penyimpanan saat ini menggunakan localStorage browser. Belum merupakan RME server/shared database dan belum tersinkron antar perangkat.</p></div></div>
            </div>

            <div className="clinical-card side-card">
              <div className="card-title"><div><p className="clinical-eyebrow">ANALYSIS SNAPSHOT</p><h2>Data yang dianalisis</h2></div></div>
              {analysisSnapshot ? <div className="soap"><b>Σ</b><span>{analysisSnapshot.complaint}<br />Snapshot: {new Date().toLocaleString("id-ID")}</span></div> : <div className="analysis-placeholder">Belum ada snapshot.</div>}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
