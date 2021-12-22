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
import { playerId } from "./constants"
import { RedressNpc, TryRestore, TrySkimpify } from "./equipment"

export function HookAnims() {
  LogAnimations(logAnim)
  HookExploring()
  HookCombat()
  HookPeasants()
}

function HookExploring() {
  AddSkimpifyEvent("SneakStart", evt.explore.sneak.chance, false)
  AddSkimpifyEvent("SneakSprintStartRoll", evt.explore.sneak.chance)
  AddRestoreEvent("SneakStop", evt.explore.sneak.recoveryTime, false)

  AddSkimpifyEvent("SwimStart", evt.explore.swim.chance, false)
  AddRestoreEvent("swimStop", evt.explore.swim.recoveryTime, false)

  AddSkimpifyEvent("SprintStart", evt.explore.sprint.chance, true)
  AddRestoreEvent("SprintStop", evt.explore.sprint.recoveryTime, true)

  AddSkimpifyEvent("JumpStandingStart", evt.explore.jump.chance, true)
  AddSkimpifyEvent("JumpDirectionalStart", evt.explore.jump.chance, true)

  // These were deactivated because they tended to break "muh immersion"
  // AddRestoreEvent("JumpLand", evt.jump.recoveryTime, true)
  // AddRestoreEvent("JumpLandDirectional", evt.jump.recoveryTime, true)
}

function HookCombat() {
  AddSkimpifyEvent("attackStart", evt.attack.chance, true)
  AddSkimpifyEvent("bowAttackStart", evt.attack.chance, true)
  AddSkimpifyEvent("attackPowerStartInPlace", evt.powerAttack.chance, true)
  AddSkimpifyEvent("attackPowerStartForward", evt.powerAttack.chance, true)
  AddSkimpifyEvent("attackPowerStartBackward", evt.powerAttack.chance, true)
  AddSkimpifyEvent("attackPowerStartRight", evt.powerAttack.chance, true)
  AddSkimpifyEvent("attackPowerStartLeft", evt.powerAttack.chance, true)

  AddSkimpifyEvent("bashStart", evt.block.chance, true)

  AddRestoreEvent("Unequip", evt.attack.recoveryTime) // Sheathe weapon
}

function HookPeasants() {
  // IdleFeedChicken,
  AddSkimpifyEvent("IdleAlchemyEnter", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleBedExitStart", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleBedLeftEnterStart", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleBlacksmithForgeEnter", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleCarryBucketPourEnter", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleChairFrontEnter", evt.townspeople.chance, false)
  AddSkimpifyEvent("idleChairShoulderFlex", evt.townspeople.chance, false)
  AddSkimpifyEvent("ChairDrinkingStart", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleCounterStart", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleEnchantingEnter", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleExamine", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleLeanTableEnter", evt.townspeople.chance, false)
  AddSkimpifyEvent("idleLooseSweepingStart", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleSharpeningWheelStart", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleTanningEnter", evt.townspeople.chance, false)
  AddSkimpifyEvent("IdleWallLeanStart", evt.townspeople.chance, false)

  AddRestoreEvent(
    "IdleStop",
    evt.townspeople.recoveryTime,
    false,
    redressNPC.enabled
  )
  AddRestoreEvent(
    "IdleStopInstant",
    evt.townspeople.recoveryTime,
    false,
    redressNPC.enabled
  )
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
  const Ysolda = 0x1a69a
  const Sigrid = 0x13483
  const Vera = 0x3600dbf9
  const Elisif = 0x198c1
  const Carlotta = 0x1a675
  const t = !logActor ? playerId : logActor
  const L = (c: SendAnimationEventHook.Context) =>
    writeLogs("animations", `0x${t.toString(16)}: ${c.animEventName}`)

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
