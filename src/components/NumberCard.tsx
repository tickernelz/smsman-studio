import { useEffect, useRef, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Card,
  CopyButton,
  Group,
  Menu,
  RingProgress,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconBan,
  IconCheck,
  IconCircleCheck,
  IconCopy,
  IconDots,
  IconPlayerPlay,
  IconX,
} from '@tabler/icons-react'
import { api } from '../api/smsmanClient'
import { useAppStore, useAccountLabel, useAccountToken, type ActiveRequest } from '../store/useAppStore'
import StatusBadge from './StatusBadge'

const POLL_INTERVAL = 5

export default function NumberCard({ request }: { request: ActiveRequest }) {
  const token = useAccountToken(request.accountId)
  const accountLabel = useAccountLabel(request.accountId)
  const [countdown, setCountdown] = useState(POLL_INTERVAL)
  const requestRef = useRef(request)
  const tokenRef = useRef(token)

  requestRef.current = request
  tokenRef.current = token

  const shouldPoll = request.status === 'pending' || request.status === 'ready'

  useEffect(() => {
    if (!shouldPoll) return
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          const currentToken = tokenRef.current
          const currentRequest = requestRef.current
          if (!currentToken) return POLL_INTERVAL
          api.getSms(currentToken, currentRequest.requestId)
            .then((res) => {
              if (res.sms_code) {
                useAppStore.getState().resolveRequest(currentRequest.requestId, res.sms_code)
                notifications.show({
                  title: 'SMS Received!',
                  message: `${currentRequest.number} → ${res.sms_code}`,
                  color: 'green',
                  autoClose: 8000,
                })
              }
            })
            .catch(() => {})
          return POLL_INTERVAL
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [shouldPoll])

  const handleSetStatus = async (s: 'ready' | 'close' | 'reject' | 'used') => {
    if (!token) return
    try {
      const res = await api.setStatus(token, request.requestId, s)
      if (res.error_code) {
        notifications.show({
          title: 'Error',
          message: res.error_msg ?? res.error_code,
          color: 'orange',
        })
        return
      }
      useAppStore.getState().updateRequest(request.requestId, { status: s })
      if (s === 'close' || s === 'reject') {
        useAppStore.getState().addHistory({ ...request, status: s, resolvedAt: new Date().toISOString() })
        setTimeout(() => useAppStore.getState().removeRequest(request.requestId), 1500)
      }
    } catch (e: unknown) {
      notifications.show({
        title: 'Failed',
        message: e instanceof Error ? e.message : 'Unknown error',
        color: 'red',
      })
    }
  }

  const copyValue = request.smsCode ?? request.number

  return (
    <Card withBorder>
      <Group justify="space-between" mb="sm">
        <Group gap="xs">
          <StatusBadge status={request.status} />
          <Text size="xs" c="dimmed" ff="monospace">
            #{request.requestId}
          </Text>
        </Group>
        <Group gap="xs">
          {accountLabel && (
            <Badge size="xs" variant="dot" color="blue">
              {accountLabel}
            </Badge>
          )}
          <Menu shadow="md" width={180} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" size="sm">
                <IconDots size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconPlayerPlay size={14} />}
                onClick={() => handleSetStatus('ready')}
              >
                Mark Ready
              </Menu.Item>
              <Menu.Item
                leftSection={<IconCircleCheck size={14} />}
                onClick={() => handleSetStatus('used')}
              >
                Mark Used
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconBan size={14} />}
                color="orange"
                onClick={() => handleSetStatus('reject')}
              >
                Reject
              </Menu.Item>
              <Menu.Item
                leftSection={<IconX size={14} />}
                color="red"
                onClick={() => handleSetStatus('close')}
              >
                Close
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text fw={700} ff="monospace" size="lg">
            {request.number}
          </Text>
          <Text size="xs" c="dimmed">
            {request.countryName} · {request.serviceName}
          </Text>
          {request.smsCode && (
            <Badge color="green" size="lg" variant="filled">
              {request.smsCode}
            </Badge>
          )}
        </Stack>

        <Group gap="xs" align="center">
          {shouldPoll && (
            <Tooltip label={`Polling in ${countdown}s`}>
              <RingProgress
                size={52}
                thickness={4}
                roundCaps
                sections={[
                  {
                    value: ((POLL_INTERVAL - countdown) / POLL_INTERVAL) * 100,
                    color: 'blue',
                  },
                ]}
                label={
                  <Text size="xs" ta="center" fw={600}>
                    {countdown}
                  </Text>
                }
              />
            </Tooltip>
          )}
          <CopyButton value={copyValue} timeout={2000}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Copied!' : request.smsCode ? 'Copy Code' : 'Copy Number'}>
                <ActionIcon
                  variant={copied ? 'filled' : 'light'}
                  color={copied ? 'green' : 'blue'}
                  onClick={copy}
                  size="lg"
                >
                  {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </Group>
      </Group>
    </Card>
  )
}
