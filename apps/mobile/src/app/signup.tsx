import * as React from "react"
import { StyleSheet, View } from "react-native"
import { router } from "expo-router"
import { CheckIcon } from "lucide-react-native"

import { Button } from "@workspace/ui/native/button"
import { Checkbox } from "@workspace/ui/native/checkbox"
import { Field, Input } from "@workspace/ui/native/input"
import { Text } from "@workspace/ui/native/text"
import { themed, useColors } from "@workspace/ui/native/theme"

import { AuthShell } from "@/components/auth-shell"
import { OtherSignIn } from "@/components/other-sign-in"
import { PasswordInput } from "@/components/password-input"
import { firstScreen } from "@/lib/permissions"
import { authErrorMessage, useSession } from "@/lib/session"
import { useT } from "@/lib/preferences"

// The API accepts passwords of 12 to 128 characters.
const minPasswordLength = 12

export default function Signup() {
  const t = useT()
  const styles = useStyles()
  const { signUp, signInWithGoogle, signInWithPasskey } = useSession()
  const [displayName, setDisplayName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [accepted, setAccepted] = React.useState(false)
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

  async function submit() {
    if (!displayName.trim() || !email.trim()) {
      setError(t("Renseignez votre nom affiché et votre adresse e-mail."))
      return
    }
    if (password.length < minPasswordLength) {
      setError(
        t("Le mot de passe doit contenir au moins {count} caractères.", {
          count: minPasswordLength,
        })
      )
      return
    }
    if (!accepted) {
      setError(t("Acceptez les conditions d'utilisation pour continuer."))
      return
    }
    setError(null)
    setPending(true)
    try {
      const challenge = await signUp(email.trim(), password)
      setPending(false)
      router.push({
        pathname: "/verify",
        params: {
          email: email.trim(),
          challenge,
          name: displayName.trim(),
        },
      })
    } catch (caught) {
      setError(t(authErrorMessage(caught)))
      setPending(false)
    }
  }

  return (
    <AuthShell step={t("Étape 1 / 3")}>
      <View style={styles.intro}>
        <Text variant="h1" accessibilityRole="header">
          {t("Créer un compte")}
        </Text>
        <Text style={styles.muted}>
          {t("Votre compte permet de retrouver vos panneaux.")}
        </Text>
      </View>

      <Field
        label={t("Nom affiché")}
        hint={t("Visible sur les panneaux que vous recensez.")}
      >
        <Input
          autoComplete="nickname"
          value={displayName}
          onChangeText={setDisplayName}
        />
      </Field>

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

      <Field
        label={t("Mot de passe")}
        hint={t("{count} caractères au minimum.", { count: minPasswordLength })}
      >
        <PasswordInput
          autoComplete="new-password"
          value={password}
          onChangeText={setPassword}
        />
      </Field>

      <Checkbox
        checked={accepted}
        onCheckedChange={setAccepted}
        label={t(
          "J'accepte les conditions d'utilisation et la politique de confidentialité"
        )}
        checkIcon={(props) => <CheckIcon {...props} strokeWidth={3} />}
      >
        <Text style={styles.terms}>
          {t("J'accepte les")}{" "}
          <Text style={[styles.terms, styles.link]}>
            {t("conditions d'utilisation")}
          </Text>{" "}
          {t("et la")}{" "}
          <Text style={[styles.terms, styles.link]}>
            {t("politique de confidentialité")}
          </Text>
          .
        </Text>
      </Checkbox>

      {error && (
        <Text accessibilityRole="alert" variant="label" style={styles.error}>
          {error}
        </Text>
      )}

      <Button size="lg" disabled={pending} onPress={submit}>
        {pending ? t("Création du compte…") : t("Créer mon compte")}
      </Button>

      <OtherSignIn
        onGoogle={() => signInWith(signInWithGoogle)}
        onPasskey={() => signInWith(signInWithPasskey)}
        pending={otherPending}
      />

      <Text style={[styles.muted, styles.footer]}>
        {t("Déjà un compte ?")}{" "}
        <Text
          accessibilityRole="link"
          style={styles.footerLink}
          onPress={() => router.replace("/login")}
        >
          {t("Se connecter")}
        </Text>
      </Text>
    </AuthShell>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    intro: { gap: 6 },
    muted: { color: colors.mutedForeground },
    terms: { fontSize: 14, lineHeight: 20 },
    link: { color: colors.link, textDecorationLine: "underline" },
    error: { color: colors.destructive },
    footer: { marginTop: "auto", textAlign: "center", fontSize: 15 },
    footerLink: { color: colors.link, fontSize: 15, fontWeight: "600" },
  })
)
