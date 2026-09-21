import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'maplibre-gl/dist/maplibre-gl.css';
import './index.css';
import { App } from './App';

// Scroll-reveal hides its content until an IntersectionObserver releases it.
// That has to be opt-in for scripted browsers only: without this flag the
// styles would leave every revealed section permanently invisible to readers
// with JavaScript disabled, and to crawlers that do not run it.
document.documentElement.classList.add('js');

// No <React.StrictMode> here: its deliberate double-invoke of mount effects
// breaks @photo-sphere-viewer/core — the first Viewer's destroy() cancels an
// in-flight panorama load mid-fetch, and the second Viewer then hangs on
// "Loading..." forever because the aborted load never resolves or rejects.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
