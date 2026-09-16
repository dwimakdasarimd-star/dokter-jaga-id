import { createClient } from "@/lib/supabase/client";
import { demoEncounters, demoPatients, demoPrescriptions, type Encounter, type Patient, type Prescription } from "@/lib/app-data";

const isConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export async function listPatients(): Promise<Patient[]> {
  if (!isConfigured()) return demoPatients;
  const supabase = createClient();
  const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
  if (error || !data?.length) return demoPatients;
  return data.map((p) => ({
    id: p.id,
    medical_record_no: p.medical_record_no,
    name: p.full_name,
    sex: p.sex === "P" ? "Perempuan" : "Laki-laki",
    birth_date: p.birth_date ?? "",
    phone: p.phone ?? "",
    allergies: p.allergies ? String(p.allergies).split(",").map((x: string) => x.trim()).filter(Boolean) : [],
    created_at: p.created_at,
  }));
}

export async function listEncounters(patientId?: string): Promise<Encounter[]> {
  if (!isConfigured()) return patientId ? demoEncounters.filter(x => x.patient_id === patientId) : demoEncounters;
  const supabase = createClient();
  let query = supabase.from("encounters").select("*").order("encounter_date", { ascending: false });
  if (patientId) query = query.eq("patient_id", patientId);
  const { data, error } = await query;
  if (error || !data?.length) return patientId ? demoEncounters.filter(x => x.patient_id === patientId) : demoEncounters;
  return data.map((e) => ({
    id: e.id,
    patient_id: e.patient_id,
    status: e.status === "signed" ? "signed" : e.status === "draft" ? "draft" : "completed",
    chief_complaint: e.chief_complaint ?? "",
    subjective: typeof e.subjective === "string" ? e.subjective : JSON.stringify(e.subjective ?? {}),
    objective: typeof e.objective === "string" ? e.objective : JSON.stringify(e.objective ?? {}),
    assessment: typeof e.assessment === "string" ? e.assessment : JSON.stringify(e.assessment ?? {}),
    plan: typeof e.plan === "string" ? e.plan : JSON.stringify(e.plan ?? {}),
    created_at: e.created_at,
  }));
}

export async function listPrescriptions(patientId?: string): Promise<Prescription[]> {
  if (!isConfigured()) return patientId ? demoPrescriptions.filter(x => x.patient_id === patientId) : demoPrescriptions;
  const supabase = createClient();
  let query = supabase.from("prescriptions").select("*").order("created_at", { ascending: false });
  if (patientId) query = query.eq("patient_id", patientId);
  const { data, error } = await query;
  if (error || !data?.length) return patientId ? demoPrescriptions.filter(x => x.patient_id === patientId) : demoPrescriptions;
  return data.flatMap((rx) => {
    const items = Array.isArray(rx.items) ? rx.items : [];
    return items.length ? items.map((item: any, index: number) => ({
      id: `${rx.id}-${index}`,
      patient_id: rx.patient_id ?? undefined,
      encounter_id: rx.encounter_id ?? undefined,
      status: rx.status === "signed" ? "signed" : rx.status === "cancelled" ? "cancelled" : rx.status === "draft" ? "draft" : "review",
      medication_name: item.medication_name ?? item.name ?? "Resep",
      strength: item.strength,
      dose: item.dose,
      frequency: item.frequency,
      route: item.route,
      duration: item.duration,
      instructions: item.instructions ?? rx.notes ?? "",
      created_at: rx.created_at,
    } as Prescription)) : [{
      id: rx.id,
      patient_id: rx.patient_id ?? undefined,
      encounter_id: rx.encounter_id ?? undefined,
      status: rx.status === "signed" ? "signed" : rx.status === "cancelled" ? "cancelled" : "review",
      medication_name: "Resep tersimpan",
      instructions: rx.notes ?? "",
      created_at: rx.created_at,
    } as Prescription];
  });
}

export async function createPatient(input: Omit<Patient, "id" | "created_at">): Promise<Patient> {
  if (!isConfigured()) return { ...input, id: `demo-${Date.now()}` };
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Anda belum login.");
  const { data, error } = await supabase.from("patients").insert({
    owner_id: user.user.id,
    medical_record_no: input.medical_record_no,
    full_name: input.name,
    sex: input.sex === "Perempuan" ? "P" : "L",
    birth_date: input.birth_date || null,
    phone: input.phone || null,
    allergies: (input.allergies ?? []).join(", "),
  }).select("*").single();
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    medical_record_no: data.medical_record_no,
    name: data.full_name,
    sex: data.sex === "P" ? "Perempuan" : "Laki-laki",
    birth_date: data.birth_date ?? "",
    phone: data.phone ?? "",
    allergies: data.allergies ? String(data.allergies).split(",").map((x: string) => x.trim()).filter(Boolean) : [],
    created_at: data.created_at,
  };
}

export async function createEncounter(input: Omit<Encounter, "id" | "created_at">): Promise<Encounter> {
  if (!isConfigured()) return { ...input, id: `demo-enc-${Date.now()}` };
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Anda belum login.");
  const { data, error } = await supabase.from("encounters").insert({
    owner_id: user.user.id,
    patient_id: input.patient_id,
    chief_complaint: input.chief_complaint,
    subjective: { text: input.subjective ?? "" },
    objective: { text: input.objective ?? "" },
    assessment: { text: input.assessment ?? "" },
    plan: { text: input.plan ?? "" },
    status: input.status === "signed" ? "signed" : "draft",
  }).select("*").single();
  if (error) throw new Error(error.message);
  return (await listEncounters(data.patient_id)).find(x => x.id === data.id) ?? { ...input, id: data.id, created_at: data.created_at };
}

export async function createPrescription(input: Omit<Prescription, "id" | "created_at">): Promise<Prescription> {
  if (!isConfigured()) return { ...input, id: `demo-rx-${Date.now()}` };
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Anda belum login.");
  const { data, error } = await supabase.from("prescriptions").insert({
    owner_id: user.user.id,
    patient_id: input.patient_id ?? null,
    encounter_id: input.encounter_id ?? null,
    status: input.status === "signed" ? "signed" : input.status === "cancelled" ? "cancelled" : "draft",
    items: [{
      medication_name: input.medication_name,
      strength: input.strength,
      dose: input.dose,
      frequency: input.frequency,
      route: input.route,
      duration: input.duration,
      instructions: input.instructions,
    }],
    notes: input.instructions ?? null,
  }).select("*").single();
  if (error) throw new Error(error.message);
  return (await listPrescriptions(data.patient_id ?? undefined)).find(x => x.id.startsWith(data.id)) ?? { ...input, id: data.id, created_at: data.created_at };
}
