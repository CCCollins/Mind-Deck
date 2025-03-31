export interface Flashcard {
  question: string
  answer: string
}

export interface Collection {
  id: string
  title: string
  cards: Flashcard[]
  createdAt: string
}

