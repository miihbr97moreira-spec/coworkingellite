/**
 * Tipos e interfaces para o Omni Flow Hub
 * Define estruturas para gatilhos, ações e fluxos de automação
 */

// Tipos de Gatilhos (Triggers)
export type TriggerType = 'lead_moved' | 'webhook_received' | 'form_submitted' | 'payment_received' | 'manual_trigger';

export interface Trigger {
  id: string;
  type: TriggerType;
  name: string;
  description: string;
  config: Record<string, any>;
  enabled: boolean;
}

export interface LeadMovedTrigger extends Trigger {
  type: 'lead_moved';
  config: {
    fromStage?: string;
    toStage: string;
    leadSource?: string;
  };
}

export interface WebhookReceivedTrigger extends Trigger {
  type: 'webhook_received';
  config: {
    webhookUrl: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    eventType: string;
  };
}

export interface FormSubmittedTrigger extends Trigger {
  type: 'form_submitted';
  config: {
    formId: string;
    formName: string;
  };
}

export interface PaymentReceivedTrigger extends Trigger {
  type: 'payment_received';
  config: {
    minAmount?: number;
    maxAmount?: number;
    paymentMethod?: string;
  };
}

// Tipos de Ações (Actions)
export type ActionType = 'whatsapp_message' | 'ai_agent' | 'crm_update' | 'email' | 'webhook_call' | 'delay';

export interface Action {
  id: string;
  type: ActionType;
  name: string;
  description: string;
  config: Record<string, any>;
  enabled: boolean;
}

export interface WhatsAppAction extends Action {
  type: 'whatsapp_message';
  config: {
    phoneField: string;
    messageTemplate: string;
    variables?: Record<string, string>;
    mediaUrl?: string;
  };
}

export interface AIAgentAction extends Action {
  type: 'ai_agent';
  config: {
    agentId: string;
    agentName: string;
    prompt: string;
    model?: string;
    temperature?: number;
  };
}

export interface CRMUpdateAction extends Action {
  type: 'crm_update';
  config: {
    leadId: string;
    stage: string;
    fields: Record<string, any>;
    tags?: string[];
  };
}

export interface EmailAction extends Action {
  type: 'email';
  config: {
    emailField: string;
    subject: string;
    template: string;
    variables?: Record<string, string>;
  };
}

export interface WebhookCallAction extends Action {
  type: 'webhook_call';
  config: {
    webhookUrl: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: Record<string, any>;
  };
}

export interface DelayAction extends Action {
  type: 'delay';
  config: {
    delayMs: number;
    delayType: 'milliseconds' | 'seconds' | 'minutes' | 'hours';
  };
}

// Nó do Fluxo (Node)
export interface FlowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  data: Trigger | Action | any;
  position: { x: number; y: number };
}

// Conexão do Fluxo (Edge)
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  label?: string;
}

// Fluxo Completo
export interface AutomationFlow {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  executionCount?: number;
  lastExecuted?: string;
}

// Execução de Fluxo
export interface FlowExecution {
  id: string;
  flowId: string;
  triggerId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startedAt: string;
  completedAt?: string;
  executedActions: Array<{
    actionId: string;
    status: 'success' | 'failed';
    result?: any;
    error?: string;
  }>;
  leadData?: Record<string, any>;
}

// Histórico de Execução
export interface ExecutionLog {
  id: string;
  flowId: string;
  executionId: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  message: string;
  details?: Record<string, any>;
}
