"use client"

import { useEffect, useState, useMemo } from "react"
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
  const [currentCardIndex, setCurrentCardIndex] = useState(0)

  const path = useMemo(() => (
    Array.isArray(params.path) ? params.path.join("/") : params.path
  ), [params.path])

  useEffect(() => {
    async function fetchCollection() {
      try {
        setLoading(true)
        const data = await getCollectionByPath(path as string)

        if (!data) {
          setError("Коллекция не найдена. Возможно, она была удалена.")
          toast({
            title: "Коллекция не найдена",
            description: "Вы будете перенаправлены на страницу коллекций...",
            variant: "destructive",
          })
          setTimeout(() => router.push("/collections"), 3000)
          return
        }

        setCollection(data)
      } catch (err) {
        console.error("Ошибка при загрузке:", err)
        setError("Ошибка загрузки. Пожалуйста, попробуйте снова.")
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить коллекцию.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCollection()
  }, [path, router])

  const handleCardIndexChange = (index: number) => {
    setCurrentCardIndex(index)
  }

  const handleModeChange = (newMode: "single" | "all") => {
    setMode(newMode)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Загрузка коллекции...</p>
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto p-6">
          <CardContent className="flex flex-col items-center text-center gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-sm text-muted-foreground">{error || "Коллекция не найдена."}</p>
            <Link href="/collections">
              <Button>К коллекциям</Button>
            </Link>
          </CardContent>
        </Card>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/collections">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-1">
          <Button
            variant={mode === "single" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleModeChange("single")}
          >
            Одна карточка
          </Button>
          <Button
            variant={mode === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleModeChange("all")}
          >
            Все карточки
          </Button>
        </div>
      </div>

      {mode === "single" && (
        <SingleCardView
          cards={collection.content}
          initialIndex={currentCardIndex}
          onIndexChange={handleCardIndexChange}
        />
      )}

      {mode === "all" && (
        <AllCardsView
          cards={collection.content}
          onCardSelect={(index) => {
            handleCardIndexChange(index)
            handleModeChange("single")
          }}
        />
      )}

      <Toaster />
    </div>
  )
}
