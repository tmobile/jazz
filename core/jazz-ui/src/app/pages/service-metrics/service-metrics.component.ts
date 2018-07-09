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
        label: 'ASSET',
        options: [],
        values: [],
        selected: ''
      },
      {
        label: 'ENVIRONMENT',
        options: ['prod', 'dev', 'stg'],
        values: ['prod', 'dev', 'stg'],
        selected: 'prod'
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
    if (filterChanges.changed && filterChanges.changed.label === 'ASSET') {
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
    let r = {
      "data": {
        "domain": "surya",
        "service": "test-ws1",
        "environment": "prod",
        "end_time": "2018-07-07T01:31:05.689Z",
        "start_time": "2018-06-30T01:31:05.682Z",
        "interval": 3600,
        "statistics": "sum",
        "assets": [
          {
            "type": "s3",
            "asset_name": {
              "BucketName": "jazz20180706-prod-web-20180706134840176500000006",
              "StorageType": "StandardStorage"
            },
            "statistics": "Sum",
            "metrics": [
              {
                "metric_name": "NumberOfObjects",
                "datapoints": []
              },
              {
                "metric_name": "BucketSizeBytes",
                "datapoints": []
              }
            ]
          },
          {
            "type": "cloudfront",
            "asset_name": {
              "DistributionId": "E2LI8JCGEHHODQ",
              "Region": "Global"
            },
            "statistics": "Sum",
            "metrics": [
              {
                "metric_name": "5xxErrorRate",
                "datapoints": [
                  {
                    "Timestamp": "2018-07-06T22:31:00.000Z",
                    "Sum": 0,
                    "Unit": "Percent"
                  },
                  {
                    "Timestamp": "2018-07-06T23:31:00.000Z",
                    "Sum": 0,
                    "Unit": "Percent"
                  }
                ]
              },
              {
                "metric_name": "Requests",
                "datapoints": [
                  {
                    "Timestamp": "2018-07-06T22:31:00.000Z",
                    "Sum": 10,
                    "Unit": "None"
                  },
                  {
                    "Timestamp": "2018-07-06T23:31:00.000Z",
                    "Sum": 40,
                    "Unit": "None"
                  }
                ]
              },
              {
                "metric_name": "BytesUploaded",
                "datapoints": [
                  {
                    "Timestamp": "2018-07-06T22:31:00.000Z",
                    "Sum": 0,
                    "Unit": "None"
                  },
                  {
                    "Timestamp": "2018-07-06T23:31:00.000Z",
                    "Sum": 0,
                    "Unit": "None"
                  }
                ]
              },
              {
                "metric_name": "TotalErrorRate",
                "datapoints": [
                  {
                    "Timestamp": "2018-07-06T22:31:00.000Z",
                    "Sum": 0,
                    "Unit": "Percent"
                  },
                  {
                    "Timestamp": "2018-07-06T23:31:00.000Z",
                    "Sum": 0,
                    "Unit": "Percent"
                  }
                ]
              },
              {
                "metric_name": "4xxErrorRate",
                "datapoints": [
                  {
                    "Timestamp": "2018-07-06T22:31:00.000Z",
                    "Sum": 0,
                    "Unit": "Percent"
                  },
                  {
                    "Timestamp": "2018-07-06T23:31:00.000Z",
                    "Sum": 0,
                    "Unit": "Percent"
                  }
                ]
              },
              {
                "metric_name": "BytesDownloaded",
                "datapoints": [
                  {
                    "Timestamp": "2018-07-06T22:31:00.000Z",
                    "Sum": 181730,
                    "Unit": "None"
                  },
                  {
                    "Timestamp": "2018-07-06T23:31:00.000Z",
                    "Sum": 15121,
                    "Unit": "None"
                  }
                ]
              }
            ]
          }
        ]
      },
      "input": {
        "domain": "surya",
        "service": "test-ws1",
        "environment": "prod",
        "start_time": "2018-06-30T01:31:05.682Z",
        "end_time": "2018-07-07T01:31:05.689Z",
        "interval": 3600,
        "statistics": "sum"
      }
    }

    this.sectionStatus = 'loading';
    let request = {
      url: '/jazz/metrics',
      body: {
        domain: this.service.domain,
        service: this.service.name,
        environment: this.filters.getFieldValueOfLabel('ENVIRONMENT'),
        start_time: this.filters.getFieldValueOfLabel('TIME RANGE').range,
        end_time: moment().toISOString(),
        interval: this.filters.getFieldValueOfLabel('PERIOD'),
        statistics: this.filters.getFieldValueOfLabel('STATISTICS')
      }
    };
    // return this.http.post(request.url, request.body)
    Observable.of(r).toPromise()
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
        return (asset.type === 's3') || (asset.type === 'cloudfront');
      }
    })
  }


  setAssetsFilter() {
    let field = this.filters.getField('ASSET');
    let assets;
    if (this.serviceType === 'function') {
      assets = this.utils.unique(this.queryDataRaw.assets.map((asset) => {
        return asset.asset_name.FunctionName;
      }), (asset) => {
        return asset;
      });
    } else if (this.serviceType === 'api') {
      assets = this.utils.unique(this.queryDataRaw.assets.map((asset) => {
        return asset.asset_name.Method;
      }), (asset) => {
        return asset;
      });
    } else if (this.serviceType === 'website') {
      assets = this.utils.unique(this.queryDataRaw.assets.map((asset) => {
        return asset.type;
      }), (asset) => {
        return asset;
      });
    }
    field.options = assets;
    field.values = assets;
    field.selected = field.options[0];
  }

  setAsset() {
    let currentAsset = this.filters.getFieldValueOfLabel('ASSET');
    if (this.serviceType === 'function') {
      this.selectedAsset = this.queryDataRaw.assets.find((asset) => {
        return asset.asset_name.FunctionName === currentAsset
      });
    } else if (this.serviceType === 'api') {
      this.selectedAsset = this.queryDataRaw.assets.find((asset) => {
        return asset.asset_name.Method === currentAsset;
      });
    } else if (this.serviceType === 'website') {
      this.selectedAsset = this.queryDataRaw.assets.find((asset) => {
        return asset.type === currentAsset;
      });
    }

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
}
