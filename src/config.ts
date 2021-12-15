import { settings } from "skyrimPlatform"

const n = "wardrobe-malfunction"
//@ts-ignore
const devOpt = settings[n]["config"].developer
export const logAnim = devOpt.logAnims as boolean

//@ts-ignore
const devUsr = settings[n]["config"].user
export const restoreEquipC = devUsr.restoreEquipmentChance as number

/** Events configuration. */
export const evt = settings[n]["events"] as SkimpyEvents

/** Configuration for all events. */
export interface SkimpyEvents {
  townspeople: SkimpyEvent
  sneak: SkimpyEvent
  swim: SkimpyEvent
  sprint: SkimpyEvent
  jump: SkimpyEvent
  attack: SkimpyEvent
  powerAttack: SkimpyEvent
  fus: SkimpyEvent
  fusRo: SkimpyEvent
  fusRoDa: SkimpyEvent
  block: SkimpyEvent
  attacked: SkimpyEvent
  powerAttacked: SkimpyEvent
}

/** Configuration for one single event. */
interface SkimpyEvent {
  chance: SkimpyEventChance
  recoveryTime: SkimpyEventRecoveryTime
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
