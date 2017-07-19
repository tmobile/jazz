import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceAccessControlComponent } from './service-access-control.component';

describe('ServiceAccessControlComponent', () => {
  let component: ServiceAccessControlComponent;
  let fixture: ComponentFixture<ServiceAccessControlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServiceAccessControlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceAccessControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
