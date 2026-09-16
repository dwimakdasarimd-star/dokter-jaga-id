export type Vitals = {
  bp?: string;
  hr?: string;
  rr?: string;
  temp?: string;
  spo2?: string;
};

export type QuestionAnswer = "yes" | "no" | "unknown";

export type Differential = {
  name: string;
  reason: string;
  level: string;
  tags: string[];
};

export type Investigation = {
  name: string;
  reason: string;
  priority: "Wajib" | "Disarankan" | "Pertimbangkan";
};

export type ClinicalQuestion = {
  id: string;
  text: string;
  whyItMatters: string;
  category: "safety" | "differential" | "disposition";
};

export type ClinicalEngineInput = {
  complaint: string;
  vitals: Vitals;
  questionAnswers?: Record<string, QuestionAnswer>;
};

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
  disposition: {
    status: "stabilize-first" | "urgent-review" | "routine-review";
    title: string;
    reason: string;
    triggers: string[];
  };
  soap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
};

const RULE_VERSION = "clinical-rules-v3.0.0";

function norm(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function yes(answer: QuestionAnswer | undefined) {
  return answer === "yes";
}

function no(answer: QuestionAnswer | undefined) {
  return answer === "no";
}

function hasSymptom(text: string, terms: string[]) {
  return terms.some(term => {
    const index = text.indexOf(term);
    if (index < 0) return false;
    const before = text.slice(Math.max(0, index - 36), index);
    const after = text.slice(index + term.length, Math.min(text.length, index + term.length + 24));
    const negatedBefore = /\b(?:tidak|tanpa|disangkal|negatif|menyangkal)(?:\s+ada)?\s*$/.test(before);
    const negatedAfter = /^\s*(?:tidak|tanpa|disangkal|negatif)\b/.test(after);
    return !negatedBefore && !negatedAfter;
  });
}

function symptomMentioned(text: string, terms: string[]) {
  return terms.some(term => text.includes(term));
}

function numberOf(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value.replace(/,/g, ".").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function addUnique(target: string[], value: string) {
  if (!target.includes(value)) target.push(value);
}

export function runClinicalEngine(input: ClinicalEngineInput): ClinicalEngineResult {
  const text = norm(input.complaint);
  const answers = input.questionAnswers ?? {};
  const extracted: string[] = [];
  const differentials: Differential[] = [];
  const investigations: Investigation[] = [];
  const redFlags: string[] = [];
  const management: string[] = [];
  const medicationSafety: string[] = [];
  const missing: string[] = [];

  const hasFever = hasSymptom(text, ["demam", "febrile", "panas"]);
  const hasHeadache = hasSymptom(text, ["sakit kepala", "nyeri kepala", "cephalgia", "headache"]);
  const hasMyalgia = hasSymptom(text, ["nyeri badan", "mialgia", "pegal", "myalgia", "nyeri otot"]);
  const hasNausea = hasSymptom(text, ["mual", "nausea"]);
  const hasVomiting = hasSymptom(text, ["muntah", "vomiting"]);
  const hasCough = hasSymptom(text, ["batuk", "cough"]);
  const hasSoreThroat = hasSymptom(text, ["nyeri tenggorok", "sakit tenggorok", "radang tenggorok", "sore throat"]);
  const hasRunnyNose = hasSymptom(text, ["pilek", "hidung tersumbat", "rhinorrhea", "flu"]);
  const hasBleeding = hasSymptom(text, ["perdarahan", "gusi berdarah", "mimisan", "melena", "hematemesis", "muntah darah", "bab hitam"]);
  const hasAbdominalPain = hasSymptom(text, ["nyeri perut", "sakit perut", "abdominal pain"]);
  const hasDiarrhea = hasSymptom(text, ["diare", "mencret", "berak cair", "diarrhea"]);
  const hasDysuria = hasSymptom(text, ["nyeri saat kencing", "nyeri saat buang air kecil", "dysuria", "anyang-anyangan"]);
  const hasUrinaryFrequency = hasSymptom(text, ["sering kencing", "frekuensi kencing meningkat", "frequency"]);
  const hasFlankPain = hasSymptom(text, ["nyeri pinggang", "nyeri flank", "costovertebral"]);
  const hasDyspnea = hasSymptom(text, ["sesak", "dispnea", "dyspnea", "sulit bernapas"]);
  const hasChestPain = hasSymptom(text, ["nyeri dada", "sakit dada", "chest pain", "tekanan dada"]);
  const hasPalpitations = hasSymptom(text, ["berdebar", "palpitasi", "palpitation"]);
  const hasSyncope = hasSymptom(text, ["pingsan", "sinkop", "syncope"]);
  const hasAlteredMentalStatus = hasSymptom(text, ["penurunan kesadaran", "bingung", "mengantuk berat", "kejang"]);
  const hasFocalNeuro = hasSymptom(text, ["kelemahan satu sisi", "mulut mencong", "bicara pelo", "afasia", "baal satu sisi", "focal deficit"]);
  const hasThunderclap = symptomMentioned(text, ["tiba-tiba sangat hebat", "sangat hebat mendadak", "thunderclap"]);
  const hasRash = hasSymptom(text, ["ruam", "rash", "kemerahan kulit"]);
  const hasAllergicFeatures = hasSymptom(text, ["gatal", "urtikaria", "biduran", "bengkak bibir", "bengkak wajah"]);
  const hasTrauma = symptomMentioned(text, ["trauma", "jatuh", "kecelakaan", "terbentur"]);
  const hasComorbidityContext = symptomMentioned(text, ["riwayat penyakit", "hipertensi", "diabetes", "ginjal", "asma", "jantung", "stroke", "kanker", "hamil", "kehamilan"]);
  const hasAllergyContext = symptomMentioned(text, ["alergi", "alergi obat", "drug allergy"]);
  const hasMedicationContext = symptomMentioned(text, ["obat rutin", "obat yang diminum", "sedang minum", "antikoagulan", "aspirin", "ibuprofen", "warfarin"]);

  const bpSys = numberOf(input.vitals.bp?.split("/")[0]);
  const hr = numberOf(input.vitals.hr);
  const rr = numberOf(input.vitals.rr);
  const temp = numberOf(input.vitals.temp);
  const spo2 = numberOf(input.vitals.spo2);

  const questions: ClinicalQuestion[] = [];
  const pushQuestion = (q: ClinicalQuestion) => addUnique(questions as unknown as string[], q as unknown as string) || undefined;

  const baseSafetyQuestions: ClinicalQuestion[] = [
    { id: "red-flag-resp-neuro", text: "Apakah ada sesak berat, penurunan kesadaran, kejang, atau kelemahan satu sisi yang baru?", whyItMatters: "Temuan respirasi atau neurologis akut dapat mengubah prioritas evaluasi dan disposition.", category: "safety" },
  ];

  const syndromeQuestions: ClinicalQuestion[] = [];

  if (hasFever) {
    syndromeQuestions.push(
      { id: "fever-duration", text: "Sudah berapa hari demam berlangsung dan kapan terakhir suhu diukur?", whyItMatters: "Durasi dan fase demam membantu membentuk konteks differential dan tindak lanjut.", category: "differential" },
      { id: "rash", text: "Apakah ada ruam atau kemerahan kulit?", whyItMatters: "Dapat memperkaya sindrom demam akut dan membantu membedakan beberapa etiologi.", category: "differential" },
      { id: "bleeding", text: "Apakah ada perdarahan gusi, hidung, mudah memar, muntah darah, atau BAB hitam?", whyItMatters: "Perdarahan dapat mengubah urgensi evaluasi dan keamanan obat.", category: "safety" },
      { id: "abdominal", text: "Apakah ada nyeri perut hebat atau muntah persisten?", whyItMatters: "Dapat merupakan warning sign pada beberapa sindrom demam dan memengaruhi kebutuhan observasi.", category: "disposition" },
      { id: "exposure", text: "Apakah ada paparan sakit serupa, perjalanan, gigitan nyamuk, makanan/air berisiko, atau konteks epidemiologi relevan?", whyItMatters: "Konteks pajanan membantu mengarahkan differential tanpa menganggap diagnosis sudah pasti.", category: "differential" },
    );
  }

  if (hasCough || hasSoreThroat || hasRunnyNose || hasDyspnea) {
    syndromeQuestions.push(
      { id: "resp-severity", text: "Apakah sesak memburuk, ada nyeri dada, sulit bicara karena sesak, atau saturasi rendah bila sudah diperiksa?", whyItMatters: "Menilai severity dan apakah evaluasi segera diperlukan.", category: "safety" },
      { id: "resp-sputum", text: "Apakah ada dahak purulen, darah pada dahak, mengi, atau stridor?", whyItMatters: "Membantu memperkaya fokus respirasi dan pemeriksaan yang dipilih.", category: "differential" },
      { id: "resp-exposure", text: "Apakah ada kontak sakit serupa atau paparan lingkungan/pekerjaan yang relevan?", whyItMatters: "Paparan dapat membantu menentukan differential dan kebutuhan testing.", category: "differential" },
    );
  }

  if (hasChestPain) {
    syndromeQuestions.push(
      { id: "chest-character", text: "Bagaimana karakter nyeri dada: tertekan/tertindih, pleuritik, positional, atau dipicu aktivitas?", whyItMatters: "Karakter dan pemicu nyeri membantu mengarahkan differential dan kebutuhan evaluasi.", category: "differential" },
      { id: "chest-radiation", text: "Apakah nyeri menjalar ke lengan, rahang, punggung, atau disertai keringat dingin/mual?", whyItMatters: "Gejala penyerta dapat meningkatkan urgensi evaluasi nyeri dada akut.", category: "safety" },
      { id: "chest-dyspnea", text: "Apakah disertai sesak, sinkop, palpitasi, atau penurunan toleransi aktivitas?", whyItMatters: "Membantu menilai kemungkinan penyebab kardiopulmoner yang memerlukan evaluasi lebih cepat.", category: "safety" },
    );
  }

  if (hasHeadache) {
    syndromeQuestions.push(
      { id: "headache-onset", text: "Apakah sakit kepala muncul mendadak dan mencapai intensitas maksimal dalam waktu singkat?", whyItMatters: "Onset sangat mendadak merupakan red flag yang memerlukan evaluasi segera.", category: "safety" },
      { id: "headache-neuro", text: "Apakah ada kelemahan satu sisi, gangguan bicara/penglihatan, kejang, atau perubahan kesadaran?", whyItMatters: "Defisit neurologis akut mengubah urgensi dan jalur evaluasi.", category: "safety" },
      { id: "headache-infection", text: "Apakah ada demam, kaku kuduk, ruam, atau fotofobia?", whyItMatters: "Membantu membedakan headache primer dari kemungkinan proses infeksi/sekunder.", category: "differential" },
    );
  }

  if (hasAbdominalPain) {
    syndromeQuestions.push(
      { id: "abd-location", text: "Di mana lokasi nyeri, sejak kapan, dan apakah nyeri berpindah atau semakin berat?", whyItMatters: "Lokasi, onset, dan progresivitas membantu menentukan fokus pemeriksaan abdomen.", category: "differential" },
      { id: "abd-peritoneal", text: "Apakah ada nyeri yang sangat hebat, perut terasa kaku, muntah terus-menerus, atau tidak bisa makan/minum?", whyItMatters: "Dapat menunjukkan kebutuhan evaluasi segera dan penilaian hidrasi/perfusi.", category: "disposition" },
      { id: "abd-gi-bleed", text: "Apakah ada darah pada muntah atau tinja, atau BAB hitam?", whyItMatters: "Perdarahan gastrointestinal mengubah urgensi dan medication safety.", category: "safety" },
    );
  }

  if (hasDiarrhea) {
    syndromeQuestions.push(
      { id: "diarrhea-blood", text: "Apakah tinja berdarah atau berlendir, atau ada demam tinggi?", whyItMatters: "Membantu membedakan pola diare dan kebutuhan pemeriksaan lebih lanjut.", category: "differential" },
      { id: "diarrhea-dehydration", text: "Apakah ada sangat haus, lemas, jarang kencing, pusing saat berdiri, atau tidak mampu minum?", whyItMatters: "Menilai kemungkinan dehidrasi yang dapat mengubah disposition.", category: "disposition" },
    );
  }

  if (hasDysuria || hasUrinaryFrequency || hasFlankPain) {
    syndromeQuestions.push(
      { id: "urinary-fever", text: "Apakah ada demam, menggigil, mual/muntah, atau nyeri pinggang?", whyItMatters: "Gejala sistemik dapat menggeser evaluasi dari lower urinary symptoms ke kemungkinan infeksi saluran kemih atas.", category: "safety" },
      { id: "urinary-pregnancy", text: "Apakah ada kemungkinan hamil?", whyItMatters: "Status kehamilan dapat mengubah differential, pilihan pemeriksaan, dan terapi.", category: "safety" },
    );
  }

  if (hasPalpitations || hasSyncope) {
    syndromeQuestions.push(
      { id: "cardiac-history", text: "Apakah ada riwayat penyakit jantung, aritmia, atau kematian mendadak dalam keluarga?", whyItMatters: "Riwayat tersebut dapat meningkatkan kebutuhan evaluasi kardiovaskular pada keluhan tertentu.", category: "safety" },
      { id: "palpitation-trigger", text: "Apakah keluhan dipicu aktivitas, terjadi saat istirahat, atau disertai nyeri dada/sesak?", whyItMatters: "Pola gejala membantu menentukan prioritas evaluasi.", category: "differential" },
    );
  }

  if (hasAllergicFeatures || symptomMentioned(text, ["sesak setelah obat", "bengkak lidah", "sulit bernapas setelah makan"])) {
    syndromeQuestions.push({ id: "allergy-airway", text: "Apakah ada bengkak lidah/tenggorok, suara serak, sulit bernapas, atau pusing setelah paparan tertentu?", whyItMatters: "Keterlibatan jalan napas atau sirkulasi dapat merupakan keadaan gawat darurat.", category: "safety" });
  }

  const questionMap = new Map<string, ClinicalQuestion>();
  [...baseSafetyQuestions, ...syndromeQuestions].forEach(q => questionMap.set(q.id, q));
  questionMap.forEach(q => questions.push(q));

  if (hasFever) addUnique(extracted, "Demam");
  if (hasHeadache) addUnique(extracted, "Sakit kepala");
  if (hasMyalgia) addUnique(extracted, "Mialgia / nyeri badan");
  if (hasNausea) addUnique(extracted, "Mual");
  if (hasVomiting) addUnique(extracted, "Muntah");
  if (hasCough) addUnique(extracted, "Batuk");
  if (hasSoreThroat) addUnique(extracted, "Nyeri tenggorok");
  if (hasRunnyNose) addUnique(extracted, "Gejala hidung/flu");
  if (hasBleeding) addUnique(extracted, "Gejala perdarahan disebutkan");
  if (hasAbdominalPain) addUnique(extracted, "Nyeri perut");
  if (hasDiarrhea) addUnique(extracted, "Diare");
  if (hasDysuria || hasUrinaryFrequency) addUnique(extracted, "Gejala kemih bawah");
  if (hasFlankPain) addUnique(extracted, "Nyeri pinggang/flank");
  if (hasDyspnea) addUnique(extracted, "Sesak/dispnea");
  if (hasChestPain) addUnique(extracted, "Nyeri dada");
  if (hasPalpitations) addUnique(extracted, "Palpitasi");
  if (hasSyncope) addUnique(extracted, "Sinkop/pingsan");
  if (hasAlteredMentalStatus) addUnique(extracted, "Gangguan kesadaran/neurologis");
  if (hasFocalNeuro) addUnique(extracted, "Defisit neurologis fokal");
  if (hasRash) addUnique(extracted, "Ruam");
  if (hasAllergicFeatures) addUnique(extracted, "Fitur alergi");
  if (no(answers["red-flag-resp-neuro"])) addUnique(extracted, "Red flags respirasi/neurologis disangkal pada anamnesis terarah");
  if (no(answers.bleeding)) addUnique(extracted, "Perdarahan disangkal pada anamnesis terarah");

  const missingVitalLabels: Record<keyof Vitals, string> = {
    bp: "Tekanan darah", hr: "Nadi", rr: "Frekuensi napas", temp: "Suhu", spo2: "SpO₂",
  };
  (Object.keys(missingVitalLabels) as (keyof Vitals)[]).forEach(key => {
    if (!input.vitals[key]) missing.push(missingVitalLabels[key]);
  });

  questions.forEach(q => {
    if (!answers[q.id] || answers[q.id] === "unknown") missing.push(`${q.text} — belum ditentukan`);
  });
  if (!hasComorbidityContext) missing.push("Riwayat penyakit/komorbid belum jelas");
  if (!hasAllergyContext) missing.push("Alergi obat belum jelas");
  if (!hasMedicationContext) missing.push("Obat yang sedang digunakan belum jelas");

  const tachycardia = typeof hr === "number" && hr >= 100;
  const tachypnea = typeof rr === "number" && rr >= 22;
  const feverMeasured = typeof temp === "number" && temp >= 38;
  const lowSpO2 = typeof spo2 === "number" && spo2 < 92;
  const narrowPulsePressure = typeof bpSys === "number" && input.vitals.bp?.includes("/") ? (() => {
    const dia = numberOf(input.vitals.bp?.split("/")[1]);
    return typeof dia === "number" && bpSys - dia <= 25;
  })() : false;

  if (hasFever && (hasHeadache || hasMyalgia || hasRash || hasNausea || hasVomiting || hasBleeding)) {
    differentials.push({
      name: "Sindrom dengue / arboviral",
      reason: "Demam akut dengan kombinasi gejala yang dapat muncul pada dengue; diagnosis tetap memerlukan korelasi klinis, epidemiologi, dan pemeriksaan yang sesuai.",
      level: "Pertimbangkan",
      tags: ["demam", hasHeadache ? "sakit kepala" : hasMyalgia ? "mialgia" : hasNausea ? "mual" : "gejala penyerta"],
    });
  }
  if (hasFever && (hasCough || hasSoreThroat || hasRunnyNose)) {
    differentials.push({ name: "Infeksi saluran napas akut", reason: "Demam disertai gejala respirasi atas mengarahkan evaluasi pada fokus saluran napas.", level: "Pertimbangkan", tags: ["demam", "gejala respirasi"] });
  }
  if ((hasCough || hasDyspnea) && (hasFever || feverMeasured)) {
    differentials.push({ name: "Infeksi respiratorik dengan demam", reason: "Gejala respirasi disertai demam memerlukan korelasi dengan pemeriksaan paru dan derajat severity.", level: "Pertimbangkan", tags: ["batuk/sesak", "demam"] });
  }
  if (hasChestPain) {
    differentials.push({ name: "Nyeri dada akut — evaluasi kardiopulmoner", reason: "Nyeri dada memerlukan pemisahan cepat antara penyebab kardiak, pulmoner, muskuloskeletal, gastrointestinal, dan kondisi lain yang relevan.", level: "Evaluasi terarah", tags: ["nyeri dada", "severity"] });
    differentials.push({ name: "Penyebab non-kardiak nyeri dada", reason: "Refluks, muskuloskeletal, pleuritik, dan penyebab lain tetap perlu dipertimbangkan berdasarkan karakter nyeri dan pemeriksaan.", level: "Masih mungkin", tags: ["karakter nyeri", "pemeriksaan fisik"] });
  }
  if (hasHeadache) {
    differentials.push({ name: "Headache primer vs sekunder", reason: "Sistem memprioritaskan pencarian red flag sebelum menganggap keluhan sebagai headache primer.", level: "Evaluasi terarah", tags: ["onset", "defisit neurologis"] });
  }
  if (hasAbdominalPain) {
    differentials.push({ name: "Sindrom nyeri abdomen akut", reason: "Nyeri abdomen perlu dipetakan menurut lokasi, onset, progresi, gejala GI/urinaria, dan temuan pemeriksaan fisik.", level: "Evaluasi terarah", tags: ["lokasi", "peritonisme"] });
  }
  if (hasDiarrhea) {
    differentials.push({ name: "Diare akut", reason: "Diare memerlukan penilaian pola, darah pada tinja, demam, paparan, dan status hidrasi.", level: "Pertimbangkan", tags: ["diare", "hidrasi"] });
  }
  if (hasDysuria || hasUrinaryFrequency || hasFlankPain) {
    differentials.push({ name: "Sindrom infeksi saluran kemih", reason: "Keluhan kemih bawah atau nyeri flank memerlukan korelasi dengan gejala sistemik dan pemeriksaan urin yang relevan.", level: "Pertimbangkan", tags: ["gejala kemih", "urin"] });
  }
  if (hasPalpitations || hasSyncope) {
    differentials.push({ name: "Keluhan kardiovaskular / aritmia", reason: "Palpitasi atau sinkop memerlukan penilaian ritme, hemodinamika, pemicu, dan riwayat kardiak.", level: "Evaluasi terarah", tags: ["palpitasi/sinkop", "hemodinamika"] });
  }
  if (hasAllergicFeatures) {
    differentials.push({ name: "Reaksi alergi", reason: "Gejala kulit/pruritus perlu dinilai bersama keterlibatan jalan napas atau sirkulasi untuk menentukan urgensi.", level: "Pertimbangkan", tags: ["gatal/urtikaria", "airway"] });
  }
  if (hasTrauma) differentials.push({ name: "Cedera terkait trauma", reason: "Riwayat trauma membutuhkan pemetaan mekanisme, lokasi cedera, gejala neurologis, dan tanda instabilitas.", level: "Evaluasi terarah", tags: ["mekanisme", "red flags"] });
  if (differentials.length === 0) {
    differentials.push({ name: "Keluhan belum terstruktur", reason: "Data belum cukup untuk menghasilkan differential yang spesifik pada rule set V3.", level: "Data belum cukup", tags: ["lengkapi anamnesis", "review tanda vital"] });
  }

  const activeRedFlags: string[] = [];
  if (lowSpO2) activeRedFlags.push("SpO₂ terukur di bawah 92%: nilai segera status respirasi dan stabilitas klinis sesuai konteks pasien.");
  if (tachypnea || hasDyspnea || yes(answers["resp-severity"])) activeRedFlags.push("Ada sinyal gangguan respirasi atau peningkatan kerja napas: lakukan penilaian airway-breathing dan severity segera.");
  if (hasChestPain && (yes(answers["chest-radiation"]) || yes(answers["chest-dyspnea"]))) activeRedFlags.push("Nyeri dada dengan gejala penyerta berisiko: prioritaskan evaluasi kardiopulmoner akut.");
  if (hasSyncope && (hasChestPain || hasPalpitations || yes(answers["cardiac-history"]))) activeRedFlags.push("Sinkop dengan fitur kardiak memerlukan evaluasi segera terhadap kemungkinan penyebab kardiovaskular.");
  if (hasThunderclap || yes(answers["headache-onset"])) activeRedFlags.push("Sakit kepala dengan onset sangat mendadak merupakan red flag dan memerlukan evaluasi segera.");
  if (hasFocalNeuro || yes(answers["headache-neuro"])) activeRedFlags.push("Defisit neurologis fokal/perubahan neurologis akut memerlukan evaluasi segera.");
  if (hasAlteredMentalStatus) activeRedFlags.push("Perubahan kesadaran atau kejang dilaporkan: evaluasi ABC, neurologis, dan penyebab reversibel segera.");
  if (hasBleeding || yes(answers.bleeding)) activeRedFlags.push("Perdarahan dilaporkan: nilai sumber, derajat, hemodinamika, dan medication safety segera.");
  if (yes(answers["abd-peritoneal"]) || hasAbdominalPain && symptomMentioned(text, ["perut kaku"])) activeRedFlags.push("Nyeri abdomen dengan fitur peritoneal/keparahan tinggi memerlukan evaluasi segera.");
  if (yes(answers["diarrhea-dehydration"])) activeRedFlags.push("Sinyal dehidrasi signifikan dilaporkan pada diare: nilai perfusi, intake-output, dan kebutuhan rehidrasi segera.");
  if (hasAllergicFeatures && yes(answers["allergy-airway"])) activeRedFlags.push("Fitur alergi dengan kemungkinan keterlibatan jalan napas/sirkulasi memerlukan penilaian gawat darurat segera.");
  if (narrowPulsePressure) activeRedFlags.push("Tekanan nadi tampak menyempit dari input tekanan darah; interpretasikan bersama nadi, perfusi, dan temuan klinis lain.");
  if (!input.vitals.bp || !input.vitals.hr || !input.vitals.rr || !input.vitals.temp || !input.vitals.spo2) activeRedFlags.push("Tanda vital belum lengkap sehingga stabilitas pasien belum dapat dinilai dari data form.");
  redFlags.push(...Array.from(new Set(activeRedFlags)));

  investigations.push({ name: "Tanda vital lengkap", reason: "Menilai stabilitas dan severity sebelum keputusan berikutnya.", priority: "Wajib" });
  if (hasFever) investigations.push({ name: "Darah lengkap", reason: "Dipertimbangkan untuk evaluasi sindrom demam sesuai pertanyaan klinis dan fase penyakit.", priority: "Disarankan" });
  if (hasFever && (hasHeadache || hasMyalgia || hasRash || hasNausea || hasVomiting)) investigations.push({ name: "Trombosit/hematokrit sesuai konteks klinis", reason: "Pertimbangkan bila dengue tetap masuk differential setelah anamnesis dan pemeriksaan fisik.", priority: "Pertimbangkan" });
  if (hasCough || hasDyspnea || hasSoreThroat || hasRunnyNose) investigations.push({ name: "Pemeriksaan respirasi terarah", reason: "Sesuaikan dengan suara napas, kerja napas, saturasi, dan faktor risiko pasien.", priority: "Disarankan" });
  if (hasChestPain) investigations.push({ name: "Evaluasi nyeri dada akut sesuai kecurigaan klinis", reason: "Pertimbangkan pemeriksaan penunjang sesuai karakter nyeri, faktor risiko, tanda vital, dan temuan pemeriksaan fisik.", priority: "Wajib" });
  if (hasHeadache) investigations.push({ name: "Pemeriksaan neurologis terarah", reason: "Cari red flags, defisit fokal, meningismus, perubahan kesadaran, dan tanda lain sesuai konteks.", priority: "Wajib" });
  if (hasAbdominalPain) investigations.push({ name: "Pemeriksaan abdomen terarah", reason: "Nilai lokasi nyeri, defense/rigiditas, nyeri tekan, distensi, bowel sounds, dan tanda lain sesuai klinis.", priority: "Wajib" });
  if (hasDiarrhea) investigations.push({ name: "Penilaian status hidrasi", reason: "Diperlukan untuk menentukan kebutuhan rehidrasi dan disposition.", priority: "Wajib" });
  if (hasDysuria || hasUrinaryFrequency || hasFlankPain) investigations.push({ name: "Urinalisis sesuai indikasi", reason: "Dipertimbangkan untuk membantu evaluasi keluhan saluran kemih sesuai konteks klinis.", priority: "Disarankan" });
  if (hasPalpitations || hasSyncope) investigations.push({ name: "Evaluasi ritme jantung / EKG sesuai indikasi", reason: "Palpitasi atau sinkop dapat memerlukan evaluasi ritme dan korelasi hemodinamik.", priority: "Disarankan" });

  management.push("Lengkapi anamnesis terarah dan pemeriksaan fisik sebelum menetapkan diagnosis kerja atau disposition.");
  if (lowSpO2 || hasDyspnea || tachypnea) management.push("Prioritaskan penilaian airway-breathing, oksigenasi, dan severity sesuai kondisi klinis pasien.");
  if (hasFever) management.push("Untuk sindrom demam, pertimbangkan terapi suportif, hidrasi sesuai status klinis, monitoring, dan edukasi tanda bahaya.");
  if (hasChestPain) management.push("Pada nyeri dada, prioritaskan pemisahan kondisi time-sensitive dari penyebab lain sebelum terapi simptomatik rutin.");
  if (hasDiarrhea) management.push("Pada diare, fokus awal pada status hidrasi, kemampuan intake, frekuensi/karakter tinja, dan tanda infeksi atau perdarahan.");
  if (hasAbdominalPain) management.push("Pada nyeri abdomen, reassess serial bila gejala berkembang dan korelasikan dengan temuan abdomen serta tanda vital.");
  management.push("Review ulang differential setelah jawaban anamnesis, pemeriksaan fisik, dan hasil penunjang baru tersedia.");

  medicationSafety.push("Konfirmasi alergi obat dan obat yang sedang digunakan sebelum meresepkan atau mengubah terapi.");
  medicationSafety.push("Periksa kontraindikasi, interaksi, fungsi ginjal/hati, usia, kehamilan, dan kondisi khusus yang relevan.");
  if (hasBleeding || yes(answers.bleeding)) medicationSafety.push("Dengan sinyal perdarahan, lakukan medication safety review khusus terhadap obat yang dapat meningkatkan risiko perdarahan.");
  if (hasAllergicFeatures) medicationSafety.push("Dokumentasikan paparan/pencetus dan riwayat reaksi sebelumnya sebelum menentukan terapi antialergi.");

  let disposition: ClinicalEngineResult["disposition"];
  if (activeRedFlags.some(flag => !flag.startsWith("Tanda vital belum lengkap")) && (redFlags.length > 0)) {
    disposition = {
      status: "stabilize-first",
      title: "Prioritaskan stabilisasi & evaluasi segera",
      reason: "Terdapat sinyal klinis yang memerlukan penilaian segera atau dapat berkaitan dengan kondisi time-sensitive.",
      triggers: redFlags.slice(0, 5),
    };
  } else if (missing.length > 0 || redFlags.length > 0) {
    disposition = {
      status: "urgent-review",
      title: "Review klinis sebelum finalisasi",
      reason: "Data penting masih belum lengkap dan/atau ada keterbatasan yang perlu direview sebelum disposition.",
      triggers: missing.slice(0, 5),
    };
  } else {
    disposition = {
      status: "routine-review",
      title: "Lanjutkan review klinis terstruktur",
      reason: "Data inti pada form lebih lengkap, tetapi diagnosis kerja dan disposition tetap merupakan keputusan dokter.",
      triggers: [],
    };
  }

  const objectiveParts: string[] = [];
  if (Object.values(input.vitals).some(Boolean)) {
    objectiveParts.push(`Tanda vital terisi: TD ${input.vitals.bp || "—"}, nadi ${input.vitals.hr || "—"}/menit, RR ${input.vitals.rr || "—"}/menit, suhu ${input.vitals.temp || "—"}°C, SpO₂ ${input.vitals.spo2 || "—"}%.`);
  }
  if (missing.length) objectiveParts.push(`Data belum lengkap: ${missing.slice(0, 6).join(", ")}.`);
  objectiveParts.push("Pemeriksaan fisik tetap perlu didokumentasikan langsung oleh dokter.");

  const assessment = `Pertimbangan rule engine: ${differentials.map(x => x.name).join(", ")}. Ini bukan diagnosis otomatis; diagnosis kerja final tetap dikonfirmasi dokter.`;
  const plan = `${investigations.map(x => `${x.priority}: ${x.name}`).join("; ")} ${management.join(" ")} Disposition support: ${disposition.title}.`;

  return {
    engineVersion: RULE_VERSION,
    mode: "rules",
    extracted: Array.from(new Set(extracted)),
    missing: Array.from(new Set(missing)),
    questions,
    differentials: differentials.slice(0, 8),
    investigations,
    redFlags,
    management,
    medicationSafety,
    disposition,
    soap: {
      subjective: input.complaint.trim() || "Keluhan belum diisi.",
      objective: objectiveParts.join(" "),
      assessment,
      plan,
    },
  };
}
