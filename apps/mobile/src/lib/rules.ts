import { readItem, writeItem } from "@/lib/storage"

// The photo rules are accepted once per phone, at the end of the onboarding.
const storageKey = "rules-accepted"

export async function rulesAccepted() {
  try {
    return (await readItem(storageKey)) === "1"
  } catch {
    return false
  }
}

export async function acceptRules() {
  await writeItem(storageKey, "1")
}
