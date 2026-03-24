import { MapPin, Phone, Mail, Clock, Sparkles, Instagram, Linkedin, Facebook } from "lucide-react";

const Footer = () => (
  <footer className="py-32 relative overflow-hidden border-t border-white/5">
    {/* Ticto Style Background Orbs */}
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

    <div className="container px-4 relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 max-w-7xl mx-auto">
        
        {/* Brand & Social */}
        <div className="lg:col-span-4 space-y-8">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-2xl font-black tracking-tighter text-white">
              ELLITE<span className="text-primary">.</span>
            </span>
          </div>
          
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
            O coworking premium em Moema para profissionais que exigem excelência. Sua próxima conquista começa aqui.
          </p>

          <div className="flex items-center gap-4">
            {[Instagram, Linkedin, Facebook].map((Icon, i) => (
              <button key={i} className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-primary hover:border-primary/30 transition-all">
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>

        {/* Links Quick Access */}
        <div className="lg:col-span-2 space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Navegação</h4>
          <ul className="space-y-4">
            {["Início", "Espaço", "Planos", "Contato"].map(item => (
              <li key={item}>
                <button className="text-sm font-bold text-zinc-400 hover:text-primary transition-colors">{item}</button>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div className="lg:col-span-3 space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Contato</h4>
          <div className="space-y-5">
            <div className="flex items-start gap-3 group">
              <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500 group-hover:text-primary transition-colors">
                <MapPin className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium text-zinc-400 leading-relaxed">Av. Moema, 265 — Moema, São Paulo - SP</p>
            </div>
            <div className="flex items-start gap-3 group">
              <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500 group-hover:text-primary transition-colors">
                <Phone className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium text-zinc-400">(11) 97679-0653</p>
            </div>
            <div className="flex items-start gap-3 group">
              <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500 group-hover:text-primary transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium text-zinc-400">ellitecoworking@gmail.com</p>
            </div>
          </div>
        </div>

        {/* Map Ticto Style */}
        <div className="lg:col-span-3 space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Localização</h4>
          <div className="rounded-3xl overflow-hidden aspect-square border border-white/5 grayscale hover:grayscale-0 transition-all duration-700">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3656.0!2d-46.66!3d-23.6!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sAv.+Moema%2C+265+-+Moema%2C+S%C3%A3o+Paulo!5e0!3m2!1spt-BR!2sbr!4v1"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização Ellite Coworking"
            />
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-32 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
          © {new Date().getFullYear()} Ellite Coworking. Todos os direitos reservados.
        </p>
        <div className="flex items-center gap-8">
          <button className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-primary transition-colors">Termos de Uso</button>
          <button className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-primary transition-colors">Privacidade</button>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
