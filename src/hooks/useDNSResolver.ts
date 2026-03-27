import { useState } from "react";

interface DNSRecord {
  type: string;
  value: string;
  ttl?: number;
}

interface DNSInfo {
  domain: string;
  records: DNSRecord[];
  server?: string;
  isConfigured: boolean;
}

export const useDNSResolver = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveDomain = async (domain: string): Promise<DNSInfo | null> => {
    setLoading(true);
    setError(null);

    try {
      // Usar a API de DNS pública (Google DNS over HTTPS)
      const response = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`,
        {
          method: "GET",
          headers: { "Accept": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao consultar DNS");
      }

      const data = await response.json();
      const records: DNSRecord[] = [];
      let server = "Não configurado";

      // Extrair registros A
      if (data.Answer) {
        data.Answer.forEach((answer: any) => {
          if (answer.type === 1) { // Tipo A
            records.push({
              type: "A",
              value: answer.data,
              ttl: answer.TTL,
            });
            server = answer.data;
          }
        });
      }

      // Tentar resolver CNAME também
      try {
        const cnameResponse = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=CNAME`,
          { method: "GET", headers: { "Accept": "application/json" } }
        );
        const cnameData = await cnameResponse.json();
        if (cnameData.Answer) {
          cnameData.Answer.forEach((answer: any) => {
            if (answer.type === 5) { // Tipo CNAME
              records.push({
                type: "CNAME",
                value: answer.data,
                ttl: answer.TTL,
              });
            }
          });
        }
      } catch (e) {
        // CNAME pode não existir, é ok
      }

      const isConfigured = records.length > 0;

      setLoading(false);
      return {
        domain,
        records,
        server: isConfigured ? server : "Não configurado",
        isConfigured,
      };
    } catch (err: any) {
      const errorMsg = err.message || "Erro ao resolver domínio";
      setError(errorMsg);
      setLoading(false);
      return null;
    }
  };

  return { resolveDomain, loading, error };
};
