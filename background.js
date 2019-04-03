browser.menus.create({
  "id": "print-workslip",
  "title": "Print MAD-TS Workslip",
  "contexts": ["all"],
  "visible": true
});

browser.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "print-workslip") {
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
              resolve(holdsArr[0]);
            });
          });
        } else {
          resolve('');
        }
      });

      let getMARCData = new Promise(function(resolve, reject) {
        if (data.bibRecId.length > 0) {
          browser.tabs.create({
            "url": "https://scls-staff.kohalibrary.com/cgi-bin/koha/cataloguing/addbiblio.pl?biblionumber=" + data.bibRecId,
            "active": false
          }).then(tab => {
            browser.tabs.executeScript(tab.id, {
              "file": "getMARCData.js"
            }).then(marcArr => {
              browser.tabs.remove(tab.id);
              resolve(marcArr[0]);
            });
          });
        } else {
          resolve('');
        }
      });

      Promise.all([getHolds, getMARCData]).then(res => {
        data.holds = res[0];
        data.marcData = res[1];
        console.log(data);
        browser.tabs.create({
          "url": browser.runtime.getURL("workslip.html")
        }).then(tab => {
          setTimeout(function() {
            browser.tabs.sendMessage(tab.id, data);
          }, 100);
        });
      });
    });
  }
});
