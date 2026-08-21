/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface SupportTicketProps {
  userName?: string
  subject?: string
  message?: string
  protocol?: string
}

const SupportTicket = ({
  userName,
  subject = 'Atendimento',
  message = '',
  protocol = '',
}: SupportTicketProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Recebemos sua solicitação — Salinha de Estudos</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandHeader}>
          <Text style={brandText}>⚖️ Salinha de Estudos</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>Recebemos sua solicitação</Heading>
          <Text style={text}>
            {userName ? `Olá, ${userName}! ` : 'Olá! '}
            Sua mensagem chegou até nós e será respondida em até 48 horas úteis.
          </Text>
          <Text style={label}>Assunto</Text>
          <Text style={value}>{subject}</Text>
          {message ? (
            <>
              <Text style={label}>Sua mensagem</Text>
              <Text style={value}>{message}</Text>
            </>
          ) : null}
          {protocol ? (
            <Text style={footer}>Protocolo: {protocol}</Text>
          ) : null}
          <Text style={footer}>
            Se precisar complementar, basta responder este e-mail.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

const main = { backgroundColor: '#0b0b0d', fontFamily: 'Helvetica, Arial, sans-serif', padding: '24px 0' }
const container = { margin: '0 auto', maxWidth: '560px' }
const brandHeader = { padding: '0 0 16px' }
const brandText = { color: '#d4af37', fontSize: '18px', fontWeight: 'bold', margin: '0' }
const card = { backgroundColor: '#141417', border: '1px solid #26262b', borderRadius: '12px', padding: '28px' }
const h1 = { color: '#f5f5f5', fontSize: '22px', margin: '0 0 12px' }
const text = { color: '#c8c8ce', fontSize: '15px', lineHeight: '24px', margin: '0 0 16px' }
const label = { color: '#8a8a92', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '16px 0 4px' }
const value = { color: '#f5f5f5', fontSize: '15px', lineHeight: '23px', margin: '0', whiteSpace: 'pre-wrap' as const }
const footer = { color: '#8a8a92', fontSize: '12px', lineHeight: '18px', margin: '24px 0 0' }

export const template: TemplateEntry = {
  component: SupportTicket,
  subject: 'Recebemos sua solicitação — Salinha de Estudos',
  displayName: 'Confirmação de atendimento',
  previewData: {
    userName: 'Maria',
    subject: 'Cancelar assinatura',
    message: 'Gostaria de cancelar minha assinatura mensal.',
    protocol: 'ABC12345',
  },
}

export default SupportTicket
