/**
 * useDemoMode — détecte si le mode démo / développeur est activé.
 *
 * Activé via la variable d'env VITE_DEMO_MODE=true (par ex. en .env.local)
 * ET uniquement sur un serveur de développement Vite (import.meta.env.DEV).
 * La double condition garantit qu'un build de production ne peut JAMAIS
 * activer le mode démo, même si un .env.local fuit dans le contexte de
 * build (Docker, CI…) : le switcher de personas, le catalogue démo et le
 * parcours de découverte restent masqués / inaccessibles en prod.
 */
const RAW = (import.meta.env.VITE_DEMO_MODE ?? '').toString().toLowerCase().trim()
const FLAG_ENABLED =
  RAW === '1' || RAW === 'true' || RAW === 'yes' || RAW === 'on'
const DEMO_ENABLED = import.meta.env.DEV && FLAG_ENABLED

export function useDemoMode() {
  return {
    isDemoMode: DEMO_ENABLED,
  }
}