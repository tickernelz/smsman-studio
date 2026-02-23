import { Button, Center, Stack, Text, Title } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconPlus } from "@tabler/icons-react"
import { lazy } from "react"
import AccountModal from "./components/AccountModal"
import { useAppStore } from "./store/useAppStore"

const Layout = lazy(() => import("./components/Layout"))

export default function App() {
  const accounts = useAppStore((s) => s.accounts)
  const [opened, { open, close }] = useDisclosure(false)

  if (accounts.length === 0) {
    return (
      <>
        <AccountModal opened={opened} onClose={close} />
        <Center h="100vh">
          <Stack align="center" gap="md">
            <Title order={2}>Welcome to SMSman Studio</Title>
            <Text c="dimmed" ta="center" maw={380}>
              Add your first SMS-man API account to get started.
            </Text>
            <Button leftSection={<IconPlus size={16} />} onClick={open} size="md">
              Add Account
            </Button>
          </Stack>
        </Center>
      </>
    )
  }

  return <Layout />
}
