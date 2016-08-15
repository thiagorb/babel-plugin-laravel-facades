const assert = require('assert');
const rewire = require('rewire');

const internals = rewire('./');

it('should identify laravel facades methods', () => {
	const specifiers = {
		'laravel-localization': ['Lang'],
		'laravel-config': ['Config']
	};
	
	const findFacadeFromMethodCall = internals.__get__('findFacadeFromMethodCall');
	
    assert.equal(findFacadeFromMethodCall(specifiers, { object: 'Lang', method: 'get' }), 'laravel-localization');
    assert.equal(findFacadeFromMethodCall(specifiers, { object: 'Lang', method: 'has' }), 'laravel-localization');
    assert.equal(findFacadeFromMethodCall(specifiers, { object: 'Lang', method: 'choice' }), 'laravel-localization');
    assert.equal(findFacadeFromMethodCall(specifiers, { object: 'Config', method: 'get' }), 'laravel-config');
    assert.equal(findFacadeFromMethodCall(specifiers, { object: 'Config', method: 'choice' }), null);
    assert.equal(findFacadeFromMethodCall(specifiers, { object: 'NotSet', method: 'get' }), null);
});