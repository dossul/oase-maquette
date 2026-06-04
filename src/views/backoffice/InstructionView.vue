<template>
  <div>
    <PageHeader :title="`Instruction — ${demande.reference}`" :subtitle="demande.beneficiaire" icon="mdi-file-search">
      <template #actions>
        <StatusChip :statut="demande.statut" />
      </template>
    </PageHeader>

    <!-- Rule engine alert -->
    <AlertBanner type="error" title="Alerte moteur de règles" text="Ce bénéficiaire a des dettes fiscales déclarées dans SIGTAS (IS 2024 — 12,4M FCFA). Instruction suspendue jusqu'à régularisation." />

    <v-row>
      <!-- Col gauche: pièces -->
      <v-col cols="12" md="3">
        <v-card rounded="lg" elevation="1" class="mb-3">
          <v-card-title class="pa-3 text-body-2 font-weight-semibold">Pièces du dossier</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="p in pieces" :key="p.id" :prepend-icon="p.icon" rounded="lg" class="mb-1" @click="selectedPiece=p.id">
              <template #title><span class="text-caption">{{ p.label }}</span></template>
              <template #append>
                <v-icon :icon="p.statut==='conforme'?'mdi-check-circle':p.statut==='non_conforme'?'mdi-close-circle':'mdi-help-circle'" :color="p.statut==='conforme'?'success':p.statut==='non_conforme'?'error':'warning'" size="16" />
              </template>
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
            <!-- SIGTAS/SYDONIA check -->
            <div class="mb-4">
              <div class="label-micro text-medium-emphasis mb-2">Vérification systèmes tiers</div>
              <v-row dense>
                <v-col cols="6">
                  <v-card variant="outlined" rounded="lg" :color="sydoniaStatus==='ok'?'success':'error'">
                    <v-card-text class="pa-2 d-flex align-center ga-2">
                      <v-icon :icon="sydoniaStatus==='ok'?'mdi-check-circle':'mdi-alert-circle'" :color="sydoniaStatus==='ok'?'success':'error'" size="18" />
                      <div>
                        <div class="text-caption font-weight-bold">SYDONIA</div>
                        <div class="text-caption text-medium-emphasis">{{ sydoniaStatus==='ok'?'Aucune dette douanière':'⚠ Dettes signalées' }}</div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="6">
                  <v-card variant="outlined" rounded="lg" :color="sigtasStatus==='error'?'error':'success'">
                    <v-card-text class="pa-2 d-flex align-center ga-2">
                      <v-icon :icon="sigtasStatus==='error'?'mdi-alert-circle':'mdi-check-circle'" :color="sigtasStatus==='error'?'error':'success'" size="18" />
                      <div>
                        <div class="text-caption font-weight-bold">SIGTAS</div>
                        <div class="text-caption text-medium-emphasis">{{ sigtasStatus==='error'?'⚠ IS 2024 impayé':'Situation nette' }}</div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>

            <v-textarea v-model="avis" label="Avis technique de l'agent" rows="3" class="mb-3" />
            <v-text-field v-model="montantEvalue" label="Montant évalué de l'exonération (FCFA)" type="number" suffix="FCFA" class="mb-3" />
            <v-text-field v-model="montantBrutTaxable" label="Montant brut taxable (FCFA)" type="number" suffix="FCFA" class="mb-3" />
            <v-text-field v-model="tauxApplique" label="Taux applique" class="mb-3" />
            <v-text-field v-model="codeAdditionnel" label="Code additionnel / reference SI" class="mb-3" />
            <v-textarea v-model="conditions" label="Conditions / Réserves éventuelles" rows="2" class="mb-3" />
            <v-textarea v-model="piecesCompl" label="Pièces complémentaires à demander" rows="2" class="mb-4" />

            <v-divider class="mb-4" />
            <div class="d-flex ga-2 flex-wrap">
              <v-btn color="success" variant="tonal" prepend-icon="mdi-check" @click="currentAction='valider'; actionDialog=true">Valider et transmettre</v-btn>
              <v-btn color="warning" variant="tonal" prepend-icon="mdi-pause" @click="currentAction='complement'; actionDialog=true">Demander complément</v-btn>
              <v-btn color="error" variant="tonal" prepend-icon="mdi-close" @click="currentAction='rejeter'; actionDialog=true">Rejeter</v-btn>
            </div>
          </v-card-text>
        </v-card>
        <!-- Internal comment -->
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-3 text-body-2 font-weight-semibold d-flex align-center ga-1">
            <v-icon icon="mdi-eye-off" size="16" />Commentaire interne (non visible bénéficiaire)
          </v-card-title>
          <v-card-text class="pa-3">
            <v-textarea v-model="commentInterne" rows="2" hide-details placeholder="Note de service…" />
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mt-3">
          <v-card-title class="pa-3 text-body-2 font-weight-semibold">Variante regime et points de vigilance</v-card-title>
          <v-card-text class="pa-3">
            <v-tabs v-model="regimeTab" color="primary" density="compact" class="mb-2">
              <v-tab value="invest">Investissement</v-tab>
              <v-tab value="zf">Zone franche</v-tab>
              <v-tab value="dip">Diplomatique</v-tab>
            </v-tabs>
            <v-window v-model="regimeTab">
              <v-window-item v-for="regime in regimeCards" :key="regime.value" :value="regime.value">
                <div class="text-caption text-medium-emphasis mb-2">{{ regime.subtitle }}</div>
                <v-list density="compact" class="pa-0">
                  <v-list-item v-for="item in regime.points" :key="item" :title="item" prepend-icon="mdi-check-circle-outline" />
                </v-list>
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Col droite: contexte -->
      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-3">
          <v-card-title class="pa-3 text-body-2 font-weight-semibold">Historique du dossier</v-card-title>
          <v-timeline density="compact" side="end" class="pa-3" line-thickness="1">
            <v-timeline-item v-for="e in historique" :key="e.id" :dot-color="e.color" size="x-small">
              <div class="text-caption font-weight-semibold">{{ e.action }}</div>
              <div class="text-caption text-medium-emphasis">{{ e.agent }} · {{ e.date }}</div>
            </v-timeline-item>
          </v-timeline>
        </v-card>
        <v-card rounded="lg" elevation="1" class="mb-3">
          <v-card-title class="pa-3 text-body-2 font-weight-semibold">Exonérations antérieures</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="e in antecedents" :key="e.id" :to="`/backoffice/dossiers/${e.id}/instruction`" :subtitle="e.montant" rounded="lg">
              <template #title><span class="text-caption">{{ e.reference }}</span></template>
              <template #append><StatusChip :statut="e.statut" /></template>
            </v-list-item>
          </v-list>
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
        <v-card rounded="lg" elevation="1" color="error" variant="tonal">
          <v-card-title class="pa-3 text-body-2 font-weight-semibold text-error">Alertes moteur de règles (2)</v-card-title>
          <v-list density="compact" class="pa-2 bg-transparent">
            <v-list-item prepend-icon="mdi-alert-circle" rounded="lg">
              <template #title><span class="text-caption text-error">Dettes fiscales actives dans SIGTAS</span></template>
            </v-list-item>
            <v-list-item prepend-icon="mdi-alert-circle" rounded="lg">
              <template #title><span class="text-caption text-error">Exonération similaire accordée en 2024</span></template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Confirmation modal -->
    <v-dialog v-model="actionDialog" max-width="450">
      <v-card rounded="xl">
        <v-card-title class="pa-5">{{ actionTitles[currentAction] }}</v-card-title>
        <v-card-text class="pa-5">
          <v-textarea v-if="currentAction==='rejeter'" v-model="motifRejet" label="Motif du rejet (obligatoire)" rows="3" :rules="[v => !!v || 'Obligatoire']" />
          <v-alert type="warning" variant="tonal" density="compact" rounded="lg">Cette action est irréversible et sera journalisée.</v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="actionDialog=false">Annuler</v-btn>
          <v-btn :color="currentAction==='valider'?'success':currentAction==='rejeter'?'error':'warning'" @click="confirmAction">Confirmer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '../../components/PageHeader.vue'
import StatusChip from '../../components/StatusChip.vue'
import AlertBanner from '../../components/AlertBanner.vue'
import { mockDemandes } from '../../mock/data'
const route = useRoute()
const router = useRouter()
const demande = mockDemandes.find(d => d.id === route.params.id) || mockDemandes[0]
const avis = ref('')
const montantEvalue = ref(String(demande.montantFCFA))
const montantBrutTaxable = ref('148000000')
const tauxApplique = ref('18 %')
const codeAdditionnel = ref('DOU-INV-2026-05')
const conditions = ref('')
const piecesCompl = ref('')
const commentInterne = ref('')
const motifRejet = ref('')
const actionDialog = ref(false)
const currentAction = ref('')
const selectedPiece = ref('1')
const regimeTab = ref('invest')
const sydoniaStatus = ref('ok')
const sigtasStatus = ref('error')
const actionTitles: Record<string, string> = { valider: 'Valider et transmettre', complement: 'Demander un complément', rejeter: 'Rejeter le dossier', '': '' }
const selectedPieceName = computed(() => pieces.find(p => p.id === selectedPiece.value)?.label || '')
const pieces = [
  { id: '1', label: 'RCCM_TogoSteel.pdf', icon: 'mdi-file-pdf-box', statut: 'conforme' },
  { id: '2', label: 'NIF_TogoSteel.pdf', icon: 'mdi-file-pdf-box', statut: 'conforme' },
  { id: '3', label: 'Statuts_2024.pdf', icon: 'mdi-file-pdf-box', statut: 'en_attente' },
  { id: '4', label: 'DescTechnique.pdf', icon: 'mdi-file-pdf-box', statut: 'non_conforme' },
]
const historique = [
  { id: '1', action: 'Dépôt de la demande', agent: 'E. NYAVOR', date: '15/03/2026', color: 'info' },
  { id: '2', action: 'Accusé de réception', agent: 'Système', date: '15/03/2026', color: 'success' },
  { id: '3', action: 'Affectation à K. ABALO', agent: 'Système', date: '16/03/2026', color: 'info' },
]
const antecedents = [{ id: '7', reference: 'OASE-2024-0200', montant: '310M FCFA', statut: 'expire' as const }]
const regimeCards = [
  {
    value: 'invest',
    subtitle: 'Controle des engagements d investissement, emplois et date d effet agrement.',
    points: ['Verifier agrement et article de rattachement', 'Comparer CAPEX et emplois avec les engagements', 'Rapprocher la decision avec E-TAX / GUDEF'],
  },
  {
    value: 'zf',
    subtitle: 'Controle des quotas, intrants et validite de la convention zone franche.',
    points: ['Verifier statut SAZOF actif', 'Controler pieces premier et second rang', 'Appliquer le bon code additionnel et la bonne duree'],
  },
  {
    value: 'dip',
    subtitle: 'Traitement restreint pour accords de siege et corps diplomatiques.',
    points: ['Verifier carte consulaire et note verbale', 'Activer diffusion restreinte et journalisee', 'Rattacher la liste personnel / vehicules au dossier'],
  },
]
const o2Rows = [
  { label: 'id_mesure / id_decision', value: `${demande.reference} / ATT-2026-014` },
  { label: 'base juridique / articles', value: `${demande.baseJuridique} / art. 14 et 18` },
  { label: 'id_beneficiaire / nif', value: `${demande.beneficiaire} / ${demande.nif}` },
  { label: 'code additionnel / systeme source', value: `${codeAdditionnel.value} / Sydonia + E-TAX` },
  { label: 'montant brut taxable / montant exonere', value: `${montantBrutTaxable.value} / ${montantEvalue.value}` },
  { label: 'taux applique / horodatage', value: `${tauxApplique.value} / 01/06/2026 23:14` },
  { label: 'piece justificative / hash', value: 'DescTechnique.pdf / 8f1c...a7d9' },
  { label: 'organe attribution / gestion', value: 'OTR / DGBF' },
]
const confirmAction = () => { const act = currentAction.value; actionDialog.value = false; if (act === 'valider') router.push(`/backoffice/dossiers/${demande.id}/validation`) }
</script>
