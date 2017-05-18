(function() {

    'use strict';

    angular.module('app', ['ngSanitize', 'ngAnimate', 'ngAria', 'ngMaterial', 'ui.router', 'duScroll']).config(function($mdThemingProvider, $stateProvider, $urlRouterProvider, $sceDelegateProvider) {

        $sceDelegateProvider.resourceUrlWhitelist(['self', 'https://www.youtube.com/**', 'https://api.petfinder.com/**']);

        $mdThemingProvider.theme('default')
            .primaryPalette('amber')
            .accentPalette('blue-grey')
            .backgroundPalette('grey', {'default': '200'});

        $mdThemingProvider.theme('dark-teal')
            .primaryPalette('teal')
            .accentPalette('cyan')
            .backgroundPalette('teal').dark();

        $mdThemingProvider.theme("success-toast");

        $urlRouterProvider.otherwise('/dogs');

        $stateProvider
        .state('index', {
            url: '/dogs',
            controller: 'dogsCtrl as vm',
            templateUrl: 'templates/home.html',
        })
        .state('breeds', {
            url: '/dogs/breeds/:letter',
            params: {
                letter: {
                    squash: false
                }
            },
            views: {
                '': { 
                    controller: 'breedsCtrl as vm',
                    templateUrl: 'templates/breeds.html'
                },
                'card@breeds': { 
                    templateUrl: 'templates/breeds-card.html'
                }
            }
        })
        .state('filtered', {
            url: '/dogs/filtered',
            controller: 'filteredCtrl as vm',
            templateUrl: 'templates/filtered.html',
        })
        .state('detail', {
            url: '/dogs/detail',
            params: {
                id: null,
                breed: null
            },
            controller: 'dogDetailCtrl as vm',
            templateUrl: 'templates/dog-detail.html'
        })
        .state('signin', {
            url: '/dogs/signin',
            controller: 'signInCtrl as vm',
            templateUrl: 'templates/sign-in.html'
        })
        .state('signup', {
            url: '/dogs/signup',
            controller: 'signUpCtrl as vm',
            templateUrl: 'templates/sign-up.html'
        })
        .state('signout', {
            url: '/dogs/signout',
            controller: 'signOutCtrl as vm',
        })
        .state('user', {
            url: '/#/user',
            controller: 'usersCtrl as vm',
            templateUrl: 'templates/sign-in.html'
        })
        .state('admin', {
            url: '/dogs/admin',
            controller: 'adminCtrl as vm',
            templateUrl: 'templates/admin.html'
        })
        .state('account', {
            url: '/dogs/account',
            controller: 'accountCtrl as vm',
            templateUrl: 'templates/account.html'
        })
        .state('account.usercreds', {
            parent: 'account',
            url: '/usercreds',
            controller: 'accountCtrl as vm',
            templateUrl: 'templates/usercreds.html'
        })
        .state('account.favorites', {
            parent: 'account',
            url: '/favorites',
            controller: 'accountCtrl as vm',
            templateUrl: 'templates/compare-favorites.html'
        })
        .state('account.rescues', {
            parent: 'account',
            url: '/rescues',
            controller: 'accountCtrl as vm',
            templateUrl: 'templates/compare-rescues.html'
        })
        .state('bestOf', {
            url: '/bestOf',
            params: {
                list: null
            },
            views: {
                '': { 
                    controller: 'bestOfCtrl as vm',
                    templateUrl: 'templates/best-of.html'
                },
                'card@bestOf': { 
                    templateUrl: 'templates/best-of-card.html'
                }
            }
        })
        .state('shelters', {
            url: '/dogs/shelters',
            params: {
                zip: null
            },
            controller: 'sheltersCtrl as vm',
            templateUrl: 'templates/shelters.html'
        });
    });

})();



(function () {
    'use strict';

    angular
        .module('app')
        .controller('dogsCtrl', function(dogsFactory, sessionService, searchService, locationService, adoptableService, toastService, errorHandlerService, $document, $mdSidenav, $scope, $state) {
            
            var vm = this;
            vm.page = 'Home';
            vm.currentUser = sessionService.getUser();
            vm.letter = 'A';             // This sets up for the breeds page
            vm.hideRescue = false;
            vm.height = window.innerHeight;
            vm.getDogDetail = getDogDetail;
            vm.getShelters = getShelters;
            vm.randomRescue = {};
            vm.getDogDetail = getDogDetail;

            // list of breed value/display objects to set up search box
            searchService.loadBreeds().then(function(results) {
                vm.dbBreeds = results;
            });

            // Set up the back-to-top button
            vm.toTop = function() {
                $document.scrollTopAnimated(0, 1000);
            };

            // Set up the side navigation for smaller screen sizes
            vm.toggleLeft = function() {
                $mdSidenav('left').toggle();
            };

            // Need valid zip code to retrieve a rescue dog from petfinder api
            // If currentUser's zip is unconfirmed, then get zip from user's browser
            // or use a default zip = 20001
            if (!vm.currentUser.zipConfirmed) {
                locationService.getLocation().then(function(result) {
                    vm.currentUser.zip = result;
                    vm.currentUser.zipConfirmed = true;
                    sessionService.setUser(vm.currentUser);
                }, function() {
                    // Use default zip, but don't indicate zip is confirmed
                    vm.currentUser.zip = "20001";
                    sessionService.setUser(vm.currentUser);
                });
            }

            // a zip code is established, so get a rescue dog
            getRandomRescue(vm.currentUser.zip).then(function(rescue) {
                if (Array.isArray(rescue.breeds.breed)) {
                    rescue.breedStr = rescue.breeds.breed[0].$t + ', ' + rescue.breeds.breed[1].$t;
                } else {
                    rescue.breedStr = rescue.breeds.breed.$t;
                }
                vm.randomRescue = rescue;
                $scope.$apply();
            }, function() {
                vm.hideRescue = true;
            });

            // Show the rescue dog 
            vm.showAdoptable = function(event, adoptable) {
               adoptableService.showAdoptable(event, adoptable);
           };

           // Retrieve a random rescue dog from petfinder api
            function getRandomRescue(zip) {
                return new Promise(function(resolve, reject) {
                    dogsFactory.getRandomRescue(zip).then(function(dog) {
                        resolve( dog.data.petfinder.pet );
                    }, function() {
                        reject();
                    });
                });
            }
            
        // Get list of shelters from petfinder api
        function getShelters() {
              if (!vm.currentUser.zipConfirmed) {
                locationService.getZipCode().then(function(zip) {
                    $state.go('shelters', { zip: vm.currentUser.zip }); 
                }, function() {
                    toastService.showToast("You didn't enter a valid zip code.");
                });     
            } else {
                $state.go('shelters', { zip: vm.currentUser.zip }); 
            }
        }

        function getDogDetail(id) {
            $state.go('detail', {id: id, breed: null});
        }

    }); 
})();

(function() {

    'use strict';

    angular
        .module('app')
        .controller('signInCtrl', function(authService, searchService, errorHandlerService, $document, $scope, $http, usersFactory, $mdSidenav, $location, $state) {
            //var _this = this;
            var vm = this;

            vm.emailAddress = '';
            vm.password = '';
            vm.validationErrors = {};
            vm.hasValidationErrors = false;
            vm.signIn = signIn;
            vm.toTop = toTop;
            vm.getDogDetail = getDogDetail;
            vm.height = window.innerHeight;

            // list of breed objects to set up search box
            searchService.loadBreeds().then(function(results) {
                vm.dbBreeds = results;
            });
            
            function signIn() {
                authService.signIn(vm.emailAddress, vm.password).then(
                    function() {
                        $location.path('/');
                    },
                    function(response) {
                        errorHandlerService.handleError(response, displayValidationErrors);
                    });
            }

            function getDogDetail(id) {
               $state.go('detail', {id: id, breed: null});
           }

            function displayValidationErrors(validationErrors) {
                vm.validationErrors = validationErrors.errors;
                vm.hasValidationErrors = true;
            }

            function resetValidationErrors() {
                vm.validationErrors = {};
                vm.hasValidationErrors = false;
            }

            // Set up the back-to-top button
            function toTop() {
                $document.scrollTopAnimated(0, 1000);
            }

        }); // End Controller
})();
(function() {

    'use strict';

    angular
        .module('app')
        .controller('signOutCtrl', function(authService, $location) {
            authService.signOut();
            $location.path('/');
    }); // End Controller
})();
(function() {

    'use strict';

    angular
        .module('app')
        .controller('signUpCtrl', function(usersFactory, authService, searchService, errorHandlerService, $document, $mdSidenav, $location, $state) {

            var vm = this;

            vm.fullName = '';
            vm.emailAddress = '';
            vm.password = '';
            vm.confirmPassword = '';
            vm.validationErrors = {};
            vm.hasValidationErrors = false;
            vm.signUp = signUp;
            vm.toTop = toTop;
            vm.getDogDetail = getDogDetail;
            vm.height = window.innerHeight;

           // list of breed objects to set up search box
            searchService.loadBreeds().then(function(results) {
                vm.dbBreeds = results;
            });

             function signUp() {
                var user = {
                    fullName: vm.fullName,
                    emailAddress: vm.emailAddress,
                    password: vm.password,
                    confirmPassword: vm.confirmPassword
                };

                authService.signUp(user).then(
                    function() {
                        vm.currentUser = user;
                        $location.path('/');
                    },
                    function(response) {
                        errorHandlerService.handleError(response, displayValidationErrors);
                });
            }

            function getDogDetail(id) {
               $state.go('detail', {id: id, breed: null});
            }    

            function displayValidationErrors(validationErrors) {
                vm.validationErrors = validationErrors.errors;
                vm.hasValidationErrors = true;
            }

            function resetValidationErrors() {
                vm.validationErrors = {};
                vm.hasValidationErrors = false;
            }

            // Set up the back-to-top button
            function toTop() {
                $document.scrollTopAnimated(0, 1000);
            }

        }); // End Controller
})();
(function () {
    'use strict';

    angular
        .module('app')
        .controller('breedsCtrl', function(dogsFactory, usersFactory, searchService, sessionService, errorHandlerService, toastService, favoritesService, $document, $stateParams, $mdSidenav, $state) {
            
            var vm = this;
            var pageTemplate = 'Breeds // ';
            vm.currentUser = sessionService.getUser();
            vm.filters = {};
            vm.isBreedsPage = true;
            vm.height = window.innerHeight;
            vm.showBackToTop = true;
            vm.letter = $stateParams.letter;
            vm.getBreedsByLetter = getBreedsByLetter;
            vm.toTop = toTop;
            vm.getDogDetail = getDogDetail;

            // Set up the side navigation for smaller screen sizes
            vm.toggleLeft = function() {
                $mdSidenav('left').toggle();
            };

            // list of breed objects to set up search box
            searchService.loadBreeds().then(function(results) {
                vm.dbBreeds = results;
            });


            vm.alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'W-Z'];

            // User selected a breed to be marked and saved as favorite
            vm.toggleFavorite = function(id, breed) {
                favoritesService.toggleFavorite(id, breed);
            };

            getBreedsByLetter(vm.letter);


            function getBreedsByLetter(letter) {
				vm.letter = letter;
                if (letter === '') {
                    vm.page = pageTemplate + 'All Breeds';
                } else {
                    vm.page = pageTemplate + letter;
                }
                dogsFactory.getBreeds(letter).then(function(dogs) {
                    vm.dogs = dogs.data;
                    // Note which dogs are favorites of user
                    if (vm.currentUser.favorites.length !== 0) {
                        vm.dogs = favoritesService.markFavorites(vm.dogs, vm.currentUser.favorites);
                    }
                });
            }

            // Set up the back-to-top button
            function toTop() {
                $document.scrollTopAnimated(0, 1000);
            }

            function getDogDetail(id) {
               $state.go('detail', {id: id, breed: null});
           }

        });   
})();
          
(function () {
    'use strict';

    angular
        .module('app')
        .controller('filteredCtrl', function(dogsFactory, usersFactory, sessionService, searchService, errorHandlerService, toastService, favoritesService, $document, $state, $mdSidenav) {
            
            var vm = this;
            vm.page = 'Dog Breeds // Filtered';
            vm.currentUser = sessionService.getUser();
            vm.filters = {};
            vm.isFilteredPage = true;
            vm.letter = 'A';
            vm.height = window.innerHeight;

            // list of breed objects to set up search box
            searchService.loadBreeds().then(function(results) {
                vm.dbBreeds = results;
            });

            dogsFactory.getDogs().then(function(dogs) {
                vm.dogs = dogs.data;
                if (vm.currentUser.favorites.length !== 0) {
                    vm.dogs = favoritesService.markFavorites(vm.dogs, vm.currentUser.favorites);
                }
            });

            // Set up the back-to-top button
            vm.toTop = function() {
                $document.scrollTopAnimated(0, 1000);
            };

            // Set up the side navigation for smaller screen sizes
            vm.toggleLeft = function() {
                $mdSidenav('left').toggle();
            };

            // User selected a breed to be marked and saved as favorite
            vm.toggleFavorite = function(id, breed) {
                favoritesService.toggleFavorite(id, breed);
            };

            // Set up the back-to-top button
            vm.toTop = function() {
                $document.scrollTopAnimated(0, 1000);
            };

            // Retrieve dogs from db that fit the filters
            vm.getFilteredDogs = function(filters) {
                dogsFactory.getFilteredDogs(filters).then(function(dogs) {
                    vm.dogs = dogs.data;
                    // Mark dogs that are among the user's favorites
                    if (vm.currentUser.favorites.length !== 0) {
                        favoritesService.markFavorites(vm.dogs, vm.currentUser.favorites);
                    }
                });
            };

           // Clear all filters and display all dogs in db
           vm.clearFilters = function() {
               vm.filters = {};
               dogsFactory.getDogs().then(function(dogs) {
                    vm.dogs = dogs.data;
                    if (vm.currentUser.favorites.length !== 0) {
                        favoritesService.markFavorites(vm.dogs, vm.currentUser.favorites);
                    }
                });
           };

            vm.getDogDetail = function(id) {
               $state.go('detail', {id: id, breed: null});
           };

        });   
})();
           
(function () {
    'use strict';

    angular
        .module('app')
        .controller('adminCtrl', function(dogsFactory, usersFactory, searchService, sessionService,  errorHandlerService, toastService, $document, $scope, $http, $state, $mdSidenav, $mdDialog) {
            
            var vm = this;
            vm.page = 'Site Admin';
            vm.currentUser = sessionService.getUser();
            vm.users = [];
            vm.favorites = [];
            vm.energyLevel = ['Low', 'Medium', 'High'];
            vm.groomLevel = ['Low', 'Medium', 'High'];
            vm.exercise = ['Low', 'Medium', 'High'];
            vm.size = ['Small', 'Medium', 'Large'];
            vm.shedding = ['No', 'Low', 'Average', 'Profuse'];
            vm.function = ['Companion', 'Guard', 'Hunting', 'Herding', 'Working', 'Sled'];
            vm.type = ['Bichon', 'Terrier', 'Hound', 'Toy', 'Shepherd', 'Spaniel', 'Retriever', 'Spitz'];
            vm.sort = "favorites.";
            vm.showForm = false;
            vm.showUserList = false;
            vm.showUserFavs = false;
            vm.editing = false;
            vm.validationErrors = {};
            vm.hasValidationErrors = false;
            vm.showBackToTop = true;
            vm.getDogDetail = getDogDetail;

             // list of breed value/display objects to set up search box
            searchService.loadBreeds().then(function(results) {
                vm.dbBreeds = results;
            });

            // Set up the side navigation for smaller screen sizes
            vm.toggleLeft = function() {
                $mdSidenav('left').toggle();
            };

            // list of breed objects to set up search box
            searchService.loadBreeds().then(function(results) {
                vm.dbBreeds = results;
            });

            // Scrape breed info from AKC website and show it on the editing form
            vm.getBreedInfo = function(breed) {
                vm.showForm = true;
                vm.showUserFavs = vm.showUserList = vm.editing = false;
                dogsFactory.getDogInfo(breed).then(function(dog) {
                    vm.dog = dog;
                    vm.dog.breed = breed;
                    $scope.$apply();
                },
                    function(response) {
                        errorHandlerService.handleError(response, displayValidationErrors);
                });
            };

            // Get record from db and show it on the form to edit
            vm.getDog = function(id) {
                vm.showForm = true;
                vm.editing = true;
                vm.usersFavs = vm.showUserList = false;
                dogsFactory.getDogToEdit(id).then(function(dog) {
                    vm.dog = dog.data;
                });
            };

            vm.showEmptyForm = function() {
                vm.showForm = true;
                vm.editing = vm.usersFavs = vm.showUserList = false;
            };

            // Save new dog to database
            vm.saveDog = function(dog) {
                vm.hasValidationErrors = false;
                dogsFactory.saveDog(dog).then(function() {
                    toastService.showToast(dog.breed + ' has been saved to the database.');
                    vm.showForm = false;
                    vm.dog = {};
                },
                    function(response) {
                        errorHandlerService.handleError(response, displayValidationErrors);
                });
            };

            // Update dog in database 
            vm.saveEdit = function(dog) {
                vm.hasValidationErrors = false;
                //check to make sure all required fields exist
                if( dog.breed && dog.energyLevel && 
                    dog.size && dog.shortDesc && 
                    dog.club && dog.clubURL && 
                    dog.grooming && dog.groomIcon && 
                    dog.exercise && dog.exerciseIcon && dog.health ) {

                    dogsFactory.saveEdit(dog).then(function(dog) {
                        toastService.showToast(dog.breed + ' has been saved to the database.');
                        vm.showForm = false;
                        vm.editing = false;
                        vm.dog = dog.data;
                    },
                        function(response) {
                            errorHandlerService.handleError(response, displayValidationErrors);
                    });
                // Fields are missing
                } else {
                    var errorMessages = {
                        message: 'Validation Failed',
                        errors: {}
                    };
                    //errorMessages.status = 400;
                    errorMessages.errors['Missing Fields'] = [{
                        code: 400,
                        message: 'Fields highlighted in red must not be blank.'
                    }];
                    displayValidationErrors(errorMessages);                                        
                }
            };

            // Delete dog from database after confirming deletion
            vm.deleteDog = function(ev, dog) {
                 var confirm = $mdDialog.confirm()
                    .title('Warning: you are about to delete...')
                    .textContent('the ' + dog.breed + 'breed.')
                    .ariaLabel('Delete a breed')
                    .targetEvent(ev)
                    .ok('Ok to delete')
                    .cancel('Cancel');

                $mdDialog.show(confirm).then(function() {
                    dogsFactory.deleteDog(dog).then(function() {
                        toastService.showToast(dog.breed + ' has been deleted.');
                        vm.showForm = false;
                        vm.editing = false;
                        vm.dog = {};
                    });
                });
            };

            // Create a JSON file containing all dogs in database 
            vm.createDogJSONFile = function() {
                dogsFactory.postDogs().then(function(fileName) {
                    vm.dogFileName = fileName.data;
                    $scope.$apply();
                },
                    function(response) {
                        errorHandlerService.handleError(response, displayValidationErrors);
                });
            };

            // Create a JSON file containing all users in database
            vm.createUserJSONFile = function() {
                usersFactory.postUsers().then(function(fileName) {
                    vm.userFileName = fileName.data;
                    $scope.$apply();
                },
                    function(response) {
                        errorHandlerService.handleError(response, displayValidationErrors);
                });
            };

            // Display all users on screen
            vm.listUsers = function() {
                vm.showUserList = true;
                vm.showForm = vm.showUserFavs = vm.editing = false;
                usersFactory.getUsers().then(function(users) {
                    vm.users = users.data;
                    vm.toTop();
                }, function() {
                    toastService.showToast('Unable to retrieve users.');
                });
            };

            // Show all favorites selected by users
            vm.showFavorites = function() {
                var tempFavs = {};
                    usersFactory.getUsers().then(function(users) {
                        vm.users = users.data;
                        // Compile the counts of favorite breeds
                        for (var i = 0; i < vm.users.length; i++) {
                            for (var j = 0; j < vm.users[i].favorites.length; j++) {
                                var breed = vm.users[i].favorites[j].breed;
                                if (tempFavs.hasOwnProperty(breed)) {
                                    tempFavs[breed] += 1;
                                } else {
                                    tempFavs[breed] = 1;
                                }
                            }
                        }
                        // Create the object to use in displaying info
                        for (var key in tempFavs) {
                            vm.favorites.push({breed: key, count: tempFavs[key]});
                        }
                        vm.showUserFavs = true;
                        vm.showForm = vm.showUserList = vm.editing = false;
                        vm.toTop();
                    });
            };

            // This enables dynamically sorting the favorites list by name or count
            vm.dynamicOrder = function(dogs) {
                var order = 0;
                order = dogs[vm.sort];
                return order;
            };

            // Delete user from database, but first check to make sure administrator is currentUser
            vm.deleteUser = function(ev, user) {
                if ( !vm.currentUser.isAdmin ) {
                    toastService.showToast('You are unauthorized to delete a user.');
                } else {
                    var confirm = $mdDialog.confirm()
                        .title('Warning: you are about to delete...')
                        .textContent(user.fullName + '.')
                        .ariaLabel('Delete a user')
                        .targetEvent(ev)
                        .ok('Ok to delete')
                        .cancel('Cancel');

                    $mdDialog.show(confirm).then(function() {
                        usersFactory.deleteUser(user).then(function() {
                            toastService.showToast(user.fullName + ' has been deleted.');
                            vm.listUsers();
                        }, function(response) {
                            errorHandlerService.handleError(response, displayValidationErrors);
                        });
                    });
                }
            };

            // Cancel out of editing
            vm.cancel = function() {
                vm.editing = false; 
                vm.showForm = false;
                vm.dog = {};
                resetValidationErrors();
            };

            // Set up the back-to-top button
            vm.toTop = function() {
                $document.scrollTopAnimated(0, 1000);
            };

            function getDogDetail(id) {
               $state.go('detail', {id: id, breed: null});
           }

            function displayValidationErrors(validationErrors) {
                vm.validationErrors = validationErrors.errors;
                vm.hasValidationErrors = true;
            }

            function resetValidationErrors() {
                vm.validationErrors = {};
                vm.hasValidationErrors = false;
            }


        });
})();

(function () {
    'use strict';

    angular
        .module('app')
        .controller('dogDetailCtrl', function(dogsFactory, usersFactory, sessionService, errorHandlerService, toastService, searchService, locationService, adoptableService, favoritesService, $document, $sce, $scope, $http, $mdDialog, $mdSidenav, $stateParams, $state) {

            var vm = this;
            vm.currentUser = sessionService.getUser();
            vm.adoptables = [];
            vm.videos = [];
            vm.noRescues = false;
            vm.haveRescues = false;
            vm.height = window.innerHeight;

            // list of breed objects to set up search box
            searchService.loadBreeds().then(function(results) {
                vm.dbBreeds = results;
            });

            // Get dog from db by ID
            function getDog(id) {
                return new Promise(function(resolve, reject) {
                    dogsFactory.getDog(id).then(function(dog) {
                        console.log('back from factory, dog: ', dog);
                        dog = dog.data[0];
                        // Check to see if this dog is among the user's favorites
                        if (vm.currentUser.favorites.length !== 0) {
                            // favoritesService will return an array
                            var dogArr = favoritesService.markFavorites(dog, vm.currentUser.favorites);
                            dog = dogArr[0];   
                        }                     
                        console.log('dog: ', dog);
                        resolve(dog);
                    }, function() {
                        toastService('Unable to get dog info.');
                        reject();
                    });
                });
            }

            // Get dog from db by breed name
            function getDogByBreed(breed) {
                return new Promise(function(resolve, reject) {
                    dogsFactory.getDogByBreed(breed).then(function(dog) {
                        dog = dog.data[0];
                        // Check to see if this dog is among the user's favorites
                        if (vm.currentUser.favorites.length !== 0) {
                            // favoritesService will return an array
                            var dogArr = favoritesService.markFavorites(dog, vm.currentUser.favorites);
                            dog = dogArr[0];  
                        }
                        console.log('dog: ', dog);
                        resolve(dog);
                    }, function() {
                        toastService('Unable to get dog info.');
                        reject();
                    });
                });
            }

             // Get videos from youtube api relating to this dog breed
           function getVideos(breed) {
                dogsFactory.getVideos(breed).then(function(videos) {
                    vm.videos = videos.data.items;
                }, function() {
                    toastService('Found no videos for this breed.');
                });   
            }

            // Gets dogs from petfinder api 
            // Called from getAdoptables()
             function retrieveDogs(breed) {
                dogsFactory.getAdoptables(breed, vm.currentUser.zip).then(function(adoptables) {
                    if (adoptables.length === 0) {
                        vm.noRescues = true;
                    } else {
                        vm.haveRescues = true;
                        vm.adoptables = adoptables;
                        $scope.$apply();
                    }
                }, function() {
                    vm.adoptables = [];
                    vm.noRescues = true;
                    vm.haveRescues = false;
                    $scope.$apply();
                });
            }


            // Get dog by ID or by breed name
            if ($stateParams.id) {
                getDog($stateParams.id).then(function(dog) {
                    console.log('dog: ', dog);
                    vm.dog = dog;
                    vm.page = 'Breed // ' + vm.dog.breed;
                    getVideos(vm.dog.breed);
                });
            } else if ($stateParams.breed) {
                getDogByBreed($stateParams.breed).then(function(dog) {
                    vm.dog = dog;
                    vm.page = 'Breed // ' + vm.dog.breed;
                    getVideos(vm.dog.breed);
                });
            }

            // User selected a breed to be marked and saved as favorite
            vm.toggleFavorite = function(id, breed) {
                favoritesService.toggleFavorite(id, breed);
                if (vm.dog.favClass === 'paw fav-on') {
                    vm.dog.favClass = 'paw fav-off';
                } else {
                    vm.dog.favClass = 'paw fav-on';
                }
            };

            // Set up the side navigation for smaller screen sizes
            vm.toggleLeft = function() {
                $mdSidenav('left').toggle();
            };

            // Returns you-tube source for embedded iframe video
            vm.getIframeSrc = function(videoId) {
                return 'https://www.youtube.com/embed/' + videoId;
            };

           // Enables user to see the standard for this breed
           vm.showStandard = function(event, dog) {
               var iframeSrc = $sce.trustAsResourceUrl(dog.breedStandard);

               $mdDialog.show({
                controller: ['$scope', 'src', function($scope, src) {
                    $scope.src = src;
                    $scope.closeDialog = function() {
                        $mdDialog.hide();
                    };
                }],
                template: 
                    '<md-dialog class="std-dialog" aria-label="List dialog" flex="80">' +
                    '   <md-dialog-content>' +
                    '       <iframe src="{{ src }}" frameborder="0" width="100%" height="100%"></iframe>' +
                    '   </md-dialog-content>' +
                    '   <md-dialog-actions>' +
                    '       <md-button ng-click="closeDialog()" class="md-primary">' +
                    '          Close Dialog' +
                    '       </md-button>' +
                    '   </md-dialog-actions>' +
                    '</md-dialog>', 
                locals: { src: iframeSrc },
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose: true,
                escapeToClose: true
               });
           };

           // Fetches adoptable dogs from petfinder api
           // Needs zip code to function 
           vm.getAdoptables = function(breed) {
                if (!vm.currentUser.zipConfirmed) {
                    locationService.getLocation().then(function(result) {
                        vm.currentUser.zip = result;
                        vm.currentUser.zipConfirmed = true;
                        sessionService.setUser(vm.currentUser);
                        retrieveDogs(breed, vm.currentUser.zip);
                    }, function() {
                        locationService.getZipCode().then(function(result) {
                            vm.currentUser.zip = result;
                            vm.currentUser.zipConfirmed = true;
                            sessionService.setUser(vm.currentUser);
                            retrieveDogs(breed, vm.currentUser.zip);
                        }, function() {
                            // Use default
                            vm.currentUser.zip = "20001";
                            sessionService.setUser(vm.currentUser);
                            retrieveDogs(breed, vm.currentUser.zip); 
                        });
                    });
                } else {
                    retrieveDogs(breed, vm.currentUser.zip);
                }
            };

            // Enables user to enter another zip code for the petfinder search
            vm.getNewZipCode = function(breed) {
                locationService.getZipCode().then(function(zip) {
                    vm.currentUser.zip = zip;
                    vm.currentUser.zipConfirmed = true;
                    sessionService.setUser(vm.currentUser);
                    retrieveDogs(breed, vm.currentUser.zip);
                });
            };

            // Enables user to get the detail on an adoptable dog
           vm.showAdoptable = function (event, adoptable) {
               adoptableService.showAdoptable(event, adoptable);
           };

            vm.getDogDetail = function(id) {
               $state.go('detail', {id: id, breed: null});
           };

            // Set up the back-to-top button
            vm.toTop = function() {
                $document.scrollTopAnimated(0, 1000);
            };
    });
})();

             

    
(function () {
    'use strict';

    angular
        .module('app')
        .controller('accountCtrl', function(dogsFactory, usersFactory, searchService, sessionService,  errorHandlerService, toastService, $mdSidenav, $state, $document) {
            
            var vm = this;
            vm.page = 'Account';
            vm.currentUser = sessionService.getUser();
            vm.editPassword = false;
            vm.editFullName = false;
            vm.editEmailAddress = false;
            vm.password = '';
            vm.confirmPassword = '';
            vm.validationErrors = {};
            vm.hasValidationErrors = false;
            vm.favorites = vm.currentUser.favorites;
            vm.sort = 'fav.breed';
            vm.count = 0;
            vm.height = window.innerHeight;
            vm.getDogDetail = getDogDetail;

            // list of breed value/display objects to set up search box
            searchService.loadBreeds().then(function(results) {
                vm.dbBreeds = results;
            });

            // Set up the side navigation for smaller screen sizes
            vm.toggleLeft = function() {
                $mdSidenav('left').toggle();
            };

            // If user has favorites, get them
            if (vm.currentUser.favorites.length !== 0) {
                dogsFactory.getFavorites(vm.currentUser.favorites).then(function(dogs) {
                    if (dogs) {
                        vm.favDogs = dogs.data;
                    } else {
                        vm.favDogs = {};
                    } 
                });
            }
    
            // If user has rescues saved, get them and format them for display
            if (vm.currentUser.rescues.length !== 0) {
                dogsFactory.getRescues( vm.currentUser.rescues ).then(function(dogs) {
                    if (dogs.length !== 0) {
                        var list = [];
                        // Remove empty objects indicating a fail-to-find on Petfinder
                        for( var i = 0; i < dogs.length; i++) {
                            if (dogs[i].data.petfinder.pet) {
                                list.push( dogs[i].data.petfinder.pet );
                            } 
                        }
                        // Remove from user's list any dogs no longer in Petfinder's system
                        if ( list.length < vm.currentUser.rescues.length ) {
                            vm.count++;
                            removeDefunctRescues( list );
                        }
                        // Format fields for display
                        for( i = 0; i < list.length; i++ ) {
                            formatDog(list[i]);
                        }
                        vm.rescueDogs = list;
                    }
                }, function() {
                    toastService('Unable to get rescues at this time.');
                });
            }

            // Set up the back-to-top button
            vm.toTop = function() {
                $document.scrollTopAnimated(0, 1000);
            };

            // This enables dynamically sorting the favorites list by user
            vm.dynamicOrder = function(dogs) {
                var order = 0;
                order = dogs[vm.sort];
                return order;
            };

            vm.openInputField = function(inputElement) {
                vm.fullName='true';
                document.getElementById(inputElement).focus();
            };

            // Updates user's name and/or email
            vm.updateUser = function(key, user) {
                resetValidationErrors();
                vm.currentUser[key] = user[key];
                usersFactory.updateUser(key, vm.currentUser).then(function() {
                    sessionService.setUser(vm.currentUser);
                    vm[key] = false;
                    if (key === 'fullName') {
                        key = 'name';
                    } else if (key === 'emailAddress') {
                        key = 'email address';
                    }
                    toastService.showToast('Your ' + key + ' has been updated');
                }, function(response){
                        errorHandlerService.handleError(response, displayValidationErrors);
                    });         
            };

            // Update user's password
            vm.updatePassword = function(password, confirmPassword) {
                resetValidationErrors();
                // If confirm password and password fields don't match, set up error message
                if (password !== confirmPassword) {
                    var errorMessage = {
                        message: 'Unmatched passwords',
                        errors: [{ 
                            code: 400,
                            message: 'Password and Confirm Password do not match.'
                        }]
                    };
                    var response = {
                        status: 400,
                        data: errorMessage
                    };
                    errorHandlerService.handleError(response, displayValidationErrors);
                // Passwords match => update record
                } else {
                    vm.currentUser.password = password;
                    usersFactory.updatePassword(vm.currentUser).then(function(user) {
                        sessionService.setUser(user);
                        vm.password = false;
                        toastService.showToast('Your password has been updated');
                    }, function(response){
                        errorHandlerService.handleError(response, displayValidationErrors);
                    });
                }
            };

            // Allows user to cancel out of editing their account info
            vm.cancel = function(drawer) {
                vm[drawer] = false;
            };

            // Remove favorite breed from user's list
            vm.deleteFavorite = function(dog) {
                // Need to delete from db and also currentUser
                usersFactory.deleteFavorite(vm.currentUser, dog._id, 'account', 'favorites').then(function() {
                    vm.currentUser.favorites.splice(vm.currentUser.favorites.indexOf(dog._id), 1);
                    var index = -1;
                    // Re-establish vm.favDogs to display on page
                    for (var i = 0; i < vm.favDogs.length; i++) {
                        if (vm.favDogs[i]._id === dog._id) {
                            index = i;
                            i = vm.favDogs.length;
                        }
                    }
                    vm.favDogs.splice(index, 1);
                    // Update currentUser 
                    sessionService.setUser(vm.currentUser);
                });
            };

            // Delete rescue dog from user's saved list
            // Need to delete from db and also currentUser, then update vm.rescueDogs for displaying to page
            vm.deleteRescue = function(dogId, removeFromDisplay ) {
                usersFactory.deleteRescue(dogId, vm.currentUser._id).then(function() {
                    vm.currentUser.rescues.splice(vm.currentUser.rescues.indexOf(dogId), 1);
                    if (removeFromDisplay) {
                        var index = -1;
                        for (var i = 0; i < vm.rescueDogs.length; i++) {
                            if (vm.rescueDogs[i].id.$t === dogId) {
                                index = i;
                                i = vm.rescueDogs.length;
                            }
                        }
                        vm.rescueDogs.splice(index, 1);
                    }
                    sessionService.setUser(vm.currentUser);
                });
            };

            function removeDefunctRescues( list ) {
                var count = 0;
                for (var i = 0; i < list.length; i++ ) {
                    if (vm.currentUser.rescues.indexOf(list[i]) === -1) {
                        count++;
                        vm.deleteRescue(list[i], false);
                    }
                }
                vm.count = count;
            }

            function formatDog(dog) {
                if (dog.status) {
                    var status = dog.status.$t;
                    if (status === 'A') {
                        status = 'Adoptable';
                    } else if (status === 'H') {
                        status = 'Hold';
                    } else if (status === 'P') {
                        status = 'Pending';
                    } else {
                        status = 'Adopted/Removed';
                    }
                    dog.status.$t = status;
                }
                if (dog.lastUpdate) {
                    var index = dog.lastUpdate.$t.indexOf('T');
                    if (index != -1) {
                        dog.lastUpdate.$t = dog.lastUpdate.$t.slice(0, index);
                    }
                }
                if (dog.options.option) {
                    dog.hasOptions = true;
                    if (!Array.isArray(dog.options.option)) {
                        // There is only one option stored as a string.
                        // Change format to be an Array
                        var obj = {
                            $t: dog.options.option.$t
                        };
                        dog.options.option = [];
                        dog.options.option.push(obj);
                    }
                    for (var j = 0; j < dog.options.option.length; j++) {
                        if (dog.options.option[j].$t === 'housetrained') {
                            dog.options.option[j].$t = 'House-trained';
                        } else if (dog.options.option[j].$t === 'specialNeeds') {
                            dog.options.option[j].$t = 'Special needs';
                        } else if (dog.options.option[j].$t === 'noCats') {
                            dog.options.option[j].$t = 'Not good with cats';
                        } else if (dog.options.option[j].$t === 'noDogs') {
                            dog.options.option[j].$t = 'Not good with other dogs';
                        } else if (dog.options.option[j].$t === 'altered') {
                            dog.options.option[j].$t = 'Has been spayed/neutered';
                        } else if (dog.options.option[j].$t === 'hasShots') {
                            dog.options.option[j].$t = 'Vaccinations are up-to-date';
                        }
                    }
                } else {
                    dog.hasOptions = false;
                }
                if (dog.media.photos.photo) {
                    var photoArray = [];
                    var mainPhoto = '';
                    for (var k = 0; k < dog.media.photos.photo.length; k++) {
                        if (dog.media.photos.photo[k]['@size'] === 'x') {
                            if (mainPhoto === '') {
                                mainPhoto = dog.media.photos.photo[k].$t;
                            } else {
                                photoArray.push(dog.media.photos.photo[k].$t);
                            }
                        }
                    }
                    dog.mainPhoto = mainPhoto;
                    dog.photos = photoArray;
                }
            }

            function getDogDetail(id) {
                $state.go('detail', {id: id, breed: null});
            }


            // Error Handling
            function displayValidationErrors(validationErrors) {
                vm.validationErrors = validationErrors.errors;
                vm.hasValidationErrors = true;
            }

            // Error Handling
            function resetValidationErrors() {
                vm.validationErrors = {};
                vm.hasValidationErrors = false;
            }

    });
})();
(function () {
    'use strict';

    angular
        .module('app')
        .controller('sheltersCtrl', function(dogsFactory, sessionService, searchService, locationService, adoptableService, toastService, errorHandlerService, $document, $scope, $mdDialog, $stateParams, $state) {
            
            var vm = this;
            vm.page = 'Shelters';
            vm.zip = $stateParams.zip;
            vm.currentUser = sessionService.getUser();
            vm.shelters = [];
            vm.showBackToTop = true;
            vm.getshelters = getShelters;
            vm.getShelterPets = getShelterPets;
            vm.getDogDetail = getDogDetail;
            vm.getNewZipCode = getNewZipCode;
            vm.toTop = toTop;
            vm.height = window.innerHeight;
            vm.getDogDetail = getDogDetail;

             // list of breed objects to set up search box
            searchService.loadBreeds().then(function(results) {
                vm.dbBreeds = results;
            });

            // Retrieve shelters from petfinder api
            getShelters(vm.currentUser.zip).then(function(shelters) {
                vm.shelters = shelters;
                $scope.$apply();
            }, function() {
                vm.shelters = [];
                $scope.$apply();
            });


           function getShelters(zip) {
               return new Promise(function(resolve, reject) {
                    dogsFactory.getShelters(zip).then(function(shelters) {
                        if (shelters.data.petfinder.shelters) {
                            resolve( shelters.data.petfinder.shelters.shelter );
                        } else {
                            reject();
                        }
                    }, function() {
                        toastService.showToast("Sorry, we're unable to find shelters at this time.");
                        reject();
                    });
                });
           }

           // Retrieve pets for a shelter from petfinder api
            function getShelterPets(event, shelterName, shelterId) {
                dogsFactory.getShelterPets(shelterId).then(function(pets) {
                    var animals = pets.data.petfinder.pets.pet;
                    showAnimals(event, shelterName, animals);  
                }, function() {
                    toastService.showToast("Sorry, we're unable to get pets at this time.");
                });
            }

            // Show animals that are associated with a shelter
            function showAnimals(event, shelterName, animals) {
               $mdDialog.show({
                controller: ['$scope', 'shelterName', 'animals', function($scope, shelterName, animals) {
                    $scope.animals = animals;
                    $scope.shelterName = shelterName;
                    $scope.closeDialog = function() {
                        $mdDialog.hide();
                    };
                }],
                template: 
                    '<md-dialog class="std-dialog" aria-label="List dialog" flex="40">' +
                    '   <md-dialog-content layout-padding layout-margin layout-align="center center">' +
                    '       <div class="md-title">Animals at {{ shelterName }}</div>' +
                    '       <span ng-if="!animals">This shelter has no animals listed with Petfinder.com.</span>' +
                    '       <table ng-if="animals" class="fav-table">' +
                    '           <tr>' +
                    '               <th></th>' +
                    '               <th>Animal</th>' +
                    '               <th>Breeds</th>' +
                    '               <th>Name</th>' +
                    '               <th>Age</th>' +
                    '               <th>Sex</th>' +
                    '               <th>Size</th>' +
                    '           </tr>' +
                    '           <tr ng-repeat="animal in animals">' +
                    '               <td><img ng-src="{{animal.media.photos.photo[0].$t}}"></td>' +
                    '               <td>{{ animal.animal.$t }}</td>' +
                    '               <td class="center">' +
                    '                   <span ng-if="animal.breeds.breed.$t">{{ animal.breeds.breed.$t }}</span>' +
                    '                   <span ng-if="animal.breeds.breed[0].$t">{{ animal.breeds.breed[0].$t }}</span>' +
                    '                   <span ng-if="animal.breeds.breed[1].$t">, {{ animal.breeds.breed[1].$t }}</span>' +
                    '               </td>' +
                    '               <td class="center">{{ animal.name.$t }}</td>' +
                    '               <td class="center">{{ animal.age.$t }}</td>' +
                    '               <td class="center">{{ animal.sex.$t }}</td>' +
                    '               <td class="center">{{ animal.size.$t }}</td>' +
                    '           </tr>' +
                    '       </table>' +
                    '   </md-dialog-content>' +
                    '   <md-dialog-actions>' +
                    '       <md-button ng-click="closeDialog()" class="md-primary">' +
                    '          Close Dialog' +
                    '       </md-button>' +
                    '   </md-dialog-actions>' +
                    '</md-dialog>', 
                locals: { shelterName: shelterName, animals: animals },
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose: true,
                escapeToClose: true
               });
           }

           // Enable user to enter a different zip code
           function getNewZipCode() {
               locationService.getZipCode().then(function(zip) {
                   getShelters(zip).then(function(shelters) {
                        vm.shelters = shelters;
                        $scope.$apply();
                    }, function() {
                        vm.shelters = [];
                        $scope.$apply();
                    });
               });
           }

            function getDogDetail(id) {
               $state.go('detail', {id: id, breed: null});
           }

           // Set up the back-to-top button
            function toTop() {
                $document.scrollTopAnimated(0, 1000);
            }

        });
})();
(function () {
    'use strict';

    angular
        .module('app')
        .controller('bestOfCtrl', function(dogsFactory, usersFactory, searchService, sessionService,  errorHandlerService, toastService, favoritesService, $mdSidenav, $state, $document, $stateParams) {

        var vm = this;
        vm.page = 'Best Dogs';
        vm.listType = $stateParams.list;
        vm.currentUser = sessionService.getUser();
        vm.getBestOf = getBestOf;
        vm.toTop = toTop;
        vm.showBackToTop = true;
        vm.height = window.innerHeight;
        vm.getDogDetail = getDogDetail;

        // list of breed objects to set up search box
        searchService.loadBreeds().then(function(results) {
            vm.dbBreeds = results;
        });

        // Set up the side navigation for smaller screen sizes
        vm.toggleLeft = function() {
            $mdSidenav('left').toggle();
        };

        // Get the dogs that meet the specific best-of parameter
        if (vm.listType) {
            getBestOf(vm.listType).then(function(dogs) {
                vm.dogs = dogs.data;
                if (vm.currentUser.favorites.length !== 0) {
                    vm.dogs = favoritesService.markFavorites(vm.dogs, vm.currentUser.favorites);
                }
            });
        }

        // Get list selected from secondary menu
        vm.getList = function( list ) {
            vm.listType = list;
            dogsFactory.getBestOfDogs(list).then(function(dogs) {
                vm.dogs = dogs.data;
                if (vm.currentUser.favorites.length !== 0) {
                    vm.dogs = favoritesService.markFavorites(vm.dogs, vm.currentUser.favorites);
                }
            });
        };

        // User selected a breed to be marked and saved as favorite
        vm.toggleFavorite = function(id, breed) {
            favoritesService.toggleFavorite(id, breed);
        };

        function getBestOf( list ) {
            return new Promise(function(resolve, reject) {
                dogsFactory.getBestOfDogs(list).then(function(dogs) {
                    vm.dogs = dogs.data;
                    resolve(dogs);
                }, function() {
                    reject();
                });
            });
        }

        function getDogDetail(id) {
            $state.go('detail', {id: id, breed: null});
        }

        // Set up the back-to-top button
            function toTop() {
                $document.scrollTopAnimated(0, 1000);
            }
    });
})();
(function() {
    'use strict';

    angular
        .module("app")
        .factory('dogsFactory', function($http, $sce, $q) {

            function getDogs() {
                return $http.get('api/dogs');
            }

            function postDogs() {
                return $http.post('api/dogs/file');
            }

            function getDog(id) {
                return $http.get('api/dogs/detail?id=' + id);
            }

            function getDogByBreed(breed) {   
                return $http.get('api/dogs/detail?breed=' + breed);
            }

            function getBestOfDogs(list) {   
                return $http.get('api/dogs/bestOf?list=' + list);
            }

            function getVideos(breed) {
                var url = "https://www.googleapis.com/youtube/v3/search?key=AIzaSyC9fO8vW7pPyIRlafuzg9O4T-sm5TJ3kPo&part=snippet&q=" + breed + "&maxResults=3";
                return $http.get(url);
            }

            function getFavorites(idArray) {
                var url = 'api/dogs/account/favorites';
                if (idArray.length !== 0) {
                    url += '?';
                    var last = idArray.length - 1;
                    for( var i =0; i < idArray.length; i++) {
                        url += 'id' + i + '=' + idArray[i];
                        if (i !== last) {
                            url += '&';
                        }
                    }
                    return $http.get(url);            
                }
            }

            function getRescues(idArray) {
                //var defer = $q.defer();
                var promises = idArray.map( function( id ) {
                    var url = 'https://api.petfinder.com/pet.get?key=d93ef8fff402f8bfe597a1e1613c9b4b&id=' + id + '&format=json&callback=JSON_CALLBACK';
                    return $http.jsonp(url);
                });
                return $q.all(promises);
            }

            function getRandomRescue(zip) {
                 var url = 'https://api.petfinder.com/pet.getRandom?key=d93ef8fff402f8bfe597a1e1613c9b4b&animal=dog&location=' + zip + '&output=full&format=json&callback=JSON_CALLBACK';
                return $http.jsonp(url);
            }

            function getShelters(zip) {
                var url = 'https://api.petfinder.com/shelter.find?key=d93ef8fff402f8bfe597a1e1613c9b4b&animal=dog&location=' + zip + '&format=json&callback=JSON_CALLBACK';
                return $http.jsonp(url);
            }

            function getShelterPets(id) {
                var url = 'https://api.petfinder.com/shelter.getPets?key=d93ef8fff402f8bfe597a1e1613c9b4b&id=' + id + '&format=json&callback=JSON_CALLBACK';
                return $http.jsonp(url);
            }

            function getDogToEdit(id) {          
                return $http.get('api/dogs/admin/' + id);
            }

            function saveDog(dog) {
                return $http.post('api/dogs', dog);
            }

            function saveEdit(dog) {
                return $http.put('api/dogs/admin', dog);
            }

            function deleteDog(dog) {
                return $http.delete('api/dogs/admin/' + dog._id);
            }

            function getBreeds(letter) {
                return $http.get('api/dogs/breeds/' + letter);
            }


            function getBreedsFromPetfinder() {
                var url = 'https://api.petfinder.com/breed.list?key=d93ef8fff402f8bfe597a1e1613c9b4b&animal=dog&format=json&callback=JSON_CALLBACK';

                $http.jsonp(url).success(function(breedlist) {
                    return breedlist.petfinder.breeds.breed; 
                });
            } 

            function getDogInfo(breed) {
                return new Promise(function(resolve, reject) {
                    var dog = {};
                    getBreedHtml(breed).then(function(html) {
                        dog = getBreedInfoFromHtml(html);
                        resolve(dog);
                    }, function(err) {
                        err.message = ("Couldn't retrieve html for " + breed);
                        reject(err);
                    });
                });  
            }

            function getBreedHtml(breed) {
                return new Promise(function(resolve, reject) {
                    if (breed == null || breed == '') {
                        reject();
                    } else {
                        var breed1 = breed.replace(' ', '-');
                        var breed2 = breed1.replace(' ', '-');
                        var breed3 = breed2.replace(' ', '-');
                        var url = 'https://www.akc.org/dog-breeds/' + breed3 + '/';
                        resolve( $http.get(url) );
                    }
                });
            }

            function getFilteredDogs(filters) {
                var filterQry = '?';
                for (var key in filters) {
                    if ( filters[key] !== "" ) {
                        filterQry += key + '=' + filters[key] + '&';
                    }
                }
                if (filterQry.lastIndexOf('&') === filterQry.length-1) {
                    filterQry = filterQry.substr(0, filterQry.length-1);
                }
                return $http.get('api/dogs/filtered' + filterQry);
            }

            function getAdoptables(breed, zip) {
                return new Promise(function(resolve, reject) {   
                    var url = 'https://api.petfinder.com/pet.find?key=d93ef8fff402f8bfe597a1e1613c9b4b&animal=dog&breed=' + breed + '&location=' + zip + '&format=json&callback=JSON_CALLBACK';

                    $http.jsonp(url).then(function(adoptables) {
                        if (adoptables.data.petfinder.pets.pet) {
                            var petfinderDogs = adoptables.data.petfinder.pets.pet;
                            var dogs = [];
                            var castoffDogs = [];
                            var lcName;
                            // move dogs that are primarily the desired breed to the top of the list
                            for (var i = 0; i < petfinderDogs.length; i++) {
                                lcName = petfinderDogs[i].name.$t.toLowerCase();
                                if (!lcName.includes('pending')) {
                                    if (Array.isArray(petfinderDogs[i].breeds.breed)) {
                                        // Save if first breed listed in array matches our breed 
                                        if (petfinderDogs[i].breeds.breed[0].$t === breed) {
                                            dogs.push(petfinderDogs[i]);
                                        } else {
                                            castoffDogs.push(petfinderDogs[i]);
                                        }
                                    } else {
                                        // Dog has only one breed listed, so keep the dog
                                        dogs.push(petfinderDogs[i]);
                                    }
                                }
                            }
                            // Fill array so that there are ten dogs to show
                            if (dogs.length < 10) {
                                for ( i = dogs.length; i < 10; i++) {
                                    dogs.push(castoffDogs[i]);
                                }
                            }
                            resolve( dogs );
                        } else {
                            reject();
                        }
                    }, function() {
                        reject();
                    });
                });
            }

            function getBreedInfoFromHtml(html) {
                var dog = {};  
                var data = html.data;
                var index = data.indexOf('<div class="index-only">') + 24;
                data = data.slice(index).trim();
                index = data.indexOf('<img src="') + 10;
                data = data.slice(index).trim();
                index = data.indexOf('"');
                dog.imageURL = data.substring(0, index).trim();

                index = data.indexOf('<span class="energy_levels">') + 28;
                data = data.slice(index).trim();
                index = data.indexOf(' ');
                dog.energyLevel = data.substring(0, index).trim();
                dog.energyLevel = capitalize(dog.energyLevel);

                index = data.indexOf('<span class="size"><br />') + 26;
                data = data.slice(index).trim();
                index = data.indexOf(' ');
                dog.size = data.substring(0, index).trim();
                dog.size = capitalize(dog.size);

                index = data.indexOf('<div class="bigrank">') + 21;
                data = data.slice(index).trim();
                index = data.indexOf('<');
                dog.akcRank = data.substring(0, index).trim();

                index = data.indexOf('<span class="info">') + 19;
                data = data.slice(index).trim();
                index = data.indexOf('<');
                dog.shortDesc = data.substring(0, index).trim();

                index = data.indexOf('readonly" name="embed"><iframe src="') + 36;
                data = data.slice(index).trim();
                index = data.indexOf('"');
                dog.breedStandard = data.substring(0, index).trim();

                index = data.indexOf('<br />Grooming</h3>') + 19;
                data = data.slice(index).trim();
                data = data.slice(3);
                index = data.indexOf('</p>');
                dog.grooming = data.substring(0, index).trim();

                index = data.indexOf('<h3>Exercise</h3>') + 17;
                data = data.slice(index).trim();
                data = data.slice(3);
                index = data.indexOf('</p>') ;
                dog.exercise = data.substring(0, index).trim();

                index = data.indexOf('<h3>Health</h3>') + 15;
                data = data.slice(index).trim();
                data = data.slice(3);
                index = data.indexOf('</p>');
                dog.health = data.substring(0, index).trim();

                index = data.indexOf('<h3>National<br />Breed Club</h3>') + 33;
                data = data.slice(index).trim();
                index = data.indexOf('<h2><small>the</small>') + 22;
                data = data.slice(index);
                index = data.indexOf('</h2>');
                dog.club = data.substring(0, index).trim();

                index = data.indexOf('<a target="_blank" href=') + 25;
                data = data.slice(index).trim();
                index = data.indexOf('" class=');
                dog.clubURL = data.substring(0, index).trim();

                return dog;
            }

            function capitalize(str) {
                return str.charAt(0).toUpperCase() + str.slice(1);
            }
            
            return {
                getDogs: getDogs,
                postDogs: postDogs,
                getDog: getDog,
                getDogByBreed: getDogByBreed,
                getBestOfDogs: getBestOfDogs,
                getVideos: getVideos,
                getFavorites: getFavorites,
                saveDog: saveDog,
                saveEdit: saveEdit,
                deleteDog: deleteDog,
                getBreeds: getBreeds,
                getBreedsFromPetfinder: getBreedsFromPetfinder,
                getDogToEdit: getDogToEdit,
                getDogInfo: getDogInfo,
                getFilteredDogs: getFilteredDogs,
                getAdoptables: getAdoptables,
                getRescues: getRescues,
                getRandomRescue: getRandomRescue,
                getShelters: getShelters,
                getShelterPets: getShelterPets
            };
        });
})();
(function() {
    'use strict';

    angular
        .module("app")
        .factory('usersFactory', function($http) {

            function getUsers() {
                return $http.get('api/dogs/users');
            }

            function postUsers() {
                return $http.post('api/users/file');
            }

            function getUser(user) {
                var header = "Basic " + window.btoa(unescape(encodeURIComponent(user.emailAddress + ":" + user.password)));
                return $http.get('api/dogs/signin', {
                    headers: {
                        "Authorization": header
                    }
                });
            }

            function createUser(user) {
                return $http.post('api/dogs/signup', user);
            }

            function updateUser(key, user) {
                if (key === 'fullName') {
                    return $http.put('api/dogs/account/fullName', user);
                } else {
                    return $http.put('api/dogs/account/emailAddress', user);
                }
            }

            function deleteUser(user) {
                return $http.delete('api/dogs/admin/' + user._id);
            }

            function updatePassword(user) {
                return $http.put('api/dogs/account/password', user);
            }

            function lookupUser(user) {
                return $http.get('api/dogs/signup', user);
            }

            function getFavorites() {
                return $http.get('api/dogs/favorites');
            }

            function addFavorite(user, dogId) {
                return $http.put('api/dogs/fav/' + user._id + '/'  + dogId);
            }

            function deleteFavorite(user, dogId) {
                return $http.delete('api/dogs/fav/' + user._id + '/'  + dogId);
            }

            function addRescue(dogId, userId) {
                return $http.put('api/dogs/detail/rescue/' + userId + '/'  + dogId );
            }

            function deleteRescue(dogId, userId) {
                return $http.delete('api/dogs/detail/rescue/' + userId + '/'  + dogId );
            }

            return {
                getUsers: getUsers,
                postUsers: postUsers,
                getUser: getUser, 
                createUser: createUser,
                updateUser: updateUser,
                updatePassword: updatePassword,
                deleteUser: deleteUser,
                lookupUser: lookupUser,
                getFavorites: getFavorites,
                addFavorite: addFavorite,
                deleteFavorite: deleteFavorite,
                addRescue: addRescue,
                deleteRescue: deleteRescue
            };
        });
})();
(function(angular) {

    'use strict';

    angular.module('app')
    .directive('bestOf', function(){
        return {
            templateUrl: 'templates/best-of.html',
            replace: false,
            controller: 'bestOfCtrl'
        };
    })
    .directive('compareFavorites', function(){
        return {
            templateUrl: 'templates/compare-favorites.html',
            replace: false,
            controller: 'accountCtrl'
        };
    })
    .directive('compareRescues', function(){
        return {
            templateUrl: 'templates/compare-rescues.html',
            replace: false,
            controller: 'accountCtrl'
        };
    })
    .directive('dogCard', function(){
        return {
            templateUrl: '/templates/dog-card.html',
            replace: false,
            controller: 'breedsCtrl'
        };
    })
    .directive('dogCardShort', function(){
        return {
            templateUrl: 'templates/dog-card-short.html',
            replace: false,
            controller: 'breedsCtrl'
        };
    })
    .directive('dogForm', function(){
        return {
            templateUrl: 'templates/dog-form.html',
            replace: false,
            controller: 'adminCtrl'
        };
    })
    .directive('footerBar', function(){
        return {
            templateUrl: '/templates/footer.html',
            replace: false
        };
    })
    .directive('elementSize', function () {
        return {
            restrict: 'A',
            link: function (scope, element) {
            element.ready(function () {
                    scope.height = element.prop('clientHeight');
                });
            }
        }; 
    })
    .directive('shelter', function(){
        return {
            templateUrl: '/templates/shelter.html',
            replace: false
        };
    })
    .directive('toolbar', function(){
        return {
            templateUrl: '/templates/toolbar.html',
            replace: false
        };
    })
    .directive('menu', function() {
        return {
            templateUrl: '/templates/menu.html',
            replace: false
        };
    })
    .directive('userFavorites', function(){
        return {
            templateUrl: 'templates/user-favorites.html',
            replace: false,
            controller: 'adminCtrl'
        };
    })
    .directive('userList', function(){
        return {
            templateUrl: 'templates/user-list.html',
            replace: false,
            controller: 'adminCtrl'
        };
    })
    .directive('validationErrors', function() {
        var controller = ['$scope', function($scope) {
            $scope.$watch('errors', function(newValue, oldValue) {
            var errorsToDisplay = [];

            if (newValue) {
                for (var key in newValue) {
                    if (newValue.hasOwnProperty(key)) {
                        errorsToDisplay = errorsToDisplay.concat(newValue[key]);
                    }
                }
            }

            $scope.errorsToDisplay = errorsToDisplay;
            });
        }];

        return {
            restrict: 'E',
            scope: {
            errors: '='
            },
            controller: controller,
                templateUrl: 'templates/validation-errors.html'
            };
    });

})(window.angular);
(function () {
    'use strict';

    angular
        .module('app')
        .factory('authService', function(sessionService, validationService, usersFactory, $q) {

          var _this = this;

          /** authService.signIn ---------------------------------------------------- */
          _this.signIn = function(emailAddress, password) {
              var validationErrors = validationService.getValidationErrorsObject();

              // validate that we have an email address
              if (!emailAddress) {
                  validationService.addRequiredValidationError( validationErrors, 'emailAddress', 'Please provide an email address.');
              }

              // validate that we have a password
              if (!password) {
                  validationService.addRequiredValidationError(validationErrors, 'password', 'Please provide a password.');
              }

              // if we have validation errors, then short circuit this process
              if (validationService.hasValidationErrors(validationErrors)) {
                  return validationService.prepareErrorResponse(validationErrors);
              }

              // Fields are valid, continue with sign-in
              var currentUser = sessionService.getUser();

              // set the email address and password on the current user
              // so that the data service has access to these values
              currentUser.emailAddress = emailAddress;
              currentUser.password = password;

              // attempt to get the user from the data service
              return usersFactory.getUser(currentUser).then(
                  function(response) {
                    var user = response.data;

                    currentUser.isAuthenticated = true;
                    currentUser._id = user._id;
                    currentUser.fullName = user.fullName;
                    currentUser.favorites = user.favorites;
                    currentUser.password = user.password;
                    currentUser.rescues = user.rescues;
                    if (user.role === 'administrator') {
                      currentUser.isAdmin = true;
                    }

                    // return null to the caller indicating that there were no errors
                    //return $q.resolve(null);
                    return $q.resolve(null);
                  },
                  function() {
                    sessionService.resetSession();

                    // add a validation indicating that the login failed
                    var validationCodes = validationService.getValidationCodes();
                    validationService.addValidationError(
                        validationErrors, 'password',
                        validationCodes.loginFailure,
                        'The login failed for the provided email address and password.');

                    // return the validation errors to the caller
                    return validationService.prepareErrorResponse(validationErrors);
                });
          };

          /** authService.signUp ---------------------------------------------------- */
          _this.signUp = function(user) {
              var validationCodes = validationService.getValidationCodes();
              var validationErrors = validationService.getValidationErrorsObject();

              // Confirm that all fields are present
              if ((user.emailAddress === '' || user.emailAddress === undefined) ||
                (user.fullName === '' || user.fullName === undefined) ||
                (user.password === '' || user.password === undefined) ||
                (user.confirmPassword ===  '' || user.confirmPassword ===  undefined)) {
                  validationService.addValidationError(
                  validationErrors, 
                  'all_fields_required', 
                  validationCodes.allFieldsRequired,
                  'All fields are required.');
              }

              // confirm that two password fields match
              if (user.password !== user.confirmPassword) {
                  validationService.addValidationError(
                    validationErrors, 'password_mismatch', 
                    validationCodes.passwordMismatch,
                    'Passwords do not match.');
              }

              // Confirm that this is a unique user
              usersFactory.lookupUser({ emailAddress: user.emailAddress}, function(err, user, next) {
                  if (err) next(err);
                  if (user) {
                    validationService.addValidationError(
                    validationErrors, 
                    'existing_user',
                    validationCodes.existingUser,
                    'This email has an account already.');
                  }
              });

              // if we have validation errors, then short circuit this process
              if (validationService.hasValidationErrors(validationErrors)) {
                return validationService.prepareErrorResponse(validationErrors);
              }

              // attempt to create the user from the data service
              return usersFactory.createUser(user).then(
                  function(user) {
                    var newUser = user.data;
                    newUser.isAuthenticated = true;
                    sessionService.setUser(newUser);
                  
                    // return null to the caller indicating that there were no errors
                    return $q.resolve(null);
                  },
                  function() {
                    sessionService.resetSession();

                    // add a validation indicating that the login failed
                    validationService.addValidationError(
                        validationErrors, 
                        'existing_user',
                        validationCodes.existingUser,
                        'A user already exists for this email.');

                    // return the validation errors to the caller
                    return validationService.prepareErrorResponse(validationErrors);
              });
          };


          _this.signOut = function() {
            sessionService.resetSession();
          };

          return {
            signIn: _this.signIn,
            signUp: _this.signUp,
            signOut: _this.signOut
        };
      });
})();


(function () {
    'use strict';

    angular
        .module('app')
        .factory('sessionService', function() {

          var _this = this;
          _this.currentUser = {};

          _this.getUser = function() {
            return _this.currentUser;
          };

          _this.setUser = function(user) {
            _this.currentUser = user;
            return _this.currentUser;
          };

          _this.resetSession = function() {
             _this.currentUser = {
               isAuthenticated: false,
               _id: 0,
               fullName: '',
               emailAddress: '',
               password: '',
               favorites: [],
               rescues: [],
               zip: '20001',
               zipConfirmed: false,
               isAdmin: false
             };
          };

          init();

          function init() {
            _this.resetSession();
          }

      return {
        getUser: _this.getUser,
        setUser: _this.setUser,
        resetSession: _this.resetSession
      };
    });
})();

//module.exports = Session;

(function () {
    'use strict';

    angular
        .module('app')
        .factory('validationService', function($q) {

        //function ValidationService($q) {
          var _this = this;

          _this.validationCodes = {
            required: 'required',
            allFieldsRequired: 'all_fields_required',
            loginFailure: 'login_failure',
            passwordMismatch: 'password_mismatch',
            existingUser: 'existing_user'
          };

          _this.addRequiredValidationError = function(validationErrors, key, message) {
            _this.addValidationError(validationErrors, key,
              _this.validationCodes.required, message);
          };

          _this.addValidationError = function(validationErrors, key, code, message) {
            if (!validationErrors.errors.hasOwnProperty(key)) {
              validationErrors.errors[key] = [];
            }

            var error = {
              code: code,
              message: message
            };

            validationErrors.errors[key].push(error);
          };

          _this.hasValidationErrors = function(validationErrors) {
            var hasValidationErrors = false;

            for (var key in validationErrors.errors) {
              if (validationErrors.errors.hasOwnProperty(key)) {
                hasValidationErrors = true;
                break;
              }
            }

            return hasValidationErrors;
          };

          _this.getValidationErrorsObject = function() {
            return {
              message: 'Validation Failed',
              errors: {}
            };
          };

          _this.prepareErrorResponse = function(validationErrors) {
            return $q.reject({ data: validationErrors, status: 400 });
          };

          _this.getValidationCodes = function() {
            return _this.validationCodes;
          };

          return{
            addRequiredValidationError: _this.addRequiredValidationError,
            addValidationError: _this.addValidationError,
            hasValidationErrors: _this.hasValidationErrors,
            getValidationErrorsObject: _this.getValidationErrorsObject,
            prepareErrorResponse: _this.prepareErrorResponse,
            getValidationCodes: _this.getValidationCodes
          };
    });
})();


(function () {
    'use strict';

    angular
        .module('app')
        .factory('errorHandlerService', function(toastService, $log) {
        var _this = this;
        
        _this.handleError = function(response, displayValidationErrorsCallback) {
          if (response.status === 400 && displayValidationErrorsCallback) {
            displayValidationErrorsCallback(response.data);
          } else {
            var message = response && response.data && response.data.message;
            if (!message) {
              message = 'Message not available. Please see the console for more details.';
            }
            toastService.showToast(message + ': Unexpected Error');

            // log the entire response to the console
            $log.error(response);
          }
        };

        return{
            handleError: _this.handleError
          };
      });
})();

(function () {
    'use strict';

    angular
        .module('app')
        .factory('toastService', function($mdToast) {

        var _this = this;
        
        _this.showToast = function(message) {
               $mdToast.show(
                $mdToast.simple()
                    .content(message)
                    .position( 'top right')
                    .hideDelay(3000) 
                    .theme('success-toast')             
              );
        };

        return{
            showToast: _this.showToast
          };
    });
})();


(function () {
    'use strict';

    angular
        .module('app')
        .factory('searchService', function(dogsFactory, toastService, $q) {

        // Fill breed list for drop down menus
        function loadBreeds() {
            var defer = $q.defer();
            // Passing empty string = get all breeds
            dogsFactory.getBreeds('').then(function(breeds) {
                if (breeds) {
                    defer.resolve( breeds.data );
                } else {
                    toastService.showToast('Unable to get breeds list.');
                    defer.reject();
                }
            });
            return defer.promise;
        }

        return {
            loadBreeds: loadBreeds
        };
    });
})();

(function () {
    'use strict';

    angular
        .module('app')
        .factory('locationService', function(sessionService, $mdDialog, $http) {

        var _this = this;
        var currentUser = sessionService.getUser();

        // Get the location of the user from their browser
        // And then use google's api to compute the zip from the lat/long coordinates
        _this.getLocation = function() {
            return new Promise(function(resolve, reject) {
               var zip;
               if(navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function(pos) {
                        var geoStr = pos.coords.latitude +", " + pos.coords.longitude;
                        var googleURL = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + geoStr + "&key=AIzaSyC9fO8vW7pPyIRlafuzg9O4T-sm5TJ3kPo";

                        $http.get(googleURL).success(function(results) {
                            var addressArr = results.results[0].address_components;
                            for ( var i = 0; i < addressArr.length; i++) {
                                if (addressArr[i].types[0] === 'postal_code') {
                                    zip = addressArr[i].short_name;
                                    i = addressArr.length;
                                }
                            }
                            if (zip.length === 5) { 
                                currentUser.zip = zip;
                                currentUser.zipConfirmed = true;
                                sessionService.setUser(currentUser);
                                resolve(zip);
                            } else {
                                resolve( "20001");
                            }
                        }).error(function() {
                            reject();
                        });
                    });
                } else { 
                    reject();
                }
                reject();
            });
        };

        // Dialog to retrieve zip code from user
        _this.getZipCode = function() {
            return new Promise(function(resolve, reject) {
                var confirm = $mdDialog.prompt()
                    .title('Please enter your 5-digit zip code:')
                    .textContent("We need a zip code to find shelters in your area.")
                    .placeholder('Your zip code')
                    .ariaLabel('zip code')
                    .ok('Okay!')
                    .cancel('Cancel');

                $mdDialog.show(confirm).then(function(result) {
                    // Check to maker sure it is a validly formatted zip code
                    if (/^\d{5}$/.test(result)) {
                        currentUser.zip = result;
                        currentUser.zipConfirmed = true;
                        sessionService.setUser(currentUser);
                        resolve( result );
                    } else {
                        reject();
                    }
                }, function() {
                    reject(); 
                });
            });
        };

        return {
            getLocation: _this.getLocation,
            getZipCode: _this.getZipCode
        };

    });
})();

(function () {
    'use strict';

    angular
        .module('app')
        .factory('adoptableService', function(usersFactory, sessionService, toastService, $mdDialog) {
        
        var _this = this;
        var currentUser = sessionService.getUser();

        // Show the detail on an adoptable pet
        _this.showAdoptable = function(event, adoptable) {
                var dog = adoptable;
                var control = {
                    allowTracking: currentUser.isAuthenticated,
                    showTracking: currentUser.rescues.indexOf(adoptable.id.$t) === -1,
                    showUntracking: currentUser.rescues.indexOf(adoptable.id.$t) !== -1
                };
               

                // Format fields for display
                if (adoptable.sex.$t.toLowerCase() === 'm') {
                    dog.sex.$t = 'Male';
                } else {
                    dog.sex.$t = 'Female';
                }
                if (adoptable.options.option) {
                    for (var i = 0; i < adoptable.options.option.length; i++) {
                        if (adoptable.options.option[i].$t === 'housetrained') {
                            dog.options.option[i].$t = 'House-trained';
                        } else if (adoptable.options.option[i].$t === 'specialNeeds') {
                            dog.options.option[i].$t = 'Special needs';
                        } else if (adoptable.options.option[i].$t === 'noCats') {
                            dog.options.option[i].$t = 'Not good with cats';
                        } else if (adoptable.options.option[i].$t === 'noDogs') {
                            dog.options.option[i].$t = 'Not good with other dogs';
                        } else if (adoptable.options.option[i].$t === 'altered') {
                            dog.options.option[i].$t = 'Has been spayed/neutered';
                        } else if (adoptable.options.option[i].$t === 'hasShots') {
                            dog.options.option[i].$t = 'Vaccinations are up-to-date';
                        }
                    }
                }
                $mdDialog.show({
                controller: ['$scope', 'dog', 'control', function($scope, dog, control) {
                    $scope.control = control;
                    $scope.dog = dog;
                    $scope.closeDialog = function() {
                        $mdDialog.hide();
                    };
                    $scope.trackAdoptable = function(dog) {
                        $scope.control.showUntracking = true; 
                        $scope.control.showTracking = false; 
                        trackDog(dog.id.$t, dog.name.$t);
                    };
                    $scope.untrackAdoptable = function(dog) {
                        $scope.control.showTracking = true; 
                        $scope.control.showUntracking = false; 
                        untrackDog(dog.id.$t, dog.name.$t);
                    };
                }],
                template: 
                    '<md-dialog class="std-dialog" aria-label="Adoptable dialog" layout-padding>' +
                    '   <md-dialog-content>' +
                    '       <md-content class="md-title teal" layout-padding>' +
                    '           {{ dog.name.$t }}' + 
                    '       </md-content>' +
                    '       <div layout="row" layout-padding>' +
                    '           {{ dog.description.$t }}' +
                    '       </div>' +
                    '       <div layout="row" layout-padding flex>' +
                    '           <div layout="column" flex="40">' +
                    '               <img ng-src="{{ dog.media.photos.photo[2].$t }}">' +
                    '           </div>' +
                    '           <div layout="column" flex="60">' +
                    '               <div layout="row">' +
                    '                   <span class="teal">Sex:&nbsp; </span> {{ dog.sex.$t }}' +
                    '                   &nbsp;&nbsp;&nbsp;<i class="mdi mdi-checkbox-multiple-blank-circle"></i>&nbsp;&nbsp;&nbsp;' +
                    '                   <span class="teal">Age:&nbsp; </span> {{ dog.age.$t }}' +
                    '                   &nbsp;&nbsp;&nbsp;<i class="mdi mdi-checkbox-multiple-blank-circle"></i>&nbsp;&nbsp;&nbsp;' +
                    '                   <span ng-if="dog.breeds.breed[0]"><span class="teal">Breeds:&nbsp; </span> {{ dog.breeds.breed[0].$t }}, {{ dog.breeds.breed[1].$t }} </span>' +
                    '                   <span ng-if="!dog.breeds.breed[0]"><span class="teal">Breed:&nbsp; </span> {{ dog.breeds.breed.$t }} </span>' +
                    '               </div>' +
                    '               <div layout-padding>' +
                    '                   <div ng-repeat="option in dog.options.option">' +
                    '                       <p><i class="mdi mdi-checkbox-multiple-marked-circle"></i>&nbsp; {{ option.$t }}</p>' +
                    '                   </div>' +
                    '               </div>' +
                    '               <div layout="row" layout-padding>' +
                    '                   <div>' +
                    '                       <p><span class="teal">Contact Email:</span> {{ dog.contact.email.$t }}</p>' +
                    '                       <p><span class="teal">Contact Phone:</span> {{ dog.contact.phone.$t }}</p>' +
                    '                   </div>' +
                    '               </div>' +
                    '           </div>' +
                    '       </div>' +
                    '   </md-dialog-content>' +
                    '   <md-dialog-actions layout="row">' +
                    '       <md-button ng-click="trackAdoptable(dog)" class="md-primary" ng-show="control.showTracking && control.allowTracking" ng-hide="control.showUntracking || !control.allowTracking">' +
                    '          Track {{ dog.name.$t }}' +
                    '       </md-button>' +
                    '       <md-button ng-click="untrackAdoptable(dog)" class="md-warn" ng-show="control.showUntracking && control.allowTracking" ng-hide="control.showTracking || !control.allowTracking">' +
                    '          UnTrack {{ dog.name.$t }}' +
                    '       </md-button>' +
                    '       <md-button ng-click="closeDialog()" class="md-primary">' +
                    '          Close Dialog' +
                    '       </md-button>' +
                    '   </md-dialog-actions>' +
                    '</md-dialog>', 
                locals: { dog: dog, control: control },
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose: true,
                escapeToClose: true
               });
           };

           // Save a rescue dog to a user's rescue list
           function trackDog(id, name) {
               // check to ensure this dog isn't already on list
               if (currentUser.rescues.indexOf(id) === -1) {
                    usersFactory.addRescue(id, currentUser._id).then(function(){
                        currentUser.rescues.push(id);
                        sessionService.setUser(currentUser);
                        document.getElementById(id).className = 'rescue-on';
                    }); 
               } else {
                   toastService.showToast(name + ' has already been added to your rescues list.');
               }
           }

           // Remove a rescue dog from a user's rescue list
            function untrackDog(id, name) {
                // check to ensure this dog is on list
               if (currentUser.rescues.indexOf(id) !== -1) {
                    usersFactory.deleteRescue(id, currentUser._id).then(function(){
                        toastService.showToast(name + ' has been removed from your rescues list.');
                        currentUser.rescues.splice(currentUser.rescues.indexOf(id), 1);
                        sessionService.setUser(currentUser);
                        document.getElementById(id).className = 'rescue-off';
                    });
               }
           }

           return {
               showAdoptable: _this.showAdoptable
           };
        });
})();
(function () {
    'use strict';

    angular
        .module('app')
        .factory('favoritesService', function(usersFactory, sessionService, toastService) {
        
        var _this = this;
        var currentUser = sessionService.getUser();


        _this.toggleFavorite =  function(dogId, breed) {
               if (!currentUser.isAuthenticated) {
                   toastService.showToast("You need to be signed in to access your favorites list.");
                   return;
               }
               var element = document.getElementById(dogId);
               if ( currentUser.favorites.length !== 0 && currentUser.favorites.indexOf(dogId) !== -1 ) {
                   // Dog is in favorites List, so remove it
                   usersFactory.deleteFavorite(currentUser, dogId).then(function() {
                       toastService.showToast(breed + ' has been removed from your favorites list.');
                       if (element) {
                            element.className = 'paw fav-off';
                       } 
                       currentUser.favorites.splice(currentUser.favorites.indexOf(dogId), 1);
                       sessionService.setUser(currentUser);
                   });
               } else {
                   // Add dog to favorites list
                   usersFactory.addFavorite(currentUser, dogId, 'breeds', '').then(function() {
                       toastService.showToast(breed + ' has been added to your favorites list.');
                       if (element) {
                            element.className = 'paw fav-on';
                       } 
                       currentUser.favorites.push(dogId);
                       sessionService.setUser(currentUser);
                   });
               }  
           };

           _this.markFavorites = function(dogs, favList) {
               var arr = [];
               // Convert dogs to array if it is a singular dog from detail page
               if (!Array.isArray(dogs)) {
                   arr.push(dogs);
               } else {
                   arr = dogs;
               }
               for (var i = 0; i < arr.length; i++) {
                   if (favList.indexOf(arr[i]._id) !== -1) {
                       arr[i].favClass = 'paw fav-on';
                   } else {
                       arr[i].favClass = 'paw fav-off';
                   }
                }
                return arr;
            };

           return {
               toggleFavorite: _this.toggleFavorite,
               markFavorites: _this.markFavorites
           };
        });
})();
