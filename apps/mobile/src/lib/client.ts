import { Platform } from "react-native"

import { createApi } from "@/lib/api"

// The API on the development machine. An Android emulator reaches the host on
// 10.0.2.2; a physical phone needs EXPO_PUBLIC_API_URL set to the machine's
// address on the local network.
const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  Platform.select({
    android: "https://api.aura-seeker.matheo-galuba.com",
    default: "http://127.0.0.1:8080",
  })

export const api = createApi(apiUrl.replace(/\/$/, ""))
