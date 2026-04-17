/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu e-mail na {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandHeader}>
          <Text style={brandText}>⚖️ Salinha de Estudos</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>Confirme seu e-mail</Heading>
          <Text style={text}>
            Bem-vindo(a) à{' '}
            <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>! Estamos felizes em ter você na nossa comunidade de concurseiros.
          </Text>
          <Text style={text}>
            Para ativar sua conta (
            <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>
            ), clique no botão abaixo:
          </Text>
          <Section style={buttonWrap}>
            <Button style={button} href={confirmationUrl}>Confirmar e-mail</Button>
          </Section>
          <Text style={footer}>
            Se você não criou esta conta, pode ignorar este e-mail com segurança.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 20px', maxWidth: '560px', margin: '0 auto' }
const brandHeader = { textAlign: 'center' as const, padding: '0 0 20px' }
const brandText = { fontFamily: "'Space Grotesk', Arial, sans-serif", fontSize: '20px', fontWeight: 700 as const, color: '#3B82F6', margin: 0 }
const card = { backgroundColor: '#15171F', borderRadius: '12px', padding: '36px 32px', border: '1px solid #262A36' }
const h1 = { fontFamily: "'Space Grotesk', Arial, sans-serif", fontSize: '24px', fontWeight: 700 as const, color: '#ECEEF5', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#B8BCC8', lineHeight: '1.6', margin: '0 0 16px' }
const link = { color: '#F4C430', textDecoration: 'underline' }
const buttonWrap = { textAlign: 'center' as const, margin: '28px 0 20px' }
const button = { background: 'linear-gradient(135deg, #3B82F6, #6D5DEA)', color: '#ffffff', fontSize: '14px', fontWeight: 600 as const, borderRadius: '10px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#7A7F8E', margin: '28px 0 0', lineHeight: '1.5' }
