// js/popup.js

document.addEventListener('DOMContentLoaded', () => {
  const focusModeToggle = document.getElementById('focus-mode-toggle');

  // 팝업이 열릴 때, 저장된 'focusModeEnabled' 상태를 불러와서 토글 스위치에 반영한다.
  // 이 부분이 스위치의 현재 상태를 올바르게 보여주는 역할을 한다.
  chrome.storage.sync.get('focusModeEnabled', ({ focusModeEnabled }) => {
    focusModeToggle.checked = !!focusModeEnabled;
  });

  // 토글 스위치의 상태가 변경될 때마다 실행될 리스너를 추가한다.
  focusModeToggle.addEventListener('change', () => {
    const isEnabled = focusModeToggle.checked;
    
    // 변경된 상태를 chrome.storage에 저장하기만 한다.
    // 그러면 core.js에 있는 storage 감시자가 알아서 변경을 감지하고 처리할 것이다.
    chrome.storage.sync.set({ focusModeEnabled: isEnabled });
  });
});