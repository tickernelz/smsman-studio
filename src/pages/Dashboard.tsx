import {
  ActionIcon,
  Badge,
  Card,
  Grid,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core"
import { IconDeviceMobile, IconRefresh, IconStar } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { api } from "../api/smsmanClient"
import { useActiveAccount, useActiveAccountToken, useAppStore } from "../store/useAppStore"

export default function Dashboard() {
  const activeAccount = useActiveAccount()
  const token = useActiveAccountToken()
  const activeRequests = useAppStore((s) => s.activeRequests)
  const accounts = useAppStore((s) => s.accounts)

  const {
    data: balance,
    isLoading,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["balance", token],
    queryFn: () => {
      if (!token) throw new Error("Token not available")
      return api.getBalance(token)
    },
    enabled: !!token,
    refetchInterval: 30_000,
  })

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—'
  const myRequests = activeRequests.filter((r) => r.accountId === activeAccount?.id)
  const receivedCount = myRequests.filter((r) => r.smsCode).length

  if (!activeAccount) {
    return (
      <Stack align="center" pt="xl">
        <Text c="dimmed">No active account selected.</Text>
      </Stack>
    )
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Dashboard</Title>
        <Text size="xs" c="dimmed">
          Account: {activeAccount.label}
        </Text>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Card>
          <Group justify="space-between" mb={4}>
            <Text size="sm" c="dimmed">
              Balance
            </Text>
            <ActionIcon variant="subtle" size="xs" onClick={() => refetch()} loading={isLoading}>
              <IconRefresh size={13} />
            </ActionIcon>
          </Group>
          {isLoading ? (
            <Skeleton height={32} width={100} />
          ) : (
            <Text size="xl" fw={700}>
              {balance?.balance ?? '—'}
            </Text>
          )}
          <Text size="xs" c="dimmed" mt={2}>
            Updated {lastUpdated}
          </Text>
        </Card>

        <Card>
          <Text size="sm" c="dimmed" mb={4}>
            Hold
          </Text>
          {isLoading ? (
            <Skeleton height={32} width={80} />
          ) : (
            <Text size="xl" fw={700}>
              {balance?.hold ?? '—'}
            </Text>
          )}
          <Text size="xs" c="dimmed" mt={2}>
            Reserved balance
          </Text>
        </Card>

        <Card>
          <Text size="sm" c="dimmed" mb={4}>
            Channels
          </Text>
          {isLoading ? (
            <Skeleton height={32} width={60} />
          ) : (
            <Group gap={6} align="baseline">
              <Text size="xl" fw={700}>
                {balance?.active_channels ?? '—'}
              </Text>
              <Text size="sm" c="dimmed">
                / {balance?.channels ?? '—'}
              </Text>
            </Group>
          )}
          <Text size="xs" c="dimmed" mt={2}>
            Active / Total
          </Text>
        </Card>

        <Card>
          <Group justify="space-between" mb={4}>
            <Text size="sm" c="dimmed">
              Rating
            </Text>
            <IconStar size={14} opacity={0.5} />
          </Group>
          {isLoading ? (
            <Skeleton height={32} width={80} />
          ) : (
            <Text size="xl" fw={700}>
              {balance?.rating ?? '—'}%
            </Text>
          )}
          <Text size="xs" c="dimmed" mt={2}>
            Account reputation
          </Text>
        </Card>
      </SimpleGrid>

      <Grid>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card>
            <Group justify="space-between" mb="sm">
              <Text fw={500}>Active Requests</Text>
              <Badge leftSection={<IconDeviceMobile size={11} />} variant="light">
                {myRequests.length} active · {receivedCount} received
              </Badge>
            </Group>
            {myRequests.length === 0 ? (
              <Text size="sm" c="dimmed">
                No active requests for this account.
              </Text>
            ) : (
              <Stack gap="xs">
                {myRequests.map((r) => (
                  <Group key={r.requestId} justify="space-between" wrap="nowrap">
                    <Text ff="monospace" size="sm" truncate>
                      {r.number}
                    </Text>
                    <Group gap={6}>
                      {r.smsCode ? (
                        <Badge color="green" size="sm">
                          {r.smsCode}
                        </Badge>
                      ) : (
                        <Badge color="yellow" size="sm" variant="dot">
                          waiting
                        </Badge>
                      )}
                      <Text size="xs" c="dimmed" truncate maw={80}>
                        {r.serviceName}
                      </Text>
                    </Group>
                  </Group>
                ))}
              </Stack>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Card>
            <Group justify="space-between" mb="sm">
              <Text fw={500}>All Accounts</Text>
              <Badge variant="light">{accounts.length}</Badge>
            </Group>
            <Stack gap="xs">
              {accounts.map((acc) => {
                const accRequests = activeRequests.filter((r) => r.accountId === acc.id)
                return (
                  <Group key={acc.id} justify="space-between" wrap="nowrap">
                    <Text size="sm" truncate maw={140}>
                      {acc.label}
                    </Text>
                    <Group gap={6}>
                      {accRequests.length > 0 && (
                        <Badge size="xs" color="blue" variant="light">
                          {accRequests.length} active
                        </Badge>
                      )}
                      <Text size="xs" c="dimmed">
                        {new Date(acc.createdAt).toLocaleDateString()}
                      </Text>
                    </Group>
                  </Group>
                )
              })}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
