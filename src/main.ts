import { DebugLib, Hotkeys } from "DmLib"
import { CanUseArmor } from "skimpify-api"
import { Actor, DxScanCode, HitEvent, on } from "skyrimPlatform"
import { HookAnims } from "./animations"
import {
  CTD_fix,
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
import { HitBySpell, HitByWeapon, LogHit } from "./hits"

const LH = logHits ? LogHit : () => {}
export function main() {
  HookAnims()
  if (!CTD_fix.spriggansWispMothers) on("hit", OnHit)

  const OnT = Hotkeys.ListenToS(DxScanCode.Backspace, devHotkeys)
  const T = () => TrySkimpify(playerId, evt.combat.powerAttacked.chance, true)

  const OnT2 = Hotkeys.ListenToS(DxScanCode.RightControl, devHotkeys)
  const T2 = () => TryRestore(playerId, evt.explore.swim.recoveryTime)

  const OnRedress = Hotkeys.ListenTo(restoreEquipHk)

  on("update", () => {
    OnRedress(Redress)
    // OnT(T)
    // OnT2(T2)
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

/** Acts when player is hit.
 * @privateRemarks
 * Moved as a separate function because AE CTDs if not.
 */
function OnHit(e: HitEvent) {
  // const a = e.aggressor.getBaseObject()?.getFormID()
  // if (!a || IsSpriggan(a)) return
  // LN("e.aggressor: " + e.aggressor.getBaseObject()?.getFormID().toString(16))
  if (!CanUseArmor(Actor.from(e.target)) || !e.source) return
  LH(e)
  if (!HitBySpell(e)) HitByWeapon(e)
}

const IsSpriggan = (a: number) =>
  a === 0x23ab9 || a === 0x7e6c5 || a === 0x9da9b
