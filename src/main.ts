import { DebugLib, FormLib, Hotkeys, Misc } from "DmLib"
import {
  ChangeType,
  GetModest,
  GetModestData,
  GetSkimpy,
  GetSlip,
} from "skimpify-api"
import {
  Actor,
  Armor,
  Game,
  hooks,
  on,
  once,
  printConsole,
  Debug,
  SlotMask,
  settings,
  Utility,
} from "skyrimPlatform"
import {
  SkimpyEvents,
  SkimpyEventChance,
  evt,
  SkimpyEventRecoveryTime,
} from "./config"

const enum Anim {
  SprintStart = "SprintStart",
  SprintStop = "SprintStop",
  SneakStart = "SneakStart",
  attackStart = "attackStart",
  attackPowerStartInPlace = "attackPowerStartInPlace",
  attackPowerStartForward = "attackPowerStartForward",
}

const playerId = 0x14

export function main() {
  // hooks.sendAnimationEvent.add(
  //   {
  //     enter(c) {
  //       writeLogs("animations", c.animEventName)
  //     },
  //     leave(c) {
  //       writeLogs("animations", c.animEventName)
  //     },
  //   },
  //   0x14,
  //   0x14,
  //   "*"
  // )
  on("equip", (e) => {
    // SlotMask.Body
    // SlotMask.PelvisUnder
    // SlotMask.PelvisOuter
    printConsole(Armor.from(e.baseObj)?.getSlotMask().toString(16))
  })

  // hooks.sendAnimationEvent.add(
  //   {
  //     enter(_) {},
  //     leave(c) {
  //       if (c.animationSucceeded)
  //         once("update", () => TrySkimpify(c.selfId, evt.sneak.chance))
  //     },
  //   },
  //   0x14,
  //   0x14,
  //   "SneakStart"
  // )
  AddSkimpifyEvent("SneakStart", evt.sneak.chance)
  // AddSkimpifyEvent("attackStart", evt.sneak.chance)

  hooks.sendAnimationEvent.add(
    {
      enter(_) {},
      leave(c) {
        if (c.animationSucceeded)
          once("update", () => TryRestore(c.selfId, evt.sneak.recoveryTime))
      },
    },
    0x14,
    0x14,
    "SneakStop"
  )
}

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
      Debug.notification(a.getName())
    }
  })
}

function TryRestore(actorId: number, t: SkimpyEventRecoveryTime) {
  const ac = Actor.from(Game.getFormEx(actorId))
  if (!ac) return

  const max = t.max === undefined ? 0 : t.max
  const min = t.min === undefined || t.max === 0 ? 0 : t.min
  const w = Math.random() * (max - min) + min

  const actor = FormLib.PreserveActor(ac)
  const f = async () => {
    printConsole(`Wait ${w} seconds`)
    await Utility.wait(w)

    const act = actor()
    if (!act) return

    if (
      act.isSneaking() ||
      act.isInCombat() ||
      act.isSprinting() ||
      act.isSwimming
    )
      return

    FormLib.ForEachEquippedArmor(act, (a) => {
      const d = GetModestData(a)
      if (!d.armor || d.kind === ChangeType.damage) return
      Swap(act, a, d.armor)
    })
  }
  f()
}

const Swap = (a: Actor, aO: Armor, aN: Armor) => {
  a.removeItem(aO, 1, true, null)
  a.equipItem(aN, false, true)
}

const GetChance = (x: number | undefined) =>
  x === undefined ? () => 0 : () => Math.random() <= x

const Test = () => {
  const pl = Game.getPlayer() as Actor
  const e = pl.getWornForm(4)
  if (!e) return

  const Swap = (a: Armor) => {
    pl.unequipItem(e, false, true)
    pl.equipItem(a, false, true)
  }
  const a = Armor.from(e)
  const s = GetSkimpy(a)
  if (s) {
    Swap(s)
    return
  }

  const m = GetModest(a)
  if (m) Swap(m)
}
