import { Animations } from "DmLib/Animation"
import {
  Actor,
  Game,
  hooks,
  once,
  printConsole,
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
import { RedressNpc, RedressPlayer, TrySkimpify } from "./equipment"

export function HookAnims() {
  LogAnimations(logAnim)
  HookExploring()
  HookCombat()
  HookPeasants()
}

function HookExploring() {
  const sn = evt.explore.sneak
  AddSkimpifyEvent(Animations.SneakStart, sn.chance, sn.playerOnly)
  AddSkimpifyEvent(Animations.SneakSprintStartRoll, sn.chance, sn.playerOnly)
  AddRestoreEvent(Animations.SneakStop, sn.recoveryTime, sn.playerOnly)

  const sw = evt.explore.swim
  AddSkimpifyEvent(Animations.SwimStart, sw.chance, sw.playerOnly)
  AddRestoreEvent(Animations.SwimStop, sw.recoveryTime, sw.playerOnly)

  const sp = evt.explore.sprint
  AddSkimpifyEvent(Animations.SprintStart, sp.chance, sp.playerOnly)
  AddRestoreEvent(Animations.SprintStop, sp.recoveryTime, sp.playerOnly)

  const jm = evt.explore.jump
  AddSkimpifyEvent(Animations.JumpStandingStart, jm.chance, jm.playerOnly)
  AddSkimpifyEvent(Animations.JumpDirectionalStart, jm.chance, jm.playerOnly)

  // These were deactivated because they tended to break "muh immersion"
  // AddRestoreEvent("JumpLand", evt.jump.recoveryTime, true)
  // AddRestoreEvent("JumpLandDirectional", evt.jump.recoveryTime, true)
}

function HookCombat() {
  const at = evt.combat.attack.chance
  const pa = evt.combat.powerAttack.chance
  HookManySkimpify(
    [
      Animations.AttackStart,
      Animations.BowAttackStart,
      Animations.AttackStartDualWield,
      Animations.AttackStartH2HLeft,
      Animations.AttackStartH2HRight,
      Animations.AttackStartLeftHand,
    ],
    at,
    true
  )
  HookManySkimpify(
    [
      Animations.AttackPowerStartInPlace,
      Animations.AttackPowerStartInPlaceLeftHand,
      Animations.AttackPowerStartForward,
      Animations.AttackPowerStartForwardLeftHand,
      Animations.AttackPowerStartForwardH2HRightHand,
      Animations.AttackPowerStartForwardH2HLeftHand,
      Animations.AttackPowerStartBackward,
      Animations.AttackPowerStartRight,
      Animations.AttackPowerStartRightLeftHand,
      Animations.AttackPowerStartLeft,
      Animations.AttackPowerStartLeftLeftHand,
      Animations.AttackPowerStartDualWield,
      Animations.AttackPowerStartH2HCombo,
    ],
    pa,
    true
  )

  AddSkimpifyEvent(Animations.BashStart, evt.combat.block.chance, true)

  AddRestoreEvent(Animations.Unequip, evt.combat.recoveryTime, false) // Sheathe weapon
}

function HookPeasants() {
  const be = evt.townspeople.bendOver.chance
  const ly = evt.townspeople.layDown.chance
  const leg = evt.townspeople.liftLegs.chance
  HookManySkimpify(
    [
      Animations.IdleAlchemyEnter,
      Animations.IdleBedExitStart,
      Animations.IdleBlacksmithForgeEnter,
      Animations.IdleCarryBucketPourEnter,
      Animations.IdleChairShoulderFlex,
      Animations.ChairDrinkingStart,
      Animations.IdleCounterStart,
      Animations.IdleEnchantingEnter,
      Animations.IdleExamine,
      Animations.IdleLeanTableEnter,
      Animations.IdleLooseSweepingStart,
      Animations.IdleSharpeningWheelStart,
      Animations.IdleTanningEnter,
      Animations.IdlePrayCrouchedEnter,
    ],
    be,
    false
  )
  HookManySkimpify(
    [
      Animations.IdleChairFrontEnter,
      Animations.IdleTelvanniTowerFloatDown,
      Animations.IdleTelvanniTowerFloatUp,
      Animations.HorseEnter,
      Animations.HorseExit,
    ],
    leg,
    false
  )
  AddSkimpifyEvent(Animations.IdleBedLeftEnterStart, ly, false)

  const rt = evt.townspeople.recoveryTime
  AddRestoreEvent(Animations.IdleStop, rt, false)
  AddRestoreEvent(Animations.IdleStopInstant, rt, false)
  AddRestoreEvent(Animations.HorseExit, rt, false)
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
        try {
          if (c.animationSucceeded) once("update", () => f(c.selfId))
        } catch (error) {}
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
  playerOnly: boolean = true
) {
  const F = (selfId: number) => {
    // printConsole(`${selfId} - ${playerOnly}`)
    if (selfId === playerId) RedressPlayer(selfId, time)
    else if (!playerOnly) {
      //   printConsole("Calling redress npc " + selfId)
      RedressNpc(selfId, time)
    }

    // TODO: Remove npc options from settings.txt
    // if (forceNpcs && selfId !== playerId)
    //   RedressNpc(Actor.from(Game.getFormEx(selfId)), time)
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
