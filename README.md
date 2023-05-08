# Minecraft Craft Bot

Minecraft Craft Bot is a bot developed using Mineflayer library that can be used to automate certain tasks in Minecraft.

## Features

- Craft items automatically using a recipe.
- Interact with various types of objects, including chests

## Getting Started

### Prerequisites

- Node.js 12 or higher.
- A Minecraft account with a paid copy of the game.
- A Minecraft server to connect to.

### Installation

1. Clone the repository to your local machine.
```
git clone https://github.com/HKS-HNS/minecraft-craft-bot.git
```
2. Navigate to the project directory:
```
cd minecraft-craft-bot
```
3. Install the dependencies.
```
npm install
```
4. Add credentials in `craftbot.js` and specify what and where to craft in `craftermain.js`:
```
 {name: 'gold_block', chest: [964, 65, -34], storeChest: [946, 65, -34], crafting: true},
 {name: 'iron_block', chest: [967, 65, -34], storeChest: [948, 65, -34], crafting: true}
```
| Variable | What they stand for |
| -----------| ----------------- |
| `chest`     | Where the materials are |
| `storeChest` | Where to store them |
5. Start the bot
```
node .\craftbot.js
```
