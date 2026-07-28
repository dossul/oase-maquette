import crypto from 'crypto'

/**
 * Génère un code TOTP (RFC 6238, SHA-1, 30 s, 6 chiffres) à partir d'un secret
 * base32 — même algorithme que `speakeasy` côté backend. Auto-suffisant (crypto Node).
 */
export function totpCode(base32Secret: string, offsetSteps = 0, timeStep = 30, digits = 6): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const clean = base32Secret.replace(/=+$/, '').toUpperCase()
  let bits = ''
  for (const c of clean) {
    const v = alphabet.indexOf(c)
    if (v < 0) throw new Error(`Secret base32 invalide : caractère « ${c} »`)
    bits += v.toString(2).padStart(5, '0')
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  const key = Buffer.from(bytes)

  const counter = Math.floor(Date.now() / 1000 / timeStep) + offsetSteps
  const counterBuf = Buffer.alloc(8)
  counterBuf.writeBigUInt64BE(BigInt(counter))

  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3]
  return String(binary % 10 ** digits).padStart(digits, '0')
}
