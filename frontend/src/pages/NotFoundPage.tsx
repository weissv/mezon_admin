import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <h1 className="text-3xl font-bold">{t('errors.pageNotFound')}</h1>
      <p className="text-gray-600 max-w-md">
        {t('errors.pageNotFoundDesc')}
      </p>
      <a
        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
        href="/dashboard"
      >
        {t('errors.goHome')}
      </a>
    </div>
  )
}
