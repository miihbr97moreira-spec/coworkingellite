# Omni Flow - Documentação de API Completa

## 📋 Visão Geral

Este documento descreve todas as Edge Functions disponíveis no Omni Flow com exemplos de requisição, resposta e tratamento de erros.

---

## 🔐 Autenticação

Todas as requisições devem incluir um dos seguintes headers:

### Opção 1: Bearer Token (Supabase Auth)
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Opção 2: API Key (Webhooks)
```
?api_key=sk_live_abc123def456...
```

---

## 📡 Edge Functions

### 1. webhook-receiver

**Descrição:** Recebe mensagens de provedores WhatsApp, normaliza, deduplica e aciona automações.

**Endpoint:** `POST /functions/v1/webhook-receiver`

**Query Parameters:**
- `api_key` (obrigatório): Chave de API válida
- `provider` (opcional): Tipo de provedor (`z-api`, `evolution`, etc). Padrão: `z-api`

**Request Body (Z-API):**
```json
{
  "phone": "5511999999999",
  "text": "Olá, tudo bem?",
  "fromMe": false,
  "timestamp": 1711612800,
  "messageId": "msg-123456",
  "senderName": "João Silva",
  "groupJid": null
}
```

**Request Body (Evolution):**
```json
{
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "msg-789012"
    },
    "message": {
      "conversation": "Olá, tudo bem?"
    },
    "messageTimestamp": 1711612800,
    "pushName": "João Silva"
  }
}
```

**Response (Sucesso):**
```json
{
  "status": "success",
  "message_id": "msg-uuid-123",
  "contact_id": "contact-uuid-456",
  "lead_created": true,
  "automations_triggered": 2
}
```

**Response (Duplicado):**
```json
{
  "status": "duplicate",
  "message": "Mensagem já foi processada"
}
```

**Response (Erro):**
```json
{
  "error": "Invalid API key",
  "status": 401
}
```

**Status Codes:**
- `200`: Mensagem processada com sucesso
- `400`: Payload inválido
- `401`: API key inválida ou ausente
- `500`: Erro interno do servidor

**Exemplo cURL:**
```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/webhook-receiver?api_key=sk_live_abc123&provider=z-api' \
  -H 'Content-Type: application/json' \
  -d '{
    "phone": "5511999999999",
    "text": "Olá",
    "fromMe": false,
    "timestamp": 1711612800,
    "messageId": "msg-123"
  }'
```

---

### 2. send-whatsapp

**Descrição:** Envia mensagens WhatsApp através do provedor configurado.

**Endpoint:** `POST /functions/v1/send-whatsapp`

**Headers Obrigatórios:**
```
Authorization: Bearer {user_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "5511999999999",
  "content": "Olá! Como posso ajudá-lo?",
  "media_url": "https://example.com/image.jpg",
  "media_type": "image/jpeg"
}
```

**Response (Sucesso):**
```json
{
  "status": "success",
  "external_sent": true,
  "external_id": "msg-provider-123",
  "timestamp": "2026-03-27T18:30:00Z"
}
```

**Response (Erro):**
```json
{
  "error": "WhatsApp não configurado para esta organização",
  "status": 404
}
```

**Status Codes:**
- `200`: Mensagem enviada com sucesso
- `400`: Parâmetros obrigatórios faltando
- `401`: Não autenticado
- `404`: Organização ou configuração não encontrada
- `500`: Erro ao enviar via provedor

**Parâmetros Suportados:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| phone | string | Sim | Telefone do destinatário (com código do país) |
| content | string | Sim | Conteúdo da mensagem (máx 4096 caracteres) |
| media_url | string | Não | URL da mídia (imagem, áudio, vídeo, documento) |
| media_type | string | Não | Tipo MIME da mídia |

**Exemplo cURL:**
```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/send-whatsapp' \
  -H 'Authorization: Bearer eyJhbGc...' \
  -H 'Content-Type: application/json' \
  -d '{
    "phone": "5511999999999",
    "content": "Olá! Como posso ajudá-lo?"
  }'
```

---

### 3. ai-proxy

**Descrição:** Proxy centralizado para múltiplos LLMs (Groq, OpenAI, Gemini) com suporte a streaming.

**Endpoint:** `POST /functions/v1/ai-proxy`

**Headers Obrigatórios:**
```
Authorization: Bearer {user_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "messages": [
    {
      "role": "system",
      "content": "Você é um assistente de atendimento ao cliente."
    },
    {
      "role": "user",
      "content": "Qual é o horário de funcionamento?"
    }
  ],
  "provider": "groq",
  "model": "llama-3.3-70b-versatile",
  "temperature": 0.7,
  "max_tokens": 1024,
  "stream": false
}
```

**Response (Sucesso - Sem Streaming):**
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Nosso horário de funcionamento é de segunda a sexta, das 9h às 18h."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 45,
    "completion_tokens": 28,
    "total_tokens": 73
  }
}
```

**Response (Streaming):**
```
data: {"choices":[{"delta":{"content":"Nosso"}}]}
data: {"choices":[{"delta":{"content":" horário"}}]}
data: {"choices":[{"delta":{"content":" de"}}]}
...
data: [DONE]
```

**Provedores Suportados:**

| Provedor | Modelos Disponíveis | Notas |
|----------|-------------------|-------|
| Groq | llama-3.3-70b-versatile, mixtral-8x7b, gemma-7b | Mais rápido, ideal para latência baixa |
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4-turbo | Mais poderoso, melhor qualidade |
| Gemini | gemini-2.0-flash, gemini-pro, gemini-pro-vision | Multimodal, suporta imagens |

**Parâmetros:**

| Campo | Tipo | Obrigatório | Padrão | Descrição |
|-------|------|-------------|--------|-----------|
| messages | array | Sim | - | Array de mensagens (role + content) |
| provider | string | Não | groq | Provedor LLM |
| model | string | Não | Padrão do provedor | Modelo específico |
| temperature | number | Não | 0.7 | Criatividade (0-2) |
| max_tokens | number | Não | 1024 | Máximo de tokens na resposta |
| stream | boolean | Não | false | Habilitar streaming SSE |

**Status Codes:**
- `200`: Resposta gerada com sucesso
- `400`: Parâmetros inválidos
- `401`: Não autenticado
- `404`: Provedor não configurado
- `429`: Rate limit excedido
- `500`: Erro ao chamar LLM

**Exemplo cURL (Sem Streaming):**
```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/ai-proxy' \
  -H 'Authorization: Bearer eyJhbGc...' \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [
      {"role": "user", "content": "Qual é o melhor produto para iniciantes?"}
    ],
    "provider": "groq",
    "stream": false
  }'
```

**Exemplo cURL (Com Streaming):**
```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/ai-proxy' \
  -H 'Authorization: Bearer eyJhbGc...' \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [
      {"role": "user", "content": "Explique inteligência artificial"}
    ],
    "provider": "openai",
    "stream": true
  }' \
  -N
```

---

### 4. transcribe-audio

**Descrição:** Transcreve áudio para texto usando Whisper API.

**Endpoint:** `POST /functions/v1/transcribe-audio`

**Headers Obrigatórios:**
```
Authorization: Bearer {user_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "message_id": "msg-uuid-123",
  "audio_url": "https://storage.example.com/audio/msg-123.mp3",
  "language": "pt"
}
```

**Response (Sucesso):**
```json
{
  "status": "success",
  "transcription": "Olá, gostaria de saber mais sobre seus produtos.",
  "language": "pt",
  "confidence": 0.95
}
```

**Response (Erro):**
```json
{
  "error": "Arquivo de áudio não encontrado",
  "status": 404
}
```

**Status Codes:**
- `200`: Transcrição realizada com sucesso
- `400`: Parâmetros obrigatórios faltando
- `401`: Não autenticado
- `404`: Mensagem ou áudio não encontrado
- `413`: Arquivo excede 16MB
- `500`: Erro ao transcrever

**Idiomas Suportados:** pt, en, es, fr, de, it, ja, zh, etc (ISO 639-1)

**Exemplo cURL:**
```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/transcribe-audio' \
  -H 'Authorization: Bearer eyJhbGc...' \
  -H 'Content-Type: application/json' \
  -d '{
    "message_id": "msg-uuid-123",
    "audio_url": "https://storage.example.com/audio/msg-123.mp3",
    "language": "pt"
  }'
```

---

### 5. upload-media

**Descrição:** Upload seguro de mídia com validação e armazenamento em Supabase Storage.

**Endpoint:** `POST /functions/v1/upload-media`

**Headers Obrigatórios:**
```
Authorization: Bearer {user_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "organization_id": "org-uuid-123",
  "message_id": "msg-uuid-456",
  "file_name": "documento.pdf",
  "file_data": "JVBERi0xLjQKJeLjz9MNCjEgMCBvYmo...",
  "media_type": "application/pdf"
}
```

**Response (Sucesso):**
```json
{
  "status": "success",
  "file_id": "file-uuid-789",
  "file_name": "documento.pdf",
  "public_url": "https://storage.supabase.co/omni-flow-media/org-123/timestamp-random-documento.pdf",
  "media_type": "application/pdf",
  "file_size": 245632
}
```

**Response (Erro):**
```json
{
  "error": "Tipo de mídia não suportado: application/exe",
  "status": 400
}
```

**Tipos de Mídia Suportados:**

| Categoria | Tipos |
|-----------|-------|
| Imagens | image/jpeg, image/png, image/webp, image/gif |
| Áudio | audio/mpeg, audio/wav, audio/ogg |
| Vídeo | video/mp4, video/webm |
| Documentos | application/pdf, application/msword, application/vnd.ms-excel |

**Limitações:**
- Tamanho máximo: 50MB
- Formatos suportados: 14 tipos MIME

**Status Codes:**
- `200`: Upload realizado com sucesso
- `400`: Tipo de mídia não suportado
- `401`: Não autenticado
- `413`: Arquivo excede 50MB
- `500`: Erro ao fazer upload

**Exemplo cURL:**
```bash
# Converter arquivo para base64
base64 -w 0 documento.pdf > documento.b64

curl -X POST \
  'https://your-project.supabase.co/functions/v1/upload-media' \
  -H 'Authorization: Bearer eyJhbGc...' \
  -H 'Content-Type: application/json' \
  -d '{
    "organization_id": "org-uuid-123",
    "message_id": "msg-uuid-456",
    "file_name": "documento.pdf",
    "file_data": "'$(cat documento.b64)'",
    "media_type": "application/pdf"
  }'
```

---

### 6. notify-owner

**Descrição:** Envia notificações ao proprietário via email, SMS ou push.

**Endpoint:** `POST /functions/v1/notify-owner`

**Headers Obrigatórios:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "organization_id": "org-uuid-123",
  "event_type": "lead_created",
  "title": "Novo Lead Criado",
  "content": "Um novo lead foi criado a partir de uma mensagem WhatsApp.",
  "channels": ["email", "push"],
  "data": {
    "lead_id": "lead-uuid-789",
    "link": "https://app.omniflow.com/leads/lead-uuid-789"
  }
}
```

**Response (Sucesso):**
```json
{
  "status": "success",
  "results": {
    "email": true,
    "sms": false,
    "push": true
  }
}
```

**Canais Disponíveis:**

| Canal | Requisito | Descrição |
|-------|-----------|-----------|
| email | Email do usuário | Envia via Resend |
| sms | Telefone do usuário | Envia via Twilio |
| push | Supabase Realtime | Notificação em tempo real |

**Tipos de Evento:**

| Evento | Descrição |
|--------|-----------|
| message_received | Nova mensagem recebida |
| lead_created | Novo lead criado |
| automation_triggered | Automação acionada |
| automation_failed | Automação falhou |
| agent_response | Resposta do agente IA |

**Status Codes:**
- `200`: Notificação enviada com sucesso
- `400`: Parâmetros obrigatórios faltando
- `404`: Organização ou usuário não encontrado
- `500`: Erro ao enviar notificação

**Exemplo cURL:**
```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/notify-owner' \
  -H 'Content-Type: application/json' \
  -d '{
    "organization_id": "org-uuid-123",
    "event_type": "lead_created",
    "title": "Novo Lead Criado",
    "content": "Um novo lead foi criado.",
    "channels": ["email", "push"]
  }'
```

---

## 🔄 Fluxos de Integração

### Fluxo 1: Receber Mensagem → Processar → Responder

```
1. Provedor WhatsApp envia webhook
   ↓
2. webhook-receiver normaliza e valida
   ↓
3. Contato é criado/atualizado
   ↓
4. Lead é criado (se configurado)
   ↓
5. Automações são acionadas
   ↓
6. ai-proxy gera resposta (se necessário)
   ↓
7. send-whatsapp envia resposta
   ↓
8. notify-owner alerta proprietário
```

### Fluxo 2: Upload de Mídia

```
1. Usuário seleciona arquivo
   ↓
2. Frontend converte para base64
   ↓
3. upload-media valida e armazena
   ↓
4. URL pública é retornada
   ↓
5. Mídia é anexada à mensagem
```

### Fluxo 3: Transcrição de Áudio

```
1. Mensagem com áudio chega
   ↓
2. transcribe-audio processa
   ↓
3. Texto é salvo na mensagem
   ↓
4. Automações podem usar texto
```

---

## ⚠️ Tratamento de Erros

### Padrão de Erro Padrão

```json
{
  "error": "Descrição do erro",
  "status": 400,
  "details": {
    "field": "phone",
    "message": "Formato inválido"
  }
}
```

### Códigos de Erro Comuns

| Código | Significado | Ação |
|--------|------------|------|
| 400 | Bad Request | Verificar parâmetros |
| 401 | Unauthorized | Verificar autenticação |
| 404 | Not Found | Recurso não existe |
| 429 | Too Many Requests | Aguardar e tentar novamente |
| 500 | Internal Server Error | Contatar suporte |

---

## 🔒 Segurança

### Rate Limiting

- **webhook-receiver**: 1000 requisições/minuto por API key
- **send-whatsapp**: 100 requisições/minuto por usuário
- **ai-proxy**: 50 requisições/minuto por usuário
- **upload-media**: 10 uploads/minuto por usuário

### Validação

- Todas as requisições são validadas contra schema
- API keys são hasheadas com SHA-256
- Tokens JWT são validados em cada requisição
- CORS é restrito a domínios autorizados

### Criptografia

- Conexões HTTPS obrigatórias
- API tokens armazenados encriptados
- Dados sensíveis nunca são logados

---

## 📊 Monitoramento

### Logs

Todos os eventos são registrados em `webhook_logs` com:
- Timestamp
- Event type
- Status (success/error)
- Payload completo
- Response

### Métricas

- Requisições por minuto
- Taxa de sucesso
- Tempo médio de resposta
- Erros por tipo

---

## 🧪 Testes

### Testar webhook-receiver

```bash
# Z-API
curl -X POST \
  'http://localhost:54321/functions/v1/webhook-receiver?api_key=test&provider=z-api' \
  -H 'Content-Type: application/json' \
  -d '{
    "phone": "5511999999999",
    "text": "Teste",
    "fromMe": false,
    "timestamp": '$(date +%s)',
    "messageId": "test-'$(date +%s%N)'"
  }'
```

### Testar send-whatsapp

```bash
curl -X POST \
  'http://localhost:54321/functions/v1/send-whatsapp' \
  -H 'Authorization: Bearer test-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "phone": "5511999999999",
    "content": "Teste de envio"
  }'
```

### Testar ai-proxy

```bash
curl -X POST \
  'http://localhost:54321/functions/v1/ai-proxy' \
  -H 'Authorization: Bearer test-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [
      {"role": "user", "content": "Olá"}
    ],
    "provider": "groq"
  }'
```

---

## 📚 Referências

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [OpenAI API](https://platform.openai.com/docs)
- [Groq API](https://console.groq.com/docs)
- [Google Gemini API](https://ai.google.dev)
- [Whisper API](https://platform.openai.com/docs/guides/speech-to-text)

---

**Versão:** 1.0.0  
**Data:** 2026-03-27  
**Última Atualização:** 2026-03-27
