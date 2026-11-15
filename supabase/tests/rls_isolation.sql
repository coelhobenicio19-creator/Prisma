-- ============================================================
-- Testes de isolamento RLS — executar no Supabase SQL Editor
-- como usuário autenticado (auth.uid() preenchido).
-- Cada bloco deve resultar nas linhas esperadas; vazias = bloqueado.
-- ============================================================

-- Preparar: criar dois usuários de teste via Auth (ou usar existent)
-- e dois perfis: A (dono) e B (outro usuário).

-- 1) Usuário A não deve ver documentos do perfil de B
--    Esperado: 0 linhas
SELECT count(*) AS vazamento_documentos
FROM document d
JOIN study_profile sp ON sp.id = d.profile_id
WHERE sp.user_id <> auth.uid();

-- 2) Usuário A não deve ver flashcards do perfil de B
--    Esperado: 0
SELECT count(*) AS vazamento_flashcards
FROM flashcard f
JOIN study_profile sp ON sp.id = f.profile_id
WHERE sp.user_id <> auth.uid();

-- 3) Usuário A não deve ver conversas LIA de B
--    Esperado: 0
SELECT count(*) AS vazamento_lia
FROM lia_conversation c
JOIN study_profile sp ON sp.id = c.profile_id
WHERE sp.user_id <> auth.uid();

-- 4) Usuário A não deve ver memória de B
--    Esperado: 0
SELECT count(*) AS vazamento_memoria
FROM lia_memory m
JOIN study_profile sp ON sp.id = m.profile_id
WHERE sp.user_id <> auth.uid();

-- 5) Usuário A não deve conseguir inserir documento em perfil de B
--    Esperado: ERRO (RLS viola política) — teste manual:
-- INSERT INTO document (profile_id, title, content_hash, storage_path, file_size, mime_type, language, ocr_status, extraction_status)
-- VALUES ('<id-perfil-de-B>', 'x', 'x', 'x', 1, 'text/plain', 'pt-BR', 'pending', 'pending');

-- 6) Storage: tentar ler objeto de outro usuário
--    Esperado: 0 linhas
SELECT count(*) AS vazamento_storage
FROM storage.objects
WHERE bucket_id = 'documents' AND (storage.foldername(name))[1] <> auth.uid()::text;

-- 7) Dashboard RPC de outro perfil deve falhar
--    Esperado: ERRO "Acesso negado"
-- SELECT dashboard_data('<id-perfil-de-B>');
