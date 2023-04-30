
const crafter = require('./crafter.js');
const Vec3 = require('vec3');

let isAutoCrafting = false;

async function autocraftloop(bot, mcData) {
  isAutoCrafting = true;
  const delay = 600;

  const barrel = new Vec3(-6553, 8, -5378);
  const restChest = new Vec3(-6553, 8, -5377);
  const itemsToCraft = [
    {name: 'emerald_block', chest: [-6543, 4, -5375], shulker: [-6544, 4, -5374], storeChest: [-6544, 3, -5375], crafting: true},
    {name: 'redstone_block', chest: [-6543, 4, -5377], shulker: [-6544, 4, -5376], storeChest: [-6544, 3, -5377], crafting: true},
    {name: 'glowstone', chest: [-6543, 4, -5379], shulker: [-6544, 4, -5378], storeChest: [-6544, 3, -5379], crafting: true},
    {name: 'gunpowder', chest: [-6543, 4, -5381], shulker: [-6544, 4, -5380], storeChest: [-6544, 3, -5381], crafting: false},
    {name: 'sugar', chest: [-6543, 4, -5383], shulker: [-6544, 4, -5382], storeChest: [-6544, 3, -5383], crafting: false},
    {name: 'stick', chest: [-6543, 4, -5385], shulker: [-6544, 4, -5384], storeChest: [-6544, 3, -5385], crafting: false},
    {name: 'glass_bottle', chest: [-6543, 4, -5387], shulker: [-6544, 4, -5386], storeChest: [-6544, 3, -5387], crafting: false},
    {name: 'spider_eye', chest: [-6543, 4, -5389], shulker: [-6544, 4, -5388], storeChest: [-6544, 3, -5389], crafting: false},
    {name: 'string', chest: [-6543, 4, -5391], shulker: [-6544, 4, -5390], storeChest: [-6544, 3, -5391], crafting: false}];



console.log('Starting auto crafting loop');
while (isAutoCrafting) {
  await crafter.autoCraftMain(bot, mcData, barrel, restChest, itemsToCraft, delay);
  await wait(delay);
}
}

function stopAutoCraftingLoop() {
  isAutoCrafting = false;
}
function wait(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
  module.exports = {
  autocraftloop,
  stopAutoCraftingLoop
}