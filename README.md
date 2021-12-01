# Wardrobe Malfunction
Skyrim Platform plugin. Wardrobe malfunctions while in action.

# Overview

Many armors have skimpy or damaged variants, but there's no way to really use them but to go to your items menu and then equip them manually to simulate things happening while playing... until now.

This plugin will automatically switch to armor variants registered in the [Skimpify Framework][] when some things happen and the probability to have a change on the armor is true.

After some time passes and conditions are right, wardrobe malfunctions are restored.

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

Battle actions may even lead to armors being completely un equipped.\
On the player, unequipped armors will be restored when possible, so you don't have to do it manually.

- Getting attacked<sup>*</sup>

<sup>*</sup> Getting attacked by arrows and magic won't trigger wardrobe malfunctions.

Some every day actions may trigger wardrobe malfunctions on NPCs.\
Theoretically, they can work on the player too, if you use a mod that lets you do those kind of actions.

- Browsing items at a stall.

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

Armors unequipped in combat will be automatically restored **on the player**.\
Right now there's no option to reequip armors on NPCs.

[CocoAssassin]: https://www.rektasmarket.com/post/coco-shadow-assassin
[Skimpify Framework]: https://github.com/CarlosLeyvaAyala/skimpify-framework
