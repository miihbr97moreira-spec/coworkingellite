import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-2xl"
      >
        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
            <ShieldCheck className="w-12 h-12 text-primary" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
          Omni Builder <span className="text-primary">CRM</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8">
          Gerenciador de Acesso Multi-Tenant
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={() => navigate("/admin/login")}
            className="text-lg px-8 py-6 rounded-xl gap-2 group"
          >
            Acessar Painel Admin
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        
        <p className="mt-12 text-sm text-muted-foreground/50 font-mono">
          SaaS Architecture v2.0 • White-label Ready
        </p>
      </motion.div>
    </div>
  );
};

export default Index;
