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
  public graphData;
  public graphDataRaw;

  constructor(
    private toasterService: ToasterService,
    private messageservice: MessageService,
    private route: ActivatedRoute,
    private http: RequestService,
    public utils: UtilsService) {
  }

  ngOnInit() {
    this.env = this.route.snapshot.params['env'];
    return this.selectFilter(this.filters[0]);
  }

  refresh() {
    // this.queryGraphData(this.filterData, this.metricsIndex);
  }

  onFilterSelected(event) {
    return this.filterData = this.selectFilter(event[0]);
  }

  selectFilter(filterInput) {
    let filterData;
    this.filterSelected = [filterInput];
    switch (filterInput) {
      case 'DAILY':
        filterData = {
          fromDateISO: moment().subtract(7, 'day').toISOString(),
          headerMessage: '( past 7 days )',
          xAxisFormat: 'dd',
          stepSize: this.dayValue
        };
        break;
      case 'WEEKLY':
        filterData = {
          fromDateISO: moment().subtract(4, 'week').toISOString(),
          headerMessage: '( past 4 weeks )',
          xAxisFormat: 'M/D',
          stepSize: this.dayValue * 2
        };
        break;
      case 'MONTHLY':
        filterData = {
          fromDateISO: moment().subtract(6, 'month').toISOString(),
          headerMessage: '( past 6 months )',
          xAxisFormat: 'MMM',
          stepSize: 2592000000
        };
        break;
    }
    filterData.toDateISO = moment().toISOString();
    filterData.toDateValue = moment(filterData.toDateISO).valueOf();
    filterData.fromDateValue = moment(filterData.fromDateISO).valueOf();
    return this.queryGraphData(filterData);
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
    // this.http.get(request.url, request.params)
    let r = {
      "data": {
        "metrics": [
          {
            "name": "security",
            "link": "https://im64mh1007.execute-api.us-east-1.amazonaws.com/prod/jazz/codeq/help?metrics=security",
            "values": [
              {
                "ts": "2018-06-27T19:16:06+0000",
                "value": "30"
              }
            ]
          },
          {
            "name": "lines-of-code",
            "link": "https://im64mh1007.execute-api.us-east-1.amazonaws.com/prod/jazz/codeq/help?metrics=lines-of-code",
            "values": [
              {
                "ts": "2018-06-27T19:16:06+0000",
                "value": "20"
              }
            ]
          },
        ]
      },
      "input": {
        "environment": "zdzbvsm58c-dev",
        "from": "2018-06-20T22:05:29.980Z",
        "to": "2018-06-27T22:05:29.981Z",
        "service": "api1",
        "domain": "michael"
      }
    };
    return Observable.of(r)
      .toPromise()
      .then((response) => {
        if (response && response.data && response.data.metrics && response.data.metrics.length) {
          this.sectionStatus = 'resolved';
          this.graphDataRaw = response.data;
          this.graphData = response.data.metrics.map((metric) => {
            return this.formatGraphData(metric, filterData);
          });
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

}

