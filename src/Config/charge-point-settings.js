import { MdPower, MdPowerOff } from 'react-icons/md'
import { GiUnplugged } from 'react-icons/gi'
import ReportIcon from '@mui/icons-material/Report';
import { BsCheck2All } from 'react-icons/bs'



export const mainStatus = {
  connected: 1,
  connecting: 2,
  disconnected: 3,
  authorized: 4,
  error: 5,
  transaction: 6,
}


export const connectedStatuses = [ mainStatus.connected, mainStatus.authorized, mainStatus.transaction ]


export const pointStatus = {
  connected: { status: mainStatus.connected, text: 'Connected', color: 'success', icon: MdPower },
  disconnected: { status: mainStatus.disconnected, text: 'Disconnected', color: 'secondary', icon: MdPowerOff },
  connecting: { status: mainStatus.connecting, text: 'Connecting', color: 'info', icon: GiUnplugged },
  error: { status: mainStatus.error, text: 'Error', color: 'error', icon: ReportIcon },
  authorized: { status: mainStatus.authorized, text: 'Authorized', color: 'success', icon: BsCheck2All },
}
