import mineflayer from "mineflayer"
import { pathfinder, Movements, goals } from "mineflayer-pathfinder"
import utils from "../utils/utils";
import { log } from "console";

export default class MinecraftBot {
    bot: mineflayer.Bot
    _activeState: MinecraftBotState
    interval: NodeJS.Timer
    timeout: NodeJS.Timer

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
            this.bot.chat("hi There")
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
        this.bot.chat("Alright, this was fun, but I have to check out some other maps, too! Thank you, bye")
        await utils.waitMS(10000)
        this.endBot()
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
        this.bot.look(Math.random() * 360 - 180, Math.random() * 50 - 25)
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
            this.bot.chat("can't see you.")
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