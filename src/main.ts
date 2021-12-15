import { Hotkeys } from "DmLib"
import {
  Ammo,
  DxScanCode,
  HitEvent,
  hooks,
  on,
  once,
  SendAnimationEventHook,
  Weapon,
  WeaponType,
  writeLogs,
} from "skyrimPlatform"
import {
  evt,
  logAnim,
  restoreEquipHk,
  SkimpyEventChance,
  SkimpyEventRecoveryTime,
} from "./config"
import { playerId } from "./constants"
import { Redress, TryRestore, TrySkimpify } from "./equipment"

export function main() {
  LogAnimations(logAnim)

  AddSkimpifyEvent("SneakStart", evt.sneak.chance, false)
  AddSkimpifyEvent("SneakSprintStartRoll", evt.sneak.chance)
  AddRestoreEvent("SneakStop", evt.sneak.recoveryTime, false)

  AddSkimpifyEvent("SwimStart", evt.swim.chance, false)
  AddRestoreEvent("swimStop", evt.swim.recoveryTime, false)

  AddSkimpifyEvent("SprintStart", evt.sprint.chance, true)
  AddRestoreEvent("SprintStop", evt.sprint.recoveryTime, true)

  AddSkimpifyEvent("JumpStandingStart", evt.jump.chance, true)
  AddSkimpifyEvent("JumpDirectionalStart", evt.jump.chance, true)

  // These were deactivated because they tended to break "muh immersion"
  // AddRestoreEvent("JumpLand", evt.jump.recoveryTime, true)
  // AddRestoreEvent("JumpLandDirectional", evt.jump.recoveryTime, true)

  // Combat related
  AddSkimpifyEvent("attackStart", evt.attack.chance, true)
  AddSkimpifyEvent("bowAttackStart", evt.attack.chance, true)
  AddSkimpifyEvent("attackPowerStartInPlace", evt.powerAttack.chance, true)
  AddSkimpifyEvent("attackPowerStartForward", evt.powerAttack.chance, true)
  AddSkimpifyEvent("attackPowerStartBackward", evt.powerAttack.chance, true)
  AddSkimpifyEvent("attackPowerStartRight", evt.powerAttack.chance, true)
  AddSkimpifyEvent("attackPowerStartLeft", evt.powerAttack.chance, true)

  AddSkimpifyEvent("bashStart", evt.block.chance, true)

  AddRestoreEvent("Unequip", evt.attack.recoveryTime) // Sheathe weapon

  // Peasants
  // IdleFeedChicken, IdleCarryBucketPourEnter
  AddRestoreEvent("IdleStop", evt.townspeople.recoveryTime, false)
  AddRestoreEvent("IdleStopInstant", evt.townspeople.recoveryTime, false)
  AddSkimpifyEvent("IdleBedExitStart", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleBedLeftEnterStart", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleChairFrontEnter", evt.townspeople.chance, false)
  AddSkimpifyEvent("idleChairShoulderFlex", evt.townspeople.chance, false)
  AddSkimpifyEvent("ChairDrinkingStart", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleCounterStart", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleExamine", evt.townspeople.chance, false)
  AddSkimpifyEvent("idleLooseSweepingStart", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleSharpeningWheelStart", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleWallLeanStart", evt.townspeople.chance, false)

  /** This event counts for any Actor in combat */
  on("hit", (e) => {
    // printConsole(
    //   `+++ HIT: ${e.source.getName()} ${e.source.getFormID().toString(16)}`
    // )
    HitBySpell(e)
    HitByWeapon(e)
  })

  const OnT = Hotkeys.ListenTo(DxScanCode.Backspace)
  const T = () => TrySkimpify(playerId, evt.powerAttacked.chance, true)

  const OnT2 = Hotkeys.ListenTo(DxScanCode.RightControl)
  const T2 = () => TryRestore(playerId, evt.swim.recoveryTime)

  const OnRedress = Hotkeys.ListenTo(restoreEquipHk.hk)

  on("update", () => {
    OnRedress(Redress)
    OnT(T)
    OnT2(T2)
  })
}

function HitBySpell(e: HitEvent) {
  const fus = 0x13e09
  const fusRo = 0x13f39
  const fusRoDa = 0x13f3a
  const c =
    e.source.getFormID() === fus
      ? evt.fus.chance
      : e.source.getFormID() === fusRo
      ? evt.fusRo.chance
      : e.source.getFormID() === fusRoDa
      ? evt.fusRoDa.chance
      : null
  if (!c) return
  // printConsole("fus ro da")
  TrySkimpify(e.target.getFormID(), c, true)
}

function HitByWeapon(e: HitEvent) {
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

function LogAnimations(log: boolean) {
  if (!log) return
  const Ysolda = 0x1a69a
  const Sigrid = 0x13483
  const Vera = 0x3600dbf9
  const Elisif = 0x198c1
  const Carlotta = 0x1a675
  const t = Carlotta
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
