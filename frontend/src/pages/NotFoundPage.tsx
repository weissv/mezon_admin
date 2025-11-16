export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <h1 className="text-3xl font-bold">Страница не найдена</h1>
      <p className="text-gray-600 max-w-md">
        Похоже, вы открыли несуществующий адрес или страница была удалена. Попробуйте вернуться на главную панель.
      </p>
      <a
        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
        href="/dashboard"
      >
        Вернуться на главную
      </a>
    </div>
  )
}
