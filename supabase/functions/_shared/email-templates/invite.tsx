/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

interface InviteEmailProps {
  siteName?: string
  siteUrl?: string
  confirmationUrl?: string
}

/**
 * Template de convite — HTML "table-based" e CSS inline para máxima compatibilidade
 * com Gmail (incluindo Gmail mobile), Outlook, Apple Mail, etc.
 *
 * - Não usa background-image, gradients, border-radius excessivo nem flex/grid.
 * - Botão "bulletproof" usando VML para Outlook + <a> com padding para os demais.
 * - 100% em português.
 */
export const InviteEmail = ({
  siteName = 'Salinha de Estudos',
  siteUrl = 'https://salinhadeestudos.com.br',
  confirmationUrl = 'https://salinhadeestudos.com.br',
}: InviteEmailProps) => {
  const preheader = 'Aceite o convite para criar sua conta'

  // Cores da identidade Salinha de Estudos
  const COLOR_BG = '#ffffff'
  const COLOR_CARD = '#15171F'
  const COLOR_BORDER = '#262A36'
  const COLOR_TEXT = '#ECEEF5'
  const COLOR_MUTED = '#B8BCC8'
  const COLOR_FOOTER = '#7A7F8E'
  const COLOR_BRAND = '#3B82F6'
  const COLOR_BTN = '#3B82F6'
  const COLOR_BTN_TEXT = '#ffffff'

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="pt-BR">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>Você foi convidado(a) para a ${siteName}</title>
<!--[if mso]>
<style type="text/css">
  body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
</style>
<![endif]-->
<style>
  /* Reset básico */
  body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; background-color:${COLOR_BG}; }
  table { border-collapse:collapse !important; }
  img { border:0; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; display:block; }
  a { text-decoration:none; }
  /* Força texto claro mesmo no dark mode de alguns clientes */
  .card, .card td { color:${COLOR_TEXT} !important; }
  .muted { color:${COLOR_MUTED} !important; }
  .footer-text { color:${COLOR_FOOTER} !important; }
  @media only screen and (max-width: 600px) {
    .container { width:100% !important; padding:16px !important; }
    .card-inner { padding:24px 20px !important; }
    .h1 { font-size:22px !important; line-height:1.3 !important; }
    .btn-a { padding:14px 24px !important; font-size:15px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:${COLOR_BG};">
  <!-- Preheader (não exibido no corpo, aparece como prévia na inbox) -->
  <div style="display:none; font-size:1px; color:${COLOR_BG}; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR_BG};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px; max-width:560px;">

          <!-- Brand header -->
          <tr>
            <td align="center" style="padding:0 0 20px 0; font-family:Arial, Helvetica, sans-serif;">
              <span style="font-family:Arial, Helvetica, sans-serif; font-size:20px; font-weight:bold; color:${COLOR_BRAND};">
                ⚖️ ${siteName}
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="card" style="background-color:${COLOR_CARD}; border:1px solid ${COLOR_BORDER}; border-radius:8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="card-inner" style="padding:36px 32px; font-family:Arial, Helvetica, sans-serif;">
                    <h1 class="h1" style="margin:0 0 20px 0; font-family:Arial, Helvetica, sans-serif; font-size:24px; font-weight:bold; color:${COLOR_TEXT}; line-height:1.3;">
                      Você foi convidado(a)
                    </h1>
                    <p class="muted" style="margin:0 0 24px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:${COLOR_MUTED};">
                      Você recebeu um convite para fazer parte da
                      <a href="${siteUrl}" style="color:#F4C430; text-decoration:underline;"><strong style="color:#F4C430;">${siteName}</strong></a>.
                      Clique no botão abaixo para aceitar e criar sua conta.
                    </p>

                    <!-- Bulletproof button -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding:8px 0 16px 0;">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${confirmationUrl}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="12%" stroke="f" fillcolor="${COLOR_BTN}">
                            <w:anchorlock/>
                            <center style="color:${COLOR_BTN_TEXT};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;">Aceitar convite</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-- -->
                          <a class="btn-a" href="${confirmationUrl}"
                             style="background-color:${COLOR_BTN}; color:${COLOR_BTN_TEXT}; display:inline-block; font-family:Arial, Helvetica, sans-serif; font-size:15px; font-weight:bold; line-height:1; padding:16px 32px; border-radius:6px; text-decoration:none; mso-hide:all;">
                            Aceitar convite
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>

                    <!-- Fallback link -->
                    <p class="muted" style="margin:8px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.5; color:${COLOR_MUTED};">
                      Se o botão não funcionar, copie e cole este link no seu navegador:<br />
                      <a href="${confirmationUrl}" style="color:#F4C430; text-decoration:underline; word-break:break-all;">${confirmationUrl}</a>
                    </p>

                    <p class="footer-text" style="margin:28px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.5; color:${COLOR_FOOTER};">
                      Se você não esperava este convite, pode ignorar este e-mail com segurança.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px 8px 0 8px; font-family:Arial, Helvetica, sans-serif; font-size:11px; color:${COLOR_FOOTER};">
              © ${new Date().getFullYear()} ${siteName}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

export default InviteEmail
