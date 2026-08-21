/// <reference types="npm:@types/react@18.3.1" />

import type * as React from 'npm:react@18.3.1'
import { template as friendInvite } from './friend-invite.tsx'
import { template as supportTicket } from './support-ticket.tsx'

export interface TemplateEntry {
  // deno-lint-ignore no-explicit-any
  component: (props: any) => React.ReactElement
  // deno-lint-ignore no-explicit-any
  subject: string | ((data: any) => string)
  displayName?: string
  // deno-lint-ignore no-explicit-any
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'friend-invite': friendInvite,
}
