/**
 * CRM Integration Service
 * Supports HubSpot, Salesforce, and Pipedrive
 *
 * This module provides the foundation for CRM synchronization:
 * - Sync tenders/opportunities to CRM
 * - Sync contacts/companies from CRM
 * - Track deal pipeline from tender responses
 */

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type CRMProvider = 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho';

export interface CRMConfig {
  provider: CRMProvider;
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  instanceUrl?: string; // For Salesforce
  portalId?: string; // For HubSpot
  enabled: boolean;
  syncSettings: CRMSyncSettings;
}

export interface CRMSyncSettings {
  syncTenders: boolean;
  syncContacts: boolean;
  syncCompanies: boolean;
  syncDocuments: boolean;
  autoCreateDeals: boolean;
  dealStageMapping: DealStageMapping;
  customFieldMappings: FieldMapping[];
}

export interface DealStageMapping {
  draft: string;
  submitted: string;
  underReview: string;
  won: string;
  lost: string;
}

export interface FieldMapping {
  wewinbidField: string;
  crmField: string;
  direction: 'to_crm' | 'from_crm' | 'bidirectional';
}

export interface CRMContact {
  id?: string;
  externalId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source?: string;
}

export interface CRMCompany {
  id?: string;
  externalId?: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  address?: string;
  city?: string;
  country?: string;
  siret?: string;
}

export interface CRMDeal {
  id?: string;
  externalId?: string;
  name: string;
  value?: number;
  currency?: string;
  stage: string;
  closeDate?: Date;
  probability?: number;
  tenderId?: string;
  companyId?: string;
  contactId?: string;
  description?: string;
  customFields?: Record<string, unknown>;
}

export interface CRMSyncResult {
  success: boolean;
  action: 'created' | 'updated' | 'skipped' | 'error';
  externalId?: string;
  error?: string;
}

// =============================================================================
// CRM INTEGRATION SERVICE
// =============================================================================

export class CRMIntegrationService {
  private config: CRMConfig;

  constructor(config: CRMConfig) {
    this.config = config;
  }

  // ---------------------------------------------------------------------------
  // HUBSPOT INTEGRATION
  // ---------------------------------------------------------------------------

  private async hubspotRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<unknown> {
    const response = await fetch(`https://api.hubapi.com${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async syncTenderToHubSpot(tender: {
    id: string;
    title: string;
    description?: string;
    budget?: number;
    deadline?: Date;
    status: string;
    buyerName?: string;
    buyerEmail?: string;
  }): Promise<CRMSyncResult> {
    if (this.config.provider !== 'hubspot' || !this.config.enabled) {
      return { success: false, action: 'skipped', error: 'HubSpot not configured' };
    }

    try {
      // Map tender status to HubSpot deal stage
      const stageMap: Record<string, string> = {
        draft: this.config.syncSettings.dealStageMapping.draft || 'appointmentscheduled',
        submitted: this.config.syncSettings.dealStageMapping.submitted || 'qualifiedtobuy',
        under_review: this.config.syncSettings.dealStageMapping.underReview || 'presentationscheduled',
        won: this.config.syncSettings.dealStageMapping.won || 'closedwon',
        lost: this.config.syncSettings.dealStageMapping.lost || 'closedlost'
      };

      const dealProperties = {
        properties: {
          dealname: tender.title,
          description: tender.description || '',
          amount: tender.budget?.toString() || '0',
          dealstage: stageMap[tender.status] || 'appointmentscheduled',
          closedate: tender.deadline?.toISOString() || new Date().toISOString(),
          wewinbid_tender_id: tender.id
        }
      };

      // Check if deal already exists
      const searchResponse = await this.hubspotRequest(
        '/crm/v3/objects/deals/search',
        'POST',
        {
          filterGroups: [{
            filters: [{
              propertyName: 'wewinbid_tender_id',
              operator: 'EQ',
              value: tender.id
            }]
          }]
        }
      ) as { results: Array<{ id: string }> };

      if (searchResponse.results && searchResponse.results.length > 0) {
        // Update existing deal
        const dealId = searchResponse.results[0].id;
        await this.hubspotRequest(`/crm/v3/objects/deals/${dealId}`, 'PATCH', dealProperties);
        return { success: true, action: 'updated', externalId: dealId };
      } else {
        // Create new deal
        const createResponse = await this.hubspotRequest(
          '/crm/v3/objects/deals',
          'POST',
          dealProperties
        ) as { id: string };
        return { success: true, action: 'created', externalId: createResponse.id };
      }
    } catch (error) {
      return {
        success: false,
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getHubSpotContacts(limit = 100): Promise<CRMContact[]> {
    if (this.config.provider !== 'hubspot' || !this.config.enabled) {
      return [];
    }

    try {
      const response = await this.hubspotRequest(
        `/crm/v3/objects/contacts?limit=${limit}&properties=email,firstname,lastname,phone,company,jobtitle`
      ) as { results: Array<{ id: string; properties: Record<string, string> }> };

      return response.results.map(contact => ({
        externalId: contact.id,
        email: contact.properties.email,
        firstName: contact.properties.firstname,
        lastName: contact.properties.lastname,
        phone: contact.properties.phone,
        company: contact.properties.company,
        jobTitle: contact.properties.jobtitle
      }));
    } catch (error) {
      console.error('HubSpot getContacts error:', error);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // SALESFORCE INTEGRATION
  // ---------------------------------------------------------------------------

  private async salesforceRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<unknown> {
    const response = await fetch(`${this.config.instanceUrl}/services/data/v57.0${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`Salesforce API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async syncTenderToSalesforce(tender: {
    id: string;
    title: string;
    description?: string;
    budget?: number;
    deadline?: Date;
    status: string;
    accountId?: string;
  }): Promise<CRMSyncResult> {
    if (this.config.provider !== 'salesforce' || !this.config.enabled) {
      return { success: false, action: 'skipped', error: 'Salesforce not configured' };
    }

    try {
      const stageMap: Record<string, string> = {
        draft: this.config.syncSettings.dealStageMapping.draft || 'Prospecting',
        submitted: this.config.syncSettings.dealStageMapping.submitted || 'Proposal/Price Quote',
        under_review: this.config.syncSettings.dealStageMapping.underReview || 'Negotiation/Review',
        won: this.config.syncSettings.dealStageMapping.won || 'Closed Won',
        lost: this.config.syncSettings.dealStageMapping.lost || 'Closed Lost'
      };

      const opportunityData = {
        Name: tender.title,
        Description: tender.description || '',
        Amount: tender.budget || 0,
        StageName: stageMap[tender.status] || 'Prospecting',
        CloseDate: tender.deadline?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        WeWinBid_Tender_ID__c: tender.id,
        AccountId: tender.accountId
      };

      // Search for existing opportunity
      const searchQuery = encodeURIComponent(`SELECT Id FROM Opportunity WHERE WeWinBid_Tender_ID__c = '${tender.id}'`);
      const searchResponse = await this.salesforceRequest(`/query?q=${searchQuery}`) as { records: Array<{ Id: string }> };

      if (searchResponse.records && searchResponse.records.length > 0) {
        // Update existing opportunity
        const oppId = searchResponse.records[0].Id;
        await this.salesforceRequest(`/sobjects/Opportunity/${oppId}`, 'PATCH', opportunityData);
        return { success: true, action: 'updated', externalId: oppId };
      } else {
        // Create new opportunity
        const createResponse = await this.salesforceRequest(
          '/sobjects/Opportunity',
          'POST',
          opportunityData
        ) as { id: string };
        return { success: true, action: 'created', externalId: createResponse.id };
      }
    } catch (error) {
      return {
        success: false,
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getSalesforceAccounts(limit = 100): Promise<CRMCompany[]> {
    if (this.config.provider !== 'salesforce' || !this.config.enabled) {
      return [];
    }

    try {
      const query = encodeURIComponent(`SELECT Id, Name, Website, Industry, NumberOfEmployees, BillingCity, BillingCountry FROM Account LIMIT ${limit}`);
      const response = await this.salesforceRequest(`/query?q=${query}`) as {
        records: Array<{
          Id: string;
          Name: string;
          Website?: string;
          Industry?: string;
          NumberOfEmployees?: number;
          BillingCity?: string;
          BillingCountry?: string;
        }>
      };

      return response.records.map(account => ({
        externalId: account.Id,
        name: account.Name,
        domain: account.Website,
        industry: account.Industry,
        size: account.NumberOfEmployees?.toString(),
        city: account.BillingCity,
        country: account.BillingCountry
      }));
    } catch (error) {
      console.error('Salesforce getAccounts error:', error);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // PIPEDRIVE INTEGRATION
  // ---------------------------------------------------------------------------

  private async pipedriveRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<unknown> {
    const url = new URL(`https://api.pipedrive.com/v1${endpoint}`);
    url.searchParams.set('api_token', this.config.apiKey || '');

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`Pipedrive API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async syncTenderToPipedrive(tender: {
    id: string;
    title: string;
    description?: string;
    budget?: number;
    deadline?: Date;
    status: string;
    personId?: number;
    organizationId?: number;
  }): Promise<CRMSyncResult> {
    if (this.config.provider !== 'pipedrive' || !this.config.enabled) {
      return { success: false, action: 'skipped', error: 'Pipedrive not configured' };
    }

    try {
      const dealData = {
        title: tender.title,
        value: tender.budget || 0,
        currency: 'EUR',
        expected_close_date: tender.deadline?.toISOString().split('T')[0],
        person_id: tender.personId,
        org_id: tender.organizationId,
        // Custom field for tender ID (would need to be created in Pipedrive)
        // wewinbid_tender_id: tender.id
      };

      // For simplicity, always create new deal
      // In production, you'd search for existing deals first
      const createResponse = await this.pipedriveRequest(
        '/deals',
        'POST',
        dealData
      ) as { data: { id: number } };

      return { success: true, action: 'created', externalId: createResponse.data.id.toString() };
    } catch (error) {
      return {
        success: false,
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ---------------------------------------------------------------------------
  // GENERIC METHODS
  // ---------------------------------------------------------------------------

  async syncTender(tender: {
    id: string;
    title: string;
    description?: string;
    budget?: number;
    deadline?: Date;
    status: string;
    buyerName?: string;
    buyerEmail?: string;
    accountId?: string;
  }): Promise<CRMSyncResult> {
    switch (this.config.provider) {
      case 'hubspot':
        return this.syncTenderToHubSpot(tender);
      case 'salesforce':
        return this.syncTenderToSalesforce(tender);
      case 'pipedrive':
        return this.syncTenderToPipedrive(tender);
      default:
        return { success: false, action: 'skipped', error: 'CRM provider not supported' };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      switch (this.config.provider) {
        case 'hubspot':
          await this.hubspotRequest('/crm/v3/objects/contacts?limit=1');
          break;
        case 'salesforce':
          await this.salesforceRequest('/limits');
          break;
        case 'pipedrive':
          await this.pipedriveRequest('/users/me');
          break;
        default:
          return { success: false, error: 'Unknown provider' };
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }
}

// =============================================================================
// OAUTH HELPERS
// =============================================================================

export function getHubSpotAuthUrl(clientId: string, redirectUri: string, scopes: string[]): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    response_type: 'code'
  });
  return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
}

export function getSalesforceAuthUrl(clientId: string, redirectUri: string, sandbox = false): string {
  const baseUrl = sandbox
    ? 'https://test.salesforce.com'
    : 'https://login.salesforce.com';
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code'
  });
  return `${baseUrl}/services/oauth2/authorize?${params.toString()}`;
}

export async function exchangeHubSpotCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code
    })
  });

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in
  };
}

export async function exchangeSalesforceCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  sandbox = false
): Promise<{ accessToken: string; refreshToken: string; instanceUrl: string }> {
  const baseUrl = sandbox
    ? 'https://test.salesforce.com'
    : 'https://login.salesforce.com';

  const response = await fetch(`${baseUrl}/services/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code
    })
  });

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    instanceUrl: data.instance_url
  };
}

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

export const DEFAULT_CRM_CONFIG: CRMConfig = {
  provider: 'hubspot',
  enabled: false,
  syncSettings: {
    syncTenders: true,
    syncContacts: true,
    syncCompanies: true,
    syncDocuments: false,
    autoCreateDeals: true,
    dealStageMapping: {
      draft: 'appointmentscheduled',
      submitted: 'qualifiedtobuy',
      underReview: 'presentationscheduled',
      won: 'closedwon',
      lost: 'closedlost'
    },
    customFieldMappings: []
  }
};

export default CRMIntegrationService;
