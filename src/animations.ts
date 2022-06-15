import { AnimLib as A } from "DmLib"
import {
  Actor,
  Game,
  hooks,
  once,
  SendAnimationEventHook,
  writeLogs,
} from "skyrimPlatform"
import {
  evt,
  logActor,
  logAnim,
  redressNPC,
  SkimpyEventChance,
  SkimpyEventRecoveryTime,
} from "./config"
import { devLogName, playerId } from "./constants"
import { RedressNpc, TryRestore, TrySkimpify } from "./equipment"

export function HookAnims() {
  LogAnimations(logAnim)
  HookExploring()
  HookCombat()
  HookPeasants()
}

function HookExploring() {
  const sn = evt.explore.sneak
  AddSkimpifyEvent(A.Animations.SneakStart, sn.chance, sn.playerOnly)
  AddSkimpifyEvent(A.Animations.SneakSprintStartRoll, sn.chance, sn.playerOnly)
  AddRestoreEvent(A.Animations.SneakStop, sn.recoveryTime, sn.playerOnly)

  const sw = evt.explore.swim
  AddSkimpifyEvent(A.Animations.SwimStart, sw.chance, sw.playerOnly)
  AddRestoreEvent(A.Animations.SwimStop, sw.recoveryTime, sw.playerOnly)

  const sp = evt.explore.sprint
  AddSkimpifyEvent(A.Animations.SprintStart, sp.chance, sp.playerOnly)
  AddRestoreEvent(A.Animations.SprintStop, sp.recoveryTime, sp.playerOnly)

  const jm = evt.explore.jump
  AddSkimpifyEvent(A.Animations.JumpStandingStart, jm.chance, jm.playerOnly)
  AddSkimpifyEvent(A.Animations.JumpDirectionalStart, jm.chance, jm.playerOnly)

  // These were deactivated because they tended to break "muh immersion"
  // AddRestoreEvent("JumpLand", evt.jump.recoveryTime, true)
  // AddRestoreEvent("JumpLandDirectional", evt.jump.recoveryTime, true)
}

function HookCombat() {
  const at = evt.combat.attack.chance
  const pa = evt.combat.powerAttack.chance
  HookManySkimpify(
    [
      A.Animations.AttackStart,
      A.Animations.BowAttackStart,
      A.Animations.AttackStartDualWield,
      A.Animations.AttackStartH2HLeft,
      A.Animations.AttackStartH2HRight,
      A.Animations.AttackStartLeftHand,
    ],
    at,
    true
  )
  HookManySkimpify(
    [
      A.Animations.AttackPowerStartInPlace,
      A.Animations.AttackPowerStartInPlaceLeftHand,
      A.Animations.AttackPowerStartForward,
      A.Animations.AttackPowerStartForwardLeftHand,
      A.Animations.AttackPowerStartForwardH2HRightHand,
      A.Animations.AttackPowerStartForwardH2HLeftHand,
      A.Animations.AttackPowerStartBackward,
      A.Animations.AttackPowerStartRight,
      A.Animations.AttackPowerStartRightLeftHand,
      A.Animations.AttackPowerStartLeft,
      A.Animations.AttackPowerStartLeftLeftHand,
      A.Animations.AttackPowerStartDualWield,
      A.Animations.AttackPowerStartH2HCombo,
    ],
    pa,
    true
  )

  AddSkimpifyEvent(A.Animations.BashStart, evt.combat.block.chance, true)

  AddRestoreEvent(A.Animations.Unequip, evt.combat.recoveryTime) // Sheathe weapon
}

function HookPeasants() {
  const be = evt.townspeople.bendOver.chance
  const ly = evt.townspeople.layDown.chance
  const leg = evt.townspeople.liftLegs.chance
  HookManySkimpify(
    [
      A.Animations.IdleAlchemyEnter,
      A.Animations.IdleBedExitStart,
      A.Animations.IdleBlacksmithForgeEnter,
      A.Animations.IdleCarryBucketPourEnter,
      A.Animations.IdleChairShoulderFlex,
      A.Animations.ChairDrinkingStart,
      A.Animations.IdleCounterStart,
      A.Animations.IdleEnchantingEnter,
      A.Animations.IdleExamine,
      A.Animations.IdleLeanTableEnter,
      A.Animations.IdleLooseSweepingStart,
      A.Animations.IdleSharpeningWheelStart,
      A.Animations.IdleTanningEnter,
    ],
    be,
    false
  )
  HookManySkimpify(
    [
      A.Animations.IdleChairFrontEnter,
      A.Animations.IdleTelvanniTowerFloatDown,
      A.Animations.IdleTelvanniTowerFloatUp,
      A.Animations.HorseEnter,
      A.Animations.HorseExit,
    ],
    leg,
    false
  )
  AddSkimpifyEvent(A.Animations.IdleBedLeftEnterStart, ly, false)

  const rt = evt.townspeople.recoveryTime
  AddRestoreEvent(A.Animations.IdleStop, rt, false, redressNPC.enabled)
  AddRestoreEvent(A.Animations.IdleStopInstant, rt, false, redressNPC.enabled)
  AddRestoreEvent(A.Animations.HorseExit, rt, false, redressNPC.enabled)
}

function HookManySkimpify(
  evts: string[],
  chance: SkimpyEventChance,
  playerOnly: boolean = true
) {
  evts.forEach((e) => AddSkimpifyEvent(e, chance, playerOnly))
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
export function AddSkimpifyEvent(
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
export function AddRestoreEvent(
  name: string,
  time: SkimpyEventRecoveryTime,
  playerOnly: boolean = true,
  forceNpcs: boolean = false
) {
  const F = (selfId: number) => {
    TryRestore(selfId, time)
    if (forceNpcs && selfId !== playerId)
      RedressNpc(Actor.from(Game.getFormEx(selfId)))
  }
  AddHook(name, F, playerOnly)
}

export function LogAnimations(log: boolean) {
  if (!log) return
  const t = !logActor ? playerId : logActor
  const L = (c: SendAnimationEventHook.Context) =>
    writeLogs(devLogName, `Anim on 0x${t.toString(16)}: ${c.animEventName}`)

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
