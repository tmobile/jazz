import {Component, OnInit, Input, ViewChild, AfterViewInit} from '@angular/core';
import {ToasterService} from 'angular2-toaster';
import {RequestService, MessageService} from '../../core/services/index';
import {DataCacheService} from '../../core/services/index';
import {ActivatedRoute} from '@angular/router';
import {DataService} from '../data-service/data.service';
import * as moment from 'moment';
import {UtilsService} from '../../core/services/utils.service';
import {Observable} from "rxjs/Observable";
import 'rxjs/add/operator/toPromise';
import { RenameFieldService } from '../../core/services/rename-field.service';
declare let Object;


@Component({
  selector: 'env-codequality-section',
  templateUrl: './env-codequality-section.component.html',
  styleUrls: ['./env-codequality-section.component.scss'],
  providers: [RequestService, MessageService, DataService],
})
export class EnvCodequalitySectionComponent implements OnInit {
  @Input() service: any = {};
  public filters: any = ['DAILY', 'WEEKLY', 'MONTHLY'];
  public filterSelected = [this.filters[0]];
  public env;
  public sectionStatus;
  public graph;
  public metrics;
  public selectedMetric;
  public filterData;
  public metricsIndex = 0;
  public errorData;
  public dayValue = 86400000;
  public weekValue = 604800000;
  public monthValue = 2592000000;
  public selectedMetricGraphData;
  public selectedMetricDisplayName;
  public graphDataRaw;

  constructor(
    private toasterService: ToasterService,
    private messageservice: MessageService,
    private route: ActivatedRoute,
    private http: RequestService,
    public utils: UtilsService,
    public renameFieldService: RenameFieldService) {
  }

  ngOnInit() {
    this.env = this.route.snapshot.params['env'];
    this.filterData = this.getFilterData(this.filters[0]);
    return this.queryGraphData(this.filterData);
  }

  refresh() {
    this.queryGraphData(this.filterData);
  }

  onFilterSelect(event) {
    this.filterData = this.getFilterData(event[0]);
    return this.queryGraphData(this.filterData);

  }

  getFilterData(filterInput) {
    let filterData;
    this.filterSelected = [filterInput];
    switch (filterInput) {
      case 'DAILY':
        filterData = {
          fromDateISO: moment().subtract(7, 'day').toISOString(),
          headerMessage: '( past 7 days )',
          xAxisFormat: 'MMM D',
          xAxisUnit: '7 days',
          stepSize: this.dayValue
        };
        break;
      case 'WEEKLY':
        filterData = {
          fromDateISO: moment().subtract(4, 'week').toISOString(),
          headerMessage: '( past 4 weeks )',
          xAxisFormat: 'MMM D',
          xAxisUnit: 'week',
          stepSize: this.dayValue * 2
        };
        break;
      case 'MONTHLY':
        filterData = {
          fromDateISO: moment().subtract(6, 'month').toISOString(),
          headerMessage: '( past 6 months )',
          xAxisFormat: 'MMM D',
          xAxisUnit: 'month',
          stepSize: 2592000000
        };
        break;
    }
    filterData.toDateISO = moment().toISOString();
    filterData.toDateValue = moment(filterData.toDateISO).valueOf();
    filterData.fromDateValue = moment(filterData.fromDateISO).valueOf();
    filterData.chartType = 'codeQuality';
    filterData.tooltipXFormat = 'MMM DD YYYY, h:mm a';
    return filterData;
  }

  selectMetric(index) {
    this.metricsIndex = index;
    this.selectedMetric = this.graphDataRaw.metrics[index];
    this.selectedMetricDisplayName = this.renameFieldService.getDisplayNameOfKey(this.selectedMetric.name.toLowerCase()) || this.selectedMetric.name;
    this.selectedMetricGraphData = this.formatGraphData(this.selectedMetric, this.filterData);
  }

  queryGraphData(filterData) {
    this.sectionStatus = 'loading';
    const request = {
      url: '/jazz/codeq',
      params: {
        domain: this.service.domain,
        service: this.service.name,
        environment: this.route.snapshot.params['env'],
        to: filterData.toDateISO,
        from: filterData.fromDateISO
      }
    };
    this.http.get(request.url, request.params, this.service.id)
      .toPromise()
      .then((response) => {
        if (response && response.data && response.data.metrics && response.data.metrics.length) {
          this.sectionStatus = 'resolved';
          this.graphDataRaw = response.data;
          this.sortAllMetricData(this.graphDataRaw);
          this.selectMetric(this.metricsIndex);
        } else {
          this.sectionStatus = 'empty';
        }
      })
      .catch((error) => {
        this.sectionStatus = 'error';
        this.errorData = {
          request: request,
          response: error.json()
        };
      });

  }

  formatGraphData(metricData, filterData) {
    const to = moment(filterData.toDateISO), from = moment(filterData.fromDateISO);
    const values = metricData.values
      .filter((dataPoint) => {
        const pointDate = moment(dataPoint.ts);
        const x = pointDate.diff(from);
        const y = pointDate.diff(to);
        return x > 0 && y < 0;
      })
      .sort((pointA, pointB) => {
        return moment(pointA.ts).diff(moment(pointB.ts));
      })
      .map((dataPoint) => {
        return {
          x: moment(dataPoint.ts).valueOf(),
          y: parseInt(dataPoint.value)
        };
      });

    filterData.yMax = values.length ? 1.1 * (values
      .map((point) => {
        return point.y;
      })
      .reduce((a, b) => {
        return Math.max(a, b);
      })) : 100;
    filterData.yMin = values.length ? (.9 * (values
      .map((point) => {
        return point.y;
      })
      .reduce((a, b) => {
        return Math.min(a, b);
      }, 100))) : 0;

    return {
      datasets: [values],
      options: Object.assign({}, filterData)
    };
  }

  sonarLink() {
    window.open(this.selectedMetric.link, '_blank');
  }

  sortAllMetricData(graphData) {
    graphData.metrics.forEach((metric) => {
      let datapoints = metric.values
        .sort((pointA, pointB) => {
          return moment(pointA.ts).diff(moment(pointB.ts));
        });
      metric.values = datapoints;
    })
  }

}

