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
      setError(t("signup.enterDisplayNameEmail"))
      return
    }
    if (password.length < minPasswordLength) {
      setError(
        t("common.passwordMustLeastCharacters", {
          count: minPasswordLength,
        })
      )
      return
    }
    if (!accepted) {
      setError(t("signup.acceptTermsUseContinue"))
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
    <AuthShell step={t("signup.step")}>
      <View style={styles.intro}>
        <Text variant="h1" accessibilityRole="header">
          {t("common.createAccount")}
        </Text>
        <Text style={styles.muted}>{t("signup.accountKeepsTrackSigns")}</Text>
      </View>

      <Field
        label={t("signup.displayName")}
        hint={t("signup.shownSignsRecord")}
      >
        <Input
          autoComplete="nickname"
          value={displayName}
          onChangeText={setDisplayName}
        />
      </Field>

      <Field label={t("common.emailAddress")}>
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
        label={t("common.password")}
        hint={t("common.charactersLeast", { count: minPasswordLength })}
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
        label={t("signup.iAcceptTermsUse")}
        checkIcon={(props) => <CheckIcon {...props} strokeWidth={3} />}
      >
        <Text style={styles.terms}>
          {t("signup.iAccept")}{" "}
          <Text style={[styles.terms, styles.link]}>
            {t("signup.termsUse")}
          </Text>{" "}
          {t("signup.andThe")}{" "}
          <Text style={[styles.terms, styles.link]}>
            {t("signup.privacyPolicy")}
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
        {pending ? t("signup.creatingAccount") : t("signup.createMyAccount")}
      </Button>

      <OtherSignIn
        onGoogle={() => signInWith(signInWithGoogle)}
        onPasskey={() => signInWith(signInWithPasskey)}
        pending={otherPending}
      />

      <Text style={[styles.muted, styles.footer]}>
        {t("signup.alreadyAccount")}{" "}
        <Text
          accessibilityRole="link"
          style={styles.footerLink}
          onPress={() => router.replace("/login")}
        >
          {t("common.signIn")}
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
