// Script global pour initialiser l'iframe N8N une seule fois
// S'exécute en dehors de React pour éviter les rechargements

(function() {
  'use strict';
  
  const IFRAME_ID = 'n8n-persistent-iframe';
  let n8nIframe = null;

  function getOrCreateIframe() {
    // Si l'iframe existe déjà, la retourner
    if (n8nIframe && document.getElementById(IFRAME_ID)) {
      return n8nIframe;
    }

    // Chercher si elle existe déjà dans le DOM
    const existing = document.getElementById(IFRAME_ID);
    if (existing) {
      n8nIframe = existing;
      return existing;
    }

    // Créer l'iframe une seule fois
    const iframe = document.createElement('iframe');
    iframe.id = IFRAME_ID;
    iframe.src = 'https://n8n.talosprimes.com';
    iframe.className = 'w-full h-full border-0 rounded-lg';
    iframe.title = 'N8N - Automatisation';
    iframe.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen');
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.style.borderRadius = '0.5rem';

    n8nIframe = iframe;
    
    // Stocker dans window pour accès global
    window.__n8nIframe = iframe;
    
    return iframe;
  }

  // Exposer la fonction globalement
  window.getN8NIframe = getOrCreateIframe;

  // Initialiser si on est déjà sur la page N8N
  if (window.location.pathname.includes('/platform/n8n')) {
    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        getOrCreateIframe();
      });
    } else {
      getOrCreateIframe();
    }
  }
})();

