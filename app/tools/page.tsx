"use client";

import { useMemo, useState } from "react";
import {
  Activity, AlertTriangle, Calculator, CheckCircle2, Clipboard, Droplets,
  HeartPulse, Info, Pill, ChevronRight, RotateCcw, Search, ShieldCheck,
  Stethoscope, Syringe, Timer, Weight, Zap
} from "lucide-react";

type Field = {
  key: string;
  label: string;
  unit?: string;
  type?: "number" | "select";
  defaultValue?: string;
  options?: string[];
};
type Tool = {
  id: string;
  title: string;
  category: string;
  desc: string;
  icon: typeof Calculator;
  fields: Field[];
  caution?: string;
};

const tools: Tool[] = [
  { id: "bmi", title: "BMI Calculator", category: "General", desc: "Body mass index", icon: Weight, fields: [
    { key: "height", label: "Tinggi", unit: "cm", defaultValue: "170" }, { key: "weight", label: "Berat", unit: "kg", defaultValue: "65" }
  ]},
  { id: "bsa", title: "BSA Calculator", category: "General", desc: "Body surface area — Mosteller", icon: Weight, fields: [
    { key: "height", label: "Tinggi", unit: "cm", defaultValue: "170" }, { key: "weight", label: "Berat", unit: "kg", defaultValue: "65" }
  ]},
  { id: "ibw", title: "Ideal Body Weight", category: "General", desc: "Devine ideal body weight", icon: Weight, fields: [
    { key: "sex", label: "Jenis kelamin", type: "select", options: ["Laki-laki", "Perempuan"], defaultValue: "Laki-laki" },
    { key: "height", label: "Tinggi", unit: "cm", defaultValue: "170" }
  ]},
  { id: "map", title: "MAP Calculator", category: "Hemodynamics", desc: "Mean arterial pressure", icon: HeartPulse, fields: [
    { key: "sbp", label: "Systolic", unit: "mmHg", defaultValue: "120" }, { key: "dbp", label: "Diastolic", unit: "mmHg", defaultValue: "80" }
  ]},
  { id: "pp", title: "Pulse Pressure", category: "Hemodynamics", desc: "Systolic minus diastolic pressure", icon: HeartPulse, fields: [
    { key: "sbp", label: "Systolic", unit: "mmHg", defaultValue: "120" }, { key: "dbp", label: "Diastolic", unit: "mmHg", defaultValue: "80" }
  ]},
  { id: "shock", title: "Shock Index", category: "Hemodynamics", desc: "Heart rate / systolic BP", icon: Activity, fields: [
    { key: "hr", label: "Heart rate", unit: "/min", defaultValue: "80" }, { key: "sbp", label: "Systolic", unit: "mmHg", defaultValue: "120" }
  ]},
  { id: "gcs", title: "GCS Helper", category: "Neurology", desc: "Glasgow Coma Scale", icon: Calculator, fields: [
    { key: "eye", label: "Eye", type: "select", options: ["4", "3", "2", "1"], defaultValue: "4" },
    { key: "verbal", label: "Verbal", type: "select", options: ["5", "4", "3", "2", "1"], defaultValue: "5" },
    { key: "motor", label: "Motor", type: "select", options: ["6", "5", "4", "3", "2", "1"], defaultValue: "6" }
  ]},
  { id: "four", title: "FOUR Score", category: "Neurology", desc: "Full Outline of UnResponsiveness", icon: Stethoscope, fields: [
    { key: "eye", label: "Eye", type: "select", options: ["4", "3", "2", "1", "0"], defaultValue: "4" },
    { key: "motor", label: "Motor", type: "select", options: ["4", "3", "2", "1", "0"], defaultValue: "4" },
    { key: "brainstem", label: "Brainstem", type: "select", options: ["4", "3", "2", "1", "0"], defaultValue: "4" },
    { key: "resp", label: "Respiration", type: "select", options: ["4", "3", "2", "1", "0"], defaultValue: "4" }
  ]},
  { id: "crcl", title: "Creatinine Clearance", category: "Renal", desc: "Cockcroft–Gault estimate", icon: Activity, fields: [
    { key: "age", label: "Usia", unit: "tahun", defaultValue: "45" }, { key: "sex", label: "Jenis kelamin", type: "select", options: ["Laki-laki", "Perempuan"], defaultValue: "Laki-laki" },
    { key: "weight", label: "Berat", unit: "kg", defaultValue: "65" }, { key: "scr", label: "Serum creatinine", unit: "mg/dL", defaultValue: "1.0" }
  ]},
  { id: "egfr", title: "eGFR CKD-EPI 2021", category: "Renal", desc: "Creatinine-based adult eGFR", icon: Activity, fields: [
    { key: "age", label: "Usia", unit: "tahun", defaultValue: "45" }, { key: "sex", label: "Jenis kelamin", type: "select", options: ["Laki-laki", "Perempuan"], defaultValue: "Laki-laki" },
    { key: "scr", label: "Serum creatinine", unit: "mg/dL", defaultValue: "1.0" }
  ]},
  { id: "fena", title: "Fractional Excretion Na", category: "Renal", desc: "Fractional sodium excretion", icon: Droplets, fields: [
    { key: "una", label: "Urine Na", unit: "mmol/L", defaultValue: "40" }, { key: "ucreat", label: "Urine Cr", unit: "mg/dL", defaultValue: "100" },
    { key: "pna", label: "Plasma Na", unit: "mmol/L", defaultValue: "140" }, { key: "pcreat", label: "Plasma Cr", unit: "mg/dL", defaultValue: "1.0" }
  ]},
  { id: "feurea", title: "Fractional Excretion Urea", category: "Renal", desc: "Fractional urea excretion", icon: Droplets, fields: [
    { key: "uurea", label: "Urine urea", unit: "mg/dL", defaultValue: "300" }, { key: "ucreat", label: "Urine Cr", unit: "mg/dL", defaultValue: "100" },
    { key: "purea", label: "Plasma urea", unit: "mg/dL", defaultValue: "40" }, { key: "pcreat", label: "Plasma Cr", unit: "mg/dL", defaultValue: "1.0" }
  ]},
  { id: "anion", title: "Anion Gap", category: "Electrolytes", desc: "Na − (Cl + HCO₃)", icon: Zap, fields: [
    { key: "na", label: "Na", unit: "mmol/L", defaultValue: "140" }, { key: "cl", label: "Cl", unit: "mmol/L", defaultValue: "104" }, { key: "hco3", label: "HCO₃", unit: "mmol/L", defaultValue: "24" }
  ]},
  { id: "agk", title: "Anion Gap + K", category: "Electrolytes", desc: "Anion gap including potassium", icon: Zap, fields: [
    { key: "na", label: "Na", unit: "mmol/L", defaultValue: "140" }, { key: "k", label: "K", unit: "mmol/L", defaultValue: "4" },
    { key: "cl", label: "Cl", unit: "mmol/L", defaultValue: "104" }, { key: "hco3", label: "HCO₃", unit: "mmol/L", defaultValue: "24" }
  ]},
  { id: "corrna", title: "Corrected Sodium", category: "Electrolytes", desc: "Hyperglycemia sodium correction", icon: Zap, fields: [
    { key: "na", label: "Measured Na", unit: "mmol/L", defaultValue: "130" }, { key: "glucose", label: "Glucose", unit: "mg/dL", defaultValue: "300" },
    { key: "factor", label: "Factor", type: "select", options: ["1.6", "2.4"], defaultValue: "1.6" }
  ]},
  { id: "corrca", title: "Corrected Calcium", category: "Electrolytes", desc: "Albumin-adjusted calcium", icon: Zap, fields: [
    { key: "ca", label: "Total Ca", unit: "mg/dL", defaultValue: "8.0" }, { key: "albumin", label: "Albumin", unit: "g/dL", defaultValue: "3.0" }
  ]},
  { id: "osm", title: "Serum Osmolality", category: "Electrolytes", desc: "Calculated serum osmolality", icon: Droplets, fields: [
    { key: "na", label: "Na", unit: "mmol/L", defaultValue: "140" }, { key: "glucose", label: "Glucose", unit: "mg/dL", defaultValue: "100" }, { key: "bun", label: "BUN", unit: "mg/dL", defaultValue: "15" }
  ]},
  { id: "osmgap", title: "Osmolal Gap", category: "Electrolytes", desc: "Measured minus calculated osmolality", icon: Droplets, fields: [
    { key: "measured", label: "Measured osmolality", unit: "mOsm/kg", defaultValue: "290" }, { key: "na", label: "Na", unit: "mmol/L", defaultValue: "140" },
    { key: "glucose", label: "Glucose", unit: "mg/dL", defaultValue: "100" }, { key: "bun", label: "BUN", unit: "mg/dL", defaultValue: "15" }
  ]},
  { id: "freewater", title: "Free Water Deficit", category: "Electrolytes", desc: "Estimated free-water deficit", icon: Droplets, fields: [
    { key: "weight", label: "Berat", unit: "kg", defaultValue: "65" }, { key: "sex", label: "Jenis kelamin", type: "select", options: ["Laki-laki", "Perempuan"], defaultValue: "Laki-laki" },
    { key: "na", label: "Na", unit: "mmol/L", defaultValue: "155" }, { key: "target", label: "Target Na", unit: "mmol/L", defaultValue: "140" }
  ]},
  { id: "qtc", title: "QTc Calculator", category: "Cardiology", desc: "Bazett or Fridericia", icon: HeartPulse, fields: [
    { key: "qt", label: "QT", unit: "ms", defaultValue: "420" }, { key: "rr", label: "RR", unit: "ms", defaultValue: "800" },
    { key: "method", label: "Formula", type: "select", options: ["Bazett", "Fridericia"], defaultValue: "Bazett" }
  ]},
  { id: "heart", title: "HEART Score", category: "Cardiology", desc: "Chest-pain risk score components", icon: HeartPulse, fields: [
    { key: "history", label: "History", type: "select", options: ["0", "1", "2"], defaultValue: "0" }, { key: "ecg", label: "ECG", type: "select", options: ["0", "1", "2"], defaultValue: "0" },
    { key: "age", label: "Age", unit: "tahun", defaultValue: "45" }, { key: "risk", label: "Risk factors", type: "select", options: ["0", "1", "2"], defaultValue: "0" },
    { key: "troponin", label: "Troponin", type: "select", options: ["0", "1", "2"], defaultValue: "0" }
  ]},
  { id: "chasvasc", title: "CHA₂DS₂-VASc", category: "Cardiology", desc: "Stroke-risk factor count in AF", icon: HeartPulse, fields: [
    { key: "chf", label: "Heart failure", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "htn", label: "Hypertension", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "age", label: "Age", unit: "tahun", defaultValue: "65" }, { key: "dm", label: "Diabetes", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "stroke", label: "Prior stroke/TIA/TE", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "vascular", label: "Vascular disease", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "sex", label: "Sex", type: "select", options: ["Laki-laki", "Perempuan"], defaultValue: "Perempuan" }
  ]},
  { id: "hasbled", title: "HAS-BLED", category: "Cardiology", desc: "Bleeding risk factor count", icon: AlertTriangle, fields: [
    { key: "htn", label: "Uncontrolled HTN", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "renal", label: "Abnormal renal function", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "liver", label: "Abnormal liver function", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "stroke", label: "Prior stroke", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "bleed", label: "Bleeding history", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "inr", label: "Labile INR", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "age", label: "Age >65", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "drugs", label: "Drugs predisposing bleed", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "alcohol", label: "Alcohol use", type: "select", options: ["No", "Yes"], defaultValue: "No" }
  ]},
  { id: "timi", title: "TIMI UA/NSTEMI", category: "Cardiology", desc: "Seven-item bedside score", icon: HeartPulse, fields: [
    { key: "age", label: "Age ≥65", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "risk", label: "≥3 risk factors", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "known", label: "Known CAD", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "aspirin", label: "Aspirin use", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "angina", label: "Recent severe angina", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "st", label: "ST deviation", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "marker", label: "Positive cardiac marker", type: "select", options: ["No", "Yes"], defaultValue: "No" }
  ]},
  { id: "wellspe", title: "Wells PE", category: "Emergency", desc: "Pulmonary embolism pretest score", icon: AlertTriangle, fields: [
    { key: "dvt", label: "Clinical DVT signs", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "alt", label: "PE most likely", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "hr", label: "HR >100", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "surgery", label: "Surgery/immobilization", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "prior", label: "Prior DVT/PE", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "hemoptysis", label: "Hemoptysis", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "malignancy", label: "Malignancy", type: "select", options: ["No", "Yes"], defaultValue: "No" }
  ]},
  { id: "perc", title: "PERC Rule", category: "Emergency", desc: "Pulmonary embolism rule-out checklist", icon: ShieldCheck, fields: [
    { key: "age", label: "Age ≥50", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "hr", label: "HR ≥100", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "oxy", label: "SpO₂ <95%", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "hemoptysis", label: "Hemoptysis", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "estrogen", label: "Estrogen use", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "prior", label: "Prior DVT/PE", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "unilat", label: "Unilateral leg swelling", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "surgery", label: "Recent surgery/trauma", type: "select", options: ["No", "Yes"], defaultValue: "No" }
  ]},
  { id: "wellsdvt", title: "Wells DVT", category: "Emergency", desc: "Deep vein thrombosis pretest score", icon: AlertTriangle, fields: [
    { key: "cancer", label: "Active cancer", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "paralysis", label: "Paralysis/immobilization", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "bedrest", label: "Recent bedrest/surgery", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "tender", label: "Deep vein tenderness", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "swollenleg", label: "Entire leg swollen", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "calf", label: "Calf swelling >3 cm", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "edema", label: "Pitting edema", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "vein", label: "Collateral superficial veins", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "prior", label: "Previous DVT", type: "select", options: ["No", "Yes"], defaultValue: "No" }
  ]},
  { id: "parkland", title: "Parkland Formula", category: "Emergency", desc: "Burn resuscitation estimate", icon: Droplets, fields: [
    { key: "weight", label: "Berat", unit: "kg", defaultValue: "70" }, { key: "tbsa", label: "TBSA", unit: "%", defaultValue: "20" }, { key: "hours", label: "Hours since burn", unit: "jam", defaultValue: "0" }
  ]},
  { id: "sirs", title: "SIRS Criteria", category: "Emergency", desc: "Systemic inflammatory response checklist", icon: AlertTriangle, fields: [
    { key: "temp", label: "Temperature", unit: "°C", defaultValue: "37" }, { key: "hr", label: "Heart rate", unit: "/min", defaultValue: "80" },
    { key: "rr", label: "Respiratory rate", unit: "/min", defaultValue: "18" }, { key: "wbc", label: "WBC", unit: "×10⁹/L", defaultValue: "8" }
  ]},
  { id: "curb65", title: "CURB-65", category: "Infectious", desc: "CAP severity support", icon: Stethoscope, fields: [
    { key: "confusion", label: "Confusion", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "urea", label: "Urea >7 mmol/L", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "rr", label: "RR ≥30", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "bp", label: "SBP <90 or DBP ≤60", type: "select", options: ["No", "Yes"], defaultValue: "No" },
    { key: "age", label: "Age ≥65", type: "select", options: ["No", "Yes"], defaultValue: "No" }
  ]},
  { id: "qsofa", title: "qSOFA", category: "Sepsis", desc: "Bedside organ dysfunction screen", icon: AlertTriangle, fields: [
    { key: "rr", label: "RR ≥22", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "sbp", label: "SBP ≤100", type: "select", options: ["No", "Yes"], defaultValue: "No" }, { key: "mental", label: "Altered mentation", type: "select", options: ["No", "Yes"], defaultValue: "No" }
  ]},
  { id: "news2", title: "NEWS2", category: "Sepsis", desc: "National Early Warning Score 2", icon: Activity, fields: [
    { key: "rr", label: "Respiratory rate", unit: "/min", defaultValue: "18" }, { key: "spo2", label: "SpO₂", unit: "%", defaultValue: "98" },
    { key: "sbp", label: "Systolic BP", unit: "mmHg", defaultValue: "120" }, { key: "pulse", label: "Pulse", unit: "/min", defaultValue: "80" },
    { key: "temp", label: "Temperature", unit: "°C", defaultValue: "37" }, { key: "conscious", label: "Consciousness", type: "select", options: ["A", "C/V/P/U"], defaultValue: "A" },
    { key: "o2", label: "Supplemental O₂", type: "select", options: ["No", "Yes"], defaultValue: "No" }
  ]},
  { id: "sofa", title: "SOFA Score", category: "Sepsis", desc: "Sequential organ failure assessment", icon: Activity, fields: [
    { key: "resp", label: "Respiratory points", type: "select", options: ["0", "1", "2", "3", "4"], defaultValue: "0" }, { key: "coag", label: "Coagulation points", type: "select", options: ["0", "1", "2", "3", "4"], defaultValue: "0" },
    { key: "liver", label: "Liver points", type: "select", options: ["0", "1", "2", "3", "4"], defaultValue: "0" }, { key: "cardio", label: "Cardiovascular points", type: "select", options: ["0", "1", "2", "3", "4"], defaultValue: "0" },
    { key: "cns", label: "CNS points", type: "select", options: ["0", "1", "2", "3", "4"], defaultValue: "0" }, { key: "renal", label: "Renal points", type: "select", options: ["0", "1", "2", "3", "4"], defaultValue: "0" }
  ]},
  { id: "childpugh", title: "Child-Pugh", category: "Hepatology", desc: "Chronic liver disease severity", icon: Stethoscope, fields: [
    { key: "bilirubin", label: "Bilirubin points", type: "select", options: ["1", "2", "3"], defaultValue: "1" }, { key: "albumin", label: "Albumin points", type: "select", options: ["1", "2", "3"], defaultValue: "1" },
    { key: "inr", label: "INR points", type: "select", options: ["1", "2", "3"], defaultValue: "1" }, { key: "ascites", label: "Ascites points", type: "select", options: ["1", "2", "3"], defaultValue: "1" },
    { key: "enceph", label: "Encephalopathy points", type: "select", options: ["1", "2", "3"], defaultValue: "1" }
  ]},
  { id: "fib4", title: "FIB-4", category: "Hepatology", desc: "Non-invasive fibrosis index", icon: Stethoscope, fields: [
    { key: "age", label: "Age", unit: "tahun", defaultValue: "45" }, { key: "ast", label: "AST", unit: "U/L", defaultValue: "40" },
    { key: "alt", label: "ALT", unit: "U/L", defaultValue: "40" }, { key: "platelet", label: "Platelet", unit: "×10⁹/L", defaultValue: "200" }
  ]},
  { id: "apri", title: "APRI", category: "Hepatology", desc: "AST to platelet ratio index", icon: Stethoscope, fields: [
    { key: "ast", label: "AST", unit: "U/L", defaultValue: "40" }, { key: "uln", label: "AST ULN", unit: "U/L", defaultValue: "40" }, { key: "platelet", label: "Platelet", unit: "×10⁹/L", defaultValue: "200" }
  ]},
  { id: "meld", title: "MELD Calculator", category: "Hepatology", desc: "Classic MELD base estimate", icon: Stethoscope, fields: [
    { key: "bilirubin", label: "Bilirubin", unit: "mg/dL", defaultValue: "1.0" }, { key: "inr", label: "INR", defaultValue: "1.0" }, { key: "creatinine", label: "Creatinine", unit: "mg/dL", defaultValue: "1.0" }
  ], caution: "This workspace uses classic MELD base inputs. Verify the intended MELD/MELD-Na version before clinical use."},
  { id: "rfactor", title: "R Factor", category: "Hepatology", desc: "DILI biochemical pattern", icon: Stethoscope, fields: [
    { key: "alt", label: "ALT", unit: "U/L", defaultValue: "120" }, { key: "altuln", label: "ALT ULN", unit: "U/L", defaultValue: "40" },
    { key: "alp", label: "ALP", unit: "U/L", defaultValue: "150" }, { key: "alpuln", label: "ALP ULN", unit: "U/L", defaultValue: "120" }
  ]},
  { id: "homair", title: "HOMA-IR", category: "Endocrine", desc: "Insulin resistance estimate", icon: Activity, fields: [
    { key: "glucose", label: "Fasting glucose", unit: "mg/dL", defaultValue: "100" }, { key: "insulin", label: "Fasting insulin", unit: "µU/mL", defaultValue: "10" }
  ]},
  { id: "pedsfluid", title: "Pediatric Maintenance Fluid", category: "Pediatrics", desc: "4-2-1 hourly method", icon: Droplets, fields: [
    { key: "weight", label: "Berat", unit: "kg", defaultValue: "20" }
  ]},
  { id: "adjbw", title: "Adjusted Body Weight", category: "Medication", desc: "IBW + correction × excess weight", icon: Weight, fields: [
    { key: "weight", label: "Actual weight", unit: "kg", defaultValue: "100" }, { key: "ibw", label: "IBW", unit: "kg", defaultValue: "65" }, { key: "factor", label: "Correction factor", defaultValue: "0.4" }
  ]},
  { id: "wtbased", title: "Weight-Based Dose", category: "Medication", desc: "Dose × body weight", icon: Pill, fields: [
    { key: "weight", label: "Berat", unit: "kg", defaultValue: "65" }, { key: "dose", label: "Dose", unit: "mg/kg", defaultValue: "10" }
  ]},
  { id: "liquiddose", title: "Liquid Dose Volume", category: "Medication", desc: "Convert prescribed dose to volume", icon: Syringe, fields: [
    { key: "dose", label: "Required dose", unit: "mg", defaultValue: "250" }, { key: "strength", label: "Available", unit: "mg", defaultValue: "125" }, { key: "volume", label: "Available volume", unit: "mL", defaultValue: "5" }
  ]},
  { id: "ivrate", title: "IV Rate", category: "Procedures", desc: "mL/hour and drops/minute", icon: Syringe, fields: [
    { key: "volume", label: "Volume", unit: "mL", defaultValue: "1000" }, { key: "hours", label: "Time", unit: "hours", defaultValue: "8" }, { key: "drop", label: "Drop factor", unit: "gtt/mL", defaultValue: "20" }
  ]},
  { id: "ebv", title: "Estimated Blood Volume", category: "Hematology", desc: "Weight × estimated blood-volume factor", icon: Droplets, fields: [
    { key: "weight", label: "Berat", unit: "kg", defaultValue: "70" }, { key: "factor", label: "EBV factor", unit: "mL/kg", defaultValue: "70" }
  ]},
  { id: "abl", title: "Allowable Blood Loss", category: "Hematology", desc: "Simplified allowable blood loss", icon: Droplets, fields: [
    { key: "ebv", label: "EBV", unit: "mL", defaultValue: "4900" }, { key: "hct0", label: "Initial Hct", unit: "%", defaultValue: "42" }, { key: "hctmin", label: "Minimum Hct", unit: "%", defaultValue: "30" }
  ]},
  { id: "winter", title: "Winter Formula", category: "Acid–Base", desc: "Expected PaCO₂ in metabolic acidosis", icon: Zap, fields: [
    { key: "hco3", label: "HCO₃", unit: "mmol/L", defaultValue: "12" }
  ]},
  { id: "hco3def", title: "Bicarbonate Deficit", category: "Acid–Base", desc: "Estimated bicarbonate deficit", icon: Zap, fields: [
    { key: "weight", label: "Berat", unit: "kg", defaultValue: "70" }, { key: "target", label: "Target HCO₃", unit: "mmol/L", defaultValue: "24" },
    { key: "actual", label: "Actual HCO₃", unit: "mmol/L", defaultValue: "12" }, { key: "factor", label: "Distribution factor", defaultValue: "0.5" }
  ]},
  { id: "pf", title: "P/F Ratio", category: "Respiratory", desc: "PaO₂ / FiO₂", icon: Activity, fields: [
    { key: "pao2", label: "PaO₂", unit: "mmHg", defaultValue: "90" }, { key: "fio2", label: "FiO₂", unit: "decimal", defaultValue: "0.21" }
  ]},
  { id: "aagrad", title: "A–a Gradient", category: "Respiratory", desc: "Estimated alveolar–arterial oxygen gradient", icon: Activity, fields: [
    { key: "fio2", label: "FiO₂", unit: "decimal", defaultValue: "0.21" }, { key: "pao2", label: "PaO₂", unit: "mmHg", defaultValue: "90" },
    { key: "paco2", label: "PaCO₂", unit: "mmHg", defaultValue: "40" }, { key: "age", label: "Age", unit: "tahun", defaultValue: "45" }
  ]}
];

function num(v?: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function yes(v?: string) {
  return v === "Yes" ? 1 : 0;
}
function choice(v?: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function round(n: number, d = 1) {
  return Number.isFinite(n) ? Number(n.toFixed(d)) : 0;
}

function calculate(id: string, v: Record<string, string>): [number | string, string, string] {
  const n = (k: string) => num(v[k]);
  switch (id) {
    case "bmi": {
      const x = n("weight") / Math.pow(n("height") / 100, 2);
      return [round(x, 1), "kg/m²", x < 18.5 ? "Underweight" : x < 25 ? "Normal" : x < 30 ? "Overweight" : "Obesity"];
    }
    case "bsa":
      return [round(Math.sqrt(n("height") * n("weight") / 3600), 2), "m²", "Mosteller"];
    case "ibw": {
      const x = (v.sex === "Perempuan" ? 45.5 : 50) + 0.9 * (n("height") - 152.4);
      return [round(x, 1), "kg", "Devine IBW"];
    }
    case "map": return [round((n("sbp") + 2 * n("dbp")) / 3), "mmHg", "≈ weighted arterial pressure"];
    case "pp": return [round(n("sbp") - n("dbp")), "mmHg", "Systolic − diastolic"];
    case "shock": return [round(n("hr") / Math.max(n("sbp"), 1), 2), "index", "HR / SBP"];
    case "gcs": return [choice(v.eye) + choice(v.verbal) + choice(v.motor), "/15", "Eye + Verbal + Motor"];
    case "four": return [choice(v.eye) + choice(v.motor) + choice(v.brainstem) + choice(v.resp), "/16", "FOUR score"];
    case "crcl": {
      const base = ((140 - n("age")) * n("weight")) / (72 * Math.max(n("scr"), 0.1));
      return [round(v.sex === "Perempuan" ? base * 0.85 : base), "mL/min", "Cockcroft–Gault estimate"];
    }
    case "egfr": {
      const scr = Math.max(n("scr"), 0.01);
      const k = v.sex === "Perempuan" ? 0.7 : 0.9;
      const a = v.sex === "Perempuan" ? -0.241 : -0.302;
      const sexFactor = v.sex === "Perempuan" ? 1.012 : 1;
      const x = 142 * Math.pow(Math.min(scr / k, 1), a) * Math.pow(Math.max(scr / k, 1), -1.2) * Math.pow(0.9938, n("age")) * sexFactor;
      return [round(x), "mL/min/1.73m²", "CKD-EPI 2021 creatinine"];
    }
    case "fena": return [round((n("una") * n("pcreat")) / Math.max(n("pna") * n("ucreat"), 0.0001) * 100, 2), "%", "FeNa"];
    case "feurea": return [round((n("uurea") * n("pcreat")) / Math.max(n("purea") * n("ucreat"), 0.0001) * 100, 1), "%", "FeUrea"];
    case "anion": return [round(n("na") - n("cl") - n("hco3")), "mmol/L", "Without K"];
    case "agk": return [round(n("na") + n("k") - n("cl") - n("hco3")), "mmol/L", "Including K"];
    case "corrna": return [round(n("na") + (n("glucose") - 100) / 100 * n("factor"), 1), "mmol/L", "Glucose-corrected Na"];
    case "corrca": return [round(n("ca") + 0.8 * (4 - n("albumin")), 1), "mg/dL", "Albumin-adjusted Ca"];
    case "osm": return [round(2 * n("na") + n("glucose") / 18 + n("bun") / 2.8, 1), "mOsm/kg", "Calculated serum osmolality"];
    case "osmgap": {
      const calc = 2 * n("na") + n("glucose") / 18 + n("bun") / 2.8;
      return [round(n("measured") - calc, 1), "mOsm/kg", "Measured − calculated"];
    }
    case "freewater": {
      const tbw = n("weight") * (v.sex === "Perempuan" ? 0.5 : 0.6);
      return [round(tbw * (n("na") / Math.max(n("target"), 1) - 1), 2), "L", "Estimated free-water deficit"];
    }
    case "qtc": {
      const rrSec = n("rr") / 1000;
      const x = v.method === "Fridericia" ? n("qt") / Math.cbrt(Math.max(rrSec, 0.01)) : n("qt") / Math.sqrt(Math.max(rrSec, 0.01));
      return [round(x), "ms", v.method || "Bazett"];
    }
    case "heart": return [choice(v.history) + choice(v.ecg) + (n("age") >= 65 ? 2 : n("age") >= 45 ? 1 : 0) + choice(v.risk) + choice(v.troponin), "/10", "HEART components"];
    case "chasvasc": {
      const age = n("age");
      const score = yes(v.chf) + yes(v.htn) + yes(v.dm) + yes(v.vascular) + (age >= 75 ? 2 : age >= 65 ? 1 : 0) + 2 * yes(v.stroke) + (v.sex === "Perempuan" ? 1 : 0);
      return [score, "points", "CHA₂DS₂-VASc"];
    }
    case "hasbled": return [yes(v.htn) + yes(v.renal) + yes(v.liver) + yes(v.stroke) + yes(v.bleed) + yes(v.inr) + yes(v.age) + yes(v.drugs) + yes(v.alcohol), "points", "HAS-BLED factors"];
    case "timi": return [yes(v.age) + yes(v.risk) + yes(v.known) + yes(v.aspirin) + yes(v.angina) + yes(v.st) + yes(v.marker), "/7", "TIMI UA/NSTEMI"];
    case "wellspe": return [yes(v.dvt) * 3 + yes(v.alt) * 3 + yes(v.hr) * 1.5 + yes(v.surgery) * 1.5 + yes(v.prior) * 1.5 + yes(v.hemoptysis) + yes(v.malignancy), "points", "Wells PE"];
    case "perc": return [yes(v.age) + yes(v.hr) + yes(v.oxy) + yes(v.hemoptysis) + yes(v.estrogen) + yes(v.prior) + yes(v.unilat) + yes(v.surgery), "criteria", "PERC positive criteria"];
    case "wellsdvt": return [yes(v.cancer) + yes(v.paralysis) + yes(v.bedrest) + yes(v.tender) + yes(v.swollenleg) + yes(v.calf) + yes(v.edema) + yes(v.vein) + yes(v.prior), "points", "Wells DVT checklist"];
    case "parkland": {
      const total = 4 * n("weight") * n("tbsa");
      const elapsed = Math.min(Math.max(n("hours"), 0), 24);
      const first8 = total / 2;
      const remaining = Math.max(8 - elapsed, 0);
      const firstRate = first8 / Math.max(remaining, 1);
      return [round(firstRate), "mL/h", `First 8 h estimate; total ${round(total, 0)} mL`];
    }
    case "sirs": return [(n("temp") > 38 || n("temp") < 36 ? 1 : 0) + (n("hr") > 90 ? 1 : 0) + (n("rr") > 20 ? 1 : 0) + (n("wbc") > 12 || n("wbc") < 4 ? 1 : 0), "criteria", "SIRS criteria present"];
    case "curb65": return [yes(v.confusion) + yes(v.urea) + yes(v.rr) + yes(v.bp) + yes(v.age), "/5", "CURB-65 points"];
    case "qsofa": return [yes(v.rr) + yes(v.sbp) + yes(v.mental), "/3", "qSOFA points"];
    case "news2": {
      const rr = n("rr"), spo2 = n("spo2"), sbp = n("sbp"), pulse = n("pulse"), temp = n("temp");
      let s = 0;
      s += rr <= 8 ? 3 : rr <= 11 ? 1 : rr <= 20 ? 0 : rr <= 24 ? 2 : 3;
      s += spo2 >= 96 ? 0 : spo2 >= 94 ? 1 : spo2 >= 92 ? 2 : 3;
      s += sbp <= 90 ? 3 : sbp <= 100 ? 2 : sbp <= 110 ? 1 : sbp <= 219 ? 0 : 3;
      s += pulse <= 40 ? 3 : pulse <= 50 ? 1 : pulse <= 90 ? 0 : pulse <= 110 ? 1 : pulse <= 130 ? 2 : 3;
      s += temp < 35 ? 3 : temp < 36 ? 1 : temp <= 38 ? 0 : temp <= 39 ? 1 : 2;
      s += v.conscious === "A" ? 0 : 3;
      s += v.o2 === "Yes" ? 2 : 0;
      return [s, "points", "NEWS2 approximation"];
    }
    case "sofa": return [choice(v.resp) + choice(v.coag) + choice(v.liver) + choice(v.cardio) + choice(v.cns) + choice(v.renal), "/24", "User-entered organ points"];
    case "childpugh": return [choice(v.bilirubin) + choice(v.albumin) + choice(v.inr) + choice(v.ascites) + choice(v.enceph), "points", "Child-Pugh"];
    case "fib4": return [round((n("age") * n("ast")) / Math.max(n("platelet") * Math.sqrt(Math.max(n("alt"), 0.1)), 0.1), 2), "index", "FIB-4"];
    case "apri": return [round(((n("ast") / Math.max(n("uln"), 0.1)) / Math.max(n("platelet"), 0.1)) * 100, 2), "index", "APRI"];
    case "meld": return [round(3.78 * Math.log(Math.max(n("bilirubin"), 1)) + 11.2 * Math.log(Math.max(n("inr"), 1)) + 9.57 * Math.log(Math.max(n("creatinine"), 1)) + 6.43), "points", "Classic MELD base estimate"];
    case "rfactor": return [round((n("alt") / Math.max(n("altuln"), 0.1)) / Math.max(n("alp") / Math.max(n("alpuln"), 0.1), 0.1), 2), "R", "ALT ratio / ALP ratio"];
    case "homair": return [round((n("glucose") * n("insulin")) / 405, 2), "index", "HOMA-IR"];
    case "pedsfluid": {
      const w = n("weight");
      const rate = w <= 10 ? 4 * w : w <= 20 ? 40 + 2 * (w - 10) : 60 + (w - 20);
      return [round(rate), "mL/h", "4-2-1 method"];
    }
    case "adjbw": return [round(n("ibw") + n("factor") * (n("weight") - n("ibw")), 1), "kg", "Adjusted body weight"];
    case "wtbased": return [round(n("weight") * n("dose"), 1), "mg", "Dose × weight"];
    case "liquiddose": return [round((n("dose") / Math.max(n("strength"), 0.1)) * n("volume"), 2), "mL", "Required dose ÷ concentration"];
    case "ivrate": {
      const mlh = n("volume") / Math.max(n("hours"), 0.1);
      return [round(mlh), "mL/h", `${round(mlh * n("drop") / 60)} gtt/min at stated drop factor`];
    }
    case "ebv": return [round(n("weight") * n("factor")), "mL", "Weight × EBV factor"];
    case "abl": return [round(n("ebv") * (n("hct0") - n("hctmin")) / Math.max(n("hct0"), 1)), "mL", "Simplified allowable blood loss"];
    case "winter": return [round(1.5 * n("hco3") + 8), "mmHg", "Expected PaCO₂ ±2 mmHg"];
    case "hco3def": return [round(n("weight") * n("factor") * (n("target") - n("actual")), 1), "mEq", "Estimated bicarbonate deficit"];
    case "pf": return [round(n("pao2") / Math.max(n("fio2"), 0.01)), "ratio", "PaO₂ / FiO₂"];
    case "aagrad": {
      const alveolar = n("fio2") * 713 - n("paco2") / 0.8;
      return [round(alveolar - n("pao2")), "mmHg", `Estimated A–a gradient; rough age-adjusted upper ≈ ${round(n("age") / 4 + 4)} mmHg`];
    }
    default: return ["—", "", "No calculator configured"];
  }
}

function resultAdvice(id: string, value: number | string): string {
  if (typeof value !== "number") return "Lengkapi input dan verifikasi hasil.";
  if (id === "bmi") return value < 18.5 ? "BMI rendah" : value < 25 ? "Dalam rentang BMI umum dewasa" : value < 30 ? "BMI meningkat" : "Obesitas menurut cut-off BMI umum";
  if (id === "gcs") return value <= 8 ? "Kesadaran sangat menurun; perlukan penilaian airway/neurologis segera" : value <= 12 ? "Gangguan kesadaran sedang" : "GCS relatif tinggi";
  if (id === "qsofa") return value >= 2 ? "≥2: perlu evaluasi lebih lanjut pada konteks infeksi" : "0–1: qSOFA rendah";
  if (id === "news2") return value >= 7 ? "Skor tinggi; perlu respons klinis segera sesuai protokol setempat" : value >= 5 ? "Skor meningkat; perlu penilaian klinis dan monitoring" : "Skor rendah pada input ini";
  if (id === "shock") return value >= 0.9 ? "Shock index meningkat pada konteks klinis tertentu" : "Shock index tidak meningkat pada input ini";
  if (id === "anion") return value > 12 ? "Anion gap meningkat" : "Anion gap tidak meningkat secara bermakna";
  if (id === "pf") return value < 300 ? "P/F menurun" : "P/F tidak menunjukkan penurunan bermakna pada input ini";
  return "Gunakan hasil sebagai bantuan hitung, bukan keputusan klinis tunggal.";
}

export default function ToolsPage() {
  const [active, setActive] = useState("bmi");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const t of tools) for (const f of t.fields) initial[`${t.id}.${f.key}`] = f.defaultValue ?? "";
    return initial;
  });

  const categories = useMemo(() => ["Semua", ...Array.from(new Set(tools.map((t) => t.category)))], []);
  const filtered = useMemo(() => tools.filter((t) => {
    const matchesText = `${t.title} ${t.desc} ${t.category}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (category === "Semua" || t.category === category);
  }), [query, category]);

  const tool = tools.find((t) => t.id === active) ?? tools[0];
  const current: Record<string, string> = {};
  for (const f of tool.fields) current[f.key] = values[`${tool.id}.${f.key}`] ?? f.defaultValue ?? "";
  const [result, unit, formula] = calculate(tool.id, current);

  function setValue(key: string, value: string) {
    setValues((old) => ({ ...old, [`${tool.id}.${key}`]: value }));
  }
  function resetTool() {
    const next = { ...values };
    for (const f of tool.fields) next[`${tool.id}.${f.key}`] = f.defaultValue ?? "";
    setValues(next);
  }
  function copyResult() {
    navigator.clipboard?.writeText(`${tool.title}: ${result} ${unit} — ${formula}`);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">D</div><div><strong>Dokter Jaga</strong><span>Clinical Intelligence</span></div></div>
        <nav>
          <a className="nav-item" href="/">⌂ Beranda</a>
          <a className="nav-item" href="/patients">◯ Pasien</a>
          <a className="nav-item" href="/records">▤ Rekam Medis</a>
          <a className="nav-item" href="/prescriptions">◒ Resep</a>
          <a className="nav-item" href="/clinical">♥ Clinical Assistant<i>AI</i></a>
          <a className="nav-item active" href="/tools"><Calculator size={17}/>Tools</a>
        </nav>
        <div className="sidebar-bottom">
          <a className="nav-item" href="/schedule">◷ Jadwal</a>
          <a className="nav-item" href="/reports">◫ Laporan</a>
          <a className="nav-item" href="/settings">⚙ Pengaturan</a>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div className="search"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari clinical tools..."/></div>
          <div className="top-actions"><div className="top-doctor"><div className="avatar">DJ</div> Dokter Jaga</div></div>
        </header>

        <div className="page-head">
          <div><p className="eyebrow">CLINICAL TOOLS</p><h1>Clinical Tools</h1><p className="muted">50 kalkulator dan clinical scoring tools dalam satu workspace.</p></div>
          <div className="date-pill"><ShieldCheck size={15}/> Doctor review required</div>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {categories.map((c) => <button key={c} className={`text-btn ${category === c ? "category-active" : ""}`} onClick={() => setCategory(c)}>{c}</button>)}
        </div>

        <div className="workspace-grid" style={{ gridTemplateColumns: "1fr 1.15fr", alignItems: "start" }}>
          <section className="panel" style={{ padding: 14 }}>
            <div className="panel-head"><div><h2>Toolbox</h2><p>{filtered.length} dari 50 tools</p></div></div>
            <div className="tool-grid">
              {filtered.map((t) => {
                const Icon = t.icon;
                return <button key={t.id} className={`tool-card ${active === t.id ? "selected" : ""}`} onClick={() => setActive(t.id)}>
                  <div className="quick-icon teal"><Icon size={15}/></div><div><b>{t.title}</b><span>{t.desc}</span><em>{t.category}</em></div><ChevronRight size={14}/>
                </button>;
              })}
            </div>
          </section>

          <section className="panel" style={{ padding: 18 }}>
            <div className="panel-head">
              <div><p className="eyebrow">ACTIVE TOOL</p><h2 style={{ fontSize: 16, margin: 0 }}>{tool.title}</h2><p>{tool.desc}</p></div>
              <div className="status-chip"><CheckCircle2 size={12}/> Live calculation</div>
            </div>

            <div className="info-columns" style={{ gridTemplateColumns: "1fr 1fr", border: 0, padding: 0 }}>
              {tool.fields.map((f) => <label key={f.key} className="modal-card">{f.label} {f.unit ? <span>({f.unit})</span> : null}
                {f.type === "select" ? <select value={current[f.key]} onChange={(e) => setValue(f.key, e.target.value)}>{(f.options ?? []).map((o) => <option key={o}>{o}</option>)}</select>
                  : <input type="number" value={current[f.key]} onChange={(e) => setValue(f.key, e.target.value)} inputMode="decimal" />}
              </label>)}
            </div>

            <div className="stat-grid" style={{ marginTop: 12 }}>
              <div><b>{result}</b><span>{unit || "Result"}</span></div>
              <div><b style={{ fontSize: 12 }}>{resultAdvice(tool.id, result)}</b><span>Interpretasi ringkas</span></div>
            </div>

            <div className="trust-note" style={{ marginTop: 10 }}><Info size={15}/><span>Formula: {formula}</span></div>
            {tool.caution ? <div className="warning"><AlertTriangle size={14}/><span>{tool.caution}</span></div> : null}
            <div className="warning"><AlertTriangle size={14}/><span>Clinical support only. Verifikasi input, formula/version, kontraindikasi, dan konteks pasien sebelum keputusan klinis.</span></div>

            <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
              <button className="text-btn" onClick={resetTool}><RotateCcw size={12}/> Reset</button>
              <button className="text-btn" onClick={copyResult}><Clipboard size={12}/> Copy result</button>
              <button className="primary" style={{ marginLeft: "auto" }} onClick={() => alert("Hasil disiapkan untuk review dokter.")}>Review result <CheckCircle2 size={13}/></button>
            </div>
          </section>
        </div>

        <section className="panel compact" style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Timer size={17}/><div><b style={{ fontSize: 10 }}>Clinical workspace</b><p className="muted">Tools menggunakan deterministic calculations dan tidak melakukan diagnosis atau prescribing otomatis.</p></div>
        </section>
      </section>
    </main>
  );
}
