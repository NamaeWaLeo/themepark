/**
 * js/core.js
 * - ThemePark 전역 네임스페이스를 초기화하고 상태 변수를 관리한다.
 * - 확장 프로그램의 메인 실행 로직을 포함한다.
 * - 페이지 로드 및 URL 변경을 감지하여 필요한 기능들을 초기화하는 역할을 한다.
 */

// 1. 전역 네임스페이스 및 상태 관리 객체 선언
const ThemePark = {
    // 각 파일에서 채워질 하위 네임스페이스다.
    api: {},
    features: {},
    ui: {},

    // 확장 프로그램의 모든 상태(State)를 관리하는 객체다.
    state: {
        CURRENT_VERSION: "1.0 Beta 5", // 현재 버전 정보
        // 동적으로 생성되는 스타일 시트의 참조를 저장한다.
        dynamicThemeStyleElement: null,
        baseThemeStyleElement: null, // 공통 베이스 테마
        fontStyleElement: null,
        layoutStyleElement: null,
        eyeSaverStyleElement: null,
        backgroundEffectStyleElement: null,
        scrollbarStyleElement: null,
        focusModeStyleElement: null, // 집중 모드 스타일
        // 페이지의 변경을 감지하는 MutationObserver 인스턴스다.
        pageObserver: null,
        profileObserver: null,
        // 주기적인 작업을 위한 타이머 ID를 저장한다.
        autoSaveInterval: null,
        backgroundEffectInterval: null,
        // 데이터 임시 저장을 위해 사용한다.
        originalPromptTexts: new WeakMap(),
        previousCustomThemeSettings: null,
        apiCache: new Map(), // API 호출 결과를 캐싱하기 위한 Map
        // 동적 UI 요소의 참조를 저장한다.
        translatorModal: null,
    },

    // 확장 프로그램의 정적인 설정(Config)을 관리하는 객체다.
    config: {
        // 사용자 정의 테마의 기본 색상 값이다.
        defaultCustomSettings: {
            mainBgColor: '#1c1c1e',
            componentBgColor: '#2c2c2e',
            mainTextColor: '#e5e5e7',
            subTextColor: '#a0a0a5',
            myBubbleBgColor: '#007bff',
            myBubbleTextColor: '#ffffff',
            charBubbleBgColor: '#3a3a3c',
            charBubbleTextColor: '#e5e5e7',
            accentColor: '#007bff',
            accentTextColor: '#ffffff',
            scrollbarTrackColor: '#2c2c2e',
            scrollbarThumbColor: '#555555'
        }
    }
};

// 2. 메인 실행부 (즉시 실행 함수)
(function() {
    'use strict'; // 엄격 모드를 활성화하여 코드 품질을 높인다.

    // URL 변경을 감지하고, 그에 따라 특정 기능들을 초기화하는 핸들러 함수다.
    const handleUrlChange = () => {
        // console.log('ThemePark: URL 변경 감지됨:', location.href);

        // 이전 페이지에서 실행되던 자동 저장 타이머가 있다면 정리한다.
        if (ThemePark.state.autoSaveInterval) {
            clearInterval(ThemePark.state.autoSaveInterval);
            ThemePark.state.autoSaveInterval = null;
        }
        // 이전 페이지의 DOM을 감시하던 pageObserver가 있다면 중지한다.
        if (ThemePark.state.pageObserver) {
            ThemePark.state.pageObserver.disconnect();
            ThemePark.state.pageObserver = null;
        }
        
        // 현재 URL이 캐릭터 수정 페이지('/edit')를 포함하는지 확인한다.
        if (window.location.pathname.includes('/edit')) {
            const plotId = window.location.pathname.split('/')[3];
            // console.log('ThemePark: 캐릭터 수정 페이지 감지. Plot ID:', plotId);

            // 페이지가 완전히 로드될 시간을 주기 위해 약간의 지연을 둔다.
            setTimeout(() => {
                ThemePark.features.injectPromptButtons();
                ThemePark.features.startAutoSave(plotId);

                // sessionStorage에 복원할 데이터가 있는지 확인한다.
                const restoreDataJSON = sessionStorage.getItem('zeta-restore-data');
                if (restoreDataJSON) {
                    const restoreData = JSON.parse(restoreDataJSON);
                    if (restoreData.plotId === plotId) {
                        ThemePark.features.restoreFromData(restoreData.formData);
                    }
                    // 사용 후에는 데이터를 삭제한다.
                    sessionStorage.removeItem('zeta-restore-data');
                } else {
                    // localStorage에 자동 저장된 내용이 있는지 확인한다.
                    const allSaves = JSON.parse(localStorage.getItem('zeta-all-autosaves') || '{}');
                    const savedData = allSaves[plotId];
                    if (savedData && confirm('임시 저장된 내용이 있습니다. 불러오시겠습니까?')) {
                        ThemePark.features.restoreFromData(savedData.formData);
                    }
                }
            }, 500);
        }
    };
    
    // 페이지가 처음 로드될 때 실행될 메인 함수다.
    const onPageLoad = () => {
        // 이미 UI가 주입되었다면 중복 실행을 방지한다.
        if (document.querySelector('.theme-park-container') || document.getElementById('theme-park-intro')) {
            return;
        }

        // 저장된 동의 여부와 앱 버전을 불러온다.
        chrome.storage.sync.get(['hasConsented', 'appVersion', 'focusModeEnabled'], (data) => {
            // 집중 모드가 켜져있다면, UI를 주입하지 않고 바로 스타일만 적용한다.
            if (data.focusModeEnabled) {
                ThemePark.features.applyFocusModeStyle(true);
            }
            
            // 사용자가 아직 고지 사항에 동의하지 않았다면, 인트로 화면을 보여준다.
            if (!data.hasConsented) {
                ThemePark.ui.showIntroScreen();
                return;
            }
            
            // 동의했다면, 메인 UI를 페이지에 주입한다.
            ThemePark.ui.injectUI();
            
            // 저장된 버전과 현재 버전이 다를 경우, 업데이트 알림을 띄운다.
            if (data.appVersion !== ThemePark.state.CURRENT_VERSION) {
                ThemePark.ui.showDynamicToast({
                    title: `테마파크 ${ThemePark.state.CURRENT_VERSION} 업데이트!`,
                    details: '새로운 기능이 추가되었습니다. 정보 탭을 확인하세요.',
                    icon: '🎉'
                });
                chrome.storage.sync.set({ appVersion: ThemePark.state.CURRENT_VERSION });
            }
            
            // URL 변경에 따른 기능 초기화를 실행한다.
            handleUrlChange();
        });
    };

    // --- 실행 시작점 ---
    
    // (수정) chrome.storage의 변경을 감지하는 리스너를 등록한다.
    chrome.storage.onChanged.addListener((changes, namespace) => {
        // 'sync' 스토리지에서 'focusModeEnabled' 키가 변경되었는지 확인한다.
        if (namespace === 'sync' && changes.focusModeEnabled) {
            // 변경된 새 값을 가져온다.
            const newValue = changes.focusModeEnabled.newValue;
            // 값의 존재 여부(true/false)에 따라 스타일 적용 함수를 호출한다.
            ThemePark.features.applyFocusModeStyle(!!newValue);
        }
    });

    // 페이지 로딩 상태에 따라 onPageLoad 함수를 실행한다.
    if (document.readyState === 'complete') {
        onPageLoad();
    } else {
        window.addEventListener('load', onPageLoad);
    }
    
    // SPA(Single Page Application) 환경에서 URL 변경을 감지하기 위한 MutationObserver 설정
    let lastUrl = location.href;
    const urlObserver = new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            handleUrlChange();
        }
    });
    // body 요소의 자식 요소 추가/삭제 및 서브트리의 변경을 감지한다.
    urlObserver.observe(document.body, { subtree: true, childList: true });

})();