import React from 'react';
import ReactDOM from 'react-dom/client';
import Bookerbox from './App.jsx';
import PrivacyPolicy from './PrivacyPolicy.jsx';

const path = window.location.pathname.replace(/\/$/, '');
let Page = Bookerbox;
let lang = 'pt';
if (path === '/privacidade') { Page = PrivacyPolicy; lang = 'pt'; }
if (path === '/privacy') { Page = PrivacyPolicy; lang = 'en'; }

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Page lang={lang} />
  </React.StrictMode>
);
