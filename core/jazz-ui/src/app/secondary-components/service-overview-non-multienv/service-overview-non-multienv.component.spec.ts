import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceOverviewNonMultienvComponent } from './service-overview-non-multienv.component';

describe('ServiceOverviewNonMultienvComponent', () => {
  let component: ServiceOverviewNonMultienvComponent;
  let fixture: ComponentFixture<ServiceOverviewNonMultienvComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServiceOverviewNonMultienvComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceOverviewNonMultienvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
