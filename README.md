# babel-plugin-laravel-facades
Babel plugin that detects usages of the modules [laravel-localization](https://github.com/thiagorb/laravel-localization) and [laravel-config](https://github.com/thiagorb/laravel-config), and generates a JSON file containing the used keys.

This JSON file can be used to generate the data to be sent to the browser, using [andywer](https://github.com/andywer/laravel-js-localization) module, or any other similar solution.

## Installation
```
npm install babel-plugin-laravel-facades
```
## Usage

- app.js:
	```
	import Lang from 'laravel-localization';
	import Config from 'laravel-config';

	Lang.addMessages({
		'en': {
	        'message key': 'translated message'
		}
	});

	Lang.setLocale('en');

	Config.addConfig({
		'config key': 'config value'
	});

	console.log(Lang.get('message key')); // translated message
	console.log(Config.get('config key')); // config value;
	```

- build.js:
	```
	const browserify = require('browserify');
	const babelify = require('babelify');
	const laravelJsFacades = require('babel-plugin-laravel-facades');

	const laravelJsFacadesInstance = laravelJsFacades.instance();

	browserify('app.js')
	    .transform(babelify, {
	        presets: ['es2015'],
	        plugins: [
	            [
	                'laravel-facades',
	                laravelJsFacadesInstance
	            ]
	        ]
	    })
	    .bundle()
	    .on('end', () => laravelJsFacadesInstance.write('messages.json'))
	    .pipe(process.stdout);
	```
	
- generated messages.json after running build.js:
	```
	{"messages":["message key"],"configs":["config key"]}
	```
