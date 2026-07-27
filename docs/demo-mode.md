# Mode démo / développeur OASE — référence rapide

> Document de référence : explique **quand et où** apparaît le switcher de
> personas (P1, P2, P3…) et tout ce qui est rattaché au mode démo.
> But : qu'aucun élément réservé démo ne fuite jamais en production.

---

## TL;DR

Une seule variable d'environnement contrôle tout :

| Variable           | Valeur prod | Valeur dev/démo | Effet |
| ------------------ | ----------- | --------------- | ----- |
| `VITE_DEMO_MODE`   | `false` *ou non définie* | `true` | `false` → tout l'univers démo est **masqué** ; `true` → il est visible |

> **Règle d'or — ne JAMAIS définir `VITE_DEMO_MODE=true` en prod.**
> Sans variable définie = `false` par défaut.

---

## Source de vérité

Le flag est lu **une seule fois** dans :

- `maquette/src/composables/useDemoMode.ts` — exporte `useDemoMode()` qui
  retourne `isDemoMode: boolean`.

```ts
const RAW = (import.meta.env.VITE_DEMO_MODE ?? '').toString().toLowerCase().trim()
const DEMO_ENABLED =
  RAW === '1' || RAW === 'true' || RAW === 'yes' || RAW === 'on'
```

Toute la suite de l'app dépend de cette constante unique.
Il n'y a **aucun** autre moyen d'activer la démo (ni cookie, ni localStorage,
ni query string). C'est statique, figé au build.

---

## Endroits où c'est masqué en prod

Le `isDemoMode` est utilisé comme garde-fou `v-if` ou redirect dans :

### 1. Page de connexion (`/login`)
Fichier : `maquette/src/views/auth/LoginView.vue` (l. 65-80)

```vue
<!-- Bouton accès démo (uniquement en mode démo / développeur) -->
<div v-if="isDemoMode" class="text-center mt-4">
  <v-btn to="/demo" ...>Accès rapide maquette (démo)</v-btn>
  ...
</div>
```

→ En prod : **aucun bouton démo sur le login**. L'utilisateur ne voit que
le formulaire et le bandeau légal.

### 2. Sidebar — switcher de personas
Fichier : `maquette/src/layouts/AppLayout.vue` (l. 20-34)

```vue
<!-- Persona switcher (mock) — visible uniquement en mode démo / développeur -->
<div v-if="!rail && isDemoMode" class="px-3 py-2" ...>
  <v-select v-model="currentPersona" :items="personas" ... />
</div>
```

→ En prod : **la liste déroulante P1/P2/P3… n'est jamais rendue** dans la
sidebar gauche. La sidebar ne montre que les items de navigation réels de
l'utilisateur connecté.

### 3. Top app bar — badge persona
Fichier : `maquette/src/layouts/AppLayout.vue` (l. 76-79)

```vue
<v-chip v-if="isDemoMode && currentPersonaLabel" ...>
  {{ currentPersonaLabel }}
</v-chip>
```

→ En prod : **pas de chip "P4 — Décideur"** dans la barre du haut.

### 4. Routes marquées `demoOnly`
Fichier : `maquette/src/plugins/router.ts` (l. 117-125)

```ts
// Garde-fou : les routes marquées demoOnly ne sont accessibles qu'en mode démo.
// En production, VITE_DEMO_MODE n'est pas défini → isDemoMode = false → redirect.
const demoEnabled = (import.meta.env.VITE_DEMO_MODE ?? '').toString()...
const isDemoMode = demoEnabled === '1' || demoEnabled === 'true' || ...
if (!isDemoMode) { /* redirect */ }
```

→ En prod : toute route marquée `meta.demoOnly` est inaccessible —
**redirection automatique** (et pas un simple `v-if`, donc on ne peut pas
contourner en inspectant le DOM).

---

## Configuration des environnements

### `.env.example` (versionné, modèle)
```env
VITE_DEMO_MODE=false    # valeur explicite = false
```
Commentaire en tête du fichier précise :
> ⚠️ En PRODUCTION : laisser sur `false` ou ne pas définir cette variable.

### `.env.local` (ignoré par git, dev only)
```env
VITE_DEMO_MODE=true
```

→ Sur la machine du développeur : `npm run dev` lève la maquette complète
avec switcher visible.
→ En prod : la build ne contient pas la variable, `import.meta.env.VITE_DEMO_MODE`
est `undefined`, `isDemoMode` vaut `false`.

---

## Checklist de recette avant déploiement prod

- [ ] `grep -r 'VITE_DEMO_MODE' .env*` → aucune ligne ne vaut `true` ni `1`.
- [ ] Build prod lancée sans `VITE_DEMO_MODE` dans l'env.
- [ ] Sur la page `/login` : pas de bouton "Accès rapide maquette (démo)".
- [ ] Après login : la sidebar n'a pas de sélecteur "Persona (mock)".
- [ ] La barre du haut n'a pas le chip persona.
- [ ] Navigation directe vers `/demo` (ou autre route `demoOnly`) : **redirection**
      automatique, pas d'écran vide ni d'erreur.

---

## Pour les devs : comment tester les 2 états

```bash
# Mode démo
echo 'VITE_DEMO_MODE=true' > maquette/.env.local
cd maquette && npm run dev
# → switcher visible, bouton démo sur login, route /demo accessible

# Mode prod
rm maquette/.env.local
cd maquette && npm run build && npm run preview
# → tout est masqué, l'app se comporte comme en prod
```
