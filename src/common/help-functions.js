import moment from 'moment'
import { customAlphabet  } from 'nanoid'
import { connectors } from './constants'

export const getId = () => customAlphabet ('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 36)()

export const saveSettings = (settings) => {
  localStorage.setItem('OCPPSettings', JSON.stringify(settings))
  connectors[1].idTag = settings?.mainSettings.RFIDTag
  connectors[2].idTag = settings?.mainSettings.RFIDTag
}

export const OCPPDate = (date) => moment.utc(moment(date)).format()

// A blank port deliberately uses the default port for the selected scheme:
// 80 for ws and 443 for wss.
export const buildWebSocketUrl = ({ protocol, address, port, chargePointId }) => {
  const normalizedPort = String(port ?? '').trim()
  const portSegment = normalizedPort ? `:${normalizedPort}` : ''
  return `${protocol}://${address}${portSegment}/${chargePointId}`
}
