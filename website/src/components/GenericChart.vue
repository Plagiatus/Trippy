<template>
	<canvas ref="canvasElementRef"></canvas>
</template>

<script setup lang="ts" generic="TChartType extends keyof ChartTypeRegistry">
import {Chart, ChartConfiguration, ChartTypeRegistry, LineController, LineElement, LinearScale, PointElement, TimeScale, Tooltip, Legend, CategoryScale} from "chart.js";
import { shallowRef, watch } from "vue";
Chart.register([LineController, CategoryScale, LinearScale, PointElement, LineElement, TimeScale, Tooltip, Legend]);

const props = defineProps<{
	config: ChartConfiguration<TChartType>
}>();

const canvasElementRef = shallowRef<HTMLCanvasElement>();
const chart = shallowRef<Chart<TChartType>>();

watch([canvasElementRef, () => props.config], (_1, _2, cleanup) => {
	if (!canvasElementRef.value) {
		return;
	}

	const newChart = new Chart<TChartType>(canvasElementRef.value, props.config);
	chart.value = newChart;

	cleanup(() => {
		newChart.destroy();
	});
});
</script>