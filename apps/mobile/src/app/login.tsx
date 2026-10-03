import * as React from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { router, useLocalSearchParams } from "expo-router"

import { Button } from "@workspace/ui/native/button"
import { Field, Input } from "@workspace/ui/native/input"
import { Text } from "@workspace/ui/native/text"
import { themed, useColors } from "@workspace/ui/native/theme"

import { AuthShell } from "@/components/auth-shell"
import { OtherSignIn } from "@/components/other-sign-in"
import { PasswordInput } from "@/components/password-input"
import { firstScreen } from "@/lib/permissions"
import { authErrorMessage, useSession } from "@/lib/session"
import { useT } from "@/lib/preferences"

export default function Login() {
  const t = useT()
  const styles = useStyles()
  const { signIn, signInWithGoogle, signInWithPasskey } = useSession()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const [otherPending, setOtherPending] = React.useState(false)

  // Google and passkey sign-ins share the same steps around the dialog.
  async function signInWith(method: () => Promise<void>) {
    setError(null)
    setOtherPending(true)
    try {
      await method()
      const next = await firstScreen()
      router.dismissAll()
      router.replace(next)
    } catch (caught) {
      setError(t(authErrorMessage(caught)))
      setOtherPending(false)
    }
  }
  // Set by the password reset screen on its way back here.
  const { notice } = useLocalSearchParams<{ notice?: string }>()

  async function submit() {
    if (!email.trim() || !password) {
      setError(t("Saisissez votre adresse e-mail et votre mot de passe."))
      return
    }
    setError(null)
    setPending(true)
    try {
      const challenge = await signIn(email.trim(), password)
      if (challenge) {
        // The address has to be confirmed first.
        setPending(false)
        router.push({
          pathname: "/verify",
          params: { email: email.trim(), challenge },
        })
        return
      }
      const next = await firstScreen()
      // Drop the welcome screen from the stack before moving on.
      router.dismissAll()
      router.replace(next)
    } catch (caught) {
      setError(t(authErrorMessage(caught)))
      setPending(false)
    }
  }

  return (
    <AuthShell>
      <View style={styles.intro}>
        <Text variant="h1" accessibilityRole="header">
          {t("Connexion")}
        </Text>
        <Text style={styles.muted}>
          {t("Connectez-vous pour recenser des panneaux.")}
        </Text>
      </View>

      <Field label={t("Adresse e-mail")}>
        <Input
          placeholder="prenom.nom@exemple.fr"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />
      </Field>

      <Field label={t("Mot de passe")}>
        <PasswordInput
          autoComplete="current-password"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={submit}
        />
        <Pressable
          accessibilityRole="link"
          style={styles.forgot}
          onPress={() =>
            router.push({
              pathname: "/reset-password",
              params: { email: email.trim() },
            })
          }
        >
          <Text variant="label" style={styles.link}>
            {t("Mot de passe oublié ?")}
          </Text>
        </Pressable>
      </Field>

      {notice === "password-changed" && !error && (
        <Text accessibilityRole="alert" variant="label">
          {t("Mot de passe modifié. Connectez-vous avec le nouveau.")}
        </Text>
      )}
      {error && (
        <Text accessibilityRole="alert" variant="label" style={styles.error}>
          {error}
        </Text>
      )}

      <Button size="lg" disabled={pending} onPress={submit}>
        {pending ? t("Connexion…") : t("Se connecter")}
      </Button>

      <OtherSignIn
        onGoogle={() => signInWith(signInWithGoogle)}
        onPasskey={() => signInWith(signInWithPasskey)}
        pending={otherPending}
      />

      <Text style={[styles.muted, styles.footer]}>
        {t("Pas encore de compte ?")}{" "}
        <Text
          accessibilityRole="link"
          style={styles.footerLink}
          onPress={() => router.replace("/signup")}
        >
          {t("Créer un compte")}
        </Text>
      </Text>
    </AuthShell>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    intro: { gap: 6 },
    muted: { color: colors.mutedForeground },
    forgot: { alignSelf: "flex-end", paddingVertical: 6 },
    link: { color: colors.link },
    error: { color: colors.destructive },
    footer: { marginTop: "auto", textAlign: "center", fontSize: 15 },
    footerLink: { color: colors.link, fontSize: 15, fontWeight: "600" },
  })
)
