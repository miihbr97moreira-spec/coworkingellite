import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useSiteContent } from "@/context/SiteContext";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setIsAdmin } = useSiteContent();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulated auth - in production use Supabase
    if (password === "ellite2024") {
      setIsAdmin(true);
      navigate("/admin");
    } else {
      setError("Senha incorreta");
    }
  };

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gradient-gold">Admin Ellite</h1>
          <p className="text-sm text-muted-foreground mt-2">Acesse o painel de administração</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Digite a senha de acesso"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold"
          >
            Entrar
          </motion.button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Senha padrão: ellite2024
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
