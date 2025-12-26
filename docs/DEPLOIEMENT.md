# 🚀 Script de déploiement automatique

## Utilisation

Sur votre serveur, vous pouvez maintenant déployer en une seule commande :

```bash
/var/www/talosprime/scripts/deploy.sh
```

Ou si vous êtes déjà dans le répertoire :

```bash
./scripts/deploy.sh
```

Ou via bash :

```bash
bash /var/www/talosprime/scripts/deploy.sh
```

## Ce que fait le script

1. ✅ Se place dans `/var/www/talosprime`
2. ✅ Récupère les dernières modifications depuis GitHub (`git pull origin main`)
3. ✅ Reconstruit l'application (`npm run build`)
4. ✅ Redémarre l'application PM2 (`pm2 restart talosprime`)
5. ✅ Affiche le statut PM2

## Rendre le script exécutable (si nécessaire)

Si le script n'est pas exécutable, sur le serveur :

```bash
chmod +x /var/www/talosprime/scripts/deploy.sh
```

## Personnalisation

Vous pouvez modifier le script `scripts/deploy.sh` pour ajouter d'autres étapes :
- Vérification des variables d'environnement
- Sauvegarde de la base de données
- Tests avant déploiement
- Envoi de notifications




