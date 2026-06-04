<template>
  <div>
    <PageHeader
      title="Workflow Zone Franche — Processus n° 3"
      subtitle="Agrément API-ZF, mapping NIF, application automatique des exonérations ZFI / ZES"
      icon="mdi-factory"
    >
      <template #actions>
        <v-chip color="warning" variant="tonal" size="small" prepend-icon="mdi-bell-ring">Alerte J-90 active</v-chip>
        <ExportButton label="Exporter le circuit" policy-label="Diffusion ZF" restriction-note="Export réservé aux profils API-ZF / OTR habilités" :disabled-formats="['excel']" class="ms-2" @export="() => {}" />
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <!-- Parcours normé -->
    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Parcours normé — Processus n° 3 (API-ZF)</v-card-title>
      <v-stepper model-value="4" alt-labels>
        <v-stepper-header>
          <v-stepper-item title="Entrée" subtitle="Dépôt API-ZF" value="1" />
          <v-stepper-item title="Étape 1" subtitle="Évaluation éligibilité" value="2" />
          <v-stepper-item title="Étape 2" subtitle="Instruction technique" value="3" />
          <v-stepper-item title="Décision" subtitle="Agrément comité API-ZF" value="4" color="success" />
          <v-stepper-item title="Exécution" subtitle="Mapping NIF → ZF" value="5" />
          <v-stepper-item title="Suivi" subtitle="Application automatique" value="6" />
          <v-stepper-item title="Contrôle" subtitle="Contrôle annuel" value="7" />
          <v-stepper-item title="Alerte" subtitle="J-90 / Non-respect" value="8" />
        </v-stepper-header>
      </v-stepper>
    </v-card>

    <v-row>
      <v-col cols="12" md="8">

        <!-- Matrice des étapes -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Matrice détaillée — Zone Franche</v-card-title>
          <v-data-table :headers="processHeaders" :items="processMatrix" hover>
            <template #item.delai="{ item }">
              <v-chip v-if="item.delai" :color="item.delai.includes('90')?'error':'info'" size="x-small" variant="tonal">{{ item.delai }}</v-chip>
              <span v-else class="text-caption text-medium-emphasis">—</span>
            </template>
            <template #item.systeme="{ item }">
              <div class="d-flex flex-wrap ga-1">
                <v-chip v-for="s in item.systeme.split('+')" :key="s" size="x-small" color="secondary" variant="outlined">{{ s.trim() }}</v-chip>
              </div>
            </template>
          </v-data-table>
        </v-card>

        <!-- Critères d'éligibilité -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Critères d'éligibilité ZF (Étape 1 — API-ZF)</v-card-title>
          <v-card-text class="pa-4">
            <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-3">
              Conformément à la loi n° 2019-005 du 17 juin 2019. Ces critères déterminent la nature et l'intensité des avantages accordés.
            </v-alert>
            <v-row>
              <v-col v-for="c in criteresEligibilite" :key="c.label" cols="12" md="6">
                <v-card :color="c.color" variant="tonal" rounded="lg" class="pa-3">
                  <div class="d-flex align-center ga-2 mb-1">
                    <v-icon :icon="c.icon" size="18" :color="c.color" />
                    <span class="text-body-2 font-weight-semibold">{{ c.label }}</span>
                  </div>
                  <div class="text-caption text-medium-emphasis">{{ c.description }}</div>
                  <div class="text-caption font-weight-bold mt-1">{{ c.seuil }}</div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Délais d'agrément -->
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Niveaux d'agrément et délais</v-card-title>
          <v-card-text class="pa-4">
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="tonal" color="info" rounded="lg" class="pa-4">
                  <div class="d-flex align-center ga-2 mb-2">
                    <v-icon icon="mdi-clock-fast" color="info" />
                    <span class="font-weight-semibold">Agrément provisoire</span>
                  </div>
                  <div class="text-h6 font-weight-bold text-info">11 – 33 jours</div>
                  <div class="text-caption text-medium-emphasis mt-1">Frais : 300 000 FCFA</div>
                  <v-divider class="my-2" />
                  <div class="text-caption">Permet de bénéficier des avantages en attente du démarrage de production.</div>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card variant="tonal" color="success" rounded="lg" class="pa-4">
                  <div class="d-flex align-center ga-2 mb-2">
                    <v-icon icon="mdi-certificate" color="success" />
                    <span class="font-weight-semibold">Agrément définitif</span>
                  </div>
                  <div class="text-h6 font-weight-bold text-success">52 – 107 jours</div>
                  <div class="text-caption text-medium-emphasis mt-1">Coût : ~2 500 000 FCFA</div>
                  <v-divider class="my-2" />
                  <div class="text-caption">Certificat d'Entreprise Exportatrice. Acte définitif du comité d'agrément API-ZF.</div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">

        <!-- Point technique : mapping NIF -->
        <v-card rounded="lg" elevation="1" class="mb-4" color="warning" variant="tonal">
          <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">⚙ Point d'ancrage technique OASE</v-card-title>
          <v-card-text class="pa-4 pt-0">
            <div class="text-body-2 font-weight-semibold mb-2">Mapping NIF → Statut Zone Franche</div>
            <div class="text-caption mb-3">Mécanisme central de traçabilité. Une fois activé, application automatique de <strong>tous les avantages</strong> sans instruction manuelle répétée.</div>
            <div class="d-flex flex-wrap ga-1 mb-2">
              <v-chip size="x-small" color="info" variant="tonal">E-TAX (fiscalité)</v-chip>
              <v-chip size="x-small" color="info" variant="tonal">SYDONIAWORLD (douanes)</v-chip>
            </div>
            <v-divider class="my-2" />
            <div class="text-caption text-medium-emphasis">Avantages activés automatiquement : TVA, droits de douane, IS, patente, ADA.</div>
          </v-card-text>
        </v-card>

        <!-- Avantages ZF -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">Avantages accordés (activation automatique)</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Exonération TVA" subtitle="Achats locaux et importations" prepend-icon="mdi-percent" />
            <v-list-item title="Droits de douane" subtitle="Équipements et intrants" prepend-icon="mdi-truck" />
            <v-list-item title="IS / Impôt sur les bénéfices" subtitle="Pendant la durée de la convention" prepend-icon="mdi-bank" />
            <v-list-item title="Patente" subtitle="Exonération totale" prepend-icon="mdi-license" />
            <v-list-item title="ADA" subtitle="Autres droits et taxes" prepend-icon="mdi-tag-off" />
          </v-list>
        </v-card>



        <!-- Contrôle annuel -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">Contrôle annuel — API-ZF + OTR</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Quotas de production" subtitle="API-ZF + OTR vérifient" prepend-icon="mdi-chart-bar" />
            <v-list-item title="Taux d'exportation" subtitle="≥ 70% du CA — effectif constaté" prepend-icon="mdi-export" />
            <v-list-item title="Maintien des emplois" subtitle="Ressortissants togolais ≥ 60%" prepend-icon="mdi-account-group" />
            <v-list-item title="Engagement CAPEX" subtitle="Réalisation effective par phase" prepend-icon="mdi-currency-usd" />
          </v-list>
          <v-card-text class="pa-3 pt-0">
            <v-alert type="warning" variant="tonal" rounded="lg" density="compact">
              Tout écart détecté déclenche une notification automatique à l'UPF et à l'OTR → suspension ou déchéance du régime possible.
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- Alerte J-90 + non-respect -->
        <v-card rounded="lg" elevation="1" class="mb-4" color="error" variant="tonal">
          <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold text-error">Alerte OASE — Double déclenchement</v-card-title>
          <v-card-text class="pa-4 pt-0">
            <div class="d-flex align-center ga-2 mb-2">
              <v-chip size="x-small" color="error" variant="tonal">Alerte J-90</v-chip>
              <span class="text-caption">90 jours avant expiration de l'agrément</span>
            </div>
            <div class="d-flex align-center ga-2 mb-3">
              <v-chip size="x-small" color="warning" variant="tonal">Non-respect</v-chip>
              <span class="text-caption">Si conditions du régime non respectées (contrôle annuel)</span>
            </div>
            <div class="text-caption text-medium-emphasis">Objectif : éviter toute application d'avantages sur acte caduc — risque documenté MRD 2024 pour plusieurs bénéficiaires ZF.</div>
            <v-divider class="my-2" />
            <div class="text-caption"><strong>Destinataires :</strong> UPF + OTR + API-ZF → Registre central OASE</div>
          </v-card-text>
        </v-card>

        <!-- Pièces documentaires requises -->
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">Pièces documentaires requises</v-card-title>
          <v-card-text class="pa-3 pt-0">
            <v-alert type="error" variant="tonal" rounded="lg" density="compact" class="mb-3" icon="mdi-file-alert">
              Pour l'<strong>agrément définitif</strong>, la <strong>fiche signalétique de suivi des agréments</strong> dûment remplie et visée par l'API-ZF / Ministère de tutelle est <strong>obligatoire</strong>. Pour l'agrément provisoire, elle est recommandée.
            </v-alert>
            <v-list density="compact" class="pa-0">
              <v-list-item prepend-icon="mdi-file-check" title="Formulaire de demande d'agrément ZF" subtitle="Guichet API-ZF" />
              <v-list-item prepend-icon="mdi-file-check" title="Plan d'affaires / Étude de faisabilité" subtitle="Avec plan de financement" />
              <v-list-item prepend-icon="mdi-file-check" title="Attestation de disponibilité des fonds" subtitle="Garantie bancaire" />
              <v-list-item prepend-icon="mdi-file-check" title="RCCM + NIF + Statuts" subtitle="Identité juridique" />
              <v-list-item prepend-icon="mdi-file-check" title="Programme emplois et ressortissants" subtitle="Engagements sociaux" />
              <v-list-item prepend-icon="mdi-file-check" title="EIES (si applicable)" subtitle="Agrément définitif uniquement" />
              <v-list-item prepend-icon="mdi-file-alert" color="error" title="Fiche signalétique de suivi des agréments" subtitle="Visée par l'API-ZF / Ministère de tutelle — OBLIGATOIRE (agrément définitif)" />
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
  { label: 'Agréments ZF actifs', value: '47', icon: 'mdi-factory', color: 'primary', subtitle: 'ZFI + ZES combinés' },
  { label: 'Provisoires en cours', value: '8', icon: 'mdi-clock-fast', color: 'info', subtitle: 'Délai 11–33 jours' },
  { label: 'Alertes J-90 actives', value: '5', icon: 'mdi-bell-ring', color: 'error', subtitle: 'Expirations < 90 jours' },
  { label: 'Contrôles annuels OK', value: '79%', icon: 'mdi-check-circle', color: 'success', subtitle: 'Engagements respectés' },
]

const processHeaders = [
  { title: 'Étape', key: 'etape' },
  { title: 'Acteur', key: 'acteur' },
  { title: 'Action', key: 'action' },
  { title: 'Système', key: 'systeme' },
  { title: 'Délai', key: 'delai' },
]

const processMatrix = [
  { etape: 'Entrée', acteur: 'Promoteur / Entreprise', action: 'Dépôt demande d\'agrément Zone Franche (guichet API-ZF)', systeme: 'API-ZF', delai: '' },
  { etape: 'Étape 1', acteur: 'API-ZF', action: 'Évaluation selon critères d\'éligibilité ZF (montant invest, emplois, VA, taux export)', systeme: 'API-ZF', delai: '' },
  { etape: 'Étape 2', acteur: 'API-ZF / Ministère', action: 'Instruction technique et juridique du dossier', systeme: 'API-ZF', delai: '' },
  { etape: 'Décision', acteur: 'Comité d\'agrément API-ZF', action: 'Délivrance agrément (provisoire 11–33j ou définitif 52–107j)', systeme: 'API-ZF', delai: '11–107 j' },
  { etape: 'Exécution', acteur: 'OTR / API-ZF', action: 'Mapping NIF → statut Zone Franche dans E-TAX + SYDONIAWORLD. Activation automatique de tous les avantages (TVA, DD, IS, patente, ADA).', systeme: 'E-TAX + SYDONIAWORLD', delai: '' },
  { etape: 'Suivi', acteur: 'OTR', action: 'Application automatique des exonérations sur chaque opération (fiscale ou douanière) sans instruction manuelle répétée.', systeme: 'E-TAX + SYDONIAWORLD', delai: 'Continu' },
  { etape: 'Contrôle', acteur: 'API-ZF + OTR', action: 'Contrôle annuel du respect des engagements : quotas production, taux export ≥ 70%, maintien emplois (≥ 60% nationaux), réalisation CAPEX.', systeme: 'E-TAX + SYDONIAWORLD + OASE', delai: 'Annuel' },
  { etape: 'Alerte', acteur: 'OASE', action: 'Alerte automatique J-90 avant expiration agrément ET alerte OASE si non-respect des conditions → suspension ou déchéance possible. Destinataires : UPF + OTR + API-ZF.', systeme: 'OASE → Registre central', delai: 'J-90 / Immédiat' },
]

const criteresEligibilite = [
  { label: 'Montant d\'investissement', icon: 'mdi-currency-usd', color: 'primary', description: 'Seuil minimal selon le type de zone', seuil: '≥ 500M FCFA (ZFI) / seuil ZES variable' },
  { label: 'Emplois créés', icon: 'mdi-account-group', color: 'success', description: 'Volume et proportion ressortissants togolais', seuil: '≥ 50 emplois directs · 60% nationaux' },
  { label: 'Valeur ajoutée', icon: 'mdi-chart-line', color: 'info', description: 'VA générée et contribution au tissu économique', seuil: 'Évaluée par grille API-ZF' },
  { label: 'Taux d\'exportation', icon: 'mdi-export', color: 'warning', description: 'Part du CA réalisée à l\'exportation', seuil: '≥ 70% du chiffre d\'affaires' },
]
</script>
