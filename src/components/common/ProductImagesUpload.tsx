import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Star, Plus } from 'lucide-react';

interface ProductImagesUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export const ProductImagesUpload: React.FC<ProductImagesUploadProps> = ({
  images = [],
  onChange,
  maxImages = 5
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    if (images.length >= maxImages) {
      setErrorMsg(`Solo puedes agregar un máximo de ${maxImages} imágenes por producto`);
      return;
    }
    const cleanUrl = urlInput.trim();
    onChange([...images, cleanUrl]);
    setUrlInput('');
    setErrorMsg('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    onChange(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const selected = images[index];
    const remaining = images.filter((_, idx) => idx !== index);
    onChange([selected, ...remaining]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block font-semibold text-stone-700 text-xs">
          Galería de Fotos del Producto ({images.length}/{maxImages})
        </label>
        <span className="text-[11px] text-stone-500 font-medium">
          Hasta {maxImages} fotos • La 1ª foto es la portada principal
        </span>
      </div>

      {/* Grid of uploaded images */}
      <div className="grid grid-cols-5 gap-2.5">
        {images.map((imgUrl, index) => (
          <div 
            key={`${imgUrl}-${index}`}
            className="group relative aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-2xs"
          >
            <img data-product-image="true" 
              src={imgUrl} 
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&auto=format&fit=crop&q=80';
              }}
            />
            {index === 0 && (
              <span className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-current" /> Portada
              </span>
            )}

            <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(index)}
                  className="p-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold"
                  title="Hacer Portada"
                >
                  <Star className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px]"
                title="Eliminar Foto"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {/* Empty placeholder slots */}
        {Array.from({ length: Math.max(0, maxImages - images.length) }).map((_, idx) => (
          <div 
            key={`empty-${idx}`}
            className="aspect-square rounded-xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center p-2 text-stone-400 bg-stone-50/50"
          >
            <ImageIcon className="w-4 h-4 mb-0.5 opacity-60" />
            <span className="text-[10px] text-center font-medium">Slot {images.length + idx + 1}</span>
          </div>
        ))}
      </div>

      {/* Add by URL input */}
      {images.length < maxImages && (
        <div className="space-y-2 pt-1">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://ejemplo.com/foto-producto.jpg"
              className="flex-1 p-2 text-xs bg-stone-50 border border-stone-300 rounded-lg outline-none focus:border-red-500"
            />
            <button
              type="button"
              onClick={handleAddUrl}
              className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar Foto
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <p className="text-rose-600 text-xs font-semibold">{errorMsg}</p>
      )}
    </div>
  );
};
