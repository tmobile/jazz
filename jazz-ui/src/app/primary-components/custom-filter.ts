import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'myfilter',
    pure: false
})
export class MyFilterPipe implements PipeTransform {
    transform(items: any[], filter: any): any {
        if (!items || !filter) {
            return items;
        } else if(items[0].userId){
            return items.filter(item => item.givenName.indexOf(filter) !== -1 || item.userId.indexOf(filter) !== -1 );
        }

        // filter items array, items which match and return true will be kept, false will be filtered out
        return items.filter(item => item.givenName.indexOf(filter) !== -1 );
    }
}
