import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Hide loading spinner once React is mounted
const hideLoadingSpinner = () => {
  const loadingElement = document.getElementById('app-loading');
  if (loadingElement) {
    loadingElement.style.opacity = '0';
    loadingElement.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => {
      loadingElement.remove();
    }, 300);
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);

// Hide spinner after a small delay to ensure the app has rendered
setTimeout(hideLoadingSpinner, 100);
