// Tipos do schema do Supabase.
// Gerar de verdade com:
//   pnpm supabase gen types typescript --project-id vuvoqmfmxcqqmkzthkjx > src/lib/supabase/types.ts
// Placeholder ate as migrations (prompt 02) criarem as tabelas.
export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
