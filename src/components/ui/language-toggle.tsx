import { Button } from "@/components/ui/button"
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

export function LanguageToggle() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en'
    localStorage.setItem('language', newLang)
    i18n.changeLanguage(newLang)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="h-9 px-3 text-sm font-medium"
    >
      <Globe className="h-4 w-4 mr-1.5" />
      <span>
        {i18n.language === 'en' ? 'Français' : 'English'}
      </span>
    </Button>
  )
}