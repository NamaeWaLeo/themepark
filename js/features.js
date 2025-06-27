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
    applyBackgroundEffect(settings, bgColor) { // settings 객체를 받도록 변경
        ThemePark.state.backgroundEffectStyleElement?.remove();
        clearInterval(ThemePark.state.backgroundEffectInterval);
        ThemePark.state.backgroundEffectInterval = null;

        let container = document.getElementById('theme-park-background-effects');

        // '없음'을 선택하면 컨테이너를 제거하고 body에 배경색을 직접 적용한다.
        if (settings.lightEffect === 'none' && settings.environmentEffect === 'none' && settings.weatherEffect === 'none' && 
            !settings.particleStars && !settings.particleFireflies && !settings.particleSakura && !settings.particleLeaves && 
            !settings.particleFireworks && !settings.particleShootingStars && !settings.particleBubbles && !settings.particleMeteors) {
            if (container) container.remove();
            document.body.style.backgroundColor = bgColor;
            return;
        }
        
        // 컨테이너가 없으면 새로 만든다.
        if (!container) {
            container = document.createElement('div');
            container.id = 'theme-park-background-effects';
            document.body.insertAdjacentElement('afterbegin', container);
        }
        container.innerHTML = '';
        container.className = `bg-effect-light-${settings.lightEffect || 'none'} bg-effect-env-${settings.environmentEffect || 'none'} bg-effect-weather-${settings.weatherEffect || 'none'}`; // 클래스명 설정

        // 파티클(입자)을 생성하는 헬퍼 함수
        const createParticles = (count, className, options = {}) => {
            for (let i = 0; i < count; i++) {
                const particle = document.createElement('div');
                particle.className = `particle ${className}`;
                particle.style.left = `${Math.random() * 100}vw`;
                
                let duration = (options.baseDuration || 3) + Math.random() * (options.durationVariation || 2);
                const delay = Math.random() * 5;
                particle.style.animationDuration = `${duration}s`;
                particle.style.animationDelay = `${delay}s`;

                // 효과별 추가 스타일
                if (['star', 'firefly', 'bubble', 'shooting-star', 'meteor'].includes(className)) {
                    const size = Math.random() * (options.size || 2) + 1;
                    particle.style.width = `${size}px`;
                    particle.style.height = `${size}px`;
                }
                 if (className === 'bubble') {
                    particle.style.animationTimingFunction = 'ease-in-out';
                    particle.style.animationName = 'rise';
                    particle.style.left = `${Math.random() * 120 - 10}vw`; // 화면 밖에서도 시작
                }
                if (['star', 'firefly', 'shooting-star', 'meteor'].includes(className)) {
                    particle.style.top = `${Math.random() * 100}vh`;
                }
                if(className === 'cloud') { // 구름 효과
                    particle.style.width = `${50 + Math.random() * 150}px`;
                    particle.style.height = `${20 + Math.random() * 50}px`;
                    particle.style.top = `${Math.random() * 30}vh`;
                    particle.style.animationDuration = `${20 + Math.random() * 40}s`; // 느리게 움직이도록
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

        const createSun = () => { // 태양 생성 함수
            const sun = document.createElement('div');
            sun.className = 'sun';
            container.appendChild(sun);
        };

        const createRaindrop = () => { // 빗방울 생성
            const rain = document.createElement('div');
            rain.className = 'particle rain';
            rain.style.left = `${Math.random() * 100}vw`;
            rain.style.animationDuration = `${1.0 + Math.random() * 0.8}s`; // 비 속도 느리게
            rain.style.animationDelay = `${Math.random() * 2}s`;
            container.appendChild(rain);
            rain.addEventListener('animationend', () => rain.remove());
        };

        const createSnowflake = () => { // 눈송이 생성
            const snow = document.createElement('div');
            snow.className = 'particle snow';
            snow.style.left = `${Math.random() * 100}vw`;
            snow.style.animationDuration = `${5 + Math.random() * 5}s`;
            snow.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(snow);
            snow.addEventListener('animationend', () => snow.remove());
        };

        const createLightning = () => { // 천둥 번개 효과 (번개 이미지를 사용하거나 CSS로 그릴 수 있음)
            const lightning = document.createElement('div');
            lightning.className = 'lightning';
            lightning.style.left = `${Math.random() * 80 + 10}vw`;
            lightning.style.top = `${Math.random() * 50}vh`;
            container.appendChild(lightning);
            setTimeout(() => lightning.remove(), 500); // 0.5초 후 사라짐
        };
        
        // 수정된 불꽃놀이 효과 생성 함수
        const createFirecracker = () => {
            const firecracker = document.createElement('div');
            firecracker.className = 'firecracker';
            const startX = Math.random() * 80 + 10;
            firecracker.style.left = `${startX}vw`;
            
            firecracker.addEventListener('animationend', () => {
                // 폭죽이 터질 위치를 잡는다.
                const burstContainer = document.createElement('div');
                burstContainer.className = 'burst';
                burstContainer.style.position = 'absolute';
                burstContainer.style.top = firecracker.getBoundingClientRect().top + 'px';
                burstContainer.style.left = firecracker.getBoundingClientRect().left + 'px';
                container.appendChild(burstContainer);

                const hue = Math.random() * 360;
                // 작은 파편들을 생성한다.
                for (let i = 0; i < 30; i++) { // 파편 수 증가
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    const angle = Math.random() * 360;
                    const distance = Math.random() * 70 + 30; // 흩어지는 거리 증가
                    particle.style.background = `hsl(${hue + (Math.random() * 30 - 15)}, 100%, 70%)`;
                    particle.style.transform = `rotate(${angle}deg) translateX(${distance}px) scale(0.1)`;
                    burstContainer.appendChild(particle);
                }
                // 일정 시간 후 폭발 컨테이너를 제거한다.
                setTimeout(() => burstContainer.remove(), 1200); // 사라지는 시간 증가
                firecracker.remove();
            });
            container.appendChild(firecracker);
        };

        const createShootingStar = () => { // 별똥별 생성
            const shootingStar = document.createElement('div');
            shootingStar.className = 'particle shooting-star';
            shootingStar.style.left = `${Math.random() * 80}vw`;
            shootingStar.style.top = `-${Math.random() * 20}vh`;
            shootingStar.style.animationDuration = `${1.0 + Math.random() * 0.5}s`; // 떨어지는 시간 단축
            shootingStar.style.animationDelay = `${Math.random() * 3}s`; // 더 자주 나타나도록
            container.appendChild(shootingStar);
            shootingStar.addEventListener('animationend', () => shootingStar.remove());
        };

        const createMeteor = () => { // 메테오 생성
            const meteor = document.createElement('div');
            meteor.className = 'particle meteor';
            meteor.style.left = `${Math.random() * 60}vw`; // 왼쪽 상단에서 시작
            meteor.style.top = `-${Math.random() * 30}vh`;
            meteor.style.animationDuration = `${2 + Math.random() * 1}s`; // 떨어지는 시간 단축
            meteor.style.animationDelay = `${Math.random() * 5}s`; // 더 자주 나타나도록
            container.appendChild(meteor);
            meteor.addEventListener('animationend', () => meteor.remove());
        };


        // 라디오 버튼 기반 효과
        if (settings.lightEffect === 'moon') createMoon();
        if (settings.lightEffect === 'sun') createSun();

        // 환경 효과
        if (settings.environmentEffect === 'rural') {
            // 시골 배경 요소 (풀, 가로등)
            for(let i=0; i<10; i++) {
                const grass = document.createElement('div');
                grass.className = 'env-grass';
                grass.style.left = `${Math.random() * 100}vw`;
                grass.style.animationDelay = `${Math.random() * 10}s`;
                container.appendChild(grass);

                if (Math.random() < 0.2) { // 낮은 확률로 가로등
                    const streetlight = document.createElement('div');
                    streetlight.className = 'env-streetlight';
                    streetlight.style.left = `${Math.random() * 100}vw`;
                    streetlight.style.animationDelay = `${Math.random() * 15}s`;
                    container.appendChild(streetlight);
                }
            }
        } else if (settings.environmentEffect === 'city') {
            // 도시 배경 요소 (건물, 불빛, 도로)
            for(let i=0; i<15; i++) {
                const building = document.createElement('div');
                building.className = 'env-building';
                building.style.left = `${Math.random() * 100}vw`;
                building.style.animationDelay = `${Math.random() * 10}s`;
                // 건물 높이 랜덤 변수 설정 (CSS var를 통해 제어)
                building.style.setProperty('--random-height', Math.random());
                // 건물 초기 위치 랜덤 변수 설정
                building.style.setProperty('--random-offset', Math.random()); 
                container.appendChild(building);

                // 건물 불빛 (건물 내부에 위치하도록 조정)
                if (Math.random() < 0.3) {
                    const windowLight = document.createElement('div');
                    windowLight.className = 'env-window-light';
                    // 불빛이 건물 내부에 위치하도록 left와 bottom을 건물 기준으로 설정
                    // left는 건물의 상대적인 위치를 기준으로, top은 건물 높이에 비례하여 설정
                    windowLight.style.left = `calc(${Math.random() * 80 + 10}% - 1vw)`; // 건물 폭 내에서 랜덤
                    windowLight.style.bottom = `calc(${Math.random() * 70 + 5}%)`; // 건물 높이 내에서 랜덤
                    windowLight.style.animationDelay = `${Math.random() * 8}s`;
                    // windowLight 자체의 이동 애니메이션을 건물과 동기화
                    windowLight.style.animationName = 'moveCity'; 
                    windowLight.style.animationDuration = building.style.animationDuration; // 건물과 같은 속도로
                    windowLight.style.animationTimingFunction = 'linear';
                    windowLight.style.animationIterationCount = 'infinite';
                    building.appendChild(windowLight); // 불빛을 건물 내부에 추가
                }
            }
            const road = document.createElement('div');
            road.className = 'env-road';
            container.appendChild(road);
        }

        // 공통 구름 효과
        if (settings.environmentEffect !== 'none') {
            createParticles(5, 'cloud');
        }

        // 체크박스 기반 파티클 효과
        if (settings.particleStars) createParticles(200, 'star', {size: 3});
        if (settings.particleFireflies) createParticles(20, 'firefly', {baseDuration: 6, durationVariation: 4});
        if (settings.particleSakura) createParticles(50, 'sakura', { baseDuration: 8, durationVariation: 5 });
        if (settings.particleLeaves) createParticles(50, 'leaf', { baseDuration: 7, durationVariation: 6 });
        if (settings.particleFireworks) ThemePark.state.backgroundEffectInterval = setInterval(createFirecracker, 1000 + Math.random() * 800);
        if (settings.particleShootingStars) ThemePark.state.backgroundEffectInterval = setInterval(createShootingStar, 2000 + Math.random() * 2000);
        if (settings.particleBubbles) createParticles(30, 'bubble', { baseDuration: 10, durationVariation: 8, size: 20 });
        if (settings.particleMeteors) ThemePark.state.backgroundEffectInterval = setInterval(createMeteor, 3000 + Math.random() * 3000);

        // 날씨 효과
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

        // body의 배경을 투명하게 만들어 아래의 효과 컨테이너가 보이게 한다.
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
            // 한글 등 멀티바이트 문자를 안전하게 인코딩한다.
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
            // 인코딩된 코드를 디코딩하여 JSON으로 파싱한다.
            const jsonString = decodeURIComponent(escape(atob(code)));
            const newSettings = JSON.parse(jsonString);
            // 코드 형식이 유효한지 간단히 검사한다.
            if (!newSettings.mainBgColor) throw new Error('유효하지 않은 코드 형식');
            
            // 되돌리기를 위해 이전 설정을 저장해둔다.
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

        // 캐릭터와 세계관 설명을 함께 고려하여 프롬프트 강화
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
            case 'generate_world_by_keyword': // 새로운 세계관 생성 액션
                prompt = `당신은 시나리오 전문가입니다. 사용자의 키워드와 제공된 캐릭터 정보를 바탕으로 대화형 스토리를 위한 상세한 배경 시나리오를 YAML 형식으로 재작성해주세요. 키는 '시점', '장르', '분위기', '배경', '주요_갈등'을 사용하세요.
                ${commonContext}
                사용자 원본 텍스트에 포함된 키워드를 활용하고, 이를 확장하여 상세한 세계관을 구축해주세요.
                ${lengthModifier ? `**분량 지침:** ${lengthModifier}` : ''}`;
                break;
            case 'generate_profile_by_keyword': // 새로운 프로필 생성 액션
                prompt = `당신은 캐릭터 프롬프트 전문가입니다. 사용자의 키워드와 제공된 세계관 정보를 바탕으로 상세한 캐릭터 프로필을 YAML 형식으로 재작성해주세요. 다음 키만 포함하세요: 'name', 'appearance', 'personality', 'speech_style', 'relationship_with_user'. 이름은 한국어로 생성해야 합니다.
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
        // AI 도우미 드롭다운 메뉴를 생성하는 헬퍼 함수 (세계관, 키워드 생성용)
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
            } else if (type === 'character') { // 캐릭터 설명
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
             // 이미 버튼이 있으면 추가하지 않는다.
            if (charSectionNode.querySelector('.tp-img-profile-btn')) return;

            // 캐릭터 프로필 이미지를 감싸는 버튼을 찾는다.
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
                        // API 호출 전, 전체 세계관 정보를 가져온다.
                        const worldDescriptionTextarea = document.querySelector('textarea[name="longDescription"]');
                        const worldDescription = worldDescriptionTextarea ? worldDescriptionTextarea.value.trim() : '';

                        // API를 호출하여 프로필 텍스트를 받아온다.
                        let profileYaml = await ThemePark.api.generateProfileWithGemini(img.src, worldDescription);
                        
                        // 현재 캐릭터 섹션에 해당하는 이름과 설명 textarea를 찾는다.
                        const nameInput = charSectionNode.querySelector('input[name*="name"]');
                        const descriptionTextarea = charSectionNode.querySelector('textarea[name*="description"]');
                        const existingName = nameInput ? nameInput.value.trim() : '';

                        // 이름 입력칸에 이미 값이 있다면, AI가 생성한 이름을 덮어쓴다.
                        if (existingName) {
                            profileYaml = profileYaml.replace(/name:\s*["']?.*["']?/, `name: "${existingName}"`);
                        } else {
                            // 값이 없다면, AI가 생성한 이름을 이름 입력칸에 넣어준다.
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
                
                // 이미지 버튼 아래에 새로운 버튼을 추가한다.
                imgButton.parentElement.insertBefore(newBtn, imgButton.nextSibling);
            }
        };

        const addWizardButton = (targetNode) => {
            // 생성 마법사 버튼은 세계관 상세 설명 섹션에만 추가
            const h3 = targetNode.querySelector('h3.body14');
            if (h3?.textContent.trim() === '상세 설명' && !targetNode.querySelector('.tp-wizard-btn')) {
                const wizardBtn = document.createElement('button');
                wizardBtn.type = 'button';
                wizardBtn.className = 'tp-wizard-btn small-btn'; // 작은 버튼 스타일 유지
                wizardBtn.innerHTML = '✨ 생성 마법사';

                wizardBtn.onclick = () => {
                    ThemePark.ui.showGeneratorWizardModal(); // 생성 마법사 모달 열기
                };

                // 기존 '키워드로 AI 생성' 드롭다운 버튼 옆에 추가되도록 위치 조정
                const promptBtnWrapper = targetNode.querySelector('.prompt-btn-wrapper');
                if (promptBtnWrapper) {
                    // prompt-btn-wrapper의 자식으로 추가하여 flex 컨테이너에 포함시키고, height를 50% 줄임
                    wizardBtn.style.height = '50%'; 
                    promptBtnWrapper.appendChild(wizardBtn);
                } else {
                    h3.parentElement.insertBefore(wizardBtn, h3.nextSibling);
                }
            }
        };

        const observeAndApply = () => {
             // '상세 설명' (세계관) 섹션에 드롭다운 메뉴와 생성 마법사 버튼을 적용한다.
            document.querySelectorAll('form section.flex.flex-col.gap-2').forEach(sectionNode => {
                const h3 = sectionNode.querySelector('h3.body14');
                const textarea = sectionNode.querySelector('textarea');
                
                if (h3?.textContent.trim() === '상세 설명' && textarea && !sectionNode.querySelector('.prompt-btn-main')) { // Check for .prompt-btn-main to avoid re-injecting dropdown
                    const wrapper = createDropdownMenu(textarea, 'description'); // 'description' 타입
                    h3.parentElement.insertBefore(wrapper, h3.nextSibling);
                }
                // 생성 마법사 버튼 추가
                addWizardButton(sectionNode);
            });
            
            // 각 캐릭터 카드 섹션 (캐릭터 설명)에 버튼을 적용한다.
            document.querySelectorAll('div.flex.flex-col.gap-3 > div.flex.flex-col.gap-6').forEach(charSectionNode => {
                const h3 = charSectionNode.querySelector('h3.body14');
                const textarea = charSectionNode.querySelector('textarea[name*="description"]'); // 캐릭터 설명 textarea
                
                // '이미지로 프로필 자동 생성' 버튼 추가
                addImageProfileButton(charSectionNode);

                // '키워드로 프로필 자동 생성' 버튼 및 '되돌리기' 버튼을 포함한 드롭다운 메뉴 추가
                if (h3?.textContent.trim() === '설명' && textarea && !charSectionNode.querySelector('.prompt-btn-main')) { // Check for .prompt-btn-main to avoid re-injecting dropdown
                    const wrapper = createDropdownMenu(textarea, 'character'); // 'character' 타입
                    h3.parentElement.insertBefore(wrapper, h3.nextSibling);
                }
            });
        };
        
        observeAndApply(); // 페이지 초기 로드 시 한 번 실행한다.

        if (ThemePark.state.pageObserver) ThemePark.state.pageObserver.disconnect();
        // 페이지에 동적으로 추가되는 노드를 감지하여 버튼을 주입한다.
        ThemePark.state.pageObserver = new MutationObserver((mutations) => {
            // Check for specific nodes that indicate a new section or the form is ready
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
        }, 30000); // 30초마다 저장
    },
    
    // 저장된 데이터를 폼에 복원하는 함수다.
    restoreFromData(data) {
        const form = document.querySelector('form');
        if (!form) return;
        for (const key in data) {
            const element = form.querySelector(`[name="${key}"]`);
            if (element) {
                element.value = data[key];
                // input 이벤트를 발생시켜 React 같은 프레임워크가 변경을 감지하게 한다.
                element.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
        ThemePark.ui.showDynamicToast({title: '저장된 내용을 복원했습니다.', icon: '✅'});
    },
};