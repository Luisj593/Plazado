import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Store, 
  CheckCircle2, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  Percent, 
  Truck, 
  Users, 
  HelpCircle 
} from 'lucide-react';
import { DOMINICAN_PROVINCES } from '../../data/initialData';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { PRESET_STORE_BANNERS } from '../common/StoreProfileModal';

export const SellWithUsPage: React.FC = () => {
  const { 
    registerStore, 
    systemSettings, 
    showNotification, 
    openAuthModal,
    setCurrentView,
    setSelectedStoreSlug
  } = useApp();

  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rnc, setRnc] = useState('');
  const [province, setProvince] = useState('Distrito Nacional');
  const [municipality, setMunicipality] = useState('Santo Domingo');
  const [category, setCategory] = useState('cat-tecnologia');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&auto=format&fit=crop&q=80');
  const [banner, setBanner] = useState('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdSlug, setCreatedSlug] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      showNotification('Debes aceptar los términos y condiciones para comercios.', 'error');
      return;
    }

    const slug = storeName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    registerStore({
      name: storeName.trim(),
      slug: slug || `tienda-${Date.now()}`,
      ownerName: ownerName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      whatsapp: phone.trim(),
      description: description.trim() || `Comercio oficial ${storeName} en PlazaDO`,
      categoryId: category,
      logo: logo.trim() || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&auto=format&fit=crop&q=80',
      banner: banner.trim() || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      province,
      municipality,
      address: `${municipality}, ${province}`,
      shippingConfig: {
        type: 'fixed',
        fixedRate: 200,
        estimatedDays: '24-48 horas',
        coverageProvinces: [province]
      },
      bankInfo: {
        bank: 'Banco Popular Dominicano',
        accountType: 'CORRIENTE',
        accountNumber: 'Pendiente de registrar',
        accountHolder: ownerName.trim(),
        rncOrCedula: rnc || 'Pendiente'
      }
    });

    setCreatedSlug(slug);
    setSubmitted(true);
    showNotification(`¡Tienda "${storeName}" creada y disponible en toda la plataforma!`, 'success');
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      
      {/* Hero Header */}
      <section className="bg-stone-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600/90 text-white uppercase tracking-wider">
            Vende en PlazaDO.com
          </span>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display">
            Lleva tu negocio o comercio a toda la República Dominicana
          </h1>

          <p className="text-sm sm:text-base text-stone-300 max-w-2xl mx-auto leading-relaxed">
            ¿Tienes una tienda física, negocio o vendes de manera independiente? PlazaDO.com te proporciona tu propia vitrina digital, panel de administración con control de inventario y acceso a miles de compradores locales.
          </p>

          <div className="pt-4 flex flex-wrap justify-center items-center gap-3 sm:gap-4">
            <button
              onClick={() => openAuthModal('register_store')}
              className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg transition-all"
            >
              <Store className="w-4 h-4" />
              <span>Registrar Tienda Inmediatamente</span>
            </button>

            <a
              href={`https://wa.me/1${systemSettings.whatsappCommercial.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>WhatsApp Comercial ({systemSettings.whatsappCommercial})</span>
            </a>

            <a
              href="#formulario-registro"
              className="px-6 py-3.5 bg-white text-stone-900 hover:bg-stone-100 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all"
            >
              Llenar Solicitud en Línea
            </a>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-md flex items-start gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl shrink-0">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Comisión Justa y Transparente</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Solo cobramos un 5% de comisión comercial sobre ventas efectivas. Sin mensualidades fijas obligatorias para empezar.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-md flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Tú Defines tus Envíos</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Elige tus propias tarifas de entrega y plazos. El valor del envío que cobra tu comercio te pertenece íntegramente.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-md flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Seguridad con Código Secreto</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Cobras con tranquilidad. La entrega se valida con un código único de 6 dígitos que te entrega el cliente al recibir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="formulario-registro" className="max-w-3xl mx-auto px-4 mt-14">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-lg">
          
          {submitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900">¡Tu Tienda ha sido Creada y Publicada!</h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
                La tienda <strong>{storeName}</strong> ya está guardada en la base de datos global de PlazaDO y es visible inmediatamente para todos los compradores en el Directorio de Tiendas y en todo el país.
              </p>
              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <button
                  id="btn-success-view-stores"
                  onClick={() => setCurrentView('stores')}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Store className="w-4 h-4" />
                  <span>Ver en Directorio de Tiendas</span>
                </button>

                {createdSlug && (
                  <button
                    id="btn-success-view-store-profile"
                    onClick={() => {
                      setSelectedStoreSlug(createdSlug);
                      setCurrentView('store_public');
                    }}
                    className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-stone-800 transition-colors flex items-center gap-2"
                  >
                    <span>Ver Perfil Público</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => openAuthModal('register_store')}
                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <span>Crear Contraseña / Administrar</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Solicitud de Apertura de Tienda</h2>
                <p className="text-xs text-stone-500 mt-0.5">Completa este formulario inicial para iniciar el proceso de validación.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Nombre Comercial de la Tienda *</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Ej: Joyería Caribeña RD"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Nombre del Propietario o Representante *</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@mitienda.do"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">WhatsApp / Teléfono Comercial *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="809-000-0000"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">RNC o Cédula Dominicana</label>
                  <input
                    type="text"
                    value={rnc}
                    onChange={(e) => setRnc(e.target.value)}
                    placeholder="Ej: 1-32-45678-9 o 001-XXXXXXX-X"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Categoría Principal</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500"
                  >
                    <option value="Tecnología y Electrónica">Tecnología y Electrónica</option>
                    <option value="Mascotas">Mascotas (Perros, Gatos)</option>
                    <option value="Moda y Calzado">Moda y Calzado</option>
                    <option value="Hogar y Decoración">Hogar y Decoración</option>
                    <option value="Belleza y Cuidado Personal">Belleza y Cuidado Personal</option>
                    <option value="Alimentos y Bebidas">Alimentos y Bebidas Gourmet</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Provincia *</label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500"
                  >
                    {DOMINICAN_PROVINCES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Municipio / Ciudad *</label>
                  <input
                    type="text"
                    required
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    placeholder="Ej: Santo Domingo Este, Santiago de los Caballeros"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">Breve descripción de tus productos</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="¿Qué tipo de productos vendes? ¿Haces envíos a todo el país?"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500"
                  />
                </div>

                {/* Logo Uploader */}
                <div className="sm:col-span-2 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <ImageUploadInput
                    label="Logo Oficial de la Tienda"
                    value={logo}
                    onChange={setLogo}
                    shape="rounded"
                    aspectRatioLabel="Sube el logo de tu marca (PNG o JPG)"
                    placeholder="https://ejemplo.com/logo.png"
                    helpText="Se mostrará en la vitrina pública y en el encabezado de tus productos."
                  />
                </div>

                {/* Banner Uploader */}
                <div className="sm:col-span-2 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <ImageUploadInput
                    label="Banner de Portada de la Tienda"
                    value={banner}
                    onChange={setBanner}
                    presetAvatars={PRESET_STORE_BANNERS}
                    shape="banner"
                    aspectRatioLabel="Sube el banner o portada de tu comercio (Recomendado: 1200 x 350 px, PNG o JPG)"
                    placeholder="https://ejemplo.com/banner-portada.jpg"
                    helpText="Esta imagen panorámica será la portada principal de tu tienda."
                  />
                </div>
              </div>

              {/* Terms check */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-stone-600">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 rounded text-red-600 accent-red-600"
                  />
                  <span>
                    He leído y acepto los <strong>Términos y Condiciones para Tiendas de PlazaDO.com</strong>, incluyendo la comisión del 5% sobre ventas y las políticas de despacho independiente.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
              >
                Enviar Solicitud de Apertura de Tienda
              </button>
            </form>
          )}

        </div>
      </section>

    </div>
  );
};
