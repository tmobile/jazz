import {Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import * as moment from 'moment';
import {UtilsService} from '../../core/services/utils.service';
declare let Promise;

// Used ng2-charts for chart.js
@Component({
  selector: 'chartjs-linegraph',
  templateUrl: './chartjs-linegraph.component.html',
  styleUrls: ['./chartjs-linegraph.component.scss']
})
export class ChartjsLinegraphComponent implements OnInit, OnChanges {
  @ViewChild('chart') chart;
  @Input() datasets;
  @Input() options;
  @Input() ylegend?; // y-legend name
  @Input() xlegend?; // x-legend name
  @Input() ytooltipsuffix?; // suffix to y tootltip as aggregation
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
      backgroundColor: '#FBE5F1',
      borderColor: '#EB7DB0',
      borderWidth: 1,
      pointBackgroundColor: '#E64284',
      pointBorderColor: '#E64284',
      pointRadius: 1.5,
      pointHoverRadius: 3,
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
        mode: 'nearest',
        intersect: false,
        enabled: true,
        displayColors: false,
        titleFontSize: 14,
        borderWidth: 1,
        titleFontColor: '#ed008c',
        backgroundColor: '#ffffff',
        borderColor: '#9b9b9b',
        callbacks: {
          title: (tooltipItem, chart) => {
            if (this.ytooltipsuffix) {
              return (tooltipItem[0].yLabel).toLocaleString() + ' (' + this.ytooltipsuffix + ')';
            } else {
              return (tooltipItem[0].yLabel).toLocaleString();
            }
          },
          label: (tooltipItem, chart) => {
            return moment(tooltipItem.xLabel).format('MMM D, YYYY');
          },
          labelTextColor: () => {
            return '#9b9b9b';
          }
        }
      },
      hover: {
        onHover: function(event, active) {
          if (active.length) {
            const element = <HTMLCanvasElement>document.getElementById('ctx');
            let	ctx = element.getContext('2d');

            //draw y-axis on hover
            var x = active[0]._view.x;
            var topY = active[0]._yScale.top;
            var bottomY = active[0]._yScale.bottom;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.setLineDash([1, 1]);
            ctx.strokeStyle = '#aaa';
            ctx.stroke();
            ctx.restore();
            //draw x-axis on hover
            var y = active[0]._view.y;
            var rightx = active[0]._xScale.right;
            var leftx = active[0]._xScale.left;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(rightx, y);
            ctx.lineTo(leftx, y);
            ctx.setLineDash([1, 1]);
            ctx.strokeStyle = '#aaa';
            ctx.stroke();
            ctx.restore();
            
          }       
     },
        mode: 'nearest',
        intersect: false
     },
      lineOnHover: {
        enabled: true,
        lineColor: '#bbb',
        lineWidth: 1
     },
      scales: {
        xAxes: [
          { 
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
              }
            },
            ticks: {
              suggestedMin: 2,
              suggestedMax: 100,
              maxTicksLimit: 19,
              maxRotation: 0,
              autoSkip: true,
              userCallback: function (tick) {
                return tick;
              }
            },
            gridLines: {
              color: '#ddd',
              drawOnChartArea: false
            },
            scaleLabel: {
              display: true,
              labelString: this.xlegend,
              fontColor: '#333',
              fontSize: 13,
              fontStyle: 'bold'
            }
          }],
        yAxes: [{
          ticks: {
            suggestedMin: 0,
            suggestedMax: 100,
            padding: 10,
            maxTicksLimit: 5,
            userCallback: function (tick) {
              return tick;
            }
          },
          gridLines: {
            color: '#ddd',
            drawOnChartArea: this.datasets[0].length > 0 ? true : false
          },
          scaleLabel: {
            display: true,
            labelString: this.ylegend,
            fontColor: '#333',
            fontSize: 13,
            fontStyle: 'bold'
          }
        }]
      }
    };
    options.tooltips.callbacks.label = graphOptions.tooltipXFormat ? function (tooltipItem, chart) {
      return moment(tooltipItem.xLabel).format(graphOptions.tooltipXFormat);
    } : options.tooltips.callbacks.label;
    options.scales.xAxes[0].ticks.suggestedMin = graphOptions.fromDateValue;
    options.scales.xAxes[0].ticks.suggestedMax = graphOptions.toDateValue;
    if (this.datasets[0].length === 1 && graphOptions.xAxisUnit !== 'day') {
      options.scales.xAxes[0]['bounds'] = 'data';
    }
    if ((graphOptions.xAxisUnit === 'day' && this.datasets[0].length) || this.datasets[0].length === 1) {
      options.scales.xAxes[0].time.unit = undefined;
      options.scales.xAxes[0].type = 'linear';
      options.scales.xAxes[0].ticks['min'] = graphOptions.fromDateValue;
      options.scales.xAxes[0].ticks['max'] = graphOptions.toDateValue;
      options.scales.xAxes[0].ticks['stepSize'] = graphOptions.stepSize;
      // options.scales.xAxes[0]['bounds'] = 'ticks';
    }
    if(graphOptions.chartType === 'codeQuality') {
      if (graphOptions.xAxisUnit !== 'month') {
        options.scales.xAxes[0].type = 'linear';
        options.scales.xAxes[0].time.unit = undefined;
      }
      // options.scales.xAxes[0].time.unit = undefined;
      options.scales.xAxes[0].ticks['min'] = graphOptions.fromDateValue;
      options.scales.xAxes[0].ticks['max'] = graphOptions.toDateValue;
      options.scales.xAxes[0].ticks['stepSize'] = graphOptions.stepSize;
      options.scales.yAxes[0].ticks.suggestedMin = graphOptions.yMin || 0;
      if (graphOptions.yMin && graphOptions.yMax) {
        let difference = graphOptions.yMax - graphOptions.yMin;
        options.scales.yAxes[0].ticks['stepSize'] = difference / 5;
      }
    }
    options.scales.xAxes[0].ticks.userCallback = (tick) => {
      return moment(tick).format(graphOptions.xAxisFormat);
    };
    options.scales.yAxes[0].ticks.suggestedMax = graphOptions.yMax || 100;
    if(graphOptions.yMin !== 0.9 || graphOptions.yMax !== 1.1) {
      options.scales.yAxes[0].ticks.userCallback = (tick) => {
        return this.abbreviateNumber(tick);
      } 
    } else {
      options.scales.yAxes[0].ticks.userCallback = (tick) => {
        return tick.toFixed(1);
      } 
    }
    return options;
  }

  render() {
    this.isRendered = false;
    this.utils.setTimeoutPromise(100)
      .then(() => {
        this.isRendered = true;
      });
  }

  abbreviateNumber(num) {
    let number = parseInt(num, 10);
      if (number < 99) {
        return number.toString();
      } else {
        const update_number = number > 1000000 ? parseInt((number / 1000000).toString()) + 'M' : (number > 1000 ? parseInt((number / 1000).toString()) + 'K' : number);
        return update_number.toString();
      }
  }

  // events
  public chartClicked({ event, active }: { event: MouseEvent, active: {}[] }): void {
    if (active && active.length) {
      this.lineOnhover(active);
    }
  }

  lineOnhover(active) {
    const element = <HTMLCanvasElement>document.getElementById('ctx');
		let	ctx = element.getContext('2d');
    var x = active[0]._view.x;
    var topY = active[0]._yScale.top;
    var bottomY = active[0]._yScale.bottom;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.setLineDash([1, 1]);
      ctx.strokeStyle = '#aaa';
      ctx.stroke();
      ctx.restore();

      var y = active[0]._view.y;
      var rightx = active[0]._xScale.right;
      var leftx = active[0]._xScale.left;
      ctx.save();
        ctx.beginPath();
        ctx.moveTo(rightx, y);
        ctx.lineTo(leftx, y);
        ctx.setLineDash([1, 1]);
        ctx.strokeStyle = '#aaa';
        ctx.stroke();
        ctx.restore();
  }

}
