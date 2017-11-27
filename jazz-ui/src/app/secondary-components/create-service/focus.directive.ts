import { Directive, ElementRef, Renderer, Input } from '@angular/core';

@Directive({
    selector: '[focus]'
})
export class FocusDirective
{
    private _focus;
    constructor(private el: ElementRef, private renderer: Renderer)
    {
    }

    ngOnInit()
    {
    }

    ngAfterViewInit()
    {
        if (this._focus || typeof this._focus === "undefined")
            this.renderer.invokeElementMethod(this.el.nativeElement, 'focus', []);
    }

    @Input() set focus(condition: boolean)
    {
        this._focus = condition != false;
    }
}