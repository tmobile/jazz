/** 
  * @type Component 
  * @desc recent activity component
  * @author
*/

import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'side-tile-fixed',
  templateUrl: './side-tile-fixed.component.html',
  styleUrls: ['./side-tile-fixed.component.scss']
})
export class SideTileFixedComponent implements OnInit {

  @Input() inputData;

  @Input() actState;

  constructor() { }

  ngOnInit() {
  }

}
