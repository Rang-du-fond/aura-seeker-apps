import { Platform } from "react-native"
import { File } from "expo-file-system"

const typesByExtension: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
}

// Reads the photo behind a camera or gallery URI, ready to upload.
//
// On a phone the file is read through the file system. `fetch(uri)` must not
// be used there: for a `file://` URI it answers with the text "File not
// found" instead of failing, and that text was uploaded in place of the photo.
export async function readPhoto(
  uri: string
): Promise<{ body: Blob | ArrayBuffer; type: string }> {
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob()

    return { body: blob, type: blob.type || "image/jpeg" }
  }

  const file = new File(uri)
  if (!file.exists) {
    throw new Error(`Photo not found: ${uri}`)
  }
  const body = await file.arrayBuffer()
  if (body.byteLength === 0) {
    throw new Error(`Photo is empty: ${uri}`)
  }

  return {
    body,
    type:
      file.type ||
      typesByExtension[file.extension.toLowerCase()] ||
      "image/jpeg",
  }
}
