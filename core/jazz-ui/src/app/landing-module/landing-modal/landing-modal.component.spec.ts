import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingModalComponent } from './landing-modal.component';

describe('LandingModalComponent', () => {
  let component: LandingModalComponent;
  let fixture: ComponentFixture<LandingModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LandingModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LandingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
