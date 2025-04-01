"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface SingleCardViewProps {
  cards: { question: string; answer: string }[]
}

export default function SingleCardView({ cards }: SingleCardViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [revealAllAnswers, setRevealAllAnswers] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const questionRef = useRef<HTMLDivElement>(null)
  const answerRef = useRef<HTMLDivElement>(null)
  const [textOverflow, setTextOverflow] = useState({ question: false, answer: false })

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
  }, [currentIndex, cards])

  // Reset flipped state when changing cards or reveal mode
  useEffect(() => {
    setFlipped(false)
  }, [currentIndex, revealAllAnswers])

  const navigateToCard = (index: number) => {
    if (index >= 0 && index < cards.length && !isAnimating) {
      setIsAnimating(true)
      setFlipped(false)

      // Wait for flip animation to complete before changing card
      setTimeout(() => {
        setCurrentIndex(index)
        setIsAnimating(false)
      }, 250)
    }
  }

  const handleNext = () => {
    navigateToCard(currentIndex + 1)
  }

  const handlePrevious = () => {
    navigateToCard(currentIndex - 1)
  }

  const handleFlip = () => {
    if (!isAnimating) {
      setFlipped(!flipped)
    }
  }

  const toggleRevealAnswers = () => {
    setRevealAllAnswers(!revealAllAnswers)
  }

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const halfWidth = rect.width / 2

    if (x < halfWidth) {
      // Left half clicked
      if (currentIndex > 0) {
        handlePrevious()
      }
    } else {
      // Right half clicked
      if (currentIndex < cards.length - 1) {
        handleNext()
      } else if (!revealAllAnswers) {
        // If on last card and not in reveal mode, flip it
        handleFlip()
      }
    }
  }

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickPosition = e.clientX - rect.left
    const percentage = clickPosition / rect.width
    const newIndex = Math.min(Math.max(0, Math.floor(percentage * cards.length)), cards.length - 1)
    navigateToCard(newIndex)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setStartX(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return

    const rect = e.currentTarget.getBoundingClientRect()
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

      <div
        className="relative h-4 mb-6 cursor-pointer"
        onClick={handleProgressBarClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="absolute inset-0 bg-secondary rounded-full">
          {cards.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "absolute top-0 bottom-0 w-1 rounded-full transition-colors",
                idx <= currentIndex ? "bg-primary" : "bg-secondary-foreground/10",
                idx === currentIndex && "bg-primary-foreground",
              )}
              style={{
                left: `${(idx / (cards.length - 1)) * 100}%`,
                transform: "translateX(-50%)",
              }}
            />
          ))}
        </div>
        <Progress value={progress} className="h-4" />
      </div>

      <Card
        className={`h-64 md:h-80 flex items-center justify-center cursor-pointer perspective-1000 mb-6 hover:shadow-md transition-shadow duration-200 bg-white relative`}
        onClick={handleCardClick}
      >
        {/* Left navigation hint */}
        {currentIndex > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-1/2 flex items-center justify-start opacity-0 hover:opacity-30 transition-opacity z-10">
            <div className="bg-gray-300 p-2 rounded-r-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </div>
          </div>
        )}

        {/* Right navigation hint */}
        {currentIndex < cards.length - 1 && (
          <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-end opacity-0 hover:opacity-30 transition-opacity z-10">
            <div className="bg-gray-300 p-2 rounded-l-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        )}

        <div
          className={`w-full h-full relative transition-transform duration-300 transform-style-3d ${flipped ? "rotate-y-180" : ""}`}
          aria-live="polite"
        >
          <CardContent className="rounded-lg bg-white absolute inset-0 flex items-center justify-center p-6 backface-hidden overflow-hidden">
            <div
              ref={questionRef}
              className={cn("text-center w-full max-h-full overflow-y-auto", textOverflow.question && "pr-2")}
            >
              <p className={cn("font-medium", textOverflow.question ? "text-lg md:text-xl" : "text-xl md:text-2xl")}>
                {cards[currentIndex].question}
              </p>

              {revealAllAnswers && (
                <>
                  <hr className="my-4 border-t border-border" />
                  <div ref={answerRef} className={cn("max-h-[40%] overflow-y-auto", textOverflow.answer && "pr-2")}>
                    <p className={cn(textOverflow.answer ? "text-base" : "text-lg")}>{cards[currentIndex].answer}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>

          <CardContent className="rounded-lg bg-white absolute inset-0 flex items-center justify-center p-6 backface-hidden rotate-y-180 overflow-hidden">
            <div
              ref={answerRef}
              className={cn("text-center w-full max-h-full overflow-y-auto", textOverflow.answer && "pr-2")}
            >
              <p className={cn("font-medium", textOverflow.answer ? "text-lg md:text-xl" : "text-xl md:text-2xl")}>
                {cards[currentIndex].answer}
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}
