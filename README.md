![Jazz Logo](logo.png)
# Jazz Serverless Platform
[![Build Status](https://travis-ci.org/tmobile/jazz.svg?branch=master)](https://travis-ci.org/tmobile/jazz)

**Seamlessly build, deploy & manage cloud-native applications.**

Jazz addresses gaps and pain points with serverless, particularly for production applications. It is not another FaaS implementation. Rather, it enhances the usability of existing FaaS systems. Jazz has a beautiful UI designed to let developers quickly self-start and focus on code. Its modular design makes it easy to add new integrations:

* **Services** - Today devs can build functions, APIs and static websites. The template-based system makes it easy to define new ones.
* **Deployment Targets** - Currently we deploy to AWS (Lambda, API gateway and S3). We plan to support Azure Functions and Docker containers in the near future.
* **Features** - Services seamlessly integrate features like monitoring (CloudWatch), logging (ElasticSearch), authentication (Cognito) and secret management (KMS, Vault coming soon).
* **Deployment & CI/CD** - We leverage [Serverless Framework](http://www.serverless.com) and Git/Bitbucket/Jenkins.

Jazz is [open-sourced](http://opensource.t-mobile.com) and under active development by T-Mobile's Cloud Center of Excellence.

[Watch the video preview here.](https://www.youtube.com/watch?v=6Kp1yxMjn1k)

## Install

You can [install Jazz](https://github.com/tmobile/jazz-installer) in your account using the automated installer.

## Try Jazz!
You can try out public preview version of Jazz by registering with your email address [here](http://try.tmo-jazz.net). You will need a registration code which can be requested by joining [slack](https://tmo-oss-getinvite.herokuapp.com/). Once in slack, go to `#jazz-serverless` channel to get a working registration code.

## User Guide

For more details, see the [Wiki](https://github.com/tmobile/jazz/wiki).

## License

Jazz is released under the [Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0).
