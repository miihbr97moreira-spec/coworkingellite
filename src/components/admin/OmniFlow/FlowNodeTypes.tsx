/**
 * Componentes de nós customizados para React Flow
 * Define tipos de nós para gatilhos, ações, condições e delays
 */

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { MessageCircle, Webhook, Brain, Settings2, Clock, GitBranch, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Nó de Gatilho
export const TriggerNode: React.FC<NodeProps> = ({ data, isConnecting, selected }) => {
  const getTriggerIcon = () => {
    switch (data.triggerType) {
      case 'lead_moved':
        return <GitBranch className="w-5 h-5" />;
      case 'webhook_received':
        return <Webhook className="w-5 h-5" />;
      case 'form_submitted':
        return <AlertCircle className="w-5 h-5" />;
      case 'payment_received':
        return <Settings2 className="w-5 h-5" />;
      default:
        return <Settings2 className="w-5 h-5" />;
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`px-4 py-3 rounded-lg border-2 transition-all ${
        selected
          ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/30'
          : 'border-blue-400/50 bg-blue-500/5 hover:border-blue-400'
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-blue-400">
        {getTriggerIcon()}
        <span>{data.label || 'Gatilho'}</span>
      </div>
      <Handle type="output" position={Position.Bottom} />
    </motion.div>
  );
};

// Nó de Ação
export const ActionNode: React.FC<NodeProps> = ({ data, isConnecting, selected }) => {
  const getActionIcon = () => {
    switch (data.actionType) {
      case 'whatsapp_message':
        return <MessageCircle className="w-5 h-5" />;
      case 'ai_agent':
        return <Brain className="w-5 h-5" />;
      case 'crm_update':
        return <Settings2 className="w-5 h-5" />;
      case 'email':
        return <AlertCircle className="w-5 h-5" />;
      case 'webhook_call':
        return <Webhook className="w-5 h-5" />;
      default:
        return <Settings2 className="w-5 h-5" />;
    }
  };

  const getActionColor = () => {
    switch (data.actionType) {
      case 'whatsapp_message':
        return 'border-green-400/50 bg-green-500/5 hover:border-green-400';
      case 'ai_agent':
        return 'border-purple-400/50 bg-purple-500/5 hover:border-purple-400';
      case 'crm_update':
        return 'border-orange-400/50 bg-orange-500/5 hover:border-orange-400';
      case 'email':
        return 'border-indigo-400/50 bg-indigo-500/5 hover:border-indigo-400';
      case 'webhook_call':
        return 'border-cyan-400/50 bg-cyan-500/5 hover:border-cyan-400';
      default:
        return 'border-slate-400/50 bg-slate-500/5 hover:border-slate-400';
    }
  };

  const getActionTextColor = () => {
    switch (data.actionType) {
      case 'whatsapp_message':
        return 'text-green-400';
      case 'ai_agent':
        return 'text-purple-400';
      case 'crm_update':
        return 'text-orange-400';
      case 'email':
        return 'text-indigo-400';
      case 'webhook_call':
        return 'text-cyan-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`px-4 py-3 rounded-lg border-2 transition-all ${
        selected
          ? `border-current bg-opacity-20 shadow-lg`
          : getActionColor()
      }`}
    >
      <Handle type="input" position={Position.Top} />
      <div className={`flex items-center gap-2 text-sm font-semibold ${getActionTextColor()}`}>
        {getActionIcon()}
        <span>{data.label || 'Ação'}</span>
      </div>
      <Handle type="output" position={Position.Bottom} />
    </motion.div>
  );
};

// Nó de Condição
export const ConditionNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`px-4 py-3 rounded-lg border-2 transition-all ${
        selected
          ? 'border-yellow-500 bg-yellow-500/10 shadow-lg shadow-yellow-500/30'
          : 'border-yellow-400/50 bg-yellow-500/5 hover:border-yellow-400'
      }`}
    >
      <Handle type="input" position={Position.Top} />
      <div className="flex items-center gap-2 text-sm font-semibold text-yellow-400">
        <GitBranch className="w-5 h-5" />
        <span>{data.label || 'Condição'}</span>
      </div>
      <div className="text-xs text-yellow-300/70 mt-1">{data.condition}</div>
      <Handle type="output" position={Position.Bottom} id="true" />
      <Handle type="output" position={Position.Bottom} id="false" style={{ left: '75%' }} />
    </motion.div>
  );
};

// Nó de Delay
export const DelayNode: React.FC<NodeProps> = ({ data, selected }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`px-4 py-3 rounded-lg border-2 transition-all ${
        selected
          ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/30'
          : 'border-red-400/50 bg-red-500/5 hover:border-red-400'
      }`}
    >
      <Handle type="input" position={Position.Top} />
      <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
        <Clock className="w-5 h-5" />
        <span>{data.label || 'Delay'}</span>
      </div>
      <div className="text-xs text-red-300/70 mt-1">{data.delay}</div>
      <Handle type="output" position={Position.Bottom} />
    </motion.div>
  );
};

// Mapa de tipos de nós
export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
};
