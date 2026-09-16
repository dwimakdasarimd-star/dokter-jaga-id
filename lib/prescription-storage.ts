export type Prescription = {
  id: string;
  patientName: string;
  medicalRecordNumber: string;
  medication: string;
  strength: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  instruction: string;
  reviewed: boolean;
  createdAt: string;
};

const KEY = "dokter-jaga-prescriptions-v1";

function available() { return typeof window !== "undefined" && !!window.localStorage; }
function all(): Prescription[] {
  if (!available()) return [];
  try { const raw = localStorage.getItem(KEY); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}
function write(items: Prescription[]) { if (available()) localStorage.setItem(KEY, JSON.stringify(items.slice(0, 200))); }
function id() { return typeof crypto !== "undefined" && "randomUUID" in crypto ? `rx_${crypto.randomUUID()}` : `rx_${Date.now()}`; }
export function listPrescriptions() { return all().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)); }
export function savePrescription(input: Omit<Prescription,"id"|"createdAt">) { const item: Prescription={...input,id:id(),createdAt:new Date().toISOString()}; const items=[item,...all()]; write(items); return item; }
export function deletePrescription(idValue:string) { write(all().filter(x=>x.id!==idValue)); }
export function clearPrescriptions() { if (available()) localStorage.removeItem(KEY); }
