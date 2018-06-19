import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserJourneyComponent } from './user-journey.component';

describe('UserJourneyComponent', () => {
  let component: UserJourneyComponent;
  let fixture: ComponentFixture<UserJourneyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserJourneyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserJourneyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
