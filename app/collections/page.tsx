"use client"

import { useEffect, useState, useMemo } from "react"
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
import {
  Trash2,
  Edit,
  Share2,
  Loader2,
  Clock,
  Plus,
  PencilLine,
  BookOpen,
  Search,
  Filter,
  X,
  ArrowUp,
  SortAsc,
  SortDesc,
} from "lucide-react"
import type { FlashcardCollection } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { formatPathForDisplay } from "@/lib/url-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type SortField = "name" | "cards" | "date"
type SortOrder = "asc" | "desc"
type ViewMode = "grid" | "list"

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

  // New state for filtering and sorting
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [showScrollTop, setShowScrollTop] = useState(false)

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
      description: `Ссылка на коллекцию "${formatPathForDisplay(path)}" скопирована в буфер обмена`,
    })
  }

  // Filter and sort collections
  const filteredAndSortedCollections = useMemo(() => {
    // First filter by search query
    let result = collections

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (collection) =>
          collection.collection_name.toLowerCase().includes(query) ||
          collection.content.some(
            (card) => card.question.toLowerCase().includes(query) || card.answer.toLowerCase().includes(query),
          ),
      )
    }

    // Then sort
    return result.sort((a, b) => {
      if (sortField === "name") {
        return sortOrder === "asc"
          ? a.collection_name.localeCompare(b.collection_name)
          : b.collection_name.localeCompare(a.collection_name)
      } else if (sortField === "cards") {
        return sortOrder === "asc" ? a.content.length - b.content.length : b.content.length - a.content.length
      } else {
        // date
        return sortOrder === "asc"
          ? new Date(a.edited_at).getTime() - new Date(b.edited_at).getTime()
          : new Date(b.edited_at).getTime() - new Date(a.edited_at).getTime()
      }
    })
  }, [collections, searchQuery, sortField, sortOrder])

  const clearSearch = () => {
    setSearchQuery("")
  }

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Мои коллекции</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <Input
              placeholder="Поиск коллекций..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Сортировать по</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => setSortField("name")}
                  className={sortField === "name" ? "bg-muted" : ""}
                >
                  <span className="mr-2">Названию</span>
                  {sortField === "name" &&
                    (sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />)}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortField("cards")}
                  className={sortField === "cards" ? "bg-muted" : ""}
                >
                  <span className="mr-2">Количеству карточек</span>
                  {sortField === "cards" &&
                    (sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />)}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortField("date")}
                  className={sortField === "date" ? "bg-muted" : ""}
                >
                  <span className="mr-2">Дате изменения</span>
                  {sortField === "date" &&
                    (sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />)}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleSortOrder}>
                  {sortOrder === "asc" ? (
                    <>
                      <SortAsc className="h-4 w-4 mr-2" /> По возрастанию
                    </>
                  ) : (
                    <>
                      <SortDesc className="h-4 w-4 mr-2" /> По убыванию
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <TabsList className="h-9">
                <TabsTrigger value="grid" className="px-3">
                  <div className="grid grid-cols-2 gap-0.5 h-4 w-4">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="list" className="px-3">
                  <div className="flex flex-col gap-0.5 h-4 w-4">
                    <div className="h-0.5 bg-current rounded-full"></div>
                    <div className="h-0.5 bg-current rounded-full"></div>
                    <div className="h-0.5 bg-current rounded-full"></div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Link href="/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Создать
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {searchQuery && (
        <div className="mb-4">
          <Badge variant="outline" className="text-sm py-1 px-3">
            Результаты поиска: {filteredAndSortedCollections.length} коллекций
            <button onClick={clearSearch} className="ml-2">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      {filteredAndSortedCollections.length === 0 ? (
        <Card className="bg-white p-8 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <Search className="h-12 w-12 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-medium">Ничего не найдено</h3>
            <p className="text-muted-foreground">По вашему запросу не найдено коллекций</p>
            <Button variant="outline" onClick={clearSearch} className="mt-2">
              Сбросить поиск
            </Button>
          </div>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"
          }
        >
          <AnimatePresence>
            {filteredAndSortedCollections.map((collection) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`flex flex-col min-h-[240px] bg-white hover:shadow-md transition-shadow ${
                    viewMode === "list" ? "min-h-[50px] border-l-4 border-l-primary" : ""
                  }`}
                >
                  <CardHeader className={viewMode === "list" ? "pb-2" : ""}>
                    <div
                      className={`flex ${viewMode === "list" ? "flex-row justify-between items-center" : "flex-col"}`}
                    >
                      <CardTitle className={viewMode === "list" ? "text-lg" : ""}>
                        {collection.collection_name}
                      </CardTitle>
                      <CardDescription className={`flex items-center mt-2 gap-1 ${viewMode === "list" ? "text-sm" : ""}`}>
                        <Badge variant="outline" className="font-normal">
                          {collection.content.length} карточек
                        </Badge>
                        <span className="mx-1">•</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(collection.edited_at)}</span>
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className={`flex-grow ${viewMode === "list" ? "py-2" : ""}`}>
                    {viewMode === "grid" && (
                      <p className="text-muted-foreground">
                        {collection.content.length > 0
                          ? `Первая карточка: ${collection.content[0].question.substring(0, 40)}${collection.content[0].question.length > 40 ? "..." : ""}`
                          : "В этой коллекции нет карточек"}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className={`flex justify-between ${viewMode === "list" ? "pt-2 pb-4" : ""}`}>
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Rename Dialog */}
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

