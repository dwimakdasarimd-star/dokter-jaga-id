"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Baby,
  BookOpen,
  Calculator,
  ChevronRight,
  ClipboardList,
  FlaskConical,
  HeartPulse,
  Menu,
  Moon,
  Pill,
  Search,
  Shield,
  Syringe,
  Sun,
  Timer,
  X,
  Zap,
} from "lucide-react";

type Icon = typeof Calculator;
type Tool = {
  title: string;
  group: string;
  description: string;
  icon: Icon;
};

const tools: Tool[] = [
  { title: "Kalkulator Dosis IGD", group: "Kalkulator", description: "Hitung dosis obat dengan cepat untuk kebutuhan klinis.", icon: Pill },
  { title: "Kalkulator Bilirubin", group: "Kalkulator", description: "Hitung dan interpretasikan parameter bilirubin.", icon: Activity },
  { title: "Toksikologi & Antidot", group: "Kegawatdaruratan", description: "Referensi cepat paparan toksik dan antidot.", icon: FlaskConical },
  { title: "Obat Kehamilan & Menyusui", group: "Obat", description: "Referensi keamanan obat pada kehamilan dan laktasi.", icon: HeartPulse },
  { title: "Koreksi Elektrolit", group: "Kalkulator", description: "Bantu menghitung koreksi elektrolit secara terstruktur.", icon: Zap },
  { title: "Mesin Diagnosis Banding", group: "Clinical Reasoning", description: "Strukturkan kemungkinan diagnosis dari keluhan utama.", icon: Search },
  { title: "Gawat Darurat Anak", group: "Pediatri", description: "Toolkit ringkas untuk kondisi emergensi pediatri.", icon: Baby },
  { title: "Resusitasi Neonatus", group: "Neonatus", description: "Langkah cepat dan checklist resusitasi neonatus.", icon: Syringe },
  { title: "Algoritma IGD", group: "Kegawatdaruratan", description: "Alur praktis untuk kasus prioritas di IGD.", icon: Shield },
  { title: "Timer Protokol", group: "Protokol", description: "Timer untuk protokol, observasi, dan intervensi.", icon: Timer },
  { title: "Analisis Gas Darah", group: "Laboratorium", description: "Pendekatan terstruktur untuk analisis gas darah.", icon: ClipboardList },
  { title: "Modul EKG", group: "Kardiologi", description: "Pendekatan terstruktur untuk ritme dan pola EKG.", icon: Activity },
  { title: "Antropometri Anak", group: "Pediatri", description: "Kalkulator pertumbuhan dan status gizi anak.", icon: Calculator },
  { title: "Panduan Klinis", group: "Referensi", description: "Ringkasan guideline dan checklist klinis pilihan.", icon: BookOpen },
];

const sidebar = [
  "Toolkit IGD",
  "Skrining & Skor",
  "Kalkulator Klinis",
  "Indikasi & Kontraindikasi",
  "Dosis Obat",
  "Interaksi Obat",
  "Panduan Klinis",
  "Algoritma IGD",
  "Timer Protokol",
  "Gawat Darurat Anak",
  "Resusitasi Neonatus",
  "Modul EKG",
  "Antropometri Anak",
  "Perkembangan Anak",
  "Imunisasi",
  "Kamus ICD-10",
  "Spesialisasi",
];

const filters: Record<string, string[]> = {
  "Kalkulator Klinis": ["Kalkulator"],
  "Dosis Obat": ["Obat", "Kalkulator"],
  "Algoritma IGD": ["Kegawatdaruratan"],
  "Timer Protokol": ["Protokol"],
  "Gawat Darurat Anak": ["Pediatri"],
  "Resusitasi Neonatus": ["Neonatus"],
  "Modul EKG": ["Kardiologi"],
  "Panduan Klinis": ["Referensi"],
};

export default function ToolsPage() {
  const [active, setActive] = useState("Toolkit IGD");
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(true);
  const [mobile, setMobile] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((tool) => {
      const textMatch = !q || `${tool.title} ${tool.group} ${tool.description}`.toLowerCase().includes(q);
      const groups = filters[active];
      return textMatch && (!groups || groups.includes(tool.group));
    });
  }, [active, query]);

  return (
    <div className={dark ? "bfsm-shell bfsm-dark" : "bfsm-shell bfsm-light"}>
      <aside className={mobile ? "bfsm-sidebar bfsm-open" : "bfsm-sidebar"}>
        <div className="bfsm-brand">
          <div className="bfsm-logo">R</div>
          <div><strong>BFSmed</strong><small>Clinical Workspace</small></div>
        </div>
        <nav className="bfsm-nav">
          {sidebar.map((item) => (
            <button
              key={item}
              className={active === item ? "bfsm-nav-link bfsm-active" : "bfsm-nav-link"}
              onClick={() => { setActive(item); setMobile(false); }}
            >
              <span className="bfsm-nav-icon">{item === "Toolkit IGD" ? "⌁" : "•"}</span>
              <span>{item}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="bfsm-content">
        <header className="bfsm-topbar">
          <button className="bfsm-mobile" onClick={() => setMobile(!mobile)} aria-label="Menu">
            {mobile ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="bfsm-search">
            <Search size={17} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari diagnosis, skor, kalkulator…" />
            <kbd>⌘K</kbd>
          </div>
          <div className="bfsm-user">
            <span>dwimakdasari.md@gmail.com</span>
            <button aria-label="Keluar">↪ <b>Keluar</b></button>
            <button onClick={() => setDark(!dark)} aria-label="Ubah tema">
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        <main className="bfsm-main">
          <div className="bfsm-heading">
            <div>
              <div className="bfsm-kicker">Clinical workspace</div>
              <h1>{active}</h1>
            </div>
          </div>

          <div className="bfsm-divider" />

          <section className="bfsm-grid">
            {visible.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.title} href="/tools" className="bfsm-card">
                  <div className="bfsm-card-icon"><Icon size={19} /></div>
                  <div className="bfsm-card-copy">
                    <strong>{tool.title}</strong>
                    <span>{tool.description}</span>
                  </div>
                  <ChevronRight className="bfsm-card-arrow" size={17} />
                </Link>
              );
            })}
            {visible.length === 0 && (
              <div className="bfsm-empty">Tidak ada toolkit yang cocok dengan pencarian.</div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
