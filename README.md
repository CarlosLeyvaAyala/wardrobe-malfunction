# Wardrobe Malfunction
Skyrim Platform plugin. Wardrobe malfunctions while in action.

# Overview

Many armors have skimpy or damaged variants, but there's no way to really use them but to go to your items menu and then equip them manually to simulate things happening while playing... until now.

This plugin will automatically switch to armor variants registered in the [Skimpify Framework][] when some things happen and the probability to have a chance on the armor is true.\
After some time passes and conditions are right, wardrobe malfunctions are restored. 

For example, if an armor has a normal version and one with a nipslip, when some things happen there will be a chance to get a nipslip.\
After some other things happen, the nipslip version of the armor will be automatically swapped by the normal one.\
You can think about this as if the `Actor`adjusted their clothes. 

It works for both NPCs and player, but some of these events only apply on the player.

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

- Browsing items in a stall. 

[Skimpify Framework]: https://github.com/CarlosLeyvaAyala/skimpify-framework
