import { SortDirection } from './sort-direction';
/**
 * To modify the labels and text displayed, create a new instance of MdSortHeaderIntl and
 * include it in a custom provider.
 */
export declare class MdSortHeaderIntl {
    sortButtonLabel: (id: string) => string;
    /** A label to describe the current sort (visible only to screenreaders). */
    sortDescriptionLabel: (id: string, direction: SortDirection) => string;
}
