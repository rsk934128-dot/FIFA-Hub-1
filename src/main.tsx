import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirebaseProvider } from './components/FirebaseProvider';
import { WorkspaceProvider } from './components/WorkspaceProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <WorkspaceProvider>
        <App />
      </WorkspaceProvider>
    </FirebaseProvider>
  </StrictMode>,
);
