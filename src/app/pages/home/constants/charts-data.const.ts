import { ChartData, ChartType } from 'chart.js';

export const firstDoughnutChartData: ChartData<'doughnut'> = {
  datasets: [
    {
      data: [65, 35],
      backgroundColor: ['#3b82f6', '#DADADA'],
    },
  ],
};

export const secondDoughnutChartData: ChartData<'doughnut'> = {
  datasets: [
    {
      data: [75, 25],
      backgroundColor: ['#3b82f6', '#DADADA'],
    },
  ],
};

export const thirdDoughnutChartData: ChartData<'doughnut'> = {
  datasets: [
    {
      data: [85, 15],
      backgroundColor: ['#3b82f6', '#DADADA'],
    },
  ],
};

export const fourthDoughnutChartData: ChartData<'doughnut'> = {
  datasets: [
    {
      data: [100, 0],
      backgroundColor: ['#3b82f6', '#DADADA'],
    },
  ],
};
