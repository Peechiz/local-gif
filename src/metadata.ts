import { LocalStorage, showToast, Toast } from "@raycast/api";

export interface GifMetadata {
  [filename: string]: {
    tags: string[];
  };
}

const STORAGE_KEY = "gif-metadata";

/**
 * Load metadata from LocalStorage with error handling
 */
export async function loadMetadata(): Promise<GifMetadata> {
  try {
    const raw = await LocalStorage.getItem<string>(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.error("Failed to load metadata:", error);
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to load tags",
      message: "Tag metadata was corrupted and has been reset",
    });
    return {};
  }
}

/**
 * Save metadata to LocalStorage
 */
export async function saveMetadata(metadata: GifMetadata): Promise<void> {
  try {
    await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error("Failed to save metadata:", error);
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to save tags",
      message: "Could not persist tag changes",
    });
    throw error;
  }
}

/**
 * Update tags for a specific file
 */
export async function updateFileTags(filename: string, tags: string[]): Promise<void> {
  const metadata = await loadMetadata();
  metadata[filename] = { tags };
  await saveMetadata(metadata);
}

/**
 * Clean up metadata by removing entries for files that no longer exist
 */
export async function cleanupMetadata(existingFiles: string[]): Promise<GifMetadata> {
  const metadata = await loadMetadata();
  const fileSet = new Set(existingFiles);

  const cleaned: GifMetadata = {};
  let removedCount = 0;

  for (const [filename, data] of Object.entries(metadata)) {
    if (fileSet.has(filename)) {
      cleaned[filename] = data;
    } else {
      removedCount++;
    }
  }

  if (removedCount > 0) {
    await saveMetadata(cleaned);
    console.log(`Cleaned up ${removedCount} stale metadata entries`);
  }

  return cleaned;
}

/**
 * Sanitize tag input from user
 */
export function sanitizeTags(input: string): string[] {
  return input
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0 && tag.length <= 50)
    .filter((tag, index, self) => self.indexOf(tag) === index); // Dedupe
}
