# 🚀 Deployment Checklist - Omni Flow

Checklist completo para deploy de produção do Omni Flow.

---

## ✅ PRÉ-DEPLOYMENT

- [ ] Revisar todas as variáveis de ambiente em `.env.local`
- [ ] Confirmar que `.env.local` está em `.gitignore`
- [ ] Executar `pnpm install` para instalar dependências
- [ ] Executar `pnpm build` para validar build
- [ ] Executar `pnpm test` para rodar testes
- [ ] Revisar logs de build para warnings/errors

---

## ✅ CONFIGURAÇÃO DO SUPABASE

### Pré-requisitos
- [ ] Criar projeto no Supabase (https://app.supabase.com)
- [ ] Copiar URL do projeto
- [ ] Copiar chave anônima (anon key)
- [ ] Copiar chave de serviço (service role key)
- [ ] Adicionar ao `.env.local`:
  ```
  VITE_SUPABASE_URL=https://seu-projeto.supabase.co
  VITE_SUPABASE_ANON_KEY=sua_anon_key
  SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
  ```

### Instalar Supabase CLI
- [ ] Instalar: `npm install -g supabase`
- [ ] Fazer login: `supabase login`
- [ ] Ligar ao projeto: `supabase link --project-ref seu_project_id`

---

## ✅ APLICAR MIGRATIONS

### Opção 1: Via CLI (Recomendado)
```bash
bash scripts/apply-migrations.sh
```

### Opção 2: Manual
1. [ ] Ir para SQL Editor no Supabase Dashboard
2. [ ] Copiar conteúdo de `supabase-schema.sql`
3. [ ] Executar SQL
4. [ ] Verificar se todas as tabelas foram criadas

### Validar Migrations
- [ ] Verificar 21 tabelas criadas
- [ ] Verificar RLS policies ativas
- [ ] Verificar índices criados
- [ ] Verificar foreign keys

---

## ✅ CONFIGURAR VARIÁVEIS DE AMBIENTE

### WhatsApp Providers
- [ ] **Z-API** (se usar):
  - [ ] Criar conta em https://z-api.io
  - [ ] Copiar Instance ID
  - [ ] Copiar API Token
  - [ ] Adicionar ao `.env.local`:
    ```
    VITE_ZAPI_BASE_URL=https://api.z-api.io
    VITE_ZAPI_INSTANCE_ID=seu_instance_id
    ZAPI_API_TOKEN=seu_api_token
    ```

- [ ] **Evolution** (se usar):
  - [ ] Criar conta em https://evolution.com
  - [ ] Copiar API Key
  - [ ] Adicionar ao `.env.local`:
    ```
    VITE_EVOLUTION_BASE_URL=https://api.evolution.com
    EVOLUTION_API_KEY=sua_api_key
    ```

### LLM Providers
- [ ] **Groq** (recomendado):
  - [ ] Criar API key em https://console.groq.com
  - [ ] Adicionar ao `.env.local`:
    ```
    VITE_GROQ_API_KEY=sua_chave
    VITE_GROQ_MODEL=llama-3.3-70b-versatile
    ```

- [ ] **OpenAI** (opcional):
  - [ ] Criar API key em https://platform.openai.com/api-keys
  - [ ] Adicionar ao `.env.local`:
    ```
    VITE_OPENAI_API_KEY=sua_chave
    VITE_OPENAI_MODEL=gpt-4o-mini
    ```

- [ ] **Google Gemini** (opcional):
  - [ ] Obter API key em https://ai.google.dev
  - [ ] Adicionar ao `.env.local`:
    ```
    VITE_GEMINI_API_KEY=sua_chave
    VITE_GEMINI_MODEL=gemini-2.0-flash
    ```

### Notification Services
- [ ] **Resend** (Email):
  - [ ] Criar API key em https://resend.com/api-keys
  - [ ] Adicionar ao `.env.local`:
    ```
    VITE_RESEND_API_KEY=sua_chave
    VITE_RESEND_FROM_EMAIL=seu_email@dominio.com
    ```

- [ ] **Twilio** (SMS):
  - [ ] Criar conta em https://www.twilio.com
  - [ ] Copiar Account SID e Auth Token
  - [ ] Adicionar ao `.env.local`:
    ```
    VITE_TWILIO_ACCOUNT_SID=seu_sid
    VITE_TWILIO_AUTH_TOKEN=seu_token
    VITE_TWILIO_PHONE_NUMBER=+1234567890
    ```

---

## ✅ DEPLOY DE EDGE FUNCTIONS

### Opção 1: Via Script
```bash
bash scripts/deploy-functions.sh
```

### Opção 2: Manual
```bash
supabase functions deploy webhook-receiver
supabase functions deploy send-whatsapp
supabase functions deploy ai-proxy
supabase functions deploy transcribe-audio
supabase functions deploy upload-media
supabase functions deploy notify-owner
```

### Validar Deploy
- [ ] Listar functions: `supabase functions list`
- [ ] Verificar se todas as 6 functions aparecem
- [ ] Testar webhook-receiver localmente:
  ```bash
  supabase functions serve
  ```

---

## ✅ CONFIGURAR WEBHOOKS

### Z-API
- [ ] Ir para dashboard Z-API
- [ ] Configurar webhook URL:
  ```
  https://seu-app.com/functions/v1/webhook-receiver?api_key=sk_live_...&provider=z-api
  ```
- [ ] Habilitar eventos: messages, groups, contacts

### Evolution
- [ ] Ir para dashboard Evolution
- [ ] Configurar webhook URL:
  ```
  https://seu-app.com/functions/v1/webhook-receiver?api_key=sk_live_...&provider=evolution
  ```

---

## ✅ TESTAR LOCALMENTE

### Iniciar Dev Server
```bash
pnpm dev
```

### Testar Funcionalidades
- [ ] Acessar http://localhost:5173
- [ ] Fazer login
- [ ] Navegar para OmniFlow
- [ ] Testar abas: Dashboard, Inbox, Integrações, Analytics, Notificações
- [ ] Testar upload de mídia
- [ ] Testar envio de mensagem WhatsApp
- [ ] Testar chamada a LLM

### Testar Edge Functions Localmente
```bash
supabase functions serve
```

- [ ] Testar webhook-receiver com curl
- [ ] Testar send-whatsapp com curl
- [ ] Testar ai-proxy com curl

---

## ✅ TESTES FINAIS

### Testes Unitários
```bash
pnpm test
```
- [ ] Todos os testes passam
- [ ] Cobertura > 80%

### Testes de Performance
- [ ] Build size < 500KB (gzipped)
- [ ] Lighthouse score > 80
- [ ] Tempo de carregamento < 3s

### Testes de Segurança
- [ ] Verificar RLS policies
- [ ] Verificar autenticação
- [ ] Verificar rate limiting
- [ ] Verificar CORS

---

## ✅ COMMIT E PUSH

### Git
```bash
git add -A
git commit -m "🚀 Deploy de produção: Omni Flow v1.0.0"
git push origin main
```

- [ ] Commit feito com sucesso
- [ ] Push para GitHub concluído
- [ ] CI/CD pipeline iniciado

---

## ✅ MONITORAMENTO PÓS-DEPLOY

### Verificações Iniciais (Primeiros 30 minutos)
- [ ] Verificar logs de erro em `.manus-logs/`
- [ ] Verificar status das Edge Functions
- [ ] Verificar conexão com Supabase
- [ ] Verificar webhooks recebendo dados

### Monitoramento Contínuo (Primeira semana)
- [ ] Monitorar performance
- [ ] Monitorar erros e exceptions
- [ ] Monitorar uso de recursos
- [ ] Monitorar feedback de usuários

### Métricas a Acompanhar
- [ ] Taxa de erro < 1%
- [ ] Latência média < 500ms
- [ ] Uptime > 99.9%
- [ ] Taxa de sucesso de webhooks > 99%

---

## ✅ ROLLBACK (Se necessário)

### Rollback Rápido
```bash
git revert HEAD
git push origin main
```

### Rollback de Edge Functions
```bash
supabase functions delete webhook-receiver
supabase functions delete send-whatsapp
# ... etc
```

### Rollback de Migrations
```bash
supabase db reset
```

---

## 📞 SUPORTE E TROUBLESHOOTING

### Problemas Comuns

**Erro: "VITE_SUPABASE_URL não está configurado"**
- [ ] Verificar `.env.local`
- [ ] Verificar se variáveis estão corretas
- [ ] Reiniciar dev server

**Erro: "RLS policy violation"**
- [ ] Verificar autenticação do usuário
- [ ] Verificar RLS policies no Supabase
- [ ] Verificar organization_id do usuário

**Erro: "Edge Function timeout"**
- [ ] Verificar logs da function
- [ ] Aumentar timeout se necessário
- [ ] Otimizar código da function

**Erro: "Webhook não recebendo dados"**
- [ ] Verificar URL do webhook
- [ ] Verificar API key
- [ ] Verificar logs em webhook_logs

### Contatos de Suporte
- Documentação: `SETUP_GUIDE.md`, `API_DOCUMENTATION.md`
- GitHub Issues: https://github.com/miihbr97moreira-spec/coworkingellite/issues
- Supabase Docs: https://supabase.com/docs

---

## 📊 CHECKLIST FINAL

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Migrations aplicadas com sucesso
- [ ] Edge Functions deployadas
- [ ] Webhooks configurados
- [ ] Testes passando
- [ ] Build validado
- [ ] Commit e push feitos
- [ ] Monitoramento ativo
- [ ] Documentação atualizada
- [ ] Backup realizado

---

**Status:** ✅ PRONTO PARA PRODUÇÃO  
**Data:** 2026-03-27  
**Versão:** 1.0.0  
**Próximo Passo:** Monitorar e iterar com feedback dos usuários 🚀
