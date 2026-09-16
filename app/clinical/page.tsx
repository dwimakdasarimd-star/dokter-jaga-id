"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronDown, ClipboardCheck, FileText, HeartPulse, Info, Pill, ShieldCheck, Stethoscope, X } from "lucide-react";

const steps = ["Keluhan", "Anamnesis", "Pemeriksaan", "Analisis", "Rencana"];

const ddx = [
  { name: "Dengue fever", reason: "Demam akut + sakit kepala + mialgia", level: "Pertimbangkan kuat" },
  { name: "Infeksi virus non-spesifik", reason: "Sindrom demam akut tanpa fokus jelas", level: "Masih mungkin" },
  { name: "Demam tifoid", reason: "Demam dengan gejala gastrointestinal", level: "Pertimbangkan" },
];

const investigations = [
  ["Tanda vital lengkap", "Wajib sebelum keputusan tatalaksana"],
  ["Darah lengkap", "Bantu evaluasi trombosit, leukosit, hematokrit"],
  ["Hematokrit serial", "Pertimbangkan bila dengue masih dicurigai"],
];

export default function ClinicalWorkspace() {
  const [step, setStep] = useState(0);
  const [complaint, setComplaint] = useState("Pasien demam sejak 3 hari, disertai sakit kepala dan nyeri badan. Tidak ada batuk. Mual ada, muntah tidak.");
  const [selectedDx, setSelectedDx] = useState(ddx[0].name);
  const [vitals, setVitals] = useState({ bp: "", hr: "", rr: "", temp: "", spo2: "" });
  const [questions, setQuestions] = useState<string[]>([]);
  const [reviewed, setReviewed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const selected = useMemo(() => ddx.find(x => x.name === selectedDx) ?? ddx[0], [selectedDx]);
  const vitalsComplete = Object.values(vitals).every(Boolean);

  const toggleQuestion = (q: string) => setQuestions(prev => prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q]);

  return (
    <main className="clinical-v1">
      <header className="clinical-topbar">
        <a href="/" className="back-link"><ArrowLeft size={16}/> Dashboard</a>
        <div className="clinical-brand"><div className="clinical-mark"><HeartPulse size={18}/></div><div><b>Dokter Jaga</b><span>Clinical Assistant</span></div></div>
        <div className="encounter-meta"><span className="live-dot"/> Encounter aktif · RM-001248</div>
      </header>

      <div className="clinical-body">
        <section className="clinical-header">
          <div><p className="clinical-eyebrow">NEW CLINICAL ENCOUNTER</p><h1>Analisis Kasus</h1><p>Gunakan sistem untuk menyusun informasi klinis. Setiap saran tetap perlu ditinjau dan diputuskan dokter.</p></div>
          <div className="patient-mini"><div className="patient-initial">BS</div><div><b>Budi Santoso</b><span>Laki-laki · 45 tahun · RM-001248</span></div><button>Edit</button></div>
        </section>

        <nav className="clinical-stepper">{steps.map((label, i) => <button key={label} onClick={() => setStep(i)} className={i === step ? "active" : i < step ? "done" : ""}><span>{i < step ? <Check size={12}/> : i + 1}</span>{label}</button>)}</nav>

        <div className="clinical-layout">
          <section className="clinical-main">
            <div className="clinical-card input-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 01</p><h2>Keluhan & Gambaran Awal</h2></div><span className="status">Draft</span></div>
              <label className="field-label">Keluhan awal pasien<textarea value={complaint} onChange={e => setComplaint(e.target.value)} /></label>
              <div className="quick-tags"><span>Demam 3 hari</span><span>Sakit kepala</span><span>Mialgia</span><span>Mual</span></div>
              <div className="action-row"><button className="secondary">🎙️ Input suara</button><button className="secondary" onClick={() => setComplaint("")}>Reset</button><button className="primary" onClick={() => setStep(1)}>Strukturkan Kasus <ArrowRight size={15}/></button></div>
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 02</p><h2>Anamnesis Terarah</h2><span>Prioritaskan informasi yang dapat mengubah keputusan klinis.</span></div><span className="status blue">4 pertanyaan</span></div>
              <div className="question-list">{["Ada ruam atau kemerahan kulit?", "Ada perdarahan gusi, hidung, atau mudah memar?", "Ada nyeri perut atau muntah persisten?", "Ada penurunan kesadaran, lemas berat, atau sesak?"] .map(q => <label key={q} className="clinical-question"><input type="checkbox" checked={questions.includes(q)} onChange={() => toggleQuestion(q)}/><span>{q}</span></label>)}</div>
              <button className="primary" onClick={() => setStep(2)}>Lanjut ke Pemeriksaan <ArrowRight size={15}/></button>
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 03</p><h2>Pemeriksaan & Tanda Vital</h2></div><span className={vitalsComplete ? "status green" : "status amber"}>{vitalsComplete ? "Lengkap" : "Belum lengkap"}</span></div>
              <div className="vital-grid">{([["bp","TD","mmHg"],["hr","Nadi","/menit"],["rr","RR","/menit"],["temp","Suhu","°C"],["spo2","SpO₂","%"]] as const).map(([key,label,unit]) => <label key={key}>{label}<div><input value={vitals[key]} onChange={e => setVitals({...vitals,[key]:e.target.value})} placeholder="—"/><span>{unit}</span></div></label>)}</div>
              <div className="safety-inline"><AlertTriangle size={16}/><span>Lengkapi tanda vital dan pemeriksaan fisik sebelum menyimpulkan kondisi pasien.</span></div>
              <button className="primary" onClick={() => setStep(3)}>Lanjut ke Analisis <ArrowRight size={15}/></button>
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 04 · DECISION SUPPORT</p><h2>Clinical Reasoning</h2><span>Saran disusun dari data yang tersedia, bukan diagnosis otomatis.</span></div><button className="info-button" onClick={() => setShowDetails(!showDetails)}><Info size={15}/> Bagaimana ini bekerja?</button></div>
              <div className="reason-banner"><div className="reason-icon"><Stethoscope size={18}/></div><div><b>Data saat ini mendukung beberapa kemungkinan.</b><span>Tambahkan data yang belum tersedia untuk mempersempit pertimbangan klinis.</span></div></div>
              {ddx.map((d, i) => <button key={d.name} className={selectedDx === d.name ? "ddx selected" : "ddx"} onClick={() => setSelectedDx(d.name)}><span className="ddx-rank">{i + 1}</span><div><b>{d.name}</b><span>{d.reason}</span></div><em>{d.level}</em><ArrowRight size={15}/></button>)}
              {showDetails && <div className="explanation"><b>Mengapa ditampilkan?</b><p>Clinical Decision Support sebaiknya menyampaikan informasi yang relevan pada titik workflow yang tepat, dengan alasan yang dapat ditinjau dokter. Sistem ini tidak menggantikan keputusan klinis.</p></div>}
              <div className="selected-plan"><div><p className="clinical-eyebrow">DIAGNOSIS KERJA</p><h3>{selected.name}</h3><span>{selected.reason}</span></div><select value={selectedDx} onChange={e => setSelectedDx(e.target.value)}>{ddx.map(x => <option key={x.name}>{x.name}</option>)}</select></div>
              <button className="primary" onClick={() => setStep(4)}>Susun Clinical Plan <ArrowRight size={15}/></button>
            </div>

            <div className="clinical-card">
              <div className="card-title"><div><p className="clinical-eyebrow">STEP 05</p><h2>Clinical Plan</h2></div><span className="status green">Review dokter</span></div>
              <div className="plan-section"><h4><ClipboardCheck size={15}/> Pemeriksaan yang dipertimbangkan</h4>{investigations.map(([name,desc]) => <div className="plan-row" key={name}><Check size={15}/><div><b>{name}</b><span>{desc}</span></div><button>Review</button></div>)}</div>
              <div className="plan-section"><h4><Pill size={15}/> Tatalaksana</h4><div className="plan-row"><ShieldCheck size={15}/><div><b>Supportive care & monitoring</b><span>Hidrasi sesuai status klinis, antipiretik bila sesuai, dan monitoring.</span></div><button>Review</button></div></div>
              <div className="red-flag"><AlertTriangle size={17}/><div><b>Red flags / rujuk</b><span>Evaluasi perdarahan, syok, gangguan kesadaran, distress napas, dan tanda bahaya lain sebelum keputusan pulang.</span></div></div>
              <div className="action-row"><button className="secondary">Edit Plan</button><button className={reviewed ? "reviewed" : "primary"} onClick={() => setReviewed(true)}>{reviewed ? <><Check size={15}/> Reviewed</> : <>Review & Simpan RME <ArrowRight size={15}/></>}</button></div>
            </div>
          </section>

          <aside className="clinical-side">
            <div className="clinical-card sticky-card"><div className="side-heading"><div><p className="clinical-eyebrow">PATIENT CONTEXT</p><h3>Budi Santoso</h3></div><span className="age-badge">45 th</span></div><div className="context-row"><span>Keluhan</span><b>Demam 3 hari</b></div><div className="context-row"><span>Diagnosis kerja</span><b>{selected.name}</b></div><div className="context-row"><span>Data vital</span><b className={vitalsComplete ? "ok" : "warning-text"}>{vitalsComplete ? "Lengkap" : "Belum ada"}</b></div></div>
            <div className="clinical-card"><div className="side-heading"><div><p className="clinical-eyebrow">SAFETY CHECK</p><h3>Sebelum finalisasi</h3></div><ShieldCheck size={18} className="shield"/></div><div className="check-item"><span className={vitalsComplete ? "check ok" : "check"}>{vitalsComplete ? <Check size={11}/> : "!"}</span><div><b>Tanda vital</b><span>{vitalsComplete ? "Sudah diisi" : "Wajib dilengkapi"}</span></div></div><div className="check-item"><span className="check">!</span><div><b>Red flags</b><span>Pastikan sudah dinilai</span></div></div><div className="check-item"><span className="check">!</span><div><b>Medication safety</b><span>Cek alergi & kontraindikasi</span></div></div></div>
            <div className="clinical-card evidence-card"><p className="clinical-eyebrow">EVIDENCE AWARE</p><h3>Why this matters</h3><p>CDS dirancang untuk memberikan informasi yang relevan pada orang, format, channel, dan waktu yang tepat dalam workflow.</p><button onClick={() => alert("Evidence panel: sumber guideline akan dihubungkan pada knowledge base berikutnya.")}>Lihat sumber <ArrowRight size={14}/></button></div>
          </aside>
        </div>
      </div>
    </main>
  );
}
