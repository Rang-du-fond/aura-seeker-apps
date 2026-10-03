import { Platform } from "react-native"
import * as SecureStore from "expo-secure-store"

// The session is kept in the device keystore. SecureStore has no web
// implementation, so the browser preview falls back to localStorage.
const web = Platform.OS === "web"

export async function readItem(key: string) {
  return web ? localStorage.getItem(key) : SecureStore.getItemAsync(key)
}

export async function writeItem(key: string, value: string) {
  if (web) {
    localStorage.setItem(key, value)
  } else {
    await SecureStore.setItemAsync(key, value)
  }
}

export async function removeItem(key: string) {
  if (web) {
    localStorage.removeItem(key)
  } else {
    await SecureStore.deleteItemAsync(key)
  }
}
