import {
  Component, OnInit, Input, ViewChild, AfterViewInit, ChangeDetectorRef
} from '@angular/core';
import * as moment from 'moment';
import { UtilsService } from '../../core/services/utils.service';
import { ActivatedRoute } from '@angular/router';
import { RequestService, MessageService } from '../../core/services';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../../environments/environment.oss'
import { environment as env_oss } from './../../../environments/environment.oss';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { RenameFieldService } from '../../core/services/rename-field.service';
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
  public assetIdentifierFilter;
  public environmentFilter;
  public assetList: any = [];
  selectedAssetName: any;
  assetSelected;
  public formFields: any = [
    {
      column: 'View By:',
      label: 'TIME RANGE',
      type: 'select',
      options: [
        'Last 15 Minutes',
        'Last 1 Hour',
        'Last 24 Hours',
        'Last 7 Days',
        'Last 30 Days',
        'Last 3 Months',
        'Last 12 Months'
      ],
      values: [
        {
          range: moment().subtract(15, 'minute').toISOString(),
          format: 'hA',
          unit: 'minute'
        },
        {
          range: moment().subtract(1, 'hour').toISOString(),
          format: 'hA',
          unit: 'hour'
        },
        {
          range: moment().subtract(1, 'day').toISOString(),
          format: 'hA',
          unit: 'day'
        },
        {
          range: moment().subtract(1, 'week').toISOString(),
          format: 'MMM Do',
          unit: 'week'
        },
        {
          range: moment().subtract(1, 'month').toISOString(),
          format: 'M/D',
          unit: 'month'
        },
        {
          range: moment().subtract(3, 'month').toISOString(),
          format: 'M/D',
          unit: 'month'
        },
        {
          range: moment().subtract(1, 'year').toISOString(),
          format: 'MMM YYYY',
          unit: 'year'
        }],
      selected: 'Last 24 Hours'
    },
    {
      column: 'View By:',
      label: 'PERIOD',
      type: 'select',
      options: ['1 Minute', '30 Minutes', '1 Hour', '3 Hours', '15 Hours', '4 Days'],
      values: [
        moment(0).add(1, 'minutes').valueOf() / 1000,
        moment(0).add(30, 'minutes').valueOf() / 1000,
        moment(0).add(1, 'hour').valueOf() / 1000,
        moment(0).add(3, 'hour').valueOf() / 1000,
        moment(0).add(15, 'hour').valueOf() / 1000,
        moment(0).add(4, 'days').valueOf() / 1000,
      ],
      selected: '1 Hour'
    },
    {
      column: 'View By:',
      label: 'AGGREGATION',
      type: 'select',
      options: ['Average', 'Sum'],
      values: ['Average', 'Sum'],
      selected: 'Average'
    }
  ];

  public form;
  public selectedAsset;
  public selectedMetric;
  public selectedMetricDisplayName;
  public ylegend;
  public aggregation;
  public queryDataRaw;
  public sectionStatus = "empty";
  public errorData = {};
  public graphData;
  private http;
  public platform;
  slsapp: boolean = false;
  public assetType = [];

  errMessage: any;
  private toastmessage: any = '';
  private slsLambdaselected;
  public provider: any;
  private metricSubscription: Subscription;
  private assetSubscription: Subscription;
  assetNameFilterWhiteList = [
    'lambda',
    'cloudfront',
    's3',
    'dynamodb',
    'sqs',
    'kinesis',
    'iam_role'
  ];
  constructor(private request: RequestService,
    private utils: UtilsService,
    private cdr: ChangeDetectorRef,
    private messageservice: MessageService,
    private activatedRoute: ActivatedRoute,
    private renameFieldService: RenameFieldService) {
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

      // TODO: Condition prevents hydration of environments filter in some cases

      return this.getAssetType()
        .then(() => {
          return (this.applyFilter());
        })
    }

  }

  ngOnInit() {
    if(this.service.provider == 'azure'){
      this.setFilters();
    }
    this.serviceType = this.service.type || this.service.serviceType;
    if(this.service.assets){
      this.selectedEnv = this.service.assets[0].environment;
    }
    this.setPeriodFilters();
  }
  setPeriodFilters() {
    if (this.service.deployment_targets === 'gcp_apigee') {
      const periodFilterIndex = this.formFields.findIndex(formField => formField.label === 'PERIOD');
      this.formFields[periodFilterIndex].options =  ['1 Minutes', '3 Hours', '1 Day'];
      this.formFields[periodFilterIndex].values = [
        moment(0).add(1, 'minute').valueOf() / 1000,
        moment(0).add(3, 'hour').valueOf() / 1000,
        moment(0).add(1, 'day').valueOf() / 1000,
      ];
      this.formFields[periodFilterIndex].selected = '1 Minutes';
    }

    if (this.service.platform || (this.service.assets && this.service.assets.length>0)){
      this.platform = this.service.platform || this.service.assets[0].provider;
    }
    if (this.platform == 'azure'){
      const azPeriodFilterIndex = this.formFields.findIndex(formField => formField.label === 'PERIOD');
      this.formFields[azPeriodFilterIndex].options =  ['1 Minutes', '1 Hour', '1 Day'];
      this.formFields[azPeriodFilterIndex].values = [
        moment(0).add(1, 'minute').valueOf() / 1000,
        moment(0).add(1, 'hour').valueOf() / 1000,
        moment(0).add(1, 'day').valueOf() / 1000,
      ];
      this.formFields[azPeriodFilterIndex].selected =  '1 Hour';

      const azPAggFilterIndex = this.formFields.findIndex(formField => formField.label === 'AGGREGATION');
      this.formFields[azPAggFilterIndex].options =  ['Total'];
      this.formFields[azPAggFilterIndex].values = ['total'];
      this.formFields[azPAggFilterIndex].selected =  'Total';

    }
  }

  setFilters(){
    // we are targeting the second object in the FormFields where values for AGGREGATION is there
    this.formFields[2].options = ['Average', 'Total', 'Maximum']
    this.formFields[2].value = ['Average', 'Total', 'Maximum']
    this.formFields[2].values = ['Average', 'Total', 'Maximum']
  }

  refresh() {
    this.ngAfterViewInit();
  }

  fetchAssetName(type, name) {
    let assetName;
    let tokens;
    switch(type) {
      case 'lambda':
      case 'sqs':
      case 'iam_role':
        tokens = name.split(':');
        assetName = tokens[tokens.length - 1];
        break;
      case 'dynamodb':
      case 'cloudfront':
      case 'kinesis':
        tokens = name.split('/');
        assetName = tokens[tokens.length - 1];
        break;
      case 's3':
        tokens = name.split(':::');
        assetName = tokens[tokens.length - 1].split('/')[0];
        break;
    }
    return assetName;
  }

  setAssetName(val,selected){
    let assetIdentifierFilter = {};
      this.slsapp = true;
      let assetObj = [];
      let assetNameObject = [];
      val[0].data.assets.map((item)=>{
       assetObj.push({type: item.asset_type, name: item.provider_id ,env: item.environment});
     })
     assetObj.map((item)=>{
       if(item.type === selected && item.env === this.selectedEnv){
        this.selectedAssetName = this.fetchAssetName(item.type, item.name);
        if (this.selectedAssetName) {
          assetNameObject.push(this.selectedAssetName);
        }
        assetNameObject.sort();
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

  getAssetType(data?) {
    try{
      if(this.assetSubscription) {
        this.assetSubscription.unsubscribe();
      }
      let self = this;
      return self.http.get('/jazz/assets', {
        domain: self.service.domain,
        service: self.service.name,
        limit: 1e3, // TODO: Address design shortcomings
        offset: 0,
      }, self.service.id).toPromise().then((response: any) => {
        if (response && response.data && response.data.assets) {
          self.provider = response.data.assets[0].provider;
          let assets = _(response.data.assets).map('asset_type').uniq().value();

          // TODO: Consider hoisting to member or configuration
          const filterWhitelist = [
            'lambda',
            'apigateway',
            'cloudfront',
            's3',
            'dynamodb',
            'sqs',
            'kinesis_stream',
            'apigee_proxy',
            'storage_account'
          ];
          assets = assets.filter(item => filterWhitelist.includes(item));

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
                self.formFields.splice(1, 0, self.assetFilter);
                self.filters.setFields(self.formFields);
              }
              if (this.assetNameFilterWhiteList.indexOf(this.assetSelected) > -1) {
                self.setAssetName(self.assetsNameArray, self.assetSelected);
              }
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
      if (this.platform != 'azure'){
        let index = this.findIndexOfObjectWithKey(this.formFields, 'label', 'PERIOD');
        if (this.service.deployment_targets === 'gcp_apigee') {
          switch (changedFilter.selected) {
            case 'Last 15 Minutes':{
              this.formFields[index].options =  ['1 Minute', '3 Hours', '1 Day'];
              this.formFields[index].values =  [
                  moment(0).add(1, 'minute').valueOf() / 1000,
                  moment(0).add(1, 'hour').valueOf() / 1000,
                  moment(0).add(1, 'day').valueOf() / 1000,];
              this.filters.changeFilter('1 Minute',this.formFields[index]);
              break;
            }
            case 'Last 1 Hour':{
              this.formFields[index].options =  ['1 Minute', '3 Hours', '1 Day'];
              this.formFields[index].values =  [
                  moment(0).add(1, 'minute').valueOf() / 1000,
                  moment(0).add(1, 'hour').valueOf() / 1000,
                  moment(0).add(1, 'day').valueOf() / 1000,];
              this.filters.changeFilter('1 Minute',this.formFields[index]);
              break;
            }
            case 'Last 24 Hours':{
              this.formFields[index].options =  ['1 Minutes', '3 Hours', '1 Day'];
              this.formFields[index].values =  [
                  moment(0).add(1, 'minute').valueOf() / 1000,
                  moment(0).add(1, 'hour').valueOf() / 1000,
                  moment(0).add(1, 'day').valueOf() / 1000,];
              this.filters.changeFilter('1 Minutes',this.formFields[index]);
              break;
            }
            case 'Last 7 Days':{
              this.formFields[index].options =  ['3 Hours', '1 Day', '7 Days'];
              this.formFields[index].values =  [
                  moment(0).add(3, 'hours').valueOf() / 1000,
                  moment(0).add(1, 'day').valueOf() / 1000,
                  moment(0).add(7, 'day').valueOf() / 1000,];
              this.filters.changeFilter('3 Hours',this.formFields[index]);
              break;
            }
            case 'Last 30 Days':{
              this.formFields[index].options =  ['1 Day', '7 Days', '30 Days'];
              this.formFields[index].values =  [
                  moment(0).add(1, 'day').valueOf() / 1000,
                  moment(0).add(7, 'day').valueOf() / 1000,
                  moment(0).add(30, 'day').valueOf() / 1000];
              this.filters.changeFilter('1 Day',this.formFields[index]);
              break;
            }
            case 'Last 3 Months':{
              this.formFields[index].options =  ['1 Day', '7 Days', '30 Days'];
              this.formFields[index].values =  [
                  moment(0).add(1, 'day').valueOf() / 1000,
                  moment(0).add(7, 'day').valueOf() / 1000,
                  moment(0).add(30, 'day').valueOf() / 1000];
              this.filters.changeFilter('7 Days',this.formFields[index]);
              break;
            }
            case 'Last 12 Months':{
              this.formFields[index].options =  ['1 Day', '7 Days', '30 Days'];
              this.formFields[index].values =  [
                  moment(0).add(1, 'day').valueOf() / 1000,
                  moment(0).add(7, 'day').valueOf() / 1000,
                  moment(0).add(30, 'day').valueOf() / 1000];
              this.filters.changeFilter('7 Days',this.formFields[index]);
              break;
            }
          }
        }
        else {
          switch (changedFilter.selected) {
            case 'Last 15 Minutes':{
              this.formFields[index].options =  ['1 Minute', '3 Hours', '1 Day'];
              this.formFields[index].values =  [
                  moment(0).add(1, 'minute').valueOf() / 1000,
                  moment(0).add(1, 'hour').valueOf() / 1000,
                  moment(0).add(1, 'day').valueOf() / 1000,];
              this.filters.changeFilter('1 Minute',this.formFields[index]);
              break;
            }
            case 'Last 1 Hour':{
              this.formFields[index].options =  ['1 Minute', '3 Hours', '1 Day'];
              this.formFields[index].values =  [
                  moment(0).add(1, 'minute').valueOf() / 1000,
                  moment(0).add(1, 'hour').valueOf() / 1000,
                  moment(0).add(1, 'day').valueOf() / 1000,];
              this.filters.changeFilter('1 Minute',this.formFields[index]);
              break;
            }
            case 'Last 24 Hours':{
              this.formFields[index].options =  ['1 Minutes', '3 Hours', '6 Hour', '1 Day'];
              this.formFields[index].values =  [
                  moment(0).add(1, 'minute').valueOf() / 1000,
                  moment(0).add(1, 'hour').valueOf() / 1000,
                  moment(0).add(6, 'hour').valueOf() / 1000,
                  moment(0).add(1, 'day').valueOf() / 1000,];
              this.filters.changeFilter('1 Minutes',this.formFields[index]);
              break;
            }
            case 'Last 7 Days':{
              this.formFields[index].options =  ['3 Hours', '1 Day',  '6 Hour', '7 Days'];
              this.formFields[index].values =  [
                  moment(0).add(1, 'hour').valueOf() / 1000,
                  moment(0).add(6, 'hour').valueOf() / 1000,
                  moment(0).add(1, 'day').valueOf() / 1000,
                  moment(0).add(7, 'day').valueOf() / 1000,];
              this.filters.changeFilter('3 Hours',this.formFields[index]);
              break;
            }
            case 'Last 30 Days':{
              this.formFields[index].options =  ['1 Day', '7 Days', '30 Days'];
              this.formFields[index].values =  [
                  moment(0).add(1, 'day').valueOf() / 1000,
                  moment(0).add(7, 'day').valueOf() / 1000,
                  moment(0).add(30, 'day').valueOf() / 1000];
              this.filters.changeFilter('1 Day',this.formFields[index]);
              break;

            }
            case 'Last 3 Months':{
              this.formFields[index].options =  ['1 Day', '7 Days', '30 Days'];
              this.formFields[index].values =  [
                  moment(0).add(1, 'day').valueOf() / 1000,
                  moment(0).add(7, 'day').valueOf() / 1000,
                  moment(0).add(30, 'day').valueOf() / 1000];
              this.filters.changeFilter('7 Days',this.formFields[index]);
              break;

            }
            case 'Last 12 Months':{
              this.formFields[index].options =  ['1 Day', '7 Days', '30 Days'];
              this.formFields[index].values =  [
                  moment(0).add(1, 'day').valueOf() / 1000,
                  moment(0).add(7, 'day').valueOf() / 1000,
                  moment(0).add(30, 'day').valueOf() / 1000];
              this.filters.changeFilter('7 Days',this.formFields[index]);
              break;
            }
          }
        }
      }
      if (changedFilter.label === 'ASSET TYPE') {
        this.assetSelected = changedFilter.selected.replace(/ /g, "_");
        if (this.assetNameFilterWhiteList.indexOf(this.assetSelected) > -1) {
        this.setAssetName(this.assetsNameArray,this.assetSelected);
        }
      }
      if (changedFilter.label === 'ASSET NAME') {
        let lambda = changedFilter.selected;
        this.slsLambdaselected = changedFilter.selected;
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
          if (this.assetNameFilterWhiteList.indexOf(this.assetSelected) > -1) {
            this.setAssetName(this.assetsNameArray,this.assetSelected);
            }
      }


    }

    if (changedFilter && (changedFilter.label === 'ASSET' ||
      changedFilter.label === 'METHOD' ||
      changedFilter.label === 'PATH' || changedFilter.label === 'ASSET NAME')) {
      this.setAsset();
    } else {
      return this.queryMetricsData();
    }

  }

  massageDateTime(){
    let endTimeValue;
    let startTime = this.filters.getFieldValueOfLabel('TIME RANGE').range;
    let endTime = moment().toISOString();
    let startTimeMins = startTime.split('.');
    startTimeMins = startTimeMins[0];
    let endTimeString = endTime.split('.');
    endTime = endTimeString[0];
    startTimeMins = new Date(startTimeMins).getMinutes();
    let endTimeMins = new Date(endTime).getMinutes();
    if((endTimeMins - startTimeMins) > 0){
      endTimeValue = endTime.split('T');
      endTimeValue = endTimeValue[0] + 'T';
      let startTimeMoment = startTime.split('T');
      endTimeValue = endTimeValue + startTimeMoment[1];
    } else {
      endTimeValue = moment().toISOString();
    }
    return endTimeValue;
  }

  queryMetricsData() {
    if (this.metricSubscription) {
      this.metricSubscription.unsubscribe();
    }
    this.sectionStatus = 'loading';
    let endDateTime = this.massageDateTime();

    // TODO: Leverage TypeScript interfaces for data contracts at minimum
    let request = {
      url: '/jazz/metrics',
      body: {
        domain: this.service.domain,
        service: this.service.name,
        environment: this.filters.getFieldValueOfLabel('ENVIRONMENT') || this.activatedRoute.snapshot.params['env'] || 'prod',
        start_time: this.filters.getFieldValueOfLabel('TIME RANGE').range,
        end_time: endDateTime,
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
        this.metricsLoaded = true;
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
    if (this.serviceType === 'api') {
      if(this.assetSelected === 'apigateway' || this.assetSelected === 'apigee_proxy') {
      let methods = _(this.queryDataRaw.assets)
        .map('asset_name.Method')
        .uniq().value();
      let paths = _(this.queryDataRaw.assets)
        .map('asset_name.Resource')
        .uniq().value();
      this.filters.removeField('Filter By:', 'ASSET NAME');
      const filterIndex = _.findIndex(this.filters.form.columns, {'label': "Filter By:"});
       if ( filterIndex > -1) {
          if(_.findIndex(this.filters.form.columns[filterIndex].fields, {'label': 'PATH'}) === -1) {
            this.filters.addField('Filter By:', 'PATH', paths);
          }
          if(_.findIndex(this.filters.form.columns[filterIndex].fields, {'label': 'METHOD'}) === -1) {
            this.filters.addField('Filter By:', 'METHOD', methods, null);
          }
        }
      } else if (this.assetSelected === 'lambda') {
        let functionName = _(this.queryDataRaw.assets)
        .map('asset_name.FunctionName')
        .uniq().value();
        const filterIndex = _.findIndex(this.filters.form.columns, {'label': "Filter By:"});
        if ( filterIndex > -1) {
          if(_.findIndex(this.filters.form.columns[filterIndex].fields, {'label': 'ASSET NAME'}) === -1) {
            this.filters.addField('Filter By:', 'ASSET NAME', functionName, null);
          }
        }
      }
    }
  }

  setAsset() {
    if(this.queryDataRaw){
      this.selectedAsset = this.queryDataRaw.assets[0];
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
    this.selectedMetricDisplayName = this.renameFieldService.getDisplayNameOfKey(this.selectedMetric.metric_name.toLowerCase()) || this.selectedMetric.metric_name;
    this.graphData = this.selectedMetric && this.formatGraphData(this.selectedMetric.datapoints);
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
        return obj;
      });

    let timeRange = this.filters.getFieldValueOfLabel('TIME RANGE');
    this.aggregation = this.filters.getFieldValueOfLabel('AGGREGATION') === 'Sum' ? 'Sum': 'Avg.';
    this.ylegend = this.selectedMetricDisplayName  + ' (' + this.aggregation + ')';
    let options = {
      tooltipXFormat: 'MMM DD YYYY, h:mm a',
      fromDateISO: timeRange.range,
      fromDateValue: moment(timeRange.range).valueOf(),
      toDateISO: moment().toISOString(),
      toDateValue: moment().valueOf(),
      xAxisFormat: timeRange.format,
      xAxisUnit: timeRange.unit,
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

  ngOnDestroy() {
    if (this.metricSubscription) {
      this.metricSubscription.unsubscribe();
    }
    if(this.assetSubscription) {
      this.assetSubscription.unsubscribe();
    }
  }

}
