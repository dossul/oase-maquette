import { api } from './api'

/**
 * Service NOTIFICATIONS — branché sur l'API réelle :
 *   GET   /notifications            (liste de l'utilisateur connecté)
 *   GET   /notifications/unread-count
 *   PATCH /notifications/:id/lue    (marquer comme lue)
 */

export interface ApiNotification {
  id: string
  utilisateurId: string
  demandeId: string | null
  typeNotificationCode: string
  canalCode: string
  titre: string
  corps: string
  estLue: boolean
  dateLecture: string | null
  createdAt: string
}

/** Liste toutes les notifications de l'utilisateur connecté (les plus récentes d'abord). */
export function listerNotifications(): Promise<ApiNotification[]> {
  return api<ApiNotification[]>('/notifications')
}

export function compterNotificationsNonLues(): Promise<{ count: number }> {
  return api<{ count: number }>('/notifications/unread-count')
}

/** Marque une notification comme lue. Renvoie null si elle n'appartient pas à l'utilisateur. */
export function marquerNotificationLue(id: string): Promise<ApiNotification | null> {
  return api<ApiNotification | null>(`/notifications/${id}/lue`, { method: 'PATCH' })
}

/** Marque toutes les notifications non lues comme lues (PATCH successifs — pas d'endpoint bulk). */
export async function marquerToutesLues(ids: string[]): Promise<void> {
  await Promise.allSettled(ids.map((id) => marquerNotificationLue(id)))
}

/** Mappe le code type API (INSTRUCTION, ALERTE, …) vers la catégorie d'affichage. */
export function mapTypeNotification(code: string): 'action' | 'info' | 'alerte' | 'systeme' {
  const c = (code || '').toUpperCase()
  if (c.includes('ALERTE') || c.includes('EXPIRATION') || c.includes('QUOTA')) return 'alerte'
  if (c.includes('INSTRUCTION') || c.includes('ACTION') || c.includes('COMPLEMENT') || c.includes('VALIDATION')) return 'action'
  if (c.includes('SYSTEME') || c.includes('CONNECTEUR') || c.includes('JOB')) return 'systeme'
  return 'info'
}
