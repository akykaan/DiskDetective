const themes = ['dark', 'light'] as const

export type Theme = (typeof themes)[number]

export function setTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function getTheme(): Theme {
  const current = document.documentElement.getAttribute('data-theme')
  return (current as Theme) || 'dark'
}
