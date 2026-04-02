/**
 * Componentes de nós customizados para React Flow
 */

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageCircle, Webhook, Brain, Settings2, Clock, GitBranch, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Nó de Gatilho
export const TriggerNode = ({ data, selected }: any) => {
  const getTriggerIcon = () => {
    switch (data.triggerType) {
      case 'lead_moved': return <GitBranch className="w-5 h-5" />;
      case 'webhook_received': return <Webhook className="w-5 h-5" />;
      case 'form_submitted': return <AlertCircle className="w-5 h-5" />;
      default: return <Settings2 className="w-5 h-5" />;
    }
  };

  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileHover={{ scale: 1.05 }}
      className={`px-4 py-3 rounded-lg border-2 transition-all ${selected ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/30' : 'border-blue-400/50 bg-blue-500/5 hover:border-blue-400'}`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-blue-400">
        {getTriggerIcon()}
        <span>{String(data.label || 'Gatilho')}</span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </motion.div>
  );
};

// Nó de Ação
export const ActionNode = ({ data, selected }: any) => {
  const getActionIcon = () => {
    switch (data.actionType) {
      case 'whatsapp_message': return <MessageCircle className="w-5 h-5" />;
      case 'ai_agent': return <Brain className="w-5 h-5" />;
      case 'crm_update': return <Settings2 className="w-5 h-5" />;
      case 'webhook_call': return <Webhook className="w-5 h-5" />;
      default: return <Settings2 className="w-5 h-5" />;
    }
  };

  const colors: Record<string, string> = {
    whatsapp_message: 'text-green-400 border-green-400/50 bg-green-500/5',
    ai_agent: 'text-purple-400 border-purple-400/50 bg-purple-500/5',
    crm_update: 'text-orange-400 border-orange-400/50 bg-orange-500/5',
    webhook_call: 'text-cyan-400 border-cyan-400/50 bg-cyan-500/5',
  };
  const c = colors[data.actionType as string] || 'text-slate-400 border-slate-400/50 bg-slate-500/5';

  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileHover={{ scale: 1.05 }}
      className={`px-4 py-3 rounded-lg border-2 transition-all ${selected ? 'border-current bg-opacity-20 shadow-lg' : c}`}>
      <Handle type="target" position={Position.Top} />
      <div className={`flex items-center gap-2 text-sm font-semibold ${c.split(' ')[0]}`}>
        {getActionIcon()}
        <span>{String(data.label || 'Ação')}</span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </motion.div>
  );
};

// Nó de Condição
export const ConditionNode = ({ data, selected }: any) => (
  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileHover={{ scale: 1.05 }}
    className={`px-4 py-3 rounded-lg border-2 transition-all ${selected ? 'border-yellow-500 bg-yellow-500/10 shadow-lg shadow-yellow-500/30' : 'border-yellow-400/50 bg-yellow-500/5 hover:border-yellow-400'}`}>
    <Handle type="target" position={Position.Top} />
    <div className="flex items-center gap-2 text-sm font-semibold text-yellow-400">
      <GitBranch className="w-5 h-5" />
      <span>{String(data.label || 'Condição')}</span>
    </div>
    <div className="text-xs text-yellow-300/70 mt-1">{String(data.condition || '')}</div>
    <Handle type="source" position={Position.Bottom} id="true" />
    <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%' }} />
  </motion.div>
);

// Nó de Delay
export const DelayNode = ({ data, selected }: any) => (
  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileHover={{ scale: 1.05 }}
    className={`px-4 py-3 rounded-lg border-2 transition-all ${selected ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/30' : 'border-red-400/50 bg-red-500/5 hover:border-red-400'}`}>
    <Handle type="target" position={Position.Top} />
    <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
      <Clock className="w-5 h-5" />
      <span>{String(data.label || 'Delay')}</span>
    </div>
    <div className="text-xs text-red-300/70 mt-1">{String(data.delay || '')}</div>
    <Handle type="source" position={Position.Bottom} />
  </motion.div>
);

export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
};
