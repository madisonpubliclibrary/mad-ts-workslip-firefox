(function() {
  'use strict';
  
  const targetNode = document.getElementById('conversion_session_log_section_body');
  const config = {'childList': true}
  const observer = new MutationObserver((mutationList, observer) => {
    if (targetNode.firstChild.classList.contains('success')) {
      const nodeContent = targetNode.firstChild.textContent;
      const idre = /\(Item ID: (?<encoded>.*)\)/.exec(nodeContent);
      if (idre) {
        const bcre = /^(?<barcode>39078\d{9})$/.exec(idre.groups.encoded);
        if (bcre) {
          const bc = bcre.groups.barcode;

          browser.runtime.sendMessage({
            "key": "verifyBarcode",
            "itemBarcode": bc
          }).then(res => {
            console.log(res);
            if (!res) {
              browser.runtime.sendMessage({
                "key": "printBarcode",
                "barcode": idre.groups.encoded
              });
            }
          });
        } else {
          alert('`' + idre.groups.encoded + '` is an invalid barcode, but was encoded to the tag');
        }
      }
    }
  });

  observer.observe(targetNode, config);
})();
 