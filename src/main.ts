import * as HK from "DmLib/Hotkeys"
import * as Log from "DmLib/Log"
import { CanUseArmor } from "skimpify-api"
import { Actor, DxScanCode, HitEvent, on, once } from "skyrimPlatform"
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
  restoreEquipHk,
} from "./config"
import { playerId } from "./constants"
import { LN } from "./debug"
import { manualRedress, RedressPlayer, TrySkimpify } from "./equipment"
import { HitBySpell, HitByWeapon, LogHit, getThunderchildIds } from "./hits"

const LH = logHits ? LogHit : () => {}
export function main() {
  HookAnims()
  const LH = logHits ? LogHit : () => {}

  /** This event counts for any Actor in combat */
  on("hit", (e) => {
    // TODO: Add option to disable in AE
    LH(e)
    OnHit(e)
  })

  const OnT = HK.ListenToS(DxScanCode.Backspace, devHotkeys)
  const T = () => TrySkimpify(playerId, evt.combat.powerAttacked.chance, true)

  const OnT2 = HK.ListenToS(DxScanCode.RightControl, devHotkeys)
  const T2 = () => RedressPlayer(playerId, evt.explore.swim.recoveryTime)

  const OnRedress = HK.ListenTo(restoreEquipHk)

  on("update", () => {
    OnRedress(manualRedress)
    // OnT(T)
    // OnT2(T2)
  })

  once("update", getThunderchildIds)

  //   if (redressNPC.enabled) on("objectLoaded", RedressNpcEvt)

  const B = (v: boolean) => (v ? "ENABLED" : "DISABLED")
  LN("Successful initialization")
  LN(`Redress hotkey: ${HK.ToString(restoreEquipHk)}`)
  LN(`Notify slips: ${B(malfunctionMsg.slip)}`)
  LN(`Notify changes: ${B(malfunctionMsg.change)}`)
  LN(`Notify damages: ${B(malfunctionMsg.damage)}`)
  LN(`Notify unequip: ${B(malfunctionMsg.unequip)}`)
  LN(`Dev hotkeys: ${B(devHotkeys)}`)
  LN(`Logging level: ${Log.Level[logLvl]}`)
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
  if (!CanUseArmor(Actor.from(e.target)) || !e.source) return
  LH(e)
  if (!HitBySpell(e)) HitByWeapon(e)
}
