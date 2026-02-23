import { MantineProvider } from "@mantine/core"
import { Notifications } from "@mantine/notifications"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React, { Suspense } from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import ErrorBoundary from "./components/ErrorBoundary"
import { theme } from "./theme"
import "@mantine/core/styles.css"
import "@mantine/notifications/styles.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
})

const rootElement = document.getElementById("root")
if (!rootElement) {
  throw new Error("Root element not found")
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Notifications position="top-right" zIndex={9999} />
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={null}>
            <App />
          </Suspense>
        </QueryClientProvider>
      </MantineProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
