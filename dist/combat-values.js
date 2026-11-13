export const BOMB_DAMAGE=20;

// A sandbox target keeps combat-only items active while the room's doors stay usable.
export function itemCombatActive(room){return !room.clear || room.sandboxTraining===true}
export function itemCombatEncounter(room){
 return room.sandboxTraining===true || (!room.clear && ['fight','challenge','boss','vault','cache'].includes(room.type));
}
