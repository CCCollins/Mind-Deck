import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Mind Deck",
  description: "Создавайте и изучайте флеш-карточки с различными режимами обучения. Улучшайте свою память легко и быстро!",
}

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4">

      {/* Заголовок */}
      <h1 className="text-5xl font-extrabold text-center text-gray-900">
        Mind Deck
      </h1>

      {/* Карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mt-10">
        <Card className="flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Создать коллекцию</CardTitle>
            <CardDescription>Создайте свою уникальную коллекцию флеш-карточек</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p>Загрузите текст или вводите вручную, настройте карточки и начните обучение.</p>
          </CardContent>
          <CardFooter>
            <Link href="/create" className="w-full">
              <Button className="w-full">Создать</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Мои коллекции</CardTitle>
            <CardDescription>Управляйте и просматривайте свои карточки</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p>Открывайте, редактируйте и тренируйтесь с уже созданными коллекциями.</p>
          </CardContent>
          <CardFooter>
            <Link href="/collections" className="w-full">
              <Button className="w-full" variant="outline">
                Просмотр
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
