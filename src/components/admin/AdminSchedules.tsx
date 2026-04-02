import { useState } from "react";
import { Plus, Loader2, Search, Trash2, Edit2, Eye, EyeOff, Calendar, Clock, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { useSchedules, useCreateSchedule, useUpdateSchedule, useDeleteSchedule } from "@/hooks/useSchedulesQuery";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { generateSlug } from "@/utils/scheduleUtils";
import { Schedule } from "@/types/schedules";
import ScheduleDetails from "./ScheduleDetails";

const AdminSchedules = () => {
  const { data: schedules = [], isLoading } = useSchedules();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slug: "",
    timezone: "America/Sao_Paulo",
    default_duration_minutes: 30,
  });

  const filteredSchedules = schedules.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenDialog = (schedule?: Schedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        name: schedule.name,
        description: schedule.description || "",
        slug: schedule.slug,
        timezone: schedule.timezone,
        default_duration_minutes: schedule.default_duration_minutes,
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        name: "",
        description: "",
        slug: "",
        timezone: "America/Sao_Paulo",
        default_duration_minutes: 30,
      });
    }
    setIsDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error("Nome e slug são obrigatórios");
      return;
    }

    try {
      if (editingSchedule) {
        await updateSchedule.mutateAsync({
          id: editingSchedule.id,
          ...formData,
        });
        toast.success("Agenda atualizada com sucesso!");
      } else {
        await createSchedule.mutateAsync(formData as any);
        toast.success("Agenda criada com sucesso!");
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar agenda");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta agenda?")) return;
    try {
      await deleteSchedule.mutateAsync(id);
      toast.success("Agenda deletada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar agenda");
    }
  };

  const handleTogglePublish = async (schedule: Schedule) => {
    try {
      await updateSchedule.mutateAsync({
        id: schedule.id,
        is_published: !schedule.is_published,
      });
      toast.success(schedule.is_published ? "Agenda despublicada" : "Agenda publicada");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedScheduleId) {
    return <ScheduleDetails scheduleId={selectedScheduleId} onBack={() => setSelectedScheduleId(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agendas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus agendamentos e serviços</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Agenda
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar agendas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Schedules Grid */}
      {filteredSchedules.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma agenda criada ainda</p>
          <Button variant="outline" onClick={() => handleOpenDialog()} className="mt-4">
            Criar primeira agenda
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchedules.map((schedule, idx) => (
            <motion.div
              key={schedule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{schedule.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{schedule.slug}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleTogglePublish(schedule)}
                    className="p-1.5 hover:bg-secondary rounded transition-colors"
                    title={schedule.is_published ? "Despublicar" : "Publicar"}
                  >
                    {schedule.is_published ? (
                      <Eye className="w-4 h-4 text-primary" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenDialog(schedule)}
                    className="p-1.5 hover:bg-secondary rounded transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
                    title="Deletar"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>

              {schedule.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{schedule.description}</p>
              )}

              <div className="space-y-2 pt-3 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{schedule.default_duration_minutes}min padrão</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <LinkIcon className="w-3 h-3" />
                  <span className="truncate">/agenda/{schedule.slug}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border/50 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setSelectedScheduleId(schedule.id)}
                >
                  Configurar
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? "Editar Agenda" : "Nova Agenda"}</DialogTitle>
            <DialogDescription>
              {editingSchedule ? "Atualize os detalhes da sua agenda" : "Crie uma nova agenda para seus agendamentos"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Agenda</label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Consultas Médicas"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Slug (URL)</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="consultas-medicas"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">URL pública: /agenda/{formData.slug}</p>
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva sua agenda..."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData((prev) => ({ ...prev, timezone: e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm"
              >
                <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                <option value="America/Brasilia">Brasília (GMT-3)</option>
                <option value="America/Recife">Recife (GMT-3)</option>
                <option value="America/Manaus">Manaus (GMT-4)</option>
                <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Duração Padrão (minutos)</label>
              <Input
                type="number"
                value={formData.default_duration_minutes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    default_duration_minutes: parseInt(e.target.value) || 30,
                  }))
                }
                min="15"
                max="480"
                step="15"
                className="mt-1"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={createSchedule.isPending || updateSchedule.isPending}
                className="flex-1"
              >
                {createSchedule.isPending || updateSchedule.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </div>
        </DialogConten        </Button>
      </Dialog>
    </div>
  );
};

export default AdminSchedules;