"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getCollectionById, updateCollection, formatRelativeTime } from "@/lib/flashcard-service"
import type { FlashcardCollection } from "@/lib/supabase"
import { ChevronLeft, Save, Loader2, Clock, X, Download, FileText, ArrowUp, GripVertical } from "lucide-react"
import AddCardForm from "@/components/add-card-form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { motion, AnimatePresence } from "framer-motion"

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

  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportSeparator, setExportSeparator] = useState<"comma" | "tab" | "newline" | "custom">("comma")
  const [customExportSeparator, setCustomExportSeparator] = useState(",")
  const [isExporting, setIsExporting] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)

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

  // Handle scroll events to show/hide the scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

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

  const handleExport = () => {
    try {
      setIsExporting(true)

      if (cards.length === 0) {
        toast({
          title: "Ошибка экспорта",
          description: "В коллекции нет карточек для экспорта",
          variant: "destructive",
        })
        setIsExporting(false)
        setShowExportDialog(false)
        return
      }

      // Determine the actual separator
      let actualSeparator = customExportSeparator
      if (exportSeparator === "comma") actualSeparator = ","
      if (exportSeparator === "tab") actualSeparator = "\t"
      if (exportSeparator === "newline") actualSeparator = "\n"

      // Format the content
      const content = cards.map((card) => `${card.question}${actualSeparator}${card.answer}`).join("\n")

      // Create a blob and download link
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}_flashcards.txt`
      document.body.appendChild(link)
      link.click()

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 100)

      toast({
        title: "Экспорт успешен",
        description: `Экспортировано ${cards.length} карточек`,
      })
    } catch (error) {
      console.error("Ошибка при экспорте:", error)
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать карточки. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
      setShowExportDialog(false)
    }
  }

  // Handle drag and drop reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(cards)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setCards(items)

    toast({
      title: "Карточка перемещена",
      description: "Порядок карточек изменен. Не забудьте сохранить изменения.",
    })
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportDialog(true)}
                  className="flex items-center gap-1"
                  disabled={cards.length === 0}
                >
                  <FileText className="h-4 w-4" />
                  <span>Экспорт</span>
                </Button>
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

        <div className="md:col-span-2" ref={contentRef}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Существующие карточки</h2>
            <div className="text-sm text-muted-foreground">
              {cards.length > 1 && (
                <p className="flex items-center">
                  <GripVertical className="h-4 w-4 mr-1" />
                  Перетаскивайте карточки для изменения порядка
                </p>
              )}
            </div>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="cards">
              {(provided: any) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {cards.map((card, index) => (
                    <Draggable key={index} draggableId={`card-${index}`} index={index}>
                      {(provided: any, snapshot: any) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`transition-shadow ${snapshot.isDragging ? "shadow-lg" : ""}`}
                        >
                          <Card className="p-4 border rounded-md relative bg-white">
                            <div className="absolute top-2 right-2 flex items-center">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab p-1 rounded-full hover:bg-gray-100 mr-1"
                                title="Перетащить для изменения порядка"
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Экспорт карточек</DialogTitle>
            <DialogDescription>
              Выберите разделитель для экспорта вопросов и ответов в текстовый файл.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <RadioGroup
              value={exportSeparator}
              onValueChange={(value) => setExportSeparator(value as "comma" | "tab" | "newline" | "custom")}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="comma" id="export-comma" />
                <Label htmlFor="export-comma">Запятая (,)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tab" id="export-tab" />
                <Label htmlFor="export-tab">Табуляция</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="newline" id="export-newline" />
                <Label htmlFor="export-newline">Новая строка</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="export-custom" />
                <Label htmlFor="export-custom">Свой</Label>
                <Input
                  className="w-20 ml-2"
                  placeholder="напр. :"
                  value={customExportSeparator}
                  onChange={(e) => {
                    setCustomExportSeparator(e.target.value)
                    setExportSeparator("custom")
                  }}
                />
              </div>
            </RadioGroup>

            <div className="bg-muted/30 p-3 rounded-md text-sm">
              <p className="font-medium mb-1">Пример формата:</p>
              <code className="text-xs block bg-background p-2 rounded">
                Вопрос 1
                {exportSeparator === "comma"
                  ? ","
                  : exportSeparator === "tab"
                    ? "→"
                    : exportSeparator === "newline"
                      ? "\n"
                      : customExportSeparator}
                Ответ 1<br />
                Вопрос 2
                {exportSeparator === "comma"
                  ? ","
                  : exportSeparator === "tab"
                    ? "→"
                    : exportSeparator === "newline"
                      ? "\n"
                      : customExportSeparator}
                Ответ 2
              </code>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Экспорт...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Экспортировать
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Наверх"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <Toaster />
    </div>
  )
}

