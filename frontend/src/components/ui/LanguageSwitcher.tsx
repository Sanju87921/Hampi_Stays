import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

const languages = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'kn', label: 'ಕನ್ನಡ', short: 'KN' },
  { code: 'hi', label: 'हिन्दी', short: 'HI' }
];

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative z-50", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-sand-100/50 transition-colors border border-transparent hover:border-sand-200"
      >
        <Globe className="w-4 h-4 text-navy-950/70" />
        <span className="text-sm font-bold text-navy-950 tracking-wider">
          {currentLanguage.short}
        </span>
        <ChevronDown className="w-3 h-3 text-navy-950/50" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-sand-200 rounded-2xl shadow-luxury overflow-hidden flex flex-col py-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={cn(
                "px-4 py-2 text-sm text-left hover:bg-sand-50 transition-colors font-medium",
                i18n.language === lang.code ? "text-gold-700 bg-sand-50/50" : "text-navy-950/70"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
