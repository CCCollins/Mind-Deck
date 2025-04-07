"use client"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, RotateCw } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

interface PreviewCardViewProps {
  card: { question: string; answer: string }
  showAnswer?: boolean
}

export default function PreviewCardView({ card, showAnswer = false }: PreviewCardViewProps) {
  const [flipped, setFlipped] = useState(false)
  const [revealAnswer, setRevealAnswer] = useState(showAnswer)
  const isMobile = useMediaQuery("(max-width: 640px)")
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
  }, [card, flipped])

  // Reset flipped state when card changes
  useEffect(() => {
    setFlipped(false)
  }, [card])

  // Update revealAnswer when showAnswer prop changes
  useEffect(() => {
    setRevealAnswer(showAnswer)
  }, [showAnswer])

  const handleFlip = () => {
    if (!revealAnswer) {
      setFlipped(!flipped)
    }
  }

  const toggleRevealAnswer = () => {
    setRevealAnswer(!revealAnswer)
    setFlipped(false)
  }

  return (
    <div className="max-w-xl mx-auto px-4 md:px-0">
      {/* Card Counter and Controls - Only visible on desktop */}
      <div className="mb-4 hidden sm:flex justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="font-medium">Предпросмотр</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="reveal-answers-desktop-preview"
            checked={revealAnswer}
            onCheckedChange={toggleRevealAnswer}
            className="data-[state=checked]:bg-primary"
          />
          <Label htmlFor="reveal-answers-desktop-preview" className="flex items-center gap-1 cursor-pointer text-sm">
            {revealAnswer ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>Скрыть ответ</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>Показать ответ</span>
              </>
            )}
          </Label>
        </div>
      </div>

      {/* Card Container */}
      <div className="relative">
        {/* Card */}
        <Card
          className={cn(
            "h-[380px] flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow duration-200 bg-white relative",
            flipped && "ring-1 ring-primary/20",
          )}
          onClick={handleFlip}
        >
          {/* Flip indicator */}
          {!revealAnswer && (
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
            {!flipped && !revealAnswer && (
              <div className="p-5 h-full flex flex-col">
                <div
                  ref={questionRef}
                  className="text-center w-full h-full flex items-center justify-center overflow-y-auto custom-scrollbar"
                >
                  <p className="font-medium text-base md:text-lg">
                    {card.question || "Здесь будет отображаться вопрос"}
                  </p>
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
                  <p className="font-medium text-base md:text-lg">{card.answer || "Здесь будет отображаться ответ"}</p>
                </div>
              </div>
            )}

            {/* Show both question and answer when revealAnswer is true */}
            {revealAnswer && !flipped && (
              <div className="p-5 h-full flex flex-col justify-center">
                <div className="text-center w-full overflow-y-auto custom-scrollbar">
                  <p className="font-medium text-base md:text-lg mb-4">
                    {card.question || "Здесь будет отображаться вопрос"}
                  </p>
                  <div className="border-t pt-3">
                    <div className="text-xs text-muted-foreground mb-1">Ответ:</div>
                    <p className="font-medium text-base overflow-y-auto custom-scrollbar">
                      {card.answer || "Здесь будет отображаться ответ"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Controls */}
      <div className="mt-4 flex justify-center items-center sm:hidden">
        <div className="flex items-center space-x-2">
          <Switch
            id="reveal-answers-mobile-preview"
            checked={revealAnswer}
            onCheckedChange={toggleRevealAnswer}
            className="data-[state=checked]:bg-primary"
          />
          <Label htmlFor="reveal-answers-mobile-preview" className="flex items-center gap-1 cursor-pointer text-sm">
            {revealAnswer ? "Скрыть ответ" : "Показать ответ"}
          </Label>
        </div>
      </div>
    </div>
  )
}

