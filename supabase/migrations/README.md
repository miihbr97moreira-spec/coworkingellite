# Sistema de Migrations - Omni Flow

Este diretório contém todas as migrations de schema SQL do Omni Flow, versionadas e rastreáveis.

## 📋 Estrutura

```
migrations/
├── 001_initial_schema.sql          # Schema inicial
├── 002_add_transcription_logs.sql  # Adicionar logs de transcrição
├── 003_add_media_files.sql         # Adicionar tabela de mídia
├── 004_add_notifications.sql       # Adicionar notificações
└── migrations.json                 # Rastreamento de versão
```

## 🚀 Como Usar

### Aplicar uma Migration

```bash
# Via Supabase CLI
supabase db push

# Via SQL Editor do Supabase Dashboard
# 1. Copiar conteúdo do arquivo .sql
# 2. Colar no SQL Editor
# 3. Executar
```

### Criar Nova Migration

```bash
# 1. Criar arquivo com número sequencial
touch supabase/migrations/005_my_new_migration.sql

# 2. Escrever SQL
cat > supabase/migrations/005_my_new_migration.sql << 'EOF'
-- Descrição da migration
-- Data: 2026-03-27
-- Autor: Seu Nome

CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their data"
  ON new_table FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));
EOF

# 3. Atualizar migrations.json
# 4. Aplicar via supabase db push
```

## 📝 Convenções

### Nomes de Arquivo

- Formato: `NNN_descricao_em_snake_case.sql`
- NNN: Número sequencial (001, 002, 003...)
- Exemplo: `005_add_user_preferences.sql`

### Conteúdo do SQL

```sql
-- Descrição clara da migration
-- Data: YYYY-MM-DD
-- Autor: Nome do Desenvolvedor
-- Versão: 1.0.0

-- ============================================================================
-- Descrição detalhada do que está sendo alterado
-- ============================================================================

-- Criar tabela
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);

-- Adicionar RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Descrição da política"
  ON table_name FOR SELECT
  USING (...);

-- Criar índices
CREATE INDEX idx_table_name_field ON table_name(field);
```

## 🔄 Rastreamento de Versão

O arquivo `migrations.json` rastreia todas as migrations aplicadas:

```json
{
  "version": "1.0.0",
  "lastMigration": "004_add_notifications.sql",
  "migrations": [
    {
      "number": "001",
      "name": "initial_schema",
      "description": "Schema inicial com tabelas principais",
      "appliedAt": "2026-03-27T18:00:00Z",
      "status": "applied"
    },
    {
      "number": "002",
      "name": "add_transcription_logs",
      "description": "Adicionar tabela de logs de transcrição",
      "appliedAt": "2026-03-27T18:15:00Z",
      "status": "applied"
    }
  ]
}
```

## ⚠️ Boas Práticas

### ✅ Faça

- Sempre use `IF NOT EXISTS` para criar tabelas
- Sempre adicione RLS após criar tabelas
- Sempre crie índices para melhorar performance
- Sempre adicione comentários explicativos
- Sempre teste a migration em desenvolvimento primeiro
- Sempre use transações para múltiplas operações

### ❌ Não Faça

- Não delete dados sem backup
- Não altere migrations já aplicadas
- Não use `DROP TABLE` sem `IF EXISTS`
- Não esqueça de adicionar RLS
- Não ignore avisos de performance
- Não aplique migrations diretamente em produção

## 🔒 Segurança

### RLS Obrigatório

Toda tabela que contém dados de organização DEVE ter RLS:

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their data"
  ON table_name FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));
```

### Validação de Dados

Sempre valide dados ao inserir:

```sql
ALTER TABLE table_name
ADD CONSTRAINT check_valid_status
CHECK (status IN ('active', 'inactive', 'pending'));
```

## 📊 Histórico de Migrations

| # | Nome | Descrição | Data | Status |
|---|------|-----------|------|--------|
| 001 | initial_schema | Schema inicial com tabelas principais | 2026-03-27 | ✅ Applied |
| 002 | add_transcription_logs | Tabela de logs de transcrição | 2026-03-27 | ✅ Applied |
| 003 | add_media_files | Tabela de arquivos de mídia | 2026-03-27 | ✅ Applied |
| 004 | add_notifications | Tabelas de notificações | 2026-03-27 | ✅ Applied |

## 🆘 Rollback

Se uma migration falhar, você pode fazer rollback:

```bash
# Via Supabase Dashboard
# 1. Ir para SQL Editor
# 2. Executar script de rollback (geralmente DROP TABLE IF EXISTS)

# Via CLI
supabase db reset
```

## 📞 Suporte

Para problemas com migrations:

1. Verificar logs no Supabase Dashboard
2. Validar SQL syntax
3. Testar em ambiente de desenvolvimento
4. Consultar documentação do Supabase

---

**Versão:** 1.0.0  
**Última Atualização:** 2026-03-27
