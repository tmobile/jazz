export class Filter {
  objectList : Array<any>; 
  filteredList : Array<any>;
 results:Array<any>;
 value: String;
  constructor (el: Array<any>){
      this.objectList = el;
      this.results = [];
  }

  getObjectList(){
    return this.objectList;
  }

  filterFunction(field: any, filterString:String, inputList: Array<any>){
    if (inputList == undefined) {
      inputList = this.objectList;
    }
     //for field date write separate function
     this.filteredList = inputList.filter(item => item[field].indexOf(filterString) !== -1);
      return this.filteredList;
  }
  filterListFunction(field: any, filterStringList:Array<string>, inputList: Array<any>){
    if (inputList == undefined) {
      inputList = this.objectList;
    }
    if (filterStringList.length == 0) {
      return inputList;
    }
    this.filteredList = inputList.filter(item => 
      {
        for (var i = 0; i < filterStringList.length; i++) {
          var filterString = filterStringList[i];
          if (item[field].indexOf(filterString) !== -1) {
            return true;
          };
        }
        return false;
      }
    );
    return this.filteredList;
  }
  searchFunction(field: any, searchString:string, inputList: Array<any>){
    if (inputList == undefined) {
      inputList = this.objectList
    }

    searchString = searchString.toLowerCase();
    this.results = [];
    for (var obj in inputList)
    {  
       if(inputList[obj][field]){
           this.value = String(inputList[obj][field]);
           if(this.value.toLowerCase().indexOf(searchString)  !== -1)
           {
               this.results.push(inputList[obj]);
              
           }
       } else {
           for(var key in inputList[obj]){
            this.value = String(inputList[obj][key]);
            
            if(this.value.toLowerCase().indexOf(searchString)  !== -1)
            {
                this.results.push(inputList[obj]); 
                break;
            }
        }
       }
    }
   return this.results;
      
    
  }
  
}