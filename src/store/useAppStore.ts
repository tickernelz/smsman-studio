import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Account {
  id: string
  label: string
  token: string
  createdAt: string
}

export type RequestStatus = 'pending' | 'ready' | 'received' | 'close' | 'reject' | 'used' | 'error'

export interface ActiveRequest {
  requestId: number
  number: string
  countryId: number
  applicationId: number
  countryName: string
  serviceName: string
  smsCode: string | null
  status: RequestStatus
  createdAt: string
  accountId: string
}

export interface HistoryEntry extends ActiveRequest {
  resolvedAt: string
}

interface AppStore {
  accounts: Account[]
  activeAccountId: string | null
  addAccount: (account: Account) => void
  updateAccount: (id: string, patch: Partial<Pick<Account, 'label' | 'token'>>) => void
  removeAccount: (id: string) => void
  setActiveAccount: (id: string) => void

  activeRequests: ActiveRequest[]
  addRequest: (req: ActiveRequest) => void
  updateRequest: (requestId: number, patch: Partial<ActiveRequest>) => void
  removeRequest: (requestId: number) => void
  resolveRequest: (requestId: number, smsCode: string) => void

  history: HistoryEntry[]
  addHistory: (entry: HistoryEntry) => void
  clearHistory: (accountId?: string) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      accounts: [],
      activeAccountId: null,

      addAccount: (account) =>
        set((s) => ({
          accounts: [...s.accounts, account],
          activeAccountId: s.activeAccountId ?? account.id,
        })),

      updateAccount: (id, patch) =>
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      removeAccount: (id) =>
        set((s) => {
          const remaining = s.accounts.filter((a) => a.id !== id)
          const newActive =
            s.activeAccountId === id ? (remaining[0]?.id ?? null) : s.activeAccountId
          return {
            accounts: remaining,
            activeAccountId: newActive,
            activeRequests: s.activeRequests.filter((r) => r.accountId !== id),
            history: s.history.filter((h) => h.accountId !== id),
          }
        }),

      setActiveAccount: (id) => set({ activeAccountId: id }),

      activeRequests: [],

      addRequest: (req) => set((s) => ({ activeRequests: [...s.activeRequests, req] })),

      updateRequest: (requestId, patch) =>
        set((s) => ({
          activeRequests: s.activeRequests.map((r) =>
            r.requestId === requestId ? { ...r, ...patch } : r
          ),
        })),

      removeRequest: (requestId) =>
        set((s) => ({
          activeRequests: s.activeRequests.filter((r) => r.requestId !== requestId),
        })),

      resolveRequest: (requestId, smsCode) =>
        set((s) => {
          const request = s.activeRequests.find((r) => r.requestId === requestId)
          if (!request) return s
          const resolvedAt = new Date().toISOString()
          const historyEntry: HistoryEntry = { ...request, smsCode, status: 'received', resolvedAt }
          return {
            activeRequests: s.activeRequests.map((r) =>
              r.requestId === requestId ? { ...r, smsCode, status: 'received' } : r
            ),
            history: [historyEntry, ...s.history].slice(0, 500),
          }
        }),

      history: [],

      addHistory: (entry) => set((s) => ({ history: [entry, ...s.history].slice(0, 500) })),

      clearHistory: (accountId) =>
        set((s) => ({
          history: accountId ? s.history.filter((h) => h.accountId !== accountId) : [],
        })),
    }),
    {
      name: 'smsman-studio-v1',
      partialize: (s) => ({
        accounts: s.accounts,
        activeAccountId: s.activeAccountId,
        history: s.history,
      }),
    }
  )
)

export const useActiveAccountId = () => useAppStore((s) => s.activeAccountId)

export const useActiveAccountToken = () =>
  useAppStore((s) => {
    const acc = s.accounts.find((a) => a.id === s.activeAccountId)
    return acc?.token ?? null
  })

export const useAccountToken = (accountId: string) =>
  useAppStore((s) => {
    const acc = s.accounts.find((a) => a.id === accountId)
    return acc?.token ?? null
  })

export const useAccountLabel = (accountId: string) =>
  useAppStore((s) => {
    const acc = s.accounts.find((a) => a.id === accountId)
    return acc?.label ?? null
  })

export const useActiveAccount = () =>
  useAppStore((s) => s.accounts.find((a) => a.id === s.activeAccountId) ?? null)
