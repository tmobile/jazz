import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JazzMobHeaderComponent } from './jazz-mob-header.component';

describe('JazzMobHeaderComponent', () => {
  let component: JazzMobHeaderComponent;
  let fixture: ComponentFixture<JazzMobHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JazzMobHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JazzMobHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
