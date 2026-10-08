import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download } from 'lucide-react';
import { LEGAL_VERSION, LEGAL_PDF_URL, LegalAudience, registrationDocuments } from '../../legal/registration';

interface Props { audience: LegalAudience; onClose: () => void; onAccept: () => void; }

export const RegistrationTermsModal: React.FC<Props> = ({ audience, onClose, onAccept }) => {
  const [reachedEnd, setReachedEnd] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const checkEnd = () => {
    const el = contentRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 4) setReachedEnd(true);
  };
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    checkEnd();
    const observer = new ResizeObserver(checkEnd);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => { observer.disconnect(); previousFocus?.focus(); };
  }, []);
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
    if (event.key !== 'Tab') return;
    const elements = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]');
    if (!elements?.length) return;
    const first = elements[0], last = elements[elements.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  };
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/65 p-3 sm:p-6">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="registration-terms-title" tabIndex={-1} onKeyDown={onKeyDown}
        className="flex w-full max-w-3xl max-h-[90dvh] flex-col overflow-hidden rounded-2xl bg-white text-stone-900 shadow-2xl outline-none">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b p-4 sm:p-6">
          <div>
            <h2 id="registration-terms-title" className="text-lg font-bold">Términos para {audience === 'STORE' ? 'tiendas y vendedores' : 'clientes'}</h2>
            <p className="mt-1 text-xs text-stone-600">Plazado.com · Versión {LEGAL_VERSION}</p>
            <a href={LEGAL_PDF_URL} download className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-red-700"><Download size={16} /> Descargar políticas y términos en PDF</a>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar términos" className="rounded-lg p-2 hover:bg-stone-100"><X size={20} /></button>
        </header>
        <div ref={contentRef} onScroll={checkEnd} tabIndex={0} aria-label="Contenido de los términos y políticas" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-8 text-sm leading-relaxed">
          {registrationDocuments(audience).map(doc => (
            <article key={doc.id}>
              <h3 className="mb-4 text-lg font-bold text-red-700">{doc.title}</h3>
              {doc.sections.map(section => (
                <section key={section.title} className="mb-5">
                  <h4 className="mb-2 font-bold">{section.title}</h4>
                  {section.paragraphs.map((paragraph, i) => <p key={i} className="mb-2">{paragraph}</p>)}
                </section>
              ))}
            </article>
          ))}
          <p className="border-t pt-4 font-semibold" data-testid="terms-end">Fin de los términos y políticas aplicables a tu registro.</p>
        </div>
        <footer className="shrink-0 border-t bg-stone-50 p-4 sm:p-6 space-y-3">
          <p role="status" className="text-xs text-stone-600">{reachedEnd ? 'Ya llegaste al final. Puedes aceptar para continuar.' : 'Desplázate hasta el final para habilitar la aceptación.'}</p>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" disabled={!reachedEnd} checked={accepted} onChange={event => setAccepted(event.target.checked)} className="mt-1" />
            <span>Acepto los términos de mi tipo de cuenta y las políticas de privacidad, devoluciones y entregas. Confirmo que tengo al menos 18 años y capacidad para contratar.</span>
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm">Cancelar</button>
            <button type="button" disabled={!reachedEnd || !accepted} onClick={onAccept} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Aceptar y continuar</button>
          </div>
        </footer>
      </div>
    </div>, document.body
  );
};
