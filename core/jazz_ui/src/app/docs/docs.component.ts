import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild } from '@angular/core';


declare let Redoc: any


@Component({
  selector: 'app-docs',
  templateUrl: './docs.component.html',
  styleUrls: ['./docs.component.scss'],
})
export class DocsComponent implements AfterViewInit {
  @ViewChild('redoc') view: ElementRef;

  ngAfterViewInit() {
    Redoc.init('/assets/swagger.json', {
      menuToggle: true,
      nativeScrollbars: true,
      scrollYOffset: 54,
      hideLoading: true,
      suppressWarnings: true,
      noAutoAuth: true,
      theme: {
        colors: {
          error: {
            main: '#e20073',
          },
          primary: {
            main: '#585858'
          },
          http: {
            options: '#e10073',
          },
        },
        menu: {
          width: '360px',
          backgroundColor: '#f2f2f2',
        },
        typography: {
          fontFamily: 'Lato-Regular',
          headings: {
            fontFamily: 'Lato-Regular',
          },
        },
        rightPanel: {
          backgroundColor: '#49515b',
        },
      }
    }, this.view.nativeElement)
  }
}
