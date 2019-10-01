browser.menus.create({
  "id": "print-workslip",
  "title": "Print MAD-TS Workslip",
  "documentUrlPatterns": [
    "https://lakscls-sandbox.bibliovation.com/app/staff/acquisitions",
    "https://lakscls-sandbox.bibliovation.com/getit/app/static/partials/index-dev.html"],
  "contexts": ["all"],
  "visible": true
});

browser.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "print-workslip") {
    printWorkslip(tab);
  }
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.key === 'printWorkslip') {
    browser.tabs.query({'currentWindow': true, 'active': true}).then(tabs => {
      printWorkslip(tabs[0]);
    });
  }
});

function printWorkslip(tab) {
  browser.tabs.executeScript(tab.id, {
    "file": "scrapeGetIt.js"
  }).then(resArr => {
    let data = resArr[0];

    let getHolds = new Promise(function(resolve, reject) {
      if (data.bibRecId.length > 0) {
        browser.tabs.create({
          "url": "https://lakscls-sandbox.bibliovation.com/app/staff/bib/" + data.bibRecId + "/details",
          "active": true
        }).then(tab => {
          let waitForHolds = setInterval(() => {
            browser.tabs.executeScript(tab.id, {
              "file": "getNumHolds.js"
            }).then(holdsArr => {
              if (holdsArr && holdsArr.length > 0 && holdsArr[0] !== null) {
                if (holdsArr[0].hasOwnProperty('holds')) {
                  browser.tabs.remove(tab.id);
                  clearInterval(waitForHolds);
                  resolve(holdsArr[0]);
                } else if (holdsArr[0] === 'holdsError') {
                  reject('Unable to find item holds data; not logged into Koha.');
                }
              }
            });
          }, 400);
        });
      } else {
        resolve('No bib in Koha');
      }
    });

    let getMARCData = new Promise(function(resolve, reject) {
      if (data.bibRecId.length > 0) {
        browser.tabs.create({
          "url": "https://lakscls-sandbox.bibliovation.com/app/staff/marced/edit/" +
                  data.bibRecId,
          "active": true
        }).then(tab => {
          let marcTimeout = 20; // 20 * 400ms = 8sec
          let waitForMARC = setInterval(() => {
            marcTimeout--;
            if (marcTimeout === 0) {
              browser.tabs.remove(tab.id);
              clearInterval(waitForMARC);
              resolve('');
            }
            browser.tabs.executeScript(tab.id, {
              "file": "getMARCData.js"
            }).then(marcArr => {
              if (marcArr && marcArr.length > 0 && marcArr[0] !== null) {
                if (marcArr[0].hasOwnProperty('092') || marcArr[0].hasOwnProperty('099a') || marcArr[0].hasOwnProperty('300')) {
                  browser.tabs.remove(tab.id);
                  clearInterval(waitForMARC);
                  resolve(marcArr[0]);
                } else if (marcArr[0] === 'marcError') {
                  reject('Unable to find MARC data; not logged into Koha.');
                }
              }
            });
          }, 400);
        });
      } else {
        resolve('No bib in Koha');
      }
    });

    Promise.all([getHolds, getMARCData]).then(res => {
      if (res[0] === 'No bib in Koha') {
        data.holds = res[0];
      } else {
        data.holds = res[0].holds;
        data.linkCopies = res[0].linkCopies;
        data.isNewADFIC = res[0].isNewADFIC;
        data.marcData = res[1];
      }

      browser.tabs.create({
        "url": browser.runtime.getURL("workslip.html")
      }).then(tab => {
        setTimeout(() => {
          browser.tabs.sendMessage(tab.id, data).then(() => {
            browser.tabs.remove(tab.id);
          });
        }, 450);
      });
    }, reject => {
      browser.tabs.create({
        "url": "https://lakscls-sandbox.bibliovation.com",
        "active": true
      });
    });
  });
};
