import moment from 'moment'
import { customAlphabet  } from 'nanoid'

export const getId = () => customAlphabet ('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 36)()

export const saveSettings = (settings) => localStorage.setItem('OCPPSettings', JSON.stringify(settings))

export const OCPPDate = (date) => moment(date).format('YYYY-MM-DDTHH:mm:ss').toString() + 'Z'
