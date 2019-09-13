const assert = require('chai').assert;

const service = require('..');

describe('Sample', () => {
  it('tests handler 1', (done) => {
    service.handler({"event": "event"},
                    {"functionName": "coolFunction-prod"},
                    (err, data) => {
                      assert(data.data.foo=='foo-value');
                      assert(data.data.bar=='bar-value');
                      assert(data.data.configKeys == 'ConfigValueProd');
                      assert(data.input.event=='event');
                      if(!err) done();
                    });
  });
});
