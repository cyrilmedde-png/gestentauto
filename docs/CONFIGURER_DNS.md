# 🌐 Configuration DNS - Faire pointer un nom de domaine vers une IP

## 📋 Vue d'ensemble

Pour que `talosprime.fr` et `talosprime.com` pointent vers votre serveur (`82.165.129.143`), vous devez configurer les **enregistrements DNS** dans votre registrar (IONOS).

---

## 🔧 Étape 1 : Accéder à la gestion DNS

1. **Connectez-vous à votre compte IONOS**
   - Allez sur https://www.ionos.fr/
   - Connectez-vous avec vos identifiants

2. **Accédez à la gestion des domaines**
   - Dans le tableau de bord, trouvez la section "Domaines" ou "Gestionnaire de domaines"
   - Cliquez sur votre domaine (`talosprime.fr` ou `talosprime.com`)

3. **Ouvrez la gestion DNS**
   - Cherchez un onglet ou une section "DNS" / "Gestion DNS" / "Zones DNS"
   - Ou "Paramètres DNS" / "DNS Management"

---

## 📝 Étape 2 : Configurer les enregistrements A

Vous devez créer/modifier ces enregistrements DNS :

### Pour `talosprime.fr` :

| Type | Nom / Sous-domaine | Valeur / Cible | TTL |
|------|-------------------|----------------|-----|
| **A** | `@` (ou vide, ou `talosprime.fr`) | `82.165.129.143` | 3600 (ou défaut) |
| **A** | `www` | `82.165.129.143` | 3600 (ou défaut) |

### Pour `talosprime.com` :

| Type | Nom / Sous-domaine | Valeur / Cible | TTL |
|------|-------------------|----------------|-----|
| **A** | `@` (ou vide, ou `talosprime.com`) | `82.165.129.143` | 3600 (ou défaut) |
| **A** | `www` | `82.165.129.143` | 3600 (ou défaut) |

---

## 📸 Interface IONOS (exemple)

Dans l'interface IONOS, vous verrez probablement quelque chose comme :

```
Type | Nom | Valeur
-----|-----|--------
A    | @   | [modifier] → 82.165.129.143
A    | www | [modifier] → 82.165.129.143
```

**Actions :**
1. Si l'enregistrement existe déjà, **modifiez-le** pour mettre `82.165.129.143`
2. Si l'enregistrement n'existe pas, **ajoutez-le** :
   - Type : `A`
   - Nom : `@` (ou vide) pour le domaine racine
   - Nom : `www` pour www.talosprime.fr
   - Valeur : `82.165.129.143`
   - TTL : `3600` (ou laissez la valeur par défaut)

---

## ⏱️ Étape 3 : Propagation DNS

Après avoir modifié les enregistrements DNS :

1. **Sauvegardez les modifications** dans l'interface IONOS

2. **Temps de propagation** :
   - Généralement : **15 minutes à 24 heures**
   - Souvent effectif en **1-2 heures**
   - Le TTL définit la durée de cache (3600 = 1 heure)

3. **Vérifier que ça fonctionne** :
   ```bash
   # Sur votre Mac, dans le terminal :
   nslookup talosprime.fr
   nslookup www.talosprime.fr
   
   # Ou :
   dig talosprime.fr
   dig www.talosprime.fr
   ```
   
   Vous devriez voir `82.165.129.143` dans la réponse.

---

## ✅ Étape 4 : Vérification finale

Une fois la propagation DNS effectuée, testez dans votre navigateur :

- `http://talosprime.fr` → devrait afficher votre application
- `http://www.talosprime.fr` → devrait afficher votre application
- `http://talosprime.com` → devrait afficher votre application
- `http://www.talosprime.com` → devrait afficher votre application

---

## 🔒 Étape 5 : Configurer SSL (après DNS)

**⚠️ IMPORTANT :** Configurez SSL **APRÈS** que les DNS pointent correctement vers votre serveur.

Sur votre serveur :

```bash
cd /var/www/talosprime
sudo certbot --nginx -d talosprime.fr -d www.talosprime.fr -d talosprime.com -d www.talosprime.com
```

Cela configurera HTTPS automatiquement avec Let's Encrypt.

---

## 🐛 Dépannage

### Le domaine ne pointe pas vers l'IP

1. **Vérifiez les enregistrements DNS** :
   ```bash
   dig talosprime.fr +short
   # Devrait retourner : 82.165.129.143
   ```

2. **Vérifiez le cache DNS local** :
   ```bash
   # Sur Mac
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   ```

3. **Attendez la propagation** : Jusqu'à 24h dans certains cas

### Erreur "DNS_PROBE_FINISHED_NXDOMAIN"

- Vérifiez que les enregistrements A sont bien configurés
- Attendez la propagation DNS
- Vérifiez avec `nslookup` ou `dig`

---

## 📚 Ressources

- [Documentation IONOS - Gestion DNS](https://www.ionos.fr/assistance/domaines/parametres-dns/configuration-dns/)
- [Vérificateur DNS en ligne](https://dnschecker.org/)
- [Test de propagation DNS](https://www.whatsmydns.net/)

---

## 💡 Astuce

Pour vérifier rapidement si vos DNS sont bien configurés :

```bash
# Vérifier tous les domaines en une fois
for domain in talosprime.fr www.talosprime.fr talosprime.com www.talosprime.com; do
  echo "=== $domain ==="
  dig +short $domain
  echo
done
```

Tous devraient retourner `82.165.129.143`.



