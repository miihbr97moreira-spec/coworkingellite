/**
 * Serviço para gerenciar fluxos de automação
 * Responsável por criar, atualizar, executar e monitorar fluxos
 */

import { supabase } from '@/integrations/supabase/client';
import {
  AutomationFlow,
  FlowExecution,
  ExecutionLog,
  Trigger,
  Action,
  TriggerType,
  ActionType,
} from '@/types/omniflow';
import axios from 'axios';

export class FlowService {
  /**
   * Criar novo fluxo de automação
   */
  static async createFlow(
    tenantId: string,
    name: string,
    description?: string
  ): Promise<AutomationFlow> {
    const { data, error } = await supabase
      .from('automation_flows' as any)
      .insert({
        name,
        description,
        tenant_id: tenantId,
        nodes: [],
        edges: [],
        enabled: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as any;
  }

  /**
   * Atualizar fluxo existente
   */
  static async updateFlow(
    flowId: string,
    updates: Partial<AutomationFlow>
  ): Promise<AutomationFlow> {
    const { data, error } = await supabase
      .from('automation_flows' as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', flowId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Obter fluxo por ID
   */
  static async getFlow(flowId: string): Promise<AutomationFlow> {
    const { data, error } = await supabase
      .from('automation_flows' as any)
      .select('*')
      .eq('id', flowId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Listar fluxos de um tenant
   */
  static async listFlows(tenantId: string): Promise<AutomationFlow[]> {
    const { data, error } = await supabase
      .from('automation_flows' as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Deletar fluxo
   */
  static async deleteFlow(flowId: string): Promise<void> {
    const { error } = await supabase
      .from('automation_flows' as any)
      .delete()
      .eq('id', flowId);

    if (error) throw error;
  }

  /**
   * Executar fluxo manualmente
   */
  static async executeFlow(
    flowId: string,
    leadData: Record<string, any>,
    triggerId?: string
  ): Promise<FlowExecution> {
    const flow = await this.getFlow(flowId);

    const execution: FlowExecution = {
      id: `exec_${Date.now()}`,
      flowId,
      triggerId: triggerId || 'manual',
      status: 'running',
      startedAt: new Date().toISOString(),
      executedActions: [],
      leadData,
    };

    try {
      // Executar ações em sequência
      for (const node of flow.nodes) {
        if (node.type === 'action') {
          const action = node.data as Action;
          try {
            const result = await this.executeAction(action, leadData);
            execution.executedActions.push({
              actionId: action.id,
              status: 'success',
              result,
            });
          } catch (error) {
            execution.executedActions.push({
              actionId: action.id,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }

      execution.status = 'success';
      execution.completedAt = new Date().toISOString();

      // Registrar execução
      await this.logExecution(execution);

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date().toISOString();
      await this.logExecution(execution);
      throw error;
    }
  }

  /**
   * Executar ação individual
   */
  static async executeAction(
    action: Action,
    leadData: Record<string, any>
  ): Promise<any> {
    switch (action.type) {
      case 'whatsapp_message':
        return await this.executeWhatsAppAction(action, leadData);
      case 'ai_agent':
        return await this.executeAIAgentAction(action, leadData);
      case 'crm_update':
        return await this.executeCRMUpdateAction(action, leadData);
      case 'email':
        return await this.executeEmailAction(action, leadData);
      case 'webhook_call':
        return await this.executeWebhookAction(action, leadData);
      case 'delay':
        return await this.executeDelayAction(action);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Executar ação WhatsApp
   */
  private static async executeWhatsAppAction(
    action: any,
    leadData: Record<string, any>
  ): Promise<any> {
    const { phoneField, messageTemplate, mediaUrl } = action.config;
    const phone = leadData[phoneField];

    if (!phone) throw new Error(`Phone field "${phoneField}" not found in lead data`);

    // Substituir variáveis no template
    let message = messageTemplate;
    Object.entries(leadData).forEach(([key, value]) => {
      message = message.replace(`{{${key}}}`, String(value));
    });

    // Enviar via WhatsApp (integração com Zapier/ZAPI)
    const { data: whatsappConfig } = await supabase
      .from('whatsapp_configs' as any)
      .select('*')
      .limit(1)
      .single();

    if (!whatsappConfig) throw new Error('WhatsApp not configured');

    // Aqui você integraria com a API do seu provedor de WhatsApp
    console.log('Sending WhatsApp message:', { phone, message, mediaUrl });

    return {
      success: true,
      message: 'WhatsApp message queued',
      phone,
    };
  }

  /**
   * Executar ação Agente IA
   */
  private static async executeAIAgentAction(
    action: any,
    leadData: Record<string, any>
  ): Promise<any> {
    const { agentId, prompt, model = 'gpt-4.1-mini', temperature = 0.7 } = action.config;

    // Preparar contexto do lead
    const context = `Lead Data:\n${JSON.stringify(leadData, null, 2)}\n\nPrompt:\n${prompt}`;

    try {
      // Chamar API de IA (OpenAI ou similar)
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant for lead management and customer engagement.',
            },
            {
              role: 'user',
              content: context,
            },
          ],
          temperature,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        agentId,
        response: response.data.choices[0].message.content,
      };
    } catch (error) {
      throw new Error(`AI Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Executar ação de atualização no CRM
   */
  private static async executeCRMUpdateAction(
    action: any,
    leadData: Record<string, any>
  ): Promise<any> {
    const { leadId, stage, fields, tags } = action.config;

    // Atualizar lead no CRM
    const { data, error } = await supabase
      .from('crm_leads' as any)
      .update({
        stage,
        ...fields,
        tags: tags ? [...(leadData.tags || []), ...tags] : leadData.tags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      leadId,
      stage,
      updatedFields: fields,
    };
  }

  /**
   * Executar ação de email
   */
  private static async executeEmailAction(
    action: any,
    leadData: Record<string, any>
  ): Promise<any> {
    const { emailField, subject, template } = action.config;
    const email = leadData[emailField];

    if (!email) throw new Error(`Email field "${emailField}" not found in lead data`);

    // Substituir variáveis no template
    let body = template;
    Object.entries(leadData).forEach(([key, value]) => {
      body = body.replace(`{{${key}}}`, String(value));
    });

    // Enviar email (integração com SendGrid, Mailgun, etc.)
    console.log('Sending email:', { email, subject, body });

    return {
      success: true,
      email,
      subject,
    };
  }

  /**
   * Executar ação de webhook
   */
  private static async executeWebhookAction(
    action: any,
    leadData: Record<string, any>
  ): Promise<any> {
    const { webhookUrl, method = 'POST', headers = {}, body } = action.config;

    try {
      const response = await axios({
        method,
        url: webhookUrl,
        headers,
        data: body ? { ...body, leadData } : { leadData },
      });

      return {
        success: true,
        webhookUrl,
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      throw new Error(`Webhook execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Executar ação de delay
   */
  private static async executeDelayAction(action: any): Promise<any> {
    const { delayMs, delayType } = action.config;

    let ms = delayMs;
    if (delayType === 'seconds') ms *= 1000;
    if (delayType === 'minutes') ms *= 60000;
    if (delayType === 'hours') ms *= 3600000;

    await new Promise((resolve) => setTimeout(resolve, ms));

    return {
      success: true,
      delayMs: ms,
    };
  }

  /**
   * Registrar execução de fluxo
   */
  static async logExecution(execution: FlowExecution): Promise<void> {
    const { error } = await supabase
      .from('flow_executions' as any)
      .insert({
        flow_id: execution.flowId,
        trigger_id: execution.triggerId,
        status: execution.status,
        started_at: execution.startedAt,
        completed_at: execution.completedAt,
        executed_actions: execution.executedActions,
        lead_data: execution.leadData,
      });

    if (error) throw error;
  }

  /**
   * Obter histórico de execuções
   */
  static async getExecutionHistory(
    flowId: string,
    limit: number = 50
  ): Promise<ExecutionLog[]> {
    const { data, error } = await supabase
      .from('flow_executions' as any)
      .select('*')
      .eq('flow_id', flowId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Obter estatísticas de fluxo
   */
  static async getFlowStats(flowId: string): Promise<any> {
    const { data, error } = await supabase
      .from('flow_executions' as any)
      .select('status')
      .eq('flow_id', flowId);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      success: data?.filter((d: any) => d.status === 'success').length || 0,
      failed: data?.filter((d: any) => d.status === 'failed').length || 0,
      pending: data?.filter((d: any) => d.status === 'pending').length || 0,
    };

    return {
      ...stats,
      successRate: stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(2) : 0,
    };
  }
}
