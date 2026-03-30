export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      venues: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          id: string
          user_id: string | null
          name: string
          phone: string
          venue_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          phone: string
          venue_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          phone?: string
          venue_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_venue_id_fkey"
            columns: ["venue_id"]
            referencedRelation: "venues"
            referencedColumns: ["id"]
          }
        ]
      }
      matches: {
        Row: {
          id: string
          home_team: string
          away_team: string
          home_logo: string | null
          away_logo: string | null
          kickoff_time: string
          status: 'UPCOMING' | 'LIVE' | 'FINISHED'
          home_score: number
          away_score: number
          buzzer_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          home_team: string
          away_team: string
          home_logo?: string | null
          away_logo?: string | null
          kickoff_time: string
          status?: 'UPCOMING' | 'LIVE' | 'FINISHED'
          home_score?: number
          away_score?: number
          buzzer_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          home_team?: string
          away_team?: string
          home_logo?: string | null
          away_logo?: string | null
          kickoff_time?: string
          status?: 'UPCOMING' | 'LIVE' | 'FINISHED'
          home_score?: number
          away_score?: number
          buzzer_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          id: string
          registration_id: string
          match_id: string
          winner_choice: 'HOME' | 'AWAY' | 'DRAW' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          registration_id: string
          match_id: string
          winner_choice?: 'HOME' | 'AWAY' | 'DRAW' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          registration_id?: string
          match_id?: string
          winner_choice?: 'HOME' | 'AWAY' | 'DRAW' | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_registration_id_fkey"
            columns: ["registration_id"]
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          }
        ]
      }
      buzzer_hits: {
        Row: {
          id: string
          match_id: string
          registration_id: string
          venue_id: string
          hit_time: string
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          registration_id: string
          venue_id: string
          hit_time?: string
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          registration_id?: string
          venue_id?: string
          hit_time?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buzzer_hits_match_id_fkey"
            columns: ["match_id"]
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buzzer_hits_registration_id_fkey"
            columns: ["registration_id"]
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buzzer_hits_venue_id_fkey"
            columns: ["venue_id"]
            referencedRelation: "venues"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
