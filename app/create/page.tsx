"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { createCollection } from "@/lib/flashcard-service"
import { Loader2, Plus, HelpCircle, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function CreatePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [separator, setSeparator] = useState("comma")
  const [customSeparator, setCustomSeparator] = useState(",")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cards, setCards] = useState<{ question: string; answer: string }[]>([{ question: "", answer: "" }])
  const [inputMethod, setInputMethod] = useState<"text" | "cards">("text")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите название для вашей коллекции",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      let flashcards: { question: string; answer: string }[] = []

      if (inputMethod === "text") {
        // Определяем фактический разделитель
        let actualSeparator = customSeparator
        if (separator === "comma") actualSeparator = ","
        if (separator === "tab") actualSeparator = "\t"
        if (separator === "newline") actualSeparator = "\n"

        // Разбираем содержимое на флеш-карточки
        const lines = content.split("\n").filter((line) => line.trim() !== "")
        flashcards = lines.map((line) => {
          const parts = line.split(actualSeparator)

          // Убедимся, что у нас есть как минимум две части (вопрос и ответ)
          if (parts.length < 2) {
            throw new Error(`Строка не содержит разделитель "${actualSeparator}": ${line}`)
          }

          // Первая часть - вопрос, все остальное - ответ
          const question = parts[0].trim()
          const answer = parts.slice(1).join(actualSeparator).trim()

          if (!question || !answer) {
            throw new Error(`Неверный формат карточки в строке: ${line}`)
          }

          return { question, answer }
        })
      } else {
        // Используем карточки из метода ввода карточек
        flashcards = cards.filter((card) => card.question.trim() && card.answer.trim())
      }

      if (flashcards.length === 0) {
        toast({
          title: "Ошибка",
          description: "Не удалось создать ни одной действительной флеш-карточки. Пожалуйста, проверьте ваш ввод.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Сохраняем коллекцию в Supabase
      await createCollection(title, flashcards)

      toast({
        title: "Успех",
        description: `Создана коллекция "${title}" с ${flashcards.length} флеш-карточками`,
      })

      // Перенаправляем на страницу коллекций
      setTimeout(() => {
        router.push("/collections")
      }, 1500)
    } catch (error) {
      toast({
        title: "Ошибка",
        description:
          error instanceof Error ? error.message : "Не удалось создать флеш-карточки. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addCard = () => {
    setCards([...cards, { question: "", answer: "" }])
  }

  const removeCard = (index: number) => {
    if (cards.length <= 1) return
    const newCards = [...cards]
    newCards.splice(index, 1)
    setCards(newCards)
  }

  const updateCard = (index: number, field: "question" | "answer", value: string) => {
    const newCards = [...cards]
    newCards[index][field] = value
    setCards(newCards)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Создание коллекции флеш-карточек</h1>

      <Card className="max-w-3xl mx-auto bg-white">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Новая коллекция</CardTitle>
            <CardDescription>Создайте новую коллекцию флеш-карточек, введя содержимое ниже</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Название коллекции</Label>
              <Input
                id="title"
                placeholder="Введите название для вашей коллекции"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <Tabs
              defaultValue="text"
              value={inputMethod}
              onValueChange={(value) => setInputMethod(value as "text" | "cards")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">Текстовый ввод</TabsTrigger>
                <TabsTrigger value="cards">Карточка за карточкой</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content">Содержимое флеш-карточек</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Каждая строка станет флеш-карточкой. Разделяйте вопросы и ответы выбранным разделителем.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="content"
                    placeholder="Введите содержимое с вопросами и ответами, разделенными выбранным разделителем"
                    className="min-h-[200px]"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-muted-foreground">Пример: Какая столица Франции?,Париж</p>
                </div>

                <div className="space-y-3">
                  <Label>Разделитель вопроса/ответа</Label>
                  <RadioGroup
                    value={separator}
                    onValueChange={setSeparator}
                    className="flex flex-col space-y-2"
                    disabled={isSubmitting}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="comma" id="comma" />
                      <Label htmlFor="comma">Запятая (,)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tab" id="tab" />
                      <Label htmlFor="tab">Табуляция</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="newline" id="newline" />
                      <Label htmlFor="newline">Новая строка</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom">Свой</Label>
                      <Input
                        className="w-20 ml-2"
                        placeholder="напр. :"
                        value={customSeparator}
                        onChange={(e) => {
                          setCustomSeparator(e.target.value)
                          setSeparator("custom")
                        }}
                        disabled={isSubmitting}
                      />
                    </div>
                  </RadioGroup>
                </div>
              </TabsContent>

              <TabsContent value="cards" className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <Label>Флеш-карточки</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCard} disabled={isSubmitting}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить карточку
                  </Button>
                </div>

                <div className="space-y-4">
                  {cards.map((card, index) => (
                    <div key={index} className="p-4 border rounded-md space-y-4 relative bg-white">
                      <div className="absolute top-2 right-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCard(index)}
                          disabled={cards.length <= 1 || isSubmitting}
                          className="h-6 w-6 rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="pt-2">
                        <Label htmlFor={`question-${index}`} className="mb-2 block">
                          Вопрос {index + 1}
                        </Label>
                        <Textarea
                          id={`question-${index}`}
                          value={card.question}
                          onChange={(e) => updateCard(index, "question", e.target.value)}
                          placeholder="Введите вопрос"
                          disabled={isSubmitting}
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
                          onChange={(e) => updateCard(index, "answer", e.target.value)}
                          placeholder="Введите ответ"
                          disabled={isSubmitting}
                          className="min-h-[80px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/")} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                "Создать коллекцию"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <Toaster />
    </div>
  )
}

