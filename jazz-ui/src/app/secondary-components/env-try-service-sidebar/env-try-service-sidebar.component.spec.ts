import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';

import {EnvTryServiceSidebarComponent} from './env-try-service-sidebar.component';
import {DropdownComponent} from "../../primary-components/dropdown/dropdown.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {BrowserModule, By} from "@angular/platform-browser";
import {DropdownModule} from "ng2-dropdown";
import {DebugElement} from "@angular/core";
import {SessionStorageService} from "../../core/helpers/session-storage.service";
import {RelaxedJsonService} from "../../core/helpers/relaxed-json.service";


describe('EnvTryServiceSidebarComponent', () => {
  let component: EnvTryServiceSidebarComponent;
  let fixture: ComponentFixture<EnvTryServiceSidebarComponent>;
  let startButton: DebugElement;
  let inputBox: DebugElement;
  let title: DebugElement;
  let checkbox: DebugElement;
  let sessionStorage: SessionStorageService;
  let relaxedJson: RelaxedJsonService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        EnvTryServiceSidebarComponent,
        DropdownComponent
      ],
      imports: [
        FormsModule,
        ReactiveFormsModule,
        BrowserModule,
        DropdownModule
      ],
      providers: [
        SessionStorageService,
        RelaxedJsonService,
      ]
    })
      .compileComponents();
  }));


  beforeEach(() => {
    fixture = TestBed.createComponent(EnvTryServiceSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    sessionStorage = fixture.debugElement.injector.get(SessionStorageService);
    relaxedJson = fixture.debugElement.injector.get(RelaxedJsonService);
    startButton = fixture.debugElement.query(By.css('button.btn-round.primary.start-button'));
    inputBox = fixture.debugElement.query(By.css('.input-textarea'));
    title = fixture.debugElement.query(By.css('.title'));
    checkbox = fixture.debugElement.query(By.css('input[type="checkbox"]'));

  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set input value', function () {
    spyOn(sessionStorage, 'getItem').and.returnValue('{"hello": "world"}');
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.inputValue).toContain('hello');
  });

  it('should show error if no inputValue', () => {
    component.inputIsValid();
    expect(component.validityMessage).toBe('Input is invalid JSON');
  });


  it('should remove saved payload with checkbox', () => {
    spyOn(sessionStorage, 'removeItem').and.returnValue(undefined);

    checkbox.nativeElement.click();
    fixture.detectChanges();

    expect(sessionStorage.removeItem).toHaveBeenCalledTimes(1);
  });

  fit('should call test and receive output', fakeAsync(() => {
    spyOn(component, 'stringToPrettyString').and.returnValue(JSON.stringify({status: 200}));
    component.inputValue = '{"hello": "world"}';
    startButton.nativeElement.click();
    tick();
    fixture.detectChanges();
    expect(component.outputValue).toContain(200);
  }));

  // it('should call test on test button click', () => {
  //   spyOn(component, 'startTest').and.returnValue(null);
  //   startButton.nativeElement.click();
  //   fixture.detectChanges();
  //   expect(component.startTest).toHaveBeenCalled();
  // });
  //
  // fit('should find button', () => {
  //   expect(startButton.nativeElement.innerHTML).toContain('TEST');
  // });
});
