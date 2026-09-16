export type Vitals = { bp?: string; hr?: string; rr?: string; temp?: string; spo2?: string };
export type QuestionAnswer = "yes" | "no" | "unknown";
export type Differential = { name: string; reason: string; level: string; tags: string[] };
export type Investigation = { name: string; reason: string; priority: "Wajib" | "Disarankan" | "Pertimbangkan" };
export type ClinicalQuestion = { id: string; text: string; whyItMatters: string; category: "safety" | "differential" | "disposition" };
export type ClinicalEngineInput = { complaint: string; vitals: Vitals; questionAnswers?: Record<string, QuestionAnswer> };
export type ClinicalEngineResult = {
  engineVersion: string;
  mode: "rules";
  extracted: string[];
  missing: string[];
  questions: ClinicalQuestion[];
  differentials: Differential[];
  investigations: Investigation[];
  redFlags: string[];
  management: string[];
  medicationSafety: string[];
  disposition: { status: "stabilize-first" | "urgent-review" | "routine-review"; title: string; reason: string; triggers: string[] };
  soap: { subjective: string; objective: string; assessment: string; plan: string };
};

const RULE_VERSION = "clinical-rules-v2.3.0";
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const yes = (a: QuestionAnswer | undefined) => a === "yes";
const no = (a: QuestionAnswer | undefined) => a === "no";
const uniq = <T,>(xs: T[]) => [...new Set(xs)];

function has(text: string, terms: string[]) {
  return terms.some(term => text.includes(term));
}

function symptom(text: string, terms: string[]) {
  return terms.some(term => {
    const i = text.indexOf(term);
    if (i < 0) return false;
    const before = text.slice(Math.max(0, i - 45), i);
    return !/(?:\btidak\b|\btanpa\b|\bdisangkal\b|\bmenyangkal\b|\bnegatif\b)(?:\s+ada)?\s*$/.test(before);
  });
}

function num(v?: string) {
  if (!v) return undefined;
  const n = Number(v.replace(",", ".").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function addQ(arr: ClinicalQuestion[], id: string, text: string, whyItMatters: string, category: ClinicalQuestion["category"]) {
  if (!arr.some(x => x.id === id)) arr.push({ id, text, whyItMatters, category });
}

export function runClinicalEngine(input: ClinicalEngineInput): ClinicalEngineResult {
  const text = norm(input.complaint);
  const a = input.questionAnswers ?? {};
  const extracted: string[] = [];
  const missing: string[] = [];
  const questions: ClinicalQuestion[] = [];
  const differentials: Differential[] = [];
  const investigations: Investigation[] = [];
  const redFlags: string[] = [];
  const management: string[] = [];
  const medicationSafety: string[] = [];

  const fatigue = symptom(text, ["lelah", "kelelahan", "fatigue", "mudah lelah", "cepat lelah", "tidak bertenaga", "badan lemas", "lemas"]);
  const fever = symptom(text, ["demam", "febrile", "panas"]);
  const headache = symptom(text, ["sakit kepala", "nyeri kepala", "cephalgia", "headache"]);
  const myalgia = symptom(text, ["mialgia", "nyeri badan", "nyeri otot", "pegal"]);
  const nausea = symptom(text, ["mual", "nausea"]);
  const vomiting = symptom(text, ["muntah", "vomiting"]);
  const cough = symptom(text, ["batuk", "cough"]);
  const sore = symptom(text, ["nyeri tenggorok", "sakit tenggorok", "radang tenggorok", "sore throat"]);
  const rhinitis = symptom(text, ["pilek", "hidung tersumbat", "rhinorrhea", "flu"]);
  const bleeding = symptom(text, ["perdarahan", "gusi berdarah", "mimisan", "melena", "hematemesis", "muntah darah", "bab hitam"]);
  const abdominal = symptom(text, ["nyeri perut", "sakit perut", "abdominal pain"]);
  const diarrhea = symptom(text, ["diare", "mencret", "berak cair", "diarrhea"]);
  const urinary = symptom(text, ["nyeri saat kencing", "nyeri saat buang air kecil", "dysuria", "anyang-anyangan", "sering kencing"]);
  const flank = symptom(text, ["nyeri pinggang", "nyeri flank"]);
  const dyspnea = symptom(text, ["sesak", "dispnea", "dyspnea", "sulit bernapas"]);
  const chest = symptom(text, ["nyeri dada", "sakit dada", "chest pain", "tekanan dada"]);
  const palp = symptom(text, ["berdebar", "palpitasi", "palpitation"]);
  const syncope = symptom(text, ["pingsan", "sinkop", "syncope"]);
  const altered = symptom(text, ["penurunan kesadaran", "bingung", "mengantuk berat", "kejang"]);
  const focal = symptom(text, ["kelemahan satu sisi", "mulut mencong", "bicara pelo", "afasia", "baal satu sisi"]);
  const rash = symptom(text, ["ruam", "rash", "kemerahan kulit"]);
  const allergy = symptom(text, ["gatal", "urtikaria", "biduran", "bengkak bibir", "bengkak wajah"]);
  const trauma = has(text, ["trauma", "jatuh", "kecelakaan", "terbentur"]);
  const weightLoss = symptom(text, ["berat badan turun", "penurunan berat badan", "bb turun"]);
  const polyuria = symptom(text, ["sering kencing", "poliuria"]);
  const polydipsia = symptom(text, ["sering haus", "mudah haus", "polidipsia"]);
  const pallor = symptom(text, ["pucat", "pucat pasi"]);
  const mood = symptom(text, ["murung", "sedih", "cemas", "anxious", "depresi", "stres", "stress"]);

  const bpSys = num(input.vitals.bp?.split("/")[0]);
  const bpDia = num(input.vitals.bp?.split("/")[1]);
  const hr = num(input.vitals.hr);
  const rr = num(input.vitals.rr);
  const temp = num(input.vitals.temp);
  const spo2 = num(input.vitals.spo2);
  const tachy = typeof hr === "number" && hr >= 100;
  const tachypnea = typeof rr === "number" && rr >= 22;
  const lowSpO2 = typeof spo2 === "number" && spo2 < 92;
  const narrowPP = typeof bpSys === "number" && typeof bpDia === "number" && bpSys - bpDia <= 25;

  if (fatigue) {
    extracted.push("Fatigue / mudah lelah");
    addQ(questions, "fatigue-duration", "Sejak kapan rasa lelah dirasakan dan apakah terjadi setiap hari?", "Durasi dan pola membantu membedakan keluhan sementara dari fatigue yang menetap.", "differential");
    addQ(questions, "fatigue-sleep", "Bagaimana kualitas dan durasi tidur? Apakah mendengkur keras, terbangun sering, atau mengantuk berat di siang hari?", "Tidur yang tidak adekuat atau gangguan tidur merupakan penyebab umum fatigue.", "differential");
    addQ(questions, "fatigue-function", "Seberapa jauh rasa lelah mengganggu aktivitas harian atau pekerjaan?", "Dampak fungsional membantu menilai severity dan kebutuhan review lebih lanjut.", "disposition");
    addQ(questions, "fatigue-systemic", "Apakah ada demam berkepanjangan, penurunan berat badan, keringat malam, atau gejala infeksi/sistemik lain?", "Gejala sistemik dapat mengubah fokus evaluasi fatigue.", "safety");
    addQ(questions, "fatigue-anemia", "Apakah ada pucat, berdebar, sesak saat aktivitas, atau riwayat perdarahan?", "Gejala tersebut dapat mengarahkan evaluasi ke kemungkinan anemia atau masalah lain yang memerlukan pemeriksaan.", "differential");
    addQ(questions, "fatigue-metabolic", "Apakah ada sering haus, sering kencing, perubahan berat badan, intoleransi panas/dingin, atau kelemahan otot?", "Gejala metabolik/endokrin dapat menjadi konteks penting pada fatigue.", "differential");
    addQ(questions, "fatigue-mood", "Apakah ada stres berat, kecemasan, mood rendah, atau kehilangan minat yang baru/menetap?", "Faktor psikososial dapat berkontribusi pada fatigue dan perlu ditanyakan tanpa menganggap penyebabnya psikologis.", "differential");
    addQ(questions, "fatigue-medication", "Apakah ada obat rutin, obat baru, alkohol, kafein berlebih, atau zat lain yang berubah akhir-akhir ini?", "Obat dan substansi dapat berkontribusi pada rasa lelah atau gangguan tidur.", "differential");
  }

  if (fever) {
    addQ(questions, "fever-duration", "Sudah berapa hari demam berlangsung dan kapan terakhir suhu diukur?", "Durasi dan fase demam membantu membentuk konteks differential.", "differential");
    addQ(questions, "fever-rash", "Apakah ada ruam atau kemerahan kulit?", "Ruam dapat memperkaya sindrom demam akut.", "differential");
    addQ(questions, "fever-bleeding", "Apakah ada perdarahan gusi, hidung, mudah memar, muntah darah, atau BAB hitam?", "Perdarahan dapat mengubah urgensi evaluasi.", "safety");
    addQ(questions, "fever-abdominal", "Apakah ada nyeri perut hebat atau muntah persisten?", "Temuan ini dapat mengubah prioritas evaluasi pada sindrom demam.", "disposition");
    addQ(questions, "fever-exposure", "Apakah ada kontak sakit, perjalanan, gigitan nyamuk, atau paparan makanan/air berisiko?", "Konteks epidemiologi membantu mengarahkan differential.", "differential");
  }
  if (cough || sore || rhinitis || dyspnea) {
    addQ(questions, "resp-severity", "Apakah sesak memburuk, sulit bicara karena sesak, atau ada saturasi rendah bila sudah diperiksa?", "Menilai severity dan kebutuhan evaluasi segera.", "safety");
    addQ(questions, "resp-sputum", "Apakah ada dahak purulen, darah pada dahak, mengi, atau stridor?", "Membantu memperkaya fokus respirasi.", "differential");
  }
  if (chest) {
    addQ(questions, "chest-character", "Bagaimana karakter nyeri dada dan apa pemicunya?", "Karakter dan pemicu membantu mengarahkan evaluasi nyeri dada.", "differential");
    addQ(questions, "chest-associated", "Apakah nyeri menjalar, disertai keringat dingin, mual, sesak, atau sinkop?", "Gejala penyerta dapat mengubah urgensi evaluasi.", "safety");
  }
  if (headache) {
    addQ(questions, "headache-onset", "Apakah sakit kepala muncul mendadak dan mencapai intensitas maksimal dalam waktu singkat?", "Onset sangat mendadak merupakan red flag.", "safety");
    addQ(questions, "headache-neuro", "Apakah ada kelemahan satu sisi, gangguan bicara/penglihatan, kejang, atau perubahan kesadaran?", "Defisit neurologis akut mengubah urgensi evaluasi.", "safety");
  }
  if (abdominal) {
    addQ(questions, "abd-location", "Di mana lokasi nyeri, sejak kapan, dan apakah semakin berat atau berpindah?", "Lokasi dan progresi membantu menentukan fokus pemeriksaan.", "differential");
    addQ(questions, "abd-peritoneal", "Apakah nyeri sangat hebat, perut kaku, muntah terus-menerus, atau tidak mampu makan/minum?", "Dapat mengubah urgensi evaluasi dan penilaian hidrasi/perfusi.", "disposition");
  }
  if (diarrhea) addQ(questions, "diarrhea-dehydration", "Apakah ada sangat haus, jarang kencing, pusing saat berdiri, atau tidak mampu minum?", "Menilai kemungkinan dehidrasi.", "disposition");
  if (urinary || flank) {
    addQ(questions, "urinary-systemic", "Apakah ada demam, menggigil, mual/muntah, atau nyeri pinggang?", "Gejala sistemik dapat menggeser evaluasi ke saluran kemih atas.", "safety");
    addQ(questions, "urinary-pregnancy", "Apakah ada kemungkinan hamil?", "Status kehamilan dapat mengubah pemeriksaan dan terapi.", "safety");
  }
  if (palp || syncope) addQ(questions, "cardiac-history", "Apakah ada riwayat penyakit jantung, aritmia, atau kematian mendadak dalam keluarga?", "Riwayat tersebut dapat mengubah kebutuhan evaluasi kardiovaskular.", "safety");
  if (allergy) addQ(questions, "allergy-airway", "Apakah ada bengkak lidah/tenggorok, suara serak, sulit bernapas, atau pusing setelah paparan tertentu?", "Keterlibatan airway atau sirkulasi dapat merupakan keadaan gawat darurat.", "safety");
  addQ(questions, "general-safety", "Apakah saat ini ada penurunan kesadaran, kejang, sesak berat, nyeri dada berat, atau kelemahan satu sisi yang baru?", "Safety screen umum sebelum finalisasi disposition.", "safety");

  if (fever) extracted.push("Demam");
  if (headache) extracted.push("Sakit kepala");
  if (myalgia) extracted.push("Mialgia / nyeri badan");
  if (nausea) extracted.push("Mual");
  if (vomiting) extracted.push("Muntah");
  if (cough) extracted.push("Batuk");
  if (sore) extracted.push("Nyeri tenggorok");
  if (rhinitis) extracted.push("Gejala hidung/flu");
  if (bleeding) extracted.push("Gejala perdarahan");
  if (abdominal) extracted.push("Nyeri perut");
  if (diarrhea) extracted.push("Diare");
  if (urinary) extracted.push("Gejala kemih");
  if (flank) extracted.push("Nyeri pinggang");
  if (dyspnea) extracted.push("Sesak/dispnea");
  if (chest) extracted.push("Nyeri dada");
  if (palp) extracted.push("Palpitasi");
  if (syncope) extracted.push("Sinkop/pingsan");
  if (altered || focal) extracted.push("Temuan neurologis");
  if (rash) extracted.push("Ruam");
  if (allergy) extracted.push("Fitur alergi");
  if (weightLoss) extracted.push("Penurunan berat badan");
  if (polyuria || polydipsia) extracted.push("Gejala metabolik");
  if (mood) extracted.push("Konteks mood/stres");

  const vitalLabels: Record<keyof Vitals, string> = { bp: "Tekanan darah", hr: "Nadi", rr: "Frekuensi napas", temp: "Suhu", spo2: "SpO₂" };
  (Object.keys(vitalLabels) as (keyof Vitals)[]).forEach(k => { if (!input.vitals[k]) missing.push(vitalLabels[k]); });
  questions.forEach(q => { if (!a[q.id] || a[q.id] === "unknown") missing.push(`${q.text.replace(/^Apakah /, "")} belum ditentukan`); });
  if (!has(text, ["riwayat penyakit", "hipertensi", "diabetes", "ginjal", "asma", "jantung", "stroke", "kanker", "hamil", "kehamilan"])) missing.push("Riwayat penyakit/komorbid belum jelas");
  if (!has(text, ["alergi", "alergi obat", "drug allergy"])) missing.push("Alergi obat belum jelas");
  if (!has(text, ["obat rutin", "obat yang diminum", "sedang minum", "antikoagulan", "aspirin", "ibuprofen", "warfarin"])) missing.push("Obat yang sedang digunakan belum jelas");

  if (fatigue) {
    differentials.push({ name: "Fatigue / keluhan lelah", reason: "Keluhan masih berupa sindrom; perlu karakterisasi durasi, pola tidur, dampak aktivitas, gejala penyerta, obat, dan konteks sistemik sebelum mengarah ke etiologi tertentu.", level: "Evaluasi terarah", tags: ["lelah", "karakterisasi"] });
    differentials.push({ name: "Gangguan tidur / kurang tidur", reason: "Perlu dipertimbangkan berdasarkan kualitas tidur, gangguan napas saat tidur, dan kantuk siang hari.", level: "Pertimbangkan", tags: ["tidur", "kantuk"] });
    differentials.push({ name: "Anemia / masalah hematologis", reason: "Pertimbangan meningkat bila disertai pucat, berdebar, sesak aktivitas, atau riwayat perdarahan; perlu korelasi klinis dan pemeriksaan.", level: "Pertimbangkan", tags: ["pucat", "perdarahan"] });
    differentials.push({ name: "Gangguan metabolik / endokrin", reason: "Perlu dipikirkan bila terdapat perubahan berat badan, haus/kencing meningkat, intoleransi panas/dingin, atau gejala metabolik lain.", level: "Pertimbangkan", tags: ["berat badan", "metabolik"] });
    differentials.push({ name: "Infeksi / penyakit sistemik", reason: "Demam menetap, keringat malam, penurunan berat badan, atau gejala sistemik lain dapat mengubah fokus evaluasi.", level: "Pertimbangkan", tags: ["demam", "gejala sistemik"] });
    differentials.push({ name: "Faktor psikososial / mood", reason: "Stres, kecemasan, atau mood rendah dapat berkontribusi pada fatigue dan perlu dinilai bersama penyebab fisik.", level: "Pertimbangkan", tags: ["stres", "mood"] });
  }
  if (fever && (headache || myalgia || nausea || vomiting || rash)) differentials.push({ name: "Sindrom dengue / arboviral", reason: "Pola demam akut dengan gejala penyerta dapat sesuai dan memerlukan korelasi klinis, epidemiologi, serta pemeriksaan yang sesuai.", level: "Pertimbangkan", tags: ["demam akut", headache ? "sakit kepala" : myalgia ? "mialgia" : "gejala penyerta"] });
  if (fever) differentials.push({ name: "Sindrom infeksi virus akut", reason: "Demam tanpa fokus infeksi yang jelas dapat sesuai dengan sindrom infeksi virus non-spesifik.", level: "Masih mungkin", tags: ["demam", "fokus belum jelas"] });
  if (cough || sore || rhinitis) differentials.push({ name: "Infeksi saluran napas akut", reason: "Gejala respirasi atas menjadi fokus evaluasi dan perlu dikorelasikan dengan pemeriksaan fisik.", level: "Pertimbangkan", tags: ["respirasi", "gejala saluran napas"] });
  if (chest) differentials.push({ name: "Nyeri dada akut — evaluasi terarah", reason: "Perlu pemisahan penyebab kardiak, pulmoner, muskuloskeletal, gastrointestinal, dan penyebab lain berdasarkan karakter dan severity.", level: "Evaluasi terarah", tags: ["nyeri dada", "severity"] });
  if (headache) differentials.push({ name: "Sakit kepala — primer vs sekunder", reason: "Safety screen dan karakteristik onset perlu diselesaikan sebelum menganggap headache primer.", level: "Evaluasi terarah", tags: ["onset", "neurologis"] });
  if (abdominal) differentials.push({ name: "Sindrom nyeri abdomen", reason: "Lokasi, onset, progresi, gejala GI/urinaria, dan pemeriksaan abdomen menentukan arah evaluasi.", level: "Evaluasi terarah", tags: ["abdomen", "peritonisme"] });
  if (diarrhea) differentials.push({ name: "Diare akut", reason: "Perlu menilai pola tinja, darah, demam, paparan, dan status hidrasi.", level: "Pertimbangkan", tags: ["diare", "hidrasi"] });
  if (urinary || flank) differentials.push({ name: "Sindrom saluran kemih", reason: "Keluhan kemih dan/atau flank pain perlu dikorelasikan dengan gejala sistemik dan pemeriksaan urin.", level: "Pertimbangkan", tags: ["urin", "flank"] });
  if (palp || syncope) differentials.push({ name: "Keluhan kardiovaskular / aritmia", reason: "Palpitasi atau sinkop memerlukan penilaian ritme, hemodinamika, pemicu, dan riwayat kardiak.", level: "Evaluasi terarah", tags: ["ritme", "hemodinamika"] });
  if (allergy) differentials.push({ name: "Reaksi alergi", reason: "Gejala kulit perlu dinilai bersama keterlibatan airway atau sirkulasi.", level: "Pertimbangkan", tags: ["kulit", "airway"] });
  if (trauma) differentials.push({ name: "Cedera terkait trauma", reason: "Mekanisme, lokasi cedera, gejala neurologis, dan tanda instabilitas perlu dipetakan.", level: "Evaluasi terarah", tags: ["trauma", "red flags"] });
  if (!differentials.length) differentials.push({ name: "Keluhan belum terstruktur", reason: "Belum ada pola gejala yang cukup untuk rule set saat ini; lengkapi anamnesis dan tanda vital.", level: "Data belum cukup", tags: ["anamnesis", "vital"] });

  if (lowSpO2) redFlags.push("SpO₂ terukur <92%: nilai segera status respirasi dan stabilitas klinis sesuai konteks pasien.");
  if (tachypnea || dyspnea || yes(a["resp-severity"])) redFlags.push("Ada sinyal gangguan respirasi atau peningkatan kerja napas: lakukan penilaian airway-breathing dan severity.");
  if (chest && yes(a["chest-associated"])) redFlags.push("Nyeri dada dengan gejala penyerta berisiko memerlukan evaluasi kardiopulmoner akut.");
  if (syncope && (chest || palp || yes(a["cardiac-history"]))) redFlags.push("Sinkop dengan fitur kardiak memerlukan evaluasi segera.");
  if (altered || focal || yes(a["general-safety"])) redFlags.push("Perubahan kesadaran, kejang, sesak berat, nyeri dada berat, atau defisit neurologis akut memerlukan evaluasi segera.");
  if (bleeding || yes(a["bleeding"]) || yes(a["fever-bleeding"])) redFlags.push("Perdarahan dilaporkan: nilai sumber, derajat, hemodinamika, dan medication safety.");
  if (yes(a["abd-peritoneal"])) redFlags.push("Nyeri abdomen berat/peritoneal features memerlukan evaluasi segera.");
  if (narrowPP) redFlags.push("Tekanan nadi tampak menyempit dari input tekanan darah; interpretasikan bersama perfusi dan temuan klinis.");
  if (Object.keys(vitalLabels).some(k => !input.vitals[k as keyof Vitals])) redFlags.push("Tanda vital belum lengkap sehingga stabilitas pasien belum dapat dinilai dari form saja.");

  investigations.push({ name: "Tanda vital lengkap", reason: "Menilai stabilitas dan severity.", priority: "Wajib" });
  if (fatigue) investigations.push({ name: "Pemeriksaan fisik terarah + review tidur, nutrisi, obat, dan aktivitas", reason: "Fatigue memiliki banyak kemungkinan penyebab; data klinis dasar perlu dipetakan sebelum pemeriksaan tambahan dipilih.", priority: "Wajib" });
  if (fatigue && (pallor || bleeding || yes(a["fatigue-anemia"]))) investigations.push({ name: "Evaluasi anemia sesuai indikasi klinis", reason: "Dipertimbangkan bila gejala mengarah ke anemia atau terdapat faktor risiko perdarahan.", priority: "Disarankan" });
  if (fatigue && (polyuria || polydipsia || weightLoss || yes(a["fatigue-metabolic"]))) investigations.push({ name: "Evaluasi metabolik/endokrin sesuai pertanyaan klinis", reason: "Pilih pemeriksaan berdasarkan gejala dan temuan pemeriksaan, bukan fatigue saja.", priority: "Disarankan" });
  if (fever) investigations.push({ name: "Darah lengkap", reason: "Dapat melengkapi evaluasi sindrom demam sesuai pertanyaan klinis.", priority: "Disarankan" });
  if (fever && (headache || myalgia || nausea || vomiting || rash)) investigations.push({ name: "Hematokrit/trombosit sesuai konteks klinis", reason: "Pertimbangkan bila dengue tetap masuk differential setelah anamnesis dan pemeriksaan fisik.", priority: "Pertimbangkan" });
  if (cough || dyspnea || sore || rhinitis) investigations.push({ name: "Pemeriksaan respirasi terarah", reason: "Sesuaikan dengan kerja napas, saturasi, dan temuan paru.", priority: "Disarankan" });
  if (chest) investigations.push({ name: "Evaluasi nyeri dada akut sesuai kecurigaan klinis", reason: "Pilih pemeriksaan berdasarkan karakter nyeri, faktor risiko, tanda vital, dan pemeriksaan fisik.", priority: "Wajib" });
  if (headache) investigations.push({ name: "Pemeriksaan neurologis terarah", reason: "Cari red flags dan temuan neurologis sekunder.", priority: "Wajib" });
  if (abdominal) investigations.push({ name: "Pemeriksaan abdomen terarah", reason: "Nilai lokasi nyeri, nyeri tekan, defense/rigiditas, distensi, dan temuan lain.", priority: "Wajib" });
  if (diarrhea) investigations.push({ name: "Penilaian status hidrasi", reason: "Menentukan kebutuhan rehidrasi dan disposition.", priority: "Wajib" });
  if (urinary || flank) investigations.push({ name: "Urinalisis sesuai indikasi", reason: "Membantu evaluasi keluhan saluran kemih.", priority: "Disarankan" });
  if (palp || syncope) investigations.push({ name: "Evaluasi ritme jantung / EKG sesuai indikasi", reason: "Palpitasi atau sinkop dapat memerlukan korelasi ritme dan hemodinamik.", priority: "Disarankan" });

  management.push("Lengkapi anamnesis terarah dan pemeriksaan fisik sebelum menetapkan diagnosis kerja atau disposition.");
  if (fatigue) management.push("Pada fatigue, fokus awal pada durasi, pola tidur, dampak fungsi, gejala sistemik, obat, nutrisi, dan konteks psikososial.");
  if (fever) management.push("Pada sindrom demam, pertimbangkan suportif, hidrasi sesuai status klinis, monitoring, dan edukasi tanda bahaya.");
  if (dyspnea || tachypnea) management.push("Prioritaskan penilaian airway-breathing, oksigenasi, dan severity.");
  if (chest) management.push("Pada nyeri dada, prioritaskan pemisahan kondisi time-sensitive sebelum terapi simptomatik rutin.");
  if (diarrhea) management.push("Pada diare, fokus pada status hidrasi, intake, karakter tinja, dan tanda infeksi/perdarahan.");
  management.push("Review ulang differential setelah data anamnesis, pemeriksaan fisik, dan penunjang bertambah.");

  medicationSafety.push("Konfirmasi alergi obat dan obat yang sedang digunakan sebelum meresepkan atau mengubah terapi.");
  medicationSafety.push("Periksa kontraindikasi, interaksi, fungsi ginjal/hati, usia, kehamilan, dan kondisi khusus yang relevan.");
  if (bleeding || yes(a["fever-bleeding"]) || yes(a.bleeding)) medicationSafety.push("Dengan sinyal perdarahan, lakukan review obat yang dapat meningkatkan risiko perdarahan.");

  let disposition: ClinicalEngineResult["disposition"];
  const critical = redFlags.filter(x => !x.startsWith("Tanda vital belum lengkap"));
  if (critical.length) disposition = { status: "stabilize-first", title: "Prioritaskan stabilisasi & evaluasi segera", reason: "Terdapat sinyal klinis yang memerlukan penilaian segera atau dapat berkaitan dengan kondisi time-sensitive.", triggers: critical.slice(0, 5) };
  else if (missing.length || redFlags.length) disposition = { status: "urgent-review", title: "Review klinis sebelum finalisasi", reason: "Data penting masih belum lengkap dan/atau ada keterbatasan yang perlu direview.", triggers: missing.slice(0, 5) };
  else disposition = { status: "routine-review", title: "Lanjutkan review klinis terstruktur", reason: "Data inti pada form lebih lengkap, tetapi diagnosis kerja dan disposition tetap merupakan keputusan dokter.", triggers: [] };

  const objectiveParts: string[] = [];
  if (Object.values(input.vitals).some(Boolean)) objectiveParts.push(`TD ${input.vitals.bp || "—"}, nadi ${input.vitals.hr || "—"}/menit, RR ${input.vitals.rr || "—"}/menit, suhu ${input.vitals.temp || "—"}°C, SpO₂ ${input.vitals.spo2 || "—"}%.`);
  if (missing.length) objectiveParts.push(`Data belum lengkap: ${missing.slice(0, 6).join(", ")}.`);
  objectiveParts.push("Pemeriksaan fisik perlu didokumentasikan langsung oleh dokter.");

  return {
    engineVersion: RULE_VERSION,
    mode: "rules",
    extracted: uniq(extracted),
    missing: uniq(missing),
    questions,
    differentials: differentials.slice(0, 8),
    investigations,
    redFlags: uniq(redFlags),
    management,
    medicationSafety,
    disposition,
    soap: {
      subjective: input.complaint.trim() || "Keluhan belum diisi.",
      objective: objectiveParts.join(" "),
      assessment: `Pertimbangan rule engine: ${differentials.map(x => x.name).join(", ")}. Diagnosis kerja final tidak ditetapkan otomatis.`,
      plan: `${investigations.map(x => `${x.priority}: ${x.name}`).join("; ")} ${management.join(" ")} Disposition support: ${disposition.title}.`,
    },
  };
}
