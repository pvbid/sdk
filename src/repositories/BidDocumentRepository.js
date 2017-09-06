 REPOServices.factory('BidDocumentRepository', function($rootScope, $http, $q, API_URL) {

     function getDocuments(bidId) {
         var deferred = $q.defer();

         $http.get(API_URL + 'bids/' + bidId + '/documents')
             .then(function(response) {
                 deferred.resolve(response.data);
             })
             .catch(deferred.reject);

         return deferred.promise;
     }

     function getSnippetGroups(bidId) {
         var deferred = $q.defer();

         $http.get(API_URL + 'bids/' + bidId + '/snippet_groups')
             .then(function(response) {
                 deferred.resolve(response.data);
             })
             .catch(deferred.reject);

         return deferred.promise;
     }

     function getSnippets(bidId) {
         var deferred = $q.defer();

         $http.get(API_URL + 'bids/' + bidId + '/snippets')
             .then(function(response) {
                 deferred.resolve(response.data);
             })
             .catch(deferred.reject);

         return deferred.promise;
     }

     function saveSnippet(snippet) {
         var deferred = $q.defer();

         $http.put(API_URL + 'bids/' + snippet.bid_id + '/snippets/' + snippet.id, snippet)
             .then(function(response) {
                 deferred.resolve(response.data);
             })
             .catch(deferred.reject);

         return deferred.promise;
     }

     function saveDocument(document) {

         var deferred = $q.defer();

         $http.put(API_URL + 'bids/' + document.bid_id + '/documents/' + document.id, document)
             .then(function(response) {
                 deferred.resolve(response.data);
             })
             .catch(deferred.reject);

         return deferred.promise;
     }

     return {
         getDocuments: getDocuments,
         getSnippets: getSnippets,
         getSnippetGroups: getSnippetGroups,
         saveDocument: saveDocument,
         saveSnippet: saveSnippet,
     };

 });
