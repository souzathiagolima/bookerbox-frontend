import React from 'react';
import ReactDOM from 'react-dom/client';
import Bookerbox from './App.jsx';
import PrivacyPolicy from './PrivacyPolicy.jsx';

const path = window.location.pathname.replace(/\/$/, '');
const Page = path === '/privacidade' ? PrivacyPolicy : Bookerbox;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
);
