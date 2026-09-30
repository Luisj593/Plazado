import React, { useState, useEffect } from 'react';
import { 
  X, 
  FolderPlus, 
  Tag, 
  ShoppingBag, 
  Laptop, 
  Tv, 
  Utensils, 
  Car, 
  Sparkles, 
  Home, 
  Heart, 
  Wrench, 
  Gift, 
  Shirt, 
  Smartphone, 
  Coffee, 
  Baby, 
  Book, 
  Watch, 
  Headphones, 
  Camera, 
  Gamepad2,
  Check,
  PawPrint,
  Bot,
  Armchair,
  Refrigerator,
  Dumbbell,
  SprayCan,
  Palette,
  Trees,
  Sparkle,
  Hammer,
  Building2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Curated list of popular Lucide icon options for categories
const AVAILABLE_ICONS = [
  { name: 'Shirt', label: 'Moda / Ropa', icon: Shirt },
  { name: 'Smartphone', label: 'Celulares', icon: Smartphone },
  { name: 'Laptop', label: 'Tecnología', icon: Laptop },
  { name: 'Tv', label: 'TV / Electrónica', icon: Tv },
  { name: 'Bot', label: 'Robótica', icon: Bot },
  { name: 'Utensils', label: 'Cocina', icon: Utensils },
  { name: 'Home', label: 'Hogar', icon: Home },
  { name: 'Armchair', label: 'Muebles', icon: Armchair },
  { name: 'Refrigerator', label: 'Electrodomésticos', icon: Refrigerator },
  { name: 'Sparkles', label: 'Belleza', icon: Sparkles },
  { name: 'SprayCan', label: 'Perfumes', icon: SprayCan },
  { name: 'Dumbbell', label: 'Deportes / Fitness', icon: Dumbbell },
  { name: 'Baby', label: 'Bebés / Niños', icon: Baby },
  { name: 'Gamepad2', label: 'Videojuegos', icon: Gamepad2 },
  { name: 'PawPrint', label: 'Mascotas', icon: PawPrint },
  { name: 'Car', label: 'Vehículos', icon: Car },
  { name: 'Hammer', label: 'Ferretería / Construcción', icon: Hammer },
  { name: 'Book', label: 'Librería / Oficina', icon: Book },
  { name: 'ShoppingBag', label: 'Supermercado', icon: ShoppingBag },
  { name: 'Gift', label: 'Regalos', icon: Gift },
  { name: 'Trees', label: 'Jardín / Exterior', icon: Trees },
  { name: 'Sparkle', label: 'Limpieza', icon: Sparkle },
  { name: 'Palette', label: 'Artesanía', icon: Palette },
  { name: 'Heart', label: 'Salud', icon: Heart },
  { name: 'Building2', label: 'Industria', icon: Building2 },
  { name: 'Headphones', label: 'Audífonos', icon: Headphones },
  { name: 'Watch', label: 'Relojes', icon: Watch },
  { name: 'Camera', label: 'Cámara', icon: Camera },
  { name: 'Coffee', label: 'Café / Bebidas', icon: Coffee },
  { name: 'Tag', label: 'Etiqueta', icon: Tag }
];

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({ isOpen, onClose }) => {
  const { categories, addCategory, showNotification } = useApp();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [icon, setIcon] = useState('ShoppingBag');
  const [parentId, setParentId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-generate slug when name changes (unless manually edited)
  useEffect(() => {
    if (!isSlugManual) {
      const generated = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  }, [name, isSlugManual]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setSlug('');
      setIsSlugManual(false);
      setIcon('ShoppingBag');
      setParentId('');
      setDescription('');
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = name.trim();
    const cleanSlug = slug.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (!cleanName) {
      setErrorMessage('Por favor ingresa el nombre de la categoría.');
      return;
    }

    // Check slug collision
    const existingSlug = categories.find(c => c.slug.toLowerCase() === cleanSlug.toLowerCase());
    if (existingSlug) {
      setErrorMessage(`El slug "${cleanSlug}" ya está en uso por la categoría "${existingSlug.name}". Por favor cámbialo.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await addCategory({
        name: cleanName,
        slug: cleanSlug,
        icon: icon || 'ShoppingBag',
        description: description.trim() || undefined,
        parentId: parentId || null
      });

      showNotification(`¡Categoría "${cleanName}" creada exitosamente en PlazaDO!`, 'success');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar la nueva categoría');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mainCategories = categories.filter(c => !c.parentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-5 border border-stone-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 block">
                ADMINISTRACIÓN DE CATÁLOGO GLOBAL
              </span>
              <h3 className="font-extrabold text-stone-900 text-base">Crear Nueva Categoría</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Name */}
          <div>
            <label className="block font-bold text-stone-800 mb-1">
              Nombre de la Categoría <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Calzado y Accesorios, Deportes, Mascotas..."
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium outline-none focus:border-red-500 focus:bg-white transition-all text-xs"
            />
          </div>

          {/* Slug */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-stone-800">
                Slug (URL identificador) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsSlugManual(!isSlugManual)}
                className="text-[10px] text-red-600 hover:underline font-semibold"
              >
                {isSlugManual ? 'Autogenerar desde nombre' : 'Editar manualmente'}
              </button>
            </div>
            <div className="flex items-center gap-1.5 p-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-600 font-mono text-xs">
              <span className="text-stone-400 select-none">/categoria/</span>
              <input
                type="text"
                required
                disabled={!isSlugManual}
                value={slug}
                onChange={(e) => {
                  setIsSlugManual(true);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                }}
                placeholder="ej: calzado-accesorios"
                className="flex-1 bg-transparent border-none outline-none font-mono text-stone-900 disabled:text-stone-600"
              />
            </div>
          </div>

          {/* Parent Category */}
          <div>
            <label className="block font-bold text-stone-800 mb-1">
              Jerarquía de Categoría
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 font-medium outline-none focus:border-red-500 text-xs"
            >
              <option value="">Categoría Principal (Raíz)</option>
              {mainCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  Subcategoría de: {cat.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-stone-400 mt-1">
              Selecciona "Categoría Principal" para mostrarla en la barra superior o elige una categoría existente para crear una subcategoría.
            </p>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block font-bold text-stone-800 mb-1.5">
              Icono Representativo
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto p-2 bg-stone-50 border border-stone-200 rounded-xl">
              {AVAILABLE_ICONS.map(item => {
                const IconComponent = item.icon;
                const isSelected = icon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-center ${
                      isSelected 
                        ? 'bg-red-50 border-red-500 text-red-700 shadow-2xs font-bold' 
                        : 'bg-white border-stone-200 hover:border-stone-300 text-stone-600'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="text-[9px] truncate w-full">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-stone-800 mb-1">
              Descripción Opcional
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve reseña sobre los tipos de productos que pertenecen a esta categoría..."
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 outline-none focus:border-red-500 focus:bg-white text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 text-xs"
            >
              {isSubmitting ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Crear Categoría</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
