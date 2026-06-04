<template>
  <v-dialog v-model="open" max-width="660" persistent>
    <v-card rounded="xl">

      <!-- Header -->
      <v-toolbar :color="schema.alertType === 'error' ? 'error' : 'primary'" density="default" flat style="height:auto;min-height:48px">
        <v-icon :icon="typeIcon" class="ms-3 me-2 flex-shrink-0" size="20" />
        <div class="text-body-2 font-weight-semibold py-2 flex-grow-1" style="white-space:normal;line-height:1.4;overflow:visible">{{ doc?.label }}</div>
        <v-chip v-if="doc?.obligatoire === false" color="white" variant="outlined" size="x-small" class="me-2 flex-shrink-0">Selon cas</v-chip>
        <v-btn icon="mdi-close" variant="text" color="white" size="small" class="flex-shrink-0" @click="cancel" />
      </v-toolbar>

      <v-card-text class="pa-5">

        <!-- Règle fiche 34 / Alert unique combiné -->
        <v-alert v-if="schema.regleFiche34" type="error" variant="tonal" rounded="lg" density="compact" class="mb-3 text-caption">
          <strong>Règle fiche 34 obligatoire :</strong> La facture doit indiquer la base légale, la référence de l'attestation et le NIF du bénéficiaire. Date ≤ 3 ans. Plusieurs fichiers possibles (chaque facture doit respecter cette règle).
        </v-alert>

        <!-- Alert contextuelle -->
        <v-alert v-else-if="schema.alert" :type="schema.alertType || 'info'" variant="tonal" rounded="lg" density="compact" class="mb-3 text-caption">
          {{ schema.alert }}
        </v-alert>

        <!-- Liste des factures déjà déposées (multi-file) -->
        <template v-if="schema.multiFile && uploadedFiles.length > 0">
          <div class="text-subtitle-2 font-weight-semibold mb-2">
            <v-icon icon="mdi-file-document-multiple" size="16" class="me-1" />Factures déjà déposées ({{ uploadedFiles.length }})
          </div>
          <v-row dense class="mb-3">
            <v-col v-for="(uf, idx) in uploadedFiles" :key="idx" cols="12">
              <v-card variant="outlined" rounded="lg" class="pa-2 d-flex align-center ga-2">
                <v-icon icon="mdi-file-check" color="success" size="20" />
                <div class="flex-grow-1" style="min-width:0">
                  <div class="text-body-2 font-weight-medium text-truncate">{{ uf.name }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ uf.metadata.numFacture || '' }} — {{ uf.metadata.fournisseur || '' }} — {{ uf.metadata.dateFacture || '' }}
                  </div>
                </div>
                <v-btn icon="mdi-close" size="x-small" variant="text" color="error" @click="removeUploadedFile(idx)" />
              </v-card>
            </v-col>
          </v-row>
          <v-divider class="my-4" />
        </template>

        <!-- Champs dynamiques -->
        <v-row dense>
          <v-col v-for="field in schema.fields" :key="field.id" :cols="field.cols || 12" :md="field.md || 6">
            <v-select
              v-if="field.type === 'select'"
              :model-value="fieldValue(field.id)"
              @update:model-value="(v) => setFieldValue(field.id, v)"
              :items="field.options"
              :label="field.label"
              :hint="field.hint"
              :persistent-hint="!!field.hint"
              density="compact"
              hide-details="auto"
              :rules="field.required ? [v => !!v || 'Champ obligatoire'] : []"
            />
            <v-checkbox
              v-else-if="field.type === 'checkbox'"
              :model-value="fieldValue(field.id) === 'true'"
              :label="field.label"
              :hint="field.hint"
              :persistent-hint="!!field.hint"
              hide-details="auto"
              density="compact"
              @update:model-value="(v) => setFieldValue(field.id, v)"
            />
            <v-text-field
              v-else
              :model-value="fieldValue(field.id)"
              @update:model-value="(v) => setFieldValue(field.id, v)"
              :label="field.label"
              :type="field.type"
              :hint="field.hint"
              :persistent-hint="!!field.hint"
              :placeholder="field.placeholder"
              density="compact"
              hide-details="auto"
              :rules="field.required ? [v => !!v || 'Champ obligatoire'] : []"
            />
          </v-col>
        </v-row>

        <!-- Règle fiche 34 checklist en grille 2 colonnes -->
        <v-card v-if="schema.regleFiche34" variant="tonal" color="error" rounded="lg" class="pa-3 mt-3">
          <div class="text-caption font-weight-bold mb-1">Vérification fiche 34 — cochez avant de valider :</div>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-checkbox v-model="check34.baseLegale" label="La facture mentionne la base légale" density="compact" hide-details />
            </v-col>
            <v-col cols="12" sm="6">
              <v-checkbox v-model="check34.refAttestation" label="La facture mentionne la référence de l'attestation" density="compact" hide-details />
            </v-col>
            <v-col cols="12" sm="6">
              <v-checkbox v-model="check34.nifBenef" label="La facture mentionne le NIF du bénéficiaire" density="compact" hide-details />
            </v-col>
            <v-col cols="12" sm="6">
              <v-checkbox v-model="check34.dateMoins3ans" label="La facture date de moins de 3 ans" density="compact" hide-details />
            </v-col>
          </v-row>
        </v-card>

        <!-- Zone de dépôt fichier compacte -->
        <v-divider class="my-3" />
        <div class="text-subtitle-2 font-weight-semibold mb-2">
          <v-icon icon="mdi-paperclip" size="16" class="me-1" />{{ schema.multiFile ? 'Fichier de la facture' : 'Fichier du document' }}
        </div>
        <v-card
          variant="outlined"
          rounded="lg"
          class="pa-3 text-center cursor-pointer"
          :color="(schema.multiFile ? currentFileName : fileName) ? 'success' : undefined"
          style="border-style:dashed"
          @click="triggerFileInput"
          @dragover.prevent
          @drop.prevent="handleDrop"
        >
          <input ref="fileInputRef" type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" class="d-none" @change="handleFileChange" />
          <template v-if="!(schema.multiFile ? currentFileName : fileName)">
            <v-icon icon="mdi-cloud-upload-outline" size="24" color="primary" class="mb-1" />
            <div class="text-caption text-medium-emphasis font-weight-medium">Cliquez ou glissez votre fichier ici</div>
            <div class="text-caption text-medium-emphasis" style="font-size: 11px !important">{{ schema.acceptFormats || 'PDF, DOCX, JPEG, PNG — max 5 Mo' }}</div>
          </template>
          <template v-else>
            <v-icon icon="mdi-file-check-outline" size="24" color="success" class="mb-1" />
            <div class="text-caption font-weight-semibold text-success">{{ schema.multiFile ? currentFileName : fileName }}</div>
            <div class="text-caption text-success" style="font-size: 11px !important">{{ fileSize }}</div>
            <v-btn size="x-small" variant="text" color="error" class="mt-1" @click.stop="clearFile">Retirer</v-btn>
          </template>
        </v-card>

        <!-- Bouton Ajouter (multi-file) -->
        <v-btn
          v-if="schema.multiFile"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-plus"
          class="mt-3"
          :disabled="!currentCanAdd"
          block
          @click="addCurrentFile"
        >
          Ajouter cette facture
        </v-btn>

        <!-- Erreur validation -->
        <v-alert v-if="validationError" type="error" variant="tonal" rounded="lg" density="compact" class="mt-3">
          {{ validationError }}
        </v-alert>

      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn variant="text" @click="cancel">Annuler</v-btn>
        <v-btn
          color="success"
          variant="tonal"
          prepend-icon="mdi-check"
          :disabled="!canConfirm"
          @click="confirm"
        >
          Valider le document
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface DocField {
  id: string; label: string; type: 'text' | 'date' | 'number' | 'select' | 'checkbox'
  placeholder?: string; hint?: string; options?: string[]
  required?: boolean; cols?: number; md?: number
}
interface UploadedFile {
  name: string; metadata: Record<string, string>
}
interface DocSchema {
  alert?: string; alertType?: 'info' | 'warning' | 'error'
  fields: DocField[]; regleFiche34?: boolean; acceptFormats?: string; multiFile?: boolean
}
interface Doc {
  id: string; label: string; uploaded: boolean; fileName: string
  groupe: string; obligatoire?: boolean; metadata?: Record<string, string>
}

const props = defineProps<{ modelValue: boolean; doc: Doc | null }>()
const emit  = defineEmits<{
  'update:modelValue': [v: boolean]
  'confirmed': [doc: Doc, fileName: string, metadata: Record<string, string>, files?: UploadedFile[]]
}>()

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const fileName   = ref('')
const fileSize   = ref('')
const formData   = ref<Record<string, string>>({})
const fileInputRef = ref<HTMLInputElement | null>(null)
const validationError = ref('')
const check34 = ref<Record<string, boolean>>({ baseLegale: false, refAttestation: false, nifBenef: false, dateMoins3ans: false })
const uploadedFiles = ref<UploadedFile[]>([])        // ← multi-file : liste des factures déposées
const currentFormData = ref<Record<string, string>>({}) // ← formulaire de la facture en cours
const currentFileName = ref('')                        // ← fichier de la facture en cours

watch(() => props.doc, () => {
  fileName.value = ''
  fileSize.value = ''
  formData.value = {}
  validationError.value = ''
  check34.value = { baseLegale: false, refAttestation: false, nifBenef: false, dateMoins3ans: false }
  uploadedFiles.value = []
  currentFormData.value = {}
  currentFileName.value = ''
})

// ── Schémas par document ID ─────────────────────────────────────────────────
const schemas: Record<string, DocSchema> = {
  // ── CDDI / Franchise douanière ──
  dou1: {
    alert: 'Indiquez l\'article exact du CGI, du Code des douanes ou du texte habilitant (LFI, convention, arrêté) qui fonde l\'exonération demandée.',
    alertType: 'info',
    fields: [
      { id: 'codeTexte',   label: 'Code applicable',         type: 'select', required: true, options: ['Accord de siège', "Accord d'établissement", 'Arrêté', 'CGI', 'Code des Douanes', 'Code des Investissements', 'Code Minier', 'Code ZFI', 'Convention minière', 'Convention particulière', 'Décret', 'LFI 2025', 'LFI 2026', 'Note de service', 'Texte communautaire CEDEAO', 'Texte communautaire UEMOA', 'Vienne (Convention)'], md: 6 },
      { id: 'article',     label: 'Article / Référence',     type: 'text',   required: true, placeholder: 'Art. 215 al. 3', md: 6 },
      { id: 'dateTexte',   label: 'Date du texte',           type: 'date',   md: 6 },
      { id: 'observ',      label: 'Observations éventuelles', type: 'text',  md: 6 },
    ],
    acceptFormats: 'PDF — version officielle ou extraite du JORT',
  },
  dou2: {
    alert: 'L\'État modèle A est obligatoire pour les contribuables. Il récapitule les opérations et justifie l\'exonération auprès du CDDI.',
    alertType: 'info',
    fields: [
      { id: 'refModeleA',  label: 'Référence de l\'état modèle A', type: 'text',  required: true, placeholder: 'MA-2026-NNNN', md: 6 },
      { id: 'dateModele',  label: 'Date de l\'état',               type: 'date',  required: true, md: 6 },
      { id: 'periodeCov',  label: 'Période couverte',              type: 'text',  placeholder: 'Ex. : 1er trim. 2026', md: 6 },
      { id: 'montantTot',  label: 'Montant total déclaré (FCFA)',   type: 'number', md: 6 },
    ],
    acceptFormats: 'PDF — document officiel OTR',
  },
  dou3: {
    alert: 'La franchise s\'adresse aux OI et représentations diplomatiques. Elle remplace l\'État modèle A dans le circuit CDDI.',
    alertType: 'warning',
    fields: [
      { id: 'refFranch',   label: 'Référence de la franchise',      type: 'text',  required: true, md: 6 },
      { id: 'dateFranch',  label: 'Date d\'émission',               type: 'date',  required: true, md: 6 },
      { id: 'orgEmetteur', label: 'Organisation émettrice',         type: 'text',  required: true, placeholder: 'PNUD, Ambassade de France…', md: 12 },
    ],
    acceptFormats: 'PDF',
  },
  dou4: {
    alert: 'Factures commerciales — plusieurs fichiers possibles. Chaque facture doit respecter la règle fiche 34.',
    alertType: 'error',
    regleFiche34: true,
    multiFile: true,
    fields: [
      { id: 'numFacture',  label: 'Numéro de facture',              type: 'text',  required: true, md: 6 },
      { id: 'dateFacture', label: 'Date de la facture',             type: 'date',  required: true, md: 6, hint: 'Ne doit pas dater de plus de 3 ans' },
      { id: 'fournisseur', label: 'Fournisseur / Émetteur',         type: 'text',  required: true, md: 8 },
      { id: 'devise',      label: 'Devise',                         type: 'select', options: ['FCFA', 'EUR', 'USD', 'GBP', 'CNY'], md: 4 },
      { id: 'montantFOB',  label: 'Montant FOB (en devise)',        type: 'number', required: true, md: 6 },
      { id: 'montantFCFA', label: 'Équivalent FCFA',                type: 'number', md: 6 },
      { id: 'refAttestFiche34', label: 'Référence attestation mentionnée', type: 'text', md: 8, hint: 'Doit figurer sur la facture — règle fiche 34' },
    ],
    acceptFormats: 'PDF, JPEG, PNG — original ou certifiée conforme',
  },
  dou5: {
    alert: 'Le Bill of Lading (connaissement) est le document de transport maritime qui prouve l\'expédition. Il est obligatoire pour les importations par voie maritime.',
    alertType: 'info',
    fields: [
      { id: 'numBL',        label: 'Numéro de Bill of Lading',      type: 'text',  required: true, md: 6 },
      { id: 'dateBL',       label: 'Date d\'émission',              type: 'date',  required: true, md: 6 },
      { id: 'portCharge',   label: 'Port de chargement',            type: 'text',  required: true, placeholder: 'Ex. : Abidjan, Dakar…', md: 6 },
      { id: 'portDécharge', label: 'Port de déchargement',          type: 'text',  required: true, placeholder: 'Lomé', md: 6 },
      { id: 'armateur',     label: 'Compagnie maritime / Armateur', type: 'text',  md: 6 },
      { id: 'conteneur',    label: 'N° conteneur(s)',               type: 'text',  placeholder: 'MSCU1234567', md: 6 },
    ],
    acceptFormats: 'PDF — original ou télélex',
  },
  dou6: {
    alert: 'La LTA (Lettre de Transport Aérien) est l\'équivalent du Bill of Lading pour les importations par voie aérienne.',
    alertType: 'info',
    fields: [
      { id: 'numLTA',      label: 'Numéro LTA (AWB)',               type: 'text',  required: true, md: 6 },
      { id: 'dateLTA',     label: 'Date d\'émission',               type: 'date',  required: true, md: 6 },
      { id: 'aeroDepart',  label: 'Aéroport de départ',             type: 'text',  required: true, md: 6 },
      { id: 'aeroArrivee', label: 'Aéroport d\'arrivée',            type: 'text',  required: true, placeholder: 'Lomé (LFW)', md: 6 },
      { id: 'compagnie',   label: 'Compagnie aérienne',             type: 'text',  md: 6 },
      { id: 'poids',       label: 'Poids brut (kg)',                type: 'number', md: 6 },
    ],
    acceptFormats: 'PDF — original compagnie ou confirmé',
  },
  dou7: {
    alert: 'Obligatoire pour certaines marchandises réglementées. Vérifiez si votre type de marchandise requiert une autorisation préalable d\'importation.',
    alertType: 'warning',
    fields: [
      { id: 'numAutoris',  label: 'N° autorisation d\'importation', type: 'text',  required: true, md: 6 },
      { id: 'dateAutoris', label: 'Date de délivrance',             type: 'date',  required: true, md: 6 },
      { id: 'ministereEm', label: 'Ministère émetteur',             type: 'text',  required: true, placeholder: 'Ex. : Ministère du Commerce…', md: 8 },
      { id: 'validite',    label: 'Validité (mois)',                type: 'number', md: 4 },
    ],
    acceptFormats: 'PDF — cachet et signature originaux',
  },
  dou8: {
    alert: 'Réservée aux membres du corps diplomatique. La carte consulaire délivrée par le MAE est requise pour bénéficier des franchises sur importations.',
    alertType: 'warning',
    fields: [
      { id: 'numCarte',    label: 'N° de carte consulaire',         type: 'text',  required: true, md: 6 },
      { id: 'titulaire',   label: 'Titulaire',                      type: 'text',  required: true, md: 6 },
      { id: 'poste',       label: 'Poste / Mission diplomatique',   type: 'text',  required: true, md: 8 },
      { id: 'validiteC',   label: 'Date de validité',               type: 'date',  required: true, md: 4 },
    ],
    acceptFormats: 'PDF — recto/verso',
  },
  dou9: {
    alert: 'Le NIF doit être en cours de validité. Il sera rapproché avec le registre E-TAX lors de l\'instruction.',
    alertType: 'info',
    fields: [
      { id: 'numNIF',      label: 'Numéro NIF',                     type: 'text',  required: true, placeholder: 'TG-XXX-AAAA-X', md: 6 },
      { id: 'validNIF',    label: 'Date de validité',               type: 'date',  required: true, md: 6 },
    ],
    acceptFormats: 'PDF — carte originale recto',
  },

  // ── CI standard — critères éliminatoires ──
  l1: {
    alert: 'Le quitus fiscal (ou attestation de régularité) prouve l\'absence de dettes fiscales actives auprès de l\'OTR. Document de moins de 3 mois.',
    alertType: 'info',
    fields: [
      { id: 'refQuitus',   label: 'Référence du quitus fiscal',     type: 'text',  required: true, md: 6 },
      { id: 'dateQuitus',  label: 'Date d\'émission',               type: 'date',  required: true, md: 6, hint: 'Document de moins de 3 mois requis' },
      { id: 'periodeValQ', label: 'Période de validité',            type: 'text',  placeholder: 'Ex. : Jan–Mar 2026', md: 6 },
      { id: 'autorite',    label: 'Structure OTR émettrice',        type: 'select', options: ['CDDI', 'CI – Centre des Impôts', 'CI – Direction Grandes Entreprises', 'CI – Direction Moyennes Entreprises'], md: 6 },
    ],
  },
  l3: {
    alert: 'La carte d\'immatriculation fiscale doit être en cours de validité. Le NIF sera vérifié dans E-TAX lors de l\'instruction.',
    alertType: 'info',
    fields: [
      { id: 'numNIF2',     label: 'Numéro NIF',                     type: 'text',  required: true, placeholder: 'TG-XXX-AAAA-X', md: 6 },
      { id: 'validNIF2',   label: 'Date de validité',               type: 'date',  required: true, md: 6 },
    ],
  },
  l5: {
    alert: 'PV de la dernière réunion du Conseil d\'Administration ou de l\'Assemblée Générale des actionnaires.',
    alertType: 'info',
    fields: [
      { id: 'datePV',      label: 'Date de la réunion',             type: 'date',  required: true, md: 6 },
      { id: 'typeReunion', label: 'Type de réunion',                type: 'select', options: ['Assemblée Générale Extraordinaire', 'Assemblée Générale Ordinaire', 'Conseil d\'Administration'], md: 6 },
      { id: 'orderJour',   label: 'Point principal à l\'ordre du jour', type: 'text', md: 12 },
    ],
  },
  l6: {
    alert: 'Le quitus social prouve la régularité vis-à-vis de la CNSS (cotisations sociales à jour).',
    alertType: 'info',
    fields: [
      { id: 'refQS',       label: 'Référence quitus social',        type: 'text',  required: true, md: 6 },
      { id: 'dateQS',      label: 'Date d\'émission',               type: 'date',  required: true, md: 6 },
    ],
  },

  // ── Factures commerciales CI — multi-upload ──
  l_t5: {
    alert: 'Factures commerciales — plusieurs fichiers possibles. Chaque facture doit respecter la règle fiche 34.',
    alertType: 'error',
    regleFiche34: true,
    multiFile: true,
    fields: [
      { id: 'numFacture',  label: 'Numéro de facture',              type: 'text',  required: true, md: 6 },
      { id: 'dateFacture', label: 'Date de la facture',             type: 'date',  required: true, md: 6, hint: 'Ne doit pas dater de plus de 3 ans' },
      { id: 'fournisseur', label: 'Fournisseur / Émetteur',         type: 'text',  required: true, md: 8 },
      { id: 'montantTTC',  label: 'Montant TTC (FCFA)',             type: 'number', required: true, md: 4 },
      { id: 'refAttestFiche34', label: 'Référence attestation mentionnée', type: 'text', md: 12, hint: 'Doit figurer sur la facture — règle fiche 34' },
    ],
    acceptFormats: 'PDF, JPEG, PNG — original ou certifiée conforme',
  },
  n_t5: {
    alert: 'Factures commerciales — plusieurs fichiers possibles. Chaque facture doit respecter la règle fiche 34.',
    alertType: 'error',
    regleFiche34: true,
    multiFile: true,
    fields: [
      { id: 'numFacture',  label: 'Numéro de facture',              type: 'text',  required: true, md: 6 },
      { id: 'dateFacture', label: 'Date de la facture',             type: 'date',  required: true, md: 6, hint: 'Ne doit pas dater de plus de 3 ans' },
      { id: 'fournisseur', label: 'Fournisseur / Émetteur',         type: 'text',  required: true, md: 8 },
      { id: 'montantTTC',  label: 'Montant TTC (FCFA)',             type: 'number', required: true, md: 4 },
      { id: 'refAttestFiche34', label: 'Référence attestation mentionnée', type: 'text', md: 12, hint: 'Doit figurer sur la facture — règle fiche 34' },
    ],
    acceptFormats: 'PDF, JPEG, PNG — original ou certifiée conforme',
  },
  p_t5: {
    alert: 'Factures commerciales — plusieurs fichiers possibles. Chaque facture doit respecter la règle fiche 34.',
    alertType: 'error',
    regleFiche34: true,
    multiFile: true,
    fields: [
      { id: 'numFacture',  label: 'Numéro de facture',              type: 'text',  required: true, md: 6 },
      { id: 'dateFacture', label: 'Date de la facture',             type: 'date',  required: true, md: 6, hint: 'Ne doit pas dater de plus de 3 ans' },
      { id: 'fournisseur', label: 'Fournisseur / Émetteur',         type: 'text',  required: true, md: 8 },
      { id: 'montantTTC',  label: 'Montant TTC (FCFA)',             type: 'number', required: true, md: 4 },
      { id: 'refAttestFiche34', label: 'Référence attestation mentionnée', type: 'text', md: 12, hint: 'Doit figurer sur la facture — règle fiche 34' },
    ],
    acceptFormats: 'PDF, JPEG, PNG — original ou certifiée conforme',
  },

  // ── Zone Franche ──
  zf1: {
    alert: 'Formulaire de demande d\'agrément Zone Franche disponible au guichet API-ZF ou en téléchargement.',
    alertType: 'info',
    fields: [
      { id: 'refDemande',  label: 'Référence de la demande API-ZF', type: 'text',  md: 6 },
      { id: 'dateDemande', label: 'Date de dépôt',                  type: 'date',  md: 6 },
    ],
  },
  zf2: {
    alert: 'Le plan d\'affaires doit démontrer la viabilité économique, les emplois projetés et le taux d\'exportation.',
    alertType: 'info',
    fields: [
      { id: 'periodePlan', label: 'Période couverte (en années)',    type: 'number', required: true, md: 6 },
      { id: 'validPlan',   label: 'Validé par (auditeur/conseil)',   type: 'text',  md: 6 },
      { id: 'caProj',      label: 'CA projeté année 3 (FCFA)',      type: 'number', hint: 'Doit être cohérent avec le taux d\'export déclaré', md: 6 },
      { id: 'exportPct',   label: 'Part export projetée (%)',        type: 'number', md: 6 },
    ],
    acceptFormats: 'PDF — signé par le dirigeant',
  },
  zf4: {
    alert: 'Garantie bancaire ou attestation de disponibilité des fonds pour financer le programme d\'investissement.',
    alertType: 'warning',
    fields: [
      { id: 'nomBanque',   label: 'Banque émettrice',               type: 'text',  required: true, md: 6 },
      { id: 'montantGar',  label: 'Montant garanti (FCFA)',         type: 'number', required: true, md: 6 },
      { id: 'dateGar',     label: 'Date d\'émission',               type: 'date',  required: true, md: 6 },
      { id: 'validGar',    label: 'Validité',                       type: 'date',  md: 6 },
    ],
  },

  // ── Code des Investissements ──
  ci1: {
    alert: 'Programme d\'investissement structuré par phases avec CAPEX détaillés. Élément central de la grille de classement API-ZF.',
    alertType: 'info',
    fields: [
      { id: 'nbPhases',    label: 'Nombre de phases prévues',       type: 'number', required: true, md: 4 },
      { id: 'dureeTotal',  label: 'Durée totale du programme (ans)', type: 'number', required: true, md: 4 },
      { id: 'capexTotal',  label: 'CAPEX total (FCFA)',             type: 'number', required: true, md: 4 },
      { id: 'emploisCI',   label: 'Total emplois directs projetés', type: 'number', required: true, md: 6 },
      { id: 'pctNation',   label: '% ressortissants nationaux',     type: 'number', md: 6, hint: 'Minimum 60%' },
    ],
    acceptFormats: 'PDF — signé et certifié',
  },

  // ── Convention minière ──
  min1: {
    alert: 'La demande de permis est le point d\'entrée obligatoire du régime. Sans permis, aucune convention ne peut être négociée.',
    alertType: 'error',
    fields: [
      { id: 'typePermDem', label: 'Type de permis',                 type: 'select', required: true, options: ["Permis d'exploitation", 'Permis de production pétrolière', 'Permis de recherche', 'Permis de transport'], md: 6 },
      { id: 'dateDepPerm', label: 'Date de dépôt',                  type: 'date',  required: true, md: 6 },
      { id: 'refPermDem',  label: 'Référence de la demande DGMG',   type: 'text',  md: 6 },
      { id: 'zoneGeoMin',  label: 'Zone / Bloc géographique',       type: 'text',  required: true, md: 6 },
    ],
  },
  min2: {
    alert: 'Le plan de travaux détaille les opérations prévues par phase (Recherche / Construction / Exploitation) avec les budgets correspondants.',
    alertType: 'info',
    fields: [
      { id: 'phaseConcern', label: 'Phase concernée',               type: 'select', required: true, options: ['Construction', 'Exploitation', 'Recherche'], md: 6 },
      { id: 'dureeTravaux', label: 'Durée prévue (mois)',           type: 'number', required: true, md: 6 },
      { id: 'budgetPhase',  label: 'Budget phase (FCFA)',           type: 'number', required: true, md: 6 },
      { id: 'techRef',      label: 'Ingénieur / Référent technique', type: 'text', md: 6 },
    ],
    acceptFormats: 'PDF — signé par l\'opérateur',
  },
  min4: {
    alert: 'L\'EIES est requise pour les activités minières ayant un impact environnemental significatif.',
    alertType: 'warning',
    fields: [
      { id: 'refEIES',     label: 'Référence de l\'EIES',           type: 'text',  required: true, md: 6 },
      { id: 'dateEIES',    label: 'Date de validation',             type: 'date',  required: true, md: 6 },
      { id: 'organisme',   label: 'Organisme validateur',           type: 'text',  placeholder: 'Ministère de l\'Environnement', md: 12 },
    ],
  },

  // ── Accord de siège ──
  as1: {
    alert: 'Accord de siège ou convention internationale (Convention de Vienne, Accord ONU, etc.). La copie certifiée est obligatoire.',
    alertType: 'info',
    fields: [
      { id: 'refAccordDoc', label: 'Référence de l\'accord',         type: 'text',  required: true, md: 6 },
      { id: 'dateSignDoc',  label: 'Date de signature',              type: 'date',  required: true, md: 6 },
      { id: 'typeBaseJuri', label: 'Type de base juridique',         type: 'select', required: true, options: ['Accord bilatéral', "Accord d'établissement", 'Accord multilatéral', 'Accord ONU–Togo 1968', 'Arrêté', 'CGI', 'Convention de Vienne', 'Décret', "Ordonnance d'approbation"], md: 6 },
      { id: 'partiesSig',   label: 'Parties signataires',            type: 'text',  placeholder: 'État togolais / PNUD…', md: 6 },
    ],
    acceptFormats: 'PDF — copie certifiée conforme par le MAE',
  },
  as2: {
    alert: 'La note verbale du MAE notifie officiellement l\'OTR et l\'OASE de l\'accord et de ses avantages.',
    alertType: 'info',
    fields: [
      { id: 'numNV',       label: 'N° Note verbale MAE',            type: 'text',  required: true, md: 6 },
      { id: 'dateNV',      label: 'Date de la note verbale',        type: 'date',  required: true, md: 6 },
      { id: 'expedNV',     label: 'Direction MAE expéditrice',      type: 'text',  md: 6 },
      { id: 'destinNV',    label: 'Destinataire (OTR / OASE)',      type: 'text',  md: 6 },
    ],
    acceptFormats: 'PDF — original MAE',
  },
  as3: {
    alert: 'Liste nominative obligatoire à mettre à jour annuellement. Chaque personnel non inscrit ne peut bénéficier des avantages.',
    alertType: 'error',
    fields: [
      { id: 'nbPersonASDoc', label: 'Nombre de personnes sur la liste', type: 'number', required: true, md: 6 },
      { id: 'dateListe',     label: 'Date de la liste',                 type: 'date',   required: true, md: 6 },
      { id: 'signataireL',   label: 'Signataire (Chef de mission)',      type: 'text',   required: true, md: 8 },
      { id: 'validiteListe', label: 'Validité (date de renouvellement)', type: 'date',   hint: 'Obligation annuelle', md: 4 },
    ],
    acceptFormats: 'PDF — signé par le Chef de mission',
  },
  as4: {
    alert: 'Registre des immatriculations de véhicules diplomatiques / officiels utilisés par l\'organisation.',
    alertType: 'info',
    fields: [
      { id: 'nbVehDoc',    label: 'Nombre de véhicules',             type: 'number', required: true, md: 6 },
      { id: 'dateRegVeh',  label: 'Date du registre',                type: 'date',   required: true, md: 6 },
    ],
    acceptFormats: 'PDF — liste officielle',
  },
  as5: {
    alert: 'Carte consulaire délivrée par le MAE. Obligatoire pour les membres du corps diplomatique souhaitant bénéficier des franchises.',
    alertType: 'warning',
    fields: [
      { id: 'numCarteAS',  label: 'N° carte consulaire',             type: 'text',  required: true, md: 6 },
      { id: 'titulaireAS', label: 'Titulaire',                       type: 'text',  required: true, md: 6 },
      { id: 'posteAS',     label: 'Poste diplomatique',              type: 'text',  required: true, md: 8 },
      { id: 'validAS',     label: 'Date de validité',                type: 'date',  required: true, md: 4 },
    ],
    acceptFormats: 'PDF — recto/verso',
  },
}

// Schema générique pour les documents sans schema spécifique
const defaultSchema: DocSchema = {
  alert: "Déposez le document requis. Assurez-vous qu'il est lisible, daté et signé.",
  alertType: 'info',
  fields: [
    { id: 'dateDoc',   label: 'Date du document',  type: 'date', md: 6 },
    { id: 'refDoc',    label: 'Référence / Numéro', type: 'text', md: 6 },
    { id: 'observDoc', label: 'Observations',       type: 'text', md: 12 },
  ],
}

const schema = computed<DocSchema>(() => {
  if (!props.doc) return defaultSchema
  return schemas[props.doc.id] || defaultSchema
})

const typeIcon = computed(() => {
  if (!props.doc) return 'mdi-file-document-outline'
  const id = props.doc.id
  if (id.startsWith('dou')) return 'mdi-truck-outline'
  if (id.startsWith('zf'))  return 'mdi-factory'
  if (id.startsWith('ci'))  return 'mdi-handshake'
  if (id.startsWith('min')) return 'mdi-pickaxe'
  if (id.startsWith('as'))  return 'mdi-flag'
  return 'mdi-file-document-outline'
})

// Validation du formulaire de la facture EN COURS (pour "Ajouter")
const currentCanAdd = computed(() => {
  if (!currentFileName.value) return false
  if (schema.value.regleFiche34) {
    return check34.value.baseLegale && check34.value.refAttestation &&
           check34.value.nifBenef && check34.value.dateMoins3ans
  }
  const requiredFields = schema.value.fields.filter(f => f.required)
  return requiredFields.every(f => !!currentFormData.value[f.id])
})

// Validation globale (pour "Valider le document")
const canConfirm = computed(() => {
  if (schema.value.multiFile) {
    return uploadedFiles.value.length > 0
  }
  if (!fileName.value) return false
  if (schema.value.regleFiche34) {
    return check34.value.baseLegale && check34.value.refAttestation &&
           check34.value.nifBenef && check34.value.dateMoins3ans
  }
  const requiredFields = schema.value.fields.filter(f => f.required)
  return requiredFields.every(f => !!formData.value[f.id])
})

function fieldValue(fieldId: string): string {
  const src = schema.value.multiFile ? currentFormData.value : formData.value
  return src[fieldId] || ''
}
function setFieldValue(fieldId: string, val: unknown) {
  if (schema.value.multiFile) {
    currentFormData.value[fieldId] = String(val)
  } else {
    formData.value[fieldId] = String(val)
  }
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) setFile(file)
}

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (file) setFile(file)
}

function setFile(file: File) {
  if (file.size > 5 * 1024 * 1024) {
    validationError.value = 'Fichier trop volumineux (max 5 Mo).'
    return
  }
  validationError.value = ''
  if (schema.value.multiFile) {
    currentFileName.value = file.name
  } else {
    fileName.value = file.name
  }
  fileSize.value = (file.size / 1024).toFixed(0) + ' Ko'
}

function clearFile() {
  if (schema.value.multiFile) {
    currentFileName.value = ''
  } else {
    fileName.value = ''
  }
  fileSize.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function addCurrentFile() {
  if (!currentCanAdd.value || !schema.value.multiFile) return
  uploadedFiles.value.push({
    name: currentFileName.value,
    metadata: { ...currentFormData.value },
  })
  currentFileName.value = ''
  currentFormData.value = {}
  fileSize.value = ''
  check34.value = { baseLegale: false, refAttestation: false, nifBenef: false, dateMoins3ans: false }
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function removeUploadedFile(index: number) {
  uploadedFiles.value.splice(index, 1)
}

function cancel() {
  open.value = false
}

function confirm() {
  if (!props.doc || !canConfirm.value) return
  if (schema.value.multiFile) {
    emit('confirmed', props.doc, `${uploadedFiles.value.length} facture(s)`, {}, uploadedFiles.value)
  } else {
    emit('confirmed', props.doc, fileName.value, {
      ...Object.fromEntries(
        Object.entries(formData.value).map(([k, v]) => [k, String(v)])
      ),
    })
  }
  open.value = false
}
</script>
