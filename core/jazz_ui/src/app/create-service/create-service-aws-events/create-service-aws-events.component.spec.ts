import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateServiceAwsEventsComponent } from './create-service-aws-events.component';

describe('CreateServiceAwsEventsComponent', () => {
  let component: CreateServiceAwsEventsComponent;
  let fixture: ComponentFixture<CreateServiceAwsEventsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateServiceAwsEventsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateServiceAwsEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
