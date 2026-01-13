let isInitialized = false;

function initializeBookmarkButtons() {
  if (isInitialized) return;
  
  const style = document.createElement('style');
  style.textContent = `
    .bookmark-sheets-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 34.75px;
      height: 34.75px;
      border: none;
      border-radius: 9999px;
      background: transparent;
      cursor: pointer;
      color: rgb(113, 118, 123);
      padding: 0;
      margin: 0;
      transition: all 0.2s ease;
    }
    
    .bookmark-sheets-btn:hover {
      background-color: rgba(52, 168, 83, 0.1);
      color: rgb(52, 168, 83);
    }
    
    .bookmark-sheets-btn svg {
      width: 18.75px;
      height: 18.75px;
      fill: currentColor;
    }
    
    .bookmark-sheets-btn.bookmarked {
      color: rgb(52, 168, 83);
    }
    
    .bookmark-sheets-btn.bookmarked:hover {
      background-color: rgba(52, 168, 83, 0.1);
    }
    
    @keyframes bookmarkSuccess {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
      }
    }
    
    .bookmark-sheets-btn.animate {
      animation: bookmarkSuccess 0.3s ease-in-out;
    }
  `;
  document.head.appendChild(style);
  
  function createBookmarkButton() {
    const button = document.createElement('button');
    button.className = 'bookmark-sheets-btn';
    button.title = 'Google Sheetsに保存';
    button.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
        <path d="M7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z"/>
      </svg>
    `;
    
    button.addEventListener('click', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const tweet = this.closest('article');
      if (!tweet) return;
      
      const tweetData = extractTweetData(tweet);
      if (tweetData) {
        this.classList.add('animate');
        await sendToGoogleSheets(tweetData);
        this.classList.add('bookmarked');
        
        setTimeout(() => {
          this.classList.remove('animate');
        }, 300);
      }
    });
    
    return button;
  }
  
  function extractTweetData(tweetElement) {
    try {
      const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
      const text = textElement ? textElement.innerText : '';
      
      const usernameElement = tweetElement.querySelector('[data-testid="User-Name"] a');
      const username = usernameElement ? usernameElement.getAttribute('href').replace('/', '') : '';
      
      const timeElement = tweetElement.querySelector('time');
      const time = timeElement ? timeElement.getAttribute('datetime') : '';
      
      const tweetLink = tweetElement.querySelector('a[href*="/status/"]');
      const url = tweetLink ? 'https://x.com' + tweetLink.getAttribute('href') : '';
      
      return {
        text,
        username,
        time,
        url
      };
    } catch (error) {
      console.error('Error extracting tweet data:', error);
      return null;
    }
  }
  
  async function sendToGoogleSheets(tweetData) {
    try {
      if (!chrome.storage || !chrome.storage.sync) {
        console.log('Chrome storage API not available');
        return;
      }
      
      const result = await chrome.storage.sync.get(['webhookUrl']);
      const webhookUrl = result.webhookUrl;
      
      if (!webhookUrl) {
        console.log('Google Sheets URLが設定されていません');
        return;
      }
      
      // Background scriptを使用してCORSを回避
      chrome.runtime.sendMessage({
        action: 'sendToGoogleSheets',
        url: webhookUrl,
        data: tweetData
      }, function(response) {
        if (response && response.success) {
          console.log('Successfully sent to Google Sheets');
        } else {
          console.error('Failed to send to Google Sheets:', response?.error || 'Unknown error');
        }
      });
    } catch (error) {
      console.error('Error sending to Google Sheets:', error);
    }
  }
  
  function addBookmarkButtons() {
    const actionBars = document.querySelectorAll('[role="group"]');
    
    actionBars.forEach(actionBar => {
      if (actionBar.querySelector('.bookmark-sheets-btn')) return;
      
      const tweet = actionBar.closest('article');
      if (!tweet) return;
      
      const bookmarkButton = createBookmarkButton();
      actionBar.appendChild(bookmarkButton);
    });
  }
  
  const observer = new MutationObserver(() => {
    addBookmarkButtons();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  addBookmarkButtons();
  isInitialized = true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBookmarkButtons);
} else {
  initializeBookmarkButtons();
}