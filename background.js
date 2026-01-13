chrome.runtime.onInstalled.addListener(() => {
  console.log('X Bookmark to Google Sheets extension installed');
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('x.com') || tab.url.includes('twitter.com')) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  }
});

// Background scriptでGoogle Sheetsへの送信を処理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'sendToGoogleSheets') {
    fetch(message.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message.data)
    })
    .then(response => response.json())
    .then(data => {
      sendResponse({ success: true, data: data });
    })
    .catch(error => {
      console.error('Error sending to Google Sheets:', error);
      sendResponse({ success: false, error: error.toString() });
    });
    
    return true; // 非同期レスポンスを示す
  }
});