<template>
  <div>
    <PageHeader title="Consultation des dossiers" subtitle="Accès en lecture seule à tous les dossiers d'exonération" icon="mdi-eye">
      <template #actions>
        <v-chip color="error" variant="tonal" size="small" prepend-icon="mdi-eye-lock">Lecture seule — Aucune action possible</v-chip>
      </template>
    </PageHeader>

    <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
      En tant qu'organe de contrôle, vous avez accès à l'intégralité des dossiers sans restriction institutionnelle. Toute consultation est enregistrée dans le journal d'audit.
    </v-alert>

    <v-card rounded="lg" elevation="1">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" md="5">
            <v-text-field v-model="search" label="Référence, NIF, bénéficiaire…" prepend-inner-icon="mdi-magnify" hide-details clearable/>
          </v-col>
          <v-col cols="6" md="3">
            <v-select v-model="filterInstitution" :items="['OTR Douanes','OTR Impôts','DGBF','API-ZF','Toutes']" label="Institution" hide-details/>
          </v-col>
          <v-col cols="6" md="4">
            <v-select v-model="filterStatut" :items="['en_cours','approuve','rejete','expire','Tous']" label="Statut" hide-details/>
          </v-col>
        </v-row>
      </v-card-text>

      <v-data-table
        :headers="headers"
        :items="dossiers"
        :search="search"
        hover
        @click:row="(_, {item}) => openDossier(item)"
      >
        <template #item.statut="{ item }"><StatusChip :statut="item.statut"/></template>
        <template #item.montantFCFA="{ item }">
          <span class="font-weight-semibold">{{ (item.montantFCFA/1e6).toFixed(0) }}M</span>
        </template>
        <template #item.actions>
          <v-icon icon="mdi-eye" color="primary" size="18"/>
        </template>
      </v-data-table>
    </v-card>

    <!-- ── Detail panel (right drawer) ── -->
    <v-navigation-drawer v-model="detailPanel" location="right" :width="480" temporary>
      <div v-if="selectedDossier" class="d-flex flex-column h-100">
        <!-- Header -->
        <div class="d-flex align-center justify-space-between px-4 py-3" style="border-bottom:1px solid rgba(0,0,0,0.08)">
          <div>
            <div class="font-weight-bold text-body-1">{{ selectedDossier.reference }}</div>
            <div class="text-caption text-medium-emphasis">{{ selectedDossier.beneficiaire }}</div>
          </div>
          <v-btn icon="mdi-close" size="x-small" variant="text" @click="detailPanel=false"/>
        </div>

        <!-- Tabs -->
        <v-tabs v-model="detailTab" density="compact" color="primary" class="flex-shrink-0" style="border-bottom:1px solid rgba(0,0,0,0.08)">
          <v-tab value="info" prepend-icon="mdi-information-outline">Infos</v-tab>
          <v-tab value="docs" prepend-icon="mdi-file-multiple-outline">
            Documents
            <v-badge :content="dossierDocs.length" color="primary" inline class="ms-1"/>
          </v-tab>
        </v-tabs>

        <v-window v-model="detailTab" class="flex-grow-1 overflow-y-auto">
          <!-- Info tab -->
          <v-window-item value="info" class="pa-4">
            <v-alert type="warning" variant="tonal" density="compact" rounded="lg" class="mb-3" icon="mdi-shield-alert">
              Consultation confidentielle — journalisée
            </v-alert>
            <div class="mb-3">
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold mb-1">Bénéficiaire</div>
              <div class="font-weight-semibold">{{ selectedDossier.beneficiaire }}</div>
            </div>
            <div class="mb-3">
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold mb-1">NIF</div>
              <div>{{ selectedDossier.nif }}</div>
            </div>
            <div class="mb-3">
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold mb-1">Montant</div>
              <div class="font-weight-bold text-primary text-h6">{{ (selectedDossier.montantFCFA/1e6).toFixed(0) }}M FCFA</div>
            </div>
            <div class="mb-3">
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold mb-1">Base juridique</div>
              <div>{{ selectedDossier.baseJuridique }}</div>
            </div>
            <div class="mb-3">
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold mb-1">Étape</div>
              <div>{{ selectedDossier.etapeActuelle }}</div>
            </div>
            <div class="mb-3">
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold mb-1">Date de dépôt</div>
              <div>{{ selectedDossier.dateDepot }}</div>
            </div>
            <v-divider class="my-3"/>
            <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-history" block class="mb-2">
              Voir journal d'audit
            </v-btn>
            <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-file-multiple-outline" block @click="detailTab='docs'">
              Consulter les documents ({{ dossierDocs.length }})
            </v-btn>
          </v-window-item>

          <!-- Documents tab -->
          <v-window-item value="docs" class="pa-4">
            <div class="text-caption text-medium-emphasis mb-3">
              {{ dossierDocs.length }} pièce(s) — cliquez sur <v-icon icon="mdi-eye" size="14"/> pour consulter en ligne
            </div>

            <v-list density="compact" rounded="lg" bg-color="transparent" class="pa-0">
              <v-card
                v-for="doc in dossierDocs"
                :key="doc.id"
                class="mb-2"
                variant="outlined"
                rounded="lg"
                :color="selectedDoc?.id === doc.id ? 'primary' : undefined"
              >
                <v-card-text class="pa-3">
                  <div class="d-flex align-center ga-2">
                    <v-icon :icon="docIcon(doc.type)" :color="docColor(doc.type)" size="28"/>
                    <div class="flex-grow-1 min-width-0">
                      <div class="text-body-2 font-weight-semibold text-truncate">{{ doc.nom }}</div>
                      <div class="text-caption text-medium-emphasis">{{ doc.type }} · {{ doc.pages }} page(s) · {{ doc.taille }}</div>
                    </div>
                  </div>
                  <div class="d-flex ga-2 mt-2">
                    <v-btn
                      color="primary"
                      variant="tonal"
                      size="x-small"
                      prepend-icon="mdi-eye"
                      @click="viewDocument(doc)"
                      class="flex-grow-1"
                    >Visualiser</v-btn>
                    <v-btn
                      color="secondary"
                      variant="outlined"
                      size="x-small"
                      icon="mdi-download"
                      @click.stop
                    />
                  </div>
                </v-card-text>
              </v-card>
            </v-list>
          </v-window-item>
        </v-window>
      </div>
    </v-navigation-drawer>

    <!-- ── Full-screen Document Viewer Dialog ── -->
    <v-dialog v-model="viewerDialog" fullscreen transition="dialog-bottom-transition">
      <v-card style="display:flex;flex-direction:column;height:100vh">
        <!-- Dialog toolbar -->
        <v-toolbar color="secondary" density="compact" style="flex-shrink:0">
          <v-btn icon="mdi-arrow-left" variant="text" @click="viewerDialog=false"/>
          <v-toolbar-title class="text-body-2">
            <span class="text-medium-emphasis me-2">{{ selectedDossier?.reference }}</span>
            <v-icon icon="mdi-chevron-right" size="14" class="me-2"/>
            <span>{{ selectedDoc?.nom }}</span>
          </v-toolbar-title>
          <v-spacer/>
          <!-- Annotation export from toolbar -->
          <v-btn
            variant="tonal"
            size="small"
            prepend-icon="mdi-export"
            color="warning"
            class="me-2"
            @click="triggerExport"
          >Exporter annotations</v-btn>
          <v-chip size="small" color="error" variant="tonal" prepend-icon="mdi-eye-lock" class="me-2">
            Lecture seule
          </v-chip>
          <v-btn icon="mdi-close" variant="text" @click="viewerDialog=false"/>
        </v-toolbar>

        <!-- DocumentViewer fills remaining height -->
        <div style="flex:1;min-height:0;overflow:hidden">
          <DocumentViewer
            v-if="viewerDialog && selectedDoc"
            ref="viewerRef"
            :filename="selectedDoc.nom"
            :total-pages="selectedDoc.pages"
            style="height:100%;border-radius:0;border:none"
            @download="downloadDoc"
          >
            <template #default="{ page }">
              <div v-html="renderDocPage(selectedDoc, page)"/>
            </template>
          </DocumentViewer>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import StatusChip from '../../components/StatusChip.vue'
import DocumentViewer from '../../components/DocumentViewer.vue'
import { mockDemandes } from '../../mock/data'
import type { Demande } from '../../types'

// ── State ──────────────────────────────────────────────────────────────────
const search = ref('')
const filterInstitution = ref('Toutes')
const filterStatut = ref('Tous')
const selectedDossier = ref<Demande | null>(null)
const detailPanel = ref(false)
const detailTab = ref<'info' | 'docs'>('info')
const selectedDoc = ref<MockDoc | null>(null)
const viewerDialog = ref(false)
const viewerRef = ref<InstanceType<typeof DocumentViewer> | null>(null)

const dossiers = mockDemandes

const headers = [
  { title: 'Référence', key: 'reference' },
  { title: 'Bénéficiaire', key: 'beneficiaire' },
  { title: 'Type', key: 'type' },
  { title: 'Statut', key: 'statut' },
  { title: 'Montant', key: 'montantFCFA' },
  { title: 'Dépôt', key: 'dateDepot' },
  { title: '', key: 'actions', sortable: false },
]

// ── Mock document pieces per dossier ───────────────────────────────────────
interface MockDoc {
  id: string
  nom: string
  type: string
  pages: number
  taille: string
}

function buildDocs(d: Demande): MockDoc[] {
  const base: MockDoc[] = [
    { id: `${d.id}-req`, nom: `Demande_${d.reference}.pdf`, type: 'PDF', pages: 2, taille: '184 Ko' },
    { id: `${d.id}-id`, nom: `Statuts_societe_${d.nif}.pdf`, type: 'PDF', pages: 4, taille: '312 Ko' },
    { id: `${d.id}-fin`, nom: `Bilan_financier_2025_${d.beneficiaire.replace(/ /g, '_')}.pdf`, type: 'PDF', pages: 6, taille: '824 Ko' },
  ]
  if (d.statut === 'approuve') {
    base.push({ id: `${d.id}-att`, nom: `Attestation_${d.reference}.pdf`, type: 'PDF', pages: 3, taille: '156 Ko' })
  }
  if (d.type === 'zone_franche' || d.type === 'code_investissement') {
    base.push({ id: `${d.id}-conv`, nom: `Convention_${d.reference}.pdf`, type: 'PDF', pages: 8, taille: '540 Ko' })
  }
  if (d.statut === 'rejete') {
    base.push({ id: `${d.id}-rej`, nom: `Décision_rejet_${d.reference}.pdf`, type: 'PDF', pages: 2, taille: '98 Ko' })
  }
  return base
}

const dossierDocs = computed<MockDoc[]>(() =>
  selectedDossier.value ? buildDocs(selectedDossier.value) : []
)

// ── Helpers ────────────────────────────────────────────────────────────────
function docIcon(type: string) {
  return type === 'PDF' ? 'mdi-file-pdf-box' : type === 'XLSX' ? 'mdi-file-excel' : 'mdi-file-document'
}
function docColor(type: string) {
  return type === 'PDF' ? 'error' : type === 'XLSX' ? 'success' : 'primary'
}

function openDossier(item: Demande) {
  selectedDossier.value = item
  detailPanel.value = true
  detailTab.value = 'info'
}

function viewDocument(doc: MockDoc) {
  selectedDoc.value = doc
  viewerDialog.value = true
}

function downloadDoc() {
  // Mock download snackbar — real impl would fetch blob
  console.log('Download:', selectedDoc.value?.nom)
}

function triggerExport() {
  // Call DocumentViewer's exportAnnotations method via ref
  if (viewerRef.value) {
    (viewerRef.value as any).exportAnnotations?.()
  }
}

// ── Mock page renderer per document type ──────────────────────────────────
function renderDocPage(doc: MockDoc, page: number): string {
  const d = selectedDossier.value
  if (!d) return ''

  const nom = doc.nom

  if (nom.startsWith('Demande_')) {
    const pages: Record<number, string> = {
      1: `
        <div style="text-align:center;margin-bottom:28px">
          <div style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">REPUBLIQUE TOGOLAISE — MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES</div>
          <div style="font-size:14px;font-weight:700;color:#1A2332;border-bottom:2px solid #2774AE;padding-bottom:8px;margin-bottom:6px">FORMULAIRE DE DEMANDE D'EXONÉRATION</div>
          <div style="font-size:11px;color:#64748B">Référence OASE : <strong>${d.reference}</strong></div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px">
          <tr style="background:#F4F6F9"><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1;width:40%">Dénomination sociale</td><td style="padding:8px;border:1px solid #CBD5E1">${d.beneficiaire}</td></tr>
          <tr><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">NIF</td><td style="padding:8px;border:1px solid #CBD5E1">${d.nif}</td></tr>
          <tr style="background:#F4F6F9"><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">RCCM</td><td style="padding:8px;border:1px solid #CBD5E1">${d.rccm || '—'}</td></tr>
          <tr><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Secteur d'activité</td><td style="padding:8px;border:1px solid #CBD5E1">${d.secteur}</td></tr>
          <tr style="background:#F4F6F9"><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Type d'exonération</td><td style="padding:8px;border:1px solid #CBD5E1">${d.type}</td></tr>
          <tr><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Montant sollicité</td><td style="padding:8px;border:1px solid #CBD5E1"><strong>${(d.montantFCFA / 1e6).toFixed(0)} 000 000 FCFA</strong></td></tr>
          <tr style="background:#F4F6F9"><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Base juridique invoquée</td><td style="padding:8px;border:1px solid #CBD5E1">${d.baseJuridique}</td></tr>
        </table>
        <p style="font-size:11px;line-height:1.8;color:#475569">Par la présente, le soussigné déclare que les informations fournies sont exactes et complètes, et s'engage à respecter l'ensemble des obligations légales et réglementaires liées à l'exonération sollicitée.</p>
      `,
      2: `
        <div style="font-size:13px;font-weight:700;margin-bottom:16px;color:#1A2332">JUSTIFICATION ÉCONOMIQUE ET IMPACT PRÉVU</div>
        <p style="font-size:12px;line-height:1.8;margin-bottom:12px">La société <strong>${d.beneficiaire}</strong> sollicite cette exonération dans le cadre du développement de ses activités dans le secteur <strong>${d.secteur}</strong> conformément aux dispositions de <strong>${d.baseJuridique}</strong>.</p>
        <div style="margin-bottom:16px">
          <div style="font-size:12px;font-weight:600;margin-bottom:8px">Impacts économiques attendus :</div>
          <ul style="font-size:12px;line-height:2;padding-left:20px">
            <li>Création d'emplois directs : 45 à 80 postes sur 3 ans</li>
            <li>Investissement total prévu : ${(d.montantFCFA / 1e6 * 3).toFixed(0)} M FCFA</li>
            <li>Transfert de technologie et formation locale</li>
            <li>Contribution au PIB régional estimée à +0,02%</li>
          </ul>
        </div>
        <p style="font-size:11px;line-height:1.8;color:#475569">Fait à Lomé, le ${d.dateDepot}</p>
        <div style="margin-top:40px;border-top:1px solid #CBD5E1;padding-top:16px">
          <div style="font-size:11px;font-weight:600">Signature du représentant légal</div>
          <div style="height:40px;border-bottom:1px solid #CBD5E1;margin-top:8px"/>
        </div>
      `,
    }
    return pages[page] || `<div style="color:#64748B;text-align:center;padding:40px">Page ${page}</div>`
  }

  if (nom.startsWith('Attestation_')) {
    const pages: Record<number, string> = {
      1: `
        <div style="text-align:center;margin-bottom:32px">
          <div style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">REPUBLIQUE TOGOLAISE — MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES</div>
          <div style="font-size:13px;font-weight:700;color:#1A2332;border-bottom:2px solid #2774AE;padding-bottom:8px;margin-bottom:8px">ATTESTATION D'EXONÉRATION N° ${d.reference}</div>
          <div style="font-size:11px;color:#64748B">Conformément à ${d.baseJuridique}</div>
        </div>
        <p style="font-size:12px;line-height:1.8;margin-bottom:16px">Le Directeur Général de l'Office Togolais des Recettes <strong>ATTESTE</strong> que la société <strong>${d.beneficiaire}</strong>, NIF <strong>${d.nif}</strong>, bénéficie d'une exonération fiscale accordée conformément aux dispositions suivantes :</p>
        <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px">
          <tr style="background:#F4F6F9"><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Nature</td><td style="padding:8px;border:1px solid #CBD5E1">${d.type}</td></tr>
          <tr><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Montant accordé</td><td style="padding:8px;border:1px solid #CBD5E1"><strong>${(d.montantFCFA / 1e6).toFixed(0)} 000 000 FCFA</strong></td></tr>
          <tr style="background:#F4F6F9"><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Secteur</td><td style="padding:8px;border:1px solid #CBD5E1">${d.secteur}</td></tr>
          <tr><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Base juridique</td><td style="padding:8px;border:1px solid #CBD5E1">${d.baseJuridique}</td></tr>
          <tr style="background:#F4F6F9"><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Date d'approbation</td><td style="padding:8px;border:1px solid #CBD5E1">${d.dateDepot}</td></tr>
          <tr><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Date d'échéance</td><td style="padding:8px;border:1px solid #CBD5E1">${d.dateEcheance || 'Non définie'}</td></tr>
        </table>
      `,
      2: `
        <div style="font-size:13px;font-weight:700;margin-bottom:16px">CONDITIONS ET OBLIGATIONS</div>
        <ol style="font-size:12px;line-height:2;padding-left:20px">
          <li>Tenir une comptabilité régulière distinguant les opérations exonérées ;</li>
          <li>Déposer trimestriellement un état récapitulatif auprès de la DGE ;</li>
          <li>Informer immédiatement l'OTR de tout changement ;</li>
          <li>Conserver les justificatifs pendant 10 ans ;</li>
          <li>Ne pas céder le bénéfice de l'exonération à un tiers.</li>
        </ol>
        <div style="margin-top:24px;padding:12px;background:#FEF3C7;border-left:4px solid #F59E0B;font-size:11px;color:#78350F">
          <strong>⚠ Important :</strong> Toute utilisation frauduleuse entraîne la révocation immédiate et le remboursement majoré des pénalités légales.
        </div>
      `,
      3: `
        <div style="font-size:13px;font-weight:700;margin-bottom:16px">SIGNATURE ET CERTIFICATION</div>
        <p style="font-size:12px;margin-bottom:24px">Fait à Lomé, le <strong>${d.dateDepot}</strong></p>
        <div style="display:flex;justify-content:space-between;margin-top:40px">
          <div style="text-align:center;width:45%">
            <div style="height:60px;border-bottom:1px solid #CBD5E1;margin-bottom:8px"/>
            <div style="font-size:11px;font-weight:600">Le Directeur Général de l'OTR</div>
          </div>
          <div style="text-align:center;width:45%">
            <div style="height:60px;margin-bottom:8px;display:flex;align-items:center;justify-content:center">
              <div style="width:60px;height:60px;border:2px solid #2774AE;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:#2774AE;text-align:center;font-weight:600">SIGNATURE<br>NUMÉRIQUE</div>
            </div>
            <div style="font-size:11px;font-weight:600">Visa DGBF / MEF</div>
          </div>
        </div>
        <div style="margin-top:32px;padding:12px;background:#EFF6FF;border:1px solid #BFDBFE;font-size:10px;color:#1E40AF;border-radius:4px">
          <strong>Vérification :</strong> oase.mef.tg/verifier — Réf. ${d.reference}
        </div>
      `,
    }
    return pages[page] || `<div style="color:#64748B;text-align:center;padding:40px">Page ${page}</div>`
  }

  if (nom.startsWith('Convention_')) {
    return `
      <div style="text-align:center;margin-bottom:28px">
        <div style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">REPUBLIQUE TOGOLAISE</div>
        <div style="font-size:14px;font-weight:700;color:#1A2332;border-bottom:2px solid #2774AE;padding-bottom:8px">CONVENTION D'INVESTISSEMENT</div>
        <div style="font-size:11px;color:#64748B;margin-top:6px">Entre la République Togolaise et ${d.beneficiaire}</div>
      </div>
      <p style="font-size:12px;line-height:1.8;margin-bottom:12px">La présente convention est conclue entre l'État Togolais, représenté par le Ministre de l'Économie et des Finances, et la société <strong>${d.beneficiaire}</strong> dans le cadre du régime <strong>${d.type}</strong>.</p>
      <div style="font-size:12px;font-weight:600;margin-bottom:8px">ARTICLE 1 — ENGAGEMENTS DE L'INVESTISSEUR</div>
      <ul style="font-size:12px;line-height:2;padding-left:20px;margin-bottom:16px">
        <li>Investissement minimum : ${(d.montantFCFA / 1e6).toFixed(0)} M FCFA</li>
        <li>Création d'emplois directs : minimum 50 postes</li>
        <li>Durée d'exploitation : 10 ans minimum</li>
        <li>Respect des normes environnementales UEMOA</li>
      </ul>
      <div style="font-size:12px;font-weight:600;margin-bottom:8px">ARTICLE 2 — AVANTAGES ACCORDÉS</div>
      <ul style="font-size:12px;line-height:2;padding-left:20px">
        <li>Exonération IS pendant la durée conventionnelle</li>
        <li>Exonération TVA sur équipements et matières premières</li>
        <li>Exonération droits de douane à l'importation</li>
        <li>Liberté de transfert des bénéfices et capitaux</li>
      </ul>
    `
  }

  if (nom.startsWith('Statuts_')) {
    return `
      <div style="text-align:center;margin-bottom:28px">
        <div style="font-size:14px;font-weight:700;color:#1A2332;border-bottom:2px solid #2774AE;padding-bottom:8px">STATUTS DE LA SOCIÉTÉ</div>
        <div style="font-size:12px;color:#475569;margin-top:8px">${d.beneficiaire}</div>
      </div>
      <p style="font-size:12px;line-height:1.8;margin-bottom:16px">La société <strong>${d.beneficiaire}</strong>, constituée sous forme de ${d.type.includes('zone') ? 'SAS' : 'SARL'}, immatriculée au RCCM sous le numéro <strong>${d.rccm || 'N/A'}</strong> et au registre fiscal sous le NIF <strong>${d.nif}</strong>.</p>
      <div style="font-size:12px;font-weight:600;margin-bottom:8px">ARTICLE 1 — DÉNOMINATION</div>
      <p style="font-size:12px;line-height:1.8;margin-bottom:12px">La société prend la dénomination sociale : <strong>${d.beneficiaire}</strong></p>
      <div style="font-size:12px;font-weight:600;margin-bottom:8px">ARTICLE 2 — SIÈGE SOCIAL</div>
      <p style="font-size:12px;line-height:1.8;margin-bottom:12px">Le siège social est établi à Lomé, République Togolaise. Il peut être transféré en tout autre lieu par décision de l'assemblée générale extraordinaire.</p>
      <div style="font-size:12px;font-weight:600;margin-bottom:8px">ARTICLE 3 — OBJET SOCIAL</div>
      <p style="font-size:12px;line-height:1.8">La société a pour objet toutes activités relevant du secteur <strong>${d.secteur}</strong>, notamment l'importation, l'exportation, la production et la commercialisation des produits de ce secteur dans le respect de la réglementation en vigueur.</p>
    `
  }

  // Generic fallback
  return `
    <div style="text-align:center;margin-bottom:28px">
      <div style="font-size:14px;font-weight:700;color:#1A2332;border-bottom:2px solid #2774AE;padding-bottom:8px">${doc.nom}</div>
      <div style="font-size:11px;color:#64748B;margin-top:8px">Dossier : ${d.reference}</div>
    </div>
    <p style="font-size:12px;line-height:1.8;color:#475569">
      Document relatif au dossier <strong>${d.reference}</strong> — <strong>${d.beneficiaire}</strong>.<br>
      Secteur : ${d.secteur} · Base juridique : ${d.baseJuridique}<br>
      Page ${page} sur ${doc.pages}.
    </p>
  `
}
</script>
