document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('settingsForm');
  const webhookUrlInput = document.getElementById('webhookUrl');
  const statusDiv = document.getElementById('status');
  
  chrome.storage.sync.get(['webhookUrl'], function(result) {
    if (result.webhookUrl) {
      webhookUrlInput.value = result.webhookUrl;
    }
  });
  
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
  
  function isValidGoogleAppsScriptUrl(url) {
    const pattern = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/;
    return pattern.test(url);
  }
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const webhookUrl = webhookUrlInput.value.trim();
    
    if (!webhookUrl) {
      showStatus('Webhook URLを入力してください', 'error');
      return;
    }
    
    if (!isValidGoogleAppsScriptUrl(webhookUrl)) {
      showStatus('有効なGoogle Apps Script URLを入力してください', 'error');
      return;
    }
    
    chrome.storage.sync.set({
      webhookUrl: webhookUrl
    }, function() {
      if (chrome.runtime.lastError) {
        showStatus('設定の保存に失敗しました', 'error');
      } else {
        showStatus('設定が保存されました', 'success');
      }
    });
  });
});