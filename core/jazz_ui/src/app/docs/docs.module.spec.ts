import { DocsModule } from './docs.module';


describe('DocsModule', () => {
  let docsModule: DocsModule;

  beforeEach(() => {
    docsModule = new DocsModule();
  });

  it('should create an instance', () => {
    expect(docsModule).toBeTruthy();
  });
});
