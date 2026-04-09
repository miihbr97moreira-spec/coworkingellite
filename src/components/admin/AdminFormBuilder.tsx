import { useState, useEffect } from "react";
import {
  Plus, Trash2, Save, Loader2, Eye, Copy, Check, ExternalLink,
  Palette, Settings, X, ListChecks, MessageSquare, Phone, Mail,
  Search, Split, Globe, ArrowUp, ArrowDown, FileText, Star,
  Upload, Hash, Calendar, ToggleLeft, Type, AlignLeft
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFunnels, useStages } from "@/hooks/useSupabaseQuery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import FormPreview from "./FormPreview";

// Types
interface FormQuestion {
  id: string;
  type: "short_text" | "long_text" | "email" | "phone" | "number" | "multiple_choice" | "checkbox" | "dropdown" | "rating" | "opinion_scale" | "date" | "file_upload" | "yes_no" | "welcome" | "statement";
  title: string;
  description?: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  min?: number;
  max?: number;
  logic?: { condition_value?: string; action: "go_to" | "finish"; destination?: string }[];
}

interface FormTheme {
  bgColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontFamily: string;
}

interface Form {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  logo_position: string;
  theme: FormTheme;
  questions: FormQuestion[];
  settings: any;
  logic_rules: any[];
  status: string;
  crm_funnel_id: string | null;
  crm_stage_id: string | null;
  source_tag: string;
  meta_pixel_id: string;
  ga_id: string;
}

const QUESTION_TYPES = [
  { type: "welcome", label: "Tela de Boas-Vindas", icon: FileText },
  { type: "short_text", label: "Texto Curto", icon: Type },
  { type: "long_text", label: "Texto Longo", icon: AlignLeft },
  { type: "email", label: "Email", icon: Mail },
  { type: "phone", label: "Telefone", icon: Phone },
  { type: "number", label: "Número", icon: Hash },
  { type: "multiple_choice", label: "Múltipla Escolha", icon: ListChecks },
  { type: "checkbox", label: "Checkbox", icon: Check },
  { type: "dropdown", label: "Dropdown", icon: MessageSquare },
  { type: "rating", label: "Avaliação (Estrelas)", icon: Star },
  { type: "opinion_scale", label: "Escala de Opinião", icon: Split },
  { type: "date", label: "Data", icon: Calendar },
  { type: "yes_no", label: "Sim / Não", icon: ToggleLeft },
  { type: "statement", label: "Declaração", icon: FileText },
  { type: "file_upload", label: "Upload de Arquivo", icon: Upload },
] as const;

const DEFAULT_THEME: FormTheme = {
  bgColor: "#0f172a",
  textColor: "#ffffff",
  buttonColor: "#FBBF24",
  buttonTextColor: "#000000",
  fontFamily: "Inter",
};

const AdminFormBuilder = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [activeForm, setActiveForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [activePanel, setActivePanel] = useState<"build" | "design" | "settings" | "logic">("build");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const { data: funnels } = useFunnels();
  const { data: stages } = useStages(activeForm?.crm_funnel_id || "");

  useEffect(() => { loadForms(); }, []);

  const loadForms = async () => {
    setLoading(true);
    const { data } = await supabase.from("forms").select("*").order("created_at", { ascending: false });
    if (data) {
      const mapped = data.map((f: any) => ({
        ...f,
        theme: (f.theme as any) || DEFAULT_THEME,
        questions: (f.questions as any[]) || [],
        settings: (f.settings as any) || {},
        logic_rules: (f.logic_rules as any[]) || [],
        source_tag: f.source_tag || "",
        meta_pixel_id: f.meta_pixel_id || "",
        ga_id: f.ga_id || "",
        logo_position: f.logo_position || "center",
      }));
      setForms(mapped);
    }
    setLoading(false);
  };

  const createForm = async () => {
    const slug = `form-${Date.now()}`;
    const { data, error } = await supabase.from("forms").insert({
      title: "Novo Formulário",
      slug,
      questions: [{ id: crypto.randomUUID(), type: "welcome", title: "Bem-vindo! 👋", description: "Vamos começar. Leva apenas 2 minutos.", required: false }],
      theme: DEFAULT_THEME as any,
      settings: { show_progress: true, allow_back: true, ending_title: "Obrigado! 🎉", ending_description: "Suas respostas foram enviadas com sucesso." } as any,
      logic_rules: [] as any,
    }).select().single();

    if (error) { toast.error("Erro ao criar formulário"); return; }
    if (data) {
      const mapped = { ...data, theme: data.theme as any || DEFAULT_THEME, questions: (data.questions as any[]) || [], settings: data.settings as any || {}, logic_rules: (data.logic_rules as any[]) || [], source_tag: data.source_tag || "", meta_pixel_id: data.meta_pixel_id || "", ga_id: data.ga_id || "", logo_position: data.logo_position || "center" };
      setForms(prev => [mapped, ...prev]);
      setActiveForm(mapped);
      toast.success("Formulário criado!");
    }
  };

  const saveForm = async () => {
    if (!activeForm) return;
    setSaving(true);
    const { error } = await supabase.from("forms").update({
      title: activeForm.title,
      slug: activeForm.slug,
      description: activeForm.description,
      questions: activeForm.questions as any,
      theme: activeForm.theme as any,
      settings: activeForm.settings as any,
      logic_rules: activeForm.logic_rules as any,
      status: activeForm.status,
      crm_funnel_id: activeForm.crm_funnel_id,
      crm_stage_id: activeForm.crm_stage_id,
      source_tag: activeForm.source_tag,
      meta_pixel_id: activeForm.meta_pixel_id,
      ga_id: activeForm.ga_id,
      logo_url: activeForm.logo_url,
      logo_position: activeForm.logo_position,
    }).eq("id", activeForm.id);

    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Salvo!");
    loadForms();
  };

  const deleteForm = async (id: string) => {
    if (!confirm("Deletar formulário?")) return;
    await supabase.from("forms").delete().eq("id", id);
    setForms(prev => prev.filter(f => f.id !== id));
    if (activeForm?.id === id) setActiveForm(null);
    toast.success("Deletado!");
  };

  const addQuestion = (type: string) => {
    if (!activeForm) return;
    const newQ: FormQuestion = {
      id: crypto.randomUUID(),
      type: type as any,
      title: "",
      required: true,
      options: ["multiple_choice", "checkbox", "dropdown"].includes(type) ? ["Opção 1", "Opção 2"] : undefined,
      min: type === "opinion_scale" ? 1 : undefined,
      max: type === "opinion_scale" ? 10 : type === "rating" ? 5 : undefined,
    };
    setActiveForm({ ...activeForm, questions: [...activeForm.questions, newQ] });
    setShowTypeSelector(false);
  };

  const updateQuestion = (idx: number, updates: Partial<FormQuestion>) => {
    if (!activeForm) return;
    const qs = [...activeForm.questions];
    qs[idx] = { ...qs[idx], ...updates };
    setActiveForm({ ...activeForm, questions: qs });
  };

  const removeQuestion = (idx: number) => {
    if (!activeForm) return;
    setActiveForm({ ...activeForm, questions: activeForm.questions.filter((_, i) => i !== idx) });
  };

  const moveQuestion = (idx: number, dir: -1 | 1) => {
    if (!activeForm) return;
    const qs = [...activeForm.questions];
    const target = idx + dir;
    if (target < 0 || target >= qs.length) return;
    [qs[idx], qs[target]] = [qs[target], qs[idx]];
    setActiveForm({ ...activeForm, questions: qs });
  };

  const copySlug = () => {
    if (!activeForm) return;
    const url = `${window.location.origin}/f/${activeForm.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  const getTypeIcon = (type: string) => {
    const found = QUESTION_TYPES.find(t => t.type === type);
    return found ? found.icon : Type;
  };

  if (showPreview && activeForm) {
    return (
      <div className="relative">
        <Button onClick={() => setShowPreview(false)} variant="outline" className="absolute top-4 right-4 z-50">
          <X className="w-4 h-4 mr-2" /> Fechar Preview
        </Button>
        <FormPreview form={activeForm} />
      </div>
    );
  }

  // LIST VIEW
  if (!activeForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Forms</h2>
            <p className="text-sm text-muted-foreground">Formulários conversacionais estilo Typeform</p>
          </div>
          <Button onClick={createForm} className="gap-2"><Plus className="w-4 h-4" /> Novo Formulário</Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : forms.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Nenhum formulário</h3>
            <p className="text-muted-foreground mb-4">Crie seu primeiro formulário conversacional</p>
            <Button onClick={createForm}><Plus className="w-4 h-4 mr-2" /> Criar Formulário</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.filter(f => f.title.toLowerCase().includes(searchTerm.toLowerCase())).map(form => (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-border rounded-xl p-5 hover:border-primary/40 transition-all cursor-pointer group"
                onClick={() => setActiveForm(form)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground truncate">{form.title}</h3>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${form.status === "published" ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                    {form.status === "published" ? "Publicado" : "Rascunho"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{form.questions.length} perguntas</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono">/{form.slug}</span>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100" onClick={e => { e.stopPropagation(); deleteForm(form.id); }}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // EDITOR VIEW
  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setActiveForm(null)}>← Voltar</Button>
          <Input value={activeForm.title} onChange={e => setActiveForm({ ...activeForm, title: e.target.value })} className="font-semibold text-lg border-none bg-transparent max-w-xs" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copySlug}>
            {copiedSlug ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-1" /> Preview
          </Button>
          <select
            value={activeForm.status}
            onChange={e => setActiveForm({ ...activeForm, status: e.target.value })}
            className="text-xs border rounded-md px-2 py-1.5 bg-background text-foreground"
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
          </select>
          <Button onClick={saveForm} disabled={saving} size="sm" className="gap-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
          </Button>
        </div>
      </div>

      {/* Panel Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: "build", label: "Perguntas", icon: ListChecks },
          { id: "design", label: "Design", icon: Palette },
          { id: "settings", label: "Config", icon: Settings },
          { id: "logic", label: "Lógica", icon: Split },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activePanel === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* BUILD PANEL */}
      {activePanel === "build" && (
        <div className="space-y-3">
          {activeForm.questions.map((q, idx) => {
            const Icon = getTypeIcon(q.type);
            return (
              <motion.div key={q.id} layout className="border border-border rounded-xl p-4 space-y-3 bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {QUESTION_TYPES.find(t => t.type === q.type)?.label}
                    </span>
                    <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveQuestion(idx, -1)} className="p-1 hover:bg-secondary rounded"><ArrowUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => moveQuestion(idx, 1)} className="p-1 hover:bg-secondary rounded"><ArrowDown className="w-3.5 h-3.5" /></button>
                    <button onClick={() => removeQuestion(idx)} className="p-1 hover:bg-destructive/10 rounded text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <Input
                  placeholder="Digite a pergunta..."
                  value={q.title}
                  onChange={e => updateQuestion(idx, { title: e.target.value })}
                  className="text-base font-medium"
                />
                {q.type !== "welcome" && q.type !== "statement" && (
                  <Input
                    placeholder="Descrição (opcional)"
                    value={q.description || ""}
                    onChange={e => updateQuestion(idx, { description: e.target.value })}
                    className="text-sm"
                  />
                )}
                {/* Options for choice types */}
                {["multiple_choice", "checkbox", "dropdown"].includes(q.type) && (
                  <div className="space-y-2 pl-4">
                    {(q.options || []).map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5">{String.fromCharCode(65 + oi)}</span>
                        <Input
                          value={opt}
                          onChange={e => {
                            const opts = [...(q.options || [])];
                            opts[oi] = e.target.value;
                            updateQuestion(idx, { options: opts });
                          }}
                          className="text-sm flex-1"
                        />
                        <button onClick={() => updateQuestion(idx, { options: (q.options || []).filter((_, i) => i !== oi) })} className="text-destructive hover:bg-destructive/10 rounded p-1">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => updateQuestion(idx, { options: [...(q.options || []), `Opção ${(q.options?.length || 0) + 1}`] })}>
                      <Plus className="w-3 h-3 mr-1" /> Adicionar opção
                    </Button>
                  </div>
                )}
                {/* Rating config */}
                {q.type === "rating" && (
                  <div className="flex items-center gap-3 pl-4">
                    <span className="text-sm text-muted-foreground">Máx:</span>
                    <Input type="number" value={q.max || 5} onChange={e => updateQuestion(idx, { max: parseInt(e.target.value) })} className="w-20" min={3} max={10} />
                  </div>
                )}
                {/* Opinion scale config */}
                {q.type === "opinion_scale" && (
                  <div className="flex items-center gap-3 pl-4">
                    <span className="text-sm text-muted-foreground">De</span>
                    <Input type="number" value={q.min || 1} onChange={e => updateQuestion(idx, { min: parseInt(e.target.value) })} className="w-16" />
                    <span className="text-sm text-muted-foreground">até</span>
                    <Input type="number" value={q.max || 10} onChange={e => updateQuestion(idx, { max: parseInt(e.target.value) })} className="w-16" />
                  </div>
                )}
                {/* Required toggle */}
                {q.type !== "welcome" && q.type !== "statement" && (
                  <label className="flex items-center gap-2 text-sm text-muted-foreground pl-4">
                    <input type="checkbox" checked={q.required !== false} onChange={e => updateQuestion(idx, { required: e.target.checked })} className="rounded" />
                    Obrigatória
                  </label>
                )}
              </motion.div>
            );
          })}

          {/* Add Question */}
          <div className="relative">
            <Button variant="outline" className="w-full border-dashed gap-2" onClick={() => setShowTypeSelector(!showTypeSelector)}>
              <Plus className="w-4 h-4" /> Adicionar Pergunta
            </Button>
            <AnimatePresence>
              {showTypeSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-20 mt-2 w-full bg-popover border border-border rounded-xl shadow-lg p-3 grid grid-cols-2 md:grid-cols-3 gap-2"
                >
                  {QUESTION_TYPES.map(qt => (
                    <button
                      key={qt.type}
                      onClick={() => addQuestion(qt.type)}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-secondary transition-colors text-left"
                    >
                      <qt.icon className="w-4 h-4 text-primary shrink-0" />
                      {qt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* DESIGN PANEL */}
      {activePanel === "design" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          {[
            { key: "bgColor", label: "Cor de Fundo" },
            { key: "textColor", label: "Cor do Texto" },
            { key: "buttonColor", label: "Cor do Botão" },
            { key: "buttonTextColor", label: "Texto do Botão" },
          ].map(c => (
            <div key={c.key} className="space-y-1">
              <label className="text-sm font-medium text-foreground">{c.label}</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={(activeForm.theme as any)[c.key]}
                  onChange={e => setActiveForm({ ...activeForm, theme: { ...activeForm.theme, [c.key]: e.target.value } })}
                  className="w-10 h-10 rounded cursor-pointer border border-border"
                />
                <Input
                  value={(activeForm.theme as any)[c.key]}
                  onChange={e => setActiveForm({ ...activeForm, theme: { ...activeForm.theme, [c.key]: e.target.value } })}
                />
              </div>
            </div>
          ))}
          <div className="space-y-1 col-span-full">
            <label className="text-sm font-medium text-foreground">Fonte</label>
            <select
              value={activeForm.theme.fontFamily}
              onChange={e => setActiveForm({ ...activeForm, theme: { ...activeForm.theme, fontFamily: e.target.value } })}
              className="w-full border rounded-md px-3 py-2 bg-background text-foreground"
            >
              {["Inter", "Poppins", "Roboto", "Montserrat", "Open Sans", "Lato", "Raleway", "DM Sans"].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 col-span-full">
            <label className="text-sm font-medium text-foreground">Logo URL</label>
            <Input value={activeForm.logo_url || ""} onChange={e => setActiveForm({ ...activeForm, logo_url: e.target.value })} placeholder="https://..." />
          </div>
        </div>
      )}

      {/* SETTINGS PANEL */}
      {activePanel === "settings" && (
        <div className="space-y-6 max-w-2xl">
          {/* Slug */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Slug</label>
            <div className="flex gap-2">
              <Input value={activeForm.slug} onChange={e => setActiveForm({ ...activeForm, slug: e.target.value })} />
              <Button variant="outline" onClick={copySlug}>{copiedSlug ? <Check className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}</Button>
            </div>
          </div>

          {/* CRM Integration */}
          <div className="border border-border rounded-xl p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Integração CRM</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Pipeline</label>
                <select
                  value={activeForm.crm_funnel_id || ""}
                  onChange={e => setActiveForm({ ...activeForm, crm_funnel_id: e.target.value || null, crm_stage_id: null })}
                  className="w-full border rounded-md px-3 py-2 bg-background text-foreground"
                >
                  <option value="">Nenhum</option>
                  {(funnels || []).map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Etapa Inicial</label>
                <select
                  value={activeForm.crm_stage_id || ""}
                  onChange={e => setActiveForm({ ...activeForm, crm_stage_id: e.target.value || null })}
                  className="w-full border rounded-md px-3 py-2 bg-background text-foreground"
                  disabled={!activeForm.crm_funnel_id}
                >
                  <option value="">Selecione</option>
                  {(stages || []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Tag de Origem</label>
              <Input value={activeForm.source_tag} onChange={e => setActiveForm({ ...activeForm, source_tag: e.target.value })} placeholder="ex: formulario-contato" />
              <p className="text-xs text-muted-foreground">Tag adicionada automaticamente ao lead criado no CRM</p>
            </div>
          </div>

          {/* Ending */}
          <div className="border border-border rounded-xl p-4 space-y-3">
            <h3 className="font-semibold">Tela Final</h3>
            <Input
              value={activeForm.settings?.ending_title || ""}
              onChange={e => setActiveForm({ ...activeForm, settings: { ...activeForm.settings, ending_title: e.target.value } })}
              placeholder="Título final"
            />
            <Textarea
              value={activeForm.settings?.ending_description || ""}
              onChange={e => setActiveForm({ ...activeForm, settings: { ...activeForm.settings, ending_description: e.target.value } })}
              placeholder="Descrição final"
              rows={2}
            />
          </div>

          {/* Pixels */}
          <div className="border border-border rounded-xl p-4 space-y-3">
            <h3 className="font-semibold">Tracking & Pixels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Meta Pixel ID</label>
                <Input value={activeForm.meta_pixel_id} onChange={e => setActiveForm({ ...activeForm, meta_pixel_id: e.target.value })} placeholder="123456789" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Google Analytics ID</label>
                <Input value={activeForm.ga_id} onChange={e => setActiveForm({ ...activeForm, ga_id: e.target.value })} placeholder="G-XXXXXX" />
              </div>
            </div>
          </div>

          {/* Settings toggles */}
          <div className="border border-border rounded-xl p-4 space-y-3">
            <h3 className="font-semibold">Comportamento</h3>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={activeForm.settings?.show_progress !== false} onChange={e => setActiveForm({ ...activeForm, settings: { ...activeForm.settings, show_progress: e.target.checked } })} className="rounded" />
              Mostrar barra de progresso
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={activeForm.settings?.allow_back !== false} onChange={e => setActiveForm({ ...activeForm, settings: { ...activeForm.settings, allow_back: e.target.checked } })} className="rounded" />
              Permitir voltar
            </label>
          </div>
        </div>
      )}

      {/* LOGIC PANEL */}
      {activePanel === "logic" && (
        <div className="space-y-4 max-w-2xl">
          <p className="text-sm text-muted-foreground">Configure a lógica condicional por pergunta. Quando uma condição é atendida, o usuário pula para outra pergunta.</p>
          {activeForm.questions.filter(q => ["multiple_choice", "dropdown", "yes_no"].includes(q.type)).map((q, idx) => {
            const realIdx = activeForm.questions.findIndex(x => x.id === q.id);
            return (
              <div key={q.id} className="border border-border rounded-xl p-4 space-y-3">
                <h4 className="font-medium text-sm">#{realIdx + 1} — {q.title || "(sem título)"}</h4>
                {(q.logic || []).map((rule, ri) => (
                  <div key={ri} className="flex items-center gap-2 text-sm pl-4">
                    <span>Se</span>
                    <Input value={rule.condition_value || ""} onChange={e => {
                      const logic = [...(q.logic || [])];
                      logic[ri] = { ...logic[ri], condition_value: e.target.value };
                      updateQuestion(realIdx, { logic });
                    }} className="w-32" placeholder="resposta" />
                    <span>→</span>
                    <select
                      value={rule.action}
                      onChange={e => {
                        const logic = [...(q.logic || [])];
                        logic[ri] = { ...logic[ri], action: e.target.value as any };
                        updateQuestion(realIdx, { logic });
                      }}
                      className="border rounded-md px-2 py-1 bg-background text-foreground text-sm"
                    >
                      <option value="go_to">Ir para</option>
                      <option value="finish">Finalizar</option>
                    </select>
                    {rule.action === "go_to" && (
                      <select
                        value={rule.destination || ""}
                        onChange={e => {
                          const logic = [...(q.logic || [])];
                          logic[ri] = { ...logic[ri], destination: e.target.value };
                          updateQuestion(realIdx, { logic });
                        }}
                        className="border rounded-md px-2 py-1 bg-background text-foreground text-sm"
                      >
                        <option value="">Selecione</option>
                        {activeForm.questions.map((tq, ti) => (
                          <option key={tq.id} value={tq.id}>#{ti + 1} {tq.title?.slice(0, 30)}</option>
                        ))}
                      </select>
                    )}
                    <button onClick={() => {
                      const logic = (q.logic || []).filter((_, i) => i !== ri);
                      updateQuestion(realIdx, { logic });
                    }} className="text-destructive"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={() => {
                  const logic = [...(q.logic || []), { action: "go_to" as const, condition_value: "", destination: "" }];
                  updateQuestion(realIdx, { logic });
                }}>
                  <Plus className="w-3 h-3 mr-1" /> Regra
                </Button>
              </div>
            );
          })}
          {activeForm.questions.filter(q => ["multiple_choice", "dropdown", "yes_no"].includes(q.type)).length === 0 && (
            <p className="text-center text-muted-foreground py-8">Adicione perguntas de múltipla escolha, dropdown ou sim/não para configurar lógica condicional.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminFormBuilder;
