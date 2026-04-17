/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefina sua senha na {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandHeader}>
          <Text style={brandText}>⚖️ Salinha de Estudos</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>Redefinir senha</Heading>
          <Text style={text}>
            Recebemos uma solicitação para redefinir a senha da sua conta na{' '}
            <strong style={strong}>{siteName}</strong>. Clique no botão abaixo para escolher uma nova senha.
          </Text>
          <Section style={buttonWrap}>
            <Button style={button} href={confirmationUrl}>Redefinir senha</Button>
          </Section>
          <Text style={footer}>
            Se você não solicitou esta alteração, pode ignorar este e-mail com segurança — sua senha permanecerá inalterada. Este link expira em breve por motivos de segurança.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 20px', maxWidth: '560px', margin: '0 auto' }
const brandHeader = { textAlign: 'center' as const, padding: '0 0 20px' }
const brandText = { fontFamily: "'Space Grotesk', Arial, sans-serif", fontSize: '20px', fontWeight: 700 as const, color: '#3B82F6', margin: 0 }
const card = { backgroundColor: '#15171F', borderRadius: '12px', padding: '36px 32px', border: '1px solid #262A36' }
const h1 = { fontFamily: "'Space Grotesk', Arial, sans-serif", fontSize: '24px', fontWeight: 700 as const, color: '#ECEEF5', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#B8BCC8', lineHeight: '1.6', margin: '0 0 16px' }
const strong = { color: '#ECEEF5' }
const buttonWrap = { textAlign: 'center' as const, margin: '28px 0 20px' }
const button = { background: 'linear-gradient(135deg, #3B82F6, #6D5DEA)', color: '#ffffff', fontSize: '14px', fontWeight: 600 as const, borderRadius: '10px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#7A7F8E', margin: '28px 0 0', lineHeight: '1.5' }
