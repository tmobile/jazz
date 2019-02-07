

module.exports.handler = (event, context, cb) => {

  try {

    const sampleResponse = {
      "foo": "foo-value",
      "bar": "bar-value"
    };

    return cb(null, sampleResponse);

  } catch (e) {
    //Sample Error response for internal server error
    return cb(e);

  }


};
