import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileSecondaryTabComponent } from './mobile-secondary-tab.component';

describe('MobileSecondaryTabComponent', () => {
  let component: MobileSecondaryTabComponent;
  let fixture: ComponentFixture<MobileSecondaryTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MobileSecondaryTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MobileSecondaryTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
