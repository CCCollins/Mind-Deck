"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { addCardToCollection } from "@/lib/flashcard-service"
import { Loader2 } from "lucide-react"

interface AddCardFormProps {
  collectionId: string
  onCardAdded: () => void
}

export default function AddCardForm({ collectionId, onCardAdded }: AddCardFormProps) {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!question.trim()) {
      toast({
        title: "Ошибка",
        description: "Вопрос не может быть пустым",
        variant: "destructive",
      })
      return
    }

    if (!answer.trim()) {
      toast({
        title: "Ошибка",
        description: "Ответ не может быть пустым",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      await addCardToCollection(collectionId, {
        question: question.trim(),
        answer: answer.trim(),
      })

      toast({
        title: "Успех",
        description: "Карточка добавлена в коллекцию",
      })

      // Сбрасываем форму
      setQuestion("")
      setAnswer("")

      // Уведомляем родительский компонент
      onCardAdded()
    } catch (error) {
      console.error("Ошибка при добавлении карточки:", error)
      toast({
        title: "Ошибка",
        description:
          error instanceof Error ? error.message : "Не удалось добавить карточку. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="mb-6 bg-white">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Добавить</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Вопрос</Label>
            <Textarea
              id="question"
              placeholder="Введите вопрос"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isSubmitting}
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="answer">Ответ</Label>
            <Textarea
              id="answer"
              placeholder="Введите ответ"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={isSubmitting}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Добавление...
              </>
            ) : (
              "Добавить карточку"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

