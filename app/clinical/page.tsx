"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ClipboardCheck, HeartPulse, Info, Pill, ShieldCheck, Stethoscope } from "lucide-react";
import { runClinicalEngine, type Vitals } from "../../lib/clinical-engine";

const steps = ["Keluhan", "Anamnesis", "Pemeriksaan", "Analisis", "Rencana"];

export default function ClinicalWorkspace() {
  const [step, setStep] = useState(0);
  const [complaint, setComplaint] = useState("Pasien demam sejak 3 hari, disertai sakit kepala dan nyeri badan. Tidak ada batuk. Mual ada, muntah tidak.");
  const [vitals, setVitals] = useState<Vitals>({ bp: "", hr: "", rr: "", temp: "", spo2: "" });
  const [questions, setQuestions] = useState<string[]>([]);
  const [selectedDx, setSelectedDx] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showSoap, setShowSoap] = useState(false);

  const engine = useMemo(() => runClinicalEngine({ complaint, vitals, reviewedQuestions: questions }), [complaint, vitals, questions]);
  const selected = engine.differentials.find(d => d.name === selectedDx) ?? engine.differentials[0];
  const vitalsComplete = Object.values(vitals).every(Boolean);

  const toggleQuestion = (q: string) => setQuestions(prev => prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q]);
  const updateVital = (key: keyof Vitals, value: string) => setVitals(prev => ({ ...prev, [key]: value }));

  return (
    <main className="clinical-v1">
      <header className="clinical-topbar">
        <a href="/" className="back-link"><ArrowLeft size={16}/> Dashboard</a>
        <div className="clinical-brand"><div className="clinical-mark"><HeartPulse size={18}/></div><div><b>Dokter Jaga</b><span>Clinical Assistant</span></div></div>
        <div className="encounter-meta"><span className="live-dot"/> Encounter aktif · RM-001248</div>
      </header>

      <div className="clinical-body">
        <section className="clinical-header">
          <div><p className="clinical-eyebrow">NEW CLINICAL ENCOUNTER</p><h1>Analisis Kasus</h1><p>Clinical Decision Support berbasis rules: sistem menyusun informasi dan pertimbangan, dokter tetap mengambil keputusan klinis.</p></div>
          <div className="patient-mini"><div className="patient-initial">BS</div><div><b>Budi Santoso</b><span>Laki-laki · 45 tahun · RM-001248</span></div><button>Edit</button></div>
        </section>

        <nav className="clinical-stepper">{steps.map((label, i) => <button key={label} onClick={() => setStep(i)} className={i === step ? "active" : i < step ? "done" : ""}><span>{i < step ? <Check size={12}/> : i + 1}</span>{label}</button>)}</nav>

        <div className="clinical-layout">
          <section className="clinical-main">
            <div className="clinical-card input-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 01</p><h2>Keluhan & Gambaran Awal</h2></div><span className="status">Rules {engine.engineVersion}</span></div>
              <label className="field-label">Keluhan awal pasien<textarea value={complaint} onChange={e => setComplaint(e.target.value)} placeholder="Tulis keluhan dan gambaran awal pasien..." /></label>
              <div className="quick-tags">{engine.extracted.length ? engine.extracted.map(tag => <span key={tag}>{tag}</span>) : <span>Belum ada temuan terstruktur</span>}</div>
              <div className="action-row"><button className="secondary" type="button">🎙️ Input suara</button><button className="secondary" type="button" onClick={() => setComplaint("")}>Reset</button><button className="primary" type="button" onClick={() => setStep(1)}>Strukturkan Kasus <ArrowRight size={15}/></button></div>
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 02</p><h2>Anamnesis Terarah</h2><span>Prioritaskan informasi yang dapat mengubah keputusan klinis.</span></div><span className={engine.missing.length ? "status amber" : "status green"}>{engine.questions.length} pertanyaan</span></div>
              <div className="question-list">{engine.questions.map(q => <label key={q} className="clinical-question"><input type="checkbox" checked={questions.includes(q)} onChange={() => toggleQuestion(q)}/><span>{q}</span></label>)}</div>
              <button className="primary" type="button" onClick={() => setStep(2)}>Lanjut ke Pemeriksaan <ArrowRight size={15}/></button>
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 03</p><h2>Pemeriksaan & Tanda Vital</h2></div><span className={vitalsComplete ? "status green" : "status amber"}>{vitalsComplete ? "Lengkap" : "Belum lengkap"}</span></div>
              <div className="vital-grid">{([ ["bp","TD","mmHg"], ["hr","Nadi","/menit"], ["rr","RR","/menit"], ["temp","Suhu","°C"], ["spo2","SpO₂","%"] ] as const).map(([key,label,unit]) => <label key={key}>{label}<div><input value={vitals[key] ?? ""} onChange={e => updateVital(key, e.target.value)} placeholder="—" inputMode="decimal"/><span>{unit}</span></div></label>)}</div>
              <div className="safety-inline"><AlertTriangle size={16}/><span>Lengkapi tanda vital dan pemeriksaan fisik sebelum menyimpulkan kondisi pasien.</span></div>
              <button className="primary" type="button" onClick={() => setStep(3)}>Lanjut ke Analisis <ArrowRight size={15}/></button>
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 04 · DECISION SUPPORT</p><h2>Clinical Reasoning</h2><span>Hasil engine berubah mengikuti data yang tersedia.</span></div><button className="info-button" type="button" onClick={() => setShowDetails(v => !v)}><Info size={15}/> Bagaimana ini bekerja?</button></div>
              <div className="reason-banner"><div className="reason-icon"><Stethoscope size={18}/></div><div><b>{engine.differentials.length > 1 ? "Beberapa pertimbangan klinis terdeteksi." : "Data belum cukup untuk pertimbangan spesifik."}</b><span>Review alasan, data yang masih kosong, dan pertanyaan yang belum ditinjau.</span></div></div>
              {engine.differentials.map((d, i) => <button key={d.name} type="button" className={selected.name === d.name ? "ddx selected" : "ddx"} onClick={() => setSelectedDx(d.name)}><span className="ddx-rank">{i + 1}</span><div><b>{d.name}</b><span>{d.reason}</span><small>{d.tags.join(" · ")}</small></div><em>{d.level}</em><ArrowRight size={15}/></button>)}
              {showDetails && <div className="explanation"><b>Mengapa ditampilkan?</b><p>Engine V1 memakai rule sederhana yang dapat ditelusuri. Tidak ada probabilitas klinis palsu, dan diagnosis maupun tatalaksana tidak ditetapkan otomatis.</p></div>}
              <div className="selected-plan"><div><p className="clinical-eyebrow">DIAGNOSIS KERJA</p><h3>{selected.name}</h3><span>{selected.reason}</span></div><select value={selected.name} onChange={e => setSelectedDx(e.target.value)}>{engine.differentials.map(x => <option key={x.name}>{x.name}</option>)}</select></div>
              <div className="missing-panel"><b>Data yang masih perlu dilengkapi</b>{engine.missing.length ? engine.missing.slice(0, 6).map(item => <div key={item}><AlertTriangle size={14}/><span>{item}</span></div>) : <div><Check size={14}/><span>Belum ada informasi penting yang terdeteksi kosong oleh rules V1.</span></div>}</div>
              <button className="primary" type="button" onClick={() => setStep(4)}>Susun Clinical Plan <ArrowRight size={15}/></button>
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 05</p><h2>Clinical Plan</h2></div><span className="status green">Review dokter</span></div>
              <div className="plan-section"><h4><ClipboardCheck size={15}/> Pemeriksaan yang dipertimbangkan</h4>{engine.investigations.map(item => <div className="plan-row" key={item.name}><Check size={15}/><div><b>{item.name}</b><span>{item.reason}</span></div><button type="button">Review</button></div>)}</div>
              <div className="plan-section"><h4><Pill size={15}/> Tatalaksana</h4>{engine.management.map(item => <div className="plan-row" key={item}><ShieldCheck size={15}/><div><b>Clinical consideration</b><span>{item}</span></div><button type="button">Review</button></div>)}</div>
              <div className="plan-section"><h4><ShieldCheck size={15}/> Medication safety</h4>{engine.medicationSafety.map(item => <div className="plan-row" key={item}><ShieldCheck size={15}/><div><b>Safety check</b><span>{item}</span></div><button type="button">Review</button></div>)}</div>
              {engine.redFlags.map(flag => <div className="red-flag" key={flag}><AlertTriangle size={17}/><div><b>Red flags / rujuk</b><span>{flag}</span></div></div>)}
              <div className="action-row"><button className="secondary" type="button" onClick={() => setShowSoap(v => !v)}>Lihat SOAP draft</button><button className={reviewed ? "reviewed" : "primary"} type="button" onClick={() => setReviewed(true)}>{reviewed ? <><Check size={15}/> Reviewed</> : <>Review & Simpan RME <ArrowRight size={15}/></>}</button></div>
              {showSoap && <div className="soap-panel"><div><b>S — Subjective</b><p>{engine.soap.subjective}</p></div><div><b>O — Objective</b><p>{engine.soap.objective}</p></div><div><b>A — Assessment</b><p>{engine.soap.assessment}</p></div><div><b>P — Plan</b><p>{engine.soap.plan}</p></div></div>}
            </div>
          </section>

          <aside className="clinical-side">
            <div className="clinical-card sticky-card"><div className="side-heading"><div><p className="clinical-eyebrow">PATIENT CONTEXT</p><h3>Budi Santoso</h3></div><span className="age-badge">45 th</span></div><div className="context-row"><span>Keluhan</span><b>Demam 3 hari</b></div><div className="context-row"><span>Diagnosis kerja</span><b>{selected.name}</b></div><div className="context-row"><span>Data vital</span><b className={vitalsComplete ? "ok" : "warning-text"}>{vitalsComplete ? "Lengkap" : `${engine.missing.filter(x => ["Tekanan darah","Nadi","Frekuensi napas","Suhu","SpO₂"].includes(x)).length} belum diisi`}</b></div></div>
            <div className="clinical-card"><div className="side-heading"><div><p className="clinical-eyebrow">SAFETY CHECK</p><h3>Sebelum finalisasi</h3></div><ShieldCheck size={18} className="shield"/></div><div className="check-item"><span className={vitalsComplete ? "check ok" : "check"}>{vitalsComplete ? <Check size={11}/> : "!"}</span><div><b>Tanda vital</b><span>{vitalsComplete ? "Sudah diisi" : "Wajib dilengkapi"}</span></div></div><div className="check-item"><span className={engine.missing.some(x => x.includes("Red flags")) ? "check" : "check ok"}>{engine.missing.some(x => x.includes("Red flags")) ? "!" : <Check size={11}/>}</span><div><b>Red flags</b><span>{engine.redFlags.length ? "Perlu review" : "Tidak ada rule red flag aktif"}</span></div></div><div className="check-item"><span className="check">!</span><div><b>Medication safety</b><span>Cek alergi & kontraindikasi</span></div></div></div>
            <div className="clinical-card evidence-card"><p className="clinical-eyebrow">ENGINE AWARE</p><h3>Rules + auditability</h3><p>Version {engine.engineVersion}. Setiap output dapat ditelusuri kembali ke rule yang aktif pada V1.</p><button type="button" onClick={() => alert(`Clinical engine ${engine.engineVersion} · mode ${engine.mode}`)}>Lihat engine info <ArrowRight size={14}/></button></div>
          </aside>
        </div>
      </div>
    </main>
  );
}
