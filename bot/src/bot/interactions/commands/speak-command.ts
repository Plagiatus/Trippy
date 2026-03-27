import { MessageFlags, MessageType, PermissionFlagsBits, TextChannel } from "discord.js";
import Command, { CommandExecutionContext } from "./command";
import DiscordClient from "../../discord-client";

class SpeakCommand extends Command {
    public constructor() {
        super("speak");
    }

    public create() {
        return this.buildBaseCommand()
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .setDescription("Make Trippy speak.")
            .addChannelOption(option =>
                option.setName("channel")
                    .setDescription("Channel to send the message to")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("message")
                    .setDescription("What message to send")
                    .setRequired(true)
            )
    }

    public async handleExecution({ provider, interaction }: CommandExecutionContext): Promise<void> {
        try {
            const channel = interaction.options.getChannel("channel", true)
            if (!(channel instanceof TextChannel)) {
                interaction.reply({ flags: MessageFlags.Ephemeral, content: "That channel isn't a text channel" })
                return
            }
            const client = provider.get(DiscordClient)
            const message = interaction.options.getString("message", true)
            await client.sendMessage(channel, message)
            interaction.reply({ flags: MessageFlags.Ephemeral, content:"message sent"})
        } catch (error: any) {
            interaction.reply({ flags: MessageFlags.Ephemeral, content: error.toString() })
        }
    }
}

export default new SpeakCommand();