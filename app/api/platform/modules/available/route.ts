import { NextResponse } from 'next/server'

/**
 * GET /api/platform/modules/available
 * Liste tous les modules disponibles dans le système
 * Cette liste est statique et définit tous les modules possibles
 */
export async function GET() {
  // Liste des modules disponibles dans le système
  // Cette liste peut être étendue selon les besoins
  const availableModules = [
    {
      id: 'facturation',
      name: 'Facturation',
      description: 'Gestion des devis, factures et paiements',
      icon: 'FileText',
      category: 'business',
    },
    {
      id: 'crm',
      name: 'CRM',
      description: 'Gestion de la relation client (contacts, opportunités, affaires)',
      icon: 'Users',
      category: 'business',
    },
    {
      id: 'comptabilite',
      name: 'Comptabilité',
      description: 'Plan comptable, écritures, déclarations TVA',
      icon: 'Calculator',
      category: 'finance',
    },
    {
      id: 'rh',
      name: 'Ressources Humaines',
      description: 'Gestion des employés, contrats, paie, congés',
      icon: 'UserCheck',
      category: 'hr',
    },
    {
      id: 'stock',
      name: 'Gestion de stock',
      description: 'Catalogue produits, mouvements, inventaires',
      icon: 'Package',
      category: 'logistics',
    },
    {
      id: 'projets',
      name: 'Gestion de projets',
      description: 'Projets, tâches, planning, budgets',
      icon: 'FolderKanban',
      category: 'management',
    },
    {
      id: 'documents',
      name: 'Documents',
      description: 'Gestion et archivage de documents',
      icon: 'FileStack',
      category: 'documentation',
    },
    {
      id: 'reporting',
      name: 'Reporting & Analytics',
      description: 'Tableaux de bord, rapports, statistiques',
      icon: 'BarChart',
      category: 'analytics',
    },
  ]

  return NextResponse.json({ modules: availableModules })
}









