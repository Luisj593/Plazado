import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Trash2, 
  Star, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Link as LinkIcon, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  FileImage
} from 'lucide-react';

interface ProductImagesManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  minRecommended?: number;
  maxImages?: number;
}

export const ProductImagesManager: React.FC<ProductImagesManagerProps> = ({
  images,
  onChange,
  minRecommended = 1,
  maxImages = 5
}) => {
  const [urlInputIndex, setUrlInputIndex] = useState<number | null>(null);
  const [tempUrl, setTempUrl] = useState('');
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [bulkDragActive, setBulkDragActive] = useState(false);

  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Helper to resize/compress images for fast performance in browser
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Formato no válido. Debe ser una imagen (JPG, PNG, WEBP).'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Max dimension 1200px for web storage efficiency
          const maxDimension = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = () => resolve(event.target?.result as string);
        img.src = event.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Handle single file upload for a specific slot index
  const handleSlotFileChange = async (index: number, file?: File) => {
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file);
      const newImages = [...images];
      if (index < newImages.length) {
        newImages[index] = dataUrl;
      } else {
        newImages.push(dataUrl);
      }
      onChange(newImages);
      setUrlInputIndex(null);
    } catch (err: any) {
      alert(err.message || 'Error al procesar la imagen');
    }
  };

  // Handle bulk file selection (upload multiple at once)
  const handleBulkFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const availableSlots = maxImages - images.length;
    const filesToProcess = fileList.slice(0, availableSlots);

    try {
      const processed = await Promise.all(
        filesToProcess.map(f => processImageFile(f).catch(() => null))
      );
      const validProcessed = processed.filter((item): item is string => !!item);
      if (validProcessed.length > 0) {
        onChange([...images, ...validProcessed].slice(0, maxImages));
      }
    } catch {
      // Ignored
    }
  };

  // Apply manual URL to a slot
  const handleApplyUrl = (index: number) => {
    if (!tempUrl.trim()) return;
    const newImages = [...images];
    if (index < newImages.length) {
      newImages[index] = tempUrl.trim();
    } else {
      newImages.push(tempUrl.trim());
    }
    onChange(newImages);
    setTempUrl('');
    setUrlInputIndex(null);
  };

  // Remove photo at index
  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
    if (urlInputIndex === index) {
      setUrlInputIndex(null);
    }
  };

  // Move photo left / earlier
  const handleMoveLeft = (index: number) => {
    if (index <= 0) return;
    const newImages = [...images];
    const temp = newImages[index - 1];
    newImages[index - 1] = newImages[index];
    newImages[index] = temp;
    onChange(newImages);
  };

  // Move photo right / later
  const handleMoveRight = (index: number) => {
    if (index >= images.length - 1) return;
    const newImages = [...images];
    const temp = newImages[index + 1];
    newImages[index + 1] = newImages[index];
    newImages[index] = temp;
    onChange(newImages);
  };

  // Set as primary/cover (move to index 0)
  const handleSetAsCover = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const [selected] = newImages.splice(index, 1);
    newImages.unshift(selected);
    onChange(newImages);
  };

  // Calculate target slots to display (at least minRecommended, or current images count + 1 up to maxImages)
  const displayCount = Math.min(
    maxImages,
    Math.max(minRecommended, images.length < maxImages ? images.length + 1 : images.length)
  );
  const slots = Array.from({ length: displayCount }, (_, i) => i);

  return (
    <div className="space-y-3.5 bg-stone-50 border border-stone-200 rounded-2xl p-4">
      {/* Header with recommendation status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
              Fotos del Producto ({images.length} de {maxImages} permitidas)
            </h4>
            {images.length >= 1 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {images.length} {images.length === 1 ? 'foto subida' : 'fotos subidas'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                Mínimo 1 imagen obligatoria
              </span>
            )}
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Sube entre 1 y hasta 5 fotos del producto. La primera foto es la portada principal. Puedes arrastrar o reordenar cuál será la principal.
          </p>
        </div>

        {/* Bulk upload button */}
        {images.length < maxImages && (
          <div className="shrink-0">
            <input
              ref={bulkFileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                handleBulkFiles(e.target.files);
                if (e.target) e.target.value = '';
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => bulkFileInputRef.current?.click()}
              className="w-full sm:w-auto px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir Varias Fotos a la Vez</span>
            </button>
          </div>
        )}
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {slots.map((slotIndex) => {
          const imgUrl = images[slotIndex];
          const isCover = slotIndex === 0;
          const isUrlActive = urlInputIndex === slotIndex;

          return (
            <div
              key={slotIndex}
              className={`relative rounded-xl border-2 transition-all flex flex-col justify-between overflow-hidden bg-white shadow-2xs ${
                imgUrl
                  ? 'border-stone-200 hover:border-stone-300'
                  : slotIndex < minRecommended
                  ? 'border-dashed border-red-300 bg-red-50/20'
                  : 'border-dashed border-stone-300 hover:border-stone-400'
              } ${dragOverIndex === slotIndex ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
            >
              {/* Top slot header / badge */}
              <div className="p-1.5 bg-stone-100/90 border-b border-stone-200 flex items-center justify-between text-[10px]">
                <span className="font-bold text-stone-700">
                  {isCover ? (
                    <span className="text-red-700 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-red-600 text-red-600" />
                      Portada
                    </span>
                  ) : (
                    `Foto ${slotIndex + 1}`
                  )}
                </span>
                {slotIndex < minRecommended && !imgUrl && (
                  <span className="text-[9px] text-red-600 font-semibold">Requerida</span>
                )}
              </div>

              {/* Slot Content */}
              {imgUrl ? (
                <div className="relative group p-1 flex-1 flex flex-col justify-center">
                  <div className="aspect-square w-full rounded-lg overflow-hidden bg-stone-100 relative">
                    <img
                      src={imgUrl}
                      alt={`Foto ${slotIndex + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>

                  {/* Actions Toolbar */}
                  <div className="mt-1.5 flex items-center justify-between gap-1 pt-1 border-t border-stone-100">
                    <div className="flex items-center gap-0.5">
                      {/* Move left */}
                      {slotIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveLeft(slotIndex)}
                          className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                          title="Mover a la izquierda"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                      )}

                      {/* Move right */}
                      {slotIndex < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveRight(slotIndex)}
                          className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                          title="Mover a la derecha"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {/* Make cover */}
                      {!isCover && (
                        <button
                          type="button"
                          onClick={() => handleSetAsCover(slotIndex)}
                          className="p-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors text-[10px] font-semibold flex items-center gap-0.5"
                          title="Hacer Foto de Portada"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(slotIndex)}
                      className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : isUrlActive ? (
                /* URL Input view for this slot */
                <div className="p-2 space-y-2 flex-1 flex flex-col justify-center">
                  <p className="text-[10px] font-semibold text-stone-700">Enlace de la Foto {slotIndex + 1}:</p>
                  <input
                    type="url"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-1.5 text-xs bg-white border border-stone-300 rounded outline-none focus:border-red-500"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleApplyUrl(slotIndex)}
                      className="flex-1 py-1 bg-red-600 text-white rounded text-[10px] font-bold"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUrlInputIndex(null);
                        setTempUrl('');
                      }}
                      className="py-1 px-1.5 bg-stone-200 text-stone-700 rounded text-[10px]"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty Upload Slot */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIndex(slotIndex);
                  }}
                  onDragLeave={() => setDragOverIndex(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverIndex(null);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleSlotFileChange(slotIndex, e.dataTransfer.files[0]);
                    }
                  }}
                  className="p-3 flex-1 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:bg-stone-50 transition-colors min-h-[130px]"
                  onClick={() => singleFileInputRefs.current[slotIndex]?.click()}
                >
                  <input
                    ref={(el) => {
                      singleFileInputRefs.current[slotIndex] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleSlotFileChange(slotIndex, e.target.files[0]);
                      }
                      if (e.target) e.target.value = '';
                    }}
                  />

                  <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                    <Upload className="w-4 h-4 text-stone-500" />
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold text-stone-700">Subir Foto {slotIndex + 1}</p>
                    <p className="text-[9px] text-stone-400">JPG, PNG o WebP</p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUrlInputIndex(slotIndex);
                      setTempUrl('');
                    }}
                    className="text-[10px] text-red-600 hover:text-red-700 font-semibold underline flex items-center gap-0.5 mt-1"
                  >
                    <LinkIcon className="w-2.5 h-2.5" />
                    <span>o poner link</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer tips */}
      <div className="pt-2 border-t border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-stone-500">
        <div className="flex items-center gap-1.5">
          <FileImage className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span>La <strong>Foto 1</strong> será la imagen de portada en el catálogo y los resultados de búsqueda.</span>
        </div>
        <span className="text-stone-400 text-[10px]">
          Puedes arrastrar o reordenar con las flechas en cada foto.
        </span>
      </div>
    </div>
  );
};
