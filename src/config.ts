import * as HK from "DmLib/Hotkeys"
import * as Log from "DmLib/Log"
import { settings } from "skyrimPlatform"

const n = "wardrobe-malfunction"

//@ts-ignore
const devOpt = settings[n]["config"].developer
export const logAnim = devOpt.logAnims as boolean
export const logActor = parseInt(devOpt.logActor)
export const devHotkeys = devOpt.hotkeys as boolean
export const logHits = devOpt.logHits as boolean

//@ts-ignore
const devUsr = settings[n]["config"].user
/** Chance to restore all equipment by using the hotkey. */
export const restoreEquipC = devUsr.restoreEquipmentChance as number
export const restoreEquipHk = HK.FromValue(devUsr.restoreEquipmentHk)
export const CTD_fix: ICTD_fix = devUsr.CTD_fix
export const redressNPC = devUsr.redressNPC as RedressNPC
export const logLvl = Log.LevelFromValue(devUsr.log.level)
export const logToConsole = devUsr.log.toConsole as boolean
export const logToFile = devUsr.log.toFile as boolean
export const malfunctionMsg = devUsr.messages as MalfunctionMessages

/** Events configuration. */
export const evt = settings[n]["events"] as SkimpyEvents

export interface ICTD_fix {
  spriggansWispMothers: boolean
}

/** Configuration for all events. */
export interface SkimpyEvents {
  townspeople: PeasantEvents
  explore: ExplorationEvents
  combat: CombatEvents
}

export interface ExplorationEvents {
  sneak: SkimpyEvent
  swim: SkimpyEvent
  sprint: SkimpyEvent
  jump: SkimpyEvent
}

export interface CombatEvents {
  recoveryTime: SkimpyEventRecoveryTime
  /** Event when `Actor` is attacking. */
  attack: SkimpyEvent
  /** Event when `Actor` is power attacking. */
  powerAttack: SkimpyEvent
  fus: SkimpyEvent
  fusRo: SkimpyEvent
  fusRoDa: SkimpyEvent
  block: SkimpyEvent
  /** Event when `Actor` is being attacked. */
  attacked: SkimpyEvent
  /** Event when `Actor` is being power attacked. */
  powerAttacked: SkimpyEvent
  /** Event when `Actor` gets hit by an arrow. */
  arrow: SkimpyEvent
}

export interface PeasantEvents {
  recoveryTime: SkimpyEventRecoveryTime
  bendOver: SkimpyEvent
  liftLegs: SkimpyEvent
  layDown: SkimpyEvent
}

/** Configuration for one single event. */
interface SkimpyEvent {
  chance: SkimpyEventChance
  recoveryTime: SkimpyEventRecoveryTime
  playerOnly: boolean
}

/** Chance of changing armor on some event. */
export interface SkimpyEventChance {
  slip: number | undefined
  change: number | undefined
  damage: number | undefined
  unequip: number | undefined
}

/** Time (in seconds) before trying to put non-skimpy equipment back. */
export interface SkimpyEventRecoveryTime {
  min: number | undefined
  max: number | undefined
}

/** Will the mod try to redress NPCs to avoid them to be naked due to Outfit differences? */
export interface RedressNPC {
  /** Enable the option to redress? If not enabled, player may need to periodically restore
   * NPC armors with the `Resetinventory` console command.
   */
  enabled: boolean
  /** Apply redressing on followers as well? */
  workOnFollowers: boolean
}

export interface MalfunctionMessages {
  logThem: boolean
  notifyThem: boolean
  slip: boolean
  change: boolean
  damage: boolean
  unequip: boolean
}
