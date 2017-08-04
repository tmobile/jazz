import { Directive, ViewContainerRef,  HostListener, OnInit, Renderer, Inject, Input } from '@angular/core';
import { SlimScrollOptions } from '../classes/slimscroll-options.class';

@Directive({
  selector: '[slimScroll]',
  exportAs: 'slimScroll'
})
export class SlimScrollDirective implements OnInit {
  @Input() options: SlimScrollOptions;

  el: HTMLElement;
  wrapper: HTMLElement;
  grid: HTMLElement;
  bar: HTMLElement;
  body: HTMLElement;
  pageY: number;
  top: number;
  dragging: boolean;
  mutationThrottleTimeout: number;
  mutationObserver: MutationObserver;
  lastTouchPositionY: number;

  constructor(
    @Inject(ViewContainerRef) private viewContainer: ViewContainerRef,
    @Inject(Renderer) private renderer: Renderer) {
    if (typeof window === 'undefined') { return; }
    this.viewContainer = viewContainer;
    this.el = viewContainer.element.nativeElement;
    this.body = document.documentElement.querySelector('body');
    this.mutationThrottleTimeout = 50;
  }

  ngOnInit() {
    if (typeof window === 'undefined') { return; }
    this.options = new SlimScrollOptions(this.options);
    this.destroy();
    this.setElementStyle();
    this.wrapContainer();
    this.initGrid();
    this.initBar();
    this.getBarHeight();
    this.attachWheel(this.el);
    this.makeBarDraggable();

    if (MutationObserver) {
      this.mutationObserver = new MutationObserver(() => {
        if (this.mutationThrottleTimeout) {
          clearTimeout(this.mutationThrottleTimeout);
          this.mutationThrottleTimeout = setTimeout(this.onMutation.bind(this), 50);
        }
      });
      this.mutationObserver.observe(this.el, {subtree: true, childList: true});
    }
  }

  setElementStyle(): void {
    let el = this.el;
    this.renderer.setElementStyle(el, 'overflow', 'hidden');
    this.renderer.setElementStyle(el, 'position', 'relative');
    this.renderer.setElementStyle(el, 'display', 'block');
  }

  onMutation() {
    this.getBarHeight();
  }

  wrapContainer(): void {
    this.wrapper = document.createElement('div');
    let wrapper = this.wrapper;
    let el = this.el;

    this.renderer.setElementClass(wrapper, 'slimscroll-wrapper', true);
    this.renderer.setElementStyle(wrapper, 'position', 'relative');
    this.renderer.setElementStyle(wrapper, 'overflow', 'hidden');
    this.renderer.setElementStyle(wrapper, 'display', 'inline-block');
    this.renderer.setElementStyle(wrapper, 'margin', getComputedStyle(el).margin);
    this.renderer.setElementStyle(wrapper, 'width', 'inherit');
    this.renderer.setElementStyle(wrapper, 'height', '100%');

    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
  }

  initGrid(): void {
    this.grid = document.createElement('div');
    let grid = this.grid;

    this.renderer.setElementClass(grid, 'slimscroll-grid', true);
    this.renderer.setElementStyle(grid, 'position', 'absolute');
    this.renderer.setElementStyle(grid, 'top', '0');
    this.renderer.setElementStyle(grid, this.options.position, '0');
    this.renderer.setElementStyle(grid, 'width', `${this.options.gridWidth}px`);
    this.renderer.setElementStyle(grid, 'height', '100%');
    this.renderer.setElementStyle(grid, 'background', this.options.gridBackground);
    this.renderer.setElementStyle(grid, 'opacity', this.options.gridOpacity);
    this.renderer.setElementStyle(grid, 'display', 'block');
    this.renderer.setElementStyle(grid, 'cursor', 'pointer');
    this.renderer.setElementStyle(grid, 'z-index', '99');
    this.renderer.setElementStyle(grid, 'border-radius', `${this.options.gridBorderRadius}px`);
    this.renderer.setElementStyle(grid, 'margin', this.options.gridMargin);

    this.wrapper.appendChild(grid);
  }

  initBar(): void {
    this.bar = document.createElement('div');
    let bar = this.bar;

    this.renderer.setElementClass(bar, 'slimscroll-bar', true);
    this.renderer.setElementStyle(bar, 'position', 'absolute');
    this.renderer.setElementStyle(bar, 'top', '0');
    this.renderer.setElementStyle(bar, this.options.position, '0');
    this.renderer.setElementStyle(bar, 'width', `${this.options.barWidth}px`);
    this.renderer.setElementStyle(bar, 'background', this.options.barBackground);
    this.renderer.setElementStyle(bar, 'opacity', this.options.barOpacity);
    this.renderer.setElementStyle(bar, 'display', 'block');
    this.renderer.setElementStyle(bar, 'cursor', 'pointer');
    this.renderer.setElementStyle(bar, 'z-index', '100');
    this.renderer.setElementStyle(bar, 'border-radius', `${this.options.barBorderRadius}px`);
    this.renderer.setElementStyle(bar, 'margin', this.options.barMargin);

    this.wrapper.appendChild(bar);
  }

  getBarHeight(): void {
    setTimeout(() => {
      let barHeight = Math.max((this.el.offsetHeight / this.el.scrollHeight) * this.el.offsetHeight, 30) + 'px';
      let display = parseInt(barHeight, 10) === this.el.offsetHeight ? 'none' : 'block';

      this.renderer.setElementStyle(this.bar, 'height', barHeight);
      this.renderer.setElementStyle(this.bar, 'display', display);
      this.renderer.setElementStyle(this.grid, 'display', display);
    }, 1);
  }

  attachWheel(target: HTMLElement): void {
    target.addEventListener('DOMMouseScroll', this.onWheel, false);
    target.addEventListener('mousewheel', this.onWheel, false);
    target.addEventListener('touchstart', this.onTouchStart, false);
  }

  onWheel = (e: MouseWheelEvent) => {
    let delta = 0;

    if (e.wheelDelta) { delta = -e.wheelDelta / 120; }
    if (e.detail) { delta = e.detail / 3; }

    this.scrollContent(delta, true, false);

    if (e.preventDefault) { e.preventDefault(); }
  }

  onTouchStart = (e: TouchEvent) => {
    e.target.addEventListener('touchmove', this.onTouchMove, false);
    e.target.addEventListener('touchend', this.onTouchEnd, false);
    this.lastTouchPositionY = e.changedTouches[0].clientY;
  }

  onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    let delta = (this.lastTouchPositionY - e.changedTouches[0].clientY) / 120;
    this.lastTouchPositionY = e.changedTouches[0].clientY;
    this.scrollContent(delta, true, false);
  }

  onTouchEnd = (e: TouchEvent) => {
    e.target.removeEventListener('touchmove');
    e.target.removeEventListener('touchend');
  }

  scrollContent(y: number, isWheel: boolean, isJump: boolean): void {
    let delta = y;
    let maxTop = this.el.offsetHeight - this.bar.offsetHeight;
    let percentScroll: number;
    let bar = this.bar;
    let el = this.el;

    if (isWheel) {
      delta = parseInt(getComputedStyle(bar).top, 10) + y * 20 / 100 * bar.offsetHeight;
      delta = Math.min(Math.max(delta, 0), maxTop);
      delta = (y > 0) ? Math.ceil(delta) : Math.floor(delta);
      this.renderer.setElementStyle(bar, 'top', delta + 'px');
    }

    percentScroll = parseInt(getComputedStyle(bar).top, 10) / (el.offsetHeight - bar.offsetHeight);
    delta = percentScroll * (el.scrollHeight - el.offsetHeight);

    el.scrollTop = delta;
  }

  makeBarDraggable = () => {
    let bar = this.bar;

    bar.addEventListener('mousedown', (e: MouseEvent) => {
      if (!this.dragging) {
        this.pageY = e.pageY;
        this.top = parseFloat(getComputedStyle(this.bar).top);
      }

      this.dragging = true;
      this.body.addEventListener('mousemove', this.barDraggableListener, false);
      this.body.addEventListener('selectstart', this.preventDefaultEvent, false);
    }, false);

    this.body.addEventListener('mouseup', () => {
      this.body.removeEventListener('mousemove', this.barDraggableListener, false);
      this.body.removeEventListener('selectstart', this.preventDefaultEvent, false);
      this.dragging = false;
    }, false);
  };

  preventDefaultEvent = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  barDraggableListener = (e: MouseEvent) => {
    let top = this.top + e.pageY - this.pageY;
    this.renderer.setElementStyle(this.bar, 'top', `${top}px`);
    this.scrollContent(0, true, false);
  };

  destroy(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    if (this.el.parentElement.classList.contains('slimscroll-wrapper')) {
      let wrapper = this.el.parentElement;
      let bar = this.el.querySelector('.slimscroll-bar');
      this.el.removeChild(bar);
      this.unwrap(wrapper);
    }
  }

  unwrap(wrapper: HTMLElement): void {
    let docFrag = document.createDocumentFragment();
    while (wrapper.firstChild) {
      let child = wrapper.removeChild(wrapper.firstChild);
      docFrag.appendChild(child);
    }
    wrapper.parentNode.replaceChild(docFrag, wrapper);
  }
    @HostListener('window:resize', ['$event'])
    onResize($event: any) {
        this.getBarHeight()
    }
}
