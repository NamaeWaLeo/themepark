/**
 * js/features.js
 * - 확장 프로그램의 핵심 기능(Features) 로직을 담당한다.
 */
ThemePark.features = {
    // --- 헬퍼 함수 (내부 사용) ---
    /**
     * 스타일 요소를 생성하거나 업데이트하는 헬퍼 함수
     * @param {string} id - 스타일 요소의 ID
     * @param {string} css - 적용할 CSS 문자열
     * @param {string} [type='text/css'] - 스타일 타입
     * @returns {HTMLElement} 생성되거나 업데이트된 style 요소
     */
    _injectStyleElement(id, css, type = 'text/css') {
        let styleElement = document.getElementById(id);
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = id;
            styleElement.type = type;
            document.head.appendChild(styleElement);
        }
        styleElement.innerHTML = css;
        return styleElement;
    },

    /**
     * 특정 스타일 요소를 제거하는 헬퍼 함수
     * @param {string} id - 제거할 스타일 요소의 ID
     */
    _removeStyleElement(id) {
        document.getElementById(id)?.remove();
    },

    /**
     * 랜덤 파티클을 생성하는 헬퍼 함수
     * @param {HTMLElement} container - 파티클을 추가할 컨테이너
     * @param {number} count - 생성할 파티클 수
     * @param {string} className - 파티클에 적용할 클래스
     * @param {object} options - 파티클 설정 (baseDuration, durationVariation, size)
     */
    _createParticles(container, count, className, options = {}) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = `particle ${className}`;
            particle.style.left = `${Math.random() * 100}vw`;

            let duration = (options.baseDuration || 3) + Math.random() * (options.durationVariation || 2);
            const delay = Math.random() * 5;
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${delay}s`;

            if (['star', 'firefly', 'bubble', 'shooting-star', 'meteor'].includes(className)) {
                const size = Math.random() * (options.size || 2) + 1;
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
            }
            if (className === 'bubble') {
                particle.style.animationTimingFunction = 'ease-in-out';
                particle.style.animationName = 'rise';
                particle.style.left = `${Math.random() * 120 - 10}vw`;
            }
            if (['star', 'firefly', 'shooting-star', 'meteor'].includes(className)) {
                particle.style.top = `${Math.random() * 100}vh`;
            }
            if (className === 'cloud') {
                particle.style.width = `${50 + Math.random() * 150}px`;
                particle.style.height = `${20 + Math.random() * 50}px`;
                particle.style.top = `${Math.random() * 30}vh`;
                particle.style.animationDuration = `${20 + Math.random() * 40}s`;
                particle.style.animationName = 'moveClouds';
                particle.style.animationTimingFunction = 'linear';
            }
            container.appendChild(particle);
            // 애니메이션 종료 시 자동 제거
            particle.addEventListener('animationend', () => particle.remove(), { once: true });
        }
    },
    // --- 테마 및 스타일 관리 ---

    // 페이지에 적용된 모든 테마 관련 스타일을 제거하는 함수다.
    clearAllThemeStyles() {
        this._removeStyleElement('custom-theme-style');
        this._removeStyleElement('base-theme-style');

        if (ThemePark.state.dynamicThemeStyleElement) {
            ThemePark.state.dynamicThemeStyleElement.remove();
            ThemePark.state.dynamicThemeStyleElement = null;
        }
        if (ThemePark.state.backgroundEffectStyleElement) {
            ThemePark.state.backgroundEffectStyleElement.remove();
            ThemePark.state.backgroundEffectStyleElement = null;
        }
        if (ThemePark.state.scrollbarStyleElement) {
            ThemePark.state.scrollbarStyleElement.remove();
            ThemePark.state.scrollbarStyleElement = null;
        }
        // 이전에 적용된 폰트 스타일도 함께 제거
        if (ThemePark.state.fontStyleElement) {
            ThemePark.state.fontStyleElement.remove();
            ThemePark.state.fontStyleElement = null;
        }
        this._removeStyleElement('custom-font-link');
    },

    // 정적 테마(insta, discord)를 적용하는 함수다.
    applyStaticTheme(themeName) {
        this.clearAllThemeStyles(); // 우선 모든 기존 테마를 제거한다.

        // 1. 공통 기반 스타일(_base.css)을 먼저 적용한다.
        const baseLink = document.createElement('link');
        baseLink.id = 'base-theme-style';
        baseLink.rel = 'stylesheet';
        baseLink.type = 'text/css';
        baseLink.href = chrome.runtime.getURL('css/_base.css');
        document.head.appendChild(baseLink);

        // 2. 그 위에 선택한 특정 테마 스타일을 덮어쓴다.
        const themeLink = document.createElement('link');
        themeLink.id = 'custom-theme-style';
        themeLink.rel = 'stylesheet';
        themeLink.type = 'text/css';
        themeLink.href = chrome.runtime.getURL(`css/${themeName}.css`);
        document.head.appendChild(themeLink);
    },

    // 사용자가 직접 설정한 커스텀 테마를 적용하는 함수다.
    applyCustomTheme(settings) {
        // 현재 테마가 'custom'이 아니면 실행하지 않는다.
        if (document.getElementById('theme-select')?.value !== 'custom') return;

        const finalSettings = { ...ThemePark.config.defaultCustomSettings, ...settings };

        // 설정값을 기반으로 CSS 코드를 동적으로 생성한다.
        const css = `
            :root {
                --main-bg-color: ${finalSettings.mainBgColor};
                --component-bg-color: ${finalSettings.componentBgColor};
                --text-color: ${finalSettings.mainTextColor};
                --sub-text-color: ${finalSettings.subTextColor};
                --my-bubble-bg-color: ${finalSettings.myBubbleBgColor};
                --my-bubble-text-color: ${finalSettings.myBubbleTextColor};
                --char-bubble-bg-color: ${finalSettings.charBubbleBgColor};
                --char-bubble-text-color: ${finalSettings.charBubbleTextColor};
                --accent-color: ${finalSettings.accentColor};
                --accent-text-color: ${finalSettings.accentTextColor};
                --border-color: rgba(255, 255, 255, 0.1);
            }
            /* 기본 테마 스타일(_base.css) 위에 덮어쓸 내용들 */
            body, .bg-gray-main, .bg-gray-sub2, .overflow-y-auto { background-color: var(--main-bg-color) !important; }
            h1, h2, h3, h4, h5, h6, .title16, .title18, .title20, .text-gray-50, .text-white, textarea[name="message"], input { color: var(--text-color) !important; }
            .text-white\\/50, .text-white\\/70, .text-gray-600, .text-footer, .body14, .body12.text-white\\/70 { color: var(--sub-text-color) !important; }
            .group\\/item > a[href], section[class*="bg-white/5"], .bg-gray-sub1, div[data-index] > .bg-gray-sub1, .bg-\\[rgba\\(62\\,62\\,65\\,0\\.90\\)\\] { background-color: var(--component-bg-color) !important; border-color: var(--border-color) !important; }
            .border, .border-white\\/5, .bg-gray-sub1 .pt-3 { border-color: var(--border-color) !important; }
            button[class*="bg-primary-400"], a[class*="bg-primary-400"] { background-color: var(--accent-color) !important; color: var(--accent-text-color) !important; border: none !important; }
            button[class*="bg-gray-800"], a[class*="bg-gray-800"] { background-color: var(--component-bg-color) !important; color: var(--text-color) !important; }
            a.text-primary-300 { color: var(--accent-color) !important; }
            .bg-primary-300 { background-color: var(--my-bubble-bg-color) !important; background-image: none !important; }
            .bg-primary-300 .text-white, .bg-primary-300 * { color: var(--my-bubble-text-color) !important; }
            .flex-row[style*="gap"] .bg-gray-sub1 { background-color: var(--char-bubble-bg-color) !important; }
            .flex-row[style*="gap"] .bg-gray-sub1 .text-white, .flex-row[style*="gap"] .bg-gray-sub1 * { color: var(--char-bubble-text-color) !important; }
            .body16.whitespace-pre-wrap { color: var(--char-bubble-text-color) !important; }
            .bg-primary-300 .body16.whitespace-pre-wrap { color: var(--my-bubble-text-color) !important; }
        `;
        ThemePark.state.dynamicThemeStyleElement = this._injectStyleElement('dynamic-theme-style', css);
    },

    // 글꼴을 변경하는 함수다.
    updateFont(fontName) {
        this._removeStyleElement('custom-font-link');
        if (ThemePark.state.fontStyleElement) {
            ThemePark.state.fontStyleElement.remove();
            ThemePark.state.fontStyleElement = null;
        }

        const fontFamily = fontName === 'default' ? "'Pretendard Variable', sans-serif" : `'${fontName}', sans-serif`;

        if (fontName && fontName !== 'default') {
            const fontLink = document.createElement('link');
            fontLink.id = 'custom-font-link';
            fontLink.rel = 'stylesheet';
            fontLink.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;500;700&display=swap`;
            document.head.appendChild(fontLink);
        }
        ThemePark.state.fontStyleElement = this._injectStyleElement('font-override-style', `body { font-family: ${fontFamily} !important; }`);
    },

    // 레이아웃 관련 스타일(글자 크기, 아바타 등)을 업데이트하는 함수다.
    updateLayoutStyles(settings) {
        if (ThemePark.state.layoutStyleElement) {
            ThemePark.state.layoutStyleElement.remove();
            ThemePark.state.layoutStyleElement = null;
        }
        const selectedTheme = document.getElementById('theme-select')?.value;
        let compactModeCss = '';

        if (settings.compactMode && selectedTheme !== 'discord') {
            compactModeCss = `
                /* 컴팩트 모드 강화 */
                .flex-row[style*="gap"] {
                    padding-top: 0.1rem !important;
                    padding-bottom: 0.1rem !important;
                    margin-bottom: 0 !important; /* 말풍선 간 간격 줄임 */
                }
                .body16.whitespace-pre-wrap {
                    font-size: ${settings.fontSize || 15}px !important;
                    line-height: 1.3 !important; /* 줄 간격 줄임 */
                    transform: scale(1.02);
                    transform-origin: left;
                }
                /* 말풍선 간 좌우 패딩 줄임 */
                .flex.flex-row.items-end.gap-3.pb-3.pt-3,
                .flex.flex-row.gap-3.pb-3.pt-3 {
                    padding-left: 0.5rem !important;
                    padding-right: 0.5rem !important;
                }
                /* 프로필 이미지 크기 줄임 */
                .w-\\[32px\\] {
                    width: 24px !important;
                    height: 24px !important;
                }
                /* 이름/시간 텍스트 크기 줄임 */
                .title12 {
                    font-size: 11px !important;
                }
                /* 채팅 입력창 높이 줄임 */
                .relative.flex.h-full.w-full.flex-col > div:last-child {
                    padding-bottom: 0.5rem !important;
                }
                textarea[name="message"] {
                    min-height: 40px !important; /* 최소 높이 줄임 */
                    padding: 8px !important; /* 패딩 줄임 */
                }
            `;
        }
        const css = `
            .body16.whitespace-pre-wrap {
                font-size: ${settings.fontSize || 15}px !important;
                transform: scale(1);
                transition: transform 0.2s ease-out;
            }
            ${settings.hideAvatars ? `a[href*="/profile?fromRoom=true"] > img { display: none !important; }` : ''}
            ${settings.animation ? `@keyframes msg-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} section.relative{animation:msg-fade .3s ease-out}` : ''}
            ${compactModeCss}
        `;
        ThemePark.state.layoutStyleElement = this._injectStyleElement('layout-override-style', css);
    },

    // 눈 보호 모드 스타일을 적용하는 함수다.
    updateEyeSaver(enabled, strength) {
        if (ThemePark.state.eyeSaverStyleElement) {
            ThemePark.state.eyeSaverStyleElement.remove();
            ThemePark.state.eyeSaverStyleElement = null;
        }
        if (enabled) {
            const opacity = strength / 100;
            // 화면 전체에 세피아 톤 필터를 적용하되, 우리 UI는 제외한다.
            const css = `html { filter: sepia(${opacity * 0.5}) brightness(0.95) hue-rotate(-10deg) !important; } .theme-park-container, .modal-overlay, #dynamic-island-container { filter: none !important; }`;
            ThemePark.state.eyeSaverStyleElement = this._injectStyleElement('eye-saver-style', css);
        }
    },

    // 배경 효과를 적용하는 함수다.
    applyBackgroundEffect(settings, bgColor) {
        if (ThemePark.state.backgroundEffectStyleElement) {
            ThemePark.state.backgroundEffectStyleElement.remove();
            ThemePark.state.backgroundEffectStyleElement = null;
        }
        clearInterval(ThemePark.state.backgroundEffectInterval);
        ThemePark.state.backgroundEffectInterval = null;

        let container = document.getElementById('theme-park-background-effects');

        const noEffects = (settings.lightEffect === 'none' || !settings.lightEffect) &&
                         (settings.environmentEffect === 'none' || !settings.environmentEffect) &&
                         (settings.weatherEffect === 'none' || !settings.weatherEffect) &&
                         !settings.particleStars &&
                         !settings.particleFireflies &&
                         !settings.particleSakura &&
                         !settings.particleLeaves &&
                         !settings.particleFireworks &&
                         !settings.particleShootingStars &&
                         !settings.particleBubbles &&
                         !settings.particleMeteors;

        if (noEffects) {
            if (container) container.remove();
            document.body.style.backgroundColor = bgColor; // 배경색은 여기서 설정
            return;
        }

        if (!container) {
            container = document.createElement('div');
            container.id = 'theme-park-background-effects';
            document.body.insertAdjacentElement('afterbegin', container);
        }
        container.innerHTML = ''; // 기존 파티클 모두 제거
        container.className = `bg-effect-light-${settings.lightEffect || 'none'} bg-effect-env-${settings.environmentEffect || 'none'} bg-effect-weather-${settings.weatherEffect || 'none'}`;

        const createMoon = () => {
            const moon = document.createElement('div');
            moon.className = 'moon';
            container.appendChild(moon);
        };

        const createSun = () => {
            const sun = document.createElement('div');
            sun.className = 'sun';
            container.appendChild(sun);
        };

        const createRaindrop = () => {
            const rain = document.createElement('div');
            rain.className = 'particle rain';
            rain.style.left = `${Math.random() * 100}vw`;
            rain.style.animationDuration = `${1.0 + Math.random() * 0.8}s`;
            rain.style.animationDelay = `${Math.random() * 2}s`;
            container.appendChild(rain);
            rain.addEventListener('animationend', () => rain.remove(), { once: true });
        };

        const createSnowflake = () => {
            const snow = document.createElement('div');
            snow.className = 'particle snow';
            snow.style.left = `${Math.random() * 100}vw`;
            snow.style.animationDuration = `${5 + Math.random() * 5}s`;
            snow.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(snow);
            snow.addEventListener('animationend', () => snow.remove(), { once: true });
        };

        const createLightning = () => {
            const lightning = document.createElement('div');
            lightning.className = 'lightning';
            lightning.style.left = `${Math.random() * 80 + 10}vw`;
            lightning.style.top = `${Math.random() * 50}vh`;
            container.appendChild(lightning);
            setTimeout(() => lightning.remove(), 500);
        };

        const createFirecracker = () => {
            const firecracker = document.createElement('div');
            firecracker.className = 'firecracker';
            firecracker.style.left = `${Math.random() * 80 + 10}vw`;

            firecracker.addEventListener('animationend', () => {
                const burstContainer = document.createElement('div');
                burstContainer.className = 'burst';
                burstContainer.style.position = 'absolute';
                burstContainer.style.top = firecracker.getBoundingClientRect().top + 'px';
                burstContainer.style.left = firecracker.getBoundingClientRect().left + 'px';
                container.appendChild(burstContainer);

                const hue = Math.random() * 360;
                for (let i = 0; i < 30; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    const angle = Math.random() * 360;
                    const distance = Math.random() * 70 + 30;
                    particle.style.background = `hsl(${hue + (Math.random() * 30 - 15)}, 100%, 70%)`;
                    particle.style.transform = `rotate(${angle}deg) translateX(${distance}px) scale(0.1)`;
                    burstContainer.appendChild(particle);
                }
                setTimeout(() => burstContainer.remove(), 1200);
                firecracker.remove();
            }, { once: true });
            container.appendChild(firecracker);
        };

        const createShootingStar = () => {
            const shootingStar = document.createElement('div');
            shootingStar.className = 'particle shooting-star';
            shootingStar.style.left = `${Math.random() * 80}vw`;
            shootingStar.style.top = `-${Math.random() * 20}vh`;
            shootingStar.style.animationDuration = `${1.0 + Math.random() * 0.5}s`;
            shootingStar.style.animationDelay = `${Math.random() * 3}s`;
            container.appendChild(shootingStar);
            shootingStar.addEventListener('animationend', () => shootingStar.remove(), { once: true });
        };

        const createMeteor = () => {
            const meteor = document.createElement('div');
            meteor.className = 'particle meteor';
            meteor.style.left = `${Math.random() * 60}vw`;
            meteor.style.top = `-${Math.random() * 30}vh`;
            meteor.style.animationDuration = `${2 + Math.random() * 1}s`;
            meteor.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(meteor);
            meteor.addEventListener('animationend', () => meteor.remove(), { once: true });
        };

        if (settings.lightEffect === 'moon') createMoon();
        if (settings.lightEffect === 'sun') createSun();

        if (settings.environmentEffect === 'rural') {
            for (let i = 0; i < 10; i++) {
                const grass = document.createElement('div');
                grass.className = 'env-grass';
                grass.style.left = `${Math.random() * 100}vw`;
                grass.style.animationDelay = `${Math.random() * 10}s`;
                container.appendChild(grass);
            }
            if (Math.random() < 0.2) { // 가로등은 20% 확률로만 생성
                const streetlight = document.createElement('div');
                streetlight.className = 'env-streetlight';
                streetlight.style.left = `${Math.random() * 100}vw`;
                streetlight.style.animationDelay = `${Math.random() * 15}s`;
                container.appendChild(streetlight);
            }
        } else if (settings.environmentEffect === 'city') {
            for (let i = 0; i < 15; i++) {
                const building = document.createElement('div');
                building.className = 'env-building';
                building.style.left = `${Math.random() * 100}vw`;
                building.style.animationDelay = `${Math.random() * 10}s`;
                building.style.setProperty('--random-height', Math.random());
                building.style.setProperty('--random-offset', Math.random());
                container.appendChild(building);

                if (Math.random() < 0.3) {
                    const windowLight = document.createElement('div');
                    windowLight.className = 'env-window-light';
                    windowLight.style.left = `calc(${Math.random() * 80 + 10}% - 1vw)`;
                    windowLight.style.bottom = `calc(${Math.random() * 70 + 5}%)`;
                    windowLight.style.animationDelay = `${Math.random() * 8}s`;
                    windowLight.style.animationName = 'moveCity';
                    windowLight.style.animationDuration = building.style.animationDuration;
                    windowLight.style.animationTimingFunction = 'linear';
                    windowLight.style.animationIterationCount = 'infinite';
                    building.appendChild(windowLight);
                }
            }
            const road = document.createElement('div');
            road.className = 'env-road';
            container.appendChild(road);
        }

        if (settings.environmentEffect !== 'none') {
            this._createParticles(container, 5, 'cloud');
        }

        if (settings.particleStars) this._createParticles(container, 200, 'star', { size: 3 });
        if (settings.particleFireflies) this._createParticles(container, 20, 'firefly', { baseDuration: 6, durationVariation: 4 });
        if (settings.particleSakura) this._createParticles(container, 50, 'sakura', { baseDuration: 8, durationVariation: 5 });
        if (settings.particleLeaves) this._createParticles(container, 50, 'leaf', { baseDuration: 7, durationVariation: 6 });
        if (settings.particleFireworks) ThemePark.state.backgroundEffectInterval = setInterval(createFirecracker, 1000 + Math.random() * 800);
        if (settings.particleShootingStars) ThemePark.state.backgroundEffectInterval = setInterval(createShootingStar, 2000 + Math.random() * 2000);
        if (settings.particleBubbles) this._createParticles(container, 30, 'bubble', { baseDuration: 10, durationVariation: 8, size: 20 });
        if (settings.particleMeteors) ThemePark.state.backgroundEffectInterval = setInterval(createMeteor, 3000 + Math.random() * 3000);

        if (settings.weatherEffect === 'snow') {
            ThemePark.state.backgroundEffectInterval = setInterval(createSnowflake, 300);
        } else if (settings.weatherEffect === 'rain') {
            ThemePark.state.backgroundEffectInterval = setInterval(createRaindrop, 100);
        } else if (settings.weatherEffect === 'thunderstorm') {
            ThemePark.state.backgroundEffectInterval = setInterval(() => {
                createRaindrop();
                if (Math.random() < 0.05) createLightning();
            }, 100);
        }

        const css = `
            body, .bg-gray-main { background: transparent !important; }
            #theme-park-background-effects { background-color: ${bgColor}; }
        `;
        ThemePark.state.backgroundEffectStyleElement = this._injectStyleElement('background-effect-override-style', css);
    },

    // 커스텀 스크롤바 스타일을 적용하는 함수다.
    applyCustomScrollbarStyles(settings) {
        if (ThemePark.state.scrollbarStyleElement) {
            ThemePark.state.scrollbarStyleElement.remove();
            ThemePark.state.scrollbarStyleElement = null;
        }
        const finalSettings = { ...ThemePark.config.defaultCustomSettings, ...settings };
        const css = `::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: ${finalSettings.scrollbarTrackColor}; } ::-webkit-scrollbar-thumb { background: ${finalSettings.scrollbarThumbColor}; border-radius: 4px; } ::-webkit-scrollbar-thumb:hover { background: #777; }`;
        ThemePark.state.scrollbarStyleElement = this._injectStyleElement('custom-scrollbar-style', css);
    },

    // --- 데이터 관리 기능 ---
    // 현재 커스텀 테마 설정을 base64 코드로 내보내는 함수다.
    exportTheme() {
        ThemePark.storage.getLocal('customThemeSettings').then(data => {
            const settings = data.customThemeSettings || ThemePark.config.defaultCustomSettings;
            const jsonString = JSON.stringify(settings);
            const base64String = btoa(unescape(encodeURIComponent(jsonString)));
            navigator.clipboard.writeText(base64String)
                .then(() => ThemePark.ui.showDynamicToast({ title: '클립보드에 복사됨!', details: '테마 코드가 복사되었습니다.', icon: '📋' }))
                .catch(() => ThemePark.ui.showDynamicToast({ title: '내보내기 오류', icon: '❌' }));
        });
    },

    // 코드를 입력받아 커스텀 테마를 가져오는 함수다.
    async importTheme() {
        const code = prompt('가져올 테마 코드를 붙여넣어 주세요:');
        if (!code) return;
        try {
            const jsonString = decodeURIComponent(escape(atob(code)));
            const newSettings = JSON.parse(jsonString);
            if (!newSettings.mainBgColor) throw new Error('유효하지 않은 코드 형식');

            const { customThemeSettings } = await ThemePark.storage.getLocal('customThemeSettings');
            ThemePark.state.previousCustomThemeSettings = customThemeSettings || { ...ThemePark.config.defaultCustomSettings };

            const fullSettings = { ...ThemePark.config.defaultCustomSettings, ...newSettings };
            await ThemePark.storage.setLocal({ customThemeSettings: fullSettings });
            ThemePark.ui.updateColorPickers(fullSettings);
            if (document.getElementById('theme-select').value === 'custom') {
                this.applyCustomTheme(fullSettings);
                this.applyCustomScrollbarStyles(fullSettings);
            }
            ThemePark.ui.showDynamicToast({ title: '테마 가져오기 성공!', icon: '✅' });
        } catch (e) {
            ThemePark.ui.showDynamicToast({ title: '잘못된 테마 코드입니다.', details: e.message, icon: '❌' });
        }
    },

    // 커스텀 테마 설정을 기본값으로 되돌리는 함수다.
    resetTheme() {
        if (!confirm('모든 색상 설정을 기본값으로 되돌리시겠습니까?')) return;
        const defaults = ThemePark.config.defaultCustomSettings;
        ThemePark.storage.setLocal({ customThemeSettings: defaults }).then(() => {
            ThemePark.ui.updateColorPickers(defaults);
            if (document.getElementById('theme-select').value === 'custom') {
                this.applyCustomTheme(defaults);
                this.applyCustomScrollbarStyles(defaults);
            }
            ThemePark.state.previousCustomThemeSettings = null;
            ThemePark.ui.showDynamicToast({ title: '색상 설정이 초기화되었습니다.', icon: '🔄' });
        });
    },

    // --- 캐릭터 수정 페이지 기능 ---
    // AI 액션에 따른 시스템 프롬프트를 생성하는 함수다.
    getSystemPromptForAction(type, actionType, context) {
        const { length, include, exclude, worldDescription, characterName } = context;
        let prompt = '';

        const commonContext = `
            ${worldDescription ? `**세계관:**\n${worldDescription}\n` : ''}
            ${characterName ? `**캐릭터 이름:** ${characterName}\n` : ''}
        `;
        const getLengthModifier = (len) => {
            switch (len) {
                case '아주 짧게': return '길이는 아주 간결하게 유지해주세요. (기존 대비 40% 축소)';
                case '짧게': return '길이는 간결하게 유지해주세요. (기존 대비 20% 축소)';
                case '보통': return '충분한 길이로 상세하게 작성해주세요.';
                default: return '';
            }
        };
        const lengthModifier = getLengthModifier(length);

        switch (actionType) {
            case 'generate_world_by_keyword':
                prompt = `당신은 시나리오 전문가입니다. 다음 정보를 바탕으로 대화형 스토리를 위한 상세한 배경 시나리오를 YAML 형식으로 재작성해주세요. 키는 '시점', '장르', '분위기', '배경', '주요_갈등'을 사용하세요.
                ${commonContext}
                사용자 원본 텍스트에 포함된 키워드를 활용하고, 이를 확장하여 상세한 세계관을 구축해주세요.
                ${lengthModifier ? `**분량 지침:** ${lengthModifier}` : ''}`;
                break;
            case 'generate_profile_by_keyword':
                prompt = `당신은 캐릭터 프롬프트 전문가입니다. 다음 정보를 바탕으로 상세한 캐릭터 프로필을 YAML 형식으로 재작성해주세요. 다음 키만 포함하세요: 'name', 'appearance', 'personality', 'speech_style', 'relationship_with_user'. 이름은 한국어로 생성해야 합니다.
                ${commonContext}
                사용자 원본 텍스트에 포함된 키워드를 활용하고, 이를 확장하여 상세한 캐릭터 프로필을 구축해주세요.
                ${lengthModifier ? `**분량 지침:** ${lengthModifier}` : ''}`;
                break;
            case 'fill_missing':
                prompt = `당신은 캐릭터 프로필 전문가입니다. 제공된 캐릭터 정보(${characterName})와 세계관 정보를 바탕으로, 누락되거나 부족한 부분을 채워 상세한 YAML 프로필을 완성해주세요. 특히 'appearance', 'personality', 'speech_style' 키에 집중하여 풍부하게 만드세요.
                ${commonContext}
                ${lengthModifier ? `**분량 지침:** ${lengthModifier}` : ''}`;
                break;
            case 'generate_relations':
                prompt = `당신은 캐릭터 관계 전문가입니다. 다음 캐릭터 프로필(${characterName})과 세계관 정보를 기반으로, {{user}}와의 관계 및 다른 잠재적 캐릭터와의 흥미로운 관계 시나리오를 'relationship_with_user' 키에 구체적으로 제안해주세요.
                ${commonContext}
                ${lengthModifier ? `**분량 지침:** ${lengthModifier}` : ''}`;
                break;
            default:
                prompt = `주어진 텍스트를 바탕으로 ${actionType}에 적합한 내용을 생성해주세요. ${lengthModifier ? `**분량 지침:** ${lengthModifier}` : ''}`;
                break;
        }
        prompt += `\n\n모든 출력은 한국어로, YAML 블록만 반환하세요. (단, 아이디어 제안은 자유 형식) 사용자는 {{user}}, 캐릭터는 {{char}}로 지칭하세요.`;
        prompt += `\n**제약 사항:**\n- 포함 키워드: ${include || '없음'}\n- 제외 키워드: ${exclude || '없음'}`;
        return prompt;
    },

    // 캐릭터 수정 페이지에 AI 보조 버튼들을 주입하는 함수다.
    injectPromptButtons() {
        const createDropdownMenu = (textarea, type) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'prompt-btn-wrapper';

            const mainButton = document.createElement('button');
            mainButton.type = 'button';
            mainButton.className = 'prompt-btn-main small-btn';
            mainButton.innerHTML = '✨ 키워드로 AI 생성';

            const dropdownContent = document.createElement('div');
            dropdownContent.className = 'prompt-dropdown-content';

            let actions = [];
            if (type === 'description') { // 세계관 상세 설명
                actions = [
                    { text: '키워드로 세계관 자동 생성', action: 'generate_world_by_keyword' },
                ];
            } else if (type === 'character') { // 캐릭터 설명 (프로필)
                actions = [
                    { text: '키워드로 프로필 자동 생성', action: 'generate_profile_by_keyword' },
                    { text: '프로필 누락 부분 채우기', action: 'fill_missing' },
                    { text: '관계 설정 제안', action: 'generate_relations' }
                ];
            }

            actions.forEach(({ text, action }) => {
                const item = document.createElement('a');
                item.href = '#';
                item.textContent = text;
                item.dataset.action = action;
                item.onclick = (e) => {
                    e.preventDefault();
                    ThemePark.api.enhanceWithGemini(textarea, type, action);
                    dropdownContent.classList.remove('show');
                };
                dropdownContent.appendChild(item);
            });

            const restoreButton = document.createElement('button');
            restoreButton.type = 'button';
            restoreButton.className = 'prompt-btn-restore small-btn';
            restoreButton.innerHTML = '⏪';
            restoreButton.title = '이전 내용으로 되돌리기';
            restoreButton.onclick = () => {
                if (ThemePark.state.originalPromptTexts.has(textarea)) {
                    textarea.value = ThemePark.state.originalPromptTexts.get(textarea);
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    ThemePark.ui.showDynamicToast({ title: '알림', details: '되돌릴 내용이 없습니다.', icon: '🤔' });
                }
            };

            mainButton.onclick = (e) => {
                e.stopPropagation(); // 버튼 클릭 시 문서 전체 클릭 이벤트 전파 방지
                dropdownContent.classList.toggle('show');
            };

            wrapper.appendChild(mainButton);
            wrapper.appendChild(dropdownContent);
            wrapper.appendChild(restoreButton);

            // 드롭다운 외부 클릭 시 닫기
            document.addEventListener('click', (event) => {
                if (!wrapper.contains(event.target)) {
                    dropdownContent.classList.remove('show');
                }
            });

            return wrapper;
        };

        const addImageProfileButton = (charSectionNode) => {
            if (charSectionNode.querySelector('.tp-img-profile-btn')) return;

            const imgButton = charSectionNode.querySelector('button.relative');
            if (imgButton) {
                const newBtn = document.createElement('button');
                newBtn.type = 'button';
                newBtn.className = 'tp-img-profile-btn small-btn';
                newBtn.innerHTML = '<span>🖼️ 이미지로 프로필 자동 생성</span>';

                newBtn.onclick = async () => {
                    const img = imgButton.querySelector('img[alt="profile-image"]');
                    if (!img || !img.src) {
                        ThemePark.ui.showDynamicToast({ title: '오류', details: '프로필 이미지를 찾을 수 없습니다.', icon: '❌' });
                        return;
                    }
                    try {
                        const worldDescriptionTextarea = document.querySelector('textarea[name="longDescription"]');
                        const worldDescription = worldDescriptionTextarea ? worldDescriptionTextarea.value.trim() : '';

                        let profileYaml = await ThemePark.api.generateProfileWithGemini(img.src, worldDescription);

                        const nameInput = charSectionNode.querySelector('input[name*="name"]');
                        const descriptionTextarea = charSectionNode.querySelector('textarea[name*="description"]');
                        const existingName = nameInput ? nameInput.value.trim() : '';

                        if (existingName) {
                            profileYaml = profileYaml.replace(/name:\s*["']?.*["']?/, `name: "${existingName}"`);
                        } else {
                            const nameMatch = profileYaml.match(/name:\s*["']?([^"'\n]+)["']?/);
                            if (nameInput && nameMatch && nameMatch[1]) {
                                nameInput.value = nameMatch[1];
                                nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        }

                        if (descriptionTextarea) {
                            descriptionTextarea.value = profileYaml;
                            descriptionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                        }

                        ThemePark.ui.showDynamicToast({ title: 'AI 프로필 적용 완료!', icon: '✨' });
                    } catch (error) {
                        ThemePark.ui.showDynamicToast({ title: '프로필 생성 실패', details: error.message, icon: '❌', duration: ThemePark.config.TOAST_DURATION_API_ERROR });
                    }
                };

                imgButton.parentElement.insertBefore(newBtn, imgButton.nextSibling);
            }
        };

        const addWizardButton = (targetNode) => {
            const h3 = targetNode.querySelector('h3.body14');
            // '상세 설명' 섹션에만 마법사 버튼 추가
            if (h3?.textContent.trim() === '상세 설명' && !targetNode.querySelector('.tp-wizard-btn')) {
                const wizardBtn = document.createElement('button');
                wizardBtn.type = 'button';
                wizardBtn.className = 'tp-wizard-btn small-btn';
                wizardBtn.innerHTML = '✨ 생성 마법사';

                wizardBtn.onclick = () => {
                    ThemePark.ui.showGeneratorWizardModal();
                };

                const promptBtnWrapper = targetNode.querySelector('.prompt-btn-wrapper');
                if (promptBtnWrapper) {
                    wizardBtn.style.height = '50%';
                    promptBtnWrapper.appendChild(wizardBtn);
                } else {
                    h3.parentElement.insertBefore(wizardBtn, h3.nextSibling);
                }
            }
        };

        // DOM 변경을 감지하여 버튼을 주입하는 함수
        const observeAndApply = () => {
            // '상세 설명' 섹션 (세계관)
            document.querySelectorAll('form section.flex.flex-col.gap-2').forEach(sectionNode => {
                const h3 = sectionNode.querySelector('h3.body14');
                const textarea = sectionNode.querySelector('textarea[name="longDescription"]'); // longDescription으로 명확히 지정

                if (h3?.textContent.trim() === '상세 설명' && textarea && !sectionNode.querySelector('.prompt-btn-main')) {
                    const wrapper = createDropdownMenu(textarea, 'description');
                    h3.parentElement.insertBefore(wrapper, h3.nextSibling);
                }
                addWizardButton(sectionNode);
            });

            // 캐릭터 설명 섹션 (프로필)
            document.querySelectorAll('div.flex.flex-col.gap-3 > div.flex.flex-col.gap-6').forEach(charSectionNode => {
                const h3 = charSectionNode.querySelector('h3.body14');
                const textarea = charSectionNode.querySelector('textarea[name*="description"]'); // name에 'description' 포함
                const nameInput = charSectionNode.querySelector('input[name*="name"]'); // name에 'name' 포함

                addImageProfileButton(charSectionNode);

                if (h3?.textContent.trim() === '설명' && textarea && nameInput && !charSectionNode.querySelector('.prompt-btn-main')) {
                    const wrapper = createDropdownMenu(textarea, 'character');
                    h3.parentElement.insertBefore(wrapper, h3.nextSibling);
                }
            });
        };

        observeAndApply();

        // MutationObserver를 사용하여 동적으로 추가되는 DOM 요소에 대응
        if (ThemePark.state.pageObserver) ThemePark.state.pageObserver.disconnect();
        ThemePark.state.pageObserver = new MutationObserver((mutations) => {
            const formReady = document.querySelector('form');
            const targetNodesChanged = mutations.some(mutation =>
                mutation.addedNodes.length > 0 && Array.from(mutation.addedNodes).some(node =>
                    node.nodeType === 1 && (node.matches('section.flex.flex-col.gap-2') || node.matches('div.flex.flex-col.gap-6'))
                )
            );

            if (formReady && targetNodesChanged) {
                observeAndApply();
            }
        });

        const form = document.querySelector('form');
        if (form) ThemePark.state.pageObserver.observe(form, { childList: true, subtree: true });
    },

    // 자동 저장을 시작하는 함수다.
    startAutoSave(plotId) {
        if (ThemePark.state.autoSaveInterval) clearInterval(ThemePark.state.autoSaveInterval);
        ThemePark.state.autoSaveInterval = setInterval(() => {
            const form = document.querySelector('form');
            if (!form) return;

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            const characterName = data.name || '제목 없음';

            const allSaves = JSON.parse(localStorage.getItem('zeta-all-autosaves') || '{}');
            allSaves[plotId] = { formData: data, timestamp: new Date().toISOString(), name: characterName };
            localStorage.setItem('zeta-all-autosaves', JSON.stringify(allSaves));

            ThemePark.ui.showDynamicToast({ title: `'${characterName}' 자동 저장됨`, icon: '💾', duration: ThemePark.config.TOAST_DURATION_SHORT });
            ThemePark.ui.populateAutoSaveList();
        }, ThemePark.config.AUTOSAVE_INTERVAL_MS);
    },

    // 저장된 데이터를 폼에 복원하는 함수다.
    restoreFromData(data) {
        const form = document.querySelector('form');
        if (!form) return;
        for (const key in data) {
            const element = form.querySelector(`[name="${key}"]`);
            if (element) {
                element.value = data[key];
                element.dispatchEvent(new Event('input', { bubbles: true })); // 데이터 변경 감지 이벤트를 수동으로 발생
            }
        }
        ThemePark.ui.showDynamicToast({ title: '저장된 내용을 복원했습니다.', icon: '✅' });
    },

    /**
     * 랭킹 데이터를 가져와 모달에 표시하는 함수다.
     * @param {object} comparisonInfo - 비교할 과거 데이터 { data: Array, timestamp: string }
     */
    async fetchAndDisplayRankings(comparisonInfo = null) {
        // 랭킹 로딩 토스트를 생성하고 참조를 유지합니다.
        let rankingLoadingToast = ThemePark.ui.showDynamicToast({ title: '랭킹 데이터 불러오는 중...', icon: '📈', isProgress: true });

        try {
            const basicCharacters = this._extractBasicCharacterDataFromDOM();

            if (basicCharacters.length === 0) {
                if (window.location.pathname !== '/ko' && window.location.pathname !== '/') {
                    ThemePark.ui.hideDynamicToast(rankingLoadingToast); // 에러 발생 시 토스트 숨김
                    ThemePark.ui.showDynamicToast({
                        title: '랭킹 데이터 없음',
                        details: '현재 페이지에서는 랭킹 데이터를 찾을 수 없습니다. Zeta AI 메인 페이지에서 확인해 주세요.',
                        icon: '❓',
                        duration: ThemePark.config.TOAST_DURATION_LONG
                    });
                    return;
                }
            }

            // Zeta API에서 상세 데이터 (대화량, 해시태그) 가져오기
            // Promise.allSettled를 사용하여 개별 API 호출 실패 시 전체가 멈추지 않도록 처리
            const detailedCharacterPromises = basicCharacters.map(async (basicChar) => {
                if (!basicChar.id) {
                    console.warn('[ThemePark] plotId가 없는 캐릭터가 발견되었습니다. 건너뜁니다:', basicChar);
                    return null;
                }
                try {
                    const detailedData = await ThemePark.api.getPlotData(basicChar.id);
                    return {
                        ...basicChar,
                        interactionCountWithRegen: detailedData.interactionCountWithRegen || 0,
                        hashtags: detailedData.hashtags || [],
                        createdAt: detailedData.createdAt
                    };
                } catch (apiError) {
                    console.error(`[ThemePark] plot ID ${basicChar.id}에 대한 상세 데이터 가져오기 실패:`, apiError);
                    return null;
                }
            });

            const results = await Promise.allSettled(detailedCharacterPromises);
            const charactersWithDetails = results
                .filter(result => result.status === 'fulfilled' && result.value !== null)
                .map(result => result.value);

            // 비교 데이터 처리: comparisonInfo가 있을 경우 comparisonMap 생성
            let comparisonMap = new Map();
            if (comparisonInfo && comparisonInfo.data) { // comparisonInfo.data가 Array이거나 Map일 수 있음
                if (comparisonInfo.data instanceof Map) { // 이미 Map 형태로 전달된 경우
                    comparisonMap = comparisonInfo.data;
                } else if (Array.isArray(comparisonInfo.data)) { // 배열 형태로 전달된 경우 (예: 파일 불러오기)
                    comparisonInfo.data.forEach(groupOrChar => {
                        if (groupOrChar.characters && Array.isArray(groupOrChar.characters)) { // 그룹화된 데이터인 경우
                            groupOrChar.characters.forEach(char => comparisonMap.set(char.id, char.interactionCountWithRegen));
                        } else { // 단순 캐릭터 배열인 경우
                            comparisonMap.set(groupOrChar.id, groupOrChar.interactionCountWithRegen);
                        }
                    });
                }
            }

            const { favoriteCreators = [] } = await ThemePark.storage.get('favoriteCreators');
            ThemePark.state.favoriteCreators = new Set(favoriteCreators);

            const { rankingModalSettings } = await ThemePark.storage.get('rankingModalSettings');
            ThemePark.state.rankingModalSettings = {
                width: 70,
                height: 90,
                autoSaveInterval: ThemePark.config.DEFAULT_RANKING_AUTOSAVE_MINUTES.toString(),
                cardsPerRow: 3, // 새롭게 추가된 설정 기본값
                ...rankingModalSettings
            };

            const processedRankings = this._groupAndProcessCharacters(charactersWithDetails);

            ThemePark.ui.hideDynamicToast(rankingLoadingToast); // 완료 시 토스트 숨김
            ThemePark.ui.showRankingModal(processedRankings, { data: comparisonMap, timestamp: comparisonInfo?.timestamp }, charactersWithDetails); // comparisonInfo.data를 map으로 전달
            ThemePark.ui.showDynamicToast({ title: '랭킹 불러오기 완료!', icon: '✅' });

            this.startRankingAutoSave();
            this.startAutoSaveCountdown();

            if (!comparisonInfo) { // 비교 모드가 아닐 때만 기록에 추가 (즉, 현재 시점 데이터를 저장)
                this.addRankingHistory(charactersWithDetails);
            }

        } catch (error) {
            ThemePark.ui.hideDynamicToast(rankingLoadingToast); // 에러 발생 시 토스트 숨김
            console.error("[ThemePark] 랭킹 불러오기 및 표시 실패:", error);
            ThemePark.ui.showDynamicToast({ title: '랭킹 불러오기 실패', details: error.message, icon: '❌', duration: ThemePark.config.TOAST_DURATION_API_ERROR });
        }
    },
    /**
     * Zeta AI 사이트의 DOM에서 기본적인 캐릭터 데이터 (ID, 이름, 이미지 URL, 제작자 정보)를 추출하는 내부 함수다.
     * 새로운 HTML 구조에 맞게 셀렉터를 수정합니다.
     * @private
     * @returns {Array<object>} 기본 정보가 포함된 캐릭터 데이터 배열
     */
    _extractBasicCharacterDataFromDOM() {
        console.log("[ThemePark] _extractBasicCharacterDataFromDOM 시작...");
        const basicCharacters = [];

        const mainContentArea = document.querySelector('div.flex.min-h-0.flex-col.overflow-y-auto.px-4.pt-8');
        if (!mainContentArea) {
            console.warn("[ThemePark] 메인 콘텐츠 영역을 찾을 수 없습니다. DOM 구조가 변경되었을 수 있습니다.");
            return [];
        }

        const topLevelSections = Array.from(mainContentArea.querySelectorAll(':scope > div.flex.flex-col > div.flex.w-full.min-w-0.flex-col[data-index]'));
        console.log(`[ThemePark] 최상위 섹션 ${topLevelSections.length}개 발견됨.`);

        topLevelSections.forEach(topSection => {
            const sectionTitleElement = topSection.querySelector('h2.title20');
            const sectionTitle = sectionTitleElement ? sectionTitleElement.textContent.trim().replace('⚠️ [시스템] 퀘스트가 도착했습니다!', '퀘스트') : '알 수 없는 섹션';

            const characterElements = topSection.querySelectorAll(
                '.swiper-slide .group\\/item.flex.flex-col.w-\\[148px\\].mr-3.min-h-\\[268px\\].shrink-0, ' +
                '.swiper-slide .group\\/item.flex.flex-col.gap-3.w-\\[156px\\].mr-2.min-h-\\[241px\\].shrink-0'
            );

            console.log(`[ThemePark] DOM 추출: 섹션 '${sectionTitle}'에서 ${characterElements.length}개의 캐릭터 요소 발견.`);

            characterElements.forEach((charElement, index) => {
                const linkElement = charElement.querySelector('a[href*="/plots/"]');
                const nameElement = charElement.querySelector('a[href*="/plots/"] .title16.line-clamp-1');
                const creatorElement = charElement.querySelector('a[href*="/creators/"]');
                const imageUrlElement = charElement.querySelector('img[alt*="의 "], img[alt^="profile-image"], img');

                if (linkElement && nameElement && linkElement.href && nameElement.textContent) {
                    const plotIdMatch = linkElement.href.match(/\/plots\/([a-f0-9-]+)\/profile/);
                    const plotId = plotIdMatch ? plotIdMatch[1] : null;

                    const creatorId = creatorElement?.href ? (creatorElement.href.match(/\/creators\/([a-f0-9-]+)\/profile/)?.[1] || null) : null;
                    const creatorNickname = creatorElement?.textContent?.trim().replace('@', '') || '알 수 없음';
                    const imageUrl = imageUrlElement?.src || '';

                    if (plotId) {
                        basicCharacters.push({
                            id: plotId,
                            name: nameElement.textContent.trim(),
                            imageUrl: imageUrl,
                            creator: {
                                id: creatorId,
                                nickname: creatorNickname
                            },
                            sectionTitle: sectionTitle
                        });
                    } else {
                        console.warn(`[ThemePark] DOM 추출: plotId를 찾을 수 없어 캐릭터 건너뜁니다.`, { element: charElement.outerHTML });
                    }
                } else {
                    console.warn('[ThemePark] DOM 추출: 필수 요소(링크 또는 이름) 누락으로 캐릭터 건너뜁니다.', { element: charElement.outerHTML });
                }
            });
        });
        console.log("[ThemePark] _extractBasicCharacterDataFromDOM 종료. 총 추출된 캐릭터 수:", basicCharacters.length);
        return basicCharacters;
    },

    /**
     * API에서 가져온 상세 캐릭터 데이터를 그룹화하여 모달에 표시할 구조로 만듭니다.
     * @param {Array<object>} characters - ThemePark.api.getPlotData로부터 가져온 상세 캐릭터 JSON 데이터 배열
     * @returns {Array<object>} 그룹화된 랭킹 섹션 배열
     */
    _groupAndProcessCharacters(characters) {
        console.log("[ThemePark] _groupAndProcessCharacters 함수 실행...");
        const processedGroups = [];
        ThemePark.state.creatorMap.clear();

        characters.forEach(char => {
            if (char.creator && char.creator.id && char.creator.nickname) {
                ThemePark.state.creatorMap.set(char.creator.id, char.creator.nickname);
            }
        });
        console.log("[ThemePark] 제작자 맵 업데이트됨:", ThemePark.state.creatorMap);

        const groupedBySection = characters.reduce((acc, char) => {
            const title = char.sectionTitle || '기타';
            if (!acc[title]) {
                acc[title] = [];
            }
            acc[title].push(char);
            return acc;
        }, {});

        // Zeta AI의 실제 섹션 순서와 제목을 반영 (TOP 10을 퀘스트보다 위로)
        const sectionOrder = [
            '실시간 TOP 10 캐릭터', // 퀘스트보다 위에 위치
            '퀘스트',
            '오늘만큼은 나도 알파메일',
            '이제 막 주목받기 시작한 캐릭터들',
            '현실파괴 이세계 로맨스',
            '내 맘을 훔쳐간 유죄남 모음.zip',
            '제타에서는 나도 웹소 주인공'
        ];

        sectionOrder.forEach(title => {
            if (groupedBySection[title] && groupedBySection[title].length > 0) {
                processedGroups.push({
                    title: title,
                    characters: groupedBySection[title].sort((a, b) => b.interactionCountWithRegen - a.interactionCountWithRegen),
                    // isRankingSection은 이펙트 적용에만 사용되므로, 퀘스트에서는 false로 변경.
                    isRankingSection: title === '실시간 TOP 10 캐릭터' // '퀘스트'는 이제 랭킹 섹션으로 간주하지 않음
                });
            }
        });

        for (const title in groupedBySection) {
            if (!sectionOrder.includes(title)) {
                processedGroups.push({
                    title: title,
                    characters: groupedBySection[title],
                    isRankingSection: false
                });
            }
        }

        console.log("[ThemePark] _groupAndProcessCharacters 함수 종료. 결과:", processedGroups);
        return processedGroups;
    },

    /**
     * 즐겨찾는 제작자를 추가/제거하고 저장한다.
     * @param {string} creatorId - 제작자 ID
     */
    async toggleFavoriteCreator(creatorId) {
    console.log(`[ThemePark] 즐겨찾기 토글: ${creatorId}`);
    const isFavorited = ThemePark.state.favoriteCreators.has(creatorId);
    if (isFavorited) {
        ThemePark.state.favoriteCreators.delete(creatorId);
        ThemePark.ui.showDynamicToast({ title: '즐겨찾기 해제', details: `${ThemePark.state.creatorMap.get(creatorId) || creatorId} 님이 즐겨찾기에서 제거되었습니다.`, icon: '⭐' });
    } else {
        ThemePark.state.favoriteCreators.add(creatorId);
        ThemePark.ui.showDynamicToast({ title: '즐겨찾기 추가', details: `${ThemePark.state.creatorMap.get(creatorId) || creatorId} 님이 즐겨찾기에 추가되었습니다.`, icon: '💖' });
    }
    await ThemePark.storage.set({ favoriteCreators: Array.from(ThemePark.state.favoriteCreators) });
    console.log("[ThemePark] 즐겨찾는 제작자 목록 업데이트됨:", ThemePark.state.favoriteCreators);

    // 랭킹 모달이 열려있으면 UI를 직접 업데이트
    if (ThemePark.state.rankingModal) {
        // 모든 랭킹 카드를 찾아서 즐겨찾기 상태에 따라 클래스를 토글합니다.
        ThemePark.state.rankingModal.querySelectorAll(`.ranking-card[data-creator-id="${creatorId}"]`).forEach(card => {
            const favBtn = card.querySelector('.favorite-btn');
            if (ThemePark.state.favoriteCreators.has(creatorId)) {
                // 랭킹 카드에 rank- 클래스가 없는 경우에만 favorite-creator 클래스 추가
                // 이렇게 하면 랭킹 1,2,3위 카드는 즐겨찾기 배경이 적용되지 않고 랭킹 강조만 유지됩니다.
                if (!card.classList.contains('rank-gold') && !card.classList.contains('rank-silver') && !card.classList.contains('rank-bronze')) {
                    card.classList.add('favorite-creator');
                }
                favBtn.classList.add('active');
            } else {
                card.classList.remove('favorite-creator'); // 즐겨찾기 해제 시 무조건 제거
                favBtn.classList.remove('active');
            }
        });
    }
    ThemePark.ui.populateFavoritesList(); // 즐겨찾기 관리 탭 업데이트
    console.log("[ThemePark] 즐겨찾기 토글 작업 완료.");
    },

    /**
     * 모든 즐겨찾는 제작자를 삭제한다.
     */
    async clearAllFavorites() {
        console.log("[ThemePark] 모든 즐겨찾는 제작자 삭제 시도.");
        if (confirm('정말로 모든 즐겨찾는 제작자를 삭제하시겠습니까?')) {
            ThemePark.state.favoriteCreators.clear();
            await ThemePark.storage.set({ favoriteCreators: [] });
            ThemePark.ui.populateFavoritesList();
            ThemePark.ui.showDynamicToast({ title: '모든 즐겨찾기 삭제 완료', icon: '🗑️' });
            console.log("[ThemePark] 모든 즐겨찾는 제작자 삭제 완료.");
            if (ThemePark.state.rankingModal) {
                await this.fetchAndDisplayRankings();
            }
        } else {
            console.log("[ThemePark] 모든 즐겨찾는 제작자 삭제 취소.");
        }
    },

    /**
     * 현재 랭킹 데이터를 자동 저장 기록에 추가한다.
     * 이 함수는 이제 `charactersWithDetails` 배열을 직접 받습니다.
     * @param {Array} currentDetailedCharacters - 현재 시점의 상세 캐릭터 데이터 (API 호출 후)
     */
    async addRankingHistory(currentDetailedCharacters) { // 매개변수 이름 변경
        console.log("[ThemePark] 랭킹 기록 추가 시도...");
        const timestamp = new Date().toISOString();
        // processedRankings 대신 currentDetailedCharacters (원본 상세 데이터)를 저장
        const newRecord = { timestamp, data: currentDetailedCharacters };

        ThemePark.state.rankingHistory.push(newRecord);

        if (ThemePark.state.rankingHistory.length > ThemePark.config.RANKING_MAX_HISTORY) {
            ThemePark.state.rankingHistory = ThemePark.state.rankingHistory.slice(ThemePark.state.rankingHistory.length - ThemePark.config.RANKING_MAX_HISTORY);
            console.log(`[ThemePark] 기록이 ${ThemePark.config.RANKING_MAX_HISTORY}개를 초과하여 오래된 기록이 삭제되었습니다.`);
        }
        await ThemePark.storage.setLocal({ rankingHistory: ThemePark.state.rankingHistory });
        console.log("[ThemePark] 랭킹 기록 저장 완료. 현재 기록 수:", ThemePark.state.rankingHistory.length);
    },

    /**
     * 랭킹 자동 저장을 시작하거나 재설정한다.
     */
    async startRankingAutoSave() {
        clearInterval(ThemePark.state.rankingAutoSaveInterval);
        const intervalMinutes = parseInt(ThemePark.state.rankingModalSettings.autoSaveInterval);

        if (isNaN(intervalMinutes) || intervalMinutes <= 0) {
            console.log('[ThemePark] 랭킹 자동 저장 비활성화됨.');
            return;
        }

        const intervalMs = intervalMinutes * 60 * 1000;
        console.log(`[ThemePark] 랭킹 자동 저장 시작. 주기: ${intervalMinutes}분 (${intervalMs}ms)`);

        ThemePark.state.rankingAutoSaveInterval = setInterval(async () => {
            console.log("[ThemePark] 자동 저장 주기 도달: 랭킹 데이터 불러오기 및 저장 시작.");
            try {
                const basicCharacters = this._extractBasicCharacterDataFromDOM();
                const detailedCharacterPromises = basicCharacters.map(async (basicChar) => {
                    if (!basicChar.id) return null;
                    try {
                        const detailedData = await ThemePark.api.getPlotData(basicChar.id);
                        return {
                            ...basicChar,
                            interactionCountWithRegen: detailedData.interactionCountWithRegen || 0,
                            hashtags: detailedData.hashtags || [],
                            createdAt: detailedData.createdAt
                        };
                    } catch (apiError) {
                        console.error(`[ThemePark] plot ID ${basicChar.id}에 대한 상세 데이터 가져오기 실패 (자동 저장 중):`, apiError);
                        return null;
                    }
                });
                const results = await Promise.allSettled(detailedCharacterPromises); // allSettled 사용
                const charactersWithDetails = results
                    .filter(result => result.status === 'fulfilled' && result.value !== null)
                    .map(result => result.value);

                if (charactersWithDetails.length === 0) {
                    console.warn('[ThemePark] 자동 저장 시 랭킹 데이터를 찾을 수 없어 저장하지 않습니다.');
                    ThemePark.ui.showDynamicToast({ title: '자동 저장 건너뜀', details: '현재 랭킹 데이터를 찾을 수 없습니다.', icon: '⚠️', duration: ThemePark.config.TOAST_DURATION_SHORT });
                    return;
                }

                this.addRankingHistory(charactersWithDetails);
                ThemePark.ui.showDynamicToast({ title: '랭킹 자동 저장 완료!', icon: '💾', duration: ThemePark.config.TOAST_DURATION_SHORT });
                ThemePark.ui.populateAutoSaveHistory();
                this.startAutoSaveCountdown();
                console.log("[ThemePark] 자동 저장 주기 작업 완료.");
            } catch (error) {
                console.error('[ThemePark] 랭킹 자동 저장 중 오류 발생:', error);
                ThemePark.ui.showDynamicToast({ title: '랭킹 자동 저장 실패', details: error.message, icon: '❌', duration: ThemePark.config.TOAST_DURATION_NORMAL });
            }
        }, intervalMs);

        this.startAutoSaveCountdown();
    },

    /**
     * 랭킹 모달 내의 자동 저장 카운트다운을 시작한다.
     */
    startAutoSaveCountdown() {
        console.log("[ThemePark] 자동 저장 카운트다운 시작.");
        clearInterval(ThemePark.state.rankingCountdownInterval);
        const intervalMinutes = parseInt(ThemePark.state.rankingModalSettings.autoSaveInterval);
        const timerDisplay = document.getElementById('autosave-timer-display');

        if (isNaN(intervalMinutes) || intervalMinutes <= 0) {
            if (timerDisplay) timerDisplay.textContent = '비활성화';
            console.log("[ThemePark] 자동 저장 카운트다운 비활성화됨.");
            return;
        }

        let remainingSeconds = intervalMinutes * 60;

        const updateDisplay = () => {
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            if (timerDisplay) {
                timerDisplay.textContent = `${minutes}분 ${seconds < 10 ? '0' : ''}${seconds}초 남음`;
            }
        };

        updateDisplay();

        ThemePark.state.rankingCountdownInterval = setInterval(() => {
            remainingSeconds--;
            if (remainingSeconds < 0) {
                remainingSeconds = intervalMinutes * 60;
            }
            updateDisplay();
        }, 1000);
        console.log("[ThemePark] 자동 저장 카운트다운 업데이트 시작됨.");
    },

    /**
     * 랭킹 기록을 백업한다 (JSON 파일로 저장).
     * @param {Array} data - 백업할 랭킹 데이터
     */
    backupRankingData(data) {
        console.log("[ThemePark] 랭킹 데이터 백업 시작.");
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zeta_ranking_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        ThemePark.ui.showDynamicToast({ title: '랭킹 데이터 백업 완료!', icon: '📥' });
        console.log("[ThemePark] 랭킹 데이터 백업 완료.");
    },

    /**
     * 백업 파일로부터 랭킹 데이터를 불러와 현재 랭킹과 비교한다.
     */
    async restoreAndCompareData() {
        console.log("[ThemePark] 랭킹 백업 파일 불러오기 및 비교 시작.");
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) {
                console.log("[ThemePark] 선택된 파일 없음. 파일 불러오기 취소.");
                return;
            }

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const loadedData = JSON.parse(event.target.result);
                    console.log("[ThemePark] 파일에서 불러온 데이터:", loadedData);

                    let charactersToProcess = loadedData;
                    // 불러온 데이터가 이미 그룹화된 형태라면 평탄화
                    if (Array.isArray(loadedData) && loadedData.length > 0 && loadedData[0].characters && Array.isArray(loadedData[0].characters)) {
                        charactersToProcess = loadedData.flatMap(group => group.characters);
                        console.log("[ThemePark] 불러온 데이터가 이미 그룹화되어 있어 평탄화됨:", charactersToProcess);
                    } else if (!Array.isArray(loadedData)) {
                        throw new Error('파일 형식이 올바르지 않습니다.');
                    }

                    ThemePark.ui.showDynamicToast({ title: '데이터 불러오기 완료!', details: '현재 랭킹과 비교합니다.', icon: '📊' });

                    const comparisonInfo = {
                        data: this._groupAndProcessCharacters(charactersToProcess),
                        timestamp: file.lastModifiedDate.toISOString()
                    };
                    console.log("[ThemePark] 비교 데이터 준비 완료:", comparisonInfo);

                    await this.fetchAndDisplayRankings(comparisonInfo);
                    console.log("[ThemePark] 랭킹 모달 비교 모드로 다시 로드됨.");

                } catch (error) {
                    console.error('[ThemePark] 랭킹 백업 파일을 불러오거나 파싱하는 중 오류 발생:', error);
                    ThemePark.ui.showDynamicToast({ title: '파일 불러오기 실패', details: error.message, icon: '❌', duration: ThemePark.config.TOAST_DURATION_API_ERROR });
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    /**
     * 특정 랭킹 기록을 삭제한다.
     * @param {string} timestamp - 삭제할 기록의 타임스탬프
     */
    async deleteRankingHistory(timestamp) {
        console.log(`[ThemePark] 랭킹 기록 삭제 시도: ${timestamp}`);
        ThemePark.state.rankingHistory = ThemePark.state.rankingHistory.filter(item => item.timestamp !== timestamp);
        await ThemePark.storage.setLocal({ rankingHistory: ThemePark.state.rankingHistory });
        ThemePark.ui.populateAutoSaveHistory();
        ThemePark.ui.showDynamicToast({ title: '기록 삭제 완료', icon: '🗑️', duration: ThemePark.config.TOAST_DURATION_SHORT });
        console.log(`[ThemePark] 랭킹 기록 삭제 완료: ${timestamp}`);
    },

};