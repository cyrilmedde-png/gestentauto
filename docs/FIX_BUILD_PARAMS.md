# 🔥 FIX DÉPLOYÉ - Relancer Build VPS

## ✅ FIX EFFECTUÉ

**Problème**: Next.js 15+ `params` async  
**Solution**: Changé signature vers `Promise<{ id: string }>` + `await params`

---

## 🚀 COMMANDES VPS

```bash
# 1. Naviguer
cd /var/www/talosprime

# 2. Pull fix
git pull origin main

# 3. Build
npm run build

# 4. Restart
pm2 restart talosprime

# 5. Vérifier
pm2 status
pm2 logs talosprime --lines 20
```

---

## ✅ BUILD DEVRAIT RÉUSSIR !

Si tout OK, continuer avec migrations SQL puis N8N.

**Guide complet**: `docs/DEPLOIEMENT_MODULE_FACTURATION.md`

