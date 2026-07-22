import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';

// Router basename derives from Vite's base (passed as --base by the pipeline, e.g.
// "/e2e-lane-fastapi-react/"). Strip the trailing slash so deep links resolve under
// the ingress prefix. Falls back to "/" for local dev.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
