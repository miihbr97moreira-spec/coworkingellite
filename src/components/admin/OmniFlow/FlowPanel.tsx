/**
 * Painel de controle para adicionar gatilhos e ações ao fluxo
 * Permite arrastar e soltar elementos no canvas
 */

import React, { useState } from 'react';
import { Panel } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ChevronDown,
  MessageCircle,
  Webhook,
  Brain,
  Settings2,
  Clock,
  Mail,
  GitBranch,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FlowPanelProps {
  onAddNode: (type: string, nodeType: string, label: string) => void;
}

export const FlowPanel: React.FC<FlowPanelProps> = ({ onAddNode }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const triggers = [
    {
      id: 'lead_moved',
      label: 'Lead Movido',
      icon: GitBranch,
      color: 'text-blue-400',
      description: 'Quando um lead muda de estágio',
    },
    {
      id: 'webhook_received',
      label: 'Webhook Recebido',
      icon: Webhook,
      color: 'text-cyan-400',
      description: 'Quando um webhook é recebido',
    },
    {
      id: 'form_submitted',
      label: 'Formulário Enviado',
      icon: AlertCircle,
      color: 'text-indigo-400',
      description: 'Quando um formulário é submetido',
    },
    {
      id: 'payment_received',
      label: 'Pagamento Recebido',
      icon: Zap,
      color: 'text-yellow-400',
      description: 'Quando um pagamento é confirmado',
    },
  ];

  const actions = [
    {
      id: 'whatsapp_message',
      label: 'Mensagem WhatsApp',
      icon: MessageCircle,
      color: 'text-green-400',
      description: 'Enviar mensagem via WhatsApp',
    },
    {
      id: 'ai_agent',
      label: 'Agente IA',
      icon: Brain,
      color: 'text-purple-400',
      description: 'Executar agente de IA',
    },
    {
      id: 'crm_update',
      label: 'Atualizar CRM',
      icon: Settings2,
      color: 'text-orange-400',
      description: 'Atualizar dados no CRM',
    },
    {
      id: 'email',
      label: 'Enviar Email',
      icon: Mail,
      color: 'text-indigo-400',
      description: 'Enviar email automático',
    },
    {
      id: 'webhook_call',
      label: 'Chamar Webhook',
      icon: Webhook,
      color: 'text-cyan-400',
      description: 'Chamar webhook externo',
    },
    {
      id: 'delay',
      label: 'Aguardar',
      icon: Clock,
      color: 'text-red-400',
      description: 'Aguardar tempo especificado',
    },
  ];

  const Section = ({
    title,
    items,
    sectionId,
  }: {
    title: string;
    items: any[];
    sectionId: string;
  }) => (
    <div className="border-b border-slate-700/50 last:border-0">
      <button
        onClick={() =>
          setExpandedSection(expandedSection === sectionId ? null : sectionId)
        }
        className="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          {title}
        </span>
        <motion.div
          animate={{ rotate: expandedSection === sectionId ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expandedSection === sectionId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-700/50 bg-slate-900/50"
          >
            <div className="p-2 space-y-2">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      onAddNode(
                        sectionId === 'triggers' ? 'trigger' : 'action',
                        item.id,
                        item.label
                      )
                    }
                    className="w-full flex items-start gap-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-left group"
                  >
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white group-hover:text-slate-100">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-500 group-hover:text-slate-400">
                        {item.description}
                      </div>
                    </div>
                    <Plus className="w-3 h-3 text-slate-500 group-hover:text-slate-300 flex-shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <Panel position="left" className="!p-0 !bg-transparent !border-0">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-64 rounded-xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm overflow-hidden shadow-xl"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 to-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#D97757]" />
            Elementos do Fluxo
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Arraste ou clique para adicionar
          </p>
        </div>

        {/* Sections */}
        <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <Section title="Gatilhos" items={triggers} sectionId="triggers" />
          <Section title="Ações" items={actions} sectionId="actions" />
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-slate-700/50 bg-slate-900/50 text-xs text-slate-500">
          💡 Conecte gatilhos com ações para criar fluxos automáticos
        </div>
      </motion.div>
    </Panel>
  );
};
