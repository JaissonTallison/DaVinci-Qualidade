-- Um banco e um usuário por microsserviço (database-per-service).
-- Cada serviço só tem acesso ao próprio banco. Senhas apenas para desenvolvimento local.
-- Executado só na primeira criação do volume: depois de adicionar um serviço aqui,
-- recrie o volume (docker compose down -v) ou rode o bloco à mão no Postgres.
--
-- Modelo para cada serviço:
--   CREATE ROLE svc_<servico> LOGIN PASSWORD '<servico>';
--   CREATE DATABASE davinci_<servico> OWNER svc_<servico>;
--   REVOKE ALL ON DATABASE davinci_<servico> FROM PUBLIC;

CREATE ROLE svc_identidade LOGIN PASSWORD 'identidade';
CREATE DATABASE davinci_identidade OWNER svc_identidade;
REVOKE ALL ON DATABASE davinci_identidade FROM PUBLIC;

CREATE ROLE svc_codex LOGIN PASSWORD 'codex';
CREATE DATABASE davinci_codex OWNER svc_codex;
REVOKE ALL ON DATABASE davinci_codex FROM PUBLIC;

CREATE ROLE svc_integracoes LOGIN PASSWORD 'integracoes';
CREATE DATABASE davinci_integracoes OWNER svc_integracoes;
REVOKE ALL ON DATABASE davinci_integracoes FROM PUBLIC;

CREATE ROLE svc_plataforma LOGIN PASSWORD 'plataforma';
CREATE DATABASE davinci_plataforma OWNER svc_plataforma;
REVOKE ALL ON DATABASE davinci_plataforma FROM PUBLIC;

CREATE ROLE svc_qualidade LOGIN PASSWORD 'qualidade';
CREATE DATABASE davinci_qualidade OWNER svc_qualidade;
REVOKE ALL ON DATABASE davinci_qualidade FROM PUBLIC;

CREATE ROLE svc_auditorias LOGIN PASSWORD 'auditorias';
CREATE DATABASE davinci_auditorias OWNER svc_auditorias;
REVOKE ALL ON DATABASE davinci_auditorias FROM PUBLIC;

CREATE ROLE svc_sgi LOGIN PASSWORD 'sgi';
CREATE DATABASE davinci_sgi OWNER svc_sgi;
REVOKE ALL ON DATABASE davinci_sgi FROM PUBLIC;

CREATE ROLE svc_servicos LOGIN PASSWORD 'servicos';
CREATE DATABASE davinci_servicos OWNER svc_servicos;
REVOKE ALL ON DATABASE davinci_servicos FROM PUBLIC;

CREATE ROLE svc_seguranca LOGIN PASSWORD 'seguranca';
CREATE DATABASE davinci_seguranca OWNER svc_seguranca;
REVOKE ALL ON DATABASE davinci_seguranca FROM PUBLIC;

CREATE ROLE svc_ambiental LOGIN PASSWORD 'ambiental';
CREATE DATABASE davinci_ambiental OWNER svc_ambiental;
REVOKE ALL ON DATABASE davinci_ambiental FROM PUBLIC;

CREATE ROLE svc_esg LOGIN PASSWORD 'esg';
CREATE DATABASE davinci_esg OWNER svc_esg;
REVOKE ALL ON DATABASE davinci_esg FROM PUBLIC;

CREATE ROLE svc_paineis LOGIN PASSWORD 'paineis';
CREATE DATABASE davinci_paineis OWNER svc_paineis;
REVOKE ALL ON DATABASE davinci_paineis FROM PUBLIC;
