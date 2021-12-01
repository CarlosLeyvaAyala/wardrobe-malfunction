import { Combinators, DebugLib, FormLib, Hotkeys } from "DmLib"
import * as JDB from "JContainers/JDB"
import * as JMap from "JContainers/JMap"
import { JMapL } from "JContainers/JTs"
import {
  ChangeRel,
  GetChange,
  GetDamage,
  GetModestData,
  GetSlip,
  HasSkimpy,
  SkimpyFunc,
} from "skimpify-api"
import {
  Actor,
  Ammo,
  Armor,
  DxScanCode,
  Form,
  Game,
  hooks,
  on,
  once,
  SendAnimationEventHook,
  Utility,
  Weapon,
  WeaponType,
  writeLogs,
} from "skyrimPlatform"
import {
  evt,
  logAnim,
  restoreEquipC,
  SkimpyEventChance,
  SkimpyEventRecoveryTime,
} from "./config"

const playerId = 0x14

export function main() {
  LogAnimations(logAnim)

  AddSkimpifyEvent("SneakStart", evt.sneak.chance)
  AddSkimpifyEvent("SneakSprintStartRoll", evt.sneak.chance)
  AddRestoreEvent("SneakStop", evt.sneak.recoveryTime)

  AddSkimpifyEvent("SwimStart", evt.swim.chance)
  AddRestoreEvent("swimStop", evt.swim.recoveryTime)

  AddSkimpifyEvent("SprintStart", evt.sprint.chance)
  AddRestoreEvent("SprintStop", evt.sprint.recoveryTime)

  // Combat related
  AddSkimpifyEvent("attackStart", evt.attack.chance)
  AddSkimpifyEvent("bowAttackStart", evt.attack.chance)
  AddSkimpifyEvent("attackPowerStartInPlace", evt.powerAttack.chance)
  AddSkimpifyEvent("attackPowerStartForward", evt.powerAttack.chance)
  AddSkimpifyEvent("attackPowerStartBackward", evt.powerAttack.chance)
  AddSkimpifyEvent("attackPowerStartRight", evt.powerAttack.chance)
  AddSkimpifyEvent("attackPowerStartLeft", evt.powerAttack.chance)

  AddSkimpifyEvent("bashStart", evt.block.chance)

  AddRestoreEvent("Unequip", evt.attack.recoveryTime)

  // Peasants
  AddSkimpifyEvent("IdleExamine", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleCounterStart", evt.townspeople.chance, false)
  // IdleFeedChicken, IdleCarryBucketPourEnter
  AddRestoreEvent("IdleStop", evt.townspeople.recoveryTime, false)
  AddRestoreEvent("IdleStopInstant", evt.townspeople.recoveryTime, false)

  /** This event counts for any Actor in combat */
  on("hit", (e) => {
    const w = Weapon.from(e.source)
    if (!w) return
    const t = w.getWeaponType()
    if (t === WeaponType.Crossbow || t === WeaponType.Bow) return

    if (Ammo.from(e.source)) return
    const c = e.isHitBlocked
      ? evt.block.chance
      : e.isBashAttack || e.isPowerAttack
      ? evt.powerAttacked.chance
      : evt.attacked.chance
    TrySkimpify(e.target.getFormID(), c, true)
  })

  // const OnT = Hotkeys.ListenTo(DxScanCode.Enter)
  // const T = () => TrySkimpify(playerId, evt.powerAttacked.chance, true)

  // const OnT2 = Hotkeys.ListenTo(DxScanCode.RightControl)
  // const T2 = () => TryRestore(playerId, evt.swim.recoveryTime)

  const OnRedress = Hotkeys.ListenTo(DxScanCode.RightControl)
  const Redress = () => RestorePlayerEquipment(WithChance)

  on("update", () => {
    OnRedress(Redress)
    // OnT(T)
    // OnT2(T2)
  })
}

function AddHook(name: string, f: (id: number) => void, playerOnly: boolean) {
  const filter = playerOnly ? playerId : undefined
  hooks.sendAnimationEvent.add(
    {
      enter(_) {},
      leave(c) {
        if (c.animationSucceeded) once("update", () => f(c.selfId))
      },
    },
    filter,
    filter,
    name
  )
}

/** Adds an animation hook that may put on some skimpy clothes on an `Actor`.
 *
 * @param name Animation name.
 * @param chance Change to skimpify when the event happens.
 */
function AddSkimpifyEvent(
  name: string,
  chance: SkimpyEventChance,
  playerOnly: boolean = true
) {
  if (!chance.slip && !chance.change && !chance.damage) return

  AddHook(name, (selfId) => TrySkimpify(selfId, chance), playerOnly)
}

/** Adds an animation hook that may put on some modest clothes on an `Actor`.
 *
 * @param name Animation name.
 * @param time Time that will pass before armors are restored.
 */
function AddRestoreEvent(
  name: string,
  time: SkimpyEventRecoveryTime,
  playerOnly: boolean = true
) {
  AddHook(name, (selfId) => TryRestore(selfId, time), playerOnly)
}

const d = DebugLib.Log.CreateAll(
  "Wardrobe Malfunction",
  DebugLib.Log.Level.verbose,
  DebugLib.Log.ConsoleFmt
)

interface ChangePair {
  from: Armor
  to: Armor
}

interface ArmorTypes {
  /** Equipped armors that have a more skimpy version. */
  skimpable: Armor[]
  /** Equipped armors that don't have an skimpy version, so they can be unequipped on hit. */
  unequipable: Armor[]
}

function GetSkimpable(ac: Actor): ArmorTypes {
  return {
    skimpable: FormLib.GetEquippedArmors(ac).filter((v) => HasSkimpy(v)),
    unequipable: [],
  }
}

function DivideByType(ac: Actor): ArmorTypes {
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

function TrySkimpify(
  actorId: number,
  c: SkimpyEventChance,
  canUnequip: boolean = false
) {
  const ac = Actor.from(Game.getFormEx(actorId))
  if (!ac) return

  let { skimpable, unequipable } = canUnequip
    ? DivideByType(ac)
    : GetSkimpable(ac)

  /** Marks a change of armors if a chance is met. */
  const C = (chance: number | undefined, Skimpify: SkimpyFunc) => {
    if (chance === undefined || chance <= 0) return []

    const CanChange = GetChance(chance)
    let r: ChangePair[] = []

    // Use `filter` to discard elements that are being added to some change list
    skimpable = skimpable.filter((v) => {
      if (CanChange()) {
        const na = Skimpify(v)
        if (!na) return true

        r.push({ from: v, to: na })
        return false // Avoid selected armor from being changed by other functions.
      }
      return true
    })
    return r
  }

  const slips = C(c.slip, GetSlip)
  const changes = C(c.change, GetChange)
  const damages = C(c.damage, GetDamage)

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

  e.forEach((a) => {
    if (!Try()) return
    ac.unequipItem(a, false, true)
    S(a)
  })
}

const playerEqK = ".wardrobe-malfunction.playerEq"

function SavePlayerEquipment(a: Armor) {
  const k = playerEqK + "." + a.getSlotMask()
  JDB.solveFormSetter(k, a, true)
}

type FormArg = Form | null | undefined
type FormToForm = (f: FormArg) => FormArg

const WithChance = (f: FormArg) => (GetChance(restoreEquipC)() ? f : null)

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

function TryRestore(actorId: number, t: SkimpyEventRecoveryTime) {
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

const Swap = (a: Actor, aO: Armor, aN: Armor) => {
  a.removeItem(aO, 1, true, null)
  a.equipItem(aN, false, true)
}

const GetChance = (x: number) => () => Math.random() <= x

function LogAnimations(log: boolean) {
  if (!log) return
  const Ysolda = 0x1a69a
  const Sigrid = 0x13483
  const t = Sigrid
  const L = (c: SendAnimationEventHook.Context) =>
    writeLogs("animations", c.animEventName)

  hooks.sendAnimationEvent.add(
    {
      enter(c) {
        L(c)
      },
      leave(c) {
        L(c)
      },
    },
    t,
    t,
    "*"
  )
}
