export default function NotFoundPage() {
 return (
 <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
 <h1 className="text-3xl font-bold text-[var(--text-primary)]">Страница не найдена</h1>
 <p className="text-[var(--text-tertiary)] max-w-md">
 Похоже, вы открыли несуществующий адрес или страница была удалена. Попробуйте вернуться на главную панель.
 </p>
 <a
 className="mezon-btn mezon-btn--filled"
 href="/dashboard"
 >
 Вернуться на главную
 </a>
 </div>
 )
}
