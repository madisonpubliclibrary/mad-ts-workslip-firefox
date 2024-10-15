browser.contextMenus.create({
  "id": "get-item-copies",
  "title": "Get Item Copies",
  "documentUrlPatterns": [
    "*://*.bibliovation.com/app/staff/acquisitions",
    "*://*.bibliovation.com/getit/app/static/partials/index-dev.html"],
  "contexts": ["all"],
  "visible": true
});

browser.contextMenus.create({
  "id": "print-workslip",
  "title": "Print MAD-TS Workslip",
  "documentUrlPatterns": [
    "*://*.bibliovation.com/app/staff/acquisitions",
    "*://*.bibliovation.com/getit/app/static/partials/index-dev.html"],
  "contexts": ["all"],
  "visible": true
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "print-workslip") {
    printWorkslip(tab);
  } else if (info.menuItemId === "get-item-copies") {
    browser.scripting.executeScript({
      "target": {"tabId": tab.id, "allFrames": true},
      "files": ["/scripts/copiesListener.js"]
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
      browser.scripting.executeScript({
        "target": {"tabId": tabs[0].id, "allFrames": true},
        "files": ["/scripts/copiesListener.js"]
      });
    });
  } else if (request.key === 'verifyBarcode') {
    return new Promise((resolve, reject) => {
      browser.tabs.create({
        "url": "https://mad.scls.bibliovation.com/app/search/" + request.itemBarcode,
        "active": true
      }).then(tab => {
        setTimeout(() => {
          browser.scripting.executeScript({
            "target": {"tabId": tab.id},
            "files": ["/scripts/verifyBarcode.js"]
          }).then(resArr => {
            browser.tabs.remove(tab.id);
            const itemFound = resArr[0].result;
            resolve(itemFound);
          })
        }, 100);
      });
    });
  } else if (request.key === 'printBarcode') {
    browser.tabs.create({
      "url": "/printBarcode/printBarcode.html?barcode=" + request.barcode,
      "active": false
    }).then(tab => {
      setTimeout(() => {
        browser.tabs.remove(tab.id);
      }, 500);
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
            browser.scripting.executeScript({
              "target": {"tabId": holdsTab.id},
              "files": ["/scripts/getNumHolds.js"]
            }).then(injectionResults => {
              browser.tabs.remove(holdsTab.id);
              resolve(injectionResults[0].result);
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
            browser.scripting.executeScript({
              "target": {"tabId": marcTab.id},
              "files": ["/scripts/getMARCData.js"]
            }).then(injectionResults => {
              browser.tabs.remove(marcTab.id);
              resolve(injectionResults[0].result);
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