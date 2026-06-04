<template>
  <div class="doc-viewer" :class="{ 'doc-viewer--fullscreen': fullscreen }">
    <!-- Toolbar -->
    <div class="doc-viewer__toolbar d-flex align-center ga-1 px-3 py-2" style="background:#1E293B;border-bottom:1px solid rgba(255,255,255,0.1)">
      <!-- Left: document info -->
      <v-icon icon="mdi-file-pdf-box" color="error" size="18" class="me-1"/>
      <span class="text-caption font-weight-semibold" style="color:#CBD5E1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px">{{ filename }}</span>
      <v-chip size="x-small" color="error" variant="tonal" class="ms-2">Confidentiel</v-chip>
      <v-chip size="x-small" color="success" variant="outlined" prepend-icon="mdi-clock-check-outline" class="ms-1">TSA</v-chip>

      <v-divider vertical class="mx-2" style="border-color:rgba(255,255,255,0.15)"/>

      <!-- Annotation tools -->
      <v-btn-toggle v-model="activeTool" density="compact" variant="text" color="warning" rounded="sm" style="background:transparent">
        <v-btn value="highlight" icon size="small" title="Surligner">
          <v-icon icon="mdi-marker" size="16" :color="activeTool==='highlight'?'warning':'rgba(255,255,255,0.5)'"/>
        </v-btn>
        <v-btn value="note" icon size="small" title="Ajouter une note">
          <v-icon icon="mdi-note-plus" size="16" :color="activeTool==='note'?'warning':'rgba(255,255,255,0.5)'"/>
        </v-btn>
        <v-btn value="bookmark" icon size="small" title="Marque-page">
          <v-icon icon="mdi-bookmark-plus" size="16" :color="activeTool==='bookmark'?'warning':'rgba(255,255,255,0.5)'"/>
        </v-btn>
      </v-btn-toggle>

      <v-divider vertical class="mx-2" style="border-color:rgba(255,255,255,0.15)"/>

      <!-- Highlight color picker -->
      <v-menu v-if="activeTool==='highlight'" offset-y>
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" icon size="small" title="Couleur">
            <v-avatar :color="highlightColor" size="14" class="me-0"/>
          </v-btn>
        </template>
        <div class="d-flex ga-1 pa-2" style="background:#fff;border-radius:8px">
          <v-avatar v-for="c in highlightColors" :key="c" :color="c" size="20" class="cursor-pointer" @click="highlightColor=c"/>
        </div>
      </v-menu>

      <v-spacer/>

      <!-- Page nav -->
      <v-btn variant="text" icon size="small" :disabled="currentPage===1" @click="currentPage--">
        <v-icon icon="mdi-chevron-left" size="16" color="rgba(255,255,255,0.6)"/>
      </v-btn>
      <span class="text-caption" style="color:#CBD5E1;white-space:nowrap">{{ currentPage }} / {{ totalPages }}</span>
      <v-btn variant="text" icon size="small" :disabled="currentPage===totalPages" @click="currentPage++">
        <v-icon icon="mdi-chevron-right" size="16" color="rgba(255,255,255,0.6)"/>
      </v-btn>

      <v-divider vertical class="mx-2" style="border-color:rgba(255,255,255,0.15)"/>

      <!-- Zoom -->
      <v-btn variant="text" icon size="small" @click="zoom=Math.max(60,zoom-20)">
        <v-icon icon="mdi-minus" size="14" color="rgba(255,255,255,0.6)"/>
      </v-btn>
      <span class="text-caption" style="color:#CBD5E1;white-space:nowrap">{{ zoom }}%</span>
      <v-btn variant="text" icon size="small" @click="zoom=Math.min(200,zoom+20)">
        <v-icon icon="mdi-plus" size="14" color="rgba(255,255,255,0.6)"/>
      </v-btn>

      <v-divider vertical class="mx-2" style="border-color:rgba(255,255,255,0.15)"/>

      <!-- Actions -->
      <v-btn variant="text" icon size="small" title="Panneau annotations" @click="showAnnotations=!showAnnotations">
        <v-badge :content="annotations.length" color="warning" :model-value="annotations.length>0">
          <v-icon icon="mdi-comment-text-multiple" size="16" :color="showAnnotations?'#FBBF24':'rgba(255,255,255,0.6)'"/>
        </v-badge>
      </v-btn>
      <v-btn variant="text" icon size="small" title="Exporter annotations" @click="exportAnnotations">
        <v-icon icon="mdi-export" size="16" color="rgba(255,255,255,0.6)"/>
      </v-btn>
      <v-btn variant="text" icon size="small" title="Télécharger" @click="$emit('download')">
        <v-icon icon="mdi-download" size="16" color="rgba(255,255,255,0.6)"/>
      </v-btn>
      <v-btn variant="text" icon size="small" :title="fullscreen?'Quitter plein écran':'Plein écran'" @click="fullscreen=!fullscreen">
        <v-icon :icon="fullscreen?'mdi-fullscreen-exit':'mdi-fullscreen'" size="16" color="rgba(255,255,255,0.6)"/>
      </v-btn>
    </div>

    <!-- Content area -->
    <div class="doc-viewer__body d-flex" style="overflow:hidden;flex:1;min-height:0">
      <!-- Document canvas -->
      <div
        class="doc-viewer__canvas flex-grow-1 overflow-y-auto pa-4 d-flex justify-center"
        style="background:#404040;position:relative"
        @click="onCanvasClick"
        @mouseup="onMouseUp"
      >
        <div style="width:100%;max-width:760px">
          <div class="mb-3 d-flex flex-wrap ga-2">
            <v-chip size="small" color="success" variant="tonal" prepend-icon="mdi-pen-lock">Signature qualifiee valide</v-chip>
            <v-chip size="small" color="info" variant="tonal" prepend-icon="mdi-clock-check-outline">Horodatage TSA 2026-06-01 22:14:32</v-chip>
            <v-chip size="small" color="warning" variant="tonal" prepend-icon="mdi-history">Consultation journalisee</v-chip>
          </div>

          <div
            :style="{ transform: `scale(${zoom/100})`, transformOrigin: 'top center', width: '100%', maxWidth: '760px' }"
            style="transition: transform 0.15s"
          >
          <!-- Mock PDF page -->
            <div
              class="doc-page"
              style="background:white;box-shadow:0 4px 20px rgba(0,0,0,0.4);border-radius:2px;padding:40px 48px;position:relative;min-height:1080px"
            >
            <!-- Annotations layer -->
              <div v-for="ann in pageAnnotations" :key="ann.id" :style="ann.style" class="doc-annotation" @click.stop="selectedAnnotation=ann">
                <v-tooltip :text="ann.text" location="top">
                  <template #activator="{ props }">
                    <div v-bind="props" style="width:100%;height:100%;cursor:pointer"/>
                  </template>
                </v-tooltip>
              </div>

            <!-- Note icons -->
              <div v-for="note in pageNotes" :key="note.id" :style="{ position:'absolute', left: note.x+'px', top: note.y+'px' }" @click.stop="selectedAnnotation=note">
                <v-avatar color="warning" size="22" style="cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.3)">
                  <v-icon icon="mdi-note-text" size="14" color="white"/>
                </v-avatar>
              </div>

              <!-- Bookmark markers -->
              <div v-for="bm in pageBookmarks" :key="bm.id" :style="{ position:'absolute', right: '-4px', top: bm.y+'px' }">
                <v-icon icon="mdi-bookmark" size="24" color="primary"/>
              </div>

              <!-- Document content (mock OASE document) -->
              <slot :page="currentPage">
                <div v-html="mockPageContent(currentPage)" />
              </slot>
            </div>
          </div>
        </div>

        <!-- Click to add note modal -->
        <v-dialog v-model="noteDialog" max-width="400" :attach="false">
          <v-card rounded="xl">
            <v-card-title class="pa-4">Ajouter une note</v-card-title>
            <v-card-text class="pa-4">
              <v-textarea v-model="noteText" label="Votre annotation" rows="3" autofocus/>
            </v-card-text>
            <v-card-actions class="pa-3">
              <v-spacer/><v-btn variant="text" @click="noteDialog=false">Annuler</v-btn>
              <v-btn color="warning" @click="addNote">Enregistrer</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>

      <!-- Annotations panel -->
      <transition name="slide-panel">
        <div v-if="showAnnotations" class="doc-viewer__annotations overflow-y-auto" style="width:280px;background:#F8FAFC;border-left:1px solid #E2E8F0">
          <div class="d-flex align-center justify-space-between px-4 py-3" style="border-bottom:1px solid #E2E8F0">
            <span class="text-body-2 font-weight-semibold">Annotations ({{ annotations.length }})</span>
            <v-btn size="x-small" variant="tonal" color="primary" prepend-icon="mdi-export" @click="exportAnnotations">Exporter</v-btn>
          </div>

          <div class="pa-3" style="border-bottom:1px solid #E2E8F0">
            <div class="text-caption font-weight-semibold mb-2">Preuve documentaire</div>
            <div class="text-caption text-medium-emphasis mb-1">Empreinte: `8f1c...a7d9`</div>
            <div class="text-caption text-medium-emphasis mb-1">Jeton TSA: TSA-2026-0039-14</div>
            <div class="text-caption text-medium-emphasis">Diffusion: Restreinte et journalisee</div>
          </div>

          <div v-if="annotations.length===0" class="pa-4 text-center text-medium-emphasis">
            <v-icon icon="mdi-comment-text-outline" size="32" class="mb-2 opacity-40"/>
            <div class="text-caption">Aucune annotation.<br>Sélectionnez un outil pour commencer.</div>
          </div>

          <div v-for="ann in annotations" :key="ann.id" class="annotation-item pa-3 cursor-pointer" :class="selectedAnnotation?.id===ann.id?'bg-warning-lighten':''" style="border-bottom:1px solid #E2E8F0" @click="selectedAnnotation=ann">
            <div class="d-flex align-center ga-2 mb-1">
              <v-avatar :color="ann.type==='highlight'?ann.color:'warning'" size="16">
                <v-icon :icon="ann.type==='highlight'?'mdi-marker':ann.type==='note'?'mdi-note-text':'mdi-bookmark'" size="10" color="white"/>
              </v-avatar>
              <span class="text-caption font-weight-semibold text-capitalize">{{ typeLabel(ann.type) }}</span>
              <span class="text-caption text-medium-emphasis ms-auto">p.{{ ann.page }}</span>
            </div>
            <div class="text-caption text-medium-emphasis">{{ ann.text || ann.selectedText || '(sans texte)' }}</div>
            <div class="d-flex ga-1 mt-1">
              <v-btn size="x-small" icon="mdi-pencil" variant="text" @click.stop="editAnn(ann)"/>
              <v-btn size="x-small" icon="mdi-delete" variant="text" color="error" @click.stop="removeAnn(ann.id)"/>
            </div>
          </div>

          <!-- Comment global -->
          <div class="pa-3" style="border-top:1px solid #E2E8F0">
            <div class="text-caption font-weight-semibold mb-2">Commentaire général</div>
            <v-textarea v-model="globalComment" rows="3" density="compact" placeholder="Commentaire sur ce document…" hide-details/>
            <v-btn color="primary" size="small" block class="mt-2" prepend-icon="mdi-content-save">Enregistrer</v-btn>
          </div>
        </div>
      </transition>
    </div>

    <!-- Export success snackbar -->
    <v-snackbar v-model="exportSnack" color="success" timeout="3000" location="bottom right">
      <v-icon icon="mdi-check-circle" class="me-2"/>Annotations exportées avec succès
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  filename?: string
  totalPages?: number
  modelValue?: boolean
}>(), {
  filename: 'Document.pdf',
  totalPages: 3,
  modelValue: true,
})
defineEmits(['download', 'update:modelValue'])

// State
const currentPage = ref(1)
const zoom = ref(100)
const fullscreen = ref(false)
const activeTool = ref<string>('')
const highlightColor = ref('#FBBF24')
const highlightColors = ['#FBBF24', '#86EFAC', '#93C5FD', '#F9A8D4', '#FCA5A5']
const showAnnotations = ref(false)
const noteDialog = ref(false)
const noteText = ref('')
const pendingClickPos = ref({ x: 0, y: 0 })
const globalComment = ref('')
const exportSnack = ref(false)
const selectedAnnotation = ref<any>(null)

interface Annotation {
  id: string
  type: 'highlight' | 'note' | 'bookmark'
  page: number
  text?: string
  selectedText?: string
  color?: string
  style?: Record<string, string>
  x?: number
  y?: number
}
const annotations = ref<Annotation[]>([
  { id: 'a1', type: 'highlight', page: 1, color: '#FBBF24', selectedText: 'Article 215 du CGI', style: { position: 'absolute', top: '220px', left: '48px', width: '200px', height: '18px', background: 'rgba(251,191,36,0.4)', borderRadius: '2px', pointerEvents: 'none' } },
  { id: 'a2', type: 'note', page: 1, text: 'Vérifier la conformité avec la LFI 2026', x: 80, y: 300 },
])

const pageAnnotations = computed(() => annotations.value.filter(a => a.page === currentPage.value && a.type === 'highlight'))
const pageNotes = computed(() => annotations.value.filter(a => a.page === currentPage.value && a.type === 'note'))
const pageBookmarks = computed(() => annotations.value.filter(a => a.page === currentPage.value && a.type === 'bookmark'))

function onCanvasClick(e: MouseEvent) {
  if (!activeTool.value) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top + (e.currentTarget as HTMLElement).scrollTop
  pendingClickPos.value = { x, y }

  if (activeTool.value === 'note') {
    noteText.value = ''
    noteDialog.value = true
  } else if (activeTool.value === 'bookmark') {
    annotations.value.push({ id: Date.now().toString(), type: 'bookmark', page: currentPage.value, y })
    showAnnotations.value = true
  }
}

function onMouseUp(e: MouseEvent) {
  if (activeTool.value !== 'highlight') return
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed) return
  const selectedText = sel.toString().trim()
  if (!selectedText) return
  const range = sel.getRangeAt(0)
  const pageEl = (e.currentTarget as HTMLElement).querySelector('.doc-page')
  if (!pageEl) return
  const pageRect = pageEl.getBoundingClientRect()
  const selRect = range.getBoundingClientRect()
  annotations.value.push({
    id: Date.now().toString(),
    type: 'highlight',
    page: currentPage.value,
    selectedText,
    color: highlightColor.value,
    style: {
      position: 'absolute',
      top: (selRect.top - pageRect.top) + 'px',
      left: (selRect.left - pageRect.left) + 'px',
      width: selRect.width + 'px',
      height: selRect.height + 'px',
      background: hexToRgba(highlightColor.value, 0.4),
      borderRadius: '2px',
      pointerEvents: 'none',
    },
  })
  sel.removeAllRanges()
  showAnnotations.value = true
}

function addNote() {
  annotations.value.push({
    id: Date.now().toString(),
    type: 'note',
    page: currentPage.value,
    text: noteText.value,
    x: pendingClickPos.value.x - 11,
    y: pendingClickPos.value.y - 11,
  })
  noteDialog.value = false
  showAnnotations.value = true
}

function removeAnn(id: string) { annotations.value = annotations.value.filter(a => a.id !== id) }
function editAnn(ann: Annotation) { if (ann.type === 'note') { noteText.value = ann.text || ''; pendingClickPos.value = { x: ann.x || 0, y: ann.y || 0 }; noteDialog.value = true } }

function exportAnnotations() {
  const lines = [`# Annotations — ${props.filename}`, `Date: ${new Date().toLocaleString('fr-FR')}`, `Commentaire général: ${globalComment.value || '(aucun)'}`, '']
  annotations.value.forEach((a, i) => {
    lines.push(`${i + 1}. [${typeLabel(a.type)}] p.${a.page} — ${a.text || a.selectedText || '(sans texte)'}`)
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `annotations_${props.filename.replace('.pdf', '')}.txt`
  link.click()
  URL.revokeObjectURL(url)
  exportSnack.value = true
}

function typeLabel(t: string) { return { highlight: 'Surlignage', note: 'Note', bookmark: 'Marque-page' }[t] || t }

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function mockPageContent(page: number): string {
  const pages: Record<number, string> = {
    1: `
      <div style="text-align:center;margin-bottom:32px">
        <img src="" style="display:none"/>
        <div style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">REPUBLIQUE TOGOLAISE — MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES</div>
        <div style="font-size:13px;font-weight:700;color:#1A2332;border-bottom:2px solid #2774AE;padding-bottom:8px;margin-bottom:8px">ATTESTATION D'EXONÉRATION N° OASE-2026-0039</div>
        <div style="font-size:11px;color:#64748B">Conformément à l'article 215 du CGI et à la LFI 2026</div>
      </div>
      <p style="font-size:12px;line-height:1.8;margin-bottom:16px">Le Directeur Général de l'Office Togolais des Recettes, soussigné, <strong>ATTESTE</strong> que la société <strong>AGRO-TOGO INVEST SA</strong>, immatriculée sous le numéro NIF <strong>TG-002-2020-A</strong> et RCCM <strong>TG-LOM-2020-A-5678</strong>, bénéficie d'une exonération fiscale accordée conformément aux dispositions ci-après :</p>
      <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:16px">
        <tr style="background:#F4F6F9"><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Nature</td><td style="padding:8px;border:1px solid #CBD5E1">Exonération de TVA</td></tr>
        <tr><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Montant accordé</td><td style="padding:8px;border:1px solid #CBD5E1">120 000 000 FCFA</td></tr>
        <tr style="background:#F4F6F9"><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Période</td><td style="padding:8px;border:1px solid #CBD5E1">Du 10/02/2026 au 10/02/2027</td></tr>
        <tr><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Base juridique</td><td style="padding:8px;border:1px solid #CBD5E1">LFI 2026, Article 45</td></tr>
        <tr style="background:#F4F6F9"><td style="padding:8px;font-weight:600;border:1px solid #CBD5E1">Secteur</td><td style="padding:8px;border:1px solid #CBD5E1">Agriculture</td></tr>
      </table>
      <p style="font-size:11px;line-height:1.8;color:#475569">Cette attestation est délivrée pour servir et valoir ce que de droit. Elle est valable exclusivement pour les opérations visées ci-dessus et doit être présentée à toute réquisition des services fiscaux ou douaniers compétents.</p>
    `,
    2: `
      <div style="font-size:13px;font-weight:700;margin-bottom:16px;color:#1A2332">CONDITIONS ET OBLIGATIONS DU BÉNÉFICIAIRE</div>
      <p style="font-size:12px;line-height:1.8;margin-bottom:12px">Le bénéfice de cette exonération est subordonné au respect des obligations suivantes :</p>
      <ol style="font-size:12px;line-height:2;padding-left:20px">
        <li>Tenir à jour une comptabilité régulière et sincère permettant de distinguer les opérations exonérées des autres opérations ;</li>
        <li>Déposer trimestriellement un état récapitulatif des opérations exonérées auprès de la Direction des Grandes Entreprises ;</li>
        <li>Informer immédiatement l'OTR de tout changement dans la nature ou le volume des opérations exonérées ;</li>
        <li>Conserver pendant 10 ans tous les documents justificatifs relatifs aux opérations exonérées ;</li>
        <li>Ne pas céder, transférer ou sous-louer le bénéfice de cette exonération à un tiers.</li>
      </ol>
      <div style="margin-top:24px;padding:12px;background:#FEF3C7;border-left:4px solid #F59E0B;font-size:11px;color:#78350F">
        <strong>⚠ Important :</strong> Toute utilisation de cette exonération à des fins autres que celles pour lesquelles elle a été accordée entraîne sa révocation immédiate et le remboursement des montants concernés, majorés des pénalités légales.
      </div>
    `,
    3: `
      <div style="font-size:13px;font-weight:700;margin-bottom:16px;color:#1A2332">SIGNATURE ET CERTIFICATION</div>
      <p style="font-size:12px;line-height:1.8;margin-bottom:24px">Fait à Lomé, le <strong>10 février 2026</strong></p>
      <div style="display:flex;justify-content:space-between;margin-top:40px">
        <div style="text-align:center;width:45%">
          <div style="height:60px;border-bottom:1px solid #CBD5E1;margin-bottom:8px"/>
          <div style="font-size:11px;font-weight:600">Le Directeur Général de l'OTR</div>
          <div style="font-size:10px;color:#64748B">Signature et cachet</div>
        </div>
        <div style="text-align:center;width:45%">
          <div style="height:60px;border-bottom:1px solid #CBD5E1;margin-bottom:8px;display:flex;align-items:center;justify-content:center">
            <div style="width:60px;height:60px;border:2px solid #2774AE;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:#2774AE;text-align:center;font-weight:600">SIGNATURE<br>NUMÉRIQUE<br>VALIDE</div>
          </div>
          <div style="font-size:11px;font-weight:600">Visa DGBF — Ministère des Finances</div>
          <div style="font-size:10px;color:#64748B">Signature électronique certifiée</div>
        </div>
      </div>
      <div style="margin-top:40px;padding:12px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:4px;font-size:10px;color:#1E40AF">
        <strong>Vérification QR Code :</strong> Ce document peut être vérifié en scannant le code QR ci-joint ou en accédant à <em>oase.mef.tg/verifier</em> avec la référence OASE-2026-0039.
      </div>
      <div style="margin-top:12px;padding:12px;background:#F8FAFC;border:1px dashed #CBD5E1;border-radius:4px;font-size:10px;color:#334155">
        <strong>Preuve d'horodatage :</strong> Jeton TSA-2026-0039-14, empreinte SHA-256 8f1c...a7d9, consultation reservee aux profils habilites.
      </div>
    `,
  }
  return pages[page] || `<div style="color:#64748B;text-align:center;padding:40px">Page ${page}</div>`
}
</script>

<style scoped>
.doc-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 600px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.1);
}
.doc-viewer--fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  border-radius: 0;
  height: 100vh !important;
}
.doc-viewer__body {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}
.doc-viewer__canvas {
  flex: 1;
  min-height: 0;
}
.doc-viewer__annotations {
  flex-shrink: 0;
}
.doc-viewer__toolbar {
  flex-shrink: 0;
}
.doc-annotation {
  position: absolute;
  pointer-events: all;
}
.annotation-item:hover {
  background: rgba(251,191,36,0.08);
}
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: width 0.2s ease, opacity 0.2s ease;
}
.slide-panel-enter-from,
.slide-panel-leave-to {
  width: 0 !important;
  opacity: 0;
}
</style>
