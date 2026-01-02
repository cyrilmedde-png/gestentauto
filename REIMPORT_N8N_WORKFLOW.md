# Réimport du workflow N8N "Envoyer Facture"

## Problème
L'erreur "syntaxe d'entrée invalide pour le type uuid : "={{$json.body.document_id}}"" se produit car N8N n'évalue pas l'expression dans le path parameter.

## Solution appliquée
Le workflow a été modifié pour utiliser un query parameter au lieu d'un path parameter.

## Étapes pour réimporter le workflow

1. **Ouvrir N8N** : Allez sur `n8n.talosprimes.com`

2. **Supprimer l'ancien workflow** (optionnel mais recommandé) :
   - Trouvez le workflow "💰 Envoyer Facture par Email"
   - Supprimez-le ou désactivez-le

3. **Réimporter le nouveau workflow** :
   - Cliquez sur "Workflows" dans le menu de gauche
   - Cliquez sur "Import from File" ou le bouton "+" puis "Import from File"
   - Sélectionnez le fichier : `n8n-workflows/facturation/envoyer-facture.json`
   - Cliquez sur "Import"

4. **Vérifier la configuration du node "Récupérer Document"** :
   - Ouvrez le node "Récupérer Document"
   - Vérifiez que l'URL est : `https://www.talosprimes.com/api/n8n/billing/documents`
   - Vérifiez que "Send Query" est activé
   - Vérifiez que dans "Query Parameters", il y a :
     - Name: `document_id`
     - Value: `={{ $json.body.document_id }}`

5. **Reconfigurer la credential "Supabase Service Key"** :
   - Dans le node "Récupérer Document", section "Authentication"
   - Sélectionnez "Header Auth"
   - Sélectionnez ou créez la credential "Supabase Service Key"
   - Assurez-vous que le header est `apikey` avec la valeur de votre `SUPABASE_SERVICE_ROLE_KEY`

6. **Sauvegarder et activer le workflow**

7. **Tester le workflow** :
   - Utilisez le bouton "Renvoyer par email" sur une facture dans l'interface
   - Vérifiez que le workflow s'exécute sans erreur

## Nouvelle structure de l'URL

**Ancienne (ne fonctionne pas) :**
```
GET https://www.talosprimes.com/api/n8n/billing/documents/={{$json.body.document_id}}
```

**Nouvelle (fonctionne) :**
```
GET https://www.talosprimes.com/api/n8n/billing/documents?document_id={{$json.body.document_id}}
```

## Vérification

Après réimport, testez avec curl :
```bash
curl -X GET 'https://www.talosprimes.com/api/n8n/billing/documents?document_id=VOTRE_DOCUMENT_ID' \
  -H 'Content-Type: application/json' \
  -H 'apikey: VOTRE_SUPABASE_SERVICE_ROLE_KEY'
```

