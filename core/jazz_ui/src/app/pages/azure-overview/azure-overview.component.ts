import { Component, OnInit, Input} from '@angular/core';
@Component({
    selector: 'azure-overview',
    templateUrl: './azure-overview.component.html',
    styleUrls: ['./azure-overview.component.scss']
  })
  export class AzureOverviewComponent implements OnInit { 
      constructor(){}
      @Input() service ;
      showGeneralField: boolean = false;
      editSecurity: boolean = true;
      editApproval: boolean = true;
      editPlatform: boolean = true;
      copylinkmsg = "COPY LINK TO CLIPBOARD";
      generalAdvanceDisable: boolean = false;
      secretList = [
          {value:'Identifier 1-WXER'},
          {value:'Identifier 2-ABCX'},
          {value:'Identifier 3-FGRT'},
          {value:'Identifier 4-JUIO'},
          {value:'Identifier 5-LOPR'}
      ]
      ngOnInit(){}
      onGeneralEditClick(){
          this.showGeneralField = true;
      }
      onGeneralCancelClick() {
          this.showGeneralField = false;
      }
      onEditSecurityClick() {
          this.editSecurity = false;
      }
      onCancelSecurityClick() {
        this.editSecurity = true;
      }
      onEditApprovalsClick() {
        this.editApproval = false;
    }
    onCancelApprovalsClick() {
      this.editApproval = true;
    }
    copyClipboard(copyapilinkid){
        var element = null; // Should be <textarea> or <input>
        this.secretList.map((item)=>{
        if(item.value === copyapilinkid){
            element = document.getElementById(item.value);
            element.select();
            try {
                document.execCommand("copy");
                this.copylinkmsg = "LINK COPIED";
            }
            finally {
               document.getSelection().removeAllRanges;
            }
        }
        })
      }

  }