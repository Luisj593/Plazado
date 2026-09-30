import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Store as StoreIcon, 
  User as UserIcon, 
  ShieldCheck, 
  Package, 
  Clock, 
  CheckCheck, 
  Info,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles,
  Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OrderChatMessage } from '../../types';

export const OrderChatModal: React.FC = () => {
  const { 
    activeChatOrderId, 
    closeOrderChat, 
    orders, 
    stores, 
    currentUser, 
    orderMessages, 
    sendOrderMessage,
    markOrderMessagesAsRead
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeOrder = orders.find(o => o.id === activeChatOrderId);
  const orderStore = stores.find(s => s.id === activeOrder?.storeId);

  const isStoreUser = currentUser?.role === 'STORE_OWNER' || (activeOrder && currentUser?.storeId === activeOrder.storeId);
  const isAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Filter messages for current order
  const messages = orderMessages
    .filter(m => m.orderId === activeChatOrderId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Auto-scroll when messages update
  useEffect(() => {
    if (activeChatOrderId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      markOrderMessagesAsRead(activeChatOrderId, isStoreUser ? 'STORE' : 'CUSTOMER');
    }
  }, [activeChatOrderId, messages.length, isStoreUser]);

  // Focus input on open
  useEffect(() => {
    if (activeChatOrderId) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [activeChatOrderId]);

  if (!activeChatOrderId || !activeOrder) {
    return null;
  }

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setInputText('');
    await sendOrderMessage(activeChatOrderId, trimmed);
    setIsSending(false);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleQuickSuggestion = (text: string) => {
    setInputText(text);
    inputRef.current?.focus();
  };

  // Quick suggestion prompts
  const customerSuggestions = [
    '¿Cuándo despachan el pedido?',
    'Quería confirmar la dirección de entrega',
    'Por favor avísenme antes de enviar con el repartidor',
    '¡Muchas gracias!'
  ];

  const storeSuggestions = [
    '¡Hola! Tu pedido ya está confirmado y en preparación.',
    'Tu pedido ha salido con el repartidor.',
    'Por favor mantén tu teléfono a mano para la entrega.',
    '¿Tienes alguna instrucción especial para llegar a tu dirección?'
  ];

  const suggestions = isStoreUser ? storeSuggestions : customerSuggestions;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Entregado</span>;
      case 'SHIPPED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700">En Camino</span>;
      case 'CONFIRMED':
      case 'PROCESSING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">En Preparación</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Cancelado</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">Confirmado</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full h-[90vh] sm:h-[650px] shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-stone-900 text-white flex items-center justify-between gap-3 shrink-0 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            {orderStore?.logo ? (
              <img 
                src={orderStore.logo} 
                alt={activeOrder.storeName} 
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover bg-stone-800 border border-stone-700 shrink-0" 
              />
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                <StoreIcon className="w-5 h-5" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white truncate">
                  {isStoreUser ? activeOrder.customerName : activeOrder.storeName}
                </h3>
                <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold bg-red-600/30 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded-md">
                  <ShieldCheck className="w-3 h-3 text-red-400" />
                  Chat Oficial
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-300">
                <span className="font-mono text-stone-400">Orden #{activeOrder.id.replace('ORD-', '')}</span>
                <span>•</span>
                {getStatusBadge(activeOrder.status)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowOrderSummary(!showOrderSummary)}
              className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
              title="Ver detalle del pedido"
            >
              <Package className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pedido</span>
              {showOrderSummary ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              onClick={closeOrderChat}
              className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
              title="Cerrar chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable Order Summary */}
        {showOrderSummary && (
          <div className="p-3 sm:p-4 bg-stone-50 border-b border-stone-200 text-xs space-y-2 shrink-0 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between font-semibold text-stone-800">
              <span>Artículos del Pedido ({activeOrder.items.length})</span>
              <span className="text-red-600 font-bold">Total: RD$ {activeOrder.total.toLocaleString()}</span>
            </div>
            <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
              {activeOrder.items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between text-stone-600 bg-white p-1.5 rounded-lg border border-stone-200">
                  <span className="truncate max-w-[240px] font-medium">{it.quantity}x {it.productName}</span>
                  <span className="font-semibold text-stone-900 shrink-0">RD$ {(it.price * it.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-stone-500 text-[11px] pt-1 border-t border-stone-200">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="truncate">
                {activeOrder.deliveryAddress.street}, {activeOrder.deliveryAddress.municipality}, {activeOrder.deliveryAddress.province}
              </span>
            </div>
          </div>
        )}

        {/* Security & Official Channel Banner */}
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-[11px] text-amber-900 shrink-0">
          <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <p className="leading-tight">
            <span className="font-bold">Canal Exclusivo PlazaDO:</span> Comunicación protegida por la garantía oficial. No realices pagos fuera de la plataforma ni compartas datos bancarios sensibles.
          </p>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-stone-400">
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                <Sparkles className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h4 className="font-bold text-stone-700 text-sm">Canal de Chat Activado</h4>
                <p className="text-xs text-stone-500 max-w-sm mt-1">
                  Tu compra ha sido confirmada. Escribe aquí cualquier consulta o indicación sobre la preparación y entrega de tu pedido.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = (isStoreUser && msg.senderRole === 'STORE') ||
                             (!isStoreUser && !isAdmin && msg.senderRole === 'CUSTOMER') ||
                             (isAdmin && msg.senderRole === 'ADMIN') ||
                             (currentUser?.id === msg.senderId);

              const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-semibold text-stone-500">
                      {isMine ? 'Tú' : msg.senderName}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold ${
                      msg.senderRole === 'STORE' 
                        ? 'bg-amber-100 text-amber-800' 
                        : msg.senderRole === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-stone-200 text-stone-700'
                    }`}>
                      {msg.senderRole === 'STORE' ? 'Tienda Oficial' : msg.senderRole === 'ADMIN' ? 'Soporte PlazaDO' : 'Cliente'}
                    </span>
                    <span className="text-[10px] text-stone-400">{timeStr}</span>
                  </div>

                  <div 
                    className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      isMine 
                        ? 'bg-red-600 text-white rounded-tr-none' 
                        : 'bg-white text-stone-800 border border-stone-200 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    
                    {isMine && (
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-red-200">
                        <span>Enviado</span>
                        <CheckCheck className={`w-3 h-3 ${
                          (isStoreUser ? msg.readByCustomer : msg.readByStore) ? 'text-white' : 'text-red-300'
                        }`} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-2 bg-stone-100/80 border-t border-stone-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] uppercase font-bold text-stone-400 shrink-0 px-1">Sugerencias:</span>
          {suggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickSuggestion(sug)}
              className="text-[11px] whitespace-nowrap bg-white hover:bg-stone-200 text-stone-700 px-2.5 py-1 rounded-full border border-stone-300 transition-colors shadow-2xs shrink-0"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe tu mensaje a través de PlazaDO..."
            className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white text-stone-900 transition-all placeholder:text-stone-400"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
          >
            <span>Enviar</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>
    </div>
  );
};
