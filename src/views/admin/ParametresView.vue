<template>
  <div>
    <PageHeader title="Paramètres généraux & Sécurité" subtitle="Configuration de la politique de sécurité, LDAP, notifications et données de référence" icon="mdi-cog"/>

    <v-tabs v-model="activeTab" color="primary" class="mb-4" bg-color="surface">
      <v-tab value="securite"  prepend-icon="mdi-shield-lock">Sécurité</v-tab>
      <v-tab value="ldap"      prepend-icon="mdi-account-sync">LDAP / AD</v-tab>
      <v-tab value="notif"     prepend-icon="mdi-bell">Notifications</v-tab>
      <v-tab value="inseed"    prepend-icon="mdi-database-import" color="primary">
        Données de référence INSEED
        <v-chip size="x-small" color="warning" variant="tonal" class="ms-2">Mise à jour requise</v-chip>
      </v-tab>
    </v-tabs>

    <v-tabs-window v-model="activeTab">

      <!-- ── Onglet Sécurité ─────────────────────────────────────────────── -->
      <v-tabs-window-item value="securite">
        <v-row>
          <v-col cols="12" md="7">
            <v-card rounded="lg" elevation="1" class="mb-4">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center ga-2">
                <v-icon icon="mdi-shield-lock" color="error" size="18"/>Politique de sécurité
              </v-card-title>
              <v-card-text class="pa-4">
                <v-progress-linear v-if="paramsLoading" indeterminate color="primary" class="mb-3"/>
                <v-alert v-else-if="paramsError" type="error" variant="tonal" density="compact" rounded="lg" class="mb-3">
                  {{ paramsError }}
                </v-alert>
                <v-alert v-else type="success" variant="tonal" density="compact" rounded="lg" class="mb-3">
                  Politique chargée depuis GET /admin/parametres — valeurs réelles, modifiables puis persistées via PUT /admin/parametres.
                </v-alert>
                <v-row>
                  <v-col cols="12" md="6"><v-text-field v-model="sec.sessionDuree" label="Durée de session inactive (min)" type="number" suffix="min" placeholder="Non configuré"/></v-col>
                  <v-col cols="12" md="6"><v-text-field v-model="sec.maxTentatives" label="Tentatives avant verrouillage" type="number" placeholder="Non configuré"/></v-col>
                  <v-col cols="12" md="6"><v-text-field v-model="sec.pwdMinLen" label="Longueur min. mot de passe" type="number" placeholder="Non configuré"/></v-col>
                  <v-col cols="12" md="6"><v-text-field v-model="sec.pwdExpiration" label="Durée validité mot de passe (jours)" type="number" suffix="j" placeholder="Non configuré"/></v-col>
                </v-row>
                <v-divider class="my-3"/>
                <div class="text-caption text-medium-emphasis mb-2">Configuration MFA (réelle — GET /admin/mfa/config)</div>
                <v-progress-linear v-if="mfaLoading" indeterminate color="primary" class="mb-2"/>
                <template v-else-if="mfaConfig">
                  <div class="d-flex flex-wrap ga-2">
                    <v-chip :color="mfaConfig.enabled ? 'success' : 'secondary'" size="small" variant="tonal" :prepend-icon="mfaConfig.enabled ? 'mdi-shield-check' : 'mdi-shield-off-outline'">
                      MFA {{ mfaConfig.enabled ? 'activé' : 'désactivé' }}
                    </v-chip>
                    <v-chip v-for="c in mfaConfig.channels" :key="c" color="primary" size="small" variant="outlined">{{ c }}</v-chip>
                    <v-chip size="small" variant="tonal" color="info">Code valide {{ Math.round(mfaConfig.ttlSeconds / 60) }} min</v-chip>
                    <v-chip size="small" variant="tonal" color="warning">{{ mfaConfig.maxAttempts }} tentatives max</v-chip>
                  </div>
                </template>
                <div v-else class="text-caption text-medium-emphasis">Configuration MFA indisponible.</div>
              </v-card-text>
            </v-card>
            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Paramètres régionaux</v-card-title>
              <v-card-text class="pa-4">
                <v-row>
                  <v-col cols="4"><v-text-field model-value="FCFA" label="Devise" readonly/></v-col>
                  <v-col cols="4"><v-text-field model-value="UTC+0" label="Fuseau horaire" readonly/></v-col>
                  <v-col cols="4"><v-select model-value="DD/MM/YYYY" :items="['DD/MM/YYYY','YYYY-MM-DD']" label="Format date"/></v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="5">
            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Gabarits de documents</v-card-title>
              <!-- TODO(endpoint): pas d'endpoint de gabarits documentaires dans l'API v1. -->
              <div v-if="gabarits.length === 0" class="text-center pa-6 text-medium-emphasis">
                <v-icon icon="mdi-file-document-outline" size="36" class="mb-2 opacity-40"/>
                <div class="text-body-2">Aucun gabarit configuré.</div>
                <div class="text-caption">Les gabarits seront listés ici dès que l'endpoint correspondant existera.</div>
              </div>
              <v-list v-else density="compact" class="pa-2">
                <v-list-item v-for="g in gabarits" :key="g.id" :subtitle="g.derniereModif" prepend-icon="mdi-file-document" rounded="lg" class="mb-1">
                  <template #title><span class="text-body-2">{{ g.label }}</span></template>
                  <template #append><v-btn icon="mdi-pencil" size="x-small" variant="text" color="primary"/></template>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </v-tabs-window-item>

      <!-- ── Onglet LDAP ─────────────────────────────────────────────────── -->
      <v-tabs-window-item value="ldap">
        <v-row>
          <v-col cols="12" md="7">
            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center ga-2">
                <v-icon icon="mdi-account-sync" color="primary" size="18"/>Annuaire LDAP / Active Directory
              </v-card-title>
              <v-card-text class="pa-4">
                <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mb-3">
                  Annuaire non configuré — l'API v1 n'expose pas de configuration LDAP/AD.
                </v-alert>
                <v-row>
                  <v-col cols="12" md="8"><v-text-field v-model="ldap.host" label="Hôte LDAP" prepend-inner-icon="mdi-server" placeholder="Non configuré"/></v-col>
                  <v-col cols="12" md="4"><v-text-field v-model="ldap.port" label="Port" type="number" placeholder="—"/></v-col>
                  <v-col cols="12" md="6"><v-text-field v-model="ldap.baseDn" label="Base DN" placeholder="Non configuré"/></v-col>
                  <v-col cols="12" md="6"><v-text-field v-model="ldap.bindUser" label="Compte de liaison" placeholder="Non configuré"/></v-col>
                </v-row>
                <div class="d-flex ga-2 mt-2">
                  <v-btn size="small" variant="tonal" color="info" prepend-icon="mdi-connection" disabled>Tester la connexion</v-btn>
                  <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-sync" disabled>Synchroniser maintenant</v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-tabs-window-item>

      <!-- ── Onglet Notifications ────────────────────────────────────────── -->
      <v-tabs-window-item value="notif">
        <v-row>
          <v-col cols="12" md="5">
            <v-card rounded="lg" elevation="1" class="mb-4">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Canaux de notification</v-card-title>
              <v-card-text class="pa-4">
                <v-switch :model-value="notif.email" :label="`E-mail (${notif.email ? 'SMTP configuré' : 'non configuré'})`" color="success" hide-details class="mb-2" readonly/>
                <v-switch :model-value="notif.sms" :label="`SMS (${notif.sms ? `fournisseur : ${notif.smsSender}` : 'non configuré'})`" color="success" hide-details class="mb-2" readonly/>
                <v-switch v-model="notif.inapp" label="Notification in-app (canal natif actif)" color="success" hide-details readonly/>
                <v-switch :model-value="notif.whatsapp" :label="`WhatsApp (${notif.whatsapp ? 'activé' : 'désactivé'})`" color="success" hide-details class="mt-2" readonly/>
                <div class="text-caption text-medium-emphasis mt-2">
                  États réels dérivés de GET /admin/parametres (clés smtp.*, sms.*, whatsapp.*). Le canal in-app est instrumenté via GET /notifications.
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-tabs-window-item>

      <!-- ── Onglet INSEED ────────────────────────────────────────────────── -->
      <v-tabs-window-item value="inseed">
        <!-- Header info -->
        <v-alert type="info" variant="tonal" rounded="lg" class="mb-4" icon="mdi-information-outline">
          <div class="text-body-2 font-weight-semibold mb-1">Données de référence économique — Méthode Revenue Foregone</div>
          <div class="text-body-2">Ces paramètres alimentent directement le moteur de simulation fiscale (<strong>/decideur/simulation</strong>).
          Ils doivent être mis à jour annuellement à partir des <strong>Comptes Nationaux INSEED</strong> et des données OIT/Togo.
          Toute modification est tracée dans le journal d'audit.</div>
        </v-alert>

        <!-- Métadonnées de la source -->
        <v-row class="mb-4">
          <v-col cols="12" md="3">
            <v-card rounded="lg" elevation="1" class="pa-4">
              <div class="text-caption text-medium-emphasis mb-1">Année de référence</div>
              <div class="text-h5 font-weight-bold text-primary">{{ inseedMeta.anneeRef }}</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card rounded="lg" elevation="1" class="pa-4">
              <div class="text-caption text-medium-emphasis mb-1">Dernier import</div>
              <div class="text-body-1 font-weight-semibold">{{ inseedMeta.dateImport }}</div>
              <div class="text-caption text-medium-emphasis">{{ inseedMeta.importePar }}</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card rounded="lg" elevation="1" class="pa-4">
              <div class="text-caption text-medium-emphasis mb-1">PIB Togo total (Mds FCFA)</div>
              <v-text-field
                v-model.number="pibTogo"
                density="compact"
                hide-details
                type="number"
                suffix="Mds FCFA"
                variant="underlined"
              />
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card rounded="lg" elevation="1" class="pa-4">
              <div class="text-caption text-medium-emphasis mb-1">Source déclarée</div>
              <div class="text-body-2 font-weight-semibold">{{ inseedMeta.source }}</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Table éditable des paramètres sectoriels -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-0 d-flex align-center justify-space-between">
            <span class="text-body-1 font-weight-semibold">Multiplicateurs sectoriels INSEED (réels — GET /referentiels/inseed)</span>
            <div class="d-flex ga-2">
              <v-btn size="small" variant="tonal" color="secondary" prepend-icon="mdi-plus" @click="addSecteurDialog = true">
                Ajouter un secteur
              </v-btn>
              <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-upload" @click="importDialog = true">
                Importer CSV
              </v-btn>
              <v-btn size="small" color="primary" prepend-icon="mdi-content-save" :loading="savingInseed" @click="saveInseed">
                Enregistrer
              </v-btn>
            </div>
          </v-card-title>
          <v-progress-linear v-if="inseedLoading" indeterminate color="primary"/>
          <v-alert v-else-if="inseedError" type="error" variant="tonal" density="compact" rounded="lg" class="ma-3">
            {{ inseedError }}
          </v-alert>
          <v-card-text class="pa-0" v-else>
            <v-table density="comfortable" hover>
              <thead>
                <tr style="background:#F4F6F9">
                  <th class="text-left text-caption font-weight-semibold py-2 px-4">Secteur</th>
                  <th class="text-right text-caption font-weight-semibold py-2 px-4">
                    Mult. PIB (k.)
                    <v-tooltip text="Multiplicateur keynésien sur le PIB — clé inseed.multiplicateurs_sectoriels" location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" icon="mdi-information-outline" size="13" class="ms-1 opacity-60"/></template>
                    </v-tooltip>
                  </th>
                  <th class="text-center text-caption font-weight-semibold py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in inseedSecteurs" :key="row.secteur">
                  <td class="px-4 py-2">
                    <span class="text-body-2 font-weight-medium">{{ row.secteur }}</span>
                  </td>
                  <!-- pibMult -->
                  <td class="px-4 py-2 text-right">
                    <v-text-field
                      v-if="editingIdx === idx"
                      v-model.number="row.pibMult"
                      density="compact"
                      hide-details
                      type="number"
                      step="0.1"
                      style="width:90px;display:inline-flex"
                      variant="outlined"
                    />
                    <span v-else class="text-body-2">{{ row.pibMult }}</span>
                  </td>
                  <!-- Actions -->
                  <td class="px-4 py-2 text-center">
                    <div v-if="editingIdx === idx" class="d-flex justify-center ga-1">
                      <v-btn size="x-small" icon="mdi-check" color="success" variant="tonal" @click="saveRow(idx)"/>
                      <v-btn size="x-small" icon="mdi-close" color="error" variant="tonal" @click="editingIdx = null"/>
                    </div>
                    <div v-else class="d-flex justify-center ga-1">
                      <v-btn size="x-small" icon="mdi-pencil" color="primary" variant="text" @click="editingIdx = idx"/>
                      <v-btn size="x-small" icon="mdi-delete" color="error" variant="text" @click="inseedSecteurs.splice(idx, 1)"/>
                    </div>
                  </td>
                </tr>
                <tr v-if="inseedSecteurs.length === 0">
                  <td colspan="3" class="px-4 py-6 text-center text-medium-emphasis text-caption">
                    Aucun multiplicateur sectoriel configuré (clé inseed.multiplicateurs_sectoriels vide).
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <!-- Format CSV attendu -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center ga-2">
            <v-icon icon="mdi-file-delimited" color="success" size="18"/>
            Format d'import CSV attendu
          </v-card-title>
          <v-card-text class="pa-4">
            <div class="text-caption text-medium-emphasis mb-2">
              Encodage UTF-8 · Séparateur virgule · En-têtes obligatoires sur la première ligne
            </div>
            <pre class="csv-preview pa-3 rounded-lg">{{ CSV_FORMAT_EXAMPLE }}</pre>
            <div class="d-flex align-center ga-2 mt-3">
              <v-chip size="x-small" color="success" variant="tonal" prepend-icon="mdi-check">secteur</v-chip>
              <v-chip size="x-small" color="success" variant="tonal" prepend-icon="mdi-check">pib_mult</v-chip>
            </div>
          </v-card-text>
        </v-card>

        <!-- Journal des mises à jour -->
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center ga-2">
            <v-icon icon="mdi-history" color="secondary" size="18"/>
            Journal des mises à jour INSEED
          </v-card-title>
          <v-list v-if="inseedLogs.length" density="compact" class="pa-2">
            <v-list-item
              v-for="log in inseedLogs"
              :key="log.id"
              :subtitle="`${log.date} · ${log.auteur}`"
              rounded="lg"
              class="mb-1"
            >
              <template #prepend>
                <v-avatar :color="log.type === 'import' ? 'success' : 'warning'" size="30" variant="tonal">
                  <v-icon :icon="log.type === 'import' ? 'mdi-upload' : 'mdi-pencil'" size="15"/>
                </v-avatar>
              </template>
              <template #title>
                <span class="text-body-2 font-weight-medium">{{ log.action }}</span>
              </template>
              <template #append>
                <v-chip size="x-small" :color="log.type === 'import' ? 'success' : 'warning'" variant="tonal">
                  {{ log.type === 'import' ? 'Import CSV' : 'Édition manuelle' }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
          <!-- TODO(endpoint): historique persistant des mises à jour INSEED non exposé par l'API v1. -->
          <div v-else class="text-center pa-6 text-medium-emphasis">
            <v-icon icon="mdi-history" size="36" class="mb-2 opacity-40"/>
            <div class="text-body-2">Aucune mise à jour enregistrée dans cette session.</div>
            <div class="text-caption">L'historique persistant sera disponible avec un endpoint dédié.</div>
          </div>
        </v-card>
      </v-tabs-window-item>

    </v-tabs-window>

    <!-- Bouton Enregistrer global -->
    <div class="d-flex justify-end mt-4" v-if="activeTab !== 'inseed'">
      <v-btn color="primary" size="large" prepend-icon="mdi-content-save" :loading="savingParams" @click="saveParametres">
        Enregistrer les paramètres
      </v-btn>
    </div>

    <!-- ── Dialog Import CSV ─────────────────────────────────────────────── -->
    <v-dialog v-model="importDialog" max-width="560">
      <v-card rounded="xl">
        <v-card-title class="pa-5 d-flex align-center ga-2">
          <v-icon icon="mdi-upload" color="primary"/>
          Importer les données INSEED (CSV)
        </v-card-title>
        <v-card-text class="pa-5">
          <!-- TODO(endpoint): pas d'endpoint d'import INSEED dans l'API v1 — import désactivé. -->
          <v-alert type="warning" variant="tonal" rounded="lg" class="mb-4" density="compact">
            L'import CSV est désactivé : l'API v1 n'expose pas encore d'endpoint d'import des
            multiplicateurs INSEED. Cette fonctionnalité sera activée avec l'endpoint dédié (vague B).
          </v-alert>
          <v-row>
            <v-col cols="6">
              <v-text-field v-model="importMeta.source" label="Source (ex: Comptes Nationaux INSEED)" prepend-inner-icon="mdi-book-open" disabled/>
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="importMeta.annee" label="Année de référence" type="number" prepend-inner-icon="mdi-calendar" disabled/>
            </v-col>
          </v-row>
          <!-- Zone de dépôt désactivée -->
          <div
            class="import-drop-zone d-flex flex-column align-center justify-center pa-6 rounded-lg mt-2"
            style="border:2px dashed #CBD5E1;background:#F8FAFC;min-height:120px;opacity:0.55;cursor:not-allowed"
          >
            <v-icon icon="mdi-file-upload-outline" size="36" color="secondary" class="mb-2"/>
            <div class="text-body-2 font-weight-semibold text-medium-emphasis mb-1">Dépôt de fichier indisponible</div>
            <div class="text-caption text-medium-emphasis">en attente de l'endpoint d'import backend</div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="importDialog=false">Fermer</v-btn>
          <v-btn color="primary" disabled prepend-icon="mdi-check" @click="confirmImport">
            Confirmer l'import
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Dialog Ajouter secteur ────────────────────────────────────────── -->
    <v-dialog v-model="addSecteurDialog" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="pa-5">Ajouter un nouveau secteur</v-card-title>
        <v-card-text class="pa-5">
          <v-row>
            <v-col cols="12"><v-text-field v-model="newSecteur.secteur" label="Nom du secteur"/></v-col>
            <v-col cols="6"><v-text-field v-model.number="newSecteur.pibMult" label="Multiplicateur PIB" type="number" step="0.1"/></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="addSecteurDialog=false">Annuler</v-btn>
          <v-btn color="primary" @click="addSecteur">Ajouter</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar confirmation -->
    <v-snackbar v-model="snack" color="success" timeout="3000" location="bottom right">
      <v-icon icon="mdi-check-circle" class="me-2"/>{{ snackMsg }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import {
  getMfaConfig,
  getParametres,
  majParametres,
  getInseed,
  majInseed,
  type MfaConfig,
} from '../../services/admin'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const currentUserName = computed(() => {
  const u = auth.user
  return u ? `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || u.email : 'Administrateur'
})

const activeTab = ref('securite')
const editingIdx = ref<number | null>(null)
const importDialog = ref(false)
const addSecteurDialog = ref(false)
const snack = ref(false)
const snackMsg = ref('')

// ── Paramètres plateforme (GET /admin/parametres) ───────────────────────────
const paramsLoading = ref(false)
const paramsError = ref<string | null>(null)
const savingParams = ref(false)

// Politique de sécurité — valeurs réelles (clés securite.* de system_config).
const sec = ref({
  sessionDuree: null as number | null,
  maxTentatives: null as number | null,
  pwdMinLen: null as number | null,
  pwdExpiration: null as number | null,
})

// Configuration MFA réelle (GET /admin/mfa/config).
const mfaConfig = ref<MfaConfig | null>(null)
const mfaLoading = ref(false)

// ── LDAP ──────────────────────────────────────────────────────────────────
// TODO(endpoint): pas d'endpoint de configuration LDAP dans l'API v1 — non configuré.
const ldap = ref({ host: '', port: null as number | null, baseDn: '', bindUser: '' })

// ── Notifications ─────────────────────────────────────────────────────────
// États dérivés des clés réelles smtp.* / sms.* / whatsapp.* (GET /admin/parametres).
const notif = ref({ email: false, sms: false, inapp: true, whatsapp: false, smsSender: '' })

// ── Gabarits ──────────────────────────────────────────────────────────────
// TODO(endpoint): pas d'endpoint de gabarits documentaires dans l'API v1 — liste vide.
const gabarits = ref<{ id: number; label: string; derniereModif: string }[]>([])

/** Charge la politique de sécurité et les canaux depuis GET /admin/parametres. */
async function chargerParametres() {
  paramsLoading.value = true
  paramsError.value = null
  try {
    const p = await getParametres()
    const num = (v: string | undefined) => (v != null && v !== '' && !isNaN(Number(v)) ? Number(v) : null)
    sec.value = {
      sessionDuree: num(p['securite.session.duree_minutes']),
      maxTentatives: num(p['securite.verrouillage.tentatives_max']),
      pwdMinLen: num(p['securite.mdp.longueur_min']),
      pwdExpiration: num(p['securite.mdp.expiration_jours']),
    }
    notif.value = {
      email: Boolean(p['smtp.host']),
      sms: Boolean(p['sms.provider']),
      inapp: true,
      whatsapp: p['whatsapp.enabled'] === 'true',
      smsSender: p['sms.provider'] ?? '',
    }
  } catch (e) {
    paramsError.value = e instanceof Error ? e.message : 'Impossible de charger les paramètres (GET /admin/parametres)'
  } finally {
    paramsLoading.value = false
  }
}

/** Persiste la politique de sécurité via PUT /admin/parametres. */
async function saveParametres() {
  savingParams.value = true
  try {
    await majParametres({
      'securite.session.duree_minutes': String(sec.value.sessionDuree ?? ''),
      'securite.verrouillage.tentatives_max': String(sec.value.maxTentatives ?? ''),
      'securite.mdp.longueur_min': String(sec.value.pwdMinLen ?? ''),
      'securite.mdp.expiration_jours': String(sec.value.pwdExpiration ?? ''),
    })
    snackMsg.value = 'Paramètres enregistrés (PUT /admin/parametres)'
    snack.value = true
  } catch (e) {
    snackMsg.value = e instanceof Error ? `Échec : ${e.message}` : 'Échec de l\'enregistrement'
    snack.value = true
  } finally {
    savingParams.value = false
  }
}

// ── INSEED — données réelles (GET /referentiels/inseed) ─────────────────────
interface InseedSecteur { secteur: string; pibMult: number }
const pibTogo = ref<number | null>(null)
const inseedMeta = reactive({ anneeRef: '—', dateImport: '—', source: '—', importePar: '', version: '' })
const inseedSecteurs = ref<InseedSecteur[]>([])
const inseedLoading = ref(false)
const inseedError = ref<string | null>(null)
const savingInseed = ref(false)

const CSV_FORMAT_EXAMPLE = `secteur,pib_mult
"industrie",1.8
"agriculture",1.2
"mines",2.1`

/** Charge le référentiel INSEED réel. */
async function chargerInseed() {
  inseedLoading.value = true
  inseedError.value = null
  try {
    const data = await getInseed()
    pibTogo.value = data['inseed.pib_milliards_fcfa'] ? Number(data['inseed.pib_milliards_fcfa']) : null
    inseedMeta.anneeRef = data['inseed.annee_reference'] || '—'
    try {
      const meta = JSON.parse(data['inseed.meta_import'] || '{}')
      inseedMeta.source = meta.source || '—'
      inseedMeta.dateImport = meta.dateImport
        ? new Date(meta.dateImport).toLocaleDateString('fr-FR')
        : 'Jamais importé'
      inseedMeta.importePar = meta.importePar || ''
      inseedMeta.version = meta.version || ''
    } catch { /* meta illisible : valeurs par défaut */ }
    try {
      const mults = JSON.parse(data['inseed.multiplicateurs_sectoriels'] || '{}')
      inseedSecteurs.value = Object.entries(mults).map(([secteur, pibMult]) => ({
        secteur,
        pibMult: Number(pibMult),
      }))
    } catch {
      inseedSecteurs.value = []
    }
  } catch (e) {
    inseedError.value = e instanceof Error ? e.message : 'Impossible de charger le référentiel INSEED'
  } finally {
    inseedLoading.value = false
  }
}

/** Persiste PIB + multiplicateurs via PUT /referentiels/inseed. */
async function saveInseed() {
  savingInseed.value = true
  try {
    const mults = Object.fromEntries(inseedSecteurs.value.map(s => [s.secteur, s.pibMult]))
    await majInseed({
      'inseed.pib_milliards_fcfa': String(pibTogo.value ?? ''),
      'inseed.annee_reference': inseedMeta.anneeRef,
      'inseed.multiplicateurs_sectoriels': JSON.stringify(mults),
      'inseed.meta_import': JSON.stringify({
        source: inseedMeta.source,
        dateImport: new Date().toISOString(),
        version: inseedMeta.version || '1.0',
        importePar: currentUserName.value,
      }),
    })
    inseedMeta.dateImport = new Date().toLocaleDateString('fr-FR')
    inseedMeta.importePar = currentUserName.value
    snackMsg.value = 'Référentiel INSEED enregistré (PUT /referentiels/inseed)'
    snack.value = true
    inseedLogs.value.unshift({
      id: Date.now(),
      type: 'edit',
      action: 'Édition manuelle — PIB et/ou multiplicateurs sectoriels mis à jour (persisté)',
      date: new Date().toLocaleDateString('fr-FR'),
      auteur: currentUserName.value,
    })
  } catch (e) {
    snackMsg.value = e instanceof Error ? `Échec : ${e.message}` : 'Échec de l\'enregistrement INSEED'
    snack.value = true
  } finally {
    savingInseed.value = false
  }
}

// ── INSEED — import & ajout ───────────────────────────────────────────────
const importMeta = reactive({ source: 'Comptes Nationaux INSEED', annee: new Date().getFullYear() })

const newSecteur = reactive({ secteur: '', pibMult: 1.0 })

// Journal INSEED : alimenté uniquement par les actions réelles de l'utilisateur
// courant dans cette session (pas d'historique fictif).
// TODO(endpoint): historique des imports INSEED à exposer côté backend (vague B).
interface InseedLog { id: number; type: 'import' | 'edit'; action: string; date: string; auteur: string }
const inseedLogs = ref<InseedLog[]>([])

function saveRow(idx: number) {
  editingIdx.value = null
  snackMsg.value = `Multiplicateur « ${inseedSecteurs.value[idx].secteur} » modifié — cliquez sur « Enregistrer » pour persister (PUT /referentiels/inseed).`
  snack.value = true
}

function confirmImport() {
  // Import réel désactivé : pas d'endpoint d'import CSV INSEED dans l'API v1.
  importDialog.value = false
}

function addSecteur() {
  if (!newSecteur.secteur.trim()) return
  inseedSecteurs.value.push({ ...newSecteur })
  addSecteurDialog.value = false
  snackMsg.value = `Secteur « ${newSecteur.secteur} » ajouté — cliquez sur « Enregistrer » pour persister.`
  snack.value = true
  Object.assign(newSecteur, { secteur: '', pibMult: 1.0 })
}

onMounted(async () => {
  mfaLoading.value = true
  try {
    mfaConfig.value = await getMfaConfig()
  } catch {
    mfaConfig.value = null
  } finally {
    mfaLoading.value = false
  }
  chargerParametres()
  chargerInseed()
})
</script>

<style scoped>
.csv-preview {
  font-family: 'Courier New', monospace;
  font-size: 0.78rem;
  background: #1E293B;
  color: #86EFAC;
  overflow-x: auto;
  white-space: pre;
}
</style>
