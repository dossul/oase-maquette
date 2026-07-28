<template>
  <div>
    <PageHeader
      title="Workflow BPM — Éditeur"
      subtitle="Circuits de validation, notifications multi-canaux et conditions métier"
      icon="mdi-sitemap"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-flask" class="me-2" @click="sandboxDialog=true">Sandbox</v-btn>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-eye" class="me-2" @click="previewDialog=true">Prévisualiser</v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-content-save" @click="saveWorkflow">
          Enregistrer v{{ version }}
        </v-btn>
      </template>
    </PageHeader>

    <v-snackbar v-model="saved" color="success" timeout="2000" location="top">
      <v-icon icon="mdi-check-circle" class="me-2"/>Workflow enregistré — v{{ version }}
    </v-snackbar>

    <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mb-3" closable>
      <span class="text-caption">
        {{ apiTemplates.length }} template(s) actif(s) chargé(s) depuis l'API (GET /workflow/templates).
        L'API ne propose aucun endpoint de mise à jour d'un template (PUT/PATCH) — l'enregistrement incrémente la version localement, sans persistance.
      </span>
    </v-alert>

    <v-tabs v-model="mainTab" color="primary" density="compact" class="mb-3">
      <v-tab value="builder" prepend-icon="mdi-sitemap">Éditeur</v-tab>
      <v-tab value="notifs" prepend-icon="mdi-bell-cog">
        Notifications
        <v-badge content="4" color="warning" inline class="ms-1"/>
      </v-tab>
      <v-tab value="templates" prepend-icon="mdi-email-edit">Templates</v-tab>
      <v-tab value="sla" prepend-icon="mdi-timer-alert">SLA & Escalade</v-tab>
    </v-tabs>

    <v-window v-model="mainTab">

      <!-- ══ BUILDER ══ -->
      <v-window-item value="builder">
        <v-row>
          <!-- Left panel -->
          <v-col cols="12" md="3">
            <v-card rounded="lg" elevation="1" class="mb-3">
              <v-card-title class="pa-3 pb-2 text-body-2 font-weight-semibold">Circuit</v-card-title>
              <v-list density="compact" class="pa-2">
                <v-list-item
                  v-for="t in typesExo" :key="t.value"
                  :title="t.label"
                  :style="selectedType===t.value ? { background:'rgba(39,116,174,0.12)', borderRadius:'8px', fontWeight:600 } : {}"
                  rounded="lg" class="mb-1 cursor-pointer"
                  @click="selectedType=t.value"
                />
              </v-list>
            </v-card>

            <!-- Node palette -->
            <v-card rounded="lg" elevation="1" class="mb-3">
              <v-card-title class="pa-3 pb-1 text-body-2 font-weight-semibold">Palette de nœuds</v-card-title>
              <v-card-text class="pa-2">
                <div
                  v-for="nt in nodeTypes" :key="nt.type"
                  class="palette-node mb-2 pa-2 rounded-lg cursor-pointer d-flex align-center ga-2"
                  :style="{ borderLeft: `3px solid ${nt.color}`, background: 'rgba(0,0,0,0.02)' }"
                  @click="addNodeFromPalette(nt.type)"
                >
                  <v-icon :icon="nt.icon" :color="nt.color" size="16"/>
                  <div>
                    <div class="text-caption font-weight-semibold">{{ nt.label }}</div>
                    <div class="text-caption text-medium-emphasis" style="font-size:10px">{{ nt.desc }}</div>
                  </div>
                  <v-icon icon="mdi-plus" size="14" color="primary" class="ms-auto"/>
                </div>
              </v-card-text>
            </v-card>

            <!-- Versions -->
            <v-card rounded="lg" elevation="1" class="mb-3">
              <v-card-title class="pa-3 pb-2 text-body-2 font-weight-semibold">Versions</v-card-title>
              <v-list density="compact" class="pa-2">
                <v-list-item
                  v-for="v in versions" :key="v.version"
                  :title="`v${v.version}`" :subtitle="v.date"
                  :prepend-icon="v.active ? 'mdi-check-circle' : 'mdi-circle-outline'"
                  :base-color="v.active ? 'success' : 'secondary'"
                  rounded="lg" class="mb-1"
                />
              </v-list>
              <div class="pa-2 pt-0">
                <v-btn size="x-small" variant="tonal" prepend-icon="mdi-history" block>Historique</v-btn>
              </div>
            </v-card>

            <!-- Templates réels chargés depuis l'API (lecture seule) -->
            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-3 pb-2 text-body-2 font-weight-semibold d-flex align-center ga-1">
                <v-icon icon="mdi-api" size="16"/>Templates API (lecture)
              </v-card-title>
              <v-progress-linear v-if="apiTemplatesLoading" indeterminate color="primary"/>
              <v-list v-else-if="apiTemplates.length" density="compact" class="pa-2">
                <v-list-item
                  v-for="t in apiTemplates" :key="t.id"
                  :title="t.nom"
                  :subtitle="`${t.code} · ${t.workflowTemplateEtapes?.length ?? 0} étape(s)`"
                  prepend-icon="mdi-file-document-outline"
                  rounded="lg" class="mb-1"
                />
              </v-list>
              <div v-else class="pa-3 text-caption text-medium-emphasis">Aucun template actif retourné par l'API.</div>
            </v-card>
          </v-col>

          <!-- Canvas -->
          <v-col cols="12" md="9">
            <div class="wf-canvas pa-4">
              <!-- Canvas header -->
              <div class="d-flex align-center justify-space-between mb-4">
                <div class="d-flex align-center ga-2">
                  <span class="text-body-1 font-weight-semibold">{{ typesExo.find(t=>t.value===selectedType)?.label }}</span>
                  <v-chip color="success" size="x-small" variant="tonal">v{{ version }} — Actif</v-chip>
                </div>
                <div class="d-flex ga-2">
                  <v-btn size="x-small" variant="outlined" prepend-icon="mdi-expand-all" @click="expandAll">Tout ouvrir</v-btn>
                  <v-btn size="x-small" variant="outlined" prepend-icon="mdi-collapse-all" @click="collapseAll">Tout fermer</v-btn>
                </div>
              </div>

              <!-- Nodes -->
              <div class="wf-flow">
                <template v-for="(node, i) in workflow" :key="node.id">

                  <!-- ── Node card ── -->
                  <div
                    class="wf-node"
                    :class="[`wf-node--${node.type}`, node.expanded ? 'wf-node--open' : '']"
                    :style="{ borderLeftColor: nodeTypeMap[node.type].color }"
                  >
                    <!-- Node header -->
                    <div class="wf-node-header" @click="node.expanded = !node.expanded">
                      <div class="d-flex align-center ga-3 flex-grow-1 min-width-0">
                        <v-avatar :color="nodeTypeMap[node.type].color" size="32" class="flex-shrink-0">
                          <v-icon :icon="node.icon" size="16" color="white"/>
                        </v-avatar>
                        <div class="min-width-0">
                          <div class="d-flex align-center ga-2 flex-wrap">
                            <span class="text-body-2 font-weight-semibold">{{ node.label }}</span>
                            <v-chip :color="nodeTypeMap[node.type].color" size="x-small" variant="tonal">{{ nodeTypeMap[node.type].label }}</v-chip>
                            <v-chip v-if="node.condition && node.condition.conditions.length" color="warning" size="x-small" variant="tonal" prepend-icon="mdi-code-braces">Condition</v-chip>
                          </div>
                          <div class="text-caption text-medium-emphasis">
                            <v-icon icon="mdi-account" size="12" class="me-1"/>{{ node.acteur }}
                            <span v-if="node.delai && node.delai !== '—'" class="ms-2">
                              <v-icon icon="mdi-clock-outline" size="12" class="me-1"/>{{ node.delai }}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div class="d-flex align-center ga-2 flex-shrink-0">
                        <!-- Notif indicators -->
                        <div class="d-flex ga-1">
                          <v-tooltip v-if="node.notifs.email.enabled" text="Email" location="top">
                            <template #activator="{ props }"><v-icon v-bind="props" icon="mdi-email" size="14" color="info"/></template>
                          </v-tooltip>
                          <v-tooltip v-if="node.notifs.sms.enabled" text="SMS" location="top">
                            <template #activator="{ props }"><v-icon v-bind="props" icon="mdi-message-text" size="14" color="success"/></template>
                          </v-tooltip>
                          <v-tooltip v-if="node.notifs.whatsapp.enabled" text="WhatsApp" location="top">
                            <template #activator="{ props }"><v-icon v-bind="props" icon="mdi-whatsapp" size="14" color="success"/></template>
                          </v-tooltip>
                          <v-tooltip v-if="node.notifs.inapp.enabled" text="Dashboard" location="top">
                            <template #activator="{ props }"><v-icon v-bind="props" icon="mdi-bell" size="14" color="warning"/></template>
                          </v-tooltip>
                        </div>
                        <!-- Node actions -->
                        <div class="d-flex ga-1" @click.stop>
                          <v-btn size="x-small" icon="mdi-arrow-up" variant="text" :disabled="i===0" @click="moveNode(i,-1)"/>
                          <v-btn size="x-small" icon="mdi-arrow-down" variant="text" :disabled="i===workflow.length-1" @click="moveNode(i,1)"/>
                          <v-btn size="x-small" icon="mdi-delete-outline" variant="text" color="error" @click="removeNode(i)"/>
                        </div>
                        <v-btn size="x-small" :icon="node.expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" variant="text"/>
                      </div>
                    </div>

                    <!-- Node body (expandable) -->
                    <v-expand-transition>
                      <div v-if="node.expanded" class="wf-node-body">
                        <v-divider class="mb-3"/>
                        <v-tabs v-model="node.activeTab" density="compact" color="primary" class="mb-3">
                          <v-tab value="general" prepend-icon="mdi-cog-outline" class="text-caption">Général</v-tab>
                          <v-tab value="notifs" prepend-icon="mdi-bell-outline" class="text-caption">Notifications</v-tab>
                          <v-tab value="condition" prepend-icon="mdi-code-braces" class="text-caption">Conditions</v-tab>
                        </v-tabs>

                        <v-window v-model="node.activeTab">

                          <!-- General tab -->
                          <v-window-item value="general">
                            <v-row dense>
                              <v-col cols="12" md="6">
                                <v-text-field v-model="node.label" label="Libellé du nœud" density="compact" hide-details class="mb-2"/>
                              </v-col>
                              <v-col cols="12" md="6">
                                <v-select v-model="node.acteur" :items="acteurs" label="Acteur responsable" density="compact" hide-details class="mb-2"/>
                              </v-col>
                              <v-col cols="12" md="4">
                                <v-text-field v-model="node.delai" label="Délai réglementaire" density="compact" hide-details prepend-inner-icon="mdi-clock-outline"/>
                              </v-col>
                              <v-col cols="12" md="4">
                                <v-select
                                  v-model="node.type"
                                  :items="nodeTypes.map(nt=>({title:nt.label,value:nt.type}))"
                                  label="Type de nœud"
                                  density="compact"
                                  hide-details
                                />
                              </v-col>
                              <v-col cols="12" md="4">
                                <v-select
                                  v-model="node.destinataires"
                                  :items="notifDestinataires"
                                  label="Destinataires"
                                  multiple
                                  chips
                                  closable-chips
                                  density="compact"
                                  hide-details
                                />
                              </v-col>
                              <v-col cols="12">
                                <v-textarea v-model="node.description" label="Description / Instructions" rows="2" density="compact" hide-details class="mt-2"/>
                              </v-col>
                            </v-row>
                          </v-window-item>

                          <!-- Notifications tab -->
                          <v-window-item value="notifs">
                            <v-row dense>
                              <!-- Email -->
                              <v-col cols="12">
                                <v-card variant="outlined" rounded="lg" class="mb-2">
                                  <v-card-text class="pa-3">
                                    <div class="d-flex align-center justify-space-between mb-2">
                                      <div class="d-flex align-center ga-2">
                                        <v-icon icon="mdi-email" color="info" size="18"/>
                                        <span class="text-body-2 font-weight-semibold">E-mail</span>
                                        <v-chip size="x-small" color="info" variant="tonal">SMTP</v-chip>
                                      </div>
                                      <v-switch v-model="node.notifs.email.enabled" hide-details density="compact" color="info" inset/>
                                    </div>
                                    <v-expand-transition>
                                      <div v-if="node.notifs.email.enabled">
                                        <v-text-field v-model="node.notifs.email.subject" label="Sujet de l'e-mail" density="compact" hide-details class="mb-2" prepend-inner-icon="mdi-format-title"/>
                                        <v-select v-model="node.notifs.email.template" :items="emailTemplates" label="Template e-mail" density="compact" hide-details class="mb-2"/>
                                        <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mt-2">
                                          <span class="text-caption" v-pre>Variables disponibles : <code>{{dossier_ref}}</code>, <code>{{contribuable}}</code>, <code>{{etape}}</code>, <code>{{lien_dossier}}</code></span>
                                        </v-alert>
                                      </div>
                                    </v-expand-transition>
                                  </v-card-text>
                                </v-card>
                              </v-col>

                              <!-- SMS -->
                              <v-col cols="12">
                                <v-card variant="outlined" rounded="lg" class="mb-2">
                                  <v-card-text class="pa-3">
                                    <div class="d-flex align-center justify-space-between mb-2">
                                      <div class="d-flex align-center ga-2">
                                        <v-icon icon="mdi-message-text" color="success" size="18"/>
                                        <span class="text-body-2 font-weight-semibold">SMS</span>
                                        <v-chip size="x-small" color="success" variant="tonal">Orange/Togocel</v-chip>
                                      </div>
                                      <v-switch v-model="node.notifs.sms.enabled" hide-details density="compact" color="success" inset/>
                                    </div>
                                    <v-expand-transition>
                                      <div v-if="node.notifs.sms.enabled">
                                        <v-select v-model="node.notifs.sms.template" :items="smsTemplates" label="Template SMS" density="compact" hide-details class="mb-2"/>
                                        <div class="d-flex align-center ga-2">
                                          <v-chip size="x-small" color="secondary" variant="outlined">160 car. max</v-chip>
                                          <v-chip size="x-small" color="secondary" variant="outlined">Expéditeur : OASE-MEF</v-chip>
                                        </div>
                                      </div>
                                    </v-expand-transition>
                                  </v-card-text>
                                </v-card>
                              </v-col>

                              <!-- WhatsApp -->
                              <v-col cols="12">
                                <v-card variant="outlined" rounded="lg" class="mb-2">
                                  <v-card-text class="pa-3">
                                    <div class="d-flex align-center justify-space-between mb-2">
                                      <div class="d-flex align-center ga-2">
                                        <v-icon icon="mdi-whatsapp" color="success" size="18"/>
                                        <span class="text-body-2 font-weight-semibold">WhatsApp</span>
                                        <v-chip size="x-small" color="success" variant="tonal">Business API</v-chip>
                                      </div>
                                      <v-switch v-model="node.notifs.whatsapp.enabled" hide-details density="compact" color="success" inset/>
                                    </div>
                                    <v-expand-transition>
                                      <div v-if="node.notifs.whatsapp.enabled">
                                        <v-select v-model="node.notifs.whatsapp.template" :items="waTemplates" label="Template WhatsApp (approuvé Meta)" density="compact" hide-details class="mb-2"/>
                                        <v-alert type="warning" variant="tonal" density="compact" rounded="lg">
                                          <span class="text-caption">Seuls les templates approuvés par Meta peuvent être utilisés.</span>
                                        </v-alert>
                                      </div>
                                    </v-expand-transition>
                                  </v-card-text>
                                </v-card>
                              </v-col>

                              <!-- In-app dashboard alert -->
                              <v-col cols="12">
                                <v-card variant="outlined" rounded="lg">
                                  <v-card-text class="pa-3">
                                    <div class="d-flex align-center justify-space-between mb-2">
                                      <div class="d-flex align-center ga-2">
                                        <v-icon icon="mdi-monitor-dashboard" color="warning" size="18"/>
                                        <span class="text-body-2 font-weight-semibold">Alerte Dashboard</span>
                                        <v-chip size="x-small" color="warning" variant="tonal">In-app</v-chip>
                                      </div>
                                      <v-switch v-model="node.notifs.inapp.enabled" hide-details density="compact" color="warning" inset/>
                                    </div>
                                    <v-expand-transition>
                                      <div v-if="node.notifs.inapp.enabled">
                                        <v-row dense>
                                          <v-col cols="12" md="4">
                                            <v-select
                                              v-model="node.notifs.inapp.type"
                                              :items="[{title:'Information',value:'info'},{title:'Avertissement',value:'warning'},{title:'Urgence',value:'error'}]"
                                              label="Niveau d'alerte"
                                              density="compact"
                                              hide-details
                                              class="mb-2"
                                            />
                                          </v-col>
                                          <v-col cols="12" md="8">
                                            <v-text-field v-model="node.notifs.inapp.title" label="Titre de l'alerte" density="compact" hide-details class="mb-2"/>
                                          </v-col>
                                          <v-col cols="12">
                                            <v-text-field v-model="node.notifs.inapp.message" label="Message affiché sur le dashboard" density="compact" hide-details/>
                                          </v-col>
                                        </v-row>
                                        <!-- Preview -->
                                        <v-alert
                                          :type="node.notifs.inapp.type"
                                          variant="tonal"
                                          density="compact"
                                          rounded="lg"
                                          class="mt-2"
                                        >
                                          <div class="text-caption font-weight-bold">{{ node.notifs.inapp.title || 'Titre...' }}</div>
                                          <div class="text-caption">{{ node.notifs.inapp.message || 'Message...' }}</div>
                                        </v-alert>
                                      </div>
                                    </v-expand-transition>
                                  </v-card-text>
                                </v-card>
                              </v-col>

                              <!-- Test notifications -->
                              <v-col cols="12">
                                <div class="d-flex align-center ga-2 mt-1">
                                  <v-btn size="small" color="info" variant="tonal" prepend-icon="mdi-send-check" @click="testNotification(node)">
                                    Tester les notifications
                                  </v-btn>
                                  <v-chip v-if="testSuccess === node.id" color="success" size="x-small" variant="tonal" prepend-icon="mdi-check">Envoyé !</v-chip>
                                </div>
                              </v-col>
                            </v-row>
                          </v-window-item>

                          <!-- Conditions tab -->
                          <v-window-item value="condition">
                            <div class="mb-3">
                              <div class="d-flex align-center justify-space-between mb-2">
                                <span class="text-body-2 font-weight-semibold">Conditions de passage</span>
                                <div class="d-flex ga-2">
                                  <v-btn-toggle v-model="node.condition.andOr" density="compact" variant="outlined" color="primary" rounded="pill" mandatory>
                                    <v-btn value="AND" size="x-small">ET</v-btn>
                                    <v-btn value="OR" size="x-small">OU</v-btn>
                                  </v-btn-toggle>
                                  <v-btn size="x-small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addCondition(node)">Ajouter</v-btn>
                                </div>
                              </div>

                              <div v-if="node.condition.conditions.length === 0" class="text-center pa-4 text-medium-emphasis">
                                <v-icon icon="mdi-code-braces" size="28" class="mb-2 opacity-40"/>
                                <div class="text-caption">Aucune condition — le nœud est toujours exécuté.</div>
                              </div>

                              <div
                                v-for="(cond, ci) in node.condition.conditions"
                                :key="ci"
                                class="d-flex align-center ga-2 mb-2"
                              >
                                <v-chip v-if="ci > 0" :color="node.condition.andOr === 'AND' ? 'primary' : 'warning'" size="x-small" variant="tonal" class="flex-shrink-0">
                                  {{ node.condition.andOr }}
                                </v-chip>
                                <v-select
                                  v-model="cond.field"
                                  :items="condFields"
                                  label="Champ"
                                  density="compact"
                                  hide-details
                                  style="max-width:160px"
                                />
                                <v-select
                                  v-model="cond.operator"
                                  :items="condOperators"
                                  label="Op."
                                  density="compact"
                                  hide-details
                                  style="max-width:100px"
                                />
                                <v-text-field
                                  v-model="cond.value"
                                  label="Valeur"
                                  density="compact"
                                  hide-details
                                  class="flex-grow-1"
                                />
                                <v-btn size="x-small" icon="mdi-close" variant="text" color="error" @click="node.condition.conditions.splice(ci,1)"/>
                              </div>

                              <!-- Branch labels -->
                              <v-divider class="my-3"/>
                              <div class="text-caption font-weight-bold text-medium-emphasis mb-2">Libellés des branches</div>
                              <v-row dense>
                                <v-col cols="6">
                                  <v-text-field v-model="node.condition.trueLabel" label="Branche OUI" prepend-inner-icon="mdi-check" density="compact" hide-details color="success"/>
                                </v-col>
                                <v-col cols="6">
                                  <v-text-field v-model="node.condition.falseLabel" label="Branche NON" prepend-inner-icon="mdi-close" density="compact" hide-details color="error"/>
                                </v-col>
                              </v-row>
                            </div>
                          </v-window-item>
                        </v-window>
                      </div>
                    </v-expand-transition>
                  </div>

                  <!-- Connector -->
                  <div v-if="i < workflow.length - 1" class="wf-connector">
                    <div class="wf-connector-line"/>
                    <div class="wf-connector-arrow">
                      <v-icon icon="mdi-chevron-down" size="16" color="rgba(39,116,174,0.6)"/>
                    </div>
                    <div v-if="workflow[i].condition.conditions.length" class="wf-connector-condition">
                      <v-chip color="warning" size="x-small" variant="tonal" prepend-icon="mdi-code-braces" class="my-1">
                        {{ conditionSummary(workflow[i].condition) }}
                      </v-chip>
                    </div>
                  </div>

                </template>

                <!-- End node -->
                <div class="wf-end d-flex align-center justify-center pa-3">
                  <v-icon icon="mdi-flag-checkered" color="success" size="20" class="me-2"/>
                  <span class="text-caption font-weight-semibold text-success">Fin du circuit</span>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- ══ NOTIFICATIONS ══ -->
      <v-window-item value="notifs">
        <v-row class="mt-1">
          <!-- Channel configs -->
          <v-col cols="12" md="6">
            <!-- Email config -->
            <v-card rounded="lg" elevation="1" class="mb-4">
              <v-card-title class="pa-4 pb-2 d-flex align-center ga-2">
                <v-icon icon="mdi-email-multiple" color="info" size="20"/>
                <span class="text-body-1 font-weight-semibold">Configuration E-mail</span>
                <v-chip :color="emailConfigured ? 'success' : 'secondary'" size="x-small" variant="tonal" class="ms-auto">
                  <v-icon :icon="emailConfigured ? 'mdi-check-circle' : 'mdi-minus-circle-outline'" size="12" class="me-1"/>{{ emailConfigured ? 'Configuré (GET /admin/parametres)' : 'Non configuré' }}
                </v-chip>
              </v-card-title>
              <v-card-text class="pa-4">
                <v-row dense>
                  <v-col cols="8">
                    <v-text-field v-model="emailConfig.smtp" label="Serveur SMTP" density="compact" hide-details prepend-inner-icon="mdi-server"/>
                  </v-col>
                  <v-col cols="4">
                    <v-text-field v-model="emailConfig.port" label="Port" density="compact" hide-details type="number"/>
                  </v-col>
                  <v-col cols="6" class="mt-2">
                    <v-text-field v-model="emailConfig.from" label="Expéditeur (From)" density="compact" hide-details/>
                  </v-col>
                  <v-col cols="6" class="mt-2">
                    <v-text-field v-model="emailConfig.fromName" label="Nom affiché" density="compact" hide-details/>
                  </v-col>
                  <v-col cols="6" class="mt-2">
                    <v-text-field v-model="emailConfig.user" label="Utilisateur SMTP" density="compact" hide-details/>
                  </v-col>
                  <v-col cols="6" class="mt-2">
                    <v-text-field v-model="emailConfig.password" label="Mot de passe" density="compact" hide-details type="password"/>
                  </v-col>
                  <v-col cols="6" class="mt-2">
                    <v-select v-model="emailConfig.tls" :items="['TLS','STARTTLS','Aucun']" label="Sécurité" density="compact" hide-details/>
                  </v-col>
                  <v-col cols="6" class="mt-2">
                    <v-text-field v-model="emailConfig.replyTo" label="Reply-To" density="compact" hide-details/>
                  </v-col>
                </v-row>
                <v-btn size="small" color="info" variant="tonal" prepend-icon="mdi-send-check" class="mt-3" @click="testChannel('email')">
                  Tester la connexion SMTP
                </v-btn>
              </v-card-text>
            </v-card>

            <!-- SMS config -->
            <v-card rounded="lg" elevation="1" class="mb-4">
              <v-card-title class="pa-4 pb-2 d-flex align-center ga-2">
                <v-icon icon="mdi-message-text-fast" color="success" size="20"/>
                <span class="text-body-1 font-weight-semibold">Configuration SMS</span>
                <v-chip :color="smsConfigured ? 'success' : 'secondary'" size="x-small" variant="tonal" class="ms-auto">
                  <v-icon :icon="smsConfigured ? 'mdi-check-circle' : 'mdi-minus-circle-outline'" size="12" class="me-1"/>{{ smsConfigured ? 'Configuré (GET /admin/parametres)' : 'Non configuré' }}
                </v-chip>
              </v-card-title>
              <v-card-text class="pa-4">
                <v-row dense>
                  <v-col cols="12">
                    <v-select v-model="smsConfig.provider" :items="['Orange Togo SMS API','Togocel BULK SMS','Twilio','Nexmo / Vonage','Africa\'s Talking']" label="Opérateur / Fournisseur" density="compact" hide-details class="mb-2"/>
                  </v-col>
                  <v-col cols="6">
                    <v-text-field v-model="smsConfig.apiKey" label="API Key" density="compact" hide-details type="password"/>
                  </v-col>
                  <v-col cols="6">
                    <v-text-field v-model="smsConfig.senderId" label="Sender ID" density="compact" hide-details/>
                  </v-col>
                  <v-col cols="6" class="mt-2">
                    <v-text-field v-model="smsConfig.endpoint" label="Endpoint API" density="compact" hide-details/>
                  </v-col>
                  <v-col cols="6" class="mt-2">
                    <v-select v-model="smsConfig.encoding" :items="['GSM-7 (160 car.)','Unicode (70 car.)']" label="Encodage" density="compact" hide-details/>
                  </v-col>
                </v-row>
                <v-btn size="small" color="success" variant="tonal" prepend-icon="mdi-send-check" class="mt-3" @click="testChannel('sms')">
                  Envoyer un SMS test
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <!-- WhatsApp config -->
            <v-card rounded="lg" elevation="1" class="mb-4">
              <v-card-title class="pa-4 pb-2 d-flex align-center ga-2">
                <v-icon icon="mdi-whatsapp" color="success" size="20"/>
                <span class="text-body-1 font-weight-semibold">WhatsApp Business API</span>
                <v-chip :color="waConfigured ? 'success' : 'secondary'" size="x-small" variant="tonal" class="ms-auto">
                  <v-icon :icon="waConfigured ? 'mdi-check-circle' : 'mdi-minus-circle-outline'" size="12" class="me-1"/>{{ waConfigured ? 'Activé (GET /admin/parametres)' : 'Non configuré' }}
                </v-chip>
              </v-card-title>
              <v-card-text class="pa-4">
                <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mb-3">
                  Requiert un compte WhatsApp Business vérifié par Meta.
                </v-alert>
                <v-row dense>
                  <v-col cols="12">
                    <v-text-field v-model="waConfig.phoneNumberId" label="Phone Number ID (Meta)" density="compact" hide-details class="mb-2"/>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field v-model="waConfig.accessToken" label="Access Token permanent" density="compact" hide-details type="password" class="mb-2"/>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field v-model="waConfig.businessAccountId" label="Business Account ID" density="compact" hide-details class="mb-2"/>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field v-model="waConfig.webhookVerifyToken" label="Webhook Verify Token" density="compact" hide-details/>
                  </v-col>
                </v-row>
                <v-btn size="small" color="success" variant="tonal" prepend-icon="mdi-send-check" class="mt-3" @click="testChannel('whatsapp')">
                  Envoyer un message test
                </v-btn>
              </v-card-text>
            </v-card>

            <!-- Dashboard alert config -->
            <v-card rounded="lg" elevation="1" class="mb-4">
              <v-card-title class="pa-4 pb-2 d-flex align-center ga-2">
                <v-icon icon="mdi-monitor-dashboard" color="warning" size="20"/>
                <span class="text-body-1 font-weight-semibold">Alertes Dashboard (In-app)</span>
                <v-chip color="success" size="x-small" variant="tonal" class="ms-auto">
                  <v-icon icon="mdi-check-circle" size="12" class="me-1"/>Natif OASE
                </v-chip>
              </v-card-title>
              <v-card-text class="pa-4">
                <v-row dense>
                  <v-col cols="12" md="6">
                    <v-switch v-model="inappConfig.banner" label="Bannière en haut du dashboard" color="warning" hide-details density="compact"/>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-switch v-model="inappConfig.badge" label="Badge sur l'icône menu" color="primary" hide-details density="compact"/>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-switch v-model="inappConfig.sound" label="Son de notification" color="secondary" hide-details density="compact"/>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-switch v-model="inappConfig.persist" label="Persister jusqu'à lecture" color="error" hide-details density="compact"/>
                  </v-col>
                  <v-col cols="12" class="mt-2">
                    <v-select v-model="inappConfig.autoExpire" :items="['Jamais','1 heure','4 heures','24 heures','7 jours']" label="Expiration automatique" density="compact" hide-details/>
                  </v-col>
                </v-row>
                <!-- Preview -->
                <div class="mt-3">
                  <div class="text-caption text-medium-emphasis mb-2 font-weight-bold">Aperçu de l'alerte (variables de template) :</div>
                  <v-alert type="warning" variant="tonal" rounded="lg" density="compact" closable>
                    <div class="text-caption font-weight-bold">Nouveau dossier à instruire</div>
                    <div class="text-caption" v-pre>{{dossier_ref}} — {{contribuable}} · Type d'exonération · En attente d'instruction</div>
                  </v-alert>
                </div>
              </v-card-text>
            </v-card>

            <!-- Global notif rules -->
            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Règles globales</v-card-title>
              <v-card-text class="pa-4">
                <v-row dense>
                  <v-col cols="12">
                    <v-switch v-model="globalRules.deduplication" label="Dédupliquer (pas de doublon dans 1h)" color="primary" hide-details density="compact"/>
                  </v-col>
                  <v-col cols="12">
                    <v-switch v-model="globalRules.quietHours" label="Heures calmes (pas de SMS 20h–7h)" color="secondary" hide-details density="compact"/>
                  </v-col>
                  <v-col cols="12">
                    <v-switch v-model="globalRules.fallback" label="Fallback SMS si e-mail non reçu (72h)" color="warning" hide-details density="compact"/>
                  </v-col>
                  <v-col cols="12">
                    <v-switch v-model="globalRules.logAll" label="Logger toutes les notifications envoyées" color="info" hide-details density="compact"/>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- ══ TEMPLATES ══ -->
      <v-window-item value="templates">
        <v-row class="mt-1">
          <v-col cols="12" md="4">
            <v-card rounded="lg" elevation="1" style="position:sticky;top:80px">
              <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">Bibliothèque de templates</v-card-title>
              <!-- Bibliothèque réelle : GET /notifications/templates (admin_si) -->
              <div v-if="allTemplates.length === 0" class="text-center pa-6 text-medium-emphasis">
                <v-icon icon="mdi-email-off-outline" size="36" class="mb-2 opacity-40"/>
                <div class="text-body-2">Aucun template enregistré.</div>
                <div class="text-caption">L'API ne retourne aucun template de notification pour le moment.</div>
              </div>
              <v-list v-else density="compact" class="pa-2">
                <v-list-item
                  v-for="tpl in allTemplates" :key="tpl.id"
                  :title="tpl.name"
                  :subtitle="tpl.channel + ' · ' + tpl.type"
                  :prepend-icon="tpl.channel === 'email' ? 'mdi-email' : tpl.channel === 'sms' ? 'mdi-message-text' : tpl.channel === 'whatsapp' ? 'mdi-whatsapp' : 'mdi-bell'"
                  :style="selectedTemplate?.id === tpl.id ? { background:'rgba(39,116,174,0.1)', borderRadius:'8px' } : {}"
                  rounded="lg" class="mb-1 cursor-pointer"
                  @click="selectedTemplate = tpl"
                />
              </v-list>
              <div class="pa-3 pt-0">
                <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" block @click="addTemplate">
                  Nouveau template
                </v-btn>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="8">
            <v-card rounded="lg" elevation="1" v-if="selectedTemplate">
              <v-card-title class="pa-4 pb-2 d-flex align-center ga-2">
                <v-icon :icon="selectedTemplate.channel === 'email' ? 'mdi-email' : selectedTemplate.channel === 'sms' ? 'mdi-message-text' : 'mdi-whatsapp'" :color="selectedTemplate.channel === 'email' ? 'info' : 'success'" size="20"/>
                <span class="text-body-1 font-weight-semibold">{{ selectedTemplate.name }}</span>
                <v-chip :color="selectedTemplate.channel === 'email' ? 'info' : 'success'" size="x-small" variant="tonal">{{ selectedTemplate.channel.toUpperCase() }}</v-chip>
              </v-card-title>
              <v-card-text class="pa-4">
                <v-text-field v-model="selectedTemplate.name" label="Nom du template" density="compact" class="mb-3"/>
                <v-select
                  v-model="selectedTemplate.type"
                  :items="['Dépôt dossier','Instruction','Validation','Rejet','Signature','Notification finale','Relance','Escalade']"
                  label="Type d'événement"
                  density="compact"
                  class="mb-3"
                />
                <template v-if="selectedTemplate.channel === 'email'">
                  <v-text-field v-model="selectedTemplate.subject" label="Sujet" density="compact" class="mb-3" prepend-inner-icon="mdi-format-title"/>
                </template>
                <v-textarea v-model="selectedTemplate.body" :label="selectedTemplate.channel === 'email' ? 'Corps HTML / Texte' : 'Message'" rows="8" class="mb-3" style="font-family:monospace;font-size:0.78rem"/>
                <v-card variant="outlined" rounded="lg" class="pa-3 mb-3">
                  <div class="text-caption font-weight-bold text-medium-emphasis mb-2">Variables disponibles :</div>
                  <div class="d-flex flex-wrap ga-1">
                    <v-chip v-for="v in templateVars" :key="v" size="x-small" variant="outlined" color="primary" @click="insertVar(v)">{{ v }}</v-chip>
                  </div>
                </v-card>
                <div class="d-flex ga-2">
                  <v-btn color="primary" size="small" prepend-icon="mdi-content-save" @click="snack('Template enregistré')">Enregistrer</v-btn>
                  <v-btn color="info" variant="tonal" size="small" prepend-icon="mdi-eye" @click="previewTemplateDialog=true">Prévisualiser</v-btn>
                  <v-btn color="error" variant="text" size="small" icon="mdi-delete" @click="deleteTemplate(selectedTemplate.id)"/>
                </div>
              </v-card-text>
            </v-card>
            <div v-else class="text-center pa-8 text-medium-emphasis">
              <v-icon icon="mdi-email-edit-outline" size="48" class="mb-3 opacity-40"/>
              <div>Sélectionnez un template pour l'éditer</div>
            </div>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- ══ SLA & ESCALADE ══ -->
      <v-window-item value="sla">
        <v-row class="mt-1">
          <v-col cols="12" md="6">
            <v-card rounded="lg" elevation="1" class="mb-4">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center ga-2">
                <v-icon icon="mdi-timer-alert" color="warning" size="20"/>
                Délais réglementaires (SLA)
              </v-card-title>
              <v-card-text class="pa-4">
                <v-row dense>
                  <v-col v-for="etape in workflow" :key="etape.id" cols="12">
                    <div class="d-flex align-center ga-3 pa-2 rounded-lg" style="border:1px solid rgba(0,0,0,0.08)">
                      <v-avatar :color="nodeTypeMap[etape.type].color" size="28">
                        <v-icon :icon="etape.icon" size="14" color="white"/>
                      </v-avatar>
                      <span class="text-caption flex-grow-1">{{ etape.label }}</span>
                      <v-text-field v-model="etape.delai" density="compact" hide-details style="max-width:100px" variant="outlined" rounded="pill"/>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center ga-2">
                <v-icon icon="mdi-account-alert" color="error" size="20"/>
                Escalade automatique
              </v-card-title>
              <v-card-text class="pa-4">
                <v-row dense>
                  <v-col cols="12" md="6">
                    <v-text-field v-model="sla.escaladeResponsable" label="Responsable d'escalade" density="compact" hide-details class="mb-2" prepend-inner-icon="mdi-account"/>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model="sla.delaiEscalade" label="Délai avant escalade" density="compact" hide-details class="mb-2" prepend-inner-icon="mdi-timer"/>
                  </v-col>
                  <v-col cols="12">
                    <div class="text-caption text-medium-emphasis mb-2">Canaux d'escalade :</div>
                    <div class="d-flex ga-2 flex-wrap">
                      <v-checkbox v-model="sla.canaux" value="email" label="E-mail" hide-details density="compact" color="info"/>
                      <v-checkbox v-model="sla.canaux" value="sms" label="SMS" hide-details density="compact" color="success"/>
                      <v-checkbox v-model="sla.canaux" value="whatsapp" label="WhatsApp" hide-details density="compact" color="success"/>
                      <v-checkbox v-model="sla.canaux" value="inapp" label="Dashboard" hide-details density="compact" color="warning"/>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card rounded="lg" elevation="1" class="mb-4">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center ga-2">
                <v-icon icon="mdi-refresh-auto" color="primary" size="20"/>
                Relances automatiques
              </v-card-title>
              <v-card-text class="pa-4">
                <v-switch v-model="sla.autoRelance" label="Relance contribuable si inactif" color="primary" hide-details density="compact" class="mb-3"/>
                <v-row dense v-if="sla.autoRelance">
                  <v-col cols="6">
                    <v-text-field v-model="sla.relanceDelai" label="Délai inactivité" density="compact" hide-details placeholder="7j"/>
                  </v-col>
                  <v-col cols="6">
                    <v-select v-model="sla.relanceCanal" :items="['E-mail','SMS','WhatsApp','Tous']" label="Canal de relance" density="compact" hide-details/>
                  </v-col>
                  <v-col cols="12" class="mt-2">
                    <v-text-field v-model="sla.relanceMax" label="Nombre max de relances" density="compact" hide-details type="number"/>
                  </v-col>
                </v-row>
                <v-divider class="my-3"/>
                <v-switch v-model="sla.autoArchive" label="Archiver automatiquement après clôture (30j)" color="secondary" hide-details density="compact"/>
                <v-switch v-model="sla.autoRejet" label="Rejet automatique si SLA dépassé 2× (avec notif)" color="error" hide-details density="compact" class="mt-2"/>
              </v-card-text>
            </v-card>

            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Journal des alertes SLA</v-card-title>
              <!-- TODO(endpoint): pas de journal d'alertes SLA dans l'API v1 — état vide honnête. -->
              <div v-if="slaJournal.length === 0" class="text-center pa-6 text-medium-emphasis">
                <v-icon icon="mdi-timer-off-outline" size="36" class="mb-2 opacity-40"/>
                <div class="text-body-2">Aucune alerte SLA journalisée.</div>
                <div class="text-caption">Les alertes SLA seront affichées dès que le backend les exposera.</div>
              </div>
              <v-list v-else density="compact" class="pa-2">
                <v-list-item
                  v-for="j in slaJournal" :key="j.id"
                  :title="j.action"
                  :subtitle="j.date"
                  :prepend-icon="j.level === 'error' ? 'mdi-alert-circle' : 'mdi-alert'"
                  :base-color="j.level === 'error' ? 'error' : 'warning'"
                  rounded="lg" class="mb-1"
                />
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

    </v-window>

    <!-- ── Sandbox Dialog ── -->
    <v-dialog v-model="sandboxDialog" max-width="640" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3 d-flex align-center ga-2">
          <v-icon icon="mdi-flask" color="secondary"/>
          Simulation sandbox
        </v-card-title>
        <v-divider/>
        <v-card-text class="pa-5">
          <!-- Dossiers réels chargés via GET /demandes -->
          <v-select
            v-model="sandboxDossierId"
            :items="sandboxDossiers"
            item-title="ref"
            item-value="id"
            label="Dossier de test (réel — GET /demandes)"
            class="mb-3"
            hide-details
            :no-data-text="'Aucun dossier retourné par l\'API'"
          />
          <v-select :items="acteurs" label="Simuler l'acteur courant" class="mb-3" hide-details/>
          <v-select v-model="sandboxStep" :items="workflow.map(n=>n.label)" label="Étape de départ" class="mb-3" hide-details/>
          <v-divider class="mb-3"/>
          <v-checkbox v-model="sandboxOpts.notifs" label="Simuler les notifications (aucun envoi réel)" hide-details density="compact" class="mb-1"/>
          <v-checkbox v-model="sandboxOpts.evalConditions" label="Évaluer les conditions métier" hide-details density="compact"/>
          <v-divider class="my-3"/>
          <div v-if="sandboxResult.length" class="sandbox-log pa-3 rounded-lg" style="background:#0F172A;max-height:200px;overflow-y:auto">
            <div v-for="(line, i) in sandboxResult" :key="i" :class="['text-caption', line.type === 'success' ? 'text-success' : line.type === 'error' ? 'text-error' : 'text-info']" style="font-family:monospace">
              {{ line.msg }}
            </div>
          </div>
        </v-card-text>
        <v-divider/>
        <v-card-actions class="pa-4">
          <v-btn variant="text" @click="sandboxDialog=false; sandboxResult=[]">Fermer</v-btn>
          <v-spacer/>
          <v-btn color="secondary" :loading="sandboxLoading" prepend-icon="mdi-play" @click="runSandbox">
            Lancer la simulation
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Preview Dialog ── -->
    <v-dialog v-model="previewDialog" max-width="620">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3">Circuit — {{ typesExo.find(t=>t.value===selectedType)?.label }}</v-card-title>
        <v-card-text class="pa-5">
          <v-timeline density="compact" align="start">
            <v-timeline-item
              v-for="(node, i) in workflow" :key="node.id"
              :dot-color="nodeTypeMap[node.type].color"
              size="small"
            >
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-semibold text-body-2">{{ node.label }}</div>
                  <div class="text-caption text-medium-emphasis">{{ node.acteur }} · {{ node.delai }}</div>
                  <div v-if="node.condition.conditions.length" class="text-caption" style="color:#E65100">
                    <v-icon icon="mdi-code-braces" size="11" class="me-1"/>{{ conditionSummary(node.condition) }}
                  </div>
                </div>
                <div class="d-flex ga-1 ms-2">
                  <v-icon v-if="node.notifs.email.enabled" icon="mdi-email" size="14" color="info"/>
                  <v-icon v-if="node.notifs.sms.enabled" icon="mdi-message-text" size="14" color="success"/>
                  <v-icon v-if="node.notifs.whatsapp.enabled" icon="mdi-whatsapp" size="14" color="success"/>
                  <v-icon v-if="node.notifs.inapp.enabled" icon="mdi-bell" size="14" color="warning"/>
                </div>
              </div>
            </v-timeline-item>
            <v-timeline-item dot-color="success" size="x-small">
              <span class="text-caption text-success font-weight-semibold">Fin du circuit</span>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/><v-btn color="primary" @click="previewDialog=false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Channel test snackbar -->
    <v-snackbar v-model="testSnack" :color="testSnackColor" timeout="3000" location="bottom right">
      <v-icon :icon="testSnackColor === 'success' ? 'mdi-check-circle' : 'mdi-alert'" class="me-2"/>
      {{ testSnackMsg }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import {
  listerWorkflowTemplates,
  getParametres,
  listerNotificationTemplates,
  type WorkflowTemplate,
} from '../../services/admin'
import { listerDemandesApi } from '../../services/demandes'

// ── Types ───────────────────────────────────────────────────────────────────
type NodeType = 'trigger' | 'action' | 'auto' | 'condition' | 'notification' | 'delay' | 'end'
interface ConditionItem { field: string; operator: string; value: string }
interface ConditionConfig { conditions: ConditionItem[]; andOr: 'AND' | 'OR'; trueLabel: string; falseLabel: string }
interface NotifConfig {
  email: { enabled: boolean; template: string; subject: string }
  sms: { enabled: boolean; template: string }
  whatsapp: { enabled: boolean; template: string }
  inapp: { enabled: boolean; type: 'info' | 'warning' | 'error'; title: string; message: string }
}
interface WorkflowNode {
  id: string; type: NodeType; label: string; acteur: string; delai: string; icon: string
  description: string; destinataires: string[]; expanded: boolean; activeTab: string
  notifs: NotifConfig; condition: ConditionConfig
}
interface Template { id: string; name: string; channel: string; type: string; subject: string; body: string }

// ── Constants ────────────────────────────────────────────────────────────────
const nodeTypeMap: Record<NodeType, { color: string; label: string; icon: string }> = {
  trigger:      { color: '#1B8F4C', label: 'Déclencheur', icon: 'mdi-play-circle' },
  action:       { color: '#2774AE', label: 'Action humaine', icon: 'mdi-account-check' },
  auto:         { color: '#6A1B9A', label: 'Automatique', icon: 'mdi-cog-play' },
  condition:    { color: '#E65100', label: 'Condition', icon: 'mdi-code-braces' },
  notification: { color: '#0277BD', label: 'Notification', icon: 'mdi-bell-ring' },
  delay:        { color: '#546E7A', label: 'Délai / Attente', icon: 'mdi-timer-sand' },
  end:          { color: '#C62828', label: 'Fin', icon: 'mdi-flag-checkered' },
}

const nodeTypes = Object.entries(nodeTypeMap).map(([type, v]) => ({
  type: type as NodeType, ...v,
  desc: { trigger: 'Dépôt, API, planifié', action: 'Instruction, validation', auto: 'OASE automatique', condition: 'Branchement IF/ELSE', notification: 'Envoi multi-canal', delay: 'Attente temporisée', end: 'Clôture du circuit' }[type] || '',
}))

const acteurs = ['Contribuable', 'Agent OTR Douanes', 'Agent OTR Impôts', 'Agent DGBF', 'Agent DGTCP', 'Directeur OTR', 'Ministre MEF', 'Agent API-ZF', 'Système OASE']
const notifDestinataires = ['Contribuable', 'Agent instructeur', 'Superviseur', 'Agent DGBF', "Responsable d'escalade"]
const condFields = ['montant_fcfa', 'type_exoneration', 'statut_fiscal', 'statut_douanier', 'secteur', 'nb_emplois', 'zone_geographique', 'date_depot', 'nb_jours_traitement']
const condOperators = ['==', '!=', '>', '<', '>=', '<=', 'contient', 'ne contient pas']
const EMAIL_TEMPLATES_FALLBACK = ['Notification dépôt dossier', 'Dossier en cours d\'instruction', 'Demande de complément', 'Décision approuvée', 'Décision de rejet', 'Relance contribuable', 'Escalade SLA', 'Attestation disponible']
const SMS_TEMPLATES_FALLBACK = ['SMS dépôt confirmé', 'SMS mise en instruction', 'SMS décision disponible', 'SMS relance', 'SMS escalade urgente']
const WA_TEMPLATES_FALLBACK = ['oase_depot_confirme', 'oase_instruction_lancee', 'oase_decision_approuvee', 'oase_document_disponible']
// Listes dérivées des templates réels (GET /notifications/templates) quand disponibles,
// sinon repli sur les libellés statiques ci-dessus.
function tplNames(canal: string, fallback: string[]) {
  const reels = allTemplates.value.filter(t => t.channel === canal).map(t => t.name)
  return reels.length ? reels : fallback
}
const emailTemplates = computed(() => tplNames('email', EMAIL_TEMPLATES_FALLBACK))
const smsTemplates = computed(() => tplNames('sms', SMS_TEMPLATES_FALLBACK))
const waTemplates = computed(() => tplNames('whatsapp', WA_TEMPLATES_FALLBACK))
const templateVars = ['{{dossier_ref}}', '{{contribuable}}', '{{montant}}', '{{etape}}', '{{acteur}}', '{{delai}}', '{{lien_dossier}}', '{{date}}', '{{decision}}', '{{agent_nom}}']

const mkNotif = (): NotifConfig => ({
  email: { enabled: false, template: '', subject: '' },
  sms: { enabled: false, template: '' },
  whatsapp: { enabled: false, template: '' },
  inapp: { enabled: false, type: 'info', title: '', message: '' },
})
const mkCond = (): ConditionConfig => ({ conditions: [], andOr: 'AND', trueLabel: 'Oui', falseLabel: 'Non' })

// ── Workflow nodes ───────────────────────────────────────────────────────────
const workflow = ref<WorkflowNode[]>([
  {
    id: 'n1', type: 'trigger', label: 'Dépôt du dossier', acteur: 'Contribuable', delai: '—',
    icon: 'mdi-upload-box', description: "Le contribuable soumet sa demande via le portail OASE.", destinataires: ['Agent instructeur'],
    expanded: false, activeTab: 'general',
    notifs: { email: { enabled: true, template: 'Notification dépôt dossier', subject: '[OASE] Votre dossier {{dossier_ref}} a été reçu' }, sms: { enabled: true, template: 'SMS dépôt confirmé' }, whatsapp: { enabled: false, template: '' }, inapp: { enabled: true, type: 'info', title: 'Nouveau dossier reçu', message: 'Dossier {{dossier_ref}} — {{contribuable}} — à instruire' } },
    condition: mkCond(),
  },
  {
    id: 'n2', type: 'action', label: 'Instruction OTR', acteur: 'Agent OTR Douanes', delai: '15j ouvrés',
    icon: 'mdi-file-search-outline', description: "Vérification de la recevabilité et des pièces. Contrôle SYDONIA.", destinataires: ['Contribuable', 'Agent instructeur'],
    expanded: false, activeTab: 'general',
    notifs: { email: { enabled: true, template: "Dossier en cours d'instruction", subject: '[OASE] Dossier {{dossier_ref}} en cours d\'instruction' }, sms: { enabled: false, template: '' }, whatsapp: { enabled: false, template: '' }, inapp: { enabled: true, type: 'warning', title: 'Dossier en attente d\'instruction', message: '{{dossier_ref}} — Délai: 15j ouvrés — Acteur: Agent OTR' } },
    condition: mkCond(),
  },
  {
    id: 'n3', type: 'condition', label: 'Montant > 50M FCFA ?', acteur: 'Système OASE', delai: 'Auto',
    icon: 'mdi-code-braces', description: "Contrôle du seuil de visa DGBF obligatoire.", destinataires: [],
    expanded: false, activeTab: 'condition',
    notifs: mkNotif(),
    condition: { conditions: [{ field: 'montant_fcfa', operator: '>', value: '50000000' }], andOr: 'AND', trueLabel: 'Visa DGBF requis', falseLabel: 'Signature directe' },
  },
  {
    id: 'n4', type: 'action', label: 'Visa DGBF', acteur: 'Agent DGBF', delai: '10j ouvrés',
    icon: 'mdi-check-decagram-outline', description: "Visa budgétaire obligatoire pour les dossiers supérieurs à 50M FCFA.", destinataires: ['Agent instructeur', 'Agent DGBF'],
    expanded: false, activeTab: 'general',
    notifs: { email: { enabled: true, template: "Dossier en cours d'instruction", subject: '[OASE] Visa DGBF requis — {{dossier_ref}}' }, sms: { enabled: true, template: 'SMS mise en instruction' }, whatsapp: { enabled: false, template: '' }, inapp: { enabled: true, type: 'warning', title: 'Visa DGBF en attente', message: '{{dossier_ref}} nécessite un visa budgétaire DGBF' } },
    condition: mkCond(),
  },
  {
    id: 'n5', type: 'action', label: 'Signature Directeur OTR', acteur: 'Directeur OTR', delai: '5j ouvrés',
    icon: 'mdi-file-sign', description: "Signature officielle et émission de l'attestation d'exonération.", destinataires: ['Contribuable', 'Agent instructeur'],
    expanded: false, activeTab: 'general',
    notifs: { email: { enabled: true, template: 'Décision approuvée', subject: '[OASE] Décision — {{dossier_ref}}' }, sms: { enabled: true, template: 'SMS décision disponible' }, whatsapp: { enabled: true, template: 'oase_decision_approuvee' }, inapp: { enabled: true, type: 'info', title: 'Décision disponible', message: 'Dossier {{dossier_ref}} — Décision signée par le Directeur' } },
    condition: mkCond(),
  },
  {
    id: 'n6', type: 'notification', label: 'Notification finale contribuable', acteur: 'Système OASE', delai: 'Auto',
    icon: 'mdi-bell-ring-outline', description: "Notification automatique multi-canal avec le lien de téléchargement de l'attestation.", destinataires: ['Contribuable'],
    expanded: false, activeTab: 'notifs',
    notifs: { email: { enabled: true, template: 'Attestation disponible', subject: '[OASE] Votre attestation {{dossier_ref}} est disponible' }, sms: { enabled: true, template: 'SMS décision disponible' }, whatsapp: { enabled: true, template: 'oase_document_disponible' }, inapp: { enabled: true, type: 'info', title: 'Attestation disponible', message: 'Téléchargez votre attestation d\'exonération {{dossier_ref}}' } },
    condition: mkCond(),
  },
])

// ── Other state ──────────────────────────────────────────────────────────────
const mainTab = ref('builder')
const selectedType = ref('douaniere')
const version = ref('3.2')
const saved = ref(false)
const previewDialog = ref(false)
const sandboxDialog = ref(false)
const sandboxLoading = ref(false)
const sandboxStep = ref('')
const sandboxOpts = reactive({ notifs: true, evalConditions: true })
const sandboxResult = ref<{ msg: string; type: string }[]>([])
const testSuccess = ref<string | null>(null)
const testSnack = ref(false)
const testSnackMsg = ref('')
const testSnackColor = ref<'success' | 'error'>('success')
const selectedTemplate = ref<Template | null>(null)
const previewTemplateDialog = ref(false)

const typesExo = [
  { value: 'douaniere', label: 'Exonération douanière' },
  { value: 'fiscale_is', label: 'Exonération IS' },
  { value: 'fiscale_tva', label: 'Exonération TVA' },
  { value: 'zone_franche', label: 'Zone Franche' },
  { value: 'code_investissement', label: "Convention d'investissement" },
]

// Versions : seule la version locale courante est connue (non persistée côté API).
// TODO(endpoint): historique des versions de workflow non exposé par l'API v1.
const versions = computed(() => [
  { version: version.value, date: 'Version locale (non persistée)', active: true },
])

// ── Dossiers sandbox réels (GET /demandes) ───────────────────────────────────
interface DossierSandbox { id: string; ref: string; montantFcfa: number; statutCode: string }
const sandboxDossiers = ref<DossierSandbox[]>([])
const sandboxDossierId = ref<string | null>(null)

async function chargerSandboxDossiers() {
  try {
    const res = await listerDemandesApi()
    sandboxDossiers.value = res.data.map(d => ({
      id: d.id,
      ref: d.contribuable?.raisonSociale ? `${d.reference} — ${d.contribuable.raisonSociale}` : d.reference,
      montantFcfa: Number(d.montantFcfa ?? 0),
      statutCode: d.statutCode,
    }))
  } catch {
    sandboxDossiers.value = []
  }
}

// ── Channel configs ──────────────────────────────────────────────────────────
// Pré-remplies depuis GET /admin/parametres (clés smtp.*, sms.*, whatsapp.*).
const emailConfig = reactive({ smtp: '', port: '', from: '', fromName: '', user: '', password: '', tls: 'STARTTLS', replyTo: '' })
const smsConfig = reactive({ provider: '', apiKey: '', senderId: '', endpoint: '', encoding: 'GSM-7 (160 car.)' })
const waConfig = reactive({ phoneNumberId: '', accessToken: '', businessAccountId: '', webhookVerifyToken: '', enabled: false, template: '' })
const paramsCanauxLoading = ref(false)
const inappConfig = reactive({ banner: true, badge: true, sound: false, persist: true, autoExpire: '24 heures' })
const globalRules = reactive({ deduplication: true, quietHours: true, fallback: true, logAll: true })

const emailConfigured = computed(() => Boolean(emailConfig.smtp))
const smsConfigured = computed(() => Boolean(smsConfig.provider))
const waConfigured = computed(() => waConfig.enabled)

/** Pré-remplit les configurations de canaux depuis GET /admin/parametres. */
async function chargerConfigCanaux() {
  paramsCanauxLoading.value = true
  try {
    const p = await getParametres()
    emailConfig.smtp = p['smtp.host'] ?? ''
    emailConfig.port = p['smtp.port'] ?? ''
    emailConfig.from = p['smtp.from'] ?? ''
    emailConfig.user = p['smtp.user'] ?? ''
    smsConfig.provider = p['sms.provider'] ?? ''
    smsConfig.apiKey = p['sms.api_key'] ?? ''
    waConfig.enabled = p['whatsapp.enabled'] === 'true'
    waConfig.template = p['whatsapp.template'] ?? ''
  } catch {
    // paramètres indisponibles : champs laissés vides (« non configuré »)
  } finally {
    paramsCanauxLoading.value = false
  }
}

// ── SLA ──────────────────────────────────────────────────────────────────────
const sla = reactive({ escaladeResponsable: '', delaiEscalade: '', canaux: ['email', 'inapp'], autoRelance: false, relanceDelai: '', relanceCanal: 'E-mail', relanceMax: 3, autoArchive: false, autoRejet: false })
// TODO(endpoint): pas de journal d'alertes SLA dans l'API v1 — section masquée.
const slaJournal = ref<{ id: number; action: string; date: string; level: string }[]>([])

// ── Templates ────────────────────────────────────────────────────────────────
// Bibliothèque réelle chargée depuis GET /notifications/templates (admin_si).
const allTemplates = ref<Template[]>([])

selectedTemplate.value = null

/** Charge les templates de notification réels et les mappe vers le modèle local. */
async function chargerTemplatesNotification() {
  try {
    const tpls = await listerNotificationTemplates()
    allTemplates.value = tpls.map(t => ({
      id: t.id,
      name: t.code,
      channel: t.canalCode,
      type: t.typeNotificationCode,
      subject: t.sujet,
      body: t.corps,
    }))
  } catch {
    allTemplates.value = []
  }
}

// ── Methods ──────────────────────────────────────────────────────────────────
function snack(msg: string, color: 'success' | 'error' = 'success') {
  testSnackMsg.value = msg; testSnackColor.value = color; testSnack.value = true
}

function saveWorkflow() {
  // ⚠ L'API ne propose aucun endpoint de sauvegarde d'un template existant
  // (pas de PUT/PATCH /workflow/templates/:id — vérifié dans le Swagger).
  // L'enregistrement reste donc local : incrément de version uniquement.
  const v = parseFloat(version.value)
  version.value = (Math.round((v + 0.1) * 10) / 10).toFixed(1)
  saved.value = true
}

// ── Templates réels (API) ────────────────────────────────────────────────────
const apiTemplates = ref<WorkflowTemplate[]>([])
const apiTemplatesLoading = ref(false)

onMounted(async () => {
  apiTemplatesLoading.value = true
  try {
    apiTemplates.value = await listerWorkflowTemplates()
  } catch {
    apiTemplates.value = []
  } finally {
    apiTemplatesLoading.value = false
  }
  chargerSandboxDossiers()
  chargerConfigCanaux()
  chargerTemplatesNotification()
})

function addNodeFromPalette(type: NodeType) {
  const def = nodeTypeMap[type]
  workflow.value.push({
    id: `n${Date.now()}`, type, label: def.label, acteur: 'Système OASE', delai: '—',
    icon: def.icon, description: '', destinataires: [],
    expanded: true, activeTab: 'general',
    notifs: mkNotif(), condition: mkCond(),
  })
}

function moveNode(i: number, dir: number) {
  const j = i + dir
  if (j < 0 || j >= workflow.value.length) return
  const tmp = workflow.value[i]; workflow.value[i] = workflow.value[j]; workflow.value[j] = tmp
}

function removeNode(i: number) { workflow.value.splice(i, 1) }

function expandAll() { workflow.value.forEach(n => n.expanded = true) }
function collapseAll() { workflow.value.forEach(n => n.expanded = false) }

function addCondition(node: WorkflowNode) {
  node.condition.conditions.push({ field: 'montant_fcfa', operator: '>', value: '' })
}

function conditionSummary(cond: ConditionConfig): string {
  if (!cond.conditions.length) return ''
  return cond.conditions.map(c => `${c.field} ${c.operator} ${c.value}`).join(` ${cond.andOr} `)
}

function testNotification(node: WorkflowNode) {
  testSuccess.value = node.id
  const channels = [
    node.notifs.email.enabled && 'Email',
    node.notifs.sms.enabled && 'SMS',
    node.notifs.whatsapp.enabled && 'WhatsApp',
    node.notifs.inapp.enabled && 'Dashboard',
  ].filter(Boolean).join(', ')
  snack(`Test envoyé via : ${channels || 'aucun canal actif'}`)
  setTimeout(() => { testSuccess.value = null }, 3000)
}

function testChannel(ch: string) {
  // Aucun canal externe n'est configuré côté API v1 : pas d'envoi réel possible.
  const msgs: Record<string, string> = {
    email: 'Canal e-mail non configuré — aucun envoi réel possible.',
    sms: 'Canal SMS non configuré — aucun envoi réel possible.',
    whatsapp: 'Canal WhatsApp non configuré — aucun envoi réel possible.',
  }
  snack(msgs[ch] || 'Canal non configuré', 'error')
}

function addTemplate() {
  const tpl: Template = { id: `t${Date.now()}`, name: 'Nouveau template', channel: 'email', type: 'Dépôt dossier', subject: '', body: '' }
  allTemplates.value.push(tpl)
  selectedTemplate.value = tpl
}

function deleteTemplate(id: string) {
  allTemplates.value = allTemplates.value.filter(t => t.id !== id)
  selectedTemplate.value = allTemplates.value[0] || null
}

function insertVar(v: string) {
  if (!selectedTemplate.value) return
  selectedTemplate.value.body += v
}

function runSandbox() {
  sandboxLoading.value = true
  sandboxResult.value = []
  const dossier = sandboxDossiers.value.find(d => d.id === sandboxDossierId.value)
  if (!dossier) {
    sandboxResult.value.push({ msg: '⚠ Sélectionnez un dossier réel (GET /demandes) pour lancer la simulation.', type: 'error' })
    sandboxLoading.value = false
    return
  }
  // Simulation sèche dérivée du circuit édité et d'un dossier RÉEL —
  // aucune notification n'est réellement envoyée (canaux non configurés).
  const steps: { msg: string; type: string }[] = [
    { msg: '▶ Initialisation sandbox...', type: 'info' },
    { msg: `✓ Dossier réel ${dossier.ref} chargé (statut: ${dossier.statutCode}, montant: ${dossier.montantFcfa.toLocaleString('fr-FR')} FCFA)`, type: 'success' },
  ]
  workflow.value.forEach((node, i) => {
    steps.push({ msg: `→ Étape ${i + 1} — ${node.label} (${node.acteur})… simulée OK`, type: 'success' })
    if (sandboxOpts.evalConditions && node.condition.conditions.length) {
      const cond = node.condition.conditions[0]
      const isMontant = cond.field === 'montant_fcfa'
      const seuil = Number(cond.value) || 0
      const resultat = isMontant && seuil ? (dossier.montantFcfa > seuil) : null
      steps.push({
        msg: `  ⚡ Condition ${cond.field} ${cond.operator} ${cond.value} → ${resultat === null ? 'non évaluable localement' : resultat ? `VRAI (${node.condition.trueLabel})` : `FAUX (${node.condition.falseLabel})`}`,
        type: 'info',
      })
    }
    if (sandboxOpts.notifs) {
      const canaux = [
        node.notifs.email.enabled && 'e-mail',
        node.notifs.sms.enabled && 'SMS',
        node.notifs.whatsapp.enabled && 'WhatsApp',
        node.notifs.inapp.enabled && 'in-app',
      ].filter(Boolean).join(', ')
      steps.push({ msg: `  � Notifications simulées (${canaux || 'aucun canal actif'}) — aucun envoi réel`, type: 'info' })
    }
  })
  steps.push({ msg: `✅ Simulation terminée — ${workflow.value.length} étape(s) parcourue(s) sur données réelles`, type: 'success' })
  let i = 0
  const interval = setInterval(() => {
    if (i < steps.length) { sandboxResult.value.push(steps[i++]) }
    else { clearInterval(interval); sandboxLoading.value = false }
  }, 150)
}
</script>

<style scoped>
/* ── Canvas ── */
.wf-canvas {
  background: #F8FAFC;
  border-radius: 12px;
  min-height: 400px;
}
.wf-flow {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  max-width: 700px;
  margin: 0 auto;
}

/* ── Node ── */
.wf-node {
  background: white;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.09);
  border-left: 4px solid #2774AE;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  transition: box-shadow 0.2s, border-color 0.2s;
  overflow: hidden;
}
.wf-node:hover {
  box-shadow: 0 3px 12px rgba(0,0,0,0.12);
}
.wf-node--open {
  box-shadow: 0 4px 16px rgba(39,116,174,0.15);
}
.wf-node--condition {
  background: #FFFBF2;
}

.wf-node-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
}
.wf-node-header:hover {
  background: rgba(39,116,174,0.02);
}
.wf-node-body {
  padding: 0 16px 16px;
}

/* ── Connector ── */
.wf-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  position: relative;
}
.wf-connector-line {
  width: 2px;
  height: 14px;
  background: linear-gradient(to bottom, rgba(39,116,174,0.3), rgba(39,116,174,0.6));
}
.wf-connector-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
}
.wf-connector-condition {
  display: flex;
  align-items: center;
}

/* ── End node ── */
.wf-end {
  background: white;
  border-radius: 10px;
  border: 1px dashed rgba(27,143,76,0.4);
  margin-top: 0;
}

/* ── Palette ── */
.palette-node {
  transition: background 0.15s, transform 0.1s;
}
.palette-node:hover {
  background: rgba(39,116,174,0.06) !important;
  transform: translateX(2px);
}

/* ── Sandbox log ── */
.sandbox-log {
  border: 1px solid rgba(255,255,255,0.1);
}
</style>
