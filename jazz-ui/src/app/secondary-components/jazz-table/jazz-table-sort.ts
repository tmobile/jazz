export class Sort {
  objectList : Array<any>; 
  column : String;

  constructor (el: Array<any>){
      this.objectList = el;
  }

  sortByColumn(field: any, reverse: Boolean, primer: Function, inputList: Array<any>){

    if(inputList == undefined){
      inputList = this.objectList
    }
    
    return  inputList.sort((n1,n2) => {
        
        if (primer(n1[field]) > primer(n2[field])) {
            var val = 1;
            if(reverse) val = -1;
            return val;
        }

        if (primer(n1[field]) < primer(n2[field])) {
            var val2 = -1;
            if(reverse) val2 = 1;
            return val2;
        }
        return 0;
    }); 
    
  }
  
}