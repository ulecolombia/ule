import { cn } from "@/lib/utils"

interface AuthCardProps {
  children: React.ReactNode
  className?: string
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="border-b border-gray-200 py-6 bg-white">
        <div className="max-w-md mx-auto px-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#00A19A] flex items-center justify-center shadow-sm">
                <span className="text-2xl font-bold text-white">U</span>
              </div>
              <span className="text-3xl font-bold text-gray-900">Ule</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Simplifica tu vida
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10 bg-gray-50">
        <div className={cn("w-full max-w-md", className)}>
          {children}
        </div>
      </main>
    </div>
  )
}
