import { DebugLib, Hotkeys } from "DmLib"
import { DxScanCode, on } from "skyrimPlatform"
import { HookAnims } from "./animations"
import {
  devHotkeys,
  evt,
  logAnim,
  logHits,
  logLvl,
  logToConsole,
  logToFile,
  malfunctionMsg,
  redressNPC,
  restoreEquipHk,
} from "./config"
import { playerId } from "./constants"
import { LN } from "./debug"
import { Redress, RedressNpcEvt, TryRestore, TrySkimpify } from "./equipment"
import { LogHit, HitBySpell, HitByWeapon } from "./hits"

export function main() {
  HookAnims()
  const LH = logHits ? LogHit : () => {}

  /** This event counts for any Actor in combat */
  on("hit", (e) => {
    LH(e)
    if (!HitBySpell(e)) HitByWeapon(e)
  })

  const OnT = Hotkeys.ListenToS(DxScanCode.Backspace, devHotkeys)
  const T = () => TrySkimpify(playerId, evt.combat.powerAttacked.chance, true)

  const OnT2 = Hotkeys.ListenToS(DxScanCode.RightControl, devHotkeys)
  const T2 = () => TryRestore(playerId, evt.explore.swim.recoveryTime)

  const OnRedress = Hotkeys.ListenTo(restoreEquipHk)

  on("update", () => {
    OnRedress(Redress)
    OnT(T)
    OnT2(T2)
  })

  if (redressNPC.enabled) on("objectLoaded", RedressNpcEvt)

  const B = (v: boolean) => (v ? "ENABLED" : "DISABLED")
  LN("Successful initialization")
  LN(`Redress hotkey: ${Hotkeys.ToString(restoreEquipHk)}`)
  LN(`Notify slips: ${B(malfunctionMsg.slip)}`)
  LN(`Notify changes: ${B(malfunctionMsg.change)}`)
  LN(`Notify damages: ${B(malfunctionMsg.damage)}`)
  LN(`Notify unequip: ${B(malfunctionMsg.unequip)}`)
  LN(`Dev hotkeys: ${B(devHotkeys)}`)
  LN(`Logging level: ${DebugLib.Log.Level[logLvl]}`)
  LN(`Log to console: ${B(logToConsole)}`)
  LN(`Log to file: ${B(logToFile)}`)
  LN(`Log hits: ${B(logHits)}`)

  if (logAnim) LN("Animation loggin activated")
}
