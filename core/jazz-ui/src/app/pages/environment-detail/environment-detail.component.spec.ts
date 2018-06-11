import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnvironmentDetailComponent } from './environment-detail.component';

describe('EnvironmentDetailComponent', () => {
  let component: EnvironmentDetailComponent;
  let fixture: ComponentFixture<EnvironmentDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EnvironmentDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnvironmentDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
