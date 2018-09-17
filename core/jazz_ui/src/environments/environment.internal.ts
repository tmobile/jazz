export const environment = {
  production: false,
  configFile: 'config/config.prod.json',
  baseurl: "https://cloud-api.corporate.t-mobile.com/api",
  api_doc_name: 'http://cloud-api-doc.corporate.t-mobile.com',
  envName : "jazz",
  multi_env:false,
  serviceTabs:['overview','access control','metrics','logs'],
  environmentTabs:['overview','deployments','code quality','assets', 'metrics', 'logs','clear water'],
  gaTrackingId: '',
  urls:{
    docs_link:"https://docs.jazz.corporate.t-mobile.com",
    content_base: "https://docs.jazz.corporate.t-mobile.com/external-content",
    swagger_editor: 'http://editor.cloud-api.corporate.t-mobile.com/?url='
  },
  userJourney: {
    registrationMessage: ''
  },
  aws: {
    account_number:'{account_number}',
    region:"{region}",
  }
};
