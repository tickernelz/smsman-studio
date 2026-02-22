import { useState } from 'react'
import {
  AppShell,
  Group,
  Text,
  ActionIcon,
  NavLink,
  Stack,
  Badge,
  Menu,
  Avatar,
  Divider,
  ScrollArea,
  Button,
  useComputedColorScheme,
  useMantineColorScheme,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconSun,
  IconMoon,
  IconDashboard,
  IconDeviceMobile,
  IconCurrencyDollar,
  IconWorld,
  IconHistory,
  IconPlus,
  IconChevronDown,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react'
import { useAppStore, useActiveAccount } from '../store/useAppStore'
import AccountModal from './AccountModal'
import Dashboard from '../pages/Dashboard'
import Numbers from '../pages/Numbers'
import Prices from '../pages/Prices'
import Explorer from '../pages/Explorer'
import History from '../pages/History'

const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: IconDashboard },
  { id: 'numbers', label: 'Numbers', icon: IconDeviceMobile },
  { id: 'prices', label: 'Prices', icon: IconCurrencyDollar },
  { id: 'explorer', label: 'Explorer', icon: IconWorld },
  { id: 'history', label: 'History', icon: IconHistory },
]

export default function Layout() {
  const [page, setPage] = useState('dashboard')
  const [addModalOpen, { open: openAdd, close: closeAdd }] = useDisclosure(false)
  const [editingAccount, setEditingAccount] = useState<string | null>(null)
  const { setColorScheme } = useMantineColorScheme()
  const scheme = useComputedColorScheme('dark')

  const accounts = useAppStore((s) => s.accounts)
  const activeAccountId = useAppStore((s) => s.activeAccountId)
  const { setActiveAccount, removeAccount } = useAppStore()
  const activeAccount = useActiveAccount()
  const activeRequests = useAppStore((s) => s.activeRequests)

  const editAccount = editingAccount ? accounts.find((a) => a.id === editingAccount) : undefined

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard />
      case 'numbers':
        return <Numbers />
      case 'prices':
        return <Prices />
      case 'explorer':
        return <Explorer />
      case 'history':
        return <History />
      default:
        return <Dashboard />
    }
  }

  const myActiveRequests = activeRequests.filter((r) => r.accountId === activeAccountId)

  return (
    <>
      <AccountModal opened={addModalOpen} onClose={closeAdd} />
      <AccountModal
        opened={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        editAccount={editAccount}
      />

      <AppShell header={{ height: 52 }} navbar={{ width: 220, breakpoint: 'sm' }} padding="md">
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Text fw={800} size="md" style={{ letterSpacing: -0.5 }}>
              SMSman Studio
            </Text>
            <Group gap="xs">
              <Menu shadow="md" width={240} position="bottom-end">
                <Menu.Target>
                  <Button
                    variant="subtle"
                    size="xs"
                    rightSection={<IconChevronDown size={12} />}
                    leftSection={
                      <Avatar size={18} color="blue" radius="xl">
                        {activeAccount?.label?.[0]?.toUpperCase() ?? '?'}
                      </Avatar>
                    }
                  >
                    <Text size="xs" maw={100} truncate>
                      {activeAccount?.label ?? 'No account'}
                    </Text>
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Accounts</Menu.Label>
                  <ScrollArea.Autosize mah={200}>
                    {accounts.map((acc) => (
                      <Menu.Item
                        key={acc.id}
                        onClick={() => setActiveAccount(acc.id)}
                        rightSection={
                          acc.id === activeAccountId ? (
                            <Badge size="xs" color="blue">
                              active
                            </Badge>
                          ) : null
                        }
                        leftSection={
                          <Avatar size={20} color="blue" radius="xl">
                            {acc.label[0]?.toUpperCase()}
                          </Avatar>
                        }
                      >
                        <Text size="sm" truncate maw={130}>
                          {acc.label}
                        </Text>
                      </Menu.Item>
                    ))}
                  </ScrollArea.Autosize>
                  <Divider my={4} />
                  {activeAccount && (
                    <>
                      <Menu.Item
                        leftSection={<IconEdit size={14} />}
                        onClick={() => setEditingAccount(activeAccount.id)}
                      >
                        Edit Account
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconTrash size={14} />}
                        color="red"
                        onClick={() => removeAccount(activeAccount.id)}
                        disabled={accounts.length <= 1}
                      >
                        Remove Account
                      </Menu.Item>
                      <Divider my={4} />
                    </>
                  )}
                  <Menu.Item leftSection={<IconPlus size={14} />} onClick={openAdd}>
                    Add Account
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>

              <Tooltip label={scheme === 'dark' ? 'Light mode' : 'Dark mode'}>
                <ActionIcon
                  variant="subtle"
                  onClick={() => setColorScheme(scheme === 'dark' ? 'light' : 'dark')}
                  size="sm"
                >
                  {scheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="xs">
          <Stack gap={2} h="100%">
            {PAGES.map((p) => (
              <NavLink
                key={p.id}
                label={
                  p.id === 'numbers' && myActiveRequests.length > 0 ? (
                    <Group justify="space-between" wrap="nowrap">
                      <span>{p.label}</span>
                      <Badge size="xs" circle color="blue">
                        {myActiveRequests.length}
                      </Badge>
                    </Group>
                  ) : (
                    p.label
                  )
                }
                leftSection={<p.icon size={17} />}
                active={page === p.id}
                onClick={() => setPage(p.id)}
                variant="filled"
                style={{ borderRadius: 8 }}
              />
            ))}

            <Divider my="xs" />

            <NavLink
              label="Add Account"
              leftSection={<IconPlus size={17} />}
              onClick={openAdd}
              style={{ borderRadius: 8 }}
            />

            <Stack gap={4} mt="auto" pt="xs">
              <Text size="xs" c="dimmed" px={8}>
                Accounts
              </Text>
              <ScrollArea.Autosize mah={180}>
                {accounts.map((acc) => (
                  <NavLink
                    key={acc.id}
                    label={acc.label}
                    leftSection={
                      <Avatar size={18} color="blue" radius="xl">
                        {acc.label[0]?.toUpperCase()}
                      </Avatar>
                    }
                    active={acc.id === activeAccountId}
                    onClick={() => setActiveAccount(acc.id)}
                    variant="filled"
                    style={{ borderRadius: 8, fontSize: 12 }}
                    rightSection={
                      acc.id === activeAccountId ? (
                        <Badge size="xs" color="green" variant="dot" />
                      ) : null
                    }
                  />
                ))}
              </ScrollArea.Autosize>
            </Stack>
          </Stack>
        </AppShell.Navbar>

        <AppShell.Main>{renderPage()}</AppShell.Main>
      </AppShell>
    </>
  )
}
