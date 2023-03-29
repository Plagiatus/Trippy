# Trippy

**The mapmaking helper, discord bot and website**

## The idea 

Trippy, a Tripwire hook with eyes (inspired by Clippy, the Paperclip) is aiming to be the main driving force for good behing the Minecraft Maptesting server.  
It's main functionality is to **organize testing sessions** in said server, but is aiming to be expanded to provide additional functionalities such as user levels, casual playing sessions, a website with stats and statistics, help and support with questions and some moderation tools.

It's supposed to be a (spiritual) successor to https://github.com/Plagiatus/MaptestingBot

## Technology

Technology used in this project  

- bot & backend
  - NodeJS as the base technology
  - [Discord.js](https://discord.js.org/) for the bot
  - MongoDB as the database
  - Express for the http server
- website
  - vue 3

## How it's supposed to work

See [/planning](/planning) for some existing data structure ideas and such using plantuml.

### Sessions

- **Sessions** with all their attributes and settings are stored in so called sessions. These are syncronised to the database to prevent data loss on potential bot crashes.
- Sessions setups are stored as **templates**, referenced by a short hash code, which players use to start a new session by providing said hash to the bot. This allows for the re-use of sessions. They can also be loaded on the session setup page to make minor tweaks.
- The setup of said session happens on the website. This choice was made as it's a lot easier to manage and style than using discord itself as the interface.
- once the template has been saved, then passed to the bot through the command, the bot sets up the testing session by setting up the configured channels for the testing (text and voice channels) along with a moderation channel for the host for easy access to kick/ban/end commands as well as a website that lets them modify any information about the ongoing session (such as changing the title and description, adding more channels, "closing" the session for new players for a while, etc).
- players can leave the session at any time, but are potentially prompted to 1) endorse other players / the host and 2) provide feedback (if configured)
- once the host ends the session, the channel stays around for a while, also prompting the players to do 1 and 2 from the previous point
- various host/mod only commands to manage sessions (like /ban, /kick, /end etc).

Sessions have been expanded to contain a lot more information for potential players, such as how much time is expected to be committed, whether voicechat is required, an image to display inside discord, etc. They also provide a lot more control over an active session to the host by providing them with various control panels, letting them change everything about a session.

### Endorsements

- Endorsements are replacing the useless leveling system in an attempt to provide a more useful stat that is not only tied to total activity but a lot more to helpful and current activity. This means that the old XP based roles are retired, maybe we can keep some "achievement roles" form them.
- 0-5 Levels of endorsement, everyone starts halfway through lvl 1.
- Discord Roles for everyone at Endorsement lvl 2-5
- everyone at lvl 2 or above gradually looses endorsement points over time
- endorsement is gained through
  - playing in testing sessions (for at least X amount of time)
  - hosting testing sessions (with at least X amount of players for X amount of time)
  - getting an endorsement by other players after the game
- endorsement is lost
  - over time (above lvl 2)
  - through being kicked or banned from sessions
  - other moderator / host actions against you
- endorsements might need to be locked out from people who endorsed you recently
- perks
  - lvl 0 prevents you from joining sessions for a while and alerts moderators about your fall from grace  
  - lvl 2+ can ping potential players using the notification system
  - lvl 3+ gets to have sessions stay idle for longer
  - lvl 4+ gets access to "schedule sessions" that creates server events for their sessions
- (endorsement might come in various categories that are tracked seperately)
  - good teammate
  - good tester
  - good host
  - allround good person
  - etc

### Notifications
The previous system of notifications was prone to error and didn't work properly, either. So I propose a new system that expands on the existing system.
- No more default notifications. All notifications are opt-in by default.
- Various different roles depending on different map types and attributes
  - all
  - pvp
  - pve
  - trailers
  - etc.
- pings are put into a dedicated channel and stay there, as permanent pings.
- Can also keep the "notify me for all testing sessions I'm online for" system we have right now, but opt-in instead.

### Website
- provides a page for easy UIs for bot functionalities and a public online presence (https://maptesting.de)  
- allows the creation and modification of templates
- (allows the giving and recieving of feedback)
- (allows to look at stats - general and user specific)
- (allows users to endorse others)

### Expansions

These are some ideas for future features that would enhance the bot abilities but aren't needed for its core functionalities.

- Playing sessions - sessions that don't contribute to the endorsement system but let players organise just playing together
- commands that make mapmaking easier - e.g. faqs or command lookups
- moderation tools, like letting them look at a detailed player history etc.
- built-in feedback system for hosts (bit like google forms, but integrated into the system)
