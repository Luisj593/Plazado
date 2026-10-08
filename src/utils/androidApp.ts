import type { AndroidAppConfig } from '../types';

export const PACKAGED_ANDROID_APP: AndroidAppConfig = {
  isEnabled: true,
  appName: 'Plazado',
  versionName: '1.2',
  versionCode: 3,
  releaseDate: '2026-10-08',
  apkUrl: '/apps/Plazado-Android-v1.2.apk',
  apkFileName: 'Plazado-Android-v1.2.apk',
  apkFileSize: '16.5 KB',
  minAndroidVersion: 'Android 7.0 o superior',
  packageName: 'com.plazado.app',
  releaseNotes: 'Acceso a Plazado.com desde Android con botón integrado para iniciar sesión. Requiere conexión a internet.',
  downloadCount: 0
};

// Preserve custom administrator downloads. The bundled installer is used only
// when no APK URL has been configured; old placeholder metadata is not reused.
export function resolveAndroidApp(config?: AndroidAppConfig): AndroidAppConfig {
  return config?.apkUrl?.trim()
    ? { ...config, apkUrl: config.apkUrl.trim() }
    : { ...PACKAGED_ANDROID_APP, isEnabled: config?.isEnabled ?? true };
}
