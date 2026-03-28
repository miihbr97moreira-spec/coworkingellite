import { create } from "zustand";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  funnel_id: string;
  stage_id: string;
  deal_value: number | null;
  lead_score: number;
  sort_order: number;
  source: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface Funnel {
  id: string;
  name: string;
  description: string | null;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  funnel_id: string;
}

interface CRMState {
  leads: Lead[];
  funnels: Funnel[];
  stages: Stage[];
  activeFunnelId: string | null;
  selectedLeadId: string | null;
  
  setLeads: (leads: Lead[]) => void;
  setFunnels: (funnels: Funnel[]) => void;
  setStages: (stages: Stage[]) => void;
  setActiveFunnel: (id: string | null) => void;
  setSelectedLead: (id: string | null) => void;
  
  // Optimistic updates
  moveLeadOptimistic: (leadId: string, newStageId: string) => void;
  updateLeadScore: (leadId: string, score: number) => void;
  addLeadOptimistic: (lead: Lead) => void;
  removeLeadOptimistic: (leadId: string) => void;
  
  // Computed
  getLeadsByStage: (stageId: string) => Lead[];
  getHotLeads: () => Lead[];
  getTotalRevenue: () => number;
}

export const useCRMStore = create<CRMState>((set, get) => ({
  leads: [],
  funnels: [],
  stages: [],
  activeFunnelId: null,
  selectedLeadId: null,

  setLeads: (leads) => set({ leads }),
  setFunnels: (funnels) => set({ funnels }),
  setStages: (stages) => set({ stages }),
  setActiveFunnel: (id) => set({ activeFunnelId: id }),
  setSelectedLead: (id) => set({ selectedLeadId: id }),

  moveLeadOptimistic: (leadId, newStageId) =>
    set((state) => ({
      leads: state.leads.map((l) =>
        l.id === leadId ? { ...l, stage_id: newStageId, updated_at: new Date().toISOString() } : l
      ),
    })),

  updateLeadScore: (leadId, score) =>
    set((state) => ({
      leads: state.leads.map((l) =>
        l.id === leadId ? { ...l, lead_score: score } : l
      ),
    })),

  addLeadOptimistic: (lead) =>
    set((state) => ({ leads: [lead, ...state.leads] })),

  removeLeadOptimistic: (leadId) =>
    set((state) => ({ leads: state.leads.filter((l) => l.id !== leadId) })),

  getLeadsByStage: (stageId) => get().leads
    .filter((l) => l.stage_id === stageId)
    .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0)),

  getHotLeads: () => get().leads.filter((l) => (l.lead_score || 0) >= 80),
  
  getTotalRevenue: () => get().leads
    .filter((l) => {
      const stages = get().stages;
      const stage = stages.find(s => s.id === l.stage_id);
      return stage?.name?.toLowerCase().includes("ganho") || stage?.name?.toLowerCase().includes("fechado");
    })
    .reduce((sum, l) => sum + (l.deal_value || 0), 0),
}));
