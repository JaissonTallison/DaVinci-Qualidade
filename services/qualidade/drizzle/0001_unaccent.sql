-- Busca sem depender de acento ("calibracao" encontra "Calibração").
-- unaccent é uma extensão "confiável" do Postgres: o dono do banco (svc_qualidade) pode criá-la.
-- SCHEMA public: extensão é objeto do banco inteiro. Nos testes de integração cada arquivo roda
-- num schema temporário (search_path=teste_xxx,public); sem fixar o public, a extensão nasceria no
-- schema temporário do 1º teste e os demais não a encontrariam. No public, todo search_path a enxerga.
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA public;
