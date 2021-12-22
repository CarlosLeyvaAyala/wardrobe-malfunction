import { DebugLib } from "DmLib"
import { logLvl, logToConsole, logToFile } from "./config"
import { displayName } from "./constants"

const d = DebugLib.Log.CreateAll(
  displayName,
  logLvl,
  logToConsole ? DebugLib.Log.ConsoleFmt : undefined,
  logToFile ? DebugLib.Log.FileFmt : undefined
)

export const LN = d.None
export const LV = d.Verbose
export const LI = d.Info
