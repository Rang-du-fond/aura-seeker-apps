import { Camera } from "expo-camera"
import * as Location from "expo-location"

// Where to go after signing in: the permissions screen only if the camera or
// the location still has to be allowed.
export async function firstScreen() {
  const check = Promise.all([
    Camera.getCameraPermissionsAsync(),
    Location.getForegroundPermissionsAsync(),
  ]).then(([camera, location]) => camera.granted && location.granted)
  // Never hold up the sign-in on this: a status that fails or is slow to come
  // back counts as not granted.
  const timeout = new Promise<boolean>((resolve) =>
    setTimeout(() => resolve(false), 1500)
  )
  const granted = await Promise.race([check, timeout]).catch(() => false)

  return granted ? "/map" : "/permissions"
}
