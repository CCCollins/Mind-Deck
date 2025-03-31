import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-primary">
          Mind Deck
        </Link>
        <nav className="flex items-center space-x-4">
          <Link href="/create">
            <Button variant="ghost">Создать</Button>
          </Link>
          <Link href="/collections">
            <Button variant="ghost">Коллекции</Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}

