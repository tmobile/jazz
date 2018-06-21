import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportIssueComponent } from './report-issue.component';

describe('ReportIssueComponent', () => {
  let component: ReportIssueComponent;
  let fixture: ComponentFixture<ReportIssueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReportIssueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportIssueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
