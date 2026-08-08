import { DashboardLayout } from "@/components/layouts/DashboardLayout"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}

