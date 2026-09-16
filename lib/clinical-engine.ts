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

const RULE_VERSION = "clinical-rules-v3.0.0";
const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();
const uniq = <T,>(items: T[]) => [...new Set(items)];
const isYes = (value: QuestionAnswer | undefined) => value === "yes";
const isNo = (value: QuestionAnswer | undefined) => value === "no";

function contains(text: string, terms: string[]) {
  return terms.some(term => text.includes(term));
}

function hasSymptom(text: string, terms: string[]) {
  return terms.some(term => {
    const index = text.indexOf(term);
    if (index < 0) return false;
    const before = text.slice(Math.max(0, index - 55), index);
    const negation = /\b(?:tidak|tanpa|disangkal|menyangkal|negatif)\b(?:\s+ada)?\s*$/.test(before);
    return !negation;
  });
}

function toNumber(value?: string) {
  if (!value) return undefined;
  const normalized = value.replace(",", ".").replace(/[^0-9.\-]/g, "");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : undefined;
}

function addQuestion(target: ClinicalQuestion[], id: string, text: string, whyItMatters: string, category: ClinicalQuestion["category"]) {
  if (!target.some(item => item.id === id)) target.push({ id, text, whyItMatters, category });
}

export function runClinicalEngine(input: ClinicalEngineInput): ClinicalEngineResult {
  const text = normalize(input.complaint || "");
  const answers = input.questionAnswers || {};
  const extracted: string[] = [];
  const missing: string[] = [];
  const questions: ClinicalQuestion[] = [];
  const differentials: Differential[] = [];
  const investigations: Investigation[] = [];
  const redFlags: string[] = [];
  const management: string[] = [];
  const medicationSafety: string[] = [];

  const fatigue = hasSymptom(text, ["lelah", "kelelahan", "fatigue", "mudah lelah", "cepat lelah", "tidak bertenaga", "badan lemas", "lemas"]);
  const fever = hasSymptom(text, ["demam", "febrile", "panas"]);
  const headache = hasSymptom(text, ["sakit kepala", "nyeri kepala", "cephalgia", "headache"]);
  const myalgia = hasSymptom(text, ["mialgia", "nyeri badan", "nyeri otot", "pegal"]);
  const nausea = hasSymptom(text, ["mual", "nausea"]);
  const vomiting = hasSymptom(text, ["muntah", "vomiting"]);
  const cough = hasSymptom(text, ["batuk", "cough"]);
  const soreThroat = hasSymptom(text, ["nyeri tenggorok", "sakit tenggorok", "radang tenggorok", "sore throat"]);
  const rhinitis = hasSymptom(text, ["pilek", "hidung tersumbat", "rhinorrhea", "flu"]);
  const bleeding = hasSymptom(text, ["perdarahan", "gusi berdarah", "mimisan", "melena", "hematemesis", "muntah darah", "bab hitam"]);
  const abdominal = hasSymptom(text, ["nyeri perut", "sakit perut", "abdominal pain"]);
  const diarrhea = hasSymptom(text, ["diare", "mencret", "berak cair", "diarrhea"]);
  const urinary = hasSymptom(text, ["nyeri saat kencing", "nyeri saat buang air kecil", "dysuria", "anyang-anyangan", "sering kencing"]);
  const flank = hasSymptom(text, ["nyeri pinggang", "nyeri flank"]);
  const dyspnea = hasSymptom(text, ["sesak", "dispnea", "dyspnea", "sulit bernapas"]);
  const chest = hasSymptom(text, ["nyeri dada", "sakit dada", "chest pain", "tekanan dada"]);
  const palpitation = hasSymptom(text, ["berdebar", "palpitasi", "palpitation"]);
  const syncope = hasSymptom(text, ["pingsan", "sinkop", "syncope"]);
  const altered = hasSymptom(text, ["penurunan kesadaran", "bingung", "mengantuk berat", "kejang"]);
  const focal = hasSymptom(text, ["kelemahan satu sisi", "mulut mencong", "bicara pelo", "afasia", "baal satu sisi"]);
  const rash = hasSymptom(text, ["ruam", "rash", "kemerahan kulit"]);
  const allergy = hasSymptom(text, ["gatal", "urtikaria", "biduran", "bengkak bibir", "bengkak wajah"]);
  const trauma = contains(text, ["trauma", "jatuh", "kecelakaan", "terbentur"]);
  const weightLoss = hasSymptom(text, ["berat badan turun", "penurunan berat badan", "bb turun"]);
  const polyuria = hasSymptom(text, ["sering kencing", "poliuria"]);
  const polydipsia = hasSymptom(text, ["sering haus", "mudah haus", "polidipsia"]);
  const pallor = hasSymptom(text, ["pucat", "pucat pasi"]);
  const sleepProblem = hasSymptom(text, ["susah tidur", "sulit tidur", "insomnia", "tidur terganggu", "sering terbangun"]);
  const daytimeSleepiness = hasSymptom(text, ["mengantuk siang", "kantuk siang", "mengantuk terus"]);
  const mood = hasSymptom(text, ["murung", "sedih", "cemas", "anxious", "depresi", "stres", "stress"]);

  const sys = toNumber(input.vitals.bp?.split("/")[0]);
  const dia = toNumber(input.vitals.bp?.split("/")[1]);
  const hr = toNumber(input.vitals.hr);
  const rr = toNumber(input.vitals.rr);
  const temp = toNumber(input.vitals.temp);
  const spo2 = toNumber(input.vitals.spo2);
  const tachycardia = typeof hr === "number" && hr >= 100;
  const tachypnea = typeof rr === "number" && rr >= 22;
  const lowSpO2 = typeof spo2 === "number" && spo2 < 92;
  const narrowPulsePressure = typeof sys === "number" && typeof dia === "number" && sys - dia <= 25;

  // 1. Structure symptoms first
  if (fatigue) extracted.push("Fatigue / mudah lelah");
  if (fever) extracted.push("Demam");
  if (headache) extracted.push("Sakit kepala");
  if (myalgia) extracted.push("Mialgia / nyeri badan");
  if (nausea) extracted.push("Mual");
  if (vomiting) extracted.push("Muntah");
  if (cough) extracted.push("Batuk");
  if (soreThroat) extracted.push("Nyeri tenggorok");
  if (rhinitis) extracted.push("Gejala hidung/flu");
  if (bleeding) extracted.push("Gejala perdarahan");
  if (abdominal) extracted.push("Nyeri perut");
  if (diarrhea) extracted.push("Diare");
  if (urinary) extracted.push("Gejala saluran kemih");
  if (flank) extracted.push("Nyeri pinggang/flank");
  if (dyspnea) extracted.push("Sesak/dispnea");
  if (chest) extracted.push("Nyeri dada");
  if (palpitation) extracted.push("Palpitasi");
  if (syncope) extracted.push("Sinkop/pingsan");
  if (altered || focal) extracted.push("Temuan neurologis");
  if (rash) extracted.push("Ruam");
  if (allergy) extracted.push("Fitur alergi");
  if (trauma) extracted.push("Riwayat trauma");
  if (weightLoss) extracted.push("Penurunan berat badan");
  if (pallor) extracted.push("Pucat");
  if (sleepProblem || daytimeSleepiness) extracted.push("Masalah tidur/kantuk");
  if (mood) extracted.push("Gejala mood/stres");
  if (tachycardia) extracted.push("Nadi meningkat");
  if (tachypnea) extracted.push("Frekuensi napas meningkat");
  if (lowSpO2) extracted.push("SpO₂ rendah");
  if (typeof temp === "number" && temp >= 38) extracted.push("Demam terukur");
  if (narrowPulsePressure) extracted.push("Tekanan nadi tampak menyempit");

  // 2. Adaptive questions
  if (fatigue) {
    addQuestion(questions, "fatigue-duration", "Sejak kapan rasa lelah dirasakan dan apakah terjadi setiap hari?", "Durasi dan pola gejala menentukan apakah evaluasi awal perlu diperluas.", "differential");
    addQuestion(questions, "fatigue-sleep", "Bagaimana durasi dan kualitas tidur? Apakah mendengkur, sering terbangun, atau mengantuk berat pada siang hari?", "Gangguan tidur dapat berkontribusi pada fatigue dan perlu dibedakan dari penyebab lain.", "differential");
    addQuestion(questions, "fatigue-function", "Seberapa jauh rasa lelah mengganggu aktivitas harian atau pekerjaan?", "Dampak fungsional membantu menilai severity dan tindak lanjut.", "disposition");
    addQuestion(questions, "fatigue-systemic", "Apakah ada demam berkepanjangan, keringat malam, penurunan berat badan, atau gejala sistemik lain?", "Gejala sistemik dapat mengubah fokus evaluasi fatigue.", "safety");
    addQuestion(questions, "fatigue-anemia", "Apakah ada pucat, berdebar, sesak saat aktivitas, atau riwayat perdarahan?", "Temuan ini dapat mengarahkan evaluasi ke anemia atau sumber perdarahan.", "differential");
    addQuestion(questions, "fatigue-metabolic", "Apakah ada sering haus, sering kencing, perubahan berat badan, intoleransi panas/dingin, atau kelemahan otot?", "Gejala metabolik/endokrin dapat menjadi konteks penting pada fatigue.", "differential");
    addQuestion(questions, "fatigue-medication", "Apakah ada obat baru, obat rutin yang menyebabkan kantuk, alkohol, kafein berlebih, atau perubahan zat lain?", "Obat dan substansi dapat berkontribusi pada fatigue atau gangguan tidur.", "differential");
    addQuestion(questions, "fatigue-mood", "Apakah ada stres berat, kecemasan, mood rendah, atau kehilangan minat yang menetap?", "Faktor psikososial dapat berkontribusi tetapi tidak boleh diasumsikan sebagai penyebab tunggal.", "differential");
  }
  if (fever) {
    addQuestion(questions, "fever-duration", "Sudah berapa hari demam berlangsung?", "Durasi demam membantu membentuk konteks differential.", "differential");
    addQuestion(questions, "fever-bleeding", "Apakah ada perdarahan gusi/hidung, mudah memar, muntah darah, atau BAB hitam?", "Perdarahan mengubah urgensi evaluasi.", "safety");
    addQuestion(questions, "fever-warning", "Apakah ada nyeri perut hebat, muntah persisten, atau lemas berat?", "Membantu mencari warning features pada sindrom demam.", "disposition");
    addQuestion(questions, "fever-exposure", "Apakah ada kontak sakit, perjalanan, gigitan nyamuk, atau paparan makanan/air berisiko?", "Konteks pajanan membantu mengarahkan differential.", "differential");
  }
  if (cough || soreThroat || rhinitis || dyspnea) {
    addQuestion(questions, "resp-severity", "Apakah sesak memburuk, sulit bicara karena sesak, atau saturasi rendah bila sudah diperiksa?", "Menilai severity respirasi dan kebutuhan evaluasi segera.", "safety");
    addQuestion(questions, "resp-associated", "Apakah ada demam, dahak purulen, darah pada dahak, mengi, atau stridor?", "Gejala penyerta membantu membedakan fokus respirasi.", "differential");
  }
  if (chest) {
    addQuestion(questions, "chest-character", "Bagaimana karakter nyeri dada, kapan mulai, dan apa pemicunya?", "Karakter, onset, dan pemicu membantu mengarahkan evaluasi nyeri dada.", "differential");
    addQuestion(questions, "chest-associated", "Apakah nyeri menjalar atau disertai keringat dingin, mual, sesak, palpitasi, atau sinkop?", "Gejala penyerta dapat mengubah urgensi evaluasi.", "safety");
  }
  if (headache) {
    addQuestion(questions, "headache-onset", "Apakah sakit kepala muncul sangat mendadak dan mencapai intensitas maksimal dalam waktu singkat?", "Onset mendadak merupakan red flag headache.", "safety");
    addQuestion(questions, "headache-neuro", "Apakah ada kelemahan satu sisi, gangguan bicara/penglihatan, kejang, atau perubahan kesadaran?", "Defisit neurologis akut dapat mengubah urgensi.", "safety");
  }
  if (abdominal) {
    addQuestion(questions, "abd-character", "Di mana lokasi nyeri, sejak kapan, dan apakah nyeri berpindah atau semakin berat?", "Lokasi dan progresi menentukan fokus pemeriksaan.", "differential");
    addQuestion(questions, "abd-severity", "Apakah perut kaku, nyeri sangat hebat, muntah terus-menerus, atau tidak mampu makan/minum?", "Menilai kemungkinan kebutuhan evaluasi segera.", "disposition");
  }
  if (diarrhea) addQuestion(questions, "diarrhea-dehydration", "Apakah sangat haus, jarang kencing, pusing saat berdiri, atau tidak mampu minum?", "Menilai kemungkinan dehidrasi.", "disposition");
  if (urinary || flank) {
    addQuestion(questions, "urinary-systemic", "Apakah ada demam, menggigil, mual/muntah, atau nyeri pinggang?", "Gejala sistemik dapat mengubah fokus dari saluran kemih bawah ke atas.", "safety");
    addQuestion(questions, "urinary-pregnancy", "Apakah ada kemungkinan hamil?", "Status kehamilan dapat mengubah pemeriksaan dan terapi.", "safety");
  }
  if (palpitation || syncope) addQuestion(questions, "cardiac-history", "Apakah ada riwayat penyakit jantung/aritmia atau kematian mendadak dalam keluarga?", "Riwayat kardiak dapat mengubah prioritas evaluasi.", "safety");
  if (allergy) addQuestion(questions, "allergy-airway", "Apakah ada bengkak lidah/tenggorok, suara serak, sulit bernapas, atau pusing setelah paparan?", "Keterlibatan airway atau sirkulasi dapat merupakan kegawatan.", "safety");
  addQuestion(questions, "general-safety", "Apakah saat ini ada penurunan kesadaran, kejang, sesak berat, nyeri dada berat, atau kelemahan satu sisi yang baru?", "Safety screen umum sebelum finalisasi disposition.", "safety");

  // 3. Data completeness
  const vitalLabels: Record<keyof Vitals, string> = { bp: "Tekanan darah", hr: "Nadi", rr: "Frekuensi napas", temp: "Suhu", spo2: "SpO₂" };
  (Object.keys(vitalLabels) as (keyof Vitals)[]).forEach(key => {
    if (!input.vitals[key]) missing.push(vitalLabels[key]);
  });
  questions.forEach(question => {
    if (!answers[question.id] || answers[question.id] === "unknown") missing.push(`${question.text} — belum ditentukan`);
  });
  if (!contains(text, ["riwayat penyakit", "hipertensi", "diabetes", "ginjal", "asma", "jantung", "stroke", "kanker", "hamil", "kehamilan"])) missing.push("Riwayat penyakit/komorbid belum jelas");
  if (!contains(text, ["alergi", "alergi obat", "drug allergy"])) missing.push("Alergi obat belum jelas");
  if (!contains(text, ["obat rutin", "obat yang diminum", "sedang minum", "obat baru", "antikoagulan", "aspirin", "ibuprofen", "warfarin"])) missing.push("Obat/substansi yang sedang digunakan belum jelas");

  // 4. Differential generation: no fake probability/ranking
  if (fatigue) {
    differentials.push({ name: "Fatigue primer / faktor gaya hidup", reason: "Keluhan utama berupa fatigue perlu dinilai menurut durasi, tidur, pola aktivitas, nutrisi, dan dampak fungsional.", level: "Pertimbangkan", tags: ["fatigue", "durasi", "fungsi"] });
    differentials.push({ name: "Gangguan tidur", reason: "Gangguan tidur atau tidur tidak efektif dapat berkontribusi pada fatigue, terutama bila ada kantuk siang atau tidur terfragmentasi.", level: "Pertimbangkan", tags: ["tidur", "kantuk"] });
    differentials.push({ name: "Anemia / masalah hematologis", reason: "Lebih relevan bila terdapat pucat, berdebar, sesak aktivitas, atau riwayat perdarahan.", level: "Pertimbangkan", tags: ["pucat", "perdarahan"] });
    differentials.push({ name: "Gangguan metabolik / endokrin", reason: "Perubahan berat badan, haus/kencing meningkat, atau gejala termoregulasi dapat mengarahkan evaluasi metabolik/endokrin.", level: "Pertimbangkan", tags: ["metabolik", "endokrin"] });
    differentials.push({ name: "Infeksi / penyakit sistemik", reason: "Perlu dipikirkan bila fatigue disertai demam menetap, keringat malam, penurunan berat badan, atau gejala sistemik lain.", level: "Pertimbangkan", tags: ["sistemik", "demam"] });
    differentials.push({ name: "Faktor psikososial / mood", reason: "Stres, kecemasan, atau mood rendah dapat berkontribusi dan perlu dinilai bersama penyebab fisik.", level: "Pertimbangkan", tags: ["mood", "stres"] });
  }
  if (fever && (headache || myalgia || nausea || vomiting || rash)) differentials.push({ name: "Sindrom dengue / arboviral", reason: "Pola demam akut dengan gejala penyerta dapat sesuai dan memerlukan korelasi klinis, epidemiologi, serta pemeriksaan yang sesuai.", level: "Pertimbangkan", tags: ["demam", headache ? "sakit kepala" : myalgia ? "mialgia" : "gejala penyerta"] });
  if (fever) differentials.push({ name: "Sindrom infeksi virus akut", reason: "Demam tanpa fokus jelas dapat sesuai dengan sindrom infeksi virus non-spesifik.", level: "Masih mungkin", tags: ["demam", "fokus belum jelas"] });
  if (fever && (nausea || vomiting || abdominal)) differentials.push({ name: "Infeksi enterik / gastrointestinal", reason: "Demam dengan gejala gastrointestinal perlu dikorelasikan dengan pajanan dan pemeriksaan klinis.", level: "Pertimbangkan", tags: ["demam", "gastrointestinal"] });
  if (cough || soreThroat || rhinitis) differentials.push({ name: "Infeksi saluran napas akut", reason: "Gejala respirasi atas mengarahkan evaluasi pada fokus saluran napas.", level: "Pertimbangkan", tags: ["respirasi"] });
  if (chest) differentials.push({ name: "Nyeri dada akut — evaluasi terarah", reason: "Nyeri dada perlu dibedakan menurut penyebab kardiak, pulmoner, muskuloskeletal, gastrointestinal, dan kondisi lain yang relevan.", level: "Evaluasi terarah", tags: ["nyeri dada", "severity"] });
  if (headache) differentials.push({ name: "Sakit kepala — primer vs sekunder", reason: "Karakter onset dan safety screen perlu dipastikan sebelum menganggap headache primer.", level: "Evaluasi terarah", tags: ["onset", "neurologis"] });
  if (abdominal) differentials.push({ name: "Sindrom nyeri abdomen", reason: "Lokasi, onset, progresi, gejala GI/urinaria, dan pemeriksaan abdomen menentukan arah evaluasi.", level: "Evaluasi terarah", tags: ["abdomen", "peritonisme"] });
  if (diarrhea) differentials.push({ name: "Diare akut", reason: "Pola tinja, darah, demam, pajanan, dan hidrasi menentukan fokus evaluasi.", level: "Pertimbangkan", tags: ["diare", "hidrasi"] });
  if (urinary || flank) differentials.push({ name: "Sindrom saluran kemih", reason: "Keluhan urin dan/atau flank perlu dikorelasikan dengan gejala sistemik dan urinalisis sesuai indikasi.", level: "Pertimbangkan", tags: ["urin", "flank"] });
  if (palpitation || syncope) differentials.push({ name: "Keluhan kardiovaskular / aritmia", reason: "Palpitasi atau sinkop memerlukan penilaian ritme, hemodinamika, pemicu, dan riwayat kardiak.", level: "Evaluasi terarah", tags: ["ritme", "hemodinamika"] });
  if (allergy) differentials.push({ name: "Reaksi alergi", reason: "Gejala kulit perlu dinilai bersama kemungkinan keterlibatan airway atau sirkulasi.", level: "Pertimbangkan", tags: ["kulit", "airway"] });
  if (trauma) differentials.push({ name: "Cedera terkait trauma", reason: "Mekanisme, lokasi cedera, gejala neurologis, dan tanda instabilitas perlu dipetakan.", level: "Evaluasi terarah", tags: ["trauma"] });
  if (!differentials.length) differentials.push({ name: "Keluhan belum cukup terstruktur", reason: "Belum ada pola gejala yang cukup untuk rule set saat ini. Lengkapi anamnesis dan tanda vital.", level: "Data belum cukup", tags: ["anamnesis", "vital"] });

  // 5. Safety and investigations
  if (lowSpO2) redFlags.push("SpO₂ terukur <92%: nilai segera status respirasi dan stabilitas klinis sesuai konteks.");
  if (tachypnea || dyspnea || isYes(answers["resp-severity"])) redFlags.push("Ada sinyal gangguan respirasi atau peningkatan kerja napas: lakukan penilaian airway-breathing dan severity.");
  if (chest && isYes(answers["chest-associated"])) redFlags.push("Nyeri dada dengan gejala penyerta berisiko memerlukan evaluasi kardiopulmoner akut.");
  if (syncope && (chest || palpitation || isYes(answers["cardiac-history"]))) redFlags.push("Sinkop dengan fitur kardiak memerlukan evaluasi segera.");
  if (altered || focal || isYes(answers["general-safety"])) redFlags.push("Perubahan kesadaran, kejang, nyeri dada berat, sesak berat, atau defisit neurologis akut memerlukan evaluasi segera.");
  if (bleeding || isYes(answers["bleeding"]) || isYes(answers["fever-bleeding"])) redFlags.push("Perdarahan dilaporkan: nilai sumber, derajat, hemodinamika, dan medication safety.");
  if (isYes(answers["abd-severity"])) redFlags.push("Nyeri abdomen berat atau fitur peritoneal memerlukan evaluasi segera.");
  if (isYes(answers["fatigue-systemic"]) && (fever || weightLoss)) redFlags.push("Fatigue disertai gejala sistemik perlu evaluasi lebih lanjut dan review klinis.");
  if (narrowPulsePressure) redFlags.push("Tekanan nadi tampak menyempit dari input tekanan darah; interpretasikan bersama perfusi dan temuan klinis lain.");
  if (Object.keys(vitalLabels).some(key => !input.vitals[key as keyof Vitals])) redFlags.push("Tanda vital belum lengkap sehingga stabilitas pasien belum dapat dinilai dari form saja.");

  investigations.push({ name: "Tanda vital lengkap", reason: "Menilai stabilitas sebelum keputusan berikutnya.", priority: "Wajib" });
  if (fatigue) investigations.push({ name: "Pemeriksaan fisik terarah + review tidur, nutrisi, obat, dan aktivitas", reason: "Fatigue memiliki banyak kemungkinan penyebab sehingga penilaian klinis dasar perlu diselesaikan dahulu.", priority: "Wajib" });
  if (fatigue && (pallor || bleeding || isYes(answers["fatigue-anemia"]))) investigations.push({ name: "Evaluasi anemia sesuai indikasi klinis", reason: "Dipertimbangkan bila terdapat gejala atau faktor risiko yang mengarah ke anemia/perdarahan.", priority: "Disarankan" });
  if (fatigue && (polyuria || polydipsia || weightLoss || isYes(answers["fatigue-metabolic"]))) investigations.push({ name: "Evaluasi metabolik/endokrin sesuai pertanyaan klinis", reason: "Pilih pemeriksaan berdasarkan gejala dan temuan klinis yang ingin dijawab.", priority: "Disarankan" });
  if (fever) investigations.push({ name: "Darah lengkap", reason: "Dapat melengkapi evaluasi sindrom demam sesuai pertanyaan klinis.", priority: "Disarankan" });
  if (fever && (headache || myalgia || nausea || vomiting || rash)) investigations.push({ name: "Hematokrit/trombosit sesuai konteks klinis", reason: "Pertimbangkan bila dengue tetap masuk differential setelah anamnesis dan pemeriksaan fisik.", priority: "Pertimbangkan" });
  if (cough || soreThroat || rhinitis || dyspnea) investigations.push({ name: "Pemeriksaan respirasi terarah", reason: "Sesuaikan dengan kerja napas, saturasi, dan temuan pemeriksaan paru.", priority: "Disarankan" });
  if (chest) investigations.push({ name: "Evaluasi nyeri dada akut sesuai kecurigaan klinis", reason: "Pilih pemeriksaan berdasarkan karakter nyeri, faktor risiko, tanda vital, dan pemeriksaan fisik.", priority: "Wajib" });
  if (headache) investigations.push({ name: "Pemeriksaan neurologis terarah", reason: "Cari red flags dan temuan neurologis sekunder.", priority: "Wajib" });
  if (abdominal) investigations.push({ name: "Pemeriksaan abdomen terarah", reason: "Nilai lokasi nyeri, nyeri tekan, defense/rigiditas, distensi, dan temuan lain.", priority: "Wajib" });
  if (diarrhea) investigations.push({ name: "Penilaian status hidrasi", reason: "Menilai kebutuhan rehidrasi dan disposition.", priority: "Wajib" });
  if (urinary || flank) investigations.push({ name: "Urinalisis sesuai indikasi", reason: "Membantu evaluasi keluhan saluran kemih.", priority: "Disarankan" });
  if (palpitation || syncope) investigations.push({ name: "Evaluasi ritme jantung / EKG sesuai indikasi", reason: "Palpitasi atau sinkop memerlukan korelasi ritme dan hemodinamika.", priority: "Disarankan" });

  management.push("Lengkapi anamnesis terarah dan pemeriksaan fisik sebelum menetapkan diagnosis kerja atau disposition.");
  if (fatigue) management.push("Pada fatigue, fokus awal pada durasi, tidur, dampak fungsi, gejala sistemik, obat, nutrisi, aktivitas, dan konteks psikososial.");
  if (fever) management.push("Pada sindrom demam, fokus pada hidrasi sesuai status klinis, monitoring, dan edukasi tanda bahaya.");
  if (dyspnea || tachypnea) management.push("Prioritaskan penilaian airway-breathing, oksigenasi, dan severity.");
  if (chest) management.push("Pada nyeri dada, prioritaskan pemisahan kondisi time-sensitive sebelum terapi simptomatik rutin.");
  if (diarrhea) management.push("Pada diare, fokus pada status hidrasi, intake, karakter tinja, dan tanda infeksi/perdarahan.");
  management.push("Review ulang differential setelah data anamnesis, pemeriksaan fisik, dan pemeriksaan penunjang bertambah.");

  medicationSafety.push("Konfirmasi alergi obat dan obat yang sedang digunakan sebelum meresepkan atau mengubah terapi.");
  medicationSafety.push("Periksa kontraindikasi, interaksi, fungsi ginjal/hati, usia, kehamilan, dan kondisi khusus yang relevan.");
  if (bleeding || isYes(answers["fever-bleeding"])) medicationSafety.push("Dengan sinyal perdarahan, lakukan medication safety review terhadap obat yang dapat meningkatkan risiko perdarahan.");

  let disposition: ClinicalEngineResult["disposition"];
  const criticalFlags = redFlags.filter(flag => !flag.startsWith("Tanda vital belum lengkap"));
  if (criticalFlags.length) disposition = { status: "stabilize-first", title: "Prioritaskan stabilisasi & evaluasi segera", reason: "Terdapat sinyal klinis yang memerlukan penilaian segera atau dapat berkaitan dengan kondisi time-sensitive.", triggers: criticalFlags.slice(0, 5) };
  else if (missing.length || redFlags.length) disposition = { status: "urgent-review", title: "Review klinis sebelum finalisasi", reason: "Data penting masih belum lengkap dan/atau ada keterbatasan yang perlu direview.", triggers: missing.slice(0, 5) };
  else disposition = { status: "routine-review", title: "Lanjutkan review klinis terstruktur", reason: "Data inti lebih lengkap, tetapi diagnosis kerja dan disposition tetap merupakan keputusan dokter.", triggers: [] };

  const objective: string[] = [];
  if (Object.values(input.vitals).some(Boolean)) objective.push(`TD ${input.vitals.bp || "—"}, nadi ${input.vitals.hr || "—"}/menit, RR ${input.vitals.rr || "—"}/menit, suhu ${input.vitals.temp || "—"}°C, SpO₂ ${input.vitals.spo2 || "—"}%.`);
  if (extracted.length) objective.push(`Temuan terstruktur: ${uniq(extracted).join(", ")}.`);
  if (missing.length) objective.push(`Data belum lengkap: ${uniq(missing).slice(0, 6).join(", ")}.`);
  objective.push("Pemeriksaan fisik perlu didokumentasikan langsung oleh dokter.");

  return {
    engineVersion: RULE_VERSION,
    mode: "rules",
    extracted: uniq(extracted),
    missing: uniq(missing),
    questions,
    differentials: differentials.slice(0, 10),
    investigations: uniqInvestigations(investigations),
    redFlags: uniq(redFlags),
    management: uniq(management),
    medicationSafety: uniq(medicationSafety),
    disposition,
    soap: {
      subjective: input.complaint.trim() || "Keluhan belum diisi.",
      objective: objective.join(" "),
      assessment: `Pertimbangan rule engine: ${differentials.map(item => item.name).join(", ")}. Diagnosis kerja final tidak ditetapkan otomatis.`,
      plan: `${investigations.map(item => `${item.priority}: ${item.name}`).join("; ")} ${management.join(" ")} Disposition support: ${disposition.title}.`,
    },
  };
}

function uniqInvestigations(items: Investigation[]) {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
}
