(()=>{
  'use strict';
  browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(request);

    const poNum = document.querySelector('td.poNum');
    const dateToday = document.querySelector('td.dateToday');
    const title = document.querySelector('td.title');
    const author = document.querySelector('td.author');
    const bibRecId = document.querySelector('td.bibRecId');
    const ean13 = document.querySelector('td.ean13');
    const isbn = document.querySelector('td.isbn');
    const upc = document.querySelector('td.upc');
    const publisher = document.querySelector('td.publisher');
    const listPrice = document.querySelector('td.listPrice');
    const discountedPrice = document.querySelector('td.discountedPrice');
    const datePub = document.querySelector('td.datePub');
    const fund = document.querySelector('td.fund');

    const copyTableBody = document.getElementById('copyTableBody');

    if (request.poNumber !== '') {
      poNum.textContent = request.poNumber;
    } else {
      poNum.parentElement.style.display = 'none';
    }

    if (request.dateToday !== '') {
      dateToday.textContent = request.dateToday;
    } else {
      dateToday.parentElement.style.display = 'none';
    }

    if (request.title !== '') {
      title.textContent = request.title;
    } else {
      title.parentElement.style.display = 'none';
    }

    if (request.author !== '') {
      author.textContent = request.author;
    } else {
      author.parentElement.style.display = 'none';
    }

    if (request.biblioID !== '') {
      bibRecId.textContent = request.biblioID;
    } else {
      bibRecId.parentElement.style.display = 'none';
    }

    if (request.ean13 !== '') {
      ean13.textContent = request.ean13;
    } else {
      ean13.parentElement.style.display = 'none';
    }

    if (request.isbn !== '') {
      isbn.textContent = request.isbn;
    } else {
      isbn.parentElement.style.display = 'none';
    }

    if (request.upc !== '') {
      upc.textContent = request.upc;
    } else {
      upc.parentElement.style.display = 'none';
    }

    if (request.publisher !== '') {
      publisher.textContent = request.publisher;
    } else {
      publisher.parentElement.style.display = 'none';
    }

    if (request.listPrice !== '') {
      listPrice.textContent = '$' + request.listPrice;
    } else {
      listPrice.parentElement.style.display = 'none';
    }

    if (request.discountPrice !== '') {
      discountedPrice.textContent = '$' + request.discountPrice;
    } else {
      discountedPrice.parentElement.style.display = 'none';
    }

    if (request.pubDate !== '') {
      datePub.textContent = request.pubDate;
    } else {
      datePub.parentElement.style.display = 'none';
    }

    if (request.fund !== '') {
      datePub.textContent = request.fund;
    } else {
      datePub.parentElement.style.display = 'none';
    }

    for (let copy of request.copies) {
      const row = document.createElement('tr');
      const location = document.createElement('td');
      location.textContent = copy.location;
      const receiptStatus = document.createElement('td');
      receiptStatus.textContent = copy.status;
      const staffNote = document.createElement('td');
      staffNote.textContent = copy.staffNote;
      row.append(location,receiptStatus,staffNote);
      copyTableBody.appendChild(row);
    }

    window.print();
  });
})();