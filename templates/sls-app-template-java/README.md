## Template for serverless application with its own deployment descriptor
There are two functions declared in this module. They are
* com.slf.services.functions.function1
* com.slf.services.functions.function2

Each function reads its own config from the respective folder located under 'src/main/resources'
* src/main/resources/functions/function1
  * dev.properties
  * prod.properties
  * stg.properties
* src/main/resources/functions/function2
  * dev.properties
  * prod.properties
  * stg.properties
