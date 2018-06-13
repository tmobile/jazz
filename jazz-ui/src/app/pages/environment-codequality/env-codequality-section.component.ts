import { Component, OnInit, ElementRef, Inject, Input } from '@angular/core';
import { DayData, WeekData, MonthData, Month6Data, YearData } from './../service-metrics/data';
import { AfterViewInit, ViewChild } from '@angular/core';
import { ToasterService } from 'angular2-toaster';
import { RequestService, MessageService } from '../../core/services/index';
import { DataCacheService, AuthenticationService } from '../../core/services/index';
import { Router, ActivatedRoute } from '@angular/router';
import { IonRangeSliderModule } from "ng2-ion-range-slider";
import { setTimeout } from 'timers';
import { DataService } from "../data-service/data.service";
import { environment } from './../../../environments/environment.internal';
import { environment as env_internal } from './../../../environments/environment.internal';




@Component({
  selector: 'env-codequality-section',
  templateUrl: './env-codequality-section.component.html',
  styleUrls: ['./env-codequality-section.component.scss'],
  providers: [RequestService, MessageService,DataService],
})
export class EnvCodequalitySectionComponent implements OnInit {
  @Input() service: any = {};
  message:string;
  edit: boolean = true;
  save: boolean = false;
  minCards: boolean = false;
  maxCards: boolean = false;
  filteron: boolean = false;
  filterdone: boolean = true;
  errorTime: any;
  errorURL: any;
  errorAPI: any;
  errorRequest: any = {};
  errorResponse: any = {};
  errorUser: any;
  env: any;
  cqList: any = [];
  xAxis: "";
  yAxis: "";
  cardIndex: any;
  filtertext: any = "past 6 months";
  cardindex: number = 0;
  link: any = [];
  sonar: any;
  selectedTimeRange: string = "Month";
  payload: any = {};
  graphArray: any = [];
  value: any = [];
  date: any = [];
  data: any = [];
  x: any;
  noData: boolean = false;
  notemptydata: boolean = true;
  emptydata: boolean = false;
  yesdata: boolean = false;
  isError: boolean = false;
  graphDataAvailable: boolean = false;
  isGraphLoading: boolean = true;
  safeTransformX = 0;
  graphname: any;
  sonarlink: any;
  metricsIndex: any;
  startDate = "";
  endDate = (new Date()).toISOString();
  graphInput: Array<any>;
  filtersList = ['DAILY', 'WEEKLY', 'MONTHLY'];
  name: any = [];
  selected = ['MONTHLY'];
  errBody: any;
  parsedErrBody: any;
  errMessage: any;
  errorChecked: boolean = true;
  errorInclude: any = "";
  json: any = {};
  private toastmessage: any;

  constructor(
    private toasterService: ToasterService,
    private messageservice: MessageService,
    private route: ActivatedRoute,
    private http: RequestService,
    private cache: DataCacheService,
    private router: Router,
    private authenticationservice: AuthenticationService,
    private dataS: DataService
  ) { }


  public lineChartData: Array<any> = [
    { data: [0, 0, 0, 20, 0], label: 'Major', lineTension: 0 },
    { data: [0, 10, 10, 10, 0], label: 'Unresolved', lineTension: 0 },
    { data: [20, 20, 10, 20, 20], label: 'Fixed', lineTension: 0 }

  ];


  public lineChartLabels: Array<any> = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
  public lineChartOptions: any = {
    legend: { position: 'bottom' },
    scales: {
      yAxes: [{
        ticks: {
          // steps : 2,
          // stepValue : 10,
          // max : 20,
          // min : 0
        }
      }]
    },
    responsive: false
  };


  public lineChartLegend: boolean = true;
  public lineChartType: string = 'line';

  editChanges() {
    this.edit = false;
    this.save = true;
  }
  saveChanges() {
    this.edit = true;
    this.save = false;
  }

  onFilterSelected(event) {
    this.filterdone = false;
    this.filteron = true;
    if (event[0] == "DAILY") {
      this.filtertext = "past 7 days";
      this.selectedTimeRange = "Day";
      this.selected = ['DAILY'];
      var date = new Date();
      date.setDate(date.getDate() - 7);
      var dateString = date.toISOString();
      this.startDate = dateString;
      this.displayGraph();

    } else if (event[0] == "WEEKLY") {
      this.filtertext = "past 4 weeks";
      this.selectedTimeRange = "Week";
      this.selected = ['WEEKLY'];
      var date = new Date();
      date.setDate(date.getDate() - 30);
      var dateString = date.toISOString();
      this.startDate = dateString;
      this.displayGraph();
    } else {
      this.filtertext = "data for past 6 months";
      this.selectedTimeRange = "Month";
      this.selected = ['MONTHLY'];
      var date = new Date();
      date.setDate(date.getDate() - 180);
      var dateString = date.toISOString();
      this.startDate = dateString;
      this.displayGraph();
    }
  }

  displayGraph() {

    this.http.get('/jazz/codeq?domain='+this.service.domain+'&service='+this.service.name+'&environment=' + this.env + '&from=' + this.startDate + '&to=' + this.endDate + '&').subscribe(
      response => {
        var res = response;
        if (res.data == undefined || res.data == null || res.data.length == 0) {
          this.emptydata = true;
          this.notemptydata = false;
          this.isGraphLoading = false;
          this.graphDataAvailable = false;
        } else {
          this.cqList = res.data.metrics;
          for (var i = 0; i < this.cqList.length; i++) {

            this.graphInput = this.cqList[this.cardindex];
            this.graphname = this.name[this.cardindex];

            this.cqList[i].xAxis = {
              "label": "TIME",
              "range": "day"
            };
            this.cqList[i].yAxis = {
              "label": "ISSUES",
              "range": "day"
            };
            this.cqList[i].data = this.cqList[i].values;
            this.graphArray[i] = this.cqList[i].data;
            if (this.graphArray[i].length != 0) {
              this.value[i] = this.graphArray[i][Math.floor((this.graphArray[i].length) - 1)].value;
              if (this.value[i] >= 1000) {
                this.value[i] = (this.value[i] / 1000).toFixed(1) + "K";
              } if (this.value[i] >= 1000000) {
                this.value[i] = (this.value[i] / 1000000).toFixed(1) + "M";
              } if (this.value[i] >= 1000000000) {
                this.value[i] = (this.value[i] / 1000000000).toFixed(1) + "B";
              }
              this.date[i] = this.graphArray[i][Math.floor((this.graphArray[i].length) - 1)].ts.slice(0, -14).split("-").reverse().join("-");
            } else {
              this.value[i] = "";
              this.date[i] = "OOPS! doesn't look like there is any data available here.";
              this.graphInput = this.cqList[this.cardindex];
              this.graphname = this.name[this.cardindex];
            }
            this.name[i] = this.cqList[i].name.replace("-", " ").replace("-", " ");
            this.link[i] = this.cqList[i].link;
            this.sonar = this.link[0];
            for (var j = 0; j < this.graphArray[i].length; j++) {
              this.graphArray[i][j].date = new Date(this.graphArray[i][j].ts);
            }
          }

          if (this.cqList.length != 0) {
            this.isGraphLoading = false;
            this.graphDataAvailable = true;
            this.yesdata = true;
            this.noData = false;
          } else {
            this.graphDataAvailable = true;
            this.noData = true;
            this.isGraphLoading = false;
            this.yesdata = false;
          }


        }
        this.filteron = false;
        this.filterdone = true;
        if (this.graphInput.values.length != 0) {
          this.graphDataAvailable = true;
          this.noData = false;
          this.yesdata = true;
        } else {
          this.graphDataAvailable = true;
          this.noData = true;
          this.yesdata = false;
        }
        setTimeout(() => {
          this.checkcarausal();
        }, 1000)

      },
      error => {
        this.graphDataAvailable = false;
        this.isGraphLoading = false;
        this.isError = true;
        this.payload = {
          "domain": this.service.domain,
          "service": this.service.name,
          "environment": this.env,
          "from": this.startDate,
          "to": this.endDate
        }
        this.getTime();
        this.errorURL = window.location.href;
        this.errorAPI = environment.baseurl+"/jazz/codeq";
        this.errorRequest = this.payload;
        this.errorUser = this.authenticationservice.getUserId();
        this.errorResponse = JSON.parse(error._body);


      })
  };

  getTime() {
    var now = new Date();
    this.errorTime = ((now.getMonth() + 1) + '/' + (now.getDate()) + '/' + now.getFullYear() + " " + now.getHours() + ':'
      + ((now.getMinutes() < 10) ? ("0" + now.getMinutes()) : (now.getMinutes())) + ':' + ((now.getSeconds() < 10) ? ("0" + now.getSeconds()) : (now.getSeconds())));
  }

  feedbackRes: boolean = false;
  openModal: boolean = false;
  feedbackMsg: string = '';
  feedbackResSuccess: boolean = false;
  feedbackResErr: boolean = false;
  isFeedback: boolean = false;
  toast: any;
  model: any = {
    userFeedback: ''
  };
  buttonText: string = 'SUBMIT';
  isLoading: boolean = false;
  sjson: any = {};
  djson: any = {};
  reportIssue() {

    this.json = {
      "user_reported_issue": this.model.userFeedback,
      "API": this.errorAPI,
      "REQUEST": this.errorRequest,
      "RESPONSE": this.errorResponse,
      "URL": this.errorURL,
      "TIME OF ERROR": this.errorTime,
      "LOGGED IN USER": this.errorUser
    }

    this.openModal = true;
    this.errorChecked = true;
    this.isLoading = false;
    this.errorInclude = JSON.stringify(this.djson);
    this.sjson = JSON.stringify(this.json);
  }

  openFeedbackForm() {
    this.isFeedback = true;
    this.model.userFeedback = '';
    this.feedbackRes = false;
    this.feedbackResSuccess = false;
    this.feedbackResErr = false;
    this.isLoading = false;
    this.buttonText = 'SUBMIT';
  }
  reportEmail:string;
  mailTo() {
    location.href = 'mailto:'+this.reportEmail+'?subject=Jazz : Issue reported by' + " " + this.authenticationservice.getUserId() + '&body=' + this.sjson;
  }
  errorIncluded() {
  }

  submitFeedback(action) {

    this.errorChecked = (<HTMLInputElement>document.getElementById("checkbox-slack")).checked;
    if (this.errorChecked == true) {
      this.json = {
        "user_reported_issue": this.model.userFeedback,
        "API": this.errorAPI,
        "REQUEST": this.errorRequest,
        "RESPONSE": this.errorResponse,
        "URL": this.errorURL,
        "TIME OF ERROR": this.errorTime,
        "LOGGED IN USER": this.errorUser
      }
    } else {
      this.json = this.model.userFeedback;
    }
    this.sjson = JSON.stringify(this.json);

    this.isLoading = true;

    if (action == 'DONE') {
      this.openModal = false;
      return;
    }

    var payload = {
      "title": "Jazz: Issue reported by " + this.authenticationservice.getUserId(),
      "project_id": env_internal.urls.internal_acronym,
      "priority": "P4",
      "description": this.json,
      "created_by": this.authenticationservice.getUserId(),
      "issue_type": "bug"
    }
    this.http.post('/jazz/jira-issues', payload).subscribe(
      response => {
        this.buttonText = 'DONE';
        this.isLoading = false;
        this.model.userFeedback = '';
        var respData = response.data;
        this.feedbackRes = true;
        this.feedbackResSuccess = true;
        if (respData != undefined && respData != null && respData != "") {
          this.feedbackMsg = "Thanks for reporting the issue. We’ll use your input to improve Jazz experience for everyone!";
        }
      },
      error => {
        this.buttonText = 'DONE';
        this.isLoading = false;
        this.feedbackResErr = true;
        this.feedbackRes = true;
        this.feedbackMsg = this.toastmessage.errorMessage(error, 'jiraTicket');
      }
    );
  }
  selectedMetrics(index, gname, link) {
    this.cardindex = index;
    this.graphname = gname;
    this.sonar = link;
    var ele = document.getElementsByClassName('metrics-card');
    for (var i = 0; i < ele.length; i++) {
      ele[i].classList.remove('arrow_box');
      ele[i].classList.remove('active');
    }
    ele[this.cardindex].className += ' arrow_box';
    ele[this.cardindex].className += ' active';
    this.graphInput = this.cqList[this.cardindex];
    if (this.graphInput.values.length != 0) {
      this.graphDataAvailable = true;
      this.noData = false;
      this.yesdata = true;
    } else {
      this.graphDataAvailable = true;
      this.noData = true;
      this.yesdata = false;
    }
    this.onFilterSelected(event);
  }

  sonarProjectLink(url) {
    window.open(url, '_blank');
  }

  onResize(event) {
    this.checkcarausal();
  }


  ngOnInit() {

    this.isGraphLoading = true;
    this.cache.set("codequality", true);
    this.route.params.subscribe(
      params => {
        this.env = params.env;
      });
    if (this.env == 'prd') {
      this.env = 'prod';
    }

    var date = new Date();
    date.setDate(date.getDate() - 180);
    var dateString = date.toISOString();
    this.startDate = dateString;

    this.displayGraph();
    this.dataS.currentMessage.subscribe(message => this.message = message)
    this.newMessage();
  }

    newMessage() {
      this.dataS.changeMessage("fo")

  }

  public goToAbout(hash) {

    this.router.navigateByUrl('landing');
    this.cache.set('scroll_flag', true);
    this.cache.set('scroll_id', hash);
  }

  refreshCostData(event) {
    this.isGraphLoading = true;
    this.displayGraph();
  }

  checkcarausal() {

    var mainEle = document.getElementsByClassName('scroll-cards-wrap')[0].clientWidth;

    var limit = document.getElementsByClassName('metrics-cards-wrap')[0].clientWidth;

    if (mainEle > limit) {
      this.maxCards = true;
    } else {
      this.maxCards = false;
      this.minCards = false;
    }
  }

  leftArrowClick() {
    var mainEle = document.getElementsByClassName('scroll-cards-wrap');
    var innerWidth = (mainEle[0].clientWidth + 12) / this.cqList.length;
    this.maxCards = true;
    if (this.safeTransformX < 0) {
      this.minCards = true;
      this.safeTransformX = this.safeTransformX + innerWidth;
      if (this.safeTransformX >= 0) {
        this.minCards = false;
      }
    }
  }

  rightArrowClick() {
    var mainEle = document.getElementsByClassName('scroll-cards-wrap');
    var limit = document.getElementsByClassName('metrics-cards-wrap')[0].clientWidth;
    var innerWidth = (mainEle[0].clientWidth) / this.cqList.length;
    this.minCards = true;
    if (this.safeTransformX > (-mainEle[0].clientWidth + limit)) {
      this.maxCards = true;
      this.safeTransformX = this.safeTransformX - innerWidth;
      if (this.safeTransformX <= (-mainEle[0].clientWidth + limit)) {
        this.maxCards = false;
      }
    }
  }
}
