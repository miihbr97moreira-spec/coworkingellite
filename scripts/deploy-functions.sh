#!/bin/bash

# ============================================================================
# SCRIPT DE DEPLOY DE EDGE FUNCTIONS
# ============================================================================
# Deploy automático de todas as Edge Functions para o Supabase

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

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ============================================================================
# VERIFICAÇÕES
# ============================================================================

log_info "Iniciando deploy de Edge Functions..."

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
# DEPLOY DE FUNCTIONS
# ============================================================================

FUNCTIONS=(
    "webhook-receiver"
    "send-whatsapp"
    "ai-proxy"
    "transcribe-audio"
    "upload-media"
    "notify-owner"
)

log_info "Fazendo deploy de ${#FUNCTIONS[@]} Edge Functions..."
echo ""

for func in "${FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        log_info "Deployando $func..."
        
        if supabase functions deploy "$func"; then
            log_success "$func deployado com sucesso"
        else
            log_error "Erro ao deployar $func"
            exit 1
        fi
        
        echo ""
    else
        log_error "Diretório supabase/functions/$func não encontrado"
        exit 1
    fi
done

# ============================================================================
# VERIFICAÇÃO DE DEPLOYMENT
# ============================================================================

log_info "Verificando functions deployadas..."

if supabase functions list; then
    log_success "Todas as functions foram deployadas com sucesso"
else
    log_error "Erro ao listar functions"
    exit 1
fi

# ============================================================================
# RESUMO
# ============================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          EDGE FUNCTIONS - DEPLOY CONCLUÍDO                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "🚀 Functions Deployadas:"
for func in "${FUNCTIONS[@]}"; do
    echo "  ✓ $func"
done

echo ""
echo "📝 Próximos Passos:"
echo "  1. Testar functions localmente:"
echo "     supabase functions serve"
echo ""
echo "  2. Configurar webhooks no seu provedor WhatsApp:"
echo "     https://seu-app.com/functions/v1/webhook-receiver?api_key=sk_live_..."
echo ""
echo "  3. Testar upload de mídia:"
echo "     curl -X POST https://seu-app.com/functions/v1/upload-media ..."
echo ""

log_success "Deploy de Edge Functions finalizado! 🎉"
echo ""
