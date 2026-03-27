# 🚀 Guia de Setup - Omni Flow

Bem-vindo ao Omni Flow! Este guia irá ajudá-lo a configurar e executar o projeto localmente.

---

## 📋 Pré-requisitos

- **Node.js**: v18+ (recomendado v22)
- **npm** ou **pnpm**: v10+
- **Git**: v2.0+
- **Supabase CLI**: v1.0+
- Conta no **Supabase** (https://supabase.com)

---

## 🔧 Instalação

### 1. Clonar o Repositório

```bash
git clone https://github.com/miihbr97moreira-spec/coworkingellite.git
cd coworkingellite
```

### 2. Instalar Dependências

```bash
# Com pnpm (recomendado)
pnpm install

# Ou com npm
npm install
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env.local

# Editar .env.local com suas credenciais
nano .env.local
```

**Variáveis obrigatórias:**
- `VITE_SUPABASE_URL`: URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço (apenas backend)

**Variáveis opcionais (para funcionalidades completas):**
- `VITE_GROQ_API_KEY`: Para usar Groq como LLM
- `VITE_OPENAI_API_KEY`: Para usar OpenAI
- `VITE_ZAPI_API_TOKEN`: Para integração Z-API WhatsApp

---

## 🗄️ Configurar Banco de Dados

### 1. Criar Projeto no Supabase

1. Ir para https://app.supabase.com
2. Criar novo projeto
3. Copiar URL e chaves para `.env.local`

### 2. Aplicar Migrations

```bash
# Via Supabase CLI
supabase db push

# Ou manualmente:
# 1. Ir para SQL Editor no Supabase Dashboard
# 2. Copiar conteúdo de supabase/migrations/001_initial_schema.sql
# 3. Executar
# 4. Repetir para migrations 002 e 003
```

### 3. Popular com Dados de Teste (Opcional)

```bash
# Executar seed script
node scripts/seed-dev-data.mjs
```

---

## 🚀 Executar Localmente

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
pnpm dev

# Aplicação estará disponível em:
# http://localhost:5173
```

### Build para Produção

```bash
# Fazer build
pnpm build

# Testar build localmente
pnpm preview
```

---

## 🔐 Configurar Edge Functions

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Fazer Login

```bash
supabase login
```

### 3. Ligar ao Projeto

```bash
supabase link --project-ref your_project_id
```

### 4. Deploy Functions Localmente (Teste)

```bash
supabase functions serve
```

### 5. Deploy para Produção

```bash
# Deploy webhook-receiver
supabase functions deploy webhook-receiver

# Deploy send-whatsapp
supabase functions deploy send-whatsapp

# Deploy ai-proxy
supabase functions deploy ai-proxy

# Deploy transcribe-audio
supabase functions deploy transcribe-audio

# Deploy upload-media
supabase functions deploy upload-media

# Deploy notify-owner
supabase functions deploy notify-owner
```

---

## 🧪 Testes

### Executar Testes Unitários

```bash
# Rodar todos os testes
pnpm test

# Rodar com cobertura
pnpm test:coverage

# Modo watch
pnpm test:watch
```

### Testar Edge Functions Localmente

```bash
# 1. Iniciar servidor local
supabase functions serve

# 2. Em outro terminal, testar webhook-receiver
curl -X POST \
  'http://localhost:54321/functions/v1/webhook-receiver?api_key=test' \
  -H 'Content-Type: application/json' \
  -d '{
    "phone": "5511999999999",
    "text": "Teste",
    "fromMe": false,
    "timestamp": '$(date +%s)',
    "messageId": "test-123"
  }'
```

---

## 📱 Integrar WhatsApp

### Z-API

1. Ir para https://z-api.io
2. Criar conta e instância
3. Copiar `Instance ID` e `API Token`
4. Adicionar a `.env.local`:
   ```
   VITE_ZAPI_INSTANCE_ID=seu_instance_id
   ZAPI_API_TOKEN=seu_api_token
   ```
5. Configurar webhook:
   ```
   https://seu-app.com/functions/v1/webhook-receiver?api_key=sk_live_...&provider=z-api
   ```

### Evolution

1. Ir para https://evolution.com
2. Criar conta
3. Copiar `API Key`
4. Adicionar a `.env.local`:
   ```
   EVOLUTION_API_KEY=seu_api_key
   ```
5. Configurar webhook:
   ```
   https://seu-app.com/functions/v1/webhook-receiver?api_key=sk_live_...&provider=evolution
   ```

---

## 🤖 Configurar LLMs

### Groq (Recomendado)

1. Ir para https://console.groq.com
2. Criar API key
3. Adicionar a `.env.local`:
   ```
   VITE_GROQ_API_KEY=sua_chave
   ```

### OpenAI

1. Ir para https://platform.openai.com/api-keys
2. Criar API key
3. Adicionar a `.env.local`:
   ```
   VITE_OPENAI_API_KEY=sua_chave
   ```

### Google Gemini

1. Ir para https://ai.google.dev
2. Obter API key
3. Adicionar a `.env.local`:
   ```
   VITE_GEMINI_API_KEY=sua_chave
   ```

---

## 📧 Configurar Notificações

### Email (Resend)

1. Ir para https://resend.com
2. Criar API key
3. Adicionar a `.env.local`:
   ```
   VITE_RESEND_API_KEY=sua_chave
   VITE_RESEND_FROM_EMAIL=seu_email@dominio.com
   ```

### SMS (Twilio)

1. Ir para https://www.twilio.com/console
2. Copiar `Account SID` e `Auth Token`
3. Adicionar a `.env.local`:
   ```
   VITE_TWILIO_ACCOUNT_SID=seu_sid
   VITE_TWILIO_AUTH_TOKEN=seu_token
   VITE_TWILIO_PHONE_NUMBER=+1234567890
   ```

---

## 🐛 Troubleshooting

### Erro: "VITE_SUPABASE_URL não está configurado"

**Solução:** Verificar se `.env.local` existe e contém `VITE_SUPABASE_URL`

```bash
cat .env.local | grep VITE_SUPABASE_URL
```

### Erro: "Falha ao conectar ao Supabase"

**Solução:** Verificar se a chave está correta e o projeto está ativo

```bash
# Testar conexão
curl https://seu-url.supabase.co/rest/v1/
```

### Erro: "Edge Function não encontrada"

**Solução:** Fazer deploy das functions

```bash
supabase functions deploy webhook-receiver
```

### Erro: "RLS policy violation"

**Solução:** Verificar se o usuário tem permissão para acessar os dados

```sql
-- Verificar RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

---

## 📚 Documentação

- **API Documentation**: Consultar `API_DOCUMENTATION.md`
- **Architecture**: Consultar `ARCHITECTURE.md`
- **Migrations**: Consultar `supabase/migrations/README.md`

---

## 🔗 Links Úteis

- [Supabase Docs](https://supabase.com/docs)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Groq API](https://console.groq.com/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [Gemini API](https://ai.google.dev)
- [Z-API Docs](https://z-api.io/docs)

---

## 💬 Suporte

Para dúvidas ou problemas:

1. Verificar a documentação acima
2. Consultar logs em `.manus-logs/`
3. Abrir issue no GitHub
4. Entrar em contato com o suporte

---

**Versão:** 1.0.0  
**Última Atualização:** 2026-03-27  
**Mantido por:** Omni Flow Team
