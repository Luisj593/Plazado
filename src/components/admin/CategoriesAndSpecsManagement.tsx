import React, { useState } from 'react';
import { 
  FolderTree, 
  Plus, 
  Edit3, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Sliders, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  Sparkles,
  ArrowUpDown,
  Tag,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Category, CategorySpecification, SpecificationFieldType } from '../../types';
import { api } from '../../services/api';
import { getCategoryEmoji, CategoryIcon, LUCIDE_NAME_MAP } from '../../utils/categoryIcons';

export const CategoriesAndSpecsManagement: React.FC = () => {
  const { 
    categories, 
    products, 
    showNotification,
    addCategory,
    updateCategory,
    deleteCategory
  } = useApp();

  // State for active view in this section: categories list vs specifications list
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'specs'>('categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Specifications local state (hydrated from backend)
  const [specifications, setSpecifications] = useState<CategorySpecification[]>([]);
  const [loadingSpecs, setLoadingSpecs] = useState(false);

  // Modal states for Category / Subcategory
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catIcon, setCatIcon] = useState('Folder');
  const [catDesc, setCatDesc] = useState('');
  const [catParentId, setCatParentId] = useState<string>('');
  const [catIsActive, setCatIsActive] = useState(true);

  // Modal states for Specification
  const [specModalOpen, setSpecModalOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<CategorySpecification | null>(null);
  const [specName, setSpecName] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specType, setSpecType] = useState<SpecificationFieldType>('text');
  const [specRequired, setSpecRequired] = useState(false);
  const [specOptionsInput, setSpecOptionsInput] = useState('');
  const [specUnit, setSpecUnit] = useState('');
  const [specPlaceholder, setSpecPlaceholder] = useState('');
  const [specCategoryId, setSpecCategoryId] = useState('');
  const [specSubcategoryId, setSpecSubcategoryId] = useState('');
  const [specIsFilterable, setSpecIsFilterable] = useState(true);

  // Load specifications on mount or subtab change
  React.useEffect(() => {
    const fetchSpecs = async () => {
      setLoadingSpecs(true);
      try {
        const res = await api.getAllSpecifications();
        if (res.success && res.specifications) {
          setSpecifications(res.specifications);
        }
      } catch (err) {
        console.error('Error fetching specifications:', err);
      } finally {
        setLoadingSpecs(false);
      }
    };
    fetchSpecs();
  }, [activeSubTab]);

  // Main categories (parentId === null or undefined)
  const mainCategories = categories.filter(c => !c.parentId);
  
  // Subcategories
  const subCategories = categories.filter(c => c.parentId);

  // Filtered categories
  const filteredCategories = categories.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.slug.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCategoryId === 'all') return true;
    if (selectedCategoryId === 'main_only') return !c.parentId;
    if (selectedCategoryId === 'sub_only') return Boolean(c.parentId);
    return c.id === selectedCategoryId || c.parentId === selectedCategoryId;
  });

  // Filtered specifications
  const filteredSpecs = specifications.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.key.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCategoryId === 'all' || selectedCategoryId === 'main_only' || selectedCategoryId === 'sub_only') return true;
    return s.categoryId === selectedCategoryId || s.subcategoryId === selectedCategoryId;
  });

  // Open modal for Category / Subcategory
  const handleOpenCategoryModal = (cat?: Category, parentIdPreset?: string) => {
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatSlug(cat.slug);
      setCatIcon(cat.icon || 'Folder');
      setCatDesc(cat.description || '');
      setCatParentId(cat.parentId || '');
      setCatIsActive(cat.isActive !== false);
    } else {
      setEditingCategory(null);
      setCatName('');
      setCatSlug('');
      setCatIcon('Folder');
      setCatDesc('');
      setCatParentId(parentIdPreset || '');
      setCatIsActive(true);
    }
    setCategoryModalOpen(true);
  };

  // Open modal for Specification
  const handleOpenSpecModal = (spec?: CategorySpecification) => {
    if (spec) {
      setEditingSpec(spec);
      setSpecName(spec.name);
      setSpecKey(spec.key);
      setSpecType(spec.type);
      setSpecRequired(Boolean(spec.required));
      setSpecOptionsInput((spec.options || []).join(', '));
      setSpecUnit(spec.unit || '');
      setSpecPlaceholder(spec.placeholder || '');
      setSpecCategoryId(spec.categoryId || '');
      setSpecSubcategoryId(spec.subcategoryId || '');
      setSpecIsFilterable(spec.isFilterable !== false);
    } else {
      setEditingSpec(null);
      setSpecName('');
      setSpecKey('');
      setSpecType('text');
      setSpecRequired(false);
      setSpecOptionsInput('');
      setSpecUnit('');
      setSpecPlaceholder('');
      setSpecCategoryId(mainCategories[0]?.id || '');
      setSpecSubcategoryId('');
      setSpecIsFilterable(true);
    }
    setSpecModalOpen(true);
  };

  // Save Category / Subcategory
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showNotification('Ingresa el nombre de la categoría', 'error');
      return;
    }

    const slug = catSlug.trim() || catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (editingCategory) {
      try {
        await updateCategory(editingCategory.id, {
          name: catName.trim(),
          slug,
          icon: catIcon.trim() || 'Folder',
          description: catDesc.trim(),
          parentId: catParentId || null,
          isActive: catIsActive
        });
        showNotification('Categoría actualizada exitosamente');
        setCategoryModalOpen(false);
      } catch (err: any) {
        showNotification(err.message || 'Error al actualizar la categoría', 'error');
      }
    } else {
      try {
        await addCategory({
          name: catName.trim(),
          slug,
          icon: catIcon.trim() || 'Folder',
          description: catDesc.trim(),
          parentId: catParentId || null,
          isActive: catIsActive,
          order: categories.length + 1
        });
        showNotification('Categoría creada exitosamente');
        setCategoryModalOpen(false);
      } catch (err: any) {
        showNotification(err.message || 'Error al crear la categoría', 'error');
      }
    }
  };

  // Toggle Category Active status
  const handleToggleCategoryActive = async (cat: Category) => {
    const newStatus = cat.isActive === false;
    try {
      await updateCategory(cat.id, { isActive: newStatus });
      showNotification(`Categoría ${cat.name} ${newStatus ? 'activada' : 'desactivada'}`);
    } catch (err: any) {
      showNotification(err.message || 'Error al actualizar estado', 'error');
    }
  };

  // Delete Category (With critical protection against deleting categories with products)
  const handleDeleteCategory = async (cat: Category) => {
    // Check local associated products first
    const associated = products.filter(p => (p.categoryId === cat.id || p.subcategoryId === cat.id) && p.deleted !== true);
    if (associated.length > 0) {
      showNotification(
        `Acción bloqueada: No se puede eliminar "${cat.name}" porque tiene ${associated.length} producto(s) asociado(s). En su lugar, desactívala.`,
        'error'
      );
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${cat.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await deleteCategory(cat.id);
      showNotification(`Categoría "${cat.name}" eliminada`);
    } catch (err: any) {
      showNotification(err.message || 'Error al eliminar la categoría', 'error');
    }
  };

  // Save Specification
  const handleSaveSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specName.trim()) {
      showNotification('Ingresa el nombre de la especificación', 'error');
      return;
    }

    const key = specKey.trim() || specName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
    const options = (specType === 'select' || specType === 'multiselect') 
      ? specOptionsInput.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const payload: Omit<CategorySpecification, 'id'> = {
      name: specName.trim(),
      key,
      type: specType,
      required: specRequired,
      options,
      unit: specUnit.trim() || undefined,
      placeholder: specPlaceholder.trim() || undefined,
      categoryId: specCategoryId || undefined,
      subcategoryId: specSubcategoryId || undefined,
      isFilterable: specIsFilterable,
      order: specifications.length + 1
    };

    if (editingSpec) {
      try {
        const res = await api.updateSpecification(editingSpec.id, payload);
        if (res.success) {
          setSpecifications(prev => prev.map(s => s.id === editingSpec.id ? { ...s, ...res.specification } : s));
          showNotification('Especificación actualizada con éxito');
          setSpecModalOpen(false);
        }
      } catch (err: any) {
        showNotification(err.message || 'Error al actualizar especificación', 'error');
      }
    } else {
      try {
        const res = await api.createSpecification(payload);
        if (res.success) {
          setSpecifications(prev => [...prev, res.specification]);
          showNotification('Especificación técnica creada');
          setSpecModalOpen(false);
        }
      } catch (err: any) {
        showNotification(err.message || 'Error al crear especificación', 'error');
      }
    }
  };

  // Delete Specification
  const handleDeleteSpec = async (spec: CategorySpecification) => {
    if (!window.confirm(`¿Eliminar la especificación "${spec.name}"?`)) return;
    try {
      const res = await api.deleteSpecification(spec.id);
      if (res.success) {
        setSpecifications(prev => prev.filter(s => s.id !== spec.id));
        showNotification('Especificación eliminada');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error al eliminar especificación', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Catálogo Oficial & Especificaciones Dinámicas */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 bg-red-100 text-red-600 rounded-xl">
              <FolderTree className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-stone-900">Catálogo Oficial de Categorías & Especificaciones</h2>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
              Estructura Jerárquica Activa
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Gestiona la arquitectura <strong>Categoría → Subcategoría → Especificaciones Dinámicas</strong>. Las tiendas seleccionarán estos atributos estandarizados al publicar productos y los clientes podrán utilizarlos como filtros automáticos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'categories' ? (
            <button
              onClick={() => handleOpenCategoryModal()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Categoría</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenSpecModal()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Especificación</span>
            </button>
          )}
        </div>
      </div>

      {/* Selector de Pestaña: Categorías vs Especificaciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'categories'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categorías & Subcategorías ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('specs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'specs'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Especificaciones Técnicas ({specifications.length})</span>
          </button>
        </div>

        {/* Búsqueda y Filtro de Categoría */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs outline-none focus:border-red-500 w-44"
            />
          </div>

          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="p-1.5 bg-white border border-stone-300 rounded-xl text-xs outline-none font-medium text-stone-700"
          >
            <option value="all">Todas las categorías</option>
            <option value="main_only">Solo Principales (25)</option>
            <option value="sub_only">Solo Subcategorías</option>
            <optgroup label="Filtrar por Principal">
              {mainCategories.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* SUBTAB 1: GESTIÓN DE CATEGORÍAS & SUBCATEGORÍAS */}
      {activeSubTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-black">
                <tr>
                  <th className="py-3 px-4">Jerarquía & Nombre</th>
                  <th className="py-3 px-4">Slug / ID</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Subcategorías</th>
                  <th className="py-3 px-4">Productos</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {filteredCategories.map(cat => {
                  const isMain = !cat.parentId;
                  const parentCat = cat.parentId ? categories.find(c => c.id === cat.parentId) : null;
                  const childCount = subCategories.filter(c => c.parentId === cat.id).length;
                  const associatedProds = products.filter(p => (p.categoryId === cat.id || p.subcategoryId === cat.id) && p.deleted !== true).length;
                  const isActive = cat.isActive !== false;

                  return (
                    <tr key={cat.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center text-sm font-bold shrink-0 shadow-2xs">
                            {getCategoryEmoji(cat)}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              {!isMain && <span className="text-stone-300 text-sm">↳</span>}
                              <span className={`font-bold ${isMain ? 'text-stone-900 text-sm' : 'text-stone-700'}`}>
                                {cat.name}
                              </span>
                            </div>
                            {cat.description && (
                              <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1 max-w-xs">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <code className="text-[11px] font-mono bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                          {cat.slug}
                        </code>
                        <div className="text-[10px] text-stone-400 font-mono mt-0.5">ID: {cat.id}</div>
                      </td>

                      <td className="py-3 px-4">
                        {isMain ? (
                          <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                            Principal
                          </span>
                        ) : (
                          <span className="bg-purple-50 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                            Subcategoría de {parentCat?.name || cat.parentId}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isMain ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-700">{childCount}</span>
                            <button
                              onClick={() => handleOpenCategoryModal(undefined, cat.id)}
                              className="text-[10px] text-red-600 hover:underline font-bold flex items-center gap-0.5"
                              title="Añadir subcategoría a esta categoría"
                            >
                              <Plus className="w-3 h-3" /> Añadir
                            </button>
                          </div>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`font-bold ${associatedProds > 0 ? 'text-emerald-700' : 'text-stone-400'}`}>
                          {associatedProds} producto(s)
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleCategoryActive(cat)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-stone-500'}`} />
                          <span>{isActive ? 'Activa' : 'Inactiva'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenCategoryModal(cat)}
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                            title="Editar categoría"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title={associatedProds > 0 ? 'No se puede eliminar porque tiene productos asociados (debe desactivarse)' : 'Eliminar categoría'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: GESTIÓN DE ESPECIFICACIONES TÉCNICAS DINÁMICAS */}
      {activeSubTab === 'specs' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <strong className="text-amber-950 font-bold block">Reglas de Especificaciones Dinámicas:</strong>
              <p>
                Las especificaciones técnicas NO son categorías. Son campos dinámicos que se muestran en el formulario de publicación de la tienda cuando elige una subcategoría (ej: <em>Smartphones → RAM, Pantalla, Almacenamiento; Televisores → Resolución, Panel; Robots → Sensores, Programación</em>).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px] font-black">
                  <tr>
                    <th className="py-3 px-4">Especificación</th>
                    <th className="py-3 px-4">Clave (Key)</th>
                    <th className="py-3 px-4">Tipo de Campo</th>
                    <th className="py-3 px-4">Aplica A</th>
                    <th className="py-3 px-4">Opciones / Unidad</th>
                    <th className="py-3 px-4">Requerido</th>
                    <th className="py-3 px-4">Filtro Cliente</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {filteredSpecs.map(spec => {
                    const category = categories.find(c => c.id === spec.categoryId);
                    const subcategory = categories.find(c => c.id === spec.subcategoryId);

                    return (
                      <tr key={spec.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-stone-900">
                          {spec.name}
                        </td>

                        <td className="py-3 px-4">
                          <code className="text-[11px] font-mono bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                            {spec.key}
                          </code>
                        </td>

                        <td className="py-3 px-4">
                          <span className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            {spec.type}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            {category && (
                              <span className="text-[11px] font-bold text-stone-800 block">
                                {category.name}
                              </span>
                            )}
                            {subcategory ? (
                              <span className="text-[10px] text-purple-700 font-semibold block">
                                ↳ {subcategory.name}
                              </span>
                            ) : spec.applicableSubcategoryIds && spec.applicableSubcategoryIds.length > 0 ? (
                              <span className="text-[10px] text-stone-500 block">
                                ({spec.applicableSubcategoryIds.length} subcategorías)
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-700 font-semibold block">
                                Todas las subcategorías
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-stone-600">
                          {spec.options && spec.options.length > 0 ? (
                            <span className="text-[11px] text-stone-600 line-clamp-1 max-w-xs" title={spec.options.join(', ')}>
                              {spec.options.join(', ')}
                            </span>
                          ) : spec.unit ? (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                              Unidad: {spec.unit}
                            </span>
                          ) : (
                            <span className="text-stone-300">Libre</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {spec.required ? (
                            <span className="text-rose-600 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              Obligatorio
                            </span>
                          ) : (
                            <span className="text-stone-400 text-[10px]">Opcional</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {spec.isFilterable !== false ? (
                            <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Visible
                            </span>
                          ) : (
                            <span className="text-stone-400 text-[10px]">Oculto</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenSpecModal(spec)}
                              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                              title="Editar especificación"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSpec(spec)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Eliminar especificación"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREAR / EDITAR CATEGORÍA O SUBCATEGORÍA */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-black text-stone-900 text-base">
              {editingCategory ? 'Editar Categoría / Subcategoría' : 'Nueva Categoría o Subcategoría'}
            </h3>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ej: Robótica, Drones, Calzado"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl outline-none font-medium text-stone-800"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Slug URL (Opcional)</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="robotica, drones, calzado"
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl outline-none font-mono text-stone-700"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Tipo de Jerarquía</label>
                <select
                  value={catParentId}
                  onChange={(e) => setCatParentId(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl outline-none font-medium text-stone-800"
                >
                  <option value="">Categoría Principal (Nivel Superior)</option>
                  <optgroup label="Asignar como Subcategoría de:">
                    {mainCategories.map(m => (
                      <option key={m.id} value={m.id}>↳ {m.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Ícono de la Categoría</label>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-300 flex items-center justify-center text-lg shrink-0">
                    {getCategoryEmoji({ icon: catIcon, name: catName, slug: catSlug })}
                  </span>
                  <input
                    type="text"
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    placeholder="Shirt, Smartphone, PawPrint, Tv..."
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl outline-none font-mono text-stone-700"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-stone-50 border border-stone-200 rounded-xl">
                  {Object.entries(LUCIDE_NAME_MAP).slice(0, 24).map(([name, item]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setCatIcon(name)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                        catIcon === name 
                          ? 'bg-red-600 text-white border-red-600' 
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <span>{item.emoji}</span>
                      <span>{name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Descripción</label>
                <textarea
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  rows={2}
                  placeholder="Descripción para SEO y catálogo..."
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl outline-none text-stone-800 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="cat-active-check"
                  checked={catIsActive}
                  onChange={(e) => setCatIsActive(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <label htmlFor="cat-active-check" className="font-bold text-stone-800 cursor-pointer">
                  Categoría Activa (Visible en catálogo y formulario)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700 font-bold hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR / EDITAR ESPECIFICACIÓN TÉCNICA */}
      {specModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-black text-stone-900 text-base">
              {editingSpec ? 'Editar Especificación Técnica' : 'Nueva Especificación Técnica Dinámica'}
            </h3>

            <form onSubmit={handleSaveSpec} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nombre Visible *</label>
                  <input
                    type="text"
                    required
                    value={specName}
                    onChange={(e) => setSpecName(e.target.value)}
                    placeholder="Ej: Memoria RAM, Resolución"
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl outline-none font-medium text-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Clave de Datos (Key)</label>
                  <input
                    type="text"
                    value={specKey}
                    onChange={(e) => setSpecKey(e.target.value)}
                    placeholder="ram, resolution, voltage"
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl outline-none font-mono text-stone-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Tipo de Campo *</label>
                  <select
                    value={specType}
                    onChange={(e) => setSpecType(e.target.value as SpecificationFieldType)}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl outline-none font-medium text-stone-800"
                  >
                    <option value="text">Texto Libre</option>
                    <option value="number">Número</option>
                    <option value="select">Selección Única (Dropdown)</option>
                    <option value="multiselect">Selección Múltiple (Etiquetas)</option>
                    <option value="boolean">Booleano (Sí / No)</option>
                    <option value="date">Fecha</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Unidad de Medida (Opcional)</label>
                  <input
                    type="text"
                    value={specUnit}
                    onChange={(e) => setSpecUnit(e.target.value)}
                    placeholder="GB, pulgadas, Watts, ml, V"
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl outline-none text-stone-800 font-medium"
                  />
                </div>
              </div>

              {(specType === 'select' || specType === 'multiselect') && (
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Opciones de Selección (Separadas por coma) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={specOptionsInput}
                    onChange={(e) => setSpecOptionsInput(e.target.value)}
                    placeholder="4 GB, 8 GB, 16 GB, 32 GB"
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl outline-none text-stone-800 resize-none font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-700 mb-1">Categoría Principal Asociada</label>
                <select
                  value={specCategoryId}
                  onChange={(e) => {
                    setSpecCategoryId(e.target.value);
                    setSpecSubcategoryId('');
                  }}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl outline-none font-medium text-stone-800"
                >
                  <option value="">Aplica a todas las categorías</option>
                  {mainCategories.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {specCategoryId && (
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Subcategoría Específica (Opcional)</label>
                  <select
                    value={specSubcategoryId}
                    onChange={(e) => setSpecSubcategoryId(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl outline-none font-medium text-stone-800"
                  >
                    <option value="">Aplica a todas las subcategorías de esta categoría</option>
                    {subCategories.filter(s => s.parentId === specCategoryId).map(sub => (
                      <option key={sub.id} value={sub.id}>↳ {sub.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="spec-required-check"
                    checked={specRequired}
                    onChange={(e) => setSpecRequired(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <label htmlFor="spec-required-check" className="font-bold text-stone-800 cursor-pointer">
                    Campo Obligatorio
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="spec-filter-check"
                    checked={specIsFilterable}
                    onChange={(e) => setSpecIsFilterable(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <label htmlFor="spec-filter-check" className="font-bold text-stone-800 cursor-pointer">
                    Filtro de Búsqueda
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setSpecModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700 font-bold hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Guardar Especificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
