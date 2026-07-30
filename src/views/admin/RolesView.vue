<template>
  <div>
    <PageHeader
      title="Rôles & habilitations"
      subtitle="Matrice RBAC réelle (dérivée de l'API) — Affectation & statuts utilisateurs — Journal d'audit"
      icon="mdi-shield-key"
    >
      <template #actions>
        <v-btn
          color="secondary"
          variant="tonal"
          size="small"
          prepend-icon="mdi-file-export"
          :disabled="matriceLoading || entreesFiltrees.length === 0"
          @click="exportMatrix"
        >
          Exporter matrice
        </v-btn>
      </template>
    </PageHeader>

    <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
      Matrice <strong>réelle</strong>, dérivée des <code>@Roles</code> de l'API (GET /admin/rbac/matrice) —
      la même source de vérité que le garde RBAC. Lecture seule : toute modification d'habilitation
      passe par le code. Affectation, statuts et journal : données réelles (utilisateurs, audit).
    </v-alert>

    <v-tabs v-model="mainTab" color="primary" density="compact" class="mb-1">
      <v-tab value="matrix" prepend-icon="mdi-table-lock">Matrice RBAC</v-tab>
      <v-tab value="affectation" prepend-icon="mdi-account-group">Affectation</v-tab>
      <v-tab value="journal" prepend-icon="mdi-history">Journal</v-tab>
    </v-tabs>

    <v-window v-model="mainTab">

      <!-- ══ MATRICE RBAC RÉELLE ══ -->
      <v-window-item value="matrix">
        <v-card rounded="lg" elevation="1" class="mt-3">
          <div class="d-flex flex-wrap align-center ga-3 pa-4 pb-2">
            <v-text-field
              v-model="recherche"
              prepend-inner-icon="mdi-magnify"
              label="Filtrer (chemin, méthode, contrôleur, rôle)"
              density="compact"
              variant="outlined"
              hide-details
              clearable
              style="max-width: 420px"
            />
            <v-chip size="small" variant="tonal" color="primary">
              {{ entreesFiltrees.length }} endpoint(s) protégé(s)
            </v-chip>
            <v-chip size="small" variant="tonal" color="secondary">
              {{ matriceRoles.length }} rôle(s)
            </v-chip>
          </div>
          <v-progress-linear v-if="matriceLoading" indeterminate color="primary"/>
          <v-alert v-else-if="matriceError" type="error" variant="tonal" density="compact" rounded="lg" class="ma-3">
            {{ matriceError }}
          </v-alert>
          <v-card-text v-else class="pa-0" style="overflow-x:auto">
            <table class="perm-table">
              <thead>
                <tr class="header-row">
                  <th class="feat-col sticky-col">Endpoint (méthode + chemin)</th>
                  <th v-for="role in matriceRoles" :key="role" class="role-col text-center">
                    <v-chip :color="roleColor(role)" size="x-small" variant="tonal">
                      <code class="role-code">{{ role }}</code>
                    </v-chip>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-for="groupe in entreesGroupees" :key="groupe.controleur">
                  <tr class="group-row">
                    <td :colspan="matriceRoles.length + 1" class="px-3 py-1">
                      <span class="text-caption font-weight-bold text-medium-emphasis group-label">
                        {{ groupe.controleur.toUpperCase() }} ({{ groupe.entrees.length }})
                      </span>
                    </td>
                  </tr>
                  <tr v-for="e in groupe.entrees" :key="`${e.http} ${e.chemin}`" class="perm-row">
                    <td class="pa-3 sticky-col feat-bg">
                      <div class="d-flex align-center ga-2">
                        <v-chip :color="httpColor(e.http)" size="x-small" variant="flat" class="http-chip">{{ e.http }}</v-chip>
                        <code class="text-body-2 font-weight-medium endpoint-path">{{ e.chemin }}</code>
                      </div>
                      <code class="perm-key">{{ e.controleur }}.{{ e.methode }}</code>
                    </td>
                    <td v-for="role in matriceRoles" :key="role" class="pa-2 text-center">
                      <v-icon
                        v-if="e.roles.includes(role)"
                        icon="mdi-shield-check"
                        size="16"
                        :color="roleColor(role)"
                      />
                      <span v-else class="text-medium-emphasis" style="opacity:.3">—</span>
                    </td>
                  </tr>
                </template>
                <tr v-if="entreesFiltrees.length === 0">
                  <td :colspan="matriceRoles.length + 1" class="text-center pa-8 text-medium-emphasis">
                    <v-icon icon="mdi-table-search" size="36" class="mb-2 opacity-40"/>
                    <div class="text-body-2">Aucun endpoint ne correspond au filtre.</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- ══ AFFECTATION ══ -->
      <v-window-item value="affectation">
        <v-card rounded="lg" elevation="1" class="mt-3">
          <div class="d-flex align-center justify-space-between pa-4">
            <div class="text-body-1 font-weight-semibold">Utilisateurs et statuts d'accès</div>
            <v-chip size="small" variant="tonal" color="primary">{{ users.length }} compte(s)</v-chip>
          </div>
          <v-divider/>
          <v-alert v-if="usersError" type="error" variant="tonal" density="compact" rounded="lg" class="ma-3">{{ usersError }}</v-alert>
          <v-data-table
            :headers="userHeaders"
            :items="users"
            :loading="usersLoading"
            :items-per-page="25"
            hover
          >
            <template #item.role="{ item }">
              <v-chip :color="roleColor(item.roleCode)" size="x-small" variant="tonal">
                <code class="role-code">{{ item.roleCode }}</code>
              </v-chip>
            </template>
            <template #item.statut="{ item }">
              <v-chip :color="item.statut === 'Actif' ? 'success' : 'error'" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
            </template>
            <template #item.actions="{ item }">
              <div class="d-flex ga-1">
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
          <div class="d-flex align-center justify-space-between pa-4 pb-2">
            <div class="text-body-1 font-weight-semibold">Journal des modifications (audit réel)</div>
            <v-btn size="small" variant="text" prepend-icon="mdi-refresh" :loading="journalLoading" @click="chargerJournal">
              Actualiser
            </v-btn>
          </div>
          <v-progress-linear v-if="journalLoading" indeterminate color="primary"/>
          <v-list v-else density="compact" class="pa-2">
            <div v-if="journalRoles.length === 0" class="text-center pa-6 text-medium-emphasis">
              <v-icon icon="mdi-history" size="36" class="mb-2 opacity-40"/>
              <div class="text-body-2">Aucun événement d'habilitation journalisé.</div>
            </div>
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
            Cette action désactivera le compte (PATCH /utilisateurs/:id — statut inactif).
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
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import { listerUtilisateurs } from '../../services/utilisateurs'
import { listerAuditLogs } from '../../services/audit'
import { modifierStatutUtilisateur } from '../../services/admin'
import { getMatriceRbac, type EntreeMatriceRbac } from '../../services/rbac'

// ── Types ──────────────────────────────────────────────────────────────────
interface UserRow {
  id: string; name: string; email: string; roleCode: string
  statut: string; lastLogin: string
}

// ── Couleurs par rôle (codes réels de l'enum API) ─────────────────────────
const roleColorMap: Record<string, string> = {
  contribuable: 'info', agent_ci: 'primary', agent_cddi: 'primary',
  agent_dgbf: 'secondary', agent_dgtcp: 'teal', agent_agence: 'warning',
  agent_mae: 'indigo', agent_dgmg: 'brown', agent_dsi_mef: 'cyan',
  agent_ministere: 'deep-purple', agent_conedef: 'blue-grey',
  decideur: 'purple', auditeur: 'error', admin_si: 'success',
}
const roleColor = (code: string) => roleColorMap[code] || 'primary'

const httpColorMap: Record<string, string> = {
  GET: '#1B8F4C', POST: '#2774AE', PUT: '#E65100', PATCH: '#E65100', DELETE: '#C62828',
}
const httpColor = (m: string) => httpColorMap[m] || '#6A1B9A'

// ── Matrice RBAC réelle (GET /admin/rbac/matrice) ─────────────────────────
const matriceRoles = ref<string[]>([])
const entrees = ref<EntreeMatriceRbac[]>([])
const matriceLoading = ref(false)
const matriceError = ref<string | null>(null)
const recherche = ref('')

async function chargerMatrice() {
  matriceLoading.value = true
  matriceError.value = null
  try {
    const m = await getMatriceRbac()
    matriceRoles.value = m.roles
    entrees.value = m.entrees
  } catch (e) {
    entrees.value = []
    matriceError.value = e instanceof Error ? e.message : 'Erreur de chargement de la matrice RBAC'
  } finally {
    matriceLoading.value = false
  }
}

const entreesFiltrees = computed(() => {
  const q = recherche.value.trim().toLowerCase()
  if (!q) return entrees.value
  return entrees.value.filter(e =>
    e.chemin.toLowerCase().includes(q) ||
    e.http.toLowerCase().includes(q) ||
    e.controleur.toLowerCase().includes(q) ||
    e.methode.toLowerCase().includes(q) ||
    e.roles.some(r => r.toLowerCase().includes(q)),
  )
})

const entreesGroupees = computed(() => {
  const map = new Map<string, EntreeMatriceRbac[]>()
  for (const e of entreesFiltrees.value) {
    const list = map.get(e.controleur) ?? []
    list.push(e)
    map.set(e.controleur, list)
  }
  return [...map.entries()].map(([controleur, list]) => ({ controleur, entrees: list }))
})

// ── Utilisateurs réels (GET /utilisateurs) ─────────────────────────────────
const users = ref<UserRow[]>([])
const usersLoading = ref(false)
const usersError = ref<string | null>(null)

async function chargerUtilisateurs() {
  usersLoading.value = true
  usersError.value = null
  try {
    const res = await listerUtilisateurs()
    users.value = res.data.map(u => ({
      id: u.id,
      name: `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || u.email,
      email: u.email,
      roleCode: u.role,
      statut: u.statutCode === 'actif' ? 'Actif' : 'Suspendu',
      lastLogin: u.derniereConnexion ? new Date(u.derniereConnexion).toLocaleString('fr-FR') : '—',
    }))
  } catch (e) {
    users.value = []
    usersError.value = e instanceof Error ? e.message : 'Erreur de chargement des utilisateurs'
  } finally {
    usersLoading.value = false
  }
}

const userHeaders = [
  { title: 'Nom', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Rôle', key: 'role' },
  { title: 'Statut', key: 'statut' },
  { title: 'Dernière connexion', key: 'lastLogin' },
  { title: 'Actions', key: 'actions', sortable: false },
]

// ── State ──────────────────────────────────────────────────────────────────
const mainTab = ref('matrix')
const revokeDialog = ref(false)
const revokeTarget = ref<UserRow | null>(null)

const snackbar = ref(false)
const snackMsg = ref('')
const snackColor = ref<'success' | 'error'>('success')

function snack(msg: string, color: 'success' | 'error' = 'success') {
  snackMsg.value = msg
  snackColor.value = color
  snackbar.value = true
}

// ── Journal : alimenté par le journal d'audit réel (GET /audit-logs) ────────
interface JournalItem { id: string | number; action: string; date: string; type: 'grant' | 'revoke' }
const journalRoles = ref<JournalItem[]>([])
const journalLoading = ref(false)

/** Charge les événements d'habilitation réels depuis le journal d'audit. */
async function chargerJournal() {
  journalLoading.value = true
  try {
    const page = await listerAuditLogs({ limit: 50 })
    journalRoles.value = page.items
      .filter(e => /UTILISATEUR|MFA|PIN|ROLE/i.test(e.action))
      .slice(0, 20)
      .map(e => ({
        id: e.id,
        action: `${e.action} — ${e.entite}${e.institution ? ` (${e.institution})` : ''}`,
        date: new Date(e.horodatage).toLocaleString('fr-FR'),
        type: /CREE|RESET|ACTIF/i.test(e.action) ? 'grant' as const : 'revoke' as const,
      }))
  } catch {
    journalRoles.value = []
  } finally {
    journalLoading.value = false
  }
}

onMounted(() => {
  chargerMatrice()
  chargerUtilisateurs()
  chargerJournal()
})

// ── User actions (réelles : PATCH /utilisateurs/:id) ───────────────────────
function revokeUserAccess(item: UserRow) { revokeTarget.value = item; revokeDialog.value = true }
async function confirmRevoke() {
  if (revokeTarget.value) {
    const target = revokeTarget.value
    try {
      await modifierStatutUtilisateur(target.id, 'inactif')
      const u = users.value.find(x => x.id === target.id)
      if (u) u.statut = 'Suspendu'
      snack(`Accès de ${target.name} révoqué`, 'error')
      chargerJournal()
    } catch (e) {
      snack(e instanceof Error ? e.message : 'Échec de la révocation', 'error')
    }
  }
  revokeDialog.value = false
}
async function toggleUserStatus(item: UserRow) {
  const nouveau = item.statut === 'Actif' ? 'inactif' : 'actif'
  try {
    await modifierStatutUtilisateur(item.id, nouveau)
    item.statut = nouveau === 'actif' ? 'Actif' : 'Suspendu'
    snack(`${item.name} ${item.statut === 'Actif' ? 'réactivé' : 'suspendu'}`)
    chargerJournal()
  } catch (e) {
    snack(e instanceof Error ? e.message : 'Échec du changement de statut', 'error')
  }
}

// ── Export CSV de la matrice RÉELLE ─────────────────────────────────────────
function exportMatrix() {
  const lines: string[] = [
    'Matrice RBAC OASE — Export (données réelles GET /admin/rbac/matrice)',
    `Date: ${new Date().toLocaleString('fr-FR')}`,
    '',
    ['Methode', 'Chemin', 'Controleur', 'Methode handler', 'Roles autorises'].join(';'),
  ]
  for (const e of entreesFiltrees.value) {
    lines.push([e.http, e.chemin, e.controleur, e.methode, e.roles.join('|')].join(';'))
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `matrice_rbac_oase_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  snack('Matrice RBAC réelle exportée en CSV')
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
  min-width: 260px;
  padding: 12px;
  text-align: start;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  font-weight: 600;
}
.role-col {
  min-width: 96px;
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
.role-code {
  font-size: 10px;
}
.http-chip {
  font-family: monospace;
  font-weight: 700;
  min-width: 52px;
  justify-content: center;
}
.endpoint-path {
  font-size: 0.8rem;
}
</style>
