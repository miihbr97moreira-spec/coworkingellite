/**
 * Omni Checkout Integrado - Componente de pagamento transparente
 * Integra pagamento com automação de CRM (move lead para "Fechado/Ganho")
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  CreditCard,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckoutService, CheckoutPaymentData } from '@/services/checkoutService';
import { useAuth } from '@/context/AuthContext';

export interface OmniCheckoutConfig {
  id: string;
  type: 'checkout';
  productName: string;
  productValue: number;
  currency?: string;
  description?: string;
  successRedirectUrl?: string;
  errorRedirectUrl?: string;
}

interface OmniCheckoutIntegratedProps {
  config: OmniCheckoutConfig;
  onSuccess?: (data: CheckoutPaymentData & { leadId: string }) => void;
  onError?: (error: string) => void;
  isEditing?: boolean;
  onConfigChange?: (config: OmniCheckoutConfig) => void;
}

export const OmniCheckoutIntegrated: React.FC<OmniCheckoutIntegratedProps> = ({
  config,
  onSuccess,
  onError,
  isEditing = false,
  onConfigChange,
}) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showCVV, setShowCVV] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVV: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setError(null);

    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else if (name === 'cardExpiry') {
      const formatted = value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2');
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else if (name === 'cardCVV') {
      const formatted = value.replace(/\D/g, '').slice(0, 4);
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else if (name === 'phone') {
      const formatted = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) { setError('Nome é obrigatório'); return false; }
    if (!formData.email.includes('@')) { setError('E-mail inválido'); return false; }
    if (formData.phone.replace(/\D/g, '').length < 10) { setError('Telefone inválido'); return false; }
    if (formData.cardNumber.replace(/\s/g, '').length !== 16) { setError('Número do cartão inválido'); return false; }
    if (formData.cardExpiry.replace(/\D/g, '').length !== 4) { setError('Validade inválida'); return false; }
    if (formData.cardCVV.length < 3) { setError('CVV inválido'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!user?.id) { setError('Usuário não autenticado'); return; }

    setIsProcessing(true);
    setError(null);

    try {
      const paymentData: CheckoutPaymentData = {
        ...formData,
        productName: config.productName,
        productValue: config.productValue,
        timestamp: new Date().toISOString(),
      };

      const result = await CheckoutService.processCheckoutAndUpdateCRM(paymentData, user.id);

      setIsSuccess(true);
      setSuccessMessage('Pagamento confirmado! Lead movido para "Fechado/Ganho" no CRM.');

      onSuccess?.({ ...paymentData, leadId: result.leadId });

      if (config.successRedirectUrl) {
        setTimeout(() => { window.location.href = config.successRedirectUrl!; }, 3000);
      }

      setTimeout(() => {
        setIsSuccess(false);
        setFormData({ name: '', email: '', phone: '', cardNumber: '', cardExpiry: '', cardCVV: '' });
      }, 3000);

      toast.success('Pagamento processado com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar pagamento';
      setError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);

      if (config.errorRedirectUrl) {
        setTimeout(() => { window.location.href = config.errorRedirectUrl!; }, 3000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Modo edição
  if (isEditing) {
    return (
      <div className="p-6 bg-secondary/20 rounded-2xl border border-border/30 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-[#D97757]" />
          <h3 className="text-lg font-bold">Configurar Omni Checkout</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold uppercase">Nome do Produto</label>
            <input type="text" value={config.productName}
              onChange={(e) => onConfigChange?.({ ...config, productName: e.target.value })}
              className="w-full mt-1 p-2 rounded-lg bg-background border border-border/30 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase">Valor (R$)</label>
            <input type="number" value={config.productValue}
              onChange={(e) => onConfigChange?.({ ...config, productValue: Number(e.target.value) })}
              className="w-full mt-1 p-2 rounded-lg bg-background border border-border/30 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase">Descrição (Opcional)</label>
            <input type="text" value={config.description || ''}
              onChange={(e) => onConfigChange?.({ ...config, description: e.target.value })}
              placeholder="Ex: Acesso ao curso premium"
              className="w-full mt-1 p-2 rounded-lg bg-background border border-border/30 outline-none focus:border-primary"
            />
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-400">
            💡 Quando o pagamento for confirmado, o lead será automaticamente movido para o estágio "Fechado/Ganho" no CRM.
          </div>
        </div>
      </div>
    );
  }

  // Modo visualização
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 text-center space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white">Pagamento Confirmado! ✨</h3>
            <p className="text-muted-foreground">{successMessage}</p>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={handleSubmit} className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Resumo do Produto */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Produto</p>
                  <h3 className="text-lg font-bold text-white">{config.productName}</h3>
                  {config.description && <p className="text-xs text-muted-foreground mt-1">{config.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-black text-primary">
                    R$ {config.productValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Dados Pessoais</h4>
              <div>
                <label className="text-xs font-bold uppercase">Nome Completo</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="João Silva"
                  className="w-full mt-2 p-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary outline-none text-white placeholder:text-white/40 transition-all" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase">E-mail</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="joao@email.com"
                    className="w-full mt-2 p-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary outline-none text-white placeholder:text-white/40 transition-all" required />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase">Telefone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="(11) 99999-9999"
                    className="w-full mt-2 p-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary outline-none text-white placeholder:text-white/40 transition-all" required />
                </div>
              </div>
            </div>

            {/* Cartão */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" /> Dados do Cartão
              </h4>
              <div>
                <label className="text-xs font-bold uppercase">Número do Cartão</label>
                <div className="relative">
                  <input type={showCardNumber ? 'text' : 'password'} name="cardNumber" value={formData.cardNumber} onChange={handleInputChange}
                    placeholder="1234 5678 9012 3456" maxLength={19}
                    className="w-full mt-2 p-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary outline-none text-white placeholder:text-white/40 transition-all font-mono pr-10" required />
                  <button type="button" onClick={() => setShowCardNumber(!showCardNumber)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300">
                    {showCardNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase">Validade</label>
                  <input type="text" name="cardExpiry" value={formData.cardExpiry} onChange={handleInputChange}
                    placeholder="MM/AA" maxLength={5}
                    className="w-full mt-2 p-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary outline-none text-white placeholder:text-white/40 transition-all font-mono" required />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase">CVV</label>
                  <div className="relative">
                    <input type={showCVV ? 'text' : 'password'} name="cardCVV" value={formData.cardCVV} onChange={handleInputChange}
                      placeholder="123" maxLength={4}
                      className="w-full mt-2 p-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary outline-none text-white placeholder:text-white/40 transition-all font-mono pr-10" required />
                    <button type="button" onClick={() => setShowCVV(!showCVV)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300">
                      {showCVV ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <motion.button type="submit" disabled={isProcessing} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#D97757] to-orange-600 hover:from-[#c86647] hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#D97757]/20">
              {isProcessing ? (<><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>) : (<><CreditCard className="w-4 h-4" /> Confirmar Pagamento</>)}
            </motion.button>

            <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
              <Lock className="w-3 h-3" /> Seus dados estão seguros e criptografados
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
