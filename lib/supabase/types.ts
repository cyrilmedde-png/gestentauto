export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          siret: string | null
          vat_number: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          country: string | null
          phone: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          siret?: string | null
          vat_number?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string | null
          phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          siret?: string | null
          vat_number?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string | null
          phone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          company_id: string
          email: string
          first_name: string | null
          last_name: string | null
          role_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          role_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          role_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          company_id: string
          name: string
          permissions: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          permissions: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
      }
      modules: {
        Row: {
          id: string
          company_id: string
          module_name: string
          is_active: boolean
          config: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          module_name: string
          is_active?: boolean
          config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          module_name?: string
          is_active?: boolean
          config?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          company_id: string
          key: string
          value: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          key: string
          value: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          key?: string
          value?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}




