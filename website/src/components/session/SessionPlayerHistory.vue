<template>
	<content-box header="Players" class="history-section">
		<div v-if="!chartPlayers.length">
			<p v-if="session.state === 'running'">No players have joined the session yet.</p>
			<p v-else>No players joined this session.</p>
		</div>
		<div v-else class="history-chart-header">
			<div></div>
			<div class="history-chart-axis-labels" ref="chart-axis-labels">
				<span
					v-for="point,index in timelinePoints"
					:key="index"
				>
						{{timeHelper.formatDateTime(new Date(point), { date: false })}}
				</span>
			</div>
		</div>
		<div v-for="{ player, ranges } in chartPlayers" :key="player.id" class="history-player-row">
			<div class="history-player-label">
				<discord-user :user="player.user" class="history-user" />
			</div>
			<div class="history-player-timeline">
				<div class="history-player-line">
					<div
						v-for="range,index in ranges"
						:key="index"
						class="history-player-segment"
						:style="range.style"
						:title="range.tooltip"
					></div>
				</div>
			</div>
		</div>
	</content-box>
</template>

<script setup lang="ts">
import ContentBox from '@/components/ContentBox.vue';
import DiscordUser from '@/components/DiscordUser.vue';
import useDependency from '@/composables/use-dependency';
import TimeHelper from '@/time-helper';
import { computed, StyleValue, useTemplateRef } from 'vue';
import type { DiscordUserInformationDto, SessionInformationDto, SessionPlayerHistoryDto, SessionPlayerHistoryTypeDto } from '$/types/dto-types';
import { useElementBounding } from '@vueuse/core';

const props = defineProps<{
	session: SessionInformationDto;
}>();

const timeHelper = useDependency(TimeHelper);

const chartAxisLabelsRef = useTemplateRef("chart-axis-labels");

const { width: chartAxisLabelsWidth } = useElementBounding(chartAxisLabelsRef);
const playerHistory = computed(() => props.session.playerHistory);

const groupedPlayerHistory = computed(() => {
	const history = [...playerHistory.value].sort((first, second) => first.joinTime - second.joinTime);
	const groupedPlayers = new Map<string, { id: string; user: DiscordUserInformationDto; ranges: Array<Pick<SessionPlayerHistoryDto, "joinTime" | "leaveTime" | "type">> }>();

	for (const entry of history) {
		const existingPlayer = groupedPlayers.get(entry.id);
		const range = {
			joinTime: entry.joinTime,
			leaveTime: entry.leaveTime,
			type: entry.type,
		};

		if (existingPlayer) {
			existingPlayer.ranges.push(range);
			continue;
		}

		groupedPlayers.set(entry.id, {
			id: entry.id,
			user: entry.user,
			ranges: [range],
		});
	}

	return Array.from(groupedPlayers.values()).map((player) => ({
		...player,
		ranges: player.ranges.sort((first, second) => first.joinTime - second.joinTime),
	}));
});

const timelineBounds = computed(() => {
	return {
		start: props.session.startedAt ?? Date.now(),
		end: (props.session.state === "ended" ? props.session.endedAt : undefined) ?? Date.now(),
	}
});

const timelinePointsAmount = computed(() => {
	const labelPixelWidth = 100;
	const maxLabelsForWidth = Math.floor(chartAxisLabelsWidth.value / labelPixelWidth);
	const maxLabelsForDuration = Math.floor((timelineBounds.value.end - timelineBounds.value.start) / (timeHelper.millisecondsInMinute * 5) + 1);

	return Math.max(2, Math.min(maxLabelsForWidth, maxLabelsForDuration));
});

const timelinePoints = computed(() => {
	const middlePoints = Math.max(0, timelinePointsAmount.value - 2);
	const points: number[] = [timelineBounds.value.start];

	for (let i = 0; i < middlePoints; i++) {
		points.push(Math.round((timelineBounds.value.start + timelineBounds.value.end) / (middlePoints + 1) * (i + 1)));
	}

	points.push(timelineBounds.value.end);
	return points;
});

const chartPlayers = computed(() => {
	const rangeDuration = timelineBounds.value.end - timelineBounds.value.start;
	const safeDuration = rangeDuration || timeHelper.millisecondsInMinute;

	const chartPlayers = groupedPlayerHistory.value.map((player) => ({
		player: player,
		ranges: player.ranges.map((range) => {
			const join = Math.max(range.joinTime, timelineBounds.value.start);
			const leave = Math.max(range.leaveTime ?? Date.now(), join);
			const clampedLeave = Math.min(leave, timelineBounds.value.end);
			return {
				range,
				style: {
					left: `${((join - timelineBounds.value.start) / safeDuration) * 100}%`,
					width: `${Math.max(0.5, ((clampedLeave - join) / safeDuration) * 100)}%`,
					backgroundColor: range.leaveTime === undefined ? "var(--highlight)" : (playerHistoryTypes[range.type!]?.color ?? "var(--text-color)"),
				} satisfies StyleValue,
				tooltip: getPlayerJoinRangeTooltip(range.joinTime, range.leaveTime, range.type),
			};
		}),
	}));
	return chartPlayers;
});

function getPlayerJoinRangeTooltip(joinTime: number, leaveTime: number | undefined, type: SessionPlayerHistoryTypeDto | undefined) {
	const joinLabel = `Joined at: ${timeHelper.formatDateTime(new Date(joinTime))}.`;
	if (leaveTime === undefined) {
		return joinLabel;
	}

	const leaveLabel = `Left at: ${timeHelper.formatDateTime(new Date(leaveTime))}.`;
	const typeDescription = playerHistoryTypes[type!]?.description;
	if (typeDescription === undefined) {
		return `${joinLabel}\n${leaveLabel}`;
	}

	return `${joinLabel}\n${leaveLabel}\n${typeDescription}`;
}

const playerHistoryTypes: Record<SessionPlayerHistoryTypeDto, { description?: string, color: string }> = {
	"banned": { description: "Player was banned.", color: "var(--background-error)"},
	"kicked": { description: "Player was kicked.", color: "var(--background-warning)"},
	"soft-kicked": { description: "Player was soft kicked.", color: "var(--background-warning)"},
	"normal": { color: "var(--text-color)"},
}
</script>

<style scoped>
.history-section {
	flex-shrink: 0;
	min-width: 25rem;
	--players-width: 14rem;
	--line-padding: 0.25rem;
	--player-to-lines-gap: 0.5rem;
}

.history-chart-header {
	padding-left: calc(var(--players-width) + var(--line-padding) + var(--player-to-lines-gap));
	padding-right: var(--line-padding);
	width: 100%;
}

.history-player-row {
	display: flex;
	gap: var(--player-to-lines-gap);
	align-items: center;
}

.history-player-row {
	padding: var(--line-padding);
	border-radius: 0.25rem;
}

.history-player-row:hover {
	background-color: var(--background);
}

.history-chart-header {
	padding-bottom: 0.25rem;
	border-bottom: 1px solid var(--background);
	margin-bottom: 0.25rem;
}

.history-chart-player-label {
	font-size: 0.9rem;
	font-weight: 600;
	color: var(--text-muted);
}

.history-chart-axis-labels {
	display: flex;
	justify-content: space-between;
	gap: 0.75rem;
	font-size: 0.8rem;
	color: var(--text-muted);
	width: 100%;
}

.history-player-label {
	width: var(--players-width);
}

.history-player-timeline {
	flex-grow: 1;
}

.history-player-line {
	position: relative;
	height: 0.5rem;
	overflow: hidden;
}

.history-player-segment {
	position: absolute;
	top: 0;
	height: 100%;
	border-radius: 999px;
}

.history-player-segment:hover {
	opacity: 0.85;
}
</style>
