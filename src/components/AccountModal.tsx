import { useState } from 'react'
import { Modal, TextInput, Button, Stack, Text, Alert, PasswordInput } from '@mantine/core'
import { IconKey, IconAlertCircle, IconUser } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { api } from '../api/smsmanClient'
import { useAppStore, Account } from '../store/useAppStore'

interface Props {
  opened: boolean
  onClose: () => void
  editAccount?: Account
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function AccountModal({ opened, onClose, editAccount }: Props) {
  const [label, setLabel] = useState(editAccount?.label ?? '')
  const [token, setToken] = useState(editAccount?.token ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { addAccount, updateAccount } = useAppStore()

  const isEdit = !!editAccount

  const handleSave = async () => {
    if (!token.trim()) return
    setLoading(true)
    setError('')
    try {
      await api.getBalance(token.trim())
      const accountLabel = label.trim() || `Account ${Date.now()}`
      if (isEdit) {
        updateAccount(editAccount.id, { label: accountLabel, token: token.trim() })
        notifications.show({ title: 'Account updated', message: accountLabel, color: 'green' })
      } else {
        addAccount({
          id: generateId(),
          label: accountLabel,
          token: token.trim(),
          createdAt: new Date().toISOString(),
        })
        notifications.show({ title: 'Account added', message: accountLabel, color: 'green' })
      }
      onClose()
      setLabel('')
      setToken('')
      setError('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid API token')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setLabel('')
    setToken('')
    setError('')
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEdit ? 'Edit Account' : 'Add Account'}
      centered
      size="sm"
    >
      <Stack>
        <Text size="sm" c="dimmed">
          {isEdit
            ? 'Update account label or API token.'
            : 'Enter your SMS-man API token to add an account.'}
        </Text>
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            {error}
          </Alert>
        )}
        <TextInput
          label="Label"
          placeholder="My Account"
          leftSection={<IconUser size={16} />}
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
        />
        <PasswordInput
          label="API Token"
          placeholder="xXXXXXXXXXXXXXXXXXXX"
          leftSection={<IconKey size={16} />}
          value={token}
          onChange={(e) => setToken(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <Button onClick={handleSave} loading={loading} disabled={!token.trim()}>
          {loading ? 'Validating...' : isEdit ? 'Save Changes' : 'Add Account'}
        </Button>
      </Stack>
    </Modal>
  )
}
