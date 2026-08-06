import { getAuthorizedMinistries } from "./actions"
import { AttendanceClient } from "./AttendanceClient"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const metadata = { title: "Attendance | CBT Database" }
export const revalidate = 0

export default async function AttendancePage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const authorizedMinistries = await getAuthorizedMinistries()
  const userRole = (session.user.role as "admin" | "member") || "member"

  return (
    <AttendanceClient
      authorizedMinistries={authorizedMinistries}
      userRole={userRole}
    />
  )
}
