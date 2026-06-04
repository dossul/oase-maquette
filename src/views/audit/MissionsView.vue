<template>
  <div>
    <PageHeader
      title="Missions de contrôle"
      subtitle="Planification, suivi, documentation et export des missions d'audit"
      icon="mdi-briefcase-search"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-export" class="me-2" @click="exportListDialog=true">
          Exporter liste
        </v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="openCreate">
          Nouvelle mission
        </v-btn>
      </template>
    </PageHeader>

    <!-- Calendar — full width above KPIs -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card rounded="lg" elevation="1">
          <div class="d-flex align-center justify-space-between px-4 py-3" style="border-bottom:1px solid rgba(0,0,0,0.08)">
            <span class="text-body-1 font-weight-semibold">
              <v-icon icon="mdi-calendar-month" color="primary" size="18" class="me-2"/>
              Calendrier des missions
            </span>
            <div class="d-flex align-center ga-2">
              <v-btn icon="mdi-chevron-left" size="x-small" variant="text" @click="prevMonth"/>
              <span class="text-body-2 font-weight-medium" style="min-width:130px;text-align:center">{{ calMonthLabel }}</span>
              <v-btn icon="mdi-chevron-right" size="x-small" variant="text" @click="nextMonth"/>
              <v-btn size="x-small" variant="tonal" color="primary" @click="goToday">Aujourd'hui</v-btn>
            </div>
          </div>
          <v-card-text class="pa-2">
            <v-calendar
              :month="calMonth"
              :year="calYear"
              :events="calEvents"
              show-adjacent-months
            >
              <template #event="{ event }">
                <div
                  class="cursor-pointer text-caption font-weight-medium px-1 text-truncate"
                  :style="{ background: calEventBg(event.color), color: calEventFg(event.color), borderRadius: '3px', lineHeight: '18px' }"
                  :title="event.title"
                  @click.stop="onCalEventClick(event)"
                >{{ event.title }}</div>
              </template>
            </v-calendar>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- KPI row -->
    <v-row class="mb-2">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <v-card rounded="lg" elevation="1" class="pa-3">
          <div class="d-flex align-center ga-2">
            <v-icon :icon="kpi.icon" :color="kpi.color" size="28"/>
            <div>
              <div class="text-h6 font-weight-bold">{{ kpi.value }}</div>
              <div class="text-caption text-medium-emphasis">{{ kpi.label }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- List: always full width now that detail is a dialog -->
      <v-col cols="12">
        <v-card rounded="lg" elevation="1">
          <v-card-text class="pa-3">
            <v-row dense>
              <v-col cols="12" md="5">
                <v-text-field v-model="search" label="Rechercher..." prepend-inner-icon="mdi-magnify" hide-details clearable density="compact"/>
              </v-col>
              <v-col cols="6" md="4">
                <v-select v-model="filterStatut" :items="statutOptions" label="Statut" hide-details density="compact"/>
              </v-col>
              <v-col cols="6" md="3">
                <v-select v-model="filterInst" :items="instOptions" label="Institution" hide-details density="compact"/>
              </v-col>
            </v-row>
          </v-card-text>

          <v-data-table
            :headers="mHeaders"
            :items="filteredMissions"
            :search="search"
            hover
            :row-props="({ item }) => ({ class: selectedMission?.ref === item.ref ? 'mission-row--selected' : '' })"
            @click:row="(_, {item}) => selectMission(item)"
          >
            <template #item.statut="{ item }">
              <v-chip :color="statutColor(item.statut)" size="x-small" variant="tonal">{{ item.statutLabel }}</v-chip>
            </template>
            <template #item.docs="{ item }">
              <v-chip size="x-small" variant="outlined" prepend-icon="mdi-paperclip">{{ item.documents.length }}</v-chip>
            </template>
            <template #item.actions="{ item }">
              <div class="d-flex ga-1" @click.stop>
                <v-tooltip text="Voir / Suivre" location="top">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-eye" size="x-small" variant="text" color="primary" @click="selectMission(item)"/>
                  </template>
                </v-tooltip>
                <v-tooltip text="Editer" location="top">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-pencil" size="x-small" variant="text" color="secondary" @click="openEdit(item)"/>
                  </template>
                </v-tooltip>
                <v-tooltip text="Assigner" location="top">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-account-plus" size="x-small" variant="text" color="info" @click="openAssign(item)"/>
                  </template>
                </v-tooltip>
                <v-tooltip text="Exporter rapport" location="top">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-file-export" size="x-small" variant="text" color="success" @click="openExport(item)"/>
                  </template>
                </v-tooltip>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

    </v-row>

    <!-- ── Mission Detail Dialog ── -->
    <v-dialog v-model="detailDialog" max-width="620" scrollable @update:model-value="v => { if(!v) closeDetail() }">
      <v-card rounded="xl" v-if="selectedMission">
        <!-- Dialog header -->
        <div class="d-flex align-center justify-space-between px-5 py-3" style="border-bottom:1px solid rgba(0,0,0,0.08)">
          <div>
            <div class="font-weight-bold text-body-1">{{ selectedMission.ref }}</div>
            <div class="text-caption text-medium-emphasis">{{ selectedMission.institution }} &middot; {{ selectedMission.periode }}</div>
          </div>
          <div class="d-flex align-center ga-2">
            <v-chip :color="statutColor(selectedMission.statut)" size="x-small" variant="tonal">{{ selectedMission.statutLabel }}</v-chip>
            <v-btn
              icon="mdi-close"
              size="small"
              variant="tonal"
              color="error"
              class="close-btn-pulse"
              @click="closeDetail"
            />
          </div>
        </div>

        <!-- Tabs -->
        <v-tabs v-model="detailTab" density="compact" color="primary" style="border-bottom:1px solid rgba(0,0,0,0.08)">
          <v-tab value="infos" prepend-icon="mdi-information-outline">Infos</v-tab>
          <v-tab value="constats" prepend-icon="mdi-note-text">Constats</v-tab>
          <v-tab value="recos" prepend-icon="mdi-checkbox-marked-circle-outline">
            Recos
            <v-badge :content="selectedMission.recommandations.length" color="primary" inline class="ms-1"/>
          </v-tab>
          <v-tab value="docs" prepend-icon="mdi-paperclip">
            Docs
            <v-badge :content="selectedMission.documents.length" color="secondary" inline class="ms-1"/>
          </v-tab>
        </v-tabs>

        <v-card-text class="pa-0" style="max-height:520px">
        <v-window v-model="detailTab">

            <!-- Infos tab -->
            <v-window-item value="infos" class="pa-4">
              <v-row dense>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-1">Institution</div>
                  <div class="text-body-2">{{ selectedMission.institution }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-1">Periode</div>
                  <div class="text-body-2">{{ selectedMission.periode }}</div>
                </v-col>
                <v-col cols="6" class="mt-2">
                  <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-1">Chef de mission</div>
                  <div class="text-body-2">{{ selectedMission.chefMission }}</div>
                </v-col>
                <v-col cols="6" class="mt-2">
                  <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-1">Equipe</div>
                  <div class="d-flex flex-wrap ga-1 mt-1">
                    <v-chip v-for="m in selectedMission.equipe" :key="m" size="x-small" variant="outlined">{{ m }}</v-chip>
                  </div>
                </v-col>
                <v-col cols="12" class="mt-2">
                  <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-1">Perimetre et Objectifs</div>
                  <div class="text-body-2" style="white-space:pre-line">{{ selectedMission.perimetre }}</div>
                </v-col>
                <v-col cols="12" class="mt-3">
                  <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-2">Avancement</div>
                  <v-progress-linear :model-value="selectedMission.avancement" :color="selectedMission.avancement===100?'success':'primary'" rounded height="8" bg-color="surface-variant"/>
                  <div class="text-caption text-end mt-1">{{ selectedMission.avancement }}%</div>
                </v-col>
              </v-row>
              <v-divider class="my-3"/>
              <div class="d-flex ga-2">
                <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-account-plus" @click="openAssign(selectedMission)" class="flex-grow-1">
                  Assigner
                </v-btn>
                <v-btn color="success" variant="tonal" size="small" prepend-icon="mdi-file-export" @click="openExport(selectedMission)" class="flex-grow-1">
                  Exporter
                </v-btn>
              </div>
            </v-window-item>

            <!-- Constats tab -->
            <v-window-item value="constats" class="pa-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="text-body-2 font-weight-semibold">Constats de la mission</div>
                <v-chip size="x-small" color="warning" variant="tonal" prepend-icon="mdi-pencil">Editable</v-chip>
              </div>
              <v-textarea
                v-model="selectedMission.constats"
                label="Saisir les constats..."
                rows="6"
                class="mb-3"
                hide-details
              />
              <v-divider class="mb-3"/>
              <div class="text-body-2 font-weight-semibold mb-2">Anomalies liees</div>
              <v-chip
                v-for="a in selectedMission.anomalies"
                :key="a"
                size="small"
                variant="outlined"
                color="error"
                prepend-icon="mdi-alert-circle"
                class="me-1 mb-1"
              >{{ a }}</v-chip>
              <div v-if="!selectedMission.anomalies.length" class="text-caption text-medium-emphasis">Aucune anomalie liee</div>
              <v-divider class="my-3"/>
              <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-content-save" block @click="snack('Constats enregistres')">
                Enregistrer les constats
              </v-btn>
            </v-window-item>

            <!-- Recommandations tab -->
            <v-window-item value="recos" class="pa-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="text-body-2 font-weight-semibold">Recommandations ({{ selectedMission.recommandations.length }})</div>
                <v-btn size="x-small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addReco">Ajouter</v-btn>
              </div>

              <div v-if="selectedMission.recommandations.length===0" class="text-center pa-4 text-medium-emphasis">
                <v-icon icon="mdi-clipboard-list-outline" size="36" class="mb-2 opacity-40"/>
                <div class="text-caption">Aucune recommandation.</div>
              </div>

              <v-card
                v-for="(r, i) in selectedMission.recommandations"
                :key="i"
                class="mb-2"
                variant="outlined"
                rounded="lg"
              >
                <v-card-text class="pa-3">
                  <v-row dense>
                    <v-col cols="12">
                      <v-text-field
                        v-model="r.texte"
                        :label="`Recommandation ${i+1}`"
                        density="compact"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="5">
                      <v-select
                        v-model="r.responsable"
                        :items="['OTR','DGBF','API-ZF','UPF','MEF']"
                        label="Responsable"
                        density="compact"
                        hide-details
                        class="mt-2"
                      />
                    </v-col>
                    <v-col cols="5">
                      <v-text-field
                        v-model="r.echeance"
                        label="Echeance"
                        type="date"
                        density="compact"
                        hide-details
                        class="mt-2"
                      />
                    </v-col>
                    <v-col cols="2" class="d-flex align-end mt-2">
                      <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="selectedMission.recommandations.splice(i,1)"/>
                    </v-col>
                    <v-col cols="12">
                      <v-select
                        v-model="r.statut"
                        :items="recoStatuts"
                        item-title="label"
                        item-value="val"
                        label="Statut de mise en oeuvre"
                        density="compact"
                        hide-details
                        class="mt-2"
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-content-save" block class="mt-2" @click="snack('Recommandations enregistrees')">
                Enregistrer
              </v-btn>
            </v-window-item>

            <!-- Documents tab -->
            <v-window-item value="docs" class="pa-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="text-body-2 font-weight-semibold">Pieces documentaires ({{ selectedMission.documents.length }})</div>
                <v-btn size="x-small" color="primary" variant="tonal" prepend-icon="mdi-paperclip" @click="openAddDoc">
                  Ajouter
                </v-btn>
              </div>

              <div v-if="selectedMission.documents.length===0" class="text-center pa-4 text-medium-emphasis">
                <v-icon icon="mdi-folder-open-outline" size="36" class="mb-2 opacity-40"/>
                <div class="text-caption">Aucun document. Ajoutez des pieces a cette mission.</div>
              </div>

              <v-card
                v-for="doc in selectedMission.documents"
                :key="doc.id"
                class="mb-2"
                variant="outlined"
                rounded="lg"
              >
                <v-card-text class="pa-3">
                  <div class="d-flex align-center ga-2">
                    <v-icon icon="mdi-file-pdf-box" color="error" size="28"/>
                    <div class="flex-grow-1 min-width-0">
                      <div class="text-body-2 font-weight-semibold text-truncate">{{ doc.nom }}</div>
                      <div class="text-caption text-medium-emphasis">{{ doc.type }} &middot; {{ doc.pages }}p &middot; {{ doc.taille }}</div>
                    </div>
                  </div>
                  <div class="d-flex ga-2 mt-2">
                    <v-btn color="primary" variant="tonal" size="x-small" prepend-icon="mdi-eye" class="flex-grow-1" @click="viewDoc(doc)">
                      Visualiser
                    </v-btn>
                    <v-btn color="secondary" variant="outlined" size="x-small" icon="mdi-download"/>
                    <v-btn color="error" variant="text" size="x-small" icon="mdi-delete" @click="removeDoc(doc.id)"/>
                  </div>
                </v-card-text>
              </v-card>
            </v-window-item>
        </v-window>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Create / Edit Mission Dialog -->
    <v-dialog v-model="missionDialog" max-width="640" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          {{ editMode ? 'Editer la mission' : 'Creer une nouvelle mission' }}
        </v-card-title>
        <v-divider/>
        <v-card-text class="pa-5">
          <v-row dense>
            <v-col cols="12">
              <v-text-field v-model="form.ref" label="Reference mission" placeholder="AUDIT-IGF-2026-XXX" hide-details class="mb-3"/>
            </v-col>
            <v-col cols="12">
              <v-select v-model="form.institutions" :items="['OTR Douanes','OTR Impots','DGBF','API-ZF','UPF']" multiple chips label="Institutions ciblees" hide-details class="mb-3"/>
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.dateDebut" label="Date debut" type="date" hide-details/>
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.dateFin" label="Date fin" type="date" hide-details/>
            </v-col>
            <v-col cols="12" class="mt-3">
              <v-select v-model="form.chefMission" :items="auditeurs" label="Chef de mission" hide-details/>
            </v-col>
            <v-col cols="12" class="mt-3">
              <v-select v-model="form.equipe" :items="auditeurs" multiple chips label="Equipe d'audit" hide-details/>
            </v-col>
            <v-col cols="12" class="mt-3">
              <v-textarea v-model="form.perimetre" label="Perimetre et objectifs" rows="3" hide-details/>
            </v-col>
            <v-col cols="6" class="mt-3">
              <v-select
                v-model="form.statut"
                :items="[{title:'Planifiee',value:'planifiee'},{title:'En cours',value:'en_cours'},{title:'Cloturee',value:'cloturee'}]"
                item-title="title"
                item-value="value"
                label="Statut"
                hide-details
              />
            </v-col>
            <v-col cols="6" class="mt-3">
              <v-slider v-model="form.avancement" label="Avancement" :min="0" :max="100" :step="5" thumb-label hide-details color="primary"/>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider/>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="missionDialog=false">Annuler</v-btn>
          <v-btn color="primary" @click="saveMission">{{ editMode ? 'Enregistrer' : 'Creer la mission' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Assign Mission Dialog -->
    <v-dialog v-model="assignDialog" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">Assigner / Deleguer la mission</v-card-title>
        <v-card-text class="pa-5">
          <div class="text-body-2 font-weight-semibold mb-2">Mission : <span class="text-primary">{{ assignTarget ? assignTarget.ref : '' }}</span></div>
          <v-select v-model="assignChef" :items="auditeurs" label="Chef de mission" class="mb-3" hide-details/>
          <v-select v-model="assignEquipe" :items="auditeurs" multiple chips label="Membres de l'equipe" hide-details class="mb-3"/>
          <v-textarea v-model="assignNote" label="Message / Instructions" rows="2" hide-details/>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="assignDialog=false">Annuler</v-btn>
          <v-btn color="primary" prepend-icon="mdi-send" @click="saveAssign">Notifier et Assigner</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Export Dialog -->
    <v-dialog v-model="exportDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">Exporter le rapport</v-card-title>
        <v-card-text class="pa-5">
          <div class="text-body-2 mb-3">Mission : <strong>{{ exportTarget ? exportTarget.ref : '' }}</strong></div>
          <v-radio-group v-model="exportFormat" hide-details>
            <v-radio label="PDF — Rapport complet (constats + recos + documents)" value="pdf"/>
            <v-radio label="XLSX — Tableau des recommandations" value="xlsx"/>
            <v-radio label="DOCX — Rapport Word editable" value="docx"/>
            <v-radio label="CSV — Journal des constats" value="csv"/>
          </v-radio-group>
          <v-checkbox v-model="exportIncludeDocs" label="Inclure les pieces documentaires" hide-details class="mt-2"/>
          <v-checkbox v-model="exportSignature" label="Apposer signature numerique IGF/Cour des comptes" hide-details/>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="exportDialog=false">Annuler</v-btn>
          <v-btn color="success" prepend-icon="mdi-download" @click="doExport">
            Telecharger (.{{ exportFormat }})
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Export List Dialog -->
    <v-dialog v-model="exportListDialog" max-width="360">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">Exporter la liste des missions</v-card-title>
        <v-card-text class="pa-5">
          <v-radio-group v-model="exportListFormat" hide-details>
            <v-radio label="CSV" value="csv"/>
            <v-radio label="XLSX — Excel" value="xlsx"/>
            <v-radio label="PDF — Liste imprimable" value="pdf"/>
          </v-radio-group>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="exportListDialog=false">Annuler</v-btn>
          <v-btn color="success" prepend-icon="mdi-download" @click="doExportList">Exporter</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Document Dialog -->
    <v-dialog v-model="addDocDialog" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">Ajouter un document a la mission</v-card-title>
        <v-card-text class="pa-5">
          <v-text-field v-model="newDoc.nom" label="Nom du document" placeholder="Rapport_preliminaire.pdf" class="mb-3" hide-details/>
          <v-select
            v-model="newDoc.categorie"
            :items="['Ordre de mission','Rapport preliminaire','Rapport definitif','Pieces a conviction','Proces-verbal','Note de synthese','Autre']"
            label="Categorie"
            hide-details
            class="mb-3"
          />
          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model="newDoc.pages" label="Nombre de pages" type="number" hide-details/>
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="newDoc.taille" label="Taille" placeholder="256 Ko" hide-details/>
            </v-col>
          </v-row>
          <v-file-input label="Televerser le fichier (simulation)" accept=".pdf,.docx,.xlsx" hide-details class="mt-3" variant="outlined"/>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="addDocDialog=false">Annuler</v-btn>
          <v-btn color="primary" prepend-icon="mdi-paperclip" @click="confirmAddDoc">Attacher le document</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Full-screen DocumentViewer Dialog -->
    <v-dialog v-model="viewerDialog" fullscreen transition="dialog-bottom-transition">
      <v-card style="display:flex;flex-direction:column;height:100vh">
        <v-toolbar color="secondary" density="compact" style="flex-shrink:0">
          <v-btn icon="mdi-arrow-left" variant="text" @click="viewerDialog=false"/>
          <v-toolbar-title class="text-body-2">
            <span class="text-medium-emphasis me-2">{{ selectedMission ? selectedMission.ref : '' }}</span>
            <v-icon icon="mdi-chevron-right" size="14" class="me-2"/>
            <span>{{ viewerDoc ? viewerDoc.nom : '' }}</span>
          </v-toolbar-title>
          <v-spacer/>
          <v-btn variant="tonal" size="small" prepend-icon="mdi-export" color="warning" class="me-2" @click="triggerViewerExport">
            Exporter annotations
          </v-btn>
          <v-btn icon="mdi-close" variant="text" @click="viewerDialog=false"/>
        </v-toolbar>
        <div style="flex:1;min-height:0;overflow:hidden">
          <DocumentViewer
            v-if="viewerDialog && viewerDoc"
            ref="viewerRef"
            :filename="viewerDoc.nom"
            :total-pages="viewerDoc.pages"
            style="height:100%;border-radius:0;border:none"
          >
            <template #default="{ page }">
              <div v-html="renderMissionDocPage(viewerDoc, page)"/>
            </template>
          </DocumentViewer>
        </div>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" color="success" timeout="3000" location="bottom right">
      <v-icon icon="mdi-check-circle" class="me-2"/>{{ snackMsg }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import DocumentViewer from '../../components/DocumentViewer.vue'

// ── Types ──────────────────────────────────────────────────────────────────
interface MissionDoc {
  id: string
  nom: string
  type: string
  categorie: string
  pages: number
  taille: string
}

interface Recommandation {
  texte: string
  responsable: string
  echeance: string
  statut: string
}

interface Mission {
  ref: string
  institution: string
  institutions: string[]
  periode: string
  dateDebut?: string
  dateFin?: string
  statut: string
  statutLabel: string
  chefMission: string
  equipe: string[]
  perimetre: string
  avancement: number
  constats: string
  anomalies: string[]
  recommandations: Recommandation[]
  documents: MissionDoc[]
}

// ── Mock data ──────────────────────────────────────────────────────────────
const missions = ref([] as Mission[])
missions.value = [
  {
    ref: 'AUDIT-IGF-2026-001',
    institution: 'OTR Douanes',
    institutions: ['OTR Douanes'],
    periode: 'Jan-Mar 2026',
    dateDebut: '2026-01-10',
    dateFin: '2026-03-31',
    statut: 'en_cours',
    statutLabel: 'En cours',
    chefMission: 'S. AGBEKO',
    equipe: ['S. AGBEKO', 'A. KPODO'],
    perimetre: 'Controle a posteriori des exonerations douanieres accordees en 2025.\nVerification de la conformite avec le CGI Art. 215 et la LFI 2025.',
    avancement: 65,
    constats: 'Depassement de quota constate sur 3 dossiers (LOME LOGISTICS SA, PORT DE LOME SARL, TOGO STEEL SARL).\nBase juridique invalide relevee sur le dossier OASE-2025-0075.',
    anomalies: ['A001', 'A002', 'A006'],
    recommandations: [
      { texte: "Mise en place d'un controle automatise des quotas dans SYDONIA", responsable: 'OTR', echeance: '2026-06-30', statut: 'en_cours' },
      { texte: 'Regularisation des bases juridiques sur 5 dossiers identifies', responsable: 'UPF', echeance: '2026-03-31', statut: 'ok' },
    ],
    documents: [
      { id: 'd1', nom: 'Ordre_mission_AUDIT-IGF-2026-001.pdf', type: 'PDF', categorie: 'Ordre de mission', pages: 2, taille: '98 Ko' },
      { id: 'd2', nom: 'Rapport_preliminaire_Jan2026.pdf', type: 'PDF', categorie: 'Rapport preliminaire', pages: 12, taille: '1,2 Mo' },
    ],
  },
  {
    ref: 'AUDIT-CC-2026-002',
    institution: 'DGBF',
    institutions: ['DGBF', 'UPF'],
    periode: 'Avr 2026',
    dateDebut: '2026-04-15',
    dateFin: '2026-04-30',
    statut: 'planifiee',
    statutLabel: 'Planifiee',
    chefMission: 'A. KPODO',
    equipe: ['A. KPODO'],
    perimetre: 'Audit des depenses fiscales inscrites en annexe LFI 2026.\nConformite avec la Directive UEMOA 06/2009.',
    avancement: 0,
    constats: '',
    anomalies: [],
    recommandations: [],
    documents: [
      { id: 'd3', nom: 'Ordre_mission_AUDIT-CC-2026-002.pdf', type: 'PDF', categorie: 'Ordre de mission', pages: 2, taille: '94 Ko' },
    ],
  },
  {
    ref: 'AUDIT-IGF-2025-018',
    institution: 'API-ZF',
    institutions: ['API-ZF', 'SAZOF'],
    periode: 'Nov-Dec 2025',
    dateDebut: '2025-11-03',
    dateFin: '2025-12-19',
    statut: 'cloturee',
    statutLabel: 'Cloturee',
    chefMission: 'S. AGBEKO',
    equipe: ['S. AGBEKO', 'A. KPODO', 'M. KOFFI'],
    perimetre: 'Controle des conventions Zone Franche Industrielle et respect des engagements emplois/investissements.',
    avancement: 100,
    constats: 'Les 6 entreprises ZFI controlees respectent globalement leurs engagements contractuels.\nDeux entreprises presentent un retard dans la creation d\'emplois (moins de 80% de l\'objectif).',
    anomalies: ['A003'],
    recommandations: [
      { texte: 'Mettre a jour le registre des emplois dans GUDEF trimestriellement', responsable: 'API-ZF', echeance: '2026-01-31', statut: 'ok' },
      { texte: 'Notifier par courrier les 2 entreprises en retard sur les emplois', responsable: 'API-ZF', echeance: '2025-12-31', statut: 'ok' },
    ],
    documents: [
      { id: 'd4', nom: 'Rapport_definitif_AUDIT-IGF-2025-018.pdf', type: 'PDF', categorie: 'Rapport definitif', pages: 24, taille: '2,4 Mo' },
      { id: 'd5', nom: 'PV_cloture_Nov2025.pdf', type: 'PDF', categorie: 'Proces-verbal', pages: 4, taille: '210 Ko' },
      { id: 'd6', nom: 'Annexes_preuves_ZFI.pdf', type: 'PDF', categorie: 'Pieces a conviction', pages: 18, taille: '3,1 Mo' },
    ],
  },
]

// ── State ──────────────────────────────────────────────────────────────────
const search = ref('')
const filterStatut = ref('Tous')
const filterInst = ref('Toutes')
const selectedMission = ref(null as Mission | null)
const detailDialog = ref(false)
const detailTab = ref('infos')

// Dialogs
const missionDialog = ref(false)
const editMode = ref(false)
const assignDialog = ref(false)
const assignTarget = ref(null as Mission | null)
const exportDialog = ref(false)
const exportTarget = ref(null as Mission | null)
const exportListDialog = ref(false)
const addDocDialog = ref(false)
const viewerDialog = ref(false)
const viewerDoc = ref(null as MissionDoc | null)
const viewerRef = ref(null as any)

// Snackbar
const snackbar = ref(false)
const snackMsg = ref('')

function snack(msg: string) { snackMsg.value = msg; snackbar.value = true }

// ── Filters & computed ─────────────────────────────────────────────────────
const statutOptions = ['Tous', 'Planifiee', 'En cours', 'Cloturee']
const instOptions = ['Toutes', 'OTR Douanes', 'OTR Impots', 'DGBF', 'API-ZF', 'UPF']
const auditeurs = ['S. AGBEKO', 'A. KPODO', 'M. KOFFI', 'K. ABALO', 'Y. DOSSOU']
const recoStatuts = [
  { label: 'Non mise en oeuvre', val: 'nok' },
  { label: 'En cours', val: 'en_cours' },
  { label: 'Mise en oeuvre', val: 'ok' },
]

const filteredMissions = computed(() =>
  missions.value.filter(m => {
    if (filterStatut.value !== 'Tous' && m.statutLabel !== filterStatut.value) return false
    if (filterInst.value !== 'Toutes' && !m.institutions.includes(filterInst.value)) return false
    return true
  })
)

const kpis = computed(() => [
  { label: 'Total missions', value: missions.value.length, icon: 'mdi-briefcase-search', color: 'primary' },
  { label: 'En cours', value: missions.value.filter(m => m.statut === 'en_cours').length, icon: 'mdi-progress-clock', color: 'info' },
  { label: 'Planifiees', value: missions.value.filter(m => m.statut === 'planifiee').length, icon: 'mdi-calendar-clock', color: 'warning' },
  { label: 'Cloturees', value: missions.value.filter(m => m.statut === 'cloturee').length, icon: 'mdi-check-circle', color: 'success' },
])

// ── Calendar ───────────────────────────────────────────────────────────────
const calMonth = ref(new Date().getMonth() + 1)
const calYear = ref(new Date().getFullYear())
const CAL_MONTHS = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre']
const calMonthLabel = computed(() => `${CAL_MONTHS[calMonth.value - 1]} ${calYear.value}`)

const calEvents = computed(() =>
  missions.value
    .filter(m => m.dateDebut)
    .map(m => ({
      title: m.ref.replace('AUDIT-', ''),
      start: m.dateDebut as string,
      end: m.dateFin || m.dateDebut as string,
      color: statutColor(m.statut),
      missionRef: m.ref,
    }))
)

function prevMonth() {
  if (calMonth.value === 1) { calMonth.value = 12; calYear.value-- }
  else calMonth.value--
}
function nextMonth() {
  if (calMonth.value === 12) { calMonth.value = 1; calYear.value++ }
  else calMonth.value++
}
function goToday() {
  const now = new Date()
  calMonth.value = now.getMonth() + 1
  calYear.value = now.getFullYear()
}
function onCalEventClick(event: any) {
  const m = missions.value.find(x => x.ref === event.missionRef)
  if (m) selectMission(m)
}
function calEventBg(color: string) {
  const map: Record<string, string> = { info: 'rgba(2,119,189,0.15)', warning: 'rgba(230,81,0,0.15)', success: 'rgba(27,143,76,0.15)' }
  return map[color] || 'rgba(39,116,174,0.12)'
}
function calEventFg(color: string) {
  const map: Record<string, string> = { info: '#0277BD', warning: '#E65100', success: '#1B8F4C' }
  return map[color] || '#2774AE'
}

// ── Table headers ──────────────────────────────────────────────────────────
const mHeaders = [
  { title: 'Reference', key: 'ref' },
  { title: 'Institution', key: 'institution' },
  { title: 'Periode', key: 'periode' },
  { title: 'Chef', key: 'chefMission' },
  { title: 'Avancement', key: 'avancement' },
  { title: 'Statut', key: 'statut' },
  { title: 'Docs', key: 'docs', sortable: false },
  { title: '', key: 'actions', sortable: false },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function statutColor(s: string) {
  return s === 'en_cours' ? 'info' : s === 'planifiee' ? 'warning' : 'success'
}

function selectMission(m: Mission) {
  selectedMission.value = m
  detailTab.value = 'infos'
  detailDialog.value = true
}
function closeDetail() {
  detailDialog.value = false
  selectedMission.value = null
}

// ── Create / Edit ──────────────────────────────────────────────────────────
const form = ref({
  ref: '', institutions: [] as string[], dateDebut: '', dateFin: '',
  chefMission: '', equipe: [] as string[], perimetre: '',
  statut: 'planifiee', avancement: 0,
})

function openCreate() {
  editMode.value = false
  form.value = {
    ref: `AUDIT-IGF-2026-00${missions.value.length + 1}`,
    institutions: [], dateDebut: '', dateFin: '',
    chefMission: '', equipe: [], perimetre: '',
    statut: 'planifiee', avancement: 0,
  }
  missionDialog.value = true
}

function openEdit(m: Mission) {
  editMode.value = true
  form.value = {
    ref: m.ref, institutions: [...m.institutions],
    dateDebut: '', dateFin: '',
    chefMission: m.chefMission, equipe: [...m.equipe],
    perimetre: m.perimetre, statut: m.statut, avancement: m.avancement,
  }
  missionDialog.value = true
}

function saveMission() {
  if (editMode.value) {
    const m = missions.value.find(x => x.ref === form.value.ref)
    if (m) {
      m.chefMission = form.value.chefMission
      m.equipe = form.value.equipe
      m.perimetre = form.value.perimetre
      m.statut = form.value.statut
      m.statutLabel = form.value.statut === 'planifiee' ? 'Planifiee' : form.value.statut === 'en_cours' ? 'En cours' : 'Cloturee'
      m.avancement = form.value.avancement
      if (selectedMission.value && selectedMission.value.ref === m.ref) selectedMission.value = m
    }
    snack('Mission mise a jour')
  } else {
    const nm: Mission = {
      ref: form.value.ref,
      institution: form.value.institutions[0] || 'N/A',
      institutions: form.value.institutions,
      periode: `${form.value.dateDebut} > ${form.value.dateFin}`,
      statut: form.value.statut,
      statutLabel: form.value.statut === 'planifiee' ? 'Planifiee' : form.value.statut === 'en_cours' ? 'En cours' : 'Cloturee',
      chefMission: form.value.chefMission,
      equipe: form.value.equipe,
      perimetre: form.value.perimetre,
      avancement: form.value.avancement,
      constats: '',
      anomalies: [],
      recommandations: [],
      documents: [],
    }
    missions.value.push(nm)
    snack('Mission creee avec succes')
  }
  missionDialog.value = false
}

// ── Assign ─────────────────────────────────────────────────────────────────
const assignChef = ref('')
const assignEquipe = ref([] as string[])
const assignNote = ref('')

function openAssign(m: Mission) {
  assignTarget.value = m
  assignChef.value = m.chefMission
  assignEquipe.value = [...m.equipe]
  assignNote.value = ''
  assignDialog.value = true
}

function saveAssign() {
  if (assignTarget.value) {
    assignTarget.value.chefMission = assignChef.value
    assignTarget.value.equipe = assignEquipe.value
    if (selectedMission.value && selectedMission.value.ref === assignTarget.value.ref) {
      selectedMission.value = assignTarget.value
    }
  }
  assignDialog.value = false
  snack('Mission assignee — notification envoyee')
}

// ── Export ─────────────────────────────────────────────────────────────────
const exportFormat = ref('pdf')
const exportIncludeDocs = ref(true)
const exportSignature = ref(true)
const exportListFormat = ref('pdf')

function openExport(m: Mission) {
  exportTarget.value = m
  exportDialog.value = true
}

function doExport() {
  exportDialog.value = false
  snack(`Rapport ${exportTarget.value ? exportTarget.value.ref : ''} exporte en .${exportFormat.value}`)
}

function doExportList() {
  exportListDialog.value = false
  snack(`Liste des missions exportee en .${exportListFormat.value}`)
}

// ── Recommandations ────────────────────────────────────────────────────────
function addReco() {
  if (selectedMission.value) {
    selectedMission.value.recommandations.push({ texte: '', responsable: 'OTR', echeance: '', statut: 'nok' })
  }
}

// ── Documents ──────────────────────────────────────────────────────────────
const newDoc = ref({ nom: '', categorie: 'Autre', pages: 1, taille: '' })

function openAddDoc() {
  newDoc.value = { nom: '', categorie: 'Autre', pages: 1, taille: '' }
  addDocDialog.value = true
}

function confirmAddDoc() {
  if (!selectedMission.value || !newDoc.value.nom) return
  selectedMission.value.documents.push({
    id: Date.now().toString(),
    nom: newDoc.value.nom.endsWith('.pdf') ? newDoc.value.nom : newDoc.value.nom + '.pdf',
    type: 'PDF',
    categorie: newDoc.value.categorie,
    pages: Number(newDoc.value.pages),
    taille: newDoc.value.taille || '-',
  })
  addDocDialog.value = false
  snack('Document ajoute a la mission')
}

function removeDoc(id: string) {
  if (!selectedMission.value) return
  selectedMission.value.documents = selectedMission.value.documents.filter(d => d.id !== id)
  snack('Document supprime')
}

function viewDoc(doc: MissionDoc) {
  viewerDoc.value = doc
  viewerDialog.value = true
}

function triggerViewerExport() {
  if (viewerRef.value) viewerRef.value.exportAnnotations?.()
}

// ── Mock page renderer ─────────────────────────────────────────────────────
function renderMissionDocPage(doc: MissionDoc | null, page: number): string {
  if (!doc) return ''
  const m = selectedMission.value
  if (!m) return ''

  if (doc.categorie === 'Ordre de mission') {
    return `<div style="text-align:center;margin-bottom:28px">
      <div style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">REPUBLIQUE TOGOLAISE — MINISTERE DE L ECONOMIE ET DES FINANCES</div>
      <div style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">INSPECTION GENERALE DES FINANCES</div>
      <div style="font-size:14px;font-weight:700;color:#1A2332;border-bottom:2px solid #2774AE;padding-bottom:8px;margin-bottom:8px">ORDRE DE MISSION N ${m.ref}</div>
    </div>
    <p style="font-size:12px;line-height:1.8;margin-bottom:16px">Le Ministre de l Economie et des Finances <strong>ORDONNE</strong> une mission de controle a posteriori aupres de <strong>${m.institution}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px">
      <tr style="background:#F4F6F9"><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1;width:40%">Reference</td><td style="padding:8px;border:1px solid #CBD5E1">${m.ref}</td></tr>
      <tr><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Institution</td><td style="padding:8px;border:1px solid #CBD5E1">${m.institutions.join(', ')}</td></tr>
      <tr style="background:#F4F6F9"><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Periode</td><td style="padding:8px;border:1px solid #CBD5E1">${m.periode}</td></tr>
      <tr><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Chef de mission</td><td style="padding:8px;border:1px solid #CBD5E1">${m.chefMission}</td></tr>
      <tr style="background:#F4F6F9"><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Equipe</td><td style="padding:8px;border:1px solid #CBD5E1">${m.equipe.join(', ')}</td></tr>
    </table>
    <div style="font-size:12px;font-weight:600;margin-bottom:8px">PERIMETRE ET OBJECTIFS</div>
    <p style="font-size:12px;line-height:1.8;white-space:pre-line">${m.perimetre}</p>`
  }

  if (doc.categorie === 'Rapport preliminaire' || doc.categorie === 'Rapport definitif') {
    const pages: Record<number, string> = {
      1: `<div style="text-align:center;margin-bottom:28px">
        <div style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">INSPECTION GENERALE DES FINANCES — TOGO</div>
        <div style="font-size:14px;font-weight:700;color:#1A2332;border-bottom:2px solid #2774AE;padding-bottom:8px;margin-bottom:8px">${doc.categorie.toUpperCase()} — ${m.ref}</div>
      </div>
      <div style="font-size:12px;font-weight:700;margin-bottom:8px;color:#2774AE">1. RESUME EXECUTIF</div>
      <p style="font-size:12px;line-height:1.8;margin-bottom:16px">La mission de controle aupres de <strong>${m.institution}</strong> a permis d identifier ${m.anomalies.length} anomalie(s) et de formuler ${m.recommandations.length} recommandation(s).</p>
      <div style="font-size:12px;font-weight:700;margin-bottom:8px;color:#2774AE">2. CONSTATS PRINCIPAUX</div>
      <p style="font-size:12px;line-height:1.8;white-space:pre-line">${m.constats || '(Aucun constat saisi)'}</p>`,
      2: `<div style="font-size:12px;font-weight:700;margin-bottom:12px;color:#2774AE">3. RECOMMANDATIONS</div>
      ${m.recommandations.map((r, i) => `<div style="margin-bottom:16px;padding:12px;background:#F8FAFC;border-left:4px solid #2774AE;border-radius:4px">
        <div style="font-size:12px;font-weight:600;margin-bottom:4px">Recommandation ${i + 1}</div>
        <div style="font-size:12px;line-height:1.8">${r.texte || '(non renseigne)'}</div>
        <div style="font-size:11px;color:#64748B;margin-top:4px">Responsable : ${r.responsable} - Echeance : ${r.echeance || 'N/A'}</div>
      </div>`).join('') || '<p style="font-size:12px;color:#64748B">(Aucune recommandation)</p>'}`,
    }
    return pages[page] || `<div style="color:#64748B;text-align:center;padding:40px">Page ${page}</div>`
  }

  return `<div style="text-align:center;margin-bottom:28px">
    <div style="font-size:14px;font-weight:700;color:#1A2332;border-bottom:2px solid #2774AE;padding-bottom:8px">${doc.nom}</div>
    <div style="font-size:11px;color:#64748B;margin-top:8px">Mission : ${m.ref} — ${m.institution}</div>
  </div>
  <p style="font-size:12px;line-height:1.8;color:#475569">Categorie : <strong>${doc.categorie}</strong><br>Page ${page} sur ${doc.pages}.</p>`
}
</script>

<style scoped>
/* ── Close button pulse animation ── */
@keyframes pulse-close {
  0%   { box-shadow: 0 0 0 0 rgba(198, 40, 40, 0.55); }
  60%  { box-shadow: 0 0 0 7px rgba(198, 40, 40, 0); }
  100% { box-shadow: 0 0 0 0 rgba(198, 40, 40, 0); }
}
.close-btn-pulse {
  animation: pulse-close 1.8s ease-in-out infinite;
}
.close-btn-pulse:hover {
  animation: none;
  transform: scale(1.12);
  transition: transform 0.15s ease;
}

/* ── Selected mission row highlight ── */
:deep(.mission-row--selected td) {
  background: rgba(39, 116, 174, 0.07) !important;
  border-left: 3px solid #2774AE;
}
:deep(.mission-row--selected:first-child td:first-child) {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}
</style>
