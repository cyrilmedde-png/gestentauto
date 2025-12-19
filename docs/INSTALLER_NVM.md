# 📦 Installation de nvm (Node Version Manager) sur macOS

## 🎯 Pourquoi nvm ?

nvm vous permet de gérer plusieurs versions de Node.js sur votre machine, ce qui est très utile pour différents projets.

## 📥 Installation de nvm

### Méthode 1 : Installation automatique (RECOMMANDÉ)

Ouvrez votre terminal et exécutez :

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

### Méthode 2 : Installation avec Homebrew

Si vous avez Homebrew installé :

```bash
brew install nvm
```

Puis ajoutez ces lignes à votre fichier `~/.zshrc` (ou `~/.bash_profile` si vous utilisez bash) :

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$(brew --prefix)/opt/nvm/nvm.sh" ] && \. "$(brew --prefix)/opt/nvm/nvm.sh"
[ -s "$(brew --prefix)/opt/nvm/etc/bash_completion.d/nvm" ] && \. "$(brew --prefix)/opt/nvm/etc/bash_completion.d/nvm"
```

## ⚙️ Configuration après installation

Après l'installation, vous devez recharger votre configuration shell :

```bash
# Pour zsh (macOS par défaut)
source ~/.zshrc

# Ou pour bash
source ~/.bash_profile
```

## ✅ Vérification

Vérifiez que nvm est installé :

```bash
nvm --version
```

Vous devriez voir quelque chose comme : `0.39.7`

## 🚀 Utilisation

Une fois nvm installé, vous pouvez :

```bash
# Installer Node.js 20 LTS
nvm install 20

# Utiliser Node.js 20
nvm use 20

# Définir Node.js 20 comme version par défaut
nvm alias default 20

# Vérifier la version
node --version  # Devrait afficher v20.x.x
```

## 🔄 Alternative : Installer Node.js 20 directement

Si vous préférez ne pas utiliser nvm, vous pouvez installer Node.js 20 LTS directement :

1. Allez sur [nodejs.org](https://nodejs.org/)
2. Téléchargez la version **20.x LTS**
3. Installez le fichier `.pkg`
4. Redémarrez votre terminal

**⚠️ Note** : Cette méthode remplacera votre version actuelle de Node.js. Avec nvm, vous pouvez garder plusieurs versions.

## 🆘 Problèmes courants

### "nvm: command not found" après installation

1. Vérifiez que vous avez bien rechargé votre shell :
   ```bash
   source ~/.zshrc
   ```

2. Vérifiez que nvm est dans votre PATH :
   ```bash
   echo $NVM_DIR
   ```

3. Si vide, ajoutez manuellement dans `~/.zshrc` :
   ```bash
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   ```

### Permission denied

Si vous avez des erreurs de permission, utilisez `sudo` (mais ce n'est normalement pas nécessaire) :

```bash
sudo curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

## 📚 Documentation

Pour plus d'informations : [nvm GitHub](https://github.com/nvm-sh/nvm)

