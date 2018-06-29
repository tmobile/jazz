import {Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import * as moment from 'moment';
import {UtilsService} from '../../core/services/utils.service';

@Component({
  selector: 'chartjs-linegraph',
  templateUrl: './chartjs-linegraph.component.html',
  styleUrls: ['./chartjs-linegraph.component.scss']
})
export class ChartjsLinegraphComponent implements OnInit, OnChanges {
  @ViewChild('chart') chart;
  @Input() datasets;
  @Input() options;
  public _datasets;
  public _options;
  public type = 'scatter';

  constructor() {
  }

  ngOnInit() {

    setTimeout(() => {
      this._options.scales.yAxes[0].ticks.display = false;
    }, 5000)
  }

  ngOnChanges(changes?) {
    setTimeout(() => {
      this._datasets = this.datasets.map(this.modifyDataSet);
      this._options = this.getOptions(this.options);
    });
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
      maintainAspectRatio: false,
      responsive: true,
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
    options.scales.yAxes[0].ticks.min = graphOptions.yMin || 0;
    options.scales.yAxes[0].ticks.max = graphOptions.yMax || 100;
    return options;
  }

}
