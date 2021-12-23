import { Combinators, DebugLib, FormLib } from "DmLib"
import * as JDB from "JContainers/JDB"
import * as JMap from "JContainers/JMap"
import { JMapL } from "JContainers/JTs"
import { ActorIsFollower } from "LibFire/LibFire"
import {
  ChangeRel,
  GetChange,
  GetDamage,
  GetModestData,
  GetSlip,
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
  malfunctionMsg,
  redressNPC,
  restoreEquipC,
  SkimpyEventChance,
  SkimpyEventRecoveryTime,
} from "./config"
import { playerId } from "./constants"
import { LI, LN } from "./debug"

type FormArg = Form | null | undefined
type FormToForm = (f: FormArg) => FormArg

/** Creates a malfunction message to let the player know a malfunction happened. */
function MalfunctionMsg(ac: Actor, msg: string, enable: boolean) {
  return !enable
    ? (a: Armor) => {}
    : (a: Armor) => {
        const n = a.getName()
        if (!n) return
        const m = `${ac.getLeveledActorBase()?.getName()}'s ${n} ${msg}!`
        Debug.notification(m)
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
  const ac = Actor.from(Game.getFormEx(actorId))
  if (!ac) return

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
        if (!na) return true

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

  TryUnequip(ac, skimpable, unequipable, c.unequip)
}

function TryUnequip(ac: Actor, s: Armor[], u: Armor[], c: number | undefined) {
  if (!c || c <= 0) return
  const Try = GetChance(c)
  const e = s.concat(u)
  const S = ac.getFormID() === playerId ? SavePlayerEquipment : () => {}
  const M = MalfunctionMsg(ac, "was unequipped", malfunctionMsg.unequip)

  e.forEach((a) => {
    if (!Try()) return
    ac.unequipItem(a, false, true)
    M(a)
    S(a)
  })
}

const playerEqK = ".wardrobe-malfunction.playerEq"

function SavePlayerEquipment(a: Armor) {
  const k = playerEqK + "." + a.getSlotMask()
  JDB.solveFormSetter(k, a, true)
}

function RestorePlayerEquipment(f: FormToForm = Combinators.I) {
  const p = Game.getPlayer() as Actor

  JMapL.ForAllKeys(JDB.solveObj(playerEqK), (k, o) => {
    const a = f(JMap.getForm(o, k))
    if (!a) return
    p.equipItem(a, false, true)
    // Delete item from saved forms
    JMap.setForm(o, k, null)
  })
}

export const Redress = () => {
  const m = `You hastily ${
    restoreEquipC < 1 ? "try to put on some" : "put on all your"
  } clothes.`
  LN(m)
  Debug.notification(m)
  RestorePlayerEquipment(WithChance)
}

const WithChance = (f: FormArg) => (GetChance(restoreEquipC)() ? f : null)

export function TryRestore(actorId: number, t: SkimpyEventRecoveryTime) {
  const ac = Actor.from(Game.getFormEx(actorId))
  if (!ac) return

  const max = t.max === undefined ? 0 : t.max
  const min = t.min === undefined || max <= 0 ? 0 : t.min
  const w = max <= 0 ? 0 : Math.random() * (max - min) + min

  FormLib.WaitActor(ac, w, (act) => {
    if (
      act.isDead() ||
      act.isSprinting() ||
      act.isSneaking() ||
      act.isFlying() ||
      act.isInCombat() ||
      act.isSwimming() ||
      act.isWeaponDrawn()
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
  FormLib.ForEachEquippedArmor(act, (a) => {
    const na = MostModest(a)
    if (na) Swap(act, a, na)
  })
}

function MostModest(a: Armor): Armor | null {
  const p = GetModestData(a)
  if (!p.armor || p.kind === ChangeRel.damage) return null
  const pp = MostModest(p.armor)
  return pp ? pp : p.armor
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
    skimpable: FormLib.GetEquippedArmors(ac).filter((v) => HasSkimpy(v)),
    unequipable: [],
  }
}

export function DivideByType(ac: Actor): ArmorTypes {
  const equipped = FormLib.GetEquippedArmors(ac)
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

export function RedressNpcEvt(e: ObjectLoadedEvent) {
  if (e.isLoaded === true) return
  RedressNpc(Actor.from(e.object))
}

/** Makes sure an NPC doesn't get naked due to outfit not corresponding with current slutty armor */
export function RedressNpc(a: Actor | null) {
  if (!a || a.isDead() || (ActorIsFollower(a) && !redressNPC.workOnFollowers))
    return

  const b = a.getLeveledActorBase()
  if (!b) return

  // Restore unequipped armors that are registered in the framework
  FormLib.ForEachOutfitItemR(b.getOutfit(false), (i) => {
    if (a.isEquipped(i) || IsNotRegistered(Armor.from(i))) return
    a.equipItem(i, false, true)
    LI(
      `Fixing badly outfitted NPC: ${b.getName()} (${DebugLib.Log.IntToHex(
        a.getFormID()
      )}). Armor: ${i.getName()}.`
    )
  })
}
