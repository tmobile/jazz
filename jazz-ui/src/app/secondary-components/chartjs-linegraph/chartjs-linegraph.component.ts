import {Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import * as moment from 'moment';
import {UtilsService} from '../../core/services/utils.service';

@Component({
  selector: 'chartjs-linegraph',
  templateUrl: './chartjs-linegraph.component.html',
  styleUrls: ['./chartjs-linegraph.component.scss']
})
export class ChartjsLinegraphComponent implements OnInit, OnChanges {
  @ViewChild('container') container;
  @ViewChild('linegraph') lineGraph;
  @Input() datasets: any = [];
  @Input() graphOptions = {};
  public type = 'scatter';
  public options = {};

  constructor() {
  }

  ngOnInit() {
    this.sizeCanvas();
  }

  ngOnChanges(changes?) {
    this.datasets = this.datasets.map(this.modifyDataSet);
    this.options = this.getOptions(this.graphOptions);
  }

  modifyDataSet(data) {
    const lineOptions = {
      data: data,
      backgroundColor: '#ed89c3',
      borderColor: '#ed008d',
      borderWidth: 3,
      pointBackgroundColor: '#ed008d',
      pointBorderColor: '#ed008d',
      pointRadius: 5,
      pointHoverRadius: 5,
      fill: true,
      tension: 0,
      showLine: true
    };
    return lineOptions;
  }

  getOptions(graphOptions) {

    const options = {
      responsive: false,
      legend: false,
      tooltips: {
        enabled: true,
        displayColors: false,
        titleFontSize: 16,
        borderWidth: 1,
        titleFontColor: '#ed008c',
        backgroundColor: '#ffffff',
        borderColor: '#9b9b9b',
        callbacks: {
          title: (tooltipItem, chart) => {
            return tooltipItem[0].yLabel;
          },
          label: (tooltipItem, chart) => {
            return moment(tooltipItem.xLabel).format('MMM D, YYYY');
          },
          labelTextColor: () => {
            return '#9b9b9b';
          }
        }
      },
      scales: {
        xAxes: [
          {
            ticks: {
              min: 0,
              max: 100,
              stepSize: undefined,
              userCallback: function (tick) {
                return tick;
              }
            },
            gridLines: {
              color: '#888',
              drawOnChartArea: false
            }
          }],
        yAxes: [{
          ticks: {
            min: 0,
            max: 100,
            padding: 10
          },
          gridLines: {
            color: '#888',
            drawOnChartArea: false
          }
        }]
      }
    };
    options.scales.xAxes[0].ticks.min = graphOptions.fromDateValue;
    options.scales.xAxes[0].ticks.max = graphOptions.toDateValue;
    options.scales.xAxes[0].ticks.stepSize = graphOptions.stepSize;
    options.scales.xAxes[0].ticks.userCallback = (tick) => {
      return moment(tick).format(graphOptions.xAxisFormat);
    };
    return options;
  }

  sizeCanvas() {
    const boundingRect = this.container.nativeElement.getBoundingClientRect();
    this.lineGraph.nativeElement.height = boundingRect.height;
    this.lineGraph.nativeElement.width = boundingRect.width;
  }
}
