import { Badge } from "@mantine/core"
import type { RequestStatus } from "../store/useAppStore"

const colorMap: Record<RequestStatus, string> = {
  pending: "yellow",
  ready: "blue",
  received: "green",
  close: "gray",
  reject: "red",
  used: "teal",
  error: "orange",
}

export default function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <Badge color={colorMap[status] ?? "gray"} size="sm" variant="light">
      {status}
    </Badge>
  )
}
