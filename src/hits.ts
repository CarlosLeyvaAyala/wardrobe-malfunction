import { Ammo, HitEvent, Weapon, WeaponType, writeLogs } from "skyrimPlatform"
import { evt } from "./config"
import { devLogName } from "./constants"
import { LE } from "./debug"
import { TrySkimpify } from "./equipment"

export function LogHit(e: HitEvent) {
  writeLogs(
    devLogName,
    `Hit by ${e.source.getName()}: 0x${e.source
      .getFormID()
      .toString(16)}. On ${e.target.getName()} 0x${e.target
      .getFormID()
      .toString(16)}.`
  )
}

export function HitByWeapon(e: HitEvent) {
  try {
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
  } catch (error) {
    LE(`Error on hit: ${error}`)
  }
}

export function HitBySpell(e: HitEvent) {
  if (!e.source) return false

  try {
    const id = e.source.getFormID()
    const c = IsShoutL1(id)
      ? evt.combat.fus.chance
      : IsShoutL2(id)
      ? evt.combat.fusRo.chance
      : IsShoutL3(id)
      ? evt.combat.fusRoDa.chance
      : null
    if (!c) return false
    TrySkimpify(e.target.getFormID(), c, true)
    return true
  } catch (error) {
    LE(`Error on hit: ${error}`)
    return false
  }
}

const fus = 0x13e09
const fusRo = 0x13f39
const fusRoDa = 0x13f3a

const cyclone1 = 0x40200bc
const cyclone2 = 0x40200be

const IsShoutL1 = (id: number) => id === fus || id === cyclone1
const IsShoutL2 = (id: number) => id === fusRo || id === cyclone2
const IsShoutL3 = (id: number) => id === fusRoDa
