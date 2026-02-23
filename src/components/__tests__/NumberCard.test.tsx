import { act } from "@testing-library/react"
import { describe, it, expect, beforeEach } from "vitest"
import { useAppStore } from "../../store/useAppStore"

describe("NumberCard - Atomic Resolution", () => {
  beforeEach(() => {
    useAppStore.setState({
      activeRequests: [],
      history: [],
    })
  })

  it("should atomically resolve request with resolveRequest action", async () => {
    const { addRequest, resolveRequest } = useAppStore.getState()
    
    addRequest({
      requestId: 123,
      number: "+1234567890",
      countryId: 1,
      applicationId: 2,
      countryName: "Test",
      serviceName: "Telegram",
      smsCode: null,
      status: "pending",
      createdAt: new Date().toISOString(),
      accountId: "test-acc",
    })

    const smsCode = "5678"

    act(() => {
      resolveRequest(123, smsCode)
    })

    const state = useAppStore.getState()
    const activeReq = state.activeRequests.find((r) => r.requestId === 123)
    const historyEntry = state.history.find((h) => h.requestId === 123)

    expect(activeReq?.smsCode).toBe(smsCode)
    expect(activeReq?.status).toBe("received")
    expect(historyEntry?.smsCode).toBe(smsCode)
    expect(historyEntry?.status).toBe("received")
    expect(historyEntry?.resolvedAt).toBeDefined()
  })
})
