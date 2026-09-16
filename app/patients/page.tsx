"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, FilePlus2, Search, UserRound } from "lucide-react";
import { listClinicalEncounters, type ClinicalEncounter } from "../../lib/clinical-storage";

export default function PatientsPage() {
  const [items, setItems] = useState<ClinicalEncounter[]>([]);
  const [query, setQuery] = useState("");
  useEffect(() => setItems(listClinicalEncounters()), []);
  const filtered = useMemo(() => items.filter((x) => `${x.patient.name} ${x.patient.medicalRecordNumber}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  return <main style={page}>
    <Header title="Pasien" sub="Patient Directory" action={<a href="/clinical" style={primary}><FilePlus2 size={14}/> Encounter baru</a>} />
    <section style={card}>
      <div style={searchBox}><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau nomor rekam medis..." style={plainInput}/></div>
      <div style={tableHead}><span>Pasien</span><span>No. RM</span><span>Encounter terakhir</span><span></span></div>
      {filtered.length === 0 ? <Empty text="Belum ada pasien tersimpan. Buat encounter pertama dari Clinical Assistant."/> : filtered.map((x) => <div key={x.id} style={row}><div style={person}><div style={avatar}>{(x.patient.name || "PS").slice(0,2).toUpperCase()}</div><div><b>{x.patient.name || "Tanpa nama"}</b><small>{x.patient.sex || "Jenis kelamin belum diisi"}{x.patient.birthDate ? ` · ${x.patient.birthDate}` : ""}</small></div></div><span style={smallCell}>{x.patient.medicalRecordNumber || "—"}</span><span style={smallCell}>{new Date(x.updatedAt).toLocaleString("id-ID")}</span><a href="/clinical" style={link}><ExternalLink size={13}/> Buka</a></div>)}
    </section>
  </main>;
}

function Header({ title, sub, action }: { title: string; sub: string; action?: React.ReactNode }) { return <header style={header}><a href="/" style={back}><ArrowLeft size={14}/> Dashboard</a><div style={{ flex: 1 }}><div style={eyebrow}>{sub}</div><h1 style={h1}>{title}</h1></div>{action}</header>; }
function Empty({ text }: { text: string }) { return <div style={{ padding: 38, textAlign: "center", color: "#8792a4", fontSize: 11 }}><UserRound size={22} style={{ marginBottom: 7 }}/><div>{text}</div></div>; }
const page = { minHeight:"100vh", background:"#f5f8fc", color:"#16213d", fontFamily:"Inter,Arial,sans-serif" };
const header = { height:64, background:"#fff", borderBottom:"1px solid #e5eaf2", display:"flex", alignItems:"center", gap:18, padding:"0 28px" };
const back = { display:"flex", alignItems:"center", gap:6, color:"#66738b", fontSize:10, textDecoration:"none" };
const eyebrow = { fontSize:8, fontWeight:800, letterSpacing:".12em", color:"#6a81a7" };
const h1 = { margin:"3px 0 0", fontSize:20, color:"#10295b" };
const primary = { display:"inline-flex", alignItems:"center", gap:6, textDecoration:"none", background:"#2563eb", color:"#fff", borderRadius:8, padding:"9px 11px", fontSize:9, fontWeight:700 };
const card = { maxWidth:1120, margin:"22px auto", background:"#fff", border:"1px solid #e1e7f0", borderRadius:14, padding:15 };
const searchBox = { maxWidth:520, height:38, display:"flex", alignItems:"center", gap:8, border:"1px solid #dce3ee", borderRadius:9, padding:"0 10px", color:"#8b96a8" };
const plainInput = { border:0, outline:0, width:"100%", fontSize:10, background:"transparent", color:"#22304a" };
const tableHead = { display:"grid", gridTemplateColumns:"2fr 1fr 1.4fr .7fr", gap:10, padding:"14px 8px 8px", color:"#8b96a8", fontSize:8, borderBottom:"1px solid #eef1f5", marginTop:8 };
const row = { display:"grid", gridTemplateColumns:"2fr 1fr 1.4fr .7fr", gap:10, alignItems:"center", padding:"11px 8px", borderBottom:"1px solid #f0f2f5", fontSize:9 };
const person = { display:"flex", alignItems:"center", gap:9 };
const avatar = { width:31, height:31, borderRadius:9, background:"#eef4ff", color:"#2d61b4", display:"grid", placeItems:"center", fontSize:9, fontWeight:800 };
const smallCell = { color:"#6f7c91", fontSize:9 };
const link = { display:"inline-flex", alignItems:"center", gap:5, color:"#2563eb", textDecoration:"none", fontSize:8, fontWeight:700 };
