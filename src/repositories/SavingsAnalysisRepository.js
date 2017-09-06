 REPOServices.factory('SavingsAnalysisRepository', function($rootScope, $http, $q, API_URL) {

     function getReports(bidId) {
         var deferred = $q.defer();

         $http.get(API_URL + 'integrations/genability/accounts/' + bidId + '/history', {
                 populateRequest: true
             })
             .then(function(response) {
                 deferred.resolve(response.data);
             })
             .catch(deferred.reject);

         return deferred.promise;
     }

     function getAccount(bidId) {
         var deferred = $q.defer();

         $http.get(API_URL + 'integrations/genability/accounts/' + bidId)
             .then(function(response) {
                 deferred.resolve(response.data);
             })
             .catch(deferred.reject);

         return deferred.promise;
     }

     function getAccountTariffs(bidId) {
         var deferred = $q.defer();

         $http.get(API_URL + 'integrations/genability/accounts/' + bidId + '/tariffs')
             .then(function(response) {
                 deferred.resolve(response.data);
             })
             .catch(deferred.reject);

         return deferred.promise;
     }

     function getProfiles(bidId) {
         var deferred = $q.defer();

         $http.get(API_URL + 'integrations/genability/accounts/' + bidId + '/profiles')
             .then(function(response) {
                 deferred.resolve(response.data);
             })
             .catch(deferred.reject);

         return deferred.promise;
     }

     function getUsageProfile(profileId) {
         var deferred = $q.defer();

         $http.get(API_URL + 'integrations/genability/usage_profiles/' + profileId, {
                 groupBy: 'MONTH',
                 populateIntervals: true,
                 clipBy: 'INNER'
             })
             .then(function(response) {
                 deferred.resolve(response.data);
             })
             .catch(deferred.reject);

         return deferred.promise;
     }

     function getSavingsAnalysis(bidId, savingsAnalysisId) {
         var deferred = $q.defer();

         $http.get(API_URL + 'integrations/genability/accounts/' + bidId + '/analyses/' + savingsAnalysisId)
             .then(function(response) {
                 deferred.resolve(response.data);
             })
             .catch(deferred.reject);

         return deferred.promise;
     }

     function setAccountTariff(bidId, masterTariffId) {
         var deferred = $q.defer();

         $http.put(API_URL + 'integrations/genability/accounts/' + bidId + '/tariffs', {
                 masterTariffId: masterTariffId
             })
             .then(function(response) {
                 deferred.resolve(response.data);
             })
             .catch(deferred.reject);

         return deferred.promise;
     }

     function analyze(bidId, body) {
         var deferred = $q.defer();

         $http.post(API_URL + 'integrations/genability/analyze', body)
             .then(function(response) {
                 deferred.resolve(response.data);
             })
             .catch(deferred.reject);

         return deferred.promise;
     }

     function updateAccountProperty(bidId, propertyName, propertyValue) {
         var deferred = $q.defer();
         var body = {
             dataValue: propertyValue
         };
         $http.put(API_URL + 'integrations/genability/accounts/' + bidId + '/properties/' + propertyName, body)
             .then(function(response) {
                 deferred.resolve(response.data);
             })
             .catch(deferred.reject);

         return deferred.promise;
     }

     function updateProfile(bidId, bodyParams) {
         var deferred = $q.defer();

         $http.put(API_URL + 'integrations/genability/accounts/' + bidId + '/profiles', bodyParams)
             .then(function(response) {
                 deferred.resolve(response.data);
             })
             .catch(deferred.reject);

         return deferred.promise;
     }

     function createProfile(bidId, bodyParams) {
         var deferred = $q.defer();

         $http.post(API_URL + 'integrations/genability/accounts/' + bidId + '/profiles', bodyParams)
             .then(function(response) {
                 deferred.resolve(response.data);
             })
             .catch(deferred.reject);

         return deferred.promise;
     }

     function createAccount(bidId, fullAddress, customerClass) {
         var deferred = $q.defer();
         var body = {
             providerAccountId: bidId,
             address: fullAddress,
             customerClass: customerClass
         };
         $http.post(API_URL + 'integrations/genability/accounts', body)
             .then(function(response) {
                 deferred.resolve(response.data);
             })
             .catch(deferred.reject);

         return deferred.promise;
     }

     function calculateUsageFromBill(bidId, from, to, amount) {
         var deferred = $q.defer();
         var body = {
             provider_account_id: bidId,
             from_date: from,
             to_date: to,
             amount: amount
         };

         $http.post(API_URL + 'integrations/genability/bill/calculate', body)
             .then(function(response) {
                 deferred.resolve(response.data);
             })
             .catch(deferred.reject);

         return deferred.promise;
     }

     return {
         getReports: getReports,
         getAccount: getAccount,
         getAccountTariffs: getAccountTariffs,
         setAccountTariff: setAccountTariff,
         getSavingsAnalysis: getSavingsAnalysis,
         analyze: analyze,
         updateAccountProperty: updateAccountProperty,
         createAccount: createAccount,
         getProfiles: getProfiles,
         updateProfile: updateProfile,
         createProfile: createProfile,
         getUsageProfile: getUsageProfile,
         calculateUsageFromBill: calculateUsageFromBill,
     };

 });
