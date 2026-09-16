"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { listClinicalEncounters } from "../../lib/clinical-storage";
import { listPrescriptions } from "../../lib/prescription-storage";

export default function ReportsPage(){
  const [refresh,setRefresh]=useState(0);
  const [data,setData]=useState<{e:ReturnType<typeof listClinicalEncounters>;r:ReturnType<typeof listPrescriptions>}>({e:[],r:[]});
  useEffect(()=>setData({e:listClinicalEncounters(),r:listPrescriptions()}),[refresh]);
  const reviewed=data.e.filter(x=>x.reviewed).length;
  const dx=data.e.filter(x=>x.selectedDx).length;
  const exportData=()=>{
    const b=new Blob([JSON.stringify({generatedAt:new Date().toISOString(),encounters:data.e,prescriptions:data.r},null,2)],{type:"application/json"});
    const u=URL.createObjectURL(b);
    const a=document.createElement("a");
    a.href=u;
    a.download="dokter-jaga-report.json";
    a.click();
    URL.revokeObjectURL(u);
  };
  return <main style={page}>
    <header style={header}>
      <a href="/" style={back}><ArrowLeft size={14}/> Dashboard</a>
      <div><div style={eyebrow}>REPORTS</div><h1 style={h1}>Laporan</h1></div>
      <div style={actions}>
        <button onClick={()=>setRefresh(x=>x+1)} style={secondary}><RefreshCw size={13}/> Refresh</button>
        <button onClick={exportData} style={primary}><Download size={13}/> Export JSON</button>
      </div>
    </header>
    <div style={wrap}>
      <div style={metrics}>
        <M v={data.e.length} t="Encounter"/>
        <M v={reviewed} t="Reviewed"/>
        <M v={dx} t="Dengan diagnosis kerja"/>
        <M v={data.r.length} t="Draft resep"/>
      </div>
      <section style={card}>
        {data.e.slice(0,10).map(x=><div key={x.id} style={row}>
          <div style={avatar}>{(x.patient.name||"PS").slice(0,2).toUpperCase()}</div>
          <div style={rowText}>
            <b>{x.patient.name||"Tanpa nama"}</b>
            <span>{x.complaint}</span>
          </div>
          <small>{new Date(x.updatedAt).toLocaleString("id-ID")}</small>
        </div>)}
        {!data.e.length&&<div style={empty}>Belum ada data encounter.</div>}
      </section>
    </div>
  </main>
}

function M({v,t}:{v:number;t:string}){return <div style={metric}><b>{v}</b><span>{t}</span></div>}

const page: CSSProperties={minHeight:"100vh",background:"#f5f8fc",fontFamily:"Inter,Arial,sans-serif",color:"#16213d"};
const header: CSSProperties={height:64,background:"#fff",borderBottom:"1px solid #e5eaf2",display:"flex",alignItems:"center",gap:18,padding:"0 28px"};
const back: CSSProperties={display:"flex",alignItems:"center",gap:6,textDecoration:"none",color:"#65728a",fontSize:10};
const eyebrow: CSSProperties={fontSize:8,fontWeight:800,letterSpacing:".12em",color:"#6a81a7"};
const h1: CSSProperties={margin:"3px 0",fontSize:20,color:"#10295b"};
const actions: CSSProperties={marginLeft:"auto",display:"flex",gap:7};
const wrap: CSSProperties={maxWidth:1060,margin:"22px auto",padding:"0 14px"};
const metrics: CSSProperties={display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,marginBottom:12};
const metric: CSSProperties={background:"#fff",border:"1px solid #e1e7f0",borderRadius:12,padding:14};
const card: CSSProperties={background:"#fff",border:"1px solid #e1e7f0",borderRadius:14,padding:15};
const row: CSSProperties={display:"flex",alignItems:"center",gap:9,padding:"10px 2px",borderTop:"1px solid #edf0f4"};
const rowText: CSSProperties={flex:1,display:"flex",flexDirection:"column",gap:2,minWidth:0};
const avatar: CSSProperties={width:31,height:31,borderRadius:9,background:"#eef4ff",color:"#2d61b4",display:"grid",placeItems:"center",fontSize:8,fontWeight:800,flexShrink:0};
const primary: CSSProperties={border:0,background:"#2563eb",color:"#fff",borderRadius:8,padding:"8px 10px",fontSize:8,fontWeight:700,display:"inline-flex",alignItems:"center",gap:5};
const secondary: CSSProperties={border:"1px solid #dce3ee",background:"#fff",color:"#617089",borderRadius:8,padding:"8px 10px",fontSize:8,fontWeight:700,display:"inline-flex",alignItems:"center",gap:5};
const empty: CSSProperties={padding:30,textAlign:"center",color:"#8792a4",fontSize:10};
