browser.menus.create({
  "id": "get-item-copies",
  "title": "Get Item Copies",
  "documentUrlPatterns": [
    "https://mad.scls.bibliovation.com/app/staff/acquisitions",
    "https://mad.scls.bibliovation.com/getit/app/static/partials/index-dev.html"],
  "contexts": ["all"],
  "visible": true
});

browser.menus.create({
  "id": "print-workslip",
  "title": "Print MAD-TS Workslip",
  "documentUrlPatterns": [
    "https://mad.scls.bibliovation.com/app/staff/acquisitions",
    "https://mad.scls.bibliovation.com/getit/app/static/partials/index-dev.html"],
  "contexts": ["all"],
  "visible": true
});

browser.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "print-workslip") {
    printWorkslip(tab);
  } else if (info.menuItemId === "get-item-copies") {
    browser.tabs.executeScript({
      "file": "/scripts/copiesListener.js",
      "allFrames": true
    });
  }
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.key === 'printWorkslip') {
    return browser.tabs.query({'currentWindow': true, 'active': true}).then(tabs => {
      printWorkslip(tabs[0]);
    });
  } else if (request.key === 'listenForCopies') {
    return browser.tabs.query({'currentWindow': true, 'active': true}).then(tabs => {
      browser.tabs.executeScript({
        "file": "/scripts/copiesListener.js",
        "allFrames": true
      });
    });
  } else if (request.key === 'printTempWorkslip') {
    browser.tabs.create({
      "url": browser.runtime.getURL("tempWorkslip/tempWorkslip.html")
    }).then(tab => {
      setTimeout(() => {
        browser.tabs.sendMessage(tab.id, request.data).then(() => {
          browser.tabs.remove(tab.id);
        });
      }, 450);
    });
  }
});

function printWorkslip(tab) {
  browser.scripting.executeScript({
    "target": {"tabId": tab.id},
    "files": ["/scripts/scrapeGetIt.js"]
  }).then(resultArr => {
    if (resultArr.length > 0) {
      let data = resultArr[0].result;

      let getHolds = new Promise((resolve, reject) => {
        if (data.bibRecId.length > 0) {
          browser.tabs.create({
            "url": "https://mad.scls.bibliovation.com/app/staff/bib/"
                    + data.bibRecId + "/details",
            "active": true
          }).then(holdsTab => {
            browser.tabs.executeScript(holdsTab.id, {
              "file": "/scripts/getNumHolds.js"
            }).then(injectionResults => {
              browser.tabs.remove(holdsTab.id);
              resolve(injectionResults[0]);
            });
          });
        } else {
          reject('Biblio ID empty in GetIT')
        }
      });

      let getMARCData = new Promise((resolve, reject) => {
        if (data.bibRecId.length > 0) {
          browser.tabs.create({
            "url": "https://mad.scls.bibliovation.com/app/staff/marced/edit/"
                    + data.bibRecId,
            "active": true
          }).then(marcTab => {
            browser.tabs.executeScript(marcTab.id,{
              "file": "/scripts/getMARCData.js"
            }).then(injectionResults => {
              browser.tabs.remove(marcTab.id);
              resolve(injectionResults[0]);
            });
          });
        } else {
          reject('Biblio ID empty in GetIT')
        }
      });

      Promise.all([getHolds, getMARCData]).then(res => {
        data.holds = res[0].holds;
        data.linkCopies = res[0].linkCopies;
        data.isNewADFIC = res[0].isNewADFIC;
        data.marcData = res[1];
      }).catch(noBib => {
        data.holds = "No bib in B'vation";
        data.linkCopies = '';
        data.isNewADFIC = '';
        data.marcData = [];
      }).then(()=>{
        browser.tabs.create({
          "url": browser.runtime.getURL("workslip.html")
        }).then(tab => {
          setTimeout(() => {
            browser.tabs.sendMessage(tab.id, data).then(() => {
              browser.tabs.remove(tab.id);
            });
          }, 250);
        });
      });
    }
  });
}