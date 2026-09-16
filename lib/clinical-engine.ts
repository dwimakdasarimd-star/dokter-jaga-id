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

const RULE_VERSION = "clinical-rules-v2.1.0";

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

    const before = text.slice(Math.max(0, index - 32), index);
    const after = text.slice(index + term.length, Math.min(text.length, index + term.length + 22));

    const negatedBefore = /\b(?:tidak|tanpa|disangkal|negatif|menyangkal)(?:\s+ada)?\s*$/.test(before);
    const negatedAfter = /^\s*(?:tidak|tanpa|disangkal|negatif)\b/.test(after);
    return !negatedBefore && !negatedAfter;
  });
}

function symptomMentioned(text: string, terms: string[]) {
  return terms.some(term => text.includes(term));
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
  const hasHeadache = hasSymptom(text, ["sakit kepala", "nyeri kepala", "cephalgia"]);
  const hasMyalgia = hasSymptom(text, ["nyeri badan", "mialgia", "pegal", "myalgia"]);
  const hasNausea = hasSymptom(text, ["mual", "nausea"]);
  const hasVomiting = hasSymptom(text, ["muntah", "vomiting"]);
  const hasCough = hasSymptom(text, ["batuk", "cough"]);
  const hasBleeding = hasSymptom(text, ["perdarahan", "gusi berdarah", "mimisan", "melena", "hematemesis"]);
  const hasAbdominalPain = hasSymptom(text, ["nyeri perut", "sakit perut", "abdominal pain"]);
  const hasDyspnea = hasSymptom(text, ["sesak", "dispnea", "dyspnea"]);
  const hasAlteredMentalStatus = hasSymptom(text, ["penurunan kesadaran", "bingung", "kejang"]);
  const hasRashInText = hasSymptom(text, ["ruam", "rash", "kemerahan kulit"]);
  const hasComorbidityContext = symptomMentioned(text, ["riwayat penyakit", "hipertensi", "diabetes", "ginjal", "asma", "jantung", "hamil", "kehamilan"]);
  const hasAllergyContext = symptomMentioned(text, ["alergi", "alergi obat", "drug allergy"]);

  const q: ClinicalQuestion[] = [
    { id: "rash", text: "Apakah ada ruam atau kemerahan kulit?", whyItMatters: "Membantu memperkaya sindrom klinis dan membedakan beberapa penyebab demam akut.", category: "differential" },
    { id: "bleeding", text: "Apakah ada perdarahan gusi, hidung, mudah memar, muntah darah, atau BAB hitam?", whyItMatters: "Temuan perdarahan dapat mengubah urgensi evaluasi dan keamanan obat.", category: "safety" },
    { id: "abdominal", text: "Apakah ada nyeri perut hebat atau muntah persisten?", whyItMatters: "Dapat memengaruhi kebutuhan evaluasi segera dan strategi hidrasi/monitoring.", category: "disposition" },
    { id: "resp-neuro", text: "Apakah ada sesak, lemas berat, penurunan kesadaran, atau kejang?", whyItMatters: "Gejala ini dapat mengubah disposition dan memerlukan penilaian stabilitas segera.", category: "safety" },
    { id: "exposure", text: "Apakah ada paparan sakit serupa, perjalanan, makanan/air berisiko, atau konteks epidemiologi relevan?", whyItMatters: "Konteks paparan membantu menyesuaikan differential dan pemeriksaan yang dipilih.", category: "differential" },
  ];

  if (hasFever) extracted.push("Demam");
  if (hasHeadache) extracted.push("Sakit kepala");
  if (hasMyalgia) extracted.push("Mialgia / nyeri badan");
  if (hasNausea) extracted.push("Mual");
  if (hasVomiting) extracted.push("Muntah");
  if (hasCough) extracted.push("Batuk");
  if (hasBleeding) extracted.push("Gejala perdarahan disebutkan");
  if (hasAbdominalPain) extracted.push("Nyeri perut");
  if (hasDyspnea) extracted.push("Sesak/dispnea");
  if (hasAlteredMentalStatus) extracted.push("Gangguan kesadaran/neurologis");
  if (hasRashInText || yes(answers.rash)) extracted.push("Ruam/kemerahan kulit");
  if (no(answers.bleeding)) extracted.push("Perdarahan disangkal pada anamnesis terarah");
  if (no(answers.respNeuro)) extracted.push("Red flags respirasi/neurologis disangkal pada anamnesis terarah");
  if (no(answers.abdominal)) extracted.push("Nyeri perut hebat/muntah persisten disangkal pada anamnesis terarah");

  const vitalKeys: (keyof Vitals)[] = ["bp", "hr", "rr", "temp", "spo2"];
  const missingVitalLabels: Record<keyof Vitals, string> = {
    bp: "Tekanan darah", hr: "Nadi", rr: "Frekuensi napas", temp: "Suhu", spo2: "SpO₂",
  };
  vitalKeys.forEach(key => { if (!input.vitals[key]) missing.push(missingVitalLabels[key]); });

  q.forEach(question => {
    if (!answers[question.id] || answers[question.id] === "unknown") {
      missing.push(`${question.text.replace(/^Apakah /, "")} belum ditentukan`);
    }
  });
  if (!hasComorbidityContext) missing.push("Riwayat penyakit/komorbid belum jelas");
  if (!hasAllergyContext) missing.push("Alergi obat belum jelas");

  if (hasFever && (hasHeadache || hasMyalgia || yes(answers.exposure))) {
    differentials.push({
      name: "Dengue fever",
      reason: "Sindrom demam akut dengan sakit kepala/mialgia atau konteks paparan perlu dikorelasikan dengan pemeriksaan klinis dan epidemiologi.",
      level: "Pertimbangkan",
      tags: ["demam akut", hasHeadache ? "sakit kepala" : hasMyalgia ? "mialgia" : "paparan relevan"],
    });
  }
  if (hasFever) {
    differentials.push({ name: "Sindrom infeksi virus akut", reason: "Demam tanpa fokus infeksi yang sudah teridentifikasi dapat sesuai dengan sindrom infeksi virus non-spesifik.", level: "Masih mungkin", tags: ["demam", "fokus belum jelas"] });
  }
  if (hasFever && (hasNausea || hasVomiting || hasAbdominalPain || yes(answers.exposure))) {
    differentials.push({ name: "Demam tifoid / infeksi enterik", reason: "Demam dengan keluhan gastrointestinal atau paparan relevan perlu dikorelasikan dengan konteks klinis.", level: "Pertimbangkan", tags: ["demam", "gastrointestinal"] });
  }
  if (hasCough) {
    differentials.push({ name: "Infeksi saluran napas akut", reason: "Batuk menjadi fokus gejala sehingga etiologi respiratorik perlu dikorelasikan dengan pemeriksaan fisik dan gejala penyerta.", level: "Pertimbangkan", tags: ["batuk", "fokus respirasi"] });
  }
  if (hasFever && hasCough) {
    differentials.push({ name: "Sindrom infeksi respiratorik dengan demam", reason: "Demam disertai batuk mengarahkan evaluasi pada fokus respirasi sesuai temuan klinis.", level: "Pertimbangkan", tags: ["demam", "batuk"] });
  }
  if (differentials.length === 0) {
    differentials.push({ name: "Keluhan belum terstruktur", reason: "Data belum cukup untuk rule set V2.1 menghasilkan pertimbangan klinis spesifik.", level: "Data belum cukup", tags: ["lengkapi anamnesis", "review tanda vital"] });
  }

  const activeRedFlagText: string[] = [];
  if (hasBleeding || yes(answers.bleeding)) activeRedFlagText.push("Gejala perdarahan dilaporkan: nilai derajat, hemodinamika, dan sumber perdarahan segera.");
  if (hasDyspnea || yes(answers["resp-neuro"])) activeRedFlagText.push("Gejala respirasi signifikan dilaporkan: nilai status respirasi dan stabilitas pasien segera.");
  if (hasAlteredMentalStatus || yes(answers["resp-neuro"])) activeRedFlagText.push("Gangguan kesadaran/neurologis dilaporkan: lakukan evaluasi segera sesuai konteks klinis.");
  if (yes(answers.abdominal)) activeRedFlagText.push("Nyeri perut hebat atau muntah persisten dilaporkan: reassess hidrasi, perfusi, dan kebutuhan evaluasi segera.");
  if (missing.some(x => ["Tekanan darah", "Nadi", "Frekuensi napas", "Suhu", "SpO₂"].includes(x))) activeRedFlagText.push("Tanda vital belum lengkap sehingga stabilitas pasien belum dapat dinilai dari data form.");
  redFlags.push(...Array.from(new Set(activeRedFlagText)));

  investigations.push({ name: "Tanda vital lengkap", reason: "Menilai stabilitas pasien sebelum keputusan berikutnya.", priority: "Wajib" });
  if (hasFever) investigations.push({ name: "Darah lengkap", reason: "Dipertimbangkan untuk melengkapi evaluasi sindrom demam sesuai pertanyaan klinis.", priority: "Disarankan" });
  if (hasFever && (hasHeadache || hasMyalgia || hasNausea || hasVomiting || yes(answers.rash))) {
    investigations.push({ name: "Hematokrit/trombosit sesuai konteks klinis", reason: "Pertimbangkan bila dengue tetap masuk differential setelah anamnesis dan pemeriksaan fisik.", priority: "Pertimbangkan" });
  }
  if (hasCough || hasDyspnea) investigations.push({ name: "Evaluasi respirasi terarah sesuai temuan klinis", reason: "Sesuaikan pemeriksaan tambahan dengan derajat gejala dan temuan pemeriksaan fisik.", priority: "Pertimbangkan" });

  management.push("Lengkapi pemeriksaan fisik dan tanda vital sebelum menetapkan disposition.");
  if (hasFever) management.push("Pertimbangkan terapi suportif, hidrasi sesuai status klinis, dan monitoring respons terapi.");
  management.push("Pilih pemeriksaan berdasarkan pertanyaan klinis yang ingin dijawab dan temuan pasien.");
  management.push("Review ulang diagnosis kerja setelah anamnesis, pemeriksaan fisik, dan hasil pemeriksaan penunjang baru tersedia.");

  medicationSafety.push("Konfirmasi alergi obat dan obat yang sedang digunakan sebelum meresepkan.");
  medicationSafety.push("Periksa kontraindikasi, interaksi, fungsi ginjal/hati, usia, kehamilan, dan kondisi khusus yang relevan.");
  if (hasBleeding || yes(answers.bleeding)) medicationSafety.push("Karena ada sinyal perdarahan, lakukan medication safety review khusus terhadap obat yang dapat meningkatkan risiko perdarahan.");

  let disposition: ClinicalEngineResult["disposition"];
  if (hasAlteredMentalStatus || hasDyspnea || hasBleeding || yes(answers["resp-neuro"]) || yes(answers.bleeding)) {
    disposition = { status: "stabilize-first", title: "Prioritaskan stabilisasi & evaluasi segera", reason: "Terdapat sinyal yang dapat berkaitan dengan kondisi tidak stabil atau red flag.", triggers: activeRedFlagText.slice(0, 4) };
  } else if (missing.length > 0) {
    disposition = { status: "urgent-review", title: "Review klinis sebelum finalisasi", reason: "Masih ada data penting yang belum lengkap untuk mendukung keputusan disposition.", triggers: missing.slice(0, 5) };
  } else {
    disposition = { status: "routine-review", title: "Lanjutkan review klinis terstruktur", reason: "Data inti pada form sudah lebih lengkap, tetapi diagnosis dan disposition tetap memerlukan keputusan dokter.", triggers: [] };
  }

  const objective = `${missing.length ? `Data belum lengkap: ${missing.slice(0, 6).join(", ")}. ` : "Data inti form lengkap. "}Pemeriksaan fisik tetap perlu didokumentasikan oleh dokter.`;
  const assessment = `Pertimbangan rule engine: ${differentials.map(x => x.name).join(", ")}. Diagnosis kerja final tidak ditetapkan otomatis.`;
  const plan = `${investigations.map(x => `${x.priority}: ${x.name}`).join("; ")} ${management.join(" ")} Disposition: ${disposition.title}.`;

  return {
    engineVersion: RULE_VERSION,
    mode: "rules",
    extracted: Array.from(new Set(extracted)),
    missing: Array.from(new Set(missing)),
    questions: q,
    differentials: differentials.slice(0, 5),
    investigations,
    redFlags,
    management,
    medicationSafety,
    disposition,
    soap: {
      subjective: input.complaint.trim() || "Keluhan belum diisi.",
      objective,
      assessment,
      plan,
    },
  };
}
