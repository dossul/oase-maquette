import type { Demande, Connecteur, Utilisateur, Anomalie, Convention, AuditLog, KpiData } from '../types'

export const mockDemandes: Demande[] = [
  { id: '1', reference: 'OASE-2026-0042', type: 'douaniere', beneficiaire: 'TOGO STEEL SARL', nif: 'TG-001-2019-B', rccm: 'TG-LOM-2019-B-1234', statut: 'en_cours', dateDepot: '2026-03-15', dateEcheance: '2026-09-15', montantFCFA: 45000000, quotaConsomme: 18000000, quotaTotal: 45000000, etapeActuelle: 'Instruction OTR Douanes', instructeur: 'K. ABALO', secteur: 'Industrie', baseJuridique: 'CGI Art. 215' },
  { id: '2', reference: 'OASE-2026-0039', type: 'fiscale_tva', beneficiaire: 'AGRO-TOGO INVEST SA', nif: 'TG-002-2020-A', rccm: 'TG-LOM-2020-A-5678', statut: 'approuve', dateDepot: '2026-02-10', dateEcheance: '2027-02-10', montantFCFA: 120000000, etapeActuelle: 'Approuvé — Actif', secteur: 'Agriculture', baseJuridique: 'LFI 2026 Art. 45' },
  { id: '3', reference: 'OASE-2026-0035', type: 'zone_franche', beneficiaire: 'LOMÉ TEXTILE ZF SAS', nif: 'TG-003-2021-C', rccm: 'TG-LOM-2021-C-9012', statut: 'action_requise', dateDepot: '2026-01-20', montantFCFA: 89000000, etapeActuelle: 'Complément requis — Pièces manquantes', instructeur: 'A. MENSAH', secteur: 'Industrie textile', baseJuridique: 'Code ZFI 2018' },
  { id: '4', reference: 'OASE-2025-0118', type: 'fiscale_is', beneficiaire: 'MINES DU NORD TOGO', nif: 'TG-004-2018-D', rccm: 'TG-KAR-2018-D-3456', statut: 'rejete', dateDepot: '2025-11-05', montantFCFA: 230000000, etapeActuelle: 'Rejeté — Base juridique invalide', instructeur: 'P. TCHALLA', secteur: 'Mines', baseJuridique: 'Code minier 2012 Art. 78' },
  { id: '5', reference: 'OASE-2025-0098', type: 'code_investissement', beneficiaire: 'ENERGIE SOLAIRE TOGO', nif: 'TG-005-2022-E', rccm: 'TG-LOM-2022-E-7890', statut: 'approuve', dateDepot: '2025-09-12', dateEcheance: '2026-09-12', montantFCFA: 175000000, etapeActuelle: 'Approuvé — Actif', secteur: 'Énergie', baseJuridique: 'Code des investissements Art. 14' },
  { id: '6', reference: 'OASE-2026-0044', type: 'sectorielle', beneficiaire: 'NUMERIQUE AFRIQUE SA', nif: 'TG-006-2023-F', rccm: 'TG-LOM-2023-F-2345', statut: 'brouillon', dateDepot: '2026-04-01', montantFCFA: 55000000, etapeActuelle: 'Brouillon — Non soumis', secteur: 'Numérique', baseJuridique: 'LFI 2025 Art. 67' },
  { id: '7', reference: 'OASE-2024-0200', type: 'douaniere', beneficiaire: 'PORT DE LOMÉ SARL', nif: 'TG-007-2016-G', rccm: 'TG-LOM-2016-G-5432', statut: 'expire', dateDepot: '2024-04-15', dateEcheance: '2025-04-15', montantFCFA: 310000000, etapeActuelle: 'Expiré — Non renouvelé', secteur: 'Transport', baseJuridique: 'CGI Art. 215' },
  { id: '8', reference: 'OASE-2026-0041', type: 'fiscale_tva', beneficiaire: 'HOPITAL SAINT-LUC ONG', nif: 'TG-008-2017-H', rccm: 'TG-ATK-2017-H-8765', statut: 'en_cours', dateDepot: '2026-03-28', montantFCFA: 28000000, etapeActuelle: 'Visa DGBF en cours', instructeur: 'M. KOFFI', secteur: 'Santé', baseJuridique: 'LFI 2026 Art. 12' },
  { id: '9', reference: 'OASE-2026-0044', type: 'sectorielle', beneficiaire: 'NUMERIQUE AFRIQUE SA', nif: 'TG-006-2023-F', rccm: 'TG-LOM-2023-F-2345', statut: 'en_cours', dateDepot: '2026-04-01', montantFCFA: 55000000, etapeActuelle: 'Instruction OTR Impôts', instructeur: 'A. MENSAH', secteur: 'Numérique', baseJuridique: 'LFI 2025 Art. 67' },
  { id: '10', reference: 'OASE-2026-0045', type: 'code_investissement', beneficiaire: 'LOGISTIQUE TOGO SA', nif: 'TG-010-2019-J', rccm: 'TG-LOM-2019-J-1122', statut: 'approuve', dateDepot: '2026-01-10', dateEcheance: '2028-01-10', montantFCFA: 195000000, etapeActuelle: 'Approuvé — Actif', secteur: 'Transport', baseJuridique: "Code des investissements Art. 22" },
  { id: '11', reference: 'OASE-2025-0150', type: 'zone_franche', beneficiaire: 'PHARMA WEST AFRICA ZF', nif: 'TG-011-2020-K', rccm: 'TG-LOM-2020-K-3344', statut: 'en_cours', dateDepot: '2026-02-14', montantFCFA: 140000000, etapeActuelle: 'Instruction OTR Douanes', instructeur: 'K. ABALO', secteur: 'Pharmaceutique', baseJuridique: 'Code ZFI 2018 Art. 5' },
  { id: '12', reference: 'OASE-2026-0047', type: 'fiscale_is', beneficiaire: 'COOPEC NORD TOGO', nif: 'TG-012-2015-L', rccm: 'TG-KAR-2015-L-5566', statut: 'action_requise', dateDepot: '2026-03-05', montantFCFA: 18000000, etapeActuelle: 'Complément requis — Bilan 2025 manquant', instructeur: 'P. TCHALLA', secteur: 'Finance', baseJuridique: 'CGI Art. 110' },
]

export const mockConnecteurs: Connecteur[] = [
  { id: 'sydonia', nom: 'SYDONIA World', systeme: 'OTR Douanes', statut: 'actif', latenceMs: 142, tauxErreur: 0.3, dernierSync: '2026-04-27T10:45:00', volume24h: 1842, endpoint: 'https://sydonia.otr.tg/api/v2/exemptions' },
  { id: 'sigtas', nom: 'SIGTAS', systeme: 'OTR Impôts', statut: 'actif', latenceMs: 218, tauxErreur: 0.8, dernierSync: '2026-04-27T10:30:00', volume24h: 953, endpoint: 'https://sigtas.otr.tg/api/exemptions' },
  { id: 'sigfip', nom: 'SIGFiP', systeme: 'DGBF', statut: 'erreur', latenceMs: 0, tauxErreur: 100, dernierSync: '2026-04-27T08:15:00', volume24h: 0, endpoint: 'https://sigfip.dgbf.tg/api/depenses-fiscales' },
  { id: 'gudef', nom: 'GUDEF', systeme: 'DGTCP', statut: 'maintenance', latenceMs: 0, tauxErreur: 0, dernierSync: '2026-04-26T23:00:00', volume24h: 0, endpoint: 'https://gudef.tresor.tg/api/v1/exonerations' },
]

export const mockUtilisateurs: Utilisateur[] = [
  { id: '1', nom: 'ABALO', prenom: 'Kofi', email: 'k.abalo@otr.tg', role: 'agent_otr', structure: 'OTR Douanes', statut: 'actif', derniereConnexion: '2026-04-27T09:12:00' },
  { id: '2', nom: 'MENSAH', prenom: 'Akossiwa', email: 'a.mensah@otr.tg', role: 'agent_otr', structure: 'OTR Impôts', statut: 'actif', derniereConnexion: '2026-04-27T08:45:00' },
  { id: '3', nom: 'KOFFI', prenom: 'Mawuli', email: 'm.koffi@dgbf.tg', role: 'agent_dgbf', structure: 'DGBF', statut: 'actif', derniereConnexion: '2026-04-26T17:30:00' },
  { id: '4', nom: 'TCHALLA', prenom: 'Pépé', email: 'p.tchalla@upf.mef.tg', role: 'decideur', structure: 'UPF / MEF', statut: 'actif', derniereConnexion: '2026-04-27T07:55:00' },
  { id: '5', nom: 'AGBEKO', prenom: 'Sénamé', email: 's.agbeko@igf.tg', role: 'auditeur', structure: 'IGF', statut: 'actif', derniereConnexion: '2026-04-25T14:20:00' },
  { id: '6', nom: 'DOSSOU', prenom: 'Yawa', email: 'y.dossou@api-zf.tg', role: 'agence', structure: 'API-ZF', statut: 'actif', derniereConnexion: '2026-04-27T10:02:00' },
  { id: '7', nom: 'TOGBUI', prenom: 'Luc', email: 'l.togbui@mef.tg', role: 'admin', structure: 'DSI/MEF', statut: 'actif', derniereConnexion: '2026-04-27T10:30:00' },
  { id: '8', nom: 'NYAVOR', prenom: 'Edem', email: 'e.nyavor@steeltogo.tg', role: 'beneficiaire', structure: 'TOGO STEEL SARL', statut: 'actif', derniereConnexion: '2026-04-26T16:10:00' },
  { id: '9', nom: 'BAMBA', prenom: 'Adjoua', email: 'a.bamba@api-zf.tg', role: 'agence', structure: 'SAZOF', statut: 'actif', derniereConnexion: '2026-04-27T11:00:00' },
  { id: '10', nom: 'KPODO', prenom: 'Anani', email: 'a.kpodo@cour-comptes.tg', role: 'auditeur', structure: 'Cour des comptes', statut: 'actif', derniereConnexion: '2026-04-22T09:15:00' },
  { id: '11', nom: 'OURO', prenom: 'Fatoumata', email: 'f.ouro@dgbf.tg', role: 'agent_dgbf', structure: 'DGBF', statut: 'inactif', derniereConnexion: '2026-03-15T14:30:00' },
  { id: '12', nom: 'AMEGA', prenom: 'Kodjo', email: 'k.amega@numerique-afrique.tg', role: 'beneficiaire', structure: 'NUMERIQUE AFRIQUE SA', statut: 'actif', derniereConnexion: '2026-04-27T09:45:00' },
]

export const mockAnomalies: Anomalie[] = [
  { id: 'A001', categorie: 'juridique', gravite: 'critique', description: 'Exonération accordée sans base juridique valide (réf. OASE-2025-0075)', dossier: 'OASE-2025-0075', dateDetection: '2026-04-15', statut: 'nouvelle' },
  { id: 'A002', categorie: 'financiere', gravite: 'elevee', description: 'Dépassement quota de 340% — LOMÉ LOGISTICS SA (douanier)', dossier: 'OASE-2025-0082', dateDetection: '2026-04-18', statut: 'nouvelle' },
  { id: 'A003', categorie: 'temporelle', gravite: 'moyenne', description: 'Exonération active depuis 847 jours au lieu des 730 jours autorisés', dossier: 'OASE-2024-0156', dateDetection: '2026-04-20', statut: 'examinee' },
  { id: 'A004', categorie: 'procedurale', gravite: 'faible', description: 'Dossier transmis sans visa DGBF obligatoire pour le montant > 50M FCFA', dossier: 'OASE-2026-0029', dateDetection: '2026-04-22', statut: 'traitee' },
  { id: 'A005', categorie: 'juridique', gravite: 'elevee', description: 'Bénéficiaire avec dettes fiscales déclarées dans SIGTAS (IS 2024)', dossier: 'OASE-2026-0038', dateDetection: '2026-04-24', statut: 'nouvelle' },
  { id: 'A006', categorie: 'financiere', gravite: 'critique', description: 'Doublon détecté : même bénéficiaire, même base juridique dans SYDONIA et SIGTAS', dossier: 'OASE-2025-0099', dateDetection: '2026-04-25', statut: 'nouvelle' },
]

export const mockConventions: Convention[] = [
  { id: 'C001', reference: 'ZFI-2024-012', beneficiaire: 'LOMÉ TEXTILE ZF SAS', regime: 'Zone Franche Industrielle', statut: 'active', dateDebut: '2024-01-15', dateFin: '2034-01-15', montantEstime: 890000000, emploisEngages: 450, emploisCrees: 312 },
  { id: 'C002', reference: 'ZES-2023-008', beneficiaire: 'AGRO-PROCESSING ZES', regime: 'Zone Économique Spéciale', statut: 'active', dateDebut: '2023-06-01', dateFin: '2033-06-01', montantEstime: 1200000000, emploisEngages: 800, emploisCrees: 620 },
  { id: 'C003', reference: 'CI-2025-003', beneficiaire: 'ENERGIE SOLAIRE TOGO', regime: 'Code des investissements', statut: 'active', dateDebut: '2025-03-10', dateFin: '2030-03-10', montantEstime: 560000000, emploisEngages: 180, emploisCrees: 95 },
  { id: 'C004', reference: 'ZFI-2020-005', beneficiaire: 'TOGO PHARMA ZF', regime: 'Zone Franche Industrielle', statut: 'suspendue', dateDebut: '2020-09-01', dateFin: '2030-09-01', montantEstime: 420000000, emploisEngages: 200, emploisCrees: 87 },
  { id: 'C005', reference: 'CI-2026-004', beneficiaire: 'LOGISTIQUE TOGO SA', regime: "Code des investissements", statut: 'active', dateDebut: '2026-01-10', dateFin: '2031-01-10', montantEstime: 310000000, emploisEngages: 120, emploisCrees: 38 },
  { id: 'C006', reference: 'ZES-2025-009', beneficiaire: 'PHARMA WEST AFRICA ZF', regime: 'Zone Économique Spéciale', statut: 'active', dateDebut: '2025-07-01', dateFin: '2035-07-01', montantEstime: 780000000, emploisEngages: 350, emploisCrees: 180 },
]

export const mockAuditLogs: AuditLog[] = [
  { id: 'L001', horodatage: '2026-04-27T10:45:32.441', utilisateur: 'K. ABALO', structure: 'OTR Douanes', role: 'Agent instructeur', action: 'VALIDATION', entite: 'OASE-2026-0039', ancienneValeur: 'En instruction', nouvelleValeur: 'Approuvé', ip: '196.28.45.12' },
  { id: 'L002', horodatage: '2026-04-27T09:23:11.882', utilisateur: 'A. MENSAH', structure: 'OTR Impôts', role: 'Agent instructeur', action: 'DEMANDE_COMPLEMENT', entite: 'OASE-2026-0035', ancienneValeur: 'En instruction', nouvelleValeur: 'Complément requis', ip: '196.28.45.18' },
  { id: 'L003', horodatage: '2026-04-27T08:12:05.119', utilisateur: 'M. KOFFI', structure: 'DGBF', role: 'Agent DGBF', action: 'VISA', entite: 'OASE-2026-0041', ancienneValeur: 'Instruction OTR', nouvelleValeur: 'Visa DGBF', ip: '196.28.46.22' },
  { id: 'L004', horodatage: '2026-04-26T17:45:33.001', utilisateur: 'P. TCHALLA', structure: 'UPF', role: 'Décideur', action: 'EXPORT_RAPPORT', entite: 'Rapport-2025-Annuel', ip: '196.28.47.05' },
  { id: 'L005', horodatage: '2026-04-26T16:32:14.556', utilisateur: 'L. TOGBUI', structure: 'DSI/MEF', role: 'Admin système', action: 'CREATION_COMPTE', entite: 'User-#0052 (S.AGBEKO)', nouvelleValeur: 'Compte créé', ip: '196.28.44.01' },
  { id: 'L006', horodatage: '2026-04-26T15:18:09.774', utilisateur: 'K. ABALO', structure: 'OTR Douanes', role: 'Agent instructeur', action: 'REJET', entite: 'OASE-2025-0118', ancienneValeur: 'En instruction', nouvelleValeur: 'Rejeté', ip: '196.28.45.12' },
]

export const mockKpisDashboardDecideur: KpiData[] = [
  { label: 'Total exonéré 2026', value: '847,3 Mds FCFA', trend: 12.4, icon: 'mdi-currency-usd', color: 'primary', subtitle: 'Depuis le 1er janv. 2026' },
  { label: 'Exonérations actives', value: '1 248', trend: 3.2, icon: 'mdi-check-circle', color: 'success', subtitle: 'Tous secteurs confondus' },
  { label: 'Dépenses fiscales / PIB', value: '4,2%', trend: -0.3, icon: 'mdi-chart-line', color: 'info', subtitle: 'Estimation provisoire 2026' },
  { label: 'Alertes non traitées', value: '23', trend: 8, icon: 'mdi-alert', color: 'warning', subtitle: 'Dont 6 critiques' },
]

export const mockEvolutionMensuelle = [
  { mois: 'Jan', montant: 62, lfi: 70 },
  { mois: 'Fév', montant: 71, lfi: 70 },
  { mois: 'Mar', montant: 85, lfi: 72 },
  { mois: 'Avr', montant: 78, lfi: 72 },
  { mois: 'Mai', montant: 92, lfi: 75 },
  { mois: 'Juin', montant: 88, lfi: 75 },
  { mois: 'Juil', montant: 95, lfi: 78 },
  { mois: 'Août', montant: 72, lfi: 78 },
  { mois: 'Sep', montant: 99, lfi: 80 },
  { mois: 'Oct', montant: 105, lfi: 80 },
  { mois: 'Nov', montant: 112, lfi: 82 },
  { mois: 'Déc', montant: 88, lfi: 82 },
]

export const mockTopSecteurs = [
  { secteur: 'Mines & Hydrocarbures', montant: 234 },
  { secteur: 'Zone Franche', montant: 198 },
  { secteur: 'Agriculture', montant: 145 },
  { secteur: 'Énergie', montant: 112 },
  { secteur: 'Numérique', montant: 89 },
  { secteur: 'Santé', montant: 67 },
  { secteur: 'Transport', montant: 54 },
  { secteur: 'Education', montant: 38 },
  { secteur: 'Industrie', montant: 32 },
  { secteur: 'Tourisme', montant: 18 },
]

export const mockNotifications = [
  { id: 'N001', type: 'action', titre: 'Complément requis', message: "Votre dossier OASE-2026-0035 nécessite des pièces complémentaires.", dossier: 'OASE-2026-0035', date: '2026-04-27T09:23:00', lu: false },
  { id: 'N002', type: 'info', titre: 'Dossier approuvé', message: "Votre demande OASE-2026-0039 a été approuvée. Téléchargez votre attestation.", dossier: 'OASE-2026-0039', date: '2026-04-27T10:45:00', lu: false },
  { id: 'N003', type: 'alerte', titre: 'Expiration imminente', message: "Votre exonération OASE-2025-0098 expire dans 28 jours.", dossier: 'OASE-2025-0098', date: '2026-04-26T08:00:00', lu: true },
  { id: 'N004', type: 'systeme', titre: 'Connecteur SIGFiP en erreur', message: "Le connecteur SIGFiP est indisponible depuis 2h30.", dossier: '', date: '2026-04-27T08:15:00', lu: false },
  { id: 'N005', type: 'info', titre: 'Rapport généré', message: "Le rapport annuel des dépenses fiscales 2025 a été généré avec succès.", dossier: '', date: '2026-04-26T17:00:00', lu: true },
  { id: 'N006', type: 'action', titre: 'Nouveau dossier assigné', message: "Le dossier OASE-2026-0044 (NUMERIQUE AFRIQUE SA) vous a été assigné pour instruction.", dossier: 'OASE-2026-0044', date: '2026-04-27T11:05:00', lu: false },
  { id: 'N007', type: 'alerte', titre: 'Quota dépassé — LOMÉ LOGISTICS', message: "Le quota d'exonération douanière de LOMÉ LOGISTICS SA est dépassé à 340%. Contrôle requis.", dossier: 'OASE-2025-0082', date: '2026-04-27T08:30:00', lu: false },
  { id: 'N008', type: 'info', titre: 'Convention signée', message: "La convention ZES-2025-009 (PHARMA WEST AFRICA ZF) a été signée et enregistrée.", dossier: '', date: '2026-04-25T15:00:00', lu: true },
]

export const mockRegions = [
  { nom: 'Maritime', montant: 412, count: 534 },
  { nom: 'Plateaux', montant: 156, count: 198 },
  { nom: 'Centrale', montant: 89, count: 112 },
  { nom: 'Kara', montant: 124, count: 187 },
  { nom: 'Savanes', montant: 66, count: 217 },
]
