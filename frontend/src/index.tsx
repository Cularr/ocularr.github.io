import React from 'react';
import { createRoot } from 'react-dom/client';
import App from 'App/App';

import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import 'Styles/Themes/themes.css';
import 'Styles/Variables/variables.css';
import 'Styles/scaffolding.css';

const container = document.getElementById('root');

if (container) {
  createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
