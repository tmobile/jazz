import {Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import * as moment from 'moment';
import {UtilsService} from '../../core/services/utils.service';
declare let Promise;


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
  public isRendered = true;

  constructor(private utils: UtilsService) {}

  ngOnInit() {}

  ngOnChanges(changes?) {
    this.render();
      this._datasets = this.datasets.map(this.modifyDataSet);
      this._options = this.getOptions(this.options);
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
            padding: 10,
            stepSize: undefined,
            userCallback: function (tick) {
              return Math.round(tick);
            }
          },
          gridLines: {
            color: '#888',
            drawOnChartArea: false
          }
        }]
      }
    };

    options.tooltips.callbacks.label = graphOptions.tooltipXFormat ? function(tooltipItem, chart) {
      return moment(tooltipItem.xLabel).format(graphOptions.tooltipXFormat);
    } : options.tooltips.callbacks.label;
    options.scales.xAxes[0].ticks.min = graphOptions.fromDateValue;
    options.scales.xAxes[0].ticks.max = graphOptions.toDateValue;
    options.scales.xAxes[0].ticks.stepSize = graphOptions.stepSize;
    options.scales.xAxes[0].ticks.userCallback = (tick) => {
      return moment(tick).format(graphOptions.xAxisFormat);
    };
    options.scales.yAxes[0].ticks.min = graphOptions.yMin || 0;
    options.scales.yAxes[0].ticks.max = graphOptions.yMax || 100;
    if(graphOptions.yMin && graphOptions.yMax) {
      let difference = graphOptions.yMax - graphOptions.yMin;
      options.scales.yAxes[0].ticks.stepSize = difference / 5;
    }
    return options;
  }

  render() {
    this.isRendered = false;
    this.utils.setTimeoutPromise(100)
      .then(() => {this.isRendered = true;});
  }

}
