<template>
  <div>
    <!-- Public navbar -->
    <v-app-bar color="surface" elevation="1" height="64">
      <v-container class="d-flex align-center ga-3 py-0" style="max-width:1280px">
        <router-link to="/opendata" class="d-flex align-center ga-2 text-decoration-none">
          <v-icon icon="mdi-shield-check" color="primary" size="26" />
          <div>
            <div style="font-size:1rem;font-weight:700;color:#2774AE;line-height:1">OASE</div>
            <div class="label-micro" style="color:#6B7280">Open Data</div>
          </div>
        </router-link>
        <v-spacer />
        <v-btn variant="text" size="small" to="/opendata">Accueil</v-btn>
        <v-btn variant="text" size="small" to="/opendata/tableaux-de-bord">Tableaux de bord</v-btn>
        <v-btn variant="text" size="small" to="/opendata/datasets">Données</v-btn>
        <v-btn variant="text" size="small" to="/opendata/rapports">Rapports</v-btn>
        <v-divider vertical class="mx-2" />
        <v-btn color="primary" variant="tonal" size="small" to="/login" prepend-icon="mdi-login">
          Connexion
        </v-btn>
      </v-container>
    </v-app-bar>

    <v-main>
      <slot />
    </v-main>

    <!-- Public footer -->
    <v-footer color="secondary" class="py-6 mt-12">
      <v-container style="max-width:1280px">
        <v-row>
          <v-col cols="12" md="4">
            <div class="d-flex align-center ga-2 mb-3">
              <v-icon icon="mdi-shield-check" color="white" size="22" />
              <span style="font-weight:700;color:white;font-size:1rem">OASE Open Data</span>
            </div>
            <p style="font-size:0.82rem;color:rgba(255,255,255,0.7)">
              Portail de transparence fiscale du Togo — données agrégées et anonymisées.
            </p>
          </v-col>
          <v-col cols="6" md="2">
            <div class="label-micro mb-2" style="color:rgba(255,255,255,0.5)">Navigation</div>
            <div v-for="link in footerLinks" :key="link.to">
              <router-link :to="link.to" style="color:rgba(255,255,255,0.8);font-size:0.82rem;text-decoration:none">{{ link.label }}</router-link>
            </div>
          </v-col>
          <v-col cols="6" md="3">
            <div class="label-micro mb-2" style="color:rgba(255,255,255,0.5)">Contact</div>
            <p style="font-size:0.82rem;color:rgba(255,255,255,0.7)">Ministère de l'Économie et des Finances<br/>Lomé, Togo</p>
          </v-col>
          <v-col cols="12" md="3" class="text-md-end">
            <div class="label-micro mb-2" style="color:rgba(255,255,255,0.5)">Accès agents</div>
            <v-btn color="white" variant="outlined" size="small" to="/login" prepend-icon="mdi-lock">
              Espace sécurisé
            </v-btn>
          </v-col>
        </v-row>
        <v-divider class="my-4 border-opacity-25" />
        <div style="font-size:0.72rem;color:rgba(255,255,255,0.5);text-align:center">
          © 2026 MEF Togo — Licence ouverte — Données agrégées et anonymisées · Copyright PERFODEV
        </div>
      </v-container>
    </v-footer>
  </div>
</template>

<script setup lang="ts">
const footerLinks = [
  { to: '/opendata', label: 'Accueil' },
  { to: '/opendata/tableaux-de-bord', label: 'Tableaux de bord' },
  { to: '/opendata/datasets', label: 'Jeux de données' },
  { to: '/opendata/rapports', label: 'Rapports' },
]
</script>
