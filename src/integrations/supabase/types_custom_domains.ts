// Tipos para a tabela custom_domains que precisa ser adicionada ao types.ts gerado pelo Supabase
// Esta é uma definição temporária até que o types.ts seja regenerado a partir do banco de dados

export type CustomDomain = {
  id: string
  domain: string
  content_type: 'landing_page' | 'quiz' | 'page' | 'main_lp' | null
  content_id: string | null
  is_active: boolean
  ssl_status: 'pending' | 'active' | 'error'
  slug: string | null
  is_native: boolean
  user_id: string
  created_at: string
  updated_at: string
}

export type CustomDomainInsert = {
  id?: string
  domain: string
  content_type?: 'landing_page' | 'quiz' | 'page' | 'main_lp' | null
  content_id?: string | null
  is_active?: boolean
  ssl_status?: 'pending' | 'active' | 'error'
  slug?: string | null
  is_native?: boolean
  user_id: string
  created_at?: string
  updated_at?: string
}

export type CustomDomainUpdate = {
  id?: string
  domain?: string
  content_type?: 'landing_page' | 'quiz' | 'page' | 'main_lp' | null
  content_id?: string | null
  is_active?: boolean
  ssl_status?: 'pending' | 'active' | 'error'
  slug?: string | null
  is_native?: boolean
  user_id?: string
  created_at?: string
  updated_at?: string
}
