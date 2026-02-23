import { Component, type ReactNode } from "react"
import { Stack, Title, Text, Button } from "@mantine/core"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Stack align="center" pt="xl">
          <Title order={3}>Something went wrong</Title>
          <Text c="dimmed">{this.state.error?.message}</Text>
          <Button onClick={() => window.location.reload()}>Reload App</Button>
        </Stack>
      )
    }

    return this.props.children
  }
}