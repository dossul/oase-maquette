<template>
  <div>

    <!-- ────────────────────────────────────────────────────────────────
         BREADCRUMB when mission selected
    ──────────────────────────────────────────────────────────────────── -->
    <div v-if="selectedMission" class="d-flex align-center ga-2 mb-4">
      <v-btn size="x-small" variant="tonal" prepend-icon="mdi-arrow-left" @click="selectedMission=null">
        Missions
      </v-btn>
      <v-icon icon="mdi-chevron-right" size="16" color="medium-emphasis"/>
      <span class="text-body-2 font-weight-semibold">{{ selectedMission.ref }}</span>
      <v-chip
        :color="selectedMission.statut==='en_cours'?'info':selectedMission.statut==='planifiee'?'warning':'success'"
        size="x-small" variant="tonal"
      >{{ selectedMission.statutLabel }}</v-chip>
      <v-chip color="secondary" size="x-small" variant="outlined" class="ms-1">
        {{ selectedMission.beneficiaire }}
      </v-chip>
    </div>

    <!-- ════════════════════════════════════════════════════════════════
         DETAIL VIEW — Mission sélectionnée
    ════════════════════════════════════════════════════════════════════ -->
    <div v-if="selectedMission">
      <!-- Tabs -->
      <v-tabs v-model="detailTab" color="primary" class="mb-4" density="compact">
        <v-tab value="info" prepend-icon="mdi-information">Informations</v-tab>
        <v-tab value="constats" prepend-icon="mdi-clipboard-list">
          Constats
          <v-badge v-if="missionConstats.length" :content="missionConstats.length" color="error" inline class="ms-1"/>
        </v-tab>
        <v-tab value="recommandations" prepend-icon="mdi-lightbulb">Recommandations</v-tab>
        <v-tab value="rapport" prepend-icon="mdi-file-chart">Rapport & Suites données</v-tab>
      </v-tabs>

      <v-window v-model="detailTab">

        <!-- ── TAB 1 : Informations générales ── -->
        <v-window-item value="info">
          <v-row>
            <v-col cols="12" md="7">
              <v-card rounded="lg" elevation="1" class="mb-4">
                <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Fiche mission</v-card-title>
                <v-card-text class="pa-4">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="selectedMission.ref" label="Référence de la mission" readonly/>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="selectedMission.beneficiaire" label="Bénéficiaire contrôlé" prepend-inner-icon="mdi-domain"/>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field v-model="selectedMission.dateDebut" label="Début de la période contrôlée" type="date"/>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field v-model="selectedMission.dateFin" label="Fin de la période contrôlée" type="date"/>
                    </v-col>
                    <v-col cols="12">
                      <v-select
                        v-model="selectedMission.agents"
                        :items="agentsDisponibles"
                        label="Agents affectés"
                        multiple
                        chips
                        closable-chips
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-textarea v-model="selectedMission.objectifs" label="Objectifs et périmètre de la mission" rows="3"/>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="selectedMission.statut"
                        :items="statutOptions"
                        item-title="label"
                        item-value="value"
                        label="Statut de la mission"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="selectedMission.typeMission"
                        :items="['Sur pièces','Sur place','Mixte']"
                        label="Type de contrôle"
                      />
                    </v-col>
                  </v-row>
                  <div class="d-flex justify-end mt-2">
                    <v-btn color="primary" size="small" prepend-icon="mdi-content-save" @click="missionSaved=true">
                      Enregistrer
                    </v-btn>
                  </div>
                  <v-snackbar v-model="missionSaved" color="success" timeout="2000" location="top">
                    Mission mise à jour
                  </v-snackbar>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="5">
              <!-- Dossiers concernés -->
              <v-card rounded="lg" elevation="1" class="mb-4">
                <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold d-flex align-center justify-space-between">
                  Dossiers examinés
                  <v-btn size="x-small" variant="tonal" prepend-icon="mdi-plus" @click="addDossierDialog=true">
                    Ajouter
                  </v-btn>
                </v-card-title>
                <v-list density="compact" class="pa-2">
                  <v-list-item
                    v-for="d in selectedMission.dossiers"
                    :key="d.ref"
                    :subtitle="`${d.type} · ${d.montant}`"
                    prepend-icon="mdi-folder"
                    rounded="lg"
                    class="mb-1"
                  >
                    <template #title><span class="text-caption font-weight-semibold">{{ d.ref }}</span></template>
                    <template #append>
                      <v-chip :color="d.anomalie?'error':'success'" size="x-small" variant="tonal">
                        {{ d.anomalie ? 'Anomalie' : 'Conforme' }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card>

              <!-- Documents -->
              <v-card rounded="lg" elevation="1">
                <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold d-flex align-center justify-space-between">
                  Pièces de la mission
                  <v-btn size="x-small" variant="tonal" prepend-icon="mdi-upload">Ajouter</v-btn>
                </v-card-title>
                <v-list density="compact" class="pa-2">
                  <v-list-item
                    v-for="doc in selectedMission.documents"
                    :key="doc.nom"
                    :subtitle="doc.date"
                    prepend-icon="mdi-file-pdf-box"
                    rounded="lg"
                    class="mb-1"
                  >
                    <template #title><span class="text-caption">{{ doc.nom }}</span></template>
                    <template #append><v-btn icon="mdi-eye" size="x-small" variant="text" color="primary"/></template>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- ── TAB 2 : Saisie des constats ── -->
        <v-window-item value="constats">
          <v-row>
            <v-col cols="12" md="8">
              <!-- Liste des constats existants -->
              <v-card rounded="lg" elevation="1" class="mb-4">
                <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
                  Constats relevés ({{ missionConstats.length }})
                  <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="constatDialog=true">
                    Nouveau constat
                  </v-btn>
                </v-card-title>

                <div v-if="missionConstats.length===0" class="pa-8 text-center text-medium-emphasis">
                  <v-icon icon="mdi-clipboard-text-outline" size="48" class="mb-3 opacity-30"/>
                  <div class="text-body-2">Aucun constat enregistré pour cette mission.</div>
                  <div class="text-caption">Cliquez sur « Nouveau constat » pour commencer la saisie.</div>
                </div>

                <div v-else class="pa-3">
                  <v-card
                    v-for="(c, idx) in missionConstats"
                    :key="c.id"
                    variant="outlined"
                    rounded="lg"
                    class="mb-3"
                    :class="c.gravite==='critique'?'border-error':c.gravite==='elevee'?'border-warning':''"
                  >
                    <v-card-text class="pa-4">
                      <div class="d-flex align-start justify-space-between mb-2">
                        <div class="d-flex align-center ga-2">
                          <span class="text-body-2 font-weight-bold">Constat #{{ idx+1 }}</span>
                          <v-chip
                            :color="c.gravite==='critique'?'error':c.gravite==='elevee'?'warning':c.gravite==='moyenne'?'info':'secondary'"
                            size="x-small" variant="tonal"
                          >{{ c.gravite }}</v-chip>
                          <v-chip color="secondary" size="x-small" variant="outlined">{{ c.typeIrregularite }}</v-chip>
                        </div>
                        <div class="d-flex ga-1">
                          <v-btn icon="mdi-pencil" size="x-small" variant="text" color="primary" @click="editConstat(c)"/>
                          <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="removeConstat(c.id)"/>
                        </div>
                      </div>
                      <div class="text-caption font-weight-semibold text-medium-emphasis mb-1">Dossier concerné : {{ c.dossierRef }}</div>
                      <div class="text-body-2 mb-2" style="line-height:1.6">{{ c.description }}</div>
                      <v-row dense class="mb-0">
                        <v-col cols="6" md="3">
                          <div class="label-micro text-medium-emphasis">Montant en cause</div>
                          <div class="font-weight-bold text-error text-body-2">{{ c.montant }}</div>
                        </v-col>
                        <v-col cols="6" md="3">
                          <div class="label-micro text-medium-emphasis">Période</div>
                          <div class="text-body-2">{{ c.periode }}</div>
                        </v-col>
                        <v-col cols="12" md="6">
                          <div class="label-micro text-medium-emphasis">Base légale violée</div>
                          <div class="text-body-2">{{ c.baseLegale || '—' }}</div>
                        </v-col>
                      </v-row>
                      <div v-if="c.observations" class="mt-2 pa-2 rounded" style="background:rgba(0,0,0,0.03)">
                        <span class="text-caption text-medium-emphasis">Obs. : </span>
                        <span class="text-caption">{{ c.observations }}</span>
                      </div>
                    </v-card-text>
                  </v-card>
                </div>
              </v-card>
            </v-col>

            <v-col cols="12" md="4">
              <!-- Synthèse constats -->
              <v-card rounded="lg" elevation="1" class="mb-4">
                <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">Synthèse des irrégularités</v-card-title>
                <v-card-text class="pa-4">
                  <div v-for="g in graviteSynthese" :key="g.label" class="mb-3">
                    <div class="d-flex justify-space-between text-caption mb-1">
                      <div class="d-flex align-center ga-1">
                        <v-icon :icon="g.icon" :color="g.color" size="14"/>
                        <span class="font-weight-medium">{{ g.label }}</span>
                      </div>
                      <span class="font-weight-bold" :class="`text-${g.color}`">{{ g.count }}</span>
                    </div>
                    <v-progress-linear
                      :model-value="missionConstats.length ? (g.count/missionConstats.length)*100 : 0"
                      :color="g.color"
                      rounded height="6"
                    />
                  </div>
                  <v-divider class="my-3"/>
                  <div class="d-flex justify-space-between text-body-2">
                    <span class="text-medium-emphasis">Montant total en cause</span>
                    <span class="font-weight-bold text-error">{{ totalMontant }}</span>
                  </div>
                </v-card-text>
              </v-card>

              <!-- Guide de saisie -->
              <v-card rounded="lg" elevation="1" color="info" variant="tonal">
                <v-card-text class="pa-4">
                  <div class="d-flex align-center ga-2 mb-2">
                    <v-icon icon="mdi-information" color="info" size="16"/>
                    <span class="text-caption font-weight-semibold">Guide de saisie</span>
                  </div>
                  <div class="text-caption" style="line-height:1.7">
                    <strong>Étapes pour un constat :</strong><br>
                    1. Sélectionnez le dossier concerné<br>
                    2. Choisissez le type d'irrégularité<br>
                    3. Renseignez le montant en cause<br>
                    4. Évaluez la gravité (PEFA/UEMOA)<br>
                    5. Décrivez les observations<br>
                    6. Ajoutez la recommandation associée
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- ── TAB 3 : Recommandations ── -->
        <v-window-item value="recommandations">
          <v-row>
            <v-col cols="12" md="8">
              <v-card rounded="lg" elevation="1" class="mb-4">
                <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
                  Recommandations ({{ recommandations.length }})
                  <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="recoDialog=true">
                    Ajouter
                  </v-btn>
                </v-card-title>

                <div v-if="recommandations.length===0" class="pa-8 text-center text-medium-emphasis">
                  <v-icon icon="mdi-lightbulb-outline" size="48" class="mb-3 opacity-30"/>
                  <div class="text-body-2">Aucune recommandation pour l'instant.</div>
                </div>

                <v-list v-else class="pa-3" lines="two">
                  <v-list-item
                    v-for="(r, i) in recommandations"
                    :key="r.id"
                    rounded="lg"
                    class="mb-2 border"
                  >
                    <template #prepend>
                      <v-avatar color="primary" size="28" class="me-3">
                        <span style="font-size:0.7rem;font-weight:700;color:white">R{{ i+1 }}</span>
                      </v-avatar>
                    </template>
                    <template #title>
                      <span class="text-body-2 font-weight-semibold">{{ r.texte }}</span>
                    </template>
                    <template #subtitle>
                      <div class="d-flex align-center ga-2 mt-1">
                        <v-chip color="primary" size="x-small" variant="outlined">{{ r.responsable }}</v-chip>
                        <v-chip :color="r.priorite==='haute'?'error':r.priorite==='moyenne'?'warning':'info'" size="x-small" variant="tonal">{{ r.priorite }}</v-chip>
                        <span class="text-caption text-medium-emphasis">Échéance : {{ r.echeance }}</span>
                      </div>
                    </template>
                    <template #append>
                      <div class="d-flex flex-column align-center ga-1">
                        <v-chip
                          :color="r.suivi==='mise_oeuvre'?'success':r.suivi==='en_cours'?'warning':'error'"
                          size="x-small" variant="tonal"
                        >{{ suiviLabel(r.suivi) }}</v-chip>
                        <div class="d-flex ga-1">
                          <v-btn icon="mdi-pencil" size="x-small" variant="text" color="primary" @click="editReco(r)"/>
                          <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="removeReco(r.id)"/>
                        </div>
                      </div>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>

            <v-col cols="12" md="4">
              <v-card rounded="lg" elevation="1" class="mb-4">
                <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">Suivi des recommandations</v-card-title>
                <v-card-text class="pa-4">
                  <div v-for="s in suiviSynthese" :key="s.label" class="mb-3">
                    <div class="d-flex justify-space-between text-caption mb-1">
                      <span>{{ s.label }}</span>
                      <span class="font-weight-bold" :class="`text-${s.color}`">{{ s.count }}</span>
                    </div>
                    <v-progress-linear
                      :model-value="recommandations.length ? (s.count/recommandations.length)*100 : 0"
                      :color="s.color" rounded height="6"
                    />
                  </div>
                </v-card-text>
              </v-card>

              <v-card rounded="lg" elevation="1">
                <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">Institutions responsables</v-card-title>
                <v-list density="compact" class="pa-2">
                  <v-list-item
                    v-for="inst in institutionsSynthese"
                    :key="inst.nom"
                    :subtitle="`${inst.count} recommandation(s)`"
                    prepend-icon="mdi-domain"
                    rounded="lg"
                    class="mb-1"
                  >
                    <template #title><span class="text-caption font-weight-semibold">{{ inst.nom }}</span></template>
                    <template #append><v-chip color="primary" size="x-small" variant="tonal">{{ inst.count }}</v-chip></template>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- ── TAB 4 : Rapport & Suites données ── -->
        <v-window-item value="rapport">
          <v-row>
            <v-col cols="12" md="7">
              <!-- Conclusions -->
              <v-card rounded="lg" elevation="1" class="mb-4">
                <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Conclusions de la mission</v-card-title>
                <v-card-text class="pa-4">
                  <v-textarea
                    v-model="selectedMission.conclusions"
                    label="Synthèse narrative des constats et irrégularités relevées"
                    rows="5"
                    hint="Cette section sera intégrée telle quelle dans le rapport officiel"
                    persistent-hint
                    class="mb-3"
                  />
                  <v-select
                    v-model="selectedMission.appreciation"
                    :items="appreciations"
                    item-title="label"
                    item-value="value"
                    label="Appréciation globale"
                    class="mb-3"
                  >
                    <template #item="{ item, props }">
                      <v-list-item v-bind="props">
                        <template #prepend>
                          <v-icon :icon="item.raw.icon" :color="item.raw.color" size="16" class="me-2"/>
                        </template>
                      </v-list-item>
                    </template>
                  </v-select>

                  <v-row dense>
                    <v-col cols="6">
                      <v-text-field v-model="selectedMission.dateRapport" label="Date du rapport" type="date"/>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field v-model="selectedMission.signataire" label="Signataire" prepend-inner-icon="mdi-account"/>
                    </v-col>
                  </v-row>

                  <div class="d-flex ga-2 mt-2">
                    <v-btn color="primary" variant="tonal" prepend-icon="mdi-file-pdf-box" :loading="generating" @click="generateReport">
                      Générer rapport PDF
                    </v-btn>
                    <v-btn color="secondary" variant="tonal" prepend-icon="mdi-file-word">Export DOCX</v-btn>
                  </div>
                  <v-alert v-if="reportGenerated" type="success" variant="tonal" rounded="lg" class="mt-3">
                    Rapport généré : <strong>CTRL-{{ selectedMission.ref }}-Rapport.pdf</strong>
                  </v-alert>
                </v-card-text>
              </v-card>

              <!-- Suites données -->
              <v-card rounded="lg" elevation="1">
                <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
                  Suites données
                  <v-btn size="x-small" variant="tonal" color="primary" prepend-icon="mdi-plus" @click="suiteDialog=true">
                    Ajouter
                  </v-btn>
                </v-card-title>
                <v-list class="pa-3" lines="two">
                  <v-list-item
                    v-for="s in suitesDonnees"
                    :key="s.id"
                    rounded="lg"
                    class="mb-2 border"
                  >
                    <template #prepend>
                      <v-avatar :color="s.color" size="36" rounded="lg">
                        <v-icon :icon="s.icon" color="white" size="18"/>
                      </v-avatar>
                    </template>
                    <template #title>
                      <span class="text-body-2 font-weight-semibold">{{ s.type }}</span>
                    </template>
                    <template #subtitle>
                      <div class="text-caption text-medium-emphasis">{{ s.beneficiaire }} · {{ s.detail }}</div>
                    </template>
                    <template #append>
                      <v-chip :color="s.statut==='execute'?'success':'warning'" size="x-small" variant="tonal">
                        {{ s.statut==='execute'?'Exécuté':'En attente' }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>

            <v-col cols="12" md="5">
              <!-- Alertes règles -->
              <v-card rounded="lg" elevation="1" color="error" variant="tonal" class="mb-4">
                <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold text-error">
                  Alertes moteur de règles ({{ alertesRegles.length }})
                </v-card-title>
                <v-list density="compact" class="pa-2 bg-transparent">
                  <v-list-item
                    v-for="a in alertesRegles"
                    :key="a.id"
                    :prepend-icon="a.icon"
                    rounded="lg"
                    class="mb-1"
                  >
                    <template #title>
                      <span class="text-caption text-error font-weight-medium">{{ a.label }}</span>
                    </template>
                    <template #subtitle>
                      <span class="text-caption">{{ a.details }}</span>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card>

              <!-- Récap chiffres clés -->
              <v-card rounded="lg" elevation="1">
                <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">Récapitulatif chiffré</v-card-title>
                <v-list density="compact" class="pa-3">
                  <v-list-item prepend-icon="mdi-clipboard-list" :title="`${missionConstats.length} constat(s) relevé(s)`" density="compact"/>
                  <v-list-item prepend-icon="mdi-currency-usd" :title="`${totalMontant} en cause`" density="compact" base-color="error"/>
                  <v-list-item prepend-icon="mdi-lightbulb" :title="`${recommandations.length} recommandation(s)`" density="compact"/>
                  <v-list-item prepend-icon="mdi-gavel" :title="`${suitesDonnees.filter(s=>s.statut==='execute').length} suite(s) exécutée(s)`" density="compact" base-color="success"/>
                </v-list>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>
      </v-window>
    </div>

    <!-- ════════════════════════════════════════════════════════════════
         LIST VIEW — Vue principale
    ════════════════════════════════════════════════════════════════════ -->
    <div v-else>
      <PageHeader title="Contrôle a posteriori" subtitle="Planification, saisie des constats et suivi des missions de contrôle" icon="mdi-clipboard-search">
        <template #actions>
          <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="newMissionDialog=true">
            Nouvelle mission
          </v-btn>
        </template>
      </PageHeader>

      <!-- KPIs -->
      <v-row class="mb-4">
        <v-col v-for="k in kpis" :key="k.label" cols="6" md="3">
          <KpiCard v-bind="k"/>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="8">
          <v-card rounded="lg" elevation="1" class="mb-4">
            <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
              Missions de contrôle
              <v-btn-toggle v-model="missionFilter" density="compact" variant="outlined" rounded="pill" mandatory>
                <v-btn value="all" size="x-small">Toutes</v-btn>
                <v-btn value="en_cours" size="x-small">En cours</v-btn>
                <v-btn value="planifiee" size="x-small">Planifiées</v-btn>
                <v-btn value="cloturee" size="x-small">Clôturées</v-btn>
              </v-btn-toggle>
            </v-card-title>
            <v-data-table
              :headers="missionHeaders"
              :items="filteredMissions"
              hover
              density="comfortable"
              @click:row="(_, {item}) => openMission(item)"
            >
              <template #item.statut="{ item }">
                <v-chip
                  :color="item.statut==='en_cours'?'info':item.statut==='planifiee'?'warning':'success'"
                  size="x-small" variant="tonal"
                >{{ item.statutLabel }}</v-chip>
              </template>
              <template #item.constats="{ item }">
                <v-chip
                  v-if="item.constats>0"
                  :color="item.constats>2?'error':'warning'"
                  size="x-small" variant="tonal"
                >{{ item.constats }}</v-chip>
                <span v-else class="text-caption text-medium-emphasis">—</span>
              </template>
              <template #item.actions>
                <v-btn size="x-small" variant="tonal" color="primary" append-icon="mdi-chevron-right">
                  Ouvrir
                </v-btn>
              </template>
            </v-data-table>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <!-- Alertes -->
          <v-card rounded="lg" elevation="1" color="error" variant="tonal" class="mb-4">
            <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold text-error">
              Alertes moteur ({{ alertesRegles.length }})
            </v-card-title>
            <v-list density="compact" class="pa-2 bg-transparent">
              <v-list-item
                v-for="a in alertesRegles"
                :key="a.id"
                :prepend-icon="a.icon"
                rounded="lg" class="mb-1"
              >
                <template #title><span class="text-caption text-error font-weight-medium">{{ a.label }}</span></template>
                <template #subtitle><span class="text-caption">{{ a.details }}</span></template>
              </v-list-item>
            </v-list>
          </v-card>

          <v-card rounded="lg" elevation="1">
            <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Suites données récentes</v-card-title>
            <v-list density="compact" class="pa-2">
              <v-list-item v-for="s in suitesDonnees" :key="s.id" rounded="lg" class="mb-1">
                <template #prepend>
                  <v-avatar :color="s.color" size="28" rounded="lg">
                    <v-icon :icon="s.icon" color="white" size="14"/>
                  </v-avatar>
                </template>
                <template #title><span class="text-caption font-weight-semibold">{{ s.type }}</span></template>
                <template #subtitle><span class="text-caption text-medium-emphasis">{{ s.beneficiaire }}</span></template>
                <template #append>
                  <v-chip :color="s.statut==='execute'?'success':'warning'" size="x-small" variant="tonal">
                    {{ s.statut==='execute'?'Exécuté':'En attente' }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- ══════ DIALOGS ══════ -->

    <!-- Nouveau constat -->
    <v-dialog v-model="constatDialog" max-width="680" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-5 d-flex align-center ga-2">
          <v-icon icon="mdi-clipboard-plus" color="primary"/>
          {{ editingConstat ? 'Modifier le constat' : 'Nouveau constat de contrôle' }}
        </v-card-title>
        <v-card-text class="pa-5">
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="constatForm.dossierRef"
                :items="selectedMission?.dossiers.map(d=>d.ref) || []"
                label="Dossier concerné *"
                prepend-inner-icon="mdi-folder"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="constatForm.typeIrregularite"
                :items="typesIrregularite"
                label="Type d'irrégularité *"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="constatForm.gravite"
                :items="[{title:'Critique',value:'critique'},{title:'Élevée',value:'elevee'},{title:'Moyenne',value:'moyenne'},{title:'Faible',value:'faible'}]"
                item-title="title"
                item-value="value"
                label="Gravité *"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="constatForm.montant" label="Montant en cause (FCFA)" prepend-inner-icon="mdi-currency-usd" hint="Ex: 45 000 000" persistent-hint/>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="constatForm.periode" label="Période concernée" placeholder="Ex: Jan 2025 – Déc 2025"/>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="constatForm.baseLegale" label="Base légale violée" placeholder="Ex: CGI Art. 215, LFI 2025 Art. 45"/>
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="constatForm.description"
                label="Description détaillée de l'irrégularité *"
                rows="4"
                hint="Décrire précisément les faits observés, les pièces consultées, les écarts constatés"
                persistent-hint
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="constatForm.observations"
                label="Observations complémentaires"
                rows="2"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="constatDialog=false;editingConstat=null">Annuler</v-btn>
          <v-btn color="primary" @click="saveConstat">{{ editingConstat ? 'Mettre à jour' : 'Enregistrer le constat' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Nouvelle recommandation -->
    <v-dialog v-model="recoDialog" max-width="600">
      <v-card rounded="xl">
        <v-card-title class="pa-5 d-flex align-center ga-2">
          <v-icon icon="mdi-lightbulb" color="warning"/>
          {{ editingReco ? 'Modifier' : 'Ajouter une recommandation' }}
        </v-card-title>
        <v-card-text class="pa-5">
          <v-textarea v-model="recoForm.texte" label="Recommandation *" rows="3" class="mb-3"/>
          <v-row>
            <v-col cols="6">
              <v-select v-model="recoForm.responsable" :items="['OTR Douanes','OTR Impôts','DGBF','DGTCP','API-ZF','UPF','MEF']" label="Institution responsable"/>
            </v-col>
            <v-col cols="6">
              <v-select v-model="recoForm.priorite" :items="['haute','moyenne','faible']" label="Priorité"/>
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="recoForm.echeance" label="Échéance" type="date"/>
            </v-col>
            <v-col cols="6">
              <v-select v-model="recoForm.suivi" :items="[{title:'Non mise en œuvre',value:'non'},{title:'En cours',value:'en_cours'},{title:'Mise en œuvre',value:'mise_oeuvre'}]" item-title="title" item-value="value" label="Suivi"/>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="recoDialog=false;editingReco=null">Annuler</v-btn>
          <v-btn color="warning" @click="saveReco">{{ editingReco ? 'Mettre à jour' : 'Ajouter' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Suite donnée -->
    <v-dialog v-model="suiteDialog" max-width="560">
      <v-card rounded="xl">
        <v-card-title class="pa-5">Ajouter une suite donnée</v-card-title>
        <v-card-text class="pa-5">
          <v-select
            v-model="suiteForm.type"
            :items="typesSuites"
            label="Type de suite *"
            class="mb-3"
          />
          <v-text-field v-model="suiteForm.beneficiaire" label="Bénéficiaire concerné" class="mb-3"/>
          <v-text-field v-model="suiteForm.detail" label="Détail / Montant / Durée" class="mb-3"/>
          <v-select v-model="suiteForm.statut" :items="[{title:'En attente',value:'en_attente'},{title:'Exécuté',value:'execute'}]" item-title="title" item-value="value" label="Statut"/>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="suiteDialog=false">Annuler</v-btn>
          <v-btn color="primary" @click="saveSuite">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Nouvelle mission -->
    <v-dialog v-model="newMissionDialog" max-width="620">
      <v-card rounded="xl">
        <v-card-title class="pa-5">Créer une mission de contrôle</v-card-title>
        <v-card-text class="pa-5">
          <v-row>
            <v-col cols="12"><v-text-field v-model="newMissionForm.beneficiaire" label="Bénéficiaire cible" prepend-inner-icon="mdi-domain"/></v-col>
            <v-col cols="12"><v-select v-model="newMissionForm.typeMission" :items="['Sur pièces','Sur place','Mixte']" label="Type de contrôle"/></v-col>
            <v-col cols="6"><v-text-field v-model="newMissionForm.dateDebut" label="Date début" type="date"/></v-col>
            <v-col cols="6"><v-text-field v-model="newMissionForm.dateFin" label="Date fin" type="date"/></v-col>
            <v-col cols="12"><v-textarea v-model="newMissionForm.objectifs" label="Objectifs de la mission" rows="2"/></v-col>
            <v-col cols="12"><v-select v-model="newMissionForm.agents" :items="agentsDisponibles" multiple chips label="Agents affectés"/></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="newMissionDialog=false">Annuler</v-btn>
          <v-btn color="primary" @click="createMission">Créer la mission</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add dossier -->
    <v-dialog v-model="addDossierDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-5">Ajouter un dossier examiné</v-card-title>
        <v-card-text class="pa-5">
          <v-select :items="['OASE-2026-0042','OASE-2026-0039','OASE-2026-0035','OASE-2025-0082','OASE-2024-0156']" label="Référence dossier" class="mb-3"/>
          <v-select :items="['Douanière','TVA','IS','Zone Franche']" label="Type d'exonération"/>
        </v-card-text>
        <v-card-actions class="pa-4"><v-spacer/><v-btn variant="text" @click="addDossierDialog=false">Annuler</v-btn><v-btn color="primary" @click="addDossierDialog=false">Ajouter</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'

// ── Types ──
interface Dossier { ref: string; type: string; montant: string; anomalie: boolean }
interface Document { nom: string; date: string }
interface Mission {
  ref: string
  beneficiaire: string
  periode: string
  dateDebut: string
  dateFin: string
  statut: string
  statutLabel: string
  agents: string[]
  objectifs: string
  typeMission: string
  constats: number
  dossiers: Dossier[]
  documents: Document[]
  conclusions: string
  appreciation: string
  dateRapport: string
  signataire: string
}
interface Constat { id: string; dossierRef: string; typeIrregularite: string; gravite: string; montant: string; periode: string; baseLegale: string; description: string; observations: string }
interface Recommandation { id: string; texte: string; responsable: string; priorite: string; echeance: string; suivi: string }
interface Suite { id: string; type: string; beneficiaire: string; detail: string; statut: string; icon: string; color: string }

// ── State ──
const selectedMission = ref<Mission | null>(null)
const detailTab = ref('info')
const missionFilter = ref('all')
const newMissionDialog = ref(false)
const constatDialog = ref(false)
const recoDialog = ref(false)
const suiteDialog = ref(false)
const addDossierDialog = ref(false)
const missionSaved = ref(false)
const generating = ref(false)
const reportGenerated = ref(false)
const editingConstat = ref<Constat | null>(null)
const editingReco = ref<Recommandation | null>(null)

// ── Data ──
const agentsDisponibles = ['K. ABALO', 'A. MENSAH', 'M. KOFFI', 'P. TCHALLA', 'Y. DOSSOU']
const statutOptions = [
  { label: 'Planifiée', value: 'planifiee' },
  { label: 'En cours', value: 'en_cours' },
  { label: 'Clôturée', value: 'cloturee' },
]
const typesIrregularite = [
  'Dépassement de quota', 'Durée d\'exonération dépassée', 'Base juridique invalide',
  'Doublon SYDONIA/SIGTAS', 'Dettes fiscales actives', 'Absence de pièces justificatives',
  'Non-respect des engagements', 'Usage détourné de l\'exonération', 'Erreur de calcul du montant',
]
const typesSuites = [
  'Recouvrement amiable', 'Recouvrement forcé', 'Suspension temporaire',
  'Résiliation de convention', 'Main-levée accordée', 'Transmission au parquet',
  'Redressement fiscal', 'Avertissement officiel',
]
const appreciations = [
  { label: '✅ Situation régulière', value: 'reguliere', icon: 'mdi-check-circle', color: 'success' },
  { label: '⚠ Irrégularités mineures', value: 'mineures', icon: 'mdi-alert', color: 'warning' },
  { label: '❌ Irrégularités graves', value: 'graves', icon: 'mdi-close-circle', color: 'error' },
  { label: '🔴 Fraude avérée', value: 'fraude', icon: 'mdi-shield-alert', color: 'error' },
]

const missions = ref<Mission[]>([
  {
    ref: 'CTRL-2026-001', beneficiaire: 'TOGO STEEL SARL', periode: 'Jan–Mar 2026',
    dateDebut: '2026-01-01', dateFin: '2026-03-31', statut: 'en_cours', statutLabel: 'En cours',
    agents: ['K. ABALO', 'A. MENSAH'], objectifs: 'Vérifier l\'utilisation de l\'exonération douanière accordée en 2024 et 2025.',
    typeMission: 'Mixte', constats: 2,
    dossiers: [
      { ref: 'OASE-2024-0200', type: 'Douanière', montant: '310M FCFA', anomalie: true },
      { ref: 'OASE-2025-0082', type: 'Douanière', montant: '89M FCFA', anomalie: true },
    ],
    documents: [
      { nom: 'Lettre de mission CTRL-2026-001.pdf', date: '02/01/2026' },
      { nom: 'Rapport préliminaire.pdf', date: '15/02/2026' },
    ],
    conclusions: '',
    appreciation: '',
    dateRapport: '2026-03-31',
    signataire: 'K. ABALO',
  },
  {
    ref: 'CTRL-2026-002', beneficiaire: 'LOMÉ TEXTILE ZF SAS', periode: 'Avr 2026',
    dateDebut: '2026-04-01', dateFin: '2026-04-30', statut: 'planifiee', statutLabel: 'Planifiée',
    agents: ['M. KOFFI'], objectifs: 'Contrôle des engagements ZFI (emploi, investissement).',
    typeMission: 'Sur place', constats: 0,
    dossiers: [{ ref: 'OASE-2026-0035', type: 'Zone Franche', montant: '89M FCFA', anomalie: false }],
    documents: [{ nom: 'Ordre de mission.pdf', date: '28/03/2026' }],
    conclusions: '', appreciation: '', dateRapport: '', signataire: '',
  },
  {
    ref: 'CTRL-2025-018', beneficiaire: 'AGRO-TOGO INVEST SA', periode: 'Oct–Déc 2025',
    dateDebut: '2025-10-01', dateFin: '2025-12-31', statut: 'cloturee', statutLabel: 'Clôturée',
    agents: ['A. MENSAH', 'P. TCHALLA'],
    objectifs: 'Contrôle d\'ensemble de l\'exonération TVA accordée sous LFI 2024.',
    typeMission: 'Sur pièces', constats: 1,
    dossiers: [{ ref: 'OASE-2024-0156', type: 'TVA', montant: '12,2M FCFA', anomalie: true }],
    documents: [
      { nom: 'Rapport final CTRL-2025-018.pdf', date: '15/01/2026' },
      { nom: 'Procès-verbal de contrôle.pdf', date: '10/01/2026' },
    ],
    conclusions: 'La mission a relevé un dépassement de la durée légale d\'exonération de 117 jours sur le dossier OASE-2024-0156.',
    appreciation: 'mineures', dateRapport: '2026-01-15', signataire: 'A. MENSAH',
  },
])

const constats = ref<Constat[]>([
  {
    id: 'c1', dossierRef: 'OASE-2025-0082', typeIrregularite: 'Dépassement de quota',
    gravite: 'critique', montant: '89 400 000 FCFA', periode: 'Jan 2025 – Déc 2025',
    baseLegale: 'CGI Art. 215 — Quota annuel exonération douanière',
    description: 'Le montant d\'exonération douanière consommé dépasse de 340% le quota autorisé. Le bénéficiaire a utilisé 89,4M FCFA contre une autorisation de 26,2M FCFA.',
    observations: 'Documents douaniers SYDONIA confirment les montants.',
  },
  {
    id: 'c2', dossierRef: 'OASE-2024-0156', typeIrregularite: 'Durée d\'exonération dépassée',
    gravite: 'elevee', montant: '12 200 000 FCFA', periode: '2024–2026',
    baseLegale: 'LFI 2024 Art. 45 — Durée maximale 24 mois',
    description: 'L\'exonération TVA a été appliquée pendant 847 jours au lieu des 730 jours autorisés, soit un dépassement de 117 jours.',
    observations: 'Calcul basé sur les déclarations SIGTAS.',
  },
])

const recommandations = ref<Recommandation[]>([
  { id: 'r1', texte: 'Émettre un avis de redressement pour le montant de 63,2M FCFA (excédent de quota)', responsable: 'OTR Douanes', priorite: 'haute', echeance: '2026-06-30', suivi: 'en_cours' },
  { id: 'r2', texte: 'Régulariser la durée de l\'exonération et procéder au recouvrement des 12,2M FCFA', responsable: 'OTR Impôts', priorite: 'haute', echeance: '2026-05-15', suivi: 'non' },
  { id: 'r3', texte: 'Mettre en place un contrôle automatique des quotas dans le module SYDONIA', responsable: 'OTR Douanes', priorite: 'moyenne', echeance: '2026-09-30', suivi: 'non' },
])

const suitesDonnees = ref<Suite[]>([
  { id: 's1', type: 'Recouvrement amiable', beneficiaire: 'LOMÉ LOGISTICS SA', detail: '15,2M FCFA · Délai 60j', statut: 'en_attente', icon: 'mdi-bank-transfer', color: 'warning' },
  { id: 's2', type: 'Suspension temporaire', beneficiaire: 'TOGO PHARMA ZF', detail: 'Convention ZFI-2020-005 — 6 mois', statut: 'execute', icon: 'mdi-pause-circle', color: 'error' },
  { id: 's3', type: 'Main-levée accordée', beneficiaire: 'AGRO-TOGO INVEST SA', detail: 'Suite régularisation SIGTAS', statut: 'execute', icon: 'mdi-check-circle', color: 'success' },
])

const alertesRegles = [
  { id: 1, icon: 'mdi-timer-alert', label: 'Exonérations durée dépassée', details: '3 dossiers concernés' },
  { id: 2, icon: 'mdi-bank-off', label: 'Bénéficiaires avec dettes fiscales', details: '2 signalements SIGTAS' },
  { id: 3, icon: 'mdi-chart-bar', label: 'Écarts quota > 200%', details: '1 dossier douanier' },
  { id: 4, icon: 'mdi-content-copy', label: 'Doublons SYDONIA/SIGTAS', details: '1 doublon détecté' },
]

// ── Form state ──
const constatForm = ref<Constat>({ id: '', dossierRef: '', typeIrregularite: '', gravite: 'elevee', montant: '', periode: '', baseLegale: '', description: '', observations: '' })
const recoForm = ref<Recommandation>({ id: '', texte: '', responsable: 'OTR Douanes', priorite: 'haute', echeance: '', suivi: 'non' })
const suiteForm = ref<Suite>({ id: '', type: '', beneficiaire: '', detail: '', statut: 'en_attente', icon: '', color: '' })
const newMissionForm = ref({ beneficiaire: '', typeMission: 'Mixte', dateDebut: '', dateFin: '', objectifs: '', agents: [] as string[] })

// ── Computed ──
const filteredMissions = computed(() =>
  missionFilter.value === 'all' ? missions.value : missions.value.filter(m => m.statut === missionFilter.value)
)

const missionConstats = computed(() =>
  selectedMission.value ? constats.value.filter(c => selectedMission.value!.dossiers.some(d => d.ref === c.dossierRef)) : constats.value
)

const totalMontant = computed(() => {
  const sum = missionConstats.value.reduce((acc, c) => {
    const val = parseFloat(c.montant.replace(/\s/g, '').replace('FCFA', '').replace(',', '.'))
    return acc + (isNaN(val) ? 0 : val)
  }, 0)
  return sum > 0 ? `${(sum / 1e6).toFixed(1)}M FCFA` : '0 FCFA'
})

const graviteSynthese = computed(() => [
  { label: 'Critique', color: 'error', icon: 'mdi-alert-octagon', count: missionConstats.value.filter(c => c.gravite === 'critique').length },
  { label: 'Élevée', color: 'warning', icon: 'mdi-alert', count: missionConstats.value.filter(c => c.gravite === 'elevee').length },
  { label: 'Moyenne', color: 'info', icon: 'mdi-information', count: missionConstats.value.filter(c => c.gravite === 'moyenne').length },
  { label: 'Faible', color: 'success', icon: 'mdi-check', count: missionConstats.value.filter(c => c.gravite === 'faible').length },
])

const suiviSynthese = computed(() => [
  { label: 'Mise en œuvre', color: 'success', count: recommandations.value.filter(r => r.suivi === 'mise_oeuvre').length },
  { label: 'En cours', color: 'warning', count: recommandations.value.filter(r => r.suivi === 'en_cours').length },
  { label: 'Non mise en œuvre', color: 'error', count: recommandations.value.filter(r => r.suivi === 'non').length },
])

const institutionsSynthese = computed(() => {
  const counts: Record<string, number> = {}
  recommandations.value.forEach(r => { counts[r.responsable] = (counts[r.responsable] || 0) + 1 })
  return Object.entries(counts).map(([nom, count]) => ({ nom, count }))
})

const kpis = computed(() => [
  { label: 'Missions en cours', value: missions.value.filter(m => m.statut === 'en_cours').length, icon: 'mdi-clipboard-search', color: 'info' },
  { label: 'Constats relevés', value: constats.value.length, icon: 'mdi-clipboard-alert', color: 'warning' },
  { label: 'Constats critiques', value: constats.value.filter(c => c.gravite === 'critique').length, icon: 'mdi-alert-octagon', color: 'error' },
  { label: 'Recommandations', value: recommandations.value.length, icon: 'mdi-lightbulb', color: 'success' },
])

// ── Methods ──
const missionHeaders = [
  { title: 'Référence', key: 'ref' }, { title: 'Bénéficiaire', key: 'beneficiaire' },
  { title: 'Période', key: 'periode' }, { title: 'Type', key: 'typeMission' },
  { title: 'Constats', key: 'constats' }, { title: 'Statut', key: 'statut' },
  { title: 'Actions', key: 'actions', sortable: false },
]

function openMission(m: Mission) {
  selectedMission.value = m
  detailTab.value = 'info'
}

function saveConstat() {
  if (editingConstat.value) {
    const idx = constats.value.findIndex(c => c.id === editingConstat.value!.id)
    if (idx !== -1) constats.value[idx] = { ...constatForm.value }
  } else {
    constats.value.push({ ...constatForm.value, id: Date.now().toString() })
    if (selectedMission.value) selectedMission.value.constats++
  }
  constatDialog.value = false
  editingConstat.value = null
  constatForm.value = { id: '', dossierRef: '', typeIrregularite: '', gravite: 'elevee', montant: '', periode: '', baseLegale: '', description: '', observations: '' }
}

function editConstat(c: Constat) {
  editingConstat.value = c
  constatForm.value = { ...c }
  constatDialog.value = true
}

function removeConstat(id: string) {
  constats.value = constats.value.filter(c => c.id !== id)
  if (selectedMission.value && selectedMission.value.constats > 0) selectedMission.value.constats--
}

function saveReco() {
  if (editingReco.value) {
    const idx = recommandations.value.findIndex(r => r.id === editingReco.value!.id)
    if (idx !== -1) recommandations.value[idx] = { ...recoForm.value }
  } else {
    recommandations.value.push({ ...recoForm.value, id: Date.now().toString() })
  }
  recoDialog.value = false
  editingReco.value = null
  recoForm.value = { id: '', texte: '', responsable: 'OTR Douanes', priorite: 'haute', echeance: '', suivi: 'non' }
}

function editReco(r: Recommandation) {
  editingReco.value = r
  recoForm.value = { ...r }
  recoDialog.value = true
}

function removeReco(id: string) { recommandations.value = recommandations.value.filter(r => r.id !== id) }

function saveSuite() {
  const typeIconMap: Record<string, { icon: string; color: string }> = {
    'Recouvrement amiable': { icon: 'mdi-bank-transfer', color: 'warning' },
    'Recouvrement forcé': { icon: 'mdi-bank-alert', color: 'error' },
    'Suspension temporaire': { icon: 'mdi-pause-circle', color: 'error' },
    'Résiliation de convention': { icon: 'mdi-close-circle', color: 'error' },
    'Main-levée accordée': { icon: 'mdi-check-circle', color: 'success' },
    'Transmission au parquet': { icon: 'mdi-gavel', color: 'error' },
    'Redressement fiscal': { icon: 'mdi-calculator', color: 'warning' },
    'Avertissement officiel': { icon: 'mdi-bell-alert', color: 'warning' },
  }
  const meta = typeIconMap[suiteForm.value.type] || { icon: 'mdi-cog', color: 'secondary' }
  suitesDonnees.value.push({ ...suiteForm.value, id: Date.now().toString(), ...meta })
  suiteDialog.value = false
  suiteForm.value = { id: '', type: '', beneficiaire: '', detail: '', statut: 'en_attente', icon: '', color: '' }
}

function createMission() {
  const ref = `CTRL-2026-00${missions.value.length + 3}`
  missions.value.push({
    ref,
    beneficiaire: newMissionForm.value.beneficiaire,
    periode: `${newMissionForm.value.dateDebut} → ${newMissionForm.value.dateFin}`,
    dateDebut: newMissionForm.value.dateDebut,
    dateFin: newMissionForm.value.dateFin,
    statut: 'planifiee', statutLabel: 'Planifiée',
    agents: newMissionForm.value.agents,
    objectifs: newMissionForm.value.objectifs,
    typeMission: newMissionForm.value.typeMission,
    constats: 0,
    dossiers: [], documents: [], conclusions: '', appreciation: '', dateRapport: '', signataire: '',
  })
  newMissionDialog.value = false
  newMissionForm.value = { beneficiaire: '', typeMission: 'Mixte', dateDebut: '', dateFin: '', objectifs: '', agents: [] }
}

function generateReport() {
  generating.value = true
  setTimeout(() => { generating.value = false; reportGenerated.value = true }, 1200)
}

function suiviLabel(s: string) {
  return { mise_oeuvre: 'Mise en œuvre', en_cours: 'En cours', non: 'Non m.e.o.' }[s] || s
}
</script>
