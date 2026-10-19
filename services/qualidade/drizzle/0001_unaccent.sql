-- Busca sem depender de acento ("calibracao" encontra "Calibração").
-- unaccent é uma extensão "confiável" do Postgres: o dono do banco (svc_qualidade) pode criá-la.
-- Fica no public (objeto do banco inteiro) para que, nos testes de integração, cada schema temporário
-- a enxergue. O DO/EXCEPTION tolera a corrida entre arquivos de teste que migram em paralelo:
-- CREATE EXTENSION IF NOT EXISTS não é atômico e dois criadores simultâneos dão unique_violation (23505).
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA public;
EXCEPTION
  WHEN unique_violation OR duplicate_object THEN NULL;
END
$$;
