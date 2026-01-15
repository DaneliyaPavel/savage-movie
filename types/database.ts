/**
 * Типы для базы данных Supabase
 * Эти типы будут автоматически сгенерированы после создания схемы БД
 */
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
      projects: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          client: string | null
          category: 'commercial' | 'ai-content' | 'music-video' | 'other'
          video_url: string | null
          images: string[] | null
          created_at: string
          updated_at: string
          duration: number | null
          role: string | null
          tools: string[] | null
          behind_scenes: string[] | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          client?: string | null
          category: 'commercial' | 'ai-content' | 'music-video' | 'other'
          video_url?: string | null
          images?: string[] | null
          created_at?: string
          updated_at?: string
          duration?: number | null
          role?: string | null
          tools?: string[] | null
          behind_scenes?: string[] | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          client?: string | null
          category?: 'commercial' | 'ai-content' | 'music-video' | 'other'
          video_url?: string | null
          images?: string[] | null
          created_at?: string
          updated_at?: string
          duration?: number | null
          role?: string | null
          tools?: string[] | null
          behind_scenes?: string[] | null
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          price: number
          duration: number | null
          cover_image: string | null
          video_promo_url: string | null
          instructor_id: string | null
          category: 'ai' | 'shooting' | 'editing' | 'production'
          created_at: string
          updated_at: string
          requirements: string[] | null
          what_you_learn: string[] | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          price: number
          duration?: number | null
          cover_image?: string | null
          video_promo_url?: string | null
          instructor_id?: string | null
          category: 'ai' | 'shooting' | 'editing' | 'production'
          created_at?: string
          updated_at?: string
          requirements?: string[] | null
          what_you_learn?: string[] | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          price?: number
          duration?: number | null
          cover_image?: string | null
          video_promo_url?: string | null
          instructor_id?: string | null
          category?: 'ai' | 'shooting' | 'editing' | 'production'
          created_at?: string
          updated_at?: string
          requirements?: string[] | null
          what_you_learn?: string[] | null
        }
      }
      course_modules: {
        Row: {
          id: string
          course_id: string
          title: string
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          order: number
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          order?: number
          created_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          module_id: string
          title: string
          video_url: string | null
          duration: number | null
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          module_id: string
          title: string
          video_url?: string | null
          duration?: number | null
          order: number
          created_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          title?: string
          video_url?: string | null
          duration?: number | null
          order?: number
          created_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          progress: number
          enrolled_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          progress?: number
          enrolled_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          progress?: number
          enrolled_at?: string
          completed_at?: string | null
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string | null
          service_type: 'consultation' | 'shooting' | 'production' | 'training'
          date: string
          time: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          calendly_event_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          service_type: 'consultation' | 'shooting' | 'production' | 'training'
          date: string
          time: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          calendly_event_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          service_type?: 'consultation' | 'shooting' | 'production' | 'training'
          date?: string
          time?: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          calendly_event_id?: string | null
          created_at?: string
        }
      }
      contact_submissions: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          message: string
          budget: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          message: string
          budget?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          message?: string
          budget?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      project_category: 'commercial' | 'ai-content' | 'music-video' | 'other'
      course_category: 'ai' | 'shooting' | 'editing' | 'production'
      service_type: 'consultation' | 'shooting' | 'production' | 'training'
      booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
    }
  }
}
