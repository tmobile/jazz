import {Component, OnInit, ViewChild} from '@angular/core';
import {RequestService, DataCacheService, MessageService, AuthenticationService} from '../../core/services/index';
import {ToasterService} from 'angular2-toaster';
import {Router, ActivatedRoute} from '@angular/router';
import {EnvOverviewSectionComponent} from './../environment-overview/env-overview-section.component';
import {DataService} from "../data-service/data.service";
import {environment} from './../../../environments/environment';
import {environment as env_internal} from './../../../environments/environment.internal';
import {environment as env_oss} from './../../../environments/environment.oss';


import {EnvDeploymentsSectionComponent} from './../environment-deployment/env-deployments-section.component';


@Component({
  selector: 'environment-detail',
  templateUrl: './environment-detail.component.html',
  providers: [RequestService, MessageService, DataService],
  styleUrls: ['./environment-detail.component.scss']
})
export class EnvironmentDetailComponent implements OnInit {
  @ViewChild('envoverview') envoverview: EnvOverviewSectionComponent;
  @ViewChild('envdeployments') envdeployments: EnvDeploymentsSectionComponent;
  @ViewChild('selectedTabComponent') selectedTabComponent;

  isFunction: boolean = false;
  breadcrumbs = [];
  api_doc_name: string = '';
  selectedTab = 0;
  service: any = {};
  friendly_name: any;
  status_val: number;
  serviceId: any;
  envStatus: string;
  environment_obj: any;
  isLoadingService: boolean = true;
  status_inactive: boolean = false;
  swagger_error: boolean = false;

  tabData = ['overview', 'deployments', 'code quality', 'assets', 'logs'];
  envSelected: string = '';
  endpoint_env: string = '';
  environment = {
    name: 'Dev'
  }
  baseUrl: string = '';
  swaggerUrl: string = '';
  disablingWebsiteButton: boolean = true;
  disablingFunctionButton: boolean = true;
  disablingApiButton: boolean = true;
  nonClickable: boolean = false;
  message: string;
  public sidebar: string = '';
  private sub: any;
  private subscription: any;
  public assets;
  isENVavailable:boolean = false;

  constructor(
    private toasterService: ToasterService,
    private messageservice: MessageService,
    private route: ActivatedRoute,
    private http: RequestService,
    private cache: DataCacheService,
    private router: Router,
    private data: DataService
  ) {
  }

  refreshTab() {
    this.selectedTabComponent.refresh();
  }

  onSelectedDr(selected) {
    this.selectedTab = selected;
  }

  onTabSelected(i) {

    this.selectedTab = i;
  };

  EnvLoad(event) {
    this.environment_obj = event.environment[0];
    this.envStatus = this.environment_obj.status;
    this.envStatus = this.envStatus.replace("_"," ");
    this.isENVavailable = true;
    this.status_val = parseInt(status[this.environment_obj.status]);
    if ((this.status_val < 2) || (this.status_val == 4)) {
      this.disablingApiButton = false;
      this.disablingFunctionButton = false;
    }

    this.status_inactive = true;
  }

  env(event) {
    this.endpoint_env = event;
    if (this.endpoint_env != undefined) {
    }
  }

  frndload(event) {
    if (event != undefined) {
      this.friendly_name = event;
    }
    this.breadcrumbs = [{
      'name': this.service['name'],
      'link': 'services/' + this.service['id']
    },
      {
        'name': this.friendly_name,
        'link': ''
      }];
  }

  processService(service) {
    if (service === undefined) {
      return {};
    } else {
      return {
        id: service.id,
        name: service.service,
        serviceType: service.type,
        runtime: service.runtime,
        status: service.status,
        domain: service.domain,
        repository: service.repository
      }
    }
  };

  onDataFetched(service) {

    if (service !== undefined && service !== "") {
      this.service = this.processService(service);
      if (this.service.serviceType == "function") this.isFunction = true;
      if (this.friendly_name != undefined) {
      }
      this.breadcrumbs = [{
        'name': this.service['name'],
        'link': 'services/' + this.service['id']
      },
        {
          'name': this.friendly_name,
          'link': ''
        }]
      this.isLoadingService = false;
    } else {
      this.isLoadingService = false;
      let errorMessage = this.messageservice.successMessage(service, "serviceDetail");
      this.toast_pop('error', 'Error', errorMessage)
    }
  }

  tabChanged(i) {
    this.selectedTab = i;
  };


  fetchService(id: string) {
    this.isLoadingService = true;
    this.subscription = this.http.get('/jazz/services/' + id).subscribe(
      response => {
        this.service.accounts = env_internal.urls.accounts;
        this.service.regions = env_internal.urls.regions;
        this.service = response.data.data;
        if (environment.envName == 'oss') this.service = response.data;
        this.isFunction = this.service.type === "function";
        this.getAssets();
        this.setTabs();
        this.cache.set(id, this.service);
        this.onDataFetched(this.service);
        this.envoverview.notify(this.service);
      },
      err => {
        this.isLoadingService = false;
        let errorMessage = this.messageservice.errorMessage(err, "serviceDetail");
        this.toast_pop('error', 'Oops!', errorMessage)

      }
    )
  };

  setTabs() {
    if (this.service.serviceType === 'api' || this.service.type === 'api') {
      this.tabData = ['overview', 'deployments', 'assets', 'metrics', 'code quality', 'logs'];
    } else if (this.service.serviceType === 'function' || this.service.type === 'function') {
      this.tabData = ['overview', 'deployments', 'assets', 'metrics', 'code quality', 'logs'];
    } else if (this.service.serviceType === 'website' || this.service.type === 'website') {
      this.tabData = ['overview', 'deployments', 'assets', 'metrics'];
    }
  }

  getAssets() {
    this.http.get('/jazz/assets', {
      service: this.service.service || this.service.name,
      domain: this.service.domain,
      environment: this.envSelected,
      limit: undefined
    }).subscribe((assetsResponse) => {
      this.assets = assetsResponse.data.assets;
      this.service.assets = this.assets;
    }, (err) => {
      this.toast_pop('error', 'Oops!', 'Failed to load Assets.');
    });
  }

  testService(type){
      switch(type){
          case 'api':
            let foundAsset = this.assets.find((asset) => {
              return asset.asset_type === 'swagger_url';
            });
            if (foundAsset) {
              return window.open(environment.urls['swagger_editor'] + foundAsset.provider_id);
            } else {
              return window.open('/404');
            }
          case 'website' :
            if(this.endpoint_env){
              window.open(this.endpoint_env);
            }
          break;
          case 'function' :
          case 'lambda' :
            this.setSidebar('try-service');
          break;
      }
  }

  setSidebar(sidebar) {
    this.sidebar = sidebar;
  }

  toast_pop(error, oops, errorMessage) {
    var tst = document.getElementById('toast-container');
    tst.classList.add('toaster-anim');
    this.toasterService.pop(error, oops, errorMessage);
    setTimeout(() => {
      tst.classList.remove('toaster-anim');
    }, 3000);
  }

  ngOnInit() {
    this.api_doc_name = env_oss.api_doc_name;
    this.sub = this.route.params.subscribe(params => {
      let id = params['id'];
      this.serviceId = id;
      this.envSelected = params['env'];
      this.fetchService(id);
      this.friendly_name = this.envSelected;

    });
    this.breadcrumbs = [
      {
        'name': this.service['name'],
        'link': 'services/' + this.service['id']
      },
      {
        'name': this.friendly_name,
        'link': ''
      }
    ];
  }

  ngOnChanges(x: any) {
    this.fetchService(this.serviceId);
  }
}

export enum status {
  "deployment_completed" = 0,
  "active",
  "deployment_started",
  "pending_approval",
  "deployment_failed",
  "inactive",
  "deletion_started",
  "deletion_failed",
  "archived"
}
