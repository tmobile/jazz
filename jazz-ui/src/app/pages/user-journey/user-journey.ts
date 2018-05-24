import {environment} from "../../../environments/environment";

export const UserJourney = [
  {
    title: "WELCOME TO JAZZ",
    message: "Jazz addresses gaps and pain points with serverless, particularly for production applications. Jazz has a beautiful UI designed to let developers quickly self-start and focus on code. Let's get started!",
    src: "assets/images/icons/Jazz_S.svg",
    contentStyle: {'top': '-24vh'}
  },
  {
    message: "If you already have an account, continue to the next slide, otherwise click <button class='user-journey-btn message-button'>GET STARTED NOW</button> and use the Registration link to get registered.",
    src: environment.urls["content_base"] + "jazz-registration.mp4"
  },
  {
    message: "Once you have an account, click <button class='user-journey-btn message-button'>GET STARTED NOW</button> and use the login window to begin.",
    src: environment.urls["content_base"] + "jazz-login.mp4"
  },
  {
    message: "You are now at the Jazz dashboard. Here you will see all of the services you have created. Click <button class='user-journey-btn message-button'>CREATE SERVICE</button>to begin making your first service.",
    src: environment.urls["content_base"] + "jazz-create-service.mp4"
  },
  {
    message: `Here you will configure your service. Your service will need a service type, deployment target, program runtime, name, and namespace. Click <button class='user-journey-btn message-button'>SUBMIT</button> when you are finished.`,
    src: environment.urls["content_base"] + "jazz-configure-service.mp4",
  },
  {
    message: `You have just created your service! Currently the status column will show "creation started"
    After a few minutes the status will change to "creation completed" and then you can begin making changes to your service.`,
    src: environment.urls["content_base"] + "jazz-go-to-service.mp4",
  },
  {
    message: "This link will take you to the repository in Bitbucket.",
    src: environment.urls["content_base"] + "jazz-service-details.mp4"
  },
  {
    message: "From Bitbucket you will clone the repository and create a new feature branch. Make a change in that branch and push it back to Bitbucket. Jazz watches the repository and will create a new non-production environment for each branch it detects.",
    src: environment.urls["content_base"] + "jazz-bitbucket-environment.mp4",
    class: "modal-overlay",
    contentStyle: {"padding": "4rem", "z-index": 1},

  },
  {
    message: `This is the Environment Details page. Here you can see all of this service's environments as well as the deployment status of those environments.`,
    src: environment.urls["content_base"] + "jazz-go-to-environment.mp4",
    class: "modal-overlay-next"
  },
  {
    message: "Click <button class='user-journey-btn message-button secondary'>TEST API</button> and see your service up and running!",
    src: environment.urls["content_base"] + "jazz-test-api.mp4"
  },
  {
    title: "THANKS FOR USING JAZZ!",
    message: "Additional information can be found here;",
    messageLink: environment.urls["docs_link"],
    src: "assets/images/icons/Jazz_S.svg",
    contentStyle: {'top': '-24vh'}
  }
];
