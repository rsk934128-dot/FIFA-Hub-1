import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirebaseProvider } from './components/FirebaseProvider';
import { WorkspaceProvider } from './components/WorkspaceProvider';
import { ApprovalGuard } from './components/ApprovalGuard';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <WorkspaceProvider>
        <ApprovalGuard>
          <App />
        </ApprovalGuard>
      </WorkspaceProvider>
    </FirebaseProvider>
  </StrictMode>,
);
