export const doughnutChartOptions: any = {
  responsive: false,
  maintainAspectRatio: false,
  cutout: '80%',
  plugins: {
    tooltip: {
      enabled: false,
    },
  },
  animation: {
    duration: 4000,
    easing: 'easeInOutExpo',
    onProgress: function ({ chart, currentStep, numSteps }: any) {
      const [fillValue] = chart.data.datasets[0].data;
      const interpolatedValue = Math.round(
        (currentStep * fillValue) / numSteps
      );

      const centerX = chart.width / 2;
      const centerY = chart.height / 2;

      chart.ctx.fillStyle = '#3b82f6';
      chart.ctx.font = 'bold 22px Arial';
      chart.ctx.textAlign = 'center';
      chart.ctx.textBaseline = 'middle';
      chart.ctx.fillText(`${interpolatedValue} %`, centerX, centerY);
    },
  },
};
