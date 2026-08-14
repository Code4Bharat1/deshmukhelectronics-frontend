'use client';
import { useEffect } from 'react';
import useLanguageStore from '@/lib/languageStore';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LanguageSwitch({ className }) {
  const { language, setLanguage, initializeLanguage } = useLanguageStore();

  useEffect(() => {
    initializeLanguage();
  }, []);

  const languages = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'mr', label: 'मराठी', short: 'MR' },
    { code: 'hi', label: 'हिंदी', short: 'HI' },
  ];

  return (
    <div className={cn('inline-flex items-center bg-gray-100/80 p-1 rounded-xl gap-1 text-xs', className)}>
      {languages.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLanguage(l.code)}
          className={cn(
            'px-2.5 py-1 rounded-lg font-bold min-h-0 text-xs transition-all duration-150',
            language === l.code
              ? 'bg-brand-700 text-white shadow-sm'
              : 'text-gray-600 hover:text-brand-700 hover:bg-white/60'
          )}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
