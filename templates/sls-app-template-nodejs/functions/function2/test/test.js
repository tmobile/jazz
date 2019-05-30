const assert = require('chai').assert;

const service = require('..');

describe('Sample', () => {
  it('tests handler 2', (done) => {
    service.handler({"event": "event"},
                    {"functionName": "coolFunction-prod"},
                    (err, data) => {
                      assert(data.data.foo=='foo-value2');
                      assert(data.data.bar=='bar-value2');
                      assert(data.data.configKeys == 'ConfigValueProd2');
                      assert(data.input.event=='event');
                      if(!err) done();
                    });
  });
});
