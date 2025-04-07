"use client"

import { supabase, type DbFlashcardCollection } from "./supabase"
import { createCollectionPath, extractIdFromPath } from "./url-utils"

// Function to create a new collection
export async function createCollection(
  collectionName: string,
  content: { question: string; answer: string }[],
): Promise<DbFlashcardCollection | null> {
  try {
    const urlPath = createCollectionPath(collectionName)

    const { data, error } = await supabase
      .from("flashcards")
      .insert([{ collection_name: collectionName, content: content, url_path: urlPath }])
      .select()
      .single()

    if (error) {
      console.error("Ошибка при создании коллекции:", error)
      throw new Error(error.message)
    }

    return data
  } catch (error: any) {
    console.error("Ошибка при создании коллекции:", error)
    throw new Error(error.message || "Не удалось создать коллекцию")
  }
}

// Function to get all collections
export async function getCollections(): Promise<DbFlashcardCollection[]> {
  try {
    const { data, error } = await supabase.from("flashcards").select("*").order("edited_at", { ascending: false })

    if (error) {
      console.error("Ошибка при загрузке коллекций:", error)
      throw new Error(error.message)
    }

    return data || []
  } catch (error: any) {
    console.error("Ошибка при загрузке коллекций:", error)
    throw new Error(error.message || "Не удалось загрузить коллекции")
  }
}

// Function to get a collection by ID
export async function getCollectionById(id: string): Promise<DbFlashcardCollection | null> {
  try {
    const { data, error } = await supabase.from("flashcards").select("*").eq("id", id).single()

    if (error) {
      console.error(`Ошибка при загрузке коллекции с ID ${id}:`, error)
      return null
    }

    return data
  } catch (error: any) {
    console.error(`Ошибка при загрузке коллекции с ID ${id}:`, error)
    return null
  }
}

// Function to get a collection by URL path
export async function getCollectionByPath(path: string): Promise<DbFlashcardCollection | null> {
  try {
    const { data, error } = await supabase.from("flashcards").select("*").eq("url_path", path).single()

    if (error) {
      console.error(`Ошибка при загрузке коллекции с путем ${path}:`, error)
      return null
    }

    return data
  } catch (error: any) {
    console.error(`Ошибка при загрузке коллекции с путем ${path}:`, error)
    return null
  }
}

// Function to update a collection
export async function updateCollection(
  id: string,
  updates: {
    collection_name?: string
    content?: { question: string; answer: string }[]
    url_path?: string
  },
): Promise<DbFlashcardCollection | null> {
  try {
    // If collection name is being updated, regenerate the URL path
    const updatesWithPath = { ...updates }

    if (updates.collection_name) {
      // First, get the current collection to extract the number from its URL path
      const { data: currentCollection, error: fetchError } = await supabase
        .from("flashcards")
        .select("url_path")
        .eq("id", id)
        .single()

      if (fetchError) {
        console.error(`Ошибка при получении текущей коллекции с ID ${id}:`, fetchError)
        throw new Error(fetchError.message)
      }

      // Extract the number from the current URL path
      const currentPath = currentCollection.url_path || ""
      const pathNumber = extractIdFromPath(currentPath)

      // Create a new URL path with the updated name but preserve the original number
      if (pathNumber) {
        const slug = nameToSlug(updates.collection_name)
        const finalSlug = slug || "collection"
        updatesWithPath.url_path = `${finalSlug}/${pathNumber}`
      } else {
        // Fallback to creating a new path if we couldn't extract the number
        updatesWithPath.url_path = createCollectionPath(updates.collection_name)
      }
    }

    const { data, error } = await supabase.from("flashcards").update(updatesWithPath).eq("id", id).select().single()

    if (error) {
      console.error(`Ошибка при обновлении коллекции с ID ${id}:`, error)
      throw new Error(error.message)
    }

    return data
  } catch (error: any) {
    console.error(`Ошибка при обновлении коллекции с ID ${id}:`, error)
    throw new Error(error.message || "Не удалось обновить коллекцию")
  }
}

// Function to delete a collection
export async function deleteCollection(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("flashcards").delete().eq("id", id)

    if (error) {
      console.error(`Ошибка при удалении коллекции с ID ${id}:`, error)
      throw new Error(error.message)
    }
  } catch (error: any) {
    console.error(`Ошибка при удалении коллекции с ID ${id}:`, error)
    throw new Error(error.message || "Не удалось удалить коллекцию")
  }
}

// Function to add a card to a collection
export async function addCardToCollection(
  collectionId: string,
  newCard: { question: string; answer: string },
): Promise<void> {
  try {
    // Получаем текущую коллекцию
    const { data: collection, error: collectionError } = await supabase
      .from("flashcards")
      .select("content")
      .eq("id", collectionId)
      .single()

    if (collectionError) {
      console.error("Ошибка при получении коллекции:", collectionError)
      throw new Error("Не удалось получить коллекцию")
    }

    if (!collection) {
      throw new Error("Коллекция не найдена")
    }

    // Добавляем новую карточку к существующему содержимому
    const updatedContent = [...(collection.content || []), newCard]

    // Обновляем коллекцию с новым содержимым
    const { error: updateError } = await supabase
      .from("flashcards")
      .update({ content: updatedContent })
      .eq("id", collectionId)

    if (updateError) {
      console.error("Ошибка при обновлении коллекции:", updateError)
      throw new Error("Не удалось обновить коллекцию")
    }
  } catch (error: any) {
    console.error("Ошибка при добавлении карточки в коллекцию:", error)
    throw new Error(error.message || "Не удалось добавить карточку в коллекцию")
  }
}

// Форматирование относительного времени
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "только что"
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${getMinutesForm(diffInMinutes)} назад`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} ${getHoursForm(diffInHours)} назад`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} ${getDaysForm(diffInDays)} назад`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} ${getMonthsForm(diffInMonths)} назад`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears} ${getYearsForm(diffInYears)} назад`
}

// Вспомогательные функции для правильных окончаний в русском языке
function getMinutesForm(minutes: number): string {
  if (minutes % 10 === 1 && minutes % 100 !== 11) {
    return "минуту"
  } else if ([2, 3, 4].includes(minutes % 10) && ![12, 13, 14].includes(minutes % 100)) {
    return "минуты"
  } else {
    return "минут"
  }
}

function getHoursForm(hours: number): string {
  if (hours % 10 === 1 && hours % 100 !== 11) {
    return "час"
  } else if ([2, 3, 4].includes(hours % 10) && ![12, 13, 14].includes(hours % 100)) {
    return "часа"
  } else {
    return "часов"
  }
}

function getDaysForm(days: number): string {
  if (days % 10 === 1 && days % 100 !== 11) {
    return "день"
  } else if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) {
    return "дня"
  } else {
    return "дней"
  }
}

function getMonthsForm(months: number): string {
  if (months % 10 === 1 && months % 100 !== 11) {
    return "месяц"
  } else if ([2, 3, 4].includes(months % 10) && ![12, 13, 14].includes(months % 100)) {
    return "месяца"
  } else {
    return "месяцев"
  }
}

function getYearsForm(years: number): string {
  if (years % 10 === 1 && years % 100 !== 11) {
    return "год"
  } else if ([2, 3, 4].includes(years % 10) && ![12, 13, 14].includes(years % 100)) {
    return "года"
  } else {
    return "лет"
  }
}

// Import nameToSlug from url-utils
import { nameToSlug } from "./url-utils"

