"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface SingleCardViewProps {
  cards: { question: string; answer: string }[]
}

export default function SingleCardView({ cards }: SingleCardViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [revealAllAnswers, setRevealAllAnswers] = useState(false)

  // Сбрасываем состояние переворота при изменении карточки или режима отображения
  useEffect(() => {
    setFlipped(false)
  }, [currentIndex, revealAllAnswers])

  const handleNext = () => {
    if (currentIndex < cards.length - 1 && !isAnimating) {
      setIsAnimating(true)
      setFlipped(false)

      // Ждем завершения анимации переворота перед сменой карточки
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1)
        setIsAnimating(false)
      }, 250)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0 && !isAnimating) {
      setIsAnimating(true)
      setFlipped(false)

      // Ждем завершения анимации переворота перед сменой карточки
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1)
        setIsAnimating(false)
      }, 250)
    }
  }

  const handleFlip = () => {
    if (!isAnimating) {
      setFlipped(!flipped)
    }
  }

  const toggleRevealAnswers = () => {
    setRevealAllAnswers(!revealAllAnswers)
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p>В этой коллекции нет флеш-карточек.</p>
      </div>
    )
  }

  const progress = ((currentIndex + 1) / cards.length) * 100

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-muted-foreground">
          Карточка {currentIndex + 1} из {cards.length}
        </p>

        <div className="flex items-center space-x-2">
          <Switch id="reveal-answers" checked={revealAllAnswers} onCheckedChange={toggleRevealAnswers} />
          <Label htmlFor="reveal-answers" className="flex items-center gap-1">
            {revealAllAnswers ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>Скрыть ответы</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>Показать ответы</span>
              </>
            )}
          </Label>
        </div>
      </div>

      <Progress value={progress} className="h-2 mb-6" />

      <Card
        className={`h-64 md:h-80 flex items-center justify-center ${!revealAllAnswers ? "cursor-pointer" : ""} perspective-1000 mb-6 hover:shadow-md transition-shadow duration-200 bg-white`}
        onClick={revealAllAnswers ? undefined : handleFlip}
      >
        <div
          className={`w-full h-full relative transition-transform duration-300 transform-style-3d ${flipped ? "rotate-y-180" : ""}`}
          aria-live="polite"
        >
          <CardContent className="rounded-lg bg-white absolute inset-0 flex items-center justify-center p-6 backface-hidden">
            <div className="text-center w-full">
              <p className="text-xl md:text-2xl font-medium">{cards[currentIndex].question}</p>

              {revealAllAnswers && (
                <>
                  <hr className="my-4 border-t border-border" />
                  <div className="text-lg">
                    <p>{cards[currentIndex].answer}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>

          <CardContent className="rounded-lg bg-white absolute inset-0 flex items-center justify-center p-6 backface-hidden rotate-y-180">
            <div className="text-center w-full">
              <p className="text-xl md:text-2xl font-medium">{cards[currentIndex].answer}</p>
            </div>
          </CardContent>
        </div>
      </Card>

      <div className="flex justify-between items-center">
        <Button
          onClick={handlePrevious}
          disabled={currentIndex === 0 || isAnimating}
          variant="outline"
          size="icon"
          aria-label="Предыдущая карточка"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1 || isAnimating}
          variant="outline"
          size="icon"
          aria-label="Следующая карточка"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

