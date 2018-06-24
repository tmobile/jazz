export interface Record {
  date: Date,
  value: number
}

export interface GraphData {
  xAxis: any,
  yAxis: any,
  data: Record[]
}

const dayData1: GraphData = {
	xAxis: { label: 'TIME (UTC)', range: 'day'},
	yAxis: { label: 'ERRORS'},
	data: [
	  {date: new Date("2017/06/14 04:00:00"), value: 0},
	  {date: new Date("2017/06/14 08:00:00"), value: 0},
	  {date: new Date("2017/06/14 12:00:00"), value: 0},
	  {date: new Date("2017/06/14 16:00:00"), value: 0},
	  {date: new Date("2017/06/14 18:00:00"), value: 3},
	  {date: new Date("2017/06/14 20:00:00"), value: 0},
	  {date: new Date("2017/06/14 24:00:00"), value: 0}
	]
};

const dayData2: GraphData = {
	xAxis: { label: 'Time (UTC)', range: 'day'},
	yAxis: { label: 'COST'},
	data: [
	  {date: new Date("2017/06/14 04:00:00"), value: 0},
	  {date: new Date("2017/06/14 08:00:00"), value: 0},
	  {date: new Date("2017/06/14 12:00:00"), value: 0},
	  {date: new Date("2017/06/14 16:00:00"), value: 2},
	  {date: new Date("2017/06/14 18:00:00"), value: 0},
	  {date: new Date("2017/06/14 20:00:00"), value: 0},
	  {date: new Date("2017/06/14 23:00:00"), value: 0}
	]
};

const dayData3: GraphData = {
	xAxis: { label: 'Time (UTC)', range: 'day'},
	yAxis: { label: 'COUNT'},
	data: [
	  {date: new Date("2017/06/14 04:00:00"), value: 20},
	  {date: new Date("2017/06/14 08:00:00"), value: 0},
	  {date: new Date("2017/06/14 12:00:00"), value: 3},
	  {date: new Date("2017/06/14 16:00:00"), value: 0},
	  {date: new Date("2017/06/14 18:00:00"), value: 0},
	  {date: new Date("2017/06/14 20:00:00"), value: 14},
	  {date: new Date("2017/06/14 23:00:00"), value: 0}
	]
};

export const DayData: GraphData[] = [dayData1, dayData2, dayData3, dayData1, dayData2, dayData3];


const weekData1: GraphData = {
	xAxis: { label: 'Time (UTC)', range: 'week'},
	yAxis: { label: 'ERRORS'},
	data: [
	  {date: new Date("2017/06/08 04:00:00"), value: 24},
	  {date: new Date("2017/06/09 08:00:00"), value: 10},
	  {date: new Date("2017/06/10 12:00:00"), value: 0},
	  {date: new Date("2017/06/11 16:00:00"), value: 4},
	  {date: new Date("2017/06/12 18:00:00"), value: 36},
	  {date: new Date("2017/06/13 20:00:00"), value: 0},
	  {date: new Date("2017/06/14 24:00:00"), value: 22}
	]
};

export const WeekData: GraphData[] = [weekData1, weekData1, weekData1, weekData1, weekData1, weekData1];


const monthData1: GraphData = {
	xAxis: { label: 'Time (UTC)', range: 'month'},
	yAxis: { label: 'ERRORS'},
	data: [
	  {date: new Date("2017/05/15 04:00:00"), value: 64},
	  {date: new Date("2017/05/20 08:00:00"), value: 80},
	  {date: new Date("2017/05/25 12:00:00"), value: 40},
	  {date: new Date("2017/05/30 16:00:00"), value: 46},
	  {date: new Date("2017/06/04 18:00:00"), value: 36},
	  {date: new Date("2017/06/09 20:00:00"), value: 60},
	  {date: new Date("2017/06/14 24:00:00"), value: 12}
	]
};

const monthData2: GraphData = {
	xAxis: { label: 'Time (UTC)', range: 'month'},
	yAxis: { label: 'COST'},
	data: [
	  {date: new Date("2017/05/15 04:00:00"), value: 46},
	  {date: new Date("2017/05/20 08:00:00"), value: 10},
	  {date: new Date("2017/05/25 12:00:00"), value: 70},
	  {date: new Date("2017/05/30 16:00:00"), value: 45},
	  {date: new Date("2017/06/04 18:00:00"), value: 3},
	  {date: new Date("2017/06/09 20:00:00"), value: 70},
	  {date: new Date("2017/06/14 24:00:00"), value: 22}
	]
};

export const MonthData: GraphData[] = [monthData1, monthData2, monthData1, monthData2, monthData1, monthData2];


const month6Data1: GraphData = {
	xAxis: { label: 'Time (UTC)', range: '6month'},
	yAxis: { label: 'ERRORS'},
	data: [
	  {date: new Date("2017/05/15 04:00:00"), value: 164},
	  {date: new Date("2017/05/20 08:00:00"), value: 80},
	  {date: new Date("2017/05/25 12:00:00"), value: 140},
	  {date: new Date("2017/05/30 16:00:00"), value: 246},
	  {date: new Date("2017/06/04 18:00:00"), value: 136},
	  {date: new Date("2017/06/09 20:00:00"), value: 60},
	  {date: new Date("2017/06/14 24:00:00"), value: 112}
	]
};

const month6Data2: GraphData = {
	xAxis: { label: 'Time (UTC)', range: '6month'},
	yAxis: { label: 'COST'},
	data: [
	  {date: new Date("2017/05/15 04:00:00"), value: 146},
	  {date: new Date("2017/05/20 08:00:00"), value: 210},
	  {date: new Date("2017/05/25 12:00:00"), value: 70},
	  {date: new Date("2017/05/30 16:00:00"), value: 145},
	  {date: new Date("2017/06/04 18:00:00"), value: 23},
	  {date: new Date("2017/06/09 20:00:00"), value: 170},
	  {date: new Date("2017/06/14 24:00:00"), value: 222}
	]
};

export const Month6Data: GraphData[] = [month6Data1, month6Data2, month6Data1, month6Data2, month6Data1, month6Data2];


const YearData1: GraphData = {
	xAxis: { label: 'Time (UTC)', range: 'year'},
	yAxis: { label: 'ERRORS'},
	data: [
	  {date: new Date("2017/05/15 04:00:00"), value: 264},
	  {date: new Date("2017/05/20 08:00:00"), value: 280},
	  {date: new Date("2017/05/25 12:00:00"), value: 140},
	  {date: new Date("2017/05/30 16:00:00"), value: 346},
	  {date: new Date("2017/06/04 18:00:00"), value: 136},
	  {date: new Date("2017/06/09 20:00:00"), value: 360},
	  {date: new Date("2017/06/14 24:00:00"), value: 112}
	]
};

const YearData2: GraphData = {
	xAxis: { label: 'Time (UTC)', range: 'year'},
	yAxis: { label: 'COUNT'},
	data: [
	  {date: new Date("2017/05/15 04:00:00"), value: 246},
	  {date: new Date("2017/05/20 08:00:00"), value: 210},
	  {date: new Date("2017/05/25 12:00:00"), value: 470},
	  {date: new Date("2017/05/30 16:00:00"), value: 145},
	  {date: new Date("2017/06/04 18:00:00"), value: 323},
	  {date: new Date("2017/06/09 20:00:00"), value: 170},
	  {date: new Date("2017/06/14 24:00:00"), value: 222}
	]
};

export const YearData: GraphData[] = [YearData1, YearData1, YearData2, YearData2, YearData1, YearData2];

