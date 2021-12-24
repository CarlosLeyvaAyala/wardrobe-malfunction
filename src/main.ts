import { DebugLib, Hotkeys } from "DmLib"
import {
  Ammo,
  DxScanCode,
  HitEvent,
  on,
  Weapon,
  WeaponType,
} from "skyrimPlatform"
import { HookAnims } from "./animations"
import {
  devHotkeys,
  evt,
  logAnim,
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

export function main() {
  HookAnims()

  /** This event counts for any Actor in combat */
  on("hit", (e) => {
    // printConsole(
    //   `+++ HIT: ${e.source.getName()} ${e.source.getFormID().toString(16)}`
    // )
    HitBySpell(e)
    HitByWeapon(e)
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

  if (logAnim) LN("Animation loggin activated")
}

function HitBySpell(e: HitEvent) {
  const fus = 0x13e09
  const fusRo = 0x13f39
  const fusRoDa = 0x13f3a
  const c =
    e.source.getFormID() === fus
      ? evt.combat.fus.chance
      : e.source.getFormID() === fusRo
      ? evt.combat.fusRo.chance
      : e.source.getFormID() === fusRoDa
      ? evt.combat.fusRoDa.chance
      : null
  if (!c) return
  TrySkimpify(e.target.getFormID(), c, true)
}

function HitByWeapon(e: HitEvent) {
  const w = Weapon.from(e.source)
  if (!w) return
  const t = w.getWeaponType()
  if (t === WeaponType.Crossbow || t === WeaponType.Bow) return

  if (Ammo.from(e.source)) return
  const c = e.isHitBlocked
    ? evt.combat.block.chance
    : e.isBashAttack || e.isPowerAttack
    ? evt.combat.powerAttacked.chance
    : evt.combat.attacked.chance
  TrySkimpify(e.target.getFormID(), c, true)
}
