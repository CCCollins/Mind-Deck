"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getCollectionById, updateCollection, formatRelativeTime } from "@/lib/flashcard-service"
import type { FlashcardCollection } from "@/lib/supabase"
import { ChevronLeft, Save, Loader2, Clock, X } from "lucide-react"
import AddCardForm from "@/components/add-card-form"

export default function EditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [collection, setCollection] = useState<FlashcardCollection | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [cards, setCards] = useState<{ question: string; answer: string }[]>([])
  const [lastEdited, setLastEdited] = useState<string | null>(null)

  const fetchCollection = async () => {
    try {
      setLoading(true)
      const data = await getCollectionById(id)

      if (!data) {
        setError("Коллекция не найдена")
        return
      }

      setCollection(data)
      setTitle(data.collection_name)
      setCards(data.content)
      setLastEdited(data.edited_at)
    } catch (error) {
      console.error("Ошибка при загрузке коллекции:", error)
      setError("Не удалось загрузить коллекцию. Пожалуйста, попробуйте снова.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollection()
  }, [id])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  const handleCardChange = (index: number, field: "question" | "answer", value: string) => {
    const updatedCards = [...cards]
    updatedCards[index][field] = value
    setCards(updatedCards)
  }

  const handleRemoveCard = (index: number) => {
    if (cards.length <= 1) {
      toast({
        title: "Ошибка",
        description: "В коллекции должна быть хотя бы одна карточка",
        variant: "destructive",
      })
      return
    }

    const updatedCards = [...cards]
    updatedCards.splice(index, 1)
    setCards(updatedCards)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Ошибка",
        description: "Название коллекции не может быть пустым",
        variant: "destructive",
      })
      return
    }

    // Проверяем карточки
    const validCards = cards.filter((card) => card.question.trim() && card.answer.trim())

    if (validCards.length === 0) {
      toast({
        title: "Ошибка",
        description: "У вас должна быть хотя бы одна действительная карточка с вопросом и ответом",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      const updatedCollection = await updateCollection(id, {
        collection_name: title,
        content: validCards,
      })

      if (updatedCollection) {
        setLastEdited(updatedCollection.edited_at)
        setCollection(updatedCollection)
      }

      toast({
        title: "Успех",
        description: "Коллекция успешно обновлена",
      })

      // Обновляем локальное состояние только действительными карточками
      setCards(validCards)
    } catch (error) {
      console.error("Ошибка при обновлении коллекции:", error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить коллекцию",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCardAdded = () => {
    // Обновляем данные коллекции
    fetchCollection()
  }

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
        <Card className="max-w-md mx-auto text-center bg-white">
          <CardContent className="pt-6 pb-4">
            <p className="mb-4">{error || "Коллекция не найдена"}</p>
            <Link href="/collections">
              <Button>Назад к коллекциям</Button>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="bg-white sticky top-4">
            <CardHeader>
              <div className="flex justify-between items-start">
                {lastEdited && (
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Изменено {formatRelativeTime(lastEdited)}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Название коллекции</Label>
                <Input id="title" value={title} onChange={handleTitleChange} disabled={saving} />
              </div>

              <AddCardForm collectionId={id} onCardAdded={handleCardAdded} />

              <div className="flex justify-end">
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Сохранить изменения
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-xl font-bold mb-4">Существующие карточки</h2>

          <div className="space-y-4">
            {cards.map((card, index) => (
              <Card key={index} className="p-4 border rounded-md relative bg-white">
                <div className="absolute top-2 right-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCard(index)}
                    disabled={cards.length <= 1 || saving}
                    className="h-6 w-6 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`question-${index}`} className="mb-2 block">
                      Вопрос {index + 1}
                    </Label>
                    <Textarea
                      id={`question-${index}`}
                      value={card.question}
                      onChange={(e) => handleCardChange(index, "question", e.target.value)}
                      placeholder="Введите вопрос"
                      disabled={saving}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`answer-${index}`} className="mb-2 block">
                      Ответ
                    </Label>
                    <Textarea
                      id={`answer-${index}`}
                      value={card.answer}
                      onChange={(e) => handleCardChange(index, "answer", e.target.value)}
                      placeholder="Введите ответ"
                      disabled={saving}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  )
}

