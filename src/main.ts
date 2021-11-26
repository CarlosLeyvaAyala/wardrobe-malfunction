import { DebugLib, FormLib } from "DmLib"
import { ChangeType, GetModestData, GetSlip } from "skimpify-api"
import {
  Actor,
  Armor,
  Debug,
  Game,
  hooks,
  once,
  printConsole,
  writeLogs,
} from "skyrimPlatform"
import { evt, SkimpyEventChance, SkimpyEventRecoveryTime } from "./config"

const playerId = 0x14

export function main() {
  LogAnimations(false)

  AddSkimpifyEvent("SneakStart", evt.sneak.chance)
  AddRestoreEvent("SneakStop", evt.sneak.recoveryTime)

  AddSkimpifyEvent("SprintStart", evt.sprint.chance)
  AddRestoreEvent("SprintStop", evt.sprint.recoveryTime)

  AddSkimpifyEvent("attackStart", evt.attack.chance)
  AddSkimpifyEvent("attackPowerStartInPlace", evt.powerAttack.chance)
  AddSkimpifyEvent("attackPowerStartForward", evt.powerAttack.chance)
  AddSkimpifyEvent("attackPowerStartBackward", evt.powerAttack.chance)
  AddSkimpifyEvent("attackPowerStartRight", evt.powerAttack.chance)
  AddSkimpifyEvent("attackPowerStartLeft", evt.powerAttack.chance)
  AddRestoreEvent("Unequip", evt.attack.recoveryTime)
}

/** Adds an animation hook that may put on some skimpy clothes on an `Actor`.
 *
 * @param name Animation name.
 * @param chance Change to skimpify when the event happens.
 */
function AddSkimpifyEvent(name: string, chance: SkimpyEventChance) {
  hooks.sendAnimationEvent.add(
    {
      enter(_) {},
      leave(c) {
        if (c.animationSucceeded)
          once("update", () => TrySkimpify(c.selfId, chance))
      },
    },
    0x14,
    0x14,
    name
  )
}

/** Adds an animation hook that may put on some modest clothes on an `Actor`.
 *
 * @param name Animation name.
 * @param time Time that will pass before armors are restored.
 */
function AddRestoreEvent(name: string, time: SkimpyEventRecoveryTime) {
  hooks.sendAnimationEvent.add(
    {
      enter(_) {},
      leave(c) {
        if (c.animationSucceeded)
          once("update", () => TryRestore(c.selfId, time))
      },
    },
    0x14,
    0x14,
    name
  )
}

const d = DebugLib.Log.CreateAll(
  "Wardrobe Malfunction",
  DebugLib.Log.Level.verbose,
  DebugLib.Log.ConsoleFmt
)

function TrySkimpify(actorId: number, c: SkimpyEventChance) {
  const ac = Actor.from(Game.getFormEx(actorId))
  if (!ac) return
  const TrySlip = GetChance(c.slip)

  FormLib.ForEachEquippedArmor(ac, (a) => {
    if (TrySlip()) {
      const na = GetSlip(a)
      if (!na) return
      Swap(ac, a, na)
    }
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
      act.isSwimming()
    )
      return

    FormLib.ForEachEquippedArmor(act, (a) => {
      const d = GetModestData(a)
      if (!d.armor || d.kind === ChangeType.damage) return
      Swap(act, a, d.armor)
    })
  })
}

const Swap = (a: Actor, aO: Armor, aN: Armor) => {
  a.removeItem(aO, 1, true, null)
  a.equipItem(aN, false, true)
}

const GetChance = (x: number | undefined) =>
  x === undefined ? () => 0 : () => Math.random() <= x

function LogAnimations(log: boolean) {
  if (!log) return
  hooks.sendAnimationEvent.add(
    {
      enter(c) {
        writeLogs("animations", c.animEventName)
      },
      leave(c) {
        writeLogs("animations", c.animEventName)
      },
    },
    0x14,
    0x14,
    "*"
  )
}
