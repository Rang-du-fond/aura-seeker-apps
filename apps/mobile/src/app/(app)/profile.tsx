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
import { getGoogleIdToken } from "@/lib/google"
import { createPasskey } from "@/lib/passkeys"
import { authErrorMessage, useSession, useUser } from "@/lib/session"
import {
  useCount,
  useLocale,
  usePreferences,
  useT,
  type Language,
  type ThemeChoice,
} from "@/lib/preferences"
import { StatusBar } from "@/components/status-bar"

// The API accepts passwords of 12 to 128 characters.
const minPasswordLength = 12

type Row = { Icon: LucideIcon; label: string }

// Labels are French: they are translated where they are shown.
const helpRows: (Row & { to: "/help" | "/personal-data" })[] = [
  { Icon: CircleHelpIcon, label: "Aide et contact", to: "/help" },
  { Icon: ShieldIcon, label: "Données personnelles", to: "/personal-data" },
]

const languages: { value: Language; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
]

const themes: { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "Système" },
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
]

export default function Profile() {
  const t = useT()
  const colors = useColors()
  const styles = useStyles()
  const insets = useSafeAreaInsets()
  const { signOut } = useSession()
  const { language, setLanguage, theme, setTheme } = usePreferences()
  const count = useCount()
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
        title={t("Mon profil")}
        backLabel={t("Retour à mes panneaux")}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View accessibilityLabel={t("Identité")} style={styles.identity}>
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
                {count(
                  signCount,
                  "{count} panneau recensé",
                  "{count} panneaux recensés"
                )}
              </Text>
            )}
          </View>
        </View>

        <Section title={t("Compte")}>
          <ValueRow
            Icon={MailIcon}
            label={t("Adresse e-mail")}
            value=""
            onPress={() => setEditing("email")}
          />
        </Section>

        {/* The ways to sign in to this account. */}
        <Section title={t("Méthodes de connexion")}>
          <ValueRow
            Icon={LockIcon}
            label={t("Mot de passe")}
            value={t("Modifier")}
            onPress={() => setEditing("password")}
          />
          <ValueRow
            icon={<GoogleMark size={20} />}
            label="Google"
            value={
              identities === null
                ? ""
                : google
                  ? (google.email ?? t("Relié"))
                  : t("Ajouter")
            }
            divider
            onPress={() => setEditing("google")}
          />
          <ValueRow
            Icon={KeyRoundIcon}
            label={t("Clés d'accès")}
            value={t("Gérer")}
            divider
            onPress={() => setEditing("passkeys")}
          />
        </Section>

        <Section title={t("Préférences")}>
          <ValueRow
            Icon={GlobeIcon}
            label={t("Langue")}
            value={languages.find(({ value }) => value === language)!.label}
            onPress={() => setEditing("language")}
          />
          <ValueRow
            Icon={SunMoonIcon}
            label={t("Thème")}
            value={t(themes.find(({ value }) => value === theme)!.label)}
            divider
            onPress={() => setEditing("theme")}
          />
        </Section>

        <Section title={t("Aide")}>
          <LinkRows rows={helpRows} />
        </Section>

        <Button
          variant="secondary"
          icon={(props) => <LogOutIcon {...props} />}
          style={styles.logout}
          onPress={signOut}
        >
          {t("Se déconnecter")}
        </Button>
        <Text variant="muted" style={styles.version}>
          {t("Version {version}", {
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
          title={t("Langue")}
          value={language}
          options={languages}
          onSave={setLanguage}
          onClose={() => setEditing(null)}
        />
      )}
      {editing === "theme" && (
        <ChoiceForm
          title={t("Thème")}
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
        accessibilityLabel={t("Annuler")}
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
              {onSubmit ? t("Annuler") : t("Fermer")}
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
      submitLabel={t("Enregistrer")}
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

// French text for what can go wrong when changing the email or the password.
function accountErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return "Cette modification n'est pas encore disponible sur le serveur."
    }
    switch (error.code) {
      case "network":
        return "Impossible de joindre le serveur. Vérifiez votre connexion."
      case "invalid_credentials":
        return "Le mot de passe actuel est incorrect."
      case "invalid_password":
        return "Le mot de passe doit contenir entre 12 et 128 caractères."
      case "invalid_code":
      case "challenge_expired":
      case "too_many_attempts":
        return "Ce code n'est plus valable. Demandez-en un nouveau."
      case "step_up_required":
        return "Par sécurité, reconnectez-vous puis réessayez."
    }
  }

  return "Une erreur est survenue. Réessayez dans un instant."
}

function PasswordForm({ onClose }: { onClose: () => void }) {
  const t = useT()
  const [current, setCurrent] = React.useState("")
  const [next, setNext] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  async function submit() {
    if (!current) {
      setError(t("Saisissez votre mot de passe actuel."))
      return
    }
    if (next.length < minPasswordLength) {
      setError(
        t("Le mot de passe doit contenir au moins {count} caractères.", {
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
      title={t("Changer le mot de passe")}
      error={error}
      submitLabel={pending ? t("Enregistrement…") : t("Enregistrer")}
      pending={pending}
      onSubmit={submit}
      onClose={onClose}
    >
      <Field label={t("Mot de passe actuel")}>
        <PasswordInput
          autoComplete="current-password"
          value={current}
          onChangeText={setCurrent}
        />
      </Field>
      <Field
        label={t("Nouveau mot de passe")}
        hint={t("{count} caractères au minimum.", { count: minPasswordLength })}
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
      setError(t("Saisissez une adresse e-mail valide."))
      return
    }
    if (challengeId && code.length !== 6) {
      setError(t("Saisissez le code à 6 chiffres."))
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
      title={t("Changer l'adresse e-mail")}
      error={error}
      submitLabel={challengeId ? t("Valider") : t("Envoyer le code")}
      pending={pending}
      onSubmit={submit}
      onClose={onClose}
    >
      {challengeId ? (
        <Field
          label={t("Code de vérification")}
          hint={t("Saisissez le code à 6 chiffres envoyé à {email}.", {
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
          label={t("Nouvelle adresse e-mail")}
          hint={t("Un code de vérification y sera envoyé.")}
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
              ? t("Vous pouvez vous connecter avec le compte Google {email}.", {
                  email: identity.email,
                })
              : t("Vous pouvez vous connecter avec votre compte Google.")}
          </Text>
          <Button variant="destructive" disabled={pending} onPress={unlink}>
            {t("Retirer Google")}
          </Button>
        </>
      ) : (
        <>
          <Text variant="muted">
            {t(
              "Reliez le compte Google qui a la même adresse e-mail que ce compte ({email}) pour vous connecter sans mot de passe.",
              { email: user.email }
            )}
          </Text>
          <Button
            variant="secondary"
            icon={() => <GoogleMark size={18} />}
            disabled={pending}
            onPress={link}
          >
            {pending ? t("Connexion à Google…") : t("Relier mon compte Google")}
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
        default: t("Navigateur"),
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
    <FormSheet title={t("Clés d'accès")} error={error} onClose={onClose}>
      <Text variant="muted">
        {t(
          "Une clé d'accès permet de se connecter avec l'empreinte, le visage ou le code de l'appareil, sans mot de passe."
        )}
      </Text>
      {passkeys === null && !error && (
        <Text variant="muted">{t("Chargement…")}</Text>
      )}
      {passkeys?.length === 0 && (
        <Text variant="muted">{t("Aucune clé d'accès pour ce compte.")}</Text>
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
                <Text>{passkey.label || t("Clé d'accès")}</Text>
                <Text variant="muted">
                  {t("Ajoutée le {date}", {
                    date: dateFormat.format(
                      new Date(passkey.created_at * 1000)
                    ),
                  })}
                  {passkey.last_used_at !== null &&
                    " · " +
                      t("utilisée le {date}", {
                        date: dateFormat.format(
                          new Date(passkey.last_used_at * 1000)
                        ),
                      })}
                </Text>
              </View>
              <IconButton
                label={t("Supprimer la clé d'accès {label}", {
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
        {t("Ajouter une clé d'accès")}
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
