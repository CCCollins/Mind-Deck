"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, ChevronUp, ArrowUp } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

interface AllCardsViewProps {
  cards: { question: string; answer: string }[]
  onCardSelect?: (index: number) => void
}

export default function AllCardsView({ cards, onCardSelect }: AllCardsViewProps) {
  const [expandedCards, setExpandedCards] = useState<number[]>([])
  const isMobile = useMediaQuery("(max-width: 640px)")

  useEffect(() => {
    setExpandedCards([])
  }, [])

  const toggleCard = (index: number) => {
    setExpandedCards((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const toggleAll = () => {
    if (expandedCards.length === cards.length) {
      setExpandedCards([])
    } else {
      setExpandedCards(cards.map((_, i) => i))
    }
  }

  const handleCardClick = (index: number) => {
    if (isMobile) {
      toggleCard(index)
    }
    if (onCardSelect) {
      onCardSelect(index)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">В этой коллекции нет флеш-карточек.</p>
      </div>
    )
  }

  return (
    <div className="relative space-y-4">
      {isMobile && (
        <div className="flex justify-center gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={toggleAll}>
            {expandedCards.length === cards.length ? "Скрыть все ответы" : "Показать все ответы"}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card, index) => {
          const isExpanded = expandedCards.includes(index)

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.03 }}
              className="h-full"
            >
              <Card
                className={`h-full bg-white border hover:shadow-md transition-shadow duration-200 ${
                  isMobile ? "cursor-pointer" : ""
                }`}
                onClick={() => handleCardClick(index)}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-base">{card.question}</p>
                      {isMobile && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleCard(index)
                          }}
                          aria-label={isExpanded ? "Скрыть ответ" : "Показать ответ"}
                          className="ml-2 p-1 rounded-full bg-secondary/30 hover:bg-secondary/50 transition"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {(!isMobile || isExpanded) && (
                        <motion.div
                          key="answer"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <hr className="my-2 border-border" />
                          <p className="text-sm text-muted-foreground">{card.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Scroll to Top Button (mobile only) */}
      {isMobile && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 z-50 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary/90 transition"
          aria-label="Наверх"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
