import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceCostComponent } from './service-cost.component';

describe('ServiceCostComponent', () => {
  let component: ServiceCostComponent;
  let fixture: ComponentFixture<ServiceCostComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServiceCostComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceCostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
