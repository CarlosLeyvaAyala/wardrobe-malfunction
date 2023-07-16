import * as Log from "DmLib/Log"
import { logLvl, logToConsole, logToFile } from "./config"
import { displayName } from "./constants"

const d = Log.CreateAll(
  displayName,
  logLvl,
  logToConsole ? Log.ConsoleFmt : undefined,
  logToFile ? Log.FileFmt : undefined
)

export const LN = d.None
export const LE = d.Error
export const LV = d.Verbose
export const LI = d.Info
