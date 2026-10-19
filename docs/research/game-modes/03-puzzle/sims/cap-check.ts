import { getCapacity } from "../../../../../src/game/selectors.ts";
import { INVENTORY_CAPACITY } from "../../../../../src/game/balance.ts";
console.log("INVENTORY_CAPACITY =", INVENTORY_CAPACITY, "| getCapacity(endless,0) =", getCapacity("endless", 0));
