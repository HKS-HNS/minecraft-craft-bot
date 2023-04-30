const {
    pathfinder,
    Movements,
    goals: {
        GoalNear
    }
} = require('mineflayer-pathfinder');
const { Vec3 } = require('vec3');
const PrismarineItem = require('prismarine-item');

let defaultMove;

function init(defaultMov) {
    defaultMove = defaultMov; 
}

async function autoCraftItem(bot, chest, shulker, barrel, storeChest, mcData, item) {
    const craftingItem = getFirstIngredient(bot, item, mcData);
    
    // Open the chest and steal as many crafting items as possible
    await openChest(bot, chest, mcData);
    const window = await onceWindowOpen(bot);
    await stealChest(bot, window, mcData, chest, craftingItem);
    /*
    // Wait 1 second, then craft the item
    await wait(1000);
    let count = Math.floor(countInventoryItems(bot, craftingItem) / 9);
    await craftItem(bot, item, count, mcData);
    
    // Wait 1 second, then open the shulker box and dump the crafted items
    await wait(1000);
    await openChest(bot, shulker, mcData);
    const shulkerWindow = await onceWindowOpen(bot);
    await dumpChest(bot, shulkerWindow, mcData, shulker, 'iron_block');
    
    // Check if the shulker box is empty. If it is, break it and store it in the store chest
    const shulkerInventory = bot.inventory.slots.slice(36, 45);
    const isEmpty = shulkerInventory.every(slot => !slot || slot.count === 0);
    if (isEmpty) {
      await breakBlock(bot, shulker, mcData);
      await wait(2000);
      await openChest(bot, storeChest, mcData);
      const storeWindow = await onceWindowOpen(bot);
      await putOneItem(bot, storeWindow, mcData, storeChest, 'shulker_box');
      await wait(2000);
      await openChest(bot, barrel, mcData);
      const barrelWindow = await onceWindowOpen(bot);
      await getOneItem(bot, barrelWindow, mcData, barrel, 'shulker_box');
      await wait(1000);
      await placeBlock(bot, shulker, mcData, 'shulker_box');
    }*/
  }
  
  // Helper function to wait for a window to open
  function onceWindowOpen(bot) {
    return new Promise(resolve => {
      bot.once('windowOpen', window => {
        resolve(window);
      });
    });
  }
  
  // Helper function to wait for a specified amount of time
  function wait(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

function getFirstIngredient(bot, itemName, mcData) {
    const itemId = mcData.itemsByName[itemName].id;
    const recipes = bot.recipesAll(itemId);
    if (recipes.length > 0) {
      const recipe = recipes[0];
      const firstIngredientId = recipe.ingredients[0].id;
      return bot.mcData.itemsById[firstIngredientId].displayName;
    } else {
      return "No recipe found for " + itemName;
    }
  }
  

function openChest(bot, chestPosition, mcData) {
    // navigate to the chest position
    bot.pathfinder.setMovements(defaultMove);
    bot.pathfinder.setGoal(new GoalNear(chestPosition.x, chestPosition.y, chestPosition.z, 6));
    // open the chest
    bot.once('goal_reached', () => {
    const chest = bot.blockAt(chestPosition);
    if (chest) {
        //if is type of chest
        if(chest.type === mcData.blocksByName.chest.id || chest.type === mcData.blocksByName.trapped_chest.id)
        bot.openChest(chest);
        else
        bot.openContainer(chest);
    }});
    return true;
}

function closeChest(bot) {
    // close the current window if it is a chest
    const window = bot.currentWindow;
    if (window) {
        bot.closeWindow(window);
    }
}

function countInventoryItems(bot, itemName) {
    // initialize a count variable
    let itemCount = 0;

    // iterate over the bot's inventory items
    for (const item of bot.inventory.items()) {
        // check if the item name matches the specified name
        if (item.name === itemName) {
            // increment the count variable by the item count
            itemCount += item.count;
        }
    }

    // return the item count
    return itemCount;
}

function reloadInventory(bot, window, block) {
    if(block)
    setTimeout(() => {
        bot.closeWindow(window);
        bot.activateBlock(block);
        bot.once('windowOpen', (window) => {
            bot.closeWindow(window);
        });
        
        }, 20);
    };

async function stealChest(bot, window, mcData, position, item){
//estimate the size of the chest
//check how larg all slots together are and subtract the size of the inventory 
 let chestSize = window.slots.length - 36;
//iterate over the chest slots
for (let i = 0; i < chestSize; i++) {
    if (window.slots[i] != null && window.slots[i].name === item) {
    shiftLeftClick(bot, i, window);
    }
}
console.log("stealChest");
const emptySlots = countEmptySlots(bot, window, mcData, position, item);
reloadInventory(bot, window, bot.blockAt(position));
return emptySlots;
}; // TODO

function dumpChest(bot, window, mcData,  position, item){
    let chestSize = window.slots.length - 36;
    //for the inventory slots
    for (let i = chestSize; i < window.slots.length; i++) {
        if (window.slots[i] != null && window.slots[i].name === item) {
            shiftLeftClick(bot, i, window);
        }
    }
    const emptySlots = countEmptySlots(bot, window, mcData, position, item);
    reloadInventory(bot, window, bot.blockAt(position));
    return emptySlots;

}; 

function countEmptySlots(bot, window, mcData, position, item){
    let chestSize = window.slots.length - 36;
    let emptySlots = 0;
    //for the inventory slots
    for (let i = 0; i < chestSize; i++) {
        if (window.slots[i] == null) {
            emptySlots++;
        }
    }
    return emptySlots;
};
    

function putOneItem(bot, window, mcData, position, item){
    let chestSize = window.slots.length - 36;
    //for the inventory slots
    for (let i = chestSize; i < window.slots.length; i++) {
        if (window.slots[i] != null && window.slots[i].name === item) {
            shiftLeftClick(bot, i, window);
            break;
        }
    }
    reloadInventory(bot, window, bot.blockAt(position));

}

function getOneItem(bot, window, mcData, position, item){
    let chestSize = window.slots.length - 36;
    //for the inventory slots
    for (let i = 0; i < chestSize; i++) {
        if (window.slots[i] != null && window.slots[i].name === item) {
            shiftLeftClick(bot, i, window);
            break;
        }
    }
    reloadInventory(bot, window, bot.blockAt(position));

}

function breakBlock(bot, blockPos, mcData){
    bot.pathfinder.setMovements(defaultMove);
    bot.pathfinder.setGoal(new GoalNear(blockPos.x, blockPos.y, blockPos.z, 1));
    bot.once('goal_reached', () => {
        bot.collectBlock.collect(bot.blockAt(blockPos));
        setTimeout(() => {
        bot.pathfinder.setGoal(new GoalNear(blockPos.x, blockPos.y, blockPos.z-3, 2));
        }, 200);

    });
}
function placeBlock(bot, blockPos, mcData, item){
    bot.pathfinder.setMovements(defaultMove);
        bot.pathfinder.setGoal(new GoalNear(blockPos.x, blockPos.y, blockPos.z, 2));
        bot.once('goal_reached', () => {
            //select the right item
            bot.equip(mcData.itemsByName[item].id, 'hand');
            bot.placeBlock(bot.blockAt(blockPos), new Vec3(0, 1, 0));
});
}

function sleep(bot, mcData){
    //search for a bed
    const bed = bot.blockAt(8089696, 107, -3282689);
    if(bed){
        bot.pathfinder.setMovements(defaultMove);
        //disable destroying blocks
        bot.pathfinder.setGoal(new GoalNear(bed.position.x, bed.position.y, bed.position.z, 1));
        bot.once('goal_reached', () => {
            bot.sleep(bed);
        });
    }
}


function shiftLeftClick(bot, slot, window) {
    bot._client.write('window_click', {
        stateId: bot._client.state,
        windowId: window.id,
        cursorItem: PrismarineItem(bot.registry).toNotch(bot.inventory.cursor),
        changedSlots: [],
        mouseButton: 0,
        slot: slot,
        mode: 1,
    });
}

function craftItem(bot, item, count, mcData) {
    // find a nearby crafting table block
    const craftingTable = bot.findBlock({
        matching: mcData.blocksByName['crafting_table'].id,
        maxDistance: 64,
        count: 1
    });

    // if no crafting table is found, notify the user and return
    if (!craftingTable) {
        bot.chat('No crafting table found near spawn');
        return;
    }

    // get the ID of the item to be crafted
    const blockID = mcData.itemsByName[item].id;

    // find a recipe for the specified item at the crafting table
    const recipe = bot.recipesFor(blockID, null, count, craftingTable)[0];

    // if no recipe is found, notify the user and return
    if (!recipe || count === 0) {
        console.log('Nope');
        return;
    }

    // set the bot's pathfinder to navigate to the crafting table
    bot.pathfinder.setMovements(defaultMove);
    bot.pathfinder.setGoal(new GoalNear(craftingTable.position.x, craftingTable.position.y, craftingTable.position.z, 2));
    bot.once('goal_reached', () => {
        // activate the crafting table to open its inventory window
        bot.activateBlock(craftingTable);
        bot.once('windowOpen', (window) => {
            // send a craft_recipe_request packet for each item in the recipe's inShape array
            for (let i = 0; i < Math.ceil(count / 64); i++) {
                bot._client.write('craft_recipe_request', {
                    windowId: window.id,
                    recipe: "minecraft:iron_block",
                    makeAll: true
                });

          


            // simulate a left-click on the output slot to craft the item
            shiftLeftClick(bot, 0, window)

        }
            // wait a short period of time for the crafting to complete
            setTimeout(() => {
                // close the crafting table window
                reloadInventory(bot, window, craftingTable)

                // notify the user that crafting is finished
                bot.chat('Crafting finished');
            }, 20);
        });
    });
}

module.exports = {
    craftItem,
    openChest,
    closeChest,
    countInventoryItems,
    stealChest,
    reloadInventory,
    dumpChest,
    putOneItem,
    getOneItem,
    sleep,
    breakBlock,
    placeBlock,
    init,
    getFirstIngredient,
    shiftLeftClick,
    autoCraftItem
};