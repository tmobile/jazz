# pinkie-defer [![Build Status](https://travis-ci.org/SamVerschueren/pinkie-defer.svg?branch=master)](https://travis-ci.org/SamVerschueren/pinkie-defer)

> Defer an ES2015 Promise implementation


## Install

```
$ npm install --save pinkie-defer
```


## Usage

```js
const defer = require('pinkie-defer');

const delay = ms => {
	var deferred = defer();

	setTimeout(() => {
		deferred.resolve();
	}, ms);

	return new Promise(deferred);
};

delay(2000).then(() => {
	//=> 2 seconds later...
});
```


## API

### defer()

Returns an object with `resolved` and `reject` methods that can be injected in the `Promise` constructor.


## License

MIT © [Sam Verschueren](http://github.com/SamVerschueren)
