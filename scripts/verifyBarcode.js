(function(){
  'use strict';
  return new Promise((resolve, reject) => {
    const waitForBib = setInterval(() => {
      const itemBib = document.querySelector('div[id^=\"kohabib-\"]');
      let noResults = document.querySelector('#searchResults .alert-info[aria-hidden="false"]');

      if (noResults) noResults = /No\s+results\s+found!/.test(noResults.textContent);
      if (itemBib || noResults) {
        clearInterval(waitForBib);
        if (itemBib) {
          resolve(true);
        } else if (noResults) {
          resolve(false);
        }
      }
    }, 350);
  });
})();