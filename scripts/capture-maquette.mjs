import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium, devices } from 'playwright'

const baseUrl = process.env.MAQUETTE_BASE_URL || 'http://127.0.0.1:4174'
const rootDir = path.resolve('screenshots_maquette')

const personaDirs = {
  demo: 'par_persona/00_entree_demo',
  p1: 'par_persona/P1_beneficiaire',
  p2: 'par_persona/P2_regie_financiere',
  p2bis: 'par_persona/P2bis_tresor_gudef',
  p3: 'par_persona/P3_agence',
  p3bis: 'par_persona/P3bis_ministeres_sectoriels',
  p3ter: 'par_persona/P3ter_mae_accords_siege',
  p3quater: 'par_persona/P3quater_extractif',
  p4: 'par_persona/P4_decideur',
  p4bis: 'par_persona/P4bis_conedef',
  p5: 'par_persona/P5_audit',
  p6: 'par_persona/P6_opendata_public',
  p7: 'par_persona/P7_admin',
  p7bis: 'par_persona/P7bis_dsi_mef',
  transversal: 'par_persona/transversal',
  mobile: 'par_persona/mobile_projection',
}

const processDirs = {
  auth: 'par_processus/01_auth_et_entree',
  portail: 'par_processus/02_portail_beneficiaire',
  backoffice: 'par_processus/03_instruction_validation_backoffice',
  workflows: 'par_processus/04_workflows_regimes',
  agences: 'par_processus/05_agences_conventions_engagements',
  decideur: 'par_processus/06_pilotage_decideur',
  tresor: 'par_processus/07_tresor_rapprochements_archives',
  institutions: 'par_processus/08_institutions_specialisees',
  audit: 'par_processus/09_audit_controle',
  opendata: 'par_processus/10_open_data',
  admin: 'par_processus/11_administration_gouvernance',
  mobile: 'par_processus/12_mobile',
  notifications: 'par_processus/13_transverse_notifications',
}

const routes = [
  { name: '01_login', route: '/login', persona: personaDirs.demo, process: processDirs.auth },
  { name: '02_mfa', route: '/mfa', persona: personaDirs.demo, process: processDirs.auth },
  { name: '03_reset-password', route: '/reset-password', persona: personaDirs.demo, process: processDirs.auth },
  { name: '04_activate', route: '/activate', persona: personaDirs.demo, process: processDirs.auth },
  { name: '05_mobile-mvp', route: '/mobile/mvp', persona: personaDirs.mobile, process: processDirs.mobile, device: 'iPhone 13' },

  { name: '06_portail-dashboard', route: '/portail/dashboard', persona: personaDirs.p1, process: processDirs.portail },
  { name: '07_portail-nouvelle-demande', route: '/portail/nouvelle-demande', persona: personaDirs.p1, process: processDirs.portail },
  { name: '08_portail-demande-detail', route: '/portail/demandes/DEMO-001', persona: personaDirs.p1, process: processDirs.portail },
  { name: '09_portail-exonerations-actives', route: '/portail/exonerations-actives', persona: personaDirs.p1, process: processDirs.portail },
  { name: '10_portail-profil', route: '/portail/profil', persona: personaDirs.p1, process: processDirs.portail },

  { name: '11_backoffice-dashboard', route: '/backoffice/dashboard', persona: personaDirs.p2, process: processDirs.backoffice },
  { name: '12_backoffice-dossiers', route: '/backoffice/dossiers', persona: personaDirs.p2, process: processDirs.backoffice },
  { name: '13_backoffice-instruction', route: '/backoffice/dossiers/DEMO-001/instruction', persona: personaDirs.p2, process: processDirs.backoffice },
  { name: '14_backoffice-validation', route: '/backoffice/dossiers/DEMO-001/validation', persona: personaDirs.p2, process: processDirs.backoffice },
  { name: '15_backoffice-controle', route: '/backoffice/controle', persona: personaDirs.p2, process: processDirs.backoffice },
  { name: '16_backoffice-budget', route: '/backoffice/budget', persona: personaDirs.p2, process: processDirs.backoffice },
  { name: '17_workflow-ci-otr', route: '/backoffice/workflow-ci-otr', persona: personaDirs.p2, process: processDirs.workflows },
  { name: '18_workflow-cddi', route: '/backoffice/workflow-cddi', persona: personaDirs.p2, process: processDirs.workflows },
  { name: '19_workflow-zone-franche', route: '/backoffice/workflow-zone-franche', persona: personaDirs.p2, process: processDirs.workflows },
  { name: '20_workflow-code-invest', route: '/backoffice/workflow-code-invest', persona: personaDirs.p2, process: processDirs.workflows },
  { name: '21_workflow-convention-miniere', route: '/backoffice/workflow-convention-miniere', persona: personaDirs.p2, process: processDirs.workflows },

  { name: '22_agences-dashboard', route: '/agences/dashboard', persona: personaDirs.p3, process: processDirs.agences },
  { name: '23_agences-conventions', route: '/agences/conventions', persona: personaDirs.p3, process: processDirs.agences },
  { name: '24_agences-agrements', route: '/agences/agrements', persona: personaDirs.p3, process: processDirs.agences },
  { name: '25_agences-engagements', route: '/agences/engagements', persona: personaDirs.p3, process: processDirs.agences },

  { name: '26_decideur-dashboard', route: '/decideur/dashboard', persona: personaDirs.p4, process: processDirs.decideur },
  { name: '27_decideur-analyse', route: '/decideur/analyse', persona: personaDirs.p4, process: processDirs.decideur },
  { name: '28_decideur-rapport-annuel', route: '/decideur/rapport-annuel', persona: personaDirs.p4, process: processDirs.decideur },
  { name: '29_decideur-simulation', route: '/decideur/simulation', persona: personaDirs.p4, process: processDirs.decideur },
  { name: '30_decideur-referentiel', route: '/decideur/referentiel', persona: personaDirs.p4, process: processDirs.decideur },
  { name: '31_decideur-registre-central', route: '/decideur/registre-central', persona: personaDirs.p4, process: processDirs.decideur },

  { name: '32_tresor-dashboard', route: '/tresor/dashboard', persona: personaDirs.p2bis, process: processDirs.tresor },
  { name: '33_tresor-rapprochements', route: '/tresor/rapprochements', persona: personaDirs.p2bis, process: processDirs.tresor },
  { name: '34_tresor-archives', route: '/tresor/archives', persona: personaDirs.p2bis, process: processDirs.tresor },

  { name: '35_ministeres-dashboard', route: '/ministeres/dashboard', persona: personaDirs.p3bis, process: processDirs.institutions },
  { name: '36_mae-accords-siege', route: '/mae/accords-siege', persona: personaDirs.p3ter, process: processDirs.institutions },
  { name: '37_extractif-dashboard', route: '/extractif/dashboard', persona: personaDirs.p3quater, process: processDirs.institutions },
  { name: '38_conedef-dashboard', route: '/conedef/dashboard', persona: personaDirs.p4bis, process: processDirs.institutions },
  { name: '39_dsi-dashboard', route: '/dsi/dashboard', persona: personaDirs.p7bis, process: processDirs.institutions },

  { name: '40_audit-dashboard', route: '/audit/dashboard', persona: personaDirs.p5, process: processDirs.audit },
  { name: '41_audit-journal', route: '/audit/journal', persona: personaDirs.p5, process: processDirs.audit },
  { name: '42_audit-anomalies', route: '/audit/anomalies', persona: personaDirs.p5, process: processDirs.audit },
  { name: '43_audit-dossiers', route: '/audit/dossiers', persona: personaDirs.p5, process: processDirs.audit },
  { name: '44_audit-missions', route: '/audit/missions', persona: personaDirs.p5, process: processDirs.audit },

  { name: '45_opendata-home', route: '/opendata', persona: personaDirs.p6, process: processDirs.opendata },
  { name: '46_opendata-tableaux-de-bord', route: '/opendata/tableaux-de-bord', persona: personaDirs.p6, process: processDirs.opendata },
  { name: '47_opendata-datasets', route: '/opendata/datasets', persona: personaDirs.p6, process: processDirs.opendata },
  { name: '48_opendata-rapports', route: '/opendata/rapports', persona: personaDirs.p6, process: processDirs.opendata },

  { name: '49_admin-utilisateurs', route: '/admin/utilisateurs', persona: personaDirs.p7, process: processDirs.admin },
  { name: '50_admin-roles', route: '/admin/roles', persona: personaDirs.p7, process: processDirs.admin },
  { name: '51_admin-connecteurs', route: '/admin/connecteurs', persona: personaDirs.p7, process: processDirs.admin },
  { name: '52_admin-workflow', route: '/admin/workflow', persona: personaDirs.p7, process: processDirs.admin },
  { name: '53_admin-formulaires', route: '/admin/formulaires', persona: personaDirs.p7, process: processDirs.admin },
  { name: '54_admin-dictionnaire-o2', route: '/admin/dictionnaire-o2', persona: personaDirs.p7, process: processDirs.admin },
  { name: '55_admin-gouvernance-donnees', route: '/admin/gouvernance-donnees', persona: personaDirs.p7, process: processDirs.admin },
  { name: '56_admin-requetes-dynamiques', route: '/admin/requetes-dynamiques', persona: personaDirs.p7, process: processDirs.admin },
  { name: '57_admin-ged', route: '/admin/ged', persona: personaDirs.p7, process: processDirs.admin },
  { name: '58_admin-publication-open-data', route: '/admin/publication-open-data', persona: personaDirs.p7, process: processDirs.admin },
  { name: '59_admin-regles', route: '/admin/regles', persona: personaDirs.p7, process: processDirs.admin },
  { name: '60_admin-parametres', route: '/admin/parametres', persona: personaDirs.p7, process: processDirs.admin },
  { name: '61_admin-monitoring', route: '/admin/monitoring', persona: personaDirs.p7, process: processDirs.admin },

  { name: '62_notifications', route: '/notifications', persona: personaDirs.transversal, process: processDirs.notifications },
]

async function ensureDirectories() {
  const dirs = new Set()
  for (const entry of routes) {
    dirs.add(path.join(rootDir, entry.persona))
    dirs.add(path.join(rootDir, entry.process))
  }
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true })
  }
}

function buildTargets(entry) {
  return [
    path.join(rootDir, entry.persona, `${entry.name}.png`),
    path.join(rootDir, entry.process, `${entry.name}.png`),
  ]
}

async function newPage(browser, device) {
  const context = await browser.newContext(
    device ? { ...devices[device] } : { viewport: { width: 1440, height: 1400 } },
  )
  const page = await context.newPage()
  return { context, page }
}

async function captureEntry(browser, entry) {
  const { context, page } = await newPage(browser, entry.device)
  const url = `${baseUrl}${entry.route}`
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(700)

  const targets = buildTargets(entry)
  for (const target of targets) {
    await page.screenshot({ path: target, fullPage: true })
  }

  const title = await page.title()
  await context.close()
  return {
    name: entry.name,
    route: entry.route,
    url,
    title,
    persona: entry.persona,
    process: entry.process,
    files: targets,
  }
}

async function main() {
  await ensureDirectories()
  const browser = await chromium.launch({ headless: true })
  const manifest = []
  const failures = []

  try {
    for (const entry of routes) {
      process.stdout.write(`CAPTURE ${entry.name} -> ${entry.route}\n`)
      try {
        const result = await captureEntry(browser, entry)
        manifest.push(result)
      } catch (error) {
        failures.push({
          name: entry.name,
          route: entry.route,
          error: error instanceof Error ? error.message : String(error),
        })
        process.stdout.write(`ECHEC ${entry.name}: ${failures.at(-1).error}\n`)
      }
    }
  } finally {
    await browser.close()
  }

  const manifestPath = path.join(rootDir, 'manifest.json')
  await fs.writeFile(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl,
        totalRoutes: routes.length,
        successCount: manifest.length,
        failureCount: failures.length,
        captures: manifest,
        failures,
      },
      null,
      2,
    ),
  )

  if (failures.length > 0) {
    process.stderr.write(`Captures incompletes: ${failures.length} echec(s).\n`)
    process.exitCode = 1
    return
  }

  process.stdout.write(`Captures terminees: ${manifest.length}/${routes.length}\n`)
  process.stdout.write(`Manifest: ${manifestPath}\n`)
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`)
  process.exit(1)
})
