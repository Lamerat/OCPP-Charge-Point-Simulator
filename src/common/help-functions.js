import moment from 'moment'
import { customAlphabet  } from 'nanoid'
import { connectors } from './constants'

export const getId = () => customAlphabet ('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 36)()

export const saveSettings = (settings) => {
  localStorage.setItem('OCPPSettings', JSON.stringify(settings))
  connectors[1].idTag = settings?.mainSettings.RFIDTag
  connectors[2].idTag = settings?.mainSettings.RFIDTag
}

export const OCPPDate = (date) => moment(date).format('YYYY-MM-DDTHH:mm:ss').toString() + 'Z'
