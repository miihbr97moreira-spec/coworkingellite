import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Zap, Send, Download, FileText, BookOpen, Brain, GitBranch, Key } from 'lucide-react';
import WhatsAppTab from '@/components/integrations/WhatsAppTab';
import AutomationsTab from '@/components/integrations/AutomationsTab';
import WebhookOutTab from '@/components/integrations/WebhookOutTab';
import WebhookInTab from '@/components/integrations/WebhookInTab';
import LogsTab from '@/components/integrations/LogsTab';
import PlaybookTab from '@/components/integrations/PlaybookTab';
import AIAgentsTab from '@/components/integrations/AIAgentsTab';
import FlowsTab from '@/components/integrations/FlowsTab';
import APIKeysTab from '@/components/integrations/APIKeysTab';

export default function Integrations() {
  const [activeTab, setActiveTab] = useState('whatsapp');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-white">Integrações</h1>
            <Badge className="bg-yellow-500 text-slate-950 font-semibold">BETA</Badge>
          </div>
          <p className="text-slate-400 text-lg">
            Hub de integrações bidirecional — conecte qualquer ferramenta
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-9 bg-slate-800/50 border border-slate-700 rounded-lg p-1 mb-8">
            <TabsTrigger 
              value="whatsapp" 
              className="flex items-center gap-2 data-[state=active]:bg-[#D97757] data-[state=active]:text-white"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger 
              value="automations"
              className="flex items-center gap-2 data-[state=active]:bg-[#D97757] data-[state=active]:text-white"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Automações</span>
            </TabsTrigger>
            <TabsTrigger 
              value="webhook-out"
              className="flex items-center gap-2 data-[state=active]:bg-[#D97757] data-[state=active]:text-white"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Saída</span>
            </TabsTrigger>
            <TabsTrigger 
              value="webhook-in"
              className="flex items-center gap-2 data-[state=active]:bg-[#D97757] data-[state=active]:text-white"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Entrada</span>
            </TabsTrigger>
            <TabsTrigger 
              value="logs"
              className="flex items-center gap-2 data-[state=active]:bg-[#D97757] data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="playbook"
              className="flex items-center gap-2 data-[state=active]:bg-[#D97757] data-[state=active]:text-white"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Playbook</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ai-agents"
              className="flex items-center gap-2 data-[state=active]:bg-[#D97757] data-[state=active]:text-white"
            >
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Agentes IA</span>
            </TabsTrigger>
            <TabsTrigger 
              value="flows"
              className="flex items-center gap-2 data-[state=active]:bg-[#D97757] data-[state=active]:text-white"
            >
              <GitBranch className="w-4 h-4" />
              <span className="hidden sm:inline">Fluxos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="api-keys"
              className="flex items-center gap-2 data-[state=active]:bg-[#D97757] data-[state=active]:text-white"
            >
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">API Keys</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="whatsapp" className="mt-0">
            <WhatsAppTab />
          </TabsContent>

          <TabsContent value="automations" className="mt-0">
            <AutomationsTab />
          </TabsContent>

          <TabsContent value="webhook-out" className="mt-0">
            <WebhookOutTab />
          </TabsContent>

          <TabsContent value="webhook-in" className="mt-0">
            <WebhookInTab />
          </TabsContent>

          <TabsContent value="logs" className="mt-0">
            <LogsTab />
          </TabsContent>

          <TabsContent value="playbook" className="mt-0">
            <PlaybookTab />
          </TabsContent>

          <TabsContent value="ai-agents" className="mt-0">
            <AIAgentsTab />
          </TabsContent>

          <TabsContent value="flows" className="mt-0">
            <FlowsTab />
          </TabsContent>

          <TabsContent value="api-keys" className="mt-0">
            <APIKeysTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
