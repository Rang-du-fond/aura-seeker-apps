import * as React from "react"
import { StyleSheet, View } from "react-native"
import { router, useLocalSearchParams } from "expo-router"

import { Button } from "@workspace/ui/native/button"
import { Field, Input } from "@workspace/ui/native/input"
import { Text } from "@workspace/ui/native/text"
import { themed } from "@workspace/ui/native/theme"

import { AuthShell } from "@/components/auth-shell"
import { CodeInput, codeLength } from "@/components/code-input"
import { PasswordInput } from "@/components/password-input"
import { api } from "@/lib/client"
import { useT } from "@/lib/preferences"
import { authErrorMessage } from "@/lib/session"

// The API accepts passwords of 12 to 128 characters.
const minPasswordLength = 12

// Forgotten password, in two steps on one screen: ask for a code by email,
// then set a new password with it. The user logs in afterwards.
export default function ResetPassword() {
  const t = useT()
  const styles = useStyles()
  const params = useLocalSearchParams<{ email?: string }>()
  const [email, setEmail] = React.useState(params.email ?? "")
  const [challenge, setChallenge] = React.useState<string | null>(null)
  const [code, setCode] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  async function sendCode() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(t("common.enterValidEmailAddress"))
      return
    }
    setError(null)
    setPending(true)
    try {
      setChallenge((await api.startPasswordReset(email.trim())).challenge_id)
      setCode("")
    } catch (caught) {
      setError(t(authErrorMessage(caught)))
    }
    setPending(false)
  }

  async function changePassword() {
    if (code.length !== codeLength) {
      setError(t("common.enterCode"))
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
    setError(null)
    setPending(true)
    try {
      await api.completePasswordReset(challenge!, code, password)
      router.dismissTo({
        pathname: "/login",
        params: { notice: "password-changed" },
      })
    } catch (caught) {
      setError(t(authErrorMessage(caught)))
      setPending(false)
    }
  }

  return (
    <AuthShell>
      <View style={styles.intro}>
        <Text variant="h1" accessibilityRole="header">
          {t("resetPassword.forgottenPassword")}
        </Text>
        <Text style={styles.muted}>
          {challenge
            ? t("resetPassword.codeSentIfAccount", { email: email.trim() })
            : t("resetPassword.getCodeEmailChoose")}
        </Text>
      </View>

      {challenge ? (
        <>
          <CodeInput
            label={t("common.verificationCode")}
            value={code}
            onChange={setCode}
          />
          <Field
            label={t("common.newPassword")}
            hint={t("common.charactersLeast", {
              count: minPasswordLength,
            })}
          >
            <PasswordInput
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
            />
          </Field>
        </>
      ) : (
        <Field label={t("common.emailAddress")}>
          <Input
            placeholder="prenom.nom@exemple.fr"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={sendCode}
          />
        </Field>
      )}

      {error && (
        <Text accessibilityRole="alert" variant="label" style={styles.error}>
          {error}
        </Text>
      )}

      <Button
        size="lg"
        disabled={pending}
        onPress={challenge ? changePassword : sendCode}
      >
        {challenge ? t("common.changePassword") : t("common.sendCode")}
      </Button>

      {challenge && (
        <Text
          accessibilityRole="button"
          style={[styles.link, styles.footer]}
          onPress={sendCode}
        >
          {t("common.resendCode")}
        </Text>
      )}
    </AuthShell>
  )
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    intro: { gap: 6 },
    muted: { color: colors.mutedForeground },
    error: { color: colors.destructive },
    link: { color: colors.link, fontSize: 15, fontWeight: "600" },
    footer: { marginTop: "auto", textAlign: "center" },
  })
)
