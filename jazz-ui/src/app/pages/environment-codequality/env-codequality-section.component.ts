import {Component, OnInit, Input, ViewChild, AfterViewInit} from '@angular/core';
import {ToasterService} from 'angular2-toaster';
import {RequestService, MessageService} from '../../core/services/index';
import {DataCacheService} from '../../core/services/index';
import {ActivatedRoute} from '@angular/router';
import {DataService} from '../data-service/data.service';
import * as moment from 'moment';
import {UtilsService} from '../../core/services/utils.service';


@Component({
  selector: 'env-codequality-section',
  templateUrl: './env-codequality-section.component.html',
  styleUrls: ['./env-codequality-section.component.scss'],
  providers: [RequestService, MessageService, DataService],
})
export class EnvCodequalitySectionComponent implements OnInit {
  public metricCards;

  @ViewChild('metricCards') set _metricCards(input) {
    this.metricCards = input;
  }

  public metricCardsScroller;

  @ViewChild('metricCardsScroller') set _metricCardsScoller(input) {
    this.metricCardsScroller = input;
    if (this.metricCards && this.metricCardsScroller) {
      setTimeout(() => {
        this.metricCardsOversized = this.metricCardsScroller.nativeElement.scrollWidth >
          this.metricCards.nativeElement.getBoundingClientRect().width;
      });
    }
  };

  @Input() service: any = {};
  public renderGraph = true;
  public filters: any = ['DAILY', 'WEEKLY', 'MONTHLY'];
  public filterSelected = [this.filters[0]];
  public env;
  public sectionStatus;
  public graph;
  public metrics;
  public selectedMetric;
  public filterData;
  public metricsIndex = 0;
  public resizeDebounced;
  public errorData;
  public dayValue = 86400000;
  public weekValue = 604800000;
  public monthValue = 2592000000;
  public metricCardSize = 135 + 12;
  public metricCardsOversized;
  public metricCardOffset = 0;

  constructor(
    private toasterService: ToasterService,
    private messageservice: MessageService,
    private route: ActivatedRoute,
    private http: RequestService,
    private cache: DataCacheService,
    public utils: UtilsService) {
    this.resizeDebounced = this.utils.debounce(this.resize, 200, false);
  }

  ngOnInit() {
    this.env = this.route.snapshot.params['env'];
    this.filterData = this.selectFilter(this.filterSelected[0]);
    this.queryGraphData(this.filterData, this.metricsIndex);
  }

  refresh() {
    this.queryGraphData(this.filterData, this.metricsIndex);
  }

  onFilterSelected(event) {
    this.filterData = this.selectFilter(event[0]);
    this.queryGraphData(this.filterData, this.metricsIndex);
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
          headerMessage: '( past 4 weeks)',
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
    return filterData;
  }

  selectMetric(index) {
    this.metricsIndex = index;
    this.selectedMetric = this.metrics[index];
    this.graph = this.formatGraphData(this.selectedMetric, this.filterData);
  }

  queryGraphData(filterData, metricIndex) {
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
    this.http.get(request.url, request.params)
      .subscribe((response) => {
        this.sectionStatus = 'empty';
        this.metrics = response.data.metrics;
        this.metrics.forEach((metric) => {
          if (metric.values.length) {
            this.sectionStatus = 'resolved';
          }
        });
        this.selectedMetric = this.metrics[metricIndex];
        this.graph = this.formatGraphData(this.selectedMetric, filterData);
      }, (error) => {
        this.sectionStatus = 'error';
        this.errorData = {
          request: request,
          response: error.json()
        };
      });

  }

  formatGraphData(metricData, filterData) {
    const to = moment(filterData.toDateISO), from = moment(filterData.fromDateISO);
    const data = metricData.values
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
    return {
      datasets: [data],
      options: filterData
    };
  }

  sonarLink() {
    window.open(this.selectedMetric.link, '_blank');
  }

  resize() {
    this.renderGraph = false;
    setTimeout(() => {
      this.renderGraph = true;
    }, 200);
  }

  offsetLeft() {
    if (this.metricCardsScroller.nativeElement.getBoundingClientRect().right > this.metricCards.nativeElement.getBoundingClientRect().right) {
      this.metricCardOffset -= 1;
    }
  }

  offsetRight() {
    if (this.metricCardOffset < 0) {
      this.metricCardOffset += 1;
    }
  }

}

