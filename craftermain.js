
const crafter = require('./crafter.js');
const Vec3 = require('vec3');

let isAutoCrafting = false;

async function autocraftloop(bot, mcData) {
  isAutoCrafting = true;
  const delay = 1000;
  const barrel = new Vec3(8071477, 108, -3249996);
  const restChest = new Vec3(8071477, 108, -3249997);
  const itemsToCraft = [
    {name: 'poppy', chest: [8071473, 109, -3249994], shulker: [8071473, 107, -3249994], storeChest: [8071472, 109, -3249994], crafting: false},
    {name: 'iron_block', chest: [8071471, 109, -3249994], shulker: [8071471, 107, -3249994], storeChest: [8071470, 109, -3249994], crafting: true},
    {name: 'potato', chest: [8071469, 109, -3249994], shulker: [8071469, 107, -3249994], storeChest: [8071468, 109, -3249994], crafting: false},
    {name: 'carrot', chest: [8071467, 109, -3249994], shulker: [8071467, 107, -3249994], storeChest: [8071466, 109, -3249994], crafting: false},
    {name: 'melon', chest: [8071464, 109, -3249994], shulker: [8071464, 107, -3249994], storeChest: [8071463, 109, -3249994], crafting: true},
    {name: 'pumpkin', chest: [8071462, 109, -3249994], shulker: [8071462, 107, -3249994], storeChest: [8071461, 109, -3249994], crafting: false},
    {name: 'sugar_cane', chest: [8071460, 109, -3249994], shulker: [8071460, 107, -3249994], storeChest: [8071459, 109, -3249994], crafting: false},
    {name: 'bamboo', chest: [8071458, 109, -3249994], shulker: [8071458, 107, -3249994], storeChest: [8071457, 109, -3249994], crafting: false}
];


function startAutoCraftingLoop(bot, mcData, barrel, restChest, itemsToCraft, delay) {
  setInterval(() => {
    if (isAutoCrafting) {
      crafter.autoCraftMain(bot, mcData, barrel, restChest, itemsToCraft, delay);
    }else{
      return;
    }
  }, 10 * 60 * 1000); // 10 minutes in milliseconds
}
await crafter.autoCraftMain(bot, mcData, barrel, restChest, itemsToCraft, delay);
startAutoCraftingLoop(bot, mcData, barrel, restChest, itemsToCraft, delay);
}

function stopAutoCraftingLoop() {
  isAutoCrafting = false;
}

module.exports = {
  autocraftloop,
  stopAutoCraftingLoop
}