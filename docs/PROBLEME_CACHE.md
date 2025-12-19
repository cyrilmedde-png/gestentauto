# 🔄 Problème de cache lors du rafraîchissement

## ❌ Problème

Lors du rafraîchissement de la page (F5), l'application peut buguer et nécessiter de vider le cache Next.js (`.next`) pour fonctionner correctement.

## 🔍 Causes identifiées

Ce problème peut être causé par plusieurs facteurs :

1. **Hot Module Replacement (HMR) de Next.js** : Le système de hot reload peut parfois laisser des états corrompus
2. **Animations Canvas** : Les animations canvas avec `requestAnimationFrame` peuvent continuer à tourner même après le démontage du composant
3. **React Strict Mode** : Désactivé pour éviter les doubles renders, mais peut causer des problèmes de cache
4. **Cache des pages Next.js** : Next.js met en cache les pages en développement

## ✅ Solutions appliquées

### 1. Nettoyage amélioré des animations

Le composant `AnimatedNetwork` nettoie maintenant correctement :
- Les `requestAnimationFrame` en cours
- Les event listeners (`resize`)
- Le canvas avant le démontage
- Les refs d'état (`isMountedRef`)

### 2. Configuration Next.js

```javascript
// next.config.js
onDemandEntries: {
  maxInactiveAge: 25 * 1000,  // Pages inactives supprimées après 25s
  pagesBufferLength: 2,       // Maximum 2 pages en cache
}
```

### 3. Scripts npm

Deux nouveaux scripts ont été ajoutés :

```bash
# Nettoyer le cache
npm run clean

# Nettoyer le cache et démarrer le serveur
npm run dev:clean
```

## 🚀 Utilisation

### Option 1 : Script automatique (recommandé)

```bash
npm run dev:clean
```

Cette commande vide automatiquement le cache et démarre le serveur.

### Option 2 : Nettoyage manuel

```bash
# Arrêter le serveur (Ctrl+C)
npm run clean
npm run dev
```

### Option 3 : Commandes directes

```bash
# Vider le cache
rm -rf .next

# Redémarrer le serveur
npm run dev
```

## 🔧 Si le problème persiste

1. **Vider complètement le cache** :
   ```bash
   rm -rf .next node_modules/.cache
   ```

2. **Redémarrer le serveur** :
   ```bash
   npm run dev
   ```

3. **Vérifier les erreurs dans la console** :
   - Ouvrir les DevTools (F12)
   - Vérifier l'onglet Console
   - Vérifier l'onglet Network

4. **Redémarrer complètement** :
   ```bash
   # Arrêter tous les processus Node.js
   pkill -f "next dev"
   
   # Nettoyer
   rm -rf .next node_modules/.cache
   
   # Redémarrer
   npm run dev
   ```

## 📝 Notes

- Le script `dev:clean` est la méthode recommandée pour démarrer l'application
- Le cache Next.js est régulièrement nettoyé automatiquement grâce à `onDemandEntries`
- React Strict Mode est désactivé pour éviter les doubles renders avec les animations canvas

