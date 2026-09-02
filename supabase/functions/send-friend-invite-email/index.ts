import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const TEMPLATE_NAME = 'friend-invite'
const SIGNUP_URL = 'https://salinhadeestudos.com.br/cadastro'

function redactEmail(email: string | null | undefined): string {
  if (!email) return '***'
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***'
  return `${local[0]}***@${domain}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const anonClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: claims, error: claimsErr } = await anonClient.auth.getClaims(
    authHeader.slice('Bearer '.length).trim()
  )
  const callerId = claims?.claims?.sub as string | undefined
  if (claimsErr || !callerId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let referralId: string
  try {
    const body = await req.json()
    referralId = typeof body.referralId === 'string' ? body.referralId : ''
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!/^[0-9a-f-]{36}$/i.test(referralId)) {
    return new Response(JSON.stringify({ error: 'referralId inválido' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceKey)

  const { data: referral, error: referralError } = await admin
    .from('referrals')
    .select('id, referrer_id, friend_name, friend_email')
    .eq('id', referralId)
    .maybeSingle()

  if (referralError || !referral) {
    return new Response(JSON.stringify({ error: 'Indicação não encontrada' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (referral.referrer_id !== callerId) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const recipient = referral.friend_email as string

  const { data: profile } = await admin
    .from('profiles')
    .select('name, username')
    .eq('id', callerId)
    .maybeSingle()

  async function logSend(status: string, errorMessage?: string) {
    const { error } = await admin.from('email_send_log').insert({
      message_id: null,
      template_name: TEMPLATE_NAME,
      recipient_email: recipient,
      status,
      error_message: errorMessage ?? null,
    })
    if (error) {
      console.error('Failed to write email_send_log', { code: error.code, message: error.message })
    }
  }

  try {
    const result = await sendTemplateEmail(TEMPLATE_NAME, recipient, {
      idempotencyKey: `friend-invite-${referral.id}`,
      templateData: {
        friendName: referral.friend_name,
        referrerName: profile?.name || profile?.username || 'Um amigo',
        signupUrl: SIGNUP_URL,
      },
    })

    if (!result.sent) {
      await logSend('suppressed')
      return new Response(JSON.stringify({ success: false, reason: result.reason }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await logSend('sent')
    const { error: stampError } = await admin
      .from('referrals')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', referral.id)
    if (stampError) {
      console.error('Failed to stamp referral email_sent_at', {
        code: stampError.code,
        message: stampError.message,
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email'
    console.error('Failed to send friend invite email', {
      message,
      recipient_redacted: redactEmail(recipient),
    })
    await logSend('failed', message)
    return new Response(JSON.stringify({ error: 'Falha ao enviar o convite' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
