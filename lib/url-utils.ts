/**
 * Converts a collection name to a URL-friendly slug
 * @param name The collection name to convert
 * @returns A URL-friendly slug
 */
export function nameToSlug(name: string): string {
  // Transliterate Cyrillic characters to Latin equivalents
  const transliterated = transliterateCyrillic(name)

  return transliterated
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/-+/g, "_") // Replace multiple hyphens with single underscore
    .trim() // Remove leading/trailing whitespace
    .replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
}

/**
 * Transliterates Cyrillic characters to Latin equivalents
 * @param text The text to transliterate
 * @returns Transliterated text
 */
export function transliterateCyrillic(text: string): string {
  const cyrillicToLatin: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
    // Ukrainian characters
    є: "ye",
    і: "i",
    ї: "yi",
    ґ: "g",
    // Uppercase variants
    А: "A",
    Б: "B",
    В: "V",
    Г: "G",
    Д: "D",
    Е: "E",
    Ё: "Yo",
    Ж: "Zh",
    З: "Z",
    И: "I",
    Й: "Y",
    К: "K",
    Л: "L",
    М: "M",
    Н: "N",
    О: "O",
    П: "P",
    Р: "R",
    С: "S",
    Т: "T",
    У: "U",
    Ф: "F",
    Х: "H",
    Ц: "Ts",
    Ч: "Ch",
    Ш: "Sh",
    Щ: "Sch",
    Ъ: "",
    Ы: "Y",
    Ь: "",
    Э: "E",
    Ю: "Yu",
    Я: "Ya",
    // Ukrainian uppercase
    Є: "Ye",
    І: "I",
    Ї: "Yi",
    Ґ: "G",
  }

  return text
    .split("")
    .map((char) => cyrillicToLatin[char] || char)
    .join("")
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

  // If slug is empty (e.g., if name only contained special characters),
  // use a default slug to avoid empty paths
  const finalSlug = slug || "collection"

  return `${finalSlug}/${randomId}`
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

/**
 * Formats a URL path for display in the UI
 * @param path The URL path
 * @returns A formatted path for display
 */
export function formatPathForDisplay(path: string): string {
  if (!path) return ""

  // Extract the slug part (everything before the last slash)
  const lastSlashIndex = path.lastIndexOf("/")
  if (lastSlashIndex === -1) return path

  const slug = path.substring(0, lastSlashIndex)
  const id = path.substring(lastSlashIndex + 1)

  // Replace underscores with spaces and capitalize words
  return (
    slug
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") +
    " #" +
    id
  )
}

