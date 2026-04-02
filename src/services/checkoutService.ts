/**
 * Serviço de integração do Omni Checkout com CRM
 */

import { supabase } from '@/integrations/supabase/client';

export interface CheckoutPaymentData {
  name: string;
  email: string;
  phone: string;
  cardNumber: string;
  cardExpiry: string;
  cardCVV: string;
  productName: string;
  productValue: number;
  timestamp: string;
}

export class CheckoutService {
  static async processCheckoutAndUpdateCRM(
    paymentData: CheckoutPaymentData,
    tenantId: string
  ): Promise<any> {
    try {
      // Simular processamento de pagamento
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const isSuccess = Math.random() > 0.1;

      if (!isSuccess) {
        throw new Error('Transação recusada pelo gateway');
      }

      // Criar lead no CRM (tabela leads)
      const { data: lead, error } = await supabase
        .from('leads')
        .insert({
          name: paymentData.name,
          email: paymentData.email,
          phone: paymentData.phone,
          funnel_id: '', // Will need a default funnel
          stage_id: '', // Will need a "closed won" stage
          deal_value: paymentData.productValue,
          source: 'checkout',
          tags: ['paid', 'customer', paymentData.productName],
        } as any)
        .select()
        .single();

      return {
        success: true,
        leadId: lead?.id || paymentId,
        paymentId,
        message: 'Pagamento processado com sucesso',
      };
    } catch (error) {
      console.error('Checkout processing error:', error);
      throw error;
    }
  }

  static async getSalesStats(tenantId: string): Promise<any> {
    // Return mock stats for now
    return {
      totalSales: 0,
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      successRate: 0,
      averageOrderValue: 0,
    };
  }

  static async getConvertedLeads(tenantId: string): Promise<any[]> {
    // Return leads with high deal values as "converted"
    const { data } = await supabase
      .from('leads')
      .select('*')
      .gt('deal_value', 0)
      .order('updated_at', { ascending: false })
      .limit(20);

    return data || [];
  }
}
