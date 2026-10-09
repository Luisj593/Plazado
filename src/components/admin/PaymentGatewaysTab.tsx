import React, { useState } from 'react';
import { api } from '../../services/api';
import { 
  CreditCard, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Trash2, 
  Key, 
  Building2, 
  Globe, 
  Copy, 
  Check, 
  AlertCircle, 
  Lock, 
  RefreshCw, 
  Plus, 
  Zap
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { PaymentGatewayConfig, PaymentProviderKey } from '../../types';

export const PaymentGatewaysTab: React.FC = () => {
  const { 
    paymentGateways, 
    activePaymentGateway, 
    savePaymentGateway, 
    setActivePaymentGateway, 
    deletePaymentGateway 
  } = useAppContext();

  const [editingGateway, setEditingGateway] = useState<PaymentGatewayConfig | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  // Form states
  const [formProviderKey, setFormProviderKey] = useState<PaymentProviderKey>('AZUL');
  const [formProviderName, setFormProviderName] = useState('');
  const [formCommercialName, setFormCommercialName] = useState('Plazado Dominicana SRL');
  const [formMerchantId, setFormMerchantId] = useState('');
  const [formAffiliationNumber, setFormAffiliationNumber] = useState('');
  const [formCurrency, setFormCurrency] = useState<'DOP' | 'USD'>('DOP');
  const [formEnvironment, setFormEnvironment] = useState<'PRODUCTION' | 'SANDBOX'>('PRODUCTION');
  const [formWebhookUrl, setFormWebhookUrl] = useState('https://plazado.com/api/payments/webhook');
  const [formBank, setFormBank] = useState('Banco Popular Dominicano');
  const [formAccountType, setFormAccountType] = useState('Corriente');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formAccountHolder, setFormAccountHolder] = useState('Plazado Dominicana SRL');
  const [formRnc, setFormRnc] = useState('1-32-48921-1');
  const [formAuthKey, setFormAuthKey] = useState('');
  const [formSecretKey, setFormSecretKey] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestConnection = async (gateway: PaymentGatewayConfig) => {
    setTestingConnectionId(gateway.id);
    setTestSuccessMessage(null);
    try {
      const result = await api.testPaymentGateway(gateway.id);
      setTestSuccessMessage(result.message);
    } catch (error) {
      setTestSuccessMessage(error instanceof Error ? error.message : 'No se pudo validar la conexión. Revisa las credenciales guardadas.');
    } finally {
      setTestingConnectionId(null);
    }
  };

  const openCreateModal = (provider: PaymentProviderKey = 'AZUL') => {
    setIsCreatingNew(true);
    setEditingGateway(null);
    setFormProviderKey(provider);
    setFormProviderName(provider === 'PAYPAL' ? 'PayPal' : 'AZUL Dominicana');
    setFormCommercialName('Plazado Dominicana SRL');
    setFormMerchantId('');
    setFormAffiliationNumber('');
    setFormCurrency(provider === 'PAYPAL' ? 'USD' : 'DOP');
    setFormEnvironment('PRODUCTION');
    setFormWebhookUrl('https://plazado.com/api/payments/webhook');
    setFormBank('Banco Popular Dominicano');
    setFormAccountType('Corriente');
    setFormAccountNumber('');
    setFormAccountHolder('Plazado Dominicana SRL');
    setFormRnc('1-32-48921-1');
    setFormClientId('');
    setFormAuthKey('');
    setFormSecretKey('');
    setFormApiKey('');
    setFormNotes('');
  };

  const openEditModal = (g: PaymentGatewayConfig) => {
    setIsCreatingNew(false);
    setEditingGateway(g);
    setFormProviderKey(g.providerKey);
    setFormProviderName(g.providerName);
    setFormCommercialName(g.accountCommercialName);
    setFormMerchantId(g.merchantId);
    setFormAffiliationNumber(g.affiliationNumber);
    setFormCurrency(g.currency);
    setFormEnvironment(g.environment);
    setFormWebhookUrl(g.webhookUrl);
    setFormBank(g.associatedBankAccount.bank);
    setFormAccountType(g.associatedBankAccount.accountType);
    setFormAccountNumber(g.associatedBankAccount.accountNumber);
    setFormAccountHolder(g.associatedBankAccount.accountHolder);
    setFormRnc(g.associatedBankAccount.rncOrCedula);
    setFormClientId(g.credentials?.clientId || '');
    setFormAuthKey('');
    setFormSecretKey('');
    setFormApiKey(g.credentials?.apiKey || '');
    setFormNotes(g.notes || '');
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = editingGateway ? editingGateway.id : formProviderKey.toLowerCase() + '-' + Date.now();
    const isCurrentlyActive = editingGateway ? editingGateway.isActive : false;

    const payload: PaymentGatewayConfig = {
      id: targetId,
      providerKey: formProviderKey,
      providerName: formProviderName || formProviderKey,
      accountCommercialName: formCommercialName,
      merchantId: formMerchantId,
      affiliationNumber: formAffiliationNumber,
      currency: formCurrency,
      associatedBankAccount: {
        bank: formBank,
        accountType: formAccountType,
        accountNumber: formAccountNumber,
        accountHolder: formAccountHolder,
        rncOrCedula: formRnc
      },
      isActive: isCurrentlyActive,
      environment: formEnvironment,
      webhookUrl: formWebhookUrl,
      credentials: {
        clientId: formProviderKey === 'PAYPAL' ? formClientId.trim() || undefined : undefined,
        clientSecret: formProviderKey === 'PAYPAL' ? formSecretKey.trim() || undefined : undefined,
        authKey: formAuthKey || undefined,
        secretKey: formProviderKey !== 'PAYPAL' ? formSecretKey || undefined : undefined,
        apiKey: formApiKey || undefined,
        merchantSecret: formProviderKey !== 'PAYPAL' ? formSecretKey || undefined : undefined,
        hasCredentials: true
      },
      lastModified: new Date().toISOString(),
      notes: formNotes
    };

    const res = await savePaymentGateway(payload);
    if (res.success) {
      setEditingGateway(null);
      setIsCreatingNew(false);
    }
  };

  return (
    <div className="space-y-6" id="admin-payment-gateways-view">
      
      {/* Hero Explanatory Header */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-700/70 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 bg-emerald-600/90 text-white rounded-xl shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black tracking-tight">Cuenta Receptora de Pagos de Plazado.com</h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Custodia Fiduciaria Escrow
              </span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Configura y gestiona las pasarelas bancarias autorizadas que reciben los cobros con tarjeta en Plazado.com. 
              <strong> Todos los pagos con tarjeta de clientes ingresan a esta cuenta principal fiduciaria de la plataforma</strong>. 
              Posteriormente, las tiendas cobran sus fondos netos acumulados cada viernes mediante su propia cuenta bancaria de liquidación.
            </p>
          </div>

          <button
            onClick={() => openCreateModal()}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-xs shrink-0 self-start md:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Pasarela</span>
          </button>
        </div>

        <button type="button" onClick={() => {
          const paypal = paymentGateways.find(g => g.providerKey === 'PAYPAL');
          if (paypal) openEditModal(paypal); else openCreateModal('PAYPAL');
        }} className="mt-4 px-4 py-2.5 bg-blue-700 text-white font-bold rounded-xl text-xs">
          Configurar PayPal · Client ID y Client Secret
        </button>
        {/* Active Gateway Highlight Card */}
        {activePaymentGateway && (
          <div className="mt-5 pt-5 border-t border-stone-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700">
              <span className="text-stone-400 font-semibold block text-[11px]">Pasarela Activa en Producción:</span>
              <span className="text-emerald-400 font-black text-sm mt-0.5 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                {activePaymentGateway.providerName}
              </span>
            </div>
            <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700">
              <span className="text-stone-400 font-semibold block text-[11px]">Merchant ID / Afiliación:</span>
              <span className="text-white font-mono font-bold mt-0.5 block">
                {activePaymentGateway.merchantId} ({activePaymentGateway.affiliationNumber})
              </span>
            </div>
            <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700">
              <span className="text-stone-400 font-semibold block text-[11px]">Cuenta Bancaria Receptora:</span>
              <span className="text-white font-medium mt-0.5 block truncate">
                {activePaymentGateway.associatedBankAccount.bank} ••••{activePaymentGateway.associatedBankAccount.accountNumber.slice(-4)}
              </span>
            </div>
            <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700">
              <span className="text-stone-400 font-semibold block text-[11px]">Ambiente & Moneda:</span>
              <span className="text-white font-bold mt-0.5 flex items-center gap-1.5">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${activePaymentGateway.environment === 'PRODUCTION' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {activePaymentGateway.environment}
                </span>
                <span>{activePaymentGateway.currency}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Test Connection Banner Alert */}
      {testSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2 font-medium animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{testSuccessMessage}</span>
        </div>
      )}

      {/* List of Configured Payment Gateways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {paymentGateways.map((gateway) => {
          const isTesting = testingConnectionId === gateway.id;
          return (
            <div 
              key={gateway.id} 
              className={`bg-white rounded-2xl border transition-all shadow-xs p-5 relative flex flex-col justify-between ${
                gateway.isActive 
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' 
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div>
                {/* Header status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="p-2 rounded-xl bg-stone-100 text-stone-800">
                        <CreditCard className="w-4 h-4" />
                      </span>
                      <h3 className="font-extrabold text-stone-900 text-base">{gateway.providerName}</h3>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        gateway.environment === 'PRODUCTION'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {gateway.environment}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                        {gateway.currency}
                      </span>
                    </div>
                    <span className="text-xs text-stone-500 mt-1 block">
                      Titular: <strong>{gateway.accountCommercialName}</strong>
                    </span>
                  </div>

                  <div>
                    {gateway.isActive ? (
                      <span className="bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                        <CheckCircle className="w-3.5 h-3.5" />
                        ACTIVA (RECEPCIÓN)
                      </span>
                    ) : (
                      <button
                        onClick={() => setActivePaymentGateway(gateway.id)}
                        className="text-[11px] font-bold text-stone-600 hover:text-emerald-700 bg-stone-100 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-200 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"
                        title="Establecer como la pasarela principal donde se reciben todos los pagos"
                      >
                        <Zap className="w-3 h-3 text-amber-500" />
                        Activar Recepción
                      </button>
                    )}
                  </div>
                </div>

                {/* Identification & Bank details */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-stone-100 text-xs my-3">
                  <div>
                    <span className="text-stone-400 block text-[10px] font-bold uppercase">Merchant ID</span>
                    <span className="font-mono font-bold text-stone-900">{gateway.merchantId}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px] font-bold uppercase">No. Afiliación</span>
                    <span className="font-mono font-bold text-stone-900">{gateway.affiliationNumber}</span>
                  </div>
                  <div className="col-span-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200/70">
                    <div className="flex items-center gap-1.5 text-stone-700 font-bold text-[11px] mb-1">
                      <Building2 className="w-3.5 h-3.5 text-stone-500" />
                      <span>Depósito Central: {gateway.associatedBankAccount.bank}</span>
                    </div>
                    <div className="text-[11px] text-stone-600 space-y-0.5">
                      <p>Cuenta: <strong className="font-mono">{gateway.associatedBankAccount.accountNumber}</strong> ({gateway.associatedBankAccount.accountType})</p>
                      <p>Beneficiario: <strong>{gateway.associatedBankAccount.accountHolder}</strong> | RNC: {gateway.associatedBankAccount.rncOrCedula}</p>
                    </div>
                  </div>
                </div>

                {/* Credentials & Webhook */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <Lock className="w-3.5 h-3.5 text-stone-400" />
                      <span>Credenciales:</span>
                      <span className="font-mono font-bold text-stone-800">
                        {gateway.credentials?.authKey || gateway.credentials?.apiKey || gateway.credentials?.secretKey || '••••••••8492'}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Cifrado Seguro
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">
                    <div className="flex items-center gap-1.5 text-stone-600 truncate max-w-[280px]">
                      <Globe className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate font-mono text-[10px]">{gateway.webhookUrl}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(gateway.webhookUrl, gateway.id + '-webhook')}
                      className="text-stone-500 hover:text-stone-900 p-1 transition-colors"
                      title="Copiar URL de Webhook"
                    >
                      {copiedKey === gateway.id + '-webhook' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Notes & Last modified */}
                {gateway.notes && (
                  <p className="text-[11px] text-stone-500 italic mt-2.5 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                    "{gateway.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <div className="text-[10px] text-stone-400">
                  Modificado: {new Date(gateway.lastModified).toLocaleDateString()}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTestConnection(gateway)}
                    disabled={isTesting}
                    className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                    title="Probar webhook y conectividad"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-emerald-600' : ''}`} />
                    <span>{isTesting ? 'Validando...' : 'Probar'}</span>
                  </button>

                  <button
                    onClick={() => openEditModal(gateway)}
                    className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  {!gateway.isActive && (
                    <button
                      onClick={() => {
                        if (confirm(`¿Estás seguro de eliminar la configuración de ${gateway.providerName}?`)) {
                          deletePaymentGateway(gateway.id);
                        }
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar pasarela"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Creating or Editing Payment Gateway */}
      {(editingGateway || isCreatingNew) && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8 animate-scaleUp">
            
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-red-600 rounded-lg">
                  <CreditCard className="w-5 h-5 text-white" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base">
                    {isCreatingNew ? 'Configurar Nueva Pasarela de Cobro' : `Editar ${editingGateway?.providerName}`}
                  </h3>
                  <p className="text-[11px] text-stone-300">
                    Cuenta receptora central oficial de Plazado.com
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setEditingGateway(null); setIsCreatingNew(false); }}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Proveedor / Sistema</label>
                  <select 
                    value={formProviderKey}
                    onChange={(e) => {
                      const k = e.target.value as PaymentProviderKey;
                      setFormProviderKey(k);
                      if (k === 'AZUL') setFormProviderName('AZUL (Servicios Digitales Popular)');
                      else if (k === 'CARDNET') setFormProviderName('CardNET (Consorcio de Tarjetas Dominicanas)');
                      else if (k === 'STRIPE') setFormProviderName('Stripe Payments International');
                      else if (k === 'PAYPAL') { setFormProviderName('PayPal'); setFormCurrency('USD'); }
                      else setFormProviderName('Pasarela Bancaria Personalizada');
                    }}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-medium text-stone-800"
                  >
                    <option value="AZUL">AZUL (Banco Popular Dominicano)</option>
                    <option value="CARDNET">CardNET (Banreservas / Dominicano)</option>
                    <option value="STRIPE">Stripe (Internacional USD / Tarjetas Extranjeras)</option>
                    <option value="PAYPAL">PayPal Commerce</option>
                    <option value="CUSTOM">Otro Procesador Bancario</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Nombre Descriptivo</label>
                  <input 
                    type="text"
                    value={formProviderName}
                    onChange={(e) => setFormProviderName(e.target.value)}
                    required={formProviderKey !== 'PAYPAL'}
                    placeholder="Ej. AZUL Dominicana"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-medium text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Merchant ID</label>
                  <input 
                    type="text"
                    value={formMerchantId}
                    onChange={(e) => setFormMerchantId(e.target.value)}
                    required={formProviderKey !== 'PAYPAL'}
                    placeholder="Ej. 39038540019"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-mono text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Número de Afiliación</label>
                  <input 
                    type="text"
                    value={formAffiliationNumber}
                    onChange={(e) => setFormAffiliationNumber(e.target.value)}
                    required={formProviderKey !== 'PAYPAL'}
                    placeholder="Ej. 84729103"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-mono text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Ambiente de Ejecución</label>
                  <select 
                    value={formEnvironment}
                    onChange={(e) => setFormEnvironment(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-medium text-stone-800"
                  >
                    <option value="PRODUCTION">PRODUCCIÓN (Cobros reales de tarjeta)</option>
                    <option value="SANDBOX">SANDBOX / PRUEBAS (Simulador)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Moneda de Liquidación</label>
                  <select 
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-medium text-stone-800"
                  >
                    <option value="DOP">DOP (Pesos Dominicanos - RD$)</option>
                    <option value="USD">USD (Dólares Estadounidenses)</option>
                  </select>
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <div className="font-bold text-stone-800 flex items-center gap-1.5 text-xs">
                  <Building2 className="w-4 h-4 text-stone-500" />
                  <span>Cuenta Bancaria Oficial de Plazado.com (Depósito Directo)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1 text-[11px]">Banco</label>
                    <input 
                      type="text"
                      value={formBank}
                      onChange={(e) => setFormBank(e.target.value)}
                      required={formProviderKey !== 'PAYPAL'}
                      placeholder="Ej. Banco Popular Dominicano"
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-medium text-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1 text-[11px]">Número de Cuenta</label>
                    <input 
                      type="text"
                      value={formAccountNumber}
                      onChange={(e) => setFormAccountNumber(e.target.value)}
                      required={formProviderKey !== 'PAYPAL'}
                      placeholder="Ej. 8192847192"
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-mono text-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1 text-[11px]">Titular de la Cuenta</label>
                    <input 
                      type="text"
                      value={formAccountHolder}
                      onChange={(e) => setFormAccountHolder(e.target.value)}
                      required={formProviderKey !== 'PAYPAL'}
                      placeholder="Ej. Plazado Dominicana SRL"
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-medium text-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1 text-[11px]">RNC o Cédula</label>
                    <input 
                      type="text"
                      value={formRnc}
                      onChange={(e) => setFormRnc(e.target.value)}
                      required={formProviderKey !== 'PAYPAL'}
                      placeholder="Ej. 1-32-48921-1"
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-mono text-stone-800"
                    />
                  </div>
                </div>
              </div>

              {formProviderKey === 'PAYPAL' && <p className="p-3 bg-blue-50 text-blue-900 rounded-xl">
                Puedes guardar PayPal con el secreto pendiente. Introduce el Client ID completo de tu aplicación y selecciona Live (Producción) o Sandbox.
                {editingGateway?.credentials?.hasClientSecret ? ' Client Secret guardado; déjalo vacío para conservarlo.' : ' Client Secret pendiente.'}
                {' '}Guardar estas credenciales no habilita cobros; el checkout de PayPal aún está pendiente de integración.
              </p>}
              {/* API Credentials */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <div className="font-bold text-stone-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span>Llaves de Seguridad y Credenciales</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-normal">
                    (Deja el secreto en blanco para conservar el guardado)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1 text-[11px]">{formProviderKey === 'PAYPAL' ? 'PayPal Client ID (completo)' : 'AuthKey / Llave de Autenticación'}</label>
                    <input 
                      type={formProviderKey === 'PAYPAL' ? 'text' : 'password'}
                      value={formProviderKey === 'PAYPAL' ? formClientId : formAuthKey}
                      onChange={(e) => formProviderKey === 'PAYPAL' ? setFormClientId(e.target.value) : setFormAuthKey(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-mono text-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1 text-[11px]">{formProviderKey === 'PAYPAL' ? 'PayPal Client Secret' : 'Merchant Secret / Secret Key'}</label>
                    <input 
                      type="password"
                      autoComplete="new-password"
                      value={formSecretKey}
                      onChange={(e) => setFormSecretKey(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-mono text-stone-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-600 font-semibold mb-1 text-[11px]">Webhook URL de Notificación</label>
                  <input 
                    type="url"
                    value={formWebhookUrl}
                    onChange={(e) => setFormWebhookUrl(e.target.value)}
                    required={formProviderKey !== 'PAYPAL'}
                    placeholder="https://plazado.com/api/payments/webhook"
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 font-mono text-stone-800 text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Notas Técnicas / Administrativas</label>
                <textarea 
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Información adicional sobre contratos o SLAs con el adquirente..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-medium text-stone-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => { setEditingGateway(null); setIsCreatingNew(false); }}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-xs"
                >
                  {isCreatingNew ? 'Crear Configuración' : 'Guardar Cambios'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
