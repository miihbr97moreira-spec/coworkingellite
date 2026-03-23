import { MapPin, Phone, Mail, Clock } from "lucide-react";

const Footer = () => (
  <footer className="py-20 border-t border-border">
    <div className="container px-4">
      <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
        {/* Map */}
        <div className="rounded-xl overflow-hidden aspect-video">
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

        {/* Info */}
        <div className="flex flex-col justify-center space-y-6">
          <h3 className="font-display text-3xl font-bold text-gradient-gold">Ellite Coworking</h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <p className="text-sm text-foreground/80">Av. Moema, 265 — Moema, São Paulo - SP</p>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary mt-0.5" />
              <p className="text-sm text-foreground/80">(11) 97679-0653</p>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5" />
              <p className="text-sm text-foreground/80">ellitecoworking@gmail.com</p>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm text-foreground/80">
                <p>Seg — Sex: 08:00 às 21:00</p>
                <p>Sáb: 09:00 às 15:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Ellite Coworking. Todos os direitos reservados.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
