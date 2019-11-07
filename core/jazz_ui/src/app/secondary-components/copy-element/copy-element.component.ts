import { Component, OnInit, Input } from '@angular/core';


@Component({
  selector: 'app-copy-element',
  templateUrl: './copy-element.component.html',
  styleUrls: ['./copy-element.component.scss']
})
 
export class CopyElementComponent {

  @Input() CopyElement;
  @Input() iconSize;
  copyLink = 'Copy text to Clipboard';
  displayPopup = false;
  CopyTextToClipboard(text, event) {
    this.displayPopup = true;
    event.stopPropagation();
    var textArea = document.createElement("textarea");
    textArea.style.position = 'fixed';
    textArea.style.left = '0';
    textArea.style.top = '0';
    textArea.style.opacity = '0';
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
  
    try {
      if (text !== '' && text !== undefined ) {
          var successful = document.execCommand('copy');
          var msg = successful ? 'successful' : 'unsuccessful';
          if(msg === 'successful') {
            this.copyLink = 'Copied text to Clipboard';
          } else {
            this.copyLink = 'Text Copying failed';
          }
      } else {
        this.copyLink = 'No Data Available';
      }
     
    } catch (err) {
      this.copyLink = 'Copying failed! Please try later.'
    }
    setTimeout(()=> {
      this.displayPopup = false;
      this.copyLink = 'Copy text to Clipboard';
    }, 3000);
  
    document.body.removeChild(textArea);
  }
  
}
