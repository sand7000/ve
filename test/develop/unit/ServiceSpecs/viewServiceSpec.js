'use strict';
/*ViewService Unit Tests
 *
 * Tested Functions: createView, createDocument, createInstanceSpecification, getViewElements
 * Note: We should test the siteId's that are generated when we create views,
 *       as per Doris, this can be complex b/c some views are not attached to 
 *       a site URL.
*/
describe('ViewService', function() {
	beforeEach(module('mms', function($provide) {}));
    var root = '/alfresco/service/workspaces/master';
    var forceFail;
    var ViewService, CacheService, $httpBackend, $rootScope, scope, ownerId;
	describe('Method CreateView', function() {
			it('create a view similar to the workspace state in app.js', inject(function() {
				ViewService.createView(undefined, 'Untitled View', undefined, 'master', 'viewDoc').then(function(data) {
					//console.log(JSON.stringify(data));
					expect(data.name).toEqual('Untitled View');
					expect(data.documentation).toEqual('');
					expect(data.specialization.type).toEqual('View');
				}, function(reason){
					console.log("this happened" + reason);
				}); 
				$httpBackend.flush();
			}));
			it('create a view similar to the workspace state in the tree controller', inject(function() {
				ViewService.createView(ownerId, 'create view for tree', 'idMatchDocId', 'master').then(function(data){
					expect(data.owner).toEqual('MMS_1442345799882_df10c451-ab83-4b99-8e40-0a8e04b38b9d');
				},
				function(reason){
					console.log("this happened" + reason);
				});
				$httpBackend.flush();
			}));
		});
	describe('Method createDocument', function() {
		it('create a document similar to the tree Controller', inject(function() {
			ViewService.createDocument('newDocument','siteId' ,'master').then(function(data){
				//console.log("The long object " + JSON.stringify(data, null, " "));
				expect(data.name).toEqual('newDocument');
				expect(data.specialization.view2view).toBeDefined();
				expect(data.specialization.contents.operand).toBeDefined();
			},
			function(reason){
				console.log("this happened" + reason);
			});
			$httpBackend.flush();
		}));
		it('should create a document without passing a name', inject(function() {
			ViewService.createDocument(undefined,'siteId' ,'master').then(function(data){
				//console.log("The long object " + JSON.stringify(data, null, " "));
				expect(data.name).toEqual('Untitled View');
			},
			function(reason){
				console.log("this happened" + reason);
			});
			$httpBackend.flush();
		}));
	});
	describe('Method createInstanceSpecification', function() {
		it('should update View object called like controller.utils without a name', inject(function() {
			ViewService.createInstanceSpecification(ownerId,'master', 'Paragraph').then(function(data){
				//console.log("The long object " + JSON.stringify(data, null, " "));
				expect(data.specialization.type).toEqual('InstanceSpecification');
				expect(data.name).toEqual('Untitled Paragraph');
			},
			function(reason){
				console.log("this happened" + reason);
			});
			$httpBackend.flush();
		}));
		it('should update view object without a site name, but with a name', inject(function() {
			ViewService.createInstanceSpecification(ownerId,'master', 'Paragraph', null, 'named').then(function(data){
				//console.log("The long object " + JSON.stringify(data, null, " "));
				expect(data.specialization.type).toEqual('InstanceSpecification');
				expect(data.name).toEqual('named');
			},
			function(reason){
				console.log("this happened" + reason);
			});
			$httpBackend.flush();
		}));
		it('should update view object with a site name and with a name', inject(function() {
			ViewService.createInstanceSpecification(ownerId,'master', 'Paragraph', 'siteId', 'named').then(function(data){
				//console.log("The long object " + JSON.stringify(data, null, " "));
				expect(data.specialization.type).toEqual('InstanceSpecification');
				expect(data.name).toEqual('named');
			},
			function(reason){
				console.log("this happened" + reason);
			});
			$httpBackend.flush();
		}));
	});
	describe('Method getViewElements', function() {
		// getViewElements = function(id, update, workspace, version, weight, eidss) 
		it('should return the latest element in the cache', function() {
			var elem = {sysmlid:"elemId",specialization:{type:"View",childrenViews:[],name:"elemId",
			           documentation:"",appliedMetatypes:["7929"],isMetatype:false}};
			CacheService.put('views|master|elemId|latest|elements', elem );
			//console.log(CacheService.get('views|master|elemId|latest|elements'));
			ViewService.getViewElements('elemId', false, 'master','latest').then(function(data) {
				//console.log("The long object " + JSON.stringify(data, null, " "));
				expect(data.sysmlid).toEqual('elemId');
			}, function(){
				console.log('fail');
			});
			$rootScope.$apply();
			//$httpBackend.flush();
		});
		it('should return promise from the inProgress queue', function() {
			//inProgress structure should be replaced
		});	
		it('should return the element from the mock server', function() {
			// get generic elements logic, returns a list of elements when you call by the url alone---applys to products and such
			ViewService.getViewElements('elemId', false, 'master','latest').then(function(data) {
				//console.log("The long object " + JSON.stringify(data, null, " "));
			}, function(){
				console.log('fail');
			});
			$rootScope.$apply();
			//$httpBackend.flush();
		});	
	});	
			// getViewElements = function(id, update, workspace, version, weight, eidss) 
			// (!viewElements.hasOwnProperty(ver) && * && *), fail
			// ViewService.getViewElements('badId', false, 'master', '01-01-2014').then(function(response) {
			// 	console.log('This should not be displayed');
			// }, function(failMes) {
			// 	expect(failMes.status).toEqual(200);
			// });
		// 	
		// 	// (!viewElements.hasOwnProperty(ver) && * && *), success, !viewElements.hasOwnProperty(ver)
		// 	ViewService.getViewElements('12345', false, 'master', '01-01-2014').then(function(response) {
		// 		expect(response.length).toEqual(2);
		// 		expect(response[0]).toEqual({author:'muschek', name:'view\'s element', sysmlid:12346, owner:12345, lastModified:'01-01-2014'});
		// 		expect(response[1]).toEqual({author:'muschek', name:'view\'s 2nd element', sysmlid:12347, owner:12345, lastModified:'01-01-2014'});
		// 	}); $httpBackend.flush();
		// 	// viewElements['01-01-2014']['12345'] now exists
		// 	
		// 	// (viewElements.hasOwnProperty(ver) && !viewElements[ver].hasOwnProperty(id) && *), success, 
		// 	// viewElements.hasOwnProperty(ver)
		// 	ViewService.getViewElements('12345', false, 'master', 'latest').then(function(response) {
		// 		expect(response.length).toEqual(2);
		// 		expect(response[0]).toEqual({author:'muschek', name:'view\'s element', sysmlid:12346, owner:12345, lastModified:'07-28-2014'});
		// 		expect(response[1]).toEqual({author:'muschek', name:'view\'s 2nd element', sysmlid:12347, owner:12345, lastModified:'07-28-2014'});
		// 	}); $httpBackend.flush();
		// 	// viewElements['latest']['12345'] now exists
		// 	
		// 	// (viewElements.hasOwnProperty(ver) && viewElements[ver].hasOwnProperty(id) && !update)
		// 	ViewService.getViewElements('12345', false, 'master', '01-01-2014').then(function(response) {
		// 		expect(response.length).toEqual(2);
		// 		expect(response[0]).toEqual({author:'muschek', name:'view\'s element', sysmlid:12346, owner:12345, lastModified:'01-01-2014'});
		// 		expect(response[1]).toEqual({author:'muschek', name:'view\'s 2nd element', sysmlid:12347, owner:12345, lastModified:'01-01-2014'});
		// 	}); $rootScope.$apply();
		// 	
		// 	// (viewElements.hasOwnProperty(ver) && viewElements[ver].hasOwnProperty(id) && update),
		// 	// success, viewElements.hasOwnProperty(ver)
		// 	ViewService.getViewElements('12345', true, 'master', 'latest').then(function(response) {
		// 		expect(response.length).toEqual(2);
		// 		expect(response[0]).toEqual({author:'muschek', name:'view\'s element', sysmlid:12346, owner:12345, lastModified:'07-28-2014'});
		// 		expect(response[1]).toEqual({author:'muschek', name:'view\'s 2nd element', sysmlid:12347, owner:12345, lastModified:'07-28-2014'});
		// 	});
		// });
		beforeEach(inject(function($injector) {
			ViewService = $injector.get('ViewService');
			CacheService = $injector.get('CacheService');
			$httpBackend = $injector.get('$httpBackend');
			$rootScope = $injector.get('$rootScope');

			ownerId = getOwner();
			$httpBackend.whenGET(root + '/elements/idMatchDocId').respond(
				{elements: [{name:'doc with matching id', sysmlid:'idMatchDocId', specialization:{type:'Product',
				view2view:[{id:'nonMatchId', childrenViews:[]}, {id:'parentViewId', childrenViews:[]}]}}]});
			$httpBackend.whenGET(root + '/elements/MMS_1442345799882_df10c451-ab83-4b99-8e40-0a8e04b38b9d').respond(
					{elements: [{author:'muschek', name:'doc with empty view2view', sysmlid:'emptyView2ViewDocId',
					specialization: {type:'Product', view2view:[], noSections:[]}
			}]});
			$httpBackend.whenGET(root + '/views/elemId/elements').respond(
				{elements: [{author:'muschek', name:'view\'s element', sysmlid:12346, owner:12345, lastModified:'01-01-2014'}, 
				{author:'muschek', name:'view\'s 2nd element', sysmlid:12347, owner:12345, lastModified:'01-01-2014'}]});
				
			$httpBackend.when('POST', root + '/elements').respond(function(method, url, data) {

				var json = JSON.parse(data);

				if (!json.elements[0].sysmlid) {
					json.elements[0].sysmlid = json.elements[0].name + 'Id';
				}
				return [200, json];
			});
			$httpBackend.when('POST', root + '/sites/siteId/elements').respond(function(method, url, data) {

				var json = JSON.parse(data);

				if (!json.elements[0].sysmlid) {
					json.elements[0].sysmlid = json.elements[0].name + 'Id';
				}
				return [200, json];
			});
			$httpBackend.when('POST', root + '/sites/vetest/elements').respond(function(method, url, data) {

				var json = JSON.parse(data);

				if (!json.elements[0].sysmlid) {
					json.elements[0].sysmlid = json.elements[0].name + 'Id';
				}
				return [200, json];
			});

			$httpBackend.whenGET(root + '/sites/ems/products').respond(function(method, url, data) {
				if (forceFail) { return [500, 'Internal Server Error']; }
				else {
					var products = { products: [ { id: 'productId', name: 'Product Name', snapshots: [ { created: '01-01-2014', creator: 'muschek',
					id: 'snapshotId' } ] } ] };
					return [200, products];
				}
			});
		}));
});