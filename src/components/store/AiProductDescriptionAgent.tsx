import React, { useState } from 'react';
import { Sparkles, Wand2, Bot, Check, RotateCcw, AlertCircle, Loader2, Tag, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { api } from '../../services/api';

interface AiProductDescriptionAgentProps {
  productName: string;
  categoryName?: string;
  storeName?: string;
  price?: number;
  promoPrice?: number;
  currentDescription: string;
  onDescriptionGenerated: (newDescription: string) => void;
  showNotification?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const AiProductDescriptionAgent: React.FC<AiProductDescriptionAgentProps> = ({
  productName,
  categoryName,
  storeName,
  price,
  promoPrice,
  currentDescription,
  onDescriptionGenerated,
  showNotification
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tone, setTone] = useState<'persuasive' | 'technical' | 'premium' | 'concise'>('persuasive');
  const [keywords, setKeywords] = useState('');
  const [previousDescription, setPreviousDescription] = useState<string | null>(null);
  const [lastGeneratedHighlights, setLastGeneratedHighlights] = useState<string[]>([]);
  const [lastGeneratedTags, setLastGeneratedTags] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const cleanName = productName.trim();
    if (!cleanName) {
      setErrorMsg('Escribe primero el Nombre del Producto arriba para que el Agente IA pueda generar su descripción.');
      if (showNotification) {
        showNotification('Ingresa el nombre del producto primero', 'error');
      }
      return;
    }

    setIsLoading(true);
    setPreviousDescription(currentDescription || null);

    try {
      const res = await api.generateProductDescription({
        productName: cleanName,
        categoryName,
        storeName,
        price,
        promoPrice,
        tone,
        keywords: keywords.trim() || undefined
      });

      if (res && res.success && res.description) {
        onDescriptionGenerated(res.description);
        if (res.highlights && res.highlights.length > 0) {
          setLastGeneratedHighlights(res.highlights);
        }
        if (res.tags && res.tags.length > 0) {
          setLastGeneratedTags(res.tags);
        }
        if (showNotification) {
          showNotification('¡Descripción redactada con éxito por el Agente IA!', 'success');
        }
      } else {
        throw new Error('No se recibió la descripción generada');
      }
    } catch (err: any) {
      console.error('Error generando descripción:', err);
      setErrorMsg(err.message || 'No se pudo generar la descripción en este momento.');
      if (showNotification) {
        showNotification(err.message || 'Error con el Agente de IA', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndo = () => {
    if (previousDescription !== null) {
      onDescriptionGenerated(previousDescription);
      setPreviousDescription(null);
      if (showNotification) {
        showNotification('Descripción anterior restaurada', 'info');
      }
    }
  };

  return (
    <div className="bg-gradient-to-r from-red-50/70 via-amber-50/50 to-orange-50/60 border border-red-200/80 rounded-xl p-3 mb-2 shadow-2xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-amber-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-stone-900 text-xs flex items-center gap-1">
                Agente IA PlazaDO
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-red-600 text-white px-1.5 py-0.2 rounded">
                Smart Copy
              </span>
            </div>
            <p className="text-[11px] text-stone-500 hidden sm:block">
              Genera redacción comercial optimizada para vender tu producto
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {previousDescription !== null && (
            <button
              type="button"
              onClick={handleUndo}
              className="px-2.5 py-1 text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 rounded-lg text-xs font-semibold border border-stone-200 flex items-center gap-1 transition-colors"
              title="Restaurar descripción anterior"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden md:inline">Deshacer</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-2.5 py-1 text-stone-600 hover:text-stone-900 bg-white/80 hover:bg-white rounded-lg text-xs font-semibold border border-stone-200/80 flex items-center gap-1 transition-colors"
            title="Ajustar tono y detalles"
          >
            <SlidersHorizontal className="w-3 h-3 text-stone-500" />
            <span className="hidden sm:inline">Ajustes</span>
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={isLoading}
            className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Redactando...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>Generar con IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Controls Drawer */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-red-200/60 space-y-2.5 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Tono de Comunicación:
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setTone('persuasive')}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    tone === 'persuasive'
                      ? 'bg-red-600 text-white border-red-600 font-bold shadow-2xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-red-300'
                  }`}
                >
                  🚀 Persuasivo (Ventas)
                </button>
                <button
                  type="button"
                  onClick={() => setTone('technical')}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    tone === 'technical'
                      ? 'bg-red-600 text-white border-red-600 font-bold shadow-2xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-red-300'
                  }`}
                >
                  📋 Técnico (Specs)
                </button>
                <button
                  type="button"
                  onClick={() => setTone('premium')}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    tone === 'premium'
                      ? 'bg-red-600 text-white border-red-600 font-bold shadow-2xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-red-300'
                  }`}
                >
                  ✨ Elegante (Premium)
                </button>
                <button
                  type="button"
                  onClick={() => setTone('concise')}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    tone === 'concise'
                      ? 'bg-red-600 text-white border-red-600 font-bold shadow-2xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-red-300'
                  }`}
                >
                  ⚡ Directo y Breve
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Detalles específicos o palabras clave (Opcional):
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Ej: 100% lino, resistente al agua, hecho a mano"
                className="w-full p-2 text-xs bg-white border border-stone-300 rounded-lg outline-none focus:border-red-500"
              />
              <p className="text-[10px] text-stone-500 mt-1">
                La IA incorporará estos detalles en las viñetas y el gancho publicitario.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isLoading}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generando descripción...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Aplicar Redacción Inteligente</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error alert if any */}
      {errorMsg && (
        <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Highlights & Tags generated preview */}
      {lastGeneratedHighlights.length > 0 && !isOpen && (
        <div className="mt-2 pt-2 border-t border-red-200/50 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-600">
          <span className="font-bold text-stone-700 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-600" /> Viñetas incluidas:
          </span>
          {lastGeneratedHighlights.slice(0, 3).map((h, i) => (
            <span key={i} className="bg-white/80 border border-stone-200 px-2 py-0.5 rounded-md text-[10px] text-stone-700">
              {h.length > 40 ? `${h.substring(0, 40)}...` : h}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
