import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterMetricsComponent } from './filter-metrics.component';

describe('FilterMetricsComponent', () => {
  let component: FilterMetricsComponent;
  let fixture: ComponentFixture<FilterMetricsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FilterMetricsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
