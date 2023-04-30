const mineflayer = require('mineflayer');
const {pathfinder, Movements} = require('mineflayer-pathfinder');
const inventoryViewer = require('mineflayer-web-inventory');
const collectBlock = require('mineflayer-collectblock').plugin;
const autoeat = require('mineflayer-auto-eat').plugin;
const crafter = require('./crafter.js');
const craftermain = require('./craftermain.js');
const crafterraid = require('./crafterraid.js');
const { Vec3 } = require('vec3');

const bot = mineflayer.createBot({
	host: 'someserver.com', // minecraft server ip
	username: 'IDK', // minecraft username/email
	//password: '', // minecraft password, comment out if you want to log into online-mode=false servers
	port: 25565, // only set if you need a port that isn't 25565
	version: "1.19.3", // only set if you need a specific version or snapshot (ie: "1.8.9" or "1.16.5"), otherwise it's set automatically
	auth: 'microsoft' // only set if you need microsoft auth, then set this to 'microsoft'
})
inventoryViewer(bot)
let mcData;
bot.loadPlugin(pathfinder)
bot.loadPlugin(collectBlock);
bot.loadPlugin(autoeat);
//get the position of the bot and print it out


let defaultMove;
bot.once('spawn', () => {
    mcData = require('minecraft-data')(bot.version);
    defaultMove = new Movements(bot, mcData);
    defaultMove.canDig = false;
    defaultMove.allow1by1towers = false;
    bot.collectBlock.movements = defaultMove;
    crafter.init(defaultMove , bot, mcData);
    bot.autoEat.options.offhand = true;
});

bot.on('whisper', (username, message) => {
    // ignore messages sent by the bot itself
    if (username === bot.username || username != 'HNS_yt') {
        return;
    }
    if (message === 'craft') {
        // count how many iron ingots are in inventory and craft them into blocks
        let count = Math.floor(crafter.countInventoryItems(bot, 'iron_ingot') / 9);
        console.log(count);
        crafter.craftItem(bot, 'iron_block', count, mcData);
    } else if (message === 'dropall' && bot.inventory.items().find(item => item.name === 'iron_block')) {
        // drop all items in the inventory, not just iron blocks
        bot.toss(mcData.itemsByName['iron_block'].id, null, crafter.countInventoryItems(bot, 'iron_block'));
    } else if (message === 'stealChest') {
		// mine a block
        const chest = new Vec3(8089693, 109, -3282688);
		crafter.openChest(bot, chest, mcData);
        bot.once('windowOpen', (window) => {
            //take as many items as possible
           crafter.stealChest(bot, window, mcData, chest, 'iron_ingot');
        });
	} else if (message === 'dumpChest') {
        const chest = new Vec3(8089693, 107, -3282688);
		crafter.openChest(bot, chest, mcData);
        bot.once('windowOpen', (window) => {
            //take as many items as possible
           crafter.dumpChest(bot, window, mcData, chest, 'iron_block');
        });
    } else if (message === 'break') {
        const chest = new Vec3(8089693, 107, -3282688);
        crafter.breakBlock(bot, chest, mcData);
    } else if (message === 'place') {
        const chest = new Vec3(8089693, 107, -3282688);
        crafter.placeBlock(bot, chest, mcData, 'shulker_box');
    } else if (message === 'autocraft') {
        
        //crafter.autoCraftMain(bot, mcData);
    } else if(message === 'autocraftloop') {
        //craftermain.autocraftloop(bot, mcData);
        crafterraid.autocraftloop(bot, mcData);
    }
});
let isSleeping = false;
//check if it is night in minecraft world
bot.on('time', () => {
    if (bot.time.timeOfDay > 13000 && mcData !== undefined) {
        if (!isSleeping && crafter.canSleep()) {
            isSleeping = true;
            crafter.sleep(bot, mcData);
        }
    } else {
        if (isSleeping) {
            isSleeping = false;
        }
    }
});


bot.on('kicked', console.log);
bot.on('error', console.log);