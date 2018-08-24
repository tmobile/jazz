import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceOverviewMultienvComponent } from './service-overview-multienv.component';

describe('ServiceOverviewMultienvComponent', () => {
  let component: ServiceOverviewMultienvComponent;
  let fixture: ComponentFixture<ServiceOverviewMultienvComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServiceOverviewMultienvComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceOverviewMultienvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
