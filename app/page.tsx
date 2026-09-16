"use client";

import { useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, Bell, BookOpen, CalendarDays, Check, ChevronDown,
  ClipboardList, FileText, HeartPulse, LayoutDashboard, Menu, Pill, Plus, Search, Settings,
  ShieldCheck, Stethoscope, UsersRound, X, Save, RotateCcw
} from "lucide-react";

const nav = [
  { icon: LayoutDashboard, label: "Beranda" },
  { icon: UsersRound, label: "Pasien" },
  { icon: FileText, label: "Rekam Medis" },
  { icon: Pill, label: "Resep" },
  { icon: Stethoscope, label: "Clinical Assistant" },
  { icon: Activity, label: "Tools" },
  { icon: BookOpen, label: "Template" },
];

const steps = ["Keluhan", "Anamnesis", "Pemeriksaan", "Analisis", "Rencana"];
const patients = [
  ["Budi Santoso", "Demam, nyeri kepala", "09:00", "R.1"],
  ["Siti Rahma", "Kontrol Hipertensi", "09:30", "R.2"],
  ["Andi Wijaya", "Batuk, sesak", "10:00", "R.3"],
  ["Dewi Lestari", "Nyeri perut", "10:30", "R.4"],
];
const differentialDiagnoses = [
  { name: "Dengue Fever", relevance: "Perlu dipertimbangkan", tags: ["Demam akut", "Sakit kepala", "Nyeri badan"] },
  { name: "Infeksi viral", relevance: "Masih mungkin", tags: ["Demam akut", "Nyeri badan"] },
  { name: "Demam tifoid", relevance: "Pertimbangkan", tags: ["Demam > 3 hari", "Paparan makanan"] },
];
const tests = [
  ["Darah lengkap", "Evaluasi leukosit, hematokrit, trombosit", "Disarankan"],
  ["Hematokrit & trombosit", "Baseline dan pemantauan sesuai kondisi", "Disarankan"],
  ["Fungsi hati", "Pertimbangkan bila ada indikasi klinis", "Pertimbangan"],
];

export default function Home() {
  const [activeNav, setActiveNav] = useState("Beranda");
  const [activeStep, setActiveStep] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedDx, setSelectedDx] = useState("Dengue Fever");
  const [signed, setSigned] = useState(false);
  const [showPatient, setShowPatient] = useState(false);
  const [showRx, setShowRx] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [complaint, setComplaint] = useState("Pasien demam sejak 3 hari, disertai sakit kepala dan nyeri badan. Tidak ada batuk. Mual ada, muntah tidak.");
  const [patientName, setPatientName] = useState("Budi Santoso");

  const filteredPatients = useMemo(() => patients.filter(p => p[0].toLowerCase().includes(query.toLowerCase())), [query]);

  const analyze = () => {
    setActiveStep(1);
    setTimeout(() => setActiveStep(3), 250);
  };

  const resetCase = () => {
    setComplaint("");
    setActiveStep(0);
    setSelectedDx("Dengue Fever");
    setSigned(false);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">D</div><div><strong>Dokter Jaga</strong><span>Clinical Intelligence</span></div></div>
        <div className="doctor-mini"><div className="avatar">DP</div><div><b>dr. Dwi Pratama</b><small>Dokter Umum</small></div><ChevronDown size={14}/></div>
        <nav>{nav.map(({ icon: Icon, label }) => <button key={label} className={activeNav === label ? "nav-item active" : "nav-item"} onClick={() => setActiveNav(label)}><Icon size={17}/><span>{label}</span>{label === "Clinical Assistant" && <i>AI</i>}</button>)}</nav>
        <div className="sidebar-bottom"><button className="nav-item"><CalendarDays size={17}/>Jadwal</button><button className="nav-item"><ClipboardList size={17}/>Laporan</button><button className="nav-item"><Settings size={17}/>Pengaturan</button></div>
      </aside>

      <section className="content">
        <header className="topbar">
          <button className="mobile-menu"><Menu size={20}/></button>
          <div className="search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari pasien, obat, diagnosis, atau tools..."/></div>
          <div className="top-actions"><button className="icon-btn"><Bell size={18}/><em/></button><div className="top-doctor"><div className="avatar small">DP</div><span>dr. Dwi</span></div></div>
        </header>

        <div className="page-head"><div><p className="eyebrow">CLINICAL WORKSPACE</p><h1>Selamat pagi, Dokter.</h1><p className="muted">Ruang kerja klinis untuk membantu Anda mengambil keputusan dan mendokumentasikannya.</p></div><div className="date-pill"><CalendarDays size={16}/> Rabu, 16 September 2026</div></div>

        {activeNav === "Beranda" && <>
          <section className="quick-grid">
            <button className="quick-card" onClick={() => setShowPatient(true)}><div className="quick-icon blue"><Plus/></div><div><b>Pasien Baru</b><span>Buat rekam medis</span></div></button>
            <button className="quick-card" onClick={() => setQuery("")}><div className="quick-icon teal"><Search/></div><div><b>Cari Pasien</b><span>Lihat riwayat</span></div></button>
            <button className="quick-card" onClick={() => setShowRx(true)}><div className="quick-icon purple"><Pill/></div><div><b>Buat Resep</b><span>Dosis & obat</span></div></button>
            <button className="quick-card featured" onClick={() => { setActiveNav("Clinical Assistant"); setActiveStep(0); }}><div className="quick-icon indigo"><HeartPulse/></div><div><b>Clinical Assistant</b><span>Analisis kasus</span></div><ArrowRight size={16}/></button>
          </section>

          <div className="workspace-grid">
            <section className="panel patient-panel">
              <div className="panel-head"><div><h2>Pasien Hari Ini</h2><p>4 encounter terjadwal</p></div><button className="text-btn" onClick={() => setActiveNav("Pasien")}>Lihat Semua →</button></div>
              {filteredPatients.map(p=><button className="patient-row" key={p[0]} onClick={() => { setPatientName(p[0]); setActiveNav("Clinical Assistant"); }}><div className="patient-avatar">{p[0].split(" ").map(x=>x[0]).join("")}</div><div className="patient-info"><b>{p[0]}</b><span>{p[1]}</span></div><span className="patient-time">{p[2]}<small>{p[3]}</small></span></button>)}
            </section>
            <section className="panel stats-panel"><div className="panel-head"><div><h2>Ringkasan Bulan Ini</h2><p>Aktivitas klinis</p></div></div><div className="stat-grid"><div><b>124</b><span>Total Pasien</span></div><div><b>8</b><span>Pasien Baru</span></div><div><b>62</b><span>Resep Dibuat</span></div><div><b>12</b><span>Surat Rujukan</span></div></div><div className="trust-note"><ShieldCheck size={17}/><span>Dokter tetap memegang keputusan klinis.</span></div></section>
          </div>
        </>}

        {activeNav === "Pasien" && <section className="panel assistant" style={{marginTop:12}}>
          <div className="assistant-head"><div><p className="eyebrow">PATIENT DIRECTORY</p><h2>Daftar Pasien</h2><span>Prototype database pasien lokal — siap dihubungkan ke Supabase.</span></div><button className="primary" onClick={() => setShowPatient(true)}><Plus size={15}/> Pasien Baru</button></div>
          <div className="clinical-input" style={{marginTop:14}}><div className="search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari nama pasien..."/></div></div>
          {filteredPatients.map(p=><div className="patient-row" key={p[0]}><div className="patient-avatar">{p[0].split(" ").map(x=>x[0]).join("")}</div><div className="patient-info"><b>{p[0]}</b><span>{p[1]}</span></div><button className="text-btn" onClick={()=>{setPatientName(p[0]);setActiveNav("Clinical Assistant")}}>Buka Encounter →</button></div>)}
        </section>}

        {activeNav === "Clinical Assistant" && <section className="assistant panel">
          <div className="assistant-head"><div className="assistant-title"><div className="ai-orb"><HeartPulse size={21}/></div><div><p className="eyebrow">CLINICAL ASSISTANT</p><h2>Encounter · {patientName}</h2><span>Keluhan → anamnesis → pemeriksaan → analisis → rencana. Review setiap saran sebelum digunakan.</span></div></div><span className="demo-badge">V1 · DOCTOR-IN-THE-LOOP</span></div>
          <div className="patient-banner"><div className="patient-avatar large">BS</div><div><b>{patientName}</b><span>Laki-laki · 45 tahun · RM-001248</span></div><button className="edit-btn" onClick={()=>setShowPatient(true)}>Edit pasien</button></div>
          <div className="stepper">{steps.map((s,i)=><button key={s} onClick={()=>setActiveStep(i)} className={i===activeStep?"step active":i<activeStep?"step done":"step"}><span>{i<activeStep?<Check size={13}/>:i+1}</span>{s}</button>)}</div>

          <div className="clinical-input"><div className="input-label"><b>Keluhan awal pasien</b><span>Masukkan dengan bahasa klinis bebas</span></div><textarea value={complaint} onChange={e=>setComplaint(e.target.value)} placeholder="Contoh: demam 3 hari disertai sakit kepala..."/><div className="input-tools"><button>🎙️ Rekam Suara</button><button onClick={()=>setComplaint("Pasien demam 3 hari, sakit kepala, nyeri badan, mual. Tidak ada batuk atau muntah.")}>Contoh Kasus</button><button onClick={resetCase}><RotateCcw size={12}/> Reset</button><button className="primary" onClick={analyze}>Analisis Kasus <ArrowRight size={16}/></button></div></div>

          <div className="analysis-grid">
            <div className="analysis-main">
              <div className="section-title"><div><p className="eyebrow">STEP 01 · ANAMNESIS TERARAH</p><h3>Informasi Klinis</h3></div><span className="status-chip">Review diperlukan</span></div>
              <div className="info-columns"><div><h4>Informasi terdeteksi</h4>{["Demam · 3 hari","Sakit kepala","Nyeri badan","Mual","Tidak batuk","Tidak muntah"].map(x=><div className="check-line" key={x}><Check size={14}/>{x}</div>)}</div><div><h4>Pertanyaan yang mungkin relevan</h4>{["Apakah ada ruam?","Apakah ada perdarahan gusi/hidung?","Apakah nyeri perut?","Apakah ada penurunan kesadaran?"].map(x=><label className="question" key={x}><input type="checkbox"/>{x}</label>)}</div><div className="missing"><h4>Wajib dilengkapi</h4>{["Tanda vital","Status hidrasi","Riwayat penyakit","Pemeriksaan fisik"].map(x=><div key={x}>◆ {x}</div>)}</div></div>

              <div className="section-title dx-title"><div><p className="eyebrow">STEP 02 · CLINICAL REASONING</p><h3>Diagnosis Banding</h3></div><button className="text-btn">Evidence / Guideline →</button></div>
              {differentialDiagnoses.map((d,i)=><button key={d.name} className={selectedDx===d.name?"dx-card selected":"dx-card"} onClick={()=>setSelectedDx(d.name)}><span className="rank">{i+1}</span><div><div className="dx-name"><b>{d.name}</b><span>{d.relevance}</span></div><p>Muncul berdasarkan data yang tersedia — bukan diagnosis otomatis.</p><div className="tags">{d.tags.map(t=><span key={t}>{t}</span>)}</div></div><ArrowRight size={16}/></button>)}
            </div>
            <aside className="analysis-side"><div className="side-card"><p className="eyebrow">DIAGNOSIS KERJA</p><h3>{selectedDx}</h3><p>Dipilih dan dapat diubah oleh dokter berdasarkan data klinis.</p><label>Diagnosis kerja<select value={selectedDx} onChange={e=>setSelectedDx(e.target.value)}>{differentialDiagnoses.map(d=><option key={d.name}>{d.name}</option>)}</select></label><button className="primary wide" onClick={()=>setActiveStep(2)}>Lanjut ke Pemeriksaan <ArrowRight size={16}/></button></div><div className="safety-card"><AlertTriangle size={17}/><div><b>Safety check</b><p>Nilai tanda vital, hidrasi, perdarahan, kesadaran, dan red flags sebelum keputusan tatalaksana.</p></div></div></aside>
          </div>

          <div className="lower-panels">
            <div className="panel compact"><div className="panel-head"><div><p className="eyebrow">STEP 03 · PEMERIKSAAN</p><h2>Pemeriksaan & Investigasi</h2></div><span className="count">3 rekomendasi</span></div>{tests.map(t=><div className="recommend" key={t[0]}><Check size={15}/><div><b>{t[0]}</b><span>{t[1]}</span></div><em className={t[2]==="Pertimbangan"?"neutral":""}>{t[2]}</em></div>)}</div>
            <div className="panel compact"><div className="panel-head"><div><p className="eyebrow">STEP 04 · PLAN</p><h2>Tatalaksana & Rujuk</h2></div><span className="count">Review dokter</span></div><div className="treatment"><div className="treatment-icon"><Stethoscope size={17}/></div><div><b>Perawatan suportif</b><span>Hidrasi, monitoring, antipiretik sesuai indikasi dan kontraindikasi.</span></div></div><div className="warning"><AlertTriangle size={15}/><span><b>Red flags:</b> instabilitas hemodinamik, perdarahan bermakna, penurunan kesadaran, distress napas, atau kondisi memburuk → evaluasi rujukan segera.</span></div><button className="primary wide" onClick={()=>setShowRx(true)}>Buka Prescription Safety <Pill size={15}/></button></div>
            <div className="panel compact"><div className="panel-head"><div><p className="eyebrow">STEP 05 · FINALIZATION</p><h2>RME / SOAP</h2></div><span className="count">Draft</span></div><div className="soap"><b>S</b><span>{complaint || "Belum ada keluhan yang dimasukkan."}</span></div><div className="soap"><b>O</b><span>Data tanda vital dan pemeriksaan fisik perlu dilengkapi dokter.</span></div><div className="soap"><b>A</b><span>{selectedDx}; DD: infeksi viral, demam tifoid.</span></div><div className="soap"><b>P</b><span>Lengkapi pemeriksaan → review plan → dokumentasikan → sign.</span></div><button className={signed?"signed wide":"primary wide"} onClick={()=>setSigned(true)}>{signed?<><Check size={16}/> RME Ditinjau</>:<>Simpan & Review RME <ArrowRight size={16}/></>}</button></div>
          </div>
        </section>}

        {activeNav === "Resep" && <section className="panel assistant" style={{marginTop:12}}><div className="assistant-head"><div><p className="eyebrow">PRESCRIPTION WORKSPACE</p><h2>Resep & Prescription Safety</h2><span>V1 menggunakan contoh data; dosis harus diverifikasi terhadap usia, berat badan, indikasi, kontraindikasi, alergi, fungsi ginjal/hati, dan guideline.</span></div><button className="primary" onClick={()=>setShowRx(true)}><Plus size={15}/> Tambah Obat</button></div><div className="lower-panels" style={{marginTop:14}}><div className="panel compact"><div className="panel-head"><div><h2>Pasien</h2><p>{patientName}</p></div></div><div className="soap"><b>1</b><span>Paracetamol — contoh item prescription</span></div><div className="soap"><b>2</b><span>Review alergi dan kontraindikasi sebelum finalisasi.</span></div></div><div className="panel compact"><div className="panel-head"><div><h2>Safety checks</h2><p>Checklist sebelum sign</p></div></div>{["Alergi obat","Indikasi","Dosis & frekuensi","Interaksi / kontraindikasi","Fungsi ginjal/hati"].map(x=><div className="check-line" key={x}><Check size={14}/>{x}</div>)}</div><div className="panel compact"><div className="panel-head"><div><h2>Finalisasi</h2><p>Dokter tetap memegang keputusan</p></div></div><button className="primary wide" onClick={()=>setShowRx(true)}>Review Resep</button></div></div></section>}

        {activeNav === "Rekam Medis" && <section className="panel assistant" style={{marginTop:12}}><div className="assistant-head"><div><p className="eyebrow">MEDICAL RECORD</p><h2>Rekam Medis</h2><span>Ringkasan encounter dan draft SOAP untuk {patientName}.</span></div><button className="primary" onClick={()=>setActiveNav("Clinical Assistant")}>Buka Encounter <ArrowRight size={15}/></button></div><div className="clinical-input" style={{marginTop:14}}><div className="soap"><b>S</b><span>{complaint || "Belum ada keluhan."}</span></div><div className="soap"><b>O</b><span>Belum ada data objektif final.</span></div><div className="soap"><b>A</b><span>{selectedDx}</span></div><div className="soap"><b>P</b><span>Review dan finalisasi oleh dokter.</span></div></div></section>}

        {activeNav === "Tools" && <section className="lower-panels" style={{marginTop:12}}>{[["Clinical Calculator","Hitung dosis, eGFR, BMI, dan parameter klinis."],["Drug Database","Cari obat, indikasi, dosis, kontraindikasi, dan safety checks."],["Referral Checklist","Bantu menentukan informasi penting sebelum rujukan."]].map(x=><div className="panel compact" key={x[0]}><p className="eyebrow">CLINICAL TOOL</p><h2>{x[0]}</h2><p className="muted">{x[1]}</p><button className="primary wide" onClick={()=>setShowTemplate(true)}>Buka Tool <ArrowRight size={15}/></button></div>)}</section>}

        {activeNav === "Template" && <section className="panel assistant" style={{marginTop:12}}><div className="assistant-head"><div><p className="eyebrow">CLINICAL TEMPLATES</p><h2>Template Dokumentasi</h2><span>Template siap pakai untuk mempercepat dokumentasi klinis.</span></div></div><div className="lower-panels" style={{marginTop:14}}>{["SOAP Umum","IGD / Emergency","Surat Rujukan","Resep Rawat Jalan","Follow-up"].map(x=><div className="panel compact" key={x}><h2>{x}</h2><p className="muted">Template terstruktur dan dapat diedit sebelum disimpan.</p><button className="text-btn" onClick={()=>setShowTemplate(true)}>Gunakan Template →</button></div>)}</div></section>}

        <footer><span>Dokter Jaga Clinical · Clinical Intelligence for Doctors</span><span>V1 Prototype · Doctor-in-the-loop · Evidence-aware</span></footer>
      </section>

      {showPatient && <div className="modal-backdrop" onClick={()=>setShowPatient(false)}><div className="modal-card" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowPatient(false)}><X size={17}/></button><p className="eyebrow">PATIENT</p><h2>{patientName ? "Edit Pasien" : "Pasien Baru"}</h2><label>Nama pasien<input value={patientName} onChange={e=>setPatientName(e.target.value)} /></label><label>Nomor RM<input defaultValue="RM-001248" /></label><label>Jenis kelamin<select defaultValue="Laki-laki"><option>Laki-laki</option><option>Perempuan</option></select></label><label>Usia<input defaultValue="45" type="number" /></label><button className="primary wide" onClick={()=>setShowPatient(false)}><Save size={15}/> Simpan</button></div></div>}
      {showRx && <div className="modal-backdrop" onClick={()=>setShowRx(false)}><div className="modal-card" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowRx(false)}><X size={17}/></button><p className="eyebrow">PRESCRIPTION SAFETY</p><h2>Review Resep</h2><p className="muted">Contoh workflow V1. Jangan gunakan sebagai pengganti verifikasi klinis.</p><label>Obat<input defaultValue="Paracetamol" /></label><label>Dosis<input defaultValue="500 mg" /></label><label>Frekuensi<input defaultValue="3–4 kali sehari bila perlu" /></label><div className="warning"><AlertTriangle size={15}/><span>Verifikasi usia/BB, alergi, indikasi, kontraindikasi, interaksi, dan dosis maksimum sebelum sign.</span></div><button className="primary wide" onClick={()=>setShowRx(false)}><Check size={15}/> Tandai Sudah Direview</button></div></div>}
      {showTemplate && <div className="modal-backdrop" onClick={()=>setShowTemplate(false)}><div className="modal-card" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowTemplate(false)}><X size={17}/></button><p className="eyebrow">TEMPLATE</p><h2>Clinical Template</h2><textarea style={{minHeight:180}} defaultValue="S: Keluhan utama...\nO: Tanda vital dan pemeriksaan fisik...\nA: Diagnosis kerja + diagnosis banding...\nP: Pemeriksaan, tatalaksana, edukasi, follow-up/rujuk..."/><button className="primary wide" onClick={()=>setShowTemplate(false)}><Save size={15}/> Gunakan Template</button></div></div>}
    </main>
  );
}
