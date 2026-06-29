import { AuthProvider } from '@/hooks/use-auth'
import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 ml-60 transition-all duration-300 min-h-screen flex flex-col">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
