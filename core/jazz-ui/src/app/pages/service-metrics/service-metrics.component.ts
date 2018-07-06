import {Component, OnInit, Input, ViewChild, AfterViewInit
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
          moment().subtract(1, 'day').toISOString(),
          moment().subtract(1, 'week').toISOString(),
          moment().subtract(1, 'month').toISOString(),
          moment().subtract(1, 'year').toISOString()],
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
          moment(0).add(7, 'day').valueOf()/ 1000,
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

    this.applyFilter(filterList);
  }

  ngOnInit() {
    this.serviceType = this.service.type || this.service.serviceType;
  }

  refresh() {

  }

  applyFilter(filterList) {
    let updatedFilterList = this.removeDefaultFilters(filterList);
    this.queryMetricsData(filterList);
  }

  removeDefaultFilters(filterList) {
    return filterList.filter((filter) => {
      let defaultField = this.formFieldDefaults.find((field) => {
        return field.label === filter.field;
      });
      return defaultField.selected !== filter.label
    });
  }

  queryMetricsData(filterList) {
    let r = {
      "data": {
        "domain": "jazz",
        "service": "custom-ad-authorizer",
        "environment": "prod",
        "end_time": "2018-06-27T21:35:41.475Z",
        "start_time": "2018-06-26T21:35:41.475Z",
        "interval": "900",
        "statistics": "average",
        "assets": [
          {
            "type": "apigateway",
            "asset_name": {
              "ApiName": "dev-cloud-api",
              "Method": "GET",
              "Resource": "/nw44bnzuan-dev/example",
              "Stage": "nw44bnzuan-dev"
            },
            "statistics": "Average",
            "metrics": [
              {
                "metric_name": "4XXError",
                "datapoints": [
                  {
                    "Timestamp": moment().subtract(1, 'hour'),
                    "Average": 23,
                    "Unit": "Count"
                  },
                  {
                    "Timestamp": moment().subtract(2, 'hour'),
                    "Average": 30,
                    "Unit": "Count"
                  },
                  {
                    "Timestamp": moment().subtract(1, 'day'),
                    "Average": 1,
                    "Unit": "Count"
                  },
                  {
                    "Timestamp": moment().subtract(3, 'day'),
                    "Average": 60,
                    "Unit": "Count"
                  },
                  {
                    "Timestamp": moment().subtract(20, 'day'),
                    "Average": 40,
                    "Unit": "Count"
                  },
                ]
              },
              {
                "metric_name": "5XXError",
                "datapoints": []
              },
              {
                "metric_name": "CacheHitCount",
                "datapoints": []
              },
              {
                "metric_name": "CacheMissCount",
                "datapoints": []
              },
              {
                "metric_name": "Count",
                "datapoints": []
              },
              {
                "metric_name": "IntegrationLatency",
                "datapoints": []
              },
              {
                "metric_name": "Latency",
                "datapoints": []
              }
            ]
          },
          {
            "type": "apigateway",
            "asset_name": {
              "ApiName": "dev-cloud-api",
              "Method": "POST",
              "Resource": "/nw44bnzuan-dev/example",
              "Stage": "nw44bnzuan-dev"
            },
            "statistics": "Sum",
            "metrics": [
              {
                "metric_name": "4XXError",
                "datapoints": [
                  {
                    "Timestamp": moment().subtract(1, 'day'),
                    "Average": 1,
                    "Unit": "Count"
                  },
                  {
                    "Timestamp": moment().subtract(3, 'day'),
                    "Average": 60,
                    "Unit": "Count"
                  },
                  {
                    "Timestamp": moment().subtract(2, 'day'),
                    "Average": 40,
                    "Unit": "Count"
                  },

                ]
              },
              {
                "metric_name": "5XXError",
                "datapoints": []
              },
              {
                "metric_name": "CacheHitCount",
                "datapoints": []
              },
              {
                "metric_name": "CacheMissCount",
                "datapoints": []
              },
              {
                "metric_name": "Count",
                "datapoints": []
              },
              {
                "metric_name": "IntegrationLatency",
                "datapoints": []
              },
              {
                "metric_name": "Latency",
                "datapoints": []
              }
            ]
          },
          {
            "type": "apigateway",
            "asset_name": {
              "ApiName": "dev-cloud-api",
              "Method": "OPTIONS",
              "Resource": "/nw44bnzuan-dev/example",
              "Stage": "nw44bnzuan-dev"
            },
            "statistics": "Sum",
            "metrics": [
              {
                "metric_name": "4XXError",
                "datapoints": []
              },
              {
                "metric_name": "5XXError",
                "datapoints": []
              },
              {
                "metric_name": "CacheHitCount",
                "datapoints": []
              },
              {
                "metric_name": "CacheMissCount",
                "datapoints": []
              },
              {
                "metric_name": "Count",
                "datapoints": []
              },
              {
                "metric_name": "IntegrationLatency",
                "datapoints": []
              },
              {
                "metric_name": "Latency",
                "datapoints": []
              }
            ]
          },
          {
            "type": "lambda",
            "asset_name": {
              "FunctionName": "example_hello-world-nw44bnzuan-dev"
            },
            "statistics": "Sum",
            "metrics": [
              {
                "metric_name": "Invocations",
                "datapoints": []
              },
              {
                "metric_name": "Errors",
                "datapoints": []
              },
              {
                "metric_name": "Dead Letter Error",
                "datapoints": []
              },
              {
                "metric_name": "Duration",
                "datapoints": []
              },
              {
                "metric_name": "Throttles",
                "datapoints": []
              },
              {
                "metric_name": "IteratorAge",
                "datapoints": []
              }
            ]
          }
        ]
      },
      "input": {
        "service": "custom-ad-authorizer",
        "domain": "jazz",
        "environment": "prod",
        "end_time": "2018-06-27T21:35:41.475Z",
        "start_time": "2018-06-26T21:35:41.475Z",
        "interval": "900",
        "statistics": "average"
      }
    };


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
    // this.http.post(request.url, request.body)
    Observable.of(r)
      .toPromise()
      .then((response) => {
        this.sectionStatus = 'empty';
        if (response && response.data && response.data.assets && response.data.assets.length) {
          this.queryDataRaw = response.data;
          this.queryDataRaw.assets = this.filterAssetType(response.data);
          this.setPathFilter();
          this.setMethodFilter();
          this.setAsset();
          if (this.selectedAsset) {
            this.setMetric();
            this.sectionStatus = 'resolved';
          }
        }
      })
      .catch((error) => {
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
    methodsField.selected = this.selectedAsset && this.selectedAsset.asset_name.Resource || methods[0];
  }

  setAsset() {
    let currentPath = this.filters.getFieldValueOfLabel('PATH');
    let currentMethod = this.filters.getFieldValueOfLabel('METHOD');
    this.selectedAsset = this.queryDataRaw.assets.find((asset) => {
      return asset.asset_name.Resource === currentPath && asset.asset_name.Method === currentMethod;
    });
  }

  setMetric(metric?) {
    if(metric) {
      this.selectedMetric = metric;
    } else if(this.selectedMetric) {
      this.selectedAsset.metrics.find((metric) => {
        return metric.metric_name === this.selectedMetric
      })
    } else {
      this.selectedMetric = this.selectedAsset.metrics[0]
    }
    this.selectedMetric.values = this.selectedMetric.datapoints;
    this.graphData = this.formatGraphData(this.selectedMetric.values)
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


    let options = {
      fromDateISO: this.filters.getFieldValueOfLabel('TIME RANGE'),
      fromDateValue: moment(this.filters.getFieldValueOfLabel('TIME RANGE')).valueOf(),
      toDateISO: moment().toISOString(),
      toDateValue: moment().valueOf(),
      xAxisFormat: this.calculateXAxisFormat(),
      stepSize: this.filters.getFieldValueOfLabel('PERIOD') * 1000,
      yMin: values.length ?
        .9 * (values.map((point) => {return point.y;})
        .reduce((a, b) => {
          return Math.min(a, b);
        }, 100)) : 0,
      yMax: values.length ?
        1.1 * (values.map((point) => {return point.y;})
        .reduce((a, b) => {
          return Math.max(a, b);
        })) : 100
    };

    return {
      datasets: [values],
      options: options
    }
  }

  calculateXAxisFormat() {
    let period = this.filters.getField('PERIOD').selected;
    let range = this.filters.getFieldValueOfLabel('TIME RANGE');
    switch(period) {
      case '15 Minutes':
        return 'hh:mm a';
      case '1 Hour':
        return 'hh:mm a';
      case '6 Hours':
        return 'MMM DD hh:mm a';
      case '1 Day':
        return 'MMM DD';
    }
  }
}
