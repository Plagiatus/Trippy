export const Constraints = {
	Config: {
		botToken: { presence: true,},
		serverId: { presence: true,},
		appId: { presence: true,},
		// "db.user": { presence: true },
		// "db.password": { presence: true },
		"db.url": { presence: true },
		"db.name": { presence: true },

		"channels.modLog": { presence: true },
		"channels.systemLog": { presence: true },
		"channels.sessionList": { presence: true },
		"channels.activeSessions": { presence: true },

		"roles.mods": { presence: true },
		"roles.hosts": { presence: true },
	},
}
