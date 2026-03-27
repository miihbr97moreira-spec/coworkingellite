import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  onUpload: (base64: string, fileName: string) => void;
  onRemove?: () => void;
  currentImage?: string;
  label?: string;
  accept?: string;
}

const ImageUploader = ({
  onUpload,
  onRemove,
  currentImage,
  label = "Upload de Imagem",
  accept = "image/*"
}: ImageUploaderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileConversion = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onUpload(base64, file.name);
        toast.success(`Imagem "${file.name}" enviada com sucesso!`);
      };
      reader.onerror = () => {
        toast.error("Erro ao ler o arquivo.");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Erro ao processar a imagem.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileConversion(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileConversion(file);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold uppercase block text-muted-foreground">{label}</label>

      {currentImage ? (
        <div className="relative group">
          <div className="rounded-lg overflow-hidden border border-border/40 bg-secondary/20 aspect-video flex items-center justify-center">
            <img
              src={currentImage}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              title="Substituir imagem"
            >
              <Upload className="w-4 h-4" />
            </button>
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                title="Remover imagem"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border/40 hover:border-primary/50 hover:bg-secondary/30"
          }`}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Processando imagem...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Clique ou arraste uma imagem</p>
                <p className="text-[10px] text-muted-foreground">PNG, JPG, WEBP, SVG (máx 5MB)</p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ImageUploader;
