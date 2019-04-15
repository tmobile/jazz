import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AuthenticationService, MessageService} from '../../core/services';
import {Http} from '@angular/http';

@Component({
  selector: 'report-issue',
  templateUrl: './report-issue.component.html',
  styleUrls: ['./report-issue.component.scss']
})
export class ReportIssueComponent implements OnInit {
  @Input() request;
  @Input() response;
  @Input() displayMassage = "Something went wrong while fetching your data";

  @Output() onRefresh = new EventEmitter();

  public feedbackModalIn = false;
  public feedbackModalStatus = 'ready';
  public reportIssueForm: any;
  public errorMessage;
  public jsonDataString;
  public submitFeedbackPayload;

  constructor(
    private authenticationService: AuthenticationService,
    private messageService: MessageService,
    private http: Http) {
  }

  ngOnInit() {
    if (this.response) {
      this.displayMassage =  this.displayMassage || JSON.parse(this.response._body).message;
    }
    const userId = this.authenticationService.getUserId();
    this.reportIssueForm = {
      userFeedback: '',
      includeError: true,
    };
    this.feedbackModalStatus = 'ready';
    const errorData =
      this.submitFeedbackPayload = {
        'title': 'Jazz: Issue reported by ' + userId,
        'project_id': 'CAPI',
        'priority': 'P4',
        'description': null,
        'created_by': userId,
        'issue_type': 'bug'
      };
    this.jsonDataString = JSON.stringify(errorData);
  }

  submitFeedback(action) {
    this.feedbackModalStatus = 'loading';
    this.submitFeedbackPayload.description = this.getErrorData();
    this.http.post('/platform/jira-issues', this.submitFeedbackPayload).subscribe(
      response => {
        this.feedbackModalStatus = 'resolved';
      },
      error => {
        this.feedbackModalStatus = 'error';
        this.errorMessage = this.messageService.errorMessage(error, 'jiraTicket');
      }
    );
  }

  getErrorData() {
    const userId = this.authenticationService.getUserId();
    if (this.reportIssueForm.includeError) {
      return {
        'user_reported_issue': this.reportIssueForm.userFeedback,
        'API': this.request.url,
        'REQUEST': this.request,
        'RESPONSE': this.response,
        'URL': window.location.href,
        'TIME OF ERROR': (new Date()).toISOString(),
        'LOGGED IN USER': userId
      };
    } else {
      return {
        'user_reported_issue': this.reportIssueForm.userFeedback
      };
    }
  }

  refreshParent() {
    this.onRefresh.emit();
  }

  mailFeedbackForm() {
    window.location.href = 'mailto:serverless@t-mobile.com?subject=Jazz : Issue reported by' + ' ' +
      this.authenticationService.getUserId() + '&body=' + JSON.stringify(this.getErrorData());
  }

  closeFeedbackModal() {
    this.feedbackModalIn = false;
    this.ngOnInit();
  }
}
