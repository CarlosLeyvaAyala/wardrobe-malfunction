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
import { displayName, playerId } from "./constants"
import { RedressNpc, TryRestore, TrySkimpify } from "./equipment"

export function HookAnims() {
  LogAnimations(logAnim)
  HookExploring()
  HookCombat()
  HookPeasants()
}

function HookExploring() {
  const sn = evt.explore.sneak
  AddSkimpifyEvent("SneakStart", sn.chance, sn.playerOnly)
  AddSkimpifyEvent("SneakSprintStartRoll", sn.chance, sn.playerOnly)
  AddRestoreEvent("SneakStop", sn.recoveryTime, sn.playerOnly)

  const sw = evt.explore.swim
  AddSkimpifyEvent("SwimStart", sw.chance, sw.playerOnly)
  AddRestoreEvent("swimStop", sw.recoveryTime, sw.playerOnly)

  const sp = evt.explore.sprint
  AddSkimpifyEvent("SprintStart", sp.chance, sp.playerOnly)
  AddRestoreEvent("SprintStop", sp.recoveryTime, sp.playerOnly)

  const jm = evt.explore.jump
  AddSkimpifyEvent("JumpStandingStart", jm.chance, jm.playerOnly)
  AddSkimpifyEvent("JumpDirectionalStart", jm.chance, jm.playerOnly)

  // These were deactivated because they tended to break "muh immersion"
  // AddRestoreEvent("JumpLand", evt.jump.recoveryTime, true)
  // AddRestoreEvent("JumpLandDirectional", evt.jump.recoveryTime, true)
}

function HookCombat() {
  const at = evt.combat.attack.chance
  const pa = evt.combat.powerAttack.chance
  AddSkimpifyEvent("attackStart", at, true)
  AddSkimpifyEvent("bowAttackStart", at, true)
  AddSkimpifyEvent("attackPowerStartInPlace", pa, true)
  AddSkimpifyEvent("attackPowerStartForward", pa, true)
  AddSkimpifyEvent("attackPowerStartBackward", pa, true)
  AddSkimpifyEvent("attackPowerStartRight", pa, true)
  AddSkimpifyEvent("attackPowerStartLeft", pa, true)

  AddSkimpifyEvent("bashStart", evt.combat.block.chance, true)

  AddRestoreEvent("Unequip", evt.combat.recoveryTime) // Sheathe weapon
}

function HookPeasants() {
  // IdleFeedChicken,
  const be = evt.townspeople.bendOver.chance
  const ly = evt.townspeople.layDown.chance
  const leg = evt.townspeople.liftLegs.chance
  AddSkimpifyEvent("IdleAlchemyEnter", be, false)
  AddSkimpifyEvent("IdleBedExitStart", be, false)
  AddSkimpifyEvent("IdleBedLeftEnterStart", ly, false)
  AddSkimpifyEvent("IdleBlacksmithForgeEnter", be, false)
  AddSkimpifyEvent("IdleCarryBucketPourEnter", be, false)
  AddSkimpifyEvent("IdleChairFrontEnter", leg, false)
  AddSkimpifyEvent("idleChairShoulderFlex", be, false)
  AddSkimpifyEvent("ChairDrinkingStart", be, false)
  AddSkimpifyEvent("IdleCounterStart", be, false)
  AddSkimpifyEvent("IdleEnchantingEnter", be, false)
  AddSkimpifyEvent("IdleExamine", be, false)
  AddSkimpifyEvent("IdleLeanTableEnter", be, false)
  AddSkimpifyEvent("idleLooseSweepingStart", be, false)
  AddSkimpifyEvent("IdleSharpeningWheelStart", be, false)
  AddSkimpifyEvent("IdleTanningEnter", be, false)
  AddSkimpifyEvent("IdleTelvanniTowerFloatUp", leg, false)
  AddSkimpifyEvent("IdleTelvanniTowerFloatDown", leg, false)
  // AddSkimpifyEvent("IdleWallLeanStart", evt.townspeople.chance, false)

  const rt = evt.townspeople.recoveryTime
  AddRestoreEvent("IdleStop", rt, false, redressNPC.enabled)
  AddRestoreEvent("IdleStopInstant", rt, false, redressNPC.enabled)
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
    writeLogs(
      `${displayName} Animations`,
      `0x${t.toString(16)}: ${c.animEventName}`
    )

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
