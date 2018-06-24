import {environment} from "../../../environments/environment";

export const UserJourney = [
  {
    title: "WELCOME TO JAZZ",
    message: "Jazz addresses gaps and pain points with serverless, particularly for production applications. Jazz has a beautiful UI designed to let developers quickly self-start and focus on code. Let's get started!",
    src: "assets/images/icons/Jazz_S.svg",
    contentStyle: {'top': '-24vh'}
  },
  {
    message: "If you already have an account, continue to the next slide, otherwise click <button class='user-journey-btn message-button'>GET STARTED NOW</button> and use the Registration link to create an account. " + environment.userJourney.registrationMessage,
    src: environment.urls["content_base"] + "/jazz-ui/user-journey/jazz-registration.mp4?raw=true"
  },
  {
    message: "Click <button class='user-journey-btn message-button'>GET STARTED NOW</button> and enter your credentials in the login window.",
    src: environment.urls["content_base"] + "/jazz-ui/user-journey/jazz-login.mp4?raw=true"
  },
  {
    message: "This is your Jazz dashboard. Here you will see all of the services you have created. Click <button class='user-journey-btn message-button'>CREATE SERVICE</button>to begin making your first service.",
    src: environment.urls["content_base"] + "/jazz-ui/user-journey/jazz-create-service.mp4?raw=true"
  },
  {
    message: `Provide a name and namespace for your service and click <button class='user-journey-btn message-button'>SUBMIT</button> to create your service.`,
    src: environment.urls["content_base"] + "/jazz-ui/user-journey/jazz-configure-service.mp4?raw=true",
  },
  {
    message: `You have just created your service! The status column will start with "creation started" and turn "active" in a few minutes. Once <i>active</i>, you can begin making changes to your service.`,
    src: environment.urls["content_base"] + "/jazz-ui/user-journey/jazz-go-to-service.mp4?raw=true",
  },
  {
    message: "This link will take you to you service's Git repository.",
    src: environment.urls["content_base"] + "/jazz-ui/user-journey/jazz-service-details.mp4?raw=true"
  },
  {
    message: "You can now clone the repository and create a branch. Make a change and push it to your Git repository. Jazz will create a new non-production environment for your branch and deploy your changes.",
    src: environment.urls["content_base"] + "/jazz-ui/user-journey/jazz-bitbucket-environment.mp4?raw=true",
    class: "modal-overlay",
    contentStyle: {"padding": "4rem", "z-index": 1},
  },
  {
    message: `This is the service detail page. You can view all the environments as well as their deployment status for your service.`,
    src: environment.urls["content_base"] + "/jazz-ui/user-journey/jazz-go-to-environment.mp4?raw=true",
    class: "modal-overlay-next"
  },
  {
    message: "You can click <button class='user-journey-btn message-button secondary'>TEST API</button> to test and validate you API!",
    src: environment.urls["content_base"] + "/jazz-ui/user-journey/jazz-test-api.mp4?raw=true"
  },
  {
    title: "THANKS FOR USING JAZZ!",
    message: "Additional information can be found here: ",
    messageLink: environment.urls["docs_link"],
    src: "assets/images/icons/Jazz_S.svg",
    contentStyle: {'top': '-24vh'}
  }
];
