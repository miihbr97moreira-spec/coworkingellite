# Omni Flow - Arquitetura Técnica Completa

## 📋 Visão Geral

**Omni Flow** é um CRM omnichannel completo focado em WhatsApp multi-tenant com automações avançadas, agentes de IA e fluxos conversacionais visuais. A arquitetura segue rigorosamente o padrão do CRM Religare com isolamento multi-tenant via RLS (Row Level Security).

---

## 🏗️ Arquitetura de Camadas

### 1. **Camada de Dados (Supabase PostgreSQL + RLS)**

#### Tabelas Principais:

```
organizations
├── whatsapp_configs (multi-provedor)
├── contacts
│   ├── messages (inbound/outbound/internal)
│   ├── contact_history (notas internas)
│   └── conversation_preferences
├── leads
├── chat_automations
├── prospecting_campaigns
│   └── campaign_knowledge
├── conversation_flows
│   ├── conversation_flow_nodes
│   └── conversation_flow_sessions
├── webhook_configs
├── webhook_logs
├── api_keys
└── ai_provider_configs
```

#### Isolamento Multi-Tenant:

- Todas as tabelas possuem `organization_id`
- RLS policies garantem que usuários só acessem dados de suas organizações
- Índices otimizados para queries por `organization_id`

---

### 2. **Camada de Integração (Supabase Edge Functions)**

#### Edge Function: `webhook-receiver`

**Responsabilidades:**
- Normalizar payloads de múltiplos provedores (Z-API, Evolution, CodeChat, Baileys, etc.)
- Deduplicar mensagens por `external_message_id`
- Detectar grupos via `group_jid`
- Criar contatos automaticamente
- Criar leads se `auto_create_lead` estiver ativo
- Acionar `runChatAutomations` e `runConversationFlow`
- Registrar logs de webhook

**Fluxo:**
```
Webhook (Z-API/Evolution) 
  → Normalizar payload
  → Validar API key
  → Deduplicar
  → Upsert contato
  → Criar lead (se necessário)
  → Salvar mensagem
  → Executar automações
  → Retornar sucesso
```

#### Edge Function: `send-whatsapp`

**Responsabilidades:**
- Roteador de saída que resolve `client_id` pelo telefone
- Buscar configuração do provedor ativo
- Disparar para API do provedor (Z-API, Evolution, etc.)
- Registrar status da entrega
- Retornar `external_message_id` para rastreamento

**Suportados:**
- Z-API: `/send-text`, `/send-image`, `/send-document`
- Evolution: `/message/sendText`, `/message/sendMedia`
- Extensível para outros provedores

#### Edge Function: `ai-proxy`

**Responsabilidades:**
- Proxy centralizado para LLMs (Groq, OpenAI, Gemini)
- Tratamento de rate limits com retry exponencial
- Suporte a streaming SSE
- Cache de respostas (opcional)
- Logging de uso de tokens

**Suportados:**
- Groq: LLaMA 3.3 70B, Mixtral, Gemma
- OpenAI: GPT-4o, GPT-4o Mini, GPT-4 Turbo
- Gemini: Gemini 2.5 Flash, Pro, 2.0 Flash

---

### 3. **Camada de Frontend (React + Tailwind + shadcn/ui)**

#### Hub de Integrações (`Integrations.tsx`)

**9 Abas Principais:**

1. **WhatsApp** (`WhatsAppConfigTab.tsx`)
   - Config multi-provedor com sanitização de URL
   - Botão "Testar" para validar conexão
   - Toggle ativação/desativação
   - Auto-create lead checkbox

2. **Automações** (`ChatAutomationsTab.tsx`)
   - Construtor de regras multi-step
   - Gatilhos: qualquer mensagem, palavra-chave, primeiro contato, regex, tipo de mídia
   - Ações: responder com IA, resposta automática, atribuir, adicionar tag, criar lead
   - Prioridade e cooldown configuráveis

3. **Agentes IA** (`AgentLibraryTab.tsx`)
   - Biblioteca com 4 etapas de treino:
     - **Identidade**: Nome, tipo (atendimento/prospecção), personalidade, estilo, tom
     - **Instruções**: Prompt do sistema
     - **Conhecimento**: Base via scraping/PDF/spreadsheet
     - **Config**: Modelo, temperatura, max tokens

4. **Fluxos** (`ConversationFlowsTab.tsx`)
   - Construtor visual (FlowCanvas.tsx)
   - Templates: Boas-vindas, Prospecção, Satisfação, Re-engajamento
   - Nós: Mensagem, Decisão, Ação, Integração

5. **API Keys** (`AIProviderSettings.tsx`)
   - Cofre BYOK (Bring Your Own Key)
   - Suporte: Groq, OpenAI, Gemini
   - Definir provedor padrão
   - Testar conexão

6. **Webhooks** (`WebhooksTab.tsx`)
   - Webhooks de saída (eventos do CRM)
   - Webhooks de entrada (receber mensagens)
   - Geração e gerenciamento de API keys
   - Logs de eventos

#### Omni Inbox (`Inbox.tsx`)

**Layout 3 Colunas (Estilo Kommo):**

1. **ConversationList** (340px)
   - Filtros: Todos, Não lidos, Aguardando, Individual, Grupos
   - Busca por nome/telefone
   - Badges: Unread count, Behavior tag (Gold/Silver/Bronze/VIP/Risk)
   - Swipe actions: Pin, Mark as read/unread, Delete
   - Ordenação: Fixados primeiro, depois mais recentes

2. **ChatArea** (flex)
   - Bolhas de mensagem com timestamps
   - Gravação de áudio nativa (WebRTC)
   - Lazy loading de mensagens (scroll up)
   - Resumo por IA (botão)
   - Quick replies com `/` (slash commands)
   - Status de entrega (pending, delivered, read)
   - Suporte a mídia (imagem, áudio, vídeo, documento)

3. **ChatSidebar** (288px)
   - Contexto do Lead: Nome, Email, Telefone, Empresa
   - Behavior tag (badge colorida)
   - Select de Funil/Etapa em tempo real
   - Tags e Notas Internas
   - Histórico de interações

#### Hook Central (`useInbox.tsx`)

**Responsabilidades:**
- Gerenciar paginação de conversas e mensagens
- Assinar Supabase Realtime (`postgres_changes` em messages)
- Atualizar UI instantaneamente quando novas mensagens chegam
- Enviar mensagens via Edge Function `send-whatsapp`
- Gerenciar estado de seleção, filtros, notas internas

**Realtime:**
```typescript
supabase
  .channel(`inbox-messages-${organizationId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `organization_id=eq.${organizationId}`
  }, (payload) => {
    // Atualizar lista de conversas e mensagens
  })
  .subscribe()
```

---

## 🔐 Segurança & Isolamento Multi-Tenant

### Row Level Security (RLS)

Todas as tabelas possuem políticas RLS que garantem:

```sql
-- Exemplo: Usuários só veem dados de suas organizações
CREATE POLICY "Organizations can view their data"
  ON messages FOR SELECT
  USING (
    organization_id = (
      SELECT id FROM organizations 
      WHERE owner_id = auth.uid()
    )
  );
```

### Autenticação

- Supabase Auth (JWT)
- Edge Functions validam token
- API keys com hash SHA-256

### Criptografia

- API tokens armazenados encriptados
- Conexões HTTPS obrigatórias
- CORS restrito a domínios autorizados

---

## 📊 Fluxos de Dados

### Fluxo de Entrada (Webhook → Banco)

```
1. Provedor WhatsApp envia webhook
   ↓
2. webhook-receiver valida API key
   ↓
3. Normaliza payload (Z-API/Evolution/etc)
   ↓
4. Deduplicação por external_message_id
   ↓
5. Upsert contato
   ↓
6. Criar lead (se auto_create_lead)
   ↓
7. Salvar mensagem em messages
   ↓
8. Executar chat_automations
   ↓
9. Executar conversation_flows
   ↓
10. Retornar sucesso
```

### Fluxo de Saída (UI → Webhook)

```
1. Usuário digita mensagem em ChatArea
   ↓
2. Clica enviar
   ↓
3. useInbox.sendMessage() invoca send-whatsapp
   ↓
4. send-whatsapp resolve provider config
   ↓
5. Dispara para API do provedor
   ↓
6. Retorna external_message_id
   ↓
7. Salva mensagem com status "delivered"
   ↓
8. Atualiza UI via Realtime
```

### Fluxo de IA (Chat → LLM)

```
1. Automação ou agente precisa de resposta
   ↓
2. Invoca ai-proxy com messages
   ↓
3. ai-proxy busca config do provedor
   ↓
4. Chama LLM (Groq/OpenAI/Gemini)
   ↓
5. Retorna resposta (stream ou completa)
   ↓
6. Automação envia via send-whatsapp
```

---

## 🔧 Configuração & Deployment

### Variáveis de Ambiente

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...

# Provedores WhatsApp
ZAPI_BASE_URL=https://api.z-api.io
EVOLUTION_BASE_URL=https://api.evolution.com

# LLMs
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
```

### Deploy das Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Deploy
supabase functions deploy webhook-receiver
supabase functions deploy send-whatsapp
supabase functions deploy ai-proxy
```

### Aplicar Schema SQL

```bash
# Via Supabase Dashboard
# 1. Abrir SQL Editor
# 2. Colar conteúdo de supabase-schema.sql
# 3. Executar

# Ou via CLI
supabase db push
```

---

## 📈 Escalabilidade

### Índices de Performance

```sql
CREATE INDEX idx_messages_organization_client ON messages(organization_id, client_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_contacts_organization_phone ON contacts(organization_id, phone);
CREATE INDEX idx_automations_organization_active ON chat_automations(organization_id, is_active);
```

### Paginação

- Mensagens: 50 por página (lazy loading)
- Conversas: 100 por página
- Histórico: 30 por página

### Cache

- Realtime Supabase para updates instantâneos
- React Query para client-side caching
- Edge Function cache headers

---

## 🎯 Casos de Uso

### 1. Atendimento ao Cliente

```
Cliente envia mensagem WhatsApp
  → webhook-receiver recebe
  → Cria contato/lead
  → Automação responde com IA
  → Agente humano vê em Omni Inbox
  → Responde manualmente
  → Histórico completo salvo
```

### 2. Prospecção Automática

```
Agente IA configurado
  → Busca leads em funil
  → Envia mensagens personalizadas
  → Aguarda resposta
  → Automação qualifica
  → Move para próxima etapa
  → Notifica agente humano
```

### 3. Fluxo Conversacional

```
Cliente inicia conversa
  → Fluxo visual acionado
  → Nó 1: Boas-vindas
  → Nó 2: Decisão (qual produto?)
  → Nó 3: Informações
  → Nó 4: Qualificação
  → Nó 5: Transição para agente
```

---

## 📦 Estrutura de Arquivos

```
src/components/admin/OmniFlow/
├── Integrations.tsx           # Hub com 9 abas
├── Inbox.tsx                  # Layout 3 colunas
├── tabs/
│   ├── WhatsAppConfigTab.tsx
│   ├── ChatAutomationsTab.tsx
│   ├── AgentLibraryTab.tsx
│   ├── ConversationFlowsTab.tsx
│   ├── AIProviderSettings.tsx
│   └── WebhooksTab.tsx
└── inbox/
    ├── useInbox.tsx           # Hook central
    ├── ConversationList.tsx    # Coluna 1
    ├── ChatArea.tsx            # Coluna 2
    └── ChatSidebar.tsx         # Coluna 3

supabase/
├── functions/
│   ├── webhook-receiver/
│   ├── send-whatsapp/
│   ├── ai-proxy/
│   └── _shared/cors.ts
└── schema.sql                 # Schema completo
```

---

## 🚀 Próximos Passos

1. **Notificações Push**: Alertar proprietários sobre novas mensagens
2. **Transcrição de Áudio**: Converter áudio para texto pesquisável
3. **Armazenamento de Mídia**: Upload seguro de imagens/vídeos/documentos
4. **Analytics**: Dashboard com métricas de conversas e automações
5. **Integrações Adicionais**: Zapier, Make, n8n
6. **Mobile App**: React Native para iOS/Android

---

## 📚 Referências

- [Supabase Docs](https://supabase.com/docs)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)
- [shadcn/ui](https://ui.shadcn.com)

---

**Versão:** 1.0.0  
**Data:** 2026-03-27  
**Arquiteto:** Omni Flow Team
