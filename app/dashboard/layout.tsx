
import { SidebarProvider } from "@/components/ui/sidebar"
import { DashboardSidebar } from "../components/DashboardSidebar"
import { DashboardHeader } from "../components/DashboardHeader"

const DashboardLayoutPage = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full overflow-hidden">
        <DashboardSidebar />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <DashboardHeader />

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

export default DashboardLayoutPage
