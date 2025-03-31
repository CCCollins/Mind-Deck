"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getCollections, deleteCollection, updateCollection, formatRelativeTime } from "@/lib/flashcard-service"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Trash2, Edit, Share2, Loader2, Clock, Plus, PencilLine, BookOpen } from "lucide-react"
import type { FlashcardCollection } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function CollectionsPage() {
  const router = useRouter()
  const [collections, setCollections] = useState<FlashcardCollection[]>([])
  const [isRenaming, setIsRenaming] = useState(false)
  const [collectionToRename, setCollectionToRename] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isRenameLoading, setIsRenameLoading] = useState(false)

  useEffect(() => {
    async function fetchCollections() {
      try {
        setLoading(true)
        const data = await getCollections()
        setCollections(data)
      } catch (error) {
        console.error("Ошибка при загрузке коллекций:", error)
        setError("Не удалось загрузить коллекции. Пожалуйста, обновите страницу.")
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить коллекции. Пожалуйста, обновите страницу.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCollections()
  }, [])

  const handleDelete = async (id: string) => {
    if (confirm("Вы уверены, что хотите удалить эту коллекцию?")) {
      try {
        setIsDeleting(id)
        await deleteCollection(id)
        setCollections(collections.filter((collection) => collection.id !== id))
        toast({
          title: "Коллекция удалена",
          description: "Коллекция флеш-карточек была удалена",
        })
      } catch (error) {
        console.error("Ошибка при удалении коллекции:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось удалить коллекцию. Пожалуйста, попробуйте снова.",
          variant: "destructive",
        })
      } finally {
        setIsDeleting(null)
      }
    }
  }

  const handleRename = (id: string, currentTitle: string) => {
    setCollectionToRename(id)
    setNewTitle(currentTitle)
    setIsRenaming(true)
  }

  const saveNewTitle = async () => {
    if (!collectionToRename || !newTitle.trim()) {
      return
    }

    try {
      setIsRenameLoading(true)
      const updatedCollection = await updateCollection(collectionToRename, {
        collection_name: newTitle.trim(),
      })

      if (updatedCollection) {
        setCollections(
          collections.map((collection) =>
            collection.id === collectionToRename
              ? {
                  ...collection,
                  collection_name: newTitle.trim(),
                  edited_at: updatedCollection.edited_at,
                  url_path: updatedCollection.url_path,
                }
              : collection,
          ),
        )
      }

      setIsRenaming(false)
      setCollectionToRename(null)
      setNewTitle("")

      toast({
        title: "Коллекция переименована",
        description: "Название коллекции было обновлено",
      })
    } catch (error) {
      console.error("Ошибка при переименовании коллекции:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось переименовать коллекцию. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      })
    } finally {
      setIsRenameLoading(false)
    }
  }

  const copyShareLink = (collection: FlashcardCollection) => {
    const path = collection.url_path || collection.id
    const url = `${window.location.origin}/study/${path}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Ссылка скопирована",
      description: "Ссылка на коллекцию скопирована в буфер обмена",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Загрузка коллекций...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Ошибка</h1>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <Button onClick={() => router.refresh()}>Попробовать снова</Button>
        </div>
      </div>
    )
  }

  if (collections.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Мои коллекции</h1>
        <Card className="max-w-md mx-auto text-center p-6">
          <CardContent className="pt-6 pb-4">
            <p className="mb-4">У вас пока нет коллекций флеш-карточек.</p>
            <Link href="/create">
              <Button>Создать первую коллекцию</Button>
            </Link>
          </CardContent>
        </Card>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Коллекции</h1>
        <Link href="/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Создать
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <Card key={collection.id} className="flex flex-col bg-white">
            <CardHeader>
              <CardTitle>{collection.collection_name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <span>{collection.content.length} карточек</span>
                <span className="mx-1">•</span>
                <Clock className="h-3 w-3" />
                <span>Изменено {formatRelativeTime(collection.edited_at)}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">
                {collection.content.length > 0
                  ? `Первая карточка: ${collection.content[0].question.substring(0, 40)}${collection.content[0].question.length > 40 ? "..." : ""}`
                  : "В этой коллекции нет карточек"}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(collection.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  aria-label="Удалить коллекцию"
                  disabled={isDeleting === collection.id}
                >
                  {isDeleting === collection.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRename(collection.id, collection.collection_name)}
                  aria-label="Переименовать коллекцию"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyShareLink(collection)}
                  aria-label="Поделиться коллекцией"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-x-2">
                <Link href={`/edit/${collection.id}`}>
                  <Button variant="outline" size="sm">
                    <PencilLine className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/study/${collection.url_path || collection.id}`}>
                  <Button variant="default" size="sm">
                    <BookOpen className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Переименовать коллекцию</DialogTitle>
            <DialogDescription>Введите новое название для вашей коллекции.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Новое название коллекции"
              className="w-full"
              disabled={isRenameLoading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenaming(false)} disabled={isRenameLoading}>
              Отмена
            </Button>
            <Button onClick={saveNewTitle} disabled={!newTitle.trim() || isRenameLoading}>
              {isRenameLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}

