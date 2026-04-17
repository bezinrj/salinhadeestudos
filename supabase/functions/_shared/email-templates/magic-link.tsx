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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu link de acesso na {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandHeader}>
          <Text style={brandText}>⚖️ Salinha de Estudos</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>Seu link de acesso</Heading>
          <Text style={text}>
            Clique no botão abaixo para entrar na <strong style={strong}>{siteName}</strong>. Este link expira em breve por segurança.
          </Text>
          <Section style={buttonWrap}>
            <Button style={button} href={confirmationUrl}>Entrar agora</Button>
          </Section>
          <Text style={footer}>
            Se você não solicitou este link, pode ignorar este e-mail com segurança.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
