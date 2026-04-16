(()=>{
  'use strict';
  class Copy {
    constructor(status,copyID,location,fund,staffNote) {
      this.copyID = copyID;
      this.location = location;
      this.fund = fund,
      this.status = status;
      this.staffNote = staffNote;
    }
  }

  class Workslip {
    constructor(createdTime,poNumber,title,author,ean13,isbn,upc,publisher,pubDate,biblioID,orderLineRef,listPrice,discountPrice,discount,createItemOnReceipt,vendorNote,catalogLink) {
      this.dateToday = (new Date()).toLocaleDateString();
      this.createdTime = createdTime;
      this.poNumber = poNumber;
      this.title = title;
      this.author = author;
      this.ean13 = ean13;
      this.isbn = isbn;
      this.upc = upc;
      this.publisher = publisher;
      this.pubDate = pubDate;
      this.biblioID = biblioID;
      this.orderLineRef = orderLineRef;
      this.listPrice = listPrice;
      this.discountPrice = discountPrice;
      this.discount = discount;
      this.createItemOnReceipt = createItemOnReceipt;
      this.vendorNote = vendorNote;
      this.catalogLink = catalogLink;
      this.copies = [];
    }
    
    addCopy(copyID,location,fund,status,staffNote) {
      this.copies.push(new Copy(copyID,location,fund,status,staffNote));
    }
  }

  const create = document.getElementById('create');
  create.addEventListener('click', e=> {
    const data = document.getElementById('data');
    const error = document.getElementById('error');
    const DATA_EXPECTED_ROWS = 22;
    const rows = data.value.trim().split('\n');

    let workslip;

    error.style.display = 'none';

    for (let i = 0; i < rows.length; i++) {
      const cols = rows[i].split('\t').map(v=>{return v.trim()});
      if (cols.length === DATA_EXPECTED_ROWS) {
        if (i === 0) {
          workslip = new Workslip(cols[0],cols[1],cols[3],cols[4],cols[5],cols[6],cols[7],cols[8],cols[9],cols[10],cols[11],cols[12],cols[13],cols[14],cols[18],cols[19],cols[21]);
        }
        if (i > 0 && (workslip.isbn !== cols[6] || workslip.upc !== cols[7])) {
          error.textContent = "Selection contains more than one ISBN or UPC value.";
          error.style.display = 'block';
          return;
        }
        workslip.addCopy(cols[2],cols[15],cols[16],cols[17],cols[20]);
      } else {
        error.textContent = "Cannot parse entered data.";
        error.style.display = 'block';
        return;
      }
    }

    browser.runtime.sendMessage({
      "key": "printTempWorkslip",
      "data": workslip
    });
  });
})();