/**
 * js/features.js
 * - 확장 프로그램의 핵심 기능(Features) 로직을 담당한다.
 */
ThemePark.features = {
    // --- 테마 및 스타일 관리 ---

    // 페이지에 적용된 모든 테마 관련 스타일을 제거하는 함수다.
    clearAllThemeStyles() {
        // id로 각 스타일 요소를 찾아 제거한다.
        document.getElementById('custom-theme-style')?.remove();
        document.getElementById('base-theme-style')?.remove();

        // state에 저장된 참조를 통해 동적 스타일을 제거한다.
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

        // 기존에 있던 동적 스타일을 제거한다.
        ThemePark.state.dynamicThemeStyleElement?.remove();
        // 설정값이 없는 경우를 대비해 기본값을 합쳐준다.
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
        // style 태그를 만들어 head에 추가한다.
        ThemePark.state.dynamicThemeStyleElement = document.createElement('style');
        ThemePark.state.dynamicThemeStyleElement.id = 'dynamic-theme-style';
        ThemePark.state.dynamicThemeStyleElement.innerHTML = css;
        document.head.appendChild(ThemePark.state.dynamicThemeStyleElement);
    },

    // 글꼴을 변경하는 함수다.
    updateFont(fontName) {
        document.getElementById('custom-font-link')?.remove();
        ThemePark.state.fontStyleElement?.remove();

        const fontFamily = fontName === 'default' ? "'Pretendard Variable', sans-serif" : `'${fontName}', sans-serif`;
        
        // 구글 폰트에서 웹 폰트를 불러온다.
        if (fontName && fontName !== 'default') {
            const fontLink = document.createElement('link');
            fontLink.id = 'custom-font-link';
            fontLink.rel = 'stylesheet';
            fontLink.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;500;700&display=swap`;
            document.head.appendChild(fontLink);
        }

        // body 전체에 폰트를 적용한다.
        ThemePark.state.fontStyleElement = document.createElement('style');
        ThemePark.state.fontStyleElement.id = 'font-override-style';
        ThemePark.state.fontStyleElement.innerHTML = `body { font-family: ${fontFamily} !important; }`;
        document.head.appendChild(ThemePark.state.fontStyleElement);
    },
    
    // 레이아웃 관련 스타일(글자 크기, 아바타 등)을 업데이트하는 함수다.
    updateLayoutStyles(settings) {
        ThemePark.state.layoutStyleElement?.remove();
        const selectedTheme = document.getElementById('theme-select')?.value;
        let compactModeCss = '';

        // 디코 테마가 아닐 때만 컴팩트 모드 CSS를 적용한다.
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
        ThemePark.state.layoutStyleElement = document.createElement('style');
        ThemePark.state.layoutStyleElement.id = 'layout-override-style';
        ThemePark.state.layoutStyleElement.innerHTML = css;
        document.head.appendChild(ThemePark.state.layoutStyleElement);
    },

    // 눈 보호 모드 스타일을 적용하는 함수다.
    updateEyeSaver(enabled, strength) {
        ThemePark.state.eyeSaverStyleElement?.remove();
        if (enabled) {
            const opacity = strength / 100;
            // 화면 전체에 세피아 톤 필터를 적용하되, 우리 UI는 제외한다.
            const css = `html { filter: sepia(${opacity * 0.5}) brightness(0.95) hue-rotate(-10deg) !important; } .theme-park-container, .modal-overlay, #dynamic-island-container { filter: none !important; }`;
            ThemePark.state.eyeSaverStyleElement = document.createElement('style');
            ThemePark.state.eyeSaverStyleElement.id = 'eye-saver-style';
            ThemePark.state.eyeSaverStyleElement.innerHTML = css;
            document.head.appendChild(ThemePark.state.eyeSaverStyleElement);
        }
    },

    // 배경 효과를 적용하는 함수다.
    applyBackgroundEffect(settings, bgColor) {
        ThemePark.state.backgroundEffectStyleElement?.remove();
        clearInterval(ThemePark.state.backgroundEffectInterval);
        ThemePark.state.backgroundEffectInterval = null;

        let container = document.getElementById('theme-park-background-effects');

        if (settings.lightEffect === 'none' && settings.environmentEffect === 'none' && settings.weatherEffect === 'none' && 
            !settings.particleStars && !settings.particleFireflies && !settings.particleSakura && !settings.particleLeaves && 
            !settings.particleFireworks && !settings.particleShootingStars && !settings.particleBubbles && !settings.particleMeteors) {
            if (container) container.remove();
            document.body.style.backgroundColor = bgColor;
            return;
        }
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'theme-park-background-effects';
            document.body.insertAdjacentElement('afterbegin', container);
        }
        container.innerHTML = '';
        container.className = `bg-effect-light-${settings.lightEffect || 'none'} bg-effect-env-${settings.environmentEffect || 'none'} bg-effect-weather-${settings.weatherEffect || 'none'}`;

        const createParticles = (count, className, options = {}) => {
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
                if(className === 'cloud') {
                    particle.style.width = `${50 + Math.random() * 150}px`;
                    particle.style.height = `${20 + Math.random() * 50}px`;
                    particle.style.top = `${Math.random() * 30}vh`;
                    particle.style.animationDuration = `${20 + Math.random() * 40}s`;
                    particle.style.animationName = 'moveClouds';
                    particle.style.animationTimingFunction = 'linear';
                }
                container.appendChild(particle);
            }
        };
        
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
            rain.addEventListener('animationend', () => rain.remove());
        };

        const createSnowflake = () => {
            const snow = document.createElement('div');
            snow.className = 'particle snow';
            snow.style.left = `${Math.random() * 100}vw`;
            snow.style.animationDuration = `${5 + Math.random() * 5}s`;
            snow.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(snow);
            snow.addEventListener('animationend', () => snow.remove());
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
            const startX = Math.random() * 80 + 10;
            firecracker.style.left = `${startX}vw`;
            
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
            });
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
            shootingStar.addEventListener('animationend', () => shootingStar.remove());
        };

        const createMeteor = () => {
            const meteor = document.createElement('div');
            meteor.className = 'particle meteor';
            meteor.style.left = `${Math.random() * 60}vw`;
            meteor.style.top = `-${Math.random() * 30}vh`;
            meteor.style.animationDuration = `${2 + Math.random() * 1}s`;
            meteor.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(meteor);
            meteor.addEventListener('animationend', () => meteor.remove());
        };

        if (settings.lightEffect === 'moon') createMoon();
        if (settings.lightEffect === 'sun') createSun();

        if (settings.environmentEffect === 'rural') {
            for(let i=0; i<10; i++) {
                const grass = document.createElement('div');
                grass.className = 'env-grass';
                grass.style.left = `${Math.random() * 100}vw`;
                grass.style.animationDelay = `${Math.random() * 10}s`;
                container.appendChild(grass);

                if (Math.random() < 0.2) {
                    const streetlight = document.createElement('div');
                    streetlight.className = 'env-streetlight';
                    streetlight.style.left = `${Math.random() * 100}vw`;
                    streetlight.style.animationDelay = `${Math.random() * 15}s`;
                    container.appendChild(streetlight);
                }
            }
        } else if (settings.environmentEffect === 'city') {
            for(let i=0; i<15; i++) {
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
            createParticles(5, 'cloud');
        }

        if (settings.particleStars) createParticles(200, 'star', {size: 3});
        if (settings.particleFireflies) createParticles(20, 'firefly', {baseDuration: 6, durationVariation: 4});
        if (settings.particleSakura) createParticles(50, 'sakura', { baseDuration: 8, durationVariation: 5 });
        if (settings.particleLeaves) createParticles(50, 'leaf', { baseDuration: 7, durationVariation: 6 });
        if (settings.particleFireworks) ThemePark.state.backgroundEffectInterval = setInterval(createFirecracker, 1000 + Math.random() * 800);
        if (settings.particleShootingStars) ThemePark.state.backgroundEffectInterval = setInterval(createShootingStar, 2000 + Math.random() * 2000);
        if (settings.particleBubbles) createParticles(30, 'bubble', { baseDuration: 10, durationVariation: 8, size: 20 });
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
        ThemePark.state.backgroundEffectStyleElement = document.createElement('style');
        ThemePark.state.backgroundEffectStyleElement.id = 'background-effect-override-style';
        ThemePark.state.backgroundEffectStyleElement.innerHTML = css;
        document.head.appendChild(ThemePark.state.backgroundEffectStyleElement);
    },

    // 커스텀 스크롤바 스타일을 적용하는 함수다.
    applyCustomScrollbarStyles(settings) {
        ThemePark.state.scrollbarStyleElement?.remove();
        const finalSettings = { ...ThemePark.config.defaultCustomSettings, ...settings };
        const css = `::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-track { background: ${finalSettings.scrollbarTrackColor}; } ::-webkit-scrollbar-thumb { background: ${finalSettings.scrollbarThumbColor}; border-radius: 4px; } ::-webkit-scrollbar-thumb:hover { background: #777; }`;
        ThemePark.state.scrollbarStyleElement = document.createElement('style');
        ThemePark.state.scrollbarStyleElement.id = 'custom-scrollbar-style';
        ThemePark.state.scrollbarStyleElement.innerHTML = css;
        document.head.appendChild(ThemePark.state.scrollbarStyleElement);
    },

    // --- 데이터 관리 기능 ---
    // 현재 커스텀 테마 설정을 base64 코드로 내보내는 함수다.
    exportTheme() {
        chrome.storage.local.get('customThemeSettings', (data) => {
            const settings = data.customThemeSettings || ThemePark.config.defaultCustomSettings;
            const jsonString = JSON.stringify(settings);
            const base64String = btoa(unescape(encodeURIComponent(jsonString)));
            navigator.clipboard.writeText(base64String)
                .then(() => ThemePark.ui.showDynamicToast({title: '클립보드에 복사됨!', details: '테마 코드가 복사되었습니다.', icon: '📋'}))
                .catch(() => ThemePark.ui.showDynamicToast({title: '내보내기 오류', icon: '❌'}));
        });
    },

    // 코드를 입력받아 커스텀 테마를 가져오는 함수다.
    importTheme() {
        const code = prompt('가져올 테마 코드를 붙여넣어 주세요:');
        if (!code) return;
        try {
            const jsonString = decodeURIComponent(escape(atob(code)));
            const newSettings = JSON.parse(jsonString);
            if (!newSettings.mainBgColor) throw new Error('유효하지 않은 코드 형식');
            
            chrome.storage.local.get('customThemeSettings', (data) => {
                ThemePark.state.previousCustomThemeSettings = data.customThemeSettings || { ...ThemePark.config.defaultCustomSettings };
            });
            
            const fullSettings = { ...ThemePark.config.defaultCustomSettings, ...newSettings };
            chrome.storage.local.set({ customThemeSettings: fullSettings }, () => {
                ThemePark.ui.updateColorPickers(fullSettings);
                if (document.getElementById('theme-select').value === 'custom') {
                    this.applyCustomTheme(fullSettings);
                    this.applyCustomScrollbarStyles(fullSettings);
                }
                ThemePark.ui.showDynamicToast({title: '테마 가져오기 성공!', icon: '✅'});
            });
        } catch (e) {
            ThemePark.ui.showDynamicToast({title: '잘못된 테마 코드입니다.', details: e.message, icon: '❌'});
        }
    },

    // 커스텀 테마 설정을 기본값으로 되돌리는 함수다.
    resetTheme() {
        if (!confirm('모든 색상 설정을 기본값으로 되돌리시겠습니까?')) return;
        const defaults = ThemePark.config.defaultCustomSettings;
        chrome.storage.local.set({ customThemeSettings: defaults }, () => {
            ThemePark.ui.updateColorPickers(defaults);
            if (document.getElementById('theme-select').value === 'custom') {
                this.applyCustomTheme(defaults);
                this.applyCustomScrollbarStyles(defaults);
            }
            ThemePark.state.previousCustomThemeSettings = null;
            ThemePark.ui.showDynamicToast({title: '색상 설정이 초기화되었습니다.', icon: '🔄'});
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
            if (type === 'description') {
                actions = [
                    { text: '키워드로 세계관 자동 생성', action: 'generate_world_by_keyword' },
                ];
            } else if (type === 'character') {
                actions = [
                    { text: '키워드로 프로필 자동 생성', action: 'generate_profile_by_keyword' },
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
                    ThemePark.ui.showDynamicToast({title: '알림', details: '되돌릴 내용이 없습니다.', icon: '🤔'});
                }
            };

            mainButton.onclick = () => {
                dropdownContent.classList.toggle('show');
            };

            wrapper.appendChild(mainButton);
            wrapper.appendChild(dropdownContent);
            wrapper.appendChild(restoreButton);

            window.addEventListener('click', (event) => {
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
                        ThemePark.ui.showDynamicToast({ title: '프로필 생성 실패', details: error.message, icon: '❌', duration: 5000 });
                    }
                };
                
                imgButton.parentElement.insertBefore(newBtn, imgButton.nextSibling);
            }
        };

        const addWizardButton = (targetNode) => {
            const h3 = targetNode.querySelector('h3.body14');
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

        const observeAndApply = () => {
            document.querySelectorAll('form section.flex.flex-col.gap-2').forEach(sectionNode => {
                const h3 = sectionNode.querySelector('h3.body14');
                const textarea = sectionNode.querySelector('textarea');
                
                if (h3?.textContent.trim() === '상세 설명' && textarea && !sectionNode.querySelector('.prompt-btn-main')) { 
                    const wrapper = createDropdownMenu(textarea, 'description');
                    h3.parentElement.insertBefore(wrapper, h3.nextSibling);
                }
                addWizardButton(sectionNode);
            });
            
            document.querySelectorAll('div.flex.flex-col.gap-3 > div.flex.flex-col.gap-6').forEach(charSectionNode => {
                const h3 = charSectionNode.querySelector('h3.body14');
                const textarea = charSectionNode.querySelector('textarea[name*="description"]');
                
                addImageProfileButton(charSectionNode);

                if (h3?.textContent.trim() === '설명' && textarea && !charSectionNode.querySelector('.prompt-btn-main')) {
                    const wrapper = createDropdownMenu(textarea, 'character');
                    h3.parentElement.insertBefore(wrapper, h3.nextSibling);
                }
            });
        };
        
        observeAndApply();

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
            
            ThemePark.ui.showDynamicToast({title: `'${characterName}' 자동 저장됨`, icon: '💾', duration: 2000});
            ThemePark.ui.populateAutoSaveList();
        }, 30000); 
    },
    
    // 저장된 데이터를 폼에 복원하는 함수다.
    restoreFromData(data) {
        const form = document.querySelector('form');
        if (!form) return;
        for (const key in data) {
            const element = form.querySelector(`[name="${key}"]`);
            if (element) {
                element.value = data[key];
                element.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
        ThemePark.ui.showDynamicToast({title: '저장된 내용을 복원했습니다.', icon: '✅'});
    },

    /**
     * 랭킹 데이터를 가져와 모달에 표시하는 함수다.
     * @param {object} comparisonInfo - 비교할 과거 데이터 { data: Array, timestamp: string }
     */
    async fetchAndDisplayRankings(comparisonInfo = null) {
        console.log("[ThemePark] 랭킹 데이터 불러오기 시작...");
        ThemePark.ui.showDynamicToast({ title: '랭킹 데이터 불러오는 중...', icon: '📈', isProgress: true });
        try {
            console.log("[ThemePark] DOM에서 기본 캐릭터 정보 추출 중...");
            const basicCharacters = this._extractBasicCharacterDataFromDOM();
            console.log("[ThemePark] 추출된 기본 캐릭터:", basicCharacters);
            
            console.log("[ThemePark] 각 캐릭터의 상세 데이터 API 호출 중...");
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

            const charactersWithDetails = (await Promise.all(detailedCharacterPromises)).filter(char => char !== null);
            console.log("[ThemePark] API 호출 후 상세 정보가 포함된 캐릭터:", charactersWithDetails);
            
            console.log("[ThemePark] 캐릭터 데이터 그룹화 및 처리 중...");
            const processedRankings = this._groupAndProcessCharacters(charactersWithDetails);
            console.log("[ThemePark] 최종 처리된 랭킹 데이터:", processedRankings);
            
            const { favoriteCreators = [] } = await chrome.storage.sync.get('favoriteCreators');
            ThemePark.state.favoriteCreators = new Set(favoriteCreators);
            console.log("[ThemePark] 즐겨찾는 제작자 로드됨:", ThemePark.state.favoriteCreators);

            const { rankingModalSettings } = await chrome.storage.sync.get('rankingModalSettings');
            ThemePark.state.rankingModalSettings = { 
                width: 70, 
                height: 90, 
                autoSaveInterval: '10', 
                ...rankingModalSettings 
            };
            console.log("[ThemePark] 랭킹 모달 설정 로드됨:", ThemePark.state.rankingModalSettings);

            ThemePark.ui.showRankingModal(processedRankings, comparisonInfo);
            ThemePark.ui.showDynamicToast({ title: '랭킹 불러오기 완료!', icon: '✅' });
            console.log("[ThemePark] 랭킹 불러오기 완료. 모달 표시됨.");

            this.startRankingAutoSave();
            this.startAutoSaveCountdown();

            if (!comparisonInfo) {
                this.addRankingHistory(charactersWithDetails);
                console.log("[ThemePark] 현재 랭킹 데이터 자동 저장 기록에 추가됨.");
            }

        } catch (error) {
            console.error("[ThemePark] 랭킹 불러오기 및 표시 실패:", error);
            ThemePark.ui.showDynamicToast({ title: '랭킹 불러오기 실패', details: error.message, icon: '❌', duration: 5000 });
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
        
        // Zeta AI 페이지의 메인 콘텐츠 영역을 지정합니다.
        // 이 셀렉터는 페이지 전체 콘텐츠를 감싸는 가장 바깥쪽 컨테이너입니다.
        const mainContentArea = document.querySelector('div.flex.min-h-0.flex-col.overflow-y-auto.px-4.pt-8');
        if (!mainContentArea) {
            console.warn("[ThemePark] 메인 콘텐츠 영역 (div.flex.min-h-0.flex-col.overflow-y-auto.px-4.pt-8)을 찾을 수 없습니다. DOM 구조가 변경되었을 수 있습니다.");
            return [];
        }

        // 이제 각 랭킹 섹션 (예: '실시간 TOP 10 캐릭터', '갓 출시된 따끈따끈한 캐릭터들')을 찾습니다.
        // 이 섹션들은 `mainContentArea` 내부의 `div.flex.flex-col` 바로 아래에 있는
        // `div.flex.w-full.min-w-0.flex-col[data-index]` 요소들입니다.
        const topLevelSections = Array.from(mainContentArea.querySelectorAll(':scope > div.flex.flex-col > div.flex.w-full.min-w-0.flex-col[data-index]'));
        console.log(`[ThemePark] 최상위 섹션 ${topLevelSections.length}개 발견됨.`, topLevelSections);


        topLevelSections.forEach(topSection => {
            // 섹션 제목을 추출합니다. (예: '⚠️ [시스템] 퀘스트가 도착했습니다!', '실시간 TOP 10 캐릭터')
            const sectionTitleElement = topSection.querySelector('h2.title20');
            const sectionTitle = sectionTitleElement ? sectionTitleElement.textContent.trim().replace('⚠️ [시스템] 퀘스트가 도착했습니다!', '전체 인기 랭킹 (퀘스트)') : '알 수 없는 섹션';

            // 각 섹션 내에서 개별 캐릭터 카드 요소들을 찾습니다.
            // Swiper 컴포넌트 내부에 `.swiper-slide`가 있고 그 안에 `.group/item`이 있습니다.
            const characterElements = topSection.querySelectorAll(
                '.swiper-slide .group\\/item.flex.flex-col.w-\\[148px\\].mr-3.min-h-\\[268px\\].shrink-0, ' +
                '.swiper-slide .group\\/item.flex.flex-col.gap-3.w-\\[156px\\].mr-2.min-h-\\[241px\\].shrink-0'
            );

            console.log(`[ThemePark] DOM 추출: 섹션 '${sectionTitle}'에서 ${characterElements.length}개의 캐릭터 요소 발견.`);

            characterElements.forEach((charElement, index) => {
                const linkElement = charElement.querySelector('a[href*="/plots/"]');
                const nameElement = charElement.querySelector('a[href*="/plots/"] .title16.line-clamp-1');
                
                // 제작자 요소는 `a[href*="/creators/"]`를 통해 찾습니다.
                const creatorElement = charElement.querySelector('a[href*="/creators/"]');

                // 이미지 요소는 alt 속성에 따라 또는 일반 img 태그로 찾습니다.
                const imageUrlElement = charElement.querySelector('img[alt*="의 "], img[alt^="profile-image"], img'); 

                // 디버깅을 위해 각 요소의 찾기 성공 여부와 값을 상세히 로그 출력
                console.log(`  [Char ${index} - Section: ${sectionTitle}]`);
                console.log(`    linkElement: ${linkElement ? linkElement.outerHTML : '없음'}`);
                console.log(`    nameElement: ${nameElement ? nameElement.outerHTML : '없음'}`);
                console.log(`    creatorElement: ${creatorElement ? creatorElement.outerHTML : '없음'}`);
                console.log(`    imageUrlElement: ${imageUrlElement ? imageUrlElement.outerHTML : '없음'}`);


                // 최소한 plotId (linkElement.href)와 name (nameElement.textContent)은 있어야 유효한 캐릭터로 간주합니다.
                // creatorElement와 imageUrlElement는 없을 수도 있으므로, 이들이 없어도 캐릭터를 추가하도록 로직을 변경합니다.
                if (linkElement && nameElement && linkElement.href && nameElement.textContent) {
                    const plotIdMatch = linkElement.href.match(/\/plots\/([a-f0-9-]+)\/profile/);
                    const plotId = plotIdMatch ? plotIdMatch[1] : null;

                    // creatorElement와 imageUrlElement가 없을 경우를 대비하여 기본값 설정
                    const creatorId = creatorElement && creatorElement.href ? (creatorElement.href.match(/\/creators\/([a-f0-9-]+)\/profile/) ? creatorElement.href.match(/\/creators\/([a-f0-9-]+)\/profile/)[1] : null) : null;
                    const creatorNickname = creatorElement && creatorElement.textContent ? creatorElement.textContent.trim().replace('@', '') : '알 수 없음';
                    const imageUrl = imageUrlElement && imageUrlElement.src ? imageUrlElement.src : '';


                    if (plotId) { // plotId만 유효하면 캐릭터 데이터로 포함
                        basicCharacters.push({
                            id: plotId,
                            name: nameElement.textContent.trim(),
                            imageUrl: imageUrl,
                            creator: {
                                id: creatorId,
                                nickname: creatorNickname
                            },
                            sectionTitle: sectionTitle // 어떤 섹션에서 가져온 데이터인지 기록
                        });
                        console.log(`[ThemePark] DOM 추출: 캐릭터 추가됨 - ID: ${plotId}, 이름: ${nameElement.textContent.trim()}, 섹션: ${sectionTitle}`);
                    } else {
                         console.warn(`[ThemePark] DOM 추출: plotId를 찾을 수 없어 캐릭터 건너뜁니다.`, { element: charElement.outerHTML });
                    }
                } else {
                    console.warn('[ThemePark] DOM 추출: 필수 요소(링크 또는 이름) 누락으로 캐릭터 건너뜁니다.', {
                        element: charElement.outerHTML,
                        hasLink: !!linkElement,
                        hasName: !!nameElement,
                        hasCreatorElement: !!creatorElement, // 디버깅용으로 추가
                        hasImageUrlElement: !!imageUrlElement && !!imageUrlElement.src // 디버깅용으로 추가
                    });
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
        ThemePark.state.creatorMap.clear(); // 기존 맵 초기화
        
        // 모든 제작자 닉네임을 다시 캐싱
        characters.forEach(char => {
            if (char.creator && char.creator.id && char.creator.nickname) {
                ThemePark.state.creatorMap.set(char.creator.id, char.creator.nickname);
            }
        });
        console.log("[ThemePark] 제작자 맵 업데이트됨:", ThemePark.state.creatorMap);

        // 섹션 제목별로 캐릭터를 그룹화합니다.
        const groupedBySection = characters.reduce((acc, char) => {
            const title = char.sectionTitle || '기타';
            if (!acc[title]) {
                acc[title] = [];
            }
            acc[title].push(char);
            return acc;
        }, {});

        // 최신 HTML에서 확인된 섹션 제목들을 정확하게 반영
        const sectionOrder = [
            '전체 인기 랭킹 (퀘스트)', // ⚠️ [시스템] 퀘스트가 도착했습니다! -> 이 제목으로 변경되어 들어올 것으로 예상
            '실시간 TOP 10 캐릭터',
            '오늘만큼은 나도 알파메일',
            '이제 막 주목받기 시작한 캐릭터들', 
            '현실파괴 이세계 로맨스',
            '내 맘을 훔쳐간 유죄남 모음.zip',
            '제타에서는 나도 웹소 주인공'
        ];

        // 명확한 섹션 순서대로 추가
        sectionOrder.forEach(title => {
            if (groupedBySection[title] && groupedBySection[title].length > 0) {
                processedGroups.push({
                    title: title,
                    characters: groupedBySection[title].sort((a, b) => b.interactionCountWithRegen - a.interactionCountWithRegen),
                    isRankingSection: title === '실시간 TOP 10 캐릭터' || title === '전체 인기 랭킹 (퀘스트)'
                });
                console.log(`[ThemePark] 그룹 '${title}' 생성됨. 캐릭터 수: ${groupedBySection[title].length}`);
            }
        });

        // 위에서 처리되지 않은 기타 섹션 추가 (만약 있다면)
        for (const title in groupedBySection) {
            if (!sectionOrder.includes(title)) { // `sectionOrder`에 직접 포함되지 않은 섹션만 추가
                processedGroups.push({
                    title: title,
                    characters: groupedBySection[title],
                    isRankingSection: false
                });
                console.log(`[ThemePark] 미분류 그룹 '${title}' 추가됨. 캐릭터 수: ${groupedBySection[title].length}`);
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
        await chrome.storage.sync.set({ favoriteCreators: Array.from(ThemePark.state.favoriteCreators) });
        console.log("[ThemePark] 즐겨찾는 제작자 목록 업데이트됨:", ThemePark.state.favoriteCreators);
        if (ThemePark.state.rankingModal) {
            console.log("[ThemePark] 랭킹 모달이 열려있으므로 UI 업데이트 재실행...");
            await this.fetchAndDisplayRankings();
        }
        ThemePark.ui.populateFavoritesList();
        console.log("[ThemePark] 즐겨찾기 토글 작업 완료.");
    },

    /**
     * 모든 즐겨찾는 제작자를 삭제한다.
     */
    async clearAllFavorites() {
        console.log("[ThemePark] 모든 즐겨찾는 제작자 삭제 시도.");
        if (confirm('정말로 모든 즐겨찾는 제작자를 삭제하시겠습니까?')) {
            ThemePark.state.favoriteCreators.clear();
            await chrome.storage.sync.set({ favoriteCreators: [] });
            ThemePark.ui.populateFavoritesList();
            ThemePark.ui.showDynamicToast({ title: '모든 즐겨찾기 삭제 완료', icon: '🗑️' });
            console.log("[ThemePark] 모든 즐겨찾는 제작자 삭제 완료.");
            if (ThemePark.state.rankingModal) {
                console.log("[ThemePark] 랭킹 모달이 열려있으므로 UI 업데이트 재실행...");
                await this.fetchAndDisplayRankings();
            }
        } else {
            console.log("[ThemePark] 모든 즐겨찾는 제작자 삭제 취소.");
        }
    },

    /**
     * 현재 랭킹 데이터를 자동 저장 기록에 추가한다.
     * @param {Array} currentRankingData - 현재 시점의 랭킹 데이터
     */
    async addRankingHistory(currentRankingData) {
        console.log("[ThemePark] 랭킹 기록 추가 시도...");
        const timestamp = new Date().toISOString();
        const newRecord = { timestamp, data: currentRankingData };

        ThemePark.state.rankingHistory.push(newRecord);
        console.log("[ThemePark] 새 기록 추가됨:", newRecord);

        const MAX_HISTORY = 50;
        if (ThemePark.state.rankingHistory.length > MAX_HISTORY) {
            ThemePark.state.rankingHistory = ThemePark.state.rankingHistory.slice(ThemePark.state.rankingHistory.length - MAX_HISTORY);
            console.log(`[ThemePark] 기록이 ${MAX_HISTORY}개를 초과하여 오래된 기록이 삭제되었습니다.`);
        }
        await chrome.storage.local.set({ rankingHistory: ThemePark.state.rankingHistory });
        console.log("[ThemePark] 랭킹 기록 저장 완료. 현재 기록 수:", ThemePark.state.rankingHistory.length);
    },

    /**
     * 랭킹 자동 저장을 시작하거나 재설정한다.
     */
    async startRankingAutoSave() {
        console.log("[ThemePark] 랭킹 자동 저장 시작/재설정 시도.");
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
                const charactersWithDetails = (await Promise.all(detailedCharacterPromises)).filter(char => char !== null);
                this.addRankingHistory(charactersWithDetails);
                ThemePark.ui.showDynamicToast({ title: '랭킹 자동 저장 완료!', icon: '💾', duration: 2000 });
                ThemePark.ui.populateAutoSaveHistory();
                this.startAutoSaveCountdown();
                console.log("[ThemePark] 자동 저장 주기 작업 완료.");
            } catch (error) {
                console.error('[ThemePark] 랭킹 자동 저장 중 오류 발생:', error);
                ThemePark.ui.showDynamicToast({ title: '랭킹 자동 저장 실패', details: error.message, icon: '❌', duration: 3000 });
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
        a.download = `zeta_ranking_backup_${new Date().toISOString().slice(0,10)}.json`;
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
    restoreAndCompareData() {
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
                    if (Array.isArray(loadedData) && loadedData.length > 0 && loadedData[0].characters) {
                         // 이미 그룹화된 형태라면, 모든 캐릭터를 평탄화 (flat)
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

                    this.fetchAndDisplayRankings(comparisonInfo);
                    console.log("[ThemePark] 랭킹 모달 비교 모드로 다시 로드됨.");

                } catch (error) {
                    console.error('[ThemePark] 랭킹 백업 파일을 불러오거나 파싱하는 중 오류 발생:', error);
                    ThemePark.ui.showDynamicToast({ title: '파일 불러오기 실패', details: error.message, icon: '❌', duration: 5000 });
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
        await chrome.storage.local.set({ rankingHistory: ThemePark.state.rankingHistory });
        ThemePark.ui.populateAutoSaveHistory();
        ThemePark.ui.showDynamicToast({ title: '기록 삭제 완료', icon: '🗑️', duration: 2000 });
        console.log(`[ThemePark] 랭킹 기록 삭제 완료: ${timestamp}`);
    },

};