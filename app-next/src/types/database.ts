export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProspectStatus =
  | "frio"
  | "contato_inicial"
  | "diagnostico"
  | "proposta"
  | "negociacao"
  | "fechado"
  | "perdido"
  | "new"
  | "qualified"
  | "contacted"
  | "meeting_scheduled"
  | "proposal_sent"
  | "won"
  | "lost"
  | "archived";

export type ProspectTemperature = "cold" | "warm" | "hot";
export type ProspectSource = "manual" | "google_sheet" | "referral" | "instagram" | "website" | "other";
export type ProspectNoteType = "observacao" | "follow_up" | "reuniao" | "decisao" | "risco";
export type ProspectActivityType =
  | "created"
  | "updated"
  | "imported"
  | "diagnostic_created"
  | "diagnostic_updated"
  | "note_created"
  | "status_changed"
  | "task_created"
  | "task_completed"
  | "converted_to_client";
export type CommercialTaskStatus = "pending" | "in_progress" | "completed" | "canceled";
export type CommercialTaskPriority = "low" | "medium" | "high" | "urgent";
export type ClientStatus = "active" | "paused" | "former";
export type ContractStatus = "draft" | "active" | "paused" | "cancelled";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string;
          role: "owner" | "admin" | "manager" | "member" | "viewer";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email: string;
          role?: "owner" | "admin" | "manager" | "member" | "viewer";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      prospects: {
        Row: {
          id: string;
          name: string;
          segment: string | null;
          status: ProspectStatus;
          temperature: ProspectTemperature;
          source: ProspectSource;
          city: string | null;
          state: string | null;
          instagram_url: string | null;
          website_url: string | null;
          whatsapp: string | null;
          responsible_user_id: string | null;
          partner_name: string | null;
          partner_url: string | null;
          priority_score: number;
          suggested_offer: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          imported_from: string | null;
          external_source_id: string | null;
          converted_company_id: string | null;
          converted_client_id: string | null;
          converted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          segment?: string | null;
          status?: ProspectStatus;
          temperature?: ProspectTemperature;
          source?: ProspectSource;
          city?: string | null;
          state?: string | null;
          instagram_url?: string | null;
          website_url?: string | null;
          whatsapp?: string | null;
          responsible_user_id?: string | null;
          partner_name?: string | null;
          partner_url?: string | null;
          priority_score?: number;
          suggested_offer?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          imported_from?: string | null;
          external_source_id?: string | null;
          converted_company_id?: string | null;
          converted_client_id?: string | null;
          converted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["prospects"]["Insert"]>;
        Relationships: [];
      };
      prospect_activities: {
        Row: {
          id: string;
          prospect_id: string | null;
          actor_id: string | null;
          action_type: ProspectActivityType;
          description: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          prospect_id?: string | null;
          actor_id?: string | null;
          action_type: ProspectActivityType;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["prospect_activities"]["Insert"]>;
        Relationships: [];
      };
      prospect_diagnostics: {
        Row: {
          id: string;
          prospect_id: string;
          facebook_notes: string | null;
          instagram_notes: string | null;
          whatsapp_notes: string | null;
          website_notes: string | null;
          google_business_notes: string | null;
          diagnosis_summary: string | null;
          opportunities: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          prospect_id: string;
          facebook_notes?: string | null;
          instagram_notes?: string | null;
          whatsapp_notes?: string | null;
          website_notes?: string | null;
          google_business_notes?: string | null;
          diagnosis_summary?: string | null;
          opportunities?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["prospect_diagnostics"]["Insert"]>;
        Relationships: [];
      };
      prospect_notes: {
        Row: {
          id: string;
          prospect_id: string;
          author_id: string | null;
          content: string;
          type: ProspectNoteType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          prospect_id: string;
          author_id?: string | null;
          content: string;
          type?: ProspectNoteType;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["prospect_notes"]["Insert"]>;
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          name: string;
          legal_name: string | null;
          segment: string | null;
          city: string | null;
          state: string | null;
          website_url: string | null;
          instagram_url: string | null;
          whatsapp: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          legal_name?: string | null;
          segment?: string | null;
          city?: string | null;
          state?: string | null;
          website_url?: string | null;
          instagram_url?: string | null;
          whatsapp?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          company_id: string;
          status: ClientStatus;
          contract_status: ContractStatus;
          monthly_value: number | null;
          start_date: string | null;
          main_contact_name: string | null;
          main_contact_email: string | null;
          main_contact_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          status?: ClientStatus;
          contract_status?: ContractStatus;
          monthly_value?: number | null;
          start_date?: string | null;
          main_contact_name?: string | null;
          main_contact_email?: string | null;
          main_contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [];
      };
      commercial_tasks: {
        Row: {
          id: string;
          prospect_id: string | null;
          company_id: string | null;
          client_id: string | null;
          assigned_to: string | null;
          title: string;
          description: string | null;
          status: CommercialTaskStatus;
          priority: CommercialTaskPriority;
          due_date: string | null;
          completed_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          prospect_id?: string | null;
          company_id?: string | null;
          client_id?: string | null;
          assigned_to?: string | null;
          title: string;
          description?: string | null;
          status?: CommercialTaskStatus;
          priority?: CommercialTaskPriority;
          due_date?: string | null;
          completed_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["commercial_tasks"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: "owner" | "admin" | "manager" | "member" | "viewer";
      prospect_status: ProspectStatus;
      prospect_temperature: ProspectTemperature;
      prospect_source: ProspectSource;
      prospect_note_type: ProspectNoteType;
      prospect_activity_type: ProspectActivityType;
      commercial_task_status: CommercialTaskStatus;
      commercial_task_priority: CommercialTaskPriority;
      client_status: ClientStatus;
      contract_status: ContractStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
