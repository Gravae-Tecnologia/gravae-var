import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <>
      <header className="p-4 flex items-center bg-gray-900 border-b border-b-red-500/40 text-white shadow-lg">
        <h1 className="ml-4 text-xl font-semibold">
          <Link to="/">
            <img src="/min-logo.svg" alt="Gravae Logo" className="h-8" />
          </Link>
        </h1>
      </header>
    </>
  )
}
