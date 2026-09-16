"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { HeartPulse, Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else window.location.href = "/";
    setLoading(false);
  }

  async function reset() {
    setError(""); setMessage("");
    if (!email) { setError("Masukkan email dokter terlebih dahulu."); return; }
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/settings` });
    if (error) setError(error.message); else setMessage("Link reset password telah dikirim bila email terdaftar.");
  }

  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#f5f8fc"}}>
    <section style={{width:"min(420px,100%)",background:"#fff",border:"1px solid #e5eaf2",borderRadius:20,padding:28,boxShadow:"0 20px 60px rgba(16,41,91,.08)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}><div style={{width:42,height:42,borderRadius:13,display:"grid",placeItems:"center",background:"linear-gradient(135deg,#173b83,#2e75ed)",color:"#fff"}}><HeartPulse size={21}/></div><div><b style={{display:"block",fontSize:17,color:"#10295b"}}>Dokter Jaga</b><span style={{fontSize:10,color:"#7c8799"}}>Clinical Workspace</span></div></div>
      <h1 style={{fontSize:25,color:"#16213d",margin:"0 0 7px"}}>Masuk ke workspace</h1>
      <p style={{fontSize:11,color:"#6d7890",lineHeight:1.6,margin:"0 0 22px"}}>Gunakan akun dokter Anda untuk mengakses data pasien dan workflow klinis.</p>
      <form onSubmit={submit}>
        <label style={{display:"block",fontSize:10,fontWeight:700,color:"#56637b",marginBottom:6}}>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required placeholder="dokter@klinik.id" style={{width:"100%",padding:"11px 12px",border:"1px solid #dce3ee",borderRadius:9,outline:0,marginBottom:14}}/>
        <label style={{display:"block",fontSize:10,fontWeight:700,color:"#56637b",marginBottom:6}}>Password</label>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required placeholder="••••••••" style={{width:"100%",padding:"11px 12px",border:"1px solid #dce3ee",borderRadius:9,outline:0,marginBottom:8}}/>
        <button type="button" onClick={reset} style={{border:0,background:"none",padding:0,fontSize:9,color:"#2563eb",cursor:"pointer",marginBottom:16}}>Lupa password?</button>
        {error && <div style={{padding:10,borderRadius:8,background:"#fff1f2",color:"#b42318",fontSize:9,marginBottom:10}}>{error}</div>}
        {message && <div style={{padding:10,borderRadius:8,background:"#ecfdf5",color:"#087f5b",fontSize:9,marginBottom:10}}>{message}</div>}
        <button disabled={loading} style={{width:"100%",border:0,borderRadius:9,padding:11,background:"linear-gradient(135deg,#2563eb,#1f58d5)",color:"#fff",fontWeight:700,fontSize:10,cursor:loading?"wait":"pointer",display:"flex",justifyContent:"center",alignItems:"center",gap:7}}>{loading&&<Loader2 size={14} className="spin"/>}{loading?"Memproses…":"Masuk"}</button>
      </form>
      <div style={{display:"flex",gap:7,alignItems:"center",marginTop:18,padding:10,borderRadius:8,background:"#eefaf7",color:"#13856f",fontSize:8}}><ShieldCheck size={15}/><span>Session akan menggunakan cookie yang dikelola Supabase.</span></div>
    </section>
  </main>;
}
