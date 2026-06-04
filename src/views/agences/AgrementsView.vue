<template>
  <div>
    <PageHeader title="Instruction des agréments" subtitle="Gestion des demandes d'agrément au régime ZF / Code des investissements" icon="mdi-clipboard-text">
      <template #actions>
        <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="newDemandeDialog=true">Nouvelle demande</v-btn>
      </template>
    </PageHeader>

    <v-row>
      <!-- Table demandes -->
      <v-col cols="12" md="7">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Demandes d'agrément reçues</v-card-title>
          <v-data-table :headers="headers" :items="agrement" hover @click:row="(_, {item}) => openDemande(item)">
            <template #item.statut="{ item }">
              <v-chip :color="statutColor(item.statut)" size="x-small" variant="tonal">{{ item.statutLabel }}</v-chip>
            </template>
            <template #item.emplois="{ item }">
              <span class="font-weight-medium">{{ item.emplois.toLocaleString('fr-FR') }}</span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <!-- Formulaire instruction -->
      <v-col cols="12" md="5">
        <v-card v-if="selected" rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-0 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
            Formulaire d'instruction
            <v-chip :color="statutColor(selected.statut)" size="x-small" variant="tonal">{{ selected.statutLabel }}</v-chip>
          </v-card-title>
          <v-card-text class="pa-4">

            <!-- Identité -->
            <v-text-field :model-value="selected.entreprise" label="Entreprise" readonly class="mb-3"/>

            <v-row dense class="mb-0">
              <v-col cols="6">
                <v-select
                  :model-value="selected.regime"
                  :items="regimes"
                  item-title="label"
                  item-value="value"
                  label="Régime demandé"
                  readonly
                  class="mb-3"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field :model-value="selected.emplois.toLocaleString('fr-FR')" label="Emplois projetés" readonly class="mb-3"/>
              </v-col>
            </v-row>

            <!-- ✅ Sélecteur Localisation ZF/ZES -->
            <v-select
              v-model="selected.localisation"
              :items="zonesDisponibles"
              item-title="label"
              item-value="value"
              label="Localisation ZF / ZES"
              prepend-inner-icon="mdi-map-marker"
              class="mb-3"
              :hint="selected.localisation ? zoneHint(selected.localisation) : ''"
              persistent-hint
            >
              <template #item="{ item, props }">
                <v-list-item v-bind="props">
                  <template #subtitle>
                    <span class="text-caption text-medium-emphasis">{{ item.raw.region }} · {{ item.raw.type }}</span>
                  </template>
                </v-list-item>
              </template>
            </v-select>

            <v-row dense>
              <v-col cols="6">
                <v-text-field v-model="selected.montantInvest" label="Montant investissement (FCFA)" type="number" class="mb-3"/>
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="selected.dureeConvention" label="Durée convention (ans)" type="number" class="mb-3" suffix="ans"/>
              </v-col>
            </v-row>

            <v-textarea v-model="selected.evalPlan" label="Plan d'investissement (évaluation)" rows="2" class="mb-3"/>

            <!-- Éligibilité -->
            <div class="mb-4">
              <div class="label-micro text-medium-emphasis mb-2">Vérification éligibilité</div>
              <div class="d-flex flex-wrap ga-1">
                <v-chip
                  v-for="c in criteres"
                  :key="c.label"
                  :color="c.ok?'success':'error'"
                  size="small"
                  variant="tonal"
                  :prepend-icon="c.ok?'mdi-check':'mdi-close'"
                >{{ c.label }}</v-chip>
              </div>
              <div class="text-caption text-medium-emphasis mt-2">
                {{ criteres.filter(c=>c.ok).length }}/{{ criteres.length }} critères satisfaits
              </div>
            </div>

            <div class="mb-4">
              <div class="label-micro text-medium-emphasis mb-2">Variante de regime specialisee</div>
              <v-tabs v-model="regimeDetailTab" color="primary" density="compact" class="mb-2">
                <v-tab value="zf">Zone franche</v-tab>
                <v-tab value="ci">Code investissements</v-tab>
                <v-tab value="textile">Textile 2022-021</v-tab>
              </v-tabs>
              <v-window v-model="regimeDetailTab">
                <v-window-item v-for="item in regimeDetails" :key="item.value" :value="item.value">
                  <div class="text-caption text-medium-emphasis mb-2">{{ item.subtitle }}</div>
                  <v-list density="compact" class="pa-0">
                    <v-list-item v-for="point in item.points" :key="point" :title="point" prepend-icon="mdi-check-circle-outline" />
                  </v-list>
                </v-window-item>
              </v-window>
            </div>

            <div class="mb-4">
              <div class="label-micro text-medium-emphasis mb-2">Synthese O2 de l'agrement</div>
              <v-table density="compact">
                <tbody>
                  <tr v-for="item in o2Rows" :key="item.label">
                    <td class="text-caption font-weight-semibold" style="width: 42%;">{{ item.label }}</td>
                    <td class="text-caption">{{ item.value }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>

            <!-- Workflow de validation -->
            <div class="mb-4">
              <div class="label-micro text-medium-emphasis mb-2">Étape de validation</div>
              <v-stepper v-model="selected.etape" :items="workflowItems" flat style="box-shadow:none"/>
              <div class="d-flex ga-2 mt-2">
                <v-btn size="x-small" variant="outlined" prepend-icon="mdi-arrow-left" :disabled="selected.etape<=1" @click="selected.etape--">Précédent</v-btn>
                <v-btn size="x-small" color="primary" variant="tonal" prepend-icon="mdi-arrow-right" :disabled="selected.etape>=3" @click="selected.etape++">Étape suivante</v-btn>
              </div>
            </div>

            <!-- Notes / Observations -->
            <v-textarea v-model="selected.notes" label="Observations de l'instructeur" rows="2" class="mb-4"/>

            <!-- Actions -->
            <v-divider class="mb-4"/>
            <div class="d-flex ga-2 mb-3">
              <v-btn color="success" variant="tonal" size="small" prepend-icon="mdi-check" @click="selected.statut='approuve';selected.statutLabel='Approuvé'">Valider</v-btn>
              <v-btn color="warning" variant="tonal" size="small" prepend-icon="mdi-comment-alert" @click="selected.statut='en_attente';selected.statutLabel='Complément requis'">Demander complément</v-btn>
              <v-btn color="error" variant="tonal" size="small" prepend-icon="mdi-close">Rejeter</v-btn>
            </div>

            <!-- ✅ Bouton générer convention type → ouvre DocumentViewer -->
            <v-btn
              color="primary"
              block
              prepend-icon="mdi-file-certificate"
              :disabled="!selected.localisation"
              @click="openConventionViewer"
            >
              Générer la convention type
            </v-btn>
            <div v-if="!selected.localisation" class="text-caption text-medium-emphasis mt-1 text-center">
              Sélectionnez d'abord une localisation ZF/ZES
            </div>

          </v-card-text>
        </v-card>

        <v-card v-else rounded="lg" elevation="0" color="surface-light" class="pa-6 text-center">
          <v-icon icon="mdi-cursor-pointer" size="36" color="secondary" class="mb-2"/>
          <div class="text-body-2 text-medium-emphasis">Sélectionnez une demande pour instruire</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ═══ Convention type viewer fullscreen ═══ -->
    <v-dialog v-model="conventionDialog" fullscreen transition="dialog-bottom-transition">
      <v-card>
        <v-toolbar color="secondary" density="compact">
          <v-btn icon="mdi-close" @click="conventionDialog=false"/>
          <v-toolbar-title class="text-body-2">
            Convention type — {{ selected?.entreprise }} · {{ selected?.localisation }}
          </v-toolbar-title>
          <v-spacer/>
          <v-chip color="success" variant="tonal" size="x-small" class="me-2">Pré-remplie</v-chip>
          <v-btn prepend-icon="mdi-download" size="small" variant="tonal" color="white" class="me-2">Télécharger PDF</v-btn>
          <v-btn prepend-icon="mdi-send" size="small" color="white" variant="tonal" class="me-2" @click="conventionDialog=false;selected && (selected.statut='approuve')">
            Transmettre pour signature
          </v-btn>
        </v-toolbar>

        <div style="height:calc(100vh - 48px)">
          <DocumentViewer
            v-if="selected"
            :filename="`Convention_${selected.entreprise}_${selected.localisation || 'ZF'}.pdf`"
            :total-pages="4"
            @download="conventionDialog=false"
          >
            <!-- Override page 1 with convention pre-filled data -->
            <template #default="{ page }">
              <div v-if="page===1" style="font-family:Georgia,serif">
                <div style="text-align:center;margin-bottom:24px">
                  <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:4px">REPUBLIQUE TOGOLAISE — MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES</div>
                  <div style="font-size:11px;font-weight:700;color:#1A2332;border-bottom:2px solid #2774AE;padding-bottom:6px;margin-bottom:6px">
                    {{ regimeLabel(selected?.regime) }} — CONVENTION D'INVESTISSEMENT
                  </div>
                  <div style="font-size:10px;color:#64748B">{{ zoneFullLabel(selected?.localisation) }}</div>
                </div>
                <p style="font-size:11px;line-height:1.9;margin-bottom:14px">
                  Entre <strong>L'ÉTAT TOGOLAIS</strong>, représenté par le Ministre de l'Économie et des Finances, d'une part,
                </p>
                <p style="font-size:11px;line-height:1.9;margin-bottom:14px">
                  Et la société <strong>{{ selected?.entreprise }}</strong>, constituée conformément aux lois et règlements en vigueur,
                  d'autre part,
                </p>
                <div style="font-weight:700;font-size:11px;margin-bottom:10px;color:#2774AE">Article 1 — OBJET DE LA CONVENTION</div>
                <p style="font-size:11px;line-height:1.9;margin-bottom:14px">
                  La présente convention a pour objet de définir les modalités d'agrément de la société
                  <strong>{{ selected?.entreprise }}</strong> au régime <strong>{{ regimeLabel(selected?.regime) }}</strong>
                  au sein de <strong>{{ zoneFullLabel(selected?.localisation) }}</strong>, conformément aux textes législatifs en vigueur.
                </p>
                <table style="width:100%;border-collapse:collapse;font-size:10px;margin-bottom:14px">
                  <tr style="background:#F4F6F9">
                    <td style="padding:7px 10px;font-weight:600;border:1px solid #CBD5E1;width:40%">Entreprise</td>
                    <td style="padding:7px 10px;border:1px solid #CBD5E1">{{ selected?.entreprise }}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 10px;font-weight:600;border:1px solid #CBD5E1">Régime</td>
                    <td style="padding:7px 10px;border:1px solid #CBD5E1">{{ regimeLabel(selected?.regime) }}</td>
                  </tr>
                  <tr style="background:#F4F6F9">
                    <td style="padding:7px 10px;font-weight:600;border:1px solid #CBD5E1">Localisation</td>
                    <td style="padding:7px 10px;border:1px solid #CBD5E1">{{ zoneFullLabel(selected?.localisation) }}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 10px;font-weight:600;border:1px solid #CBD5E1">Emplois projetés</td>
                    <td style="padding:7px 10px;border:1px solid #CBD5E1">{{ selected?.emplois?.toLocaleString('fr-FR') }} emplois directs</td>
                  </tr>
                  <tr style="background:#F4F6F9">
                    <td style="padding:7px 10px;font-weight:600;border:1px solid #CBD5E1">Montant investissement</td>
                    <td style="padding:7px 10px;border:1px solid #CBD5E1">{{ selected?.montantInvest ? Number(selected.montantInvest).toLocaleString('fr-FR') + ' FCFA' : 'À compléter' }}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 10px;font-weight:600;border:1px solid #CBD5E1">Durée de la convention</td>
                    <td style="padding:7px 10px;border:1px solid #CBD5E1">{{ selected?.dureeConvention || 10 }} ans à compter de la date de signature</td>
                  </tr>
                </table>
              </div>
              <div v-else-if="page===2" style="font-family:Georgia,serif">
                <div style="font-weight:700;font-size:12px;margin-bottom:14px;color:#2774AE">Article 2 — AVANTAGES ACCORDÉS</div>
                <p style="font-size:11px;line-height:1.9;margin-bottom:12px">En vertu du présent agrément, la société bénéficie des avantages suivants :</p>
                <ol style="font-size:11px;line-height:2;padding-left:18px">
                  <li>Exonération totale des droits et taxes d'importation sur les équipements, matières premières et intrants ;</li>
                  <li>Exonération d'impôt sur les bénéfices industriels et commerciaux pendant la durée de la convention ;</li>
                  <li>Exonération de la TVA sur les ventes à l'exportation ;</li>
                  <li>Liberté de transfert des capitaux, dividendes et bénéfices ;</li>
                  <li>Accès prioritaire aux infrastructures communes de la zone.</li>
                </ol>
                <div style="font-weight:700;font-size:12px;margin:20px 0 12px;color:#2774AE">Article 3 — ENGAGEMENTS DU BÉNÉFICIAIRE</div>
                <ol style="font-size:11px;line-height:2;padding-left:18px">
                  <li>Réaliser un investissement d'au moins <strong>{{ selected?.montantInvest ? Number(selected.montantInvest).toLocaleString('fr-FR') + ' FCFA' : '[montant à préciser]' }}</strong> dans les 24 mois suivant la signature ;</li>
                  <li>Créer au moins <strong>{{ selected?.emplois }} emplois directs</strong> dont 60% de ressortissants togolais ;</li>
                  <li>Soumettre un rapport d'activité semestriel à l'{{ selected?.regime?.includes('ZF') ? 'API-ZF' : 'SAZOF' }} ;</li>
                  <li>Se conformer à la réglementation sociale, environnementale et fiscale togolaise.</li>
                </ol>
              </div>
              <div v-else-if="page===3" style="font-family:Georgia,serif">
                <div style="font-weight:700;font-size:12px;margin-bottom:14px;color:#2774AE">Article 4 — CONTRÔLE ET SUIVI</div>
                <p style="font-size:11px;line-height:1.9;margin-bottom:14px">
                  L'{{ selected?.regime?.includes('ZF') ? 'API-ZF' : 'SAZOF' }} est chargée du suivi de la présente convention. 
                  L'OTR conserve ses prérogatives de contrôle fiscal et douanier conformément aux lois en vigueur.
                  Toute irrégularité sera signalée via la plateforme OASE.
                </p>
                <div style="font-weight:700;font-size:12px;margin:20px 0 12px;color:#2774AE">Article 5 — DURÉE ET RENOUVELLEMENT</div>
                <p style="font-size:11px;line-height:1.9;margin-bottom:14px">
                  La présente convention est conclue pour une durée de <strong>{{ selected?.dureeConvention || 10 }} ans</strong>.
                  Elle peut être renouvelée par accord express des parties, sous réserve d'un rapport d'évaluation favorable
                  et du respect intégral des engagements.
                </p>
                <div style="font-weight:700;font-size:12px;margin:20px 0 12px;color:#2774AE">Article 6 — RÉSILIATION</div>
                <p style="font-size:11px;line-height:1.9">
                  La convention peut être résiliée de plein droit en cas de non-respect des engagements, de fraude 
                  avérée ou de cessation d'activité. La résiliation entraîne le remboursement des avantages perçus 
                  majorés des pénalités légales.
                </p>
              </div>
              <div v-else style="font-family:Georgia,serif">
                <div style="font-weight:700;font-size:12px;margin-bottom:14px;color:#2774AE">SIGNATURES ET ENTRÉE EN VIGUEUR</div>
                <p style="font-size:11px;line-height:1.9;margin-bottom:24px">
                  Fait à Lomé, le <strong>[date de signature]</strong>, en quatre exemplaires originaux.
                </p>
                <div style="display:flex;justify-content:space-between;margin-top:40px;gap:20px">
                  <div style="text-align:center;width:45%">
                    <div style="height:70px;border-bottom:1px solid #CBD5E1;margin-bottom:8px"/>
                    <div style="font-size:10px;font-weight:600">Pour le Ministre de l'Économie<br>et des Finances</div>
                    <div style="font-size:9px;color:#64748B">Direction de la Politique Fiscale / UPF</div>
                  </div>
                  <div style="text-align:center;width:45%">
                    <div style="height:70px;border-bottom:1px solid #CBD5E1;margin-bottom:8px;display:flex;align-items:center;justify-content:center">
                      <div style="width:50px;height:50px;border:2px solid #2774AE;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:7px;color:#2774AE;text-align:center;font-weight:600">EN ATTENTE<br>SIGNATURE</div>
                    </div>
                    <div style="font-size:10px;font-weight:600">Pour {{ selected?.entreprise }}</div>
                    <div style="font-size:9px;color:#64748B">Représentant légal</div>
                  </div>
                </div>
                <div style="margin-top:32px;padding:10px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:4px;font-size:9px;color:#1E40AF">
                  <strong>Référence OASE :</strong> Ce document sera enregistré et tracé dans la plateforme OASE après signature. 
                  Un QR Code de vérification sera généré automatiquement.
                </div>
              </div>
            </template>
          </DocumentViewer>
        </div>
      </v-card>
    </v-dialog>

    <!-- Nouvelle demande dialog -->
    <v-dialog v-model="newDemandeDialog" max-width="560">
      <v-card rounded="xl">
        <v-card-title class="pa-5">Déposer une demande d'agrément</v-card-title>
        <v-card-text class="pa-5">
          <v-row>
            <v-col cols="12"><v-text-field v-model="newDemande.entreprise" label="Nom de l'entreprise" prepend-inner-icon="mdi-domain"/></v-col>
            <v-col cols="6">
              <v-select v-model="newDemande.regime" :items="regimes" item-title="label" item-value="value" label="Régime demandé"/>
            </v-col>
            <v-col cols="6">
              <v-select v-model="newDemande.localisation" :items="zonesDisponibles" item-title="label" item-value="value" label="Zone / Localisation"/>
            </v-col>
            <v-col cols="6"><v-text-field v-model="newDemande.emplois" label="Emplois projetés" type="number"/></v-col>
            <v-col cols="6"><v-text-field v-model="newDemande.montantInvest" label="Investissement (FCFA)" type="number"/></v-col>
            <v-col cols="12"><v-textarea v-model="newDemande.evalPlan" label="Description du projet" rows="2"/></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="newDemandeDialog=false">Annuler</v-btn>
          <v-btn color="primary" @click="addDemande">Soumettre</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import DocumentViewer from '../../components/DocumentViewer.vue'

interface Demande {
  entreprise: string
  regime: string
  emplois: number
  statut: string
  statutLabel: string
  localisation: string
  montantInvest: string
  dureeConvention: number
  evalPlan: string
  notes: string
  etape: number
}

const selected = ref<Demande | null>(null)
const conventionDialog = ref(false)
const newDemandeDialog = ref(false)
const regimeDetailTab = ref('zf')

const newDemande = ref({ entreprise: '', regime: '', localisation: '', emplois: '', montantInvest: '', evalPlan: '' })

// ── Zones ZF/ZES disponibles au Togo ──
const zonesDisponibles = [
  { value: 'ZFI-LOME', label: 'ZFI Lomé — Plateforme Industrielle', region: 'Maritime', type: 'Zone Franche Industrielle' },
  { value: 'ZFI-LOME-NORD', label: 'ZFI Lomé Nord — Agbalépédogan', region: 'Maritime', type: 'Zone Franche Industrielle' },
  { value: 'ZES-KARA', label: 'ZES Kara — Plateaux Industriels', region: 'Kara', type: 'Zone Économique Spéciale' },
  { value: 'ZES-SOKODE', label: 'ZES Sokodé — Centrale', region: 'Centrale', type: 'Zone Économique Spéciale' },
  { value: 'ZFI-ATAKPAME', label: 'ZFI Atakpamé — Plateaux', region: 'Plateaux', type: 'Zone Franche Industrielle' },
  { value: 'ZF-MARITIME', label: 'Zone Franche Maritime Lomé', region: 'Maritime', type: 'Zone Franche Portuaire' },
  { value: 'ZES-DAPAONG', label: 'ZES Dapaong — Savanes', region: 'Savanes', type: 'Zone Économique Spéciale' },
]

const regimes = [
  { value: 'ZFI', label: 'Zone Franche Industrielle (ZFI)' },
  { value: 'ZES', label: 'Zone Économique Spéciale (ZES)' },
  { value: 'CI', label: "Code des Investissements" },
  { value: 'ZFP', label: 'Zone Franche Portuaire' },
]

const workflowItems = ['Agent instructeur', 'Directeur Agence', 'Notification MEF']

const agrement = ref<Demande[]>([
  { entreprise: 'BATI-TOGO SA', regime: 'ZFI', emplois: 320, statut: 'en_cours', statutLabel: 'En instruction', localisation: 'ZFI-LOME', montantInvest: '2500000000', dureeConvention: 10, evalPlan: '', notes: '', etape: 2 },
  { entreprise: 'PHARMA WEST AFRICA', regime: 'ZES', emplois: 150, statut: 'approuve', statutLabel: 'Approuvé', localisation: 'ZES-KARA', montantInvest: '780000000', dureeConvention: 10, evalPlan: '', notes: '', etape: 3 },
  { entreprise: 'AGRI-PLUS TOGO', regime: 'ZFI', emplois: 480, statut: 'en_attente', statutLabel: 'Complément requis', localisation: '', montantInvest: '', dureeConvention: 10, evalPlan: '', notes: '', etape: 1 },
  { entreprise: 'NUMERIQUE AFRIQUE SA', regime: 'CI', emplois: 95, statut: 'en_cours', statutLabel: 'En instruction', localisation: 'ZFI-LOME-NORD', montantInvest: '550000000', dureeConvention: 7, evalPlan: '', notes: '', etape: 1 },
])

const criteres = computed(() => [
  { label: 'Investissement ≥ seuil', ok: selected.value ? Number(selected.value.montantInvest) >= 500000000 : false },
  { label: 'Emplois locaux ≥ 60%', ok: selected.value ? selected.value.emplois >= 50 : false },
  { label: 'Secteur prioritaire', ok: true },
  { label: 'Plan financier validé', ok: selected.value ? !!selected.value.evalPlan || !!selected.value.montantInvest : false },
  { label: 'Zone sélectionnée', ok: selected.value ? !!selected.value.localisation : false },
])

const regimeDetails = [
  {
    value: 'zf',
    subtitle: 'Regime zone franche avec convention, quotas et suivi des engagements d exportation.',
    points: ['Convention SAZOF ou ZFI rattachee', 'Suivi emplois, export et intrants', 'Code additionnel douanier pour equipements et matieres premieres'],
  },
  {
    value: 'ci',
    subtitle: 'Regime code des investissements avec agrement, duree et obligations d investissement.',
    points: ['Reference agrement et article de rattachement', 'Controle CAPEX et emplois projetes', 'Rapprochement OTR / DGBF a l emission de l acte'],
  },
  {
    value: 'textile',
    subtitle: 'Regime specialise textile / habillement 2022-021 avec suivi sectoriel dedie.',
    points: ['Verifier appartenance textile / habillement', 'Suivre les objectifs export et emplois', 'Rattacher les avantages au regime sectoriel et a la duree autorisee'],
  },
]

const o2Rows = computed(() => {
  if (!selected.value) return []
  return [
    { label: 'id_mesure / id_decision', value: `AGR-${selected.value.entreprise.replace(/\s+/g, '-')} / ATT-AG-2026-01` },
    { label: 'beneficiaire / regime', value: `${selected.value.entreprise} / ${regimeLabel(selected.value.regime)}` },
    { label: 'code additionnel / zone', value: `${selected.value.regime}-2026-01 / ${zoneFullLabel(selected.value.localisation)}` },
    { label: 'montant brut / investissement', value: `${Number(selected.value.montantInvest || 0).toLocaleString('fr-FR')} FCFA` },
    { label: 'emplois / duree', value: `${selected.value.emplois.toLocaleString('fr-FR')} / ${selected.value.dureeConvention} ans` },
    { label: 'piece probante / hash', value: 'projet_investissement.pdf / 5de4...cc21' },
  ]
})

const headers = [
  { title: 'Entreprise', key: 'entreprise' },
  { title: 'Régime', key: 'regime' },
  { title: 'Emplois projetés', key: 'emplois' },
  { title: 'Statut', key: 'statut' },
]

function openDemande(item: Demande) {
  selected.value = item
}

function openConventionViewer() {
  conventionDialog.value = true
}

function statutColor(s: string) {
  return { en_cours: 'info', approuve: 'success', en_attente: 'warning', rejete: 'error' }[s] || 'default'
}

function regimeLabel(v?: string) {
  return regimes.find(r => r.value === v)?.label || v || ''
}

function zoneFullLabel(v?: string | null) {
  return zonesDisponibles.find(z => z.value === v)?.label || v || ''
}

function zoneHint(v: string) {
  const z = zonesDisponibles.find(z => z.value === v)
  return z ? `${z.type} · Région ${z.region}` : ''
}

function addDemande() {
  agrement.value.push({
    entreprise: newDemande.value.entreprise,
    regime: newDemande.value.regime,
    emplois: Number(newDemande.value.emplois),
    statut: 'en_cours',
    statutLabel: 'En instruction',
    localisation: newDemande.value.localisation,
    montantInvest: newDemande.value.montantInvest,
    dureeConvention: 10,
    evalPlan: newDemande.value.evalPlan,
    notes: '',
    etape: 1,
  })
  newDemandeDialog.value = false
  newDemande.value = { entreprise: '', regime: '', localisation: '', emplois: '', montantInvest: '', evalPlan: '' }
}
</script>
