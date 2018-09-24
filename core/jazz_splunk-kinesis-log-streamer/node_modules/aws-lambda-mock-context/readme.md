# aws-lambda-mock-context [![Build Status](https://travis-ci.org/SamVerschueren/aws-lambda-mock-context.svg?branch=master)](https://travis-ci.org/SamVerschueren/aws-lambda-mock-context)

> AWS Lambda mock context object


## Installation

```
$ npm install --save-dev aws-lambda-mock-context
```


## Usage

```js
const context = require('aws-lambda-mock-context');

const ctx = context();

index.handler({hello: 'world'}, ctx);

ctx.Promise
    .then(() => {
        //=> succeed() called
    })
    .catch(err => {
        //=> fail() called
    });
```


## API

### context(options)

#### options

##### region

Type: `string`<br>
Default: `us-west-1`

AWS region.

##### account

Type: `string`<br>
Default: `123456789012`

Account number.

##### functionName

Type: `string`<br>
Default: `aws-lambda-mock-context`

Name of the function.

##### functionVersion

Type: `string`<br>
Default: `$LATEST`

Version of the function.

##### memoryLimitInMB

Type: `string`<br>
Default: `128`

Memory limit.

##### alias

Type: `string`

Alias of the function.

##### timeout

Type: `number`<br>
Default: `3`

Timeout of the lambda function in seconds.


## Related

- [aws-lambda-pify](https://github.com/SamVerschueren/aws-lambda-pify) - Promisify an AWS lambda function.


## License

MIT © [Sam Verschueren](https://github.com/SamVerschueren)
