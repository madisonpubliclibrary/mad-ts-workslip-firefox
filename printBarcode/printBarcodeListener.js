window.onload = function() {
  const barcode = location.toString().split('?')[1].split('=')[1];

  if (barcode) {
    const bcWrap = document.getElementById("barcodeWrap");
    const bc = document.getElementById("barcode");
    bcWrap.style.fontSize = '36px';
    bcWrap.classList.remove("hide");
    bc.textContent = barcode;

    window.print();
  }
}
