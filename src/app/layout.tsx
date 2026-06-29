import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'FinanceAI — Gestão Financeira Inteligente',
    template: '%s | FinanceAI',
  },
  description:
    'Controle suas finanças com inteligência artificial. Dashboard, análise de gastos e assistente financeiro personalizado.',
  keywords: ['finanças pessoais', 'controle financeiro', 'assistente IA', 'orçamento', 'metas financeiras'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              borderRadius: '10px',
              fontSize: '14px',
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
