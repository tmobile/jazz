import {
  Component, OnInit, Input, ViewChild, AfterViewInit
} from '@angular/core';
import * as moment from 'moment';
import {UtilsService} from "../../core/services/utils.service";
import {ActivatedRoute} from "@angular/router";
import {RequestService} from "../../core/services";
import {Observable} from "rxjs/Observable";

@Component({
  selector: 'service-metrics',
  templateUrl: './service-metrics.component.html',
  styleUrls: ['./service-metrics.component.scss']
})
export class ServiceMetricsComponent implements OnInit, AfterViewInit {
  @Input() service;
  @ViewChild('filters') filters;

  public serviceType;
  public filterInputs: any = {
    label: 'Filter by:',
    fields: [
      {
        label: 'PATH',
        options: [],
        values: [],
        type: 'select',
        selected: null
      },
      {
        label: 'ENVIRONMENT',
        options: ['prod', 'dev', 'stg'],
        values: ['prod', 'dev', 'stg'],
        selected: 'prod'
      },
      {
        label: 'METHOD',
        type: 'select',
        options: [],
        values: [],
        selected: null
      }
    ]
  };
  public viewInputs: any = {
    label: 'View by',
    fields: [
      {
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
        selected: 'Week'
      },
      {
        label: 'PERIOD',
        type: 'select',
        options: ['15 Minutes', '1 Hour', '6 Hours', '1 Day', '7 Days', '30 Days'],
        values: [moment(0).add(15, 'minute').valueOf() / 1000,
          moment(0).add(1, 'hour').valueOf() / 1000,
          moment(0).add(6, 'hour').valueOf() / 1000,
          moment(0).add(1, 'day').valueOf() / 1000,
          moment(0).add(7, 'day').valueOf() / 1000,
          moment(0).add(30, 'day').valueOf() / 1000],
        selected: '1 Hour'
      },
      {
        label: 'STATISTICS',
        type: 'select',
        options: ['Sum', 'Average'],
        values: ['sum', 'average'],
        selected: 'Sum'
      }
    ]
  };
  public formFields = this.filterInputs.fields.concat(this.viewInputs.fields);
  public form = {
    columns: [
      this.filterInputs,
      this.viewInputs
    ]
  };
  public formFieldDefaults = this.utils.clone(this.formFields);
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
    let filterList = this.formFieldDefaults.map((field) => {
      return {
        field: field.label,
        label: field.selected,
        value: field.values[field.options.findIndex((option) => {
          return option === field.selected;
        })]
      }
    });

    this.applyFilter({
      list: filterList,
      changed: null
    });
  }

  ngOnInit() {
    this.serviceType = this.service.type || this.service.serviceType;
  }

  refresh() {
    this.ngAfterViewInit();
  }

  applyFilter(filterChanges) {
    if (filterChanges.changed &&
      (filterChanges.changed.label === 'PATH' ||
        filterChanges.changed.label === 'METHOD')) {
      this.setAsset();
    } else {
      this.queryMetricsData();
    }
  }

  removeDefaultFilters(filterList) {
    return filterList.filter((filter) => {
      let defaultField = this.formFieldDefaults.find((field) => {
        return field.label === filter.field;
      });
      return defaultField.selected !== filter.label
    });
  }

  queryMetricsData() {
    this.sectionStatus = 'loading';
    let request = {
      url: '/jazz/metrics',
      body: {
        domain: this.service.domain,
        service: this.service.name,
        environment: this.filters.getFieldValueOfLabel('ENVIRONMENT'),
        start_time: this.filters.getFieldValueOfLabel('TIME RANGE'),
        end_time: moment().toISOString(),
        interval: this.filters.getFieldValueOfLabel('PERIOD'),
        statistics: this.filters.getFieldValueOfLabel('STATISTICS')
      }
    };
    return this.http.post(request.url, request.body)
      .toPromise()
      .then((response) => {
        this.sectionStatus = 'empty';
        if (response && response.data && response.data.assets && response.data.assets.length) {
          this.queryDataRaw = response.data;
          this.queryDataRaw.assets = this.filterAssetType(response.data);
          this.setPathFilter();
          this.setMethodFilter();
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
      } else if (this.serviceType === 'lambda') {
        return asset.type === 'lambda'
      }
    })
  }

  setPathFilter() {
    let paths = this.utils.unique(this.queryDataRaw.assets.map((asset) => {
      return asset.asset_name.Resource
    }), (assetResource) => {
      return assetResource;
    });
    let pathsField = this.filters.getField('PATH');
    pathsField.options = paths;
    pathsField.values = paths;
    pathsField.selected = this.selectedAsset && this.selectedAsset.asset_name.Resource || paths[0];
  }

  setMethodFilter() {
    let methodsField = this.filters.getField('METHOD');
    let methods = this.utils.unique(this.queryDataRaw.assets.map((asset) => {
      return asset.asset_name.Method;
    }), (assetMethod) => {
      return assetMethod;
    });
    methodsField.options = methods;
    methodsField.values = methods;
    methodsField.selected = this.selectedAsset && this.selectedAsset.asset_name.Method || methods[0];
  }

  setAsset() {
    let currentPath = this.filters.getFieldValueOfLabel('PATH');
    let currentMethod = this.filters.getFieldValueOfLabel('METHOD');
    this.selectedAsset = this.queryDataRaw.assets.find((asset) => {
      return asset.asset_name.Resource === currentPath && asset.asset_name.Method === currentMethod;
    });
    if (this.selectedAsset) {
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
          }, 100)) : 0,
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
}
