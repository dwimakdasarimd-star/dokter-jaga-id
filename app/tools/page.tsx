"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, Baby, BookOpen, Calculator, ChevronRight, ClipboardList, FlaskConical,
  HeartPulse, Menu, Moon, Pill, Search, Shield, Syringe, Sun, Timer, X, Zap
} from "lucide-react";

type Item = { title: string; group: string; icon: typeof Calculator; desc: string };

const items: Item[] = [
  { title: "Kalkulator Dosis IGD", group: "Kalkulator", icon: Pill, desc: "Hitung dosis obat dengan cepat sesuai kebutuhan klinis." },
  { title: "Kalkulator Bilirubin", group: "Kalkulator", icon: Activity, desc: "Hitung dan interpretasikan parameter bilirubin." },
  { title: "Toksikologi & Antidot", group: "Kegawatdaruratan", icon: FlaskConical, desc: "Referensi cepat paparan toksik dan antidot umum." },
  { title: "Obat Kehamilan & Menyusui", group: "Obat", icon: HeartPulse, desc: "Referensi keamanan obat pada kehamilan dan laktasi." },
  { title: "Koreksi Elektrolit", group: "Kalkulator", icon: Zap, desc: "Bantu menghitung koreksi elektrolit secara terstruktur." },
  { title: "Mesin Diagnosis Banding", group: "Clinical Reasoning", icon: Search, desc: "Strukturkan kemungkinan diagnosis dari keluhan utama." },
  { title: "Gawat Darurat Anak", group: "Pediatri", icon: Baby, desc: "Toolkit ringkas untuk kondisi emergensi pediatri." },
  { title: "Resusitasi Neonatus", group: "Neonatus", icon: Syringe, desc: "Langkah cepat dan checklist resusitasi neonatus." },
  { title: "Algoritma IGD", group: "Kegawatdaruratan", icon: Shield, desc: "Alur praktis untuk kasus prioritas di IGD." },
  { title: "Timer Protokol", group: "Protokol", icon: Timer, desc: "Timer untuk protokol, observasi, dan intervensi berulang." },
  { title: "Analisis Gas Darah", group: "Laboratorium", icon: ClipboardList, desc: "Panduan cepat membaca pH, PaCO₂, HCO₃⁻, dan kompensasi." },
  { title: "Modul EKG", group: "Kardiologi", icon: Activity, desc: "Pendekatan terstruktur untuk ritme dan pola EKG." },
  { title: "Antropometri Anak", group: "Pediatri", icon: Calculator, desc: "Kalkulator pertumbuhan dan status gizi anak." },
  { title: "Panduan Klinis", group: "Referensi", icon: BookOpen, desc: "Ringkasan guideline dan checklist klinis pilihan." },
];

const nav = [
  "Toolkit IGD", "Skrining & Skor", "Kalkulator Klinis", "Indikasi & Kontraindikasi",
  "Dosis Obat", "Interaksi Obat", "Panduan Klinis", "Algoritma IGD", "Timer Protokol",
  "Gawat Darurat Anak", "Resusitasi Neonatus", "Modul EKG", "Antropometri Anak",
  "Perkembangan Anak", "Imunisasi", "Kamus ICD-10", "Spesialisasi"
];

export default function ToolsPage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("Toolkit IGD");
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(true);
  const [toast, setToast] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((x) => {
      const matchesText = !q || (x.title + " " + x.group + " " + x.desc).toLowerCase().includes(q);
      const map: Record<string, string[]> = {
        "Kalkulator Klinis": ["Kalkulator"],
        "Dosis Obat": ["Obat", "Kalkulator"],
        "Algoritma IGD": ["Kegawatdaruratan"],
        "Timer Protokol": ["Protokol"],
        "Gawat Darurat Anak": ["Pediatri"],
        "Resusitasi Neonatus": ["Neonatus"],
        "Modul EKG": ["Kardiologi"],
        "Panduan Klinis": ["Referensi"],
      };
      const categories = map[active];
      return matchesText && (!categories || categories.some((g) => x.group === g));
    });
  }, [query, active]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("bfsm-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const notify = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 1800);
  };

  return (
    <div className={dark ? "bfsm-page dark" : "bfsm-page light"}>
      <aside className={open ? "bfsm-sidebar open" : "bfsm-sidebar"}>
        <div className="bfsm-brand">
          <div className="bfsm-brand-mark">R</div>
          <div className="bfsm-brand-name">BFS<span>med</span></div>
        </div>
        <nav className="bfsm-nav">
          {nav.map((label) => (
            <button
              key={label}
              className={active === label ? "bfsm-nav-item active" : "bfsm-nav-item"}
              onClick={() => { setActive(label); setOpen(false); }}
            >
              <span className="bfsm-nav-dot">{label === "Toolkit IGD" ? "⌘" : "•"}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="bfsm-main-wrap">
        <header className="bfsm-topbar">
          <button className="bfsm-menu" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X size={19}/> : <Menu size={19}/>}
          </button>
          <div className="bfsm-search">
            <Search size={18}/>
            <input id="bfsm-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari diagnosis, skor, kalkulator…" />
            <kbd>⌘K</kbd>
          </div>
          <div className="bfsm-actions">
            <span className="bfsm-email">doctor@bfsmed.id</span>
            <button className="bfsm-logout" onClick={() => notify("Demo UI — tombol keluar belum terhubung")}>↪ <span>Keluar</span></button>
            <button className="bfsm-theme" onClick={() => setDark((v) => !v)} aria-label="Ganti tema">
              {dark ? <Sun size={17}/> : <Moon size={17}/>}
            </button>
          </div>
        </header>

        <main className="bfsm-main">
          <div className="bfsm-head">
            <div>
              <div className="bfsm-eyebrow">Clinical workspace</div>
              <h1>{active === "Toolkit IGD" ? "Toolkit IGD" : active}</h1>
              <p>Alat bantu klinis yang ringkas, cepat, dan mudah dipakai saat jaga.</p>
            </div>
            <div className="bfsm-ready"><span/> Sistem siap</div>
          </div>

          <div className="bfsm-rule"/>

          <section className="bfsm-grid">
            {visible.map(({title, group, icon: Icon, desc}) => (
              <button key={title} className="bfsm-card" onClick={() => notify(\`\${title} dibuka — modul demo\`)}>
                <div className="bfsm-icon"><Icon size={19}/></div>
                <div className="bfsm-copy">
                  <strong>{title}</strong>
                  <small>{desc}</small>
                  <em>{group}</em>
                </div>
                <ChevronRight className="bfsm-arrow" size={17}/>
              </button>
            ))}
            {!visible.length && (
              <div className="bfsm-empty">Tidak ada toolkit yang cocok dengan “{query}”.</div>
            )}
          </section>

          <footer className="bfsm-footer">
            <span>BFSmed Clinical Workspace</span>
            <span>UI demo · v0.1</span>
          </footer>
        </main>
      </div>

      {toast && <div className="bfsm-toast">{toast}</div>}

      <style jsx>{String.raw\`
        .bfsm-page{min-height:100vh;background:#0b0b17;color:#f4f4f7;display:flex;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .bfsm-page.light{background:#f6f7fb;color:#15182a}
        .bfsm-sidebar{position:fixed;inset:0 auto 0 0;width:250px;background:#15182d;border-right:1px solid #3b4066;padding:10px 9px;overflow:auto;z-index:30}
        .bfsm-brand{display:flex;align-items:center;gap:10px;height:45px;padding:0 10px 7px}
        .bfsm-brand-mark{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;background:#6473f5;color:#fff;font-weight:900;font-size:18px}
        .bfsm-brand-name{font-size:16px;font-weight:800;letter-spacing:-.02em}.bfsm-brand-name span{font-weight:500}
        .bfsm-nav{margin-top:6px;display:grid;gap:3px}
        .bfsm-nav-item{height:39px;width:100%;border:1px solid transparent;background:transparent;border-radius:8px;color:#f3f4fa;display:flex;align-items:center;gap:11px;padding:0 12px;text-align:left;font-size:13px;cursor:pointer}
        .bfsm-nav-item:hover{background:#1b1e36;border-color:#2d3153}.bfsm-nav-item.active{background:#222642;border-color:#626b99}
        .bfsm-nav-dot{width:18px;display:grid;place-items:center;color:#e9ecff;font-size:15px}
        .bfsm-main-wrap{width:100%;padding-left:250px}.bfsm-topbar{height:62px;border-bottom:1px solid #3b4066;background:#15182d;display:flex;align-items:center;gap:16px;padding:0 26px;position:sticky;top:0;z-index:20}
        .bfsm-search{height:41px;max-width:590px;flex:1;display:flex;align-items:center;gap:10px;padding:0 10px 0 13px;border:1px solid #424a72;border-radius:7px;background:#1a1d35;color:#eef0fa}
        .bfsm-search input{width:100%;border:0;outline:0;background:transparent;color:inherit;font-size:13px}.bfsm-search input::placeholder{color:#c3c7d8}
        .bfsm-search kbd{background:#34374a;color:#c8cbd8;border:1px solid #4c4f62;border-radius:4px;padding:3px 6px;font-size:10px}
        .bfsm-actions{margin-left:auto;display:flex;align-items:center;gap:8px}.bfsm-email{font-size:12px;color:#c6cad8;white-space:nowrap}
        .bfsm-logout,.bfsm-theme,.bfsm-menu{height:39px;border:1px solid #3f456b;background:#171a32;border-radius:8px;color:#f1f2f8;cursor:pointer}
        .bfsm-logout{padding:0 12px;font-size:12px}.bfsm-theme{width:39px;display:grid;place-items:center}.bfsm-menu{display:none;width:40px}
        .bfsm-main{max-width:1190px;margin:0 auto;padding:52px 28px 34px}
        .bfsm-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px}.bfsm-eyebrow{text-transform:uppercase;letter-spacing:.15em;color:#8e94b1;font-size:10px;font-weight:800;margin-bottom:7px}
        .bfsm-head h1{margin:0;font-size:41px;letter-spacing:-.055em;line-height:1.02}.bfsm-head p{margin:14px 0 0;color:#9fa4bd;font-size:13px}
        .bfsm-ready{border:1px solid #3f456b;border-radius:999px;padding:8px 11px;font-size:11px;color:#cdd1e2;background:#11152a;display:flex;align-items:center;gap:8px}
        .bfsm-ready span{width:7px;height:7px;border-radius:50%;background:#71d7a2}
        .bfsm-rule{height:1px;background:#41486e;margin:28px 0 29px}
        .bfsm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border:1px solid #3e456d;border-radius:14px;overflow:hidden;background:#1c203a}
        .bfsm-card{position:relative;min-height:130px;border:0;border-right:1px solid #3c4265;border-bottom:1px solid #3c4265;background:#1d213c;color:#f6f6f8;text-align:left;padding:20px;display:flex;align-items:flex-start;gap:16px;cursor:pointer}
        .bfsm-card:nth-child(2n){border-right:0}.bfsm-card:hover{background:#242844}
        .bfsm-icon{width:38px;height:38px;flex:0 0 38px;display:grid;place-items:center;border:1px solid #505875;border-radius:8px;background:#2a2e4a}
        .bfsm-copy{padding-top:2px;min-width:0}.bfsm-copy strong{display:block;font-size:15px;line-height:1.25;letter-spacing:-.02em}.bfsm-copy small{display:block;color:#9ea4bd;font-size:11px;line-height:1.45;margin-top:7px;max-width:430px}.bfsm-copy em{display:inline-block;margin-top:9px;padding:4px 7px;border-radius:999px;border:1px solid #414767;background:#20243e;color:#b9bfd5;font-size:9px;font-style:normal;letter-spacing:.04em}
        .bfsm-arrow{position:absolute;right:18px;top:19px;color:#f2f2f7}.bfsm-empty{grid-column:1/-1;padding:60px;text-align:center;color:#9da3bb}
        .bfsm-footer{display:flex;justify-content:space-between;padding-top:23px;color:#707895;font-size:10px}
        .bfsm-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:#f1f3ff;color:#15182d;padding:10px 14px;border-radius:9px;font-size:12px;font-weight:700;z-index:60;box-shadow:0 12px 36px rgba(0,0,0,.25)}
        .light .bfsm-sidebar,.light .bfsm-topbar{background:#fff;border-color:#d9deeb}.light .bfsm-nav-item{color:#24283b}.light .bfsm-nav-item.active{background:#eef1f8;border-color:#c5cbdd}
        .light .bfsm-search{background:#f6f7fb;border-color:#cfd5e3;color:#2a2e42}.light .bfsm-search input::placeholder{color:#747d93}.light .bfsm-logout,.light .bfsm-theme{background:#fff;border-color:#cfd5e3;color:#292e42}
        .light .bfsm-head p{color:#656d84}.light .bfsm-head h1{color:#10162a}.light .bfsm-ready{background:#fff;border-color:#d1d6e3;color:#5e667c}.light .bfsm-rule{background:#d2d7e4}
        .light .bfsm-grid{background:#fff;border-color:#d4d9e5}.light .bfsm-card{background:#fbfbfd;border-color:#d7dbea;color:#15182a}.light .bfsm-card:hover{background:#f1f3f8}.light .bfsm-icon{background:#eef1f7;border-color:#d0d5e2}.light .bfsm-copy small{color:#6d7589}.light .bfsm-copy em{background:#f3f5fa;border-color:#d9deea;color:#687087}
        .light .bfsm-footer{color:#848ba0}
        @media(max-width:1000px){.bfsm-sidebar{transform:translateX(-100%);transition:transform .18s}.bfsm-sidebar.open{transform:translateX(0)}.bfsm-main-wrap{padding-left:0}.bfsm-menu{display:grid;place-items:center}.bfsm-topbar{padding:0 16px}.bfsm-email{display:none}.bfsm-main{padding:38px 18px 30px}}
        @media(max-width:680px){.bfsm-main{padding-top:28px}.bfsm-head{align-items:flex-start;flex-direction:column}.bfsm-head h1{font-size:34px}.bfsm-grid{grid-template-columns:1fr}.bfsm-card,.bfsm-card:nth-child(2n){border-right:0}.bfsm-card{min-height:116px}.bfsm-footer{gap:12px;flex-direction:column}}
      \`}</style>
    </div>
  );
}
