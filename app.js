'use strict';

var app = angular.module('flightPicker', ['ui.bootstrap']);
var SERVER_URL = "https://api.skypicker.com";

app.controller('SearchController', function($scope, $http, $q, SearchService) {
    $scope.flights = [];

    $scope.query = {
        'from': "",
        'to': "",
        'departureDatePicker': {
            dt: new Date(),
            opened: false,
            dateOptions: {
                startingDay: 1,
                maxDate: new Date(2026, 1, 1),
                minDate: new Date()
            },
            format: 'dd/MM/yyyy'
        },
        'returnDatePicker': {
            dt: new Date(),
            opened: false,
            dateOptions: {
                startingDay: 1,
                maxDate: new Date(2026, 1, 1),
                minDate: new Date()
            },
            format: 'dd/MM/yyyy'
        },
        'isReturn': false,
        'returnFrom': "",
        'returnTo': ""
    };

    $scope.openDepartureDatePicker = function($event) {
        $scope.query.departureDatePicker.opened = true;
    };

    $scope.openReturnDatePicker = function($event) {
        $scope.query.returnDatePicker.opened = true;
    };

    $scope.getPlaces = function(val) {
        return SearchService.getPlaces(val).then(function(data) {
            return data.map(function(item) {
                return item.value;
            });
        });
    };

    $scope.getFlights = function(query) {
        if (!$scope.searchForm.$valid) {
            $scope.flights = [];
        } else {
            // get place id for origin and destination and then perform search query
            var deferSetCorrectFrom = $q.defer(),
                deferSetCorrectTo = $q.defer();
            var fromId,
                toId;
            SearchService.getPlaces(query.from).then(function(data) {
                console.log("from: " + data[0].id);
                fromId = data[0].id;
                deferSetCorrectFrom.resolve();
            });
            SearchService.getPlaces(query.to).then(function(data) {
                console.log("to: " + data[0].id);
                toId = data[0].id;
                deferSetCorrectTo.resolve();
            });
            $q.all([deferSetCorrectFrom.promise, deferSetCorrectTo.promise]).then(function() {
                SearchService.getFlights(query, fromId, toId).then(function(flights) {
                    $scope.flights = flights;
                });
            });
        }
    };
});

app.service('SearchService', function($http) {
    return {
        'getPlaces': function(val) {
            return $http({
                url: SERVER_URL + '/places',
                method: 'GET',
                params: {
                    'v': '2',
                    'locale': 'en',
                    'term': val
                }
            }).then(function(response) {
                return response.data;
            });
        },
        'getFlights': function(query, fromId, toId) {
            return $http({
                url: SERVER_URL + '/flights',
                method: 'GET',
                params: {
                    'v': '2',
                    'locale': 'en',
                    'flyFrom': fromId,
                    'to': toId,
                    'dateFrom': moment(query.departureDatePicker.dt).format('DD/MM/YYYY'),
                    'dateTo': moment(query.departureDatePicker.dt).format('DD/MM/YYYY'),
                    'typeFlight': query.isReturn ? 'return' : 'oneway',
                    'returnFrom': query.isReturn ? moment(query.returnDatePicker.dt).format('DD/MM/YYYY') : '',
                    'returnTo': query.isReturn ? moment(query.returnDatePicker.dt).format('DD/MM/YYYY') : ''
                }
            }).then(function(response) {
                return response.data.data;
            });
        }
    };
});
