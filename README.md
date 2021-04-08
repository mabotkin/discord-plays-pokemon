# Discord Plays Pokemon!

This is an application written in [Node.JS](nodejs.org) to play Game Boy Advance games through Discord.  The application runs an instance of a Game Boy Advance emulator ([GBA.js](npmjs.com/package/gbajs)) on the server side, receives inputs from a specified Discord text channel using [Discord.js](discord.js.org), and sends the video output to a web interface via [Socket.io](socket.io).  This application was developed for the purpose of playing Pokemon collaboratively, but can certainly be used for other games.

## Installation

Clone the repository to your desired location, and run

```npm install```

Then, make the directories `roms/` and `saves/`, and place your ROMs in the `roms/` directory.  Then, copy `.env.example` to `.env`, and fill out the entries according to the following section.  Finally, run

```node index.js```

and view the web interface at the specified port.

## Configuration

You will first need to create a Discord bot on the [Discord Developer portal](discord.com/developers), and give it permissions to read text channels.  Then, invite the created bot to your server, and record the token.

- `ACTION_INTERVAL` Number of milliseconds between queued actions.
- `ANONYMOUS_MODE` When set to `1`, web interface will not display Discord usernames in the input log.
- `DISCORD_ADMIN_IDS` Provide a string containing the user IDs of all users you would like to have admin access.
- `DISCORD_CHANNEL_ID` Provide the channel ID of the Discord text channel where inputs will be read from.
- `DISCORD_GUILD_ID` Provide the server ID on which the bot will listen.
- `DISCORD_TOKEN` Provide the bot token from above.
- `FRAMERATE` The number of frames that the server sends to each client per second.  Does not control the emulator built-in framerate.  Setting this above 15 may cause issues.
- `MAX_ACTIONS_QUEUED` Maximum number of actions that can be queued to be sent to the emulator.
- `MAX_REPEAT` Maximum number of actions that can be simultaneously in the queue from one sender.
- `PORT` The port on which to run the web application.
- `ROM_NAME` The filename of the ROM to run.
- `SAVE_DIR` The name of the directory where the savegames will be made.
- `SAVE_SLOT_DEFAULT` The save slot which is loaded by default.

## Usage

Enter any of the valid keypresses to submit that keypress to the emulator.  Valid keypresses can be found in the `--HELP` command.

- `--HELP` Show a help message.
- `--INFO` Show information regarding the emulator.
- `--SAVE` Save the current storage to file, under the active save slot.
- `--SAVE #` Save the current storage to file, under the specified save slot.
- `--LOAD` Load a blank save state.
- `--LOAD #` Load the specified save state.

**WARNING:** For Pokemon games, you must first save within the game, then call `--SAVE` to save the game memory to file.

Furthermore, repeated button presses are supported.  For example, the command `A2` will send `A` two times to the emulator.  More complex commands can be built using parentheses, such as `(LR)10` to walk repeatedly to the left and right.

## Deep Integration

The file `MemoryReader.js` accesses the emulators RAM to parse out game data in a human-readable format.  This data can be viewed using the commands `--PARTY`, `--PARTY #`, or on the web interface at `/pro`.

## Roadmap

The following are features that we hope to add in the future:

- [x] Allow multiple savestates.
- [x] Limit to one connection per IP, to save bandwidth/prevent DDOS.
- [x] Deep integration to pull game data from RAM.
- [x] Display deep integration party data on front-end in real time.
- [x] Make repeated button presses easier (i.e., `A*10`).
- [ ] Make front-end pretty.
- [ ] Autosave functionality.
- [ ] Democracy mode.
