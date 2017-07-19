import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TmobileMobHeaderComponent } from './tmobile-mob-header.component';

describe('TmobileMobHeaderComponent', () => {
  let component: TmobileMobHeaderComponent;
  let fixture: ComponentFixture<TmobileMobHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TmobileMobHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TmobileMobHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
