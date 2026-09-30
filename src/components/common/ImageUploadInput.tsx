import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Check, RefreshCw, Link as LinkIcon } from 'lucide-react';

interface ImageUploadInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  presetAvatars?: string[];
  placeholder?: string;
  shape?: 'circle' | 'rounded' | 'banner';
  aspectRatioLabel?: string;
  helpText?: string;
  id?: string;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  label,
  value,
  onChange,
  presetAvatars = [],
  placeholder = 'https://ejemplo.com/imagen.jpg',
  shape = 'rounded',
  aspectRatioLabel = 'Recomendado: imagen cuadrada (1:1), JPG o PNG',
  helpText,
  id
}) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrlInput(value);
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP, SVG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onChange(result);
        setUrlInput(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleUrlApply = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  return (
    <div className="space-y-3" id={id}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-stone-800">{label}</label>
        <div className="flex items-center bg-stone-100 p-0.5 rounded-lg text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              mode === 'upload' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Subir Archivo
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              mode === 'url' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            URL Externa
          </button>
        </div>
      </div>

      {shape === 'banner' ? (
        <div className="space-y-3">
          {/* Panoramic Banner Preview */}
          <div className="relative group w-full h-32 sm:h-44 rounded-2xl overflow-hidden bg-stone-900 border-2 border-stone-200 shadow-2xs">
            {value ? (
              <img
                src={value}
                alt="Banner de portada"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80';
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-100">
                <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                <span className="text-xs font-semibold">Sin imagen de portada cargada</span>
              </div>
            )}
            
            {/* Quick overlay change button */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-stone-900/80 hover:bg-stone-900 text-white rounded-xl text-xs font-bold shadow-xs backdrop-blur-xs flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Cargar Nueva Imagen</span>
              </button>
            </div>
          </div>

          {/* Upload Drop Zone / URL Input */}
          <div className="w-full">
            {mode === 'upload' ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                  dragActive 
                    ? 'border-red-500 bg-red-50/50' 
                    : 'border-stone-300 hover:border-stone-400 bg-stone-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-6 h-6 mx-auto text-stone-400 mb-1" />
                <p className="text-xs font-semibold text-stone-700">
                  Arrastra tu banner aquí o <span className="text-red-600 underline">haz clic para seleccionar imagen</span>
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">{aspectRatioLabel}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5" />
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder={placeholder}
                      className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleUrlApply}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
                  >
                    Aplicar
                  </button>
                </div>
                <p className="text-[10px] text-stone-400">Pega el enlace web directo de la imagen de portada</p>
              </div>
            )}

            {/* Quick presets if available */}
            {presetAvatars.length > 0 && (
              <div className="mt-3">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                  O elige una portada sugerida:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {presetAvatars.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onChange(preset);
                        setUrlInput(preset);
                      }}
                      className={`relative h-14 rounded-xl overflow-hidden border-2 transition-all hover:opacity-90 ${
                        value === preset ? 'border-red-600 ring-2 ring-red-200' : 'border-stone-200'
                      }`}
                    >
                      <img src={preset} alt={`Portada ${idx + 1}`} className="w-full h-full object-cover" />
                      {value === preset && (
                        <span className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Preview */}
          <div className="relative group shrink-0">
            <div
              className={`w-20 h-20 overflow-hidden bg-stone-100 border-2 border-stone-200 shadow-2xs flex items-center justify-center ${
                shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
              }`}
            >
              {value ? (
                <img
                  src={value}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                  }}
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-stone-300" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-stone-900 text-white p-1 rounded-full shadow-xs hover:bg-red-600 transition-colors"
              title="Cambiar foto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Input & Drag Drop Area */}
          <div className="flex-1 w-full">
            {mode === 'upload' ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-colors ${
                  dragActive 
                    ? 'border-red-500 bg-red-50/50' 
                    : 'border-stone-300 hover:border-stone-400 bg-stone-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-5 h-5 mx-auto text-stone-400 mb-1" />
                <p className="text-xs font-semibold text-stone-700">
                  Arrastra tu imagen o <span className="text-red-600 underline">haz clic para examinar</span>
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">{aspectRatioLabel}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5" />
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder={placeholder}
                      className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleUrlApply}
                    className="px-3 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
                <p className="text-[10px] text-stone-400">Pega un enlace directo de imagen web (JPG, PNG, WebP)</p>
              </div>
            )}

            {/* Quick presets if available */}
            {presetAvatars.length > 0 && (
              <div className="mt-2.5">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  O elige un avatar sugerido:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {presetAvatars.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onChange(preset);
                        setUrlInput(preset);
                      }}
                      className={`relative w-8 h-8 rounded-full overflow-hidden border-2 transition-transform hover:scale-105 ${
                        value === preset ? 'border-red-600 ring-2 ring-red-200' : 'border-stone-200'
                      }`}
                    >
                      <img src={preset} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                      {value === preset && (
                        <span className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {helpText && (
        <p className="text-[11px] text-stone-500">{helpText}</p>
      )}
    </div>
  );
};
