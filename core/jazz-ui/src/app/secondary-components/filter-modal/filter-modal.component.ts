import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'filter-modal',
  templateUrl: './filter-modal.component.html',
  styleUrls: ['./filter-modal.component.scss']
})
export class FilterModalComponent implements OnInit {
  public form = {
    columns: [
      {
        label: 'Filter by:',
        fields: [
          {
            label: 'Path',
            options: ['GET', 'POST'],
            type: 'select',
            selected: 'GET'
          },
          {
            label: 'Environment',
            options: ['prod', 'dev', 'stg'],
            selected: 'prod'
          }
        ]
      },
      {
        label: 'View by',
        fields: [
          {
            label: 'Time Range',
            type: 'select',
            options: ['1', '2'],
            selected: '1'
          }
        ]
      }
    ]
  }

  constructor() { }

  ngOnInit() {
  }

}
