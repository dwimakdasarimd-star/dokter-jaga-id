export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      patients: {
        Row: { id:string; owner_id:string; medical_record_no:string; full_name:string; sex:'L'|'P'|null; birth_date:string|null; phone:string|null; address:string|null; allergies:string|null; emergency_contact:string|null; created_at:string; updated_at:string };
        Insert: Partial<Omit<Database['public']['Tables']['patients']['Row'],'id'|'created_at'|'updated_at'>> & { owner_id:string; medical_record_no:string; full_name:string };
        Update: Partial<Database['public']['Tables']['patients']['Row']>;
      };
      encounters: { Row: { id:string; owner_id:string; patient_id:string; encounter_date:string; chief_complaint:string|null; subjective:Json; objective:Json; assessment:Json; plan:Json; status:'draft'|'signed'|'amended'; signed_at:string|null; rule_version:string|null; created_at:string; updated_at:string }; Insert: Partial<Database['public']['Tables']['encounters']['Row']> & { owner_id:string; patient_id:string }; Update: Partial<Database['public']['Tables']['encounters']['Row']> };
      prescriptions: { Row: { id:string; owner_id:string; patient_id:string|null; encounter_id:string|null; status:'draft'|'signed'|'cancelled'; items:Json; notes:string|null; signed_at:string|null; created_at:string; updated_at:string }; Insert: Partial<Database['public']['Tables']['prescriptions']['Row']> & { owner_id:string; status?:'draft'|'signed'|'cancelled' }; Update: Partial<Database['public']['Tables']['prescriptions']['Row']> };
      appointments: { Row: { id:string; owner_id:string; patient_id:string|null; starts_at:string; duration_minutes:number; visit_type:string; status:'scheduled'|'waiting'|'in_progress'|'completed'|'cancelled'; notes:string|null; created_at:string }; Insert: Partial<Database['public']['Tables']['appointments']['Row']> & { owner_id:string; starts_at:string }; Update: Partial<Database['public']['Tables']['appointments']['Row']> };
      doctor_profiles: { Row: { id:string; full_name:string; license_number:string|null; specialty:string|null; clinic_name:string|null; phone:string|null; created_at:string; updated_at:string }; Insert: Partial<Database['public']['Tables']['doctor_profiles']['Row']> & { id:string }; Update: Partial<Database['public']['Tables']['doctor_profiles']['Row']> };
    };
  };
}
