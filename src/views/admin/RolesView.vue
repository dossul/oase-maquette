<template>
  <div>
    <PageHeader
      title="Rôles & habilitations"
      subtitle="Matrice CRUD granulaire — Profils de permissions — Affectation utilisateurs"
      icon="mdi-shield-key"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-file-export" class="me-2" @click="exportMatrix">
          Exporter matrice
        </v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="openNewRole">
          Créer un rôle
        </v-btn>
      </template>
    </PageHeader>

    <v-alert type="warning" variant="tonal" rounded="lg" density="compact" class="mb-4">
      Toute modification est journalisée dans l'audit trail et prend effet immédiatement.
    </v-alert>

    <!-- Legend -->
    <v-card rounded="lg" elevation="0" variant="outlined" class="mb-4 pa-3">
      <div class="d-flex flex-wrap align-center ga-2">
        <span class="text-caption text-medium-emphasis font-weight-bold me-1">Légende :</span>
        <v-chip v-for="lg in crudLegend" :key="lg.key" :color="lg.color" size="x-small" variant="tonal" class="font-weight-bold">
          {{ lg.key.toUpperCase() }} — {{ lg.label }}
        </v-chip>
        <span class="text-caption text-medium-emphasis ms-auto d-none d-md-block">Cliquez sur une cellule pour éditer les droits</span>
      </div>
    </v-card>

    <v-tabs v-model="mainTab" color="primary" density="compact" class="mb-1">
      <v-tab value="matrix" prepend-icon="mdi-table-lock">Matrice CRUD</v-tab>
      <v-tab value="modules" prepend-icon="mdi-view-module">Modules</v-tab>
      <v-tab value="profils" prepend-icon="mdi-card-account-details">Profils</v-tab>
      <v-tab value="affectation" prepend-icon="mdi-account-group">Affectation</v-tab>
      <v-tab value="journal" prepend-icon="mdi-history">Journal</v-tab>
    </v-tabs>

    <v-window v-model="mainTab">

      <!-- ══ MATRICE CRUD ══ -->
      <v-window-item value="matrix">
        <v-card rounded="lg" elevation="1" class="mt-3">
          <v-card-text class="pa-0" style="overflow-x:auto">
            <table class="perm-table">
              <thead>
                <tr class="header-row">
                  <th class="feat-col sticky-col">Fonctionnalité</th>
                  <th v-for="role in matrixRoles" :key="role" class="role-col text-center">
                    <v-chip :color="roleColor(role)" size="x-small" variant="tonal">{{ role }}</v-chip>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="group in matrixGroups" :key="group.label">
                  <tr class="group-row">
                    <td :colspan="matrixRoles.length + 1" class="px-3 py-1">
                      <span class="text-caption font-weight-bold text-medium-emphasis group-label">{{ group.label }}</span>
                    </td>
                  </tr>
                  <tr v-for="perm in group.perms" :key="perm.key" class="perm-row">
                    <td class="pa-3 sticky-col feat-bg">
                      <div class="text-body-2 font-weight-medium">{{ perm.label }}</div>
                      <code class="perm-key">{{ perm.key }}</code>
                    </td>
                    <td v-for="role in matrixRoles" :key="role" class="pa-2 text-center">
                      <v-menu :close-on-content-click="false" location="bottom center" offset="4">
                        <template #activator="{ props }">
                          <div v-bind="props" class="crud-cell">
                            <span
                              v-for="k in crudKeys"
                              :key="k"
                              class="crud-letter"
                              :class="getCrud(role, perm.key, k) ? 'crud-on' : 'crud-off'"
                              :style="getCrud(role, perm.key, k) ? { background: crudColorMap[k] } : {}"
                            >{{ k.toUpperCase() }}</span>
                          </div>
                        </template>
                        <v-card rounded="lg" elevation="6" min-width="220">
                          <div class="d-flex align-center pa-3 pb-2">
                            <v-chip :color="roleColor(role)" size="x-small" variant="tonal" class="me-2">{{ role }}</v-chip>
                            <span class="text-caption font-weight-semibold text-truncate" style="max-width:130px">{{ perm.label }}</span>
                          </div>
                          <v-divider/>
                          <v-card-text class="pa-2">
                            <div v-for="k in crudKeys" :key="k" class="d-flex align-center justify-space-between py-1 px-1">
                              <div class="d-flex align-center ga-2">
                                <v-avatar :color="crudColorMap[k]" size="20">
                                  <span style="font-size:9px;font-weight:800;color:#fff">{{ k.toUpperCase() }}</span>
                                </v-avatar>
                                <span class="text-caption">{{ crudLabelMap[k] }}</span>
                              </div>
                              <v-switch
                                :model-value="getCrud(role, perm.key, k)"
                                @update:model-value="v => setCrud(role, perm.key, k, !!v)"
                                hide-details
                                density="compact"
                                :color="crudColorMap[k]"
                                inset
                              />
                            </div>
                          </v-card-text>
                          <v-divider/>
                          <v-card-actions class="pa-2">
                            <v-btn size="x-small" variant="text" color="error" @click="clearCrud(role, perm.key)">Tout retirer</v-btn>
                            <v-spacer/>
                            <v-btn size="x-small" color="success" variant="tonal" @click="setFullCrud(role, perm.key)">Tout accorder</v-btn>
                          </v-card-actions>
                        </v-card>
                      </v-menu>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- ══ MODULES ══ -->
      <v-window-item value="modules">
        <v-card rounded="lg" elevation="1" class="mt-3">
          <v-card-title class="pa-4 pb-1 text-body-1 font-weight-semibold">Accès aux modules par rôle</v-card-title>
          <v-card-subtitle class="px-4 pb-3 text-caption">Routes applicatives accessibles selon le rôle</v-card-subtitle>
          <v-card-text class="pa-0" style="overflow-x:auto">
            <table class="perm-table">
              <thead>
                <tr class="header-row">
                  <th class="feat-col sticky-col">Module / Route</th>
                  <th v-for="role in matrixRoles" :key="role" class="role-col text-center">
                    <v-chip :color="roleColor(role)" size="x-small" variant="tonal">{{ role }}</v-chip>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="mod in moduleGroups" :key="mod.label">
                  <tr class="group-row">
                    <td :colspan="matrixRoles.length + 1" class="px-3 py-1">
                      <v-icon :icon="mod.icon" size="12" class="me-1 text-medium-emphasis"/>
                      <span class="text-caption font-weight-bold text-medium-emphasis group-label">{{ mod.label }}</span>
                    </td>
                  </tr>
                  <tr v-for="route in mod.routes" :key="route.path" class="perm-row">
                    <td class="pa-3 sticky-col feat-bg">
                      <div class="text-body-2 font-weight-medium">{{ route.label }}</div>
                      <code class="perm-key">{{ route.path }}</code>
                    </td>
                    <td v-for="role in matrixRoles" :key="role" class="pa-2 text-center">
                      <v-checkbox
                        :model-value="hasModuleAccess(role, route.path)"
                        @update:model-value="toggleModule(role, route.path, $event)"
                        hide-details
                        density="compact"
                        color="primary"
                      />
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- ══ PROFILS ══ -->
      <v-window-item value="profils">
        <div class="d-flex align-center justify-space-between mt-3 mb-4">
          <div class="text-body-2 text-medium-emphasis">{{ profiles.length }} profil(s) défini(s)</div>
          <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="openNewProfile">Créer un profil</v-btn>
        </div>
        <v-row>
          <v-col v-for="p in profiles" :key="p.id" cols="12" md="6" lg="4">
            <v-card rounded="lg" elevation="1" class="h-100">
              <v-card-title class="pa-4 pb-2 d-flex align-center ga-2">
                <v-icon :icon="p.icon" :color="p.color" size="20"/>
                <span class="text-body-1 font-weight-semibold flex-grow-1 text-truncate">{{ p.name }}</span>
                <v-chip :color="p.color" size="x-small" variant="tonal">{{ p.baseRole }}</v-chip>
              </v-card-title>
              <v-card-text class="pa-4 pt-1">
                <div class="text-caption text-medium-emphasis mb-3">{{ p.description }}</div>
                <div class="d-flex flex-wrap ga-1 mb-3">
                  <v-chip
                    v-for="perm in p.permissions"
                    :key="perm"
                    size="x-small"
                    variant="outlined"
                    color="primary"
                  >{{ perm }}</v-chip>
                </div>
                <v-divider class="mb-3"/>
                <div class="d-flex align-center justify-space-between">
                  <div class="text-caption text-medium-emphasis">
                    <v-icon icon="mdi-account-multiple" size="14" class="me-1"/>
                    {{ p.usersCount }} utilisateur(s)
                  </div>
                  <div class="d-flex ga-1">
                    <v-btn size="x-small" variant="text" icon="mdi-pencil" color="secondary" @click="editProfile(p)"/>
                    <v-btn size="x-small" variant="text" icon="mdi-account-plus" color="primary" @click="openAssignProfile(p)"/>
                    <v-btn size="x-small" variant="text" icon="mdi-delete" color="error" @click="deleteProfile(p.id)"/>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <!-- Empty state -->
          <v-col v-if="profiles.length === 0" cols="12">
            <div class="text-center pa-8 text-medium-emphasis">
              <v-icon icon="mdi-card-account-details-outline" size="48" class="mb-3 opacity-40"/>
              <div>Aucun profil créé. Créez un profil pour regrouper des permissions réutilisables.</div>
            </div>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- ══ AFFECTATION ══ -->
      <v-window-item value="affectation">
        <v-card rounded="lg" elevation="1" class="mt-3">
          <div class="d-flex align-center justify-space-between pa-4">
            <div class="text-body-1 font-weight-semibold">Affectation des rôles aux utilisateurs</div>
            <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-account-plus" @click="assignUserDialog=true">
              Assigner un profil
            </v-btn>
          </div>
          <v-divider/>
          <v-data-table
            :headers="userHeaders"
            :items="mockUsers"
            hover
          >
            <template #item.role="{ item }">
              <v-chip :color="roleColor(item.role)" size="x-small" variant="tonal">{{ item.role }}</v-chip>
            </template>
            <template #item.profil="{ item }">
              <v-chip v-if="item.profil" color="primary" size="x-small" variant="outlined">{{ item.profil }}</v-chip>
              <span v-else class="text-caption text-medium-emphasis">—</span>
            </template>
            <template #item.statut="{ item }">
              <v-chip :color="item.statut === 'Actif' ? 'success' : 'error'" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
            </template>
            <template #item.actions="{ item }">
              <div class="d-flex ga-1">
                <v-tooltip text="Modifier le profil" location="top">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-account-edit" size="x-small" variant="text" color="primary" @click="editUserProfile(item)"/>
                  </template>
                </v-tooltip>
                <v-tooltip text="Révoquer l'accès" location="top">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-account-remove" size="x-small" variant="text" color="error" @click="revokeUserAccess(item)"/>
                  </template>
                </v-tooltip>
                <v-tooltip :text="item.statut === 'Actif' ? 'Suspendre' : 'Réactiver'" location="top">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      :icon="item.statut === 'Actif' ? 'mdi-account-off' : 'mdi-account-check'"
                      size="x-small"
                      variant="text"
                      :color="item.statut === 'Actif' ? 'warning' : 'success'"
                      @click="toggleUserStatus(item)"
                    />
                  </template>
                </v-tooltip>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <!-- ══ JOURNAL ══ -->
      <v-window-item value="journal">
        <v-card rounded="lg" elevation="1" class="mt-3">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Journal des modifications</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item
              v-for="j in journalRoles"
              :key="j.id"
              :subtitle="j.date"
              prepend-icon="mdi-history"
              rounded="lg"
              class="mb-1"
            >
              <template #title><span class="text-body-2">{{ j.action }}</span></template>
              <template #append>
                <v-chip :color="j.type === 'grant' ? 'success' : 'error'" size="x-small" variant="tonal">
                  {{ j.type === 'grant' ? 'Accordé' : 'Révoqué' }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-window-item>

    </v-window>

    <!-- ── Create/Edit Role Dialog ── -->
    <v-dialog v-model="newRoleDialog" max-width="500">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">{{ editRoleMode ? 'Modifier le rôle' : 'Créer un rôle personnalisé' }}</v-card-title>
        <v-divider/>
        <v-card-text class="pa-5">
          <v-text-field v-model="roleForm.name" label="Nom du rôle" placeholder="ex: Auditeur DGBF" class="mb-3" hide-details/>
          <v-select v-model="roleForm.baseRole" :items="matrixRoles" label="Hériter de (rôle de base)" class="mb-3" hide-details clearable/>
          <v-textarea v-model="roleForm.description" label="Description des habilitations" rows="2" hide-details/>
        </v-card-text>
        <v-divider/>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="newRoleDialog=false">Annuler</v-btn>
          <v-btn color="primary" @click="saveRole">{{ editRoleMode ? 'Enregistrer' : 'Créer' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Create/Edit Profile Dialog ── -->
    <v-dialog v-model="newProfileDialog" max-width="560" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">{{ editProfileMode ? 'Modifier le profil' : 'Créer un profil de permissions' }}</v-card-title>
        <v-divider/>
        <v-card-text class="pa-5">
          <v-text-field v-model="profileForm.name" label="Nom du profil" placeholder="ex: Inspecteur junior IGF" class="mb-3" hide-details/>
          <v-select v-model="profileForm.baseRole" :items="matrixRoles" label="Rôle de base" class="mb-3" hide-details/>
          <v-select
            v-model="profileForm.permissions"
            :items="allPermKeys"
            multiple
            chips
            closable-chips
            label="Permissions spécifiques incluses"
            class="mb-3"
            hide-details
          />
          <v-textarea v-model="profileForm.description" label="Description" rows="2" hide-details/>
        </v-card-text>
        <v-divider/>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="newProfileDialog=false">Annuler</v-btn>
          <v-btn color="primary" @click="saveProfile">{{ editProfileMode ? 'Enregistrer' : 'Créer le profil' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Assign Profile to User Dialog ── -->
    <v-dialog v-model="assignUserDialog" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">Assigner un profil à un utilisateur</v-card-title>
        <v-card-text class="pa-5">
          <v-select v-model="assignForm.userId" :items="mockUsers" item-title="name" item-value="id" label="Utilisateur" class="mb-3" hide-details/>
          <v-select v-model="assignForm.profileId" :items="profiles" item-title="name" item-value="id" label="Profil à assigner" class="mb-3" hide-details clearable/>
          <v-textarea v-model="assignForm.note" label="Note / Justification" rows="2" hide-details/>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="assignUserDialog=false">Annuler</v-btn>
          <v-btn color="primary" prepend-icon="mdi-check" @click="saveAssignment">Assigner</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Revoke Access Confirmation ── -->
    <v-dialog v-model="revokeDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3 d-flex align-center">
          <v-icon icon="mdi-account-remove" color="error" class="me-2"/>
          <span class="text-error">Révoquer l'accès</span>
        </v-card-title>
        <v-card-text class="pa-5">
          <p class="mb-3">Voulez-vous révoquer tous les droits de <strong>{{ revokeTarget?.name }}</strong> ?</p>
          <v-alert type="warning" variant="tonal" density="compact" rounded="lg">
            Cette action désactivera le compte et supprimera toutes les permissions.
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="revokeDialog=false">Annuler</v-btn>
          <v-btn color="error" prepend-icon="mdi-account-remove" @click="confirmRevoke">Confirmer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackColor" timeout="2500" location="bottom right">
      <v-icon :icon="snackColor === 'success' ? 'mdi-check-circle' : 'mdi-alert'" class="me-2"/>
      {{ snackMsg }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'

// ── Types ──────────────────────────────────────────────────────────────────
type CrudKey = 'c' | 'r' | 'u' | 'd' | 'e'
interface CrudFlags { c: boolean; r: boolean; u: boolean; d: boolean; e: boolean }
interface Profile {
  id: string; name: string; baseRole: string; description: string
  permissions: string[]; usersCount: number; icon: string; color: string
}
interface MockUser {
  id: string; name: string; email: string; role: string
  profil: string | null; statut: string; lastLogin: string
}

// ── Constants ──────────────────────────────────────────────────────────────
const crudKeys: CrudKey[] = ['c', 'r', 'u', 'd', 'e']
const crudColorMap: Record<CrudKey, string> = {
  c: '#2774AE', r: '#1B8F4C', u: '#E65100', d: '#C62828', e: '#6A1B9A',
}
const crudLabelMap: Record<CrudKey, string> = {
  c: 'Créer', r: 'Lire', u: 'Modifier', d: 'Supprimer', e: 'Exporter',
}
const crudLegend = crudKeys.map(k => ({ key: k, label: crudLabelMap[k], color: crudColorMap[k] }))

const matrixRoles = ['Bénéficiaire', 'Agent OTR', 'Agent DGBF', 'Agence', 'Décideur', 'Auditeur', 'Admin']

const roleColorMap: Record<string, string> = {
  'Bénéficiaire': 'info', 'Agent OTR': 'primary', 'Agent DGBF': 'secondary',
  'Agence': 'warning', 'Décideur': 'purple', 'Auditeur': 'error', 'Admin': 'success',
}
const roleColor = (r: string) => roleColorMap[r] || 'primary'

const matrixGroups = [
  { label: 'PORTAIL BÉNÉFICIAIRE', perms: [
    { key: 'portail_view', label: 'Accès portail bénéficiaire' },
    { key: 'demande_create', label: 'Déposer une demande' },
    { key: 'demande_view', label: 'Voir ses dossiers' },
    { key: 'attestation_download', label: 'Télécharger attestation' },
  ]},
  { label: 'BACK-OFFICE', perms: [
    { key: 'dossier_view_all', label: 'Voir tous les dossiers' },
    { key: 'dossier_instruct', label: 'Instruire un dossier' },
    { key: 'dossier_validate', label: 'Valider / Signer' },
    { key: 'dossier_reject', label: 'Rejeter un dossier' },
    { key: 'dossier_export', label: 'Exporter la liste dossiers' },
    { key: 'budget_view', label: 'Tableau dépenses fiscales' },
  ]},
  { label: 'ANALYTIQUE', perms: [
    { key: 'dashboard_deciseur', label: 'Tableau de bord décideur' },
    { key: 'rapport_generer', label: 'Générer rapport annuel' },
    { key: 'simulation', label: 'Simuler scénarios' },
    { key: 'referentiel', label: 'Référentiel juridique' },
  ]},
  { label: 'AUDIT & CONTRÔLE', perms: [
    { key: 'audit_journal', label: 'Journal d\'audit (lecture)' },
    { key: 'audit_anomalies', label: 'Anomalies moteur règles' },
    { key: 'audit_dossiers', label: 'Consultation dossiers RO' },
    { key: 'audit_missions', label: 'Missions de contrôle' },
  ]},
  { label: 'ADMINISTRATION', perms: [
    { key: 'admin_users', label: 'Gérer les utilisateurs' },
    { key: 'admin_roles', label: 'Gérer les rôles' },
    { key: 'admin_connecteurs', label: 'Gérer les connecteurs SI' },
    { key: 'admin_workflow', label: 'Éditeur workflow BPM' },
    { key: 'admin_parametres', label: 'Paramètres & Sécurité' },
  ]},
  { label: 'OPEN DATA', perms: [
    { key: 'opendata_view', label: 'Portail open data' },
    { key: 'opendata_download', label: 'Télécharger datasets' },
  ]},
]

// ── CRUD permissions reactive store ────────────────────────────────────────
const empty = (): CrudFlags => ({ c: false, r: false, u: false, d: false, e: false })
const full = (): CrudFlags => ({ c: true, r: true, u: true, d: true, e: true })
const ro = (): CrudFlags => ({ c: false, r: true, u: false, d: false, e: false })
const rde = (): CrudFlags => ({ c: false, r: true, u: false, d: false, e: true })
const crud = (c: boolean, r: boolean, u: boolean, d: boolean, e: boolean): CrudFlags => ({ c, r, u, d, e })

const crudMap = reactive<Record<string, Record<string, CrudFlags>>>({
  'Bénéficiaire': {
    portail_view: ro(), demande_create: crud(true, true, false, false, false),
    demande_view: rde(), attestation_download: crud(false, true, false, false, true),
    opendata_view: ro(), opendata_download: rde(),
  },
  'Agent OTR': {
    dossier_view_all: rde(), dossier_instruct: crud(true, true, true, false, false),
    dossier_validate: crud(false, true, true, false, true), dossier_reject: crud(false, true, false, false, false),
    dossier_export: crud(false, true, false, false, true), opendata_view: ro(),
  },
  'Agent DGBF': {
    dossier_view_all: rde(), dossier_instruct: crud(true, true, true, false, false),
    budget_view: rde(), opendata_view: ro(),
  },
  'Agence': {
    portail_view: ro(), dossier_view_all: rde(), opendata_view: ro(),
  },
  'Décideur': {
    dossier_view_all: rde(), dashboard_deciseur: rde(),
    rapport_generer: crud(true, true, false, false, true), simulation: crud(true, true, true, false, true),
    referentiel: rde(), opendata_view: ro(), opendata_download: rde(),
  },
  'Auditeur': {
    audit_journal: ro(), audit_anomalies: rde(), audit_dossiers: ro(),
    audit_missions: crud(true, true, true, false, true), dossier_view_all: ro(), opendata_view: ro(),
  },
  'Admin': full() as unknown as Record<string, CrudFlags>,
})

function getCrud(role: string, permKey: string, k: CrudKey): boolean {
  if (role === 'Admin') return true
  return crudMap[role]?.[permKey]?.[k] ?? false
}
function setCrud(role: string, permKey: string, k: CrudKey, val: boolean) {
  if (!crudMap[role]) crudMap[role] = {}
  if (!crudMap[role][permKey]) crudMap[role][permKey] = empty()
  crudMap[role][permKey][k] = val
  addJournal(`${k.toUpperCase()} "${permKey}" ${val ? 'accordé à' : 'retiré de'} "${role}"`, val ? 'grant' : 'revoke')
}
function clearCrud(role: string, permKey: string) {
  if (crudMap[role]) crudMap[role][permKey] = empty()
  addJournal(`Tous droits retirés pour "${permKey}" du rôle "${role}"`, 'revoke')
}
function setFullCrud(role: string, permKey: string) {
  if (!crudMap[role]) crudMap[role] = {}
  crudMap[role][permKey] = full()
  addJournal(`Tous droits accordés pour "${permKey}" au rôle "${role}"`, 'grant')
}

// ── Module access ──────────────────────────────────────────────────────────
const moduleGroups = [
  { label: 'PORTAIL BÉNÉFICIAIRE', icon: 'mdi-home-city', routes: [
    { path: '/portail/dashboard', label: 'Tableau de bord' },
    { path: '/portail/nouvelle-demande', label: 'Nouvelle demande' },
    { path: '/portail/demandes/:id', label: 'Suivi dossier' },
    { path: '/portail/exonerations-actives', label: 'Exonérations actives' },
    { path: '/portail/profil', label: 'Profil entreprise' },
  ]},
  { label: 'BACK-OFFICE', icon: 'mdi-office-building', routes: [
    { path: '/backoffice/dashboard', label: 'Dashboard agent' },
    { path: '/backoffice/dossiers', label: 'Liste dossiers' },
    { path: '/backoffice/dossiers/:id/instruction', label: 'Instruction dossier' },
    { path: '/backoffice/dossiers/:id/validation', label: 'Validation / Signature' },
    { path: '/backoffice/controle', label: 'Contrôle a posteriori' },
    { path: '/backoffice/budget', label: 'Budget / Dépenses fiscales' },
  ]},
  { label: 'AGENCES', icon: 'mdi-domain', routes: [
    { path: '/agences/dashboard', label: 'Dashboard agence' },
    { path: '/agences/conventions', label: 'Conventions' },
    { path: '/agences/agrements', label: 'Agréments' },
    { path: '/agences/engagements', label: 'Suivi engagements' },
  ]},
  { label: 'DÉCIDEUR', icon: 'mdi-chart-line', routes: [
    { path: '/decideur/dashboard', label: 'Tableau de bord décideur' },
    { path: '/decideur/analyse', label: 'Analyse approfondie' },
    { path: '/decideur/rapport-annuel', label: 'Rapport annuel UEMOA' },
    { path: '/decideur/simulation', label: 'Simulation scénarios' },
    { path: '/decideur/referentiel', label: 'Référentiel juridique' },
  ]},
  { label: 'AUDIT', icon: 'mdi-magnify-scan', routes: [
    { path: '/audit/dashboard', label: 'Dashboard audit' },
    { path: '/audit/journal', label: 'Journal d\'audit' },
    { path: '/audit/anomalies', label: 'Analyse anomalies' },
    { path: '/audit/dossiers', label: 'Consultation dossiers' },
    { path: '/audit/missions', label: 'Missions de contrôle' },
  ]},
  { label: 'OPEN DATA', icon: 'mdi-earth', routes: [
    { path: '/opendata', label: 'Accueil portail public' },
    { path: '/opendata/tableaux-de-bord', label: 'Tableaux de bord publics' },
    { path: '/opendata/datasets', label: 'Jeux de données' },
    { path: '/opendata/rapports', label: 'Rapports officiels' },
  ]},
  { label: 'ADMINISTRATION', icon: 'mdi-cog', routes: [
    { path: '/admin/utilisateurs', label: 'Gestion utilisateurs' },
    { path: '/admin/roles', label: 'Rôles & habilitations' },
    { path: '/admin/connecteurs', label: 'Connecteurs SI' },
    { path: '/admin/workflow', label: 'Éditeur workflow' },
    { path: '/admin/regles', label: 'Moteur de règles' },
    { path: '/admin/parametres', label: 'Paramètres & Sécurité' },
    { path: '/admin/monitoring', label: 'Monitoring système' },
  ]},
]

const moduleAccess = reactive<Record<string, Set<string>>>({
  'Bénéficiaire': new Set(['/portail/dashboard', '/portail/nouvelle-demande', '/portail/demandes/:id', '/portail/exonerations-actives', '/portail/profil', '/opendata']),
  'Agent OTR': new Set(['/backoffice/dashboard', '/backoffice/dossiers', '/backoffice/dossiers/:id/instruction', '/backoffice/dossiers/:id/validation', '/backoffice/controle']),
  'Agent DGBF': new Set(['/backoffice/dashboard', '/backoffice/dossiers', '/backoffice/dossiers/:id/instruction', '/backoffice/budget']),
  'Agence': new Set(['/agences/dashboard', '/agences/conventions', '/agences/agrements', '/agences/engagements', '/opendata']),
  'Décideur': new Set(['/decideur/dashboard', '/decideur/analyse', '/decideur/rapport-annuel', '/decideur/simulation', '/decideur/referentiel', '/opendata', '/opendata/tableaux-de-bord', '/opendata/rapports']),
  'Auditeur': new Set(['/audit/dashboard', '/audit/journal', '/audit/anomalies', '/audit/dossiers', '/audit/missions', '/opendata']),
  'Admin': new Set(moduleGroups.flatMap(g => g.routes.map(r => r.path))),
})

function hasModuleAccess(role: string, path: string): boolean {
  return moduleAccess[role]?.has(path) ?? false
}
function toggleModule(role: string, path: string, val: boolean | null) {
  if (!moduleAccess[role]) moduleAccess[role] = new Set()
  if (val) moduleAccess[role].add(path)
  else moduleAccess[role].delete(path)
}

// ── Profiles ───────────────────────────────────────────────────────────────
const profiles = ref<Profile[]>([
  { id: 'p1', name: 'Inspecteur senior IGF', baseRole: 'Auditeur', description: 'Auditeur avec droits étendus sur les missions et accès aux constats.', permissions: ['audit_missions', 'audit_journal', 'audit_anomalies', 'audit_dossiers'], usersCount: 3, icon: 'mdi-magnify-scan', color: 'error' },
  { id: 'p2', name: 'Agent OTR Douanes', baseRole: 'Agent OTR', description: "Agent spécialisé douanes avec droits d'instruction et validation.", permissions: ['dossier_instruct', 'dossier_validate', 'dossier_export'], usersCount: 12, icon: 'mdi-office-building', color: 'primary' },
  { id: 'p3', name: 'Analyste DGBF', baseRole: 'Agent DGBF', description: 'Analyste budget avec accès read-only aux dossiers et exports budget.', permissions: ['budget_view', 'dossier_view_all', 'dossier_export'], usersCount: 5, icon: 'mdi-chart-bar', color: 'secondary' },
  { id: 'p4', name: 'Décideur MEF', baseRole: 'Décideur', description: 'Dirigeant avec accès complet au tableau de bord et simulation.', permissions: ['dashboard_deciseur', 'rapport_generer', 'simulation', 'referentiel'], usersCount: 2, icon: 'mdi-briefcase', color: 'purple' },
])

// ── Mock users ─────────────────────────────────────────────────────────────
const mockUsers = ref<MockUser[]>([
  { id: 'u1', name: 'K. ABALO', email: 'k.abalo@igf.tg', role: 'Auditeur', profil: 'Inspecteur senior IGF', statut: 'Actif', lastLogin: '27/04/2026 09:14' },
  { id: 'u2', name: 'A. KPODO', email: 'a.kpodo@igf.tg', role: 'Auditeur', profil: 'Inspecteur senior IGF', statut: 'Actif', lastLogin: '27/04/2026 08:52' },
  { id: 'u3', name: 'S. AGBEKO', email: 's.agbeko@otr.tg', role: 'Agent OTR', profil: 'Agent OTR Douanes', statut: 'Actif', lastLogin: '26/04/2026 16:45' },
  { id: 'u4', name: 'L. TOGBUI', email: 'l.togbui@dgbf.tg', role: 'Agent DGBF', profil: 'Analyste DGBF', statut: 'Actif', lastLogin: '26/04/2026 14:30' },
  { id: 'u5', name: 'M. DOSSEH', email: 'm.dosseh@mef.tg', role: 'Décideur', profil: 'Décideur MEF', statut: 'Actif', lastLogin: '25/04/2026 11:00' },
  { id: 'u6', name: 'Y. KODJO', email: 'y.kodjo@otr.tg', role: 'Agent OTR', profil: null, statut: 'Suspendu', lastLogin: '20/04/2026 10:15' },
  { id: 'u7', name: 'B. ATTIOGBE', email: 'b.attiogbe@api-zf.tg', role: 'Agence', profil: null, statut: 'Actif', lastLogin: '27/04/2026 07:40' },
])

const userHeaders = [
  { title: 'Nom', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Rôle', key: 'role' },
  { title: 'Profil', key: 'profil' },
  { title: 'Statut', key: 'statut' },
  { title: 'Dernière connexion', key: 'lastLogin' },
  { title: 'Actions', key: 'actions', sortable: false },
]

// ── State ──────────────────────────────────────────────────────────────────
const mainTab = ref('matrix')
const newRoleDialog = ref(false)
const editRoleMode = ref(false)
const roleForm = reactive({ name: '', baseRole: '', description: '' })

const newProfileDialog = ref(false)
const editProfileMode = ref(false)
const editingProfileId = ref<string | null>(null)
const profileForm = reactive({ name: '', baseRole: '', description: '', permissions: [] as string[] })

const assignUserDialog = ref(false)
const assignForm = reactive({ userId: '', profileId: '', note: '' })

const revokeDialog = ref(false)
const revokeTarget = ref<MockUser | null>(null)

const snackbar = ref(false)
const snackMsg = ref('')
const snackColor = ref<'success' | 'error'>('success')

const allPermKeys = computed(() => matrixGroups.flatMap(g => g.perms.map(p => p.key)))

// ── Helpers ────────────────────────────────────────────────────────────────
function snack(msg: string, color: 'success' | 'error' = 'success') {
  snackMsg.value = msg
  snackColor.value = color
  snackbar.value = true
}

// ── Journal ────────────────────────────────────────────────────────────────
const journalRoles = ref([
  { id: 1, action: 'L. TOGBUI — permission audit_journal accordée au rôle Décideur', date: '27/04/2026 15:22', type: 'grant' },
  { id: 2, action: 'L. TOGBUI — dossier_validate retiré du rôle Agence', date: '26/04/2026 09:10', type: 'revoke' },
  { id: 3, action: 'K. ABALO — profil "Inspecteur senior IGF" assigné à A. KPODO', date: '25/04/2026 14:05', type: 'grant' },
  { id: 4, action: 'Admin — compte Y. KODJO suspendu', date: '20/04/2026 11:30', type: 'revoke' },
])
let journalId = 10
function addJournal(action: string, type: 'grant' | 'revoke') {
  const d = new Date()
  journalRoles.value.unshift({
    id: journalId++,
    action: `Admin — ${action}`,
    date: `${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    type,
  })
}

// ── Role actions ───────────────────────────────────────────────────────────
function openNewRole() { editRoleMode.value = false; roleForm.name = ''; roleForm.baseRole = ''; roleForm.description = ''; newRoleDialog.value = true }
function saveRole() {
  if (roleForm.name) {
    snack(`Rôle "${roleForm.name}" ${editRoleMode.value ? 'modifié' : 'créé'}`)
    addJournal(`Rôle "${roleForm.name}" ${editRoleMode.value ? 'modifié' : 'créé'}`, 'grant')
  }
  newRoleDialog.value = false
}

// ── Profile actions ────────────────────────────────────────────────────────
function openNewProfile() {
  editProfileMode.value = false; editingProfileId.value = null
  profileForm.name = ''; profileForm.baseRole = ''; profileForm.description = ''; profileForm.permissions = []
  newProfileDialog.value = true
}
function editProfile(p: Profile) {
  editProfileMode.value = true; editingProfileId.value = p.id
  profileForm.name = p.name; profileForm.baseRole = p.baseRole
  profileForm.description = p.description; profileForm.permissions = [...p.permissions]
  newProfileDialog.value = true
}
function saveProfile() {
  if (!profileForm.name) return
  if (editProfileMode.value && editingProfileId.value) {
    const idx = profiles.value.findIndex(p => p.id === editingProfileId.value)
    if (idx !== -1) {
      profiles.value[idx] = { ...profiles.value[idx], name: profileForm.name, baseRole: profileForm.baseRole, description: profileForm.description, permissions: [...profileForm.permissions] }
    }
  } else {
    profiles.value.push({
      id: `p${Date.now()}`, name: profileForm.name, baseRole: profileForm.baseRole,
      description: profileForm.description, permissions: [...profileForm.permissions],
      usersCount: 0, icon: 'mdi-account-cog', color: 'primary',
    })
  }
  snack(`Profil "${profileForm.name}" enregistré`)
  addJournal(`Profil "${profileForm.name}" ${editProfileMode.value ? 'modifié' : 'créé'}`, 'grant')
  newProfileDialog.value = false
}
function deleteProfile(id: string) {
  const p = profiles.value.find(x => x.id === id)
  profiles.value = profiles.value.filter(x => x.id !== id)
  if (p) { snack(`Profil "${p.name}" supprimé`, 'error'); addJournal(`Profil "${p.name}" supprimé`, 'revoke') }
}
function openAssignProfile(p: Profile) {
  assignForm.profileId = p.id; assignForm.userId = ''; assignForm.note = ''
  assignUserDialog.value = true
}

// ── User actions ───────────────────────────────────────────────────────────
function saveAssignment() {
  const user = mockUsers.value.find(u => u.id === assignForm.userId)
  const prof = profiles.value.find(p => p.id === assignForm.profileId)
  if (user && prof) {
    user.profil = prof.name
    snack(`Profil "${prof.name}" assigné à ${user.name}`)
    addJournal(`Profil "${prof.name}" assigné à ${user.name}`, 'grant')
  }
  assignUserDialog.value = false
}
function editUserProfile(item: MockUser) {
  assignForm.userId = item.id; assignForm.profileId = ''; assignForm.note = ''
  assignUserDialog.value = true
}
function revokeUserAccess(item: MockUser) { revokeTarget.value = item; revokeDialog.value = true }
function confirmRevoke() {
  if (revokeTarget.value) {
    const u = mockUsers.value.find(x => x.id === revokeTarget.value!.id)
    if (u) { u.statut = 'Suspendu'; u.profil = null }
    addJournal(`Accès révoqué pour ${revokeTarget.value.name}`, 'revoke')
    snack(`Accès de ${revokeTarget.value.name} révoqué`, 'error')
  }
  revokeDialog.value = false
}
function toggleUserStatus(item: MockUser) {
  item.statut = item.statut === 'Actif' ? 'Suspendu' : 'Actif'
  snack(`${item.name} ${item.statut === 'Actif' ? 'réactivé' : 'suspendu'}`)
  addJournal(`${item.name} ${item.statut === 'Actif' ? 'réactivé' : 'suspendu'}`, item.statut === 'Actif' ? 'grant' : 'revoke')
}

// ── Export ─────────────────────────────────────────────────────────────────
function exportMatrix() {
  const lines: string[] = ['Matrice des permissions OASE — Export', `Date: ${new Date().toLocaleString('fr-FR')}`, '']
  lines.push(['Fonctionnalité', ...matrixRoles.map(r => `${r} (C/R/U/D/E)`)].join(';'))
  matrixGroups.forEach(g => {
    lines.push(`\n=== ${g.label} ===`)
    g.perms.forEach(p => {
      const cols = matrixRoles.map(role => crudKeys.map(k => getCrud(role, p.key, k) ? k.toUpperCase() : '-').join(''))
      lines.push([p.label, ...cols].join(';'))
    })
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'matrice_permissions_oase.csv'; a.click()
  URL.revokeObjectURL(url)
  snack('Matrice exportée en CSV')
}
</script>

<style scoped>
.perm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}
.header-row {
  background: rgb(var(--v-theme-surface-light));
}
.feat-col {
  min-width: 190px;
  padding: 12px;
  text-align: start;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  font-weight: 600;
}
.role-col {
  min-width: 110px;
  padding: 10px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
}
.group-row {
  background: rgb(var(--v-theme-surface-light));
}
.group-label {
  letter-spacing: 0.07em;
}
.perm-row {
  border-bottom: 1px solid rgba(0,0,0,0.04);
}
.perm-row:hover {
  background: rgba(39,116,174,0.03);
}
.sticky-col {
  position: sticky;
  left: 0;
  z-index: 1;
}
.feat-bg {
  background: white;
}
.perm-key {
  font-size: 10px;
  color: #94A3B8;
  font-family: monospace;
}

/* ── CRUD cell ── */
.crud-cell {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  padding: 3px 4px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: border-color 0.15s, background 0.15s;
}
.crud-cell:hover {
  border-color: rgba(39,116,174,0.3);
  background: rgba(39,116,174,0.04);
}
.crud-letter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 800;
  line-height: 1;
  transition: all 0.12s;
}
.crud-on {
  color: #fff;
}
.crud-off {
  background: rgba(0,0,0,0.06);
  color: rgba(0,0,0,0.2);
}
</style>
