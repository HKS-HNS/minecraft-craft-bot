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
  
    // Wait for the stealing process to finish before proceeding to the next task
    await waitUntil(() => countEmptySlots(bot, window, mcData, chest, craftingItem) === window.slots.length - 36);
  
    // Craft the item
    let count = Math.floor(countInventoryItems(bot, craftingItem) / 9);
    await craftItem(bot, item, count, mcData);
  
    // Wait for the crafting process to finish before proceeding to the next task
    await wait(1000);
  
    // Open the shulker box and dump the crafted items
    await openChest(bot, shulker, mcData);
    const shulkerWindow = await onceWindowOpen(bot);
    await dumpChest(bot, shulkerWindow, mcData, shulker, 'iron_block');
  
    // Wait for the dumping process to finish before proceeding to the next task
    await waitUntil(() => countEmptySlots(bot, shulkerWindow, mcData, shulker, 'iron_block') === shulkerWindow.slots.length - 36);
  
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
    }
  }
  
  // Helper function to wait for a window to open
  function onceWindowOpen(bot) {
    return new Promise(resolve => {
      bot.once('windowOpen', window => {
        resolve(window);
      });
    });
  }
  function openChest(bot, chestPosition, mcData) {
    return new Promise(resolve => {
      // navigate to the chest position
      bot.pathfinder.setMovements(defaultMove);
      bot.pathfinder.setGoal(new GoalNear(chestPosition.x, chestPosition.y, chestPosition.z, 6));
      // open the chest
      bot.once('goal_reached', async () => {
        const chest = bot.blockAt(chestPosition);
        if (chest) {
          //if is type of chest
          if(chest.type === mcData.blocksByName.chest.id || chest.type === mcData.blocksByName.trapped_chest.id) {
            await bot.openChest(chest);
          } else {
            await bot.openContainer(chest);
          }
          resolve();
        }
      });
    });
  }
  async function stealChest(bot, chestWindow, mcData, chestPos, item) {
    // Calculate the size of the chest
    const chestSize = chestWindow.slots.length - 36;
  
    // Keep looping until all items are stolen
    while (true) {
      // Find the first slot that has an item we want to steal
      const index = chestWindow.slots.findIndex(slot => slot && slot.name === item);
  
      // If no matching slot is found, we are done
      if (index === -1) {
        break;
      }
  
      // Calculate the slot index in the chest inventory
      const chestSlotIndex = index < chestSize ? index : index - chestSize;
  
      // Steal the item by shift-clicking on it
      shiftClick(bot, chestSlotIndex, chestWindow);
  
      // Wait until the item is moved to the bot's inventory
      await waitUntil(() => bot.inventory.items().some(i => i && i.name === item));
  
      // Calculate the number of empty slots in the chest after the item is stolen
      const emptySlots = countEmptySlots(chestWindow, mcData, chestPos, item);
  
      // Reload the chest inventory to update the number of empty slots
      reloadInventory(bot, chestWindow, chestPos);
  
      // If there are no more empty slots, we are done
      if (emptySlots === 0) {
        break;
      }
    }
  }


  function reloadInventory(bot, window, block) {
    if (block) {
      return new Promise(resolve => {
        setTimeout(() => {
          bot.closeWindow(window);
          bot.activateBlock(block);
          bot.once('windowOpen', (window) => {
            bot.closeWindow(window);
            resolve();
          });
        }, 20);
      });
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

  function closeChest(bot) {
    return new Promise(resolve => {
      const window = bot.currentWindow;
      if (window) {
        bot.once('windowClose', () => {
          resolve();
        });
        bot.closeWindow(window);
      } else {
        resolve();
      }
    });
  }
  
  
  
  // Helper function to wait for a specified amount of time
  function wait(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
  
  // Helper function to wait until a condition is met
  function waitUntil(condition) {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (condition()) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
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

  async function dumpChest(bot, window, mcData, position, item) {
    let chestSize = window.slots.length - 36;
    //for the inventory slots
    for (let i = chestSize; i < window.slots.length; i++) {
      if (window.slots[i] != null && window.slots[i].name === item) {
        shiftLeftClick(bot, i, window);
      }
    }
    const emptySlots = await countEmptySlots(bot, window, mcData, position, item);
    reloadInventory(bot, window, bot.blockAt(position));
    return emptySlots;
  };
  
  
  function getEmptySlots(window, mcData) {
    const emptySlots = [];
    
    for (let i = 0; i < window.slots.length; i++) {
    const item = window.slots[i];
    if (item === null) {
        emptySlots.push(i);
      }
    }

    return emptySlots;
    }

    async function putOneItem(bot, window, mcData, position, item) {
        const chest = bot.blockAt(position);
        const emptySlotsBefore = countEmptySlots(bot, window, mcData);
        let isDone = false;
      
        // Loop through the chest's inventory slots and find an empty slot
        for (let i = chest.inventoryStart; i < chest.inventoryEnd; i++) {
          const slot = window.slots[i];
          // Check if the slot is empty
          if (!slot) {
            // Shift-click the item into the chest
            shiftClick(bot, window, i);
            // Wait for the item to appear in the chest
            await waitUntil(() => {
              const emptySlotsAfter = countEmptySlots(bot, window, mcData);
              return emptySlotsAfter < emptySlotsBefore;
            });
            isDone = true;
            break;
          }
        }
        if (!isDone) {
          console.log(`Could not put ${item} in the chest`);
        }
        reloadInventory(bot, window, chest);
      }

      async function getOneItem(bot, window, mcData, position, item) {
        let chestSize = window.slots.length - 36;
        let itemFound = false;
        
        // Wait for the window to open
        await waitUntil(() => bot.currentWindow === window);
      
        // Find the item and click it
        for (let i = 0; i < chestSize; i++) {
          if (window.slots[i] != null && window.slots[i].name === item) {
            shiftLeftClick(bot, i, window);
            itemFound = true;
            break;
          }
        }
        
      
        // Reload the inventory
        reloadInventory(bot, window, bot.blockAt(position));
      
        return itemFound;
      }
      async function sleep(bot, mcData) {
        // Search for a bed
        const bed = bot.findBlock({
          matching: mcData.blocksByName['bed'].id,
          maxDistance: 64,
          count: 1
        });
      
        // If no bed is found, notify the user and return
        if (!bed) {
          bot.chat('No bed found');
          return;
        }
      
        // Set the bot's pathfinder to navigate to the bed
        bot.pathfinder.setMovements(defaultMove);
        bot.pathfinder.setGoal(new GoalNear(bed.position.x, bed.position.y, bed.position.z, 1));
      
        // Wait until the bot is sleeping
        await waitUntil(() => bot.isSleeping);
      
        // Wait until the bot is finished sleeping
        await waitUntil(() => !bot.isSleeping);
      
        // Set the bot's pathfinder to navigate back to its previous position
        bot.pathfinder.setGoal(new GoalNear(bot.entity.position.x, bot.entity.position.y, bot.entity.position.z, 1));
      }
      
      async function breakBlock(bot, blockPos, mcData) {
        const block = bot.blockAt(blockPos);
        const item = bot.heldItem;
      
        // navigate to the block position
        bot.pathfinder.setMovements(defaultMove);
        bot.pathfinder.setGoal(new GoalNear(blockPos.x, blockPos.y, blockPos.z, 1));
      
        // wait until the bot reaches the block
        await waitUntil(() => bot.entity.position.distanceTo(blockPos) < 2);
      
        // start breaking the block
        bot.dig(block);
      
        // wait until the block is fully broken
        await waitUntil(() => !bot.canDigBlock(block) || bot.blockAt(blockPos).type === 0);
      
        // collect the block if it is dropped
        if (bot.blockAt(blockPos).type === 0) {
          bot.collectBlock.collect(block);
          await wait(200);
        }
      
        // equip the previous item
        bot.equip(item.type, 'hand');
      }

      async function placeBlock(bot, blockPos, mcData, item) {
        // set up a promise that resolves when the block is placed
        return new Promise(async (resolve) => {
          // set up a goal to navigate to the block position
          bot.pathfinder.setMovements(defaultMove);
          bot.pathfinder.setGoal(new GoalNear(blockPos.x, blockPos.y, blockPos.z, 2));
          
          // wait until the goal is reached before placing the block
          bot.once('goal_reached', () => {
            // equip the correct item in the hand slot
            bot.equip(mcData.itemsByName[item].id, 'hand');
            
            // place the block
            bot.placeBlock(bot.blockAt(blockPos), new Vec3(0, 1, 0), () => {
              // wait a short period of time before resolving the promise and proceeding to the next task
              setTimeout(() => {
                resolve();
              }, 1000);
            });
          });
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
      

      function shiftLeftClick(bot, slot, window) {
        return new Promise(resolve => {
          bot._client.write('window_click', {
            stateId: bot._client.state,
            windowId: window.id,
            cursorItem: PrismarineItem(bot.registry).toNotch(bot.inventory.cursor),
            changedSlots: [],
            mouseButton: 0,
            slot: slot,
            mode: 1,
          });
          bot.once('set_slot', () => {
            resolve();
          });
        });
      }
      
    
    async function autoCraftItem(bot, chest, shulker, barrel, storeChest, mcData, item) {
    const craftingItem = getFirstIngredient(bot, item, mcData);
    
    // Open the chest and steal as many crafting items as possible
    await openChest(bot, chest, mcData);
    const window = await onceWindowOpen(bot);
    await stealChest(bot, window, mcData, chest, craftingItem);
    
    await waitUntil(() => countInventoryItems(bot, craftingItem) >= 9);
    
    const count = Math.floor(countInventoryItems(bot, craftingItem) / 9);
    
    await craftItem(bot, item, count, mcData);
    
    await waitUntil(() => countInventoryItems(bot, item) >= count);
    
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
    }
    
    await wait(1000);
    await closeChest(bot);
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