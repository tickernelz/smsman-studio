import { fetch } from '@tauri-apps/plugin-http'

const BASE = 'https://api.sms-man.com/control'

async function get<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const url = new URL(`${BASE}/${endpoint}`)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) url.searchParams.set(k, String(v))
  })
  const res = await fetch(url.toString(), { method: 'GET' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()) as T
  if (
    data !== null &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    'success' in data &&
    (data as Record<string, unknown>).success === false
  ) {
    const err = data as Record<string, unknown>
    throw new Error(String(err.error_msg ?? err.error_code ?? 'API Error'))
  }
  return data
}

export interface BalanceResponse {
  balance: string
  hold: number
  channels: number
  active_channels: number
  rating: string
}

export interface Country {
  id: string
  title: string
  code: string
}

export interface Application {
  id: string
  title: string
  code: string
}

export interface PriceEntry {
  cost: string
  count?: number
  application_id: string
  country_id: string
  country: string
  application: string
  numbers?: number
}

export type PricesResponse = Record<string, Record<string, PriceEntry>>
export type PricesByCountryResponse = Record<string, PriceEntry>

export type LimitsResponse = Record<string, Record<string, PriceEntry>>

export interface NumberResponse {
  request_id: number
  application_id: number
  country_id: number
  number: string
  error_code?: string
  error_msg?: string
}

export interface SmsResponse {
  request_id: string
  application_id: number
  country_id: number
  number: string
  sms_code?: string
  error_code?: string
  error_msg?: string
}

export interface StatusResponse {
  request_id: number | string
  success?: boolean
  error_code?: string
  error_msg?: string
}

export const api = {
  getBalance: (token: string): Promise<BalanceResponse> => get('get-balance', { token }),

  getCountries: (token: string): Promise<Record<string, Country>> => get('countries', { token }),

  getApplications: (token: string): Promise<Record<string, Application>> =>
    get('applications', { token }),

  getPrices: (
    token: string,
    countryId?: number
  ): Promise<PricesByCountryResponse | PricesResponse | []> =>
    get('get-prices', { token, country_id: countryId }),

  getLimits: (token: string, countryId?: number, applicationId?: number): Promise<LimitsResponse> =>
    get('limits', { token, country_id: countryId, application_id: applicationId }),

  getNumber: (
    token: string,
    opts: {
      countryId?: number
      applicationId?: number
      maxPrice?: number
      currency?: string
      hasMultipleSms?: boolean
    }
  ): Promise<NumberResponse> =>
    get('get-number', {
      token,
      country_id: opts.countryId,
      application_id: opts.applicationId,
      maxPrice: opts.maxPrice,
      currency: opts.currency,
      hasMultipleSms: opts.hasMultipleSms,
    }),

  getSms: (token: string, requestId: number): Promise<SmsResponse> =>
    get('get-sms', { token, request_id: requestId }),

  setStatus: (
    token: string,
    requestId: number,
    reqStatus: 'ready' | 'close' | 'reject' | 'used'
  ): Promise<StatusResponse> =>
    get('set-status', { token, request_id: requestId, status: reqStatus }),
}
