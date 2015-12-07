var http = require('http');
var assert = require('assert');
var server = require('./server.js');
var jsdom = require('mocha-jsdom');
var expect = require('chai').expect;


describe('HTTP Server Test', function(){
	var $;
	jsdom();
	before(function(){
		$ = require('jquery');
		server.listen(3000);
	});
	after(function(){
		server.close();
	});

	describe('/users',function(){
		it('should return an empty list of users', function(done){
			http.get('http://127.0.0.1:3000/users', function(response){
				assert.equal(response.statusCode,200);

				var body = '';
				response.on('data',function(d){
					body += d;
				});
				response.on('end',function(){
					assert.equal(body,"[]");
					done();
				});
			});
		});
	});

	describe('/signup',function(){
		it('should give me one user', function(done){
			$.post('http://127.0.0.1:3000/signup', {email:'test@test.com',password:'password'},function(response){
				assert.equal(response.statusCode,200);
				var body = '';
				response.on('data',function(d){
					body += d;
				});
				response.on('end',function(){
					assert.equal(body,list);
					done();
				});

			});
		});
	});


	describe('/cottages',function(){
		it('should return an empty list of cottages', function(done){
			http.get('http://127.0.0.1:3000/cottages', function(response){
				assert.equal(response.statusCode,200);

				var body = '';
				response.on('data',function(d){
					body += d;
				});
				response.on('end',function(){
					assert.equal(body,"[]");
					done();
				});
			});
		});
	});
});