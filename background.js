browser.menus.create({
  "id": "print-workslip",
  "title": "Print MAD-TS Workslip",
  "documentUrlPatterns": [
    "https://scls-mad-staff.kohalibrary.com/cgi-bin/koha/acqui/getit.pl",
    "https://scls-mad-staff.kohalibrary.com/getit/public/index.html"],
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
          "url": "https://scls-staff.kohalibrary.com/cgi-bin/koha/catalogue/detail.pl?biblionumber=" + data.bibRecId,
          "active": false
        }).then(tab => {
          browser.tabs.executeScript(tab.id, {
            "file": "getNumHolds.js"
          }).then(holdsArr => {
            browser.tabs.remove(tab.id);

            if (holdsArr[0] === 'holdsError') {
              reject('Unable to find item holds data; not logged into Koha.');
            } else {
              resolve(holdsArr[0]);
            }
          });
        });
      } else {
        resolve('');
      }
    });

    let getMARCData = new Promise(function(resolve, reject) {
      if (data.bibRecId.length > 0) {
        browser.tabs.create({
          "url": "https://scls-staff.kohalibrary.com/cgi-bin/koha/cataloguing/addbiblio.pl?biblionumber="
                 + data.bibRecId + '&frameworkcode=BKS',
          "active": false
        }).then(tab => {
          browser.tabs.executeScript(tab.id, {
            "file": "getMARCData.js"
          }).then(marcArr => {
            browser.tabs.remove(tab.id);

            if (marcArr[0] === 'marcError') {
              reject('Unable to find MARC data; not logged into Koha.');
            } else {
              resolve(marcArr[0]);
            }
          });
        });
      } else {
        resolve('');
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
            //browser.tabs.remove(tab.id);
          });
        }, 450);
      });
    }, reject => {
      browser.tabs.create({
        "url": "https://scls-staff.kohalibrary.com",
        "active": true
      });
    });
  });
};
