import * as React from "react"
import { StyleSheet, View } from "react-native"
import { LogOutIcon, SmartphoneIcon } from "lucide-react-native"

import { Button } from "@workspace/ui/native/button"
import { Text } from "@workspace/ui/native/text"
import { themed, useColors } from "@workspace/ui/native/theme"

import { InfoItem, InfoScreen, InfoSection } from "@/components/info"
import type { ActiveSession } from "@/lib/api"
import { api } from "@/lib/client"
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
      title={t("Données personnelles")}
      backLabel={t("Retour à mon profil")}
    >
      <InfoSection title={t("Ce que l'application enregistre")}>
        <InfoItem title={t("Votre compte")}>
          {t(
            "Votre adresse e-mail, votre nom affiché et la façon dont vous vous connectez (mot de passe, Google, clé d'accès). Le mot de passe n'est jamais conservé en clair."
          )}
        </InfoItem>
        <InfoItem title={t("Vos panneaux")}>
          {t(
            "Pour chaque panneau : la photo, la position, l'intitulé, les tags, le commentaire et la date d'ajout."
          )}
        </InfoItem>
        <InfoItem title={t("Vos connexions")}>
          {t(
            "Les appareils sur lesquels vous êtes connecté, avec la date de connexion, pour que vous puissiez les déconnecter."
          )}
        </InfoItem>
      </InfoSection>

      <InfoSection title={t("Ce qui est visible par tous")}>
        <InfoItem>
          {t(
            "Les panneaux que vous publiez sont publics : photo, position, intitulé, tags, commentaire et votre nom affiché. Votre adresse e-mail n'est jamais montrée."
          )}
        </InfoItem>
        <InfoItem>
          {t(
            "Votre propre position n'est pas enregistrée : seule la position du panneau que vous publiez l'est."
          )}
        </InfoItem>
      </InfoSection>

      <InfoSection title={t("Services extérieurs")}>
        <InfoItem title="OpenStreetMap">
          {t(
            "Le fond de carte est chargé depuis OpenStreetMap. La recherche d'un lieu et le tag de commune lui envoient le texte cherché ou la position du panneau."
          )}
        </InfoItem>
        <InfoItem title="Google">
          {t(
            "Seulement si vous choisissez « Continuer avec Google » : Google confirme alors votre identité et votre adresse e-mail."
          )}
        </InfoItem>
      </InfoSection>

      <InfoSection title={t("Appareils connectés")}>
        {devices === null && !error && (
          <Text variant="muted">{t("Chargement…")}</Text>
        )}
        {devices?.map((device) => (
          <View key={device.id} style={styles.device}>
            <SmartphoneIcon color={colors.mutedForeground} size={20} />
            <View style={styles.deviceText}>
              <Text>
                {device.current
                  ? t("Cet appareil")
                  : device.device_label || t("Autre appareil")}
              </Text>
              <Text variant="muted">
                {t("Connecté le {date}", {
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
                {t("Déconnecter")}
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
          {t("Se déconnecter partout")}
        </Button>
      </InfoSection>

      <InfoSection title={t("Supprimer vos données")}>
        <InfoItem title={t("Un panneau")}>
          {t(
            "Dans « Mes panneaux », touchez le crayon puis « Supprimer le panneau ». Il est retiré de la carte."
          )}
        </InfoItem>
        <InfoItem title={t("Votre compte")}>
          {t(
            "La suppression du compte n'est pas encore possible depuis l'application. Écrivez-nous depuis « Aide et contact » pour la demander."
          )}
        </InfoItem>
      </InfoSection>
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
