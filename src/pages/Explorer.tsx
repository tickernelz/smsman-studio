import {
  Badge,
  Group,
  Pagination,
  ScrollArea,
  Select,
  Skeleton,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import { IconApps, IconChartBar, IconSearch, IconWorld } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"
import { api } from "../api/smsmanClient"
import { useActiveAccount, useActiveAccountToken } from "../store/useAppStore"

const PAGE_SIZE = 50

export default function Explorer() {
  const activeAccount = useActiveAccount()
  const token = useActiveAccountToken()
  const [countrySearch, setCountrySearch] = useState('')
  const [appSearch, setAppSearch] = useState('')
  const [limitCountry, setLimitCountry] = useState<string | null>(null)
  const [limitApp, setLimitApp] = useState<string | null>(null)
  const [countryPage, setCountryPage] = useState(1)
  const [appPage, setAppPage] = useState(1)
  const [limitPage, setLimitPage] = useState(1)

  const [debouncedCountrySearch] = useDebouncedValue(countrySearch, 300)
  const [debouncedAppSearch] = useDebouncedValue(appSearch, 300)

  const { data: countries, isLoading: loadingC } = useQuery({
    queryKey: ['countries', token],
    queryFn: () => api.getCountries(token!),
    enabled: !!token,
  })

  const { data: applications, isLoading: loadingA } = useQuery({
    queryKey: ['applications', token],
    queryFn: () => api.getApplications(token!),
    enabled: !!token,
  })

  const { data: limits, isLoading: loadingL } = useQuery({
    queryKey: ['limits', token, limitCountry, limitApp],
    queryFn: () =>
      api.getLimits(
        token!,
        limitCountry ? Number(limitCountry) : undefined,
        limitApp ? Number(limitApp) : undefined
      ),
    enabled: !!token,
  })

  const countriesArray = useMemo(() => (countries ? Object.values(countries) : []), [countries])
  const applicationsArray = useMemo(
    () => (applications ? Object.values(applications) : []),
    [applications]
  )

  const filteredCountries = useMemo(() => {
    if (!debouncedCountrySearch) return countriesArray
    const q = debouncedCountrySearch.toLowerCase()
    return countriesArray.filter(
      (c) => c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    )
  }, [countriesArray, debouncedCountrySearch])

  const filteredApps = useMemo(() => {
    if (!debouncedAppSearch) return applicationsArray
    const q = debouncedAppSearch.toLowerCase()
    return applicationsArray.filter(
      (a) => a.title.toLowerCase().includes(q) || a.code.toLowerCase().includes(q)
    )
  }, [applicationsArray, debouncedAppSearch])

  const limitRows = useMemo(() => {
    if (!limits) return []
    const rows: { countryName: string; appName: string; numbers: number }[] = []
    for (const apps of Object.values(limits)) {
      for (const info of Object.values(apps)) {
        rows.push({
          countryName: info.country || countries?.[info.country_id]?.title || info.country_id,
          appName:
            info.application || applications?.[info.application_id]?.title || info.application_id,
          numbers: info.numbers ?? info.count ?? 0,
        })
      }
    }
    return rows.sort((a, b) => b.numbers - a.numbers)
  }, [limits, countries, applications])

  const countryTotalPages = Math.ceil(filteredCountries.length / PAGE_SIZE)
  const appTotalPages = Math.ceil(filteredApps.length / PAGE_SIZE)
  const limitTotalPages = Math.ceil(limitRows.length / PAGE_SIZE)

  const paginatedCountries = useMemo(() => {
    const start = (countryPage - 1) * PAGE_SIZE
    return filteredCountries.slice(start, start + PAGE_SIZE)
  }, [filteredCountries, countryPage])

  const paginatedApps = useMemo(() => {
    const start = (appPage - 1) * PAGE_SIZE
    return filteredApps.slice(start, start + PAGE_SIZE)
  }, [filteredApps, appPage])

  const paginatedLimits = useMemo(() => {
    const start = (limitPage - 1) * PAGE_SIZE
    return limitRows.slice(start, start + PAGE_SIZE)
  }, [limitRows, limitPage])

  const countryOpts = useMemo(
    () => countriesArray.map((c) => ({ value: c.id, label: `${c.code} · ${c.title}` })),
    [countriesArray]
  )
  const appOpts = useMemo(
    () => applicationsArray.map((a) => ({ value: a.id, label: a.title })),
    [applicationsArray]
  )

  const handleCountrySearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCountrySearch(e.currentTarget.value)
    setCountryPage(1)
  }, [])

  const handleAppSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAppSearch(e.currentTarget.value)
    setAppPage(1)
  }, [])

  const handleLimitCountryChange = useCallback((v: string | null) => {
    setLimitCountry(v)
    setLimitPage(1)
  }, [])

  const handleLimitAppChange = useCallback((v: string | null) => {
    setLimitApp(v)
    setLimitPage(1)
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
      <Title order={3}>Explorer</Title>
      <Tabs defaultValue="countries">
        <Tabs.List>
          <Tabs.Tab value="countries" leftSection={<IconWorld size={15} />}>
            Countries
            {countries && (
              <Badge size="xs" variant="light" ml={6}>
                {Object.keys(countries).length}
              </Badge>
            )}
          </Tabs.Tab>
          <Tabs.Tab value="services" leftSection={<IconApps size={15} />}>
            Services
            {applications && (
              <Badge size="xs" variant="light" ml={6}>
                {Object.keys(applications).length}
              </Badge>
            )}
          </Tabs.Tab>
          <Tabs.Tab value="limits" leftSection={<IconChartBar size={15} />}>
            Limits
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="countries" pt="md">
          <Stack gap="sm">
            <TextInput
              placeholder="Search country or code..."
              leftSection={<IconSearch size={15} />}
              value={countrySearch}
              onChange={handleCountrySearch}
            />
            <ScrollArea h="calc(100vh - 350px)">
              <Table striped highlightOnHover withTableBorder stickyHeader>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Code</Table.Th>
                    <Table.Th>Country</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {loadingC
                    ? Array(8)
                        .fill(0)
                        .map((_, i) => (
                          <Table.Tr key={i}>
                            {Array(3)
                              .fill(0)
                              .map((_, j) => (
                                <Table.Td key={j}>
                                  <Skeleton h={14} />
                                </Table.Td>
                              ))}
                          </Table.Tr>
                        ))
                    : paginatedCountries.map((c) => (
                        <Table.Tr key={c.id}>
                          <Table.Td>
                            <Badge variant="outline" size="sm">
                              {c.id}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" ff="monospace" fw={500}>
                              {c.code}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{c.title}</Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
            {countryTotalPages > 1 && (
              <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed">
                  Page {countryPage} of {countryTotalPages}
                </Text>
                <Pagination
                  value={countryPage}
                  onChange={setCountryPage}
                  total={countryTotalPages}
                />
              </Group>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="services" pt="md">
          <Stack gap="sm">
            <TextInput
              placeholder="Search service or code..."
              leftSection={<IconSearch size={15} />}
              value={appSearch}
              onChange={handleAppSearch}
            />
            <ScrollArea h="calc(100vh - 350px)">
              <Table striped highlightOnHover withTableBorder stickyHeader>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Code</Table.Th>
                    <Table.Th>Service</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {loadingA
                    ? Array(8)
                        .fill(0)
                        .map((_, i) => (
                          <Table.Tr key={i}>
                            {Array(3)
                              .fill(0)
                              .map((_, j) => (
                                <Table.Td key={j}>
                                  <Skeleton h={14} />
                                </Table.Td>
                              ))}
                          </Table.Tr>
                        ))
                    : paginatedApps.map((a) => (
                        <Table.Tr key={a.id}>
                          <Table.Td>
                            <Badge variant="outline" size="sm">
                              {a.id}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" ff="monospace" fw={500}>
                              {a.code}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{a.title}</Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
            {appTotalPages > 1 && (
              <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed">
                  Page {appPage} of {appTotalPages}
                </Text>
                <Pagination value={appPage} onChange={setAppPage} total={appTotalPages} />
              </Group>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="limits" pt="md">
          <Stack gap="sm">
            <Group>
              <Select
                placeholder="Filter country"
                data={countryOpts}
                value={limitCountry}
                onChange={handleLimitCountryChange}
                searchable
                clearable
                w={200}
              />
              <Select
                placeholder="Filter service"
                data={appOpts}
                value={limitApp}
                onChange={handleLimitAppChange}
                searchable
                clearable
                w={200}
              />
              {limitRows.length > 0 && (
                <Text size="sm" c="dimmed">
                  {limitRows.length} results
                </Text>
              )}
            </Group>
            <ScrollArea h="calc(100vh - 350px)">
              <Table striped highlightOnHover withTableBorder stickyHeader>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Country</Table.Th>
                    <Table.Th>Service</Table.Th>
                    <Table.Th>Available</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {loadingL
                    ? Array(8)
                        .fill(0)
                        .map((_, i) => (
                          <Table.Tr key={i}>
                            {Array(3)
                              .fill(0)
                              .map((_, j) => (
                                <Table.Td key={j}>
                                  <Skeleton h={14} />
                                </Table.Td>
                              ))}
                          </Table.Tr>
                        ))
                    : paginatedLimits.map((r, i) => (
                        <Table.Tr key={i}>
                          <Table.Td>
                            <Text size="sm">{r.countryName}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{r.appName}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={
                                (r.numbers ?? 0) > 10000
                                  ? 'green'
                                  : (r.numbers ?? 0) > 1000
                                    ? 'yellow'
                                    : 'red'
                              }
                              variant="light"
                              size="sm"
                            >
                              {(r.numbers ?? 0).toLocaleString()}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
            {limitTotalPages > 1 && (
              <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed">
                  Page {limitPage} of {limitTotalPages}
                </Text>
                <Pagination value={limitPage} onChange={setLimitPage} total={limitTotalPages} />
              </Group>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
