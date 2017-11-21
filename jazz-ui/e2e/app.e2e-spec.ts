import { ServicesOnboardingPage } from './app.po';

describe('services-onboarding App', function() {
  let page: ServicesOnboardingPage;

  beforeEach(() => {
    page = new ServicesOnboardingPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
