import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceMetricsComponent } from './service-metrics.component';

describe('ServiceMetricsComponent', () => {
  let component: ServiceMetricsComponent;
  let fixture: ComponentFixture<ServiceMetricsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServiceMetricsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
