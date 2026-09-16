export type Patient = {
  id: string;
  medical_record_no: string;
  name: string;
  sex: "Laki-laki" | "Perempuan";
  birth_date: string;
  phone?: string;
  allergies?: string[];
  created_at?: string;
};

export type Encounter = {
  id: string;
  patient_id: string;
  status: "draft" | "in_progress" | "completed" | "signed";
  chief_complaint?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  created_at?: string;
};

export type Prescription = {
  id: string;
  patient_id?: string;
  encounter_id?: string;
  status: "draft" | "review" | "signed" | "cancelled";
  medication_name: string;
  strength?: string;
  dose?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  instructions?: string;
  created_at?: string;
};

export const demoPatients: Patient[] = [
  { id: "p-001", medical_record_no: "RM-001248", name: "Budi Santoso", sex: "Laki-laki", birth_date: "1981-04-15", phone: "0812-0000-0001", allergies: [] },
  { id: "p-002", medical_record_no: "RM-001249", name: "Siti Rahma", sex: "Perempuan", birth_date: "1978-09-02", phone: "0812-0000-0002", allergies: ["Amoksisilin"] },
  { id: "p-003", medical_record_no: "RM-001250", name: "Andi Wijaya", sex: "Laki-laki", birth_date: "1990-01-21", phone: "0812-0000-0003", allergies: [] },
  { id: "p-004", medical_record_no: "RM-001251", name: "Dewi Lestari", sex: "Perempuan", birth_date: "1987-11-08", phone: "0812-0000-0004", allergies: [] },
];

export const demoEncounters: Encounter[] = [
  { id: "enc-001", patient_id: "p-001", status: "in_progress", chief_complaint: "Demam 3 hari disertai sakit kepala dan nyeri badan", subjective: "Demam sejak 3 hari, sakit kepala, nyeri badan, mual.", objective: "Data vital dan pemeriksaan fisik perlu dilengkapi.", assessment: "Evaluasi sindrom demam akut.", plan: "Lengkapi anamnesis, tanda vital, pemeriksaan fisik, dan investigasi sesuai indikasi." },
  { id: "enc-002", patient_id: "p-002", status: "signed", chief_complaint: "Kontrol hipertensi", assessment: "Hipertensi dalam pemantauan", plan: "Monitoring tekanan darah dan kepatuhan terapi." },
  { id: "enc-003", patient_id: "p-003", status: "completed", chief_complaint: "Batuk dan sesak", assessment: "Evaluasi keluhan respirasi", plan: "Pemeriksaan respirasi dan evaluasi lanjutan sesuai temuan." },
  { id: "enc-004", patient_id: "p-004", status: "draft", chief_complaint: "Nyeri perut", assessment: "Belum ditetapkan", plan: "Lengkapi anamnesis dan pemeriksaan fisik." },
];

export const demoPrescriptions: Prescription[] = [
  { id: "rx-001", patient_id: "p-001", encounter_id: "enc-001", status: "review", medication_name: "Paracetamol", strength: "500 mg", dose: "1 tablet", frequency: "3× sehari bila perlu", route: "oral", duration: "maks. 3 hari", instructions: "Sesuaikan dengan kondisi klinis dan kontraindikasi." },
  { id: "rx-002", patient_id: "p-002", encounter_id: "enc-002", status: "signed", medication_name: "Amlodipine", strength: "5 mg", dose: "1 tablet", frequency: "1× sehari", route: "oral", duration: "30 hari", instructions: "Evaluasi tekanan darah berkala." },
];
