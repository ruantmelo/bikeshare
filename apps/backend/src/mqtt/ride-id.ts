const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const COMPACT_RIDE_ID_REGEX = /^[A-Za-z0-9_-]{22}$/

function formatUuid(hex: string) {
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function encodeFirmwareRideId(rideId: string) {
  if (!UUID_REGEX.test(rideId)) return rideId

  return Buffer.from(rideId.replaceAll('-', ''), 'hex').toString('base64url')
}

export function decodeFirmwareRideId(rideId: string) {
  if (UUID_REGEX.test(rideId)) return rideId.toLowerCase()
  if (!COMPACT_RIDE_ID_REGEX.test(rideId)) return rideId

  const bytes = Buffer.from(rideId, 'base64url')
  if (bytes.length !== 16) return rideId

  return formatUuid(bytes.toString('hex'))
}
