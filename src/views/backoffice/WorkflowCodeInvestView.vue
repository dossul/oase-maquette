<template>
  <div>
    <PageHeader
      title="Workflow Code des Investissements — Processus n° 4"
      subtitle="Grille de classement A/B/C, arrêté ministériel, triple activation OTR (E-TAX + CIBIM + DLFC)"
      icon="mdi-handshake"
    >
      <template #actions>
        <v-chip color="warning" variant="tonal" size="small" prepend-icon="mdi-bell-ring">Alerte J-90 active</v-chip>
        <ExportButton label="Exporter le circuit" policy-label="Diffusion CI" restriction-note="Export réservé aux profils API-ZF / OTR / Ministère habilités" :disabled-formats="['excel']" class="ms-2" @export="() => {}" />
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <!-- Parcours normé -->
    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Parcours normé — Processus n° 4 (API-ZF / OTR)</v-card-title>
      <v-stepper model-value="3" alt-labels>
        <v-stepper-header>
          <v-stepper-item title="Entrée" subtitle="Dépôt API-ZF / Ministère" value="1" />
          <v-stepper-item title="Étape 1" subtitle="Évaluation grille classement" value="2" />
          <v-stepper-item title="Étape 2" subtitle="Arrêté Ministère compétent" value="3" color="warning" />
          <v-stepper-item title="Exécution" subtitle="Quadruple activation OTR" value="4" />
          <v-stepper-item title="Suivi" subtitle="Conditions & engagements" value="5" />
          <v-stepper-item title="Alerte" subtitle="J-90 / Non-respect" value="6" />
        </v-stepper-header>
      </v-stepper>
    </v-card>

    <v-row>
      <v-col cols="12" md="8">

        <!-- Matrice des étapes -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Matrice détaillée — Code des Investissements</v-card-title>
          <v-data-table :headers="processHeaders" :items="processMatrix" hover>
            <template #item.systeme="{ item }">
              <div class="d-flex flex-wrap ga-1">
                <v-chip v-for="s in item.systeme.split('+')" :key="s" size="x-small" color="secondary" variant="outlined">{{ s.trim() }}</v-chip>
              </div>
            </template>
          </v-data-table>
        </v-card>

        <!-- Grille de classement A/B/C/D -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Grille de classement multicritères (Étape 1 — API-ZF)</v-card-title>
          <v-card-text class="pa-4">
            <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
              Les paramètres chiffrés issus de cette grille — taux d'abattement IS, pourcentage de crédit d'impôt, durée d'exonération — doivent être intégrés dans le <strong>moteur de règles de l'OASE</strong>.
            </v-alert>
            <v-row>
              <v-col v-for="r in regimesClassement" :key="r.code" cols="12" md="6">
                <v-card variant="outlined" rounded="lg" class="pa-3 h-100">
                  <div class="d-flex align-center ga-2 mb-2">
                    <v-chip :color="r.color" variant="tonal" size="small" class="font-weight-bold">Régime {{ r.code }}</v-chip>
                    <span class="text-body-2 font-weight-semibold">{{ r.titre }}</span>
                  </div>
                  <div class="text-caption text-medium-emphasis mb-2">{{ r.description }}</div>
                  <div class="d-flex flex-wrap ga-1">
                    <v-chip v-for="av in r.avantages" :key="av" size="x-small" color="success" variant="tonal">{{ av }}</v-chip>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Zones d'implantation -->
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Zones d'implantation — Taux d'avantages croissants</v-card-title>
          <v-card-text class="pa-4">
            <v-alert type="warning" variant="tonal" rounded="lg" density="compact" class="mb-3">
              Les zones éloignées de Lomé bénéficient de taux d'avantages supérieurs pour orienter l'investissement vers les régions intérieures.
            </v-alert>
            <v-data-table :headers="zonesHeaders" :items="zonesData" hover>
              <template #item.taux="{ item }">
                <v-progress-linear :model-value="item.progressVal" :color="item.color" rounded height="8" />
                <span class="text-caption">{{ item.taux }}</span>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">

        <!-- Quadruple activation OTR -->
        <v-card rounded="lg" elevation="1" class="mb-4" color="primary" variant="tonal">
          <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">⚙ Activation OTR — 4 systèmes (Exécution)</v-card-title>
          <v-card-text class="pa-4 pt-0">
            <div class="text-caption mb-3">NIF mappé au régime — traduction de l'arrêté de classement en traitement opérationnel :</div>
            <div class="d-flex flex-column ga-2">
              <v-card variant="outlined" rounded="lg" class="pa-2">
                <div class="d-flex align-center ga-2">
                  <v-icon icon="mdi-percent" color="info" size="18" />
                  <div><div class="text-caption font-weight-bold">E-TAX</div><div class="text-caption text-medium-emphasis">IS, TVA, IRPP — fiscalité intérieure</div></div>
                </div>
              </v-card>
              <v-card variant="outlined" rounded="lg" class="pa-2">
                <div class="d-flex align-center ga-2">
                  <v-icon icon="mdi-truck" color="success" size="18" />
                  <div><div class="text-caption font-weight-bold">SYDONIAWORLD</div><div class="text-caption text-medium-emphasis">Opérations douanières à l'importation</div></div>
                </div>
              </v-card>
              <v-card variant="outlined" rounded="lg" class="pa-2">
                <div class="d-flex align-center ga-2">
                  <v-icon icon="mdi-database" color="warning" size="18" />
                  <div><div class="text-caption font-weight-bold">Base DLFC / CIBIM</div><div class="text-caption text-medium-emphasis">Taxes intérieures — comptabilité fiscale</div></div>
                </div>
              </v-card>
            </div>
            <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mt-3" icon="mdi-information">
              Point d'entrée principal de l'alimentation de l'OASE pour les dépenses fiscales CI.
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- Alerte — double déclenchement -->
        <v-card rounded="lg" elevation="1" class="mb-4" color="error" variant="tonal">
          <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold text-error">Alerte OASE — Double déclenchement</v-card-title>
          <v-card-text class="pa-4 pt-0">
            <div class="d-flex align-center ga-2 mb-2">
              <v-chip size="x-small" color="error" variant="tonal">Alerte J-90</v-chip>
              <span class="text-caption">90 jours avant expiration de l'arrêté de classement</span>
            </div>
            <div class="d-flex align-center ga-2 mb-3">
              <v-chip size="x-small" color="warning" variant="tonal">Non-respect</v-chip>
              <span class="text-caption">Si conditions ou fin de régime non respectées (suivi continu)</span>
            </div>
            <div class="text-caption text-medium-emphasis">Déchéance possible avec régularisation des droits et taxes non acquittés + pénalités légales.</div>
            <v-divider class="my-2" />
            <div class="text-caption"><strong>Destinataires :</strong> UPF + OTR + Ministère compétent → Registre central OASE</div>
          </v-card-text>
        </v-card>

        <!-- Suivi des engagements -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">Suivi des engagements</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Réalisation CAPEX" subtitle="Programme d'investissement effectif" prepend-icon="mdi-currency-usd" />
            <v-list-item title="Emplois créés" subtitle="Objectifs nominatifs" prepend-icon="mdi-account-group" />
            <v-list-item title="Respect des délais" subtitle="Phases de réalisation" prepend-icon="mdi-clock-check" />
            <v-list-item title="Déclarations fiscales" subtitle="OTR / E-TAX à jour" prepend-icon="mdi-file-document-check" />
          </v-list>
          <v-card-text class="pa-3 pt-0">
            <v-alert type="warning" variant="tonal" rounded="lg" density="compact">
              Tout écart déclenche une notification → déchéance avec remboursement des avantages + pénalités légales.
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- Pièces documentaires requises -->
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">Pièces documentaires requises</v-card-title>
          <v-card-text class="pa-3 pt-0">
            <v-alert type="error" variant="tonal" rounded="lg" density="compact" class="mb-3" icon="mdi-file-alert">
              Lorsque l'exonération repose sur un agrément CI, la <strong>fiche signalétique de suivi des agréments</strong> dûment remplie et visée par le Ministère compétent est <strong>obligatoire</strong>.
            </v-alert>
            <v-list density="compact" class="pa-0">
              <v-list-item prepend-icon="mdi-file-check" title="Programme d'investissement détaillé" subtitle="CAPEX, phases, calendrier" />
              <v-list-item prepend-icon="mdi-file-check" title="Business plan (3 ans)" subtitle="Non requis Régime A" />
              <v-list-item prepend-icon="mdi-file-check" title="Plan d'emplois" subtitle="Qualification des postes" />
              <v-list-item prepend-icon="mdi-file-check" title="Attestation capacité financière" subtitle="Garantie bancaire" />
              <v-list-item prepend-icon="mdi-file-check" title="RCCM + NIF + Quitus fiscal OTR" subtitle="Identité juridique" />
              <v-list-item prepend-icon="mdi-file-alert" color="error" title="Fiche signalétique de suivi des agréments" subtitle="Dûment remplie et visée par le Ministère compétent — OBLIGATOIRE" />
            </v-list>
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
  { label: 'Agréments CI actifs', value: '112', icon: 'mdi-handshake', color: 'primary', subtitle: 'Loi n°2019-005' },
  { label: 'Arrêtés en instruction', value: '18', icon: 'mdi-file-clock', color: 'info', subtitle: 'API-ZF + Ministère' },
  { label: 'Alertes J-90 actives', value: '7', icon: 'mdi-bell-ring', color: 'error', subtitle: 'Expirations < 90 jours' },
  { label: 'Engagements tenus', value: '84%', icon: 'mdi-check-decagram', color: 'success', subtitle: 'Contrôles API-ZF + OTR' },
]

const processHeaders = [
  { title: 'Étape', key: 'etape' },
  { title: 'Acteur', key: 'acteur' },
  { title: 'Action', key: 'action' },
  { title: 'Système', key: 'systeme' },
]

const processMatrix = [
  { etape: 'Entrée', acteur: 'Investisseur', action: 'Introduction du dossier d\'investissement auprès de l\'API-ZF / Ministère', systeme: 'API-ZF' },
  { etape: 'Étape 1', acteur: 'API-ZF — Comité d\'agrément', action: 'Évaluation selon grille de classement multicritères (zone, secteur, CAPEX, emplois)', systeme: 'API-ZF' },
  { etape: 'Étape 2', acteur: 'Ministère compétent', action: 'Arrêté de classement (régime A/B/C/D) — acte administratif d\'octroi', systeme: 'Ministère' },
  { etape: 'Exécution', acteur: 'OTR', action: 'NIF mappé au régime — traduction opérationnelle dans les SI : E-TAX (IS, TVA, IRPP), SYDONIAWORLD (douanes à l\'importation), Base DLFC (taxes intérieures), CIBIM. Application automatique des avantages.', systeme: 'E-TAX + SYDONIAWORLD + CIBIM + DLFC' },
  { etape: 'Suivi', acteur: 'OTR / OASE', action: 'Suivi continu des conditions et engagements de l\'investisseur : CAPEX effectif, emplois maintenus, délais respectés. Tout écart déclenche une notification automatique à l\'UPF + OTR → déchéance et remboursement possible.', systeme: 'OASE + E-TAX' },
  { etape: 'Alerte', acteur: 'OASE', action: 'Double déclenchement : Alerte J-90 automatique avant expiration de l\'arrêté de classement ET alerte OASE si non-respect des conditions du régime.', systeme: 'OASE → Registre central' },
]

const regimesClassement = [
  { code: 'A', titre: 'Déclaration', color: 'info', description: 'Investissements courants — procédure simplifiée, avantages de base.', avantages: ['IS -10%', 'Patente exo.', 'DD -50%'] },
  { code: 'B', titre: 'Agrément prioritaire', color: 'warning', description: 'Investissements prioritaires — impact emplois et VA significatif.', avantages: ['IS -20%', 'TVA exo. 5 ans', 'DD exo.', 'Crédit impôt'] },
  { code: 'C', titre: 'Agrément structurant', color: 'success', description: 'Grands projets structurants — avantages renforcés, durée étendue.', avantages: ['IS exo. totale', 'TVA exo. 10 ans', 'DD exo.', 'Rapatriement libre'] },
  { code: 'D', titre: 'Convention État', color: 'error', description: 'Méga-projets — convention directe avec l\'État. Délibérée en Conseil des ministres.', avantages: ['Régime sur-mesure', 'Stabilisation fiscale', 'Garanties État'] },
]

const zonesHeaders = [
  { title: 'Zone', key: 'zone' },
  { title: 'Couverture géographique', key: 'description' },
  { title: 'Taux d\'avantages', key: 'taux' },
]
const zonesData = [
  { zone: 'Zone 1', description: 'Grand Lomé et agglomération', taux: 'Base', progressVal: 20, color: 'info' },
  { zone: 'Zone 2', description: 'Autres villes maritimes', taux: '+10% base', progressVal: 40, color: 'primary' },
  { zone: 'Zone 3', description: 'Préfectures Plateaux / Centrale', taux: '+20% base', progressVal: 60, color: 'warning' },
  { zone: 'Zone 4', description: 'Préfectures Kara', taux: '+30% base', progressVal: 80, color: 'orange' },
  { zone: 'Zone 5', description: 'Préfectures Savanes (zones prioritaires)', taux: '+40% base (majorés)', progressVal: 100, color: 'success' },
]
</script>
