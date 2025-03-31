import { Card, CardContent } from "@/components/ui/card"

interface AllCardsViewProps {
  cards: { question: string; answer: string }[]
}

export default function AllCardsView({ cards }: AllCardsViewProps) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p>В этой коллекции нет флеш-карточек.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="h-full bg-white">
          <CardContent className="p-6">
            <p className="font-medium mb-2">{card.question}</p>
            <hr className="my-3 border-t border-border" />
            <p className="text-muted-foreground">{card.answer}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

