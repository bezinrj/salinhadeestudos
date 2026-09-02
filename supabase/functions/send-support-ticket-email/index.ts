import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const TEMPLATE_NAME = 'support-ticket'

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

  let ticketId: string
  try {
    const body = await req.json()
    ticketId = typeof body.ticketId === 'string' ? body.ticketId : ''
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!/^[0-9a-f-]{36}$/i.test(ticketId)) {
    return new Response(JSON.stringify({ error: 'ticketId inválido' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceKey)

  const { data: ticket, error: ticketError } = await admin
    .from('support_tickets')
    .select('id, user_id, email, subject, message')
    .eq('id', ticketId)
    .maybeSingle()

  if (ticketError || !ticket) {
    return new Response(JSON.stringify({ error: 'Solicitação não encontrada' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (ticket.user_id !== callerId) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const recipient = ticket.email as string | null
  if (!recipient) {
    return new Response(JSON.stringify({ success: false, reason: 'no_recipient' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('name, username')
    .eq('id', callerId)
    .maybeSingle()

  const protocol = String(ticket.id).slice(0, 8).toUpperCase()

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
      idempotencyKey: `support-ticket-${ticket.id}`,
      templateData: {
        userName: profile?.name || profile?.username || '',
        subject: ticket.subject,
        message: ticket.message,
        protocol,
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
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email'
    console.error('Failed to send support ticket email', {
      message,
      recipient_redacted: redactEmail(recipient),
    })
    await logSend('failed', message)
    return new Response(JSON.stringify({ error: 'Falha ao enviar o e-mail' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
