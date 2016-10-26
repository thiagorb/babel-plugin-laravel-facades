"use strict";

exports.__esModule = true;

const fs = require('fs');

const extractMethodCallFromCallExpression = function (expression) {
	if (expression.callee.type !== 'MemberExpression') {
		return null;
	}

	if (expression.callee.object.type !== 'Identifier' || expression.callee.property.type !== 'Identifier') {
		return null;
	}

	return {
		object: expression.callee.object.name,
		method: expression.callee.property.name,
		arguments: expression.arguments
	};
};

const laravelLocalization = 'laravel-localization';
const laravelConfig = 'laravel-config';

const facadeModuleNames = [
	laravelLocalization,
	laravelConfig
];

const laravelJsLocalizationMethods = [
	{
		facade: laravelLocalization,
		methods: ['get', 'has', 'choice']
	},
	{
		facade: laravelConfig,
		methods: ['get']
	}
];

const findFacadeFromMethodCall = function (specifiers, methodCall) {
	const matchingMethodSet = laravelJsLocalizationMethods.find(methodSet =>
		specifiers[methodSet.facade] &&
		specifiers[methodSet.facade].some(specifier => specifier === methodCall.object) &&
		methodSet.methods.some(method => method === methodCall.method)
	);
	return (matchingMethodSet && matchingMethodSet.facade) || null;
};

const initSpecifiers = function () {
	const specifiers = {};
	facadeModuleNames.forEach(m => specifiers[m] = []);
	return specifiers;
};

const visitor = function (_ref) {
	return {
		visitor: {
			ImportDeclaration: {
				enter: function (expression, state) {
					const instance = state.opts;
					const matchingFacade = facadeModuleNames.find(facade => expression.node.source.value === facade);

					if (!matchingFacade) {
						return;
					}

					instance.registerSpecifier(matchingFacade, expression.node.specifiers[0].local.name);
				}
			},
			CallExpression: {
				enter: function enter(expression, state) {
					const instance = state.opts;

					const methodCall = extractMethodCallFromCallExpression(expression.node);
					if (!methodCall) {
						return;
					}

					const facade = findFacadeFromMethodCall(instance.getSpecifiers(), methodCall);
					if (!facade) {
						return;
					}

					instance.registerCall(
						facade,
						methodCall.method,
						methodCall.arguments,
						expression.scope.hub.file.opts.filename
					);
				}
			},
			Program: {
				enter: function enter(expression, state) {
					const instance = state.opts;
					instance.resetSpecifiers();
				}
			}
		}
	};
};

const facadeRegister = function (data, method, callArguments, filename) {
	var firstArgument = callArguments[0];

	if (!firstArgument || firstArgument.type !== 'StringLiteral') {
		const position = firstArgument.loc.start;

		console.warn(`babel-plugin-laravel-facades supports only calls to facades with string constant keys!\n    on ${filename}, line ${position.line}, column ${position.column}`);
		return;
	}

	data[firstArgument.value] = true;
};

const facadeGetData = function (data) {
	return Object.keys(data);
};

const facadesKeyMap = {};
facadesKeyMap[laravelLocalization] = 'messages';
facadesKeyMap[laravelConfig] = 'configs';

const instance = function (outputFile) {
	const data = {};
	facadeModuleNames.forEach(m => data[m] = {});
	var specifiers = null;

	return {
		registerCall(facade, method, callArguments, filename) {
			facadeRegister(data[facade], method, callArguments, filename);
		},
		write() {
			let output = {};
			facadeModuleNames.forEach(m => {
				const facadeKey = facadesKeyMap[m];
				output[facadeKey] = facadeGetData(data[m]);
			});

			return new Promise((resolve, reject) => {
				fs.writeFile(outputFile, JSON.stringify(output), (err) => {
					if (err) {
						return reject();
					}

					resolve();
				});
			});
		},
		getFacadeData(facade) {
			return facadeGetData(data[facade]);
		},
		registerSpecifier(facade, specifier) {
			specifiers[facade].push(specifier);
		},
		resetSpecifiers() {
			specifiers = initSpecifiers();
		},
		getSpecifiers() {
			return specifiers;
		}
	};
};

module.exports.default = visitor;
module.exports.instance = instance;
