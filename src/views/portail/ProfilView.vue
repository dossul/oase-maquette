<template>
  <div>
    <PageHeader title="Mon profil entreprise" subtitle="Informations légales et gestion des accès" icon="mdi-domain" />
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="loadError" type="error" variant="tonal" density="compact" rounded="lg" class="mb-4">{{ loadError }}</v-alert>
    <v-alert v-if="saveMessage" :type="saveOk ? 'success' : 'error'" variant="tonal" density="compact" rounded="lg" class="mb-4">{{ saveMessage }}</v-alert>
    <v-row>
      <v-col cols="12" md="7">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-0 text-body-1 font-weight-semibold">Informations légales</v-card-title>
          <v-card-text class="pa-4">
            <div class="d-flex flex-wrap align-center ga-2 mb-4">
              <v-select v-model="accessMode" :items="accessModes" label="Vue selon profil" density="compact" hide-details style="max-width: 240px" />
              <v-chip color="warning" variant="tonal" size="small" prepend-icon="mdi-eye-lock-outline">Masquage conditionnel actif</v-chip>
            </div>
            <v-row>
              <v-col cols="12" md="6"><v-text-field v-model="profil.raisonSociale" label="Raison sociale" readonly /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="profil.formeJuridique" label="Forme juridique" readonly /></v-col>
              <v-col cols="12" md="6"><v-text-field :model-value="visibleValue('rccm')" label="RCCM" readonly /></v-col>
              <v-col cols="12" md="6"><v-text-field :model-value="visibleValue('nif')" label="NIF" readonly /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="profil.secteur" label="Secteur d'activité" readonly /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="profil.adresse" label="Adresse du siège" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="profil.representant" label="Représentant légal" readonly /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="profil.email" label="E-mail de contact" /></v-col>
            </v-row>
            <div class="d-flex justify-end mt-2">
              <v-btn color="primary" size="small" prepend-icon="mdi-content-save" @click="editDialog = true">Enregistrer les modifications</v-btn>
            </div>
            <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mt-3">
              En mode `{{ accessMode }}`, certains champs sensibles sont masques ou partiellement visibles. Toute consultation de donnees completes est journalisee.
            </v-alert>
          </v-card-text>
        </v-card>
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-0 text-body-1 font-weight-semibold">Utilisateurs de l'entreprise</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="u in utilisateurs" :key="u.email" :subtitle="u.role" :prepend-icon="'mdi-account'" rounded="lg">
              <template #title><span class="text-body-2">{{ u.prenom }} {{ u.nom }}</span></template>
              <template #append>
                <v-chip :color="u.actif?'success':'default'" size="x-small" variant="tonal">{{ u.actif?'Actif':'Inactif' }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" md="5">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-0 text-body-1 font-weight-semibold">Dernière connexion</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-if="derniereConnexion" :subtitle="compteConnecte" :prepend-icon="'mdi-login'" rounded="lg">
              <template #title><span class="text-body-2">{{ derniereConnexion }}</span></template>
              <template #append><v-chip size="x-small" color="success" variant="tonal">Succès</v-chip></template>
            </v-list-item>
            <v-list-item v-else title="Aucune connexion journalisée" prepend-icon="mdi-login-variant" />
          </v-list>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-0 text-body-1 font-weight-semibold">Politique d'acces</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Representant legal" subtitle="Vision complete, export et mise a jour" prepend-icon="mdi-account-tie" />
            <v-list-item title="Contact fiscal" subtitle="Vision partielle, champs critiques journalises" prepend-icon="mdi-briefcase-account-outline" />
            <v-list-item title="Lecture seule" subtitle="Masquage des identifiants et coordonnees sensibles" prepend-icon="mdi-eye-off-outline" />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog v-model="editDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-5">Confirmer la modification</v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-3">Les coordonnées de contact de l'entreprise vont être mises à jour. Cette action est journalisée.</p>
          <v-text-field v-model="confirmPwd" label="Confirmez votre mot de passe" type="password" />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer /><v-btn variant="text" @click="editDialog=false">Annuler</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveProfil">Confirmer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import { getContribuableMe, getUtilisateurMe, updateContribuableMe } from '../../services/portail'

const editDialog = ref(false)
const confirmPwd = ref('')
const saving = ref(false)
const saveMessage = ref('')
const saveOk = ref(true)
const loading = ref(true)
const loadError = ref('')
const accessModes = ['Representant legal', 'Contact fiscal', 'Lecture seule']
const accessMode = ref('Representant legal')

const profil = ref({ raisonSociale: '', formeJuridique: '', rccm: '', nif: '', secteur: '', adresse: '', representant: '', email: '' })
const initialContact = ref({ email: '', adresse: '' })
const utilisateurs = ref<{ prenom: string; nom: string; role: string; email: string; actif: boolean }[]>([])
const derniereConnexion = ref('')
const compteConnecte = ref('')

onMounted(async () => {
  loading.value = true
  try {
    const [me, user] = await Promise.all([
      getContribuableMe(),
      getUtilisateurMe().catch(() => null),
    ])
    profil.value = {
      raisonSociale: me.raisonSociale || '',
      formeJuridique: me.typeContribuable?.libelle || me.typeContribuableCode || '',
      rccm: me.rccm || '',
      nif: me.nif || '',
      secteur: me.secteur || '',
      adresse: me.adresse || '',
      representant: me.utilisateurs ? `${me.utilisateurs.prenom} ${me.utilisateurs.nom}` : '',
      email: me.emailContact || '',
    }
    initialContact.value = { email: profil.value.email, adresse: profil.value.adresse }
    if (me.utilisateurs) {
      utilisateurs.value = [{
        prenom: me.utilisateurs.prenom,
        nom: me.utilisateurs.nom,
        role: 'Représentant légal',
        email: me.utilisateurs.email,
        actif: true,
      }]
    }
    if (user) {
      compteConnecte.value = user.email
      derniereConnexion.value = user.derniereConnexion
        ? new Date(user.derniereConnexion).toLocaleString('fr-FR')
        : ''
    }
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Impossible de charger le profil entreprise'
  } finally {
    loading.value = false
  }
})

async function saveProfil() {
  if (saving.value) return
  saving.value = true
  saveMessage.value = ''
  try {
    const payload: { emailContact?: string; adresse?: string } = {}
    if (profil.value.email !== initialContact.value.email) payload.emailContact = profil.value.email
    if (profil.value.adresse !== initialContact.value.adresse) payload.adresse = profil.value.adresse
    await updateContribuableMe(payload)
    initialContact.value = { email: profil.value.email, adresse: profil.value.adresse }
    saveOk.value = true
    saveMessage.value = 'Profil entreprise mis à jour avec succès.'
    editDialog.value = false
    confirmPwd.value = ''
  } catch (e) {
    saveOk.value = false
    saveMessage.value = e instanceof Error ? e.message : 'Échec de la mise à jour du profil'
    editDialog.value = false
  } finally {
    saving.value = false
  }
}

const mask = (value: string) => value.length <= 4 ? '****' : `${value.slice(0, 3)}***${value.slice(-3)}`
const visibleValue = (field: 'rccm' | 'nif' | 'email') => {
  const value = profil.value[field]
  if (accessMode.value === 'Representant legal') return value
  if (accessMode.value === 'Contact fiscal') return field === 'email' ? value : mask(value)
  return mask(value)
}
</script>
