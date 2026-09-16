export type Vitals = {
  bp?: string;
  hr?: string;
  rr?: string;
  temp?: string;
  spo2?: string;
};

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

export type ClinicalEngineInput = {
  complaint: string;
  vitals: Vitals;
  reviewedQuestions?: string[];
};

export type ClinicalEngineResult = {
  engineVersion: string;
  mode: "rules";
  extracted: string[];
  missing: string[];
  questions: string[];
  differentials: Differential[];
  investigations: Investigation[];
  redFlags: string[];
  management: string[];
  medicationSafety: string[];
  soap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
};

const RULE_VERSION = "clinical-rules-v1.0.0";

function norm(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function includesAny(text: string, terms: string[]) {
  return terms.some(term => text.includes(term));
}

function hasDuration(text: string, pattern: RegExp) {
  return pattern.test(text);
}

export function runClinicalEngine(input: ClinicalEngineInput): ClinicalEngineResult {
  const text = norm(input.complaint);
  const extracted: string[] = [];
  const differentials: Differential[] = [];
  const investigations: Investigation[] = [];
  const redFlags: string[] = [];
  const management: string[] = [];
  const medicationSafety: string[] = [];
  const missing: string[] = [];

  const hasFever = includesAny(text, ["demam", "febrile", "panas"]);
  const hasHeadache = includesAny(text, ["sakit kepala", "nyeri kepala", "cephalgia"]);
  const hasMyalgia = includesAny(text, ["nyeri badan", "mialgia", "pegal", "myalgia"]);
  const hasNausea = includesAny(text, ["mual", "nausea"]);
  const hasVomiting = includesAny(text, ["muntah", "vomiting"]);
  const hasCough = includesAny(text, ["batuk", "cough"]);
  const hasBleeding = includesAny(text, ["perdarahan", "gusi berdarah", "mimisan", "melena", "hematemesis"]);
  const hasAbdominalPain = includesAny(text, ["nyeri perut", "sakit perut", "abdominal pain"]);
  const hasDyspnea = includesAny(text, ["sesak", "dispnea", "dyspnea"]);
  const hasAlteredMentalStatus = includesAny(text, ["penurunan kesadaran", "bingung", "kejang"]);
  const prolongedFever = hasDuration(text, /(demam|panas)[^.!?]{0,25}(\d+)\s*(hari|day)/);

  if (hasFever) extracted.push(prolongedFever ? "Demam akut" : "Demam");
  if (hasHeadache) extracted.push("Sakit kepala");
  if (hasMyalgia) extracted.push("Mialgia / nyeri badan");
  if (hasNausea) extracted.push("Mual");
  if (hasVomiting) extracted.push("Muntah");
  if (hasCough) extracted.push("Batuk");
  if (hasBleeding) extracted.push("Riwayat/gejala perdarahan disebutkan");
  if (hasAbdominalPain) extracted.push("Nyeri perut");
  if (hasDyspnea) extracted.push("Sesak/dispnea");
  if (hasAlteredMentalStatus) extracted.push("Gangguan kesadaran/neurologis");
  if (includesAny(text, ["tidak batuk", "tanpa batuk"])) extracted.push("Tidak batuk");
  if (includesAny(text, ["tidak muntah", "tanpa muntah"])) extracted.push("Tidak muntah");

  const vitalKeys: (keyof Vitals)[] = ["bp", "hr", "rr", "temp", "spo2"];
  const missingVitalLabels: Record<keyof Vitals, string> = {
    bp: "Tekanan darah",
    hr: "Nadi",
    rr: "Frekuensi napas",
    temp: "Suhu",
    spo2: "SpO₂",
  };

  for (const key of vitalKeys) {
    if (!input.vitals[key]) missing.push(missingVitalLabels[key]);
  }

  const questionLabels = [
    "Apakah ada ruam atau kemerahan kulit?",
    "Apakah ada perdarahan gusi, hidung, atau mudah memar?",
    "Apakah ada nyeri perut atau muntah persisten?",
    "Apakah ada penurunan kesadaran, lemas berat, atau sesak?",
  ];

  questionLabels.forEach(question => {
    if (!input.reviewedQuestions?.includes(question)) missing.push(question.replace(/^Apakah /, "") + " belum ditinjau");
  });

  if (!includesAny(text, ["riwayat penyakit", "hipertensi", "diabetes", "ginjal", "asma", "jantung"])) missing.push("Riwayat penyakit dan komorbid belum jelas");
  if (!includesAny(text, ["alergi", "alergi obat", "drug allergy"])) missing.push("Alergi obat belum jelas");

  if (hasFever && (hasHeadache || hasMyalgia)) {
    differentials.push({
      name: "Dengue fever",
      reason: "Sindrom demam akut dengan sakit kepala dan/atau mialgia perlu dipertimbangkan bersama temuan lain.",
      level: "Pertimbangkan",
      tags: ["demam akut", hasHeadache ? "sakit kepala" : "mialgia", "konteks epidemiologi"]
    });
  }

  if (hasFever) {
    differentials.push({
      name: "Sindrom infeksi virus akut",
      reason: "Demam tanpa fokus infeksi yang sudah teridentifikasi dapat sesuai dengan sindrom virus non-spesifik.",
      level: "Masih mungkin",
      tags: ["demam", "belum ada fokus jelas"]
    });
  }

  if (hasFever && (hasNausea || hasVomiting || hasAbdominalPain)) {
    differentials.push({
      name: "Demam tifoid / infeksi enterik",
      reason: "Demam dengan gejala gastrointestinal dapat menjadi pertimbangan dan memerlukan korelasi klinis.",
      level: "Pertimbangkan",
      tags: ["demam", "gejala gastrointestinal"]
    });
  }

  if (differentials.length === 0) {
    differentials.push({
      name: "Keluhan belum terstruktur",
      reason: "Data belum cukup untuk rule set V1 menghasilkan pertimbangan klinis spesifik.",
      level: "Data belum cukup",
      tags: ["lengkapi anamnesis", "review tanda vital"]
    });
  }

  if (missing.length) redFlags.push("Lengkapi informasi keselamatan yang masih kosong sebelum keputusan klinis final.");
  if (hasBleeding) redFlags.push("Gejala perdarahan disebutkan: nilai derajat dan konsekuensinya segera.");
  if (hasDyspnea) redFlags.push("Sesak/dispnea disebutkan: nilai status respirasi dan stabilitas pasien.");
  if (hasAlteredMentalStatus) redFlags.push("Gangguan kesadaran/neurologis disebutkan: perlukan evaluasi segera sesuai konteks klinis.");

  investigations.push({ name: "Tanda vital lengkap", reason: "Menilai stabilitas pasien sebelum keputusan berikutnya.", priority: "Wajib" });
  if (hasFever) investigations.push({ name: "Darah lengkap", reason: "Dipertimbangkan untuk melengkapi evaluasi sindrom demam.", priority: "Disarankan" });
  if (hasFever && (hasHeadache || hasMyalgia || hasNausea || hasVomiting)) investigations.push({ name: "Hematokrit/trombosit sesuai konteks klinis", reason: "Pertimbangkan terutama bila dengue tetap menjadi salah satu kemungkinan setelah pemeriksaan klinis.", priority: "Pertimbangkan" });

  management.push("Lengkapi pemeriksaan fisik dan tanda vital sebelum menetapkan disposition.");
  if (hasFever) management.push("Pertimbangkan perawatan suportif, hidrasi sesuai status klinis, dan monitoring respons terapi.");
  management.push("Pilih pemeriksaan berdasarkan pertanyaan klinis yang ingin dijawab, bukan sekadar menambah tes.");
  management.push("Review kembali diagnosis kerja setelah data baru tersedia.");

  medicationSafety.push("Konfirmasi alergi obat dan obat yang sedang digunakan sebelum meresepkan.");
  medicationSafety.push("Periksa kontraindikasi, interaksi, fungsi ginjal/hati, usia, dan kondisi khusus yang relevan.");
  if (hasBleeding) medicationSafety.push("Kaitkan pemilihan obat dengan risiko perdarahan dan guideline yang digunakan; jangan mengandalkan asumsi keamanan obat.");

  const objective = `${missing.length ? `Data belum lengkap: ${missingVitalLabelsByInput(input.vitals, missingVitalLabels)}. ` : "Tanda vital lengkap pada form. "}Pemeriksaan fisik belum terdokumentasi lengkap pada engine V1.`;
  const assessment = `Pertimbangan klinis yang dihasilkan rule engine: ${differentials.map(x => x.name).join(", ")}. Diagnosis kerja tetap ditetapkan dan dikonfirmasi oleh dokter.`;
  const plan = `${investigations.map(x => `${x.priority}: ${x.name}`).join("; ")} ${management.join(" ")} Safety: ${medicationSafety.join(" ")}`;

  return {
    engineVersion: RULE_VERSION,
    mode: "rules",
    extracted: Array.from(new Set(extracted)),
    missing: Array.from(new Set(missing)),
    questions: questionLabels,
    differentials: differentials.slice(0, 5),
    investigations,
    redFlags,
    management,
    medicationSafety,
    soap: {
      subjective: input.complaint.trim() || "Keluhan belum diisi.",
      objective,
      assessment,
      plan,
    },
  };
}

function missingVitalLabelsByInput(vitals: Vitals, labels: Record<keyof Vitals, string>) {
  return (Object.keys(labels) as (keyof Vitals)[])
    .filter(key => !vitals[key])
    .map(key => labels[key])
    .join(", ") || "tidak ada";
}
