/**
 * PlazaDO.com - Módulo de Protección y Bloqueo de Inspección de Código
 * Previene el acceso a herramientas de inspección, menú contextual y atajos de desarrollo.
 */

export function initCodeInspectionProtection(): () => void {
  // 1. Bloquear Menú Contextual (Clic derecho)
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // 2. Bloquear Atajos de Teclado de Herramientas de Inspección y Código Fuente
  const handleKeyDown = (e: KeyboardEvent) => {
    // Tecla F12 (Herramientas de Desarrollador)
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const key = e.key ? e.key.toUpperCase() : '';

    // Ctrl+Shift+I / Cmd+Opt+I (Inspeccionar elemento)
    // Ctrl+Shift+J / Cmd+Opt+J (Consola de desarrollador)
    // Ctrl+Shift+C / Cmd+Opt+C (Selector de elemento del DOM)
    // Ctrl+Shift+K (Consola en navegadores Gecko/Firefox)
    if (isCtrlOrCmd && isShift && (key === 'I' || key === 'J' || key === 'C' || key === 'K' || [73, 74, 67, 75].includes(e.keyCode))) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+U / Cmd+U (Ver código fuente HTML / View Page Source)
    if (isCtrlOrCmd && (key === 'U' || e.keyCode === 85)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+S / Cmd+S (Guardar página como HTML / Save Page)
    if (isCtrlOrCmd && (key === 'S' || e.keyCode === 83)) {
      const activeElement = document.activeElement;
      const isInput = activeElement && ['INPUT', 'TEXTAREA'].includes(activeElement.tagName);
      if (!isInput) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  };

  // 3. Bloquear atajos en arrastre de enlaces/imágenes para inspección
  const handleDragStart = (e: DragEvent) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      e.preventDefault();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('dragstart', handleDragStart, { capture: true });
  }

  // Función de limpieza
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('dragstart', handleDragStart, { capture: true });
    }
  };
}
