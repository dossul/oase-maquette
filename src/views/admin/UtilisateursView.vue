<template>
  <div>
    <!-- Breadcrumb CRUD depth -->
    <div v-if="selectedUser" class="d-flex align-center ga-2 mb-4">
      <v-btn size="x-small" variant="tonal" prepend-icon="mdi-arrow-left" @click="selectedUser=null">Utilisateurs</v-btn>
      <v-icon icon="mdi-chevron-right" size="16" color="medium-emphasis"/>
      <span class="text-body-2 font-weight-semibold">{{ selectedUser.prenom }} {{ selectedUser.nom }}</span>
      <v-chip :color="selectedUser.statut==='actif'?'success':'default'" size="x-small" variant="tonal">{{ selectedUser.statut }}</v-chip>
    </div>

    <!-- DETAIL VIEW -->
    <div v-if="selectedUser">
      <v-row>
        <!-- Profile card -->
        <v-col cols="12" md="4">
          <v-card rounded="lg" elevation="1" class="mb-4">
            <v-card-text class="pa-6 text-center">
              <v-avatar color="primary" size="72" class="mb-3">
                <span style="font-size:1.5rem;font-weight:700;color:white">{{ selectedUser.prenom[0] }}{{ selectedUser.nom[0] }}</span>
              </v-avatar>
              <div class="text-h6 font-weight-bold">{{ selectedUser.prenom }} {{ selectedUser.nom }}</div>
              <div class="text-body-2 text-medium-emphasis mb-2">{{ selectedUser.email }}</div>
              <v-chip :color="roleColor(selectedUser.role)" size="small" variant="tonal">{{ roleLabel(selectedUser.role) }}</v-chip>
              <div class="text-caption text-medium-emphasis mt-2">{{ selectedUser.structure }}</div>
            </v-card-text>
            <v-divider/>
            <v-list density="compact" class="pa-2">
              <v-list-item prepend-icon="mdi-clock" :title="`Dernière connexion : ${formatDate(selectedUser.derniereConnexion)}`" density="compact"/>
              <v-list-item prepend-icon="mdi-identifier" :title="`ID : user-${selectedUser.id}`" density="compact"/>
            </v-list>
            <v-card-actions class="pa-3">
              <v-btn :color="selectedUser.statut==='actif'?'warning':'success'" variant="tonal" size="small" block @click="toggleStatut">
                <v-icon :icon="selectedUser.statut==='actif'?'mdi-account-off':'mdi-account-check'" size="16" class="me-1"/>
                {{ selectedUser.statut==='actif'?'Désactiver le compte':'Réactiver le compte' }}
              </v-btn>
            </v-card-actions>
          </v-card>

          <!-- Notification channels config -->
          <v-card rounded="lg" elevation="1">
            <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold d-flex align-center ga-1">
              <v-icon icon="mdi-bell-cog" size="16"/>Canaux de notification
            </v-card-title>
            <v-card-text class="pa-4 pt-2">
              <v-switch v-model="notifChannels.email" label="E-mail institutionnel" color="info" hide-details density="compact" class="mb-1"/>
              <v-switch v-model="notifChannels.sms" label="SMS" color="success" hide-details density="compact" class="mb-1"/>
              <v-switch v-model="notifChannels.whatsapp" label="WhatsApp" color="success" hide-details density="compact" class="mb-1"/>
              <v-switch v-model="notifChannels.inapp" label="Notification in-app" color="warning" hide-details density="compact" class="mb-2"/>
              <v-text-field v-if="notifChannels.sms || notifChannels.whatsapp" model-value="+228 9X XX XX XX" label="Numéro de téléphone" density="compact" prepend-inner-icon="mdi-phone" class="mb-2"/>
              <v-btn color="primary" size="small" block prepend-icon="mdi-content-save">Enregistrer</v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Permissions matrix -->
        <v-col cols="12" md="8">
          <v-card rounded="lg" elevation="1" class="mb-4">
            <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
              Profil de permissions
              <div class="d-flex ga-2">
                <v-select v-model="selectedUser.role" :items="roles" item-title="label" item-value="value" density="compact" hide-details style="max-width:200px" @update:model-value="applyRoleTemplate"/>
                <v-btn color="primary" size="small" prepend-icon="mdi-content-save" @click="permSaved=true">Enregistrer</v-btn>
              </div>
            </v-card-title>
            <v-snackbar v-model="permSaved" color="success" timeout="2000" location="top">Permissions enregistrées</v-snackbar>
            <v-card-text class="pa-0">
              <v-table density="compact">
                <thead>
                  <tr style="background:#F8FAFC">
                    <th class="text-left pa-3">Module</th>
                    <th class="text-center pa-2" v-for="perm in permTypes" :key="perm">{{ perm }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="mod in permMatrix" :key="mod.module" :style="mod.highlight?{ background:'rgba(39,116,174,0.04)' }:{}">
                    <td class="pa-3">
                      <div class="d-flex align-center ga-2">
                        <v-icon :icon="mod.icon" size="16" color="secondary"/>
                        <span class="text-body-2">{{ mod.module }}</span>
                      </div>
                    </td>
                    <td class="text-center pa-2" v-for="perm in permTypes" :key="perm">
                      <v-checkbox v-model="mod.perms" :value="perm" hide-details density="compact" :color="perm==='Écriture'?'warning':perm==='Suppression'?'error':'primary'" class="justify-center"/>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>

          <!-- Activity log -->
          <v-card rounded="lg" elevation="1">
            <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">Historique d'activité récent</v-card-title>
            <v-list density="compact" class="pa-2">
              <v-list-item v-for="log in userActivityLogs" :key="log.id" :subtitle="log.date" :prepend-icon="'mdi-circle-small'" :base-color="log.color" rounded="lg" class="mb-1">
                <template #title><span class="text-caption">{{ log.action }}</span></template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- LIST VIEW -->
    <div v-else>
      <PageHeader title="Gestion des utilisateurs" subtitle="Comptes OASE — RBAC, activation et désactivation logique" icon="mdi-account-multiple">
        <template #actions>
          <ExportButton size="small" @export="() => {}"/>
          <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="addDialog=true">Créer un compte</v-btn>
        </template>
      </PageHeader>

      <!-- KPIs -->
      <v-row class="mb-4">
        <v-col v-for="k in kpis" :key="k.label" cols="6" md="3"><KpiCard v-bind="k"/></v-col>
      </v-row>

      <v-card rounded="lg" elevation="1">
        <v-card-text class="pa-4">
          <v-row dense>
            <v-col cols="12" md="4">
              <v-text-field v-model="search" label="Rechercher (nom, e-mail, structure…)" prepend-inner-icon="mdi-magnify" hide-details clearable/>
            </v-col>
            <v-col cols="6" md="3">
              <v-select v-model="filterRole" :items="roles" item-title="label" item-value="value" label="Rôle" hide-details clearable/>
            </v-col>
            <v-col cols="6" md="3">
              <v-select v-model="filterStatut" :items="['actif','inactif']" label="Statut" hide-details clearable/>
            </v-col>
          </v-row>
        </v-card-text>
        <v-data-table :headers="headers" :items="filteredUsers" hover @click:row="(_, { item }) => selectedUser = item">
          <template #item.statut="{ item }">
            <v-chip :color="item.statut==='actif'?'success':'default'" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
          </template>
          <template #item.role="{ item }">
            <v-chip :color="roleColor(item.role)" size="x-small" variant="tonal">{{ roleLabel(item.role) }}</v-chip>
          </template>
          <template #item.derniereConnexion="{ item }">
            <span class="text-caption text-medium-emphasis">{{ formatDate(item.derniereConnexion) }}</span>
          </template>
          <template #item.actions="{ item }">
            <v-btn size="x-small" variant="tonal" color="primary" class="me-1" @click.stop="selectedUser=item">
              <v-icon icon="mdi-shield-edit" size="14" class="me-1"/>Permissions
            </v-btn>
            <v-btn size="x-small" variant="tonal" :color="item.statut==='actif'?'warning':'success'" @click.stop="item.statut=item.statut==='actif'?'inactif':'actif'">
              {{ item.statut==='actif'?'Désactiver':'Réactiver' }}
            </v-btn>
          </template>
        </v-data-table>
      </v-card>
    </div>

    <!-- Create dialog -->
    <v-dialog v-model="addDialog" max-width="620">
      <v-card rounded="xl">
        <v-card-title class="pa-5">Créer un nouveau compte</v-card-title>
        <v-card-text class="pa-5">
          <v-row>
            <v-col cols="6"><v-text-field v-model="newUser.prenom" label="Prénom" :rules="[v => !!v || 'Requis']"/></v-col>
            <v-col cols="6"><v-text-field v-model="newUser.nom" label="Nom" :rules="[v => !!v || 'Requis']"/></v-col>
            <v-col cols="12"><v-text-field v-model="newUser.email" label="E-mail institutionnel" prepend-inner-icon="mdi-email" :rules="[v => /.+@.+\..+/.test(v) || 'E-mail invalide']"/></v-col>
            <v-col cols="6">
              <v-select v-model="newUser.role" :items="roles" item-title="label" item-value="value" label="Rôle RBAC"/>
            </v-col>
            <v-col cols="6">
              <v-select v-model="newUser.structure" :items="structures" label="Structure"/>
            </v-col>
          </v-row>
          <div class="label-micro text-medium-emphasis mb-2">Canaux de notification</div>
          <div class="d-flex ga-3 flex-wrap">
            <v-checkbox v-model="newUser.notifs" value="email" label="E-mail" hide-details density="compact" color="info"/>
            <v-checkbox v-model="newUser.notifs" value="sms" label="SMS" hide-details density="compact" color="success"/>
            <v-checkbox v-model="newUser.notifs" value="whatsapp" label="WhatsApp" hide-details density="compact" color="success"/>
            <v-checkbox v-model="newUser.notifs" value="inapp" label="In-app" hide-details density="compact" color="warning"/>
          </div>
          <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mt-4">
            Un e-mail d'activation sera automatiquement envoyé. L'utilisateur configurera son mot de passe et son MFA.
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="addDialog=false">Annuler</v-btn>
          <v-btn color="primary" @click="createUser">Créer et envoyer l'invitation</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import ExportButton from '../../components/ExportButton.vue'
import KpiCard from '../../components/KpiCard.vue'
import { mockUtilisateurs } from '../../mock/data'
import type { Utilisateur } from '../../types'

const search = ref('')
const filterRole = ref(null)
const filterStatut = ref(null)
const addDialog = ref(false)
const selectedUser = ref<Utilisateur | null>(null)
const permSaved = ref(false)
const utilisateurs = ref([...mockUtilisateurs])

const notifChannels = ref({ email: true, sms: true, whatsapp: false, inapp: true })

const newUser = ref({ prenom: '', nom: '', email: '', role: '', structure: '', notifs: ['email', 'inapp'] })

const roles = [
  { label: 'Bénéficiaire', value: 'beneficiaire', color: 'secondary' },
  { label: 'Agent OTR', value: 'agent_otr', color: 'primary' },
  { label: 'Agent DGBF', value: 'agent_dgbf', color: 'info' },
  { label: 'Agence', value: 'agence', color: 'teal' },
  { label: 'Décideur', value: 'decideur', color: 'purple' },
  { label: 'Auditeur', value: 'auditeur', color: 'warning' },
  { label: 'Admin', value: 'admin', color: 'error' },
]
const structures = ['OTR Douanes', 'OTR Impôts', 'DGBF', 'DGTCP', 'API-ZF', 'SAZOF', 'UPF', 'IGF', 'Cour des comptes', 'DSI/MEF']

const permTypes = ['Lecture', 'Écriture', 'Suppression', 'Export']

const permMatrix = ref([
  { module: 'Dossiers / Demandes', icon: 'mdi-folder', perms: ['Lecture', 'Écriture', 'Export'], highlight: false },
  { module: 'Instruction & Visa', icon: 'mdi-file-search', perms: ['Lecture', 'Écriture'], highlight: false },
  { module: 'Validation / Signature', icon: 'mdi-file-sign', perms: ['Lecture'], highlight: false },
  { module: 'Budget & Dépenses fiscales', icon: 'mdi-chart-bar', perms: ['Lecture', 'Export'], highlight: false },
  { module: 'Conventions & Agréments', icon: 'mdi-certificate', perms: ['Lecture', 'Export'], highlight: false },
  { module: 'Rapport Annuel', icon: 'mdi-file-chart', perms: ['Lecture', 'Export'], highlight: false },
  { module: 'Journal d\'audit', icon: 'mdi-shield-lock', perms: ['Lecture', 'Export'], highlight: true },
  { module: 'Gestion utilisateurs', icon: 'mdi-account-multiple', perms: ['Lecture'], highlight: false },
  { module: 'Configuration SI', icon: 'mdi-api', perms: [], highlight: false },
])

const roleTemplates: Record<string, string[]> = {
  agent_otr: ['Lecture', 'Écriture', 'Export'],
  agent_dgbf: ['Lecture', 'Export'],
  decideur: ['Lecture', 'Export'],
  auditeur: ['Lecture', 'Export'],
  admin: ['Lecture', 'Écriture', 'Suppression', 'Export'],
  beneficiaire: ['Lecture'],
  agence: ['Lecture', 'Écriture', 'Export'],
}

function applyRoleTemplate(role: string) {
  const template = roleTemplates[role] || ['Lecture']
  permMatrix.value.forEach(m => { m.perms = [...template] })
}

const filteredUsers = computed(() => {
  return utilisateurs.value.filter(u => {
    if (search.value && !`${u.prenom} ${u.nom} ${u.email} ${u.structure}`.toLowerCase().includes(search.value.toLowerCase())) return false
    if (filterRole.value && u.role !== filterRole.value) return false
    if (filterStatut.value && u.statut !== filterStatut.value) return false
    return true
  })
})

const kpis = computed(() => [
  { label: 'Comptes actifs', value: utilisateurs.value.filter(u => u.statut === 'actif').length, icon: 'mdi-account-check', color: 'success' },
  { label: 'Comptes inactifs', value: utilisateurs.value.filter(u => u.statut === 'inactif').length, icon: 'mdi-account-off', color: 'warning' },
  { label: 'Structures', value: new Set(utilisateurs.value.map(u => u.structure)).size, icon: 'mdi-domain', color: 'primary' },
  { label: 'Rôles actifs', value: new Set(utilisateurs.value.map(u => u.role)).size, icon: 'mdi-shield-key', color: 'info' },
])

const headers = [
  { title: 'Prénom', key: 'prenom' },
  { title: 'Nom', key: 'nom' },
  { title: 'E-mail', key: 'email' },
  { title: 'Rôle', key: 'role' },
  { title: 'Structure', key: 'structure' },
  { title: 'Statut', key: 'statut' },
  { title: 'Dernière connexion', key: 'derniereConnexion' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const roleLabel = (r: string) => roles.find(x => x.value === r)?.label || r
const roleColor = (r: string) => roles.find(x => x.value === r)?.color || 'secondary'
const formatDate = (iso: string) => new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const toggleStatut = () => { if (selectedUser.value) selectedUser.value.statut = selectedUser.value.statut === 'actif' ? 'inactif' : 'actif' }

function createUser() {
  utilisateurs.value.push({
    id: String(utilisateurs.value.length + 1),
    prenom: newUser.value.prenom,
    nom: newUser.value.nom,
    email: newUser.value.email,
    role: newUser.value.role as any,
    structure: newUser.value.structure,
    statut: 'actif',
    derniereConnexion: new Date().toISOString(),
  })
  addDialog.value = false
  newUser.value = { prenom: '', nom: '', email: '', role: '', structure: '', notifs: ['email', 'inapp'] }
}

const userActivityLogs = [
  { id: 1, action: 'Validation OASE-2026-0039 → Approuvé', date: '27/04/2026 10:45', color: 'success' },
  { id: 2, action: 'Instruction OASE-2026-0042 assignée', date: '26/04/2026 09:12', color: 'info' },
  { id: 3, action: 'Export liste dossiers CSV', date: '25/04/2026 16:30', color: 'secondary' },
  { id: 4, action: 'Connexion depuis 196.28.45.12', date: '24/04/2026 08:55', color: 'secondary' },
]
</script>
