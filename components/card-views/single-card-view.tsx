"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, ChevronLeft, ChevronRight, RotateCw } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useMediaQuery } from "@/hooks/use-media-query"

interface SingleCardViewProps {
  cards: { question: string; answer: string }[]
}

export default function SingleCardView({ cards }: SingleCardViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [revealAllAnswers, setRevealAllAnswers] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const questionRef = useRef<HTMLDivElement>(null)
  const answerRef = useRef<HTMLDivElement>(null)
  const [textOverflow, setTextOverflow] = useState({ question: false, answer: false })
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [flipped, setFlipped] = useState(false)
  const isMobile = useMediaQuery("(max-width: 640px)")

  const handleFlip = () => {
    if (!isAnimating && !revealAllAnswers) {
      setFlipped(!flipped)
    }
  }

  // Check if text is overflowing
  useEffect(() => {
    const checkOverflow = () => {
      if (questionRef.current) {
        setTextOverflow((prev) => ({
          ...prev,
          question: questionRef.current!.scrollHeight > questionRef.current!.clientHeight,
        }))
      }
      if (answerRef.current) {
        setTextOverflow((prev) => ({
          ...prev,
          answer: answerRef.current!.scrollHeight > answerRef.current!.clientHeight,
        }))
      }
    }

    checkOverflow()
    window.addEventListener("resize", checkOverflow)
    return () => window.removeEventListener("resize", checkOverflow)
  }, [currentIndex, cards, flipped])

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && currentIndex < cards.length - 1) {
        handleNext()
      } else if (e.key === "ArrowLeft" && currentIndex > 0) {
        handlePrevious()
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        handleFlip()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [currentIndex, cards.length, revealAllAnswers, flipped])

  const navigateToCard = (index: number) => {
    if (index >= 0 && index < cards.length && !isAnimating) {
      setIsAnimating(true)

      // Short delay to allow state changes to complete
      setTimeout(() => {
        setCurrentIndex(index)
        setIsAnimating(false)
        setFlipped(false) // Reset flipped state when navigating to a new card
      }, 100)
    }
  }

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      navigateToCard(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      navigateToCard(currentIndex - 1)
    }
  }

  const toggleRevealAnswers = () => {
    setRevealAllAnswers(!revealAllAnswers)
    setFlipped(false) // Reset flipped state when revealing/hiding answers
  }

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width

    // Divide the card into three zones (left third, center third, right third)
    if (x < width / 3) {
      // Left third clicked - navigate to previous card
      if (currentIndex > 0) {
        handlePrevious()
      }
    } else if (x > (width * 2) / 3) {
      // Right third clicked - navigate to next card
      if (currentIndex < cards.length - 1) {
        handleNext()
      }
    } else if (!revealAllAnswers) {
      // Center third clicked - flip the card only if answers are not revealed
      handleFlip()
    }
  }

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect()
      const clickPosition = e.clientX - rect.left
      const percentage = clickPosition / rect.width
      const newIndex = Math.min(Math.max(0, Math.floor(percentage * cards.length)), cards.length - 1)
      navigateToCard(newIndex)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !progressBarRef.current) return

    const rect = progressBarRef.current.getBoundingClientRect()
    const percentage = (e.clientX - rect.left) / rect.width
    const newIndex = Math.min(Math.max(0, Math.floor(percentage * cards.length)), cards.length - 1)
    setCurrentIndex(newIndex)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
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
    <div className="max-w-xl mx-auto px-4 md:px-0">
      {/* Card Counter and Controls - Only visible on desktop */}
      <div className="mb-4 hidden sm:flex justify-between items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-medium">{currentIndex + 1}</span>
          <span>/</span>
          <span>{cards.length}</span>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="reveal-answers-desktop"
            checked={revealAllAnswers}
            onCheckedChange={toggleRevealAnswers}
            className="data-[state=checked]:bg-primary"
          />
          <Label htmlFor="reveal-answers-desktop" className="flex items-center gap-1 cursor-pointer text-sm">
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

      {/* Progress Bar */}
      <div
        ref={progressBarRef}
        className="relative h-1 mb-4 cursor-pointer rounded-full overflow-hidden bg-secondary/30"
        onClick={handleProgressBarClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          className="absolute top-0 left-0 h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>

      {/* Card Container */}
      <div className="relative">
        {/* Navigation Buttons - Visible on larger screens */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 hidden md:block z-10">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Previous card"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-8 hidden md:block z-10">
          <button
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Next card"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Card */}
        <Card
          className={cn(
            "h-[440px] md:h-[380px] flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow duration-200 bg-white relative",
            flipped && "ring-1 ring-primary/20",
          )}
          onClick={handleCardClick}
        >
          {/* Flip indicator */}
          {!revealAllAnswers && (
            <div
              className={cn(
                "absolute top-2 right-2 p-1 rounded-full transition-opacity",
                flipped ? "opacity-100 bg-primary/10" : "opacity-30 hover:opacity-60 bg-secondary/30",
              )}
              onClick={(e) => {
                e.stopPropagation()
                handleFlip()
              }}
              title={flipped ? "Показать вопрос" : "Показать ответ"}
            >
              <RotateCw className={cn("h-3.5 w-3.5", flipped ? "text-primary" : "text-muted-foreground")} />
            </div>
          )}

          <CardContent className="w-full h-full p-0">
            {/* Front side (Question) */}
            {!flipped && !revealAllAnswers && (
              <div className="p-5 h-full flex flex-col">
                <div
                  ref={questionRef}
                  className="text-center w-full h-full flex items-center justify-center overflow-y-auto custom-scrollbar"
                >
                  <p className="font-medium text-base md:text-lg">{cards[currentIndex].question}</p>
                </div>
              </div>
            )}

            {/* Back side (Answer) */}
            {flipped && (
              <div className="p-5 h-full flex flex-col">
                <div
                  ref={answerRef}
                  className="text-center w-full h-full flex items-center justify-center overflow-y-auto custom-scrollbar"
                >
                  <p className="font-medium text-base md:text-lg">{cards[currentIndex].answer}</p>
                </div>
              </div>
            )}

            {/* Show both question and answer when revealAllAnswers is true */}
            {revealAllAnswers && !flipped && (
              <div className="p-5 h-full flex flex-col justify-between">
                <div className="text-center w-full overflow-y-auto custom-scrollbar flex-grow">
                  <p className="font-medium text-base md:text-lg mb-4">{cards[currentIndex].question}</p>
                  <div className="border-t pt-3">
                    <div className="text-xs text-muted-foreground mb-1">Ответ:</div>
                    <p className="font-medium text-base overflow-y-auto custom-scrollbar">
                      {cards[currentIndex].answer}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Navigation Controls */}
      <div className="mt-4 flex justify-between items-center sm:hidden">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="p-2 rounded-md bg-secondary/50 hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Previous card"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <span className="font-medium">{currentIndex + 1}</span>
            <span>/</span>
            <span>{cards.length}</span>
          </div>

          <div className="flex items-center space-x-1">
            <Switch
              id="reveal-answers-mobile"
              checked={revealAllAnswers}
              onCheckedChange={toggleRevealAnswers}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="reveal-answers-mobile" className="flex items-center cursor-pointer">
              {revealAllAnswers ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Label>
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="p-2 rounded-md bg-secondary/50 hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Next card"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

