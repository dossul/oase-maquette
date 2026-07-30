<template>
  <div>
    <PageHeader
      title="Sous-registre des accords de siège"
      subtitle="Gestion MAE / OTR des organisations internationales, corps diplomatiques et listes personnel"
      icon="mdi-flag"
    >
      <template #actions>
        <v-btn v-if="peutEditer" color="primary" size="small" prepend-icon="mdi-plus" @click="dialogCreation = true">
          Nouvel accord
        </v-btn>
      </template>
    </PageHeader>

    <!-- Parcours normé Process 6 -->
    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Parcours normé — Processus n° 6 (MAE → OTR)</v-card-title>
      <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mx-4 mb-3">
        Bases juridiques <strong>multiples et cumulatives</strong> : Convention de Vienne · Accord ONU-Togo 1968 · CGI · Conventions bilatérales. Périmètre : <strong>298 mesures MRD strict / 398 cartographie élargie</strong>.
      </v-alert>
      <v-stepper model-value="3" alt-labels>
        <v-stepper-header>
          <v-stepper-item title="Base juridique" subtitle="MAE / OTR" value="1" />
          <v-stepper-item title="Notification" subtitle="MAE → OTR / OASE" value="2" />
          <v-stepper-item title="Exo. TVA" subtitle="OTR CI → E-TAX" value="3" color="info" />
          <v-stepper-item title="Exo. IRPP" subtitle="OTR CI → E-TAX" value="4" />
          <v-stepper-item title="Franchise douanière" subtitle="CDDI → SYDONIAWORLD + GESTEXO" value="5" />
          <v-stepper-item title="Mise à jour" subtitle="Obligation annuelle" value="6" />
          <v-stepper-item title="Alerte J-90" subtitle="Non-MàJ ou expiration" value="7" />
        </v-stepper-header>
      </v-stepper>
    </v-card>

    <!-- Matrice détaillée Process 6 -->
    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Matrice détaillée — Processus n° 6 (Figure 8)</v-card-title>
      <v-data-table :headers="processHeaders" :items="processMatrix" hover density="compact">
        <template #item.niveau="{ item }">
          <v-chip :color="niveauColor(item.niveau)" size="x-small" variant="tonal">{{ item.niveau }}</v-chip>
        </template>
      </v-data-table>
    </v-card>

    <!-- Sous-registre réel (GET /accords-siege) -->
    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center">
        Organisations enregistrées
        <v-spacer />
        <v-select
          v-model="filtreType"
          :items="typesDisponibles"
          item-title="libelle"
          item-value="code"
          label="Filtrer par type"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          style="max-width: 280px"
        />
      </v-card-title>
      <v-alert v-if="erreur" type="error" variant="tonal" rounded="lg" class="mx-4 mb-3">{{ erreur }}</v-alert>
      <v-data-table
        :headers="headers"
        :items="accords"
        :loading="chargement"
        :items-per-page="25"
        hover
        no-data-text="Aucun accord de siège enregistré pour ce filtre."
        @click:row="(_, { item }) => ouvrirFiche(item)"
      >
        <template #item.type="{ item }">
          <v-chip size="x-small" color="info" variant="tonal">{{ item.refTypesAccordSiege?.libelle ?? item.typeInstitutionCode }}</v-chip>
        </template>
        <template #item.dateSignature="{ item }">
          {{ formatDate(item.dateSignature) }}
        </template>
        <template #item.statut="{ item }">
          <v-chip :color="item.estActif ? 'success' : 'secondary'" size="x-small" variant="tonal">
            {{ item.estActif ? 'Actif' : 'Retiré' }}
          </v-chip>
        </template>
        <template #item.rattachements="{ item }">
          <span class="text-caption">{{ item._count?.contribuables ?? 0 }} contribuable(s) · {{ item._count?.conventions ?? 0 }} convention(s)</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn size="x-small" color="primary" variant="tonal" @click.stop="ouvrirFiche(item)">Fiche</v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-row>
      <v-col cols="12" md="7">
        <v-card v-if="selection" rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center">
            {{ selection.institution }}
            <v-spacer />
            <v-chip :color="selection.estActif ? 'success' : 'secondary'" size="x-small" variant="tonal" class="mr-2">
              {{ selection.estActif ? 'Actif' : 'Retiré' }}
            </v-chip>
            <v-btn
              v-if="peutEditer && selection.estActif"
              size="x-small"
              color="error"
              variant="tonal"
              :loading="actionEnCours"
              @click="retirerDuRegistre"
            >
              Retirer du registre
            </v-btn>
          </v-card-title>
          <v-card-text class="pa-4">
            <v-timeline density="compact" side="end" class="mb-3">
              <v-timeline-item dot-color="success" size="small">
                <div class="text-caption font-weight-semibold">1. Signature de l'accord avec le MAE</div>
                <div class="text-caption text-medium-emphasis">{{ formatDate(selection.dateSignature) }}</div>
              </v-timeline-item>
              <v-timeline-item dot-color="info" size="small">
                <div class="text-caption font-weight-semibold">2. Enregistrement dans le sous-registre OASE</div>
                <div class="text-caption text-medium-emphasis">{{ formatDate(selection.createdAt) }}</div>
              </v-timeline-item>
            </v-timeline>

            <v-row dense>
              <v-col cols="12" md="6"><v-text-field label="Type d'institution" :model-value="selection.refTypesAccordSiege?.libelle ?? selection.typeInstitutionCode" density="compact" readonly /></v-col>
              <v-col cols="12" md="6"><v-text-field label="Date de signature" :model-value="formatDate(selection.dateSignature)" density="compact" readonly /></v-col>
              <v-col cols="12"><v-textarea label="Texte fondateur (base juridique)" :model-value="selection.texteFondateur ?? 'Non renseigné'" rows="3" density="compact" readonly /></v-col>
            </v-row>

            <template v-if="detail">
              <v-divider class="my-3" />
              <div class="text-caption font-weight-semibold mb-2">Contribuables rattachés ({{ detail.contribuables?.length ?? 0 }})</div>
              <v-chip v-for="c in detail.contribuables ?? []" :key="c.id" size="small" variant="tonal" class="mr-1 mb-1">
                {{ c.raisonSociale }} — NIF {{ c.nif }}
              </v-chip>
              <div v-if="!(detail.contribuables ?? []).length" class="text-caption text-medium-emphasis mb-2">Aucun contribuable rattaché.</div>

              <div class="text-caption font-weight-semibold mb-2 mt-3">Conventions rattachées ({{ detail.conventions?.length ?? 0 }})</div>
              <v-chip v-for="c in detail.conventions ?? []" :key="c.id" size="small" variant="tonal" color="info" class="mr-1 mb-1">
                {{ c.reference }} ({{ c.statutCode }})
              </v-chip>
              <div v-if="!(detail.conventions ?? []).length" class="text-caption text-medium-emphasis">Aucune convention rattachée.</div>
            </template>
          </v-card-text>
        </v-card>

        <!-- Bases juridiques multiples -->
        <v-card v-if="selection" rounded="lg" elevation="1" class="mt-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Bases juridiques applicables</v-card-title>
          <v-card-text class="pa-4 pt-0">
            <v-alert type="warning" variant="tonal" rounded="lg" density="compact" class="mb-3">
              Angle mort MRD 2024 : la base juridique doit être renseignée <strong>explicitement</strong> pour chaque avantage. L'identité de l'organisation ne suffit pas.
            </v-alert>
            <div class="d-flex flex-wrap ga-2">
              <v-chip v-for="bj in basesJuridiquesOrg" :key="bj" size="small" color="info" variant="tonal" prepend-icon="mdi-gavel">{{ bj }}</v-chip>
            </div>
            <v-divider class="my-3" />
            <div class="text-caption text-medium-emphasis">
              <strong>Note :</strong> Deux ambassades relevant de la même Convention de Vienne peuvent bénéficier de périmètres d'exonération différents si leurs conventions bilatérales divergent.
            </div>
          </v-card-text>
        </v-card>

        <!-- Alerte double déclenchement -->
        <v-card v-if="selection" rounded="lg" elevation="1" class="mt-4" color="error" variant="tonal">
          <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold text-error">Alerte J-90 — Double déclenchement</v-card-title>
          <v-card-text class="pa-4 pt-0">
            <div class="d-flex align-center ga-2 mb-2">
              <v-chip size="x-small" color="error" variant="tonal">Non-MàJ listes</v-chip>
              <span class="text-caption">Alerte si liste personnel ou immatriculations non actualisée depuis &gt; 12 mois</span>
            </div>
            <div class="d-flex align-center ga-2 mb-3">
              <v-chip size="x-small" color="warning" variant="tonal">Expiration accord</v-chip>
              <span class="text-caption">Alerte J-90 avant expiration de l'accord de siège</span>
            </div>
            <v-divider class="my-2" />
            <div class="text-caption"><strong>Destinataires :</strong> OTR + OASE → Registre central</div>
            <div class="text-caption mt-1"><strong>Fréquence contrôle :</strong> Alerte trimestrielle si liste non actualisée</div>
          </v-card-text>
        </v-card>

        <v-card v-if="selection" rounded="lg" elevation="1" class="mt-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Synthèse O2 et diffusion restreinte</v-card-title>
          <v-card-text class="pa-0">
            <v-table density="compact">
              <tbody>
                <tr v-for="item in o2Rows" :key="item.label">
                  <td class="text-caption font-weight-semibold" style="width: 44%;">{{ item.label }}</td>
                  <td class="text-caption">{{ item.value }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Pièces et contrôles visibles</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Carte consulaire / liste diplomatique" prepend-icon="mdi-card-account-details-outline" />
            <v-list-item title="Immatriculations véhicules diplomatiques" prepend-icon="mdi-car-outline" />
            <v-list-item title="Importations franchisées" prepend-icon="mdi-ferry" />
            <v-list-item title="TVA achats locaux et IRPP non-résident" prepend-icon="mdi-cash-refund" />
            <v-list-item title="Horodatage annuel des mises à jour" prepend-icon="mdi-clock-check-outline" />
          </v-list>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mt-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Vigilances diplomatiques</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Liste personnel et ayants droit à recertifier annuellement" prepend-icon="mdi-account-multiple-check" />
            <v-list-item title="Véhicules, cartes consulaires et notes verbales à rapprocher" prepend-icon="mdi-car-info" />
            <v-list-item title="Consultation sensible et diffusion strictement journalisées" prepend-icon="mdi-history" />
            <v-list-item title="Hash des pièces probantes et référence MAE rattachés" prepend-icon="mdi-shield-check-outline" />
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog création -->
    <v-dialog v-model="dialogCreation" max-width="560">
      <v-card rounded="lg">
        <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Nouvel accord de siège</v-card-title>
        <v-card-text class="pa-4">
          <v-text-field v-model="form.institution" label="Organisation / institution" prepend-inner-icon="mdi-flag" class="mb-3" />
          <v-select
            v-model="form.typeInstitutionCode"
            :items="typesDisponibles"
            item-title="libelle"
            item-value="code"
            label="Type d'institution"
            prepend-inner-icon="mdi-shape"
            class="mb-3"
          />
          <v-text-field v-model="form.dateSignature" label="Date de signature (AAAA-MM-JJ)" prepend-inner-icon="mdi-calendar"
            :rules="[v => !v || /^\d{4}-\d{2}-\d{2}$/.test(v) || 'Format AAAA-MM-JJ']" class="mb-3" />
          <v-textarea v-model="form.texteFondateur" label="Texte fondateur (base juridique)" rows="3" prepend-inner-icon="mdi-gavel" />
          <v-alert v-if="erreurCreation" type="error" variant="tonal" rounded="lg" density="compact" class="mt-3">{{ erreurCreation }}</v-alert>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dialogCreation = false">Annuler</v-btn>
          <v-btn color="primary" :loading="actionEnCours" :disabled="!form.institution || !form.typeInstitutionCode" @click="creerAccord">
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import { useAuthStore } from '../../stores/auth'
import { ApiError } from '../../services/api'
import {
  listerAccordsSiege,
  obtenirAccordSiege,
  creerAccordSiege,
  modifierAccordSiege,
  type AccordSiege,
  type AccordSiegeDetail,
} from '../../services/accords-siege'

const auth = useAuthStore()
const peutEditer = computed(() => auth.hasRole(['agent_mae', 'admin_si']))

const accords = ref<AccordSiege[]>([])
const chargement = ref(false)
const erreur = ref('')
const filtreType = ref<string | null>(null)
const selection = ref<AccordSiege | null>(null)
const detail = ref<AccordSiegeDetail | null>(null)
const dialogCreation = ref(false)
const actionEnCours = ref(false)
const erreurCreation = ref('')
const form = ref({ institution: '', typeInstitutionCode: '', dateSignature: '', texteFondateur: '' })

const typesDisponibles = computed(() => {
  const map = new Map<string, string>()
  for (const a of accords.value) {
    if (a.refTypesAccordSiege) map.set(a.refTypesAccordSiege.code, a.refTypesAccordSiege.libelle)
  }
  // Types connus du référentiel même si absents de la liste courante
  for (const [code, libelle] of Object.entries({
    ambassade: 'Ambassade',
    consulat: 'Consulat',
    onu: 'ONU / Système des Nations Unies',
    ong_internationale: 'ONG internationale',
    union_africaine: 'Union Africaine',
    autre: 'Autre',
  })) {
    if (!map.has(code)) map.set(code, libelle)
  }
  return [...map.entries()].map(([code, libelle]) => ({ code, libelle }))
})

async function charger() {
  chargement.value = true
  erreur.value = ''
  try {
    accords.value = await listerAccordsSiege(filtreType.value ?? undefined)
  } catch (e) {
    erreur.value = e instanceof ApiError ? e.message : 'Erreur de chargement du sous-registre.'
  } finally {
    chargement.value = false
  }
}

async function ouvrirFiche(item: AccordSiege) {
  selection.value = item
  detail.value = null
  try {
    detail.value = await obtenirAccordSiege(item.id)
  } catch {
    // La fiche reste consultable même si le détail échoue
  }
}

async function creerAccord() {
  actionEnCours.value = true
  erreurCreation.value = ''
  try {
    await creerAccordSiege({
      institution: form.value.institution.trim(),
      typeInstitutionCode: form.value.typeInstitutionCode,
      ...(form.value.dateSignature ? { dateSignature: form.value.dateSignature } : {}),
      ...(form.value.texteFondateur.trim() ? { texteFondateur: form.value.texteFondateur.trim() } : {}),
    })
    dialogCreation.value = false
    form.value = { institution: '', typeInstitutionCode: '', dateSignature: '', texteFondateur: '' }
    await charger()
  } catch (e) {
    erreurCreation.value = e instanceof ApiError ? e.message : 'Erreur lors de l’enregistrement.'
  } finally {
    actionEnCours.value = false
  }
}

async function retirerDuRegistre() {
  if (!selection.value) return
  actionEnCours.value = true
  try {
    const maj = await modifierAccordSiege(selection.value.id, { estActif: false })
    selection.value = maj
    await charger()
  } catch (e) {
    erreur.value = e instanceof ApiError ? e.message : 'Erreur lors du retrait.'
  } finally {
    actionEnCours.value = false
  }
}

const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : 'Non renseignée')

const processHeaders = [
  { title: 'Étape', key: 'etape' },
  { title: 'Acteur', key: 'acteur' },
  { title: 'Action', key: 'action' },
  { title: 'Niveau', key: 'niveau' },
]

const processMatrix = [
  { etape: 'Base juridique', acteur: 'MAE / OTR', action: 'Base juridique multiple : accord de siège, convention internationale, traité, CGI — Loi ou ordonnance d\'approbation. Les 4 fondements peuvent s\'appliquer cumulativement.', niveau: 'Juridique' },
  { etape: 'Notification', acteur: 'MAE → OTR / OASE', action: 'Notification de l\'accord à l\'OTR par le Ministère des Affaires étrangères. Doit référencer explicitement la base juridique applicable pour chaque avantage.', niveau: 'Administratif' },
  { etape: 'Exo. TVA', acteur: 'OTR CI → E-TAX', action: 'Exonération de TVA sur les achats locaux. Mode d\'application (remboursement ou exonération directe) dépend du type de base juridique invoqué.', niveau: 'Opérationnel' },
  { etape: 'Exo. IRPP', acteur: 'OTR CI → E-TAX', action: 'Exonération d\'IRPP pour les personnels de l\'organisation (agents non-résidents). Périmètre défini par la convention bilatérale.', niveau: 'Opérationnel' },
  { etape: 'Franchise douanière', acteur: 'OTR CDDI → SYDONIAWORLD + GESTEXO', action: 'Franchises douanières sur importation de matériel, équipements et véhicules diplomatiques. Traitement via SYDONIAWORLD avec suivi GESTEXO.', niveau: 'Opérationnel' },
  { etape: 'Mise à jour', acteur: 'OI / Ambassade / ONG → OTR / OASE', action: 'Mise à jour annuelle des listes nominatives du personnel contribuable et du registre des immatriculations de véhicules diplomatiques. Obligation annuelle.', niveau: 'Contrôle' },
  { etape: 'Alerte', acteur: 'OASE → Registre central', action: 'Alerte OASE si non-mise à jour des listes (> 12 mois) ou expiration de l\'accord. Alerte automatique J-90.', niveau: 'OASE' },
]

const niveauColor = (n: string) => ({ Juridique: 'primary', Administratif: 'info', Opérationnel: 'success', Contrôle: 'warning', OASE: 'error' } as Record<string, string>)[n] || 'secondary'

const headers = [
  { title: 'Organisation', key: 'institution' },
  { title: 'Type', key: 'type' },
  { title: 'Signature', key: 'dateSignature' },
  { title: 'Statut', key: 'statut' },
  { title: 'Rattachements', key: 'rattachements', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

// Bases juridiques multiples et cumulatives (Processus 6)
const basesJuridiquesOrg = [
  'Convention de Vienne (relations diplomatiques)',
  'Accord de base ONU–Togo 1968',
  'CGI — dispositions spécifiques OI/Ambassades',
  'Convention bilatérale spécifique',
]

const o2Rows = computed(() => {
  const s = selection.value
  if (!s) return []
  return [
    { label: 'id_mesure / référence accord', value: s.id },
    { label: 'base juridique / texte fondateur', value: s.texteFondateur ?? 'Non renseignée' },
    { label: 'contribuable / type', value: `${s.institution} / ${s.refTypesAccordSiege?.libelle ?? s.typeInstitutionCode}` },
    { label: 'organe attribution / gestion', value: 'MAE / OTR' },
    { label: 'validité / horodatage', value: `${formatDate(s.dateSignature)} / enregistré le ${formatDate(s.createdAt)}` },
    { label: 'statut du registre', value: s.estActif ? 'Actif' : 'Retiré du registre actif' },
  ]
})

watch(filtreType, charger)
onMounted(charger)
</script>
