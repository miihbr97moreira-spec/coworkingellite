import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface AutomationFlow {
  id?: string;
  flow_name: string;
  flow_description: string;
  trigger_type: string;
  action_type: string;
  template_message: string;
  webhook_url?: string;
  is_active: boolean;
  execution_count?: number;
  created_at?: string;
}

export interface WebhookLog {
  id: string;
  payload: any;
  status_code: number;
  received_at: string;
  error_message?: string;
}

export interface OmniFlowState {
  // Automações
  automations: AutomationFlow[];
  setAutomations: (automations: AutomationFlow[]) => void;
  addAutomation: (automation: AutomationFlow) => void;
  updateAutomation: (id: string, automation: Partial<AutomationFlow>) => void;
  removeAutomation: (id: string) => void;

  // Logs de Webhook
  webhookLogs: WebhookLog[];
  addWebhookLog: (log: WebhookLog) => void;
  clearWebhookLogs: () => void;

  // Estado de UI
  selectedAutomationId: string | null;
  setSelectedAutomationId: (id: string | null) => void;

  // Simulador de Testes
  testLogs: { timestamp: string; message: string; status: "success" | "error" | "info" }[];
  addTestLog: (message: string, status: "success" | "error" | "info") => void;
  clearTestLogs: () => void;

  // Variáveis Dinâmicas
  selectedVariables: string[];
  toggleVariable: (variable: string) => void;
  clearVariables: () => void;
}

export const useOmniFlowStore = create<OmniFlowState>()(
  devtools(
    persist(
      (set) => ({
        // Automações
        automations: [],
        setAutomations: (automations) => set({ automations }),
        addAutomation: (automation) =>
          set((state) => ({
            automations: [...state.automations, automation],
          })),
        updateAutomation: (id, automation) =>
          set((state) => ({
            automations: state.automations.map((a) =>
              a.id === id ? { ...a, ...automation } : a
            ),
          })),
        removeAutomation: (id) =>
          set((state) => ({
            automations: state.automations.filter((a) => a.id !== id),
          })),

        // Logs de Webhook
        webhookLogs: [],
        addWebhookLog: (log) =>
          set((state) => ({
            webhookLogs: [log, ...state.webhookLogs].slice(0, 100), // Manter últimos 100
          })),
        clearWebhookLogs: () => set({ webhookLogs: [] }),

        // Estado de UI
        selectedAutomationId: null,
        setSelectedAutomationId: (id) => set({ selectedAutomationId: id }),

        // Simulador de Testes
        testLogs: [],
        addTestLog: (message, status) =>
          set((state) => ({
            testLogs: [
              {
                timestamp: new Date().toLocaleTimeString("pt-BR"),
                message,
                status,
              },
              ...state.testLogs,
            ].slice(0, 50), // Manter últimos 50
          })),
        clearTestLogs: () => set({ testLogs: [] }),

        // Variáveis Dinâmicas
        selectedVariables: [],
        toggleVariable: (variable) =>
          set((state) => ({
            selectedVariables: state.selectedVariables.includes(variable)
              ? state.selectedVariables.filter((v) => v !== variable)
              : [...state.selectedVariables, variable],
          })),
        clearVariables: () => set({ selectedVariables: [] }),
      }),
      {
        name: "omni-flow-store",
      }
    )
  )
);
