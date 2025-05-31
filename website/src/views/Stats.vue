<template>
	<div class="stats-page">
		<content-box header="Options">
			<input-select v-model="selectedSessionStats" :values="possibleSessionStatsTypes" name="Display stats for"/>
		</content-box>

		<content-box header="Stats" class="stats-box">
			<div v-if="isLoading" class="loading-holder">
				<loading-spinner/>
			</div>
			<template v-else-if="currentStats">
				<div class="number-displays">
					<NumberDisplay title="Players" :value="currentStats.totalJoins"/>
					<NumberDisplay title="Unique players" :value="currentStats.totalUniqueJoins"/>
					<NumberDisplay title="Sessions" :value="currentStats.totalSessions"/>
					<NumberDisplay title="Unique hosts" :value="currentStats.totalUniqueHosts"/>
					<NumberDisplay title="Unique experiences" :value="currentStats.totalUniqueExperiences"/>
				</div>
				<div>
					<p class="chart-title">{{latestChartHeader}}</p>
					<div class="chart-holder">
						<generic-chart :config="latestChartConfig"/>
					</div>
				</div>
				<div v-if="aggregatedChartConfig">
					<p class="chart-title">Aggregated</p>
					<div class="chart-holder">
						<generic-chart :config="aggregatedChartConfig"/>
					</div>
				</div>
			</template>
			<error-display v-else-if="statsLoadingError" type="small" @close="statsLoadingError = null">
				<p>{{statsLoadingError}}</p>
			</error-display>
		</content-box>
	</div>
</template>

<script setup lang="ts">
import { CountAtTimeIntervalDto, PeriodSessionStatsDto, PeriodSessionStatsTypeDto } from '$/types/dto-types';
import StatsApiClient from '@/api-clients/stats-api-client';
import ContentBox from '@/components/ContentBox.vue';
import ErrorDisplay from '@/components/ErrorDisplay.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import GenericChart from '@/components/GenericChart.vue';
import InputSelect from '@/components/inputs/InputSelect.vue';
import useDependency from '@/composables/use-dependency';
import { InputSelectValueType } from '@/types/types';
import { computed, shallowRef, watch } from 'vue';
import { ChartConfiguration, ChartDataset } from 'chart.js';
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm';
import NumberDisplay from '@/components/NumberDisplay.vue';
import TimeHelper from '@/time-helper';
import { useRoute, useRouter } from 'vue-router';
import useRandomTrippyMessage from '@/composables/use-random-trippy-message';

const statsApiClient = useDependency(StatsApiClient);
const timeHelper = useDependency(TimeHelper);
const route = useRoute();
const router = useRouter();

const currentStats = shallowRef<PeriodSessionStatsDto|null>(null);
const isLoading = shallowRef(false);
const statsLoadingError = shallowRef<unknown>();

const possibleSessionStatsTypes = computed<ReadonlyArray<InputSelectValueType<PeriodSessionStatsTypeDto>>>(() => {
	return [
		{
			name: "Day",
			value: "day"
		},
		{
			name: "Week",
			value: "week"
		},
		{
			name: "Month",
			value: "month"
		},
		{
			name: "Year",
			value: "year"
		},
		{
			name: "All Time",
			value: "all"
		},
	]
});

const selectedSessionStats = computed({
	get() {
		const typeQuery = route.query.type;
		if (typeof typeQuery !== "string") {
			return undefined;
		}

		if (possibleSessionStatsTypes.value.some(type => type.value === typeQuery)) {
			return typeQuery as PeriodSessionStatsTypeDto;
		}
	},
	set(type) {
		router.replace({
			query: {
				type: type,
			}
		});
	}
})

watch(selectedSessionStats, async (_1, _2, cleanup) => {
	currentStats.value = null;
	statsLoadingError.value = null;
	
	const statsType = selectedSessionStats.value;
	if (!statsType) {
		return;
	}

	let isCleanedUp = false;
	cleanup(() => isCleanedUp = true);

	isLoading.value = true;
	const stats = await statsApiClient.getSessionStats(statsType);
	if (isCleanedUp) {
		return;
	}

	isLoading.value = false;
	if (stats.data) {
		currentStats.value = stats.data;
	} else {
		statsLoadingError.value = stats.error;
	}
}, { immediate: true });

const playerChartStyling: Partial<ChartDataset<"line">> = {
	label: "Players",
	borderColor: "#00FFAA",
	pointBackgroundColor: "#00FFAA",
	tension: 0.1,
}

const sessionChartStyling: Partial<ChartDataset<"line">> = {
	label: "Sessions",
	borderColor: "#00AAFF",
	pointBackgroundColor: "#00AAFF",
	tension: 0.1,
}

const latestChartConfig = computed<ChartConfiguration<"line">>(() => {
	if (!currentStats.value) {
		return {
			type: "line",
			data: {
				datasets: [],
			}
		}
	}

	return {
		type: "line",
		data: {
			datasets: [
				{
					...playerChartStyling,
					data: currentStats.value.players.map((dto) => ({
						x: dto.dateTime,
						y: dto.count,
					})),
				},
				{
					...sessionChartStyling,
					data: currentStats.value.sessions.map((dto) => ({
						x: dto.dateTime,
						y: dto.count,
					})),
				},
			]
		},
		options: {
			maintainAspectRatio: false,
			scales: {
				x: {
					type: "time",
					grid: {
						color: "#FFFFFF40",
					},
					ticks: {
						color: "white",
						maxRotation: 0,
						source: "data",
						callback(tickValue) {
							return formatDateValue(Number(tickValue));
						}
					}
				},
				y: {
					beginAtZero: true,
					grid: {
						color: "#FFFFFF40",
					},
					ticks: {
						color: "white",
						stepSize: 1,
					}
				}
			},
			interaction: {
				mode: "index",
			},
			plugins: {
				tooltip: {
					enabled: true,
					callbacks: {
						title(tooltipItems) {
							const dateTime = currentStats.value?.players?.[tooltipItems[0].dataIndex].dateTime ?? 0;
							return formatDateValue(dateTime);
						},
					}
				},
				legend: {
					display: true,
					labels: {
						usePointStyle: true,
						color: "white",
					}
				}
			}
		},
	}
});

const aggregatedChartConfig = computed<ChartConfiguration<"line">|null>(() => {
	if (currentStats.value?.aggregatedPlayers === undefined || currentStats.value.aggregatedSessions === undefined) {
		return null;
	}

	return {
		type: "line",
		data: {
			datasets: [
				{
					...playerChartStyling,
					data: currentStats.value.aggregatedPlayers.map((dto) => ({
						x: dto.dateTime,
						y: dto.count,
					})),
				},
				{
					...sessionChartStyling,
					data: currentStats.value.aggregatedSessions.map((dto) => ({
						x: dto.dateTime,
						y: dto.count,
					})),
				},
			]
		},
		options: {
			maintainAspectRatio: false,
			scales: {
				x: {
					type: "time",
					grid: {
						color: "#FFFFFF40",
					},
					ticks: {
						source: "data",
						color: "white",
						maxRotation: 0,
						callback(tickValue) {
							return formatAggregatedDateValue(Number(tickValue));
						}
					},
				},
				y: {
					beginAtZero: true,
					grid: {
						color: "#FFFFFF40",
					},
					ticks: {
						color: "white",
						stepSize: 1,
					}
				}
			},
			interaction: {
				mode: "index",
			},
			plugins: {
				tooltip: {
					enabled: true,
					callbacks: {
						title(tooltipItems) {
							const dateTime = currentStats.value?.aggregatedPlayers?.[tooltipItems[0].dataIndex].dateTime ?? 0;
							return formatAggregatedDateValue(dateTime);
						},
					}
				},
				legend: {
					display: true,
					labels: {
						usePointStyle: true,
						color: "white",
					}
				}
			}
		},
	}
});

function formatAggregatedDateValue(value: number) {
	const date = new Date(value);

	switch(selectedSessionStats.value) {
		case "day":
			return date.toLocaleTimeString([], { hour: "numeric", minute: "numeric" });
		case "week":
			// Unix Epoch is a thursday.
			// We offset the date such that the timestamp 0 will display as a monday.
			const offsetDate = new Date(value + timeHelper.millisecondsInDay * 4);
			return offsetDate.toLocaleDateString([], { weekday: "short" }) + " " + offsetDate.toLocaleTimeString([], { hour: "numeric", minute: "numeric" });
		case "month":
			return date.toLocaleDateString([], { day: "numeric" });
		case "year":
			return date.toLocaleDateString([], { month: "short", day: "numeric" });
	}
}

function formatDateValue(value: number) {
	const date = new Date(value);
	switch(selectedSessionStats.value) {
		case "day":
			return date.toLocaleTimeString([], { hour: "numeric", minute: "numeric" });
		case "week":
			return date.toLocaleDateString([], { weekday: "short" }) + " " + date.toLocaleTimeString([], { hour: "numeric", minute: "numeric" });
		case "month":
			return date.toLocaleDateString([], { month: "short", day: "numeric" });
		case "year":
		case "all":
			return date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
	}
}

const latestChartHeader = computed(() => {
	switch(selectedSessionStats.value) {
		case "day": return "Today";
		case "week": return "This Week";
		case "month": return "This Month";
		case "year": return "This Year";
		case "all": return "All Time";
	}
});

useRandomTrippyMessage((add) => {
	if (currentStats.value === null) {
		add({ message: "Can't wait to see some stats.", mood: "normal" });
		add({ message: "Will the stats come soon?", mood: "tired", weight: 0.2 });
		return;
	}

	add({ message: "Charts!", mood: "suprised" });
	add({ message: "I love stats!", mood: "normal" });
	add({ message: "Those numbers are so cool.", mood: "normal" });
	add({ message: "You might be a part of this data.", mood: "normal" });
	add({ message: "You can help with adding to this data.", mood: "normal" });

	if (currentStats.value.totalSessions > 50) {
		add({ message: "That's a lot of sessions.", mood: "suprised" });
	}

	if (currentStats.value.totalSessions > 100) {
		add({ message: "That's more than 5 sessions!", mood: "suprised" });
	}

	if (currentStats.value.totalJoins > 50) {
		add({ message: "That's a lot of players.", mood: "suprised" });
	}

	if (selectedSessionStats.value === "year") {
		add({ message: "What a great year this has been.", mood: "suprised" });
	}

	if ((selectedSessionStats.value === "week" || selectedSessionStats.value === "day") && currentStats.value.totalSessions === 0) {
		add({ message: "Where are the sessions?", mood: "angry" });
	}
}, {
	autoCloseInSeconds: 10,
	keepOnSendingMessages: true,
	minimumSecondsDelay: 20,
	maximumSecondsDelay: 40,
});
</script>

<style scoped>
.stats-page {
	width: 100%;
	min-height: 100%;
	display: grid;
	gap: 20px;
	grid-template-columns: minmax(auto,300px) 1fr;
	align-items: start;
	justify-items: stretch;
}

.stats-box {
	height: 100%;
	display: flex;
	flex-flow: column;
	gap: 2rem;
}

.loading-holder {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100%;
	font-size: 2rem;
}

.number-displays {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 1rem;
}

.chart-holder {
	height: 16rem;
	width: 100%;
}

.chart-title {
	text-align: center;
}

@media screen and (max-width: 800px) {
	.stats-page {
		grid-template-columns: auto;
	}
}

@media screen and (max-width: 1240px) {
	.number-displays {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media screen and (max-width: 500px) {
	.number-displays {
		grid-template-columns: auto;
	}
}
</style>