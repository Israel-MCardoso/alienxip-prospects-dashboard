-- Migration: 20260623000002_harden_rls_proposals_dead_letters
-- Objetivo: Enrijecer a segurança RLS em prospect_proposals e outreach_dead_letters, adicionando também constraints de integridade de dados.

-- ============================================================================
-- SEÇÃO A: Ajustes na tabela prospect_proposals
-- ============================================================================

-- 1. Dropar policies antigas permissivas
DROP POLICY IF EXISTS "authenticated users can create proposals" ON public.prospect_proposals;
DROP POLICY IF EXISTS "authenticated users can update proposals" ON public.prospect_proposals;

-- 2. Criar novas políticas de acesso seguras (bloqueia viewers e usuários inativos)
CREATE POLICY "authenticated users can create proposals"
ON public.prospect_proposals FOR INSERT
TO authenticated
WITH CHECK (
  public.has_active_profile()
  AND NOT public.is_viewer()
);

CREATE POLICY "authenticated users can update proposals"
ON public.prospect_proposals FOR UPDATE
TO authenticated
USING (
  public.has_active_profile()
  AND NOT public.is_viewer()
)
WITH CHECK (
  public.has_active_profile()
  AND NOT public.is_viewer()
);

-- 3. Adicionar constraints de integridade comercial (apenas se não existirem)
DO $$
BEGIN
  -- Constraint de valor positivo para proposta comercial (value >= 0)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_positive_value'
      AND conrelid = 'public.prospect_proposals'::regclass
  ) THEN
    ALTER TABLE public.prospect_proposals
      ADD CONSTRAINT check_positive_value CHECK (value >= 0);
  END IF;

  -- Constraint de status permitidos
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_proposal_status'
      AND conrelid = 'public.prospect_proposals'::regclass
  ) THEN
    ALTER TABLE public.prospect_proposals
      ADD CONSTRAINT check_proposal_status CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'cancelled'));
  END IF;
END $$;


-- ============================================================================
-- SEÇÃO B: Ajustes na tabela outreach_dead_letters
-- ============================================================================

-- 1. Ativar Row Level Security (RLS) que estava inativo por padrão
ALTER TABLE public.outreach_dead_letters ENABLE ROW LEVEL SECURITY;

-- 2. Dropar política de visualização se já existir
DROP POLICY IF EXISTS "admins can read dead letters" ON public.outreach_dead_letters;

-- 3. SELECT permitido apenas para administradores/proprietários (is_admin_or_owner())
CREATE POLICY "admins can read dead letters"
ON public.outreach_dead_letters FOR SELECT
TO authenticated
USING (public.is_admin_or_owner());

-- Nota: INSERT, UPDATE e DELETE intencionalmente não têm policies para a role 'authenticated',
-- garantindo que apenas a role de administrador do Supabase (service_role) e scripts automáticos bypassando RLS possam interagir.
