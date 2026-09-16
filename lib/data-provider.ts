import { createClient } from "@/lib/supabase/client";
import { demoEncounters, demoPatients, demoPrescriptions, type Encounter, type Patient, type Prescription } from "@/lib/app-data";

const isConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export async function listPatients(): Promise<Patient[]> {
  if (!isConfigured()) return demoPatients;
  const supabase = createClient();
  const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
  if (error || !data?.length) return demoPatients;
  return data as Patient[];
}

export async function listEncounters(patientId?: string): Promise<Encounter[]> {
  if (!isConfigured()) return patientId ? demoEncounters.filter(x => x.patient_id === patientId) : demoEncounters;
  const supabase = createClient();
  let query = supabase.from("encounters").select("*").order("created_at", { ascending: false });
  if (patientId) query = query.eq("patient_id", patientId);
  const { data, error } = await query;
  if (error || !data?.length) return patientId ? demoEncounters.filter(x => x.patient_id === patientId) : demoEncounters;
  return data as Encounter[];
}

export async function listPrescriptions(patientId?: string): Promise<Prescription[]> {
  if (!isConfigured()) return patientId ? demoPrescriptions.filter(x => x.patient_id === patientId) : demoPrescriptions;
  const supabase = createClient();
  let query = supabase.from("prescriptions").select("*").order("created_at", { ascending: false });
  if (patientId) query = query.eq("patient_id", patientId);
  const { data, error } = await query;
  if (error || !data?.length) return patientId ? demoPrescriptions.filter(x => x.patient_id === patientId) : demoPrescriptions;
  return data as Prescription[];
}

export async function createPatient(input: Omit<Patient, "id" | "created_at">): Promise<Patient> {
  if (!isConfigured()) return { ...input, id: `demo-${Date.now()}` };
  const supabase = createClient();
  const { data, error } = await supabase.from("patients").insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return data as Patient;
}

export async function createEncounter(input: Omit<Encounter, "id" | "created_at">): Promise<Encounter> {
  if (!isConfigured()) return { ...input, id: `demo-enc-${Date.now()}` };
  const supabase = createClient();
  const { data, error } = await supabase.from("encounters").insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return data as Encounter;
}

export async function createPrescription(input: Omit<Prescription, "id" | "created_at">): Promise<Prescription> {
  if (!isConfigured()) return { ...input, id: `demo-rx-${Date.now()}` };
  const supabase = createClient();
  const { data, error } = await supabase.from("prescriptions").insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return data as Prescription;
}
