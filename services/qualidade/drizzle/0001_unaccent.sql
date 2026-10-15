-- Busca sem depender de acento ("calibracao" encontra "Calibração").
-- unaccent é uma extensão "confiável" do Postgres: o dono do banco (svc_qualidade) pode criá-la.
CREATE EXTENSION IF NOT EXISTS unaccent;
