"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { createCollection } from "@/lib/flashcard-service"
import {
  Loader2,
  Plus,
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Save,
  ArrowLeft,
  Check,
  AlertCircle,
  Info,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { useMediaQuery } from "@/hooks/use-media-query"
import PreviewCardView from "@/components/card-views/preview-card-view"

// Types for our form state
type FormStep = "title" | "content" | "preview"
type InputMethod = "text" | "cards"
type Separator = "comma" | "tab" | "newline" | "custom"
type FlashcardData = { question: string; answer: string }

export default function CreatePage() {
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Form state
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [separator, setSeparator] = useState<Separator>("comma")
  const [customSeparator, setCustomSeparator] = useState(",")
  const [cards, setCards] = useState<FlashcardData[]>([{ question: "", answer: "" }])
  const [inputMethod, setInputMethod] = useState<InputMethod>("text")
  const [currentStep, setCurrentStep] = useState<FormStep>("title")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewCards, setPreviewCards] = useState<FlashcardData[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    title?: string
    content?: string
    cards?: string[]
  }>({})

  // Current card being edited (for real-time preview)
  const [currentPreviewCard, setCurrentPreviewCard] = useState<FlashcardData>({ question: "", answer: "" })
  const [showPreview, setShowPreview] = useState(false)

  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null)
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus the title input when the component mounts
  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [])

  // Update the current preview card based on the input method and current state
  useEffect(() => {
    if (inputMethod === "text") {
      try {
        const parsedCards = parseContentToCards()
        if (parsedCards.length > 0) {
          setCurrentPreviewCard(parsedCards[0])
          setShowPreview(true)
        } else {
          setShowPreview(false)
        }
      } catch (error) {
        setShowPreview(false)
      }
    } else {
      // Card-by-card input
      const currentCard = cards[0]
      if (currentCard && (currentCard.question.trim() || currentCard.answer.trim())) {
        setCurrentPreviewCard(currentCard)
        setShowPreview(true)
      } else {
        setShowPreview(false)
      }
    }
  }, [content, separator, customSeparator, cards, inputMethod])

  // Calculate progress percentage based on current step
  const getProgressPercentage = () => {
    switch (currentStep) {
      case "title":
        return 33
      case "content":
        return 66
      case "preview":
        return 100
      default:
        return 0
    }
  }

  // Validate the current step
  const validateCurrentStep = (): boolean => {
    const errors: {
      title?: string
      content?: string
      cards?: string[]
    } = {}

    if (currentStep === "title") {
      if (!title.trim()) {
        errors.title = "Пожалуйста, введите название для вашей коллекции"
        setValidationErrors(errors)
        return false
      }
    } else if (currentStep === "content") {
      if (inputMethod === "text") {
        if (!content.trim()) {
          errors.content = "Пожалуйста, введите содержимое для ваших карточек"
          setValidationErrors(errors)
          return false
        }

        // Check if content can be parsed into valid flashcards
        try {
          const parsedCards = parseContentToCards()
          if (parsedCards.length === 0) {
            errors.content = "Не удалось создать ни одной действительной флеш-карточки"
            setValidationErrors(errors)
            return false
          }
        } catch (error) {
          errors.content = error instanceof Error ? error.message : "Ошибка в формате содержимого"
          setValidationErrors(errors)
          return false
        }
      } else {
        // Validate card-by-card input
        const cardErrors: string[] = []
        let hasValidCards = false

        cards.forEach((card, index) => {
          if (!card.question.trim() && !card.answer.trim()) {
            // Skip completely empty cards
            cardErrors[index] = ""
          } else if (!card.question.trim()) {
            cardErrors[index] = "Вопрос не может быть пустым"
          } else if (!card.answer.trim()) {
            cardErrors[index] = "Ответ не может быть пустым"
          } else {
            hasValidCards = true
          }
        })

        if (!hasValidCards) {
          errors.cards = ["Добавьте хотя бы одну карточку с вопросом и ответом"]
          setValidationErrors(errors)
          return false
        }

        if (cardErrors.some((error) => error)) {
          errors.cards = cardErrors
          setValidationErrors(errors)
          return false
        }
      }
    }

    setValidationErrors({})
    return true
  }

  // Parse content text into flashcards
  const parseContentToCards = (): FlashcardData[] => {
    if (!content.trim()) return []

    let actualSeparator = customSeparator
    if (separator === "comma") actualSeparator = ","
    if (separator === "tab") actualSeparator = "\t"
    if (separator === "newline") actualSeparator = "\n"

    const lines = content.split("\n").filter((line) => line.trim() !== "")
    return lines.map((line) => {
      const parts = line.split(actualSeparator)

      if (parts.length < 2) {
        throw new Error(`Строка не содержит разделитель "${actualSeparator}": ${line}`)
      }

      const question = parts[0].trim()
      const answer = parts.slice(1).join(actualSeparator).trim()

      if (!question || !answer) {
        throw new Error(`Неверный формат карточки в строке: ${line}`)
      }

      return { question, answer }
    })
  }

  // Generate preview cards
  const generatePreviewCards = () => {
    try {
      if (inputMethod === "text") {
        setPreviewCards(parseContentToCards())
      } else {
        setPreviewCards(cards.filter((card) => card.question.trim() && card.answer.trim()))
      }
      setPreviewIndex(0)
    } catch (error) {
      console.error("Error generating preview:", error)
      toast({
        title: "Ошибка предпросмотра",
        description: error instanceof Error ? error.message : "Не удалось создать предпросмотр",
        variant: "destructive",
      })
    }
  }

  // Navigate to the next step
  const goToNextStep = () => {
    if (!validateCurrentStep()) return

    if (currentStep === "title") {
      setCurrentStep("content")
      setTimeout(() => {
        if (contentTextareaRef.current) {
          contentTextareaRef.current.focus()
        }
      }, 100)
    } else if (currentStep === "content") {
      generatePreviewCards()
      setCurrentStep("preview")
    }
  }

  // Navigate to the previous step
  const goToPreviousStep = () => {
    if (currentStep === "content") {
      setCurrentStep("title")
    } else if (currentStep === "preview") {
      setCurrentStep("content")
    }
  }

  // Add a new card
  const addCard = () => {
    setCards([...cards, { question: "", answer: "" }])
  }

  // Remove a card
  const removeCard = (index: number) => {
    if (cards.length <= 1) return
    const newCards = [...cards]
    newCards.splice(index, 1)
    setCards(newCards)
  }

  // Update a card
  const updateCard = (index: number, field: "question" | "answer", value: string) => {
    const newCards = [...cards]
    newCards[index][field] = value
    setCards(newCards)

    // Update the current preview card if it's the first card
    if (index === 0) {
      setCurrentPreviewCard({
        ...newCards[0],
      })
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return

    try {
      setIsSubmitting(true)

      let flashcards: FlashcardData[] = []

      if (inputMethod === "text") {
        flashcards = parseContentToCards()
      } else {
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

      // Save collection to Supabase
      await createCollection(title, flashcards)

      toast({
        title: "Успех!",
        description: `Создана коллекция "${title}" с ${flashcards.length} флеш-карточками`,
      })

      // Redirect to collections page
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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter to proceed to next step or submit
      if (e.ctrlKey && e.key === "Enter") {
        if (currentStep === "preview") {
          handleSubmit()
        } else {
          goToNextStep()
        }
      }

      // Escape to go back
      if (e.key === "Escape") {
        if (currentStep === "title") {
          setShowExitDialog(true)
        } else {
          goToPreviousStep()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentStep, inputMethod, title, content, cards])

  // Save draft to localStorage
  const saveDraft = () => {
    try {
      localStorage.setItem(
        "flashcard_draft",
        JSON.stringify({
          title,
          content,
          separator,
          customSeparator,
          cards,
          inputMethod,
          step: currentStep,
        }),
      )

      toast({
        title: "Черновик сохранен",
        description: "Вы можете вернуться к созданию коллекции позже",
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить черновик",
        variant: "destructive",
      })
    }
  }

  // Load draft from localStorage
  const loadDraft = () => {
    try {
      const draft = localStorage.getItem("flashcard_draft")
      if (draft) {
        const parsedDraft = JSON.parse(draft)
        setTitle(parsedDraft.title || "")
        setContent(parsedDraft.content || "")
        setSeparator(parsedDraft.separator || "comma")
        setCustomSeparator(parsedDraft.customSeparator || ",")
        setCards(parsedDraft.cards || [{ question: "", answer: "" }])
        setInputMethod(parsedDraft.inputMethod || "text")
        setCurrentStep(parsedDraft.step || "title")

        toast({
          title: "Черновик загружен",
          description: "Продолжайте создание коллекции",
        })
      } else {
        toast({
          title: "Черновик не найден",
          description: "Нет сохраненного черновика",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить черновик",
        variant: "destructive",
      })
    }
  }

  // Check for existing draft on component mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem("flashcard_draft")
      if (draft) {
        toast({
          title: "Найден сохраненный черновик",
          description: "Хотите продолжить работу с черновиком?",
          action: (
            <Button variant="outline" size="sm" onClick={loadDraft}>
              Загрузить
            </Button>
          ),
        })
      }
    } catch (error) {
      // Silently fail if localStorage is not available
    }
  }, [])

  // Render the title step
  const renderTitleStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="title" className="text-lg font-medium">
            Название коллекции
          </Label>
          {validationErrors.title && (
            <div className="flex items-center text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              {validationErrors.title}
            </div>
          )}
        </div>
        <Input
          id="title"
          ref={titleInputRef}
          placeholder="Например: Английские неправильные глаголы"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`text-lg ${validationErrors.title ? "border-destructive" : ""}`}
          disabled={isSubmitting}
        />
        <p className="text-sm text-muted-foreground">
          Дайте вашей коллекции понятное название, которое поможет вам найти её позже
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={() => setShowExitDialog(true)} disabled={isSubmitting}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Отмена
        </Button>
        <Button type="button" onClick={goToNextStep} disabled={isSubmitting}>
          Далее
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )

  // Render the content step
  const renderContentStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Tabs defaultValue="text" value={inputMethod} onValueChange={(value) => setInputMethod(value as InputMethod)}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="text" className="text-sm">
            Текстовый ввод
          </TabsTrigger>
          <TabsTrigger value="cards" className="text-sm">
            Карточка за карточкой
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <div className="grid gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content" className="text-base font-medium flex items-center">
                  Содержимое флеш-карточек
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                          <HelpCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Каждая строка станет флеш-карточкой. Разделяйте вопросы и ответы выбранным разделителем.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                {validationErrors.content && (
                  <div className="flex items-center text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {validationErrors.content}
                  </div>
                )}
              </div>
              <Textarea
                id="content"
                ref={contentTextareaRef}
                placeholder={`Например:\nЧто такое фотосинтез?${separator === "comma" ? "," : separator === "tab" ? "\t" : separator === "newline" ? "\n" : customSeparator}Процесс преобразования растениями солнечной энергии\nСтолица Франции?${separator === "comma" ? "," : separator === "tab" ? "\t" : separator === "newline" ? "\n" : customSeparator}Париж`}
                className={`min-h-[200px] font-mono text-sm ${validationErrors.content ? "border-destructive" : ""}`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
              />
              <div className="flex items-center text-sm text-muted-foreground">
                <Info className="h-4 w-4 mr-1" />
                <span>Совет: Используйте Ctrl+Enter для перехода к следующему шагу</span>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="separator">
                  <AccordionTrigger className="text-sm font-medium">Разделитель вопроса/ответа</AccordionTrigger>
                  <AccordionContent>
                    <RadioGroup
                      value={separator}
                      onValueChange={(value) => setSeparator(value as Separator)}
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
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          <div className="grid gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Флеш-карточки</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCard}
                  disabled={isSubmitting}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить карточку
                </Button>
              </div>

              {validationErrors.cards &&
                validationErrors.cards.length === 1 &&
                !Array.isArray(validationErrors.cards[0]) && (
                  <div className="flex items-center text-destructive text-sm bg-destructive/10 p-2 rounded">
                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                    {validationErrors.cards[0]}
                  </div>
                )}

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {cards.map((card, index) => (
                  <Card key={index} className="p-4 border rounded-md relative bg-white">
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

                    <div className="pt-2 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label htmlFor={`question-${index}`} className="text-sm font-medium">
                            Вопрос {index + 1}
                          </Label>
                          {validationErrors.cards && validationErrors.cards[index] && (
                            <div className="text-destructive text-xs flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {validationErrors.cards[index]}
                            </div>
                          )}
                        </div>
                        <Textarea
                          id={`question-${index}`}
                          value={card.question}
                          onChange={(e) => updateCard(index, "question", e.target.value)}
                          placeholder="Введите вопрос"
                          disabled={isSubmitting}
                          className={`min-h-[80px] ${
                            validationErrors.cards && validationErrors.cards[index] ? "border-destructive" : ""
                          }`}
                        />
                      </div>

                      <div>
                        <Label htmlFor={`answer-${index}`} className="text-sm font-medium mb-1 block">
                          Ответ
                        </Label>
                        <Textarea
                          id={`answer-${index}`}
                          value={card.answer}
                          onChange={(e) => updateCard(index, "answer", e.target.value)}
                          placeholder="Введите ответ"
                          disabled={isSubmitting}
                          className={`min-h-[80px] ${
                            validationErrors.cards && validationErrors.cards[index] ? "border-destructive" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={goToPreviousStep} disabled={isSubmitting}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={saveDraft} disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            Сохранить черновик
          </Button>
          <Button type="button" onClick={goToNextStep} disabled={isSubmitting}>
            Предпросмотр
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  )

  // Render the preview step
  const renderPreviewStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{previewCards.length} карточек</p>
      </div>

      {previewCards.length > 0 ? (
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md mb-4">
            <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
              <span>
                Карточка {previewIndex + 1} из {previewCards.length}
              </span>
            </div>
            <PreviewCardView card={previewCards[previewIndex]} showAnswer={false} />

            <div className="flex justify-center mt-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                disabled={previewIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Предыдущая
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewIndex(Math.min(previewCards.length - 1, previewIndex + 1))}
                disabled={previewIndex === previewCards.length - 1}
              >
                Следующая
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <p className="text-muted-foreground">
            Нет карточек для предпросмотра. Пожалуйста, вернитесь и добавьте содержимое.
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={goToPreviousStep} disabled={isSubmitting}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting || previewCards.length === 0}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Создание...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Создать коллекцию
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Создание коллекции флеш-карточек</h1>
          <div className="flex items-center gap-4">
            <Progress value={getProgressPercentage()} className="h-2 flex-1" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Шаг {currentStep === "title" ? "1" : currentStep === "content" ? "2" : "3"} из 3
            </span>
          </div>
        </div>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {currentStep === "title" && renderTitleStep()}
              {currentStep === "content" && renderContentStep()}
              {currentStep === "preview" && renderPreviewStep()}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Keyboard shortcuts help */}
        <div className="mt-4 text-sm text-muted-foreground">
          <p className="flex items-center">
            <Info className="h-4 w-4 mr-1" />
            Подсказка: Используйте <kbd className="px-1 py-0.5 bg-muted rounded text-xs mx-1">Ctrl+Enter</kbd> для
            перехода к следующему шагу,
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs mx-1">Esc</kbd> для возврата назад
          </p>
        </div>
      </div>

      {/* Exit confirmation dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отменить создание?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите отменить создание коллекции? Все несохраненные данные будут потеряны.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Продолжить редактирование
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowExitDialog(false)
                router.push("/collections")
              }}
            >
              Отменить создание
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}

