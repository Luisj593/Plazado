import React, { useState, useEffect, useRef } from 'react';
import { downloadPlatformPolicies } from '../../utils/legalDownloads';
import { RegistrationTermsModal } from './RegistrationTermsModal';
import { LEGAL_VERSION, LegalAudience } from '../../legal/registration';
import { useApp } from '../../context/AppContext';
import { DOMINICAN_PROVINCES } from '../../data/initialData';
import { BiometricKycVerification, BiometricKycData } from './BiometricKycVerification';
import { 
  X, 
  User, 
  Store as StoreIcon, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  ArrowLeft,
  Truck,
  Sparkles,
  Info,
  AlertCircle,
  ShoppingCart,
  ScanFace,
  MailCheck,
  RefreshCw
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    authModalMode, 
    openAuthModal, 
    closeAuthModal, 
    login, 
    registerCustomer, 
    registerStoreAccount,
    pendingVerificationEmail,
    setPendingVerificationEmail,
    verifyCode,
    resendVerificationCode,
    categories,
    stores,
    authPurchaseNotice,
    showNotification
  } = useApp();

  const [legalAudience, setLegalAudience] = useState<LegalAudience | null>(null);
  const [continueAfterAcceptance, setContinueAfterAcceptance] = useState(false);
  const customerFormRef = useRef<HTMLFormElement>(null);
  const storeFormRef = useRef<HTMLFormElement>(null);

  const openRegistrationTerms = (audience: LegalAudience, continueRegistration = false) => {
    setContinueAfterAcceptance(continueRegistration);
    setLegalAudience(audience);
  };

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Email verification state
  const [verifyDigits, setVerifyDigits] = useState(['', '', '', '', '', '']);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccessNotice, setVerifySuccessNotice] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const policyDownloadEmailRef = useRef<string | null>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Customer registration state
  const [custName, setCustName] = useState('');
  const [custLastName, setCustLastName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custPass, setCustPass] = useState('');
  const [custPassConfirm, setCustPassConfirm] = useState('');
  const [custTerms, setCustTerms] = useState(false);
  const [custLoading, setCustLoading] = useState(false);
  const [custError, setCustError] = useState('');
  const [isCustomerKycOpen, setIsCustomerKycOpen] = useState(false);

  // Store registration state
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storePass, setStorePass] = useState('');
  const [storePassConfirm, setStorePassConfirm] = useState('');
  const [province, setProvince] = useState(DOMINICAN_PROVINCES[0]);
  const [municipality, setMunicipality] = useState('Distrito Nacional');
  const [address, setAddress] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-tecnologia');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [deliveryHome, setDeliveryHome] = useState(true);
  const [deliveryPickup, setDeliveryPickup] = useState(true);
  const [shippingRate, setShippingRate] = useState(250);
  const [storeTerms, setStoreTerms] = useState(false);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeError, setStoreError] = useState('');
  const [isStoreKycOpen, setIsStoreKycOpen] = useState(false);

  // Reset KYC state when changing modes or opening/closing modal
  useEffect(() => {
    setLegalAudience(null);
    setContinueAfterAcceptance(false);
    setCustTerms(false);
    setStoreTerms(false);
    setIsCustomerKycOpen(false);
    setIsStoreKycOpen(false);
    setCustError('');
    setStoreError('');
  }, [authModalMode, isAuthModalOpen]);

  // Countdown timer for resend
  useEffect(() => {
    if (isAuthModalOpen && resendCooldown > 0 && authModalMode === 'verify_email') {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown, authModalMode, isAuthModalOpen]);

  // When switching to verify_email, reset fields and autofocus first box
  useEffect(() => {
    if (isAuthModalOpen && authModalMode === 'verify_email') {
      setVerifyDigits(['', '', '', '', '', '']);
      setVerifyError('');
      setVerifySuccessNotice('');
      setResendCooldown(60);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [authModalMode, isAuthModalOpen]);

  useEffect(() => {
    if (!continueAfterAcceptance || legalAudience !== null) return;
    if (authModalMode === 'register_customer' && custTerms) {
      setContinueAfterAcceptance(false);
      customerFormRef.current?.requestSubmit();
    } else if (authModalMode === 'register_store' && storeTerms) {
      setContinueAfterAcceptance(false);
      storeFormRef.current?.requestSubmit();
    }
  }, [continueAfterAcceptance, legalAudience, custTerms, storeTerms, authModalMode]);

  if (!isAuthModalOpen) return null;

  // Unified Login Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await login(loginEmail, loginPassword);
      if (!res.success) {
        setLoginError(res.message || 'Error al iniciar sesión');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...verifyDigits];
    newCode[index] = digit;
    setVerifyDigits(newCode);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verifyDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;
    const newCode = [...verifyDigits];
    for (let i = 0; i < paste.length; i++) {
      newCode[i] = paste[i];
    }
    setVerifyDigits(newCode);
    if (paste.length === 6) {
      otpInputsRef.current[5]?.focus();
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');
    setVerifySuccessNotice('');
    const fullCode = verifyDigits.join('');
    if (fullCode.length < 6) {
      setVerifyError('Por favor introduce el código de 6 dígitos completo.');
      return;
    }

    const targetEmail = pendingVerificationEmail || custEmail || storeEmail;
    if (!targetEmail) {
      setVerifyError('No se encontró el correo electrónico para verificar.');
      return;
    }

    setVerifyLoading(true);
    try {
      const res = await verifyCode(targetEmail, fullCode);
      if (!res.success) {
        setVerifyError(res.message || 'Código de verificación incorrecto.');
      } else if (policyDownloadEmailRef.current !== targetEmail) {
        policyDownloadEmailRef.current = targetEmail;
        const downloaded = await downloadPlatformPolicies();
        showNotification(downloaded
          ? 'Registro completado. Se inició la descarga de las políticas de Plazado.'
          : 'Registro completado. Puedes descargar las políticas desde el enlace al pie de la página.');
      }
    } catch (err: any) {
      setVerifyError(err.message || 'Error validando código.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return;
    const targetEmail = pendingVerificationEmail || custEmail || storeEmail;
    if (!targetEmail) return;

    setIsResending(true);
    setVerifyError('');
    setVerifySuccessNotice('');
    try {
      const res = await resendVerificationCode(targetEmail);
      if (res.success) {
        setVerifySuccessNotice('Nuevo código enviado desde contacto@plazado.com. Revisa tu bandeja de entrada o spam.');
        setResendCooldown(60);
      } else {
        setVerifyError(res.message || 'No se pudo reenviar el código.');
      }
    } catch (err: any) {
      setVerifyError(err.message || 'Error reenviando código');
    } finally {
      setIsResending(false);
    }
  };

  // Customer Register Handler - Step 1: Register directly & automatically dispatch email code
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustError('');
    
    if (!custName.trim() || !custLastName.trim()) {
      setCustError('Por favor ingresa tu nombre y apellido.');
      return;
    }
    if (!custEmail.trim() || !custEmail.includes('@')) {
      setCustError('Por favor ingresa un correo electrónico válido.');
      return;
    }
    if (!custPhone.trim()) {
      setCustError('Por favor ingresa tu número de teléfono / WhatsApp.');
      return;
    }
    if (!custPass || custPass.length < 6) {
      setCustError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (custPass !== custPassConfirm) {
      setCustError('Las contraseñas ingresadas no coinciden.');
      return;
    }
    if (!custTerms) {
      openRegistrationTerms('CUSTOMER', true);
      return;
    }

    setCustLoading(true);
    try {
      const res = await registerCustomer({
        name: custName,
        lastName: custLastName,
        email: custEmail,
        phone: custPhone,
        password: custPass,
        confirmPassword: custPassConfirm,
        acceptedTerms: custTerms,
        legalVersion: LEGAL_VERSION,
        legalAudience: 'CUSTOMER',
        legalReadToEnd: custTerms
      });
      if (!res.success) {
        setCustError(res.message || 'Error al registrar cliente');
      }
    } catch (err: any) {
      setCustError(err.message || 'Ocurrió un error al registrar cliente');
    } finally {
      setCustLoading(false);
    }
  };

  // Complete Customer Registration with Biometric KYC & OTP code (if KYC was triggered)
  const handleCompleteCustomerKyc = async (kycData: BiometricKycData) => {
    setCustError('');
    setCustLoading(true);
    try {
      const res = await registerCustomer({
        name: custName,
        lastName: custLastName,
        email: custEmail,
        phone: custPhone,
        password: custPass,
        confirmPassword: custPassConfirm,
        acceptedTerms: custTerms,
        legalVersion: LEGAL_VERSION,
        legalAudience: 'CUSTOMER',
        legalReadToEnd: custTerms,
        cedulaNumber: kycData.cedulaNumber,
        cedulaFrontUrl: kycData.cedulaFrontUrl,
        selfieUrl: kycData.selfieUrl,
        biometricScore: kycData.biometricScore,
        verificationCode: kycData.verificationCode
      });
      if (!res.success) {
        setCustError(res.message || 'Error al registrar cliente');
        setIsCustomerKycOpen(false);
      }
    } catch (err: any) {
      setCustError(err.message || 'Ocurrió un error al registrar cliente');
      setIsCustomerKycOpen(false);
    } finally {
      setCustLoading(false);
    }
  };

  // Store Register Handler - Step 1: Register directly & automatically dispatch email code
  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoreError('');

    if (!storeName.trim()) {
      setStoreError('Por favor ingresa el nombre comercial de la tienda.');
      return;
    }
    if (!ownerName.trim()) {
      setStoreError('Por favor ingresa el nombre completo del responsable de la tienda.');
      return;
    }
    if (!storeEmail.trim() || !storeEmail.includes('@')) {
      setStoreError('Por favor ingresa un correo comercial válido.');
      return;
    }
    if (!storePhone.trim()) {
      setStoreError('Por favor ingresa un número de teléfono o WhatsApp de contacto.');
      return;
    }
    if (!storePass || storePass.length < 6) {
      setStoreError('La contraseña debe contener al menos 6 caracteres.');
      return;
    }
    if (storePass !== storePassConfirm) {
      setStoreError('Las contraseñas ingresadas no coinciden.');
      return;
    }
    if (!address.trim()) {
      setStoreError('Por favor ingresa la dirección física de la tienda o centro de despacho.');
      return;
    }
    if (!storeTerms) {
      openRegistrationTerms('STORE', true);
      return;
    }

    setStoreLoading(true);
    try {
      const shippingMethods: string[] = [];
      if (deliveryHome) shippingMethods.push('home_delivery');
      if (deliveryPickup) shippingMethods.push('store_pickup');

      const res = await registerStoreAccount({
        storeName,
        ownerName,
        email: storeEmail,
        phone: storePhone,
        password: storePass,
        confirmPassword: storePassConfirm,
        province,
        municipality,
        address,
        categoryId,
        description,
        logo: logo.trim() || undefined,
        shippingMethods,
        shippingRate,
        acceptedTerms: storeTerms,
        legalVersion: LEGAL_VERSION,
        legalAudience: 'STORE',
        legalReadToEnd: storeTerms
      });
      if (!res.success) {
        setStoreError(res.message || 'Error al registrar tienda');
      }
    } catch (err: any) {
      setStoreError(err.message || 'Error al registrar tienda');
    } finally {
      setStoreLoading(false);
    }
  };

  // Complete Store Registration with Biometric KYC & OTP code
  const handleCompleteStoreKyc = async (kycData: BiometricKycData) => {
    setStoreError('');
    setStoreLoading(true);
    try {
      const shippingMethods: string[] = [];
      if (deliveryHome) shippingMethods.push('home_delivery');
      if (deliveryPickup) shippingMethods.push('store_pickup');

      const res = await registerStoreAccount({
        storeName,
        ownerName,
        email: storeEmail,
        phone: storePhone,
        password: storePass,
        confirmPassword: storePassConfirm,
        province,
        municipality,
        address,
        categoryId,
        description,
        logo: logo.trim() || undefined,
        shippingMethods,
        shippingRate,
        acceptedTerms: storeTerms,
        legalVersion: LEGAL_VERSION,
        legalAudience: 'STORE',
        legalReadToEnd: storeTerms,
        cedulaNumber: kycData.cedulaNumber,
        cedulaFrontUrl: kycData.cedulaFrontUrl,
        selfieUrl: kycData.selfieUrl,
        biometricScore: kycData.biometricScore,
        verificationCode: kycData.verificationCode
      });
      if (!res.success) {
        setStoreError(res.message || 'Error al registrar tienda');
        setIsStoreKycOpen(false);
      }
    } catch (err: any) {
      setStoreError(err.message || 'Ocurrió un error');
      setIsStoreKycOpen(false);
    } finally {
      setStoreLoading(false);
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-stone-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-sm shadow-xs">
              P
            </div>
            <div>
              <span className="font-black text-stone-900 text-base tracking-tight">Plaza<span className="text-red-600">DO</span></span>
              <p className="text-[11px] text-stone-500 font-medium">Autenticación y Registro Seguro</p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">

          {/* Banner de requisito de autenticación para compras */}
          {authPurchaseNotice && (
            <div id="auth-purchase-notice-banner" className="p-4 bg-amber-50/90 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                  <ShoppingCart className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm">
                    {authPurchaseNotice}
                  </h4>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Al identificarte volverás de inmediato a tu producto o carrito para continuar tu compra sin perder datos.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    authModalMode === 'login'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('register_customer')}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    authModalMode === 'register_customer'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  Crear cuenta
                </button>
              </div>
            </div>
          )}

          {/* 1. SELECTION SCREEN: ¿CÓMO DESEAS REGISTRARTE? */}
          {authModalMode === 'register_select' && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight">
                  ¿CÓMO DESEAS REGISTRARTE?
                </h2>
                <p className="text-stone-600 text-xs max-w-md mx-auto">
                  Selecciona el tipo de cuenta que necesitas en PlazaDO. Cada perfil cuenta con su propia interfaz, permisos y funcionalidades independientes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* Opción 1: Soy Cliente */}
                <button
                  type="button"
                  onClick={() => openAuthModal('register_customer')}
                  className="group flex flex-col items-start p-5 rounded-2xl border-2 border-stone-200 hover:border-red-600 bg-white hover:bg-red-50/30 transition-all text-left space-y-3 relative hover:shadow-md"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-100 group-hover:bg-red-600 text-red-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-sm group-hover:text-red-600 flex items-center gap-1.5">
                      Soy Cliente
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                      Compra productos de diferentes tiendas en PlazaDO. Disfruta de carrito unificado, envíos combinados y pagos seguros.
                    </p>
                  </div>
                  <div className="pt-2 text-[10px] font-bold text-red-600 flex items-center gap-1">
                    Crear cuenta de comprador &rarr;
                  </div>
                </button>

                {/* Opción 2: Registrar mi Tienda */}
                <button
                  type="button"
                  onClick={() => openAuthModal('register_store')}
                  className="group flex flex-col items-start p-5 rounded-2xl border-2 border-stone-200 hover:border-stone-900 bg-white hover:bg-stone-50 transition-all text-left space-y-3 relative hover:shadow-md"
                >
                  <div className="w-12 h-12 rounded-xl bg-stone-900 text-white flex items-center justify-center">
                    <StoreIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-1.5">
                      Registrar mi Tienda
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                      Publica tus productos, gestiona pedidos, controla tu inventario y vende a nivel nacional con tu propio Panel de Tienda.
                    </p>
                  </div>
                  <div className="pt-2 text-[10px] font-bold text-stone-900 flex items-center gap-1">
                    Crear cuenta de vendedor &rarr;
                  </div>
                </button>

              </div>

              {/* Already have an account */}
              <div className="text-center pt-4 border-t border-stone-100">
                <p className="text-stone-600 text-xs">
                  ¿Ya tienes una cuenta registrada?{' '}
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="font-bold text-red-600 hover:underline"
                  >
                    Iniciar Sesión
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* 2. UNIFIED LOGIN FORM: INICIO DE SESIÓN CON DETECCIÓN AUTOMÁTICA DE ROL */}
          {authModalMode === 'login' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h2 className="text-lg sm:text-xl font-extrabold text-stone-900">
                  Iniciar Sesión
                </h2>
                <p className="text-stone-600 text-xs">
                  Ingresa tus credenciales. El sistema detecta tu rol automáticamente y te dirige a tu espacio correspondiente.
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="tu.correo@ejemplo.com"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Cifrado seguro de credenciales
                  </span>
                  <span className="text-stone-400">Acceso protegido</span>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 text-xs flex items-center justify-center gap-2"
                >
                  {loginLoading ? 'Validando...' : 'Iniciar Sesión'}
                </button>
              </form>

              {/* Link to Registration Selection */}
              <div className="text-center pt-2">
                <p className="text-stone-600 text-xs">
                  ¿No tienes una cuenta aún?{' '}
                  <button
                    type="button"
                    onClick={() => openAuthModal('register_select')}
                    className="font-bold text-red-600 hover:underline"
                  >
                    Crear cuenta
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* VERIFICACIÓN OFICIAL DE CORREO ELECTRÓNICO CON contacto@plazado.com */}
          {authModalMode === 'verify_email' && (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-red-200">
                  <MailCheck className="w-7 h-7" />
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-stone-900">
                  Introduce tu Código de Verificación
                </h2>
                <p className="text-stone-600 text-xs max-w-sm mx-auto leading-relaxed">
                  Hemos enviado automáticamente un código de 6 dígitos a:
                </p>
                <div className="inline-block bg-stone-100 px-3.5 py-1 rounded-full text-xs font-mono font-bold text-stone-900 border border-stone-300">
                  {pendingVerificationEmail || custEmail || storeEmail || 'tu correo'}
                </div>
                <p className="text-[11px] text-stone-500 font-medium">
                  Remitente oficial: <strong className="text-red-600">contacto@plazado.com</strong>
                </p>
              </div>

              {verifyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{verifyError}</span>
                </div>
              )}

              {verifySuccessNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{verifySuccessNotice}</span>
                </div>
              )}

              <form onSubmit={handleVerificationSubmit} className="space-y-4">
                {/* 6 Digit Inputs */}
                <div className="flex justify-center gap-2 sm:gap-3 my-2" onPaste={handleOtpPaste}>
                  {verifyDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => { otpInputsRef.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      className={`w-11 h-13 text-center text-xl font-mono font-black rounded-xl border-2 transition-all outline-none ${
                        digit 
                          ? 'border-red-600 bg-red-50/40 text-stone-950 ring-2 ring-red-100' 
                          : 'border-stone-300 bg-stone-50 text-stone-900 focus:border-red-500 focus:bg-white'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={verifyLoading || verifyDigits.join('').length < 6}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors text-xs disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {verifyLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{verifyLoading ? 'Validando con el servidor...' : 'VERIFICAR CÓDIGO'}</span>
                </button>
              </form>

              {/* Mensaje oficial cuando no llegue el correo */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3 text-xs text-stone-700">
                <div className="font-bold text-stone-900 flex items-center gap-1.5 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>¿No recibiste tu código de verificación?</span>
                </div>
                <p className="text-[11px] leading-relaxed text-stone-600">
                  Revisa primero tu carpeta de correo no deseado o Spam.
                </p>
                <p className="text-[11px] leading-relaxed text-stone-600">
                  Puedes solicitar el reenvío del código. Si aun así no lo recibes, comunícate con nuestro equipo de soporte a través de:
                </p>
                <div className="bg-white p-2.5 rounded-xl border border-stone-200 flex items-center justify-between gap-2">
                  <span className="font-bold text-stone-900 text-xs">contacto@plazado.com</span>
                  <a 
                    href="mailto:contacto@plazado.com?subject=Soporte%20C%C3%B3digo%20de%20Verificaci%C3%B3n" 
                    className="text-[10px] font-bold text-red-600 hover:underline px-2.5 py-1 rounded bg-red-50 border border-red-200"
                  >
                    Escribir a soporte
                  </a>
                </div>
                <p className="text-[11px] text-stone-500 italic">
                  Nuestro equipo podrá ayudarte a completar la verificación de tu cuenta.
                </p>

                {/* Botón: REENVIAR CÓDIGO con tiempo de espera */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 justify-between">
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isResending}
                    onClick={handleResendCode}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                      resendCooldown > 0 || isResending
                        ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                        : 'bg-white hover:bg-stone-100 text-stone-900 border-stone-300 hover:border-stone-400 shadow-2xs cursor-pointer'
                    }`}
                  >
                    {isResending ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-stone-600" />
                    ) : (
                      <Mail className="w-3.5 h-3.5 text-red-600" />
                    )}
                    <span>
                      {resendCooldown > 0 ? `REENVIAR CÓDIGO (${resendCooldown}s)` : 'REENVIAR CÓDIGO'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openAuthModal('register_select')}
                    className="text-[11px] text-stone-500 hover:text-stone-800 underline font-medium"
                  >
                    Cambiar correo o volver
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. REGISTRO ESPECÍFICO DE CLIENTE */}
          {authModalMode === 'register_customer' && (
            isCustomerKycOpen ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsCustomerKycOpen(false)}
                    className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-900 font-semibold text-[11px]"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Modificar datos de cliente
                  </button>
                  <span className="bg-red-100 text-red-700 font-bold px-2.5 py-0.5 rounded-md text-[10px] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verificación Biométrica KYC
                  </span>
                </div>

                <BiometricKycVerification
                  userType="CUSTOMER"
                  userName={`${custName} ${custLastName}`}
                  userEmail={custEmail}
                  onVerificationComplete={handleCompleteCustomerKyc}
                  onCancel={() => setIsCustomerKycOpen(false)}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => openAuthModal('register_select')}
                    className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-900 font-semibold text-[11px]"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver a opciones
                  </button>
                  <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                    Rol: Cliente (role = "customer")
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-extrabold text-stone-900">
                    Registro de Cliente
                  </h2>
                  <p className="text-stone-600 text-xs">
                    Crea tu cuenta de comprador para realizar pedidos en tiendas de toda la República Dominicana.
                  </p>
                </div>

                {/* Banner de requisito biométrico de seguridad */}
                <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl flex items-start gap-2.5 text-stone-700">
                  <ShieldCheck className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-stone-900 text-xs block">
                      Seguridad y Verificación Biométrica Obligatoria
                    </span>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Para proteger a los compradores y comercios, en el siguiente paso subirás la foto de tu cédula y una selfie para validación biométrica facial, y recibirás un código de confirmación por correo.
                    </p>
                  </div>
                </div>

                {custError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                    {custError}
                  </div>
                )}

                <form ref={customerFormRef} onSubmit={handleCustomerSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Nombre *</label>
                      <input
                        type="text"
                        required
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        placeholder="Ej. Ana"
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Apellido *</label>
                      <input
                        type="text"
                        required
                        value={custLastName}
                        onChange={(e) => setCustLastName(e.target.value)}
                        placeholder="Ej. Mercedes"
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      placeholder="ana.mercedes@gmail.com"
                      className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Teléfono Móvil (WhatsApp) *</label>
                    <input
                      type="tel"
                      required
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      placeholder="809-555-1234"
                      className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Contraseña *</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={custPass}
                        onChange={(e) => setCustPass(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Confirmar Contraseña *</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={custPassConfirm}
                        onChange={(e) => setCustPassConfirm(e.target.value)}
                        placeholder="Repetir contraseña"
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="pt-1 space-y-2">
                    <button type="button" onClick={() => openRegistrationTerms('CUSTOMER')} className="text-xs font-bold text-red-700 underline">
                      { custTerms ? 'Volver a leer términos y políticas' : 'Leer y aceptar términos para clientes' }
                    </button>
                    <p className="text-[11px] text-stone-600" role="status">
                      { custTerms ? 'Términos y políticas aceptados. Puedes solicitar el código.' : 'Debes llegar al final y aceptar antes de recibir el código.' }
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={custLoading}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors text-xs disabled:opacity-50 mt-2 flex items-center justify-center gap-2 shadow-xs"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Continuar y recibir código de verificación</span>
                  </button>
                </form>

                <div className="text-center pt-2">
                  <p className="text-stone-600 text-xs">
                    ¿Ya tienes una cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => openAuthModal('login')}
                      className="font-bold text-red-600 hover:underline"
                    >
                      Iniciar Sesión
                    </button>
                  </p>
                </div>
              </div>
            )
          )}

          {/* 4. REGISTRO ESPECÍFICO DE TIENDA */}
          {authModalMode === 'register_store' && (
            isStoreKycOpen ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsStoreKycOpen(false)}
                    className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-900 font-semibold text-[11px]"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Modificar datos de tienda
                  </button>
                  <span className="bg-stone-900 text-white font-bold px-2.5 py-0.5 rounded-md text-[10px] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verificación Biométrica del Titular
                  </span>
                </div>

                <BiometricKycVerification
                  userType="STORE"
                  userName={ownerName}
                  userEmail={storeEmail}
                  onVerificationComplete={handleCompleteStoreKyc}
                  onCancel={() => setIsStoreKycOpen(false)}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => openAuthModal('register_select')}
                    className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-900 font-semibold text-[11px]"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Volver a opciones
                  </button>
                  <span className="bg-stone-900 text-white font-bold px-2 py-0.5 rounded-md text-[10px]">
                    Rol: Tienda (role = "store")
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-extrabold text-stone-900">
                    Registrar mi Tienda en PlazaDO
                  </h2>
                  <p className="text-stone-600 text-xs">
                    Abre tu vitrina digital y vende en todo el país. Al registrarte entrarás directamente a tu Panel de Vendedor.
                  </p>
                </div>

                {/* Banner de requisito de seguridad KYC para tiendas */}
                <div className="p-3 bg-stone-100 border border-stone-300 rounded-xl flex items-start gap-2.5 text-stone-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-stone-900 text-xs block">
                      Verificación Oficial de Vendedor (KYC & Biometría)
                    </span>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Para garantizar un comercio transparente y confiable en PlazaDO, en el siguiente paso subirás la foto de cédula y selfie del titular para validación biométrica facial, y confirmarás tu correo con un código de seguridad.
                    </p>
                  </div>
                </div>

                {storeError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                    {storeError}
                  </div>
                )}

                <form ref={storeFormRef} onSubmit={handleStoreSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Nombre Comercial de la Tienda *</label>
                      <input
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Ej. Boutique Colonial RD"
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Nombre del Responsable *</label>
                      <input
                        type="text"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="Ej. Manuel Peña"
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-stone-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Correo Comercial (Acceso) *</label>
                      <input
                        type="email"
                        required
                        value={storeEmail}
                        onChange={(e) => setStoreEmail(e.target.value)}
                        placeholder="ventas@mitienda.com"
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Teléfono Móvil (WhatsApp) *</label>
                      <input
                        type="tel"
                        required
                        value={storePhone}
                        onChange={(e) => setStorePhone(e.target.value)}
                        placeholder="809-555-5678"
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-stone-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Contraseña *</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={storePass}
                        onChange={(e) => setStorePass(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Confirmar Contraseña *</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={storePassConfirm}
                        onChange={(e) => setStorePassConfirm(e.target.value)}
                        placeholder="Repetir contraseña"
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-stone-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Categoría del Negocio *</label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Provincia *</label>
                      <select
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none"
                      >
                        {DOMINICAN_PROVINCES.map(prov => (
                          <option key={prov} value={prov}>{prov}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Municipio / Sector *</label>
                      <input
                        type="text"
                        required
                        value={municipality}
                        onChange={(e) => setMunicipality(e.target.value)}
                        placeholder="Ej. Piantini, DN"
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Dirección Física *</label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Calle, número o plaza"
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Descripción de la Tienda *</label>
                    <textarea
                      required
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe qué productos vendes, tu especialidad y propuesta de valor..."
                      className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-stone-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Logo URL (Opcional)</label>
                      <input
                        type="url"
                        value={logo}
                        onChange={(e) => setLogo(e.target.value)}
                        placeholder="https://.../logo.png"
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Costo Fijo de Envío (RD$)</label>
                      <input
                        type="number"
                        min={0}
                        value={shippingRate}
                        onChange={(e) => setShippingRate(Number(e.target.value))}
                        className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Métodos de Entrega Disponibles</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={deliveryHome}
                          onChange={(e) => setDeliveryHome(e.target.checked)}
                          className="rounded text-stone-900 focus:ring-stone-900"
                        />
                        <span className="text-[11px] text-stone-700">Envío a Domicilio</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={deliveryPickup}
                          onChange={(e) => setDeliveryPickup(e.target.checked)}
                          className="rounded text-stone-900 focus:ring-stone-900"
                        />
                        <span className="text-[11px] text-stone-700">Retiro en Tienda / Local</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-1 space-y-2">
                    <button type="button" onClick={() => openRegistrationTerms('STORE')} className="text-xs font-bold text-red-700 underline">
                      { storeTerms ? 'Volver a leer términos y políticas' : 'Leer y aceptar términos para tiendas' }
                    </button>
                    <p className="text-[11px] text-stone-600" role="status">
                      { storeTerms ? 'Términos y políticas aceptados. Puedes solicitar el código.' : 'Debes llegar al final y aceptar antes de recibir el código.' }
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={storeLoading}
                    className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl transition-colors text-xs disabled:opacity-50 mt-2 flex items-center justify-center gap-2 shadow-xs"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Continuar y recibir código de verificación</span>
                  </button>
                </form>

                <div className="text-center pt-2">
                  <p className="text-stone-600 text-xs">
                    ¿Ya tienes una cuenta de tienda?{' '}
                    <button
                      type="button"
                      onClick={() => openAuthModal('login')}
                      className="font-bold text-stone-900 hover:underline"
                    >
                      Iniciar Sesión
                    </button>
                  </p>
                </div>
              </div>
            )
          )}

        </div>
      </div>
    {legalAudience && (
        <RegistrationTermsModal
          key={legalAudience}
          audience={legalAudience}
          onClose={() => { setLegalAudience(null); setContinueAfterAcceptance(false); }}
          onAccept={() => {
            if (legalAudience === 'STORE') setStoreTerms(true);
            else setCustTerms(true);
            setLegalAudience(null);
          }}
        />
      )}
    </div>
  );
};
