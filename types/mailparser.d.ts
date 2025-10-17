declare module "mailparser" {
  import { Readable } from "stream"

  export interface Address {
    address: string
    name?: string
  }

  export interface AddressObject {
    value: Address[]
    html: string
    text: string
  }

  export interface Attachment {
    type: string
    content: Buffer
    contentType: string
    partId: string
    release: () => void
    contentDisposition: string
    filename?: string
    headers: Map<string, string>
    checksum: string
    size: number
  }

  export interface ParsedMail {
    attachments: Attachment[]
    headers: Map<string, string>
    html?: string
    text?: string
    textAsHtml?: string
    subject?: string
    date?: Date
    to?: AddressObject | AddressObject[]
    from?: AddressObject | AddressObject[]
    cc?: AddressObject | AddressObject[]
    bcc?: AddressObject | AddressObject[]
    messageId?: string
    inReplyTo?: string
    references?: string[]
    replyTo?: AddressObject | AddressObject[]
  }

  export function simpleParser(
    source: string | Buffer | Readable,
    callback?: (err: Error | null, mail: ParsedMail) => void
  ): Promise<ParsedMail>

  export function simpleParser(
    source: string | Buffer | Readable,
    options: any,
    callback?: (err: Error | null, mail: ParsedMail) => void
  ): Promise<ParsedMail>
}
