import * as React from "react"
import type { TextInputProps } from "react-native"
import { EyeIcon, EyeOffIcon } from "lucide-react-native"

import { IconButton } from "@workspace/ui/native/icon-button"
import { Input } from "@workspace/ui/native/input"
import { useColors } from "@workspace/ui/native/theme"
import { useT } from "@/lib/preferences"

export function PasswordInput(props: TextInputProps) {
  const t = useT()
  const colors = useColors()
  const [visible, setVisible] = React.useState(false)
  const Icon = visible ? EyeOffIcon : EyeIcon

  return (
    <Input
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      trailing={
        <IconButton
          label={
            visible
              ? t("passwordInput.hidePassword")
              : t("passwordInput.showPassword")
          }
          color={colors.mutedForeground}
          icon={(iconProps) => <Icon {...iconProps} />}
          onPress={() => setVisible(!visible)}
        />
      }
      {...props}
    />
  )
}
