import { waitActor } from "DmLib/Actor"
import { I } from "DmLib/Combinators"
import {
  ForEachEquippedArmor,
  ForEachOutfitItemR,
  GetEquippedArmors,
} from "DmLib/Form"
import * as Log from "DmLib/Log"
import * as JDB from "JContainers/JDB"
import * as JMap from "JContainers/JMap"
import { JMapL } from "JContainers/JTs"
import { ActorIsFollower } from "LibFire/LibFire"
import {
  CanUseArmor,
  GetChange,
  GetDamage,
  GetMostModest,
  GetSlip,
  HasModest,
  HasSkimpy,
  IsNotRegistered,
  SkimpyFunc,
} from "skimpify-api"
import {
  Actor,
  Armor,
  Debug,
  Form,
  Game,
  ObjectLoadedEvent,
  Utility,
} from "skyrimPlatform"
import {
  SkimpyEventChance,
  SkimpyEventRecoveryTime,
  malfunctionMsg,
  redressNPC,
  restoreEquipC,
} from "./config"
import { playerId } from "./constants"
import { LI, LN } from "./debug"

type FormArg = Form | null
type FormToForm = (f: FormArg) => FormArg

/** Creates a malfunction message to let the player know a malfunction happened. */
function MalfunctionMsg(ac: Actor, msg: string, enable: boolean) {
  return !enable
    ? (a: Armor) => {}
    : (a: Armor) => {
        const n = a.getName()
        if (!n) return
        const m = `${ac.getLeveledActorBase()?.getName()}'s ${n} ${msg}!`
        if (malfunctionMsg.notifyThem) Debug.notification(m)
        if (malfunctionMsg.logThem) LI(m)
      }
}

/** Tries to change all armors to skimpy versions based on a chance.
 *
 * @param actorId Actor to change equipment for.
 * @param c Chances to skimpify armors.
 * @param canUnequip Is it possible to unequip armors?
 */
export function TrySkimpify(
  actorId: number,
  c: SkimpyEventChance,
  canUnequip: boolean = false
) {
  const act = Actor.from(Game.getFormEx(actorId))
  if (!CanUseArmor(act)) return

  const ac = act as Actor // CanUseArmor() guarantees `act` is an Actor
  type M = (v: Armor) => void

  let { skimpable, unequipable } = canUnequip
    ? DivideByType(ac)
    : GetSkimpable(ac)

  /** Marks a change of armors if a chance is met. */
  const C = (chance: number | undefined, Skimpify: SkimpyFunc, MsgF: M) => {
    if (chance === undefined || chance <= 0) return []

    const CanChange = GetChance(chance)
    let r: ChangePair[] = []

    // Use `filter` to discard elements that are being added to some change list
    skimpable = skimpable.filter((v) => {
      if (CanChange()) {
        const na = Skimpify(v)
        if (!na) return true // Has no skimpy version. Can still be processed later.

        MsgF(v)
        r.push({ from: v, to: na })
        return false // Avoid selected armor from being changed by other functions.
      }
      return true
    })
    return r
  }

  const ss = MalfunctionMsg(ac, "slipped", malfunctionMsg.slip)
  const ch = MalfunctionMsg(ac, "lost a piece", malfunctionMsg.change)
  const dm = MalfunctionMsg(ac, "got DAMAGED", malfunctionMsg.damage)
  const slips = C(c.slip, GetSlip, ss)
  const changes = C(c.change, GetChange, ch)
  const damages = C(c.damage, GetDamage, dm)

  slips.forEach((v) => Swap(ac, v.from, v.to))
  changes.forEach((v) => Swap(ac, v.from, v.to))
  damages.forEach((v) => Swap(ac, v.from, v.to))

  if (!canUnequip) return
  // Try to unequip all armors that weren't processed before.
  TryUnequip(ac, skimpable.concat(unequipable), c.unequip)
}

/** Unequips armors from an `Actor` with some chance.
 *
 * @param ac Un
 * @param s List of armors that can be skimpified.
 * @param u List of armors that can be unequipped.
 * @param c Chance to unequip armors.
 * @returns
 */
function TryUnequip(ac: Actor, armors: Armor[], c: number | undefined) {
  if (!c || c <= 0) return
  const Try = GetChance(c)
  const S = ac.getFormID() === playerId ? SavePlayerEquipment : () => {}
  const M = MalfunctionMsg(ac, "was unequipped", malfunctionMsg.unequip)

  armors.forEach((a) => {
    if (!Try()) return
    ac.unequipItem(a, false, true)
    M(a)
    S(a)
  })
}

const playerEqK = ".wardrobe-malfunction.playerEq"

/** Saves the armor the player has equipped before it is unequipped, so
 * it can be automatically restored later.
 *
 * @remarks
 * Saved armors can be skimpy versions of their base armor. Those will be
 * restored as is.\
 * Other functions should take care of restoring the most modest version.
 */
function SavePlayerEquipment(a: Armor) {
  const k = playerEqK + "." + a.getSlotMask()
  JDB.solveFormSetter(k, a, true)
}

/** Restores player armor that was unequipped by this mod while fighting.
 * @remarks
 * There's no need to save/restore unequipped armors for NPCs, since the
 * Skyrim engine will automatically do that on screen loading.
 */
function RestorePlayerEquipment(f: FormToForm = I) {
  const p = Game.getPlayer() as Actor
  const oo = JDB.solveObj(playerEqK)

  JMapL.ForAllKeys(oo, (k, o) => {
    const a = f(JMap.getForm(o, k))
    if (!a) return
    p.equipItem(a, false, true)
    // Delete item from saved forms
    JMap.setForm(o, k, null)
  })

  ClearRestoredArmors(oo)
}

/** Deletes from JDB all armors that were already restored.
 *
 * @param o JMap handle.
 */
function ClearRestoredArmors(o: number) {
  const c = JMapL.FilterForms(o, (frm) => frm !== null && frm !== undefined)
  JMap.clear(o)
  JMap.addPairs(o, c, true)
}

/** Checks if an `Actor` has equipped ANY skimpy armor.
 *
 * @param a The `Actor` to check.
 * @returns `boolean`
 */
function HasSkimpyEquipped(a: Actor | null) {
  const armors = GetEquippedArmors(a)
  return armors.some((armor) => HasModest(armor))
}

///////////////////////////////////////////////////////////
// Redress
type RedressOp = [string, () => void]

const needsToRestoreLostClothes: RedressOp = [
  `You hastily ${
    restoreEquipC < 1 ? "try to put on some" : "put on all your"
  } clothes.`,
  () => RestorePlayerEquipment(WithChance),
]

const allIsInOrder: RedressOp = [
  "You just realized you already have equipped all clothes you lost during battle.",
  () => {},
]

const shouldAdjustClothes: RedressOp = [
  "You just adjusted your clothes.",
  () => RestoreMostModest(Game.getPlayer() as Actor),
]

function getRedressOperation(lostClothesQty: number): RedressOp {
  if (lostClothesQty > 0) return needsToRestoreLostClothes
  else {
    if (HasSkimpyEquipped(Game.getPlayer() as Actor)) return shouldAdjustClothes
    else return allIsInOrder
  }
}

export const Redress = () => {
  //   const c = JMap.count(JDB.solveObj(playerEqK))
  //   const m =
  //     c === 0
  //       ? "You just realized you already have equipped all clothes you lost during battle."
  //       : `You hastily ${
  //           restoreEquipC < 1 ? "try to put on some" : "put on all your"
  //         } clothes.`
  //   if (c > 0) RestorePlayerEquipment(WithChance)
  //   else RestoreMostModest(Game.getPlayer() as Actor)
  const [m, op] = getRedressOperation(JMap.count(JDB.solveObj(playerEqK)))
  op()
  LN(m)
  Debug.notification(m)
}

const WithChance = (f: FormArg) => (GetChance(restoreEquipC)() ? f : null)

///////////////////////////////////////////////////////////

export function TryRestore(actorId: number, t: SkimpyEventRecoveryTime) {
  const ac = Actor.from(Game.getFormEx(actorId))
  if (!ac) return

  const max = t.max === undefined ? 0 : t.max
  const min = t.min === undefined || max <= 0 ? 0 : t.min
  const w = max <= 0 ? 0 : Math.random() * (max - min) + min

  waitActor(ac, w, (act) => {
    if (
      act.isDead() ||
      act.isRunning() ||
      act.isSprinting() ||
      act.isSneaking() ||
      act.isInCombat() ||
      act.isSwimming() ||
      act.isWeaponDrawn() ||
      act.isFlying() ||
      act.isFurnitureInUse(false)
    )
      return

    if (actorId === playerId) {
      RestorePlayerEquipment()
      const f = async () => {
        await Utility.wait(0.1)
        RestoreMostModest(Game.getPlayer() as Actor)
      }
      f()
    } else RestoreMostModest(act)
  })
}

/** Restores the most modest version of all armors equipped on an `Actor`.
 *
 * @param act Actor to restore their armor.
 */
function RestoreMostModest(act: Actor) {
  ForEachEquippedArmor(act, (a) => {
    const na = GetMostModest(a)
    if (na) Swap(act, a, na)
  })
}

export interface ChangePair {
  from: Armor
  to: Armor
}

interface ArmorTypes {
  /** Equipped armors that have a more skimpy version. */
  skimpable: Armor[]
  /** Equipped armors that don't have an skimpy version, so they can be unequipped on hit. */
  unequipable: Armor[]
}

export function GetSkimpable(ac: Actor): ArmorTypes {
  return {
    skimpable: GetEquippedArmors(ac).filter((v) => HasSkimpy(v)),
    unequipable: [],
  }
}

export function DivideByType(ac: Actor): ArmorTypes {
  const equipped = GetEquippedArmors(ac)
  let s: Armor[] = []
  let u: Armor[] = []

  equipped.forEach((a) => {
    if (HasSkimpy(a)) s.push(a)
    else u.push(a)
  })

  return {
    skimpable: s,
    unequipable: u,
  }
}

export const Swap = (a: Actor, aO: Armor, aN: Armor) => {
  a.removeItem(aO, 1, true, null)
  a.equipItem(aN, false, true)
}

export const GetChance = (x: number) => () => Math.random() <= x

/** @experimental
 * This doesn't work for all NPCs because the event itself doesn't do that.\
 * SPID can be used to solve this, but that would mean an esp plugin is needed.
 */
export function RedressNpcEvt(e: ObjectLoadedEvent) {
  if (e.isLoaded === true) return
  RedressNpc(Actor.from(e.object))
}

/** @experimental
 * Makes sure an NPC doesn't get naked due to outfit not corresponding with current slutty armor */
export function RedressNpc(a: Actor | null) {
  if (!a || a.isDead() || (ActorIsFollower(a) && !redressNPC.workOnFollowers))
    return

  const b = a.getLeveledActorBase()
  if (!b) return

  // Restore unequipped armors that are registered in the framework
  ForEachOutfitItemR(b.getOutfit(false), (i) => {
    if (a.isEquipped(i) || IsNotRegistered(Armor.from(i))) return
    a.equipItem(i, false, true)
    LI(
      `Fixing badly outfitted NPC: ${b.getName()} (${Log.IntToHex(
        a.getFormID()
      )}). Armor: ${i.getName()}.`
    )
  })
}
