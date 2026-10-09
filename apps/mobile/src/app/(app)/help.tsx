import { Linking } from "react-native"
import Constants from "expo-constants"
import { MailIcon } from "lucide-react-native"

import { Button } from "@workspace/ui/native/button"
import { Text } from "@workspace/ui/native/text"

import { InfoItem, InfoScreen, InfoSection } from "@/components/info"
import { useT } from "@/lib/preferences"

// Where "contact" writes to: set EXPO_PUBLIC_CONTACT_EMAIL (see
// app.config.ts). Without it the page says so instead of offering a button.
const contactEmail: string | undefined =
  Constants.expoConfig?.extra?.contactEmail

export default function Help() {
  const t = useT()

  return (
    <InfoScreen
      title={t("common.helpContact")}
      backLabel={t("common.backMyProfile")}
    >
      <InfoSection title={t("help.recordingSign")}>
        <InfoItem title={t("help.step1Title")}>{t("help.step1Text")}</InfoItem>
        <InfoItem title={t("help.step2Title")}>{t("help.step2Text")}</InfoItem>
        <InfoItem title={t("help.step3Title")}>{t("help.step3Text")}</InfoItem>
      </InfoSection>

      <InfoSection title={t("help.frequentlyAskedQuestions")}>
        <InfoItem title={t("help.howDoIEdit")}>
          {t("help.mySignsTapPencil")}
        </InfoItem>
        <InfoItem title={t("help.whereDoesTownTag")}>
          {t("help.suggestedAutomaticallySignsPosition")}
        </InfoItem>
        <InfoItem title={t("help.imNotGettingEmail")}>
          {t("help.checkSpamFolderNew")}
        </InfoItem>
        <InfoItem title={t("help.howDoIFind")}>
          {t("help.mapSearchBarLooks")}
        </InfoItem>
      </InfoSection>

      <InfoSection title={t("help.contact")}>
        {contactEmail ? (
          <>
            <InfoItem>{t("help.questionProblemSignReport")}</InfoItem>
            <Button
              variant="secondary"
              icon={(props) => <MailIcon {...props} />}
              onPress={() =>
                Linking.openURL(
                  `mailto:${contactEmail}?subject=${encodeURIComponent(
                    `Aura Seeker ${Constants.expoConfig?.version ?? ""}`
                  )}`
                )
              }
            >
              {t("help.writeEmail")}
            </Button>
          </>
        ) : (
          <InfoItem>{t("help.contactAddressNotSet")}</InfoItem>
        )}
      </InfoSection>

      <InfoSection title={t("help.about")}>
        <InfoItem>{t("help.appNotAffiliatedAuvergne")}</InfoItem>
        <Text variant="muted">
          {t("common.version", {
            version: Constants.expoConfig?.version ?? "",
          })}
        </Text>
      </InfoSection>
    </InfoScreen>
  )
}
