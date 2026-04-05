import mineflayer from "mineflayer"
import { pathfinder, Movements, goals } from "mineflayer-pathfinder"
import utils from "../utils/utils";

export default class MinecraftBot {
    bot: mineflayer.Bot
    _activeState: MinecraftBotState
    interval: NodeJS.Timer
    timeout: NodeJS.Timer

    static JOIN_MESSAGES: string[] = [
        "Hi there",
        "Tester Trippy, reporting for duty!",
        "o/",
        "Hello there",
        "I've heard there is a map to test?",
        "o7",
        "It looks like you have a map that needs testing. Would you like help with that?",
        "It looks like you're working on a map. Would you like help with that?",
        "Have no fear, Trippy is here!",
        "I volunteer as tribute!",
    ]

    static LEAVE_MESSAGES_SERVER: string[] = [
        "Alright, this was fun, but I have to check out some other maps, too! Thank you, bye",
        "Gotta go",
        "I have to go, my people need me!",
        "Whoops, I gotta go. Have a good session!",
        "Alright, this looks cool and all, but I think this is a bit too much for me to handle.",
        "This is way over my head. Thank you for having me.",
        "A'ight, I'mma head out.",
        "This map is looking amazing! I'll head off now, maybe you should, too. Take a break, your eyes will thank you. Or do you want square eyes like me?",
        "I need to go before the villagers start to think I'm one of them. Bye!",
        "I have to go, but not before reminding you all to hydrate!",
        "It's time to go. Was I a good bot?",
        "I'd stay and help some more, but I need to recharge.",
        "Whoops, ran out of RAM for now. It's gotten so expensive, better save some for later!",
        "I'd love to stay, but I got a date with a lovely paperclip. See you next time!",
        "Time for me to log off. I'll be back the next time you need a helping hand.",
        "Well, my work here is done! (Or at least, paused.) I'll go back to managing testing sessions. :)",
        "Time for me to head out. Thanks for letting me help. Now go do something that doesn't involve lava. Or do. I'm not your mom.",
        "Was fun, thanks bye!",
    ]
    
    // not static so we can more easily make sure we don't do any of these twice.
    RANDOM_MESSAGES: string[] = [
        "Bazinga",
        "This world is basically a museum of \"I started mapmaking and forgot to stop.\"",
        "The attention to detail in this is neat!",
        "This map looks like so much fun!",
        "Is there some parkour somewhere?",
        "Did you ever hear the story of Darth Plagiatus the wise? It's not a story a realms mapmaker would tell you...",
        "I have a lot to learn before I can become a Vilder50.",
        "Am I doing this right?",
        "Where am I supposed to go?",
        "Can i help somehow?",
        "Very impressive",
        "This is beautiful!",
        "I can tell you're not doing this for the first time.",
        "Nice! You should submit this to realms when you're done with it.",
        "Is this a new map or did you update it from older versions?",
        "When do you think this map is gonna be finished?",
        "...",
        "oh hey, look at that",
        "oh, look at this",
        "If I wasn't a robot without feelings, this map would definitely make me feel things.",
        "This barely feels like minecraft anymore.",
        "Hippity Hoppety, this map is now my property.",
        "Would you like help with that?",
        "Looks like you are doing something. Would you like help with that?",
        "Looks like you're not doing anything. Would you like help with that?",
        "Looking at this map I understand why I have square eyes.",
        "Hydration reminder! Keep yourself watered.",
        "Your fingers must be tired from all that clicking. How about a stretch break?",
        "Oh whoops, almost tripped.",
    ]
    SUGGESTIONS: string[] = [
        "More cowbell!",
        "More colors!",
        "Less colors!",
        "A lobby waiting game. May I suggest an elytra course?",
        "Something. I don't know what.",
        "Nothing, it feels perfect.",
        "Something something parkour",
        "[in Spongebob voice] WATER!",
        "A villain origin story and a dramatic soundtrack!",
        "A \"do not touch\" sign.",
        "A warning label and a team of lawyers.",
        "More visible commandblocks.",
        "More visible redstone.",
        "More greenery.",
        "More Tripwirehooks.",
        "A secret underground base!",
        "A working redstone clock.",
        "Some custom map art.",
        "A trap for youtubers who don't credit mapmakers",
        "A working elevator.",
        "A sophisticated 3x3 redstone door",
        "Different difficulty scaling. Or maybe just a superhuman difficulty mode for fun.",
        "More testers!",
        "A break. Or rather, you might need one.",
    ]

    set activeState(state: MinecraftBotState) {
        if (this._activeState) {
            this._activeState.exit()
        }
        this._activeState = state;
        this._activeState.enter()
    }

    constructor(ip: string) {
        let split = ip.split(":");
        const host = split[0];
        const port = parseInt(split[1]) ?? undefined;
        const options: mineflayer.BotOptions = {
            host,
            port,
            username: "trippy@plagiatus.net",
            auth: "microsoft",
        }
        this.bot = mineflayer.createBot(options)
        this.setup()
        this._activeState = new Idle(this.bot)
        this.interval = setInterval(this.checkActive, 1000)
        this.timeout = setTimeout(this.timeToGo, 1000 * 60 * 5)
    }

    setup() {
        this.bot.loadPlugin(pathfinder)


        this.bot.on("spawn", async () => {
            const defaultMove = new Movements(this.bot)
            this.bot.pathfinder.setMovements(defaultMove)
            this.bot.chat(utils.getRandomArrayElement(MinecraftBot.JOIN_MESSAGES)!)
            setTimeout(this.randomMessage, (Math.random() * 0.5 + 1) * 1000 * 30);
            await utils.waitMS(1000)
            this.activeState = new MovingRandom(this.bot)
        })

        this.bot.once("kicked", (reason) => { this.endBot(reason) })
        this.bot.on("error", (err) => { this.endBot(err.toString()) })

        this.bot.on("chat", (username, message) => {
            if (!username) return
            if (username === this.bot.username) return
            if (!message.match(/trippy|Trippy/)) return
            this.activeState = new MoveToPlayer(this.bot, username)
        })

        return this.bot
    }

    private checkActive = () => {
        if (this._activeState) {
            let newState = this._activeState.active()
            if (newState) this.activeState = newState
        }
    }

    private timeToGo = async () => {
        this.bot.chat(utils.getRandomArrayElement(MinecraftBot.LEAVE_MESSAGES_SERVER) ?? "Gotta go.")
        this.activeState = new Idle(this.bot)
        await utils.waitMS(5000)
        this.endBot()
    }

    private randomMessage = () => {
        if (!this.bot) return

        if(Math.random() < 0.3 && this.SUGGESTIONS.length > 0) {
            this.bot.chat("You know what this map needs? " + utils.getRandomArrayElement(this.SUGGESTIONS, true))
        } else if (this.RANDOM_MESSAGES.length > 0) {
            this.bot.chat(utils.getRandomArrayElement(this.RANDOM_MESSAGES, true) || "...")
        }
        setTimeout(this.randomMessage, (Math.random() * 2 + 1) * 1000 * 30);
    }


    private onEndedCallback!: (message: string) => void | Promise<void>
    public endBot = (message?: string) => {
        if (!this.bot) return
        this.bot.end()
        if (this.onEndedCallback) this.onEndedCallback(message ?? "")
        this.bot = undefined!
        clearInterval(this.interval)
        clearTimeout(this.timeout)
    }

    public onEnd(callback: (message: string) => void | Promise<void>) {
        this.onEndedCallback = callback
    }
}

abstract class MinecraftBotState {
    bot: mineflayer.Bot
    constructor(bot: mineflayer.Bot) {
        this.bot = bot;
    }
    abstract enter(): void
    abstract active(): MinecraftBotState | undefined
    abstract exit(): void
}

class Idle extends MinecraftBotState {
    enter(): void { }
    active(): undefined { }
    exit(): void { }
}

class MovingRandom extends MinecraftBotState {
    timeout: NodeJS.Timer | undefined = undefined
    enter(): void {
        this.timeout = setInterval(this.moveRandom.bind(this), 5000)
    }
    active(): undefined { }
    exit(): void {
        if (this.timeout)
            clearInterval(this.timeout)
        this.timeout = undefined;
    }
    private moveRandom() {
        const { x, y, z } = this.bot.entity.position;
        this.bot.pathfinder.setGoal(
            new goals.GoalNear(x + Math.random() * 10 - 5, y, z + Math.random() * 10 - 5, 1)
        )
        // this.bot.look(Math.random() * 360 - 180, Math.random() * 50 - 25)
    }
}

class MoveToPlayer extends MinecraftBotState {
    playerName: string
    goal: goals.GoalFollow | undefined
    done: boolean = false
    constructor(bot: mineflayer.Bot, playerName: string) {
        super(bot)
        this.playerName = playerName
    }
    enter(): void {
        let player = this.bot.players[this.playerName]
        if (player && player.entity) {
            this.goal = new goals.GoalFollow(player.entity, 2)
            this.bot.pathfinder.setGoal(this.goal)
            this.bot.once("goal_reached", this.reached)
        }
        if (!player.entity) {
            // this.bot.chat("can't see you.")
        }
    }
    active(): MinecraftBotState | undefined {
        if (this.done) {
            return new MovingRandom(this.bot)
        }
    }
    exit(): void {
        this.bot.removeListener("goal_reached", this.reached)
    }
    reached = async () => {
        let player = this.bot.players[this.playerName]
        if (player && player.entity) {
            this.bot.lookAt(player.entity.position)
            await utils.waitMS(2000)
        }
        this.done = true;
    }
}