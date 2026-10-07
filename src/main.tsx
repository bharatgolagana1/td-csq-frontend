import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@/design/tokens.css';
import '@/design/base.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/app/providers';
import { createAppRouter } from '@/app/router';

const container = document.getElementById('root');
if (!container) throw new Error('#root missing in index.html');

const router = createAppRouter();

createRoot(container).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </AppProviders>
  </StrictMode>,
);
