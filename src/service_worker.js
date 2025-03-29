import * as tf from '@tensorflow/tfjs';

class ImageClassifier {
  constructor() {
    this.loadModel();
  }

  async loadModel() {
    console.log('Loading model...');
    const startTime = performance.now();
    const MODEL_URL = chrome.runtime.getURL('model/model.json');
    try {
      this.model = await tf.loadLayersModel(MODEL_URL);
      tf.tidy(() => {
        this.model.predict(tf.zeros([1, 50, 80, 1]));
      });
      const totalTime = Math.floor(performance.now() - startTime);
      console.log(`Model loaded and initialized in ${totalTime} ms`);
    } catch (e) {
      console.error('Unable to load model', e);
    }
  }

  async analyzeImage(threshData, tabId) {
    if (!tabId) {
      console.error('No tab. No prediction.');
      return;
    }
    if (!this.model) {
      console.log('Waiting for model to load...');
      setTimeout(() => { this.analyzeImage(imageData, tabId); }, 1000);
      return;
    }

    console.log('Predicting...');

    // 创建 Tensor，形状为 [1, 50, 80, 1]
    let temp = Object.values(threshData);
    console.log(temp);
    let inputTensor = tf.tensor4d(temp, [1, 50, 80, 1], 'float32');

    const predictions = this.model.predict(inputTensor);

    const ENG = 'abcdefghijklmnopqrstuvwxyz';
    let captcha = '';
    predictions.forEach(pred => {
      const data = pred.dataSync();
      const maxIndex = data.indexOf(Math.max(...data));
      captcha += ENG[maxIndex];
    });

    console.log('辨識結果 Captcha：', captcha);

    const message = { action: 'result', result: captcha};
    chrome.tabs.sendMessage(tabId, message);
    
  }
}

const imageClassifier = new ImageClassifier();

// 接收 content script 發來的訊息，觸發 analyze
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'analyze') {
    imageClassifier.analyzeImage(message.data, sender.tab.id);
  }
});
