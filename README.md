# Wardrobe Malfunction
Skyrim Platform plugin. Wardrobe malfunctions while in action.

# Overview

Many armors have skimpy or damaged variants, but there's no way to really use them but to go to your items menu and then equip them manually to simulate things happening while playing... until now.

This plugin will automatically switch to armor variants registered in the [Skimpify Framework][] when some things happen and the probability to have a chance on the armor is true.

It works for both NPCs and player, but some of this events only apply on the player.

## Player only

You may get wardrobe malfunctions when:

- Sprinting
- Sneaking
- Swimming
- (Power) Attacking
- Bashing/Blocking

## Player and NPCs

Battle actions may even lead to armors being completely unequipped.\
On the player, unequipped armors will be restored, so you don't have to do it manually.

- Getting attacked<sup>*</sup>

<sup>*</sup> Getting attacked by arrows and magic won't trigger wardrobe malfunctions.

[Skimpify Framework]: https://github.com/CarlosLeyvaAyala/skimpify-framework
