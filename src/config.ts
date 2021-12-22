import { DebugLib, Hotkeys } from "DmLib"
import { settings } from "skyrimPlatform"

const n = "wardrobe-malfunction"

//@ts-ignore
const devOpt = settings[n]["config"].developer
export const logAnim = devOpt.logAnims as boolean
export const logActor = parseInt(devOpt.logActor)
export const devHotkeys = devOpt.hotkeys as boolean

//@ts-ignore
const devUsr = settings[n]["config"].user
export const restoreEquipC = devUsr.restoreEquipmentChance as number
export const restoreEquipHk = Hotkeys.FromValue(devUsr.restoreEquipmentHk)
export const redressNPC = devUsr.redressNPC as RedressNPC
export const logLvl = DebugLib.Log.LevelFromValue(devUsr.log.level)
export const logToConsole = devUsr.log.toConsole as boolean
export const logToFile = devUsr.log.toFile as boolean

/** Events configuration. */
export const evt = settings[n]["events"] as SkimpyEvents

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
  attack: SkimpyEvent
  powerAttack: SkimpyEvent
  fus: SkimpyEvent
  fusRo: SkimpyEvent
  fusRoDa: SkimpyEvent
  block: SkimpyEvent
  attacked: SkimpyEvent
  powerAttacked: SkimpyEvent
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
