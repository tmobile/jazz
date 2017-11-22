import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JazzToasterComponent } from './jazz-toaster.component';

describe('JazzToasterComponent', () => {
  let component: JazzToasterComponent;
  let fixture: ComponentFixture<JazzToasterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JazzToasterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JazzToasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
