import { GetModest, GetSkimpy } from "skimpify-api"
import {
  Actor,
  Armor,
  Game,
  hooks,
  once,
  printConsole,
  writeLogs,
} from "skyrimPlatform"

const enum Anim {
  SprintStart = "SprintStart",
  SprintStop = "SprintStop",
  SneakStart = "SneakStart",
  attackStart = "attackStart",
  attackPowerStartInPlace = "attackPowerStartInPlace",
  attackPowerStartForward = "attackPowerStartForward",
}

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

  hooks.sendAnimationEvent.add(
    {
      enter(_) {},
      leave(c) {
        printConsole(c.selfId.toString(16))
        if (c.animationSucceeded) once("update", () => Test())
      },
    },
    0x14,
    0x14,
    "SneakStart"
  )

  hooks.sendAnimationEvent.add(
    {
      enter(_) {},
      leave(c) {
        if (c.animationSucceeded) once("update", () => Test())
      },
    },
    0x14,
    0x14,
    "SneakStop"
  )

  hooks.sendAnimationEvent.add(
    {
      enter(_) {},
      leave(c) {
        if (c.animationSucceeded) once("update", () => Test())
      },
    },
    0x14,
    0x14,
    "attackStart"
  )
}

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
