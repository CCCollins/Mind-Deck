"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getCollectionByPath } from "@/lib/flashcard-service"
import type { FlashcardCollection } from "@/lib/supabase"
import SingleCardView from "@/components/card-views/single-card-view"
import AllCardsView from "@/components/card-views/all-cards-view"
import { ChevronLeft, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function StudyPage() {
  const router = useRouter()
  const params = useParams()
  const [collection, setCollection] = useState<FlashcardCollection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"single" | "all">("single")

  // Получаем путь из URL
  const path = Array.isArray(params.path) ? params.path.join("/") : params.path

  useEffect(() => {
    async function fetchCollection() {
      try {
        setLoading(true)
        const data = await getCollectionByPath(path as string)

        if (!data) {
          setError("Коллекция не найдена. Возможно, она была удалена.")
          toast({
            title: "Коллекция не найдена",
            description: "Эта коллекция, возможно, была удалена. Перенаправление на страницу коллекций...",
            variant: "destructive",
          })

          setTimeout(() => {
            router.push("/collections")
          }, 3000)
          return
        }

        setCollection(data)
      } catch (error) {
        console.error("Ошибка при загрузке коллекции:", error)
        setError("Не удалось загрузить коллекцию. Пожалуйста, попробуйте снова.")
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить коллекцию. Пожалуйста, попробуйте снова.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCollection()
  }, [path, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Загрузка коллекции...</p>
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto text-center p-6 bg-white">
          <CardContent className="pt-6 pb-4 flex flex-col items-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="mb-4">{error || "Коллекция не найдена. Перенаправление на страницу коллекций..."}</p>
            <Link href="/collections">
              <Button>Перейти к коллекциям</Button>
            </Link>
          </CardContent>
        </Card>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/collections">
          <Button variant="ghost" className="pl-0">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Назад к коллекциям
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{collection.collection_name}</h1>
          <p className="text-muted-foreground">{collection.content.length} карточек</p>
        </div>

        <div className="flex space-x-2 bg-secondary p-1 rounded-lg">
          <Button
            variant={mode === "single" ? "default" : "ghost"}
            size="sm"
            className={mode === "single" ? "" : "hover:bg-background/50"}
            onClick={() => setMode("single")}
          >
            Одна карточка
          </Button>
          <Button
            variant={mode === "all" ? "default" : "ghost"}
            size="sm"
            className={mode === "all" ? "" : "hover:bg-background/50"}
            onClick={() => setMode("all")}
          >
            Все карточки
          </Button>
        </div>
      </div>

      {mode === "single" && <SingleCardView cards={collection.content} />}
      {mode === "all" && <AllCardsView cards={collection.content} />}

      <Toaster />
    </div>
  )
}

