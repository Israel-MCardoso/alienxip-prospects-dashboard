-- Migration: 20260623000001_storage_alienxip_files_bucket
-- Objetivo: Criar e proteger o bucket de storage 'alienxip-files' com políticas RLS robustas.

-- 1. Criação do bucket de storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('alienxip-files', 'alienxip-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de segurança RLS na tabela storage.objects para o bucket 'alienxip-files'

-- Garantir que as políticas antigas sejam removidas de forma limpa para evitar conflitos
DROP POLICY IF EXISTS "authenticated users can read alienxip-files objects" ON storage.objects;
DROP POLICY IF EXISTS "active users can upload to alienxip-files" ON storage.objects;
DROP POLICY IF EXISTS "uploader or staff can delete alienxip-files" ON storage.objects;

-- SELECT: Usuários autenticados podem ler objetos do bucket 'alienxip-files'
CREATE POLICY "authenticated users can read alienxip-files objects"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'alienxip-files');

-- INSERT: Somente usuários autenticados com profile ativo e que não sejam viewer podem fazer upload
CREATE POLICY "active users can upload to alienxip-files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'alienxip-files'
  AND public.has_active_profile()
  AND NOT public.is_viewer()
);

-- DELETE: Somente o uploader do arquivo (owner), operator, admin ou owner (do sistema) podem deletar fisicamente
CREATE POLICY "uploader or staff can delete alienxip-files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'alienxip-files'
  AND (
    owner = auth.uid()
    OR public.has_app_role('operator')
    OR public.is_admin_or_owner()
  )
);
