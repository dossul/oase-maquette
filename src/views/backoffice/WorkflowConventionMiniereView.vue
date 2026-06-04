<template>
  <div>
    <PageHeader
      title="Workflow Convention Minière / Pétrolière — Processus n° 5"
      subtitle="DGMG → Conseil des ministres → AN → OTR — avantages différenciés par phase, alerte J-90"
      icon="mdi-pickaxe"
    >
      <template #actions>
        <v-chip color="error" variant="tonal" size="small" prepend-icon="mdi-eye-lock-outline">Diffusion confidentielle</v-chip>
        <ExportButton label="Exporter le circuit" policy-label="Diffusion confidentielle" restriction-note="Export réservé aux profils DGMG / OTR / MEF habilités" :disabled-formats="['excel']" class="ms-2" @export="() => {}" />
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <!-- Parcours normé -->
    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Parcours normé — Processus n° 5 (DGMG)</v-card-title>
      <v-alert type="warning" variant="tonal" rounded="lg" density="compact" class="mx-4 mb-3">
        Processus le plus complexe de l'ensemble des circuits. <strong>4 niveaux d'autorité successifs</strong>. Durée pouvant excéder plusieurs années.
      </v-alert>
      <v-stepper model-value="4" alt-labels>
        <v-stepper-header>
          <v-stepper-item title="Entrée" subtitle="Permis DGMG" value="1" />
          <v-stepper-item title="Étape 1" subtitle="Négociation convention" value="2" />
          <v-stepper-item title="Étape 2" subtitle="Conseil des ministres" value="3" />
          <v-stepper-item title="Étape 3" subtitle="Ratification AN + JORT" value="4" color="warning" />
          <v-stepper-item title="Exécution" subtitle="OTR par phase" value="5" />
          <v-stepper-item title="Suivi" subtitle="DGMG / OASE" value="6" />
          <v-stepper-item title="Alerte" subtitle="J-90 fin phase / expiration" value="7" />
        </v-stepper-header>
      </v-stepper>
    </v-card>

    <v-row>
      <v-col cols="12" md="8">

        <!-- Matrice détaillée -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Matrice détaillée — Convention extractive</v-card-title>
          <v-data-table :headers="processHeaders" :items="processMatrix" hover>
            <template #item.niveau="{ item }">
              <v-chip :color="niveauColor(item.niveau)" size="x-small" variant="tonal">{{ item.niveau }}</v-chip>
            </template>
          </v-data-table>
        </v-card>

        <!-- Avantages par phase -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Avantages différenciés par phase (Exécution)</v-card-title>
          <v-card-text class="pa-4">
            <v-alert type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">
              <strong>Spécificité OASE :</strong> Un même NIF doit être géré avec des régimes fiscaux différents selon la phase active. Champ <code>phase</code> obligatoire dans l'entité EXECUTION_LIQUIDATION.
            </v-alert>
            <v-row>
              <v-col v-for="phase in phases" :key="phase.code" cols="12" md="4">
                <v-card :color="phase.color" variant="tonal" rounded="lg" class="pa-3 h-100">
                  <div class="d-flex align-center ga-2 mb-2">
                    <v-chip :color="phase.color" variant="elevated" size="x-small" class="font-weight-bold">{{ phase.code }}</v-chip>
                    <span class="text-body-2 font-weight-semibold">{{ phase.label }}</span>
                  </div>
                  <div class="text-caption text-medium-emphasis mb-2">{{ phase.description }}</div>
                  <v-divider class="my-2" />
                  <div class="text-caption font-weight-bold mb-1">Système :</div>
                  <div class="d-flex flex-wrap ga-1 mb-2">
                    <v-chip v-for="s in phase.systemes" :key="s" size="x-small" :color="phase.color" variant="outlined">{{ s }}</v-chip>
                  </div>
                  <div class="text-caption font-weight-bold mb-1">Avantages :</div>
                  <div v-for="av in phase.avantages" :key="av" class="text-caption">• {{ av }}</div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Conventions actives par opérateur -->
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Suivi conventions — Opérateurs actifs</v-card-title>
          <v-data-table :headers="convHeaders" :items="conventions" hover>
            <template #item.phase="{ item }">
              <v-chip :color="phaseColor(item.phase)" size="x-small" variant="tonal">{{ item.phase }}</v-chip>
            </template>
            <template #item.alerte="{ item }">
              <v-chip :color="item.alerte?'error':'success'" size="x-small" variant="tonal" :prepend-icon="item.alerte?'mdi-bell-ring':'mdi-check'">
                {{ item.alerte ? 'J-90 actif' : 'OK' }}
              </v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">

        <!-- Clause de stabilisation -->
        <v-card rounded="lg" elevation="1" class="mb-4" color="error" variant="tonal">
          <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold text-error">Risque budgétaire — Clauses de stabilisation</v-card-title>
          <v-card-text class="pa-4 pt-0">
            <div class="text-caption mb-2">Les conventions contiennent des <strong>clauses de stabilisation fiscale</strong> garantissant à l'opérateur le maintien du régime fiscal convenu pendant toute la durée définie.</div>
            <div class="text-caption text-medium-emphasis mb-2">Ces clauses représentent un <strong>gel de l'assiette fiscale sur plusieurs décennies</strong>.</div>
            <v-alert type="error" variant="outlined" rounded="lg" density="compact">
              À tracer comme <strong>catégorie distincte</strong> dans le module de suivi financier OASE.
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- Circuit d'approbation institutionnelle -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">Circuit d'approbation institutionnelle</v-card-title>
          <v-timeline density="compact" side="end" class="pa-3">
            <v-timeline-item dot-color="info" size="small">
              <div class="text-caption font-weight-semibold">DGMG + MEF</div>
              <div class="text-caption text-medium-emphasis">Négociation convention — Phase contractuelle</div>
            </v-timeline-item>
            <v-timeline-item dot-color="warning" size="small">
              <div class="text-caption font-weight-semibold">Conseil des ministres</div>
              <div class="text-caption text-medium-emphasis">Adoption formelle — Acte de validation politique</div>
            </v-timeline-item>
            <v-timeline-item dot-color="error" size="small">
              <div class="text-caption font-weight-semibold">Assemblée nationale</div>
              <div class="text-caption text-medium-emphasis">Ratification (selon Code minier) — Conformité législative</div>
              <v-chip size="x-small" color="secondary" variant="tonal" class="mt-1">Conditionnelle</v-chip>
            </v-timeline-item>
            <v-timeline-item dot-color="success" size="small">
              <div class="text-caption font-weight-semibold">Publication JORT</div>
              <div class="text-caption text-medium-emphasis">Opposabilité à l'OTR — Valeur juridique</div>
            </v-timeline-item>
          </v-timeline>
        </v-card>

        <!-- Alerte J-90 fin de phase / expiration avantages -->
        <v-card rounded="lg" elevation="1" color="error" variant="tonal">
          <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold text-error">Alerte J-90 — Double déclenchement</v-card-title>
          <v-card-text class="pa-4 pt-0">
            <div class="d-flex align-center ga-2 mb-2">
              <v-chip size="x-small" color="error" variant="tonal">Fin de phase</v-chip>
              <span class="text-caption">90 jours avant la fin de chaque phase (Recherche, Construction, Exploitation)</span>
            </div>
            <div class="d-flex align-center ga-2 mb-3">
              <v-chip size="x-small" color="warning" variant="tonal">Expiration avantages</v-chip>
              <span class="text-caption">90 jours avant l'expiration des avantages accordés</span>
            </div>
            <div class="text-caption text-medium-emphasis mb-2">Objectif : permettre à l'UPF et à l'OTR d'anticiper le <strong>changement de régime applicable</strong> et éviter toute application d'avantages sur une phase expirée.</div>
            <v-divider class="my-2" />
            <div class="text-caption"><strong>Destinataires :</strong> UPF + OTR + DGMG</div>
            <div class="text-caption mt-1"><strong>Suivi :</strong> OASE → Registre central des échéances</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import ExportButton from '../../components/ExportButton.vue'

const kpis = [
  { label: 'Conventions actives', value: '22', icon: 'mdi-file-document-outline', color: 'primary', subtitle: 'Mines et hydrocarbures' },
  { label: 'En phase recherche', value: '9', icon: 'mdi-magnify-scan', color: 'info', subtitle: 'CDDI (équipements)' },
  { label: 'En phase exploitation', value: '11', icon: 'mdi-factory', color: 'success', subtitle: 'CI (IS / IRPP)' },
  { label: 'Alertes J-90 actives', value: '3', icon: 'mdi-bell-ring', color: 'error', subtitle: 'Changement de phase imminent' },
]

const processHeaders = [
  { title: 'Étape', key: 'etape' },
  { title: 'Acteur', key: 'acteur' },
  { title: 'Action', key: 'action' },
  { title: 'Niveau', key: 'niveau' },
]

const processMatrix = [
  { etape: 'Entrée', acteur: 'Opérateur minier / pétrolier', action: 'Demande de permis de recherche ou d\'exploitation auprès de la DGMG ou du Ministère des mines', niveau: 'Opérateur' },
  { etape: 'Étape 1', acteur: 'État / Opérateur → DGMG', action: 'Négociation de la convention entre l\'État et l\'opérateur — Phase contractuelle. Exonérations négociées phase par phase avec clauses de stabilisation fiscale.', niveau: 'Administratif' },
  { etape: 'Étape 2', acteur: 'Conseil des ministres', action: 'Approbation et signature — Acte de validation politique. Adoption formelle du projet de convention.', niveau: 'Exécutif' },
  { etape: 'Étape 3', acteur: 'Assemblée nationale', action: 'Ratification selon le Code minier / pétrolier en vigueur — Conformité législative (conditionnelle). Publication au Journal Officiel à l\'issue : rend la convention opposable à l\'OTR et lui confère valeur juridique.', niveau: 'Législatif' },
  { etape: 'Exécution', acteur: 'OTR / DGMG', action: 'Application des avantages fiscaux par phase : Recherche / Construction → CDDI (SYDONIAWORLD + GESTEXO) ; Exploitation → CI (E-TAX). Même NIF, régimes différents selon phase active.', niveau: 'Opérationnel' },
  { etape: 'Suivi', acteur: 'DGMG / OASE', action: 'Suivi des engagements et conditions par phase : délais, date 1ère production commerciale, 1er baril. DGMG alimente le registre central OASE.', niveau: 'Contrôle' },
  { etape: 'Alerte', acteur: 'OASE', action: 'Alerte J-90 automatique avant fin de chaque phase OU expiration des avantages → UPF + OTR + DGMG → Registre central des échéances.', niveau: 'OASE' },
]

const phases = [
  {
    code: 'RECHERCHE',
    label: 'Phase Recherche',
    color: 'info',
    description: 'Exploration et prospection géologique. Durée variable selon permis.',
    systemes: ['SYDONIAWORLD', 'GESTEXO'],
    avantages: ['Exo. droits de douane sur équipements', 'Exo. TVA sur importations matériels', 'Exo. taxes et redevances spécifiques'],
  },
  {
    code: 'CONSTRUCTION',
    label: 'Phase Construction',
    color: 'warning',
    description: 'Mise en place des infrastructures de production.',
    systemes: ['SYDONIAWORLD', 'GESTEXO'],
    avantages: ['Exo. DD équipements et machines', 'Exo. TVA produits consommables', 'Exo. taxes locales sur travaux'],
  },
  {
    code: 'EXPLOITATION',
    label: 'Phase Exploitation',
    color: 'success',
    description: 'Production opérationnelle. Avantages sur revenus et bénéfices.',
    systemes: ['E-TAX (CI)'],
    avantages: ['Exo. IS et IRPP (durée conv.)', 'Exo. dividendes', 'Stabilisation fiscale garantie', 'Liberté de transfert capitaux'],
  },
]

const convHeaders = [
  { title: 'Convention', key: 'ref' },
  { title: 'Opérateur', key: 'operateur' },
  { title: 'Phase active', key: 'phase' },
  { title: 'Échéance phase', key: 'echeance' },
  { title: 'Alerte J-90', key: 'alerte' },
]
const conventions = [
  { ref: 'CM-2025-17', operateur: 'Mines du Nord Togo', phase: 'Recherche', echeance: '15/03/2026', alerte: true },
  { ref: 'CP-2024-08', operateur: 'Petro Togo SA', phase: 'Exploitation', echeance: '01/12/2059', alerte: false },
  { ref: 'CM-2026-02', operateur: 'Golden Mines', phase: 'Construction', echeance: '09/09/2027', alerte: false },
  { ref: 'CM-2023-12', operateur: 'Phosphates du Togo', phase: 'Exploitation', echeance: '31/12/2048', alerte: false },
]

const niveauColor = (n: string) => ({ Opérateur: 'info', Administratif: 'primary', Exécutif: 'warning', Législatif: 'error', Opérationnel: 'success', Contrôle: 'info', OASE: 'error' } as Record<string, string>)[n] || 'secondary'
const phaseColor = (p: string) => ({ Recherche: 'info', Construction: 'warning', Exploitation: 'success', Production: 'primary' } as Record<string, string>)[p] || 'secondary'
</script>
