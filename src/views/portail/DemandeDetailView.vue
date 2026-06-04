<template>
  <div>
    <PageHeader :title="`Demande ${demande.reference}`" :subtitle="`${EXO_TYPE_LABELS[demande.type]} · ${demande.secteur}`" icon="mdi-file-search">
      <template #actions>
        <StatusChip :statut="demande.statut" />
        <v-btn v-if="demande.statut==='action_requise'" color="warning" size="small" prepend-icon="mdi-reply">Répondre au complément</v-btn>
        <v-btn v-if="demande.statut==='approuve'" color="success" size="small" variant="tonal" prepend-icon="mdi-download">Télécharger l'attestation</v-btn>
      </template>
    </PageHeader>

    <v-row>
      <v-col cols="12" md="4">
        <!-- Timeline -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">
            <v-icon icon="mdi-timeline" size="18" class="me-2" />Suivi du traitement
          </v-card-title>
          <v-card-text class="pa-4">
            <v-timeline density="compact" side="end" line-thickness="2">
              <v-timeline-item v-for="(ev, i) in timeline" :key="i" :dot-color="ev.color" :icon="ev.icon" size="small" :fill-dot="ev.current">
                <div>
                  <div class="font-weight-semibold text-body-2" :class="ev.future ? 'text-medium-emphasis' : ''">{{ ev.label }}</div>
                  <div v-if="ev.date" class="text-caption text-medium-emphasis">{{ ev.date }}</div>
                  <div v-if="ev.agent" class="text-caption text-medium-emphasis">Agent: {{ ev.agent }}</div>
                  <v-chip v-if="ev.current" color="info" variant="tonal" size="x-small" class="mt-1">En cours</v-chip>
                </div>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <!-- Header info -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-text class="pa-4">
            <v-row dense>
              <v-col cols="6" sm="3"><div class="label-micro text-medium-emphasis">Référence</div><div class="font-weight-bold text-primary text-body-2">{{ demande.reference }}</div></v-col>
              <v-col cols="6" sm="3"><div class="label-micro text-medium-emphasis">Type</div><div class="text-body-2">{{ EXO_TYPE_LABELS[demande.type] }}</div></v-col>
              <v-col cols="6" sm="3"><div class="label-micro text-medium-emphasis">Dépôt</div><div class="text-body-2">{{ formatDate(demande.dateDepot) }}</div></v-col>
              <v-col cols="6" sm="3"><div class="label-micro text-medium-emphasis">Montant</div><div class="font-weight-bold text-body-2">{{ formatMontant(demande.montantFCFA) }}</div></v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">
            <v-icon icon="mdi-format-list-checks" size="18" class="me-2" />Attributs O2 visibles sur le dossier
          </v-card-title>
          <v-card-text class="pa-4 pt-0">
            <v-row dense>
              <v-col v-for="item in o2Summary" :key="item.label" cols="12" md="6">
                <v-card variant="outlined" rounded="lg" class="h-100">
                  <v-card-text class="pa-3">
                    <div class="text-caption text-medium-emphasis">{{ item.label }}</div>
                    <div class="text-body-2 font-weight-medium">{{ item.value }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            <v-alert type="info" variant="tonal" rounded="lg" class="mt-3">
              Cette vue dossier expose les attributs O2 les plus utiles au bénéficiaire et conserve les éléments sensibles dans les espaces habilités.
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- Documents -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">
            <v-icon icon="mdi-file-multiple" size="18" class="me-2" />Documents
          </v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="doc in documents" :key="doc.id" :prepend-icon="doc.icon" :subtitle="doc.size" rounded="lg" class="mb-1">
              <template #title><span class="text-body-2">{{ doc.label }}</span></template>
              <template #append>
                <v-btn icon="mdi-download" size="x-small" variant="text" color="primary" />
              </template>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Messages -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">
            <v-icon icon="mdi-message-text" size="18" class="me-2" />Messages & Demandes de complément
          </v-card-title>
          <v-card-text class="pa-4">
            <div v-for="msg in messages" :key="msg.id" class="mb-3">
              <v-card :color="msg.type==='admin'?'surface-light':'primary'" :variant="msg.type==='admin'?'elevated':'tonal'" rounded="lg" elevation="0">
                <v-card-text class="pa-3">
                  <div class="d-flex align-center ga-2 mb-1">
                    <v-avatar size="24" :color="msg.type==='admin'?'secondary':'primary'">
                      <span style="font-size:0.6rem;color:white">{{ msg.initiales }}</span>
                    </v-avatar>
                    <span class="text-caption font-weight-semibold">{{ msg.auteur }}</span>
                    <span class="text-caption text-medium-emphasis ms-auto">{{ msg.date }}</span>
                  </div>
                  <p class="text-body-2 mb-0">{{ msg.texte }}</p>
                </v-card-text>
              </v-card>
            </div>
            <v-textarea v-model="replyText" label="Votre réponse…" rows="2" class="mt-3" hide-details />
            <v-btn color="primary" size="small" class="mt-2" prepend-icon="mdi-send" @click="replyText=''">Envoyer</v-btn>
          </v-card-text>
        </v-card>

        <!-- QR attestation block -->
        <v-card v-if="demande.statut==='approuve'" color="success" variant="tonal" rounded="lg" elevation="0">
          <v-card-text class="pa-4 d-flex align-center ga-4">
            <v-icon icon="mdi-qrcode" size="48" color="success" />
            <div>
              <div class="font-weight-bold text-success">Attestation d'exonération disponible</div>
              <div class="text-caption">Document PDF officiel avec QR Code de vérification. Valide jusqu'au {{ demande.dateEcheance ? formatDate(demande.dateEcheance) : '—' }}</div>
              <v-btn color="success" variant="tonal" size="small" prepend-icon="mdi-download" class="mt-2">Télécharger (PDF + QR Code)</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '../../components/PageHeader.vue'
import StatusChip from '../../components/StatusChip.vue'
import { mockDemandes } from '../../mock/data'
import { EXO_TYPE_LABELS } from '../../types'
const route = useRoute()
const demande = mockDemandes.find(d => d.id === route.params.id) || mockDemandes[0]
const replyText = ref('')
const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR')
const formatMontant = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(v)
const timeline = [
  { label: 'Dépôt de la demande', date: '15/03/2026 09:14', icon: 'mdi-upload', color: 'success', current: false, future: false },
  { label: 'Vérification recevabilité', date: '16/03/2026 11:30', agent: 'K. ABALO', icon: 'mdi-check', color: 'success', current: false, future: false },
  { label: 'Instruction OTR Douanes', date: 'En cours…', agent: 'K. ABALO', icon: 'mdi-progress-clock', color: 'info', current: true, future: false },
  { label: 'Visa DGBF', date: null, icon: 'mdi-clock-outline', color: 'default', current: false, future: true },
  { label: 'Décision finale / Signature', date: null, icon: 'mdi-file-sign', color: 'default', current: false, future: true },
]
const documents = [
  { id: '1', label: 'RCCM_TogoSteel.pdf', icon: 'mdi-file-pdf-box', size: '245 Ko' },
  { id: '2', label: 'NIF_TogoSteel.pdf', icon: 'mdi-file-pdf-box', size: '128 Ko' },
  { id: '3', label: 'DescriptionTechnique_2026.pdf', icon: 'mdi-file-pdf-box', size: '892 Ko' },
]
const messages = [
  { id: '1', type: 'admin', auteur: 'K. ABALO (OTR Douanes)', initiales: 'KA', date: '17/03/2026', texte: 'Votre dossier est en cours d\'instruction. Merci de fournir les statuts certifiés conformes de la société.' },
  { id: '2', type: 'user', auteur: 'Moi (TOGO STEEL SARL)', initiales: 'TS', date: '18/03/2026', texte: 'Bien reçu. Nous déposons les statuts dans les 48h.' },
]

const o2Summary = [
  { label: 'id_mesure / id_decision', value: `MES-${demande.reference} / ATT-2026-014` },
  { label: 'base juridique / articles', value: 'Code des investissements art. 14 et 18' },
  { label: 'id_beneficiaire / NIF', value: `${demande.beneficiaire} / TG-STEEL-2026-014` },
  { label: 'code additionnel / SI', value: 'DOU-INV-2026-05 / SW-2026-00483' },
  { label: 'montant brut taxable / taux', value: '148 000 000 FCFA / 18 %' },
  { label: 'montant exonéré', value: formatMontant(demande.montantFCFA) },
  { label: 'organe attribution / gestion', value: 'OTR / DGBF' },
  { label: 'secteur / objectif / ODD', value: 'Industrie lourde / investissement / ODD9' },
  { label: 'horodatage / utilisateur', value: '18/03/2026 10:42 / usr_portail_019' },
  { label: 'pièce justificative / hash', value: 'attestation_provisoire.pdf / 6bc2...fa91' },
]
</script>
