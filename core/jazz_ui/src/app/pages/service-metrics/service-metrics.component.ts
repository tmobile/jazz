import {
  Component, OnInit, Input, ViewChild, AfterViewInit
} from '@angular/core';
import * as moment from 'moment';
import {UtilsService} from "../../core/services/utils.service";
import {ActivatedRoute} from "@angular/router";
import {RequestService} from "../../core/services";
import {Observable} from "rxjs/Observable";
import * as _ from "lodash";

@Component({
  selector: 'service-metrics',
  templateUrl: './service-metrics.component.html',
  styleUrls: ['./service-metrics.component.scss']
})
export class ServiceMetricsComponent implements OnInit, AfterViewInit {
  @Input() service;
  @ViewChild('filters') filters;

  public serviceType;
  public environmentFilter;
  public formFields: any = [
    {
      column: 'View By:',
      label: 'TIME RANGE',
      type: 'select',
      options: ['Day', 'Week', 'Month', 'Year'],
      values: [
        {
          range: moment().subtract(1, 'day').toISOString(),
          format: 'h:mm a'
        },
        {
          range: moment().subtract(1, 'week').toISOString(),
          format: 'MMM Do'
        },
        {
          range: moment().subtract(1, 'month').toISOString(),
          format: 'M/D'
        },
        {
          range: moment().subtract(1, 'year').toISOString(),
          format: 'MMMM'
        }],
      selected: 'Day'
    },
    {
      column: 'View By:',
      label: 'PERIOD',
      type: 'select',
      options: ['15 Minutes', '1 Hour', '6 Hours', '1 Day', '7 Days', '30 Days'],
      values: [moment(0).add(15, 'minute').valueOf() / 1000,
        moment(0).add(1, 'hour').valueOf() / 1000,
        moment(0).add(6, 'hour').valueOf() / 1000,
        moment(0).add(1, 'day').valueOf() / 1000,
        moment(0).add(7, 'day').valueOf() / 1000,
        moment(0).add(30, 'day').valueOf() / 1000],
      selected: '15 Minutes'
    },
    {
      column: 'View By:',
      label: 'AGGREGATION',
      type: 'select',
      options: ['Sum', 'Average'],
      values: ['Sum', 'average'],
      selected: 'Sum'
    }
  ];
  public form;
  public selectedAsset;
  public selectedMetric;
  public queryDataRaw;
  public sectionStatus;
  public errorData = {};
  public graphData;
  private http;


  constructor(private request: RequestService,
              private utils: UtilsService,
              private activatedRoute: ActivatedRoute) {
    this.http = this.request;
  }

  ngAfterViewInit() {
    this.sectionStatus = 'loading';

    if (!this.activatedRoute.snapshot.params['env']) {
      return this.getEnvironments()
        .then(() => {
          return this.applyFilter();
        });
    } else {
      return this.applyFilter();
    }

  }

  ngOnInit() {
    this.serviceType = this.service.type || this.service.serviceType;
  }

  refresh() {
    this.ngAfterViewInit();
  }

  getEnvironments() {
    return this.http.get('/jazz/environments', {
      domain: this.service.domain,
      service: this.service.name
    }).toPromise()
      .then((response: any) => {
        if (response && response.data && response.data.environment && response.data.environment.length) {
          let serviceEnvironments = _(response.data.environment).map('logical_id').uniq().value();
          this.environmentFilter = {
            column: 'Filter By:',
            label: 'ENVIRONMENT',
            options: serviceEnvironments,
            values: serviceEnvironments,
            selected: 'prod'
          };
          let environmentField = this.filters.getFieldValueOfLabel('ENVIRONMENT');
          if (!environmentField) {
            this.formFields.splice(0, 0, this.environmentFilter);
          }
        }
      })
      .catch((error) => {
        return Promise.reject(error);
      })
  }

  applyFilter(changedFilter?) {
    if (changedFilter && (changedFilter.label === 'ASSET' ||
      changedFilter.label === 'METHOD' ||
      changedFilter.label === 'PATH')) {
      this.setAsset();
    } else {
      return this.queryMetricsData();
    }
  }

  queryMetricsData() {
    this.sectionStatus = 'loading';
    let request = {
      url: '/jazz/metrics',
      body: {
        domain: this.service.domain,
        service: this.service.name,
        environment: this.filters.getFieldValueOfLabel('ENVIRONMENT') || this.activatedRoute.snapshot.params['env'] || 'prod',
        start_time: this.filters.getFieldValueOfLabel('TIME RANGE').range,
        end_time: moment().toISOString(),
        interval: this.filters.getFieldValueOfLabel('PERIOD'),
        statistics: this.filters.getFieldValueOfLabel('AGGREGATION')
      }
    };
    return this.http.post(request.url, request.body)
      .toPromise()
      .then((response) => {
        this.sectionStatus = 'empty';
        if (response && response.data && response.data.assets && response.data.assets.length) {
          this.queryDataRaw = response.data;
          this.queryDataRaw.assets = this.filterAssetType(response.data);
          this.setAssetsFilter();
          this.setAsset();
        }
      })
      .catch((error) => {
        this.sectionStatus = 'error';
        console.log(error);
      })
  }

  filterAssetType(data) {
    return data.assets.filter((asset) => {
      if (this.serviceType === 'api') {
        return asset.type === 'apigateway';
      } else if (this.serviceType === 'function') {
        return asset.type === 'lambda'
      } else if (this.serviceType === 'website') {
        return (asset.type === 's3') || (asset.type === 'cloudfront') || (asset.type === 'storage_account');
      }
    })
  }

  setAssetsFilter() {
    this.filters.reset();
    switch (this.serviceType) {
      case 'api':
        let methods = _(this.queryDataRaw.assets)
          .map('asset_name.Method')
          .uniq().value();
        let paths = _(this.queryDataRaw.assets)
          .map('asset_name.Resource')
          .uniq().value();
        this.filters.addField('Filter By:', 'METHOD', methods, null, 'GET');
        this.filters.addField('Filter By:', 'PATH', paths);
        break;
      case 'website':
        let websiteAssets = _(this.queryDataRaw.assets).map('type').uniq().value();
        this.filters.addField('Filter By:', 'ASSET', websiteAssets, null, websiteAssets.filter(s => ['cloudfront', 'storage_account'].indexOf(s)>-1)[0].toString());
        break;
    }
  }

  setAsset() {
    switch (this.serviceType) {
      case 'api':
        let method = this.filters.getFieldValueOfLabel('METHOD');
        let path = this.filters.getFieldValueOfLabel('PATH');
        this.selectedAsset = _.find(this.queryDataRaw.assets, (asset) => {
          return asset.asset_name.Method === method && asset.asset_name.Resource === path;
        });
        break;
      case 'function':
        this.selectedAsset = this.queryDataRaw.assets[0];
        break;
      case 'website':
        let assetType = this.filters.getFieldValueOfLabel('ASSET');
        this.selectedAsset = _.find(this.queryDataRaw.assets, {type: assetType});
        break;
    }

    if (this.selectedAsset) {
      this.sortAssetData(this.selectedAsset);
      this.setMetric();
      this.sectionStatus = 'resolved';
    } else {
      this.sectionStatus = 'empty';
    }
  }

  setMetric(metric?) {
    if (metric) {
      this.selectedMetric = metric;
    } else if (this.selectedMetric) {
      let found = this.selectedAsset.metrics.find((metric) => {
        return metric.metric_name === this.selectedMetric.metric_name
      });
      this.selectedMetric = found || this.selectedAsset.metrics[0]
    } else {
      this.selectedMetric = this.selectedAsset.metrics[0]
    }

    this.graphData = this.formatGraphData(this.selectedMetric.datapoints);
  }

  formatGraphData(metricData) {
    let valueProperty = this.selectedAsset.statistics;

    let values = metricData
      .sort((pointA, pointB) => {
        return moment(pointA.Timestamp).diff(moment(pointB.Timestamp));
      })
      .map((dataPoint) => {
        return {
          x: moment(dataPoint.Timestamp).valueOf(),
          y: parseInt(dataPoint[valueProperty])
        };
      });

    let timeRange = this.filters.getFieldValueOfLabel('TIME RANGE');
    let options = {
      tooltipXFormat: 'MMM DD YYYY, h:mm a',
      fromDateISO: timeRange.range,
      fromDateValue: moment(timeRange.range).valueOf(),
      toDateISO: moment().toISOString(),
      toDateValue: moment().valueOf(),
      xAxisFormat: timeRange.format,
      stepSize: this.filters.getFieldValueOfLabel('PERIOD') * 1000,
      yMin: values.length ?
        .9 * (values.map((point) => {
          return point.y;
        })
          .reduce((a, b) => {
            return Math.min(a, b);
          })) : 0,
      yMax: values.length ?
        1.1 * (values.map((point) => {
          return point.y;
        })
          .reduce((a, b) => {
            return Math.max(a, b);
          })) : 100
    };

    return {
      datasets: [values],
      options: options
    }
  }

  sortAssetData(asset) {
    asset.metrics.forEach((metric) => {
      let datapoints = metric.datapoints
        .sort((pointA, pointB) => {
          return moment(pointA.Timestamp).diff(moment(pointB.Timestamp));
        });
      metric.datapoints = datapoints;
    })
  }

}
