<template>
  <div>
    <PageHeader title="Mon profil entreprise" subtitle="Informations légales et gestion des accès" icon="mdi-domain" />
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
              <v-col cols="12" md="6"><v-text-field v-model="profil.adresse" label="Adresse du siège" readonly /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="profil.representant" label="Représentant légal" /></v-col>
              <v-col cols="12" md="6"><v-text-field :model-value="visibleValue('email')" label="E-mail de contact" /></v-col>
            </v-row>
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
          <div class="pa-4 pt-0">
            <v-btn color="primary" size="small" prepend-icon="mdi-plus">Ajouter un contact</v-btn>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="5">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-0 text-body-1 font-weight-semibold">Historique des connexions</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="h in connexions" :key="h.date" :subtitle="h.ip" :prepend-icon="'mdi-login'" rounded="lg">
              <template #title><span class="text-body-2">{{ h.date }}</span></template>
              <template #append><v-chip size="x-small" color="success" variant="tonal">Succès</v-chip></template>
            </v-list-item>
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
          <v-text-field v-model="confirmPwd" label="Confirmez votre mot de passe" type="password" />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer /><v-btn variant="text" @click="editDialog=false">Annuler</v-btn>
          <v-btn color="primary" @click="editDialog=false">Confirmer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
const editDialog = ref(false)
const confirmPwd = ref('')
const accessModes = ['Representant legal', 'Contact fiscal', 'Lecture seule']
const accessMode = ref('Representant legal')
const profil = ref({ raisonSociale: 'TOGO STEEL SARL', formeJuridique: 'SARL', rccm: 'TG-LOM-2019-B-1234', nif: 'TG-001-2019-B', secteur: 'Industrie manufacturière', adresse: 'Zone Industrielle, Lomé', representant: 'Edem NYAVOR', email: 'e.nyavor@steeltogo.tg' })
const utilisateurs = [{ prenom: 'Edem', nom: 'NYAVOR', role: 'Représentant légal', email: 'e.nyavor@steeltogo.tg', actif: true }, { prenom: 'Akua', nom: 'DOSSOU', role: 'Contact fiscal', email: 'a.dossou@steeltogo.tg', actif: true }]
const connexions = [{ date: '27/04/2026 10:12', ip: '196.28.45.99' }, { date: '26/04/2026 16:05', ip: '196.28.45.99' }, { date: '25/04/2026 09:33', ip: '196.28.45.99' }]

const mask = (value: string) => value.length <= 4 ? '****' : `${value.slice(0, 3)}***${value.slice(-3)}`
const visibleValue = (field: 'rccm' | 'nif' | 'email') => {
  const value = profil.value[field]
  if (accessMode.value === 'Representant legal') return value
  if (accessMode.value === 'Contact fiscal') return field === 'email' ? value : mask(value)
  return mask(value)
}
</script>
