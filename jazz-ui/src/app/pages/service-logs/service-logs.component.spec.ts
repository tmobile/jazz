import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceLogsComponent } from './service-logs.component';

describe('ServiceLogsComponent', () => {
  let component: ServiceLogsComponent;
  let fixture: ComponentFixture<ServiceLogsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServiceLogsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
