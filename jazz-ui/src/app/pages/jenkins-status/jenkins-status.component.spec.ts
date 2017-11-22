import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JenkinsStatusComponent } from './jenkins-status.component';

describe('JenkinsStatusComponent', () => {
  let component: JenkinsStatusComponent;
  let fixture: ComponentFixture<JenkinsStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JenkinsStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JenkinsStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
