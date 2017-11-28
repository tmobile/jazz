import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'myfilter',
    pure: false
})
export class MyFilterPipe implements PipeTransform {
    transform(items: any[], filter: any): any {
        if (!items || !filter || filter.length < 3) {
            if(items !== undefined )
                return items.slice(0,50);//limiting number of rows in items for performance
            else
                return items;
        } else if(items[0].displayName){
            return items.filter(item => item.givenName.toLowerCase().indexOf(filter.toLowerCase()) !== -1 || item.userId.toLowerCase().indexOf(filter.toLowerCase()) !== -1 || item.displayName.toLowerCase().indexOf(filter.toLowerCase()) !== -1 );            
        }

        // filter items array, items which match and return true will be kept, false will be filtered out
        return items.filter(item => item.givenName.indexOf(filter) !== -1 );
        
    }
}
