import { AuthProvider } from '@/hooks/use-auth'
import { TrendingUp } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 to-slate-900" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">FinanceAI</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Gerencie suas finanças com{' '}
            <span className="text-brand-400">inteligência artificial</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Controle receitas, despesas e metas com um assistente financeiro que entende seus
            hábitos e sugere melhorias personalizadas.
          </p>
        </div>

        <div className="relative grid grid-cols-2 gap-4">
          {[
            { label: 'Análise por IA', desc: 'Insights automáticos sobre seus gastos' },
            { label: 'Metas Financeiras', desc: 'Acompanhe seu progresso em tempo real' },
            { label: 'Alertas Inteligentes', desc: 'Notificações de gastos excessivos' },
            { label: 'Relatórios', desc: 'Exportação em PDF e CSV' },
          ].map(({ label, desc }) => (
            <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white font-medium text-sm mb-1">{label}</p>
              <p className="text-slate-400 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-slate-900 text-lg">FinanceAI</span>
          </div>
          <AuthProvider>{children}</AuthProvider>
        </div>
      </div>
    </div>
  )
}
