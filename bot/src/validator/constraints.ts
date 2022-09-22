export const Constraints = {
	Config: {
		botToken: { presence: true, length: {minimum: 10}},
		serverId: { presence: true, length: {minimum: 18}},
		appId: { presence: true, length: {minimum: 18}},
		port: { presence: true, numericality: {onlyInteger: true, noStrings: true}},
		// "db.user": { presence: true },
		// "db.password": { presence: true },
		"db.url": { presence: true },
		"db.name": { presence: true },

		"channels.modLog": { presence: true, length: {minimum: 18} },
		"channels.systemLog": { presence: true, length: {minimum: 18} },
		"channels.sessionList": { presence: true, length: {minimum: 18} },
		"channels.activeSessions": { presence: true, length: {minimum: 18} },

		"roles.mods": { presence: true, length: {minimum: 18} },
		"roles.hosts": { presence: true, length: {minimum: 18} },
	},
}
