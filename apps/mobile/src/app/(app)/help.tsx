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
      title={t("Aide et contact")}
      backLabel={t("Retour à mon profil")}
    >
      <InfoSection title={t("Recenser un panneau")}>
        <InfoItem title={t("1. Photographiez")}>
          {t(
            "Touchez le bouton appareil photo en bas de l'écran et cadrez le panneau en entier. Vous pouvez aussi choisir une photo de votre galerie."
          )}
        </InfoItem>
        <InfoItem title={t("2. Vérifiez la position")}>
          {t(
            "La position vient du GPS du téléphone. Si elle est décalée, touchez « Ajuster » et déplacez la carte pour placer le repère sur le panneau."
          )}
        </InfoItem>
        <InfoItem title={t("3. Décrivez et publiez")}>
          {t(
            "Donnez un intitulé, choisissez des tags, ajoutez un commentaire si vous voulez. Le panneau apparaît aussitôt sur la carte."
          )}
        </InfoItem>
      </InfoSection>

      <InfoSection title={t("Questions fréquentes")}>
        <InfoItem title={t("Comment modifier ou supprimer un panneau ?")}>
          {t(
            "Dans « Mes panneaux », touchez le crayon à droite du panneau. Vous pouvez changer son intitulé, ses tags et son commentaire, ou le supprimer."
          )}
        </InfoItem>
        <InfoItem title={t("D'où vient le tag de la commune ?")}>
          {t(
            "Il est proposé automatiquement à partir de la position du panneau. S'il est faux, retirez-le comme n'importe quel tag."
          )}
        </InfoItem>
        <InfoItem title={t("Je ne reçois pas le code par e-mail.")}>
          {t(
            "Regardez dans les courriers indésirables. Un nouveau code peut être demandé après 45 secondes ; seul le dernier reçu est valable."
          )}
        </InfoItem>
        <InfoItem title={t("Comment retrouver un panneau ?")}>
          {t(
            "Sur la carte, la barre de recherche cherche dans les intitulés, propose des tags, et permet de chercher autour d'un lieu."
          )}
        </InfoItem>
      </InfoSection>

      <InfoSection title={t("Contact")}>
        {contactEmail ? (
          <>
            <InfoItem>
              {t(
                "Une question, un problème ou un panneau à signaler ? Écrivez-nous."
              )}
            </InfoItem>
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
              {t("Écrire un e-mail")}
            </Button>
          </>
        ) : (
          <InfoItem>
            {t("L'adresse de contact n'est pas encore configurée.")}
          </InfoItem>
        )}
      </InfoSection>

      <InfoSection title={t("À propos")}>
        <InfoItem>
          {t(
            "Cette application n'est pas affiliée à la Région Auvergne-Rhône-Alpes. C'est une blague présentée par le collectif RDF, « Rang du fond »."
          )}
        </InfoItem>
        <Text variant="muted">
          {t("Version {version}", {
            version: Constants.expoConfig?.version ?? "",
          })}
        </Text>
      </InfoSection>
    </InfoScreen>
  )
}
