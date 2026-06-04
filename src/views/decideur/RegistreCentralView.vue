<template>
  <div>
    <PageHeader
      title="Registre central des mesures"
      subtitle="Vue consolidee mesure -> base juridique -> decision -> execution -> cout -> archivage"
      icon="mdi-database-eye"
    >
      <template #actions>
        <v-select
          v-model="periode"
          :items="['Campagne 2026', 'Campagne 2025', 'Historique complet']"
          density="compact"
          hide-details
          style="width: 180px"
          class="me-2"
        />
        <v-chip color="primary" variant="tonal" size="small" prepend-icon="mdi-shield-check">
          17 attributs cibles
        </v-chip>
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="Recherche mesure, beneficiaire, texte, reference..."
              prepend-inner-icon="mdi-magnify"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" md="2">
            <v-select v-model="filterRegime" :items="regimes" label="Regime" hide-details clearable />
          </v-col>
          <v-col cols="6" md="2">
            <v-select v-model="filterRapprochement" :items="rapprochements" label="Rapprochement" hide-details clearable />
          </v-col>
          <v-col cols="6" md="2">
            <v-select v-model="filterConfidentialite" :items="confidentialites" label="Confidentialite" hide-details clearable />
          </v-col>
          <v-col cols="6" md="2">
            <v-select v-model="filterStatut" :items="statuts" label="Statut" hide-details clearable />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card rounded="lg" elevation="1">
      <v-data-table
        :headers="headers"
        :items="filteredItems"
        :search="search"
        hover
        @click:row="(_, { item }) => openDetails(item)"
      >
        <template #item.regime="{ item }">
          <v-chip size="x-small" color="primary" variant="tonal">{{ item.regime }}</v-chip>
        </template>
        <template #item.rapprochement="{ item }">
          <v-chip :color="rapprochementColor(item.rapprochement)" size="x-small" variant="tonal">
            {{ item.rapprochement }}
          </v-chip>
        </template>
        <template #item.completude="{ item }">
          <v-chip :color="completudeColor(item.completude)" size="x-small" variant="tonal">
            {{ item.completude }}
          </v-chip>
        </template>
        <template #item.confidentialite="{ item }">
          <v-chip :color="confidentialiteColor(item.confidentialite)" size="x-small" variant="outlined">
            {{ item.confidentialite }}
          </v-chip>
        </template>
        <template #item.montant="{ item }">
          <span class="font-weight-semibold">{{ formatMontant(item.montant) }}</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn size="x-small" variant="tonal" color="primary" @click.stop="openDetails(item)">Vue 360</v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="detailsDialog" max-width="980">
      <v-card v-if="selected" rounded="xl">
        <v-card-title class="pa-5 d-flex align-center justify-space-between">
          <div>
            <div class="text-h6">{{ selected.idMesure }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ selected.beneficiaire }} — {{ selected.baseJuridique }}</div>
          </div>
          <div class="d-flex flex-wrap ga-2 justify-end">
            <v-chip :color="confidentialiteColor(selected.confidentialite)" size="small" variant="outlined">
              {{ selected.confidentialite }}
            </v-chip>
            <v-chip :color="rapprochementColor(selected.rapprochement)" size="small" variant="tonal">
              {{ selected.rapprochement }}
            </v-chip>
          </div>
        </v-card-title>
        <v-card-text class="pa-5 pt-0">
          <v-row>
            <v-col cols="12" md="7">
              <v-card variant="outlined" rounded="lg" class="mb-3">
                <v-card-title class="text-body-2 font-weight-semibold">Chaine de tracabilite</v-card-title>
                <v-list density="comfortable">
                  <v-list-item title="Base juridique" :subtitle="selected.baseJuridique" prepend-icon="mdi-gavel" />
                  <v-list-item title="Articles concernes" :subtitle="selected.articlesConcernes" prepend-icon="mdi-format-list-numbered" />
                  <v-list-item title="Decision / acte" :subtitle="selected.decision" prepend-icon="mdi-file-sign" />
                  <v-list-item title="Numero attestation" :subtitle="selected.numeroAttestation" prepend-icon="mdi-identifier" />
                  <v-list-item title="Systeme source" :subtitle="selected.systemeSource" prepend-icon="mdi-api" />
                  <v-list-item title="Operation SI" :subtitle="selected.numeroOperationSi" prepend-icon="mdi-pound" />
                  <v-list-item title="Execution" :subtitle="selected.execution" prepend-icon="mdi-swap-horizontal" />
                  <v-list-item title="Impact budgetaire" :subtitle="selected.impactBudgetaire" prepend-icon="mdi-chart-box" />
                </v-list>
              </v-card>

              <v-card variant="outlined" rounded="lg" class="mb-3">
                <v-card-title class="text-body-2 font-weight-semibold">Points de vigilance</v-card-title>
                <v-list density="compact">
                  <v-list-item v-for="point in selected.points" :key="point" :title="point" prepend-icon="mdi-alert-circle-outline" />
                </v-list>
              </v-card>

              <v-card variant="outlined" rounded="lg">
                <v-card-title class="text-body-2 font-weight-semibold">17 attributs O2 visibles sur la mesure</v-card-title>
                <v-card-text class="pa-0">
                  <v-table density="compact">
                    <tbody>
                      <tr v-for="item in o2AttributeRows(selected)" :key="item.label">
                        <td class="text-caption font-weight-semibold" style="width: 42%;">{{ item.label }}</td>
                        <td class="text-caption">{{ item.value }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="5">
              <v-card variant="outlined" rounded="lg" class="mb-3">
                <v-card-title class="text-body-2 font-weight-semibold">Meta-donnees</v-card-title>
                <v-card-text class="text-body-2">
                  <div class="mb-2"><strong>Regime :</strong> {{ selected.regime }}</div>
                  <div class="mb-2"><strong>NIF :</strong> {{ selected.nif }}</div>
                  <div class="mb-2"><strong>Statut :</strong> {{ selected.statut }}</div>
                  <div class="mb-2"><strong>Completude :</strong> {{ selected.completude }}</div>
                  <div class="mb-2"><strong>Confidentialite :</strong> {{ selected.confidentialite }}</div>
                  <div class="mb-2"><strong>Montant brut taxable :</strong> {{ selected.montantBrutTaxable }}</div>
                  <div class="mb-2"><strong>Taux applique :</strong> {{ selected.tauxApplique }}</div>
                  <div class="mb-2"><strong>Organe attribution :</strong> {{ selected.idOrganeAttribution }}</div>
                  <div class="mb-2"><strong>Organe gestion :</strong> {{ selected.idOrganeGestion }}</div>
                  <div class="mb-2"><strong>Secteur / branche :</strong> {{ selected.idSecteurBranche }}</div>
                  <div class="mb-2"><strong>Objectif / ODD :</strong> {{ selected.idTypeObjectifOdd }}</div>
                  <div class="mb-2"><strong>Depense fiscale :</strong> {{ selected.estDf }} / evalue 2024 : {{ selected.evalue2024 }}</div>
                  <div class="mb-2"><strong>Date d'effet :</strong> {{ selected.dateEffet }}</div>
                  <div class="mb-2"><strong>Date operation :</strong> {{ selected.dateOperation }}</div>
                  <div class="mb-2"><strong>Utilisateur de saisie :</strong> {{ selected.idUtilisateurSaisie }}</div>
                  <div class="mb-2"><strong>Horodatage :</strong> {{ selected.horodatage }}</div>
                  <div class="mb-2"><strong>Piece justificative :</strong> {{ selected.pdfPieceJustificative }}</div>
                  <div class="mb-2"><strong>Hash SHA-256 :</strong> {{ selected.hashSha256 }}</div>
                  <div><strong>Echeance :</strong> {{ selected.echeance }}</div>
                </v-card-text>
              </v-card>

              <v-card variant="outlined" rounded="lg" class="mb-3">
                <v-card-title class="text-body-2 font-weight-semibold">Preuve et acces</v-card-title>
                <v-card-text class="text-body-2">
                  <div class="d-flex flex-wrap ga-2 mb-3">
                    <v-chip color="success" size="x-small" variant="tonal" prepend-icon="mdi-pen-lock">Acte signe</v-chip>
                    <v-chip color="info" size="x-small" variant="tonal" prepend-icon="mdi-clock-check-outline">TSA verifiable</v-chip>
                    <v-chip color="warning" size="x-small" variant="tonal" prepend-icon="mdi-history">Consultation sensible</v-chip>
                  </div>
                  <div class="mb-2"><strong>Empreinte :</strong> 8f1c...a7d9</div>
                  <div class="mb-2"><strong>Derniere consultation :</strong> 01/06/2026 22:41</div>
                  <div class="mb-2"><strong>Profils autorises :</strong> UPF, DGBF, organe habilite</div>
                  <div><strong>Champs masques en diffusion publique :</strong> beneficiaire nominal, reference acte, pieces probantes</div>
                </v-card-text>
              </v-card>

              <v-card variant="outlined" rounded="lg">
                <v-card-title class="text-body-2 font-weight-semibold">Versions visibles dans la maquette</v-card-title>
                <v-timeline density="compact" side="end" truncate-line="both" class="pa-4">
                  <v-timeline-item dot-color="success" size="small">
                    <div class="text-caption font-weight-semibold">v3 active</div>
                    <div class="text-caption text-medium-emphasis">Dossier pilote 2026 — schema courant</div>
                  </v-timeline-item>
                  <v-timeline-item dot-color="info" size="small">
                    <div class="text-caption font-weight-semibold">v2 historisee</div>
                    <div class="text-caption text-medium-emphasis">Conservee pour relecture des dossiers 2025</div>
                  </v-timeline-item>
                  <v-timeline-item dot-color="secondary" size="small">
                    <div class="text-caption font-weight-semibold">v1 archivee</div>
                    <div class="text-caption text-medium-emphasis">Aucune perte de donnees collectees</div>
                  </v-timeline-item>
                </v-timeline>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="detailsDialog = false">Fermer</v-btn>
          <v-btn color="primary">Ouvrir le dossier lie</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'

type RegistreItem = {
  idMesure: string
  articlesConcernes: string
  beneficiaire: string
  nif: string
  regime: string
  baseJuridique: string
  decision: string
  numeroAttestation: string
  codeAdditionnel: string
  systemeSource: string
  numeroOperationSi: string
  dateOperation: string
  execution: string
  montantBrutTaxable: string
  tauxApplique: string
  impactBudgetaire: string
  idOrganeAttribution: string
  idOrganeGestion: string
  idSecteurBranche: string
  idTypeObjectifOdd: string
  estDf: string
  evalue2024: string
  idUtilisateurSaisie: string
  horodatage: string
  pdfPieceJustificative: string
  hashSha256: string
  rapprochement: string
  completude: string
  confidentialite: string
  statut: string
  dateEffet: string
  echeance: string
  montant: number
  points: string[]
}

const periode = ref('Campagne 2026')
const search = ref('')
const filterRegime = ref<string | null>(null)
const filterRapprochement = ref<string | null>(null)
const filterConfidentialite = ref<string | null>(null)
const filterStatut = ref<string | null>(null)
const detailsDialog = ref(false)
const selected = ref<RegistreItem | null>(null)

const regimes = ['Accord de siege', 'Code des investissements', 'Zone franche', 'Convention miniere', 'LFI / loi speciale']
const rapprochements = ['Reconcile', 'En ecart', 'A completer']
const confidentialites = ['Public', 'Interne', 'Restreint', 'Confidentiel']
const statuts = ['Active', 'Expiree', 'Suspendue', 'Archivee']

const headers = [
  { title: 'Mesure', key: 'idMesure' },
  { title: 'Beneficiaire', key: 'beneficiaire' },
  { title: 'Regime', key: 'regime' },
  { title: 'Base juridique', key: 'baseJuridique' },
  { title: 'Systeme source', key: 'systemeSource' },
  { title: 'Rapprochement', key: 'rapprochement' },
  { title: 'Completude', key: 'completude' },
  { title: 'Confidentialite', key: 'confidentialite' },
  { title: 'Montant', key: 'montant' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const items: RegistreItem[] = [
  {
    idMesure: 'MES-2026-00124',
    articlesConcernes: 'Art. 12, 14 et 18',
    beneficiaire: 'Mission diplomatique Canada',
    nif: 'TG-DIP-2026-014',
    regime: 'Accord de siege',
    baseJuridique: 'Accord de siege 2024 + CGI 2025',
    decision: 'Notification MAE-OTR-2026-14',
    numeroAttestation: 'ATT-DIP-2026-031',
    codeAdditionnel: 'DOU-DIP-2026-03',
    systemeSource: 'DAS + E-TAX + Sydonia',
    numeroOperationSi: 'OP-SI-2026-00981',
    dateOperation: '14/02/2026',
    execution: 'TVA achats locaux + franchises vehicules',
    montantBrutTaxable: '214 000 000 FCFA',
    tauxApplique: '18 %',
    impactBudgetaire: 'Integre annexe DF 2026',
    idOrganeAttribution: 'MAE',
    idOrganeGestion: 'OTR / DGI',
    idSecteurBranche: 'ADMIN-INTL / DIPLO',
    idTypeObjectifOdd: 'COOPERATION / ODD17',
    estDf: 'Oui',
    evalue2024: 'A confirmer',
    idUtilisateurSaisie: 'usr_mae_014',
    horodatage: '01/06/2026 22:14',
    pdfPieceJustificative: 'note_verbale_014.pdf',
    hashSha256: '8f1c...a7d9',
    rapprochement: 'A completer',
    completude: '88 %',
    confidentialite: 'Restreint',
    statut: 'Active',
    dateEffet: '02/01/2026',
    echeance: '31/12/2026',
    montant: 128000000,
    points: ['Liste personnel diplomatique a mettre a jour', '2 pieces premier rang manquantes'],
  },
  {
    idMesure: 'MES-2026-00083',
    articlesConcernes: 'Art. 5, 7 et annexe ZF',
    beneficiaire: 'LOME TEXTILE ZF SAS',
    nif: 'TG-LOM-2018-ZF-98',
    regime: 'Zone franche',
    baseJuridique: 'Loi zone franche + agrement SAZOF',
    decision: 'Convention ZF-2025-009',
    numeroAttestation: 'ATT-ZF-2026-102',
    codeAdditionnel: 'DOU-EXO-ZF-2026-14',
    systemeSource: 'Sydonia + SIGTAS + GUDEF',
    numeroOperationSi: 'SW-2026-00482',
    dateOperation: '18/03/2026',
    execution: 'Consommation quotas import et IRPP expatries',
    montantBrutTaxable: '1 140 000 000 FCFA',
    tauxApplique: '18 % / mixte',
    impactBudgetaire: 'Releve transmis DGBF',
    idOrganeAttribution: 'SAZOF',
    idOrganeGestion: 'OTR / DGD',
    idSecteurBranche: 'TEXTILE / HABILLEMENT',
    idTypeObjectifOdd: 'EXPORT / ODD8',
    estDf: 'Oui',
    evalue2024: 'Oui',
    idUtilisateurSaisie: 'usr_sazof_007',
    horodatage: '01/06/2026 18:05',
    pdfPieceJustificative: 'agrement_zf_2025_009.pdf',
    hashSha256: '5de4...cc21',
    rapprochement: 'Reconcile',
    completude: '100 %',
    confidentialite: 'Interne',
    statut: 'Active',
    dateEffet: '01/07/2025',
    echeance: '01/07/2035',
    montant: 780000000,
    points: ['Aucune anomalie bloquante', 'Suivi des emplois conforme'],
  },
  {
    idMesure: 'MES-2025-00411',
    articlesConcernes: 'Code minier art. 33 a 41',
    beneficiaire: 'Mines du Nord Togo',
    nif: 'TG-MIN-2025-411',
    regime: 'Convention miniere',
    baseJuridique: 'Convention miniere + Code minier',
    decision: 'Decret CM-2025-17',
    numeroAttestation: 'ATT-MIN-2025-044',
    codeAdditionnel: 'DOU-MIN-2026-08',
    systemeSource: 'Sydonia + SIGFiP',
    numeroOperationSi: 'OP-MIN-2025-003',
    dateOperation: '15/04/2025',
    execution: 'Phase recherche tracee, phase exploitation partielle',
    montantBrutTaxable: '420 000 000 FCFA',
    tauxApplique: 'Variable par phase',
    impactBudgetaire: 'A recaler pour rapport CONEDEF',
    idOrganeAttribution: 'Conseil des ministres',
    idOrganeGestion: 'DGMG / OTR',
    idSecteurBranche: 'MINES / EXTRACTIF',
    idTypeObjectifOdd: 'INVESTISSEMENT / ODD9',
    estDf: 'Oui',
    evalue2024: 'Non',
    idUtilisateurSaisie: 'usr_dgmg_002',
    horodatage: '31/05/2026 16:48',
    pdfPieceJustificative: 'convention_miniere_17.pdf',
    hashSha256: '1ab3...ff04',
    rapprochement: 'En ecart',
    completude: '72 %',
    confidentialite: 'Confidentiel',
    statut: 'Suspendue',
    dateEffet: '15/03/2025',
    echeance: '15/03/2030',
    montant: 234000000,
    points: ['Phase exploitation non reconciliee', 'Reference budgetaire a confirmer'],
  },
  {
    idMesure: 'MES-2024-00977',
    articlesConcernes: 'LFI 2024 art. 45',
    beneficiaire: 'Programme logement social',
    nif: 'TG-ETAT-2024-LS',
    regime: 'LFI / loi speciale',
    baseJuridique: 'LFI 2024 art. 45',
    decision: 'Decision MEF-2024-119',
    numeroAttestation: 'ATT-LFI-2024-011',
    codeAdditionnel: 'FISC-LFI-2024-45',
    systemeSource: 'E-TAX + SIGFiP',
    numeroOperationSi: 'ETX-2024-1099',
    dateOperation: '06/09/2024',
    execution: 'Exonerations TVA et IS consolidees',
    montantBrutTaxable: '506 000 000 FCFA',
    tauxApplique: '18 % / 27 %',
    impactBudgetaire: 'Publie en open data agrege',
    idOrganeAttribution: 'MEF',
    idOrganeGestion: 'DGBF / OTR',
    idSecteurBranche: 'LOGEMENT / PUBLIC',
    idTypeObjectifOdd: 'SOCIAL / ODD11',
    estDf: 'Oui',
    evalue2024: 'Oui',
    idUtilisateurSaisie: 'usr_dgbf_022',
    horodatage: '30/12/2024 11:12',
    pdfPieceJustificative: 'decision_mef_2024_119.pdf',
    hashSha256: '44aa...9d11',
    rapprochement: 'Reconcile',
    completude: '96 %',
    confidentialite: 'Public',
    statut: 'Archivee',
    dateEffet: '01/01/2024',
    echeance: '31/12/2024',
    montant: 86000000,
    points: ['Archive conforme', 'Eligible publication publique'],
  },
]

const kpis = [
  { label: 'Mesures consolidees', value: '1 316', icon: 'mdi-database', color: 'primary', subtitle: 'Stock MRD 2024 et suites' },
  { label: 'Mesures rapprochees', value: '74 %', icon: 'mdi-source-merge', color: 'success', subtitle: 'Ecart a combler par SI' },
  { label: 'Alerte completude', value: '182', icon: 'mdi-alert', color: 'warning', subtitle: 'Mesures avec champs critiques manquants' },
  { label: 'Archives tracees', value: '248', icon: 'mdi-archive-check', color: 'info', subtitle: 'Echeances deja historisees' },
]

const filteredItems = computed(() =>
  items.filter((item) => {
    if (filterRegime.value && item.regime !== filterRegime.value) return false
    if (filterRapprochement.value && item.rapprochement !== filterRapprochement.value) return false
    if (filterConfidentialite.value && item.confidentialite !== filterConfidentialite.value) return false
    if (filterStatut.value && item.statut !== filterStatut.value) return false
    return true
  }),
)

const openDetails = (item: RegistreItem) => {
  selected.value = item
  detailsDialog.value = true
}

const formatMontant = (value: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value) + ' FCFA'

const o2AttributeRows = (item: RegistreItem) => [
  { label: '1. id_mesure', value: item.idMesure },
  { label: '2. id_base_juridique + articles_concernes', value: `${item.baseJuridique} / ${item.articlesConcernes}` },
  { label: '3. id_beneficiaire + nif', value: `${item.beneficiaire} / ${item.nif}` },
  { label: '4. id_decision / numero_attestation', value: `${item.decision} / ${item.numeroAttestation}` },
  { label: '5. code_additionnel', value: item.codeAdditionnel },
  { label: '6. id_systeme_source + numero_operation_si', value: `${item.systemeSource} / ${item.numeroOperationSi}` },
  { label: '7. date_operation', value: item.dateOperation },
  { label: '8. montant_brut_taxable', value: item.montantBrutTaxable },
  { label: '9. montant_exonere', value: formatMontant(item.montant) },
  { label: '10. taux_applique', value: item.tauxApplique },
  { label: '11. id_organe_attribution', value: item.idOrganeAttribution },
  { label: '12. id_organe_gestion', value: item.idOrganeGestion },
  { label: '13. id_secteur + id_branche', value: item.idSecteurBranche },
  { label: '14. id_type_objectif + id_odd', value: item.idTypeObjectifOdd },
  { label: '15. est_df + evalue_2024', value: `${item.estDf} / ${item.evalue2024}` },
  { label: '16. id_utilisateur_saisie + horodatage', value: `${item.idUtilisateurSaisie} / ${item.horodatage}` },
  { label: '17. pdf_piece_justificative + hash', value: `${item.pdfPieceJustificative} / ${item.hashSha256}` },
]

const rapprochementColor = (value: string) =>
  ({ Reconcile: 'success', 'En ecart': 'error', 'A completer': 'warning' } as Record<string, string>)[value] || 'secondary'

const completudeColor = (value: string) => {
  const numeric = parseInt(value, 10)
  if (numeric >= 95) return 'success'
  if (numeric >= 80) return 'warning'
  return 'error'
}

const confidentialiteColor = (value: string) =>
  ({ Public: 'success', Interne: 'info', Restreint: 'warning', Confidentiel: 'error' } as Record<string, string>)[value] || 'secondary'
</script>
