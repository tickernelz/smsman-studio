import { useState, useMemo, useCallback } from 'react'
import {
  Stack,
  Title,
  Group,
  Select,
  Button,
  Table,
  Badge,
  Text,
  ScrollArea,
  Skeleton,
  TextInput,
  Pagination,
} from '@mantine/core'
import { IconRefresh, IconSearch } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useDebouncedValue } from '@mantine/hooks'
import { api, PriceEntry } from '../api/smsmanClient'
import { useActiveAccount, useActiveAccountToken } from '../store/useAppStore'

const PAGE_SIZE = 50

export default function Prices() {
  const activeAccount = useActiveAccount()
  const token = useActiveAccountToken()
  const [countryId, setCountryId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [debouncedSearch] = useDebouncedValue(search, 300)

  const { data: countries } = useQuery({
    queryKey: ['countries', token],
    queryFn: () => api.getCountries(token!),
    enabled: !!token,
  })

  const { data: applications } = useQuery({
    queryKey: ['applications', token],
    queryFn: () => api.getApplications(token!),
    enabled: !!token,
  })

  const {
    data: prices,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['prices', token, countryId],
    queryFn: () => api.getPrices(token!, countryId ? Number(countryId) : undefined),
    enabled: !!token && !!countryId,
  })

  const countryOptions = countries
    ? Object.values(countries).map((c) => ({ value: c.id, label: `${c.code} · ${c.title}` }))
    : []

  const rows = useMemo(() => {
    if (!prices || Array.isArray(prices)) return []
    const result: {
      countryId: string
      appId: string
      countryName: string
      appName: string
      cost: string
      count: number | undefined
    }[] = []

    for (const [key, value] of Object.entries(prices)) {
      if (typeof value !== 'object' || value === null) continue

      if ('cost' in value && ('count' in value || 'application' in value)) {
        result.push({
          countryId: String(countryId),
          appId: key,
          countryName:
            value.country || (countryId ? countries?.[countryId]?.title : '') || String(countryId),
          appName: value.application || applications?.[key]?.title || key,
          cost: String(value.cost ?? ''),
          count: value.count,
        })
      } else {
        for (const [aId, info] of Object.entries(value as Record<string, PriceEntry>)) {
          if (typeof info !== 'object' || info === null) continue
          result.push({
            countryId: key,
            appId: aId,
            countryName: info.country || countries?.[key]?.title || key,
            appName: info.application || applications?.[aId]?.title || aId,
            cost: String(info.cost ?? ''),
            count: info.count,
          })
        }
      }
    }
    return result
  }, [prices, countries, applications, countryId])

  const filtered = useMemo(() => {
    if (!debouncedSearch) return rows
    const q = debouncedSearch.toLowerCase()
    return rows.filter(
      (r) => r.countryName.toLowerCase().includes(q) || r.appName.toLowerCase().includes(q)
    )
  }, [rows, debouncedSearch])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const handleCountryChange = useCallback((v: string | null) => {
    setCountryId(v)
    setPage(1)
    setSearch('')
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.currentTarget.value)
    setPage(1)
  }, [])

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
        <Title order={3}>Prices</Title>
        <Button
          variant="subtle"
          leftSection={<IconRefresh size={15} />}
          onClick={() => refetch()}
          loading={isLoading}
          size="xs"
          disabled={!countryId}
        >
          Refresh
        </Button>
      </Group>

      <Group>
        <Select
          placeholder="Select a country first *"
          data={countryOptions}
          value={countryId}
          onChange={handleCountryChange}
          searchable
          clearable
          w={260}
          required
        />
        <TextInput
          placeholder="Search service..."
          leftSection={<IconSearch size={15} />}
          value={search}
          onChange={handleSearchChange}
          w={240}
          disabled={!countryId}
        />
        {countryId && (
          <Text size="sm" c="dimmed">
            {filtered.length.toLocaleString()} entries
          </Text>
        )}
      </Group>

      {!countryId ? (
        <Text c="dimmed" ta="center" py="xl">
          Select a country to view prices.
        </Text>
      ) : (
        <>
          <ScrollArea h="calc(100vh - 300px)">
            <Table striped highlightOnHover withTableBorder stickyHeader>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Country</Table.Th>
                  <Table.Th>Service</Table.Th>
                  <Table.Th>Cost (RUB)</Table.Th>
                  <Table.Th>Available</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {isLoading
                  ? Array(10)
                      .fill(0)
                      .map((_, i) => (
                        <Table.Tr key={i}>
                          {Array(4)
                            .fill(0)
                            .map((_, j) => (
                              <Table.Td key={j}>
                                <Skeleton height={14} />
                              </Table.Td>
                            ))}
                        </Table.Tr>
                      ))
                  : paginated.map((r, i) => (
                      <Table.Tr key={`${r.countryId}-${r.appId}-${i}`}>
                        <Table.Td>
                          <Text size="sm">{r.countryName}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{r.appName}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600} ff="monospace">
                            {r.cost}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={
                              (r.count ?? 0) > 1000
                                ? 'green'
                                : (r.count ?? 0) > 100
                                  ? 'yellow'
                                  : 'red'
                            }
                            variant="light"
                            size="sm"
                          >
                            {(r.count ?? 0).toLocaleString()}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>

          {totalPages > 1 && (
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                Page {page} of {totalPages}
              </Text>
              <Pagination value={page} onChange={setPage} total={totalPages} />
            </Group>
          )}
        </>
      )}
    </Stack>
  )
}
