// js/background.js

// 확장 프로그램이 처음 설치되거나 업데이트될 때 실행됨
chrome.runtime.onInstalled.addListener(() => {
  // 컨텍스트 메뉴(우클릭 메뉴)를 생성한다.
  chrome.contextMenus.create({
    id: "translateWithThemePark", // 메뉴의 고유 ID
    title: "테마파크로 번역하기",   // 메뉴에 표시될 텍스트
    contexts: ["selection"]         // 텍스트를 선택했을 때만 메뉴가 나타나도록 설정한다.
  });
});

// 컨텍스트 메뉴가 클릭되었을 때 실행되는 리스너다.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  // 클릭된 메뉴의 ID랑 활성 탭이 있는지 확인한다.
  if (info.menuItemId === "translateWithThemePark" && tab.id) {
    // 현재 활성화된 탭으로 메시지를 보낸다.
    // 선택된 텍스트(info.selectionText)를 함께 전달한다.
    chrome.tabs.sendMessage(tab.id, {
      action: "openTranslator", // 수행할 작업의 종류
      text: info.selectionText    // 선택된 텍스트
    });
  }
});

// 콘텐츠 스크립트로부터 메시지를 수신하는 리스너다.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 옵션 페이지를 열어달라는 요청인지 확인한다.
  if (request.action === "openOptionsPage") {
    chrome.runtime.openOptionsPage();
  }
});