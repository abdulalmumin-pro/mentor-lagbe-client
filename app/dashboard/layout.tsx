import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "../components/DashboardSidebar"

const DashboardLayoutPage = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      {/* flex-1 + min-w-0 makes the content fill all space beside the sidebar */}
      <main className="flex min-w-0 flex-1 flex-col">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}

export default DashboardLayoutPage