<template>
	<div id="home">
		<img id="home-logo" src="/logo.png" alt="Logo of the Minecraft Maptesting Server">
		<h1>Minecraft Maptesting Server</h1>
		<hr>
		<p id="home-description">
			We're a friendly and passionate discord community all about <em>making and testing</em> <strong>Minecraft
				Maps</strong>. In fact we're the biggest community of this kind.
		</p>
		<p>
			This website and our custom made <strong>Discord Bot Trippy</strong> help us doing this. Join us today and
			test your own and other peoples maps!
		</p>
		<div id="home-cta-discord">
			<a :href="config.discordInviteLink" target="_blank" rel="noopener noreferrer">
				<img src="/icons/two-arrow-right.svg" alt="" class="home-cta-discord-arrow">
				<img src="/icons/Discord-Logo+Wordmark-White.svg" alt="Discord">
				<img src="/icons/two-arrow-right.svg" alt="" class="home-cta-discord-arrow">
			</a>
		</div>
	</div>
</template>

<script setup lang="ts">
import useProvidedItem from '@/composables/use-provided-item';
import Config from '@/config';

const config = useProvidedItem(Config);
</script>

<style>
#home {
	text-align: center;
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	max-width: 600px;
	margin: auto;
}

#home-logo {
	max-width: 400px;
	width: 100%;
}

#home-cta-discord {
	max-width: 100%;
}

#home-cta-discord>a {
	display: flex;
	align-items: center;
	gap: 20px;
	height: 80px;
}

.home-cta-discord-arrow {
	height: 70%;
	animation: arrows 0.5s linear infinite alternate;
}

.home-cta-discord-arrow:last-of-type {
	transform: rotate(180deg);
}

#home>p {
	font-size: 1.5em;
}

#home>hr {
	width: 100%;
	color: var(--text-color);
	animation: hr-in 0.3s ease-out;
}

@keyframes hr-in {
	from {
		width: 5%;
	}

	to {
		width: 100%;
	}
}

@keyframes arrows {
	from {
		scale: 0.5;
	}

	to {
		scale: 1;
	}
}

@media screen and (max-width: 500px) {
	#home-cta-discord {
		scale: 0.7;
	}
	#home>p {
		font-size: 1em;
	}
	.home-cta-discord-arrow {
		animation: none;
	}
	#home-logo {
		max-width: 80%;
	}
}
</style>