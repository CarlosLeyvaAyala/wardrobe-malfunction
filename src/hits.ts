import {
  Ammo,
  Game,
  HitEvent,
  Weapon,
  WeaponType,
  printConsole,
  writeLogs,
} from "skyrimPlatform"
import { evt } from "./config"
import { devLogName } from "./constants"
import { LE } from "./debug"
import { TrySkimpify } from "./equipment"
import { getFormFromUniqueId } from "../../../../../SteamLibrary/steamapps/common/Skyrim Special Edition/Data/Platform/Modules/DmLib/Form"

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

    const c =
      t === WeaponType.Crossbow || t === WeaponType.Bow || Ammo.from(e.source)
        ? evt.combat.arrow.chance
        : e.isHitBlocked
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
  try {
    const id = e.source.getFormID()
    // printConsole(id.toString(16))
    // printConsole(id.toString(16))
    // printConsole(id.toString(16))
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

let kingsbane1 = -1
let kingsbane2 = -1
let kingsbane3 = -1
// const kingsbaneExplosion1 = 0x14428a

const IsShoutL1 = (id: number) =>
  id === fus || id === cyclone1 || id === kingsbane1

const IsShoutL2 = (id: number) =>
  id === fusRo || id === cyclone2 || id === kingsbane2

const IsShoutL3 = (id: number) => id === fusRoDa || id === kingsbane3

export function getThunderchildIds() {
  const getId = (str: string) => getFormFromUniqueId(str)?.getFormID() || -1
  kingsbane1 = getId("Thunderchild - Epic Shout Package.esp|0x0ca92f")
  kingsbane2 = getId("Thunderchild - Epic Shout Package.esp|0x0ca931")
  kingsbane3 = getId("Thunderchild - Epic Shout Package.esp|0x0ca933")
}
