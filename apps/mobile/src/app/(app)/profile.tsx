import * as React from "react"
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Constants from "expo-constants"
import { router } from "expo-router"
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  GlobeIcon,
  KeyRoundIcon,
  LockIcon,
  LogOutIcon,
  MailIcon,
  PlusIcon,
  ScanLineIcon,
  ShieldIcon,
  SunMoonIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react-native"

import { Button } from "@workspace/ui/native/button"
import { IconButton } from "@workspace/ui/native/icon-button"
import { Field, Input } from "@workspace/ui/native/input"
import { Select } from "@workspace/ui/native/select"
import { Text } from "@workspace/ui/native/text"
import { themed, useColors } from "@workspace/ui/native/theme"
import { radius } from "@workspace/ui/native/tokens"

import { GoogleMark } from "@/components/other-sign-in"
import { PasswordInput } from "@/components/password-input"
import { ScreenHeader } from "@/components/screen-header"
import { ApiError, type LinkedIdentity, type Passkey } from "@/lib/api"
import { api } from "@/lib/client"
import { languages, type MessageKey } from "@/lib/i18n"
import { getGoogleIdToken } from "@/lib/google"
import { createPasskey } from "@/lib/passkeys"
import { authErrorMessage, useSession, useUser } from "@/lib/session"
import {
  useLocale,
  usePreferences,
  useT,
  type Language,
  type ThemeChoice,
} from "@/lib/preferences"
import { StatusBar } from "@/components/status-bar"

// The API accepts passwords of 12 to 128 characters.
const minPasswordLength = 12

type Row = { Icon: LucideIcon; label: MessageKey }

// Labels are translation keys: they are translated where they are shown.
const helpRows: (Row & {
  to: "/help" | "/personal-data" | "/rules?review=1"
})[] = [
  { Icon: CircleHelpIcon, label: "common.helpContact", to: "/help" },
  {
    Icon: ScanLineIcon,
    label: "common.photoRules",
    to: "/rules?review=1",
  },
  { Icon: ShieldIcon, label: "common.personalData", to: "/personal-data" },
]

// Each language under its own name, whatever the app's language is.
const languageOptions = (Object.keys(languages) as Language[]).map((value) => ({
  value,
  label: languages[value].label,
}))

const themes: { value: ThemeChoice; label: MessageKey }[] = [
  { value: "system", label: "profile.system" },
  { value: "light", label: "profile.light" },
  { value: "dark", label: "profile.dark" },
]

export default function Profile() {
  const t = useT()
  const colors = useColors()
  const styles = useStyles()
  const insets = useSafeAreaInsets()
  const { signOut } = useSession()
  const { language, setLanguage, theme, setTheme } = usePreferences()
  // Null until loaded, and when the list could not be read.
  const [identities, setIdentities] = React.useState<LinkedIdentity[] | null>(
    null
  )
  const [editing, setEditing] = React.useState<
    "email" | "password" | "google" | "passkeys" | "language" | "theme" | null
  >(null)
  const user = useUser()
  const [signCount, setSignCount] = React.useState<number | null>(null)

  React.useEffect(() => {
    let cancelled = false
    api
      .identities()
      .then((loaded) => !cancelled && setIdentities(loaded))
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])
  const google = identities?.find(({ provider }) => provider === "google")

  React.useEffect(() => {
    let cancelled = false
    api
      .signCount(user.id)
      .then((count) => !cancelled && setSignCount(count))
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [user.id])

  return (
    <View style={styles.screen}>
      <StatusBar />
      <ScreenHeader
        title={t("profile.myProfile")}
        backLabel={t("profile.backMySigns")}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View
          accessibilityLabel={t("profile.identity")}
          style={styles.identity}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{user.initials}</Text>
          </View>
          <View style={styles.identityText}>
            <Text variant="h3">{user.name}</Text>
            <Text variant="muted" style={styles.email}>
              {user.email}
            </Text>
            {signCount !== null && (
              <Text variant="muted">
                {t("profile.signsRecorded", { count: signCount })}
              </Text>
            )}
          </View>
        </View>

        <Section title={t("profile.account")}>
          <ValueRow
            Icon={MailIcon}
            label={t("common.emailAddress")}
            value=""
            onPress={() => setEditing("email")}
          />
        </Section>

        {/* The ways to sign in to this account. */}
        <Section title={t("profile.signMethods")}>
          <ValueRow
            Icon={LockIcon}
            label={t("common.password")}
            value={t("profile.change")}
            onPress={() => setEditing("password")}
          />
          <ValueRow
            icon={<GoogleMark size={20} />}
            label="Google"
            value={
              identities === null
                ? ""
                : google
                  ? (google.email ?? t("profile.linked"))
                  : t("profile.add")
            }
            divider
            onPress={() => setEditing("google")}
          />
          <ValueRow
            Icon={KeyRoundIcon}
            label={t("profile.passkeys")}
            value={t("profile.manage")}
            divider
            onPress={() => setEditing("passkeys")}
          />
        </Section>

        <Section title={t("profile.preferences")}>
          <ValueRow
            Icon={GlobeIcon}
            label={t("profile.language")}
            value={languages[language].label}
            onPress={() => setEditing("language")}
          />
          <ValueRow
            Icon={SunMoonIcon}
            label={t("profile.theme")}
            value={t(themes.find(({ value }) => value === theme)!.label)}
            divider
            onPress={() => setEditing("theme")}
          />
        </Section>

        <Section title={t("profile.help")}>
          <LinkRows rows={helpRows} />
        </Section>

        <Button
          variant="secondary"
          icon={(props) => <LogOutIcon {...props} />}
          style={styles.logout}
          onPress={signOut}
        >
          {t("profile.signOut")}
        </Button>
        <Text variant="muted" style={styles.version}>
          {t("common.version", {
            version: Constants.expoConfig?.version ?? "",
          })}
        </Text>
      </ScrollView>

      {editing === "email" && <EmailForm onClose={() => setEditing(null)} />}
      {editing === "password" && (
        <PasswordForm onClose={() => setEditing(null)} />
      )}
      {editing === "google" && (
        <GoogleForm
          identity={google}
          onChange={(linked) =>
            setIdentities((current) => [
              ...(current ?? []).filter(
                ({ provider }) => provider !== "google"
              ),
              ...(linked ? [linked] : []),
            ])
          }
          onClose={() => setEditing(null)}
        />
      )}
      {editing === "passkeys" && (
        <PasskeysForm onClose={() => setEditing(null)} />
      )}
      {editing === "language" && (
        <ChoiceForm
          title={t("profile.language")}
          value={language}
          options={languageOptions}
          onSave={setLanguage}
          onClose={() => setEditing(null)}
        />
      )}
      {editing === "theme" && (
        <ChoiceForm
          title={t("profile.theme")}
          value={theme}
          options={themes.map(({ value, label }) => ({
            value,
            label: t(label),
          }))}
          onSave={setTheme}
          onClose={() => setEditing(null)}
        />
      )}
    </View>
  )
}

// A settings row showing its current value, like the account rows.
function ValueRow({
  Icon,
  icon,
  label,
  value,
  divider = false,
  onPress,
}: {
  // A Lucide icon, or `icon` for anything else (a brand mark).
  Icon?: LucideIcon
  icon?: React.ReactNode
  label: string
  value: string
  divider?: boolean
  onPress: () => void
}) {
  const colors = useColors()
  const styles = useStyles()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={({ pressed }) => [
        styles.row,
        divider && styles.rowDivider,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      {Icon ? <Icon color={colors.mutedForeground} size={20} /> : icon}
      <Text style={styles.rowLabel}>{label}</Text>
      {value !== "" && (
        <Text variant="muted" style={styles.rowValue}>
          {value}
        </Text>
      )}
      <ChevronRightIcon color={colors.input} size={18} />
    </Pressable>
  )
}

// A small form shown over the screen, closed by its backdrop or by "Annuler".
function FormSheet({
  title,
  error,
  submitLabel,
  pending = false,
  onSubmit,
  onClose,
  children,
}: {
  title: string
  error?: string | null
  // Without a submit action the sheet only has its close button.
  submitLabel?: string
  pending?: boolean
  onSubmit?: () => void
  onClose: () => void
  children: React.ReactNode
}) {
  const styles = useStyles()
  const t = useT()

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel={t("common.cancel")}
        style={styles.backdrop}
        onPress={onClose}
      />
      <View style={styles.formHolder} pointerEvents="box-none">
        <View accessibilityViewIsModal style={styles.form}>
          <Text variant="h3" accessibilityRole="header">
            {title}
          </Text>
          {children}
          {error && (
            <Text
              accessibilityRole="alert"
              variant="label"
              style={styles.error}
            >
              {error}
            </Text>
          )}
          <View style={styles.formActions}>
            <Button variant="ghost" onPress={onClose}>
              {onSubmit ? t("common.cancel") : t("common.close")}
            </Button>
            {onSubmit && (
              <Button disabled={pending} onPress={onSubmit}>
                {submitLabel}
              </Button>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

// One dropdown, applied on "Enregistrer".
function ChoiceForm<Value extends string>({
  title,
  value,
  options,
  onSave,
  onClose,
}: {
  title: string
  value: Value
  options: { value: Value; label: string }[]
  onSave: (value: Value) => void
  onClose: () => void
}) {
  const t = useT()
  const [choice, setChoice] = React.useState(value)

  return (
    <FormSheet
      title={title}
      submitLabel={t("common.save")}
      onSubmit={() => {
        onSave(choice)
        onClose()
      }}
      onClose={onClose}
    >
      <Select
        label={title}
        value={choice}
        options={options}
        onChange={setChoice}
        chevronIcon={(props) => <ChevronDownIcon {...props} />}
        checkIcon={(props) => <CheckIcon {...props} />}
      />
    </FormSheet>
  )
}

// The translation key of the message for what can go wrong when changing the
// email or the password.
function accountErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return "profile.changeNotAvailableServer"
    }
    switch (error.code) {
      case "network":
        return "errors.serverCantReachedCheck"
      case "invalid_credentials":
        return "profile.currentPasswordWrong"
      case "invalid_password":
        return "errors.passwordLength"
      case "invalid_code":
      case "challenge_expired":
      case "too_many_attempts":
        return "errors.codeNoLongerValid"
      case "step_up_required":
        return "errors.securitySignAgainRetry"
    }
  }

  return "errors.somethingWentWrongTry"
}

function PasswordForm({ onClose }: { onClose: () => void }) {
  const t = useT()
  const [current, setCurrent] = React.useState("")
  const [next, setNext] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  async function submit() {
    if (!current) {
      setError(t("profile.enterCurrentPassword"))
      return
    }
    if (next.length < minPasswordLength) {
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
      await api.changePassword(current, next)
      onClose()
    } catch (caught) {
      setError(t(accountErrorMessage(caught)))
      setPending(false)
    }
  }

  return (
    <FormSheet
      title={t("common.changePassword")}
      error={error}
      submitLabel={pending ? t("common.saving") : t("common.save")}
      pending={pending}
      onSubmit={submit}
      onClose={onClose}
    >
      <Field label={t("profile.currentPassword")}>
        <PasswordInput
          autoComplete="current-password"
          value={current}
          onChangeText={setCurrent}
        />
      </Field>
      <Field
        label={t("common.newPassword")}
        hint={t("common.charactersLeast", { count: minPasswordLength })}
      >
        <PasswordInput
          autoComplete="new-password"
          value={next}
          onChangeText={setNext}
        />
      </Field>
    </FormSheet>
  )
}

// Two steps: ask for the new address, then for the code sent to it.
function EmailForm({ onClose }: { onClose: () => void }) {
  const t = useT()
  const { setEmail: storeEmail } = useSession()
  const [email, setEmail] = React.useState("")
  const [challengeId, setChallengeId] = React.useState<string | null>(null)
  const [code, setCode] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  async function submit() {
    setError(null)
    if (!challengeId && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(t("common.enterValidEmailAddress"))
      return
    }
    if (challengeId && code.length !== 6) {
      setError(t("common.enterCode"))
      return
    }
    setPending(true)
    try {
      if (!challengeId) {
        const challenge = await api.startEmailChange(email.trim())
        setChallengeId(challenge.challenge_id)
        setPending(false)
      } else {
        await api.verifyEmailChange(challengeId, code)
        await storeEmail(email.trim())
        onClose()
      }
    } catch (caught) {
      setError(t(accountErrorMessage(caught)))
      setPending(false)
    }
  }

  return (
    <FormSheet
      title={t("profile.changeEmailAddress")}
      error={error}
      submitLabel={challengeId ? t("common.confirm") : t("common.sendCode")}
      pending={pending}
      onSubmit={submit}
      onClose={onClose}
    >
      {challengeId ? (
        <Field
          label={t("common.verificationCode")}
          hint={t("common.enterCodeSentTo", {
            email: email.trim(),
          })}
        >
          <Input
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, ""))}
          />
        </Field>
      ) : (
        <Field
          label={t("profile.newEmailAddress")}
          hint={t("profile.verificationCodeSent")}
        >
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
      )}
    </FormSheet>
  )
}

// Google as a sign-in method: links it to the account through the native
// Google dialog, or removes it. Both need a recent login.
function GoogleForm({
  identity,
  onChange,
  onClose,
}: {
  identity: LinkedIdentity | undefined
  onChange: (identity: LinkedIdentity | null) => void
  onClose: () => void
}) {
  const t = useT()
  const user = useUser()
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  async function link() {
    setError(null)
    setPending(true)
    try {
      const { nonce } = await api.googleNonce()
      const idToken = await getGoogleIdToken(nonce)
      onChange(await api.linkGoogle(idToken, nonce))
    } catch (caught) {
      setError(t(authErrorMessage(caught)))
    }
    setPending(false)
  }

  async function unlink() {
    setError(null)
    setPending(true)
    try {
      await api.deleteIdentity(identity!.id)
      onChange(null)
    } catch (caught) {
      setError(t(authErrorMessage(caught)))
    }
    setPending(false)
  }

  return (
    <FormSheet title="Google" error={error} onClose={onClose}>
      {identity ? (
        <>
          <Text variant="muted">
            {identity.email
              ? t("profile.googleLinkedWithEmail", {
                  email: identity.email,
                })
              : t("profile.googleLinked")}
          </Text>
          <Button variant="destructive" disabled={pending} onPress={unlink}>
            {t("profile.removeGoogle")}
          </Button>
        </>
      ) : (
        <>
          <Text variant="muted">
            {t("profile.linkGoogleAccountSame", { email: user.email })}
          </Text>
          <Button
            variant="secondary"
            icon={() => <GoogleMark size={18} />}
            disabled={pending}
            onPress={link}
          >
            {pending
              ? t("profile.connectingGoogle")
              : t("profile.linkMyGoogleAccount")}
          </Button>
        </>
      )}
    </FormSheet>
  )
}

// The account's passkeys: list them, add one on this device, remove one.
function PasskeysForm({ onClose }: { onClose: () => void }) {
  const t = useT()
  const colors = useColors()
  const styles = useStyles()
  const locale = useLocale()
  const [passkeys, setPasskeys] = React.useState<Passkey[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const dateFormat = React.useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
    [locale]
  )

  React.useEffect(() => {
    let cancelled = false
    api
      .passkeys()
      .then((loaded) => !cancelled && setPasskeys(loaded))
      .catch((caught) => !cancelled && setError(t(authErrorMessage(caught))))

    return () => {
      cancelled = true
    }
  }, [t])

  async function add() {
    setError(null)
    setPending(true)
    try {
      const { options, blob } = await api.startPasskeyRegistration()
      const credential = await createPasskey(options.publicKey)
      // Named after the device it lives on, to tell passkeys apart.
      const label = Platform.select({
        ios: "iPhone",
        android: "Android",
        default: t("profile.browser"),
      })
      const created = await api.finishPasskeyRegistration(
        blob,
        credential,
        label
      )
      setPasskeys((current) => [...(current ?? []), created])
    } catch (caught) {
      setError(t(authErrorMessage(caught)))
    }
    setPending(false)
  }

  async function remove(passkey: Passkey) {
    setError(null)
    try {
      await api.deletePasskey(passkey.id)
      setPasskeys((current) =>
        (current ?? []).filter((other) => other.id !== passkey.id)
      )
    } catch (caught) {
      setError(t(authErrorMessage(caught)))
    }
  }

  return (
    <FormSheet title={t("profile.passkeys")} error={error} onClose={onClose}>
      <Text variant="muted">{t("profile.passkeyLetsSignDevices")}</Text>
      {passkeys === null && !error && (
        <Text variant="muted">{t("common.loading")}</Text>
      )}
      {passkeys?.length === 0 && (
        <Text variant="muted">{t("profile.noPasskeyAccount")}</Text>
      )}
      {passkeys && passkeys.length > 0 && (
        <View style={styles.passkeys}>
          {passkeys.map((passkey, index) => (
            <View
              key={passkey.id}
              style={[styles.passkey, index > 0 && styles.rowDivider]}
            >
              <KeyRoundIcon color={colors.mutedForeground} size={20} />
              <View style={styles.rowLabel}>
                <Text>{passkey.label || t("profile.passkey")}</Text>
                <Text variant="muted">
                  {t("profile.passkeyAddedOn", {
                    date: dateFormat.format(
                      new Date(passkey.created_at * 1000)
                    ),
                  })}
                  {passkey.last_used_at !== null &&
                    " · " +
                      t("profile.passkeyUsedOn", {
                        date: dateFormat.format(
                          new Date(passkey.last_used_at * 1000)
                        ),
                      })}
                </Text>
              </View>
              <IconButton
                label={t("profile.deletePasskey", {
                  label: passkey.label ?? "",
                })}
                color={colors.destructive}
                icon={(props) => <Trash2Icon {...props} />}
                onPress={() => remove(passkey)}
              />
            </View>
          ))}
        </View>
      )}
      <Button
        variant="secondary"
        icon={(props) => <PlusIcon {...props} />}
        disabled={pending}
        onPress={add}
      >
        {t("profile.addPasskey")}
      </Button>
    </FormSheet>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const styles = useStyles()

  return (
    <View style={styles.section}>
      <Text
        variant="overline"
        accessibilityRole="header"
        style={styles.sectionTitle}
      >
        {title}
      </Text>
      <View style={styles.group}>{children}</View>
    </View>
  )
}

function LinkRows({ rows }: { rows: typeof helpRows }) {
  const colors = useColors()
  const styles = useStyles()
  const t = useT()

  return rows.map(({ Icon, label, to }, index) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      onPress={() => router.push(to)}
      style={({ pressed }) => [
        styles.row,
        index > 0 && styles.rowDivider,
        pressed && styles.pressed,
      ]}
    >
      <Icon color={colors.mutedForeground} size={20} />
      <Text style={styles.rowLabel}>{t(label)}</Text>
      <ChevronRightIcon color={colors.input} size={18} />
    </Pressable>
  ))
}

const useStyles = themed((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.canvas },
    content: { padding: 16, gap: 16 },
    identity: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      padding: 16,
      borderRadius: radius.xl,
      backgroundColor: colors.card,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.blue,
    },
    avatarLabel: { color: colors.white, fontSize: 22, fontWeight: "700" },
    identityText: { flex: 1, gap: 2 },
    email: { fontSize: 14 },
    section: { gap: 8 },
    sectionTitle: { marginHorizontal: 4 },
    group: {
      overflow: "hidden",
      borderRadius: radius.lg,
      backgroundColor: colors.card,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 56,
      paddingHorizontal: 16,
    },
    rowDivider: { borderTopWidth: 1, borderTopColor: colors.muted },
    pressed: { backgroundColor: colors.muted },
    rowLabel: { flex: 1 },
    passkeys: {
      overflow: "hidden",
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    passkey: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 8,
      paddingLeft: 12,
    },
    rowValue: { fontSize: 14 },
    backdrop: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: "rgba(30, 35, 44, 0.55)",
    },
    formHolder: { flex: 1, justifyContent: "center", padding: 20 },
    form: {
      gap: 16,
      padding: 20,
      borderRadius: radius.xl,
      backgroundColor: colors.card,
    },
    error: { color: colors.destructive },
    formActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
    logout: { height: 52, backgroundColor: colors.card },
    version: { textAlign: "center", fontSize: 12 },
  })
)
