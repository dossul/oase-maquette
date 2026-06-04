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
            <v-card rounded="lg" elevation="1">
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
                                          <span class="text-caption" v-pre>Variables disponibles : <code>{{dossier_ref}}</code>, <code>{{beneficiaire}}</code>, <code>{{etape}}</code>, <code>{{lien_dossier}}</code></span>
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
                <v-chip color="success" size="x-small" variant="tonal" class="ms-auto">
                  <v-icon icon="mdi-check-circle" size="12" class="me-1"/>Connecté
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
                <v-chip color="success" size="x-small" variant="tonal" class="ms-auto">
                  <v-icon icon="mdi-check-circle" size="12" class="me-1"/>Actif
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
                <v-chip color="warning" size="x-small" variant="tonal" class="ms-auto">
                  <v-icon icon="mdi-alert" size="12" class="me-1"/>Vérification en cours
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
                  <div class="text-caption text-medium-emphasis mb-2 font-weight-bold">Aperçu de l'alerte :</div>
                  <v-alert type="warning" variant="tonal" rounded="lg" density="compact" closable>
                    <div class="text-caption font-weight-bold">Nouveau dossier à instruire</div>
                    <div class="text-caption">OASE-2026-0042 — TOGO STEEL SARL · Exonération douanière · En attente depuis 2h</div>
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
              <v-list density="compact" class="pa-2">
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
                <v-switch v-model="sla.autoRelance" label="Relance bénéficiaire si inactif" color="primary" hide-details density="compact" class="mb-3"/>
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
              <v-list density="compact" class="pa-2">
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
          <v-select :items="mockDossiers" item-title="ref" item-value="id" label="Dossier de test" class="mb-3" hide-details/>
          <v-select :items="acteurs" label="Simuler l'acteur courant" class="mb-3" hide-details/>
          <v-select v-model="sandboxStep" :items="workflow.map(n=>n.label)" label="Étape de départ" class="mb-3" hide-details/>
          <v-divider class="mb-3"/>
          <v-checkbox v-model="sandboxOpts.notifs" label="Envoyer les notifications test (canaux configurés)" hide-details density="compact" class="mb-1"/>
          <v-checkbox v-model="sandboxOpts.mockData" label="Utiliser des données mockées réalistes" hide-details density="compact" class="mb-1"/>
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
import { ref, reactive, computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'

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

const acteurs = ['Bénéficiaire', 'Agent OTR Douanes', 'Agent OTR Impôts', 'Agent DGBF', 'Agent DGTCP', 'Directeur OTR', 'Ministre MEF', 'Agent API-ZF', 'Système OASE']
const notifDestinataires = ['Bénéficiaire', 'Agent instructeur', 'Superviseur', 'Agent DGBF', "Responsable d'escalade"]
const condFields = ['montant_fcfa', 'type_exoneration', 'statut_fiscal', 'statut_douanier', 'secteur', 'nb_emplois', 'zone_geographique', 'date_depot', 'nb_jours_traitement']
const condOperators = ['==', '!=', '>', '<', '>=', '<=', 'contient', 'ne contient pas']
const emailTemplates = ['Notification dépôt dossier', 'Dossier en cours d\'instruction', 'Demande de complément', 'Décision approuvée', 'Décision de rejet', 'Relance bénéficiaire', 'Escalade SLA', 'Attestation disponible']
const smsTemplates = ['SMS dépôt confirmé', 'SMS mise en instruction', 'SMS décision disponible', 'SMS relance', 'SMS escalade urgente']
const waTemplates = ['oase_depot_confirme', 'oase_instruction_lancee', 'oase_decision_approuvee', 'oase_document_disponible']
const templateVars = ['{{dossier_ref}}', '{{beneficiaire}}', '{{montant}}', '{{etape}}', '{{acteur}}', '{{delai}}', '{{lien_dossier}}', '{{date}}', '{{decision}}', '{{agent_nom}}']

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
    id: 'n1', type: 'trigger', label: 'Dépôt du dossier', acteur: 'Bénéficiaire', delai: '—',
    icon: 'mdi-upload-box', description: "Le bénéficiaire soumet sa demande via le portail OASE.", destinataires: ['Agent instructeur'],
    expanded: false, activeTab: 'general',
    notifs: { email: { enabled: true, template: 'Notification dépôt dossier', subject: '[OASE] Votre dossier {{dossier_ref}} a été reçu' }, sms: { enabled: true, template: 'SMS dépôt confirmé' }, whatsapp: { enabled: false, template: '' }, inapp: { enabled: true, type: 'info', title: 'Nouveau dossier reçu', message: 'Dossier {{dossier_ref}} — {{beneficiaire}} — à instruire' } },
    condition: mkCond(),
  },
  {
    id: 'n2', type: 'action', label: 'Instruction OTR', acteur: 'Agent OTR Douanes', delai: '15j ouvrés',
    icon: 'mdi-file-search-outline', description: "Vérification de la recevabilité et des pièces. Contrôle SYDONIA.", destinataires: ['Bénéficiaire', 'Agent instructeur'],
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
    icon: 'mdi-file-sign', description: "Signature officielle et émission de l'attestation d'exonération.", destinataires: ['Bénéficiaire', 'Agent instructeur'],
    expanded: false, activeTab: 'general',
    notifs: { email: { enabled: true, template: 'Décision approuvée', subject: '[OASE] Décision — {{dossier_ref}}' }, sms: { enabled: true, template: 'SMS décision disponible' }, whatsapp: { enabled: true, template: 'oase_decision_approuvee' }, inapp: { enabled: true, type: 'info', title: 'Décision disponible', message: 'Dossier {{dossier_ref}} — Décision signée par le Directeur' } },
    condition: mkCond(),
  },
  {
    id: 'n6', type: 'notification', label: 'Notification finale bénéficiaire', acteur: 'Système OASE', delai: 'Auto',
    icon: 'mdi-bell-ring-outline', description: "Notification automatique multi-canal avec le lien de téléchargement de l'attestation.", destinataires: ['Bénéficiaire'],
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
const sandboxOpts = reactive({ notifs: true, mockData: true, evalConditions: true })
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

const versions = [
  { version: '3.2', date: '15/04/2026 (actuelle)', active: true },
  { version: '3.1', date: '01/02/2026', active: false },
  { version: '3.0', date: '01/01/2026', active: false },
]

const mockDossiers = [
  { id: '1', ref: 'OASE-2026-0042 — TOGO STEEL SARL' },
  { id: '2', ref: 'OASE-2026-0039 — AGRO-TOGO INVEST' },
]

// ── Channel configs ──────────────────────────────────────────────────────────
const emailConfig = reactive({ smtp: 'smtp.mef.tg', port: '587', from: 'noreply@oase.mef.tg', fromName: 'Plateforme OASE', user: 'smtp-oase', password: '', tls: 'STARTTLS', replyTo: 'support@oase.mef.tg' })
const smsConfig = reactive({ provider: 'Orange Togo SMS API', apiKey: '', senderId: 'OASE-MEF', endpoint: 'https://api.orange.tg/sms/v1/send', encoding: 'GSM-7 (160 car.)' })
const waConfig = reactive({ phoneNumberId: '1234567890', accessToken: '', businessAccountId: '', webhookVerifyToken: '' })
const inappConfig = reactive({ banner: true, badge: true, sound: false, persist: true, autoExpire: '24 heures' })
const globalRules = reactive({ deduplication: true, quietHours: true, fallback: true, logAll: true })

// ── SLA ──────────────────────────────────────────────────────────────────────
const sla = reactive({ escaladeResponsable: 'Directeur OTR', delaiEscalade: '48h', canaux: ['email', 'sms', 'inapp'], autoRelance: true, relanceDelai: '7j', relanceCanal: 'E-mail', relanceMax: 3, autoArchive: true, autoRejet: false })
const slaJournal = ref([
  { id: 1, action: 'SLA dépassé : OASE-2026-0031 — Instruction OTR (18j)', date: '26/04/2026 09:15', level: 'error' },
  { id: 2, action: 'Relance auto envoyée : OASE-2026-0028 — inactif 7j', date: '25/04/2026 08:00', level: 'warning' },
  { id: 3, action: 'Escalade déclenchée : OASE-2026-0025 — Directeur OTR notifié', date: '22/04/2026 14:30', level: 'error' },
])

// ── Templates ────────────────────────────────────────────────────────────────
const allTemplates = ref<Template[]>([
  { id: 't1', name: 'Notification dépôt dossier', channel: 'email', type: 'Dépôt dossier', subject: '[OASE] Votre dossier {{dossier_ref}} a été reçu', body: `Bonjour {{beneficiaire}},\n\nNous accusons réception de votre demande d'exonération référencée **{{dossier_ref}}**.\n\nVotre dossier est désormais en cours de traitement. Vous pouvez suivre l'avancement de votre demande en vous connectant sur la plateforme OASE :\n\n{{lien_dossier}}\n\nCordialement,\nL'équipe OASE — Ministère de l'Économie et des Finances du Togo` },
  { id: 't2', name: 'SMS dépôt confirmé', channel: 'sms', type: 'Dépôt dossier', subject: '', body: 'OASE-MEF: Dossier {{dossier_ref}} recu. Traitement sous 15j ouvres. Suivi: oase.mef.tg' },
  { id: 't3', name: 'SMS décision disponible', channel: 'sms', type: 'Notification finale', subject: '', body: 'OASE-MEF: Decision dossier {{dossier_ref}} disponible. Connexion: oase.mef.tg' },
  { id: 't4', name: 'oase_depot_confirme', channel: 'whatsapp', type: 'Dépôt dossier', subject: '', body: 'Votre dossier {{dossier_ref}} a bien été reçu par la plateforme OASE. Délai de traitement: 15 jours ouvrés. 🟢' },
  { id: 't5', name: 'Escalade SLA', channel: 'email', type: 'Escalade', subject: '[OASE URGENT] SLA dépassé — {{dossier_ref}}', body: `Monsieur/Madame {{acteur}},\n\nLe dossier **{{dossier_ref}}** a dépassé le délai réglementaire de {{delai}} à l'étape "{{etape}}".\n\nMerci d'intervenir dans les meilleurs délais.\n\nPlateforme OASE — Alerte automatique` },
])

selectedTemplate.value = allTemplates.value[0]

// ── Methods ──────────────────────────────────────────────────────────────────
function snack(msg: string, color: 'success' | 'error' = 'success') {
  testSnackMsg.value = msg; testSnackColor.value = color; testSnack.value = true
}

function saveWorkflow() {
  const v = parseFloat(version.value)
  version.value = (Math.round((v + 0.1) * 10) / 10).toFixed(1)
  saved.value = true
}

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
  const msgs: Record<string, string> = {
    email: 'E-mail test envoyé à admin@oase.mef.tg',
    sms: 'SMS test envoyé au +228 XX XX XX XX',
    whatsapp: 'Message WhatsApp test envoyé',
  }
  snack(msgs[ch] || 'Test effectué')
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
  const steps = [
    { msg: '▶ Initialisation sandbox...', type: 'info' },
    { msg: '✓ Dossier mock OASE-2026-0042 chargé', type: 'success' },
    { msg: '✓ Acteur simulé : Agent OTR Douanes', type: 'success' },
    { msg: '→ Étape 1 — Dépôt du dossier... OK', type: 'success' },
    { msg: '  📧 E-mail envoyé (simulation) à beneficiaire@test.tg', type: 'info' },
    { msg: '  📱 SMS envoyé (simulation) au +228 90000001', type: 'info' },
    { msg: '→ Étape 2 — Instruction OTR... OK', type: 'success' },
    { msg: '  🔔 Alerte dashboard créée pour Agent OTR', type: 'info' },
    { msg: '→ Condition : montant_fcfa > 50000000 → VRAI (150M FCFA)', type: 'info' },
    { msg: '→ Étape 3 — Visa DGBF... OK', type: 'success' },
    { msg: '  📧 E-mail envoyé à agent-dgbf@mef.tg + 📱 SMS', type: 'info' },
    { msg: '→ Étape 4 — Signature Directeur OTR... OK', type: 'success' },
    { msg: '→ Étape 5 — Notification finale... OK', type: 'success' },
    { msg: '  📧 Email + 📱 SMS + 📲 WhatsApp envoyés', type: 'info' },
    { msg: '✅ Simulation terminée — 6 étapes, 7 notifications envoyées', type: 'success' },
  ]
  let i = 0
  const interval = setInterval(() => {
    if (i < steps.length) { sandboxResult.value.push(steps[i++]) }
    else { clearInterval(interval); sandboxLoading.value = false }
  }, 180)
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
