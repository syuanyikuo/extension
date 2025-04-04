function predict_verifyCode(){
    
    const img = document.getElementById('TicketForm_verifyCode-image');

    var canvas = document.createElement("canvas");
    canvas.width = 80;
    canvas.height = 50;
    var ctx = canvas.getContext("2d");

    ctx.drawImage(img, 0, 0, 80, 50);

    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;
    let width = imageData.width;
    let height = imageData.height;

    let grayData = new Float32Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;
        grayData[i / 4] = gray;
    }

    let threshData = new Float32Array(width * height);
    for (let i = 0; i < grayData.length; i++) {
        threshData[i] = grayData[i] > 230 ? 0 : 255;
    }

    for (let i = 0; i < width; i++) {
        threshData[i] = 255;
    }

    for (let i = 0; i < threshData.length; i++) {
        threshData[i] = threshData[i] / 255.0;
    }

    chrome.runtime.sendMessage({
        action: 'analyze',
        data: threshData
    });
}


function initPredict() {
    const img = document.getElementById('TicketForm_verifyCode-image');
    if (!img) {
        console.error('Captcha image not found');
        return;
    }
    if (img.complete) {
        predict_verifyCode();
    } else {
        img.onload = predict_verifyCode;
    }
}

window.onload = function() {
    
    const imageElement = document.querySelector('#TicketForm_verifyCode-image');
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                initPredict()
            }
        });
    });
    observer.observe(imageElement, { attributes: true, attributeFilter: ['src'] });

    initPredict()
};

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === 'result') {
        document.querySelector('[id="TicketForm_verifyCode"]').value = message.result;
        document.querySelector('[id="TicketForm_agree"]').checked = true;
    }
});
