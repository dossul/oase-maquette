<template>
  <div>
    <PageHeader title="Rapport annuel des dépenses fiscales" subtitle="Génération assistée par IA — Directive UEMOA 06/2009" icon="mdi-file-chart">
      <template #actions>
        <v-btn size="small" color="secondary" variant="tonal" prepend-icon="mdi-cog" @click="aiConfigDialog=true">Config. IA</v-btn>
      </template>
    </PageHeader>

    <v-row>
      <!-- Wizard -->
      <v-col cols="12" md="7">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center ga-2">
            Assistant de génération
            <v-chip v-if="aiEnabled" color="info" size="x-small" variant="tonal" prepend-icon="mdi-robot">IA activée</v-chip>
          </v-card-title>
          <v-card-text class="pa-4">
            <v-stepper v-model="step" :items="['Paramètres','IA & Contenu','Prévisualisation','Signature & Publication']" flat style="box-shadow:none">
              <!-- Step 1 -->
              <template #item.1>
                <div class="pa-2">
                  <v-select v-model="annee" :items="['2025','2024','2023','2022']" label="Année fiscale" class="mb-3"/>
                  <v-select v-model="selectedModel" :items="modelItems" item-title="label" item-value="id" label="Modèle IA" class="mb-3" :disabled="!aiEnabled">
                    <template #prepend-inner><v-icon icon="mdi-robot" size="16" class="me-1"/></template>
                  </v-select>
                  <div class="label-micro text-medium-emphasis mb-2">Sections à inclure</div>
                  <v-row dense>
                    <v-col v-for="s in sections" :key="s.key" cols="12" md="6">
                      <v-checkbox v-model="s.selected" :label="s.label" hide-details density="compact"/>
                    </v-col>
                  </v-row>
                </div>
              </template>

              <!-- Step 2 — AI -->
              <template #item.2>
                <div class="pa-2">
                  <v-textarea v-model="commentaire" label="Commentaires analytiques du décideur" rows="3" class="mb-3" hint="Vos observations seront intégrées dans le rapport" persistent-hint/>

                  <v-card rounded="lg" color="surface-light" variant="flat" class="mb-3">
                    <v-card-title class="pa-3 text-body-2 font-weight-semibold d-flex align-center ga-1">
                      <v-icon icon="mdi-robot" size="16" color="info"/>
                      Génération IA des sections
                    </v-card-title>
                    <v-card-text class="pa-3 pt-0">
                      <div v-for="sec in aiSections" :key="sec.key" class="mb-3">
                        <div class="d-flex align-center justify-space-between mb-1">
                          <span class="text-caption font-weight-semibold">{{ sec.label }}</span>
                          <v-btn size="x-small" color="info" variant="tonal" :loading="sec.loading" :prepend-icon="sec.content?'mdi-refresh':'mdi-auto-fix'" @click="generateSection(sec)">
                            {{ sec.content ? 'Regénérer' : 'Générer' }}
                          </v-btn>
                        </div>
                        <div v-if="sec.loading" class="text-caption text-medium-emphasis">
                          <v-progress-linear indeterminate color="info" rounded height="2" class="mb-1"/>
                          Génération en cours…
                        </div>
                        <v-textarea
                          v-if="sec.content"
                          v-model="sec.content"
                          rows="4"
                          density="compact"
                          variant="outlined"
                          class="text-caption"
                          :label="sec.label"
                        />
                      </div>
                    </v-card-text>
                  </v-card>

                  <v-alert v-if="!aiEnabled" type="warning" variant="tonal" density="compact" rounded="lg">
                    <template #prepend><v-icon icon="mdi-robot-off"/></template>
                    Clé API OpenRouter non configurée. Cliquez sur <strong>Config. IA</strong> pour activer la génération IA.
                  </v-alert>
                </div>
              </template>

              <!-- Step 3 — Preview -->
              <template #item.3>
                <div class="pa-2">
                  <!-- Document preview styled -->
                  <v-card variant="outlined" rounded="lg" class="mb-3 overflow-y-auto" style="max-height:400px">
                    <div class="pa-6" style="font-family:Georgia,serif">
                      <div class="text-center mb-4">
                        <div class="text-caption text-medium-emphasis text-uppercase letter-spacing">REPUBLIQUE TOGOLAISE — MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES</div>
                        <div class="text-h6 font-weight-bold mt-2">Rapport Annuel des Dépenses Fiscales</div>
                        <div class="text-subtitle-2 text-medium-emphasis">Exercice {{ annee }} — Conformité Directive UEMOA 06/2009</div>
                        <div class="text-caption mt-1">UPF / Direction de la Politique Fiscale</div>
                        <v-divider class="my-3"/>
                      </div>

                      <!-- AI sections rendered -->
                      <div v-for="sec in aiSections.filter(s => s.content)" :key="sec.key" class="mb-4">
                        <div class="text-subtitle-2 font-weight-bold mb-2" style="color:#2774AE;border-bottom:1px solid #E2E8F0;padding-bottom:4px">{{ sec.label.toUpperCase() }}</div>
                        <div class="text-body-2" style="line-height:1.8;white-space:pre-wrap">{{ sec.content }}</div>
                      </div>

                      <!-- Static sections -->
                      <div v-for="s in sections.filter(s=>s.selected)" :key="s.key" class="mb-4">
                        <div class="text-subtitle-2 font-weight-bold mb-2" style="color:#2774AE;border-bottom:1px solid #E2E8F0;padding-bottom:4px">{{ s.label.toUpperCase() }}</div>
                        <div class="text-body-2 text-medium-emphasis" style="line-height:1.8">{{ s.mockContent }}</div>
                      </div>

                      <div v-if="commentaire" class="mb-4">
                        <div class="text-subtitle-2 font-weight-bold mb-2" style="color:#2774AE">OBSERVATIONS DU DÉCIDEUR</div>
                        <div class="text-body-2" style="line-height:1.8;white-space:pre-wrap">{{ commentaire }}</div>
                      </div>
                    </div>
                  </v-card>

                  <div class="d-flex ga-2">
                    <v-btn color="primary" variant="tonal" prepend-icon="mdi-file-pdf-box" :loading="generating" @click="generate">Exporter PDF</v-btn>
                    <v-btn color="secondary" variant="tonal" prepend-icon="mdi-file-word">Exporter DOCX</v-btn>
                    <v-btn color="success" variant="tonal" prepend-icon="mdi-file-excel">Exporter XLSX</v-btn>
                  </div>
                  <v-alert v-if="generated" type="success" variant="tonal" rounded="lg" class="mt-3">
                    Rapport généré : <strong>RDF-{{ annee }}-OASE.pdf</strong>
                  </v-alert>
                </div>
              </template>

              <!-- Step 4 — Signature -->
              <template #item.4>
                <div class="pa-2">
                  <v-alert type="warning" variant="tonal" rounded="lg" class="mb-4">
                    La signature électronique du Directeur UPF est requise avant publication officielle.
                  </v-alert>
                  <v-text-field v-model="signataire" label="Signataire" readonly class="mb-3"/>
                  <v-text-field label="Code PIN de signature" type="password" class="mb-3"/>
                  <div class="label-micro text-medium-emphasis mb-2">Canaux de publication</div>
                  <v-checkbox v-model="pubChannels" value="opendata" label="Portail Open Data (public)" hide-details density="compact"/>
                  <v-checkbox v-model="pubChannels" value="email" label="E-mail aux abonnés institutionnels" hide-details density="compact" class="mb-3"/>
                  <v-btn color="success" block prepend-icon="mdi-file-sign" :loading="signing" @click="sign">Signer et publier</v-btn>
                  <v-alert v-if="signed" type="success" variant="tonal" rounded="lg" class="mt-3">
                    ✅ Rapport signé et publié. Notification envoyée aux abonnés.
                  </v-alert>
                </div>
              </template>
            </v-stepper>

            <div class="d-flex justify-space-between mt-4">
              <v-btn v-if="step>1" variant="tonal" @click="step--">← Précédent</v-btn>
              <v-spacer/>
              <v-btn v-if="step<4" color="primary" @click="step++">Suivant →</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Historique -->
      <v-col cols="12" md="5">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Rapports publiés</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="r in historique" :key="r.annee" :subtitle="`Publié le ${r.date} · ${r.taille}`" rounded="lg" class="mb-1">
              <template #prepend>
                <v-avatar color="error" size="36" rounded="lg">
                  <v-icon icon="mdi-file-pdf-box" color="white" size="18"/>
                </v-avatar>
              </template>
              <template #title><span class="font-weight-semibold text-body-2">RDF {{ r.annee }}</span></template>
              <template #append>
                <div class="d-flex ga-1">
                  <v-btn icon="mdi-eye" size="x-small" variant="text" color="primary" @click="previewReport=r; viewerDialog=true"/>
                  <v-btn icon="mdi-download" size="x-small" variant="text" color="primary"/>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Quick AI generation panel -->
        <v-card rounded="lg" elevation="1" color="info" variant="tonal">
          <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold d-flex align-center ga-1">
            <v-icon icon="mdi-robot" size="16"/>
            Synthèse rapide IA
          </v-card-title>
          <v-card-text class="pa-3 pt-0">
            <v-select v-model="quickSynthSecteur" :items="secteurs" label="Secteur à analyser" density="compact" class="mb-2"/>
            <v-btn color="info" size="small" block :loading="quickLoading" prepend-icon="mdi-auto-fix" @click="quickSynth">Générer l'analyse</v-btn>
            <div v-if="quickResult" class="mt-3 text-caption" style="white-space:pre-wrap;line-height:1.6;max-height:200px;overflow-y:auto">{{ quickResult }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Document viewer dialog -->
    <v-dialog v-model="viewerDialog" fullscreen transition="dialog-bottom-transition">
      <v-card>
        <v-toolbar color="secondary" density="compact">
          <v-btn icon="mdi-close" @click="viewerDialog=false"/>
          <v-toolbar-title class="text-body-2">Rapport {{ previewReport?.annee }} — Visualisation</v-toolbar-title>
          <v-spacer/>
          <v-btn prepend-icon="mdi-download" size="small" variant="tonal" color="white" class="me-2">Télécharger</v-btn>
        </v-toolbar>
        <div style="height:calc(100vh - 48px)">
          <DocumentViewer :filename="`RDF-${previewReport?.annee}-OASE.pdf`" :total-pages="3" @download="viewerDialog=false"/>
        </div>
      </v-card>
    </v-dialog>

    <!-- AI Config Dialog -->
    <v-dialog v-model="aiConfigDialog" max-width="460">
      <v-card rounded="xl">
        <v-card-title class="pa-5 d-flex align-center ga-2"><v-icon icon="mdi-robot" color="info"/>Configuration IA</v-card-title>
        <v-card-text class="pa-5">
          <v-text-field v-model="inputApiKey" label="Clé API OpenRouter" type="password" prepend-inner-icon="mdi-key" hint="Obtenez votre clé sur openrouter.ai" persistent-hint class="mb-3"/>
          <v-select v-model="selectedModel" :items="modelItems" item-title="label" item-value="id" label="Modèle par défaut"/>
          <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mt-3" style="font-size:0.75rem">
            La clé API est stockée uniquement en mémoire pour cette session. Elle n'est jamais transmise au serveur OASE.
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="aiConfigDialog=false">Annuler</v-btn>
          <v-btn color="primary" @click="saveAiConfig">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import DocumentViewer from '../../components/DocumentViewer.vue'
import { generateText, setApiKey, hasApiKey, MODELS, buildRapportSystemPrompt, buildRecommandationsPrompt, buildSynthesePrompt, buildAnalyseSectoriellePrompt } from '../../services/openrouter'

const step = ref(1)
const annee = ref('2025')
const commentaire = ref('')
const signataire = ref('Directeur UPF / MEF')
const generating = ref(false)
const generated = ref(false)
const signing = ref(false)
const signed = ref(false)
const viewerDialog = ref(false)
const aiConfigDialog = ref(false)
const inputApiKey = ref('')
const selectedModel = ref('openai/gpt-4o-mini')
const previewReport = ref<any>(null)
const pubChannels = ref(['opendata', 'email'])
const quickSynthSecteur = ref('Mines & Hydrocarbures')
const quickLoading = ref(false)
const quickResult = ref('')
const aiEnabled = ref(hasApiKey())

const modelItems = MODELS

const secteurs = ['Mines & Hydrocarbures', 'Zone Franche', 'Agriculture', 'Énergie', 'Numérique', 'Santé', 'Transport']

const sections = ref([
  { key: 'inventaire', label: 'Inventaire des exonérations', selected: true, mockContent: 'Tableau exhaustif des 1 248 exonérations actives au 31/12/2025, réparties selon leur nature juridique (CGI, code sectoriel, LFI)…' },
  { key: 'cout', label: 'Coût budgétaire (FCFA)', selected: true, mockContent: 'Le coût total des dépenses fiscales s\'élève à 847,3 Mds FCFA pour l\'exercice 2025, en hausse de 12,4% par rapport à 2024…' },
  { key: 'evolution', label: 'Évolution pluriannuelle', selected: true, mockContent: 'Sur la période 2021–2025, les dépenses fiscales ont progressé en moyenne de 8,7% par an, passant de 571 Mds à 847 Mds FCFA…' },
  { key: 'annexes', label: 'Annexes statistiques', selected: true, mockContent: 'Tableaux A1 à A12 : détail par secteur, région, nature juridique et catégorie de bénéficiaire…' },
])

const aiSections = ref([
  { key: 'resume', label: 'Résumé exécutif (IA)', loading: false, content: '' },
  { key: 'recommandations', label: 'Recommandations de réforme (IA)', loading: false, content: '' },
])

async function generateSection(sec: { key: string; label: string; loading: boolean; content: string }) {
  if (!aiEnabled.value) { aiConfigDialog.value = true; return }
  sec.loading = true
  try {
    const systemMsg = buildRapportSystemPrompt(annee.value)
    let userContent = ''
    if (sec.key === 'resume') {
      userContent = buildSynthesePrompt({ total: '847,3 Mds FCFA', ratio: '4,2%', topSecteur: 'Mines & Hydrocarbures', anomalies: 6, annee: annee.value })
    } else if (sec.key === 'recommandations') {
      userContent = buildRecommandationsPrompt('ensemble des secteurs', '847,3')
    }
    sec.content = await generateText([systemMsg, { role: 'user', content: userContent }], { model: selectedModel.value })
  } catch (e: any) {
    sec.content = `[Erreur IA : ${e.message}]`
  }
  sec.loading = false
}

async function quickSynth() {
  if (!aiEnabled.value) { aiConfigDialog.value = true; return }
  quickLoading.value = true
  quickResult.value = ''
  try {
    const sysMsg = buildRapportSystemPrompt(annee.value)
    const userContent = buildAnalyseSectoriellePrompt(quickSynthSecteur.value)
    quickResult.value = await generateText([sysMsg, { role: 'user', content: userContent }], { model: selectedModel.value })
  } catch (e: any) {
    quickResult.value = `[Erreur IA : ${e.message}]`
  }
  quickLoading.value = false
}

function saveAiConfig() {
  if (inputApiKey.value) { setApiKey(inputApiKey.value); aiEnabled.value = true }
  aiConfigDialog.value = false
}

const generate = () => { generating.value = true; setTimeout(() => { generating.value = false; generated.value = true }, 1200) }
const sign = () => { signing.value = true; setTimeout(() => { signing.value = false; signed.value = true }, 1000) }

const historique = [
  { annee: '2024', date: '28/02/2025', taille: '4,2 Mo' },
  { annee: '2023', date: '15/03/2024', taille: '3,8 Mo' },
  { annee: '2022', date: '10/04/2023', taille: '3,1 Mo' },
]
</script>
