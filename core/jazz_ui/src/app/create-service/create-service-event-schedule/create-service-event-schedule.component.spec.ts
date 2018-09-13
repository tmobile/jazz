import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateServiceEventScheduleComponent } from './create-service-event-schedule.component';

describe('CreateServiceEventScheduleComponent', () => {
  let component: CreateServiceEventScheduleComponent;
  let fixture: ComponentFixture<CreateServiceEventScheduleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateServiceEventScheduleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateServiceEventScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
