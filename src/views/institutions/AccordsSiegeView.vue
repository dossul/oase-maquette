<template>
  <div>
    <PageHeader
      title="Sous-registre des accords de siege"
      subtitle="Gestion MAE / OTR des organisations internationales, corps diplomatiques et listes personnel"
      icon="mdi-flag"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-account-multiple-check">Mettre a jour la liste personnel</v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-file-sign">Notifier OTR</v-btn>
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <!-- Parcours normé Process 6 -->
    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Parcours normé — Processus n° 6 (MAE → OTR)</v-card-title>
      <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mx-4 mb-3">
        Bases juridiques <strong>multiples et cumulatives</strong> : Convention de Vienne · Accord ONU-Togo 1968 · CGI · Conventions bilatérales. Périmètre : <strong>298 mesures MRD strict / 398 cartographie élargie</strong>.
      </v-alert>
      <v-stepper model-value="3" alt-labels>
        <v-stepper-header>
          <v-stepper-item title="Base juridique" subtitle="MAE / OTR" value="1" />
          <v-stepper-item title="Notification" subtitle="MAE → OTR / OASE" value="2" />
          <v-stepper-item title="Exo. TVA" subtitle="OTR CI → E-TAX" value="3" color="info" />
          <v-stepper-item title="Exo. IRPP" subtitle="OTR CI → E-TAX" value="4" />
          <v-stepper-item title="Franchise douanière" subtitle="CDDI → SYDONIAWORLD + GESTEXO" value="5" />
          <v-stepper-item title="Mise à jour" subtitle="Obligation annuelle" value="6" />
          <v-stepper-item title="Alerte J-90" subtitle="Non-MàJ ou expiration" value="7" />
        </v-stepper-header>
      </v-stepper>
    </v-card>

    <!-- Matrice détaillée Process 6 -->
    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Matrice détaillée — Processus n° 6 (Figure 8)</v-card-title>
      <v-data-table :headers="processHeaders" :items="processMatrix" hover density="compact">
        <template #item.niveau="{ item }">
          <v-chip :color="niveauColor(item.niveau)" size="x-small" variant="tonal">{{ item.niveau }}</v-chip>
        </template>
      </v-data-table>
    </v-card>

    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-data-table :headers="headers" :items="rows" hover @click:row="(_, { item }) => selected = item">
        <template #item.statut="{ item }">
          <v-chip :color="statusColor(item.statut)" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn size="x-small" color="primary" variant="tonal" @click.stop="selected = item">Fiche</v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-row>
      <v-col cols="12" md="7">
        <v-card v-if="selected" rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">{{ selected.organisation }}</v-card-title>
          <v-card-text class="pa-4">
            <v-timeline density="compact" side="end" class="mb-3">
              <v-timeline-item dot-color="success" size="small">
                <div class="text-caption font-weight-semibold">1. Signature accord avec MAE</div>
                <div class="text-caption text-medium-emphasis">{{ selected.signature }}</div>
              </v-timeline-item>
              <v-timeline-item dot-color="info" size="small">
                <div class="text-caption font-weight-semibold">2. Notification OTR</div>
                <div class="text-caption text-medium-emphasis">{{ selected.notification }}</div>
              </v-timeline-item>
              <v-timeline-item dot-color="warning" size="small">
                <div class="text-caption font-weight-semibold">3. Mise a jour annuelle personnel / immatriculations</div>
                <div class="text-caption text-medium-emphasis">{{ selected.maj }}</div>
              </v-timeline-item>
            </v-timeline>

            <v-row dense>
              <v-col cols="12" md="6"><v-text-field label="Reference accord" :model-value="selected.reference" density="compact" readonly /></v-col>
              <v-col cols="12" md="6"><v-text-field label="Validite" :model-value="selected.validite" density="compact" readonly /></v-col>
              <v-col cols="12" md="6"><v-text-field label="Code additionnel / SI" :model-value="selected.codeAdditionnel" density="compact" readonly /></v-col>
              <v-col cols="12" md="6"><v-text-field label="Confidentialite" :model-value="selected.confidentialite" density="compact" readonly /></v-col>
              <v-col cols="12"><v-textarea label="Avantages suivis dans la maquette" :model-value="selected.avantages" rows="3" density="compact" readonly /></v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Bases juridiques multiples -->
        <v-card v-if="selected" rounded="lg" elevation="1" class="mt-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Bases juridiques applicables</v-card-title>
          <v-card-text class="pa-4 pt-0">
            <v-alert type="warning" variant="tonal" rounded="lg" density="compact" class="mb-3">
              Angle mort MRD 2024 : la base juridique doit être renseignée <strong>explicitement</strong> pour chaque avantage. L'identité de l'organisation ne suffit pas.
            </v-alert>
            <div class="d-flex flex-wrap ga-2">
              <v-chip v-for="bj in basesJuridiquesOrg" :key="bj" size="small" color="info" variant="tonal" prepend-icon="mdi-gavel">{{ bj }}</v-chip>
            </div>
            <v-divider class="my-3" />
            <div class="text-caption text-medium-emphasis">
              <strong>Note :</strong> Deux ambassades relevant de la même Convention de Vienne peuvent bénéficier de périmètres d'exonération différents si leurs conventions bilatérales divergent.
            </div>
          </v-card-text>
        </v-card>

        <!-- Alerte double déclenchement -->
        <v-card v-if="selected" rounded="lg" elevation="1" class="mt-4" color="error" variant="tonal">
          <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold text-error">Alerte J-90 — Double déclenchement</v-card-title>
          <v-card-text class="pa-4 pt-0">
            <div class="d-flex align-center ga-2 mb-2">
              <v-chip size="x-small" color="error" variant="tonal">Non-MàJ listes</v-chip>
              <span class="text-caption">Alerte si liste personnel ou immatriculations non actualisée depuis &gt; 12 mois</span>
            </div>
            <div class="d-flex align-center ga-2 mb-3">
              <v-chip size="x-small" color="warning" variant="tonal">Expiration accord</v-chip>
              <span class="text-caption">Alerte J-90 avant expiration de l'accord de siège</span>
            </div>
            <v-divider class="my-2" />
            <div class="text-caption"><strong>Destinataires :</strong> OTR + OASE → Registre central</div>
            <div class="text-caption mt-1"><strong>Fréquence contrôle :</strong> Alerte trimestrielle si liste non actualisée</div>
          </v-card-text>
        </v-card>


        <v-card v-if="selected" rounded="lg" elevation="1" class="mt-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Synthese O2 et diffusion restreinte</v-card-title>
          <v-card-text class="pa-0">
            <v-table density="compact">
              <tbody>
                <tr v-for="item in o2Rows(selected)" :key="item.label">
                  <td class="text-caption font-weight-semibold" style="width: 44%;">{{ item.label }}</td>
                  <td class="text-caption">{{ item.value }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Pieces et controles visibles</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Carte consulaire / liste diplomatique" prepend-icon="mdi-card-account-details-outline" />
            <v-list-item title="Immatriculations vehicules diplomatiques" prepend-icon="mdi-car-outline" />
            <v-list-item title="Importations franchisees" prepend-icon="mdi-ferry" />
            <v-list-item title="TVA achats locaux et IRPP non-resident" prepend-icon="mdi-cash-refund" />
            <v-list-item title="Horodatage annuel des mises a jour" prepend-icon="mdi-clock-check-outline" />
          </v-list>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Sous-registre MAE</v-card-title>
          <v-card-text>
            <div class="text-body-2 mb-2"><strong>Stock suivi :</strong> 398 accords / etablissements</div>
            <div class="text-body-2 mb-2"><strong>Personnel diplomatique trace :</strong> 1 204 fiches</div>
            <div class="text-body-2"><strong>Derniere campagne :</strong> 29/05/2026</div>
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mt-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Vigilances diplomatiques</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Liste personnel et ayants droit a recertifier annuellement" prepend-icon="mdi-account-multiple-check" />
            <v-list-item title="Vehicules, cartes consulaires et notes verbales a rapprocher" prepend-icon="mdi-car-info" />
            <v-list-item title="Consultation sensible et diffusion strictement journalisees" prepend-icon="mdi-history" />
            <v-list-item title="Hash des pieces probantes et reference MAE rattaches" prepend-icon="mdi-shield-check-outline" />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'

const kpis = [
  { label: 'Accords suivis', value: '398', icon: 'mdi-flag-checkered', color: 'primary', subtitle: 'Sous-registre MAE' },
  { label: 'Mises a jour annuelles', value: '61', icon: 'mdi-calendar-refresh', color: 'info', subtitle: 'Campagne en cours' },
  { label: 'Dossiers a regulariser', value: '12', icon: 'mdi-alert-circle-outline', color: 'warning', subtitle: 'Pieces ou listes manquantes' },
  { label: 'Notifications OTR envoye es', value: '47', icon: 'mdi-email-check-outline', color: 'success', subtitle: 'Traçabilite preservee' },
]

const processHeaders = [
  { title: 'Étape', key: 'etape' },
  { title: 'Acteur', key: 'acteur' },
  { title: 'Action', key: 'action' },
  { title: 'Niveau', key: 'niveau' },
]

const processMatrix = [
  { etape: 'Base juridique', acteur: 'MAE / OTR', action: 'Base juridique multiple : accord de siège, convention internationale, traité, CGI — Loi ou ordonnance d\'approbation. Les 4 fondements peuvent s\'appliquer cumulativement.', niveau: 'Juridique' },
  { etape: 'Notification', acteur: 'MAE → OTR / OASE', action: 'Notification de l\'accord à l\'OTR par le Ministère des Affaires étrangères. Doit référencer explicitement la base juridique applicable pour chaque avantage.', niveau: 'Administratif' },
  { etape: 'Exo. TVA', acteur: 'OTR CI → E-TAX', action: 'Exonération de TVA sur les achats locaux. Mode d\'application (remboursement ou exonération directe) dépend du type de base juridique invoqué.', niveau: 'Opérationnel' },
  { etape: 'Exo. IRPP', acteur: 'OTR CI → E-TAX', action: 'Exonération d\'IRPP pour les personnels de l\'organisation (agents non-résidents). Périmètre défini par la convention bilatérale.', niveau: 'Opérationnel' },
  { etape: 'Franchise douanière', acteur: 'OTR CDDI → SYDONIAWORLD + GESTEXO', action: 'Franchises douanières sur importation de matériel, équipements et véhicules diplomatiques. Traitement via SYDONIAWORLD avec suivi GESTEXO.', niveau: 'Opérationnel' },
  { etape: 'Mise à jour', acteur: 'OI / Ambassade / ONG → OTR / OASE', action: 'Mise à jour annuelle des listes nominatives du personnel bénéficiaire et du registre des immatriculations de véhicules diplomatiques. Obligation annuelle.', niveau: 'Contrôle' },
  { etape: 'Alerte', acteur: 'OASE → Registre central', action: 'Alerte OASE si non-mise à jour des listes (> 12 mois) ou expiration de l\'accord. Alerte automatique J-90.', niveau: 'OASE' },
]

const niveauColor = (n: string) => ({ Juridique: 'primary', Administratif: 'info', Opérationnel: 'success', Contrôle: 'warning', OASE: 'error' } as Record<string, string>)[n] || 'secondary'

const headers = [
  { title: 'Organisation', key: 'organisation' },
  { title: 'Reference', key: 'reference' },
  { title: 'Validite', key: 'validite' },
  { title: 'Statut', key: 'statut' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const rows = [
  { organisation: 'Ambassade du Canada', reference: 'AS-2024-018', validite: '2024-2027', statut: 'A jour', signature: 'Accord signe le 12/04/2024', notification: 'OTR notifie le 15/04/2024', maj: 'Prochaine mise a jour au 30/06/2026', avantages: 'TVA achats locaux, franchises vehicules, importations materiels diplomatiques', codeAdditionnel: 'DOU-DIP-2026-03', confidentialite: 'Restreint' },
  { organisation: 'UNICEF Togo', reference: 'AS-2025-004', validite: '2025-2028', statut: 'A completer', signature: 'Accord signe le 09/01/2025', notification: 'OTR notifie le 16/01/2025', maj: 'Liste personnel a confirmer', avantages: 'Franchises importation, TVA achats locaux', codeAdditionnel: 'DOU-OI-2026-09', confidentialite: 'Interne' },
]

const selected = ref(rows[0])

// Bases juridiques multiples et cumulatives (Processus 6)
const basesJuridiquesOrg = [
  'Convention de Vienne (relations diplomatiques)',
  'Accord de base ONU–Togo 1968',
  'CGI — dispositions spécifiques OI/Ambassades',
  'Convention bilatérale spécifique',
]

const statusColor = (value: string) => ({ 'A jour': 'success', 'A completer': 'warning' } as Record<string, string>)[value] || 'secondary'
const o2Rows = (item: (typeof rows)[number]) => [
  { label: 'id_mesure / reference accord', value: `MES-${item.reference} / ${item.reference}` },
  { label: 'base juridique / articles', value: 'Accord de siege + protocoles d application' },
  { label: 'beneficiaire / type', value: `${item.organisation} / corps diplomatique ou OI` },
  { label: 'code additionnel / systeme source', value: `${item.codeAdditionnel} / Sydonia + E-TAX` },
  { label: 'organe attribution / gestion', value: 'MAE / OTR' },
  { label: 'validite / horodatage', value: `${item.validite} / campagne 2026` },
  { label: 'piece probante / confidentialite', value: `note verbale + liste personnel / ${item.confidentialite}` },
]
</script>
