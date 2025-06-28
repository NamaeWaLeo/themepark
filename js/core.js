// js/core.js

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
    utils: {}, // 유틸리티 함수를 위한 네임스페이스 추가
    storage: {}, // 저장소 헬퍼 함수를 위한 네임스페이스 추가

    // 확장 프로그램의 모든 상태(State)를 관리하는 객체다.
    state: {
        CURRENT_VERSION: "1.0 Beta 7", 
        dynamicThemeStyleElement: null,
        baseThemeStyleElement: null,
        fontStyleElement: null,
        layoutStyleElement: null,
        eyeSaverStyleElement: null,
        backgroundEffectStyleElement: null,
        scrollbarStyleElement: null,
        autoSaveInterval: null,
        pageObserver: null,

        // --- 랭킹 기능 관련 상태 ---
        rankingModal: null,
        rankingHistory: [],
        favoriteCreators: new Set(),
        creatorMap: new Map(), // 제작자 ID와 닉네임을 매핑
        rankingAutoSaveInterval: null,
        rankingCountdownInterval: null,
        rankingModalSettings: {
            width: 70, // 너비 조절 기능 부활 (기본 70%)
            height: 90,
            autoSaveInterval: '10'
        },
        // -------------------------

        originalPromptTexts: new WeakMap(),
        previousCustomThemeSettings: null,
        apiCache: new Map(),
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
        },
        SPECIAL_HASHTAGS: {
            PURE_LOVE: '순애', // '#' 없이 저장하고 JS에서 비교 시 '#' 제거 후 비교
            BETRAYAL: '빼앗김',
            BLUE_ARCHIVE: '블루아카이브'
        },
        // API 관련 상수
        GEMINI_API_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models/',
        DEFAULT_GEMINI_MODEL: 'gemini-1.5-flash',
        GEMINI_VISION_MODEL: 'gemini-2.0-flash',

        // 자동 저장 관련 상수
        AUTOSAVE_INTERVAL_MS: 30000, // 30초
        RANKING_MAX_HISTORY: 50,
        DEFAULT_RANKING_AUTOSAVE_MINUTES: 10,
        // 기타 UI/로직 관련 상수
        TOAST_DURATION_SHORT: 2000,
        TOAST_DURATION_NORMAL: 3000,
        TOAST_DURATION_LONG: 4000,
        TOAST_DURATION_API_ERROR: 5000,
        RESTORE_DELAY_MS: 500, // 캐릭터 수정 페이지에서 UI 주입 후 복원 지연 시간
    }
};

// 2. 유틸리티 함수 네임스페이스 (debounce는 ui.js로 이동)

ThemePark.utils = {
    /**
     * 이벤트를 일정 시간 지연시켜 과도한 호출을 막는 디바운스 함수다.
     * @param {function} func - 실행될 함수.
     * @param {number} delay - 지연 시간 (밀리초).
     * @returns {function} 디바운스된 함수.
     */
    debounce: function(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }
};

// 3. 저장소 헬퍼 함수 네임스페이스
ThemePark.storage = {
    /**
     * chrome.storage.sync에서 데이터를 가져온다.
     * @param {string|string[]|object} keys - 가져올 키 또는 키 배열, 또는 기본값 객체
     * @returns {Promise<object>}
     */
    async get(keys) {
        return new Promise(resolve => {
            chrome.storage.sync.get(keys, resolve);
        });
    },

    /**
     * chrome.storage.sync에 데이터를 저장한다.
     * @param {object} items - 저장할 키-값 쌍 객체
     * @returns {Promise<void>}
     */
    async set(items) {
        return new Promise(resolve => {
            chrome.storage.sync.set(items, resolve);
        });
    },

    /**
     * chrome.storage.local에서 데이터를 가져온다.
     * @param {string|string[]|object} keys - 가져올 키 또는 키 배열, 또는 기본값 객체
     * @returns {Promise<object>}
     */
    async getLocal(keys) {
        return new Promise(resolve => {
            chrome.storage.local.get(keys, resolve);
        });
    },

    /**
     * chrome.storage.local에 데이터를 저장한다.
     * @param {object} items - 저장할 키-값 쌍 객체
     * @returns {Promise<void>}
     */
    async setLocal(items) {
        return new Promise(resolve => {
            chrome.storage.local.set(items, resolve);
        });
    },
    /**
     * chrome.storage.sync의 모든 데이터를 지운다.
     * @returns {Promise<void>}
     */
    async clearSync() {
        return new Promise(resolve => {
            chrome.storage.sync.clear(resolve);
        });
    },

    /**
     * chrome.storage.local의 모든 데이터를 지운다.
     * @returns {Promise<void>}
     */
    async clearLocal() {
        return new Promise(resolve => {
            chrome.storage.local.clear(resolve);
        });
    }
};


// 4. 메인 실행부 (즉시 실행 함수)
(function() {
    'use strict'; // 엄격 모드를 활성화하여 코드 품질을 높인다.

    // URL 변경을 감지하고, 그에 따라 특정 기능들을 초기화하는 핸들러 함수다.
    const handleUrlChange = async () => { // async 함수로 변경
        // console.log('ThemePark: URL 변경 감지됨:', location.href);

        // 이전 페이지에서 실행되던 자동 저장 타이머가 있다면 정리한다.
        if (ThemePark.state.autoSaveInterval) {
            clearInterval(ThemePark.state.autoSaveInterval);
            ThemePark.state.autoSaveInterval = null;
        }
        
        // 현재 URL이 캐릭터 수정 페이지('/edit')를 포함하는지 확인한다.
        if (window.location.pathname.includes('/edit')) {
            const plotId = window.location.pathname.split('/')[3];
            // console.log('ThemePark: 캐릭터 수정 페이지 감지. Plot ID:', plotId);

            // 페이지가 완전히 로드될 시간을 주기 위해 약간의 지연을 둔다.
            setTimeout(async () => { // await 사용을 위해 async로 변경
                ThemePark.features.injectPromptButtons();
                ThemePark.features.startAutoSave(plotId);

                // sessionStorage에 복원할 데이터가 있는지 확인한다.
                const { 'zeta-restore-data': restoreDataJSON } = await ThemePark.storage.getLocal('zeta-restore-data'); // storage 헬퍼 사용
                if (restoreDataJSON) {
                    const restoreData = JSON.parse(restoreDataJSON);
                    if (restoreData.plotId === plotId) {
                        ThemePark.features.restoreFromData(restoreData.formData);
                    }
                    // 사용 후에는 데이터를 삭제한다.
                    await ThemePark.storage.setLocal({ 'zeta-restore-data': null }); // storage 헬퍼 사용
                } else {
                    // localStorage에 자동 저장된 내용이 있는지 확인한다.
                    const allSaves = JSON.parse(localStorage.getItem('zeta-all-autosaves') || '{}');
                    const savedData = allSaves[plotId];
                    if (savedData && confirm('임시 저장된 내용이 있습니다. 불러오시겠습니까?')) {
                        ThemePark.features.restoreFromData(savedData.formData);
                    }
                }
            }, ThemePark.config.RESTORE_DELAY_MS);
        }
    };
    
    // 페이지가 처음 로드될 때 실행될 메인 함수다.
    const onPageLoad = async () => { // async 함수로 변경
        // 이미 UI가 주입되었다면 중복 실행을 방지한다.
        if (document.querySelector('.theme-park-container') || document.getElementById('theme-park-intro')) {
            return;
        }

        // 저장된 동의 여부와 앱 버전을 불러온다.
        const { hasConsented, appVersion } = await ThemePark.storage.get(['hasConsented', 'appVersion']); // storage 헬퍼 사용
        
        // 사용자가 아직 고지 사항에 동의하지 않았다면, 인트로 화면을 보여준다.
        if (!hasConsented) {
            ThemePark.ui.showIntroScreen();
            return;
        }
        
        // 동의했다면, 메인 UI를 페이지에 주입한다.
        ThemePark.ui.injectUI();
        
        // 저장된 버전과 현재 버전이 다를 경우, 업데이트 알림을 띄운다.
        if (appVersion !== ThemePark.state.CURRENT_VERSION) {
            ThemePark.ui.showDynamicToast({
                title: `테마파크 ${ThemePark.state.CURRENT_VERSION} 업데이트!`,
                details: '새로운 기능이 추가되었습니다. 정보 탭을 확인하세요.',
                icon: '🎉'
            });
            await ThemePark.storage.set({ appVersion: ThemePark.state.CURRENT_VERSION }); // storage 헬퍼 사용
        }
        
        // URL 변경에 따른 기능 초기화를 실행한다.
        await handleUrlChange(); // await 추가
    };

    // --- 실행 시작점 ---
    
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