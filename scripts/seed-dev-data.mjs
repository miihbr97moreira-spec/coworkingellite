#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Dados de exemplo
const seedData = {
  // Organização
  organization: {
    name: "Empresa Teste",
    slug: "empresa-teste-" + Date.now(),
    owner_id: "00000000-0000-0000-0000-000000000000", // Será substituído
  },

  // Contatos
  contacts: [
    {
      phone: "5511999999999",
      name: "João Silva",
      email: "joao@example.com",
      company: "Tech Solutions",
      behavior_tag: "Gold",
    },
    {
      phone: "5511988888888",
      name: "Maria Santos",
      email: "maria@example.com",
      company: "Digital Agency",
      behavior_tag: "Silver",
    },
    {
      phone: "5511977777777",
      name: "Pedro Oliveira",
      email: "pedro@example.com",
      company: "Startup XYZ",
      behavior_tag: "Bronze",
    },
    {
      phone: "5511966666666",
      name: "Ana Costa",
      email: "ana@example.com",
      company: "E-commerce Pro",
      behavior_tag: "VIP",
    },
  ],

  // Mensagens
  messages: [
    {
      sender_phone: "5511999999999",
      sender_name: "João Silva",
      content: "Olá! Gostaria de saber mais sobre seus serviços.",
      direction: "inbound",
      status: "received",
      is_group: false,
    },
    {
      sender_phone: "5511999999999",
      sender_name: "Sistema",
      content: "Obrigado por entrar em contato! Como posso ajudá-lo?",
      direction: "outbound",
      status: "delivered",
      is_group: false,
    },
    {
      sender_phone: "5511988888888",
      sender_name: "Maria Santos",
      content: "Qual é o valor da consultoria?",
      direction: "inbound",
      status: "read",
      is_group: false,
    },
    {
      sender_phone: "5511977777777",
      sender_name: "Pedro Oliveira",
      content: "Preciso de uma solução urgente",
      direction: "inbound",
      status: "received",
      is_group: false,
    },
  ],

  // Configuração WhatsApp
  whatsappConfig: {
    api_type: "z-api",
    base_url: "https://api.z-api.io",
    api_token: "sk_test_abc123def456",
    instance_id: "instance-123",
    auto_create_lead: true,
    is_active: true,
  },

  // Automações
  automations: [
    {
      name: "Resposta Automática - Primeira Mensagem",
      description: "Responde automaticamente à primeira mensagem",
      trigger_type: "first_message",
      priority: 10,
      is_active: true,
      actions: {
        type: "send_message",
        message: "Olá! Obrigado por entrar em contato. Em breve um agente responderá.",
      },
    },
    {
      name: "Qualificação por Palavra-chave",
      description: "Qualifica leads por palavra-chave",
      trigger_type: "keyword",
      priority: 5,
      is_active: true,
      actions: {
        type: "add_tag",
        tag: "Qualificado",
      },
    },
    {
      name: "Escalação para Agente",
      description: "Escalona para agente humano após 3 mensagens",
      trigger_type: "message_count",
      priority: 1,
      is_active: true,
      actions: {
        type: "escalate",
        message: "Transferindo para um agente especializado...",
      },
    },
  ],

  // Agentes IA
  agents: [
    {
      agent_name: "Assistente de Vendas",
      agent_type: "prospeccao",
      agent_personality: "Profissional, amigável e persuasivo",
      agent_style: "Consultivo",
      agent_tone: "Formal mas acessível",
      prompt: "Você é um assistente de vendas especializado em soluções B2B. Seu objetivo é qualificar leads e agendar demonstrações.",
      is_active: true,
    },
    {
      agent_name: "Suporte Técnico",
      agent_type: "atendimento",
      agent_personality: "Paciente, detalhista e solucionador",
      agent_style: "Técnico",
      agent_tone: "Profissional e prestativo",
      prompt: "Você é um especialista em suporte técnico. Ajude os clientes a resolver problemas com paciência e clareza.",
      is_active: true,
    },
  ],

  // Fluxos Conversacionais
  flows: [
    {
      name: "Fluxo de Boas-vindas",
      description: "Fluxo inicial para novos contatos",
      template_type: "welcome",
      is_active: true,
    },
    {
      name: "Fluxo de Qualificação",
      description: "Qualifica leads através de perguntas",
      template_type: "qualification",
      is_active: true,
    },
  ],

  // API Keys
  apiKeys: [
    {
      name: "Webhook Z-API",
      key_preview: "sk_test_***",
      is_active: true,
    },
    {
      name: "Integração Evolution",
      key_preview: "sk_live_***",
      is_active: true,
    },
  ],

  // Provedores IA
  aiProviders: [
    {
      provider_name: "groq",
      model_name: "llama-3.3-70b-versatile",
      api_key: "gsk_test_abc123",
      is_default: true,
      is_active: true,
    },
    {
      provider_name: "openai",
      model_name: "gpt-4o-mini",
      api_key: "sk_test_abc123",
      is_default: false,
      is_active: true,
    },
  ],
};

async function seedDatabase() {
  try {
    console.log("🌱 Iniciando seed de dados...\n");

    // 1. Criar organização
    console.log("📦 Criando organização...");
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert([seedData.organization])
      .select()
      .single();

    if (orgError) {
      console.error("❌ Erro ao criar organização:", orgError);
      return;
    }

    console.log("✅ Organização criada:", org.id);
    const organizationId = org.id;

    // 2. Criar contatos
    console.log("\n👥 Criando contatos...");
    const contactsToInsert = seedData.contacts.map((c) => ({
      ...c,
      organization_id: organizationId,
    }));

    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .insert(contactsToInsert)
      .select();

    if (contactsError) {
      console.error("❌ Erro ao criar contatos:", contactsError);
      return;
    }

    console.log(`✅ ${contacts.length} contatos criados`);

    // 3. Criar mensagens
    console.log("\n💬 Criando mensagens...");
    const messagesToInsert = seedData.messages.map((m, idx) => ({
      ...m,
      organization_id: organizationId,
      client_id: contacts[idx % contacts.length].id,
      external_message_id: `msg-${Date.now()}-${idx}`,
    }));

    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .insert(messagesToInsert)
      .select();

    if (messagesError) {
      console.error("❌ Erro ao criar mensagens:", messagesError);
      return;
    }

    console.log(`✅ ${messages.length} mensagens criadas`);

    // 4. Criar configuração WhatsApp
    console.log("\n📱 Criando configuração WhatsApp...");
    const { data: whatsapp, error: whatsappError } = await supabase
      .from("whatsapp_configs")
      .insert([{ ...seedData.whatsappConfig, organization_id: organizationId }])
      .select()
      .single();

    if (whatsappError) {
      console.error("❌ Erro ao criar config WhatsApp:", whatsappError);
      return;
    }

    console.log("✅ Configuração WhatsApp criada");

    // 5. Criar automações
    console.log("\n⚙️ Criando automações...");
    const automationsToInsert = seedData.automations.map((a) => ({
      ...a,
      organization_id: organizationId,
    }));

    const { data: automations, error: automationsError } = await supabase
      .from("chat_automations")
      .insert(automationsToInsert)
      .select();

    if (automationsError) {
      console.error("❌ Erro ao criar automações:", automationsError);
      return;
    }

    console.log(`✅ ${automations.length} automações criadas`);

    // 6. Criar agentes IA
    console.log("\n🤖 Criando agentes IA...");
    const agentsToInsert = seedData.agents.map((a) => ({
      ...a,
      organization_id: organizationId,
    }));

    const { data: agents, error: agentsError } = await supabase
      .from("prospecting_campaigns")
      .insert(agentsToInsert)
      .select();

    if (agentsError) {
      console.error("❌ Erro ao criar agentes:", agentsError);
      return;
    }

    console.log(`✅ ${agents.length} agentes criados`);

    // 7. Criar fluxos
    console.log("\n🔄 Criando fluxos conversacionais...");
    const flowsToInsert = seedData.flows.map((f) => ({
      ...f,
      organization_id: organizationId,
    }));

    const { data: flows, error: flowsError } = await supabase
      .from("conversation_flows")
      .insert(flowsToInsert)
      .select();

    if (flowsError) {
      console.error("❌ Erro ao criar fluxos:", flowsError);
      return;
    }

    console.log(`✅ ${flows.length} fluxos criados`);

    // 8. Criar provedores IA
    console.log("\n🧠 Criando provedores IA...");
    const aiProvidersToInsert = seedData.aiProviders.map((p) => ({
      ...p,
      organization_id: organizationId,
    }));

    const { data: aiProviders, error: aiError } = await supabase
      .from("ai_provider_configs")
      .insert(aiProvidersToInsert)
      .select();

    if (aiError) {
      console.error("❌ Erro ao criar provedores IA:", aiError);
      return;
    }

    console.log(`✅ ${aiProviders.length} provedores IA criados`);

    // 9. Criar leads
    console.log("\n🎯 Criando leads...");
    const leadsToInsert = contacts.map((c, idx) => ({
      organization_id: organizationId,
      contact_id: c.id,
      status: idx === 0 ? "qualificado" : idx === 1 ? "em_negociacao" : "novo",
      source: "whatsapp",
    }));

    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .insert(leadsToInsert)
      .select();

    if (leadsError) {
      console.error("❌ Erro ao criar leads:", leadsError);
      return;
    }

    console.log(`✅ ${leads.length} leads criados`);

    // Resumo
    console.log("\n" + "=".repeat(50));
    console.log("✨ SEED CONCLUÍDO COM SUCESSO!");
    console.log("=".repeat(50));
    console.log(`
📊 Dados criados:
  • 1 Organização
  • ${contacts.length} Contatos
  • ${messages.length} Mensagens
  • 1 Configuração WhatsApp
  • ${automations.length} Automações
  • ${agents.length} Agentes IA
  • ${flows.length} Fluxos Conversacionais
  • ${aiProviders.length} Provedores IA
  • ${leads.length} Leads

🔗 Organization ID: ${organizationId}

Próximos passos:
  1. Usar o Organization ID para fazer login
  2. Testar webhooks com dados de exemplo
  3. Verificar automações e fluxos no dashboard
    `);
  } catch (error) {
    console.error("❌ Erro geral:", error);
    process.exit(1);
  }
}

// Executar seed
seedDatabase();
