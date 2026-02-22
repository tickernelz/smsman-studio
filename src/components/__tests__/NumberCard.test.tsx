import { act } from '@testing-library/react'
import { useAppStore } from '../../store/useAppStore'
import { describe, it, expect, beforeEach } from 'vitest'

describe('NumberCard - Race Condition', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeRequests: [],
      history: [],
    })
  })

  it('should atomically update request and history when SMS received', async () => {
    const { addRequest, updateRequest, addHistory } = useAppStore.getState()
    
    addRequest({
      requestId: 123,
      number: '+1234567890',
      countryId: 1,
      applicationId: 2,
      countryName: 'Test',
      serviceName: 'Telegram',
      smsCode: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      accountId: 'test-acc',
    })

    const smsCode = '5678'
    const resolvedAt = new Date().toISOString()

    act(() => {
      updateRequest(123, { smsCode, status: 'received' })
      addHistory({
        requestId: 123,
        number: '+1234567890',
        countryId: 1,
        applicationId: 2,
        countryName: 'Test',
        serviceName: 'Telegram',
        smsCode,
        status: 'received',
        createdAt: new Date().toISOString(),
        accountId: 'test-acc',
        resolvedAt,
      })
    })

    const state = useAppStore.getState()
    const activeReq = state.activeRequests.find(r => r.requestId === 123)
    const historyEntry = state.history.find(h => h.requestId === 123)

    expect(activeReq?.smsCode).toBe(smsCode)
    expect(activeReq?.status).toBe('received')
    expect(historyEntry?.smsCode).toBe(smsCode)
    expect(historyEntry?.resolvedAt).toBe(resolvedAt)
  })
})
