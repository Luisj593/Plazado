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
  Lock
} from 'lucide-react';
import { OrderStatus, Dispute } from '../../types';
import { UserProfileModal } from '../common/UserProfileModal';

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
    openAuthModal
  } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'favorites' | 'addresses' | 'disputes'>('orders');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<string | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

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

  const handleSubmitDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeOrder || !disputeDesc.trim()) return;

    createDispute({
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
      
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <img 
              src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"} 
              alt={currentUser.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-red-500 shadow-xs"
            />
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="absolute -bottom-1 -right-1 bg-stone-900 hover:bg-red-600 text-white p-1 rounded-full shadow-xs transition-colors"
              title="Cambiar foto de perfil"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-stone-900">{currentUser.name}</h1>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Cliente Comprador
              </span>
              <button
                id="edit-profile-btn"
                onClick={() => setIsEditProfileOpen(true)}
                className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 ml-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Editar Perfil & Foto</span>
              </button>
            </div>
            <p className="text-xs text-stone-500">{currentUser.email} • {currentUser.phone}</p>
          </div>
        </div>

        {/* Quick Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'orders' 
                ? 'bg-red-600 text-white shadow-xs' 
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Mis Pedidos ({customerOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'favorites' 
                ? 'bg-red-600 text-white shadow-xs' 
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Favoritos</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'addresses' 
                ? 'bg-red-600 text-white shadow-xs' 
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Direcciones</span>
          </button>

          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'disputes' 
                ? 'bg-red-600 text-white shadow-xs' 
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Reclamaciones ({disputes.filter(d => d.customerId === currentUser.id).length})</span>
          </button>
        </div>
      </div>

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

                    {/* Delivery Secret Code & Actions Box (Requerimiento #15) */}
                    <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 w-full md:w-80 flex flex-col justify-between text-xs space-y-3">
                      <div>
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
                          {order.status === 'DELIVERED' ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Entrega validada con este código
                            </span>
                          ) : (
                            <span>Muestra este código al repartidor únicamente cuando recibas y revises tu paquete.</span>
                          )}
                        </p>
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

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleOpenDispute(order)}
                          className="flex-1 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold"
                        >
                          Abrir Reclamación
                        </button>
                      </div>
                    </div>
                  </div>

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
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-stone-900">Mis Direcciones de Entrega</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentUser.addresses.map(a => (
              <div key={a.id} className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-stone-900">{a.label}</span>
                  {a.isDefault ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Principal</span>
                  ) : (
                    <button onClick={() => setDefaultAddress(a.id)} className="text-[11px] text-red-600 font-semibold hover:underline">
                      Hacer principal
                    </button>
                  )}
                </div>
                <p className="text-stone-700 font-medium">{a.recipientName} • {a.phone}</p>
                <p className="text-stone-600">{a.street}, {a.sector}</p>
                <p className="text-stone-500">{a.municipality}, {a.province}</p>
                {a.reference && <p className="text-stone-400 italic">Ref: {a.reference}</p>}
              </div>
            ))}
          </div>
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
