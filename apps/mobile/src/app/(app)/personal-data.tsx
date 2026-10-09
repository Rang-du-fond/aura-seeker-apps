import * as React from "react"
import { StyleSheet, View } from "react-native"
import {
  ExternalLinkIcon,
  LogOutIcon,
  SmartphoneIcon,
} from "lucide-react-native"

import { Button } from "@workspace/ui/native/button"
import { Text } from "@workspace/ui/native/text"
import { themed, useColors } from "@workspace/ui/native/theme"

import { InfoItem, InfoScreen, InfoSection } from "@/components/info"
import type { ActiveSession } from "@/lib/api"
import { api } from "@/lib/client"
import { openWebPage } from "@/lib/links"
import { useLocale, useT } from "@/lib/preferences"
import { authErrorMessage, useSession } from "@/lib/session"

export default function PersonalData() {
  const t = useT()
  const colors = useColors()
  const styles = useStyles()
  const locale = useLocale()
  const { signOutEverywhere } = useSession()
  const [devices, setDevices] = React.useState<ActiveSession[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const dateFormat = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
    [locale]
  )

  React.useEffect(() => {
    let cancelled = false
    api
      .sessions()
      .then((loaded) => !cancelled && setDevices(loaded))
      .catch((caught) => !cancelled && setError(t(authErrorMessage(caught))))

    return () => {
      cancelled = true
    }
  }, [t])

  async function signOutDevice(device: ActiveSession) {
    setError(null)
    try {
      await api.deleteSession(device.id)
      setDevices((current) =>
        (current ?? []).filter((other) => other.id !== device.id)
      )
    } catch (caught) {
      setError(t(authErrorMessage(caught)))
    }
  }

  async function signOutAll() {
    setError(null)
    try {
      // Ends the session: the app goes back to the sign-in screen.
      await signOutEverywhere()
    } catch (caught) {
      setError(t(authErrorMessage(caught)))
    }
  }

  return (
    <InfoScreen
      title={t("common.personalData")}
      backLabel={t("common.backMyProfile")}
    >
      <InfoSection title={t("personalData.whatAppStores")}>
        <InfoItem title={t("personalData.account")}>
          {t("personalData.emailAddressDisplayName")}
        </InfoItem>
        <InfoItem title={t("personalData.signs")}>
          {t("personalData.eachSignPhotoPosition")}
        </InfoItem>
        <InfoItem title={t("personalData.signIns")}>
          {t("personalData.devicesSignedSignDate")}
        </InfoItem>
      </InfoSection>

      <InfoSection title={t("personalData.whatEveryoneSee")}>
        <InfoItem>{t("personalData.signsPublishPublicPhoto")}</InfoItem>
        <InfoItem>{t("personalData.ownPositionNotStored")}</InfoItem>
      </InfoSection>

      <InfoSection title={t("personalData.outsideServices")}>
        <InfoItem title="OpenStreetMap">
          {t("personalData.mapBackgroundLoadedOpenstreetmap")}
        </InfoItem>
        <InfoItem title="Google">
          {t("personalData.onlyChooseContinueGoogle")}
        </InfoItem>
      </InfoSection>

      <InfoSection title={t("personalData.signedDevices")}>
        {devices === null && !error && (
          <Text variant="muted">{t("common.loading")}</Text>
        )}
        {devices?.map((device) => (
          <View key={device.id} style={styles.device}>
            <SmartphoneIcon color={colors.mutedForeground} size={20} />
            <View style={styles.deviceText}>
              <Text>
                {device.current
                  ? t("personalData.thisDevice")
                  : device.device_label || t("personalData.anotherDevice")}
              </Text>
              <Text variant="muted">
                {t("personalData.signedInOn", {
                  date: dateFormat.format(new Date(device.signed_in_at * 1000)),
                })}
              </Text>
            </View>
            {!device.current && (
              <Button
                size="sm"
                variant="ghost"
                onPress={() => signOutDevice(device)}
              >
                {t("personalData.signOut")}
              </Button>
            )}
          </View>
        ))}
        {error && (
          <Text accessibilityRole="alert" variant="label" style={styles.error}>
            {error}
          </Text>
        )}
        <Button
          variant="secondary"
          icon={(props) => <LogOutIcon {...props} />}
          onPress={signOutAll}
        >
          {t("personalData.signOutEverywhere")}
        </Button>
      </InfoSection>

      <InfoSection title={t("personalData.deletingData")}>
        <InfoItem title={t("personalData.oneSign")}>
          {t("personalData.mySignsTapPencil")}
        </InfoItem>
        <InfoItem title={t("personalData.account")}>
          {t("personalData.deletingAccountNotPossible")}
        </InfoItem>
      </InfoSection>

      <Button
        variant="ghost"
        accessibilityRole="link"
        iconEnd={(props) => <ExternalLinkIcon {...props} />}
        onPress={() => openWebPage("/privacy")}
      >
        {t("personalData.readFullPolicy")}
      </Button>
    </InfoScreen>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    device: { flexDirection: "row", alignItems: "center", gap: 12 },
    deviceText: { flex: 1 },
    error: { color: colors.destructive },
  })
)
