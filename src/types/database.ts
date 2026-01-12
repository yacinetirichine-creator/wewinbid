// Types générés à partir du schéma Supabase
// Remplacez ce fichier par la génération automatique avec:
// npx supabase gen types typescript --project-id $PROJECT_ID > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SubscriptionPlan = 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE'
export type TenderType = 'PUBLIC' | 'PRIVATE'
export type TenderStatus = 'DRAFT' | 'ANALYSIS' | 'IN_PROGRESS' | 'REVIEW' | 'SUBMITTED' | 'WON' | 'LOST' | 'ABANDONED'
export type Sector = 
  | 'SECURITY_PRIVATE' | 'SECURITY_ELECTRONIC' | 'CONSTRUCTION' 
  | 'LOGISTICS' | 'IT_SOFTWARE' | 'MAINTENANCE' | 'CONSULTING'
  | 'CLEANING' | 'CATERING' | 'TRANSPORT' | 'ENERGY' 
  | 'HEALTHCARE' | 'EDUCATION' | 'OTHER'

export type BuyerType = 
  | 'STATE' | 'REGION' | 'DEPARTMENT' | 'MUNICIPALITY'
  | 'PUBLIC_ESTABLISHMENT' | 'HOSPITAL' | 'PRIVATE_COMPANY'
  | 'ASSOCIATION' | 'OTHER'

export type DocumentType = 
  | 'DC1' | 'DC2' | 'DC4' | 'TECHNICAL_MEMO' | 'DPGF' | 'BPU'
  | 'ACTE_ENGAGEMENT' | 'PLANNING' | 'METHODOLOGY' | 'QUALITY_PLAN'
  | 'SAFETY_PLAN' | 'ENVIRONMENTAL_PLAN' | 'REFERENCES_LIST'
  | 'COMMERCIAL_PROPOSAL' | 'QUOTE' | 'COMPANY_PRESENTATION'
  | 'COVER_LETTER' | 'APPENDIX' | 'INSURANCE_RC' | 'INSURANCE_DECENNALE'
  | 'TAX_ATTESTATION' | 'SOCIAL_ATTESTATION' | 'KBIS' | 'RIB' | 'OTHER'

export type DocumentStatus = 'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'VALIDATED' | 'SUBMITTED'
export type PartnershipStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED'
export type CollaboratorRole = 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER'
export type ContentType = 'LINKEDIN_POST' | 'PRESS_RELEASE' | 'CASE_STUDY' | 'NEWSLETTER' | 'TWEET'
export type SocialPlatform = 'LINKEDIN' | 'TWITTER' | 'FACEBOOK' | 'INSTAGRAM'
export type ContentStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED'
export type ActivityType = 
  | 'TENDER_CREATED' | 'TENDER_UPDATED' | 'TENDER_SUBMITTED'
  | 'TENDER_WON' | 'TENDER_LOST' | 'DOCUMENT_CREATED'
  | 'DOCUMENT_UPDATED' | 'DOCUMENT_VALIDATED' | 'COLLABORATION_ADDED'
  | 'COLLABORATION_REMOVED' | 'PARTNERSHIP_REQUEST' | 'PARTNERSHIP_ACCEPTED'
  | 'SCORE_CALCULATED' | 'ALERT_RECEIVED'

export type NotificationType = 
  | 'TENDER_DEADLINE' | 'TENDER_RESULT' | 'DOCUMENT_EXPIRING'
  | 'PARTNERSHIP_REQUEST' | 'COLLABORATION_INVITE' | 'SCORE_READY'
  | 'NEW_OPPORTUNITY' | 'SYSTEM'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          job_title: string | null
          locale: string
          timezone: string
          email_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          job_title?: string | null
          locale?: string
          timezone?: string
          email_notifications?: boolean
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          job_title?: string | null
          locale?: string
          timezone?: string
          email_notifications?: boolean
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          legal_name: string | null
          siret: string | null
          siren: string | null
          vat_number: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          country: string
          phone: string | null
          email: string | null
          website: string | null
          logo_url: string | null
          description: string | null
          sectors: Sector[]
          certifications: string[]
          annual_revenue: number | null
          employee_count: number | null
          founded_year: number | null
          subscription_plan: SubscriptionPlan
          subscription_status: string
          subscription_period_end: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          monthly_tenders_used: number
          monthly_tenders_limit: number
          storage_used: number
          storage_limit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          legal_name?: string | null
          siret?: string | null
          sectors?: Sector[]
          subscription_plan?: SubscriptionPlan
        }
        Update: {
          name?: string
          legal_name?: string | null
          siret?: string | null
          sectors?: Sector[]
          subscription_plan?: SubscriptionPlan
        }
      }
      tenders: {
        Row: {
          id: string
          reference: string
          title: string
          description: string | null
          type: TenderType
          status: TenderStatus
          sector: Sector | null
          buyer_name: string | null
          buyer_type: BuyerType | null
          buyer_contact: string | null
          buyer_email: string | null
          buyer_phone: string | null
          estimated_value: number | null
          proposed_price: number | null
          winning_price: number | null
          publication_date: string | null
          deadline: string | null
          submission_date: string | null
          result_date: string | null
          ai_score: number | null
          ai_analysis: Json | null
          ai_recommendations: string[] | null
          region: string | null
          department: string | null
          source_url: string | null
          platform: string | null
          tags: string[]
          notes: string | null
          company_id: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          type?: TenderType
          status?: TenderStatus
          company_id: string
          sector?: Sector | null
        }
        Update: {
          title?: string
          type?: TenderType
          status?: TenderStatus
          sector?: Sector | null
        }
      }
      documents: {
        Row: {
          id: string
          name: string
          type: DocumentType | null
          status: DocumentStatus
          file_url: string | null
          file_size: number | null
          mime_type: string | null
          content: string | null
          version: number
          is_template: boolean
          expires_at: string | null
          tender_id: string | null
          company_id: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          type?: DocumentType | null
          company_id: string
        }
        Update: {
          name?: string
          type?: DocumentType | null
          status?: DocumentStatus
          content?: string | null
        }
      }
      partnerships: {
        Row: {
          id: string
          company_id: string
          partner_id: string
          status: PartnershipStatus
          message: string | null
          sectors: Sector[]
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          partner_id: string
          status?: PartnershipStatus
          message?: string | null
          sectors?: Sector[]
        }
        Update: {
          status?: PartnershipStatus
        }
      }
      tender_alerts: {
        Row: {
          id: string
          name: string
          keywords: string[]
          sectors: Sector[]
          regions: string[]
          min_value: number | null
          max_value: number | null
          buyer_types: BuyerType[]
          is_active: boolean
          company_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          keywords?: string[]
          sectors?: Sector[]
          company_id: string
        }
        Update: {
          name?: string
          keywords?: string[]
          is_active?: boolean
        }
      }
      creative_contents: {
        Row: {
          id: string
          type: ContentType | null
          title: string
          content: string | null
          image_url: string | null
          platform: SocialPlatform | null
          status: ContentStatus
          scheduled_at: string | null
          published_at: string | null
          company_id: string
          tender_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          type?: ContentType | null
          company_id: string
        }
        Update: {
          title?: string
          content?: string | null
          status?: ContentStatus
        }
      }
      notifications: {
        Row: {
          id: string
          type: NotificationType
          title: string
          message: string | null
          read: boolean
          action_url: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          type: NotificationType
          title: string
          user_id: string
          message?: string | null
          action_url?: string | null
        }
        Update: {
          read?: boolean
        }
      }
      activities: {
        Row: {
          id: string
          type: ActivityType
          description: string | null
          metadata: Json | null
          user_id: string
          tender_id: string | null
          company_id: string
          created_at: string
        }
        Insert: {
          type: ActivityType
          user_id: string
          company_id: string
          description?: string | null
          tender_id?: string | null
        }
        Update: never
      }
      price_history: {
        Row: {
          id: string
          tender_ref: string | null
          tender_title: string | null
          sector: Sector | null
          buyer_type: BuyerType | null
          proposed_price: number | null
          winning_price: number | null
          won: boolean | null
          date: string
          company_id: string
          tender_id: string | null
          created_at: string
        }
        Insert: {
          company_id: string
          proposed_price?: number | null
          winning_price?: number | null
          won?: boolean | null
        }
        Update: never
      }
      winner_analysis: {
        Row: {
          id: string
          tender_ref: string | null
          tender_title: string | null
          sector: Sector | null
          buyer_name: string | null
          buyer_type: BuyerType | null
          winner_name: string | null
          winner_siret: string | null
          winning_price: number | null
          estimated_value: number | null
          award_date: string | null
          source: string | null
          created_at: string
        }
        Insert: {
          tender_ref?: string | null
          tender_title?: string | null
        }
        Update: never
      }
      client_references: {
        Row: {
          id: string
          client_name: string
          project_title: string
          description: string | null
          sector: Sector | null
          start_date: string | null
          end_date: string | null
          contract_value: number | null
          contact_name: string | null
          contact_email: string | null
          contact_phone: string | null
          is_confidential: boolean
          company_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          client_name: string
          project_title: string
          company_id: string
        }
        Update: {
          client_name?: string
          project_title?: string
          description?: string | null
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      subscription_plan: SubscriptionPlan
      tender_type: TenderType
      tender_status: TenderStatus
      sector: Sector
      buyer_type: BuyerType
      document_type: DocumentType
      document_status: DocumentStatus
      partnership_status: PartnershipStatus
      collaborator_role: CollaboratorRole
      content_type: ContentType
      social_platform: SocialPlatform
      content_status: ContentStatus
      activity_type: ActivityType
      notification_type: NotificationType
    }
  }
}

// Types utilitaires
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
export type Tender = Database['public']['Tables']['tenders']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type Partnership = Database['public']['Tables']['partnerships']['Row']
export type TenderAlert = Database['public']['Tables']['tender_alerts']['Row']
export type CreativeContent = Database['public']['Tables']['creative_contents']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Activity = Database['public']['Tables']['activities']['Row']
export type PriceHistory = Database['public']['Tables']['price_history']['Row']
export type WinnerAnalysis = Database['public']['Tables']['winner_analysis']['Row']
export type ClientReference = Database['public']['Tables']['client_references']['Row']
