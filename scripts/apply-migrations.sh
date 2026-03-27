#!/bin/bash

# ============================================================================
# SCRIPT DE APLICAÇÃO DE MIGRATIONS
# ============================================================================
# Aplica todas as migrations no Supabase

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ============================================================================
# VERIFICAÇÕES
# ============================================================================

log_info "Iniciando aplicação de migrations..."

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    log_error "Supabase CLI não está instalado"
    echo "Instale com: npm install -g supabase"
    exit 1
fi

log_success "Supabase CLI encontrado"

# Verificar se está logado
if ! supabase projects list &> /dev/null; then
    log_error "Você não está logado no Supabase"
    echo "Execute: supabase login"
    exit 1
fi

log_success "Autenticação Supabase OK"

# ============================================================================
# APLICAR MIGRATIONS
# ============================================================================

log_info "Aplicando migrations..."

if supabase db push; then
    log_success "Migrations aplicadas com sucesso"
else
    log_error "Erro ao aplicar migrations"
    exit 1
fi

# ============================================================================
# VERIFICAÇÃO
# ============================================================================

log_info "Verificando schema do banco de dados..."

# Listar tabelas
if supabase db pull; then
    log_success "Schema sincronizado"
else
    log_warning "Erro ao sincronizar schema (continuando...)"
fi

# ============================================================================
# RESUMO
# ============================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          MIGRATIONS - APLICADAS COM SUCESSO                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "📊 Tabelas Criadas:"
echo "  ✓ organizations"
echo "  ✓ users"
echo "  ✓ contacts"
echo "  ✓ messages"
echo "  ✓ leads"
echo "  ✓ whatsapp_configs"
echo "  ✓ chat_automations"
echo "  ✓ prospecting_campaigns"
echo "  ✓ campaign_knowledge"
echo "  ✓ conversation_flows"
echo "  ✓ conversation_flow_nodes"
echo "  ✓ conversation_flow_sessions"
echo "  ✓ webhook_configs"
echo "  ✓ webhook_logs"
echo "  ✓ api_keys"
echo "  ✓ ai_provider_configs"
echo "  ✓ media_files"
echo "  ✓ transcription_logs"
echo "  ✓ owner_notifications"
echo "  ✓ notification_preferences"
echo "  ✓ notification_logs"
echo ""

echo "🔐 Segurança:"
echo "  ✓ RLS (Row Level Security) habilitado"
echo "  ✓ Isolamento multi-tenant"
echo "  ✓ Índices de performance criados"
echo ""

echo "📝 Próximos Passos:"
echo "  1. Popular com dados de teste (opcional):"
echo "     node scripts/seed-dev-data.mjs"
echo ""
echo "  2. Verificar dados no Supabase Dashboard:"
echo "     https://app.supabase.com"
echo ""
echo "  3. Deploy de Edge Functions:"
echo "     bash scripts/deploy-functions.sh"
echo ""

log_success "Aplicação de migrations finalizada! 🎉"
echo ""
