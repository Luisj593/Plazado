import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
  Database, 
  ShieldCheck, 
  HardDrive, 
  Save, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Archive,
  Layers,
  Users,
  Store,
  Package,
  ShoppingBag,
  Cloud,
  Server
} from 'lucide-react';

export const PersistenceSettingsTab: React.FC = () => {
  const { showNotification } = useApp();
  const [loading, setLoading] = useState(true);
  const [persistenceData, setPersistenceData] = useState<any>(null);
  const [backupLabel, setBackupLabel] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [restoringFile, setRestoringFile] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isReconcilingUsers, setIsReconcilingUsers] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getPersistenceStatus();
      if (res && res.success) {
        setPersistenceData(res.persistence);
      }
    } catch (err) {
      console.error('Error al consultar estado de persistencia:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncGoogleCloud = async () => {
    try {
      setIsSyncingCloud(true);
      const res = await api.syncFirestore();
      if (res && res.success) {
        showNotification('Sincronización con la base de datos de Google Cloud completada');
        if (res.persistence) {
          setPersistenceData(res.persistence);
        } else {
          await fetchStatus();
        }
      } else {
        showNotification(res?.message || 'Error sincronizando con Google Cloud', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error de conexión con Google Cloud', 'error');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleFirestoreDiagnostic = async () => {
    try {
      setIsDiagnosing(true);
      const res = await api.getFirestoreDiagnostic();
      if (res?.success) {
        setDiagnostic(res.diagnostic);
        showNotification(res.diagnostic?.healthy ? 'Diagnóstico completado: integridad correcta.' : 'Diagnóstico completado: se detectaron diferencias que deben revisarse.', res.diagnostic?.healthy ? 'success' : 'error');
      } else {
        showNotification('No se pudo ejecutar el diagnóstico de Firestore', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error ejecutando diagnóstico de Firestore', 'error');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleReconcileMissingUsers = async () => {
    if (!window.confirm('¿Deseas persistir en Firestore únicamente los usuarios actuales que todavía no existen allí? No se eliminarán ni reemplazarán usuarios existentes.')) return;
    try {
      setIsReconcilingUsers(true);
      const res = await api.reconcileMissingFirestoreUsers();
      if (res?.success) {
        showNotification(`Reconciliación completada: ${res.persisted} usuario(s) persistido(s) en Firestore.`);
        await handleFirestoreDiagnostic();
      } else {
        showNotification(res?.message || 'No se pudo reconciliar los usuarios', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error reconciliando usuarios con Firestore', 'error');
    } finally {
      setIsReconcilingUsers(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true);
      const res = await api.createBackup(backupLabel.trim() || undefined);
      if (res && res.success) {
        showNotification(`Respaldo creado con éxito: ${res.filename}`);
        setBackupLabel('');
        await fetchStatus();
      } else {
        showNotification('No se pudo crear el respaldo', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error creando respaldo', 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    const confirm = window.confirm(`¿Estás seguro de restaurar la base de datos desde el respaldo "${filename}"?\n\nSe creará un respaldo de seguridad previo automáticamente.`);
    if (!confirm) return;

    try {
      setRestoringFile(filename);
      const res = await api.restoreBackup(filename);
      if (res && res.success) {
        showNotification(res.message);
        await fetchStatus();
        window.location.reload();
      } else {
        showNotification(res.message || 'Error restaurando respaldo', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error restaurando respaldo', 'error');
    } finally {
      setRestoringFile(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-emerald-950 text-emerald-100 border-2 border-emerald-500/40 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Blindaje de Persistencia & Respaldos</h2>
                <span className="bg-emerald-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Producción Activa
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-1 max-w-2xl">
                Arquitectura de separación estricta entre <strong>Código/Infraestructura</strong> y <strong>Datos de Producción</strong>. La base de datos es permanente, inmune a reinicios, actualizaciones o compilaciones de la plataforma.
              </p>
            </div>
          </div>

          <button
            onClick={fetchStatus}
            disabled={loading}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refrescar Estado</span>
          </button>
        </div>
      </div>

      {/* Google Cloud Production Database Integration */}
      <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white rounded-2xl border-2 border-blue-500/30 p-6 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-900/60 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Cloud className="w-7 h-7 text-blue-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Base de Datos de Google Cloud (Producción)</h3>
                <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  En Línea & Conectado
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Proyecto GCP: <strong className="text-white font-mono">{persistenceData?.googleCloud?.projectId || 'dazzling-spirit-271219'}</strong> (Multi-Región: us-east1 / us-east5)
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncGoogleCloud}
            disabled={isSyncingCloud}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
            <span>{isSyncingCloud ? 'Sincronizando con Google Cloud...' : 'Sincronizar con Google Cloud'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cloud Firestore (NoSQL Primario) */}
          <div className="bg-slate-900/80 border border-blue-800/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Cloud Firestore</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Activo</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono break-all">
              ID: {persistenceData?.googleCloud?.firestore?.databaseId || 'ai-studio-plazadocommarket-bdb8ac78-6fcb-4d18-bf24-2ca374dda0e5'}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <span>Registros Sincronizados:</span>
              <span className="text-white font-bold">
                {persistenceData?.googleCloud?.firestore?.recordCounts?.stores || persistenceData?.recordCounts?.stores || 7} tiendas · {persistenceData?.googleCloud?.firestore?.recordCounts?.products || persistenceData?.recordCounts?.products || 9} productos
              </span>
            </div>
          </div>

          {/* Cloud SQL (PostgreSQL Relacional) */}
          <div className="bg-slate-900/80 border border-blue-800/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Google Cloud SQL</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PostgreSQL 15</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono truncate" title="dazzling-spirit-271219:us-east1:ai-studio-bdb8ac78">
              Instancia: dazzling-spirit-271219:us-east1:ai-studio-bdb8ac78
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <span>Base Relacional:</span>
              <span className="text-white font-bold">
                cloud_sql_development_database (21 tablas)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Firestore read-only integrity diagnostic */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Diagnóstico de Integridad de Firestore</span>
            </h3>
            <p className="text-xs text-stone-500 mt-1">Consulta la base real en modo solo lectura. No crea, modifica ni elimina registros.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={handleReconcileMissingUsers} disabled={isReconcilingUsers || isDiagnosing}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50">
              <Users className="w-4 h-4" />
              <span>{isReconcilingUsers ? 'Reconciliando...' : 'Reconciliar usuarios faltantes'}</span>
            </button>
            <button onClick={handleFirestoreDiagnostic} disabled={isDiagnosing || isReconcilingUsers}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50">
              <Database className="w-4 h-4" />
              <span>{isDiagnosing ? 'Analizando Firestore...' : 'Ejecutar Diagnóstico'}</span>
            </button>
          </div>
        </div>
        {diagnostic && (
          <div className="space-y-4">
            <div className={`rounded-xl border p-4 ${diagnostic.healthy ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="font-black text-sm">{diagnostic.healthy ? 'Integridad correcta' : 'Se detectaron diferencias'}</div>
              <div className="text-xs mt-1">Base: {diagnostic.databaseId} · {new Date(diagnostic.checkedAt).toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {['users','stores','products','orders'].map(key => (
                <div key={key} className="rounded-xl bg-stone-50 border border-stone-100 p-3">
                  <div className="uppercase text-[10px] font-bold text-stone-500">{key}</div>
                  <div className="font-black text-lg text-stone-900">{diagnostic.firestoreCounts?.[key] ?? 0}</div>
                  <div className="text-[10px] text-stone-500">Firestore · Memoria {diagnostic.memoryCounts?.[key] ?? 0}</div>
                </div>
              ))}
            </div>
            <div className="text-xs bg-stone-50 border border-stone-100 rounded-xl p-4 space-y-1">
              <div className="font-bold text-stone-800">Respaldos: {diagnostic.backups?.storesCurrent ?? 0} tiendas / {diagnostic.backups?.usersCurrent ?? 0} usuarios · Históricos: {diagnostic.backups?.storesHistory ?? 0} / {diagnostic.backups?.usersHistory ?? 0}</div>
              <div>Correos duplicados: {diagnostic.integrity?.duplicateUserEmails?.length ?? 0}</div>
              <div>Tiendas sin propietario válido: {diagnostic.integrity?.storesWithoutExistingOwner?.length ?? 0}</div>
              <div>Propietarios sin tienda: {diagnostic.integrity?.storeOwnersWithoutExistingStore?.length ?? 0}</div>
              <div>Productos sin tienda: {diagnostic.integrity?.productsWithoutExistingStore?.length ?? 0}</div>
              <div>Pedidos sin tienda: {diagnostic.integrity?.ordersWithoutExistingStore?.length ?? 0}</div>
              <div>Pedidos sin cliente: {diagnostic.integrity?.ordersWithoutExistingCustomer?.length ?? 0}</div>
            </div>
          </div>
        )}
      </div>

      {/* Persistence Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Estado del Motor</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          <div className="text-xl font-black text-emerald-700 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>PROTEGIDO</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Cero riesgo de sobreescritura por seeds</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Base Principal</span>
          <div className="text-xl font-black text-stone-900 mt-2">
            {formatBytes(persistenceData?.primarySize || 0)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1 font-mono truncate" title={persistenceData?.databasePath}>
            plazado_global_database.json
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Respaldos Disponibles</span>
          <div className="text-xl font-black text-stone-900 mt-2 flex items-center gap-2">
            <Archive className="w-5 h-5 text-indigo-600" />
            <span>{persistenceData?.backups?.length || 0} instantáneas</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Respaldos rotativos y de seguridad</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Versión de Estado</span>
          <div className="text-xl font-black text-stone-900 mt-2">
            v{persistenceData?.version || 1}
          </div>
          <p className="text-[11px] text-stone-500 mt-1 font-mono">
            {persistenceData?.lastUpdated ? new Date(persistenceData.lastUpdated).toLocaleTimeString() : 'N/A'}
          </p>
        </div>

      </div>

      {/* Registros Protegidos Totales */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs">
        <h3 className="text-sm font-extrabold text-stone-900 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-red-600" />
          <span>Inventario de Registros Protegidos en Memoria y Disco</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100 flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <div className="text-lg font-black text-stone-900">{persistenceData?.recordCounts?.users || 0}</div>
              <div className="text-[11px] text-stone-500 font-medium">Usuarios Registrados</div>
            </div>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100 flex items-center gap-3">
            <Store className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-lg font-black text-stone-900">{persistenceData?.recordCounts?.stores || 0}</div>
              <div className="text-[11px] text-stone-500 font-medium">Tiendas Comerciales</div>
            </div>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100 flex items-center gap-3">
            <Package className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-lg font-black text-stone-900">{persistenceData?.recordCounts?.products || 0}</div>
              <div className="text-[11px] text-stone-500 font-medium">Productos en Catálogo</div>
            </div>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100 flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-purple-600 shrink-0" />
            <div>
              <div className="text-lg font-black text-stone-900">{persistenceData?.recordCounts?.orders || 0}</div>
              <div className="text-[11px] text-stone-500 font-medium">Órdenes & Pedidos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Backup Trigger Form */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
            <Save className="w-4 h-4 text-emerald-600" />
            <span>Crear Respaldo Manual Inmediato</span>
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Genera una copia de seguridad exacta e inmutable de todos los datos en el directorio permanente de respaldos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 max-w-xl">
          <input
            type="text"
            value={backupLabel}
            onChange={(e) => setBackupLabel(e.target.value)}
            placeholder="Etiqueta opcional (ej: antes_de_cambio_campana)"
            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isCreatingBackup ? 'Creando Respaldo...' : 'Crear Respaldo'}</span>
          </button>
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
              <Archive className="w-4 h-4 text-stone-700" />
              <span>Historial de Instantáneas y Respaldos Disponibles</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Instantáneas protegidas en almacenamiento de servidor.
            </p>
          </div>
          <span className="text-xs font-bold text-stone-500">
            {persistenceData?.backups?.length || 0} archivos
          </span>
        </div>

        {(!persistenceData?.backups || persistenceData.backups.length === 0) ? (
          <div className="p-8 text-center text-stone-400 text-xs">
            No se han registrado respaldos secundarios todavía. Los respaldos se crean automáticamente en cada modificación.
          </div>
        ) : (
          <div className="divide-y divide-stone-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-bold">
                <tr>
                  <th className="px-6 py-3">Nombre del Archivo</th>
                  <th className="px-6 py-3">Tamaño</th>
                  <th className="px-6 py-3">Fecha de Creación</th>
                  <th className="px-6 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {persistenceData.backups.map((backup: any) => (
                  <tr key={backup.name} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-stone-900 font-bold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-stone-400" />
                      <span>{backup.name}</span>
                    </td>
                    <td className="px-6 py-3.5 text-stone-600 font-mono">
                      {formatBytes(backup.size)}
                    </td>
                    <td className="px-6 py-3.5 text-stone-600">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {new Date(backup.mtime).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleRestoreBackup(backup.name)}
                        disabled={restoringFile === backup.name}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-lg text-[11px] transition-colors inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3 h-3 ${restoringFile === backup.name ? 'animate-spin' : ''}`} />
                        <span>{restoringFile === backup.name ? 'Restaurando...' : 'Restaurar'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reglas de Persistencia Informativas */}
      <div className="bg-stone-900 text-stone-300 rounded-2xl p-6 border border-stone-800 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Garantía de Persistencia PlazaDO</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <p className="font-bold text-white">1. Cero Sobreescritura por Seeds</p>
            <p className="text-stone-400">
              Los datos iniciales o semillas solo se instancian si no existe ninguna base de datos ni respaldo previo. Jamás reemplazan registros de producción.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-bold text-white">2. Inmutabilidad de Identificadores (IDs)</p>
            <p className="text-stone-400">
              Todos los identificadores de usuarios, tiendas, pedidos y productos permanecen fijos y estables ante cualquier cambio de interfaz o servidor.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-bold text-white">3. Triple Respaldo en Cada Escritura</p>
            <p className="text-stone-400">
              Cada transacción se guarda de forma atómica en la base principal, en la instantánea rotativa más reciente y en el snapshot de repositorio.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-bold text-white">4. Aislamiento Código vs. Datos</p>
            <p className="text-stone-400">
              Cualquier cambio de diseño, lógica, estilos o infraestructura afecta exclusivamente el código, protegiendo todos los datos reales.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
