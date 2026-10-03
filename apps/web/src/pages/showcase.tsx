import * as React from "react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { ModeToggle } from "@workspace/ui/components/mode-toggle"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Switch } from "@workspace/ui/components/switch"
import { Text } from "@workspace/ui/components/text"
import { Textarea } from "@workspace/ui/components/textarea"

export function Showcase() {
  const [submitted, setSubmitted] = React.useState(false)

  return (
    <main className="flex min-h-svh flex-col">
      <header className="surface-blue py-12">
        <div className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-4 sm:px-6">
          <ModeToggle className="self-end" />
          <Text variant="display">
            <strong>Aura Seeker</strong> trouve ta voie
          </Text>
          <div className="flex flex-wrap gap-3">
            <Button>Commencer</Button>
            <Button variant="secondary">En savoir plus</Button>
          </div>
        </div>
      </header>

      <div className="surface-slate py-4">
        <Text className="mx-auto max-w-2xl px-4 font-medium sm:px-6">
          Every primitive on this page comes from the shared UI library. Switch
          theme with the button above, or press <kbd>d</kbd>.
        </Text>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:px-6">
        <section className="flex flex-col gap-4">
          <Text variant="section">Buttons</Text>
          <Text variant="overline" className="text-link">
            Variants
          </Text>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Slate</Badge>
            <Badge variant="magenta">Entrée libre</Badge>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Form</CardTitle>
            <CardDescription>
              Inputs, select, checkbox and switch composed with Field.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              id="demo-form"
              onSubmit={(event) => {
                event.preventDefault()
                setSubmitted(true)
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input id="name" placeholder="Ada Lovelace" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ada@example.com"
                    required
                  />
                  <FieldDescription>
                    We only use it to contact you.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="role">Role</FieldLabel>
                  <Select defaultValue="seeker">
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seeker">Seeker</SelectItem>
                      <SelectItem value="guide">Guide</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="message">Message</FieldLabel>
                  <Textarea id="message" placeholder="Tell us more…" />
                </Field>
                <Field orientation="horizontal">
                  <Checkbox id="terms" required />
                  <FieldLabel htmlFor="terms">I accept the terms</FieldLabel>
                </Field>
                <Field orientation="horizontal">
                  <Switch id="newsletter" />
                  <FieldLabel htmlFor="newsletter">
                    Subscribe to the newsletter
                  </FieldLabel>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter className="gap-3">
            <Button type="submit" form="demo-form">
              Submit
            </Button>
            {submitted && <Text variant="muted">Submitted.</Text>}
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
