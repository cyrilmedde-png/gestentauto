/**
 * REGISTRY CENTRAL - Fichier tampon pour éviter tous conflits
 * 
 * Ce fichier centralise TOUTES les définitions :
 * - Modules disponibles
 * - Tables de base de données
 * - Routes API
 * - Permissions
 * - Intégrations
 * 
 * IMPORTANT : Toujours utiliser ce fichier comme source de vérité
 * Ne jamais créer de modules, tables ou routes sans les enregistrer ici
 */

export const APP_REGISTRY = {
  // Version de l'application
  version: '1.0.0',
  
  // Modules disponibles dans l'application
  modules: {
    core: {
      id: 'core',
      name: 'Core',
      description: 'Module de base (authentification, paramètres, multi-tenant)',
      enabled: true,
      required: true,
      tables: ['companies', 'users', 'roles', 'modules', 'settings', 'user_sessions'],
      routes: ['/api/auth', '/api/settings', '/api/companies'],
    },
    billing: {
      id: 'billing',
      name: 'Facturation',
      description: 'Gestion des devis, factures et paiements',
      enabled: false,
      required: false,
      tables: ['customers', 'suppliers', 'quotes', 'invoices', 'payments', 'invoice_items'],
      routes: ['/api/billing', '/api/customers', '/api/invoices', '/api/quotes'],
      dependencies: ['core'],
    },
    accounting: {
      id: 'accounting',
      name: 'Comptabilité',
      description: 'Gestion comptable complète',
      enabled: false,
      required: false,
      tables: ['chart_of_accounts', 'accounting_entries', 'fiscal_years', 'vat_declarations', 'bank_reconciliations'],
      routes: ['/api/accounting', '/api/chart-of-accounts', '/api/entries'],
      dependencies: ['core'],
    },
    hr: {
      id: 'hr',
      name: 'Ressources Humaines',
      description: 'Gestion des employés, paie, congés',
      enabled: false,
      required: false,
      tables: ['employees', 'contracts', 'payrolls', 'leaves', 'evaluations', 'skills'],
      routes: ['/api/hr', '/api/employees', '/api/payrolls', '/api/leaves'],
      dependencies: ['core'],
    },
    crm: {
      id: 'crm',
      name: 'CRM',
      description: 'Gestion de la relation client',
      enabled: false,
      required: false,
      tables: ['contacts', 'opportunities', 'deals', 'interactions', 'campaigns'],
      routes: ['/api/crm', '/api/contacts', '/api/opportunities'],
      dependencies: ['core'],
    },
    inventory: {
      id: 'inventory',
      name: 'Gestion de Stock',
      description: 'Gestion des produits et inventaires',
      enabled: false,
      required: false,
      tables: ['products', 'warehouses', 'stock_movements', 'inventories', 'product_categories'],
      routes: ['/api/inventory', '/api/products', '/api/warehouses'],
      dependencies: ['core'],
    },
    projects: {
      id: 'projects',
      name: 'Gestion de Projets',
      description: 'Gestion des projets et tâches',
      enabled: false,
      required: false,
      tables: ['projects', 'tasks', 'time_entries', 'project_budgets', 'project_members'],
      routes: ['/api/projects', '/api/tasks', '/api/time-entries'],
      dependencies: ['core'],
    },
    legal: {
      id: 'legal',
      name: 'Juridique',
      description: 'Gestion des contrats et conformité',
      enabled: false,
      required: false,
      tables: ['legal_contracts', 'contract_templates', 'legal_alerts', 'gdpr_consents'],
      routes: ['/api/legal', '/api/contracts'],
      dependencies: ['core'],
    },
    documents: {
      id: 'documents',
      name: 'Gestion Documentaire',
      description: 'Stockage et gestion des documents',
      enabled: false,
      required: false,
      tables: ['documents', 'document_versions', 'document_shares', 'document_tags'],
      routes: ['/api/documents'],
      dependencies: ['core'],
    },
    reporting: {
      id: 'reporting',
      name: 'Reporting & Analytics',
      description: 'Tableaux de bord et rapports',
      enabled: false,
      required: false,
      tables: ['reports', 'report_templates', 'dashboards', 'kpis'],
      routes: ['/api/reporting', '/api/dashboards'],
      dependencies: ['core'],
    },
    workflows: {
      id: 'workflows',
      name: 'Workflows',
      description: 'Automatisation des processus',
      enabled: false,
      required: false,
      tables: ['workflows', 'workflow_instances', 'workflow_steps', 'workflow_executions'],
      routes: ['/api/workflows'],
      dependencies: ['core'],
    },
    integrations: {
      id: 'integrations',
      name: 'Intégrations',
      description: 'Connexions avec logiciels externes',
      enabled: false,
      required: false,
      tables: ['integrations', 'integration_connectors', 'integration_mappings', 'integration_syncs'],
      routes: ['/api/integrations'],
      dependencies: ['core'],
    },
    voice: {
      id: 'voice',
      name: 'Gestion Vocale',
      description: 'Commandes et interactions vocales',
      enabled: false,
      required: false,
      tables: ['voice_commands', 'voice_sessions', 'voice_transcriptions', 'voice_actions'],
      routes: ['/api/voice'],
      dependencies: ['core'],
    },
  } as const,

  // Tables de base de données avec leurs propriétés
  database: {
    // Tables Core (toujours présentes)
    companies: {
      module: 'core',
      columns: ['id', 'name', 'siret', 'vat_number', 'address', 'country', 'currency', 'timezone', 'created_at', 'updated_at'],
      indexes: ['id', 'siret'],
      rls_enabled: true,
    },
    users: {
      module: 'core',
      columns: ['id', 'email', 'company_id', 'role_id', 'first_name', 'last_name', 'created_at', 'updated_at'],
      indexes: ['id', 'email', 'company_id'],
      rls_enabled: true,
    },
    roles: {
      module: 'core',
      columns: ['id', 'company_id', 'name', 'permissions', 'created_at', 'updated_at'],
      indexes: ['id', 'company_id'],
      rls_enabled: true,
    },
    modules: {
      module: 'core',
      columns: ['id', 'company_id', 'module_id', 'enabled', 'config', 'created_at', 'updated_at'],
      indexes: ['id', 'company_id', 'module_id'],
      rls_enabled: true,
    },
    settings: {
      module: 'core',
      columns: ['id', 'company_id', 'key', 'value', 'type', 'created_at', 'updated_at'],
      indexes: ['id', 'company_id', 'key'],
      rls_enabled: true,
    },
    
    // Tables Facturation
    customers: {
      module: 'billing',
      columns: ['id', 'company_id', 'name', 'email', 'phone', 'address', 'tax_id', 'created_at', 'updated_at'],
      indexes: ['id', 'company_id', 'email'],
      rls_enabled: true,
    },
    invoices: {
      module: 'billing',
      columns: ['id', 'company_id', 'customer_id', 'number', 'status', 'amount', 'due_date', 'created_at', 'updated_at'],
      indexes: ['id', 'company_id', 'customer_id', 'number'],
      rls_enabled: true,
    },
    
    // Tables Comptabilité
    chart_of_accounts: {
      module: 'accounting',
      columns: ['id', 'company_id', 'code', 'name', 'type', 'parent_id', 'created_at', 'updated_at'],
      indexes: ['id', 'company_id', 'code'],
      rls_enabled: true,
    },
    accounting_entries: {
      module: 'accounting',
      columns: ['id', 'company_id', 'fiscal_year_id', 'account_id', 'debit', 'credit', 'description', 'created_at'],
      indexes: ['id', 'company_id', 'fiscal_year_id', 'account_id'],
      rls_enabled: true,
    },
    
    // Tables RH
    employees: {
      module: 'hr',
      columns: ['id', 'company_id', 'user_id', 'employee_number', 'hire_date', 'position', 'salary', 'created_at', 'updated_at'],
      indexes: ['id', 'company_id', 'user_id'],
      rls_enabled: true,
    },
    
    // Tables CRM
    contacts: {
      module: 'crm',
      columns: ['id', 'company_id', 'type', 'name', 'email', 'phone', 'score', 'created_at', 'updated_at'],
      indexes: ['id', 'company_id', 'email'],
      rls_enabled: true,
    },
    
    // Tables Stock
    products: {
      module: 'inventory',
      columns: ['id', 'company_id', 'sku', 'name', 'description', 'price', 'stock_quantity', 'created_at', 'updated_at'],
      indexes: ['id', 'company_id', 'sku'],
      rls_enabled: true,
    },
    
    // Tables Projets
    projects: {
      module: 'projects',
      columns: ['id', 'company_id', 'name', 'description', 'status', 'start_date', 'end_date', 'budget', 'created_at', 'updated_at'],
      indexes: ['id', 'company_id'],
      rls_enabled: true,
    },
    
    // Tables Documents
    documents: {
      module: 'documents',
      columns: ['id', 'company_id', 'name', 'type', 'storage_path', 'size', 'mime_type', 'created_at', 'updated_at'],
      indexes: ['id', 'company_id'],
      rls_enabled: true,
    },
    
    // Tables Workflows
    workflows: {
      module: 'workflows',
      columns: ['id', 'company_id', 'name', 'description', 'trigger', 'steps', 'enabled', 'created_at', 'updated_at'],
      indexes: ['id', 'company_id'],
      rls_enabled: true,
    },
    
    // Tables Intégrations
    integrations: {
      module: 'integrations',
      columns: ['id', 'company_id', 'connector_id', 'name', 'config', 'status', 'last_sync', 'created_at', 'updated_at'],
      indexes: ['id', 'company_id', 'connector_id'],
      rls_enabled: true,
    },
    
    // Tables Gestion Vocale
    voice_commands: {
      module: 'voice',
      columns: ['id', 'company_id', 'command', 'action', 'module', 'enabled', 'created_at', 'updated_at'],
      indexes: ['id', 'company_id', 'command'],
      rls_enabled: true,
    },
  } as const,

  // Routes API disponibles
  routes: {
    // Core routes
    '/api/auth': { module: 'core', methods: ['GET', 'POST'], auth: false },
    '/api/auth/login': { module: 'core', methods: ['POST'], auth: false },
    '/api/auth/logout': { module: 'core', methods: ['POST'], auth: true },
    '/api/auth/register': { module: 'core', methods: ['POST'], auth: false },
    '/api/companies': { module: 'core', methods: ['GET', 'POST'], auth: true },
    '/api/settings': { module: 'core', methods: ['GET', 'POST', 'PUT'], auth: true },
    
    // Billing routes
    '/api/billing': { module: 'billing', methods: ['GET'], auth: true },
    '/api/customers': { module: 'billing', methods: ['GET', 'POST', 'PUT', 'DELETE'], auth: true },
    '/api/invoices': { module: 'billing', methods: ['GET', 'POST', 'PUT', 'DELETE'], auth: true },
    '/api/quotes': { module: 'billing', methods: ['GET', 'POST', 'PUT', 'DELETE'], auth: true },
    
    // Accounting routes
    '/api/accounting': { module: 'accounting', methods: ['GET'], auth: true },
    '/api/chart-of-accounts': { module: 'accounting', methods: ['GET', 'POST', 'PUT'], auth: true },
    
    // HR routes
    '/api/hr': { module: 'hr', methods: ['GET'], auth: true },
    '/api/employees': { module: 'hr', methods: ['GET', 'POST', 'PUT', 'DELETE'], auth: true },
    
    // CRM routes
    '/api/crm': { module: 'crm', methods: ['GET'], auth: true },
    '/api/contacts': { module: 'crm', methods: ['GET', 'POST', 'PUT', 'DELETE'], auth: true },
    
    // Voice routes
    '/api/voice': { module: 'voice', methods: ['POST'], auth: true },
    '/api/voice/commands': { module: 'voice', methods: ['GET', 'POST'], auth: true },
    
    // Integrations routes
    '/api/integrations': { module: 'integrations', methods: ['GET', 'POST'], auth: true },
  } as const,

  // Permissions disponibles
  permissions: {
    // Core permissions
    'core:read': 'Lecture des données core',
    'core:write': 'Écriture des données core',
    'core:admin': 'Administration complète',
    
    // Module permissions
    'billing:read': 'Lecture facturation',
    'billing:write': 'Écriture facturation',
    'billing:approve': 'Approbation factures',
    
    'accounting:read': 'Lecture comptabilité',
    'accounting:write': 'Écriture comptabilité',
    'accounting:close': 'Clôture exercice',
    
    'hr:read': 'Lecture RH',
    'hr:write': 'Écriture RH',
    'hr:payroll': 'Gestion paie',
    
    // Voice permissions
    'voice:use': 'Utilisation commandes vocales',
    'voice:admin': 'Administration commandes vocales',
    
    // Integration permissions
    'integrations:read': 'Lecture intégrations',
    'integrations:write': 'Écriture intégrations',
    'integrations:sync': 'Synchronisation intégrations',
  } as const,

  // Intégrations disponibles
  integrations: {
    // Santé
    doctolib: {
      id: 'doctolib',
      name: 'Doctolib',
      category: 'health',
      enabled: false,
      config: ['api_key', 'api_secret'],
    },
    cegedim: {
      id: 'cegedim',
      name: 'Cegedim',
      category: 'health',
      enabled: false,
      config: ['api_key', 'endpoint'],
    },
    
    // Automobile
    garage_partner: {
      id: 'garage_partner',
      name: 'Garage Partner',
      category: 'automotive',
      enabled: false,
      config: ['api_key', 'endpoint'],
    },
    
    // Comptabilité
    sage: {
      id: 'sage',
      name: 'Sage',
      category: 'accounting',
      enabled: false,
      config: ['api_key', 'endpoint'],
    },
    
    // Paiements
    stripe: {
      id: 'stripe',
      name: 'Stripe',
      category: 'payment',
      enabled: true,
      config: ['secret_key', 'publishable_key'],
    },
  } as const,
} as const;

// Types TypeScript dérivés du registry
export type ModuleId = keyof typeof APP_REGISTRY.modules;
export type TableName = keyof typeof APP_REGISTRY.database;
export type RoutePath = keyof typeof APP_REGISTRY.routes;
export type Permission = keyof typeof APP_REGISTRY.permissions;

// Helpers pour vérifier les conflits
export function isModuleEnabled(moduleId: ModuleId): boolean {
  return APP_REGISTRY.modules[moduleId]?.enabled ?? false;
}

export function getModuleTables(moduleId: ModuleId): string[] {
  return APP_REGISTRY.modules[moduleId]?.tables ?? [];
}

export function getModuleRoutes(moduleId: ModuleId): string[] {
  return APP_REGISTRY.modules[moduleId]?.routes ?? [];
}

export function validateTableExists(tableName: string): boolean {
  return tableName in APP_REGISTRY.database;
}

export function validateRouteExists(route: string): boolean {
  return route in APP_REGISTRY.routes;
}

