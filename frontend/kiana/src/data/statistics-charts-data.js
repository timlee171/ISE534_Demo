import { chartsConfig } from "@/configs";

const EmployeeChart = {
  type: "bar",
  height: 220,
  series: [
    {
      name: "Views",
      data: [50, 20, 10, 22, 50, 10, 40],
    },
  ],
  options: {
    ...chartsConfig,
    colors: "#388e3c",
    plotOptions: {
      bar: {
        columnWidth: "16%",
        borderRadius: 5,
      },
    },
    xaxis: {
      ...chartsConfig.xaxis,
      categories: ["M", "T", "W", "T", "F", "S", "S"],
    },
  },
};

const ErrorChart = {
  type: "line",
  height: 220,
  series: [
    {
      name: "Error counts",
      data: [2, 3, 2, 3, 2, 2, 0],
    },
  ],
  options: {
    ...chartsConfig,
    colors: ["#0288d1"],
    stroke: {
      lineCap: "round",
    },
    markers: {
      size: 5,
    },
    xaxis: {
      ...chartsConfig.xaxis,
      categories: [
"M", "T", "W", "T", "F", "S", "S"
      ],
    },
  },
};

const completedTaskChart = {
  type: "line",
  height: 220,
  series: [
    {
      name: "Unsolved tasks",
      data: [8, 5, 3, 10, 12, 9, 6],
    },
  ],
  options: {
    ...chartsConfig,
    colors: ["#388e3c"],
    stroke: {
      lineCap: "round",
    },
    markers: {
      size: 5,
    },
    xaxis: {
      ...chartsConfig.xaxis,
      categories: [
"M", "T", "W", "T", "F", "S", "S"
      ],
    },
  },
};
const imcompletedTasksChart = {
  ...completedTaskChart,
  series: [
    {
      name: "Unsolved Tasks",
      data: [8, 5, 3, 10, 12, 9, 6],
    },
  ],
};

export const statisticsChartsData = [
  {
    color: "white",
    title: "Employee",
    description: "Last week",
    footer: "updated 1 min ago",
    chart: EmployeeChart,
  },
  {
    color: "white",
    title: "Error Chart",
    description: "15% increase in today sales",
    footer: "updated 4 min ago",
    chart: ErrorChart,
  },
  {
    color: "white",
    title: "Imcompleted Tasks",
    description: "Last week",
    footer: "just updated",
    chart: imcompletedTasksChart,
  },
];

export default statisticsChartsData;
