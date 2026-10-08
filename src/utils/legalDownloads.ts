import { LEGAL_PDF_URL } from '../legal/registration';

// Called only after successful OTP verification. Download failures must not undo registration.
export async function downloadPlatformPolicies(): Promise<boolean> {
  try {
    const response = await fetch(LEGAL_PDF_URL);
    if (!response.ok) return false;
    const file = await response.blob();
    if ((await file.slice(0, 5).text()) !== '%PDF-') return false;
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Plazado-Politicas-Plataforma.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    return true;
  } catch {
    return false;
  }
}
