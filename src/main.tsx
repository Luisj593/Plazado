import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initCodeInspectionProtection } from './utils/securityProtection';

// Activar bloqueo de inspección de código y menú contextual
initCodeInspectionProtection();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
