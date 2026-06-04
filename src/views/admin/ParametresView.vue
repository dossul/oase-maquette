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
                <v-row>
                  <v-col cols="12" md="6"><v-text-field v-model="sec.sessionDuree" label="Durée de session inactive (min)" type="number" suffix="min"/></v-col>
                  <v-col cols="12" md="6"><v-text-field v-model="sec.maxTentatives" label="Tentatives avant verrouillage" type="number"/></v-col>
                  <v-col cols="12" md="6"><v-text-field v-model="sec.pwdMinLen" label="Longueur min. mot de passe" type="number"/></v-col>
                  <v-col cols="12" md="6"><v-text-field v-model="sec.pwdExpiration" label="Durée validité mot de passe (jours)" type="number" suffix="j"/></v-col>
                </v-row>
                <div class="text-caption text-medium-emphasis mb-2 mt-2">MFA obligatoire par rôle</div>
                <div class="d-flex flex-wrap ga-2">
                  <v-chip v-for="r in sec.mfaRoles" :key="r" color="error" size="small" variant="tonal" closable>{{ r }}</v-chip>
                  <v-btn size="x-small" variant="tonal" prepend-icon="mdi-plus">Ajouter</v-btn>
                </div>
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
              <v-list density="compact" class="pa-2">
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
                <v-row>
                  <v-col cols="12" md="8"><v-text-field v-model="ldap.host" label="Hôte LDAP" prepend-inner-icon="mdi-server"/></v-col>
                  <v-col cols="12" md="4"><v-text-field v-model="ldap.port" label="Port" type="number"/></v-col>
                  <v-col cols="12" md="6"><v-text-field v-model="ldap.baseDn" label="Base DN"/></v-col>
                  <v-col cols="12" md="6"><v-text-field v-model="ldap.bindUser" label="Compte de liaison"/></v-col>
                </v-row>
                <div class="d-flex ga-2 mt-2">
                  <v-btn size="small" variant="tonal" color="info" prepend-icon="mdi-connection">Tester la connexion</v-btn>
                  <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-sync">Synchroniser maintenant</v-btn>
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
                <v-switch v-model="notif.email" label="E-mail" color="success" hide-details class="mb-2"/>
                <v-switch v-model="notif.sms" label="SMS" color="success" hide-details class="mb-2"/>
                <v-switch v-model="notif.inapp" label="Notification in-app" color="success" hide-details/>
                <v-text-field v-model="notif.smsSender" label="Identifiant expéditeur SMS" class="mt-3"/>
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
            <span class="text-body-1 font-weight-semibold">Multiplicateurs sectoriels INSEED / OIT</span>
            <div class="d-flex ga-2">
              <v-btn size="small" variant="tonal" color="secondary" prepend-icon="mdi-plus" @click="addSecteurDialog = true">
                Ajouter un secteur
              </v-btn>
              <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-upload" @click="importDialog = true">
                Importer CSV
              </v-btn>
            </div>
          </v-card-title>
          <v-card-text class="pa-0">
            <v-table density="comfortable" hover>
              <thead>
                <tr style="background:#F4F6F9">
                  <th class="text-left text-caption font-weight-semibold py-2 px-4">Secteur</th>
                  <th class="text-right text-caption font-weight-semibold py-2 px-4">
                    PIB sectoriel (Mds FCFA)
                    <v-tooltip text="Source : Comptes Nationaux INSEED" location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" icon="mdi-information-outline" size="13" class="ms-1 opacity-60"/></template>
                    </v-tooltip>
                  </th>
                  <th class="text-right text-caption font-weight-semibold py-2 px-4">
                    Emplois / Mds FCFA
                    <v-tooltip text="Multiplicateur d'emplois directs créés par Mds FCFA exonéré — Source OIT/Togo" location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" icon="mdi-information-outline" size="13" class="ms-1 opacity-60"/></template>
                    </v-tooltip>
                  </th>
                  <th class="text-right text-caption font-weight-semibold py-2 px-4">
                    Mult. PIB (k.)
                    <v-tooltip text="Multiplicateur keynésien sur le PIB" location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" icon="mdi-information-outline" size="13" class="ms-1 opacity-60"/></template>
                    </v-tooltip>
                  </th>
                  <th class="text-right text-caption font-weight-semibold py-2 px-4">
                    Mult. bénéfice
                    <v-tooltip text="Multiplicateur bénéfice socio-économique global" location="top">
                      <template #activator="{ props }"><v-icon v-bind="props" icon="mdi-information-outline" size="13" class="ms-1 opacity-60"/></template>
                    </v-tooltip>
                  </th>
                  <th class="text-center text-caption font-weight-semibold py-2 px-4">Année réf.</th>
                  <th class="text-center text-caption font-weight-semibold py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in secteurParamsList" :key="row.secteur">
                  <td class="px-4 py-2">
                    <span class="text-body-2 font-weight-medium">{{ row.secteur }}</span>
                  </td>
                  <!-- PIB sectoriel -->
                  <td class="px-4 py-2 text-right">
                    <v-text-field
                      v-if="editingIdx === idx"
                      v-model.number="row.pibSectorielMds"
                      density="compact"
                      hide-details
                      type="number"
                      suffix="Mds"
                      style="width:120px;display:inline-flex"
                      variant="outlined"
                    />
                    <span v-else class="text-body-2">{{ row.pibSectorielMds.toLocaleString('fr-FR') }}</span>
                  </td>
                  <!-- emploiMult -->
                  <td class="px-4 py-2 text-right">
                    <v-text-field
                      v-if="editingIdx === idx"
                      v-model.number="row.emploiMult"
                      density="compact"
                      hide-details
                      type="number"
                      style="width:110px;display:inline-flex"
                      variant="outlined"
                    />
                    <span v-else class="text-body-2">{{ row.emploiMult.toLocaleString('fr-FR') }}</span>
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
                  <!-- beneficeMult -->
                  <td class="px-4 py-2 text-right">
                    <v-text-field
                      v-if="editingIdx === idx"
                      v-model.number="row.beneficeMult"
                      density="compact"
                      hide-details
                      type="number"
                      step="0.1"
                      style="width:90px;display:inline-flex"
                      variant="outlined"
                    />
                    <span v-else class="text-body-2">{{ row.beneficeMult }}</span>
                  </td>
                  <!-- anneeRef -->
                  <td class="px-4 py-2 text-center">
                    <v-text-field
                      v-if="editingIdx === idx"
                      v-model.number="row.anneeRef"
                      density="compact"
                      hide-details
                      type="number"
                      style="width:80px;display:inline-flex"
                      variant="outlined"
                    />
                    <v-chip v-else size="x-small" variant="tonal" color="secondary">{{ row.anneeRef }}</v-chip>
                  </td>
                  <!-- Actions -->
                  <td class="px-4 py-2 text-center">
                    <div v-if="editingIdx === idx" class="d-flex justify-center ga-1">
                      <v-btn size="x-small" icon="mdi-check" color="success" variant="tonal" @click="saveRow(idx)"/>
                      <v-btn size="x-small" icon="mdi-close" color="error" variant="tonal" @click="editingIdx = null"/>
                    </div>
                    <v-btn v-else size="x-small" icon="mdi-pencil" color="primary" variant="text" @click="editingIdx = idx"/>
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
              <v-chip size="x-small" color="success" variant="tonal" prepend-icon="mdi-check">pib_sectoriel_mds</v-chip>
              <v-chip size="x-small" color="success" variant="tonal" prepend-icon="mdi-check">emploi_mult</v-chip>
              <v-chip size="x-small" color="success" variant="tonal" prepend-icon="mdi-check">pib_mult</v-chip>
              <v-chip size="x-small" color="success" variant="tonal" prepend-icon="mdi-check">benefice_mult</v-chip>
              <v-chip size="x-small" color="success" variant="tonal" prepend-icon="mdi-check">annee_ref</v-chip>
            </div>
          </v-card-text>
        </v-card>

        <!-- Journal des mises à jour -->
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center ga-2">
            <v-icon icon="mdi-history" color="secondary" size="18"/>
            Journal des mises à jour INSEED
          </v-card-title>
          <v-list density="compact" class="pa-2">
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
        </v-card>
      </v-tabs-window-item>

    </v-tabs-window>

    <!-- Bouton Enregistrer global -->
    <div class="d-flex justify-end mt-4" v-if="activeTab !== 'inseed'">
      <v-btn color="primary" size="large" prepend-icon="mdi-content-save">Enregistrer les paramètres</v-btn>
    </div>

    <!-- ── Dialog Import CSV ─────────────────────────────────────────────── -->
    <v-dialog v-model="importDialog" max-width="560">
      <v-card rounded="xl">
        <v-card-title class="pa-5 d-flex align-center ga-2">
          <v-icon icon="mdi-upload" color="primary"/>
          Importer les données INSEED (CSV)
        </v-card-title>
        <v-card-text class="pa-5">
          <v-alert type="warning" variant="tonal" rounded="lg" class="mb-4" density="compact">
            L'import remplacera les multiplicateurs existants pour les secteurs présents dans le fichier.
            Les secteurs absents ne sont pas modifiés.
          </v-alert>
          <v-row>
            <v-col cols="6">
              <v-text-field v-model="importMeta.source" label="Source (ex: Comptes Nationaux INSEED)" prepend-inner-icon="mdi-book-open"/>
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="importMeta.annee" label="Année de référence" type="number" prepend-inner-icon="mdi-calendar"/>
            </v-col>
          </v-row>
          <!-- Zone de dépôt fictive -->
          <div
            class="import-drop-zone d-flex flex-column align-center justify-center pa-6 rounded-lg mt-2"
            style="border:2px dashed #CBD5E1;background:#F8FAFC;min-height:120px;cursor:pointer"
            @click="simulateImport"
          >
            <v-icon icon="mdi-file-upload" size="36" color="primary" class="mb-2"/>
            <div class="text-body-2 font-weight-semibold text-primary mb-1">Cliquez pour sélectionner un fichier CSV</div>
            <div class="text-caption text-medium-emphasis">ou glissez-déposez ici · max 2 Mo · UTF-8</div>
          </div>
          <div v-if="importSimulated" class="mt-3">
            <v-alert type="success" variant="tonal" rounded="lg" density="compact" icon="mdi-check-circle">
              <strong>inseed_2025_multiplicateurs.csv</strong> — 6 secteurs lus, 6 mis à jour, 0 erreurs.
            </v-alert>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="importDialog=false;importSimulated=false">Annuler</v-btn>
          <v-btn color="primary" :disabled="!importSimulated" prepend-icon="mdi-check" @click="confirmImport">
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
            <v-col cols="6"><v-text-field v-model.number="newSecteur.pibSectorielMds" label="PIB sectoriel (Mds FCFA)" type="number"/></v-col>
            <v-col cols="6"><v-text-field v-model.number="newSecteur.emploiMult" label="Emplois / Mds FCFA" type="number"/></v-col>
            <v-col cols="6"><v-text-field v-model.number="newSecteur.pibMult" label="Multiplicateur PIB" type="number" step="0.1"/></v-col>
            <v-col cols="6"><v-text-field v-model.number="newSecteur.beneficeMult" label="Multiplicateur bénéfice" type="number" step="0.1"/></v-col>
            <v-col cols="6"><v-text-field v-model.number="newSecteur.anneeRef" label="Année de référence" type="number"/></v-col>
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
import { ref, reactive } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import { secteurParamsList, pibTogo, inseedMeta, CSV_FORMAT_EXAMPLE } from '../../composables/useRefParams'

const activeTab = ref('securite')
const editingIdx = ref<number | null>(null)
const importDialog = ref(false)
const addSecteurDialog = ref(false)
const importSimulated = ref(false)
const snack = ref(false)
const snackMsg = ref('')

// ── Sécurité ──────────────────────────────────────────────────────────────
const sec = ref({
  sessionDuree: 30, maxTentatives: 5, pwdMinLen: 12, pwdExpiration: 90,
  mfaRoles: ['Agent OTR','Agent DGBF','Décideur','Auditeur','Admin'],
})

// ── LDAP ──────────────────────────────────────────────────────────────────
const ldap = ref({ host: 'ldap.mef.tg', port: 636, baseDn: 'dc=mef,dc=tg', bindUser: 'cn=oase-ldap,dc=mef,dc=tg' })

// ── Notifications ─────────────────────────────────────────────────────────
const notif = ref({ email: true, sms: true, inapp: true, smsSender: 'OASE-MEF' })

// ── Gabarits ──────────────────────────────────────────────────────────────
const gabarits = [
  { id: 1, label: "Attestation d'exonération",          derniereModif: 'Modifié: 01/03/2026' },
  { id: 2, label: 'Arrêté ministériel',                 derniereModif: 'Modifié: 15/01/2026' },
  { id: 3, label: 'Lettre de rejet',                    derniereModif: 'Modifié: 01/03/2026' },
  { id: 4, label: 'Lettre de demande de complément',    derniereModif: 'Modifié: 01/02/2026' },
  { id: 5, label: 'Notification de convention OTR',     derniereModif: 'Modifié: 10/04/2026' },
]

// ── INSEED — import & ajout ───────────────────────────────────────────────
const importMeta = reactive({ source: 'Comptes Nationaux INSEED', annee: 2025 })

const newSecteur = reactive({
  secteur: '', pibSectorielMds: 0, emploiMult: 0, pibMult: 1.0, beneficeMult: 1.0, anneeRef: 2025,
})

const inseedLogs = [
  { id: 1, type: 'import', action: 'Import CSV — inseed_2025_multiplicateurs.csv (6 secteurs)',  date: '2025-12-31', auteur: 'P. TCHALLA (UPF/MEF)' },
  { id: 2, type: 'edit',   action: "Édition manuelle — Numérique : emploiMult 1400 → 1500",      date: '2026-02-14', auteur: 'L. TOGBUI (DSI/MEF)' },
  { id: 3, type: 'edit',   action: 'Édition manuelle — PIB Togo total : 5900 → 6000 Mds FCFA',  date: '2026-03-01', auteur: 'P. TCHALLA (UPF/MEF)' },
]

function saveRow(idx: number) {
  editingIdx.value = null
  snackMsg.value = `Multiplicateurs « ${secteurParamsList[idx].secteur} » mis à jour et tracés dans le journal.`
  snack.value = true
  // Tracer dans le journal (mock)
  inseedLogs.unshift({
    id: Date.now(),
    type: 'edit',
    action: `Édition manuelle — ${secteurParamsList[idx].secteur} : paramètres mis à jour`,
    date: new Date().toLocaleDateString('fr-FR'),
    auteur: 'L. TOGBUI (DSI/MEF)',
  })
}

function simulateImport() {
  importSimulated.value = true
}

function confirmImport() {
  importDialog.value = false
  importSimulated.value = false
  inseedMeta.dateImport = new Date().toLocaleDateString('fr-FR')
  inseedMeta.source = importMeta.source
  inseedMeta.anneeRef = importMeta.annee
  inseedLogs.unshift({
    id: Date.now(),
    type: 'import',
    action: `Import CSV — inseed_${importMeta.annee}_multiplicateurs.csv (6 secteurs)`,
    date: new Date().toLocaleDateString('fr-FR'),
    auteur: 'L. TOGBUI (DSI/MEF)',
  })
  snackMsg.value = 'Import INSEED effectué — 6 secteurs mis à jour. Simulation actualisée.'
  snack.value = true
}

function addSecteur() {
  if (!newSecteur.secteur.trim()) return
  secteurParamsList.push({ ...newSecteur })
  addSecteurDialog.value = false
  snackMsg.value = `Secteur « ${newSecteur.secteur} » ajouté.`
  snack.value = true
  Object.assign(newSecteur, { secteur: '', pibSectorielMds: 0, emploiMult: 0, pibMult: 1.0, beneficeMult: 1.0, anneeRef: 2025 })
}
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
