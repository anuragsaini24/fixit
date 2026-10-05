import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles.css';
import './assets/app.css';
import { AuthProvider } from './context/AuthContext';
import { initializeMockData } from './services/mockApi';
import App from './App';

initializeMockData();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
