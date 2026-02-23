import {
  ActionIcon,
  Badge,
  Group,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from "@mantine/core"
import { IconDownload, IconTrash } from "@tabler/icons-react"
import StatusBadge from "../components/StatusBadge"
import { useMemo } from "react"
import { useActiveAccountId, useActiveAccountLabel, useAppStore, type HistoryEntry } from "../store/useAppStore"

function exportCsv(data: HistoryEntry[]) {
  const headers = [
    'Time',
    'Account',
    'Request ID',
    'Number',
    'Country',
    'Service',
    'Status',
    'SMS Code',
  ]
  const rows = data.map((h) => [
    new Date(h.createdAt).toLocaleString(),
    h.accountId,
    h.requestId,
    h.number,
    h.countryName,
    h.serviceName,
    h.status,
    h.smsCode ?? '',
  ])
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `smsman-history-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function History() {
  const activeAccountId = useActiveAccountId()
  const activeAccountLabel = useActiveAccountLabel()
  const history = useAppStore((s) => s.history)
  const myHistory = useMemo(
    () => history.filter((h) => h.accountId === activeAccountId),
    [history, activeAccountId]
  )
  const totalHistoryCount = history.length
  const clearHistory = useAppStore((s) => s.clearHistory)

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>History</Title>
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            {myHistory.length} entries
            {totalHistoryCount !== myHistory.length && ` (${totalHistoryCount} total)`}
          </Text>
          <Tooltip label="Export this account's history to CSV">
            <ActionIcon
              variant="light"
              onClick={() => exportCsv(myHistory)}
              disabled={myHistory.length === 0}
            >
              <IconDownload size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Clear this account's history">
            <ActionIcon
              variant="light"
              color="red"
              onClick={() => clearHistory(activeAccountId ?? undefined)}
              disabled={myHistory.length === 0}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {myHistory.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No history for {activeAccountLabel ?? 'this account'} yet.
        </Text>
      ) : (
        <ScrollArea h="calc(100vh - 180px)">
          <Table striped highlightOnHover withTableBorder stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Time</Table.Th>
                <Table.Th>Request ID</Table.Th>
                <Table.Th>Number</Table.Th>
                <Table.Th>Country</Table.Th>
                <Table.Th>Service</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>SMS Code</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {myHistory.map((h) => (
                <Table.Tr key={`${h.accountId}-${h.requestId}`}>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {new Date(h.createdAt).toLocaleTimeString()}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text ff="monospace" size="xs">
                      #{h.requestId}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text ff="monospace" size="sm">
                      {h.number}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{h.countryName}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{h.serviceName}</Text>
                  </Table.Td>
                  <Table.Td>
                    <StatusBadge status={h.status} />
                  </Table.Td>
                  <Table.Td>
                    {h.smsCode ? (
                      <Badge color="green" variant="filled" size="sm">
                        {h.smsCode}
                      </Badge>
                    ) : (
                      <Text c="dimmed" size="sm">
                        —
                      </Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Stack>
  )
}
