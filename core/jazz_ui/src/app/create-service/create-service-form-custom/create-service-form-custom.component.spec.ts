import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateServiceFormCustomComponent } from './create-service-form-custom.component';

describe('CreateServiceFormCustomComponent', () => {
  let component: CreateServiceFormCustomComponent;
  let fixture: ComponentFixture<CreateServiceFormCustomComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateServiceFormCustomComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateServiceFormCustomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
