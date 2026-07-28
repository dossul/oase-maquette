<template>
  <div>
    <PageHeader
      title="GED et signatures"
      subtitle="Pièces de premier rang, second rang, versioning documentaire et signatures qualifiées"
      icon="mdi-file-cabinet"
    >
    </PageHeader>

    <v-alert v-if="loadError" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">
      {{ loadError }}
    </v-alert>

    <v-row v-if="loading" class="mb-4">
      <v-col v-for="n in 4" :key="n" cols="6" md="3">
        <v-skeleton-loader type="card" rounded="lg"/>
      </v-col>
    </v-row>

    <v-row v-else class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="7">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Pièces jointes déposées (registre réel)</v-card-title>
          <v-progress-linear v-if="loading" indeterminate color="primary"/>
          <!-- Alimenté par GET /demandes puis GET /demandes/:id/pieces-jointes (données réelles). -->
          <v-data-table :headers="headers" :items="piecesRows" hover>
            <template #item.statut="{ item }">
              <v-chip :color="item.statut === 'valide' ? 'success' : item.statut === 'invalide' ? 'error' : 'warning'" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
            </template>
            <template #no-data>
              <div class="text-center pa-6 text-medium-emphasis">
                <v-icon icon="mdi-file-hidden" size="36" class="mb-2 opacity-40"/>
                <div class="text-body-2">Aucune pièce jointe déposée pour le moment.</div>
              </div>
            </template>
          </v-data-table>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Contrôles probants visibles</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Hash SHA-256 sur pièce justificative" prepend-icon="mdi-shield-key-outline" />
            <v-list-item title="Versioning des actes et pièces" prepend-icon="mdi-source-branch" />
            <v-list-item title="Journal de consultation sensible" prepend-icon="mdi-history" />
            <v-list-item title="Horodatage qualifié TSA" prepend-icon="mdi-clock-check-outline" />
            <v-list-item title="Rétention et archivage documentaire" prepend-icon="mdi-archive-lock-outline" />
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <!-- TODO(endpoint): la signature qualifiée (TSA / PKI souveraine) n'est pas
             instrumentée dans l'API v1 — aucune empreinte réelle à afficher. -->
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Signature qualifiée</v-card-title>
          <v-card-text class="text-center pa-6 text-medium-emphasis">
            <v-icon icon="mdi-pen-lock" size="40" class="mb-2 opacity-40"/>
            <div class="text-body-2">Signature qualifiée non instrumentée.</div>
            <div class="text-caption">L'horodatage TSA et les empreintes de signature seront affichés ici dès que l'endpoint correspondant existera.</div>
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Gabarits couverts</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Attestation CI annuelle" prepend-icon="mdi-file-sign" />
            <v-list-item title="Quittancement douanier" prepend-icon="mdi-receipt-text-check-outline" />
            <v-list-item title="Convention / agrément" prepend-icon="mdi-file-certificate-outline" />
            <v-list-item title="Lettre de relance documentaire" prepend-icon="mdi-email-outline" />
          </v-list>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Matrice de confidentialite</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="rule in confidentialityRules" :key="rule.title" :title="rule.title" :subtitle="rule.subtitle" rounded="lg">
              <template #prepend>
                <v-icon :icon="rule.icon" :color="rule.color" />
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import { listerDemandesApi, listerPiecesJointes, statsDemandesParStatut, type DemandeApi, type PieceJointe } from '../../services/demandes'
import { listerAuditLogs } from '../../services/audit'

const loading = ref(true)
const loadError = ref<string | null>(null)
const totalDossiers = ref(0)
const pieces = ref<{ demande: DemandeApi; piece: PieceJointe }[]>([])
const nbUploadsTraces = ref(0)

const headers = [
  { title: 'Dossier', key: 'dossier' },
  { title: 'Fichier', key: 'fichier' },
  { title: 'Type de pièce', key: 'type' },
  { title: 'Déposée le', key: 'date' },
  { title: 'Statut', key: 'statut' },
]

const piecesRows = computed(() =>
  pieces.value.map(({ demande, piece }) => ({
    dossier: demande.reference,
    fichier: String(piece.nomFichier ?? '—'),
    type: String(piece.typePieceCode ?? '—'),
    date: piece.createdAt ? new Date(String(piece.createdAt)).toLocaleDateString('fr-FR') : '—',
    statut: String(piece.statutCode ?? 'deposee'),
  })),
)

const nbValidees = computed(() => pieces.value.filter(p => String(p.piece.statutCode ?? '') === 'valide').length)

const kpis = computed(() => [
  { label: 'Dossiers au registre', value: totalDossiers.value, icon: 'mdi-folder-multiple-outline', color: 'primary', subtitle: 'GET /demandes/stats/par-statut' },
  { label: 'Pièces jointes déposées', value: pieces.value.length, icon: 'mdi-file-star-outline', color: 'info', subtitle: 'Calculé sur les dossiers réels' },
  { label: 'Pièces validées', value: nbValidees.value, icon: 'mdi-file-check-outline', color: 'success', subtitle: 'Statut « valide »' },
  { label: 'Dépôts tracés (audit)', value: nbUploadsTraces.value, icon: 'mdi-history', color: 'warning', subtitle: 'Journal d\'audit PIECE_JOINTE_UPLOADEE' },
])

const confidentialityRules = [
  { title: 'Public', subtitle: 'Jeux agreges, sans donnees nominatives ni secret fiscal', icon: 'mdi-earth', color: 'success' },
  { title: 'Interne', subtitle: 'Visible aux services habilites, export limite', icon: 'mdi-domain', color: 'info' },
  { title: 'Restreint', subtitle: 'Visible au cercle metier defini dans les habilitations', icon: 'mdi-account-lock-outline', color: 'warning' },
  { title: 'Confidentiel', subtitle: 'Telechargement, impression et partage journalises', icon: 'mdi-eye-lock-outline', color: 'error' },
]

onMounted(async () => {
  loading.value = true
  loadError.value = null
  try {
    const [stats, demandesRes, uploads] = await Promise.all([
      statsDemandesParStatut(),
      listerDemandesApi(),
      listerAuditLogs({ action: 'PIECE_JOINTE_UPLOADEE', limit: 1 }).catch(() => null),
    ])
    totalDossiers.value = stats.reduce((a, s) => a + s.count, 0)
    nbUploadsTraces.value = uploads?.total ?? 0
    const perDemande = await Promise.all(
      demandesRes.data.map(d =>
        listerPiecesJointes(d.id)
          .then(ps => ps.map(piece => ({ demande: d, piece })))
          .catch(() => [] as { demande: DemandeApi; piece: PieceJointe }[]),
      ),
    )
    pieces.value = perDemande.flat()
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Erreur de chargement des données GED'
  } finally {
    loading.value = false
  }
})
</script>
