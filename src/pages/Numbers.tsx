import {
  Button,
  Card,
  Group,
  NumberInput,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Title,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconPlus } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { api } from "../api/smsmanClient"
import NumberCard from "../components/NumberCard"
import { useActiveAccount, useActiveAccountToken, useAppStore } from "../store/useAppStore"

export default function Numbers() {
  const activeAccount = useActiveAccount()
  const token = useActiveAccountToken()
  const { activeRequests, addRequest } = useAppStore()
  const [countryId, setCountryId] = useState<string | null>(null)
  const [appId, setAppId] = useState<string | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | string>('')
  const [currency, setCurrency] = useState('USD')
  const [hasMultiple, setHasMultiple] = useState(false)
  const [loading, setLoading] = useState(false)

  const { data: countries } = useQuery({
    queryKey: ["countries", token],
    queryFn: () => {
      if (!token) throw new Error("Token not available")
      return api.getCountries(token)
    },
    enabled: !!token,
  })

  const { data: applications } = useQuery({
    queryKey: ["applications", token],
    queryFn: () => {
      if (!token) throw new Error("Token not available")
      return api.getApplications(token)
    },
    enabled: !!token,
  })

  const countryOptions = useMemo(
    () =>
      countries
        ? Object.values(countries).map((c) => ({
            value: c.id,
            label: `${c.code} · ${c.title}`,
          }))
        : [],
    [countries]
  )

  const appOptions = useMemo(
    () =>
      applications
        ? Object.values(applications).map((a) => ({
            value: a.id,
            label: a.title,
          }))
        : [],
    [applications]
  )

  const myRequests = useMemo(
    () => activeRequests.filter((r) => r.accountId === activeAccount?.id),
    [activeRequests, activeAccount?.id]
  )

  const handleGetNumber = async () => {
    if (!activeAccount || !token) return
    setLoading(true)
    try {
      const res = await api.getNumber(token, {
        countryId: countryId ? Number(countryId) : undefined,
        applicationId: appId ? Number(appId) : undefined,
        maxPrice: maxPrice !== '' ? Number(maxPrice) : undefined,
        currency,
        hasMultipleSms: hasMultiple,
      })

      if (res.error_code) {
        notifications.show({
          title: 'Failed',
          message: res.error_msg ?? res.error_code,
          color: 'red',
        })
        return
      }

      const countryName = countries?.[res.country_id]?.title ?? String(res.country_id)
      const serviceName = applications?.[res.application_id]?.title ?? String(res.application_id)

      addRequest({
        requestId: res.request_id,
        number: res.number,
        countryId: res.country_id,
        applicationId: res.application_id,
        countryName,
        serviceName,
        smsCode: null,
        status: 'pending',
        createdAt: new Date().toISOString(),
        accountId: activeAccount.id,
      })

      notifications.show({
        title: 'Number acquired',
        message: `${res.number} (${countryName} · ${serviceName})`,
        color: 'blue',
      })
    } catch (e: unknown) {
      notifications.show({
        title: 'Error',
        message: e instanceof Error ? e.message : 'Unknown error',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!activeAccount) {
    return (
      <Stack align="center" pt="xl">
        <Text c="dimmed">No active account selected.</Text>
      </Stack>
    )
  }

  return (
    <Stack>
      <Title order={3}>Numbers</Title>

      <Card withBorder>
        <Text fw={500} mb="sm">
          Request a Number
        </Text>
        <Stack gap="sm">
          <Group grow>
            <Select
              label="Country"
              placeholder="Any country"
              data={countryOptions}
              value={countryId}
              onChange={setCountryId}
              searchable
              clearable
              limit={50}
            />
            <Select
              label="Service"
              placeholder="Any service"
              data={appOptions}
              value={appId}
              onChange={setAppId}
              searchable
              clearable
              limit={50}
            />
          </Group>
          <Group align="flex-end">
            <NumberInput
              label="Max Price"
              placeholder="No limit"
              value={maxPrice}
              onChange={setMaxPrice}
              min={0}
              style={{ flex: 1 }}
            />
            <Stack gap={4} style={{ flex: 1 }}>
              <Text size="sm" fw={500}>
                Currency
              </Text>
              <SegmentedControl
                data={['USD', 'EUR', 'RUB']}
                value={currency}
                onChange={setCurrency}
                fullWidth
              />
            </Stack>
            <Stack gap={8} pb={2}>
              <Text size="sm" fw={500}>
                Multiple SMS
              </Text>
              <Switch
                checked={hasMultiple}
                onChange={(e) => setHasMultiple(e.currentTarget.checked)}
                label={hasMultiple ? 'Yes' : 'No'}
              />
            </Stack>
          </Group>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleGetNumber}
            loading={loading}
            w="fit-content"
          >
            Get Number
          </Button>
        </Stack>
      </Card>

      {myRequests.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No active numbers. Request one above.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {myRequests.map((r) => (
            <NumberCard key={r.requestId} request={r} />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  )
}
