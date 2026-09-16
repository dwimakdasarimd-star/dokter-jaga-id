"use client";

import { useMemo, useState, type ComponentType } from "react";
import { Activity, AlertTriangle, Calculator, Droplets, HeartPulse, Pill, ShieldCheck, Stethoscope, Syringe, Weight, Zap } from "lucide-react";
import { calculate, type Values } from "./calc";

type Field = { key: string; label: string; unit?: string; type?: "number" | "select"; defaultValue?: string; options?: string[] };
type Tool = { id: string; title: string; category: string; desc: string; icon: ComponentType<{ size?: number }>; fields: Field[] };

const N = (key: string, label: string, unit: string, def = "0"): Field => ({ key, label, unit, defaultValue: def });
const S = (key: string, label: string, options: string[], def = options[0]): Field => ({ key, label, type: "select", options, defaultValue: def });
const Y = (key: string, label: string): Field => S(key, label, ["No", "Yes"]);
const C = (key: string, label: string, max: number): Field => S(key, label, Array.from({ length: max + 1 }, (_, i) => String(i)));

const tools: Tool[] = [
  { id: "bmi", title: "BMI Calculator", category: "General", desc: "Body mass index", icon: Weight, fields: [N("height", "Tinggi", "cm", "170"), N("weight", "Berat", "kg", "65")] },
  { id: "bsa", title: "BSA Calculator", category: "General", desc: "Mosteller body surface area", icon: Weight, fields: [N("height", "Tinggi", "cm", "170"), N("weight", "Berat", "kg", "65")] },
  { id: "ibw", title: "Ideal Body Weight", category: "General", desc: "Devine formula", icon: Weight, fields: [S("sex", "Jenis kelamin", ["Laki-laki", "Perempuan"]), N("height", "Tinggi", "cm", "170")] },
  { id: "map", title: "MAP Calculator", category: "Hemodynamics", desc: "Mean arterial pressure", icon: HeartPulse, fields: [N("sbp", "Systolic", "mmHg", "120"), N("dbp", "Diastolic", "mmHg", "80")] },
  { id: "pp", title: "Pulse Pressure", category: "Hemodynamics", desc: "Systolic − diastolic", icon: HeartPulse, fields: [N("sbp", "Systolic", "mmHg", "120"), N("dbp", "Diastolic", "mmHg", "80")] },
  { id: "shock", title: "Shock Index", category: "Hemodynamics", desc: "Heart rate / systolic BP", icon: Activity, fields: [N("hr", "Heart rate", "/min", "80"), N("sbp", "Systolic", "mmHg", "120")] },
  { id: "gcs", title: "GCS Helper", category: "Neurology", desc: "Glasgow Coma Scale", icon: Calculator, fields: [C("eye", "Eye", 4), C("verbal", "Verbal", 5), C("motor", "Motor", 6)] },
  { id: "four", title: "FOUR Score", category: "Neurology", desc: "Full Outline of UnResponsiveness", icon: Stethoscope, fields: [C("eye", "Eye", 4), C("motor", "Motor", 4), C("brainstem", "Brainstem", 4), C("resp", "Respiration", 4)] },
  { id: "crcl", title: "Creatinine Clearance", category: "Renal", desc: "Cockcroft–Gault", icon: Activity, fields: [N("age", "Usia", "tahun", "45"), S("sex", "Jenis kelamin", ["Laki-laki", "Perempuan"]), N("weight", "Berat", "kg", "65"), N("scr", "Serum creatinine", "mg/dL", "1")] },
  { id: "egfr", title: "eGFR CKD-EPI 2021", category: "Renal", desc: "Creatinine-based eGFR", icon: Activity, fields: [N("age", "Usia", "tahun", "45"), S("sex", "Jenis kelamin", ["Laki-laki", "Perempuan"]), N("scr", "Serum creatinine", "mg/dL", "1")] },
  { id: "fena", title: "Fractional Excretion Na", category: "Renal", desc: "FeNa", icon: Droplets, fields: [N("una", "Urine Na", "mmol/L", "40"), N("ucreat", "Urine Cr", "mg/dL", "100"), N("pna", "Plasma Na", "mmol/L", "140"), N("pcreat", "Plasma Cr", "mg/dL", "1")] },
  { id: "feurea", title: "Fractional Excretion Urea", category: "Renal", desc: "FeUrea", icon: Droplets, fields: [N("uurea", "Urine urea", "mg/dL", "300"), N("ucreat", "Urine Cr", "mg/dL", "100"), N("purea", "Plasma urea", "mg/dL", "40"), N("pcreat", "Plasma Cr", "mg/dL", "1")] },
  { id: "anion", title: "Anion Gap", category: "Electrolytes", desc: "Na − (Cl + HCO₃)", icon: Zap, fields: [N("na", "Na", "mmol/L", "140"), N("cl", "Cl", "mmol/L", "104"), N("hco3", "HCO₃", "mmol/L", "24")] },
  { id: "agk", title: "Anion Gap + K", category: "Electrolytes", desc: "Including potassium", icon: Zap, fields: [N("na", "Na", "mmol/L", "140"), N("k", "K", "mmol/L", "4"), N("cl", "Cl", "mmol/L", "104"), N("hco3", "HCO₃", "mmol/L", "24")] },
  { id: "corrna", title: "Corrected Sodium", category: "Electrolytes", desc: "Hyperglycemia correction", icon: Zap, fields: [N("na", "Measured Na", "mmol/L", "130"), N("glucose", "Glucose", "mg/dL", "300"), N("factor", "Correction factor", "per 100 mg/dL", "1.6")] },
  { id: "corrca", title: "Corrected Calcium", category: "Electrolytes", desc: "Albumin-adjusted calcium", icon: Zap, fields: [N("ca", "Total Ca", "mg/dL", "8"), N("albumin", "Albumin", "g/dL", "3")] },
  { id: "osm", title: "Serum Osmolality", category: "Electrolytes", desc: "Calculated osmolality", icon: Droplets, fields: [N("na", "Na", "mmol/L", "140"), N("glucose", "Glucose", "mg/dL", "100"), N("bun", "BUN", "mg/dL", "15")] },
  { id: "osmgap", title: "Osmolal Gap", category: "Electrolytes", desc: "Measured − calculated", icon: Droplets, fields: [N("measured", "Measured osmolality", "mOsm/kg", "290"), N("na", "Na", "mmol/L", "140"), N("glucose", "Glucose", "mg/dL", "100"), N("bun", "BUN", "mg/dL", "15")] },
  { id: "freewater", title: "Free Water Deficit", category: "Electrolytes", desc: "Estimated free-water deficit", icon: Droplets, fields: [N("weight", "Berat", "kg", "65"), S("sex", "Jenis kelamin", ["Laki-laki", "Perempuan"]), N("na", "Na", "mmol/L", "155"), N("target", "Target Na", "mmol/L", "140")] },
  { id: "qtc", title: "QTc Calculator", category: "Cardiology", desc: "Bazett or Fridericia", icon: HeartPulse, fields: [N("qt", "QT", "ms", "420"), N("rr", "RR", "ms", "800"), S("method", "Formula", ["Bazett", "Fridericia"])] },
  { id: "heart", title: "HEART Score", category: "Cardiology", desc: "Chest-pain score", icon: HeartPulse, fields: [C("history", "History", 2), C("ecg", "ECG", 2), N("age", "Age", "tahun", "45"), C("risk", "Risk factors", 2), C("troponin", "Troponin", 2)] },
  { id: "chasvasc", title: "CHA₂DS₂-VASc", category: "Cardiology", desc: "AF stroke-risk factors", icon: HeartPulse, fields: [Y("chf", "Heart failure"), Y("htn", "Hypertension"), N("age", "Age", "tahun", "65"), Y("dm", "Diabetes"), Y("stroke", "Prior stroke/TIA/TE"), Y("vascular", "Vascular disease"), S("sex", "Sex", ["Laki-laki", "Perempuan"], "Perempuan")] },
  { id: "hasbled", title: "HAS-BLED", category: "Cardiology", desc: "Bleeding-risk factors", icon: AlertTriangle, fields: [Y("htn", "Uncontrolled HTN"), Y("renal", "Abnormal renal function"), Y("liver", "Abnormal liver function"), Y("stroke", "Prior stroke"), Y("bleed", "Bleeding history"), Y("inr", "Labile INR"), Y("age", "Age >65"), Y("drugs", "Bleeding drugs"), Y("alcohol", "Alcohol use")] },
  { id: "timi", title: "TIMI UA/NSTEMI", category: "Cardiology", desc: "Seven-item score", icon: HeartPulse, fields: [Y("age", "Age ≥65"), Y("risk", "≥3 risk factors"), Y("known", "Known CAD"), Y("aspirin", "Aspirin use"), Y("angina", "Recent severe angina"), Y("st", "ST deviation"), Y("marker", "Positive cardiac marker")] },
  { id: "wellspe", title: "Wells PE", category: "Emergency", desc: "Pulmonary embolism score", icon: AlertTriangle, fields: [Y("dvt", "Clinical DVT signs"), Y("alt", "PE most likely"), Y("hr", "HR >100"), Y("surgery", "Surgery/immobilization"), Y("prior", "Prior DVT/PE"), Y("hemoptysis", "Hemoptysis"), Y("malignancy", "Malignancy")] },
  { id: "perc", title: "PERC Rule", category: "Emergency", desc: "PE rule-out checklist", icon: ShieldCheck, fields: [Y("age", "Age ≥50"), Y("hr", "HR ≥100"), Y("oxy", "SpO₂ <95%"), Y("hemoptysis", "Hemoptysis"), Y("estrogen", "Estrogen use"), Y("prior", "Prior DVT/PE"), Y("unilat", "Unilateral leg swelling"), Y("surgery", "Recent surgery/trauma")] },
  { id: "wellsdvt", title: "Wells DVT", category: "Emergency", desc: "DVT pretest score", icon: AlertTriangle, fields: [Y("cancer", "Active cancer"), Y("paralysis", "Paralysis/immobilization"), Y("bedrest", "Recent bedrest/surgery"), Y("tender", "Deep vein tenderness"), Y("swollenleg", "Entire leg swollen"), Y("calf", "Calf swelling >3 cm"), Y("edema", "Pitting edema"), Y("vein", "Collateral superficial veins"), Y("prior", "Previous DVT")] },
  { id: "parkland", title: "Parkland Formula", category: "Emergency", desc: "Burn resuscitation estimate", icon: Droplets, fields: [N("weight", "Berat", "kg", "65"), N("tbsa", "TBSA burn", "%", "20")] },
  { id: "qsofa", title: "qSOFA", category: "Sepsis", desc: "Bedside sepsis score", icon: AlertTriangle, fields: [Y("rr", "RR ≥22"), Y("sbp", "SBP ≤100"), Y("mental", "Altered mentation")] },
  { id: "sirs", title: "SIRS", category: "Sepsis", desc: "Inflammatory response criteria", icon: AlertTriangle, fields: [N("temp", "Temperature", "°C", "37"), N("hr", "Heart rate", "/min", "80"), N("rr", "Respiratory rate", "/min", "18"), N("paco2", "PaCO₂", "mmHg", "40"), N("wbc", "WBC", "10⁹/L", "7"), N("bands", "Bands", "%", "0")] },
  { id: "sofa", title: "SOFA Score", category: "Sepsis", desc: "Six-organ dysfunction score", icon: AlertTriangle, fields: [C("resp", "Respiratory", 4), C("coag", "Coagulation", 4), C("liver", "Liver", 4), C("cv", "Cardiovascular", 4), C("cns", "CNS", 4), C("renal", "Renal", 4)] },
  { id: "news2", title: "NEWS2", category: "Sepsis", desc: "Early warning score", icon: Activity, fields: [N("rr", "Respiratory rate", "/min", "18"), N("spo2", "SpO₂", "%", "98"), N("sbp", "Systolic BP", "mmHg", "120"), N("pulse", "Pulse", "/min", "80"), N("temp", "Temperature", "°C", "37"), S("conscious", "Consciousness", ["A", "C/V/P/U"]), Y("o2", "Supplemental O₂")] },
  { id: "meld", title: "MELD", category: "Hepatology", desc: "Liver disease severity estimate", icon: Activity, fields: [N("bilirubin", "Bilirubin", "mg/dL", "1"), N("inr", "INR", "ratio", "1"), N("creatinine", "Creatinine", "mg/dL", "1")] },
  { id: "fib4", title: "FIB-4", category: "Hepatology", desc: "Fibrosis index", icon: Activity, fields: [N("age", "Age", "tahun", "45"), N("ast", "AST", "U/L", "40"), N("alt", "ALT", "U/L", "40"), N("platelet", "Platelet", "10⁹/L", "250")] },
  { id: "apri", title: "APRI", category: "Hepatology", desc: "AST-to-platelet ratio", icon: Activity, fields: [N("ast", "AST", "U/L", "40"), N("astULN", "AST ULN", "U/L", "40"), N("platelet", "Platelet", "10⁹/L", "250")] },
  { id: "rfactor", title: "R Factor", category: "Hepatology", desc: "Liver injury pattern", icon: Activity, fields: [N("alt", "ALT", "U/L", "40"), N("altULN", "ALT ULN", "U/L", "40"), N("alp", "ALP", "U/L", "100"), N("alpULN", "ALP ULN", "U/L", "100")] },
  { id: "homair", title: "HOMA-IR", category: "Endocrine", desc: "Insulin resistance index", icon: Activity, fields: [N("glucose", "Glucose", "mg/dL", "100"), N("insulin", "Insulin", "µU/mL", "10")] },
  { id: "pedsfluid", title: "Pediatric Maintenance Fluid", category: "Pediatrics", desc: "4-2-1 rule", icon: Droplets, fields: [N("weight", "Berat", "kg", "20")] },
  { id: "adjbw", title: "Adjusted Body Weight", category: "Medication", desc: "AdjBW estimate", icon: Pill, fields: [N("ibw", "IBW", "kg", "60"), N("tbw", "TBW", "kg", "90")] },
  { id: "weightdose", title: "Weight-Based Dose", category: "Medication", desc: "Dose × body weight", icon: Pill, fields: [N("weight", "Berat", "kg", "65"), N("dose", "Dose", "mg/kg", "10")] },
  { id: "liquiddose", title: "Liquid Dose Volume", category: "Medication", desc: "Convert dose to volume", icon: Pill, fields: [N("doseMg", "Required dose", "mg", "250"), N("concentration", "Concentration", "mg/mL", "50"), N("volume", "Reference volume", "mL", "1")] },
  { id: "ivrate", title: "IV Rate", category: "Procedures", desc: "Volume / time", icon: Syringe, fields: [N("volume", "Volume", "mL", "500"), N("hours", "Time", "hours", "4")] },
  { id: "drip", title: "IV Drip Rate", category: "Procedures", desc: "Drops per minute", icon: Syringe, fields: [N("volume", "Volume", "mL", "500"), N("drop", "Drop factor", "gtt/mL", "20"), N("hours", "Time", "hours", "4")] },
  { id: "bloodvolume", title: "Estimated Blood Volume", category: "Hematology", desc: "Weight × factor", icon: Droplets, fields: [N("weight", "Berat", "kg", "65"), N("factor", "EBV factor", "mL/kg", "70")] },
  { id: "abl", title: "Allowable Blood Loss", category: "Hematology", desc: "Gross allowable blood loss", icon: Droplets, fields: [N("ebv", "EBV", "mL", "4550"), N("hctInitial", "Initial Hct", "%", "40"), N("hctTarget", "Target Hct", "%", "30")] },
  { id: "winter", title: "Winter Formula", category: "Acid Base", desc: "Expected PaCO₂ in metabolic acidosis", icon: Zap, fields: [N("hco3", "HCO₃", "mmol/L", "12")] },
  { id: "bicarbdef", title: "Bicarbonate Deficit", category: "Acid Base", desc: "Estimated bicarbonate deficit", icon: Zap, fields: [N("weight", "Berat", "kg", "65"), N("hco3", "Current HCO₃", "mmol/L", "12"), N("target", "Target HCO₃", "mmol/L", "24")] },
  { id: "pf", title: "P/F Ratio", category: "Respiratory", desc: "PaO₂ / FiO₂", icon: Activity, fields: [N("pao2", "PaO₂", "mmHg", "80"), N("fio2", "FiO₂", "decimal", "0.4")] },
  { id: "agrad", title: "A–a Gradient", category: "Respiratory", desc: "Alveolar–arterial oxygen gradient", icon: Activity, fields: [N("fio2", "FiO₂", "decimal", "0.21"), N("paco2", "PaCO₂", "mmHg", "40"), N("pao2", "PaO₂", "mmHg", "95"), N("age", "Age", "tahun", "45")] },
  { id: "bmr", title: "Basal Metabolic Rate", category: "General", desc: "Mifflin–St Jeor", icon: Calculator, fields: [N("weight", "Berat", "kg", "65"), N("height", "Tinggi", "cm", "170"), N("age", "Usia", "tahun", "30"), S("sex", "Jenis kelamin", ["Laki-laki", "Perempuan"])] },
];

export default function ClinicalToolsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [values, setValues] = useState<Record<string, Values>>(() => Object.fromEntries(tools.map(t => [t.id, Object.fromEntries(t.fields.map(f => [f.key, f.defaultValue ?? (f.type === "select" ? f.options?.[0] ?? "" : "")]))])) as Record<string, Values>);

  const categories = ["All", ...Array.from(new Set(tools.map(t => t.category)))];
  const filtered = useMemo(() => tools.filter(t => (category === "All" || t.category === category) && (t.title + " " + t.desc + " " + t.category).toLowerCase().includes(query.toLowerCase())), [query, category]);

  const update = (toolId: string, key: string, value: string) => setValues(prev => ({ ...prev, [toolId]: { ...prev[toolId], [key]: value } }));
  const reset = (tool: Tool) => setValues(prev => ({ ...prev, [tool.id]: Object.fromEntries(tool.fields.map(f => [f.key, f.defaultValue ?? (f.type === "select" ? f.options?.[0] ?? "" : "")])) }));

  return (
    <main className="tools-page">
      <header className="tools-header">
        <div><div className="eyebrow">DOKTER JAGA CLINICAL</div><h1>Clinical Tools</h1><p>50 kalkulator klinis untuk membantu perhitungan cepat di workflow praktik.</p></div>
        <div className="tools-count"><strong>{tools.length}</strong><span>tools</span></div>
      </header>
      <section className="tools-toolbar">
        <input aria-label="Cari clinical tool" placeholder="Cari tool..." value={query} onChange={e => setQuery(e.target.value)} />
        <select aria-label="Filter kategori" value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select>
      </section>
      <div className="tools-grid">
        {filtered.map(tool => {
          const Icon = tool.icon;
          const [result, unit, note] = calculate(tool.id, values[tool.id] ?? {});
          return <article className="tool-card" key={tool.id}>
            <div className="tool-card-head"><div className="tool-icon"><Icon size={18} /></div><div><h2>{tool.title}</h2><p>{tool.category} · {tool.desc}</p></div></div>
            <div className="tool-fields">{tool.fields.map(field => <label key={field.key}><span>{field.label}</span><div className="tool-input-wrap">{field.type === "select" ? <select value={values[tool.id]?.[field.key] ?? field.defaultValue ?? ""} onChange={e => update(tool.id, field.key, e.target.value)}>{(field.options ?? []).map(o => <option key={o}>{o}</option>)}</select> : <input type="number" value={values[tool.id]?.[field.key] ?? ""} onChange={e => update(tool.id, field.key, e.target.value)} />}{field.unit && <small>{field.unit}</small>}</div></label>)}</div>
            <div className="tool-result"><span>Hasil</span><strong>{String(result)} <em>{unit}</em></strong><small>{note}</small></div>
            <button className="tool-reset" type="button" onClick={() => reset(tool)}>Reset</button>
          </article>;
        })}
      </div>
      <p className="tool-disclaimer">Clinical support only. Validate inputs, formula applicability, units, and local guideline context before clinical use.</p>
    </main>
  );
}
