<template>
  <div>
    <PageHeader
      title="Moteur de règles"
      subtitle="Détection d'anomalies, contrôle de conformité et actions automatiques"
      icon="mdi-cog-play"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-play-speed" class="me-2" @click="runAllDialog=true">
          Exécuter toutes
        </v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="openCreate">
          Nouvelle règle
        </v-btn>
      </template>
    </PageHeader>

    <!-- KPIs -->
    <v-row class="mb-4">
      <v-col v-for="k in kpis" :key="k.label" cols="6" md="3">
        <v-card rounded="lg" elevation="1" class="pa-3">
          <div class="d-flex align-center ga-3">
            <v-avatar :color="k.color" size="40" rounded="lg">
              <v-icon :icon="k.icon" color="white" size="20"/>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold" :style="{ color: `rgb(var(--v-theme-${k.color}))` }">{{ k.value }}</div>
              <div class="text-caption text-medium-emphasis">{{ k.label }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-tabs v-model="mainTab" color="primary" density="compact" class="mb-3">
      <v-tab value="rules" prepend-icon="mdi-cog-play">Règles ({{ regles.length }})</v-tab>
      <v-tab value="journal" prepend-icon="mdi-history">Journal <v-badge :content="journal.length" color="warning" inline class="ms-1"/></v-tab>
      <v-tab value="stats" prepend-icon="mdi-chart-bar">Statistiques</v-tab>
    </v-tabs>

    <v-window v-model="mainTab">

      <!-- ══ RULES ══ -->
      <v-window-item value="rules">
        <!-- Filters -->
        <v-card rounded="lg" elevation="1" class="mb-3">
          <v-card-text class="pa-3">
            <v-row dense>
              <v-col cols="12" md="5">
                <v-text-field v-model="search" label="Rechercher une règle…" prepend-inner-icon="mdi-magnify" density="compact" hide-details clearable/>
              </v-col>
              <v-col cols="6" md="3">
                <v-select v-model="filterSev" :items="['Toutes','bloquant','avertissement','info']" label="Sévérité" density="compact" hide-details/>
              </v-col>
              <v-col cols="6" md="2">
                <v-select v-model="filterCat" :items="['Toutes', ...categories]" label="Catégorie" density="compact" hide-details/>
              </v-col>
              <v-col cols="12" md="2">
                <v-select v-model="filterActive" :items="[{title:'Toutes',value:'all'},{title:'Actives',value:'active'},{title:'Inactives',value:'inactive'}]" label="Statut" density="compact" hide-details/>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Rule cards -->
        <div class="d-flex justify-end mb-2 ga-2">
          <v-btn size="x-small" variant="text" prepend-icon="mdi-expand-all" @click="expandAll">Tout ouvrir</v-btn>
          <v-btn size="x-small" variant="text" prepend-icon="mdi-collapse-all" @click="collapseAll">Tout fermer</v-btn>
        </div>

        <div v-if="filteredRegles.length === 0" class="text-center pa-8 text-medium-emphasis">
          <v-icon icon="mdi-filter-off" size="40" class="mb-2 opacity-40"/>
          <div>Aucune règle ne correspond aux filtres.</div>
        </div>

        <div v-for="regle in filteredRegles" :key="regle.id" class="rule-node mb-2" :class="[`rule--${regle.severite}`, regle.expanded ? 'rule--open' : '']">
          <!-- Header -->
          <div class="rule-header" @click="regle.expanded = !regle.expanded">
            <div class="d-flex align-center ga-3 flex-grow-1 min-width-0">
              <v-avatar :color="sevColor(regle.severite)" size="34" rounded="lg">
                <v-icon :icon="sevIcon(regle.severite)" size="16" color="white"/>
              </v-avatar>
              <div class="min-width-0 flex-grow-1">
                <div class="d-flex align-center ga-2 flex-wrap">
                  <span class="text-body-2 font-weight-semibold text-truncate" style="max-width:400px">{{ regle.description }}</span>
                  <v-chip :color="sevColor(regle.severite)" size="x-small" variant="tonal">{{ regle.severite }}</v-chip>
                  <v-chip color="secondary" size="x-small" variant="outlined" prepend-icon="mdi-tag-outline">{{ regle.categorie }}</v-chip>
                </div>
                <div class="text-caption text-medium-emphasis d-flex align-center ga-3 mt-1">
                  <span><v-icon icon="mdi-play-circle" size="12" class="me-1"/>{{ regle.declenchements }} déclenchement(s) / 30j</span>
                  <span><v-icon icon="mdi-code-braces" size="12" class="me-1"/>{{ condPreview(regle.conditions) }}</span>
                </div>
              </div>
            </div>
            <div class="d-flex align-center ga-2 flex-shrink-0" @click.stop>
              <v-switch v-model="regle.active" hide-details density="compact" :color="regle.active ? 'success' : 'secondary'" inset @update:model-value="onToggle(regle)"/>
              <v-tooltip text="Modifier" location="top">
                <template #activator="{ props }">
                  <v-btn v-bind="props" size="x-small" icon="mdi-pencil" variant="text" color="primary" @click="openEdit(regle)"/>
                </template>
              </v-tooltip>
              <v-tooltip text="Tester maintenant" location="top">
                <template #activator="{ props }">
                  <v-btn v-bind="props" size="x-small" icon="mdi-play" variant="text" color="secondary" @click="testRule(regle)"/>
                </template>
              </v-tooltip>
              <v-tooltip text="Supprimer" location="top">
                <template #activator="{ props }">
                  <v-btn v-bind="props" size="x-small" icon="mdi-delete-outline" variant="text" color="error" @click="deleteRule(regle.id)"/>
                </template>
              </v-tooltip>
              <v-btn size="x-small" :icon="regle.expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" variant="text"/>
            </div>
          </div>

          <!-- Expandable body -->
          <v-expand-transition>
            <div v-if="regle.expanded" class="rule-body">
              <v-divider class="mb-3"/>
              <v-tabs v-model="regle.activeTab" density="compact" color="primary" class="mb-3">
                <v-tab value="condition" prepend-icon="mdi-code-braces" class="text-caption">Condition</v-tab>
                <v-tab value="actions" prepend-icon="mdi-lightning-bolt" class="text-caption">Actions</v-tab>
                <v-tab value="portee" prepend-icon="mdi-target" class="text-caption">Portée</v-tab>
              </v-tabs>

              <v-window v-model="regle.activeTab">

                <!-- Condition tab -->
                <v-window-item value="condition">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-caption font-weight-bold text-medium-emphasis">Conditions (SI…)</span>
                    <div class="d-flex ga-2">
                      <v-btn-toggle v-model="regle.andOr" density="compact" variant="outlined" color="primary" rounded="pill" mandatory>
                        <v-btn value="ET" size="x-small">ET</v-btn>
                        <v-btn value="OU" size="x-small">OU</v-btn>
                      </v-btn-toggle>
                      <v-btn size="x-small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addCond(regle)">Ajouter</v-btn>
                    </div>
                  </div>

                  <div v-for="(cond, ci) in regle.conditions" :key="ci" class="d-flex align-center ga-2 mb-2">
                    <v-chip v-if="ci > 0" :color="regle.andOr === 'ET' ? 'primary' : 'warning'" size="x-small" variant="tonal" class="flex-shrink-0">
                      {{ regle.andOr }}
                    </v-chip>
                    <v-select v-model="cond.field" :items="condFields" label="Champ" density="compact" hide-details style="max-width:200px"/>
                    <v-select v-model="cond.operator" :items="condOperators" label="Opérateur" density="compact" hide-details style="max-width:130px"/>
                    <v-text-field v-model="cond.value" label="Valeur" density="compact" hide-details class="flex-grow-1"/>
                    <v-btn size="x-small" icon="mdi-close" variant="text" color="error" @click="regle.conditions.splice(ci,1)"/>
                  </div>

                  <div v-if="regle.conditions.length === 0" class="text-center pa-3 text-medium-emphasis">
                    <v-icon icon="mdi-code-braces-box" size="24" class="mb-1 opacity-40"/>
                    <div class="text-caption">Aucune condition définie — règle toujours déclenchée.</div>
                  </div>

                  <!-- Natural language preview -->
                  <v-card v-if="regle.conditions.length" variant="tonal" color="primary" rounded="lg" class="mt-3 pa-3">
                    <div class="text-caption text-medium-emphasis mb-1">Aperçu langage naturel :</div>
                    <code class="text-caption" style="color:rgb(var(--v-theme-primary))">
                      SI {{ regle.conditions.map(c => `${c.field} ${c.operator} ${c.value || '…'}`).join(` ${regle.andOr} `) }}
                    </code>
                  </v-card>
                </v-window-item>

                <!-- Actions tab -->
                <v-window-item value="actions">
                  <div class="text-caption font-weight-bold text-medium-emphasis mb-3">Actions déclenchées lors de la détection :</div>
                  <v-row dense>
                    <v-col cols="12" md="6">
                      <v-card variant="outlined" rounded="lg" class="pa-3 mb-2">
                        <div class="d-flex align-center justify-space-between">
                          <div class="d-flex align-center ga-2">
                            <v-icon icon="mdi-block-helper" color="error" size="16"/>
                            <span class="text-caption font-weight-semibold">Bloquer le dossier</span>
                          </div>
                          <v-switch v-model="regle.actions.bloquer" hide-details density="compact" color="error" inset/>
                        </div>
                      </v-card>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-card variant="outlined" rounded="lg" class="pa-3 mb-2">
                        <div class="d-flex align-center justify-space-between">
                          <div class="d-flex align-center ga-2">
                            <v-icon icon="mdi-flag-variant" color="warning" size="16"/>
                            <span class="text-caption font-weight-semibold">Créer une anomalie</span>
                          </div>
                          <v-switch v-model="regle.actions.anomalie" hide-details density="compact" color="warning" inset/>
                        </div>
                      </v-card>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-card variant="outlined" rounded="lg" class="pa-3 mb-2">
                        <div class="d-flex align-center justify-space-between">
                          <div class="d-flex align-center ga-2">
                            <v-icon icon="mdi-bell-ring" color="info" size="16"/>
                            <span class="text-caption font-weight-semibold">Notifier l'agent</span>
                          </div>
                          <v-switch v-model="regle.actions.notifier" hide-details density="compact" color="info" inset/>
                        </div>
                      </v-card>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-card variant="outlined" rounded="lg" class="pa-3 mb-2">
                        <div class="d-flex align-center justify-space-between">
                          <div class="d-flex align-center ga-2">
                            <v-icon icon="mdi-email-alert" color="primary" size="16"/>
                            <span class="text-caption font-weight-semibold">Notifier le superviseur</span>
                          </div>
                          <v-switch v-model="regle.actions.notifSuperviseur" hide-details density="compact" color="primary" inset/>
                        </div>
                      </v-card>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-card variant="outlined" rounded="lg" class="pa-3 mb-2">
                        <div class="d-flex align-center justify-space-between">
                          <div class="d-flex align-center ga-2">
                            <v-icon icon="mdi-journal-plus" color="secondary" size="16"/>
                            <span class="text-caption font-weight-semibold">Journaliser dans l'audit</span>
                          </div>
                          <v-switch v-model="regle.actions.journaliser" hide-details density="compact" color="secondary" inset/>
                        </div>
                      </v-card>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-card variant="outlined" rounded="lg" class="pa-3 mb-2">
                        <div class="d-flex align-center justify-space-between">
                          <div class="d-flex align-center ga-2">
                            <v-icon icon="mdi-transfer" color="purple" size="16"/>
                            <span class="text-caption font-weight-semibold">Réaffecter le dossier</span>
                          </div>
                          <v-switch v-model="regle.actions.reaffecter" hide-details density="compact" color="purple" inset/>
                        </div>
                      </v-card>
                    </v-col>
                  </v-row>
                  <!-- Test button -->
                  <div class="d-flex align-center ga-2 mt-2">
                    <v-btn size="small" color="secondary" variant="tonal" prepend-icon="mdi-flask" @click="testRule(regle)">
                      Tester sur données de démonstration
                    </v-btn>
                    <v-chip v-if="testSuccess === regle.id" color="success" size="x-small" variant="tonal" prepend-icon="mdi-check">Testé — 3 dossiers concernés</v-chip>
                  </div>
                </v-window-item>

                <!-- Portée tab -->
                <v-window-item value="portee">
                  <v-row dense>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="regle.portee.types"
                        :items="typesExo"
                        multiple chips closable-chips
                        label="Types d'exonération"
                        density="compact"
                        hide-details
                        class="mb-3"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="regle.portee.etapes"
                        :items="['Dépôt','Instruction','Visa DGBF','Signature','Notification','Toutes']"
                        multiple chips closable-chips
                        label="Étapes du workflow"
                        density="compact"
                        hide-details
                        class="mb-3"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="regle.portee.institutions"
                        :items="['OTR Douanes','OTR Impôts','DGBF','API-ZF','Toutes']"
                        multiple chips closable-chips
                        label="Institutions concernées"
                        density="compact"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="regle.portee.frequence"
                        :items="['En temps réel','Quotidien (nuit)','Hebdomadaire','Manuel uniquement']"
                        label="Fréquence d'évaluation"
                        density="compact"
                        hide-details
                      />
                    </v-col>
                  </v-row>
                </v-window-item>
              </v-window>
            </div>
          </v-expand-transition>
        </div>
      </v-window-item>

      <!-- ══ JOURNAL ══ -->
      <v-window-item value="journal">
        <v-card rounded="lg" elevation="1" class="mt-1">
          <div class="pa-4 pb-2 d-flex align-center justify-space-between flex-wrap ga-2">
            <span class="text-body-1 font-weight-semibold">Journal des déclenchements (30 derniers jours)</span>
            <div class="d-flex ga-2">
              <v-text-field v-model="journalSearch" placeholder="Filtrer…" prepend-inner-icon="mdi-magnify" density="compact" hide-details clearable style="max-width:220px"/>
              <v-select v-model="journalSevFilter" :items="['Toutes','bloquant','avertissement','info']" density="compact" hide-details style="max-width:160px"/>
              <v-btn size="small" variant="tonal" color="secondary" prepend-icon="mdi-file-export" @click="exportJournal">Exporter CSV</v-btn>
            </div>
          </div>
          <v-divider/>
          <v-list density="compact" class="pa-2">
            <v-list-item
              v-for="j in filteredJournal" :key="j.id"
              rounded="lg" class="mb-1 pa-3"
              :style="{ borderLeft: `3px solid ${j.severite === 'bloquant' ? '#C62828' : j.severite === 'avertissement' ? '#E65100' : '#0277BD'}` }"
            >
              <template #prepend>
                <v-avatar :color="sevColor(j.severite)" size="32" rounded="lg">
                  <v-icon :icon="sevIcon(j.severite)" size="16" color="white"/>
                </v-avatar>
              </template>
              <template #title>
                <span class="text-body-2 font-weight-semibold">{{ j.regle }}</span>
              </template>
              <template #subtitle>
                <span class="text-caption">
                  Dossier: <strong>{{ j.dossier }}</strong> · {{ j.beneficiaire }} · {{ j.date }}
                </span>
              </template>
              <template #append>
                <div class="d-flex flex-column align-end ga-1">
                  <v-chip :color="sevColor(j.severite)" size="x-small" variant="tonal">{{ j.severite }}</v-chip>
                  <v-chip :color="j.resolu ? 'success' : 'error'" size="x-small" variant="outlined">
                    {{ j.resolu ? 'Résolu' : 'En attente' }}
                  </v-chip>
                </div>
              </template>
            </v-list-item>
          </v-list>
          <div class="pa-3 text-caption text-medium-emphasis text-center border-t" style="border-top:1px solid rgba(0,0,0,0.06)">
            {{ filteredJournal.length }} événement(s) sur les 30 derniers jours
          </div>
        </v-card>
      </v-window-item>

      <!-- ══ STATS ══ -->
      <v-window-item value="stats">
        <v-row class="mt-1">
          <!-- Top rules by trigger count -->
          <v-col cols="12" md="6">
            <v-card rounded="lg" elevation="1" class="mb-4">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">
                Top règles — Déclenchements
              </v-card-title>
              <v-card-text class="pa-4">
                <div v-for="r in topRules" :key="r.id" class="mb-3">
                  <div class="d-flex align-center justify-space-between mb-1">
                    <span class="text-caption font-weight-semibold text-truncate" style="max-width:250px">{{ r.description }}</span>
                    <v-chip :color="sevColor(r.severite)" size="x-small" variant="tonal">{{ r.declenchements }}</v-chip>
                  </div>
                  <v-progress-linear
                    :model-value="(r.declenchements / maxDeclenchements) * 100"
                    :color="sevColor(r.severite)"
                    rounded
                    height="6"
                    bg-color="surface-variant"
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Severity breakdown -->
          <v-col cols="12" md="6">
            <v-card rounded="lg" elevation="1" class="mb-4">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Répartition par sévérité</v-card-title>
              <v-card-text class="pa-4">
                <div v-for="sev in sevStats" :key="sev.label" class="d-flex align-center ga-3 mb-4">
                  <v-avatar :color="sev.color" size="36" rounded="lg">
                    <v-icon :icon="sev.icon" color="white" size="18"/>
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="d-flex justify-space-between mb-1">
                      <span class="text-caption font-weight-semibold">{{ sev.label }}</span>
                      <span class="text-caption">{{ sev.count }} règle(s) · {{ sev.triggers }} déclenchements</span>
                    </div>
                    <v-progress-linear :model-value="sev.pct" :color="sev.color" rounded height="6" bg-color="surface-variant"/>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- Resolution rate -->
            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Taux de résolution</v-card-title>
              <v-card-text class="pa-4">
                <div class="d-flex align-center ga-4 mb-4">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-success">{{ resolutionRate }}%</div>
                    <div class="text-caption text-medium-emphasis">Taux global</div>
                  </div>
                  <v-divider vertical/>
                  <div class="flex-grow-1">
                    <div class="d-flex justify-space-between mb-1">
                      <span class="text-caption">Anomalies résolues</span>
                      <span class="text-caption font-weight-bold text-success">{{ resolvedCount }}</span>
                    </div>
                    <div class="d-flex justify-space-between">
                      <span class="text-caption">En attente de traitement</span>
                      <span class="text-caption font-weight-bold text-error">{{ pendingCount }}</span>
                    </div>
                  </div>
                </div>
                <v-progress-linear :model-value="resolutionRate" color="success" rounded height="10" bg-color="error-lighten"/>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Recent activity timeline -->
          <v-col cols="12">
            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Activité récente</v-card-title>
              <v-card-text class="pa-4">
                <v-timeline density="compact" align="start">
                  <v-timeline-item
                    v-for="j in journal.slice(0,6)" :key="j.id"
                    :dot-color="sevColor(j.severite)"
                    size="x-small"
                  >
                    <div class="d-flex align-center justify-space-between flex-wrap ga-2">
                      <div>
                        <div class="text-body-2 font-weight-semibold">{{ j.regle }}</div>
                        <div class="text-caption text-medium-emphasis">{{ j.dossier }} · {{ j.beneficiaire }}</div>
                      </div>
                      <div class="d-flex ga-1 align-center">
                        <span class="text-caption text-medium-emphasis">{{ j.date }}</span>
                        <v-chip :color="sevColor(j.severite)" size="x-small" variant="tonal">{{ j.severite }}</v-chip>
                      </div>
                    </div>
                  </v-timeline-item>
                </v-timeline>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

    </v-window>

    <!-- ── Create / Edit Rule Dialog ── -->
    <v-dialog v-model="ruleDialog" max-width="640" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">
          {{ editMode ? 'Modifier la règle' : 'Créer une règle' }}
        </v-card-title>
        <v-divider/>
        <v-card-text class="pa-5">
          <v-text-field v-model="form.description" label="Description de la règle" prepend-inner-icon="mdi-text" class="mb-3" hide-details/>
          <v-row dense class="mb-3">
            <v-col cols="6">
              <v-select v-model="form.severite" :items="['bloquant','avertissement','info']" label="Sévérité" hide-details/>
            </v-col>
            <v-col cols="6">
              <v-select v-model="form.categorie" :items="categories" label="Catégorie" hide-details/>
            </v-col>
          </v-row>

          <!-- Condition builder -->
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-body-2 font-weight-semibold">Conditions</span>
            <div class="d-flex ga-2">
              <v-btn-toggle v-model="form.andOr" density="compact" variant="outlined" color="primary" rounded="pill" mandatory>
                <v-btn value="ET" size="x-small">ET</v-btn>
                <v-btn value="OU" size="x-small">OU</v-btn>
              </v-btn-toggle>
              <v-btn size="x-small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addFormCond">Ajouter</v-btn>
            </div>
          </div>

          <div v-for="(cond, ci) in form.conditions" :key="ci" class="d-flex align-center ga-2 mb-2">
            <v-chip v-if="ci > 0" :color="form.andOr === 'ET' ? 'primary' : 'warning'" size="x-small" variant="tonal" class="flex-shrink-0">{{ form.andOr }}</v-chip>
            <v-select v-model="cond.field" :items="condFields" label="Champ" density="compact" hide-details style="max-width:180px"/>
            <v-select v-model="cond.operator" :items="condOperators" label="Op." density="compact" hide-details style="max-width:110px"/>
            <v-text-field v-model="cond.value" label="Valeur" density="compact" hide-details class="flex-grow-1"/>
            <v-btn size="x-small" icon="mdi-close" variant="text" color="error" @click="form.conditions.splice(ci,1)"/>
          </div>
          <div v-if="form.conditions.length === 0" class="text-caption text-medium-emphasis pa-2 text-center">Aucune condition — cliquez sur Ajouter.</div>

          <!-- Natural language preview -->
          <v-card v-if="form.conditions.length" variant="tonal" color="primary" rounded="lg" class="pa-3 mt-2 mb-3">
            <div class="text-caption text-medium-emphasis mb-1">Aperçu :</div>
            <code class="text-caption">SI {{ form.conditions.map(c => `${c.field} ${c.operator} ${c.value || '…'}`).join(` ${form.andOr} `) }}</code>
          </v-card>

          <v-divider class="mb-3"/>
          <div class="text-body-2 font-weight-semibold mb-2">Actions au déclenchement</div>
          <div class="d-flex flex-wrap ga-2 mb-3">
            <v-checkbox v-for="a in actionList" :key="a.key" v-model="form.actions[a.key]" :label="a.label" hide-details density="compact" :color="a.color"/>
          </div>

          <v-btn size="small" color="secondary" variant="tonal" prepend-icon="mdi-flask" @click="testDialog=true">
            Tester sur données de démonstration
          </v-btn>
        </v-card-text>
        <v-divider/>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="ruleDialog=false">Annuler</v-btn>
          <v-btn color="primary" @click="saveRule">{{ editMode ? 'Enregistrer' : 'Créer la règle' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Test Demo Dialog ── -->
    <v-dialog v-model="testDialog" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3 d-flex align-center ga-2">
          <v-icon icon="mdi-flask" color="secondary"/>
          Test sur données de démonstration
        </v-card-title>
        <v-card-text class="pa-5">
          <v-select :items="mockDossiers" item-title="ref" item-value="id" label="Dossier de test" class="mb-3" hide-details/>
          <div v-if="testResult.length" class="test-log pa-3 rounded-lg mt-3" style="background:#0F172A;max-height:180px;overflow-y:auto">
            <div v-for="(l,i) in testResult" :key="i" :class="['text-caption', l.ok ? 'text-success' : 'text-error']" style="font-family:monospace">
              {{ l.msg }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="testDialog=false; testResult=[]">Fermer</v-btn>
          <v-btn color="secondary" :loading="testLoading" prepend-icon="mdi-play" @click="runTest">Lancer le test</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Run All Dialog ── -->
    <v-dialog v-model="runAllDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3 d-flex align-center ga-2">
          <v-icon icon="mdi-play-speed" color="primary"/>
          Exécuter toutes les règles
        </v-card-title>
        <v-card-text class="pa-5">
          <p class="mb-3">Lance l'évaluation de toutes les règles actives sur l'ensemble des dossiers en cours.</p>
          <v-alert type="warning" variant="tonal" density="compact" rounded="lg">
            Cette opération peut prendre plusieurs minutes et générer des anomalies dans le journal d'audit.
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="runAllDialog=false">Annuler</v-btn>
          <v-btn color="primary" prepend-icon="mdi-play" :loading="runAllLoading" @click="doRunAll">Confirmer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackColor" timeout="2500" location="bottom right">
      <v-icon :icon="snackColor === 'success' ? 'mdi-check-circle' : 'mdi-alert'" class="me-2"/>
      {{ snackMsg }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import PageHeader from '../../components/PageHeader.vue'

// ── Types ────────────────────────────────────────────────────────────────────
interface CondItem { field: string; operator: string; value: string }
interface RuleActions { bloquer: boolean; anomalie: boolean; notifier: boolean; notifSuperviseur: boolean; journaliser: boolean; reaffecter: boolean }
interface RulePortee { types: string[]; etapes: string[]; institutions: string[]; frequence: string }
interface Regle {
  id: string; description: string; severite: string; categorie: string
  declenchements: number; active: boolean; conditions: CondItem[]
  andOr: 'ET' | 'OU'; actions: RuleActions; portee: RulePortee
  expanded: boolean; activeTab: string
}
interface JournalEntry { id: number; regle: string; dossier: string; beneficiaire: string; date: string; severite: string; resolu: boolean }

// ── Constants ────────────────────────────────────────────────────────────────
const condFields = ['beneficiaire.dettes_sigtas', 'beneficiaire.dettes_sydonia', 'demande.montant_fcfa', 'demande.type', 'demande.duree_mois', 'demande.secteur', 'quota.utilise_pct', 'dossier.base_juridique_active', 'dossier.nb_doublons', 'dossier.date_expiration', 'agent.charge_dossiers']
const condOperators = ['>', '<', '>=', '<=', '==', '!=', 'contient', 'est vide', 'est expiré']
const categories = ['Fiscal', 'Douanier', 'Quota', 'Juridique', 'Doublon', 'Conformité', 'Temporel']
const typesExo = ['Exonération douanière', 'Exonération IS', 'Exonération TVA', 'Zone Franche', "Convention d'investissement"]
const actionList = [
  { key: 'bloquer', label: 'Bloquer dossier', color: 'error' },
  { key: 'anomalie', label: 'Créer anomalie', color: 'warning' },
  { key: 'notifier', label: "Notifier l'agent", color: 'info' },
  { key: 'notifSuperviseur', label: 'Notifier superviseur', color: 'primary' },
  { key: 'journaliser', label: 'Journaliser', color: 'secondary' },
  { key: 'reaffecter', label: 'Réaffecter', color: 'purple' },
]

const mkActions = (): RuleActions => ({ bloquer: false, anomalie: true, notifier: true, notifSuperviseur: false, journaliser: true, reaffecter: false })
const mkPortee = (): RulePortee => ({ types: [], etapes: ['Toutes'], institutions: ['Toutes'], frequence: 'En temps réel' })

function mkConds(arr: Partial<CondItem>[]): CondItem[] {
  return arr.map(c => ({ field: c.field || '', operator: c.operator || '>', value: c.value || '' }))
}

// ── Data ─────────────────────────────────────────────────────────────────────
const regles = ref<Regle[]>([
  { id: 'r1', description: 'Bénéficiaire avec dettes fiscales actives dans SIGTAS', severite: 'bloquant', categorie: 'Fiscal', declenchements: 8, active: true, andOr: 'ET', expanded: false, activeTab: 'condition', actions: { ...mkActions(), bloquer: true }, portee: { ...mkPortee(), types: [], etapes: ['Instruction','Validation'], institutions: ['OTR Impôts'] }, conditions: mkConds([{ field: 'beneficiaire.dettes_sigtas', operator: '>', value: '0' }, { field: 'demande.type', operator: '==', value: "'fiscale_is'" }]) },
  { id: 'r2', description: 'Dépassement quota de plus de 200%', severite: 'bloquant', categorie: 'Quota', declenchements: 3, active: true, andOr: 'ET', expanded: false, activeTab: 'condition', actions: { ...mkActions(), bloquer: true }, portee: mkPortee(), conditions: mkConds([{ field: 'quota.utilise_pct', operator: '>=', value: '200' }]) },
  { id: 'r3', description: 'Exonération dépassant la durée légale autorisée', severite: 'avertissement', categorie: 'Temporel', declenchements: 5, active: true, andOr: 'ET', expanded: false, activeTab: 'condition', actions: mkActions(), portee: mkPortee(), conditions: mkConds([{ field: 'demande.duree_mois', operator: '>', value: '36' }]) },
  { id: 'r4', description: 'Doublon SYDONIA/SIGTAS même bénéficiaire même base', severite: 'bloquant', categorie: 'Doublon', declenchements: 2, active: true, andOr: 'ET', expanded: false, activeTab: 'condition', actions: { ...mkActions(), bloquer: true }, portee: mkPortee(), conditions: mkConds([{ field: 'dossier.nb_doublons', operator: '>=', value: '1' }]) },
  { id: 'r5', description: 'Exonération expirée dans 30 jours sans renouvellement', severite: 'info', categorie: 'Temporel', declenchements: 7, active: true, andOr: 'ET', expanded: false, activeTab: 'condition', actions: mkActions(), portee: mkPortee(), conditions: mkConds([{ field: 'dossier.date_expiration', operator: 'est expiré', value: '30j' }]) },
  { id: 'r6', description: 'Base juridique marquée abrogée utilisée dans dossier actif', severite: 'avertissement', categorie: 'Juridique', declenchements: 1, active: false, andOr: 'ET', expanded: false, activeTab: 'condition', actions: mkActions(), portee: mkPortee(), conditions: mkConds([{ field: 'dossier.base_juridique_active', operator: '==', value: 'false' }]) },
  { id: 'r7', description: 'Bénéficiaire avec dettes douanières SYDONIA non soldées', severite: 'bloquant', categorie: 'Douanier', declenchements: 4, active: true, andOr: 'ET', expanded: false, activeTab: 'condition', actions: { ...mkActions(), bloquer: true }, portee: { ...mkPortee(), institutions: ['OTR Douanes'] }, conditions: mkConds([{ field: 'beneficiaire.dettes_sydonia', operator: '>', value: '0' }]) },
])

const journal = ref<JournalEntry[]>([
  { id: 1, regle: 'Bénéficiaire avec dettes fiscales (SIGTAS)', dossier: 'OASE-2026-0038', beneficiaire: 'TOGO STEEL SARL', date: '24/04/2026', severite: 'bloquant', resolu: false },
  { id: 2, regle: 'Dépassement quota 340%', dossier: 'OASE-2025-0082', beneficiaire: 'AGRO-TOGO INVEST', date: '18/04/2026', severite: 'bloquant', resolu: true },
  { id: 3, regle: 'Doublon SYDONIA/SIGTAS', dossier: 'OASE-2025-0099', beneficiaire: 'LOMÉ TRANSIT SA', date: '25/04/2026', severite: 'bloquant', resolu: false },
  { id: 4, regle: 'Exonération expirée dans 30 jours', dossier: 'OASE-2024-0210', beneficiaire: 'API-ZF INVEST', date: '22/04/2026', severite: 'info', resolu: true },
  { id: 5, regle: 'Durée légale dépassée', dossier: 'OASE-2023-0175', beneficiaire: 'TECHNOPOLE SA', date: '20/04/2026', severite: 'avertissement', resolu: false },
  { id: 6, regle: 'Dettes douanières SYDONIA', dossier: 'OASE-2026-0041', beneficiaire: 'IMPORT EXPRESS', date: '19/04/2026', severite: 'bloquant', resolu: true },
])

const mockDossiers = [
  { id: '1', ref: 'OASE-2026-0042 — TOGO STEEL SARL' },
  { id: '2', ref: 'OASE-2026-0039 — AGRO-TOGO INVEST' },
]

// ── State ─────────────────────────────────────────────────────────────────────
const mainTab = ref('rules')
const search = ref('')
const filterSev = ref('Toutes')
const filterCat = ref('Toutes')
const filterActive = ref('all')
const journalSearch = ref('')
const journalSevFilter = ref('Toutes')
const ruleDialog = ref(false)
const editMode = ref(false)
const editingId = ref<string | null>(null)
const testDialog = ref(false)
const testLoading = ref(false)
const testResult = ref<{ msg: string; ok: boolean }[]>([])
const testSuccess = ref<string | null>(null)
const runAllDialog = ref(false)
const runAllLoading = ref(false)
const snackbar = ref(false)
const snackMsg = ref('')
const snackColor = ref<'success' | 'error'>('success')

const form = reactive({
  description: '', severite: 'bloquant', categorie: 'Fiscal', andOr: 'ET' as 'ET' | 'OU',
  conditions: [] as CondItem[],
  actions: mkActions(),
})

// ── Computed ──────────────────────────────────────────────────────────────────
const filteredRegles = computed(() =>
  regles.value.filter(r => {
    if (filterSev.value !== 'Toutes' && r.severite !== filterSev.value) return false
    if (filterCat.value !== 'Toutes' && r.categorie !== filterCat.value) return false
    if (filterActive.value === 'active' && !r.active) return false
    if (filterActive.value === 'inactive' && r.active) return false
    if (search.value && !r.description.toLowerCase().includes(search.value.toLowerCase())) return false
    return true
  })
)

const filteredJournal = computed(() =>
  journal.value.filter(j => {
    if (journalSevFilter.value !== 'Toutes' && j.severite !== journalSevFilter.value) return false
    if (journalSearch.value && !j.regle.toLowerCase().includes(journalSearch.value.toLowerCase()) && !j.dossier.toLowerCase().includes(journalSearch.value.toLowerCase())) return false
    return true
  })
)

const kpis = computed(() => [
  { label: 'Règles actives', value: regles.value.filter(r => r.active).length, icon: 'mdi-check-circle', color: 'success' },
  { label: 'Règles bloquantes', value: regles.value.filter(r => r.severite === 'bloquant' && r.active).length, icon: 'mdi-alert-octagon', color: 'error' },
  { label: 'Déclenchements (30j)', value: regles.value.reduce((a, r) => a + r.declenchements, 0), icon: 'mdi-play-circle', color: 'warning' },
  { label: 'Règles désactivées', value: regles.value.filter(r => !r.active).length, icon: 'mdi-pause-circle', color: 'secondary' },
])

const topRules = computed(() => [...regles.value].sort((a, b) => b.declenchements - a.declenchements).slice(0, 5))
const maxDeclenchements = computed(() => Math.max(...regles.value.map(r => r.declenchements), 1))
const resolvedCount = computed(() => journal.value.filter(j => j.resolu).length)
const pendingCount = computed(() => journal.value.filter(j => !j.resolu).length)
const resolutionRate = computed(() => Math.round((resolvedCount.value / Math.max(journal.value.length, 1)) * 100))

const sevStats = computed(() => [
  { label: 'Bloquant', color: 'error', icon: 'mdi-alert-octagon', count: regles.value.filter(r => r.severite === 'bloquant').length, triggers: regles.value.filter(r => r.severite === 'bloquant').reduce((a, r) => a + r.declenchements, 0), pct: 65 },
  { label: 'Avertissement', color: 'warning', icon: 'mdi-alert', count: regles.value.filter(r => r.severite === 'avertissement').length, triggers: regles.value.filter(r => r.severite === 'avertissement').reduce((a, r) => a + r.declenchements, 0), pct: 25 },
  { label: 'Information', color: 'info', icon: 'mdi-information', count: regles.value.filter(r => r.severite === 'info').length, triggers: regles.value.filter(r => r.severite === 'info').reduce((a, r) => a + r.declenchements, 0), pct: 10 },
])

// ── Helpers ───────────────────────────────────────────────────────────────────
function sevColor(s: string) { return s === 'bloquant' ? 'error' : s === 'avertissement' ? 'warning' : 'info' }
function sevIcon(s: string) { return s === 'bloquant' ? 'mdi-alert-octagon' : s === 'avertissement' ? 'mdi-alert' : 'mdi-information' }
function condPreview(conds: CondItem[]) {
  if (!conds.length) return 'Toujours active'
  return conds.map(c => `${c.field} ${c.operator} ${c.value}`).join(' ET ').slice(0, 50) + (conds.join('').length > 50 ? '…' : '')
}
function snack(msg: string, color: 'success' | 'error' = 'success') {
  snackMsg.value = msg; snackColor.value = color; snackbar.value = true
}

// ── Actions ───────────────────────────────────────────────────────────────────
function expandAll() { regles.value.forEach(r => r.expanded = true) }
function collapseAll() { regles.value.forEach(r => r.expanded = false) }

function addCond(regle: Regle) {
  regle.conditions.push({ field: 'beneficiaire.dettes_sigtas', operator: '>', value: '' })
}
function addFormCond() {
  form.conditions.push({ field: 'beneficiaire.dettes_sigtas', operator: '>', value: '' })
}

function openCreate() {
  editMode.value = false; editingId.value = null
  form.description = ''; form.severite = 'bloquant'; form.categorie = 'Fiscal'
  form.andOr = 'ET'; form.conditions = []; Object.assign(form.actions, mkActions())
  ruleDialog.value = true
}

function openEdit(regle: Regle) {
  editMode.value = true; editingId.value = regle.id
  form.description = regle.description; form.severite = regle.severite; form.categorie = regle.categorie
  form.andOr = regle.andOr; form.conditions = regle.conditions.map(c => ({ ...c }))
  Object.assign(form.actions, regle.actions)
  ruleDialog.value = true
}

function saveRule() {
  if (!form.description) return
  if (editMode.value && editingId.value) {
    const r = regles.value.find(x => x.id === editingId.value)
    if (r) { r.description = form.description; r.severite = form.severite; r.categorie = form.categorie; r.andOr = form.andOr; r.conditions = form.conditions.map(c => ({ ...c })); Object.assign(r.actions, form.actions) }
    snack('Règle mise à jour')
  } else {
    regles.value.push({ id: `r${Date.now()}`, description: form.description, severite: form.severite, categorie: form.categorie, declenchements: 0, active: true, andOr: form.andOr, conditions: form.conditions.map(c => ({ ...c })), actions: { ...form.actions }, portee: mkPortee(), expanded: false, activeTab: 'condition' })
    snack('Règle créée')
  }
  ruleDialog.value = false
}

function deleteRule(id: string) {
  regles.value = regles.value.filter(r => r.id !== id)
  snack('Règle supprimée', 'error')
}

function onToggle(regle: Regle) {
  snack(`Règle "${regle.description.slice(0, 30)}…" ${regle.active ? 'activée' : 'désactivée'}`)
}

function testRule(regle: Regle) {
  testSuccess.value = regle.id
  snack(`Test — "${regle.description.slice(0, 40)}…" : 3 dossiers concernés`)
  setTimeout(() => { testSuccess.value = null }, 3000)
  testDialog.value = true
}

function runTest() {
  testLoading.value = true; testResult.value = []
  const steps = [
    { msg: '▶ Chargement des dossiers mock...', ok: true },
    { msg: '✓ 2 dossiers sélectionnés', ok: true },
    { msg: '→ Évaluation OASE-2026-0042 : condition VÉRIFIÉE', ok: true },
    { msg: '  ⚡ Action : anomalie créée, agent notifié', ok: true },
    { msg: '→ Évaluation OASE-2026-0039 : condition NON vérifiée', ok: false },
    { msg: '✅ Test terminé — 1 dossier concerné / 2 testés', ok: true },
  ]
  let i = 0
  const iv = setInterval(() => {
    if (i < steps.length) testResult.value.push(steps[i++])
    else { clearInterval(iv); testLoading.value = false }
  }, 200)
}

function doRunAll() {
  runAllLoading.value = true
  setTimeout(() => { runAllLoading.value = false; runAllDialog.value = false; snack('Exécution terminée — 5 anomalies détectées') }, 2000)
}

function exportJournal() { snack('Journal exporté en CSV') }
</script>

<style scoped>
.rule-node {
  background: white;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.09);
  border-left: 4px solid #CBD5E1;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transition: box-shadow 0.2s;
  overflow: hidden;
}
.rule-node:hover { box-shadow: 0 3px 12px rgba(0,0,0,0.1); }
.rule-node.rule--open { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
.rule--bloquant { border-left-color: #C62828; }
.rule--avertissement { border-left-color: #E65100; }
.rule--info { border-left-color: #0277BD; }

.rule-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
}
.rule-header:hover { background: rgba(0,0,0,0.01); }
.rule-body { padding: 0 16px 16px; }
</style>
