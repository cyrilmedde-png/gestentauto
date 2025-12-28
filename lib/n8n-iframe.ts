// Module global pour maintenir l'iframe N8N en dehors du cycle de vie React

let n8nIframe: HTMLIFrameElement | null = null
const IFRAME_ID = 'n8n-persistent-iframe'

export function getN8NIframe(): HTMLIFrameElement {
  // Si l'iframe existe déjà dans le DOM, la retourner
  if (n8nIframe && n8nIframe.isConnected) {
    return n8nIframe
  }

  // Chercher si elle existe déjà dans le DOM
  const existing = document.getElementById(IFRAME_ID) as HTMLIFrameElement | null
  if (existing) {
    n8nIframe = existing
    return existing
  }

  // Créer l'iframe une seule fois
  const iframe = document.createElement('iframe')
  iframe.id = IFRAME_ID
  iframe.src = 'https://n8n.talosprimes.com'
  iframe.className = 'w-full h-full border-0 rounded-lg'
  iframe.title = 'N8N - Automatisation'
  iframe.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen')
  iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox')
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.border = '0'
  iframe.style.borderRadius = '0.5rem'

  n8nIframe = iframe
  return iframe
}

