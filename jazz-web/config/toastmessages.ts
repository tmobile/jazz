export const toastMessage = {
    "error0":"Server cannot be reached at the moment",
    "error401":"Invalid credentials",
    "error403":"Forbidden",
    "errorInternet":"No internet connection",
    "errorDefault":"Unexpected error",
    "dataNull":"Data not available",
    "sessionExp":"Session Expired!",
    "serviceCost":{
        "dataNull":"Data not available",
        "error400":"Something went wrong while we were fetching the service cost!",
        "error401":"Token expired",
        "error404":"Something went wrong while we were fetching your services!",
        "error500":"Something went wrong while we were fetching your services!"
    },
    "serviceDetail":{
        "dataNull":"Something went wrong while we were fetching the service details!",
        "error400":"Something went wrong while we were fetching the service details!",
        "error401":"Token expired",
        "error404":"Not found",
        "error500":"Something went wrong while we were fetching the service details!"
    },
    "serviceDelete":{
        "success":"\"{service_name}\" is being deleted.",
        "error400":"Unable to delete service at this time.",
        "error401":"Token expired",
        "error404":"Unable to delete service at this time.",
        "error500":"Unable to delete service at this time.",
        "confirmDelete":"Are you sure you want to permanently delete {service_name}? Please confirm"
    },
    "serviceList":{
        "dataNull":"Looks like you don't have any services yet. Let's go create some!",
        "error400":"Something went wrong while we were fetching your services!",
        "error401":"Token expired",
        "error404":"Something went wrong while we were fetching your services!",
        "error500":"Something went wrong while we were fetching your services!"
    },
    "createService":{
        "success":"SUCCESS!\nYour service will be available shortly. You can track the progress on service page\nYou can refer :\nhttps://github.com/tmobile/jazz/wiki",
        "error400":"Looks like we couldn't create your service. Please try again.",
        "error401":"Token expired",
        "error404":"Looks like we couldn't create your service. Please try again.",
        "error500":"Looks like we couldn't create your service. Please try again."
    },
    "envDetail":{
        "dataNull":"Something went wrong while we were fetching the environment details!",
        "error400":"Something went wrong while we were fetching the environment details!",
        "error401":"Token expired",
        "error404":"Not found",
        "error500":"Something went wrong while we were fetching the environment details!"
    },
    "logout":{
        "success":"Logout Successfull!",
        "fail":"Sorry! Looks like you're still here. Hate to see you go!",
        "error400":"Your logout failed. Seems like something went wrong.",
        "error401":"Token expired",
        "error404":"Your logout failed. Seems like something went wrong.",
        "error500":"Your logout failed. Seems like something went wrong.",
        "error0":"Your logout failed, seems like we can't reach our servers."
    },
    "login":{
        "fail":"Your login failed, seems like we can't reach our servers.",
        "error400":"Your login failed. Seems like something went wrong.",
        "error401":"Your login failed. Seems like something went wrong.",
        "error404":"Your login failed. Seems like something went wrong.",
        "error500":"Your login failed. Seems like something went wrong.",
        "error0":"Your login failed, seems like we can't reach our servers."
    }
};