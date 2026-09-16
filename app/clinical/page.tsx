"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ClipboardCheck, HeartPulse, Info, Pill, ShieldCheck, Stethoscope, RotateCcw } from "lucide-react";
import { runClinicalEngine, type QuestionAnswer, type Vitals } from "../../lib/clinical-engine";

const steps = ["Keluhan", "Anamnesis", "Pemeriksaan", "Analisis", "Rencana"];

type CaseSnapshot = {
  complaint: string;
  vitals: Vitals;
  answers: Record<string, QuestionAnswer>;
};

export default function ClinicalWorkspace() {
  const [step, setStep] = useState(0);
  const [complaint, setComplaint] = useState("");
  const [vitals, setVitals] = useState<Vitals>({ bp: "", hr: "", rr: "", temp: "", spo2: "" });
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [analysisSnapshot, setAnalysisSnapshot] = useState<CaseSnapshot | null>(null);
  const [selectedDx, setSelectedDx] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showSoap, setShowSoap] = useState(false);
  const [notice, setNotice] = useState("");

  const preview = useMemo(() => runClinicalEngine({ complaint, vitals, questionAnswers: answers }), [complaint, vitals, answers]);
  const analysis = useMemo(() => analysisSnapshot ? runClinicalEngine({ complaint: analysisSnapshot.complaint, vitals: analysisSnapshot.vitals, questionAnswers: analysisSnapshot.answers }) : null, [analysisSnapshot]);

  const draftKey = JSON.stringify({ complaint: complaint.trim(), vitals, answers });
  const snapshotKey = analysisSnapshot ? JSON.stringify({ complaint: analysisSnapshot.complaint.trim(), vitals: analysisSnapshot.vitals, answers: analysisSnapshot.answers }) : "";
  const analysisStale = Boolean(analysis && draftKey !== snapshotKey);
  const vitalsComplete = Object.values(vitals).every(Boolean);
  const selected = analysis?.differentials.find(d => d.name === selectedDx) ?? analysis?.differentials[0];

  const updateVital = (key: keyof Vitals, value: string) => {
    setVitals(prev => ({ ...prev, [key]: value }));
    setReviewed(false);
  };

  const updateQuestion = (id: string, answer: QuestionAnswer) => {
    setAnswers(prev => ({ ...prev, [id]: answer }));
    setReviewed(false);
  };

  const runAnalysis = () => {
    if (!complaint.trim()) {
      setNotice("Masukkan keluhan pasien terlebih dahulu sebelum menjalankan analisis.");
      setStep(0);
      return;
    }
    setAnalysisSnapshot({ complaint: complaint.trim(), vitals: { ...vitals }, answers: { ...answers } });
    setSelectedDx("");
    setReviewed(false);
    setNotice("Analisis kasus dijalankan dari data terbaru.");
    setStep(3);
  };

  const resetCase = () => {
    setComplaint("");
    setVitals({ bp: "", hr: "", rr: "", temp: "", spo2: "" });
    setAnswers({});
    setAnalysisSnapshot(null);
    setSelectedDx("");
    setReviewed(false);
    setNotice("Kasus dikosongkan.");
    setStep(0);
  };

  return (
    <main className="clinical-v1">
      <header className="clinical-topbar">
        <a href="/" className="back-link"><ArrowLeft size={16} /> Dashboard</a>
        <div className="clinical-brand"><div className="clinical-mark"><HeartPulse size={18} /></div><div><b>Dokter Jaga</b><span>Clinical Assistant</span></div></div>
        <div className="encounter-meta"><span className="live-dot" /> Encounter klinis</div>
      </header>

      <div className="clinical-body">
        <section className="clinical-header">
          <div>
            <p className="clinical-eyebrow">CLINICAL WORKSPACE</p>
            <h1>Analisis Kasus</h1>
            <p>Masukkan keluhan pasien, lengkapi informasi kunci, lalu jalankan analisis. Sistem membantu menyusun pertimbangan; keputusan klinis tetap pada dokter.</p>
          </div>
          <div className="patient-mini"><div className="patient-initial">DJ</div><div><b>Encounter baru</b><span>Mode demo · data belum tersimpan ke RME</span></div></div>
        </section>

        {notice && <div className="clinical-notice"><Info size={15} /><span>{notice}</span><button type="button" onClick={() => setNotice("")}>Tutup</button></div>}

        <nav className="clinical-stepper">
          {steps.map((label, i) => <button key={label} type="button" onClick={() => setStep(i)} className={i === step ? "active" : i < step ? "done" : ""}><span>{i < step ? <Check size={12} /> : i + 1}</span>{label}</button>)}
        </nav>

        <div className="clinical-layout">
          <section className="clinical-main">
            <div className="clinical-card input-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 01</p><h2>Keluhan & Gambaran Awal</h2><span>Tulis dengan bahasa klinis bebas. Contoh: demam sejak 3 hari, sakit kepala, nyeri badan, mual.</span></div><span className="status">{preview.engineVersion}</span></div>
              <label className="field-label">Keluhan awal pasien<textarea value={complaint} onChange={e => { setComplaint(e.target.value); setReviewed(false); }} placeholder="Tulis keluhan dan gambaran awal pasien..." /></label>
              <div className="quick-tags">{preview.extracted.length ? preview.extracted.map(tag => <span key={tag}>{tag}</span>) : <span>Belum ada temuan terstruktur</span>}</div>
              <div className="analysis-launch">
                <div><b>Siap dianalisis?</b><span>Setelah tombol ditekan, hasil clinical reasoning akan dibuat dari snapshot data saat ini.</span></div>
                <button className="primary" type="button" onClick={runAnalysis}><Stethoscope size={15} /> Jalankan Analisis Kasus</button>
              </div>
              <div className="action-row"><button className="secondary" type="button" onClick={resetCase}><RotateCcw size={14} /> Reset Kasus</button></div>
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 02</p><h2>Anamnesis Terarah</h2><span>Jawaban disimpan sebagai data kasus dan ikut dianalisis pada snapshot berikutnya.</span></div><span className="status amber">{preview.questions.length} pertanyaan</span></div>
              <div className="question-list">
                {preview.questions.map(q => <div key={q.id} className="adaptive-question"><div className="question-main"><div><b>{q.text}</b><span>{q.whyItMatters}</span></div><span className={`question-category ${q.category}`}>{q.category === "safety" ? "Safety" : q.category === "disposition" ? "Disposition" : "Differential"}</span></div><div className="answer-row"><button type="button" className={answers[q.id] === "yes" ? "answer active yes" : "answer"} onClick={() => updateQuestion(q.id, "yes")}>Ya</button><button type="button" className={answers[q.id] === "no" ? "answer active no" : "answer"} onClick={() => updateQuestion(q.id, "no")}>Tidak</button><button type="button" className={answers[q.id] === "unknown" ? "answer active" : "answer"} onClick={() => updateQuestion(q.id, "unknown")}>Belum tahu</button></div></div>)}
              </div>
              <button className="primary" type="button" onClick={() => setStep(2)}>Lanjut ke Pemeriksaan <ArrowRight size={15} /></button>
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 03</p><h2>Pemeriksaan & Tanda Vital</h2><span>Isi data objektif yang tersedia sebelum menjalankan atau mengulang analisis.</span></div><span className={vitalsComplete ? "status green" : "status amber"}>{vitalsComplete ? "Lengkap" : "Belum lengkap"}</span></div>
              <div className="vital-grid">{([ ["bp","TD","mmHg"], ["hr","Nadi","/menit"], ["rr","RR","/menit"], ["temp","Suhu","°C"], ["spo2","SpO₂","%"] ] as const).map(([key,label,unit]) => <label key={key}>{label}<div><input value={vitals[key] ?? ""} onChange={e => updateVital(key, e.target.value)} placeholder="—" inputMode="decimal" /><span>{unit}</span></div></label>)}</div>
              <div className="safety-inline"><AlertTriangle size={16} /><span>Data vital yang belum lengkap akan ditandai sebagai keterbatasan analisis, bukan dianggap normal.</span></div>
              <div className="action-row"><button className="secondary" type="button" onClick={() => setStep(0)}>Kembali</button><button className="primary" type="button" onClick={runAnalysis}>{analysis ? "Analisis Ulang" : "Jalankan Analisis"} <ArrowRight size={15} /></button></div>
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 04 · DECISION SUPPORT</p><h2>Clinical Reasoning</h2><span>Hasil hanya tampil setelah analisis dijalankan.</span></div><button className="info-button" type="button" onClick={() => setShowDetails(v => !v)}><Info size={15} /> Bagaimana ini bekerja?</button></div>

              {!analysis && <div className="analysis-empty"><div className="reason-icon"><Stethoscope size={20} /></div><div><h3>Belum ada hasil analisis</h3><p>Lengkapi keluhan dan data yang tersedia, lalu klik <b>“Jalankan Analisis Kasus”</b>. Sistem akan membuat snapshot dan menyusun differential, data yang kurang, pemeriksaan yang dipertimbangkan, disposition support, dan SOAP draft.</p><button type="button" className="primary" onClick={runAnalysis}>Jalankan Analisis Sekarang <ArrowRight size={15} /></button></div></div>}

              {analysis && analysisStale && <div className="stale-banner"><AlertTriangle size={16} /><div><b>Data berubah sejak analisis terakhir.</b><span>Hasil di bawah masih berasal dari snapshot sebelumnya. Jalankan analisis ulang untuk memperbarui reasoning.</span></div><button type="button" onClick={runAnalysis}>Analisis Ulang</button></div>}

              {analysis && <>
                <div className="reason-banner"><div className="reason-icon"><Stethoscope size={18} /></div><div><b>{analysis.differentials.length > 1 ? "Beberapa pertimbangan klinis terdeteksi." : "Data belum cukup untuk pertimbangan spesifik."}</b><span>Output berasal dari {analysis.engineVersion}; tidak ada probabilitas diagnosis dan diagnosis kerja tetap dikonfirmasi dokter.</span></div></div>
                {analysis.differentials.map((d, i) => <button key={d.name} type="button" className={selected?.name === d.name ? "ddx selected" : "ddx"} onClick={() => setSelectedDx(d.name)}><span className="ddx-rank">{i + 1}</span><div><b>{d.name}</b><span>{d.reason}</span><small>{d.tags.join(" · ")}</small></div><em>{d.level}</em><ArrowRight size={15} /></button>)}
                {showDetails && <div className="explanation"><b>Prinsip engine</b><p>Analisis deterministik membantu transparansi: gejala, jawaban anamnesis, dan data objektif memicu rules tertentu. Sistem tidak menetapkan diagnosis, terapi, atau rujukan secara otonom.</p></div>}
                <div className="selected-plan"><div><p className="clinical-eyebrow">DIAGNOSIS KERJA</p><h3>{selected?.name}</h3><span>{selected?.reason}</span></div><select value={selected?.name ?? ""} onChange={e => setSelectedDx(e.target.value)}>{analysis.differentials.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}</select></div>
                <div className="missing-panel"><b>Data yang masih perlu dilengkapi</b>{analysis.missing.length ? analysis.missing.slice(0, 10).map(item => <div key={item}><AlertTriangle size={14} /><span>{item}</span></div>) : <div><Check size={14} /><span>Data yang dibutuhkan oleh rules saat ini sudah terisi.</span></div>}</div>
                <div className={`disposition-box ${analysis.disposition.status}`}><div><p className="clinical-eyebrow">DISPOSITION SUPPORT</p><h3>{analysis.disposition.title}</h3><span>{analysis.disposition.reason}</span></div>{analysis.disposition.triggers.length > 0 && <div className="trigger-list">{analysis.disposition.triggers.map(t => <span key={t}>• {t}</span>)}</div>}</div>
                <button className="primary" type="button" onClick={() => setStep(4)}>Lanjut ke Clinical Plan <ArrowRight size={15} /></button>
              </>}
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 05</p><h2>Clinical Plan</h2><span>Hanya tersedia setelah analisis kasus dibuat.</span></div><span className="status green">Doctor review</span></div>
              {!analysis && <div className="analysis-placeholder">Jalankan analisis kasus untuk menampilkan clinical plan.</div>}
              {analysis && <>
                <div className="plan-section"><h4><ClipboardCheck size={15} /> Pemeriksaan yang dipertimbangkan</h4>{analysis.investigations.map(item => <div className="plan-row" key={item.name}><Check size={15} /><div><b>{item.name}</b><span>{item.reason}</span></div><em className={`priority ${item.priority.toLowerCase()}`}>{item.priority}</em></div>)}</div>
                <div className="plan-section"><h4><Pill size={15} /> Tatalaksana</h4>{analysis.management.map(item => <div className="plan-row" key={item}><ShieldCheck size={15} /><div><b>Clinical consideration</b><span>{item}</span></div></div>)}</div>
                <div className="plan-section"><h4><ShieldCheck size={15} /> Medication safety</h4>{analysis.medicationSafety.map(item => <div className="plan-row" key={item}><ShieldCheck size={15} /><div><b>Safety check</b><span>{item}</span></div></div>)}</div>
                {analysis.redFlags.map(flag => <div className="red-flag" key={flag}><AlertTriangle size={17} /><div><b>Red flags / rujuk</b><span>{flag}</span></div></div>)}
                <div className="action-row"><button className="secondary" type="button" onClick={() => setShowSoap(v => !v)}>Lihat SOAP draft</button><button className={reviewed ? "reviewed" : "primary"} type="button" onClick={() => setReviewed(true)}>{reviewed ? <><Check size={15} /> Reviewed</> : <>Review & Simpan RME <ArrowRight size={15} /></>}</button></div>
                {showSoap && <div className="soap-panel"><div><b>S — Subjective</b><p>{analysis.soap.subjective}</p></div><div><b>O — Objective</b><p>{analysis.soap.objective}</p></div><div><b>A — Assessment</b><p>{analysis.soap.assessment}</p></div><div><b>P — Plan</b><p>{analysis.soap.plan}</p></div></div>}
              </>}
            </div>
          </section>

          <aside className="clinical-side">
            <div className="clinical-card sticky-card">
              <div className="side-heading"><div><p className="clinical-eyebrow">ANALYSIS STATUS</p><h3>{analysis ? (analysisStale ? "Perlu analisis ulang" : "Analisis tersedia") : "Belum dianalisis"}</h3></div><span className={`age-badge ${analysis ? "" : "warning-text"}`}>{analysis ? "READY" : "DRAFT"}</span></div>
              <div className="context-row"><span>Keluhan terisi</span><b className={complaint.trim() ? "ok" : "warning-text"}>{complaint.trim() ? "Ya" : "Belum"}</b></div>
              <div className="context-row"><span>Data vital</span><b className={vitalsComplete ? "ok" : "warning-text"}>{vitalsComplete ? "Lengkap" : "Belum lengkap"}</b></div>
              <div className="context-row"><span>Snapshot</span><b>{analysis ? (analysisStale ? "Lama" : "Terbaru") : "—"}</b></div>
            </div>
            {analysis && <div className="clinical-card"><div className="side-heading"><div><p className="clinical-eyebrow">TOP OUTPUT</p><h3>{selected?.name}</h3></div><ShieldCheck size={18} className="shield" /></div><div className="context-row"><span>Disposition</span><b className={analysis.disposition.status === "stabilize-first" ? "warning-text" : "ok"}>{analysis.disposition.title}</b></div><div className="context-row"><span>DDx</span><b>{analysis.differentials.length} pertimbangan</b></div><div className="context-row"><span>Missing data</span><b>{analysis.missing.length}</b></div></div>}
            <div className="clinical-card"><div className="side-heading"><div><p className="clinical-eyebrow">SAFETY CHECK</p><h3>Sebelum finalisasi</h3></div><ShieldCheck size={18} className="shield" /></div><div className="check-item"><span className={vitalsComplete ? "check ok" : "check"}>{vitalsComplete ? <Check size={11} /> : "!"}</span><div><b>Tanda vital</b><span>{vitalsComplete ? "Sudah diisi" : "Wajib dilengkapi"}</span></div></div><div className="check-item"><span className={analysis?.redFlags.length ? "check" : analysis ? "check ok" : "check"}>{analysis?.redFlags.length ? "!" : analysis ? <Check size={11} /> : "!"}</span><div><b>Red flags</b><span>{analysis ? (analysis.redFlags.length ? "Perlu review" : "Tidak ada sinyal aktif") : "Belum dianalisis"}</span></div></div><div className="check-item"><span className={Object.keys(answers).length === preview.questions.length ? "check ok" : "check"}>{Object.keys(answers).length === preview.questions.length ? <Check size={11} /> : "!"}</span><div><b>Anamnesis</b><span>{Object.keys(answers).length === preview.questions.length ? "Semua dijawab" : "Masih ada yang belum dijawab"}</span></div></div></div>
            <div className="clinical-card evidence-card"><p className="clinical-eyebrow">ENGINE AWARE</p><h3>Snapshot & auditability</h3><p>{analysis ? `Snapshot ${analysis.engineVersion}. Output berasal dari data saat tombol analisis ditekan.` : "Belum ada snapshot analisis."}</p><button type="button" onClick={runAnalysis}><RotateCcw size={14} /> {analysis ? "Jalankan ulang" : "Mulai analisis"}</button></div>
          </aside>
        </div>
      </div>
    </main>
  );
}
