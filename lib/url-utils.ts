/**
 * Converts a collection name to a URL-friendly slug
 * @param name The collection name to convert
 * @returns A URL-friendly slug
 */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/-+/g, "_") // Replace multiple hyphens with single underscore
}

/**
 * Generates a random 4-digit number
 * @returns A string containing a random 4-digit number
 */
export function generateRandomId(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

/**
 * Creates a URL-friendly path for a collection
 * @param name The collection name
 * @param id The collection ID (optional)
 * @returns A URL-friendly path
 */
export function createCollectionPath(name: string, id?: string): string {
  const slug = nameToSlug(name)
  const randomId = id || generateRandomId()
  return `${slug}/${randomId}`
}

/**
 * Extracts the collection ID from a URL path
 * @param path The URL path in format "slug/id"
 * @returns The collection ID
 */
export function extractIdFromPath(path: string): string | null {
  const parts = path.split("/")
  if (parts.length >= 2) {
    return parts[parts.length - 1]
  }
  return null
}

