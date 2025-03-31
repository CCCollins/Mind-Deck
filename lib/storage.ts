"use client"

import type { Collection } from "./types"

const STORAGE_KEY = "flashcard_collections"

// Get all collections from localStorage
export function getCollections(): Collection[] {
  try {
    if (typeof window === "undefined") return []

    const storageData = localStorage.getItem(STORAGE_KEY)
    if (!storageData) return []

    return JSON.parse(storageData)
  } catch (error) {
    console.error("Error getting collections from storage:", error)
    return []
  }
}

// Get a specific collection by ID
export function getCollectionById(id: string): Collection | null {
  const collections = getCollections()
  return collections.find((collection) => collection.id === id) || null
}

// Save a new collection
export function saveCollection(collection: Collection): void {
  try {
    const collections = getCollections()
    const existingIndex = collections.findIndex((c) => c.id === collection.id)

    if (existingIndex >= 0) {
      // Update existing collection
      collections[existingIndex] = collection
    } else {
      // Add new collection
      collections.push(collection)
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections))
  } catch (error) {
    console.error("Error saving collection to storage:", error)
    throw new Error("Failed to save collection. Please try again.")
  }
}

// Delete a collection by ID
export function deleteCollection(id: string): void {
  try {
    const collections = getCollections()
    const updatedCollections = collections.filter((collection) => collection.id !== id)

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCollections))
  } catch (error) {
    console.error("Error deleting collection from storage:", error)
    throw new Error("Failed to delete collection. Please try again.")
  }
}

// Update a collection's title
export function updateCollectionTitle(id: string, newTitle: string): void {
  try {
    const collections = getCollections()
    const collection = collections.find((c) => c.id === id)

    if (collection) {
      collection.title = newTitle
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collections))
    }
  } catch (error) {
    console.error("Error updating collection title:", error)
    throw new Error("Failed to update collection title. Please try again.")
  }
}

