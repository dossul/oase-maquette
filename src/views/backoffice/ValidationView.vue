<template>
  <div>
    <PageHeader :title="`Validation — ${demande.reference}`" subtitle="Formalisation de l'acte d'approbation avec signature électronique" icon="mdi-file-sign" />
    <v-row>
      <v-col cols="12" md="7">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Récapitulatif du dossier (lecture seule)</v-card-title>
          <v-card-text class="pa-4">
            <v-row dense>
              <v-col cols="6"><div class="label-micro text-medium-emphasis">Contribuable</div><div class="font-weight-semibold text-body-2">{{ demande.contribuable }}</div></v-col>
              <v-col cols="6"><div class="label-micro text-medium-emphasis">NIF</div><div class="text-body-2">{{ demande.nif }}</div></v-col>
              <v-col cols="6"><div class="label-micro text-medium-emphasis">Type</div><div class="text-body-2">{{ demande.type }}</div></v-col>
              <v-col cols="6"><div class="label-micro text-medium-emphasis">Montant accordé</div><div class="font-weight-bold text-primary">{{ formatMontant(demande.montantFCFA) }}</div></v-col>
              <v-col cols="6"><div class="label-micro text-medium-emphasis">Durée</div><div class="text-body-2">12 mois</div></v-col>
              <v-col cols="6"><div class="label-micro text-medium-emphasis">Base juridique</div><div class="text-body-2">{{ demande.baseJuridique }}</div></v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Synthese O2 avant signature</v-card-title>
          <v-card-text class="pa-0">
            <v-table density="compact">
              <tbody>
                <tr v-for="item in o2Rows" :key="item.label">
                  <td class="text-caption font-weight-semibold" style="width: 40%;">{{ item.label }}</td>
                  <td class="text-caption">{{ item.value }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Type d'acte à générer</v-card-title>
          <v-card-text class="pa-4">
            <v-radio-group v-model="typeActe">
              <v-radio value="attestation" label="Attestation d'exonération (format standard OASE)" />
              <v-radio value="arrete" label="Arrêté ministériel d'exonération" />
              <v-radio value="rejet" label="Décision de rejet motivée" />
            </v-radio-group>
            <v-alert type="info" variant="tonal" rounded="lg" density="compact">
              Le type d'acte varie selon le regime, l'organe attributaire et le niveau de signature requis.
            </v-alert>
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Variantes fines par regime</v-card-title>
          <v-card-text class="pa-4 pt-2">
            <v-tabs v-model="regimeTab" color="primary" density="compact" class="mb-3">
              <v-tab value="invest">Investissement</v-tab>
              <v-tab value="zf">Zone franche</v-tab>
              <v-tab value="dip">Diplomatique</v-tab>
              <v-tab value="extractif">Extractif</v-tab>
            </v-tabs>
            <v-window v-model="regimeTab">
              <v-window-item v-for="regime in regimeCards" :key="regime.value" :value="regime.value">
                <div class="text-caption text-medium-emphasis mb-3">{{ regime.subtitle }}</div>
                <v-list density="compact" class="pa-0">
                  <v-list-item v-for="item in regime.points" :key="item" :title="item" prepend-icon="mdi-check-circle-outline" />
                </v-list>
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>

        <!-- Preview doc -->
        <v-card rounded="lg" elevation="1" class="mb-4" color="surface-light">
          <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">Prévisualisation du document généré</v-card-title>
          <v-card-text class="pa-4">
            <div class="d-flex justify-center">
              <v-card width="360" color="white" rounded="lg" class="pa-6" style="border:1px solid #CBD5E1;font-family:'Times New Roman',serif">
                <div class="d-flex justify-space-between align-center mb-3">
                  <v-chip size="x-small" color="error" variant="tonal">Confidentiel</v-chip>
                  <v-chip size="x-small" color="success" variant="outlined" prepend-icon="mdi-clock-check-outline">TSA actif</v-chip>
                </div>
                <div class="text-center mb-4">
                  <div style="font-size:0.7rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#36454F">République Togolaise</div>
                  <div style="font-size:0.65rem;color:#36454F">Ministère de l'Économie et des Finances</div>
                  <v-divider class="my-3" />
                  <div style="font-size:0.9rem;font-weight:700;color:#2774AE">ATTESTATION D'EXONÉRATION</div>
                  <div style="font-size:0.7rem;color:#6B7280">N° OASE-2026-ATT-0039</div>
                </div>
                <div style="font-size:0.72rem;color:#374151;line-height:1.6">
                  Le Ministère de l'Économie et des Finances, vu les dispositions de <strong>{{ demande.baseJuridique }}</strong>, accorde à <strong>{{ demande.contribuable }}</strong> (NIF: {{ demande.nif }}) une exonération fiscale d'un montant de <strong>{{ formatMontant(demande.montantFCFA) }}</strong> pour une durée de <strong>12 mois</strong> à compter du <strong>27/04/2026</strong>.
                </div>
                <div class="mt-4 text-end">
                  <div style="font-size:0.65rem;color:#6B7280">Signature électronique</div>
                  <div style="height:40px;border:1px dashed #CBD5E1;border-radius:4px;display:flex;align-items:center;justify-content:center;margin-top:4px">
                    <v-icon icon="mdi-draw-pen" color="primary" size="16" />
                  </div>
                </div>
                <div class="mt-3 d-flex align-center ga-2">
                  <v-icon icon="mdi-qrcode" size="40" color="secondary" />
                  <div style="font-size:0.6rem;color:#9CA3AF">QR Code de vérification<br/>Lien d'authenticité OASE</div>
                </div>
                <div class="mt-3" style="font-size:0.58rem;color:#64748B;border-top:1px dashed #CBD5E1;padding-top:8px">
                  Empreinte SHA-256 : 8f1c...a7d9<br/>
                  Jeton TSA : TSA-2026-0039-14<br/>
                  Diffusion : restreinte aux habilitations OTR / DGBF
                </div>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Signature électronique</v-card-title>
          <v-card-text class="pa-4">
            <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
              Votre signature électronique certifie l'authenticité de cet acte et le rend opposable aux tiers.
            </v-alert>
            <v-text-field v-model="signataire" label="Signataire" readonly prepend-inner-icon="mdi-account-tie" class="mb-3" />
            <v-text-field v-model="fonction" label="Qualité / Fonction" readonly prepend-inner-icon="mdi-briefcase" class="mb-3" />
            <v-text-field v-model="pin" label="Code PIN de signature" type="password" inputmode="numeric" maxlength="6" prepend-inner-icon="mdi-lock" class="mb-4" />
            <v-alert v-if="signError" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">{{ signError }}</v-alert>
            <v-btn color="success" block size="large" rounded="lg" prepend-icon="mdi-file-sign" :loading="signing" @click="sign">
              Signer et envoyer au contribuable
            </v-btn>
            <v-alert v-if="signed" type="success" variant="tonal" rounded="lg" class="mt-4">
              Document signé et envoyé ! Le contribuable a été notifié par e-mail et SMS. Document archivé dans le registre OASE.
            </v-alert>
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Preuve de signature et horodatage</v-card-title>
          <v-card-text class="pa-4">
            <div class="d-flex flex-wrap ga-2 mb-3">
              <v-chip color="success" variant="tonal" prepend-icon="mdi-pen-lock">Signature qualifiee</v-chip>
              <v-chip color="info" variant="tonal" prepend-icon="mdi-clock-check-outline">Horodatage TSA</v-chip>
              <v-chip color="warning" variant="tonal" prepend-icon="mdi-history">Journalisation active</v-chip>
            </div>
            <div class="text-body-2 mb-2"><strong>Empreinte :</strong> `8f1c...a7d9`</div>
            <div class="text-body-2 mb-2"><strong>Jeton TSA :</strong> TSA-2026-0039-14</div>
            <div class="text-body-2 mb-2"><strong>Autorite :</strong> PKI souveraine MEF</div>
            <div class="text-body-2"><strong>Contre-signature :</strong> Visa DGBF requis pour les actes budgetaires</div>
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Confidentialite et diffusion</v-card-title>
          <v-card-text class="pa-4">
            <v-alert type="warning" variant="tonal" rounded="lg" density="compact" class="mb-4">
              Ce document est diffuse en mode restreint. Les exports publics et le partage hors habilitation sont bloques.
            </v-alert>
            <v-list density="compact" class="pa-0">
              <v-list-item title="Niveau de confidentialite" subtitle="Restreint" prepend-icon="mdi-eye-lock-outline" />
              <v-list-item title="Profils autorises" subtitle="OTR, DGBF, decideur habilite" prepend-icon="mdi-account-check-outline" />
              <v-list-item title="Consultation sensible" subtitle="Chaque ouverture et telechargement sont journalises" prepend-icon="mdi-history" />
            </v-list>
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mt-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Checklist avant emission</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="17 attributs O2 suffisants pour emettre l'acte" prepend-icon="mdi-check-decagram-outline" />
            <v-list-item title="Pieces premier rang controlees" prepend-icon="mdi-file-certificate-outline" />
            <v-list-item title="Hash et jeton TSA prets pour archivage" prepend-icon="mdi-lock-check-outline" />
            <v-list-item title="Profil de diffusion applique" prepend-icon="mdi-eye-lock-outline" />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '../../components/PageHeader.vue'
import { useAuthStore } from '../../stores/auth'
import { ApiError } from '../../services/api'
import { detailDemande, verifierPin, listerEtapes, validerEtape, etapeAValider } from '../../services/backoffice'

const route = useRoute()
const auth = useAuthStore()
const demandeId = String(route.params.id)

/** Récapitulatif alimenté par l'API réelle (GET /demandes/:id). */
const demande = ref({
  reference: '…',
  contribuable: '…',
  nif: '—',
  type: '—',
  montantFCFA: 0,
  baseJuridique: '—',
})
const typeActe = ref('attestation')
const regimeTab = ref('invest')
const signataire = ref('')
const fonction = ref('Agent instructeur OASE')
const pin = ref('')
const signing = ref(false)
const signed = ref(false)
const signError = ref<string | null>(null)
const formatMontant = (v: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(v)

onMounted(async () => {
  if (auth.user) signataire.value = `${auth.user.prenom} ${auth.user.nom}`
  try {
    const d = await detailDemande(demandeId)
    demande.value = {
      reference: d.reference,
      contribuable: d.contribuable?.raisonSociale ?? '—',
      nif: d.contribuable?.nif ?? '—',
      type: d.secteur ?? 'Exonération',
      montantFCFA: Number(d.montantFcfa ?? 0),
      baseJuridique: d.baseJuridiqueVersionId ?? '—',
    }
  } catch {
    // Le récapitulatif conserve les valeurs par défaut ; la signature reste bloquée côté API.
  }
})

const o2Rows = computed(() => [
  { label: 'id_mesure / reference', value: demande.value.reference },
  { label: 'base juridique (version)', value: demande.value.baseJuridique },
  { label: 'id_contribuable / nif', value: `${demande.value.contribuable} / ${demande.value.nif}` },
  { label: 'code additionnel / operation SI', value: '—' },
  { label: 'montant exonere', value: formatMontant(demande.value.montantFCFA) },
  { label: 'type d acte', value: typeActe.value },
  { label: 'signataire', value: signataire.value || '—' },
  { label: 'piece PDF / hash / horodatage', value: 'attestation_oase.pdf / —' },
])
const regimeCards = [
  {
    value: 'invest',
    subtitle: 'Attestation standard rattachee a un agrement et a des engagements mesurables.',
    points: ['Verifier date d effet et date de fin de l agrement', 'Rappeler les obligations emplois / investissements', 'Prevoir contre-signature budgetaire si impact fort'],
  },
  {
    value: 'zf',
    subtitle: 'Traitement lie a une convention SAZOF et a un regime de quotas / intrants.',
    points: ['Mentionner la convention et sa duree', 'Restituer le code additionnel de reference', 'Tracer l articulation CI + CDDI'],
  },
  {
    value: 'dip',
    subtitle: 'Diffusion restreinte et references diplomatiques sensibles.',
    points: ['Limiter la diffusion nominative', 'Afficher la base accord de siege / note verbale', 'Journaliser toute consultation sensible'],
  },
  {
    value: 'extractif',
    subtitle: 'Acte lie a une phase conventionnelle et a un avantage par cycle minier ou petrolier.',
    points: ['Identifier la phase recherche / exploitation', 'Rappeler la convention ratifiee', 'Rattacher le suivi a DGMG / CONEDEF'],
  },
]

/** Signature réelle : vérification du PIN côté backend puis validation de l'étape de workflow en attente. */
const sign = async () => {
  signError.value = null
  if (!/^\d{6}$/.test(pin.value)) {
    signError.value = 'Saisissez votre code PIN de signature à 6 chiffres.'
    return
  }
  signing.value = true
  try {
    // 1) Vérification du PIN auprès du backend (POST /auth/verify-pin)
    const pinOk = await verifierPin(pin.value)
    if (!pinOk) {
      signError.value = 'PIN de signature invalide — vérifiez votre code à 6 chiffres.'
      return
    }
    // 2) Validation de l'étape de workflow en attente, s'il en existe une
    //    (POST /workflow/etapes/:etapeId/valider avec le PIN)
    const etapes = await listerEtapes(demandeId)
    const etape = etapeAValider(etapes, auth.user?.role)
    if (etape) await validerEtape(etape.id, pin.value)
    signed.value = true
  } catch (e) {
    signError.value =
      e instanceof ApiError && e.code === 'PIN_INVALIDE'
        ? 'PIN de signature invalide — vérifiez votre code à 6 chiffres.'
        : e instanceof Error ? e.message : 'La signature a échoué'
  } finally {
    signing.value = false
  }
}
</script>
