import { useEffect, useState } from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

// const ThemeProviderContext = createContext({ theme: "light", setTheme: (theme: string) => {} })

export function ThemeProvider({ 
  children,
  ...props
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // To avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  )
} 