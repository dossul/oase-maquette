<template>
  <div>
    <PageHeader
      title="Dictionnaire O2 et referentiels normes"
      subtitle="17 attributs obligatoires, 9 entites logiques et 11 referentiels OASE"
      icon="mdi-table-column-plus-after"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-file-export-outline">Exporter le dictionnaire</v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-check-decagram-outline">Valider une version</v-btn>
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-tabs v-model="tab" color="primary" density="compact" class="mb-3">
      <v-tab value="attributs" prepend-icon="mdi-format-list-numbered">17 attributs</v-tab>
      <v-tab value="entites" prepend-icon="mdi-database-outline">9 entites</v-tab>
      <v-tab value="referentiels" prepend-icon="mdi-shape-plus">11 referentiels</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="attributs">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-data-table :headers="attributeHeaders" :items="attributes" hover>
            <template #item.obligatoire="{ item }">
              <v-chip :color="item.obligatoire ? 'success' : 'secondary'" size="x-small" variant="tonal">
                {{ item.obligatoire ? 'Oui' : 'Non' }}
              </v-chip>
            </template>
            <template #item.statut="{ item }">
              <v-chip :color="statusColor(item.statut)" size="x-small" variant="outlined">{{ item.statut }}</v-chip>
            </template>
          </v-data-table>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Regles de completude visibles</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Blocage si liquidation incomplete" prepend-icon="mdi-lock-alert-outline" />
            <v-list-item title="Controle des pieces premier rang par type de beneficiaire" prepend-icon="mdi-file-certificate-outline" />
            <v-list-item title="Controle brut taxable / taux applique / montant exonere" prepend-icon="mdi-calculator-variant-outline" />
            <v-list-item title="Horodatage, utilisateur de saisie et piece probante avec hash" prepend-icon="mdi-history" />
          </v-list>
        </v-card>
      </v-window-item>

      <v-window-item value="entites">
        <v-row>
          <v-col v-for="entity in entities" :key="entity.nom" cols="12" md="6" lg="4">
            <v-card rounded="lg" elevation="1" class="h-100">
              <v-card-text class="pa-4">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="text-body-2 font-weight-semibold">{{ entity.nom }}</div>
                  <v-chip :color="statusColor(entity.statut)" size="x-small" variant="tonal">{{ entity.statut }}</v-chip>
                </div>
                <div class="text-caption text-medium-emphasis mb-3">{{ entity.description }}</div>
                <div class="text-caption mb-1"><strong>Champs critiques :</strong> {{ entity.champs }}</div>
                <div class="text-caption"><strong>Vues cibles :</strong> {{ entity.vues }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <v-window-item value="referentiels">
        <v-card rounded="lg" elevation="1">
          <v-data-table :headers="referentialHeaders" :items="referentials" hover>
            <template #item.statut="{ item }">
              <v-chip :color="statusColor(item.statut)" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'

const tab = ref('attributs')

const kpis = [
  { label: 'Attributs O2 visibles', value: '17 / 17', icon: 'mdi-check-all', color: 'success', subtitle: 'Dictionnaire maquette' },
  { label: 'Entites logiques', value: '9', icon: 'mdi-database-outline', color: 'primary', subtitle: 'Modele cible OASE' },
  { label: 'Referentiels normes', value: '11', icon: 'mdi-shape-plus', color: 'info', subtitle: 'Nomenclatures officielles' },
  { label: 'Regles bloquantes', value: '4', icon: 'mdi-lock-alert-outline', color: 'warning', subtitle: 'Qualite et completude' },
]

const attributeHeaders = [
  { title: '#', key: 'id' },
  { title: 'Attribut', key: 'nom' },
  { title: 'Description', key: 'description' },
  { title: 'Obligatoire', key: 'obligatoire' },
  { title: 'Statut maquette', key: 'statut' },
]

const attributes = [
  { id: 1, nom: 'id_mesure', description: 'Identifiant unique de mesure derogatoire', obligatoire: true, statut: 'Visible' },
  { id: 2, nom: 'id_base_juridique + articles_concernes', description: 'Texte source et articles rattaches', obligatoire: true, statut: 'Visible' },
  { id: 3, nom: 'id_beneficiaire + nif', description: 'Beneficiaire et identifiant fiscal', obligatoire: true, statut: 'Visible' },
  { id: 4, nom: 'id_decision / numero_attestation', description: 'Decision d octroi ou reference acte', obligatoire: true, statut: 'Visible' },
  { id: 5, nom: 'code_additionnel', description: 'Code douane ou impots d aggregation SI', obligatoire: true, statut: 'Visible' },
  { id: 6, nom: 'id_systeme_source + numero_operation_si', description: 'Source technique et reference operationnelle', obligatoire: true, statut: 'Visible' },
  { id: 7, nom: 'date_operation', description: 'Date de liquidation ou d operation', obligatoire: true, statut: 'Visible' },
  { id: 8, nom: 'montant_brut_taxable', description: 'Base taxable avant exoneration', obligatoire: true, statut: 'Ajoute V2' },
  { id: 9, nom: 'montant_exonere', description: 'Montant effectivement exonere', obligatoire: true, statut: 'Visible' },
  { id: 10, nom: 'taux_applique', description: 'Taux de taxe ou taux prefere ntiel applique', obligatoire: true, statut: 'Ajoute V2' },
  { id: 11, nom: 'id_organe_attribution', description: 'Autorite attributrice de la mesure', obligatoire: true, statut: 'Visible' },
  { id: 12, nom: 'id_organe_gestion', description: 'Structure gestionnaire de la mesure', obligatoire: true, statut: 'Visible' },
  { id: 13, nom: 'id_secteur + id_branche', description: 'Secteur et branche NES', obligatoire: true, statut: 'Visible' },
  { id: 14, nom: 'id_type_objectif + id_odd', description: 'Objectif politique publique et ODD', obligatoire: true, statut: 'Visible' },
  { id: 15, nom: 'est_df + evalue_2024', description: 'Qualification depense fiscale et statut d evaluation', obligatoire: true, statut: 'Visible' },
  { id: 16, nom: 'id_utilisateur_saisie + horodatage', description: 'Trace de saisie et horodatage', obligatoire: true, statut: 'Visible' },
  { id: 17, nom: 'pdf_piece_justificative + hash', description: 'Piece probante et empreinte SHA-256', obligatoire: true, statut: 'Ajoute V2' },
]

const entities = [
  { nom: 'MESURE_DEROGATOIRE', description: 'Noyau de suivi de la mesure et de sa validite', champs: 'id_mesure, regime, duree, statut', vues: 'Registre central / tableaux', statut: 'Visible' },
  { nom: 'BASE_JURIDIQUE', description: 'Texte, article, type acte et famille juridique', champs: 'id_base_juridique, articles, type acte', vues: 'Registre / referentiel', statut: 'Visible' },
  { nom: 'BENEFICIAIRE', description: 'Identite, NIF, typologie et confidentialite', champs: 'id_beneficiaire, nif, type', vues: 'Registre / formulaires', statut: 'Visible' },
  { nom: 'DEMANDE_EXONERATION', description: 'Demande initiale, pieces et dates de depot', champs: 'numero dossier, depot, pieces', vues: 'Parcours portail / workflow', statut: 'Visible' },
  { nom: 'DECISION_OCTROI', description: 'Acte d octroi, attestation, agrement ou convention', champs: 'id_decision, numero attestation', vues: 'Workflow / validation', statut: 'Visible' },
  { nom: 'EXECUTION_LIQUIDATION', description: 'Operation SI et montant liquide ou exonere', champs: 'code additionnel, montant, date', vues: 'Workflow CDDI / registre', statut: 'Visible' },
  { nom: 'ALERTE', description: 'Anomalies, echeances et alertes automatiques', champs: 'type, severite, statut', vues: 'Notifications / gouvernance', statut: 'Visible' },
  { nom: 'UTILISATEUR', description: 'Auteur de saisie, roles et habilitations', champs: 'id utilisateur, role', vues: 'Admin / profil', statut: 'Visible' },
  { nom: 'JOURNAL', description: 'Historique et preuves de consultation/modification', champs: 'horodatage, action, preuve', vues: 'Audit / GED', statut: 'Visible' },
]

const referentialHeaders = [
  { title: 'Referentiel', key: 'nom' },
  { title: 'Description', key: 'description' },
  { title: 'Point focal', key: 'pointFocal' },
  { title: 'Statut', key: 'statut' },
]

const referentials = [
  { nom: 'R_FAMILLE_TEXTE', description: 'Famille des textes juridiques', pointFocal: 'UPF', statut: 'Visible' },
  { nom: 'R_TYPE_ACTE', description: 'Loi, decret, convention, accord, arrete, agrement', pointFocal: 'UPF', statut: 'Visible' },
  { nom: 'R_NATURE_MESURE', description: 'Nature de la mesure derogatoire', pointFocal: 'UPF', statut: 'Visible' },
  { nom: 'R_IMPOT_TAXE', description: 'Impot ou taxe concerne', pointFocal: 'OTR', statut: 'Visible' },
  { nom: 'R_TYPE_BENEFICIAIRE', description: 'Entreprise, ONG, OI, corps diplomatique, projet', pointFocal: 'MEF', statut: 'Visible' },
  { nom: 'R_SECTEUR_BRANCHE', description: 'Nomenclature NES secteur et branche', pointFocal: 'INSEED', statut: 'Visible' },
  { nom: 'R_OBJECTIF_POLITIQUE', description: 'Objectif fiscal, economique, social ou sectoriel', pointFocal: 'UPF', statut: 'Visible' },
  { nom: 'R_ORGANE', description: 'Organe attributaire, gestionnaire ou de controle', pointFocal: 'MEF / OTR', statut: 'Visible' },
  { nom: 'R_SYSTEME_INFORMATION', description: 'Sydonia, E-TAX, DAS, GUDEF, SIGFiP, SIGTAS', pointFocal: 'DSI/MEF', statut: 'Visible' },
  { nom: 'R_PORTEE_DUREE', description: 'Temporaire, permanente, renouvelable, par phase', pointFocal: 'UPF', statut: 'Visible' },
  { nom: 'R_FONCTION_BUDGETAIRE', description: 'Classification budgetaire de rattachement', pointFocal: 'DGBF', statut: 'Visible' },
]

const statusColor = (value: string) =>
  ({ Visible: 'success', 'Ajoute V2': 'primary' } as Record<string, string>)[value] || 'secondary'
</script>
