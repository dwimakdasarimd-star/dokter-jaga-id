export type Values = Record<string,string>;
export type CalcResult=[number|string,string,string];
const n=(v:string|undefined)=>{const x=Number(v);return Number.isFinite(x)?x:0};
const y=(v:string|undefined)=>v==="Yes"?1:0;
const r=(x:number,d=1)=>Number.isFinite(x)?Number(x.toFixed(d)):0;
export function calculate(id:string,v:Values):CalcResult{
 const q=(k:string)=>n(v[k]);
 switch(id){
  case "bmi":{const x=q("weight")/(q("height")/100)**2;return[r(x,1),"kg/m²",x<18.5?"Underweight":x<25?"Normal":x<30?"Overweight":"Obesity"]}
  case "bsa":return[r(Math.sqrt(q("height")*q("weight")/3600),2),"m²","Mosteller"];
  case "ibw":return[r((v.sex==="Perempuan"?45.5:50)+0.9*(q("height")-152.4),1),"kg","Devine"];
  case "map":return[r((q("sbp")+2*q("dbp"))/3),"mmHg","MAP"];
  case "pp":return[r(q("sbp")-q("dbp")),"mmHg","Pulse pressure"];
  case "shock":return[r(q("hr")/q("sbp"),2),"ratio","HR/SBP"];
  case "gcs":return[q("eye")+q("verbal")+q("motor"),"/15","E+V+M"];
  case "four":return[q("eye")+q("motor")+q("brainstem")+q("resp"),"/16","FOUR"];
  case "crcl":return[r(((140-q("age"))*q("weight"))/(72*q("scr"))*(v.sex==="Perempuan"?.85:1),1),"mL/min","Cockcroft-Gault"];
  case "egfr":{const s=q("scr"),age=q("age"),female=v.sex==="Perempuan",k=female?.7:.9,a=female?-0.241:-0.302;return[r(142*Math.min(s/k,1)**a*Math.max(s/k,1)**-1.2*.9938**age*(female?1.012:1)),"mL/min/1.73m²","CKD-EPI 2021"]}
  case "fena":return[r(q("una")*q("pcreat")/(q("pna")*q("ucreat"))*100,2),"%","FeNa"];
  case "feurea":return[r(q("uurea")*q("pcreat")/(q("purea")*q("ucreat"))*100,1),"%","FeUrea"];
  case "anion":return[r(q("na")-q("cl")-q("hco3")),"mmol/L","Na-Cl-HCO3"];
  case "agk":return[r(q("na")+q("k")-q("cl")-q("hco3")),"mmol/L","Na+K-Cl-HCO3"];
  case "corrna":return[r(q("na")+(q("glucose")-100)/100*q("factor")),"mmol/L","Corrected Na"];
  case "corrca":return[r(q("ca")+.8*(4-q("albumin")),2),"mg/dL","Corrected Ca"];
  case "osm":return[r(2*q("na")+q("glucose")/18+q("bun")/2.8,1),"mOsm/kg","Calculated osmolality"];
  case "osmgap":return[r(q("measured")-(2*q("na")+q("glucose")/18+q("bun")/2.8),1),"mOsm/kg","Osmolal gap"];
  case "freewater":return[r(q("weight")*(v.sex==="Perempuan"?.5:.6)*(q("na")/q("target")-1),1),"L","Free-water deficit"];
  case "qtc":{const qt=q("qt")/1000,rr=q("rr")/1000;return[r((v.method==="Fridericia"?qt/rr**(1/3):qt/Math.sqrt(rr))*1000),"ms",v.method||"Bazett"]}
  case "heart":return[q("history")+q("ecg")+(q("age")>=65?2:q("age")>=45?1:0)+q("risk")+q("troponin"),"/10","HEART"];
  case "chasvasc":return[y(v.chf)+y(v.htn)+(q("age")>=75?2:q("age")>=65?1:0)+y(v.dm)+2*y(v.stroke)+y(v.vascular)+(v.sex==="Perempuan"?1:0),"/9","CHA₂DS₂-VASc"];
  case "hasbled":return[y(v.htn)+y(v.renal)+y(v.liver)+y(v.stroke)+y(v.bleed)+y(v.inr)+y(v.age)+y(v.drugs)+y(v.alcohol),"/9","HAS-BLED"];
  case "timi":return[y(v.age)+y(v.risk)+y(v.known)+y(v.aspirin)+y(v.angina)+y(v.st)+y(v.marker),"/7","TIMI"];
  case "wellspe":return[2*y(v.dvt)+3*y(v.alt)+1.5*y(v.hr)+1.5*y(v.surgery)+1.5*y(v.prior)+y(v.hemoptysis)+y(v.malignancy),"points","Wells PE"];
  case "perc":return[y(v.age)+y(v.hr)+y(v.oxy)+y(v.hemoptysis)+y(v.estrogen)+y(v.prior)+y(v.unilat)+y(v.surgery),"criteria","PERC"];
  case "wellsdvt":return[y(v.cancer)+y(v.paralysis)+y(v.bedrest)+y(v.tender)+y(v.swollenleg)+y(v.calf)+y(v.edema)+y(v.vein)+y(v.prior),"points","Wells DVT"];
  case "parkland":return[r(4*q("weight")*q("tbsa"),0),"mL/24h","Parkland estimate"];
  case "qsofa":return[y(v.rr)+y(v.sbp)+y(v.mental),"/3","qSOFA"];
  case "sirs":return[(q("temp")>38||q("temp")<36?1:0)+(q("hr")>90?1:0)+(q("rr")>20||q("paco2")<32?1:0)+(q("wbc")>12||q("wbc")<4||q("bands")>10?1:0),"/4","SIRS"];
  case "sofa":return[q("resp")+q("coag")+q("liver")+q("cv")+q("cns")+q("renal"),"/24","SOFA"];
  case "news2":return[0,"points","NEWS2: enter component scoring; UI provides fields"];
  case "meld":return[r(3.78*Math.log(Math.max(q("bilirubin"),1))+11.2*Math.log(Math.max(q("inr"),1))+9.57*Math.log(Math.max(q("creatinine"),1))+6.43,0),"points","MELD-Classic estimate"];
  case "fib4":return[r(q("age")*q("ast")/(q("platelet")*Math.sqrt(q("alt"))),2),"index","FIB-4"];
  case "apri":return[r((q("ast")/q("astULN"))/q("platelet")*100,1),"index","APRI"];
  case "rfactor":return[r((q("alt")/q("altULN"))/(q("alp")/q("alpULN")),2),"ratio","R factor"];
  case "homair":return[r(q("glucose")*q("insulin")/405,2),"index","HOMA-IR"];
  case "pedsfluid":{const k=q("weight");return[r(k<=10?4*k:k<=20?40+2*(k-10):60+(k-20)),"mL/h","4-2-1"]}
  case "adjbw":return[r(q("ibw")+.4*(q("tbw")-q("ibw")),1),"kg","Adjusted BW"];
  case "weightdose":return[r(q("weight")*q("dose"),2),"mg","weight × dose"];
  case "liquiddose":return[r(q("doseMg")/q("concentration")*q("volume"),2),"mL","dose/concentration × volume"];
  case "ivrate":return[r(q("volume")/q("hours"),1),"mL/h","volume/time"];
  case "drip":return[r(q("volume")*q("drop")/(q("hours")*60),0),"gtt/min","drop factor"];
  case "bloodvolume":return[r(q("weight")*q("factor"),0),"mL","estimated blood volume"];
  case "abl":return[r(q("ebv")*(q("hct0")-q("hct1"))/Math.max(q("hct0"),.01),0),"mL","allowable blood loss"];
  case "winter":return[r(1.5*q("hco3")+8,1),"mmHg","Expected PaCO₂ ±2"];
  case "bicarbdef":return[r(.5*q("weight")*(q("targetHco3")-q("hco3")),1),"mEq","bicarbonate deficit"];
  case "pf":return[r(q("pao2")/q("fio2"),0),"mmHg","PaO₂/FiO₂"];
  case "agrad":return[r(q("pao2")-(150-q("paco2")/0.8),1),"mmHg","A-a estimate"];
  case "map2":return[r((q("sbp")+2*q("dbp"))/3),"mmHg","MAP"];
  case "bmr":return[r(10*q("weight")+6.25*q("height")-5*q("age")+(v.sex==="Laki-laki"?5:-161),0),"kcal/day","Mifflin-St Jeor"];
  case "ibwalt":return[r((v.sex==="Perempuan"?45.5:50)+.9*(q("height")-152.4),1),"kg","Devine"];
  case "correctedwt":return[r(q("weight")*(100-q("percent"))/100,1),"kg","Adjusted body weight"];
  default:return["—","","Parameter belum dikonfigurasi"];
 }
}
