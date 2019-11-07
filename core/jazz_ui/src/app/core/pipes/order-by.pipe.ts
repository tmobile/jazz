import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'orderBy' })
export class OrderByPipe implements PipeTransform {
  transform(records: Array<any>, args?: any): any {
    if (records && records.length) {
      if (!args.childProperty) {
        return records.sort(function(a, b) {
          try {
            if (isNaN(a[args.property]) || isNaN(b[args.property])) {
              if (
                a[args.property].toLowerCase().trim() < b[args.property].toLowerCase().trim()
              ) {
                return -1 * args.direction;
              } else if (
                a[args.property].toLowerCase().trim() > b[args.property].toLowerCase().trim()
              ) {
                return 1 * args.direction;
              } else {
                return 0;
              }
            } else {
              if (a[args.property] < b[args.property]) {
                return -1 * args.direction;
              } else if (a[args.property] > b[args.property]) {
                return 1 * args.direction;
              } else {
                return 0;
              }
            }
          } catch (e) {
            return 0;
          }
        });
      } else if (args.childProperty && args.property) {
        return records.sort(function(a, b) {
          try {
            if (
              isNaN(a[args.property][args.childProperty]) ||
              isNaN(b[args.property][args.childProperty])
            ) {
              if (
                a[args.property][args.childProperty].toLowerCase().trim() <
                b[args.property][args.childProperty].toLowerCase().trim()
              ) {
                return -1 * args.direction;
              } else if (
                a[args.property][args.childProperty].toLowerCase().trim() >
                b[args.property][args.childProperty].toLowerCase().trim()
              ) {
                return 1 * args.direction;
              } else {
                return 0;
              }
            } else {
              if (
                a[args.property][args.childProperty] <
                b[args.property][args.childProperty]
              ) {
                return -1 * args.direction;
              } else if (
                a[args.property][args.childProperty] >
                b[args.property][args.childProperty]
              ) {
                return 1 * args.direction;
              } else {
                return 0;
              }
            }
          } catch (error) {
            return 0;
          }
        });
      } else {
        return records.sort(function(a, b) {
          return 0;
        });
      }
    }
  }
}
