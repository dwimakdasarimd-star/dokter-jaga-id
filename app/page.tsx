"use client";

import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Calculator,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  HeartPulse,
  Menu,
  Pill,
  Search,
  ShieldCheck,
  Stethoscope,
  X,
} from "lucide-react";
import { useState } from "react";

const features = [
  { icon: HeartPulse, title: "Clinical Assistant", text: "Masukkan keluhan dan data klinis, lalu susun diagnosis banding, pemeriksaan, tatalaksana, dan rencana follow-up." },
  { icon: Calculator, title: "Kalkulator Medis", text: "Kalkulator klinis praktis untuk membantu perhitungan yang sering dibutuhkan saat jaga." },
  { icon: Pill, title: "Obat & Dosis", text: "Cari informasi obat, dosis, kontraindikasi, interaksi, dan safety check sebelum resep ditandatangani." },
  { icon: ClipboardCheck, title: "Panduan Klinis", text: "Ringkasan alur dan checklist kondisi yang sering ditemui di IGD maupun poliklinik." },
  { icon: FileText, title: "Template Dokumentasi", text: "Percepat SOAP, ringkasan pasien, surat rujukan, dan template klinis yang bisa diedit." },
];

const areas = ["Kegawatdaruratan", "Kardiovaskular", "Respirasi", "Gastroenterologi", "Endokrin & Metabolik", "Neurologi"];

export default function Home() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <main className="marketing">
      <header className="marketing-nav">
        <div className="container nav-inner">
          <Link href="/" className="brand-marketing" aria-label="Dokter Jaga">
            <span className="brand-symbol"><span/><span/></span>
            <span className="brand-copy"><strong>Dokter Jaga</strong><small>Selalu Ada untuk Dokter di Lapangan</small></span>
          </Link>

          <nav className={mobileMenu ? "nav-links open" : "nav-links"}>
            <a href="#fitur" onClick={()=>setMobileMenu(false)}>Fitur</a>
            <Link href="/assistant" onClick={()=>setMobileMenu(false)}>Clinical Assistant</Link>
            <a href="#area" onClick={()=>setMobileMenu(false)}>Area Klinis</a>
            <a href="#cara-kerja" onClick={()=>setMobileMenu(false)}>Cara Kerja</a>
            <a href="#tentang" onClick={()=>setMobileMenu(false)}>Tentang</a>
          </nav>

          <div className="nav-actions">
            <button className="nav-search" aria-label="Cari"><Search size={17}/></button>
            <button className="nav-login">Masuk</button>
            <Link href="/assistant" className="nav-cta">Mulai Gratis</Link>
          </div>
          <button className="nav-mobile-toggle" onClick={()=>setMobileMenu(v=>!v)} aria-label="Menu">
            {mobileMenu ? <X/> : <Menu/>}
          </button>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-glow glow-a"/>
        <div className="hero-glow glow-b"/>
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-eyebrow"><span/> CEPAT <b>•</b> TEPAT <b>•</b> PRAKTIS</div>
            <h1>Asisten klinis untuk dokter di <em>IGD</em> dan poliklinik.</h1>
            <p>Dokter Jaga membantu Anda menstrukturkan kasus, mengecek hal penting, dan mempercepat dokumentasi klinis — tanpa mengambil alih keputusan dokter.</p>

            <div className="hero-search">
              <Search size={19}/>
              <input placeholder="Tulis keluhan atau kasus pasien..." />
              <Link href="/assistant">Analisis <ArrowRight size={16}/></Link>
            </div>
            <small className="search-hint">Contoh: “Pasien laki-laki 45 tahun nyeri dada sejak 2 jam yang lalu...”</small>

            <div className="hero-trust">
              <div><ShieldCheck size={17}/><span><b>Berbasis guideline</b><small>Evidence-aware</small></span></div>
              <div><Stethoscope size={17}/><span><b>Untuk dokter</b><small>Doctor-in-the-loop</small></span></div>
              <div><Brain size={17}/><span><b>Reasoning terstruktur</b><small>Bukan diagnosis otomatis</small></span></div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="floating-note note-top">Fokus pada pasien.<strong>Kami bantu ingat ilmunya.</strong></div>
            <div className="doctor-blob">
              <div className="doctor-photo"><div className="doctor-head"/><div className="doctor-body"/></div>
              <div className="case-card">
                <div className="case-card-head"><span className="status-dot"/> Clinical Assistant <small>LIVE</small></div>
                <p>Pasien perempuan 28 tahun, sesak sejak 1 jam...</p>
                <div className="case-row checked">Diagnosis banding</div>
                <div className="case-row checked">Pemeriksaan penunjang</div>
                <div className="case-row checked">Tatalaksana awal</div>
                <div className="case-row checked">Kapan rujuk</div>
              </div>
            </div>
            <div className="floating-note note-bottom">“Setiap jaga adalah cerita,<br/><strong>setiap pasien berhak mendapat yang terbaik.</strong>”</div>
          </div>
        </div>
      </section>

      <section className="proof-strip">
        <div className="container proof-grid">
          <div><strong>01</strong><span>Masukkan data klinis</span></div>
          <div><strong>02</strong><span>Review reasoning</span></div>
          <div><strong>03</strong><span>Ambil keputusan</span></div>
          <div><strong>04</strong><span>Dokumentasikan</span></div>
        </div>
      </section>

      <section className="assistant-preview" id="cara-kerja">
        <div className="container">
          <div className="section-heading">
            <div><span className="section-kicker">CLINICAL WORKSPACE</span><h2>Dirancang mengikuti cara dokter bekerja.</h2></div>
            <p>Satu ruang kerja untuk menstrukturkan encounter dari keluhan awal sampai RME dan rencana follow-up.</p>
          </div>
          <div className="workspace-mock">
            <div className="mock-sidebar">
              <div className="mini-logo"><span className="brand-symbol small"><span/><span/></span><b>Dokter Jaga</b></div>
              {["Beranda","Pasien","Rekam Medis","Resep","Clinical Assistant","Tools","Template"].map((x,i)=><div key={x} className={i===4?"mock-nav active":"mock-nav"}>{x}</div>)}
            </div>
            <div className="mock-main">
              <div className="mock-top"><div className="mock-search"><Search size={14}/>Cari pasien, obat, diagnosis...</div><div className="mock-user">dr. Dwi <span>DP</span></div></div>
              <div className="mock-title"><div><span className="section-kicker">CLINICAL ASSISTANT</span><h3>Encounter · Budi Santoso</h3><p>Keluhan → anamnesis → pemeriksaan → analisis → rencana</p></div><span className="mock-badge">DOCTOR-IN-THE-LOOP</span></div>
              <div className="mock-patient"><span>BS</span><div><b>Budi Santoso</b><small>Laki-laki · 45 tahun · RM-001248</small></div><button>Edit pasien</button></div>
              <div className="mock-steps">{["Keluhan","Anamnesis","Pemeriksaan","Analisis","Rencana"].map((x,i)=><div key={x} className={i===3?"mock-step active":"mock-step"}><span>{i<3?"✓":i+1}</span>{x}</div>)}</div>
              <div className="mock-input"><b>Keluhan awal pasien</b><p>Pasien demam sejak 3 hari, disertai sakit kepala dan nyeri badan. Tidak ada batuk.</p><div><button>Contoh Kasus</button><button className="mock-primary">Analisis Kasus <ArrowRight size={13}/></button></div></div>
              <div className="mock-columns">
                <div className="mock-panel"><span className="section-kicker">CLINICAL REASONING</span><h4>Diagnosis Banding</h4>{["Dengue Fever","Infeksi viral","Demam tifoid"].map((x,i)=><div key={x} className={i===0?"mock-dx selected":"mock-dx"}><b>{i+1}</b><span>{x}<small>{i===0?"Perlu dipertimbangkan":"Masih mungkin"}</small></span><ChevronRight size={13}/></div>)}</div>
                <div className="mock-panel"><span className="section-kicker">REVIEW</span><h4>Diagnosis Kerja</h4><div className="mock-working-dx"><HeartPulse size={16}/><b>Dengue Fever</b></div><p>Dipilih dan dapat diubah oleh dokter berdasarkan data klinis.</p><div className="mock-safety"><ShieldCheck size={14}/><span>Safety check sebelum plan</span></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section" id="fitur">
        <div className="container">
          <div className="section-heading centered"><span className="section-kicker">SATU PLATFORM</span><h2>Fokus pada pekerjaan klinis yang paling sering menyita waktu.</h2><p>Fitur dibuat modular supaya Dokter Jaga bisa berkembang dari clinical assistant menjadi clinical workspace lengkap.</p></div>
          <div className="feature-grid">
            {features.map(({icon:Icon,title,text})=>(
              <Link href="/assistant" className="feature-card" key={title}>
                <span className="feature-icon"><Icon size={21}/></span><h3>{title}</h3><p>{text}</p><span className="feature-link">Buka fitur <ArrowRight size={14}/></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="clinical-area" id="area">
        <div className="container">
          <div className="section-heading"><div><span className="section-kicker">AREA KLINIS</span><h2>Mulai dari kasus yang sering ditemui saat jaga.</h2></div><Link href="/assistant" className="text-link">Lihat workspace <ArrowRight size={15}/></Link></div>
          <div className="area-grid">{areas.map((x,i)=><Link href="/assistant" key={x} className={"area-card area-"+i}><span className="area-number">0{i+1}</span><HeartPulse size={19}/><b>{x}</b><small>Guideline, checklist, reasoning</small></Link>)}</div>
        </div>
      </section>

      <section className="cta-section" id="tentang">
        <div className="container cta-card">
          <div className="cta-copy"><span className="section-kicker">DOKTER JAGA</span><h2>Karena di setiap jaga,<br/>ada harapan yang menunggu.</h2><p>Clinical workspace yang membantu dokter tetap fokus pada pasien, sementara pekerjaan repetitif menjadi lebih terstruktur.</p></div>
          <Link href="/assistant" className="cta-button">Mulai Clinical Assistant <ArrowRight size={17}/></Link>
        </div>
      </section>

      <footer className="marketing-footer">
        <div className="container footer-inner"><div><b>Dokter Jaga</b><span>Clinical Intelligence for Doctors</span></div><span>© 2026 Dokter Jaga. Built for doctors, reviewed by doctors.</span></div>
      </footer>
    </main>
  );
}
