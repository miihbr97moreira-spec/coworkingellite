import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Users, ShoppingCart, CheckCircle2, BarChart3, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckoutService } from '@/services/checkoutService';

const StatCard = ({ icon: Icon, label, value, change, color }: {
  icon: any; label: string; value: string | number; change?: string; color: string;
}) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}>
    <Card className="border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-400">{label}</CardTitle>
          <div className={`p-2 rounded-lg ${color}`}><Icon className="w-4 h-4" /></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {change && <p className="text-xs text-green-400 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {change}</p>}
      </CardContent>
    </Card>
  </motion.div>
);

export default function CheckoutDashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('month');

  const { data: salesStats, isLoading: statsLoading } = useQuery({
    queryKey: ['sales_stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await CheckoutService.getSalesStats(user.id);
    },
    enabled: !!user?.id,
  });

  const { data: convertedLeads, isLoading: leadsLoading } = useQuery({
    queryKey: ['converted_leads', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await CheckoutService.getConvertedLeads(user.id);
    },
    enabled: !!user?.id,
  });

  if (statsLoading || leadsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
              <ShoppingCart className="w-6 h-6 text-green-500" />
            </div>
            Dashboard de Vendas
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Monitore suas vendas e conversões</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'year'].map((range) => (
            <Button key={range} variant={dateRange === range ? 'default' : 'outline'} size="sm"
              onClick={() => setDateRange(range)}
              className={dateRange === range ? 'bg-primary' : 'border-slate-700'}>
              {range === 'week' ? 'Semana' : range === 'month' ? 'Mês' : 'Ano'}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={DollarSign} label="Total de Vendas"
          value={`R$ ${(salesStats?.totalSales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change="+12% este mês" color="bg-green-500/10 text-green-500" />
        <StatCard icon={ShoppingCart} label="Transações"
          value={salesStats?.totalTransactions || 0}
          change={`${salesStats?.successRate || 0}% sucesso`} color="bg-blue-500/10 text-blue-500" />
        <StatCard icon={CheckCircle2} label="Conversões"
          value={salesStats?.successfulTransactions || 0}
          change={`de ${salesStats?.totalTransactions || 0} tentativas`} color="bg-emerald-500/10 text-emerald-500" />
        <StatCard icon={Users} label="Clientes Ativos"
          value={convertedLeads?.length || 0}
          change="Leads em Fechado/Ganho" color="bg-purple-500/10 text-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Resumo de Vendas
              </CardTitle>
              <CardDescription>
                Desempenho nos últimos {dateRange === 'week' ? '7 dias' : dateRange === 'month' ? '30 dias' : '365 dias'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <span className="text-sm text-slate-400">Ticket Médio</span>
                  <span className="text-lg font-bold text-white">
                    R$ {(salesStats?.averageOrderValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <span className="text-sm text-slate-400">Taxa de Sucesso</span>
                  <span className="text-lg font-bold text-green-400">{salesStats?.successRate || 0}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <span className="text-sm text-slate-400">Transações Falhadas</span>
                  <span className="text-lg font-bold text-red-400">{salesStats?.failedTransactions || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader><CardTitle className="text-white text-sm">Informações Rápidas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <p className="text-xs text-blue-400 font-medium">CONVERSÃO MÉDIA</p>
                <p className="text-2xl font-bold text-blue-300 mt-1">
                  {(salesStats?.totalTransactions || 0) > 0
                    ? (((salesStats?.successfulTransactions || 0) / (salesStats?.totalTransactions || 1)) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <p className="text-xs text-green-400 font-medium">RECEITA TOTAL</p>
                <p className="text-2xl font-bold text-green-300 mt-1">
                  R$ {(salesStats?.totalSales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <p className="text-xs text-purple-400 font-medium">CLIENTES NOVOS</p>
                <p className="text-2xl font-bold text-purple-300 mt-1">{convertedLeads?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" /> Leads Convertidos Recentemente
            </CardTitle>
            <CardDescription>Clientes que completaram a compra</CardDescription>
          </CardHeader>
          <CardContent>
            {convertedLeads && convertedLeads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Nome</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Email</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {convertedLeads.slice(0, 10).map((lead: any) => (
                      <tr key={lead.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-white">{lead.name}</td>
                        <td className="py-3 px-4 text-slate-400">{lead.email}</td>
                        <td className="py-3 px-4 text-green-400 font-semibold">
                          R$ {(lead.deal_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhum lead convertido ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
