/**
 * API Client for AKTA MMI Backend
 * Centralized API calls with JWT injection
 */
import { supabase } from '@/integrations/supabase/client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

/**
 * Get JWT token from Supabase session
 */
async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'API request failed');
  }
  
  return data.data as T;
}

// ============================================
// REDISTRIBUTION API
// ============================================

export interface RedistributionItem {
  sku: string;
  quantity: number;
}

export interface CreateRedistributionRequest {
  from_kiosk_id: string;
  to_kiosk_id: string;
  items: RedistributionItem[];
  client_req_id: string;
  signature: string;
  public_key: string;
}

export interface Redistribution {
  id: string;
  from_kiosk_id: string;
  to_kiosk_id: string;
  status: string;
  items: any[];
  pricing?: any;
  blockchain_ref?: string;
  txid?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export async function createRedistribution(
  request: CreateRedistributionRequest
): Promise<Redistribution> {
  return apiRequest<Redistribution>('/redistributions', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function approveRedistribution(
  redistributionId: string,
  adminWallet: string,
  clientReqId?: string
): Promise<{ command_id: string; redistribution_id: string; status: string }> {
  return apiRequest(`/redistributions/${redistributionId}/approve`, {
    method: 'POST',
    body: JSON.stringify({
      admin_wallet: adminWallet,
      client_req_id: clientReqId,
    }),
  });
}

export async function getRedistribution(id: string): Promise<Redistribution> {
  return apiRequest<Redistribution>(`/redistributions/${id}`);
}

export interface ListRedistributionsParams {
  status?: string;
  from_kiosk_id?: string;
  to_kiosk_id?: string;
  limit?: number;
  offset?: number;
}

export interface ListRedistributionsResponse {
  items: Redistribution[];
  total: number;
  limit: number;
  offset: number;
}

export async function listRedistributions(
  params?: ListRedistributionsParams
): Promise<ListRedistributionsResponse> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
  }
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/redistributions?${queryString}` : '/redistributions';
  
  return apiRequest<ListRedistributionsResponse>(endpoint);
}

// ============================================
// COMMAND API
// ============================================

export interface Command {
  id: string;
  status: string;
  redistribution_id: string;
  txid?: string;
  created_at: string;
  processed_at?: string;
  error_message?: string;
}

export async function getCommand(commandId: string): Promise<Command> {
  return apiRequest<Command>(`/commands/${commandId}`);
}

// ============================================
// TRANSACTION API
// ============================================

export interface Transaction {
  txid: string;
  chain: string;
  chain_id: string;
  status: string;
  block?: number;
  confirmed_round?: number;
  fee?: number;
  redistribution_id: string;
  created_at: string;
  confirmed_at?: string;
  explorer_url?: string;
}

export async function getTransaction(txid: string): Promise<Transaction> {
  return apiRequest<Transaction>(`/tx/${txid}`);
}

export async function listTransactions(
  params?: ListRedistributionsParams
): Promise<ListRedistributionsResponse> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
  }
  
  const queryString = queryParams.toString();
  const endpoint = queryString ? `/transactions?${queryString}` : '/transactions';
  
  return apiRequest<ListRedistributionsResponse>(endpoint);
}

// ============================================
// HEALTH API
// ============================================

export interface HealthStatus {
  service: string;
  version: string;
  database: string;
  blockchain: string;
  demo_mode: boolean;
}

export async function getHealth(): Promise<HealthStatus> {
  return apiRequest<HealthStatus>('/health');
}
