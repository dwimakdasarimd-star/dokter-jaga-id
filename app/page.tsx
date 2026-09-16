"use client";

import { useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, Bell, BookOpen, CalendarDays, Check, ChevronDown,
  ClipboardList, FileText, HeartPulse, LayoutDashboard, Menu, Pill, Plus, Search, Settings,
  ShieldCheck, Stethoscope, UsersRound
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

const differentialDiagnoses = [
  { name: "Dengue Fever", relevance: "Paling relevan", tags: ["Demam akut", "Sakit kepala", "Nyeri badan"] },
  { name: "Viral Infection", relevance: "Masih mungkin", tags: ["Demam akut", "Nyeri badan"] },
  { name: "Typhoid Fever", relevance: "Pertimbangkan", tags: ["Demam > 3 hari", "Riwayat makanan"] },
] as const;

export default function Home() {
  const [activeNav, setActiveNav] = useState("Beranda");
  const [activeStep, setActiveStep] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedDx, setSelectedDx] = useState("Dengue Fever");
  const [signed, setSigned] = useState(false);

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

        <div className="page-head"><div><p className="eyebrow">CLINICAL WORKSPACE</p><h1>Selamat pagi, Dokter.</h1><p className="muted">Apa yang ingin Anda lakukan hari ini?</p></div><div className="date-pill"><CalendarDays size={16}/> Rabu, 16 September 2026</div></div>

        <section className="quick-grid">
          <button className="quick-card"><div className="quick-icon blue"><Plus/></div><div><b>Pasien Baru</b><span>Buat rekam medis</span></div></button>
          <button className="quick-card"><div className="quick-icon teal"><Search/></div><div><b>Cari Pasien</b><span>Lihat riwayat</span></div></button>
          <button className="quick-card"><div className="quick-icon purple"><Pill/></div><div><b>Buat Resep</b><span>Dosis & obat</span></div></button>
          <button className="quick-card featured"><div className="quick-icon indigo"><HeartPulse/></div><div><b>Clinical Assistant</b><span>Analisis kasus</span></div><ArrowRight size={16}/></button>
        </section>

        <div className="workspace-grid">
          <section className="panel patient-panel">
            <div className="panel-head"><div><h2>Pasien Hari Ini</h2><p>4 encounter terjadwal</p></div><button className="text-btn">Lihat Semua →</button></div>
            {[['Budi Santoso','Demam, nyeri kepala','09:00','R.1'],['Siti Rahma','Kontrol Hipertensi','09:30','R.2'],['Andi Wijaya','Batuk, sesak','10:00','R.3'],['Dewi Lestari','Nyeri perut','10:30','R.4']].map(p=><div className="patient-row" key={p[0]}><div className="patient-avatar">{p[0].split(' ').map(x=>x[0]).join('')}</div><div className="patient-info"><b>{p[0]}</b><span>{p[1]}</span></div><span className="patient-time">{p[2]}<small>{p[3]}</small></span></div>)}
          </section>

          <section className="panel stats-panel"><div className="panel-head"><div><h2>Ringkasan Bulan Ini</h2><p>Aktivitas klinis</p></div></div><div className="stat-grid"><div><b>124</b><span>Total Pasien</span></div><div><b>8</b><span>Pasien Baru</span></div><div><b>62</b><span>Resep Dibuat</span></div><div><b>12</b><span>Surat Rujukan</span></div></div><div className="trust-note"><ShieldCheck size={17}/><span>Dokter tetap memegang keputusan klinis.</span></div></section>
        </div>

        <section className="assistant panel">
          <div className="assistant-head"><div className="assistant-title"><div className="ai-orb"><HeartPulse size={21}/></div><div><p className="eyebrow">CLINICAL ASSISTANT</p><h2>Mulai encounter baru</h2><span>Strukturkan kasus dari keluhan awal — lalu review setiap saran.</span></div></div><span className="demo-badge">DEMO WORKSPACE</span></div>
          <div className="patient-banner"><div className="patient-avatar large">BS</div><div><b>Budi Santoso</b><span>Laki-laki · 45 tahun · RM-001248</span></div><button className="edit-btn">Edit pasien</button></div>
          <div className="stepper">{steps.map((s,i)=><button key={s} onClick={()=>setActiveStep(i)} className={i===activeStep?"step active":i<activeStep?"step done":"step"}><span>{i<activeStep?<Check size={13}/>:i+1}</span>{s}</button>)}</div>

          <div className="clinical-input"><div className="input-label"><b>Apa keluhan pasien?</b><span>Contoh: Pasien demam 3 hari disertai batuk dan sesak</span></div><textarea defaultValue="Pasien demam sejak 3 hari, disertai sakit kepala dan nyeri badan. Tidak ada batuk. Mual ada, muntah tidak."/><div className="input-tools"><button>🎙️ Rekam Suara</button><button>Contoh Kasus</button><button>Reset</button><button className="primary" onClick={()=>setActiveStep(1)}>Analisis Kasus <ArrowRight size={16}/></button></div></div>

          <div className="analysis-grid">
            <div className="analysis-main">
              <div className="section-title"><div><p className="eyebrow">STEP 01 · ANALISIS AWAL</p><h3>Gambaran Klinis</h3></div><span className="status-chip">Informasi cukup untuk analisis awal</span></div>
              <div className="info-columns"><div><h4>Informasi terdeteksi</h4>{['Demam · 3 hari','Sakit kepala','Nyeri badan','Mual','Tidak batuk','Tidak muntah'].map(x=><div className="check-line" key={x}><Check size={14}/>{x}</div>)}</div><div><h4>Pertanyaan yang mungkin relevan</h4>{['Apakah ada ruam?','Apakah ada perdarahan gusi/hidung?','Apakah nyeri perut?','Apakah ada penurunan kesadaran?'].map(x=><label className="question" key={x}><input type="checkbox"/>{x}</label>)}</div><div className="missing"><h4>Informasi belum ada</h4>{['Tanda vital','Status hidrasi','Riwayat penyakit','Pemeriksaan fisik'].map(x=><div key={x}>◆ {x}</div>)}</div></div>
              <div className="section-title dx-title"><div><p className="eyebrow">STEP 02 · CLINICAL REASONING</p><h3>Diagnosis Banding</h3></div><button className="text-btn">Lihat Guideline →</button></div>
              {differentialDiagnoses.map((d,i)=><button key={d.name} className={selectedDx===d.name?"dx-card selected":"dx-card"} onClick={()=>setSelectedDx(d.name)}><span className="rank">{i+1}</span><div><div className="dx-name"><b>{d.name}</b><span>{d.relevance}</span></div><p>Alasan dipertimbangkan</p><div className="tags">{d.tags.map(t=><span key={t}>{t}</span>)}</div></div><ArrowRight size={16}/></button>)}
            </div>
            <aside className="analysis-side"><div className="side-card"><p className="eyebrow">DIAGNOSIS KERJA</p><h3>{selectedDx}</h3><p>Dipilih oleh dokter berdasarkan data klinis yang tersedia.</p><label>Diagnosis kerja<select value={selectedDx} onChange={e=>setSelectedDx(e.target.value)}><option>Dengue Fever</option><option>Viral Infection</option><option>Typhoid Fever</option></select></label><button className="primary wide" onClick={()=>setActiveStep(2)}>Lanjut ke Pemeriksaan <ArrowRight size={16}/></button></div><div className="safety-card"><AlertTriangle size={17}/><div><b>Safety check</b><p>Pastikan tanda vital dan red flags dinilai sebelum keputusan tatalaksana.</p></div></div></aside>
          </div>
        </section>

        <section className="lower-panels">
          <div className="panel compact"><div className="panel-head"><div><p className="eyebrow">NEXT STEP</p><h2>Pemeriksaan & Investigasi</h2></div><span className="count">3 rekomendasi</span></div><div className="recommend"><Check size={15}/><div><b>Darah lengkap (CBC)</b><span>Untuk membantu evaluasi klinis</span></div><em>Disarankan</em></div><div className="recommend"><Check size={15}/><div><b>Hematokrit & trombosit</b><span>Interpretasikan bersama gambaran klinis</span></div><em>Disarankan</em></div><div className="recommend"><Check size={15}/><div><b>Fungsi hati</b><span>Pertimbangkan sesuai temuan</span></div><em className="neutral">Pertimbangan</em></div></div>
          <div className="panel compact"><div className="panel-head"><div><p className="eyebrow">NEXT STEP</p><h2>Tatalaksana</h2></div><span className="count">Review dokter</span></div><div className="treatment"><div className="treatment-icon"><Stethoscope size={17}/></div><div><b>Perawatan suportif</b><span>Hidrasi, monitoring, antipiretik sesuai indikasi</span></div></div><div className="warning"><AlertTriangle size={15}/><span>Hindari tindakan/obat tertentu bila ada kontraindikasi atau risiko perdarahan.</span></div><button className="primary wide">Buka Clinical Plan <ArrowRight size={16}/></button></div>
          <div className="panel compact"><div className="panel-head"><div><p className="eyebrow">FINALIZATION</p><h2>RME / SOAP</h2></div><span className="count">Siap direview</span></div><div className="soap"><b>S</b><span>Demam 3 hari, sakit kepala, nyeri badan, mual.</span></div><div className="soap"><b>O</b><span>Data pemeriksaan fisik dan tanda vital belum lengkap.</span></div><div className="soap"><b>A</b><span>{selectedDx}; DD: infeksi viral, demam tifoid.</span></div><div className="soap"><b>P</b><span>Lengkapi pemeriksaan → review plan → dokumentasikan.</span></div><button className={signed?"signed wide":"primary wide"} onClick={()=>setSigned(true)}>{signed?<><Check size={16}/> RME Ditinjau</>:<>Simpan & Review RME <ArrowRight size={16}/></>}</button></div>
        </section>

        <footer><span>Dokter Jaga Clinical · Clinical Intelligence for Doctors</span><span>Prototype UI · Doctor-in-the-loop · Evidence-aware</span></footer>
      </section>
    </main>
  );
}
