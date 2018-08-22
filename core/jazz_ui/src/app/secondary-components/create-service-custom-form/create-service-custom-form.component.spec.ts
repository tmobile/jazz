import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateServiceCustomFormComponent } from './create-service-custom-form.component';

describe('CreateServiceCustomFormComponent', () => {
  let component: CreateServiceCustomFormComponent;
  let fixture: ComponentFixture<CreateServiceCustomFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateServiceCustomFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateServiceCustomFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
