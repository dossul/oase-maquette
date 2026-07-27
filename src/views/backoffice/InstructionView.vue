<template>
  <div>
    <PageHeader :title="`Instruction — ${demande?.reference ?? '…'}`" :subtitle="demande?.contribuable?.raisonSociale ?? ''" icon="mdi-file-search">
      <template #actions>
        <StatusChip v-if="demande" :statut="statutDemande" />
      </template>
    </PageHeader>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="loadError" type="error" variant="tonal" rounded="lg" class="mb-4">{{ loadError }}</v-alert>
    <v-alert v-if="actionSuccess" type="success" variant="tonal" rounded="lg" class="mb-4" closable @click:close="actionSuccess=null">{{ actionSuccess }}</v-alert>

    <template v-if="demande">
      <v-row>
        <!-- Col gauche: pièces -->
        <v-col cols="12" md="3">
          <v-card rounded="lg" elevation="1" class="mb-3">
            <v-card-title class="pa-3 text-body-2 font-weight-semibold">Pièces du dossier</v-card-title>
            <v-list density="compact" class="pa-2">
              <v-list-item v-for="p in pieces" :key="p.id" prepend-icon="mdi-file-pdf-box" rounded="lg" class="mb-1" @click="selectedPiece=p.id">
                <template #title><span class="text-caption">{{ p.nomFichier }}</span></template>
                <template #append>
                  <v-icon
                    :icon="p.estValide===true?'mdi-check-circle':p.estValide===false?'mdi-close-circle':'mdi-help-circle'"
                    :color="p.estValide===true?'success':p.estValide===false?'error':'warning'"
                    size="16"
                  />
                </template>
              </v-list-item>
              <v-list-item v-if="!pieces.length" prepend-icon="mdi-file-hidden" rounded="lg">
                <template #title><span class="text-caption text-medium-emphasis">Aucune pièce jointe déposée</span></template>
              </v-list-item>
            </v-list>
            <!-- PDF viewer mock -->
            <v-card color="surface-light" variant="flat" class="ma-3 d-flex align-center justify-center" style="height:200px;border-radius:8px">
              <div class="text-center">
                <v-icon icon="mdi-file-pdf-box" size="40" color="error" class="mb-2" />
                <div class="text-caption text-medium-emphasis">Visionneuse PDF intégrée</div>
                <div class="text-caption text-medium-emphasis">{{ selectedPieceName }}</div>
              </div>
            </v-card>
          </v-card>

          <v-card rounded="lg" elevation="1">
            <v-card-title class="pa-3 text-body-2 font-weight-semibold">Controle O2</v-card-title>
            <v-card-text class="pa-3">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption">Completude attributs</span>
                <v-chip color="warning" size="x-small" variant="tonal">15 / 17</v-chip>
              </div>
              <v-progress-linear :model-value="88" color="warning" rounded height="8" class="mb-3" />
              <v-list density="compact" class="pa-0">
                <v-list-item title="Montant brut taxable" subtitle="Renseigne" prepend-icon="mdi-check-circle-outline" />
                <v-list-item title="Taux applique" subtitle="Renseigne" prepend-icon="mdi-check-circle-outline" />
                <v-list-item title="Piece PDF + hash" subtitle="Hash a confirmer" prepend-icon="mdi-alert-circle-outline" />
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Col centrale: instruction -->
        <v-col cols="12" md="5">
          <v-card rounded="lg" elevation="1" class="mb-3">
            <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Formulaire d'instruction</v-card-title>
            <v-card-text class="pa-4">
              <v-textarea v-model="avis" label="Avis technique de l'agent" rows="3" class="mb-3" />
              <v-text-field v-model="montantEvalue" label="Montant évalué de l'exonération (FCFA)" type="number" suffix="FCFA" class="mb-3" />
              <v-text-field v-model="montantBrutTaxable" label="Montant brut taxable (FCFA)" type="number" suffix="FCFA" class="mb-3" />
              <v-text-field v-model="tauxApplique" label="Taux applique" class="mb-3" />
              <v-text-field v-model="codeAdditionnel" label="Code additionnel / reference SI" class="mb-3" />
              <v-textarea v-model="conditions" label="Conditions / Réserves éventuelles" rows="2" class="mb-3" />
              <v-textarea v-model="piecesCompl" label="Pièces complémentaires à demander" rows="2" class="mb-4" />

              <v-divider class="mb-4" />
              <div class="d-flex ga-2 flex-wrap">
                <v-btn color="success" variant="tonal" prepend-icon="mdi-check" @click="openAction('valider')">Valider et transmettre</v-btn>
                <v-btn color="warning" variant="tonal" prepend-icon="mdi-pause" @click="openAction('complement')">Demander complèment</v-btn>
                <v-btn color="error" variant="tonal" prepend-icon="mdi-close" @click="openAction('rejeter')">Rejeter</v-btn>
              </div>
            </v-card-text>
          </v-card>
          <!-- Internal comment -->
          <v-card rounded="lg" elevation="1">
            <v-card-title class="pa-3 text-body-2 font-weight-semibold d-flex align-center ga-1">
              <v-icon icon="mdi-eye-off" size="16" />Commentaire interne (non visible contribuable)
            </v-card-title>
            <v-card-text class="pa-3">
              <v-textarea v-model="commentInterne" rows="2" hide-details placeholder="Note de service…" />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Col droite: contexte -->
        <v-col cols="12" md="4">
          <v-card rounded="lg" elevation="1" class="mb-3">
            <v-card-title class="pa-3 text-body-2 font-weight-semibold">Historique du dossier</v-card-title>
            <v-timeline density="compact" side="end" class="pa-3" line-thickness="1">
              <v-timeline-item dot-color="info" size="x-small">
                <div class="text-caption font-weight-semibold">Dépôt de la demande</div>
                <div class="text-caption text-medium-emphasis">{{ demande.contribuable?.raisonSociale }} · {{ formatDate(demande.dateDepot) }}</div>
              </v-timeline-item>
              <v-timeline-item v-if="demande.instructeur" dot-color="success" size="x-small">
                <div class="text-caption font-weight-semibold">Prise en charge</div>
                <div class="text-caption text-medium-emphasis">{{ demande.instructeur.prenom }} {{ demande.instructeur.nom }} · {{ formatDate(demande.updatedAt) }}</div>
              </v-timeline-item>
            </v-timeline>
          </v-card>
          <v-card rounded="lg" elevation="1" class="mb-3">
            <v-card-title class="pa-3 text-body-2 font-weight-semibold">Attributs O2 instruits</v-card-title>
            <v-card-text class="pa-0">
              <v-table density="compact">
                <tbody>
                  <tr v-for="item in o2Rows" :key="item.label">
                    <td class="text-caption font-weight-semibold" style="width: 45%;">{{ item.label }}</td>
                    <td class="text-caption">{{ item.value }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Confirmation modal -->
    <v-dialog v-model="actionDialog" max-width="450">
      <v-card rounded="xl">
        <v-card-title class="pa-5">{{ actionTitles[currentAction] }}</v-card-title>
        <v-card-text class="pa-5">
          <v-textarea
            v-if="currentAction==='rejeter'"
            v-model="motifRejet"
            label="Motif du rejet (obligatoire, 20 caractères min.)"
            rows="3"
            class="mb-3"
            :rules="[v => !!v || 'Obligatoire']"
          />
          <v-textarea
            v-if="currentAction==='complement'"
            v-model="motifComplement"
            label="Motif / message du complèment (obligatoire, 10 caractères min.)"
            rows="3"
            class="mb-3"
            :rules="[v => !!v || 'Obligatoire']"
          />
          <v-text-field
            v-if="currentAction==='valider' || currentAction==='rejeter'"
            v-model="pin"
            label="Code PIN de signature (6 chiffres)"
            type="password"
            inputmode="numeric"
            maxlength="6"
            prepend-inner-icon="mdi-lock"
            class="mb-3"
          />
          <v-alert v-if="actionError" type="error" variant="tonal" density="compact" rounded="lg">{{ actionError }}</v-alert>
          <v-alert v-else type="warning" variant="tonal" density="compact" rounded="lg">Cette action est irréversible et sera journalisée.</v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" :disabled="actionLoading" @click="actionDialog=false">Annuler</v-btn>
          <v-btn
            :color="currentAction==='valider'?'success':currentAction==='rejeter'?'error':'warning'"
            :loading="actionLoading"
            @click="confirmAction"
          >Confirmer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '../../components/PageHeader.vue'
import StatusChip from '../../components/StatusChip.vue'
import type { StatutDemande } from '../../types'
import { ApiError } from '../../services/api'
import {
  detailDemande,
  demanderComplement,
  rejeterDemande,
  listerPiecesJointes,
  listerEtapes,
  validerEtape,
  etapeAValider,
  type DemandeApi,
  type PieceJointeApi,
} from '../../services/backoffice'

const route = useRoute()
const router = useRouter()
const demandeId = String(route.params.id)
// La vue est mutualisée : /backoffice/dossiers/:id/instruction (P2) et /agences/dossiers/:id/instruction (P3).
const isBackoffice = computed(() => !route.path.startsWith('/agences'))

const demande = ref<DemandeApi | null>(null)
const pieces = ref<PieceJointeApi[]>([])
const loading = ref(false)
const loadError = ref<string | null>(null)

const avis = ref('')
const montantEvalue = ref('')
const montantBrutTaxable = ref('')
const tauxApplique = ref('')
const codeAdditionnel = ref('')
const conditions = ref('')
const piecesCompl = ref('')
const commentInterne = ref('')
const motifRejet = ref('')
const motifComplement = ref('')
const pin = ref('')
const actionDialog = ref(false)
const currentAction = ref('')
const actionLoading = ref(false)
const actionError = ref<string | null>(null)
const actionSuccess = ref<string | null>(null)
const selectedPiece = ref('')

const actionTitles: Record<string, string> = { valider: 'Valider et transmettre', complement: 'Demander un complèment', rejeter: 'Rejeter le dossier', '': '' }
const statutDemande = computed(() => (demande.value?.statutCode ?? 'soumis') as StatutDemande)
const selectedPieceName = computed(() => pieces.value.find((p) => p.id === selectedPiece.value)?.nomFichier ?? '')

const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')

const o2Rows = computed(() => [
  { label: 'id_mesure / reference', value: demande.value?.reference ?? '—' },
  { label: 'base juridique (version)', value: demande.value?.baseJuridiqueVersionId ?? '—' },
  { label: 'id_contribuable / nif', value: `${demande.value?.contribuable?.raisonSociale ?? '—'} / ${demande.value?.contribuable?.nif ?? '—'}` },
  { label: 'code additionnel / systeme source', value: `${codeAdditionnel.value || '—'} / Sydonia + E-TAX` },
  { label: 'montant brut taxable / montant exonere', value: `${montantBrutTaxable.value || '—'} / ${montantEvalue.value || '—'}` },
  { label: 'taux applique', value: tauxApplique.value || '—' },
  { label: 'pieces jointes', value: `${pieces.value.length} piece(s) déposée(s)` },
])

async function reload() {
  loading.value = true
  loadError.value = null
  try {
    const [d, p] = await Promise.all([
      detailDemande(demandeId),
      listerPiecesJointes(demandeId).catch(() => [] as PieceJointeApi[]),
    ])
    demande.value = d
    pieces.value = p
    montantEvalue.value = String(Number(d.montantFcfa ?? 0))
  } catch (e) {
    loadError.value = e instanceof ApiError && e.status === 403
      ? "Ce dossier est hors de votre périmètre d'instruction."
      : e instanceof Error ? e.message : 'Impossible de charger le dossier'
  } finally {
    loading.value = false
  }
}

function openAction(action: string) {
  currentAction.value = action
  actionError.value = null
  pin.value = ''
  actionDialog.value = true
}

async function confirmAction() {
  actionError.value = null
  const act = currentAction.value
  actionLoading.value = true
  try {
    if (act === 'complement') {
      const message = motifComplement.value.trim()
      if (message.length < 10) {
        actionError.value = 'Le motif du complément est obligatoire (10 caractères minimum).'
        return
      }
      // POST /demandes/:id/demander-complement → statut action_requise
      await demanderComplement(demandeId, message)
      actionSuccess.value = 'Demande de complément envoyée au contribuable — dossier passé en « Action requise ».'
    } else if (act === 'rejeter') {
      const motif = motifRejet.value.trim()
      if (motif.length < 20) {
        actionError.value = 'Le motif du rejet est obligatoire (20 caractères minimum).'
        return
      }
      if (!/^\d{6}$/.test(pin.value)) {
        actionError.value = 'Saisissez votre code PIN de signature à 6 chiffres.'
        return
      }
      // POST /demandes/:id/rejeter (motif + PIN)
      await rejeterDemande(demandeId, motif, pin.value)
      actionSuccess.value = 'Dossier rejeté — le contribuable a été notifié du motif.'
    } else if (act === 'valider') {
      if (!/^\d{6}$/.test(pin.value)) {
        actionError.value = 'Saisissez votre code PIN de signature à 6 chiffres.'
        return
      }
      // POST /workflow/etapes/:etapeId/valider (PIN de signature)
      const etapes = await listerEtapes(demandeId)
      const etape = etapeAValider(etapes)
      if (!etape) {
        actionError.value = "Aucune étape de workflow active à valider pour ce dossier (instance non démarrée)."
        return
      }
      await validerEtape(etape.id, pin.value, avis.value.trim() || undefined)
      actionSuccess.value = 'Étape de workflow validée et signée.'
      actionDialog.value = false
      await reload()
      if (isBackoffice.value) router.push(`/backoffice/dossiers/${demandeId}/validation`)
      return
    } else {
      return
    }
    actionDialog.value = false
    await reload()
  } catch (e) {
    if (e instanceof ApiError && (e.code === 'PIN_INVALIDE' || e.status === 401)) {
      actionError.value = 'PIN de signature invalide — vérifiez votre code à 6 chiffres.'
    } else {
      actionError.value = e instanceof Error ? e.message : "L'action a échoué"
    }
  } finally {
    actionLoading.value = false
  }
}

onMounted(reload)
</script>
