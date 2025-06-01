const CACHE_NAME = 'offline-v1';

self.addEventListener("install", function(event) {
  event.waitUntil(preLoad());
});

var preLoad = function(){
  console.log("Installing web app");
  return caches.open(CACHE_NAME).then(function(cache) {
    console.log("caching index and important routes");
    return cache.addAll([
      "/", 
      "/index.html",
      "/offline.html",
      "/manifest.json",
      "/css/style.css", 
      "/assets/icons/favicon-16x16.png", 
      "/assets/icons/favicon-32x32.png", 
      "/assets/icons/icon-192.png", 
      "/assets/icons/icon-512.png", 
      "/data/buildings.geojson", 
      "/js/map.js",
      "/plugins/leaflet.edgebuffer.js"
    ]);
  });
};

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    })
  );
});

self.addEventListener("fetch", function(event) {
  const requestURL = new URL(event.request.url);

  // Don't cache/map tile requests or third-party URLs
  if (!requestURL.origin.includes(self.location.origin)) {
    return;
  }

  event.respondWith(
    checkResponse(event.request).catch(() => returnFromCache(event.request))
  );

  event.waitUntil(addToCache(event.request));
});

var checkResponse = function(request){
  return new Promise(function(fulfill, reject) {
    fetch(request).then(function(response){
      if(response.status !== 404) {
        fulfill(response);
      } else {
        reject();
      }
    }, reject);
  });
};

var addToCache = function(request){
  const url = new URL(request.url);

  // Skip map tiles or external requests
  if (
    url.hostname.includes("tiles.stadiamaps.com") ||
    !url.origin.includes(self.location.origin)
  ) {
    return Promise.resolve(); // do nothing
  }

  return caches.open(CACHE_NAME).then(function (cache) {
    return fetch(request).then(function (response) {
      if (response && response.status === 200) {
        console.log(response.url + " was cached");
        return cache.put(request, response.clone());
      }
    });
  }).catch(() => {});
};


var returnFromCache = function(request){
  return caches.open(CACHE_NAME).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if (!matching || matching.status === 404) {
        return cache.match("offline.html");
      } else {
        return matching;
      }
    });
  });
};
