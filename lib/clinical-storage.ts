import type { QuestionAnswer, Vitals } from "./clinical-engine";

export type ClinicalPatient = {
  id: string;
  name: string;
  medicalRecordNumber: string;
  birthDate: string;
  sex: "Laki-laki" | "Perempuan" | "";
  createdAt: string;
  updatedAt: string;
};

export type ClinicalEncounter = {
  id: string;
  patientId: string;
  patient: ClinicalPatient;
  complaint: string;
  vitals: Vitals;
  answers: Record<string, QuestionAnswer>;
  selectedDx: string;
  analysisSnapshot: {
    complaint: string;
    vitals: Vitals;
    answers: Record<string, QuestionAnswer>;
  } | null;
  reviewed: boolean;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "dokter-jaga-clinical-encounters-v1";

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readAll(): ClinicalEncounter[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: ClinicalEncounter[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 100)));
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function listClinicalEncounters() {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveClinicalEncounter(input: Omit<ClinicalEncounter, "id" | "createdAt" | "updatedAt" | "patientId"> & { patientId?: string }) {
  const now = new Date().toISOString();
  const encounters = readAll();
  const patientId = input.patientId || makeId("patient");
  const patient: ClinicalPatient = {
    ...input.patient,
    id: patientId,
    createdAt: input.patient.createdAt || now,
    updatedAt: now,
  };

  const existingIndex = input.patient.medicalRecordNumber
    ? encounters.findIndex(x => x.patient.medicalRecordNumber.trim() === input.patient.medicalRecordNumber.trim())
    : -1;

  const encounter: ClinicalEncounter = {
    id: existingIndex >= 0 ? encounters[existingIndex].id : makeId("encounter"),
    patientId,
    patient,
    complaint: input.complaint,
    vitals: input.vitals,
    answers: input.answers,
    selectedDx: input.selectedDx,
    analysisSnapshot: input.analysisSnapshot,
    reviewed: input.reviewed,
    createdAt: existingIndex >= 0 ? encounters[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) encounters.splice(existingIndex, 1);
  encounters.unshift(encounter);
  writeAll(encounters);
  return encounter;
}

export function loadClinicalEncounter(id: string) {
  return readAll().find(x => x.id === id) ?? null;
}

export function deleteClinicalEncounter(id: string) {
  const next = readAll().filter(x => x.id !== id);
  writeAll(next);
}

export function clearClinicalEncounters() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
