"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ClipboardCheck, HeartPulse, Info, Pill, ShieldCheck, Stethoscope } from "lucide-react";
import { runClinicalEngine, type QuestionAnswer, type Vitals } from "../../lib/clinical-engine";

const steps = ["Keluhan", "Anamnesis", "Pemeriksaan", "Analisis", "Rencana"];

export default function ClinicalWorkspace() {
  const [step, setStep] = useState(0);
  const [complaint, setComplaint] = useState("Pasien demam sejak 3 hari, disertai sakit kepala dan nyeri badan. Tidak ada batuk. Mual ada, muntah tidak.");
  const [vitals, setVitals] = useState<Vitals>({ bp: "", hr: "", rr: "", temp: "", spo2: "" });
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [selectedDx, setSelectedDx] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showSoap, setShowSoap] = useState(false);
  const [showPatientEdit, setShowPatientEdit] = useState(false);
  const [patient, setPatient] = useState({ name: "Budi Santoso", age: "45", sex: "Laki-laki", mrn: "RM-001248" });

  const engine = useMemo(() => runClinicalEngine({ complaint, vitals, questionAnswers: answers }), [complaint, vitals, answers]);
  const selected = engine.differentials.find(d => d.name === selectedDx) ?? engine.differentials[0];
  const vitalsComplete = Object.values(vitals).every(Boolean);

  const updateQuestion = (id: string, answer: QuestionAnswer) => setAnswers(prev => ({ ...prev, [id]: answer }));
  const updateVital = (key: keyof Vitals, value: string) => setVitals(prev => ({ ...prev, [key]: value }));
  const resetCase = () => {
    setComplaint("");
    setVitals({ bp: "", hr: "", rr: "", temp: "", spo2: "" });
    setAnswers({});
    setSelectedDx("");
    setReviewed(false);
  };

  return (
    <main className="clinical-v1">
      <header className="clinical-topbar">
        <a href="/" className="back-link"><ArrowLeft size={16}/> Dashboard</a>
        <div className="clinical-brand"><div className="clinical-mark"><HeartPulse size={18}/></div><div><b>Dokter Jaga</b><span>Clinical Assistant</span></div></div>
        <div className="encounter-meta"><span className="live-dot"/> Encounter aktif · {patient.mrn}</div>
      </header>

      <div className="clinical-body">
        <section className="clinical-header">
          <div><p className="clinical-eyebrow">NEW CLINICAL ENCOUNTER</p><h1>Analisis Kasus</h1><p>Clinical Decision Support berbasis rules: sistem menyusun informasi dan pertimbangan, dokter tetap mengambil keputusan klinis.</p></div>
          <div className="patient-mini"><div className="patient-initial">{patient.name.split(" ").map(x => x[0]).join("").slice(0,2)}</div><div><b>{patient.name}</b><span>{patient.sex} · {patient.age} tahun · {patient.mrn}</span></div><button onClick={() => setShowPatientEdit(v => !v)} type="button">Edit</button></div>
        </section>

        {showPatientEdit && <div className="clinical-card patient-edit"><div className="card-title"><div><p className="clinical-eyebrow">PATIENT CONTEXT</p><h2>Edit konteks pasien</h2></div><span className="status blue">Demo workspace</span></div><div className="patient-edit-grid">{([ ["name","Nama"], ["age","Usia"], ["sex","Jenis kelamin"], ["mrn","No. RM"] ] as const).map(([key,label]) => <label key={key}>{label}<input value={patient[key]} onChange={e => setPatient(prev => ({ ...prev, [key]: e.target.value }))}/></label>)}</div></div>}

        <nav className="clinical-stepper">{steps.map((label, i) => <button key={label} onClick={() => setStep(i)} className={i === step ? "active" : i < step ? "done" : ""}><span>{i < step ? <Check size={12}/> : i + 1}</span>{label}</button>)}</nav>

        <div className="clinical-layout">
          <section className="clinical-main">
            <div className="clinical-card input-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 01</p><h2>Keluhan & Gambaran Awal</h2></div><span className="status">Rules {engine.engineVersion}</span></div>
              <label className="field-label">Keluhan awal pasien<textarea value={complaint} onChange={e => setComplaint(e.target.value)} placeholder="Tulis keluhan dan gambaran awal pasien..." /></label>
              <div className="quick-tags">{engine.extracted.length ? engine.extracted.map(tag => <span key={tag}>{tag}</span>) : <span>Belum ada temuan terstruktur</span>}</div>
              <div className="action-row"><button className="secondary" type="button">🎙️ Input suara</button><button className="secondary" type="button" onClick={resetCase}>Reset</button><button className="primary" type="button" onClick={() => setStep(1)}>Strukturkan Kasus <ArrowRight size={15}/></button></div>
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 02</p><h2>Anamnesis Adaptif</h2><span>Pilih jawaban yang benar-benar sudah ditanyakan; sistem menggunakan jawaban untuk menyesuaikan pertimbangan berikutnya.</span></div><span className={engine.missing.length ? "status amber" : "status green"}>{engine.questions.length} pertanyaan</span></div>
              <div className="question-list">{engine.questions.map(q => <div key={q.id} className="adaptive-question"><div className="question-main"><div><b>{q.text}</b><span>{q.whyItMatters}</span></div><span className={`question-category ${q.category}`}>{q.category === "safety" ? "Safety" : q.category === "disposition" ? "Disposition" : "Differential"}</span></div><div className="answer-row"><button type="button" className={answers[q.id] === "yes" ? "answer active yes" : "answer"} onClick={() => updateQuestion(q.id, "yes")}>Ya</button><button type="button" className={answers[q.id] === "no" ? "answer active no" : "answer"} onClick={() => updateQuestion(q.id, "no")}>Tidak</button><button type="button" className={answers[q.id] === "unknown" ? "answer active" : "answer"} onClick={() => updateQuestion(q.id, "unknown")}>Belum tahu</button></div></div>)}</div>
              <button className="primary" type="button" onClick={() => setStep(2)}>Lanjut ke Pemeriksaan <ArrowRight size={15}/></button>
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 03</p><h2>Pemeriksaan & Tanda Vital</h2></div><span className={vitalsComplete ? "status green" : "status amber"}>{vitalsComplete ? "Lengkap" : "Belum lengkap"}</span></div>
              <div className="vital-grid">{([ ["bp","TD","mmHg"], ["hr","Nadi","/menit"], ["rr","RR","/menit"], ["temp","Suhu","°C"], ["spo2","SpO₂","%"] ] as const).map(([key,label,unit]) => <label key={key}>{label}<div><input value={vitals[key] ?? ""} onChange={e => updateVital(key, e.target.value)} placeholder="—" inputMode="decimal"/><span>{unit}</span></div></label>)}</div>
              <div className="safety-inline"><AlertTriangle size={16}/><span>Lengkapi tanda vital dan pemeriksaan fisik sebelum menyimpulkan kondisi pasien.</span></div>
              <button className="primary" type="button" onClick={() => setStep(3)}>Lanjut ke Analisis <ArrowRight size={15}/></button>
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 04 · DECISION SUPPORT</p><h2>Clinical Reasoning</h2><span>Output diperbarui berdasarkan keluhan, jawaban anamnesis, dan data objektif yang tersedia.</span></div><button className="info-button" type="button" onClick={() => setShowDetails(v => !v)}><Info size={15}/> Bagaimana ini bekerja?</button></div>
              <div className="reason-banner"><div className="reason-icon"><Stethoscope size={18}/></div><div><b>{engine.differentials.length > 1 ? "Beberapa pertimbangan klinis terdeteksi." : "Data belum cukup untuk pertimbangan spesifik."}</b><span>Sistem menjelaskan alasan dan data yang masih kosong tanpa membuat probabilitas diagnosis palsu.</span></div></div>
              {engine.differentials.map((d, i) => <button key={d.name} type="button" className={selected.name === d.name ? "ddx selected" : "ddx"} onClick={() => setSelectedDx(d.name)}><span className="ddx-rank">{i + 1}</span><div><b>{d.name}</b><span>{d.reason}</span><small>{d.tags.join(" · ")}</small></div><em>{d.level}</em><ArrowRight size={15}/></button>)}
              {showDetails && <div className="explanation"><b>Prinsip engine</b><p>Rules V2 bersifat transparan dan deterministik. Output adalah decision support, bukan diagnosis otomatis. Tidak ada skor/probabilitas dan dokter tetap mengonfirmasi diagnosis kerja.</p></div>}
              <div className="selected-plan"><div><p className="clinical-eyebrow">DIAGNOSIS KERJA</p><h3>{selected.name}</h3><span>{selected.reason}</span></div><select value={selected.name} onChange={e => setSelectedDx(e.target.value)}>{engine.differentials.map(x => <option key={x.name}>{x.name}</option>)}</select></div>
              <div className="missing-panel"><b>Data yang masih perlu dilengkapi</b>{engine.missing.length ? engine.missing.slice(0, 8).map(item => <div key={item}><AlertTriangle size={14}/><span>{item}</span></div>) : <div><Check size={14}/><span>Data pada rules V2 sudah lebih lengkap untuk direview.</span></div>}</div>
              <div className={`disposition-box ${engine.disposition.status}`}><div><p className="clinical-eyebrow">DISPOSITION SUPPORT</p><h3>{engine.disposition.title}</h3><span>{engine.disposition.reason}</span></div>{engine.disposition.triggers.length > 0 && <div className="trigger-list">{engine.disposition.triggers.map(t => <span key={t}>• {t}</span>)}</div>}</div>
              <button className="primary" type="button" onClick={() => setStep(4)}>Susun Clinical Plan <ArrowRight size={15}/></button>
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 05</p><h2>Clinical Plan</h2></div><span className="status green">Review dokter</span></div>
              <div className="plan-section"><h4><ClipboardCheck size={15}/> Pemeriksaan yang dipertimbangkan</h4>{engine.investigations.map(item => <div className="plan-row" key={item.name}><Check size={15}/><div><b>{item.name}</b><span>{item.reason}</span></div><em className={`priority ${item.priority.toLowerCase()}`}>{item.priority}</em></div>)}</div>
              <div className="plan-section"><h4><Pill size={15}/> Tatalaksana</h4>{engine.management.map(item => <div className="plan-row" key={item}><ShieldCheck size={15}/><div><b>Clinical consideration</b><span>{item}</span></div></div>)}</div>
              <div className="plan-section"><h4><ShieldCheck size={15}/> Medication safety</h4>{engine.medicationSafety.map(item => <div className="plan-row" key={item}><ShieldCheck size={15}/><div><b>Safety check</b><span>{item}</span></div></div>)}</div>
              {engine.redFlags.map(flag => <div className="red-flag" key={flag}><AlertTriangle size={17}/><div><b>Red flags / rujuk</b><span>{flag}</span></div></div>)}
              <div className="action-row"><button className="secondary" type="button" onClick={() => setShowSoap(v => !v)}>Lihat SOAP draft</button><button className={reviewed ? "reviewed" : "primary"} type="button" onClick={() => setReviewed(true)}>{reviewed ? <><Check size={15}/> Reviewed</> : <>Review & Simpan RME <ArrowRight size={15}/></>}</button></div>
              {showSoap && <div className="soap-panel"><div><b>S — Subjective</b><p>{engine.soap.subjective}</p></div><div><b>O — Objective</b><p>{engine.soap.objective}</p></div><div><b>A — Assessment</b><p>{engine.soap.assessment}</p></div><div><b>P — Plan</b><p>{engine.soap.plan}</p></div></div>}
            </div>
          </section>

          <aside className="clinical-side">
            <div className="clinical-card sticky-card"><div className="side-heading"><div><p className="clinical-eyebrow">PATIENT CONTEXT</p><h3>{patient.name}</h3></div><span className="age-badge">{patient.age} th</span></div><div className="context-row"><span>Keluhan</span><b>{hasComplaintSummary(complaint)}</b></div><div className="context-row"><span>Diagnosis kerja</span><b>{selected.name}</b></div><div className="context-row"><span>Disposition</span><b className={engine.disposition.status === "stabilize-first" ? "warning-text" : "ok"}>{engine.disposition.title}</b></div><div className="context-row"><span>Data vital</span><b className={vitalsComplete ? "ok" : "warning-text"}>{vitalsComplete ? "Lengkap" : "Belum lengkap"}</b></div></div>
            <div className="clinical-card"><div className="side-heading"><div><p className="clinical-eyebrow">SAFETY CHECK</p><h3>Sebelum finalisasi</h3></div><ShieldCheck size={18} className="shield"/></div><div className="check-item"><span className={vitalsComplete ? "check ok" : "check"}>{vitalsComplete ? <Check size={11}/> : "!"}</span><div><b>Tanda vital</b><span>{vitalsComplete ? "Sudah diisi" : "Wajib dilengkapi"}</span></div></div><div className="check-item"><span className={engine.redFlags.length ? "check" : "check ok"}>{engine.redFlags.length ? "!" : <Check size={11}/>}</span><div><b>Red flags</b><span>{engine.redFlags.length ? "Perlu review" : "Tidak ada sinyal aktif"}</span></div></div><div className="check-item"><span className="check">!</span><div><b>Medication safety</b><span>Cek alergi & kontraindikasi</span></div></div><div className="check-item"><span className={Object.keys(answers).length === engine.questions.length ? "check ok" : "check"}>{Object.keys(answers).length === engine.questions.length ? <Check size={11}/> : "!"}</span><div><b>Anamnesis</b><span>{Object.keys(answers).length === engine.questions.length ? "Pertanyaan ditinjau" : "Masih ada yang belum dijawab"}</span></div></div></div>
            <div className="clinical-card evidence-card"><p className="clinical-eyebrow">ENGINE AWARE</p><h3>Rules + auditability</h3><p>Version {engine.engineVersion}. Setiap output dapat ditelusuri ke rule dan input yang digunakan pada workspace ini.</p><button type="button" onClick={() => alert(`Clinical engine ${engine.engineVersion} · mode ${engine.mode}`)}>Lihat engine info <ArrowRight size={14}/></button></div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function hasComplaintSummary(complaint: string) {
  const normalized = complaint.trim();
  if (!normalized) return "Belum diisi";
  return normalized.length > 42 ? `${normalized.slice(0, 42)}…` : normalized;
}
