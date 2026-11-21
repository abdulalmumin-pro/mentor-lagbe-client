import { SidebarProvider } from "@/components/ui/sidebar"
import { DashboardSidebar } from "../components/DashboardSidebar"
import { DashboardHeader } from "../components/DashboardHeader"

const DashboardLayoutPage = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      {/* flex-1 + min-w-0 makes the content fill all space beside the sidebar */}
      <main className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </main>
    </SidebarProvider>
  )
}

export default DashboardLayoutPage
