import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";

export interface CheckoutConfig {
  id: string;
  type: "checkout";
  productName: string;
  productValue: number;
  currency?: string;
  description?: string;
}

interface OmniCheckoutProps {
  config: CheckoutConfig;
  onSuccess?: (data: CheckoutData) => void;
  onError?: (error: string) => void;
  isEditing?: boolean;
  onConfigChange?: (config: CheckoutConfig) => void;
}

export interface CheckoutData {
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

/**
 * Componente de Checkout Transparente com UI Premium (Stripe Style)
 * Renderiza um formulário de pagamento moderno e intuitivo
 */
export const OmniCheckout: React.FC<OmniCheckoutProps> = ({
  config,
  onSuccess,
  onError,
  isEditing = false,
  onConfigChange,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cardNumber: "",
    cardExpiry: "",
    cardCVV: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Formatação de campos específicos
    if (name === "cardNumber") {
      const formatted = value.replace(/\s/g, "").replace(/(\d{4})/g, "$1 ").trim();
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === "cardExpiry") {
      const formatted = value.replace(/\D/g, "").replace(/(\d{2})(\d{2})/, "$1/$2");
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === "cardCVV") {
      const formatted = value.replace(/\D/g, "").slice(0, 4);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === "phone") {
      const formatted = value.replace(/\D/g, "").replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3");
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      onError?.("Nome é obrigatório");
      return false;
    }
    if (!formData.email.includes("@")) {
      onError?.("E-mail inválido");
      return false;
    }
    if (formData.phone.replace(/\D/g, "").length < 10) {
      onError?.("Telefone inválido");
      return false;
    }
    if (formData.cardNumber.replace(/\s/g, "").length !== 16) {
      onError?.("Número do cartão inválido");
      return false;
    }
    if (formData.cardExpiry.replace(/\D/g, "").length !== 4) {
      onError?.("Validade inválida");
      return false;
    }
    if (formData.cardCVV.length < 3) {
      onError?.("CVV inválido");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsProcessing(true);

    try {
      // Simular processamento de pagamento (2 segundos)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Preparar dados para envio
      const checkoutData: CheckoutData = {
        ...formData,
        productName: config.productName,
        productValue: config.productValue,
        timestamp: new Date().toISOString(),
      };

      // Chamar callback de sucesso
      onSuccess?.(checkoutData);

      // Mostrar tela de sucesso
      setIsSuccess(true);

      // Resetar após 3 segundos
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          cardNumber: "",
          cardExpiry: "",
          cardCVV: "",
        });
      }, 3000);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Erro ao processar pagamento");
    } finally {
      setIsProcessing(false);
    }
  };

  // Modo edição: mostrar painel de configuração
  if (isEditing) {
    return (
      <div className="p-6 bg-secondary/20 rounded-2xl border border-border/30 space-y-4">
        <h3 className="text-lg font-bold">Configurar Checkout</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold uppercase">Nome do Produto</label>
            <input
              type="text"
              value={config.productName}
              onChange={e =>
                onConfigChange?.({
                  ...config,
                  productName: e.target.value,
                })
              }
              className="w-full mt-1 p-2 rounded-lg bg-background border border-border/30 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase">Valor (R$)</label>
            <input
              type="number"
              value={config.productValue}
              onChange={e =>
                onConfigChange?.({
                  ...config,
                  productValue: Number(e.target.value),
                })
              }
              className="w-full mt-1 p-2 rounded-lg bg-background border border-border/30 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase">Descrição (Opcional)</label>
            <input
              type="text"
              value={config.description || ""}
              onChange={e =>
                onConfigChange?.({
                  ...config,
                  description: e.target.value,
                })
              }
              placeholder="Ex: Acesso ao curso premium"
              className="w-full mt-1 p-2 rounded-lg bg-background border border-border/30 outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>
    );
  }

  // Modo visualização: mostrar formulário de checkout
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      {isSuccess ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-3xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 text-center space-y-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          </motion.div>
          <h3 className="text-2xl font-bold">Pagamento Confirmado! ✨</h3>
          <p className="text-muted-foreground">
            Obrigado pela compra! Você receberá um e-mail de confirmação em breve.
          </p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resumo do Produto */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produto</p>
                <h3 className="text-lg font-bold">{config.productName}</h3>
                {config.description && (
                  <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-black text-primary">
                  R$ {config.productValue.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Seção de Dados Pessoais */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Dados Pessoais
            </h4>

            <div>
              <label className="text-xs font-bold uppercase">Nome Completo</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="João Silva"
                className="w-full mt-2 p-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary outline-none text-white placeholder:text-white/40 transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="joao@email.com"
                  className="w-full mt-2 p-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary outline-none text-white placeholder:text-white/40 transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase">Telefone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                  className="w-full mt-2 p-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary outline-none text-white placeholder:text-white/40 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Seção de Cartão de Crédito */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" /> Dados do Cartão
            </h4>

            <div>
              <label className="text-xs font-bold uppercase">Número do Cartão</label>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleInputChange}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full mt-2 p-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary outline-none text-white placeholder:text-white/40 transition-all font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase">Validade</label>
                <input
                  type="text"
                  name="cardExpiry"
                  value={formData.cardExpiry}
                  onChange={handleInputChange}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full mt-2 p-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary outline-none text-white placeholder:text-white/40 transition-all font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase">CVV</label>
                <input
                  type="text"
                  name="cardCVV"
                  value={formData.cardCVV}
                  onChange={handleInputChange}
                  placeholder="123"
                  maxLength={4}
                  className="w-full mt-2 p-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary outline-none text-white placeholder:text-white/40 transition-all font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Botão de Pagamento */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isProcessing}
            className="w-full py-4 rounded-xl font-black text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Pagar Agora
              </>
            )}
          </motion.button>

          {/* Segurança */}
          <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Pagamento 100% seguro e criptografado
          </p>
        </form>
      )}
    </motion.div>
  );
};

export default OmniCheckout;
