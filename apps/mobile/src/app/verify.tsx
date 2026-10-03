import * as React from "react"
import { StyleSheet, View } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { MailIcon } from "lucide-react-native"

import { Button } from "@workspace/ui/native/button"
import { Text } from "@workspace/ui/native/text"
import { themed, useColors } from "@workspace/ui/native/theme"

import { AuthShell } from "@/components/auth-shell"
import { CodeInput, codeLength } from "@/components/code-input"
import { api } from "@/lib/client"
import { firstScreen } from "@/lib/permissions"
import { useT } from "@/lib/preferences"
import { authErrorMessage, useSession } from "@/lib/session"

const resendDelay = 45

// Confirms the email address with the 6-digit code sent after a signup, or
// after a login on an address not confirmed yet. `name` is the display name
// chosen at signup, saved once the account is confirmed.
export default function Verify() {
  const t = useT()
  const colors = useColors()
  const styles = useStyles()
  const { verify } = useSession()
  const params = useLocalSearchParams<{
    email: string
    challenge: string
    name?: string
  }>()
  const [challenge, setChallenge] = React.useState(params.challenge)
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const [seconds, setSeconds] = React.useState(resendDelay)

  React.useEffect(() => {
    if (seconds === 0) {
      return
    }
    const timer = setTimeout(() => setSeconds(seconds - 1), 1000)

    return () => clearTimeout(timer)
  }, [seconds])

  // `entered` is passed when the last digit has just been typed: the state
  // does not hold it yet.
  async function submit(entered = code) {
    if (pending) {
      return
    }
    if (entered.length !== codeLength) {
      setError(t("Saisissez le code à 6 chiffres."))
      return
    }
    setError(null)
    setPending(true)
    try {
      await verify(challenge, entered, params.name || undefined)
      const next = await firstScreen()
      // Drop the onboarding screens from the stack before moving on.
      router.dismissAll()
      router.replace(next)
    } catch (caught) {
      setError(t(authErrorMessage(caught)))
      setPending(false)
    }
  }

  async function resend() {
    setError(null)
    setCode("")
    try {
      // A fresh code for the same address; confirming it signs in the same.
      setChallenge((await api.startEmailLogin(params.email)).challenge_id)
      setSeconds(resendDelay)
    } catch (caught) {
      setError(t(authErrorMessage(caught)))
    }
  }

  return (
    <AuthShell step={params.name ? t("Étape 2 / 3") : undefined}>
      <View style={styles.icon}>
        <MailIcon color={colors.link} size={34} />
      </View>

      <View style={styles.intro}>
        <Text variant="h1" accessibilityRole="header">
          {t("Vérifiez votre e-mail")}
        </Text>
        <Text style={styles.muted}>
          {t("Saisissez le code à 6 chiffres envoyé à {email}.", {
            email: params.email,
          })}
        </Text>
      </View>

      <CodeInput
        label={t("Code de vérification")}
        value={code}
        // The last digit submits the code: no need to press the button.
        onChange={(next) => {
          setCode(next)
          if (next.length === codeLength && next !== code) {
            submit(next)
          }
        }}
      />

      {error && (
        <Text accessibilityRole="alert" variant="label" style={styles.error}>
          {error}
        </Text>
      )}

      <Text style={[styles.muted, styles.resend]}>
        {t("Pas reçu ?")}{" "}
        {seconds > 0 ? (
          t("Renvoyer le code dans 0:{seconds}", {
            seconds: String(seconds).padStart(2, "0"),
          })
        ) : (
          <Text accessibilityRole="button" style={styles.link} onPress={resend}>
            {t("Renvoyer le code")}
          </Text>
        )}
      </Text>

      <Button size="lg" disabled={pending} onPress={() => submit()}>
        {pending ? t("Vérification…") : t("Valider")}
      </Button>

      <Text
        accessibilityRole="link"
        style={[styles.link, styles.footer]}
        onPress={() => router.back()}
      >
        {t("Modifier l'adresse e-mail")}
      </Text>
    </AuthShell>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    icon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
    },
    intro: { gap: 8 },
    muted: { color: colors.mutedForeground },
    error: { color: colors.destructive },
    resend: { fontSize: 15 },
    link: { color: colors.link, fontSize: 15, fontWeight: "600" },
    footer: { marginTop: "auto", textAlign: "center" },
  })
)
