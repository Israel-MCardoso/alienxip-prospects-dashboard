export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OutreachStatus =
  | "not_started"
  | "queued"
  | "sent"
  | "delivered"
  | "waiting_reply"
  | "replied"
  | "negotiating"
  | "meeting_scheduled"
  | "failed"
  | "paused"
  | "stopped"
  | "disqualified";

export type OutreachChannel = "whatsapp" | "instagram" | "email" | "manual";

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
export type ProjectStatus = "planning" | "active" | "paused" | "completed" | "canceled";
export type ProjectPriority = "low" | "medium" | "high" | "urgent";
export type TechBugStatus = "open" | "triage" | "in_progress" | "fixed" | "wont_fix" | "closed";
export type TechIncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";
export type TechSeverity = "low" | "medium" | "high" | "critical";
export type TechPriority = "low" | "medium" | "high" | "urgent";
export type TechBacklogType = "refactor" | "infrastructure" | "feature" | "debt" | "security" | "performance";
export type TechBacklogStatus = "open" | "planned" | "in_progress" | "done" | "archived";
export type TechRoadmapStatus = "planned" | "in_progress" | "shipped" | "paused" | "canceled";
export type TechnicalDecisionStatus = "proposed" | "accepted" | "deprecated" | "superseded";
export type ProjectNoteType = "general" | "technical" | "meeting" | "risk" | "decision";
export type KnowledgeStatus = "draft" | "published" | "archived";
export type KnowledgeCategory = "vendas" | "prospeccao" | "desenvolvimento" | "design" | "operacao" | "suporte" | "financeiro" | "geral";
export type KnowledgeReviewStatus = "needs_review" | "approved" | "outdated";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string;
          role: "owner" | "admin" | "operator" | "manager" | "member" | "viewer";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email: string;
          role?: "owner" | "admin" | "operator" | "manager" | "member" | "viewer";
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
          owner_id: string | null;
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
          owner_id?: string | null;
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
      prospect_proposals: {
        Row: {
          id: string;
          prospect_id: string;
          title: string;
          value: number;
          status: string;
          valid_until: string | null;
          content: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          prospect_id: string;
          title: string;
          value?: number;
          status?: string;
          valid_until?: string | null;
          content?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["prospect_proposals"]["Insert"]>;
        Relationships: [];
      };
      prospect_outreach: {
        Row: {
          id: string;
          prospect_id: string;
          status: OutreachStatus;
          channel: OutreachChannel;
          automation_source: string | null;
          n8n_workflow_id: string | null;
          n8n_execution_id: string | null;
          last_message_at: string | null;
          next_follow_up_at: string | null;
          meeting_scheduled_at: string | null;
          meeting_link: string | null;
          paused_at: string | null;
          stopped_at: string | null;
          error_message: string | null;
          metadata: Json;
          last_message_preview: string | null;
          meeting_title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          prospect_id: string;
          status?: OutreachStatus;
          channel?: OutreachChannel;
          automation_source?: string | null;
          n8n_workflow_id?: string | null;
          n8n_execution_id?: string | null;
          last_message_at?: string | null;
          next_follow_up_at?: string | null;
          meeting_scheduled_at?: string | null;
          meeting_link?: string | null;
          paused_at?: string | null;
          stopped_at?: string | null;
          error_message?: string | null;
          metadata?: Json;
          last_message_preview?: string | null;
          meeting_title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["prospect_outreach"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "prospect_outreach_prospect_id_fkey";
            columns: ["prospect_id"];
            referencedRelation: "prospects";
            referencedColumns: ["id"];
          }
        ];
      };
      outreach_events: {
        Row: {
          id: string;
          prospect_id: string;
          outreach_id: string | null;
          event_type: string;
          status: OutreachStatus;
          channel: OutreachChannel;
          message: string | null;
          n8n_execution_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          prospect_id: string;
          outreach_id?: string | null;
          event_type: string;
          status: OutreachStatus;
          channel?: OutreachChannel;
          message?: string | null;
          n8n_execution_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["outreach_events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "outreach_events_prospect_id_fkey";
            columns: ["prospect_id"];
            referencedRelation: "prospects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "outreach_events_outreach_id_fkey";
            columns: ["outreach_id"];
            referencedRelation: "prospect_outreach";
            referencedColumns: ["id"];
          }
        ];
      };
      webhook_audit_logs: {
        Row: {
          id: string;
          execution_id: string | null;
          event_type: string | null;
          status: string;
          secret_validated: boolean;
          duplicate_ignored: boolean;
          payload: Json;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          execution_id?: string | null;
          event_type?: string | null;
          status: string;
          secret_validated?: boolean;
          duplicate_ignored?: boolean;
          payload?: Json;
          error_message?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["webhook_audit_logs"]["Insert"]>;
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
          owner_id: string | null;
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
          owner_id?: string | null;
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
          owner_id: string | null;
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
          owner_id?: string | null;
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
          project_id: string | null;
          owner_id: string | null;
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
          project_id?: string | null;
          owner_id?: string | null;
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
      projects: {
        Row: {
          id: string;
          client_id: string | null;
          company_id: string | null;
          name: string;
          description: string | null;
          status: ProjectStatus;
          priority: ProjectPriority;
          start_date: string | null;
          due_date: string | null;
          completed_at: string | null;
          owner_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          company_id?: string | null;
          name: string;
          description?: string | null;
          status?: ProjectStatus;
          priority?: ProjectPriority;
          start_date?: string | null;
          due_date?: string | null;
          completed_at?: string | null;
          owner_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [];
      };
      project_activities: {
        Row: {
          id: string;
          project_id: string;
          actor_id: string | null;
          action_type: string;
          description: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          actor_id?: string | null;
          action_type: string;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_activities"]["Insert"]>;
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          actor_id: string | null;
          action: string;
          title: string;
          description: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          actor_id?: string | null;
          action: string;
          title: string;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activities"]["Insert"]>;
        Relationships: [];
      };
      tech_bugs: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: TechBugStatus;
          severity: TechSeverity;
          priority: TechPriority;
          project_id: string | null;
          client_id: string | null;
          company_id: string | null;
          assigned_to: string | null;
          reported_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: TechBugStatus;
          severity?: TechSeverity;
          priority?: TechPriority;
          project_id?: string | null;
          client_id?: string | null;
          company_id?: string | null;
          assigned_to?: string | null;
          reported_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tech_bugs"]["Insert"]>;
        Relationships: [];
      };
      tech_incidents: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: TechIncidentStatus;
          severity: TechSeverity;
          started_at: string | null;
          resolved_at: string | null;
          project_id: string | null;
          client_id: string | null;
          owner_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: TechIncidentStatus;
          severity?: TechSeverity;
          started_at?: string | null;
          resolved_at?: string | null;
          project_id?: string | null;
          client_id?: string | null;
          owner_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tech_incidents"]["Insert"]>;
        Relationships: [];
      };
      tech_backlog_items: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: TechBacklogStatus;
          priority: TechPriority;
          type: TechBacklogType;
          project_id: string | null;
          owner_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: TechBacklogStatus;
          priority?: TechPriority;
          type?: TechBacklogType;
          project_id?: string | null;
          owner_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tech_backlog_items"]["Insert"]>;
        Relationships: [];
      };
      tech_roadmap_items: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: TechRoadmapStatus;
          priority: TechPriority;
          target_date: string | null;
          project_id: string | null;
          owner_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: TechRoadmapStatus;
          priority?: TechPriority;
          target_date?: string | null;
          project_id?: string | null;
          owner_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tech_roadmap_items"]["Insert"]>;
        Relationships: [];
      };
      technical_decisions: {
        Row: {
          id: string;
          title: string;
          context: string;
          decision: string;
          consequences: string | null;
          status: TechnicalDecisionStatus;
          project_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          context: string;
          decision: string;
          consequences?: string | null;
          status?: TechnicalDecisionStatus;
          project_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["technical_decisions"]["Insert"]>;
        Relationships: [];
      };
      project_notes: {
        Row: {
          id: string;
          project_id: string;
          author_id: string | null;
          title: string;
          content: string;
          type: ProjectNoteType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          author_id?: string | null;
          title: string;
          content: string;
          type?: ProjectNoteType;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_notes"]["Insert"]>;
        Relationships: [];
      };
      files: {
        Row: {
          id: string;
          bucket: string;
          path: string;
          file_name: string;
          file_type: string | null;
          file_size: number | null;
          entity_type: string;
          entity_id: string;
          uploaded_by: string | null;
          removed_at: string | null;
          removed_by: string | null;
          removal_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bucket?: string;
          path: string;
          file_name: string;
          file_type?: string | null;
          file_size?: number | null;
          entity_type: string;
          entity_id: string;
          uploaded_by?: string | null;
          removed_at?: string | null;
          removed_by?: string | null;
          removal_reason?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["files"]["Insert"]>;
        Relationships: [];
      };
      wiki_pages: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          category: KnowledgeCategory;
          status: KnowledgeStatus;
          reviewed_at: string | null;
          reviewed_by: string | null;
          review_status: KnowledgeReviewStatus;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          content: string;
          category?: KnowledgeCategory;
          status?: KnowledgeStatus;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_status?: KnowledgeReviewStatus;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wiki_pages"]["Insert"]>;
        Relationships: [];
      };
      playbooks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          content: string;
          category: KnowledgeCategory;
          status: KnowledgeStatus;
          reviewed_at: string | null;
          reviewed_by: string | null;
          review_status: KnowledgeReviewStatus;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          content: string;
          category?: KnowledgeCategory;
          status?: KnowledgeStatus;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_status?: KnowledgeReviewStatus;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["playbooks"]["Insert"]>;
        Relationships: [];
      };
      project_wiki_links: {
        Row: {
          id: string;
          project_id: string;
          wiki_page_id: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          wiki_page_id: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_wiki_links"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      global_search: {
        Args: {
          search_query: string;
          result_limit?: number;
        };
        Returns: Array<{
          entity_type: string;
          entity_id: string;
          title: string;
          subtitle: string;
          url: string;
          rank: number;
          created_at: string | null;
        }>;
      };
    };
    Enums: {
      app_role: "owner" | "admin" | "operator" | "manager" | "member" | "viewer";
      prospect_status: ProspectStatus;
      prospect_temperature: ProspectTemperature;
      prospect_source: ProspectSource;
      prospect_note_type: ProspectNoteType;
      prospect_activity_type: ProspectActivityType;
      commercial_task_status: CommercialTaskStatus;
      commercial_task_priority: CommercialTaskPriority;
      client_status: ClientStatus;
      contract_status: ContractStatus;
      project_status: ProjectStatus;
      project_priority: ProjectPriority;
      tech_bug_status: TechBugStatus;
      tech_incident_status: TechIncidentStatus;
      tech_severity: TechSeverity;
      tech_priority: TechPriority;
      tech_backlog_type: TechBacklogType;
      tech_backlog_status: TechBacklogStatus;
      tech_roadmap_status: TechRoadmapStatus;
      technical_decision_status: TechnicalDecisionStatus;
      project_note_type: ProjectNoteType;
      knowledge_status: KnowledgeStatus;
      knowledge_category: KnowledgeCategory;
      knowledge_review_status: KnowledgeReviewStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
