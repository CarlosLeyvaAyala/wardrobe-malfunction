# Wardrobe Malfunction
Skyrim Platform plugin. Wardrobe malfunctions while in action.

# Overview

Many armors have skimpy or damaged variants, but there's no way to really use them but to go to your items menu and then equip them manually to simulate things happening while playing... until now.

This plugin will automatically switch to armor variants registered in the [Skimpify Framework][] when some things happen and the probability to have a change on the armor is true.

When [conditions are right](#automatic-restoration) and after some time passes, wardrobe malfunctions are restored.

For example, [if an armor has a normal version and one with a nipslip][CocoAssassin], when some things happen there will be a chance to get a nipslip.\
After some other things happen, the nipslip version of the armor will be automatically swapped by the normal one.\
You can think about this as if the `Actor` adjusted their clothes when there's no more danger around.

It works for both NPCs and player, but some of these events only apply on the player.

# Events that trigger malfunctions

## Player only

You may get wardrobe malfunctions when:

- Sprinting
- Sneaking
- Swimming
- (Power) Attacking
- Bashing/Blocking

## Player and NPCs

### Battle actions

Battle actions may even lead to armors being completely un equipped.\
On the player, unequipped armors will be restored when possible, so you don't have to do it manually.

- Getting attacked<sup>*</sup>
- Getting hit by Fus Ro Da.

<sup>*</sup> Getting attacked by arrows and magic won't trigger wardrobe malfunctions.\
Arrows don't trigger malfunctions because it's illogical and magic is too expensive to calculate, so it may lead to frequent game hanging.

#### Armor unequipping

Combat related actions can even unequip armor pieces if you configure the probability for that to a value above `0`.

For the player, armors will be automatically reequipped again [as soon as possible](#automatic-restoration).\
**Automatic restoration for followers and NPCs isn't supported** right now due to some technical limitations that I need to work around.

### Mundane actions

Some everyday actions may trigger wardrobe malfunctions on NPCs.\
They work on the player too, but some of them are only available for your Player Character if you use a mod that lets you use some of the animations that are listed below.

- Using crafting furniture in general (alchemy, enchanting, smithing stations).
- Sitting at chairs.
- Browsing items at a stall.
- Going to sleep.

As you can see, aside of going to sleep, most of these require the `Actor` to bend over.

## Configurable

The chance of a wardrobe malfunction happening on any of these events can be configured, so you can have as much lewdness as you want.

You can even deactivate them by setting the chance to `0`.

# Automatic restoration

Events that trigger a wardrobe malfunction restoration:

- Stop sneaking
- Stop swimming
- Stop sprinting
- Sheathe weapons.

For any `Actor` (player included), wardrobe malfunctions will be restored after some (configurable) time has passed **AND** the `Actor` **IS NOT**:

- Dead
- Sprinting
- Sneaking
- In combat<sup>**</sup>
- Swimming
- Weapon drawn

<sup>**</sup> Keep in mind an annoying piece of trash being in a radius of 100m counts as _"being in combat"_ for Skyrim.

## Unequipped armor

Armors that were [unequipped while in combat](#armor-unequipping) will be automatically restored **on the player**.

⚠️ **At some REALLY rare times, equipment doesn't get automatically restored/reequipped when a fight finishes**.\
If that ever happens to you, let this mod to automatically do that for you: **do a quick sprint, enter and exit sneak mode or unsheathe and sheathe your weapon**.

Any of those actions will trigger the automatic equipment restoring functionality.

By the way, **only the armors that were unequipped by this mod will get restored**.\
Mods like Sexlab Defeat or Yamete (which unequip armor pieces while in combat as well) are not handled by this mod.

If a particular piece of armor doesn't get restored, it means this mod didn't unequip it.

Right now there's no option to automatically reequip armors on followers on the fly.\
If you don't use a follower mod that automatically restores outfits on followers, like [Nether's Follower Framework][NFF], their outfits will be reequipped only when they get out of memory and the option to do so is enabled.

# Requirements
All these mods are required, plus their own requirements (obviously):

- [Skyrim Platform][]
- [Skimpify Framework][]
- [LibFire][]

# Configuration

⚠️ If you are using Mod Organizer, it's suggested you put the configuration file **inside your overwrite folder**, so you can modify settings on the fly; ie. while playing.\
Thus, you should have `overwrite\Platform\Plugins\wardrobe-malfunction-settings.txt`.

⚠️ All chances are written in decimal format, so `1` means 100%, `0.5` = 50%, `0.01` = 1%...

## Config > user

General configuration.

```json
"config": {
  "user":{
    "restoreEquipmentHk": "Ctrl Enter",
    "restoreEquipmentChance": 0.5,
    "redressNPC": {
      "enabled": true,
      "workOnFollowers": false
    }
  }
```

### restoreEquipmentHk

When pressing this [hotkey][Hotkeys], player will equip pieces of armor that were unequipped while in combat, with a chance of [`restoreEquipmentChance`](#restoreequipmentchance).

When using this functionality, you will get a notification saying `"You hastily try to put on some clothes."`, so you may correctly guess this functionality is to simulate just that.

Depending on your settings, long battles may leave you totally naked.\
This hotkey reequips those armors without the need for you to go to your inventory to manually do so.

There's no need to use this after combat finishes, since all your equipment [will be automatically restored](#unequipped-armor).

⚠️ If you are never going to use this key, it's better for performance reasons to just [disable it][HkDisable].

### restoreEquipmentChance

The chance to put on armor that was unequipped while in combat.\
Default `0.5` (50%).

This means not all armor will be equipped. Just some pieces, for _muh immersion_ purposes.

If you want to restore all armor while in combat, set this value to `1`.

### redressNPC > enabled

Due to some Skyrim engine idiosynchrasies that are out of the scope of this help file, NPCs that use armors that can be "skimpified" will sometimes get those unequipped.

This will use an **experimental** method to try to reequip armors when possible.

If you set this value to `false` expect to use the `Resetinventory` console command on NPCs quite a lot... or see barebreasted women all the time.\
Your choice ( ͡° ͜ʖ ͡°).

### redressNPC > workOnFollowers

This is even more experimental thant the option above.

If set to its default `false`, it won't try to reequip armors on followers.\
This is the recommended option, and it's suggested to let your follower manager mod to do all the equipment management.

[Nether's Follower Framework][NFF] is my personal choice and recommendation.\
Quite light, bug free and with lots of features.\
Highly endorsed.

## Config > developer

Not meant for users, but for mod developers.

Don't touch these if you don't know what you are doing.

### logAnims

Log animation names to `Platform\Logs\animations-logs.txt`?

Used for finding animation hooks that can trigger wardrobe malfunctions / equipment restoration.

### logActor

`RefID` of the actor to log animations for.

If let blank, will log player animations.

### hotkeys

Enable testing hotkeys?

Will enable the use of `OnT` and `OnT2` hotkey listeners found in `main.ts` (notice how those hotkeys are hardcoded).

## events



[CocoAssassin]: https://www.rektasmarket.com/post/coco-shadow-assassin
[HkDisable]: https://github.com/CarlosLeyvaAyala/DM-Lib-Typescript/blob/main/Hotkeys.md#removing-hotkeys
[Hotkeys]: https://github.com/CarlosLeyvaAyala/DM-Lib-Typescript/blob/main/Hotkeys.md
[LibFire]: https://github.com/fireundubh/LibFire/releases
[NFF]: https://www.nexusmods.com/skyrimspecialedition/mods/55653
[Skimpify Framework]: https://github.com/CarlosLeyvaAyala/skimpify-framework
[Skyrim Platform]: https://www.nexusmods.com/skyrimspecialedition/mods/54909
