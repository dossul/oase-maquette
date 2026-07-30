import { api } from './api'

/**
 * Matrice RBAC réelle de la plateforme (GET /admin/rbac/matrice).
 * Dérivée côté API des métadonnées @Roles des contrôleurs — la même source
 * de vérité que celle appliquée par le RbacGuard et vérifiée par rbac.spec.ts.
 * Lecture seule : toute modification passe par le code (décorateurs @Roles).
 */

export interface EntreeMatriceRbac {
  controleur: string
  methode: string
  http: string
  chemin: string
  roles: string[]
}

export interface MatriceRbac {
  roles: string[]
  entrees: EntreeMatriceRbac[]
}

/** GET /admin/rbac/matrice — endpoints protégés × rôles autorisés (admin_si, auditeur). */
export function getMatriceRbac(): Promise<MatriceRbac> {
  return api<MatriceRbac>('/admin/rbac/matrice')
}
