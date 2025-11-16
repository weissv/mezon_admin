import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'uz', name: 'O\'zbekcha', flag: '🇺🇿' },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
        aria-label="Select language"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLanguage.flag} {currentLanguage.name}</span>
        <span className="sm:hidden">{currentLanguage.flag}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={clsx(
                'w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2',
                lang.code === i18n.language && 'bg-gray-50 font-semibold'
              )}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
