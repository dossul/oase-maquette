<template>
  <div>
    <PageHeader title="Nouvelle demande d'exonération" subtitle="Constituez votre dossier étape par étape" icon="mdi-plus-circle">
      <template #actions>
        <v-btn variant="tonal" color="secondary" size="small" prepend-icon="mdi-content-save">Brouillon</v-btn>
      </template>
    </PageHeader>
    <div class="d-flex align-center ga-1 mb-4 text-caption text-medium-emphasis">
      <v-icon icon="mdi-cloud-check" size="14" color="success" />
      Sauvegarde automatique à 10:42
    </div>

    <!-- Regime info banner -->
    <v-alert v-if="regimeConfig" :type="regimeConfig.alertType" variant="tonal" rounded="lg" density="compact" class="mb-4" :prepend-icon="regimeConfig.icon">
      <strong>Processus {{ regimeConfig.processus }} — {{ regimeConfig.label }}</strong>
    </v-alert>

    <!-- ═══ Parcours simplifié franchise douanière (2 écrans) ═══ -->
    <template v-if="selectedType === 'douaniere' && cddiScreen > 0">

      <!-- ── Écran 1 : Lancement SYDONIAWORLD ── -->
      <template v-if="cddiScreen === 1">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-text class="pa-6">
            <!-- Hero -->
            <div class="text-center mb-6">
              <v-icon icon="mdi-ferry" size="64" color="info" class="mb-3" />
              <div class="text-h6 font-weight-bold mb-1">Déclaration douanière — Processus 2</div>
              <div class="text-body-2 text-medium-emphasis">
                La déclaration en détail est entièrement saisie dans <strong>SYDONIAWORLD</strong> par vous ou votre transitaire agréé.
                OASE supervise ensuite le dossier via <strong>GESTEXO</strong>.
              </div>
              <v-btn
                color="info"
                size="large"
                variant="elevated"
                prepend-icon="mdi-open-in-new"
                href="https://sydoniaworld.tg"
                target="_blank"
                class="mt-4"
              >
                Ouvrir SYDONIAWORLD
              </v-btn>
            </div>

            <v-divider class="my-5" />

            <!-- Circuit visuel -->
            <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-3">Circuit Processus 2 — vue d'ensemble</div>
            <div class="d-flex flex-wrap align-center ga-1 mb-5">
              <v-chip size="small" color="secondary" variant="tonal" prepend-icon="mdi-pencil">1 — Saisie déclaration SYDONIAWORLD</v-chip>
              <v-icon icon="mdi-chevron-right" size="16" />
              <v-chip size="small" color="secondary" variant="tonal">2 — Contrôle &amp; conformité CDDI</v-chip>
              <v-icon icon="mdi-chevron-right" size="16" />
              <v-chip size="small" color="warning" variant="tonal">3 — Validation séquentielle 2a→2d</v-chip>
              <v-icon icon="mdi-chevron-right" size="16" />
              <v-chip size="small" color="success" variant="tonal" prepend-icon="mdi-check-circle">4 — Liquidation + Quittancement GESTEXO</v-chip>
            </div>

            <!-- Rattachement OASE -->
            <div class="text-subtitle-2 font-weight-semibold mb-3">
              Après saisie dans SYDONIAWORLD, renseignez le numéro de déclaration pour suivi OASE
            </div>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="douaFields.numDeclaration"
                  label="Numéro de déclaration SYDONIAWORLD"
                  hint="Format SW-AAAA-NNNNN"
                  persistent-hint
                  prepend-inner-icon="mdi-barcode"
                  placeholder="SW-2026-00491"
                />
              </v-col>

            </v-row>

            <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mt-4">
              Délai normé du circuit : <strong>9 jours ouvrables</strong> à compter de l'entrée SYDONIAWORLD (validation 2a→2d incluse).
            </v-alert>
          </v-card-text>
        </v-card>
      </template>

      <!-- ── Écran 2 : Consultation données GESTEXO ── -->
      <template v-if="cddiScreen === 2">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-text class="pa-5">

            <!-- En-tête dossier -->
            <div class="d-flex align-center ga-3 mb-4">
              <v-icon icon="mdi-magnify-scan" color="info" size="32" />
              <div>
                <div class="text-subtitle-1 font-weight-bold">Suivi GESTEXO — {{ douaFields.numDeclaration || 'SW-2026-00491' }}</div>
                <div class="text-body-2 text-medium-emphasis">Données lues depuis GESTEXO · Lecture seule · Mis à jour à 17:42</div>
              </div>
              <v-spacer />
              <v-chip color="warning" variant="tonal" prepend-icon="mdi-clock-outline">En cours — Étape 2c</v-chip>
            </div>

            <!-- KPIs -->
            <v-row dense class="mb-4">
              <v-col cols="6" md="3">
                <v-card variant="tonal" color="info" rounded="lg" class="pa-3 text-center">
                  <div class="text-caption text-medium-emphasis">N° déclaration SW</div>
                  <div class="text-body-2 font-weight-bold">{{ douaFields.numDeclaration || 'SW-2026-00491' }}</div>
                </v-card>
              </v-col>
              <v-col cols="6" md="3">
                <v-card variant="tonal" color="secondary" rounded="lg" class="pa-3 text-center">
                  <div class="text-caption text-medium-emphasis">Référence GESTEXO</div>
                  <div class="text-body-2 font-weight-bold">GEST-2026-00491</div>
                </v-card>
              </v-col>
              <v-col cols="6" md="3">
                <v-card variant="tonal" color="primary" rounded="lg" class="pa-3 text-center">
                  <div class="text-caption text-medium-emphasis">Montant liquidé</div>
                  <div class="text-body-2 font-weight-bold">12 450 000 FCFA</div>
                </v-card>
              </v-col>
              <v-col cols="6" md="3">
                <v-card variant="tonal" color="success" rounded="lg" class="pa-3 text-center">
                  <div class="text-caption text-medium-emphasis">Quittance</div>
                  <div class="text-body-2 font-weight-bold">En attente</div>
                </v-card>
              </v-col>
            </v-row>

            <!-- Timeline circuit -->
            <div class="text-subtitle-2 font-weight-semibold mb-3">Avancement du circuit SYDONIAWORLD / GESTEXO</div>
            <v-timeline density="compact" side="end" align="start" class="mb-4">
              <v-timeline-item dot-color="success" size="small">
                <div class="d-flex align-center ga-2">
                  <v-icon icon="mdi-check-circle" color="success" size="16" />
                  <span class="text-body-2 font-weight-medium">Entrée — Saisie déclaration SYDONIAWORLD</span>
                  <v-chip size="x-small" color="success" variant="tonal">31/05/2026 09:14</v-chip>
                </div>
              </v-timeline-item>
              <v-timeline-item dot-color="success" size="small">
                <div class="d-flex align-center ga-2">
                  <v-icon icon="mdi-check-circle" color="success" size="16" />
                  <span class="text-body-2 font-weight-medium">Étape 1 — Contrôle pièces justificatives (CDDI / Agent de bureau)</span>
                  <v-chip size="x-small" color="success" variant="tonal">31/05 14:30</v-chip>
                </div>
              </v-timeline-item>
              <v-timeline-item dot-color="success" size="small">
                <div class="d-flex align-center ga-2">
                  <v-icon icon="mdi-check-circle" color="success" size="16" />
                  <span class="text-body-2 font-weight-medium">Étape 2 — Vérification conformité juridique (CDDI / Service juridique)</span>
                  <v-chip size="x-small" color="success" variant="tonal">01/06 10:05</v-chip>
                </div>
              </v-timeline-item>
              <v-timeline-item dot-color="success" size="small">
                <div class="d-flex align-center ga-2">
                  <v-icon icon="mdi-check-circle" color="success" size="16" />
                  <span class="text-body-2 font-weight-medium">2a — Validation technique Vérificateur</span>
                  <v-chip size="x-small" color="success" variant="tonal">01/06 15:22</v-chip>
                </div>
              </v-timeline-item>
              <v-timeline-item dot-color="success" size="small">
                <div class="d-flex align-center ga-2">
                  <v-icon icon="mdi-check-circle" color="success" size="16" />
                  <span class="text-body-2 font-weight-medium">2b — Validation technique Chef de subdivision</span>
                  <v-chip size="x-small" color="success" variant="tonal">02/06 09:40</v-chip>
                </div>
              </v-timeline-item>
              <v-timeline-item dot-color="warning" size="small">
                <div class="d-flex align-center ga-2">
                  <v-icon icon="mdi-clock-outline" color="warning" size="16" />
                  <span class="text-body-2 font-weight-medium font-weight-bold" style="color:rgb(var(--v-theme-warning))">2c — Validation Chef de bureau douanier</span>
                  <v-chip size="x-small" color="warning" variant="tonal">En cours depuis 02/06 11:00</v-chip>
                </div>
              </v-timeline-item>
              <v-timeline-item dot-color="grey" size="small">
                <span class="text-body-2 text-medium-emphasis">2d — Validation finale Directeur CDDI + Génération référence GESTEXO</span>
              </v-timeline-item>
              <v-timeline-item dot-color="grey" size="small">
                <span class="text-body-2 text-medium-emphasis">Liquidation des droits et taxes</span>
              </v-timeline-item>
              <v-timeline-item dot-color="grey" size="small">
                <span class="text-body-2 text-medium-emphasis">Émission quittancement</span>
              </v-timeline-item>
            </v-timeline>

            <v-alert type="success" variant="tonal" rounded="lg" density="compact" class="mb-3" prepend-icon="mdi-information">
              OASE suit automatiquement ce dossier. Vous recevrez une notification dès émission du quittancement.
            </v-alert>

            <!-- Confirmation soumission -->
            <div v-if="submitted">
              <v-alert type="success" variant="tonal" rounded="lg" prepend-icon="mdi-check-circle">
                Dossier rattaché à OASE — Référence : <strong>OASE-2026-{{ refSubmission }}</strong>
                <div class="text-caption mt-1">Le suivi GESTEXO est actif. Notification automatique à chaque changement de statut.</div>
              </v-alert>
              <v-btn variant="tonal" color="primary" class="mt-3" prepend-icon="mdi-download">Télécharger l'accusé de rattachement</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </template>

    </template>

    <!-- ═══ Stepper standard (tous les autres régimes + step 1 douanière) ═══ -->
    <v-stepper v-else v-model="step" :items="stepLabels" alt-labels flat hide-actions class="rounded-lg elevation-1">

      <!-- ═══ STEP 1 — Type de régime ═══ -->
      <template #item.1>
        <v-card flat><v-card-text>
          <div class="text-subtitle-1 font-weight-semibold mb-4">Type d'exonération demandé</div>
          <v-row>
            <v-col v-for="t in exoTypes" :key="t.value" cols="12" sm="6" md="4">
              <v-card :variant="selectedType===t.value?'tonal':'outlined'" :color="selectedType===t.value?'primary':undefined" rounded="lg" class="cursor-pointer h-100" @click="selectedType=t.value">
                <v-card-text class="pa-4">
                  <div class="d-flex align-center ga-2 mb-2">
                    <v-icon :icon="t.icon" :color="selectedType===t.value?'primary':'secondary'" size="24" />
                    <v-chip v-if="t.processus" size="x-small" color="secondary" variant="tonal">Processus {{ t.processus }}</v-chip>
                  </div>
                  <div class="font-weight-semibold text-body-2">{{ t.label }}</div>
                  <div class="text-caption text-medium-emphasis mt-1">{{ t.desc }}</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <v-divider class="mt-5 mb-4" />
          <div class="text-subtitle-2 font-weight-semibold mb-3">
            Base juridique invoquée
            <v-chip size="x-small" color="warning" variant="tonal" class="ml-2">Champ obligatoire — Tab. 6/7 MRD 2024</v-chip>
          </div>
          <v-row>
            <v-col cols="12" md="4">
              <v-select
                v-model="baseJuridique.famille"
                :items="FAMILLES_BASE_JURIDIQUE"
                item-title="label"
                item-value="code"
                label="Famille de base juridique *"
                hint="Tab. 6 — Rapport Diagnostic"
                persistent-hint
              >
                <template #item="{ item, props: itemProps }">
                  <v-list-item v-bind="itemProps" :subtitle="item.raw.ref" />
                </template>
              </v-select>
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="baseJuridique.typeActe"
                :items="TYPES_ACTE"
                label="Type d'acte *"
                hint="Tab. 7 — Rapport Diagnostic"
                persistent-hint
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="baseJuridique.reference"
                label="Référence du texte *"
                placeholder="Ex. : Art. 215 al. 3 CGI"
                hint="Article, alinéa, date"
                persistent-hint
              />
            </v-col>
          </v-row>
        </v-card-text></v-card>
      </template>

      <!-- ═══ STEP 2 — Identification bénéficiaire / déclarant ═══ -->
      <template #item.2>
        <v-card flat><v-card-text>
          <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
            <template v-if="selectedType==='douaniere'">Saisie du déclarant ou du transitaire — données pré-remplies depuis SYDONIAWORLD.</template>
            <template v-else-if="selectedType==='convention_miniere'">Identification de l'opérateur minier / pétrolier — référence DGMG obligatoire.</template>
            <template v-else-if="selectedType==='accord_siege'">Identification de l'organisation internationale, mission diplomatique ou ONG.</template>
            <template v-else>Données pré-remplies depuis votre profil. Sélectionnez votre nature juridique pour les pièces requises (arrêté 148/MEF/UPF).</template>
          </v-alert>

          <!-- Standard CI / TVA / IS / ZF / CI / Sectorielle -->
          <v-row v-if="!['convention_miniere','accord_siege'].includes(selectedType)">
            <v-col cols="12" md="6"><v-text-field v-model="benefForm.rccm" label="RCCM" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="benefForm.nif" label="NIF" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="benefForm.raisonSociale" :label="selectedType==='douaniere'?'Raison sociale (déclarant/transitaire)':'Raison sociale'" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="benefForm.formeJuridique" label="Forme juridique" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="benefForm.adresse" label="Adresse du siège" /></v-col>
            <v-col cols="12" md="6"><v-select v-model="benefForm.secteur" :items="secteurs" label="Secteur d'activité (SYSCOA)" /></v-col>
            <v-col v-if="!['douaniere','zone_franche','code_investissement'].includes(selectedType)" cols="12" md="6">
              <v-select v-model="benefForm.natureJuridique" :items="naturesJuridiques" label="Nature juridique (arrêté 148)" hint="Détermine la liste des pièces requises" persistent-hint />
            </v-col>
            <v-col v-if="selectedType==='douaniere'" cols="12" md="6">
              <v-text-field v-model="douaFields.transitaire" label="Transitaire agréé (si applicable)" hint="Agent en douane accrédité SYDONIAWORLD" persistent-hint />
            </v-col>
          </v-row>

          <!-- Convention Minière -->
          <v-row v-else-if="selectedType==='convention_miniere'">
            <v-col cols="12" md="6"><v-text-field v-model="benefForm.raisonSociale" label="Dénomination de l'opérateur" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="benefForm.nif" label="NIF" /></v-col>
            <v-col cols="12" md="6">
              <v-select v-model="mineFields.typeSecteur" :items="['Minier','Pétrolier']" label="Secteur extractif" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="mineFields.autoriteCompetente" :items="['DGMG (Mines)','Ministère des Mines (Pétrolier)']" label="Autorité compétente" />
            </v-col>
            <v-col cols="12" md="6"><v-text-field v-model="benefForm.adresse" label="Siège social" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="mineFields.refPermis" label="Référence permis existant (si renouvellement)" /></v-col>
          </v-row>

          <!-- Accord de Siège -->
          <v-row v-else-if="selectedType==='accord_siege'">
            <v-col cols="12" md="6"><v-text-field v-model="benefForm.raisonSociale" label="Dénomination de l'organisation" /></v-col>
            <v-col cols="12" md="6">
              <v-select v-model="siegeFields.typeOrganisation" :items="typesOrganisation" label="Type d'organisation" />
            </v-col>
            <v-col cols="12" md="6"><v-text-field v-model="benefForm.adresse" label="Adresse de la représentation au Togo" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="siegeFields.representant" label="Représentant / Chef de mission" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="siegeFields.refAccord" label="Référence accord de siège ou convention" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="siegeFields.dateAccord" label="Date de signature de l'accord" type="date" /></v-col>
          </v-row>

          <!-- Nature juridique alert for standard types -->
          <v-alert v-if="!['convention_miniere','accord_siege','douaniere','zone_franche','code_investissement'].includes(selectedType)" type="warning" variant="tonal" rounded="lg" density="compact" class="mt-3">
            <strong>Catégorie sélectionnée :</strong> {{ natureLabel }}
            <div class="text-caption">{{ natureDescription }}</div>
          </v-alert>
        </v-card-text></v-card>
      </template>

      <!-- ═══ STEP 3 — Détails opération (adaptatif par régime) ═══ -->
      <template #item.3>
        <v-card flat><v-card-text>

          <!-- ── CI/OTR : Impôts intérieurs (Processus 1) ── -->
          <template v-if="isStandardCI">
            <div class="text-subtitle-1 font-weight-semibold mb-3">Description de l'opération</div>
            <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-3">
              Votre dossier sera traité sous <strong>15 jours ouvrables</strong> à compter du dépôt.
            </v-alert>
            <v-row>
              <v-col cols="12"><v-textarea v-model="details.description" label="Nature et description des biens/services concernés" rows="3" counter="500" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="details.montant" label="Valeur estimée (FCFA)" type="number" suffix="FCFA" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="details.duree" label="Durée sollicitée (mois)" type="number" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="details.dateDebut" label="Date de début souhaitée" type="date" /></v-col>
            </v-row>
            <v-divider class="my-4" />
            <div class="text-subtitle-1 font-weight-semibold mb-3">Critères d'évaluation globale (§1.1.2.2 arrêté 148)</div>
            <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-3">
              Ces indicateurs mesurent l'ancrage économique et la contribution fiscale au tissu national.
            </v-alert>
            <v-row>
              <v-col cols="12" md="6"><v-text-field v-model="evaluation.investissements" label="Investissements réalisés (FCFA)" type="number" suffix="FCFA" hint="Montant total des investissements" persistent-hint /></v-col>
              <v-col cols="12" md="6">
                <v-row dense>
                  <v-col cols="6"><v-text-field v-model="evaluation.emploisNationaux" label="Emplois nationaux" type="number" /></v-col>
                  <v-col cols="6"><v-text-field v-model="evaluation.emploisExpatries" label="Emplois expatriés" type="number" /></v-col>
                </v-row>
              </v-col>
              <v-col cols="12" md="6"><v-text-field v-model="evaluation.masseSalariale" label="Masse salariale (FCFA)" type="number" suffix="FCFA" /></v-col>
              <v-col cols="12" md="6">
                <v-row dense>
                  <v-col cols="6"><v-text-field v-model="evaluation.caLocal" label="CA local (FCFA)" type="number" suffix="FCFA" /></v-col>
                  <v-col cols="6"><v-text-field v-model="evaluation.caExport" label="CA export (FCFA)" type="number" suffix="FCFA" /></v-col>
                </v-row>
              </v-col>
              <v-col cols="12" md="4"><v-text-field v-model="evaluation.valeurAjoutee" label="Valeur ajoutée (FCFA)" type="number" suffix="FCFA" /></v-col>
              <v-col cols="12" md="4"><v-text-field v-model="evaluation.consoEauElectricite" label="Eau/Électricité tarif réduit (FCFA)" type="number" suffix="FCFA" /></v-col>
              <v-col cols="12" md="4"><v-text-field v-model="evaluation.prelevementsOTR" label="Prélèvements versés OTR (FCFA)" type="number" suffix="FCFA" hint="Impôts, droits, taxes CI/CDDI" persistent-hint /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="evaluation.contributionPIB" label="Contribution au PIB (FCFA)" type="number" suffix="FCFA" hint="Valeur ajoutée nette rapportée au tissu national (§1.1.2.2 MRD)" persistent-hint /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="evaluation.autresChargesObligatoires" label="Autres charges obligatoires acquittées (FCFA)" type="number" suffix="FCFA" hint="API-ZF, mairies, CNSS et autres organismes compétents" persistent-hint /></v-col>
            </v-row>
            <v-divider class="my-4" />
            <div class="text-subtitle-1 font-weight-semibold mb-3">
              Contexte opérationnel
              <v-chip size="x-small" color="info" variant="tonal" class="ml-2">Détermine les pièces §1.1.2.3</v-chip>
            </div>
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="ciOperationType"
                  :items="TYPES_OPERATION_CI"
                  item-title="label"
                  item-value="code"
                  label="Type d'opération exonérée *"
                  hint="Détermine les pièces complémentaires à l'Étape 4"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="6" class="d-flex align-center">
                <v-switch
                  v-model="hasAgrement"
                  color="primary"
                  hide-details
                  label="L'exonération repose sur un agrément ministériel"
                />
              </v-col>
            </v-row>
            <v-alert v-if="hasAgrement" type="warning" variant="tonal" rounded="lg" density="compact" class="mt-3">
              La <strong>fiche signalétique de suivi des agréments</strong> (dûment remplie et visée par le Ministère de tutelle) sera requise à l'Étape 4.
            </v-alert>
          </template>

          <!-- ── Franchise douanière (Processus 2 CDDI / SYDONIAWORLD) ── -->
          <template v-else-if="selectedType==='douaniere'">
            <div class="text-subtitle-1 font-weight-semibold mb-3">Déclaration en détail — Processus 2 CDDI</div>

            <!-- Bandeau architecture : OASE ne saisit pas, SYDONIAWORLD saisit -->
            <v-card variant="tonal" color="info" rounded="lg" class="mb-4 pa-4">
              <div class="d-flex align-start ga-3">
                <v-icon icon="mdi-information-outline" color="info" size="28" class="flex-shrink-0 mt-1" />
                <div>
                  <div class="text-body-2 font-weight-bold mb-1">La déclaration en détail est saisie dans SYDONIAWORLD</div>
                  <div class="text-body-2 text-medium-emphasis mb-3">
                    Conformément au Processus n°2 (MRD 2024), la saisie initiale de la déclaration douanière (entrée du circuit) est opérée directement dans <strong>SYDONIAWORLD</strong> par le bénéficiaire ou son transitaire agréé. OASE supervise ensuite le traitement via GESTEXO (liquidation, quittancement, reporting).
                  </div>
                  <div class="d-flex flex-wrap ga-2">
                    <v-btn
                      color="info"
                      variant="elevated"
                      size="small"
                      prepend-icon="mdi-open-in-new"
                      href="https://sydoniaworld.tg"
                      target="_blank"
                    >
                      Ouvrir SYDONIAWORLD
                    </v-btn>
                    <v-chip size="small" color="info" variant="outlined" prepend-icon="mdi-clock-outline">
                      Circuit : 9 j ouvrables max (étapes 2a → 2d)
                    </v-chip>
                  </div>
                </div>
              </div>
            </v-card>

            <!-- Étapes visuelles du circuit -->
            <v-card variant="outlined" rounded="lg" class="mb-4 pa-3">
              <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-3">Circuit Processus 2 — référence</div>
              <div class="d-flex flex-wrap align-center ga-1">
                <v-chip size="x-small" color="secondary" variant="tonal" prepend-icon="mdi-pencil">Entrée SYDONIAWORLD</v-chip>
                <v-icon icon="mdi-chevron-right" size="16" color="medium-emphasis" />
                <v-chip size="x-small" color="secondary" variant="tonal">Étape 1 — Contrôle pièces</v-chip>
                <v-icon icon="mdi-chevron-right" size="16" color="medium-emphasis" />
                <v-chip size="x-small" color="secondary" variant="tonal">Étape 2 — Conformité juridique</v-chip>
                <v-icon icon="mdi-chevron-right" size="16" color="medium-emphasis" />
                <v-chip size="x-small" color="warning" variant="tonal">2a–2d Validation séquentielle</v-chip>
                <v-icon icon="mdi-chevron-right" size="16" color="medium-emphasis" />
                <v-chip size="x-small" color="success" variant="tonal" prepend-icon="mdi-check-circle">GESTEXO — Liquidation + Quittancement</v-chip>
              </div>
            </v-card>

            <!-- Champs minima collectés par OASE pour rattachement -->
            <div class="text-subtitle-2 font-weight-semibold mb-3 mt-2">
              Après saisie dans SYDONIAWORLD, renseignez ci-dessous les informations de rattachement OASE
            </div>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="douaFields.numDeclaration"
                  label="Numéro de déclaration SYDONIAWORLD *"
                  hint="Format SW-AAAA-NNNNN — obtenu après saisie dans SYDONIAWORLD"
                  persistent-hint
                  prepend-inner-icon="mdi-barcode"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="douaFields.bureauDouane" label="Bureau de douane compétent (CDDI)" prepend-inner-icon="mdi-office-building" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="douaFields.modeTransport"
                  :items="['Maritime (Bill of Lading)','Aérien (LTA)','Terrestre','Postal']"
                  label="Mode de transport"
                  hint="Détermine les pièces justificatives requises à l'étape suivante"
                  persistent-hint
                  prepend-inner-icon="mdi-truck-delivery"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="douaFields.typeOperation"
                  :items="['Importation normale','Franchise diplomatique','Franchise OI / ONG','Franchise Zone Franche','Franchise Code des Investissements','Franchise Convention minière']"
                  label="Type d'opération franchisée"
                  prepend-inner-icon="mdi-tag-outline"
                />
              </v-col>
              <v-col v-if="!douaFields.modeTransport?.startsWith('Postal')" cols="12" md="6">
                <v-text-field
                  v-model="douaFields.refConnaissement"
                  :label="douaFields.modeTransport?.startsWith('Aérien') ? 'Référence LTA (Lettre de Transport Aérien)' : douaFields.modeTransport?.startsWith('Terrestre') ? 'Référence CMR / Lettre de voiture' : 'Référence BL (Bill of Lading)'"
                  :hint="douaFields.modeTransport?.startsWith('Aérien') ? 'N° Lettre de Transport Aérien' : douaFields.modeTransport?.startsWith('Terrestre') ? 'N° CMR ou lettre de voiture internationale' : 'N° Bill of Lading (connaissement maritime)'"
                  persistent-hint
                  prepend-inner-icon="mdi-file-document-outline"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="douaFields.refEtatModeleA"
                  label="Référence État modèle A"
                  hint="Obligatoire pour contribuables (formulaire CI/OTR)"
                  persistent-hint
                  prepend-inner-icon="mdi-form-select"
                />
              </v-col>
            </v-row>

            <v-alert type="warning" variant="tonal" rounded="lg" density="compact" class="mt-3" prepend-icon="mdi-alert">
              <strong>Règle fiche 34 :</strong> La facture doit indiquer la base légale, la référence d'attestation et le NIF. Elle ne doit pas dater de plus de 3 ans. À défaut : <strong>rejet automatique</strong>.
            </v-alert>
          </template>

          <!-- ── Zone Franche (Processus 3 API-ZF) ── -->
          <template v-else-if="selectedType==='zone_franche'">
            <div class="text-subtitle-1 font-weight-semibold mb-3">Demande d'agrément Zone Franche</div>
            <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-3">
              Délai de traitement estimé : <strong>11 à 33 jours</strong> pour un agrément provisoire, <strong>52 à 107 jours</strong> pour un agrément définitif.
            </v-alert>
            <v-row>
              <v-col cols="12" md="6">
                <v-select v-model="zfFields.typeAgrement" :items="['Agrément provisoire (11–33 j)','Agrément définitif / Certificat exportateur (52–107 j)']" label="Type d'agrément demandé" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="zfFields.zone" :items="zonesZF" item-title="label" item-value="value" label="Zone ZF / ZES" prepend-inner-icon="mdi-map-marker" />
              </v-col>
              <v-col cols="12" md="6"><v-text-field v-model="zfFields.montantInvest" label="Montant d'investissement (FCFA)" type="number" suffix="FCFA" hint="Critère éligibilité ≥ seuil ZF" persistent-hint /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="zfFields.emploisProjetes" label="Emplois projetés (dont locaux)" type="number" hint="Minimum 60% de ressortissants togolais" persistent-hint /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="zfFields.tauxExport" label="Taux d'exportation projeté (%)" type="number" suffix="%" hint="% CA réalisé à l'exportation" persistent-hint /></v-col>
              <v-col cols="12" md="6"><v-select v-model="zfFields.secteurZF" :items="secteurs" label="Secteur d'activité ZF" /></v-col>
              <v-col cols="12"><v-textarea v-model="zfFields.planAffaires" label="Résumé du plan d'affaires" rows="3" /></v-col>
            </v-row>
            <v-card variant="tonal" color="info" rounded="lg" class="pa-3 mt-2">
              <div class="text-caption font-weight-bold mb-1">Critères d'éligibilité ZF (loi n°2019-005)</div>
              <div class="d-flex flex-wrap ga-2">
                <v-chip :color="Number(zfFields.montantInvest)>=500000000?'success':'error'" size="x-small" variant="tonal">Investissement ≥ 500M FCFA</v-chip>
                <v-chip :color="Number(zfFields.emploisProjetes)>=50?'success':'error'" size="x-small" variant="tonal">≥ 50 emplois</v-chip>
                <v-chip :color="Number(zfFields.tauxExport)>=70?'success':'warning'" size="x-small" variant="tonal">Export ≥ 70% CA</v-chip>
                <v-chip :color="!!zfFields.zone?'success':'error'" size="x-small" variant="tonal">Zone sélectionnée</v-chip>
              </div>
            </v-card>
          </template>

          <!-- ── Code des Investissements (Processus 4 API-ZF / OTR) ── -->
          <template v-else-if="selectedType==='code_investissement'">
            <div class="text-subtitle-1 font-weight-semibold mb-3">Programme d'investissement — Code des Investissements</div>
            <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-3">
              Votre dossier sera instruit par le Ministère compétent. Vous serez notifié des échéances importantes avant expiration de votre agrément.
            </v-alert>
            <v-row>
              <v-col cols="12" md="6">
                <v-select v-model="ciFields.zoneImplantation" :items="zonesImplantation" item-title="label" item-value="value" label="Zone d'implantation (grille de classement)" hint="Taux d'avantages croissants zones éloignées" persistent-hint />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="ciFields.regimeClassement" :items="['Régime A — Déclaration (investissements courants)','Régime B — Agrément (investissements prioritaires)','Régime C — Agrément (investissements structurants)','Régime D — Convention État (grands projets)']" label="Régime de classement demandé (A/B/C/D)" />
              </v-col>
              <v-col cols="12" md="6"><v-text-field v-model="ciFields.montantCAPEX" label="Montant CAPEX (FCFA)" type="number" suffix="FCFA" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="ciFields.emploisCreer" label="Emplois à créer (directs)" type="number" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="ciFields.dureeAgrement" label="Durée de l'agrément sollicité (ans)" type="number" suffix="ans" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="ciFields.secteur" label="Secteur d'activité" /></v-col>
              <v-col cols="12"><v-textarea v-model="ciFields.programmeInvest" label="Programme d'investissement détaillé" rows="3" hint="CAPEX, phases de réalisation, objectifs" persistent-hint /></v-col>
            </v-row>
            <v-alert type="warning" variant="tonal" rounded="lg" density="compact" class="mt-3">
              <strong>Engagements obligatoires :</strong> Réalisation effective du programme, maintien des emplois, respect des délais. Alerte automatique J-90 avant expiration de l'arrêté de classement.
            </v-alert>
          </template>

          <!-- ── Convention Minière / Pétrolière (Processus 5 DGMG) ── -->
          <template v-else-if="selectedType==='convention_miniere'">
            <div class="text-subtitle-1 font-weight-semibold mb-3">Demande de permis et convention</div>
            <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-3">
              La demande sera instruite par le Ministère des Mines. Vous serez notifié des échéances avant la fin de chaque phase de votre convention.
            </v-alert>
            <v-row>
              <v-col cols="12" md="6">
                <v-select v-model="mineFields.typePermis" :items="['Permis de recherche','Permis d\'exploitation','Permis de production pétrolière','Permis de transport']" label="Type de permis demandé" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="mineFields.phase" :items="phasesConvention" item-title="label" item-value="value" label="Phase de la convention" />
              </v-col>
              <v-col cols="12" md="6"><v-text-field v-model="mineFields.mineral" label="Minéral / Hydrocarbure concerné" hint="Ex. : phosphate, manganèse, pétrole brut" persistent-hint /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="mineFields.zoneGeo" label="Zone géographique / Bloc" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="mineFields.dureePhase" label="Durée de la phase (ans)" type="number" suffix="ans" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="mineFields.capexPhase" label="CAPEX de la phase (FCFA)" type="number" suffix="FCFA" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="mineFields.emploisLocaux" label="Emplois locaux projetés" type="number" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="mineFields.dateDebutPhase" label="Date de début de phase" type="date" /></v-col>
              <v-col cols="12"><v-textarea v-model="mineFields.clauseStabilisation" label="Clause de stabilisation fiscale (résumé)" rows="2" hint="Gel de l'assiette fiscale — risque budgétaire à tracer dans OASE" persistent-hint /></v-col>
            </v-row>
            <v-card variant="tonal" color="warning" rounded="lg" class="pa-3 mt-2">
              <div class="text-caption font-weight-bold mb-1">Circuit institutionnel requis</div>
              <div class="d-flex flex-wrap ga-2">
                <v-chip color="info" size="x-small" variant="tonal" prepend-icon="mdi-handshake">Négociation DGMG</v-chip>
                <v-chip color="warning" size="x-small" variant="tonal" prepend-icon="mdi-bank">Conseil des ministres</v-chip>
                <v-chip color="secondary" size="x-small" variant="tonal" prepend-icon="mdi-gavel">Assemblée nationale (si requis)</v-chip>
                <v-chip color="error" size="x-small" variant="tonal" prepend-icon="mdi-newspaper">JORT</v-chip>
              </div>
            </v-card>
          </template>

          <!-- ── Accord de siège OI / Ambassade / ONG (Processus 6 MAE) ── -->
          <template v-else-if="selectedType==='accord_siege'">
            <div class="text-subtitle-1 font-weight-semibold mb-3">Bases juridiques et avantages demandés</div>
            <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-3">
              Sélectionnez toutes les bases juridiques applicables à votre accord. Une mise à jour annuelle de la liste du personnel vous sera demandée.
            </v-alert>
            <div class="text-subtitle-2 font-weight-semibold mb-2">Bases juridiques applicables (cocher toutes celles qui s'appliquent)</div>
            <v-row class="mb-3">
              <v-col v-for="bj in basesJuridiques" :key="bj.value" cols="12" md="6">
                <v-checkbox v-model="siegeFields.basesJuridiques" :value="bj.value" :label="bj.label" :hint="bj.hint" persistent-hint density="compact" hide-details="auto" />
              </v-col>
            </v-row>
            <v-alert type="warning" variant="tonal" rounded="lg" density="compact" class="mb-4">
              La base juridique doit être renseignée <strong>explicitement et exhaustivement</strong> pour chaque avantage accordé (angle mort identifié dans la MRD 2024).
            </v-alert>
            <div class="text-subtitle-2 font-weight-semibold mb-2">Avantages demandés</div>
            <v-row class="mb-3">
              <v-col v-for="av in avantagesSiege" :key="av.value" cols="12" md="6">
                <v-checkbox v-model="siegeFields.avantages" :value="av.value" :label="av.label" :hint="av.hint" persistent-hint density="compact" hide-details="auto" />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="6"><v-text-field v-model="siegeFields.nbPersonnel" label="Nombre de personnels bénéficiaires" type="number" hint="Liste nominative jointe en pièce" persistent-hint /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="siegeFields.nbVehicules" label="Nombre de véhicules diplomatiques/officiels" type="number" hint="Immatriculations à jour" persistent-hint /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="siegeFields.dateDebutAccord" label="Date de début de l'accord" type="date" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="siegeFields.dateFinAccord" label="Date de fin / expiration" type="date" hint="Déclenchera alerte J-90 automatique dans OASE" persistent-hint /></v-col>
            </v-row>
            <div class="d-flex align-center ga-2 mt-4">
              <v-btn
                variant="tonal"
                color="primary"
                size="small"
                prepend-icon="mdi-plus"
                @click="addBaseJuridiqueAS"
              >
                Ajouter une base juridique additionnelle
              </v-btn>
              <span class="text-caption text-medium-emphasis">
                {{ docsAccordSiege.filter(d => d.id.startsWith('as1')).length }} base(s) — §1.2.7 MRD (pluralité cumulative)
              </span>
            </div>
          </template>

        </v-card-text></v-card>
      </template>

      <!-- ═══ STEP 4 — Documents ═══ -->
      <template #item.4>
        <v-card flat><v-card-text>
          <v-alert v-if="!['convention_miniere','accord_siege'].includes(selectedType)" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4" prepend-icon="mdi-alert-circle">
            <strong>Règle fiche 34 — Exigences obligatoires :</strong> Toute facture doit indiquer la base légale, la référence d'attestation et le NIF du bénéficiaire. La facture ne doit pas dater de plus de 3 ans à la date de dépôt. <strong>À défaut : rejet automatique.</strong>
          </v-alert>

          <!-- Regime-specific document rules -->
          <v-alert v-if="selectedType==='douaniere'" type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
            <strong>Pièces CDDI obligatoires :</strong> Base légale + État modèle A + Factures commerciales + BL/LTA + Autorisation d'importation (si applicable) + Carte consulaire (diplomatique).
          </v-alert>
          <v-alert v-else-if="selectedType==='convention_miniere'" type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
            <strong>Documents DGMG :</strong> La convention est opposable à l'OTR après publication au JORT. Les pièces varient selon la phase de la convention.
          </v-alert>
          <v-alert v-else-if="selectedType==='accord_siege'" type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
            <strong>Obligation annuelle :</strong> Mise à jour de la liste nominative du personnel et du registre des immatriculations.
          </v-alert>

          <div class="d-flex align-center justify-space-between mb-3">
            <div>
              <div class="text-subtitle-1 font-weight-semibold">Pièces justificatives</div>
              <div class="text-caption text-medium-emphasis">{{ docCategoryLabel }}</div>
            </div>
            <v-chip color="primary" variant="tonal" size="small">{{ uploadedCount }}/{{ dynamicDocs.length }} fournis</v-chip>
          </div>
          <v-progress-linear :model-value="dynamicDocs.length>0?(uploadedCount/dynamicDocs.length)*100:0" color="primary" rounded height="6" class="mb-4" />

          <!-- Tabs par critère -->
          <v-tabs v-model="docTabActive" color="primary" density="compact" class="mb-1" show-arrows>
            <v-tab v-for="tab in docTabs" :key="tab.key" :value="tab.key" class="text-none text-body-2">
              <v-icon :icon="tab.icon" size="16" class="me-1" />
              {{ tab.label }}
              <v-chip
                size="x-small"
                :color="tab.docs.length===0?'secondary':tab.docs.every(d=>d.uploaded)?'success':'warning'"
                variant="tonal"
                class="ms-2"
              >{{ tab.docs.filter(d=>d.uploaded).length }}/{{ tab.docs.length }}</v-chip>
            </v-tab>
          </v-tabs>
          <v-divider class="mb-4" />

          <v-window v-model="docTabActive">
            <v-window-item v-for="tab in docTabs" :key="tab.key" :value="tab.key">
              <p v-if="tab.subtitle" class="text-caption text-medium-emphasis font-italic mb-3">
                {{ tab.subtitle }} — arrêté n° 148/MEF/UPF du 29 mai 2024
              </p>
              <v-row dense>
                <v-col v-for="doc in tab.docs" :key="doc.id" cols="12" md="6">
                  <v-card
                    :variant="doc.uploaded?'tonal':'outlined'"
                    :color="doc.uploaded?'success':undefined"
                    rounded="lg"
                    class="h-100"
                  >
                    <v-card-text class="pa-3 d-flex align-start ga-3">
                      <v-icon
                        :icon="doc.uploaded?'mdi-check-circle':'mdi-file-upload-outline'"
                        :color="doc.uploaded?'success':'secondary'"
                        size="20"
                        class="mt-1 flex-shrink-0"
                      />
                      <div class="flex-grow-1" style="min-width:0">
                        <div class="text-body-2 font-weight-medium">{{ doc.label }}</div>
                        <div class="text-caption text-medium-emphasis">
                          <template v-if="doc.uploaded && doc.files && doc.files.length > 0">
                            {{ doc.files.length }} facture(s) déposée(s)
                          </template>
                          <template v-else>
                            {{ doc.uploaded ? doc.fileName : 'Cliquez Déposer pour renseigner ce document' }}
                          </template>
                        </div>
                        <div v-if="doc.uploaded && doc.files && doc.files.length > 0" class="d-flex flex-wrap ga-1 mt-1">
                          <v-chip v-for="(f, idx) in doc.files" :key="idx" size="x-small" color="success" variant="outlined" class="text-truncate" style="max-width:200px">
                            {{ f.metadata.numFacture || f.name }}
                          </v-chip>
                        </div>
                        <div v-else-if="doc.uploaded && doc.metadata" class="d-flex flex-wrap ga-1 mt-1">
                          <v-chip v-for="(val, key) in doc.metadata" :key="key" size="x-small" color="success" variant="outlined">{{ val }}</v-chip>
                        </div>
                        <v-chip v-if="docStatus(doc)==='obligatoire'" size="x-small" color="error" variant="tonal" class="mt-1">Obligatoire</v-chip>
                        <v-chip v-else-if="docStatus(doc)==='optionnel'" size="x-small" color="warning" variant="tonal" class="mt-1">
                          {{ docReason(doc) || 'Optionnel — selon contexte' }}
                        </v-chip>
                      </div>
                      <v-btn
                        :color="doc.uploaded?'success':'primary'"
                        variant="tonal"
                        size="x-small"
                        :prepend-icon="doc.uploaded && doc.files && doc.files.length>0 ? 'mdi-plus' : (doc.uploaded?'mdi-pencil':'mdi-upload')"
                        class="flex-shrink-0"
                        @click="openDocModal(doc)"
                      >{{ doc.uploaded && doc.files && doc.files.length>0 ? 'Ajouter' : (doc.uploaded ? 'Modifier' : 'Déposer') }}</v-btn>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
              <div v-if="tab.docs.length===0" class="text-center text-medium-emphasis py-6">
                <v-icon icon="mdi-check-circle-outline" size="36" color="success" class="mb-2" />
                <div class="text-body-2">Aucune pièce requise pour cette catégorie</div>
              </div>
            </v-window-item>
          </v-window>

        </v-card-text></v-card>
      </template>

      <!-- ═══ MODAL DÉPÔT DOCUMENT ═══ -->
      <DocumentUploadModal
        v-model="docModalOpen"
        :doc="docModalTarget"
        @confirmed="onDocConfirmed"
      />

      <!-- ═══ STEP 5 — Récapitulatif ═══ -->
      <template #item.5>
        <v-card flat><v-card-text>
          <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
            <strong>Lecture seule.</strong> Vérifiez toutes les informations avant la soumission définitive. Aucune modification ne sera possible après dépôt.
          </v-alert>

          <!-- Circuit institutionnel applicable -->
          <v-card variant="tonal" color="primary" rounded="lg" class="pa-3 mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-2">Circuit institutionnel — {{ regimeConfig?.label }}</div>
            <div class="d-flex flex-wrap ga-2">
              <v-chip v-for="(etape, i) in regimeConfig?.circuitEtapes" :key="i" size="small" color="primary" variant="outlined">{{ i+1 }}. {{ etape }}</v-chip>
            </div>
            <div class="text-caption text-medium-emphasis mt-2">Autorité d'attribution : <strong>{{ regimeConfig?.autorite }}</strong> — Système : {{ regimeConfig?.systeme }}</div>
          </v-card>

          <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-2">Identification</div>
          <v-row class="mb-2">
            <v-col cols="12" md="4">
              <v-card variant="outlined" rounded="lg" class="pa-3">
                <div class="text-caption text-medium-emphasis">Type d'exonération</div>
                <div class="font-weight-semibold">{{ exoTypes.find(t=>t.value===selectedType)?.label }}</div>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card variant="outlined" rounded="lg" class="pa-3">
                <div class="text-caption text-medium-emphasis">{{ selectedType==='accord_siege'?'Organisation':'Bénéficiaire' }}</div>
                <div class="font-weight-semibold">{{ benefForm.raisonSociale }}</div>
                <div class="text-caption text-medium-emphasis">NIF : {{ benefForm.nif }}</div>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card variant="outlined" rounded="lg" class="pa-3">
                <div class="text-caption text-medium-emphasis">Pièces</div>
                <div class="font-weight-semibold">{{ uploadedCount }}/{{ dynamicDocs.length }} fournies</div>
                <div class="text-caption text-medium-emphasis">{{ docCategoryLabel }}</div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Régime-specific summary fields -->
          <v-divider class="my-3" />

          <!-- Standard CI eval -->
          <template v-if="isStandardCI">
            <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-2">
              Critères d'évaluation globale — lecture seule
              <v-chip size="x-small" color="warning" variant="tonal" class="ml-2">Auto-déclaré · vérifié sur pièces par CI/OTR</v-chip>
            </div>
            <v-row>
              <v-col cols="12" md="4">
                <v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3">
                  <div class="text-caption text-medium-emphasis">Investissements réalisés</div>
                  <div class="font-weight-bold">{{ evaluation.investissements ? Number(evaluation.investissements).toLocaleString('fr-FR') + ' FCFA' : '—' }}</div>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3">
                  <div class="text-caption text-medium-emphasis">Emplois nationaux / expatriés</div>
                  <div class="font-weight-bold">{{ evaluation.emploisNationaux || '—' }} / {{ evaluation.emploisExpatries || '—' }}</div>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3">
                  <div class="text-caption text-medium-emphasis">Masse salariale (N-1)</div>
                  <div class="font-weight-bold">{{ evaluation.masseSalariale ? Number(evaluation.masseSalariale).toLocaleString('fr-FR') + ' FCFA' : '—' }}</div>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3">
                  <div class="text-caption text-medium-emphasis">Contribution au PIB</div>
                  <div class="font-weight-bold">{{ evaluation.contributionPIB ? Number(evaluation.contributionPIB).toLocaleString('fr-FR') + ' FCFA' : '—' }}</div>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3">
                  <div class="text-caption text-medium-emphasis">Autres charges obligatoires (CNSS, mairies, API-ZF…)</div>
                  <div class="font-weight-bold">{{ evaluation.autresChargesObligatoires ? Number(evaluation.autresChargesObligatoires).toLocaleString('fr-FR') + ' FCFA' : '—' }}</div>
                </v-card>
              </v-col>
            </v-row>
          </template>

          <!-- CDDI summary -->
          <template v-else-if="selectedType==='douaniere'">
            <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-2">Déclaration CDDI / SYDONIAWORLD</div>
            <v-row>
              <v-col cols="12" md="4"><v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3"><div class="text-caption text-medium-emphasis">N° déclaration SYDONIAWORLD</div><div class="font-weight-bold">{{ douaFields.numDeclaration || '—' }}</div></v-card></v-col>
              <v-col cols="12" md="4"><v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3"><div class="text-caption text-medium-emphasis">Mode de transport</div><div class="font-weight-bold">{{ douaFields.modeTransport || '—' }}</div></v-card></v-col>
              <v-col cols="12" md="4"><v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3"><div class="text-caption text-medium-emphasis">Droits exonérés (FCFA)</div><div class="font-weight-bold">{{ douaFields.droitsExoneres ? Number(douaFields.droitsExoneres).toLocaleString('fr-FR') : '—' }}</div></v-card></v-col>
            </v-row>
          </template>

          <!-- ZF summary -->
          <template v-else-if="selectedType==='zone_franche'">
            <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-2">Demande Zone Franche</div>
            <v-row>
              <v-col cols="12" md="4"><v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3"><div class="text-caption text-medium-emphasis">Type d'agrément</div><div class="font-weight-bold">{{ zfFields.typeAgrement || '—' }}</div></v-card></v-col>
              <v-col cols="12" md="4"><v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3"><div class="text-caption text-medium-emphasis">Zone / CAPEX</div><div class="font-weight-bold">{{ zfFields.zone || '—' }} · {{ zfFields.montantInvest ? Number(zfFields.montantInvest).toLocaleString('fr-FR') + ' FCFA' : '—' }}</div></v-card></v-col>
              <v-col cols="12" md="4"><v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3"><div class="text-caption text-medium-emphasis">Emplois / Export</div><div class="font-weight-bold">{{ zfFields.emploisProjetes || '—' }} emplois · {{ zfFields.tauxExport || '—' }}% export</div></v-card></v-col>
            </v-row>
          </template>

          <!-- CI summary -->
          <template v-else-if="selectedType==='code_investissement'">
            <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-2">Classement Code des Investissements</div>
            <v-row>
              <v-col cols="12" md="4"><v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3"><div class="text-caption text-medium-emphasis">Régime demandé</div><div class="font-weight-bold">{{ ciFields.regimeClassement?.substring(0,20) || '—' }}...</div></v-card></v-col>
              <v-col cols="12" md="4"><v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3"><div class="text-caption text-medium-emphasis">Zone / CAPEX</div><div class="font-weight-bold">{{ ciFields.zoneImplantation || '—' }} · {{ ciFields.montantCAPEX ? Number(ciFields.montantCAPEX).toLocaleString('fr-FR') + ' FCFA' : '—' }}</div></v-card></v-col>
              <v-col cols="12" md="4"><v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3"><div class="text-caption text-medium-emphasis">Emplois / Durée</div><div class="font-weight-bold">{{ ciFields.emploisCreer || '—' }} emplois · {{ ciFields.dureeAgrement || '—' }} ans</div></v-card></v-col>
            </v-row>
          </template>

          <!-- Mining summary -->
          <template v-else-if="selectedType==='convention_miniere'">
            <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-2">Convention {{ mineFields.typeSecteur }}</div>
            <v-row>
              <v-col cols="12" md="4"><v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3"><div class="text-caption text-medium-emphasis">Phase</div><div class="font-weight-bold">{{ mineFields.phase || '—' }}</div></v-card></v-col>
              <v-col cols="12" md="4"><v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3"><div class="text-caption text-medium-emphasis">Minéral / Zone</div><div class="font-weight-bold">{{ mineFields.mineral || '—' }} · {{ mineFields.zoneGeo || '—' }}</div></v-card></v-col>
              <v-col cols="12" md="4"><v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3"><div class="text-caption text-medium-emphasis">CAPEX / Emplois</div><div class="font-weight-bold">{{ mineFields.capexPhase ? Number(mineFields.capexPhase).toLocaleString('fr-FR') + ' FCFA' : '—' }} · {{ mineFields.emploisLocaux || '—' }} locaux</div></v-card></v-col>
            </v-row>
          </template>

          <!-- Accord de siège summary -->
          <template v-else-if="selectedType==='accord_siege'">
            <div class="text-subtitle-2 font-weight-bold text-uppercase text-medium-emphasis mb-2">Accord de siège — Avantages demandés</div>
            <v-row>
              <v-col cols="12" md="4"><v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3"><div class="text-caption text-medium-emphasis">Type d'organisation</div><div class="font-weight-bold">{{ siegeFields.typeOrganisation || '—' }}</div></v-card></v-col>
              <v-col cols="12" md="4"><v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3"><div class="text-caption text-medium-emphasis">Personnel / Véhicules</div><div class="font-weight-bold">{{ siegeFields.nbPersonnel || '—' }} pers. · {{ siegeFields.nbVehicules || '—' }} véh.</div></v-card></v-col>
              <v-col cols="12" md="4"><v-card variant="tonal" color="surface-variant" rounded="lg" class="pa-3"><div class="text-caption text-medium-emphasis">Avantages demandés</div><div class="font-weight-bold">{{ siegeFields.avantages.length }} type(s)</div></v-card></v-col>
            </v-row>
            <v-chip-group class="mt-2">
              <v-chip v-for="bj in siegeFields.basesJuridiques" :key="bj" size="x-small" color="info" variant="tonal">{{ bj }}</v-chip>
            </v-chip-group>
          </template>

          <v-divider class="my-3" />
          <v-checkbox v-model="certified" label="Je certifie sur l'honneur l'exactitude des informations déclarées et des pièces fournies. Toute fausse déclaration entraîne l'annulation de l'exonération." class="mt-2" />
          <div v-if="submitted" class="mt-3">
            <v-alert type="success" variant="tonal" rounded="lg">
              Demande soumise — Référence : <strong>OASE-2026-{{ refSubmission }}</strong>
              <div class="text-caption mt-1">Récépissé envoyé par e-mail. {{ regimeConfig?.nextStep }}</div>
            </v-alert>
            <v-btn variant="tonal" color="primary" class="mt-3" prepend-icon="mdi-download">Télécharger le récépissé PDF</v-btn>
          </div>
        </v-card-text></v-card>
      </template>
    </v-stepper>

    <div class="d-flex justify-space-between mt-4">
      <!-- Navigation parcours simplifié franchise douanière -->
      <template v-if="selectedType === 'douaniere' && cddiScreen > 0">
        <v-btn
          icon="mdi-chevron-left"
          variant="tonal"
          size="large"
          @click="cddiScreen > 1 ? cddiScreen-- : (cddiScreen = 0)"
          aria-label="Précédent"
        />
        <v-spacer />
        <v-btn
          v-if="cddiScreen === 1"
          color="info"
          size="large"
          prepend-icon="mdi-link-variant"
          :disabled="!douaFields.numDeclaration"
          @click="cddiScreen = 2"
        >
          Consulter le suivi GESTEXO
        </v-btn>

      </template>

      <!-- Navigation stepper standard -->
      <template v-else>
        <v-btn v-if="step > 1" icon="mdi-chevron-left" variant="tonal" size="large" @click="step--" aria-label="Précédent" />
        <v-spacer />
        <!-- Step 1 avec douanière sélectionné : on sort du stepper -->
        <v-btn
          v-if="selectedType === 'douaniere' && step === 1"
          color="info"
          size="large"
          prepend-icon="mdi-chevron-right"
          @click="cddiScreen = 1"
        >
          Continuer
        </v-btn>
        <v-btn v-else-if="step < 5" icon="mdi-chevron-right" color="primary" size="large" @click="step++" aria-label="Suivant" />
        <v-btn v-else-if="!submitted" icon="mdi-send" color="success" size="large" :disabled="!certified" @click="submitted = true" aria-label="Soumettre" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import DocumentUploadModal from '../../components/DocumentUploadModal.vue'
import { FAMILLES_BASE_JURIDIQUE, TYPES_ACTE, TYPES_OPERATION_CI } from '../../data/referentielsOase'

const step = ref(1)
const cddiScreen = ref(0) // 0=stepper actif, 1=lancement SYDONIAWORLD, 2=consultation GESTEXO
const selectedType = ref('douaniere')

// Reset flow when type changes
watch(selectedType, () => { cddiScreen.value = 0; step.value = 1 })
const baseJuridique = ref<{ famille: string; typeActe: string; reference: string }>({ famille: '', typeActe: '', reference: '' })
// Contexte opérationnel CI — détermine les pièces §1.1.2.3
const ciOperationType = ref<string>('general')
const hasAgrement     = ref<boolean>(false)
const certified = ref(false)
const submitted = ref(false)
const refSubmission = computed(() => String(Math.floor(1000 + Math.random() * 9000)))

// ── Types d'exonération (8 processus MRD) ──────────────────────────────────
const exoTypes = [
  { value: 'douaniere',          label: 'Franchise douanière',               icon: 'mdi-truck',          desc: 'Droits d\'entrée, TVA importation — CDDI / SYDONIAWORLD',              processus: '2' },
  { value: 'fiscale_tva',        label: 'Exonération TVA',                   icon: 'mdi-percent',        desc: 'TVA interne sur opérations locales — CI / E-TAX',                      processus: '1' },
  { value: 'fiscale_is',         label: 'Exonération IS / IRCM',             icon: 'mdi-bank',           desc: 'Impôt sur les sociétés, IRCM, TAF — CI / E-TAX',                       processus: '1' },
  { value: 'zone_franche',       label: 'Zone Franche',                      icon: 'mdi-factory',        desc: 'ZFI / ZES — Agrément API-ZF + mapping NIF',                           processus: '3' },
  { value: 'code_investissement', label: 'Code des Investissements',         icon: 'mdi-handshake',      desc: 'Arrêté de classement A/B/C — API-ZF / Ministère',                      processus: '4' },
  { value: 'convention_miniere', label: 'Convention minière / pétrolière',   icon: 'mdi-pickaxe',        desc: 'DGMG → Conseil des ministres → Ratification AN',                       processus: '5' },
  { value: 'accord_siege',       label: 'Accord de siège',                   icon: 'mdi-flag',           desc: 'OI, Ambassade, ONG — MAE → OTR (CI + CDDI)',                          processus: '6' },
  { value: 'sectorielle',        label: 'Sectorielle',                       icon: 'mdi-domain',         desc: 'Agriculture, Mines, Énergie, Numérique — base légale spécifique',     processus: undefined },
]

// ── Computed helpers ────────────────────────────────────────────────────────
const isStandardCI = computed(() => ['fiscale_tva', 'fiscale_is', 'sectorielle'].includes(selectedType.value))

// ── Step labels adaptatifs ──────────────────────────────────────────────────
const stepLabelsMap: Record<string, string[]> = {
  douaniere:          ['Type',        'Déclarant',         'Déclaration CDDI',           'Documents CDDI',    'Récapitulatif'],
  fiscale_tva:        ['Type',        'Bénéficiaire',      'Détails CI',                 'Documents CI',      'Récapitulatif'],
  fiscale_is:         ['Type',        'Bénéficiaire',      'Détails CI',                 'Documents CI',      'Récapitulatif'],
  zone_franche:       ['Type',        'Promoteur',         'Projet ZF',                  'Documents API-ZF',  'Récapitulatif'],
  code_investissement:['Type',        'Investisseur',      'Programme d\'invest.',       'Documents CI',      'Récapitulatif'],
  convention_miniere: ['Type',        'Opérateur',         'Convention & Phase',         'Documents DGMG',    'Récapitulatif'],
  accord_siege:       ['Type',        'Organisation',      'Base juridique & Avantages', 'Documents MAE',     'Récapitulatif'],
  sectorielle:        ['Type',        'Bénéficiaire',      'Détails sectoriels',         'Documents',         'Récapitulatif'],
}
const stepLabels = computed(() => stepLabelsMap[selectedType.value] || ['Type', 'Bénéficiaire', 'Détails', 'Documents', 'Récapitulatif'])

// ── Configuration par régime ────────────────────────────────────────────────
interface RegimeConfig {
  label: string; alertType: 'info'|'warning'|'error'|'success'; icon: string
  processus: string; autorite: string; systeme: string; description: string
  circuitEtapes: string[]; nextStep: string
}
const regimeConfigs: Record<string, RegimeConfig> = {
  douaniere: {
    label: 'Franchise douanière',
    alertType: 'info', icon: 'mdi-truck',
    processus: '2', autorite: 'CDDI / Directeur CDDI',
    systeme: 'SYDONIAWORLD + GESTEXO → DAS → DGBF',
    description: 'Circuit entièrement dématérialisé depuis 2022. Validation séquentielle en 4 sous-étapes (2a/2b/2c/2d) — délai max 9 jours ouvrables.',
    circuitEtapes: ['Saisie déclaration (SYDONIA)', 'Contrôle pièces (CDDI)', 'Vérification juridique', 'Validation 2a→2b→2c→2d', 'Liquidation', 'Quittancement', 'Reporting mensuel'],
    nextStep: 'Dossier transmis au CDDI pour instruction dans SYDONIAWORLD.',
  },
  fiscale_tva: {
    label: 'Exonération TVA',
    alertType: 'info', icon: 'mdi-percent',
    processus: '1', autorite: 'CI / Direction → E-TAX',
    systeme: 'E-TAX → Base DLFC → DAS → SIGFiP → DGBF',
    description: 'Délai normé : vérification < 5j / validation hiérarchique < 10j / attestation signée < 15j. Instruction via CGI ou texte habilitant.',
    circuitEtapes: ['Dépôt CI', 'Vérif. administrative (< 5j)', 'Étude juridique CGI', 'Validation DGE/DME (< 10j)', 'Attestation Direction CI (< 15j)', 'Exécution guichet', 'Suivi E-TAX', 'Reporting DGBF'],
    nextStep: 'Dossier transmis au CI service gestionnaire pour instruction.',
  },
  fiscale_is: {
    label: 'Exonération IS / IRCM',
    alertType: 'info', icon: 'mdi-bank',
    processus: '1', autorite: 'CI / Direction → E-TAX',
    systeme: 'E-TAX → Base DLFC → DAS → SIGFiP → DGBF',
    description: 'Identique au Processus 1 — base légale CGI / LFI. Attestation émise par la Direction CI.',
    circuitEtapes: ['Dépôt CI', 'Vérif. administrative (< 5j)', 'Étude juridique CGI', 'Validation DGE/DME (< 10j)', 'Attestation Direction CI (< 15j)', 'Exécution guichet', 'Suivi E-TAX', 'Reporting DGBF'],
    nextStep: 'Dossier transmis au CI service gestionnaire pour instruction.',
  },
  zone_franche: {
    label: 'Zone Franche',
    alertType: 'warning', icon: 'mdi-factory',
    processus: '3', autorite: 'API-ZF — Comité d\'agrément',
    systeme: 'E-TAX + SYDONIAWORLD (mapping NIF) → OASE + Registre central',
    description: 'Agrément global et durable. Mapping NIF → statut ZF = activation automatique de tous les avantages. Contrôle annuel API-ZF + OTR.',
    circuitEtapes: ['Dépôt API-ZF', 'Évaluation éligibilité ZF', 'Instruction technique/juridique', 'Agrément comité API-ZF', 'Mapping NIF (E-TAX + SYDONIA)', 'Application automatique', 'Contrôle annuel', 'Alerte J-90'],
    nextStep: 'Dossier soumis à l\'API-ZF pour évaluation des critères d\'éligibilité Zone Franche.',
  },
  code_investissement: {
    label: 'Code des Investissements',
    alertType: 'warning', icon: 'mdi-handshake',
    processus: '4', autorite: 'Ministère compétent (Arrêté de classement)',
    systeme: 'E-TAX + CIBIM + DLFC → OASE + Registre central',
    description: 'Classement A/B/C selon grille multicritères API-ZF. Arrêté de classement = acte de référence. Mapping NIF déclenche application automatique. Alerte J-90.',
    circuitEtapes: ['Dépôt API-ZF / Ministère', 'Évaluation grille classement', 'Arrêté Ministère compétent', 'Mapping NIF OTR (triple)', 'Application avantages', 'Suivi engagements', 'Alerte J-90'],
    nextStep: 'Dossier transmis à l\'API-ZF pour évaluation selon la grille de classement Code des Investissements.',
  },
  convention_miniere: {
    label: 'Convention minière / pétrolière',
    alertType: 'error', icon: 'mdi-pickaxe',
    processus: '5', autorite: 'Conseil des ministres + Assemblée nationale',
    systeme: 'E-TAX + SYDONIAWORLD + GESTEXO (selon phase) → DGMG + OASE',
    description: 'Processus le plus complexe. 4 niveaux d\'autorité. Avantages différenciés par phase. Clauses de stabilisation fiscale. Alerte J-90 avant fin de chaque phase.',
    circuitEtapes: ['Demande permis DGMG', 'Négociation convention État/Opérateur', 'Approbation Conseil des ministres', 'Ratification AN (si requis)', 'Publication JORT', 'Application par phase (OTR)', 'Suivi DGMG', 'Alerte J-90 fin de phase'],
    nextStep: 'Dossier transmis à la DGMG pour démarrage de la négociation de la convention.',
  },
  accord_siege: {
    label: 'Accord de siège',
    alertType: 'info', icon: 'mdi-flag',
    processus: '6', autorite: 'MAE → OTR (CI + CDDI)',
    systeme: 'E-TAX (IRPP/TVA) + SYDONIAWORLD/GESTEXO (franchises douanières)',
    description: 'Périmètre : 298 mesures MRD strict / 398 cartographie élargie. Bases juridiques multiples. Mise à jour annuelle obligatoire personnel et immatriculations. Alerte J-90.',
    circuitEtapes: ['Base juridique multiple', 'Notification MAE → OTR/OASE', 'Application CI (TVA/IRPP)', 'Application CDDI (franchises)', 'Suivi annuel MAE + OTR', 'Alerte J-90 expiration'],
    nextStep: 'Dossier notifié au MAE pour transmission à l\'OTR. Base juridique vérifiée.',
  },
  sectorielle: {
    label: 'Exonération sectorielle',
    alertType: 'info', icon: 'mdi-domain',
    processus: '1', autorite: 'CI / Direction → E-TAX',
    systeme: 'E-TAX → Base DLFC → DAS → SIGFiP → DGBF',
    description: 'Exonération sectorielle sur base légale spécifique (Agriculture, Mines, Énergie, Numérique). Circuit standard CI / OTR.',
    circuitEtapes: ['Dépôt CI', 'Vérif. base légale sectorielle', 'Validation DGE/DME', 'Attestation CI', 'Exécution guichet', 'Suivi E-TAX', 'Reporting DGBF'],
    nextStep: 'Dossier transmis au CI pour vérification de la base légale sectorielle applicable.',
  },
}
const regimeConfig = computed(() => regimeConfigs[selectedType.value] || null)

// ── Bénéficiaire ────────────────────────────────────────────────────────────
const naturesJuridiques = [
  { value: 'lucratif',    title: 'Entreprise / Entité à but lucratif' },
  { value: 'nonlucratif', title: 'Entité à but non lucratif' },
  { value: 'public',      title: 'Établissement public / Projet de développement' },
]
const benefForm = ref({
  rccm: 'TG-LOM-2019-B-1234', nif: 'TG-001-2019-B', raisonSociale: 'TOGO STEEL SARL',
  formeJuridique: 'SARL', adresse: 'Zone Industrielle, Lomé',
  secteur: 'Industrie manufacturière', natureJuridique: 'lucratif',
})
const natureLabel = computed(() => naturesJuridiques.find(n => n.value === benefForm.value.natureJuridique)?.title || 'Non défini')
const natureDescription = computed(() => {
  const descs: Record<string, string> = {
    lucratif: '7 pièces requises : quitus fiscal, états financiers 3 ans, immatriculation, DAS, PV CA/AG, quitus social, fiche agréments si applicable',
    nonlucratif: '4 pièces requises : états financiers 3 ans, immatriculation, DAS 3 ans, quitus social',
    public: '2 pièces requises : attestation régularité fiscale, DAS 3 ans (dossier allégé)',
  }
  return descs[benefForm.value.natureJuridique] || ''
})
const secteurs = [
  'Agriculture et pêche',
  'Commerce',
  'Éducation',
  'Énergie et eau',
  'Industrie manufacturière',
  'Mines et hydrocarbures',
  'Numérique et télécom',
  'Santé',
  'Services financiers',
  'Transport et logistique',
]

// ── Détails opération ───────────────────────────────────────────────────────
const details = ref({ description: '', montant: '', duree: '', dateDebut: '' })
const evaluation = ref({ investissements: '', emploisNationaux: '', emploisExpatries: '', masseSalariale: '', caLocal: '', caExport: '', valeurAjoutee: '', consoEauElectricite: '', prelevementsOTR: '', contributionPIB: '', autresChargesObligatoires: '' })

// Franchise douanière fields
const douaFields = ref({ numDeclaration: 'SW-2026-00485', bureauDouane: '', modeTransport: 'Maritime (Bill of Lading)', typeOperation: 'Importation normale', descMarchandise: '', valeurFOB: '', droitsExoneres: '', refConnaissement: '', refEtatModeleA: '', transitaire: '' })

// Zone Franche fields
const zonesZF = [
  { value: 'ZFI-ATAKPAME', label: 'ZFI Atakpamé — Plateaux' },
  { value: 'ZFI-LOME', label: 'ZFI Lomé — Plateforme Industrielle' },
  { value: 'ZFI-LOME-NORD', label: 'ZFI Lomé Nord — Agbalépédogan' },
  { value: 'ZES-KARA', label: 'ZES Kara — Plateaux Industriels' },
  { value: 'ZES-SOKODE', label: 'ZES Sokodé — Centrale' },
]
const zfFields = ref({ typeAgrement: '', zone: '', montantInvest: '', emploisProjetes: '', tauxExport: '', secteurZF: '', planAffaires: '' })

// Code des Investissements fields
const zonesImplantation = [
  { value: 'Z1', label: 'Zone 1 — Grand Lomé (avantages de base)' },
  { value: 'Z2', label: 'Zone 2 — Autres villes maritimes' },
  { value: 'Z3', label: 'Zone 3 — Préfectures Plateaux / Centrale' },
  { value: 'Z4', label: 'Zone 4 — Préfectures Kara' },
  { value: 'Z5', label: 'Zone 5 — Préfectures Savanes (avantages majorés)' },
]
const ciFields = ref({ zoneImplantation: '', regimeClassement: '', montantCAPEX: '', emploisCreer: '', dureeAgrement: '', secteur: '', programmeInvest: '' })

// Convention Minière fields
const phasesConvention = [
  { value: 'recherche',     label: 'Phase Recherche (équipements, matériels — CDDI)' },
  { value: 'construction',  label: 'Phase Construction (équipements, imports — CDDI)' },
  { value: 'exploitation',  label: 'Phase Exploitation (IS, IRPP — CI)' },
]
const mineFields = ref({ typeSecteur: 'Minier', autoriteCompetente: 'DGMG (Mines)', typePermis: '', phase: '', mineral: '', zoneGeo: '', dureePhase: '', capexPhase: '', emploisLocaux: '', dateDebutPhase: '', clauseStabilisation: '', refPermis: '' })

// Accord de siège fields
const typesOrganisation = [
  'Ambassade',
  'Consulat',
  'Organisation internationale (OI)',
  'ONG reconnue',
  'Représentation diplomatique',
]
const basesJuridiques = [
  { value: 'Accord ONU-Togo 1968',         label: 'Accord de base ONU–Togo de 1968 et accords multilatéraux', hint: 'Organisations du système des Nations Unies' },
  { value: 'CGI dispositions spécifiques', label: 'CGI — dispositions spécifiques OI / Ambassades / ONG', hint: 'Indépendamment de tout accord de siège' },
  { value: 'Convention bilatérale',        label: 'Convention bilatérale spécifique', hint: 'Peut étendre ou restreindre le régime de droit commun' },
  { value: 'Convention de Vienne',         label: 'Convention de Vienne sur les relations diplomatiques', hint: 'Immunités et privilèges de droit international' },
]
const avantagesSiege = [
  { value: 'Franchise_douaniere',   label: 'Franchise douanière — matériels et équipements (CDDI → SYDONIA + GESTEXO)', hint: 'Véhicules diplomatiques et équipements officiels' },
  { value: 'IRPP_personnel',        label: 'Exonération IRPP personnel de l\'organisation (OTR / CI → E-TAX)', hint: 'Personnels non-résidents' },
  { value: 'TVA_achats_locaux',     label: 'Exonération TVA sur achats locaux (OTR / CI → E-TAX)',          hint: 'Remboursement ou exonération directe selon base juridique' },
]
const siegeFields = ref({ typeOrganisation: '', representant: '', refAccord: '', dateAccord: '', basesJuridiques: [] as string[], avantages: [] as string[], nbPersonnel: '', nbVehicules: '', dateDebutAccord: '', dateFinAccord: '' })

// ── Documents dynamiques ────────────────────────────────────────────────────
const anneeN1 = new Date().getFullYear() - 1
const anneeN2 = new Date().getFullYear() - 2
const anneeN3 = new Date().getFullYear() - 3

type DocStatus = 'obligatoire' | 'optionnel' | 'cache'
type DocCtx = {
  selectedType: string; natureJuridique: string
  ciOperationType: string; hasAgrement: boolean
  mineStep: string; zfTypeAgrement: string
  siegeTypeOrg: string; siegeAvantages: string[]
}
type DocResult = { status: DocStatus; reason?: string }
type DocFile = { name: string; metadata: Record<string, string> }
type Doc = {
  id: string; label: string; uploaded: boolean; fileName: string; groupe: string
  obligatoire?: boolean; metadata?: Record<string, string>
  condition?: (ctx: DocCtx) => DocResult
  files?: DocFile[]
}

const docsLucratif = ref<Doc[]>([
  { id: 'l1',  label: 'Quitus fiscal OTR',                                          uploaded: false, fileName: '', groupe: 'Critères éliminatoires' },
  { id: 'l2a', label: `Récépissé états financiers — exercice ${anneeN1} (N-1)`,     uploaded: false, fileName: '', groupe: 'États financiers' },
  { id: 'l2b', label: `Récépissé états financiers — exercice ${anneeN2} (N-2)`,     uploaded: false, fileName: '', groupe: 'États financiers' },
  { id: 'l2c', label: `Récépissé états financiers — exercice ${anneeN3} (N-3)`,     uploaded: false, fileName: '', groupe: 'États financiers' },
  { id: 'l3',  label: 'Carte d\'immatriculation fiscale en cours de validité',      uploaded: true,  fileName: 'NIF_TogoSteel.pdf', groupe: 'Critères éliminatoires' },
  { id: 'l4a', label: `Récépissé DAS — exercice ${anneeN1} (N-1)`,                 uploaded: false, fileName: '', groupe: 'DAS' },
  { id: 'l4b', label: `Récépissé DAS — exercice ${anneeN2} (N-2)`,                 uploaded: false, fileName: '', groupe: 'DAS' },
  { id: 'l4c', label: `Récépissé DAS — exercice ${anneeN3} (N-3)`,                 uploaded: false, fileName: '', groupe: 'DAS' },
  { id: 'l5',  label: 'PV dernière réunion CA / AG',                                uploaded: false, fileName: '', groupe: 'Critères éliminatoires' },
  { id: 'l6',  label: 'Quitus social',                                              uploaded: false, fileName: '', groupe: 'Critères éliminatoires' },
  { id: 'l7',  label: 'Fiche signalétique de suivi des agréments — dûment remplie et visée par le Ministère de tutelle', uploaded: false, fileName: '', groupe: 'Critères éliminatoires',
    condition: (ctx) => ctx.hasAgrement ? { status: 'obligatoire' } : { status: 'cache' } },
  { id: 'l8',  label: 'RCCM (copie certifiée)',                                     uploaded: true,  fileName: 'RCCM_TogoSteel.pdf', groupe: 'Critères éliminatoires' },
  // Pièces transversales CI §1.1.2.3 MRD 2024
  { id: 'l_t1', label: 'Base légale invoquée (article CGI / texte habilitant)',                                          uploaded: false, fileName: '', groupe: 'Pièces transversales CI' },
  { id: 'l_t2', label: "Demande d'attestation d'exonération (courrier officiel)",                                        uploaded: false, fileName: '', groupe: 'Pièces transversales CI' },
  { id: 'l_t3', label: "Lettre d'exonération fiscale annuelle",                                                          uploaded: false, fileName: '', groupe: 'Pièces transversales CI' },
  { id: 'l_t4', label: 'État modèle A (exonérations de carburant)',                                                      uploaded: false, fileName: '', groupe: 'Pièces transversales CI',
    condition: (ctx) => ctx.ciOperationType === 'carburant' ? { status: 'obligatoire' } : { status: 'cache' } },
  { id: 'l_t5', label: 'Factures commerciales (fiche 34 — base légale + réf. attestation + NIF ≤ 3 ans)',                uploaded: false, fileName: '', groupe: 'Pièces transversales CI',
    condition: (ctx) => ctx.ciOperationType === 'general' ? { status: 'obligatoire' } : { status: 'optionnel', reason: 'Requise si opération facturée' } },
  { id: 'l_t6', label: "Actes notariés ou contrats (droits d'enregistrement)",                                           uploaded: false, fileName: '', groupe: 'Pièces transversales CI',
    condition: (ctx) => ctx.ciOperationType === 'enregistrement' ? { status: 'obligatoire' } : { status: 'cache' } },
  { id: 'l_t7', label: 'Relevés bancaires (exonérations de la TAF)',                                                     uploaded: false, fileName: '', groupe: 'Pièces transversales CI',
    condition: (ctx) => ctx.ciOperationType === 'taf' ? { status: 'obligatoire' } : { status: 'cache' } },
])
const docsNonLucratif = ref<Doc[]>([
  { id: 'n1a', label: `Récépissé états financiers — exercice ${anneeN1} (N-1)`,     uploaded: false, fileName: '', groupe: 'États financiers' },
  { id: 'n1b', label: `Récépissé états financiers — exercice ${anneeN2} (N-2)`,     uploaded: false, fileName: '', groupe: 'États financiers' },
  { id: 'n1c', label: `Récépissé états financiers — exercice ${anneeN3} (N-3)`,     uploaded: false, fileName: '', groupe: 'États financiers' },
  { id: 'n2',  label: 'Carte d\'immatriculation fiscale',                           uploaded: true,  fileName: 'NIF_TogoSteel.pdf', groupe: 'Critères éliminatoires' },
  { id: 'n3a', label: `Récépissé DAS — exercice ${anneeN1} (N-1)`,                 uploaded: false, fileName: '', groupe: 'DAS' },
  { id: 'n3b', label: `Récépissé DAS — exercice ${anneeN2} (N-2)`,                 uploaded: false, fileName: '', groupe: 'DAS' },
  { id: 'n3c', label: `Récépissé DAS — exercice ${anneeN3} (N-3)`,                 uploaded: false, fileName: '', groupe: 'DAS' },
  { id: 'n4',  label: 'Quitus social',                                              uploaded: false, fileName: '', groupe: 'Critères éliminatoires' },
  { id: 'n5',  label: 'RCCM (copie certifiée)',                                     uploaded: true,  fileName: 'RCCM_TogoSteel.pdf', groupe: 'Critères éliminatoires' },
  { id: 'n7',  label: 'Fiche signalétique de suivi des agréments — dûment remplie et visée par le Ministère de tutelle', uploaded: false, fileName: '', groupe: 'Critères éliminatoires',
    condition: (ctx) => ctx.hasAgrement ? { status: 'obligatoire' } : { status: 'cache' } },
  // Pièces transversales CI §1.1.2.3 MRD 2024
  { id: 'n_t1', label: 'Base légale invoquée (article CGI / texte habilitant)',                                          uploaded: false, fileName: '', groupe: 'Pièces transversales CI' },
  { id: 'n_t2', label: "Demande d'attestation d'exonération (courrier officiel)",                                        uploaded: false, fileName: '', groupe: 'Pièces transversales CI' },
  { id: 'n_t3', label: "Lettre d'exonération fiscale annuelle",                                                          uploaded: false, fileName: '', groupe: 'Pièces transversales CI' },
  { id: 'n_t4', label: 'État modèle A (exonérations de carburant)',                                                      uploaded: false, fileName: '', groupe: 'Pièces transversales CI',
    condition: (ctx) => ctx.ciOperationType === 'carburant' ? { status: 'obligatoire' } : { status: 'cache' } },
  { id: 'n_t5', label: 'Factures commerciales (fiche 34 — base légale + réf. attestation + NIF ≤ 3 ans)',                uploaded: false, fileName: '', groupe: 'Pièces transversales CI',
    condition: (ctx) => ctx.ciOperationType === 'general' ? { status: 'obligatoire' } : { status: 'optionnel', reason: 'Requise si opération facturée' } },
  { id: 'n_t6', label: "Actes notariés ou contrats (droits d'enregistrement)",                                           uploaded: false, fileName: '', groupe: 'Pièces transversales CI',
    condition: (ctx) => ctx.ciOperationType === 'enregistrement' ? { status: 'obligatoire' } : { status: 'cache' } },
  { id: 'n_t7', label: 'Relevés bancaires (exonérations de la TAF)',                                                     uploaded: false, fileName: '', groupe: 'Pièces transversales CI',
    condition: (ctx) => ctx.ciOperationType === 'taf' ? { status: 'obligatoire' } : { status: 'cache' } },
])
const docsPublic = ref<Doc[]>([
  { id: 'p1',  label: 'Attestation de régularité fiscale',                           uploaded: false, fileName: '', groupe: 'Critères éliminatoires' },
  { id: 'p2a', label: `Récépissé DAS — exercice ${anneeN1} (N-1)`,                 uploaded: false, fileName: '', groupe: 'DAS' },
  { id: 'p2b', label: `Récépissé DAS — exercice ${anneeN2} (N-2)`,                 uploaded: false, fileName: '', groupe: 'DAS' },
  { id: 'p2c', label: `Récépissé DAS — exercice ${anneeN3} (N-3)`,                 uploaded: false, fileName: '', groupe: 'DAS' },
  { id: 'p3',  label: 'RCCM / Référence administrative',                            uploaded: true,  fileName: 'RCCM_TogoSteel.pdf', groupe: 'Critères éliminatoires' },
  // Pièces transversales CI §1.1.2.3 MRD 2024
  { id: 'p_t1', label: 'Base légale invoquée (article CGI / texte habilitant)',                                          uploaded: false, fileName: '', groupe: 'Pièces transversales CI' },
  { id: 'p_t2', label: "Demande d'attestation d'exonération (courrier officiel)",                                        uploaded: false, fileName: '', groupe: 'Pièces transversales CI' },
  { id: 'p_t3', label: "Lettre d'exonération fiscale annuelle",                                                          uploaded: false, fileName: '', groupe: 'Pièces transversales CI' },
  { id: 'p_t5', label: 'Factures commerciales (fiche 34 — base légale + réf. attestation + NIF ≤ 3 ans)',                uploaded: false, fileName: '', groupe: 'Pièces transversales CI',
    condition: (ctx) => ctx.ciOperationType === 'general' ? { status: 'obligatoire' } : { status: 'optionnel', reason: 'Requise si opération facturée' } },
])

// Franchise douanière — pool complet, filtré dynamiquement dans dynamicDocs
const docsDouaniere = ref<Doc[]>([
  { id: 'dou1',  label: 'Base légale invoquée (article CGI / texte habilitant)',                   uploaded: false, fileName: '', groupe: 'Pièces obligatoires CDDI' },
  { id: 'dou2',  label: 'État modèle A (contribuables)',                                           uploaded: false, fileName: '', groupe: 'Pièces obligatoires CDDI' },
  { id: 'dou3',  label: 'Franchise (OI / représentations diplomatiques)',                          uploaded: false, fileName: '', groupe: 'Pièces obligatoires CDDI' },
  { id: 'dou4',  label: 'Factures commerciales (règle fiche 34 — base légale + réf. attestation + NIF)', uploaded: false, fileName: '', groupe: 'Documents commerciaux' },
  { id: 'dou5',  label: 'Bill of Lading / Connaissement (maritime)',                               uploaded: false, fileName: '', groupe: 'Documents de transport' },
  { id: 'dou6',  label: 'Lettre de Transport Aérien — LTA (aérien)',                              uploaded: false, fileName: '', groupe: 'Documents de transport' },
  { id: 'dou7',  label: 'Autorisation d\'importation',                                            uploaded: false, fileName: '', groupe: 'Autorisations', obligatoire: false },
  { id: 'dou8',  label: 'Carte consulaire (corps diplomatique)',                                   uploaded: false, fileName: '', groupe: 'Autorisations diplomatiques' },
  { id: 'dou9',  label: 'NIF du bénéficiaire',                                                    uploaded: false, fileName: '', groupe: 'Pièces obligatoires CDDI' },
])

// Zone Franche (Processus 3 API-ZF)
const docsZoneFranche = ref<Doc[]>([
  { id: 'zf1', label: 'Formulaire de demande d\'agrément Zone Franche (API-ZF)',    uploaded: false, fileName: '', groupe: 'Demande API-ZF' },
  { id: 'zf2', label: 'Plan d\'affaires / Étude de faisabilité',                    uploaded: false, fileName: '', groupe: 'Projet' },
  { id: 'zf3', label: 'Plan de financement détaillé',                               uploaded: false, fileName: '', groupe: 'Projet' },
  { id: 'zf4', label: 'Attestation de disponibilité des fonds / garantie bancaire', uploaded: false, fileName: '', groupe: 'Projet' },
  { id: 'zf5', label: 'RCCM (copie certifiée)',                                     uploaded: true,  fileName: 'RCCM_TogoSteel.pdf', groupe: 'Identité juridique' },
  { id: 'zf6', label: 'NIF (carte d\'immatriculation fiscale)',                     uploaded: true,  fileName: 'NIF_TogoSteel.pdf', groupe: 'Identité juridique' },
  { id: 'zf7', label: 'Statuts de la société (copie certifiée)',                    uploaded: false, fileName: '', groupe: 'Identité juridique' },
  { id: 'zf8',  label: 'Programme emplois et ressortissants nationaux',              uploaded: false, fileName: '', groupe: 'Engagements' },
  { id: 'zf9',  label: "Étude d'impact environnemental et social (EIES)",           uploaded: false, fileName: '', groupe: 'Conformité',
    condition: (ctx) => ctx.zfTypeAgrement.includes('éfinitif') ? { status: 'obligatoire' } : { status: 'cache' } },
  { id: 'zf_fs', label: "Fiche signalétique de suivi des agréments API-ZF — dûment remplie et visée par l'API-ZF / Ministère de tutelle", uploaded: false, fileName: '', groupe: 'Engagements',
    condition: (ctx) => ctx.zfTypeAgrement.includes('éfinitif') ? { status: 'obligatoire' } : { status: 'optionnel', reason: "Obligatoire dès l'agrément définitif" } },
])

// Code des Investissements (Processus 4 API-ZF)
const docsCodeInvest = ref<Doc[]>([
  { id: 'ci1', label: 'Programme d\'investissement détaillé (CAPEX, phases)',       uploaded: false, fileName: '', groupe: 'Programme CI' },
  { id: 'ci2', label: 'Business plan avec projections financières (3 ans)',          uploaded: false, fileName: '', groupe: 'Programme CI' },
  { id: 'ci3', label: 'Plan d\'emplois et qualification des postes',                 uploaded: false, fileName: '', groupe: 'Programme CI' },
  { id: 'ci4', label: 'Attestation de capacité financière / garantie bancaire',     uploaded: false, fileName: '', groupe: 'Financement' },
  { id: 'ci5', label: 'RCCM (copie certifiée)',                                     uploaded: true,  fileName: 'RCCM_TogoSteel.pdf', groupe: 'Identité juridique' },
  { id: 'ci6', label: 'NIF (carte d\'immatriculation fiscale)',                     uploaded: true,  fileName: 'NIF_TogoSteel.pdf', groupe: 'Identité juridique' },
  { id: 'ci7', label: 'Quitus fiscal OTR',                                          uploaded: false, fileName: '', groupe: 'Critères éliminatoires' },
  { id: 'ci8',  label: `Récépissé DAS — exercice ${anneeN1} (N-1)`,                uploaded: false, fileName: '', groupe: 'DAS' },
  { id: 'ci9',  label: `Récépissé DAS — exercice ${anneeN2} (N-2)`,                uploaded: false, fileName: '', groupe: 'DAS' },
  { id: 'ci_fs', label: 'Fiche signalétique de suivi des agréments — dûment remplie et visée par le Ministère compétent (arrêté de classement obligatoire)', uploaded: false, fileName: '', groupe: 'Critères éliminatoires' },
])

// Convention Minière / Pétrolière (Processus 5 DGMG)
const docsConventionMiniere = ref<Doc[]>([
  { id: 'min1', label: 'Demande de permis de recherche ou d\'exploitation',          uploaded: false, fileName: '', groupe: 'Permis DGMG' },
  { id: 'min2', label: 'Plan de travaux et programme d\'investissement',             uploaded: false, fileName: '', groupe: 'Programme technique' },
  { id: 'min3', label: 'Preuve de capacité financière (garantie bancaire / bilan)',  uploaded: false, fileName: '', groupe: 'Capacité financière' },
  { id: 'min4', label: 'Étude d\'impact environnemental et social (EIES)',           uploaded: false, fileName: '', groupe: 'Conformité' },
  { id: 'min5', label: 'Certificat de bonne réputation (pays d\'origine)',           uploaded: false, fileName: '', groupe: 'Identité opérateur' },
  { id: 'min6', label: 'Documents corporatifs de l\'opérateur (statuts, RCCM)',     uploaded: true,  fileName: 'RCCM_Operateur.pdf', groupe: 'Identité opérateur' },
  { id: 'min7', label: 'Convention minière / pétrolière négociée (projet)',          uploaded: false, fileName: '', groupe: 'Convention',
    condition: (ctx) => ['negociation', 'approbation', 'execution'].includes(ctx.mineStep)
      ? { status: 'obligatoire' }
      : { status: 'optionnel', reason: "Requise à partir de l'étape négociation DGMG" } },
  { id: 'min8', label: 'Acte Conseil des ministres (après négociation)',             uploaded: false, fileName: '', groupe: 'Actes institutionnels',
    condition: (ctx) => ['approbation', 'execution'].includes(ctx.mineStep) ? { status: 'obligatoire' } : { status: 'cache' } },
  { id: 'min9', label: 'Acte de ratification Assemblée nationale (si requis)',       uploaded: false, fileName: '', groupe: 'Actes institutionnels',
    condition: () => ({ status: 'optionnel', reason: 'Requise pour certaines conventions selon Code minier/pétrolier' }) },
])

// Accord de siège (Processus 6 MAE)
const docsAccordSiege = ref<Doc[]>([
  { id: 'as1', label: 'Accord de siège / Convention internationale (copie certifiée)', uploaded: false, fileName: '', groupe: 'Base juridique MAE' },
  { id: 'as2', label: 'Note verbale du Ministère des Affaires Étrangères',           uploaded: false, fileName: '', groupe: 'Base juridique MAE' },
  { id: 'as3', label: 'Liste nominative du personnel bénéficiaire',                  uploaded: false, fileName: '', groupe: 'Listes annuelles' },
  { id: 'as4', label: 'Registre des immatriculations de véhicules diplomatiques/officiels', uploaded: false, fileName: '', groupe: 'Listes annuelles' },
  { id: 'as5', label: 'Carte consulaire des membres du corps diplomatique',          uploaded: false, fileName: '', groupe: 'Pièces diplomatiques',
    condition: (ctx) => ctx.siegeTypeOrg.includes('Ambassade') || ctx.siegeTypeOrg.includes('Consulat') || ctx.siegeTypeOrg.includes('diplomatique')
      ? { status: 'obligatoire' }
      : { status: 'cache' } },
  { id: 'as6', label: 'Accord bilatéral spécifique',                                uploaded: false, fileName: '', groupe: 'Base juridique MAE',
    condition: () => ({ status: 'optionnel', reason: 'Convention bilatérale en complément des bases multilatérales' }) },
  { id: 'as7', label: 'Déclaration des avantages demandés (TVA/IRPP CI + Franchises CDDI)', uploaded: false, fileName: '', groupe: 'Avantages demandés' },
])

// Computed : sélection ET filtrage des docs selon le régime ET les choix de l'étape 3
const dynamicDocs = computed((): Doc[] => {

  // ── CDDI : filtrage selon typeOperation ET modeTransport ────────────────
  if (selectedType.value === 'douaniere') {
    const op  = douaFields.value.typeOperation || ''
    const tr  = douaFields.value.modeTransport || ''
    const isDip    = op.includes('diplomatique') || op.includes('OI / ONG')
    const isZF     = op.includes('Zone Franche')
    const isCI     = op.includes('Investissements')
    const isMine   = op.includes('minière')
    const isMar    = tr.includes('Maritime') || tr.includes('Bill of Lading')
    const isAer    = tr.includes('Aérien') || tr.includes('LTA')

    return docsDouaniere.value.filter(d => {
      // État modèle A : contribuables (pas diplomatique/OI)
      if (d.id === 'dou2' && isDip)  return false
      // Franchise OI : seulement pour diplomatique/OI
      if (d.id === 'dou3' && !isDip) return false
      // BL : seulement si transport maritime ou non précisé
      if (d.id === 'dou5' && isAer && !isMar) return false
      // LTA : seulement si transport aérien ou non précisé
      if (d.id === 'dou6' && isMar && !isAer) return false
      // Carte consulaire : seulement diplomatique
      if (d.id === 'dou8' && !isDip) return false
      return true
    })
  }

  // ── Zone Franche : filtrage par conditions ──────────────────────────────
  if (selectedType.value === 'zone_franche') {
    const regime = (ciFields.value.regimeClassement || '').charAt(8)
    return filterCacheDocs(docsZoneFranche.value)
  }

  // ── Code des Investissements : filtrage selon régime A/B/C/D ────────────
  if (selectedType.value === 'code_investissement') {
    const regime = (ciFields.value.regimeClassement || '').charAt(8) // 'A','B','C','D'
    return docsCodeInvest.value.filter(d => {
      // Business plan non obligatoire pour Régime A (déclaration simple)
      if (d.id === 'ci2' && regime === 'A') return false
      return true
    })
  }

  // ── Convention minière : filtrage par conditions ────────────────────────
  if (selectedType.value === 'convention_miniere') {
    return filterCacheDocs(docsConventionMiniere.value)
  }

  // ── Accord de siège : filtrage par conditions ────────────────────────────
  if (selectedType.value === 'accord_siege') {
    return filterCacheDocs(docsAccordSiege.value)
  }

  // ── CI standard : selon nature juridique + conditions ──────────────────
  const map: Record<string, Doc[]> = {
    lucratif: docsLucratif.value, nonlucratif: docsNonLucratif.value, public: docsPublic.value,
  }
  return filterCacheDocs(map[benefForm.value.natureJuridique] || docsLucratif.value)
})

const docCategoryLabel = computed(() => {
  if (selectedType.value === 'douaniere') return 'Pièces CDDI — Processus 2'
  if (selectedType.value === 'zone_franche') return 'Dossier d\'agrément Zone Franche — API-ZF'
  if (selectedType.value === 'code_investissement') return 'Dossier Code des Investissements — API-ZF'
  if (selectedType.value === 'convention_miniere') return 'Dossier Convention minière — DGMG'
  if (selectedType.value === 'accord_siege') return 'Dossier Accord de siège — MAE/OTR'
  return `Catégorie : ${natureLabel.value}`
})

const docGroupes = computed(() => {
  const groupMap = new Map<string, Doc[]>()
  for (const doc of dynamicDocs.value) {
    const g = doc.groupe || 'Autres'
    if (!groupMap.has(g)) groupMap.set(g, [])
    groupMap.get(g)!.push(doc)
  }
  return Array.from(groupMap.entries()).map(([nom, docs]) => ({ nom, docs }))
})

function groupeIcon(nom: string): string {
  if (nom.includes('financier') || nom.includes('financ')) return 'mdi-file-chart'
  if (nom.includes('DAS') || nom.includes('emploi') || nom.includes('personnel')) return 'mdi-account-group'
  if (nom.includes('éliminatoire') || nom.includes('obligatoire')) return 'mdi-shield-check'
  if (nom.includes('transport')) return 'mdi-truck'
  if (nom.includes('diplomatique') || nom.includes('MAE') || nom.includes('siège')) return 'mdi-flag'
  if (nom.includes('permis') || nom.includes('DGMG') || nom.includes('minier')) return 'mdi-pickaxe'
  if (nom.includes('institution') || nom.includes('acte')) return 'mdi-bank'
  if (nom.includes('juridique')) return 'mdi-gavel'
  if (nom.includes('identité')) return 'mdi-card-account-details'
  if (nom.includes('contrat') || nom.includes('convention')) return 'mdi-file-certificate'
  if (nom.includes('conformité')) return 'mdi-leaf'
  return 'mdi-folder'
}

const uploadedCount = computed(() => dynamicDocs.value.filter(d => d.uploaded).length)

// ── Moteur de règles documentaires ──────────────────────────────────────────
const docCtx = computed<DocCtx>(() => ({
  selectedType:    selectedType.value,
  natureJuridique: benefForm.value.natureJuridique,
  ciOperationType: ciOperationType.value,
  hasAgrement:     hasAgrement.value,
  mineStep:        mineFields.value.phase || '',
  zfTypeAgrement:  zfFields.value.typeAgrement || '',
  siegeTypeOrg:    siegeFields.value.typeOrganisation || '',
  siegeAvantages:  siegeFields.value.avantages,
}))

function docStatus(doc: Doc): DocStatus {
  if (doc.condition) return doc.condition(docCtx.value).status
  return doc.obligatoire === false ? 'optionnel' : 'obligatoire'
}
function docReason(doc: Doc): string {
  if (doc.condition) return doc.condition(docCtx.value).reason ?? ''
  return ''
}
function filterCacheDocs(docs: Doc[]): Doc[] {
  return docs.filter(d => docStatus(d) !== 'cache')
}

// ── N bases juridiques pour accord de siège ─────────────────────────────────
function addBaseJuridiqueAS() {
  const count = docsAccordSiege.value.filter(d => d.id.startsWith('as1')).length + 1
  const insertAt = docsAccordSiege.value.findIndex(d => d.id === 'as2')
  docsAccordSiege.value.splice(insertAt, 0, {
    id: `as1_${count}`, label: `Base juridique additionnelle #${count}`,
    uploaded: false, fileName: '', groupe: 'Base juridique MAE',
  })
}

// ── Tabs documents ───────────────────────────────────────────────────────────
const CI_ELIMINATOIRE_GROUPS = ['États financiers', 'DAS', 'Critères éliminatoires']

const docTabs = computed(() => {
  if (isStandardCI.value) {
    const eliminatoire = dynamicDocs.value.filter(d => CI_ELIMINATOIRE_GROUPS.includes(d.groupe || ''))
    const transversaux  = dynamicDocs.value.filter(d => d.groupe === 'Pièces transversales CI')
    return [
      { key: 'eliminatoire', label: 'Critères éliminatoires', icon: 'mdi-shield-check',   subtitle: '§1.1.2.1', docs: eliminatoire },
      { key: 'transversaux',  label: 'Pièces transversales CI', icon: 'mdi-file-multiple', subtitle: '§1.1.2.3', docs: transversaux },
    ]
  }
  // Pour les autres régimes : 1 tab par groupe existant
  return docGroupes.value.map(g => ({
    key: g.nom,
    label: g.nom,
    icon: groupeIcon(g.nom),
    subtitle: '',
    docs: g.docs,
  }))
})

const docTabActive = ref<string>('')
watch(docTabs, (tabs) => {
  if (!tabs.find(t => t.key === docTabActive.value)) {
    docTabActive.value = tabs[0]?.key ?? ''
  }
}, { immediate: true })

// ── Modal dépôt document ────────────────────────────────────────────────────
const docModalOpen   = ref(false)
const docModalTarget = ref<Doc | null>(null)

function openDocModal(doc: Doc) {
  docModalTarget.value = doc
  docModalOpen.value   = true
}

function onDocConfirmed(doc: Doc, fileName: string, metadata: Record<string, string>, files?: DocFile[]) {
  // Retrouver le document réactif dans le bon tableau et le mettre à jour
  const allPools = [
    docsLucratif, docsNonLucratif, docsPublic, docsDouaniere,
    docsZoneFranche, docsCodeInvest, docsConventionMiniere, docsAccordSiege,
  ]
  for (const pool of allPools) {
    const found = pool.value.find(d => d.id === doc.id)
    if (found) {
      found.uploaded = true
      found.fileName = fileName
      if (files && files.length > 0) {
        found.files = files
      } else {
        found.metadata = Object.fromEntries(
          Object.entries(metadata).filter(([, v]) => v && v !== 'undefined')
        )
      }
      break
    }
  }
}
</script>
