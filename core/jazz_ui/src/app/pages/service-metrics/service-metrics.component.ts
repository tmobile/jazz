import {
  Component, OnInit, Input, ViewChild, AfterViewInit
} from '@angular/core';
import * as moment from 'moment';
import { UtilsService } from '../../core/services/utils.service';
import { ActivatedRoute } from '@angular/router';
import { RequestService, MessageService } from '../../core/services';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../../environments/environment.oss'
import { environment as env_oss } from './../../../environments/environment.oss';
import * as _ from 'lodash';
declare let Promise;

@Component({
  selector: 'service-metrics',
  templateUrl: './service-metrics.component.html',
  styleUrls: ['./service-metrics.component.scss']
})
export class ServiceMetricsComponent implements OnInit, AfterViewInit {
  @Input() service;
  @Input() assetTypeList;
  @ViewChild('filters') filters;
  public assetWithDefaultValue: any = [];
  payload: any = {};
  public allData: any;
  public serviceType;
  assetsNameArray: any = [];
  metricsLoaded: boolean = false;
  selectedEnv: any;
  public assetFilter;
  lambdaResourceNameArr:any;
  //public assetIdentifierFilter;
  public environmentFilter;
  public assetList: any = [];
  selectedAssetName: any;
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
      options: ['1 Minute', '1 Hour', '1 Day'],
      values: [moment(0).add(1, 'minute').valueOf() / 1000,
      moment(0).add(1, 'hour').valueOf() / 1000,
      moment(0).add(1, 'day').valueOf() / 1000],
      selected: '1 Minute'
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
  public sectionStatus = "empty";
  public errorData = {};
  public graphData;
  private http;
  public assetType = [];
  public assetSelected: any;
  slsapp: boolean = false;
  errMessage: any;
  private toastmessage: any = '';
  private slsLambdaselected;
  constructor(private request: RequestService,
    private utils: UtilsService,
    private messageservice: MessageService,
    private activatedRoute: ActivatedRoute) {
    this.http = this.request;
    this.toastmessage = messageservice;
  }


  ngAfterViewInit() {
    this.sectionStatus = 'loading';

    if (!this.activatedRoute.snapshot.params['env']) {
      return (this.getEnvironments() && this.getAssetType())
        .then(() => {
          return this.applyFilter();
        })
        .catch(err => {
          this.sectionStatus = 'error';
          this.errorData['response'] = err;
          this.errMessage = this.toastmessage.errorMessage(err, "metricsResponse");
        });
    } else {
      return this.getAssetType()
        .then(() => {
          return (this.applyFilter());
        })
    }

  }
  ngOnChanges(x: any) {
    if (x.service.currentValue.domain) {
      this.getAssetType()
    }
  }

  ngOnInit() {
    this.serviceType = this.service.type || this.service.serviceType;
    if(this.service.assets){
      this.selectedEnv = this.service.assets[0].environment;
    }
    this.setPeriodFilters();
  }
  setPeriodFilters() {
    if (this.service.deployment_targets === 'gcp_apigee') {
      const periodFilterIndex = this.formFields.findIndex(formField => formField.label === 'PERIOD');
      this.formFields[periodFilterIndex].options = ['1 Minutes', '1 Hour', '1 Day'];
      this.formFields[periodFilterIndex].values = [moment(0).add(1, 'minute').valueOf() / 1000,
      moment(0).add(1, 'hour').valueOf() / 1000,
      moment(0).add(1, 'day').valueOf() / 1000,
      ];
      this.formFields[periodFilterIndex].selected = '1 Minutes';
    }
  }

  refresh() {
    this.ngAfterViewInit();
  }
  setAssetName(val,selected){
    let assetIdentifierFilter = {};
    if(this.service.serviceType === "sls-app"){
      this.slsapp = true;
      let assetObj = [];
      let assetNameObject = [];
      val[0].data.assets.map((item)=>{
       assetObj.push({type: item.asset_type, name: item.provider_id ,env: item.environment});
     })
     assetObj.map((item)=>{
       if(item.type === selected && item.env === this.selectedEnv){
        let tokens = item.name.split(':');
        this.selectedAssetName = tokens[tokens.length - 1];
        if(item.type === 'lambda') {
          let value = this.selectedAssetName.split('-');
          this.selectedAssetName = value[value.length - 1];
        }
        if(item.type==='apigateway'){
          this.selectedAssetName = this.selectedAssetName.split('/').slice(2,4).join('/');
        }
        if(this.selectedAssetName.startsWith("table/")){
         this.selectedAssetName = this.selectedAssetName.replace('table/','');
        }
        assetNameObject.push(this.selectedAssetName);
       }
     })
     if(assetNameObject.length !== 0) {
      assetIdentifierFilter = {
        column: 'Filter By:',
        label: 'ASSET NAME',
        options:assetNameObject,
        values: assetNameObject,
        selected: assetNameObject[0]
      };
     }
     else {
       let value = 'all'.split('0')
      assetIdentifierFilter = {
        column: 'Filter By:',
        label: 'ASSET NAME',
        options: value,
        values: value,
        selected: value
      };
     }
     this.applyFilter(assetIdentifierFilter);
    }
  }
  getAssetType(data?) {
    try{
      let self = this;
      return self.http.get('/jazz/assets', {
        domain: self.service.domain,
        service: self.service.name,
      }, self.service.id).toPromise().then((response: any) => {
        if (response && response.data && response.data.assets) {
          let assets = _(response.data.assets).map('asset_type').uniq().value();
          if(assets){
            this.assetsNameArray = [];
            self.assetWithDefaultValue = assets;
            this.assetsNameArray.push(response);
            let validAssetList = assets.filter(asset => (env_oss.assetTypeList.indexOf(asset) > -1));
            this.lambdaResourceNameArr = response.data.assets.map( asset => asset.provider_id );
            this.lambdaResourceNameArr = _.uniq(this.lambdaResourceNameArr);
            self.assetWithDefaultValue = validAssetList;
            if(validAssetList.length){
              for (var i = 0; i < self.assetWithDefaultValue.length; i++) {
                self.assetList[i] = self.assetWithDefaultValue[i].replace(/_/g, " ");
              }
              self.assetFilter = {
                column: 'Filter By:',
                label: 'ASSET TYPE',
                options: this.assetList,
                values: validAssetList,
                selected: validAssetList[0].replace(/_/g, " ")
              };
              
              if (!data) {
                self.assetSelected = validAssetList[0].replace(/_/g, " ");
              }
              this.payload.asset_type = this.assetSelected.replace(/ /g, "_");
              self.assetSelected = validAssetList[0].replace(/ /g, "_");
              let assetField = self.filters.getFieldValueOfLabel('ASSET TYPE');
              if (!assetField) {
                self.formFields.splice(0, 0, self.assetFilter);
                self.filters.setFields(self.formFields);
              }
              self.setAssetName(self.assetsNameArray, self.assetSelected);
            }
            
          }          
        }
      })
      .catch((error) => {
        return Promise.reject(error);
      })
    }
    catch(ex){
      console.log('ex:',ex);
    }
    
  }

  getEnvironments() {
    return this.http.get('/jazz/environments', {
      domain: this.service.domain,
      service: this.service.name
    }, this.service.id).toPromise()
      .then((response: any) => {
        if (response && response.data && response.data.environment && response.data.environment.length) {
          let serviceEnvironments = _(response.data.environment).map('logical_id').uniq().value();
          this.environmentFilter = {
            column: 'Filter By:',
            label: 'ENVIRONMENT',
            type: 'select',
            options: serviceEnvironments,
            values: serviceEnvironments,
            selected: 'prod'
          };
          this.selectedEnv = this.environmentFilter.selected;
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
  findIndexOfObjectWithKey(array, key, value) {
    for (let i = 0; i < array.length; i++) {
      if (array[i][key] == value) {
        return i;
      }
    }
  }

  applyFilter(changedFilter?) {
    if (changedFilter) {
      let index = this.findIndexOfObjectWithKey(this.formFields, 'label', 'PERIOD');
      if (this.service.deployment_targets === 'gcp_apigee') {
        switch (changedFilter.selected) {
          case 'Day': {
            this.formFields[index].options = ['1 Minutes', '1 Hour', '1 Day'];
            this.formFields[index].values = [
              moment(0).add(1, 'minute').valueOf() / 1000,
              moment(0).add(1, 'hour').valueOf() / 1000,
              moment(0).add(1, 'day').valueOf() / 1000,];
            this.filters.changeFilter('1 Minutes', this.formFields[index]);
            break;
          }
          case 'Week': {
            this.formFields[index].options = ['1 Hour', '1 Day', '7 Days'];
            this.formFields[index].values = [
              moment(0).add(1, 'hour').valueOf() / 1000,
              moment(0).add(1, 'day').valueOf() / 1000,
              moment(0).add(7, 'day').valueOf() / 1000,];
            this.filters.changeFilter('1 Hour', this.formFields[index]);
            break;
          }
          case 'Month': {
            this.formFields[index].options = ['1 Day', '7 Days', '30 Days'];
            this.formFields[index].values = [
              moment(0).add(1, 'day').valueOf() / 1000,
              moment(0).add(7, 'day').valueOf() / 1000,
              moment(0).add(30, 'day').valueOf() / 1000];
            this.filters.changeFilter('1 Day', this.formFields[index]);
            break;
          }
          case 'Year': {
            this.formFields[index].options = ['1 Day', '7 Days', '30 Days'];
            this.formFields[index].values = [
              moment(0).add(1, 'day').valueOf() / 1000,
              moment(0).add(7, 'day').valueOf() / 1000,
              moment(0).add(30, 'day').valueOf() / 1000];
            this.filters.changeFilter('1 Day', this.formFields[index]);
            break;
          }
        }
      }
      else {
        switch (changedFilter.selected) {
          case 'Day': {
            this.formFields[index].options = ['1 Minutes', '1 Hour', '1 Day'];
            this.formFields[index].values = [
              moment(0).add(1, 'minute').valueOf() / 1000,
              moment(0).add(1, 'hour').valueOf() / 1000,
              moment(0).add(1, 'day').valueOf() / 1000,];
            this.filters.changeFilter('1 Minutes', this.formFields[index]);
            break;
          }
          case 'Week': {
            this.formFields[index].options = ['1 Hour', '1 Day', '7 Days'];
            this.formFields[index].values = [
              moment(0).add(1, 'hour').valueOf() / 1000,
              moment(0).add(1, 'day').valueOf() / 1000,
              moment(0).add(7, 'day').valueOf() / 1000,];
            this.filters.changeFilter('1 Hour', this.formFields[index]);
            break;
          }
          case 'Month': {
            this.formFields[index].options = ['1 Day', '7 Days', '30 Days'];
            this.formFields[index].values = [
              moment(0).add(1, 'day').valueOf() / 1000,
              moment(0).add(7, 'day').valueOf() / 1000,
              moment(0).add(30, 'day').valueOf() / 1000];
            this.filters.changeFilter('1 Day', this.formFields[index]);
            break;

          }
          case 'Year': {
            this.formFields[index].options = ['1 Day', '7 Days', '30 Days'];
            this.formFields[index].values = [
              moment(0).add(1, 'day').valueOf() / 1000,
              moment(0).add(7, 'day').valueOf() / 1000,
              moment(0).add(30, 'day').valueOf() / 1000];
            this.filters.changeFilter('1 Day', this.formFields[index]);
            break;
          }
        }
      }
      if (changedFilter.label === 'ASSET TYPE') {
        this.assetSelected = changedFilter.selected.replace(/ /g, "_")
        this.setAssetName(this.assetsNameArray,this.assetSelected);
      }
      if (changedFilter.label === 'ASSET NAME') {
        let lambda = changedFilter.selected;
          this.formFields.map((item,index)=>{
            if(item.label === "ASSET NAME"){
              this.formFields.splice(index,1);
            }
          })
          this.formFields.splice(2, 0, changedFilter);
          this.filters.setFields(this.formFields); 
      }
      if (changedFilter.label === 'ENVIRONMENT') {
          this.selectedEnv = changedFilter.selected;
          this.setAssetName(this.assetsNameArray,this.assetSelected);
      }     
    }
    if( changedFilter && (changedFilter.label === 'ASSET IDENTIFIER')){
      this.slsLambdaselected = changedFilter.selected;
      this.setAsset();
    }
    if (changedFilter && (changedFilter.label === 'ASSET' ||
      changedFilter.label === 'METHOD' ||
      changedFilter.label === 'PATH' || changedFilter.label === 'ASSET NAME')) {
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
    if(this.assetSelected !== 'all') {
      request.body['asset_type'] = this.assetSelected;
    }
    return this.http.post(request.url, request.body, this.service.id)
      .toPromise()
      .then((response) => {
        this.sectionStatus = 'empty';
        this.metricsLoaded = true;
        if (response && response.data && response.data.length) {
          this.queryDataRaw = response.data;
          this.getAllData(response.data);
        }
      })
      .catch((error) => {
        this.sectionStatus = 'error';
        // comment following 2 lines if there are any issues?
        this.errorData['response'] = error;
        this.errMessage = this.toastmessage.errorMessage(error, "metricsResponse");
      })
  }
  getAllData(data) {
    this.allData = data;
    this.queryDataRaw.assets = this.filterAssetType(this.allData[0]);
    if (this.queryDataRaw.assets.length !== 0) {
      this.setAssetsFilter();
      this.setAsset();
    }
    else {
      if(this.metricsLoaded = true) {
        this.sectionStatus = 'empty';
      }
    }
  }
  filterAssetType(data) {
    return data.assets.filter((asset) => {
      return asset.type === this.assetSelected;
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
        this.filters.addField('Filter By:', 'METHOD', methods, 'select', null, 'GET');
        this.filters.addField('Filter By:', 'PATH', paths, 'select', null, null);
        break;
      case 'website':
        let websiteAssets = _(this.queryDataRaw.assets).map('type').uniq().value();
        this.filters.addField('Filter By:', 'ASSET', websiteAssets, 'select', null, 'cloudfront');
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
      case 'sls-app':
        if(this.queryDataRaw){
          for(let asset of this.queryDataRaw.assets){
            if(asset.asset_name.FunctionName.includes(this.slsLambdaselected)){
              this.selectedAsset = asset;
            }
          }
          this.selectedAsset = this.queryDataRaw.assets[0];

        }
        
        break;
      case 'website':
        let assetType = this.filters.getFieldValueOfLabel('ASSET');
        this.selectedAsset = _.find(this.queryDataRaw.assets, { type: assetType });
        break;
    }

    if (this.selectedAsset) {
      this.sortAssetData(this.selectedAsset);
      this.setMetric();
      this.sectionStatus = 'resolved';
    } else {
      if(this.metricsLoaded === true) {
        this.sectionStatus = 'empty';
      }
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

        let obj = {
          x: moment(dataPoint.Timestamp).valueOf(),
          y: parseInt(dataPoint[valueProperty])
        };

        if (!obj['y']) {
          obj['y'] = parseInt(dataPoint[valueProperty.toLowerCase()])
        }
        return obj;
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
