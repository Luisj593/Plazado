import React from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, LogOut, LayoutDashboard, Clock } from 'lucide-react';

export const RoleBar: React.FC = () => {
  const { currentUser, currentView, setCurrentView, logout, stores, setAdminActiveTab } = useApp();

  // Esta barra es de uso exclusivo del Super Administrador
  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
    return null;
  }

  const pendingStoresCount = stores.filter(s => s.status === 'PENDING' || s.status === 'IN_REVIEW').length;

  return (
    <div className="bg-stone-950 text-stone-200 text-xs py-1.5 px-4 border-b border-stone-800 shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Identificador exclusivo del Super Administrador */}
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-stone-400 font-medium">Acceso Administrativo Global:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/90 text-rose-300 font-bold border border-rose-800/80 text-[11px]">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>Super Admin: {currentUser.name}</span>
            <span className="text-stone-400 font-normal hidden sm:inline">({currentUser.email})</span>
          </span>
        </div>

        {/* Accesos rápidos exclusivos del Super Admin */}
        <div className="flex items-center gap-2">
          {pendingStoresCount > 0 && (
            <button
              id="role-btn-pending-requests"
              onClick={() => {
                setAdminActiveTab('solicitudes');
                setCurrentView('admin_dashboard');
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors animate-pulse"
              title="Solicitudes de tiendas pendientes de revisión y aprobación"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{pendingStoresCount} Solicitud{pendingStoresCount > 1 ? 'es' : ''} de Tienda por Aprobar</span>
            </button>
          )}

          <button
            id="role-btn-super-admin"
            onClick={() => setCurrentView('admin_dashboard')}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold ${
              currentView === 'admin_dashboard' 
                ? 'bg-rose-600 text-white shadow-sm' 
                : 'bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700'
            }`}
            title="Panel de Control General PlazaDO"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-rose-400" />
            <span>Panel Super Admin</span>
          </button>

          <button
            onClick={logout}
            className="px-2.5 py-1 bg-stone-900 hover:bg-rose-950/60 text-stone-400 hover:text-rose-300 rounded-lg text-xs font-medium border border-stone-800 flex items-center gap-1 transition-colors"
            title="Cerrar sesión de administrador"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
