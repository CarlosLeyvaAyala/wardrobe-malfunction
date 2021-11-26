import { settings } from "skyrimPlatform"

const n = "wardrobe-malfunction"

/** Events configuration. */
export const evt = settings[n]["events"] as SkimpyEvents

/** Configuration for all events. */
export interface SkimpyEvents {
  sneak: SkimpyEvent
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
}

/** Time (in seconds) before trying to put non-skimpy equipment back. */
export interface SkimpyEventRecoveryTime {
  min: number | undefined
  max: number | undefined
}
