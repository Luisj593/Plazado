import { PayPalButton } from './PayPalButton';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Package, 
  Heart, 
  MapPin, 
  AlertTriangle, 
  Key, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Store, 
  Truck, 
  Plus, 
  MessageSquare,
  ShieldCheck,
  Calendar,
  Eye,
  X,
  User,
  Edit3,
  Lock,
  EyeOff,
  Shield,
  KeyRound,
  ScanFace
} from 'lucide-react';
import { OrderStatus, Dispute } from '../../types';
import { UserProfileModal } from '../common/UserProfileModal';
import { CustomerAddressesManager } from './CustomerAddressesManager';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { api } from '../../services/api';

export const CustomerPortal: React.FC = () => {
  const { 
    currentUser, 
    orders, 
    favorites, 
    products, 
    stores, 
    setSelectedProductId, 
    setSelectedStoreSlug,
    setCurrentView,
    createDispute,
    disputes,
    addCustomerAddress,
    setDefaultAddress,
    openAuthModal,
    openOrderChat,
    getOrderUnreadCount,
    showNotification,
    completePayPalCheckout,
    cancelPayPalCheckout,
    submitKycVerification
  } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'favorites' | 'addresses' | 'disputes' | 'security' | 'identity'>('orders');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<string | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Identity validation (Cédula & Biometrics) states
  const [kycCedulaNumber, setKycCedulaNumber] = useState(currentUser?.cedulaNumber || currentUser?.kycData?.cedulaNumber || '');
  const [kycCedulaFrontUrl, setKycCedulaFrontUrl] = useState(currentUser?.kycData?.cedulaFrontUrl || '');
  const [kycSelfieUrl, setKycSelfieUrl] = useState(currentUser?.kycData?.selfieUrl || currentUser?.avatar || '');
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);
  const [kycSuccessMsg, setKycSuccessMsg] = useState<string | null>(null);
  const [kycErrorMsg, setKycErrorMsg] = useState<string | null>(null);

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycErrorMsg(null);
    setKycSuccessMsg(null);

    const cleanCedula = kycCedulaNumber.trim();
    if (!cleanCedula) {
      setKycErrorMsg('Ingresa tu número de Cédula Dominicana.');
      return;
    }
    if (!kycCedulaFrontUrl.trim()) {
      setKycErrorMsg('Debes adjuntar o subir la foto frontal de tu Cédula.');
      return;
    }

    setIsSubmittingKyc(true);
    try {
      const res = await submitKycVerification({
        cedulaNumber: cleanCedula,
        cedulaFrontUrl: kycCedulaFrontUrl.trim(),
        selfieUrl: kycSelfieUrl.trim() || currentUser?.avatar,
        biometricScore: 98.6
      });
      if (res.success) {
        setKycSuccessMsg('¡Documentos de identidad y biometría enviados con éxito! El Super Administrador revisará y autorizará tu cuenta.');
      } else {
        setKycErrorMsg(res.message);
      }
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  // Password change states
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  const handleCustomerPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    const target = newPass.trim();
    if (target.length < 6) {
      setPassError('La nueva contraseña debe contener al menos 6 caracteres.');
      return;
    }
    if (target !== confirmPass.trim()) {
      setPassError('Las contraseñas no coinciden. Verifica e intenta nuevamente.');
      return;
    }
    if (!currentUser) return;

    setPassLoading(true);
    try {
      const res = await api.updateUserPassword(currentUser.id, target, currentPass.trim() || undefined);
      if (res.success) {
        setPassSuccess('¡Tu contraseña ha sido actualizada con éxito!');
        showNotification('Contraseña actualizada correctamente', 'success');
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        setPassError(res.message || 'No se pudo actualizar la contraseña.');
      }
    } catch (err: any) {
      setPassError(err.message || 'Error de conexión al cambiar la contraseña.');
    } finally {
      setPassLoading(false);
    }
  };

  // Dispute creation modal state
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeOrder, setDisputeOrder] = useState<any>(null);
  const [disputeType, setDisputeType] = useState<Dispute['issueType']>('NOT_RECEIVED');
  const [disputeDesc, setDisputeDesc] = useState('');

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-16 px-4 text-center">
        <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900">Portal de Compras</h2>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              Inicia sesión o regístrate con tu cuenta de cliente para ver el historial de tus pedidos, códigos secretos de entrega y direcciones guardadas.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => openAuthModal('login')}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => openAuthModal('register_customer')}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors"
            >
              Crear Cuenta de Cliente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Orders belonging to this customer
  const customerOrders = orders.filter(o => o.customerId === currentUser.id);

  // Favorited products and stores
  const favProducts = products.filter(p => favorites.productIds.includes(p.id));
  const favStores = stores.filter(s => favorites.storeIds.includes(s.id));

  const handleOpenDispute = (order: any) => {
    setDisputeOrder(order);
    setDisputeModalOpen(true);
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeOrder || !disputeDesc.trim()) return;

    const saved=await createDispute({
      orderId: disputeOrder.id,
      storeId: disputeOrder.storeId,
      storeName: disputeOrder.storeName,
      customerId: currentUser.id,
      customerName: currentUser.name,
      customerEmail: currentUser.email,
      issueType: disputeType,
      description: disputeDesc,
      refundRequested: true,
      refundAmount: disputeOrder.total
    });

    if(!saved) return;
    setDisputeModalOpen(false);
    setDisputeDesc('');
    setActiveTab('disputes');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-xs font-semibold">Pendiente</span>;
      case 'CONFIRMED':
        return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold">Confirmado</span>;
      case 'PREPARING':
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold">En Preparación</span>;
      case 'READY_FOR_PICKUP':
        return <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-xs font-semibold">Listo para Enviar</span>;
      case 'SHIPPED':
        return <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-semibold">En Camino</span>;
      case 'DELIVERED':
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Entregado</span>;
      case 'CANCELLED':
        return <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-xs font-semibold">Cancelado</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Customer Layout: Left Sidebar + Right Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* LEFT SIDEBAR: OPCIONES DEL CLIENTE */}
        <aside className="w-full lg:w-72 lg:shrink-0 space-y-4">
          
          {/* User Profile Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-r from-red-600 to-red-500" />
            
            <div className="relative pt-4 flex flex-col items-center">
              <div className="relative group mb-3">
                <img 
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"} 
                  alt={currentUser.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                />
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="absolute bottom-0 right-0 bg-stone-900 hover:bg-red-600 text-white p-1.5 rounded-full shadow-xs transition-colors"
                  title="Cambiar foto de perfil"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h2 className="text-base font-black text-stone-900">{currentUser.name}</h2>
              <span className="inline-block mt-1 bg-red-50 text-red-700 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-red-200">
                Cliente Comprador
              </span>
              <p className="text-xs text-stone-500 mt-2 break-all">{currentUser.email}</p>
              {currentUser.phone && (
                <p className="text-xs text-stone-400 mt-0.5">{currentUser.phone}</p>
              )}

              <button
                id="edit-profile-btn"
                onClick={() => setIsEditProfileOpen(true)}
                className="mt-3.5 w-full py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-stone-200"
              >
                <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                <span>Editar Perfil & Foto</span>
              </button>
            </div>
          </div>

          {/* Lateral Navigation Menu */}
          <nav className="bg-white rounded-2xl border border-stone-200 p-2 shadow-xs space-y-1">
            <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
              Menú de Cliente
            </div>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'orders'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>Mis Pedidos</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
              }`}>
                {customerOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'favorites'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4" />
                <span>Mis Favoritos</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'favorites' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
              }`}>
                {favProducts.length + favStores.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'addresses'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4" />
                <span>Mis direcciones de entrega</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'addresses' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
              }`}>
                {currentUser.addresses?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('disputes')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'disputes'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Reclamaciones</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'disputes' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
              }`}>
                {disputes.filter(d => d.customerId === currentUser.id).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('identity')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'identity'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ScanFace className="w-4 h-4" />
                <span>Validación de Identidad</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                currentUser.adminApprovalStatus === 'APPROVED' || currentUser.isApprovedByAdmin
                  ? (activeTab === 'identity' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800')
                  : currentUser.kycData?.cedulaFrontUrl
                  ? (activeTab === 'identity' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800')
                  : (activeTab === 'identity' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600')
              }`}>
                {currentUser.adminApprovalStatus === 'APPROVED' || currentUser.isApprovedByAdmin ? 'Autorizado' : currentUser.kycData?.cedulaFrontUrl ? 'En Revisión' : 'Pendiente'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'security'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4" />
                <span>Seguridad & Contraseña</span>
              </div>
            </button>
          </nav>

          {/* Quick Shortcuts & Protection */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 block">
              Exploración Rápida
            </span>

            <button
              onClick={() => setCurrentView('home')}
              className="w-full py-2 px-3 bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 border border-stone-200"
            >
              <Package className="w-3.5 h-3.5 text-red-600" />
              <span>Ir al Catálogo de Productos</span>
            </button>

            <button
              onClick={() => setCurrentView('stores')}
              className="w-full py-2 px-3 bg-white hover:bg-stone-100 text-stone-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 border border-stone-200"
            >
              <Store className="w-3.5 h-3.5 text-stone-600" />
              <span>Ver Directorio de Tiendas</span>
            </button>

            <div className="pt-2 border-t border-stone-200 flex items-start gap-2 text-[11px] text-stone-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Compras protegidas con código secreto de entrega en República Dominicana.</span>
            </div>
          </div>
        </aside>

        {/* RIGHT CONTENT AREA */}
        <main className="flex-1 min-w-0 w-full">

      {/* TAB: MIS PEDIDOS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900">Historial de Compras</h2>
            <span className="text-xs text-stone-500">Tus pedidos son preparados directamente por cada comercio</span>
          </div>

          {customerOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
              <Package className="w-12 h-12 mx-auto text-stone-300 mb-2" />
              <h3 className="font-bold text-sm text-stone-800">Aún no tienes pedidos registrados</h3>
              <p className="text-xs text-stone-400 mt-1">Visita las tiendas asociadas y haz tu primera compra.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customerOrders.map(order => (
                <div 
                  key={order.id}
                  className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-xs text-stone-800">{order.id}</span>
                      <span className="text-xs text-stone-400">Grupo: {order.orderGroupCode}</span>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Store & Items */}
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                        <Store className="w-4 h-4 text-red-600" />
                        <span>Tienda: {order.storeName}</span>
                      </div>

                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-xs">
                            <img src={item.productImage} alt="" className="w-12 h-12 rounded-lg object-cover bg-stone-100 border border-stone-200" />
                            <div>
                              <p className="font-semibold text-stone-900">{item.productName}</p>
                              <p className="text-stone-500">{item.quantity}x a RD$ {item.price.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Secret Code & Actions Box */}
                    <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 w-full md:w-80 flex flex-col justify-between text-xs space-y-3">
                      <div>
                        {order.status === 'CANCELLED' ? (
                          <div className="space-y-2">
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-950">
                              <div className="flex items-center gap-1.5 font-extrabold text-xs text-rose-800">
                                <X className="w-4 h-4 text-rose-600" />
                                <span>Pedido Cancelado</span>
                              </div>
                              {(order.cancelReason || order.statusHistory?.find(h => h.status === 'CANCELLED')?.note) && (
                                <div className="mt-2 p-2 bg-white/90 rounded-lg border border-rose-100 text-[11px] text-rose-900 leading-relaxed">
                                  <span className="font-bold block text-rose-950">Motivo indicado por la tienda:</span>
                                  <span>{order.cancelReason || order.statusHistory?.find(h => h.status === 'CANCELLED')?.note}</span>
                                </div>
                              )}
                              <p className="text-[10px] text-rose-600 mt-1.5 font-medium">
                                Este pedido fue anulado por la tienda y no generará cobros pendientes.
                              </p>
                            </div>
                          </div>
                        ) : order.status === 'DELIVERED' ? (
                          <div className="space-y-2.5">
                            {/* Cuadro del código cerrado: colocado texto de Entregado */}
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950">
                              <div className="flex items-center gap-1.5 font-extrabold text-xs text-emerald-800">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Entregado</span>
                              </div>
                              <p className="text-[11px] text-emerald-700 mt-1">
                                Código de recepción validado exitosamente. Pedido completado.
                              </p>
                            </div>

                            {/* Debajo: opción para generar una reclamación */}
                            <button
                              onClick={() => handleOpenDispute(order)}
                              className="w-full py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Generar una Reclamación</span>
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between text-stone-600 mb-1">
                              <span>Código Secreto de Entrega:</span>
                              <Key className="w-4 h-4 text-amber-600" />
                            </div>
                            
                            {/* 6-Digit Code Highlight */}
                            <div className="bg-white border-2 border-amber-300 rounded-lg py-2 px-3 text-center">
                              <span className="font-mono text-xl font-black tracking-widest text-amber-900">
                                {order.deliveryConfirmationCode}
                              </span>
                            </div>

                            <p className="text-[10px] text-stone-500 leading-snug mt-1.5">
                              Muestra este código al repartidor únicamente cuando recibas y revises tu paquete.
                            </p>
                          </>
                        )}
                      </div>

                      <div className="pt-2 border-t border-stone-200 space-y-1">
                        <div className="flex justify-between text-stone-600">
                          <span>Subtotal:</span>
                          <span className="font-semibold text-stone-900">RD$ {order.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-stone-600">
                          <span>Envío tienda:</span>
                          <span className="font-semibold text-stone-900">RD$ {order.shippingCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-stone-900 pt-1">
                          <span>Total:</span>
                          <span className="text-red-600">RD$ {order.total.toLocaleString()}</span>
                        </div>
                      </div>

                      {order.paymentMethod === 'PAYPAL' && <p className="text-xs font-bold text-blue-900">PayPal · {order.paymentStatus === 'PAID' ? 'Pago confirmado' : 'Pago pendiente'}</p>}
                      {order.paymentMethod === 'PAYPAL' && order.paymentStatus === 'PENDING' && order.status !== 'CANCELLED' && order.paypalPayment?.orderId && customerOrders.find(o => o.paypalPayment?.orderId === order.paypalPayment?.orderId)?.id === order.id && <div className="space-y-2">
                        <PayPalButton totalDop={0} fixedAmountUsd={order.paypalPayment.amountUsd} fixedRate={order.paypalPayment.dopPerUsd}
                          createOrder={async () => order.paypalPayment!.orderId}
                          onApprove={async id => {const result=await completePayPalCheckout(id);if(!result.success)throw Error(result.error);}}
                          onCancel={async id => {if(!id)return;const result=await cancelPayPalCheckout(id);if(!result.success)throw Error(result.message);}}
                        />
                        {order.paypalPayment.captureStarted && <button type="button" className="text-xs text-blue-800 font-bold underline" onClick={async()=>{const result=await completePayPalCheckout(order.paypalPayment!.orderId);if(!result.success)showNotification(result.error || 'Pago pendiente','error');}}>Consultar confirmación del mismo pago</button>}
                      </div>}
                      {/* In-Platform Official Store Chat */}
                      <div className="pt-2 space-y-2">
                        <button
                          onClick={() => openOrderChat(order.id)}
                          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat con la Tienda</span>
                          {getOrderUnreadCount(order.id, 'CUSTOMER') > 0 && (
                            <span className="w-4 h-4 rounded-full bg-white text-red-600 text-[10px] font-black flex items-center justify-center ml-1">
                              {getOrderUnreadCount(order.id, 'CUSTOMER')}
                            </span>
                          )}
                        </button>

                        {order.status !== 'DELIVERED' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenDispute(order)}
                              className="w-full py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold"
                            >
                              Abrir Reclamación
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address Snapshot */}
                  {order.deliveryAddress && (
                    <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-xs flex items-start gap-2 text-stone-700">
                      <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">
                            Dirección de entrega ({order.deliveryAddress.label || 'Entrega'}):
                          </span>
                          <span className="text-stone-600 font-medium">
                            {order.deliveryAddress.recipientName} ({order.deliveryAddress.phone})
                          </span>
                        </div>
                        <p className="text-stone-600">
                          {order.deliveryAddress.street}{order.deliveryAddress.buildingNumber ? ` #${order.deliveryAddress.buildingNumber}` : ''}, {order.deliveryAddress.sector}, {order.deliveryAddress.municipality}, {order.deliveryAddress.province}
                        </p>
                        {order.deliveryAddress.reference && (
                          <p className="text-[11px] text-stone-500 italic">
                            Referencia: {order.deliveryAddress.reference}
                          </p>
                        )}
                        {order.deliveryAddress.deliveryNotes && (
                          <p className="text-[11px] text-blue-900 bg-blue-50/70 p-1.5 rounded border border-blue-100 mt-1">
                            Indicaciones: {order.deliveryAddress.deliveryNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Timeline Dropdown */}
                  <div className="bg-stone-50/70 rounded-lg p-3 text-xs text-stone-600 border border-stone-100">
                    <span className="font-bold text-stone-700 block mb-1">Historial del Pedido:</span>
                    <div className="space-y-1">
                      {order.statusHistory.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px]">
                          <span className="font-mono text-stone-400">
                            {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="font-bold text-stone-800">{h.status}:</span>
                          <span className="text-stone-500">{h.note || `Actualizado por ${h.updatedBy}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: FAVORITOS */}
      {activeTab === 'favorites' && (
        <div className="space-y-6">
          {/* Favorited Stores */}
          <div>
            <h3 className="text-sm font-bold text-stone-900 mb-3">Tiendas Guardadas</h3>
            {favStores.length === 0 ? (
              <p className="text-xs text-stone-400">No tienes tiendas guardadas en favoritos.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {favStores.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedStoreSlug(s.slug);
                      setCurrentView('store_public');
                    }}
                    className="p-3.5 bg-white rounded-xl border border-stone-200 hover:border-red-400 cursor-pointer transition-all flex items-center gap-3 shadow-2xs"
                  >
                    <img src={s.logo} alt="" className="w-12 h-12 rounded-xl object-cover border border-stone-200" />
                    <div>
                      <h4 className="font-bold text-xs text-stone-900">{s.name}</h4>
                      <p className="text-[11px] text-stone-500">{s.municipality}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Favorited Products */}
          <div>
            <h3 className="text-sm font-bold text-stone-900 mb-3">Productos Favoritos</h3>
            {favProducts.length === 0 ? (
              <p className="text-xs text-stone-400">No tienes productos en tu lista de deseos.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {favProducts.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    className="bg-white rounded-xl border border-stone-200 overflow-hidden cursor-pointer hover:shadow-md transition-all p-3"
                  >
                    <img src={p.images[0]} alt="" className="w-full aspect-square object-cover rounded-lg mb-2" />
                    <h4 className="font-semibold text-xs text-stone-900 line-clamp-2">{p.name}</h4>
                    <p className="font-bold text-xs text-red-600 mt-1">RD$ {(p.promoPrice || p.price).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: DIRECCIONES */}
      {activeTab === 'addresses' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-2xs">
          <CustomerAddressesManager />
        </div>
      )}

      {/* TAB: RECLAMACIONES / DISPUTAS */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-stone-900">Reclamaciones e Incidencias</h3>
          {disputes.filter(d => d.customerId === currentUser.id).length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-500 text-xs">
              No tienes ninguna reclamación abierta. Si tienes problemas con un pedido, puedes abrir una incidencia en la pestaña Mis Pedidos.
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.filter(d => d.customerId === currentUser.id).map(d => (
                <div key={d.id} className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-stone-900">Caso #{d.id} • Pedido {d.orderId}</span>
                    <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px]">
                      {d.status}
                    </span>
                  </div>
                  <p className="text-stone-700"><strong>Tienda:</strong> {d.storeName} | <strong>Motivo:</strong> {d.issueType}</p>
                  <p className="text-stone-600 bg-stone-50 p-2 rounded-lg">{d.description}</p>
                  {d.resolutionNotes && (
                    <div className="p-2 rounded bg-emerald-50 text-emerald-900 font-medium text-[11px]">
                      Resolución: {d.resolutionNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: SEGURIDAD & CONTRASEÑA */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-black text-stone-900">Seguridad & Contraseña</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Administra tu contraseña de acceso para mantener protegida tu cuenta de cliente en Plazado.com.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs max-w-xl space-y-5 text-xs">
            <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl">
              <div className="p-2 bg-red-600 text-white rounded-lg">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-xs">Protección de Cuenta</h4>
                <p className="text-[11px] text-stone-600">
                  Usa una clave de al menos 6 caracteres que no uses en otros servicios.
                </p>
              </div>
            </div>

            {passError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCustomerPasswordChange} className="space-y-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Ingresa tu clave anterior o habitual.
                </span>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nueva Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Confirmar Nueva Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                    className="w-full pl-9 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passLoading || newPass.length < 6 || newPass !== confirmPass}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{passLoading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB: VALIDACIÓN DE IDENTIDAD & CÉDULA */}
      {activeTab === 'identity' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-black text-stone-900 flex items-center gap-2 flex-wrap">
              <span>Validación de Identidad & Cédula Dominicana</span>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                currentUser.adminApprovalStatus === 'APPROVED' || currentUser.isApprovedByAdmin
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : currentUser.kycData?.cedulaFrontUrl
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-stone-100 text-stone-600 border border-stone-200'
              }`}>
                {currentUser.adminApprovalStatus === 'APPROVED' || currentUser.isApprovedByAdmin
                  ? 'CUENTA AUTORIZADA'
                  : currentUser.kycData?.cedulaFrontUrl
                  ? 'EN REVISIÓN POR SUPER ADMIN'
                  : 'DOCUMENTOS PENDIENTES'}
              </span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Almacenamiento seguro de tu cédula dominicana y fotografía biométrica para compras protegidas en PlazaDO.com.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs max-w-2xl space-y-6 text-xs">
            {/* Status explanation card */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              currentUser.adminApprovalStatus === 'APPROVED' || currentUser.isApprovedByAdmin
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : currentUser.kycData?.cedulaFrontUrl
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-stone-50 border-stone-200 text-stone-800'
            }`}>
              <div className={`p-2 rounded-lg text-white shrink-0 ${
                currentUser.adminApprovalStatus === 'APPROVED' || currentUser.isApprovedByAdmin
                  ? 'bg-emerald-600'
                  : currentUser.kycData?.cedulaFrontUrl
                  ? 'bg-amber-500'
                  : 'bg-stone-600'
              }`}>
                <ScanFace className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs">
                  {currentUser.adminApprovalStatus === 'APPROVED' || currentUser.isApprovedByAdmin
                    ? '¡Tu identidad está 100% verificada y autorizada!'
                    : currentUser.kycData?.cedulaFrontUrl
                    ? 'Tus documentos están en proceso de validación'
                    : 'Aún no has registrado tu Cédula Dominicana'}
                </h4>
                <p className="text-[11px] leading-relaxed">
                  {currentUser.adminApprovalStatus === 'APPROVED' || currentUser.isApprovedByAdmin
                    ? 'El Super Administrador de PlazaDO ha validado tu cédula y fotografía biométrica. Tu cuenta cuenta con todas las garantías de comprador verificado.'
                    : currentUser.kycData?.cedulaFrontUrl
                    ? 'Tus documentos han sido recibidos y almacenados con encriptación. El Super Administrador inspeccionará tu expediente para autorizar tu cuenta.'
                    : 'Registra tu número de cédula y sube una foto de tu documento oficial para validar tu cuenta en PlazaDO.'}
                </p>
              </div>
            </div>

            {/* Display Current Documents if registered */}
            {(currentUser.kycData?.cedulaFrontUrl || currentUser.cedulaNumber) && (
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
                <h4 className="font-bold text-stone-800 text-xs uppercase tracking-wider">
                  Expediente de Identidad Registrado
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-stone-400 text-[10px] block font-bold">Número de Cédula:</span>
                    <span className="font-mono font-bold text-sm text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-stone-200 inline-block mt-0.5">
                      {currentUser.cedulaNumber || currentUser.kycData?.cedulaNumber || 'No especificada'}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block font-bold">Score Biométrico:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-xs inline-block mt-0.5">
                      {currentUser.kycData?.biometricScore || 98.6}% Coincidencia Facial
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-stone-600 block">Fotografía Personal / Selfie:</span>
                    <div className="h-40 rounded-xl bg-white border border-stone-200 overflow-hidden flex items-center justify-center">
                      {currentUser.kycData?.selfieUrl || currentUser.avatar ? (
                        <img 
                          src={currentUser.kycData?.selfieUrl || currentUser.avatar} 
                          alt="Selfie" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <User className="w-8 h-8 text-stone-300" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-stone-600 block">Cédula Dominicana Frontal:</span>
                    <div className="h-40 rounded-xl bg-white border border-stone-200 overflow-hidden flex items-center justify-center">
                      {currentUser.kycData?.cedulaFrontUrl ? (
                        <img 
                          src={currentUser.kycData?.cedulaFrontUrl} 
                          alt="Cédula" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-stone-400 italic">No adjunta</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form to submit or update documents */}
            {(!currentUser.isApprovedByAdmin || currentUser.adminApprovalStatus === 'REJECTED') && (
              <form onSubmit={handleKycSubmit} className="space-y-4 pt-2 border-t border-stone-200">
                <h4 className="font-bold text-stone-900 text-xs">
                  {currentUser.kycData?.cedulaFrontUrl ? 'Actualizar o Reenviar Documentos' : 'Cargar Documentación para Validación'}
                </h4>

                {kycSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{kycSuccessMsg}</span>
                  </div>
                )}

                {kycErrorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{kycErrorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Número de Cédula Dominicana *
                  </label>
                  <input
                    type="text"
                    required
                    value={kycCedulaNumber}
                    onChange={(e) => setKycCedulaNumber(e.target.value)}
                    placeholder="001-0000000-0"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500 font-medium font-mono"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    Formato oficial de 11 dígitos de la Junta Central Electoral (JCE).
                  </span>
                </div>

                <div className="space-y-3">
                  <ImageUploadInput
                    label="Foto Frontal de la Cédula Dominicana *"
                    value={kycCedulaFrontUrl}
                    onChange={setKycCedulaFrontUrl}
                    aspectRatioLabel="Cédula Frontal (16:9)"
                    placeholder="https://ejemplo.com/cedula-frontal.jpg"
                    helpText="Sube una fotografía nítida del frente de tu documento oficial."
                  />

                  <ImageUploadInput
                    label="Fotografía Personal / Selfie Biométrica (Opcional)"
                    value={kycSelfieUrl}
                    onChange={setKycSelfieUrl}
                    shape="circle"
                    aspectRatioLabel="Selfie (1:1)"
                    placeholder="https://ejemplo.com/mi-selfie.jpg"
                    helpText="Fotografía de tu rostro de frente para comprobación biométrica."
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingKyc}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmittingKyc ? 'Enviando Expediente...' : 'Enviar Documentos para Validación'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
        </main>
      </div>

      {/* Dispute Modal */}
      {disputeModalOpen && disputeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <h3 className="font-bold text-stone-900 text-sm">Abrir Reclamación para {disputeOrder.id}</h3>
              <button onClick={() => setDisputeModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDispute} className="space-y-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Motivo del reclamo</label>
                <select
                  value={disputeType}
                  onChange={(e) => setDisputeType(e.target.value as any)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                >
                  <option value="NOT_RECEIVED">Producto no recibido</option>
                  <option value="DAMAGED">Producto llegó dañado</option>
                  <option value="WRONG_ITEM">Producto incorrecto</option>
                  <option value="DESCRIPTION_MISMATCH">Diferencias con la descripción</option>
                  <option value="DELIVERY_ISSUE">Problema con la entrega / mensajero</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Describe detalladamente lo ocurrido</label>
                <textarea
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="Explica el problema para que la administración y la tienda puedan resolverlo..."
                  rows={4}
                  required
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg outline-none focus:border-red-500"
                />
              </div>

              <div className="p-3 bg-red-50 rounded-lg text-red-800 text-[11px] leading-relaxed">
                El equipo de mediación de PlazaDO revisará la evidencia y los registros de auditoría para dictaminar la resolución o el reembolso en caso aplicable.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeModalOpen(false)}
                  className="px-4 py-2 text-stone-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
                >
                  Enviar Reclamación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Profile Edit Modal */}
      <UserProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

    </div>
  );
};
