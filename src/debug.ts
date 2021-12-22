import { DebugLib } from "DmLib"

const d = DebugLib.Log.CreateAll(
  "Wardrobe Malfunction",
  DebugLib.Log.Level.verbose,
  DebugLib.Log.ConsoleFmt
)

export const LN = d.None
export const LV = d.Verbose
export const LI = d.Info
