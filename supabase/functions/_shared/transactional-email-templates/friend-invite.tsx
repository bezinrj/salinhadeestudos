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
import type { TemplateEntry } from './registry.ts'

interface FriendInviteProps {
  friendName?: string
  referrerName?: string
  signupUrl?: string
}

const FriendInvite = ({
  friendName,
  referrerName,
  signupUrl = 'https://salinhadeestudos.com.br/cadastro',
}: FriendInviteProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>
      {referrerName ? `${referrerName} te convidou para a Salinha de Estudos` : 'Você foi convidado para a Salinha de Estudos'}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandHeader}>
          <Text style={brandText}>⚖️ Salinha de Estudos</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>
            {friendName ? `${friendName}, você foi convidado!` : 'Você foi convidado!'}
          </Heading>
          <Text style={text}>
            {referrerName ? <strong>{referrerName}</strong> : 'Um amigo'} indicou você para a{' '}
            <Link href="https://salinhadeestudos.com.br" style={link}>
              <strong>Salinha de Estudos</strong>
            </Link>
            , a plataforma de preparação para concursos jurídicos com correção de discursivas por IA,
            Vade Mecum digital, Salinha Juris e cronômetro de estudos com ranking.
          </Text>
          <Text style={text}>
            Crie sua conta gratuita e comece agora — você também pode liberar 3 dias de degustação
            premium indicando amigos.
          </Text>
          <Section style={buttonWrap}>
            <Button style={button} href={signupUrl}>Criar minha conta grátis</Button>
          </Section>
          <Text style={footer}>
            Se você não conhece quem enviou este convite, pode ignorar este e-mail com segurança.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FriendInvite,
  subject: (data: FriendInviteProps) =>
    data?.referrerName
      ? `${data.referrerName} te convidou para a Salinha de Estudos`
      : 'Você foi convidado para a Salinha de Estudos',
  displayName: 'Convite de amigo',
  previewData: {
    friendName: 'Maria',
    referrerName: 'João',
    signupUrl: 'https://salinhadeestudos.com.br/cadastro',
  },
} satisfies TemplateEntry

export default FriendInvite

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
