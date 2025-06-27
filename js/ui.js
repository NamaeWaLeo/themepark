/**
 * js/ui.js
 * - UI와 관련된 모든 것을 담당한다.
 */
ThemePark.ui = {

    // 동적 UI 요소 생성 및 관리

    /**
     * 화면 상단에 동적 토스트 메시지(알림)를 보여주는 함수다.
     * @param {object} options - 토스트 메시지 설정 (title, details, icon, duration, isProgress)
     * @returns {HTMLElement} 생성된 토스트 요소
     */
    showDynamicToast(options) {
        // 옵션의 기본값을 설정한다.
        const { title, details, icon, duration = 3000, isProgress = false } = options;
        
        // 토스트 메시지를 담을 컨테이너를 찾거나 새로 만든다.
        let container = document.getElementById('dynamic-island-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'dynamic-island-container';
            container.className = 'dynamic-island-container';
            document.body.appendChild(container);
        }

        const toastId = `toast-${Date.now()}-${Math.random()}`;
        const island = document.createElement('div');
        island.id = toastId;
        island.className = 'dynamic-island';
        
        // 클릭하면 토스트가 사라지도록 이벤트를 추가한다.
        island.addEventListener('click', () => {
            clearTimeout(island.hideTimeout);
            this.hideDynamicToast(island);
        });

        // 토스트의 내부 HTML을 구성한다.
        let innerHTML = '';
        if (icon) innerHTML += `<div class="dynamic-island-icon">${icon}</div>`;
        innerHTML += `<div class="dynamic-island-content">
                          <div class="dynamic-island-title">${title}</div>
                          ${details ? `<div class="dynamic-island-details">${details}</div>` : ''}
                          ${isProgress ? `<div class="island-progress-bar"><div class="island-progress-bar-inner"></div></div>` : ''}
                      </div>`;
        island.innerHTML = innerHTML;
        
        container.appendChild(island);
        
        // 애니메이션을 위해 약간의 시간차를 두고 클래스를 추가한다.
        void island.offsetWidth;
        island.classList.add('visible');

        // 진행바가 아닐 경우, 설정된 시간 후에 자동으로 사라지게 한다.
        if (duration > 0 && !isProgress) {
            island.hideTimeout = setTimeout(() => this.hideDynamicToast(island), duration);
        }
        return island;
    },

    /**
     * 이미 떠 있는 토스트 메시지의 내용을 업데이트하는 함수다. (예: 진행률 표시)
     */
    updateDynamicToast(toastElement, options) {
        if (!toastElement || !toastElement.parentElement) return;

        if (options.title) {
            const titleEl = toastElement.querySelector('.dynamic-island-title');
            if (titleEl) titleEl.textContent = options.title;
        }
        if (options.details) {
            const detailsEl = toastElement.querySelector('.dynamic-island-details');
            if (detailsEl) detailsEl.textContent = options.details;
        }
        if (typeof options.progress !== 'undefined') {
            const progressBar = toastElement.querySelector('.island-progress-bar-inner');
            if (progressBar) progressBar.style.width = `${options.progress}%`;
        }
    },

    /**
     * 토스트 메시지를 숨기는 함수다.
     */
    hideDynamicToast(toastElement) {
        if (!toastElement || !toastElement.parentElement) return;
        clearTimeout(toastElement.hideTimeout);
        toastElement.classList.remove('visible');
        toastElement.classList.add('hiding');
        // 사라지는 애니메이션이 끝난 후 DOM에서 요소를 완전히 제거한다.
        toastElement.addEventListener('transitionend', () => toastElement.remove(), { once: true });
    },
    
    /**
     * 정보성 모달창을 띄우는 함수다. (예: AI 요약 결과 표시)
     */
    showInfoModal(title, content) {
        // 기존 모달이 있다면 제거한다.
        document.getElementById('info-modal-overlay')?.remove();
        
        const overlay = document.createElement('div');
        overlay.id = 'info-modal-overlay';
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="close-button">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="summary-output">${content}</div>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        const closeModal = () => overlay.remove();
        // 모달 바깥 영역을 클릭하거나 닫기 버튼을 누르면 모달이 닫히게 한다.
        overlay.addEventListener('click', (e) => (e.target === overlay) && closeModal());
        overlay.querySelector('.close-button').addEventListener('click', closeModal);
    },

    /**
     * 번역기 패널을 보여주는 함수다.
     */
    showTranslatorPanel(initialText = '') {
        document.getElementById('translator-panel')?.remove();
        const panel = document.createElement('div');
        panel.id = 'translator-panel';
        panel.className = 'translator-panel-container';
        panel.innerHTML = `
            <div class="translator-panel-header"><h3>번역 도구</h3><button class="close-panel-btn">&times;</button></div>
            <div class="translator-panel-body">
                <textarea id="translation-input" placeholder="번역할 텍스트...">${initialText}</textarea>
                <div class="translator-controls">
                    <select id="target-language-select">
                        <option value="Korean">한국어</option><option value="English">English</option><option value="Japanese">日本語</option><option value="Chinese">中文</option>
                    </select>
                    <button id="translate-btn">번역</button>
                </div>
                <div id="translation-output" contenteditable="true" placeholder="번역 결과"></div>
                <button id="copy-translated-text-btn">결과 복사</button>
            </div>`;
        document.body.appendChild(panel);
        ThemePark.state.translatorModal = panel;

        const closePanel = () => { panel.remove(); ThemePark.state.translatorModal = null; };
        panel.querySelector('.close-panel-btn').addEventListener('click', closePanel);

        panel.querySelector('#translate-btn').addEventListener('click', () => {
            const text = panel.querySelector('#translation-input').value;
            const lang = panel.querySelector('#target-language-select').value;
            if(text) ThemePark.api.translateTextWithGemini(text, lang);
        });

        panel.querySelector('#copy-translated-text-btn').addEventListener('click', (e) => {
            navigator.clipboard.writeText(panel.querySelector('#translation-output').innerText);
            e.target.textContent = '복사됨!';
            setTimeout(() => e.target.textContent = '결과 복사', 1000);
        });
        
        // 마지막으로 사용한 언어를 불러와 기본값으로 설정한다.
        chrome.storage.sync.get('lastTargetLanguage', ({lastTargetLanguage}) => {
            if(lastTargetLanguage) panel.querySelector('#target-language-select').value = lastTargetLanguage;
        });
        // 언어 선택을 변경하면 저장한다.
        panel.querySelector('#target-language-select').addEventListener('change', (e) => {
            chrome.storage.sync.set({lastTargetLanguage: e.target.value});
        });
    },

    /**
     * Img2Tag 기능의 모달창을 보여주는 함수다.
     */
    showImg2TagModal(imageUrl, promptPromise) {
        document.getElementById('img2tag-modal-overlay')?.remove();
        const overlay = document.createElement('div');
        overlay.id = 'img2tag-modal-overlay';
        overlay.className = 'modal-overlay';

        // 모달의 내용을 렌더링하는 내부 함수
        const renderContent = (content) => {
            overlay.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header"><h2>Img2Tag 결과</h2><button class="close-button">&times;</button></div>
                    <div class="modal-body img2tag-modal-body">${content}</div>
                </div>`;
            const closeModal = () => overlay.remove();
            overlay.addEventListener('click', (e) => (e.target === overlay) && closeModal());
            overlay.querySelector('.close-button').addEventListener('click', closeModal);
            // 모든 복사 버튼에 이벤트 리스너를 추가한다.
            overlay.querySelectorAll('.tag-copy-button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const textarea = e.target.previousElementSibling;
                    navigator.clipboard.writeText(textarea.value);
                    e.target.textContent = '복사됨!';
                    setTimeout(() => e.target.textContent = '복사', 1500);
                });
            });
        };

        // 처음에는 로딩 스피너를 보여준다.
        renderContent(`<div class="img2tag-preview"><img src="${imageUrl}" alt="Image Preview"></div><div class="loading-spinner"></div>`);
        document.body.appendChild(overlay);

        // API 호출(Promise)이 완료되면 결과를 렌더링한다.
        promptPromise.then(tags => {
            const resultsHTML = `
                <div class="img2tag-preview"><img src="${imageUrl}" alt="Image Preview"></div>
                <div class="img2tag-results">
                    <div class="tag-output-section">
                        <h3>NovelAI</h3>
                        <h4>캐릭터</h4><textarea readonly>${tags.novelai.character}</textarea><button class="tag-copy-button">복사</button>
                        <h4>배경/스타일</h4><textarea readonly>${tags.novelai.non_character}</textarea><button class="tag-copy-button">복사</button>
                    </div>
                    <div class="tag-output-section">
                        <h3>PixAI / Stable Diffusion</h3>
                        <h4>캐릭터</h4><textarea readonly>${tags.pixai.character}</textarea><button class="tag-copy-button">복사</button>
                        <h4>배경/스타일</h4><textarea readonly>${tags.pixai.non_character}</textarea><button class="tag-copy-button">복사</button>
                    </div>
                </div>`;
            renderContent(resultsHTML);
        }).catch(error => {
            // 실패하면 에러 토스트를 보여주고 모달을 닫는다.
            ThemePark.ui.showDynamicToast({ title: 'Img2Tag 오류', details: error.message, icon: '❌', duration: 5000 });
            overlay.remove();
        });
    },

    /**
     * AI 생성 마법사 모달을 띄우는 함수
     */
    showGeneratorWizardModal() {
        document.getElementById('generator-wizard-modal-overlay')?.remove();
        const overlay = document.createElement('div');
        overlay.id = 'generator-wizard-modal-overlay';
        overlay.className = 'fullscreen-modal-overlay'; // 풀스크린 모달 클래스
        overlay.innerHTML = `
            <div class="fullscreen-modal-content">
                <div class="modal-header">
                    <h2>✨ AI 생성 마법사</h2>
                    <button class="close-button">&times;</button>
                </div>
                <div class="modal-body wizard-modal-body">
                    <div class="wizard-input-section">
                        <h3>생성 정보 입력</h3>
                        <div class="setting-item">
                            <label for="wizard-name-input">이름 (선택 사항)</label>
                            <input type="text" id="wizard-name-input" placeholder="캐릭터 또는 세계관의 이름">
                        </div>
                        <div class="setting-item">
                            <label for="wizard-genre-input">장르 (선택 사항)</label>
                            <input type="text" id="wizard-genre-input" placeholder="예: 판타지, SF, 로맨스">
                        </div>
                        <div class="setting-item">
                            <label for="wizard-keywords-input">공통 핵심 키워드</label>
                            <textarea id="wizard-keywords-input" placeholder="예: 마법 검사, 고대 유적, 도시의 그림자 (세계관과 캐릭터 모두에 적용)"></textarea>
                        </div>
                        <div class="setting-item">
                            <label for="wizard-world-keywords-input">세계관에 집중할 키워드 (선택 사항)</label>
                            <textarea id="wizard-world-keywords-input" placeholder="예: 마법 문명 멸망, 외계 침공, 종말 후 세계"></textarea>
                        </div>
                        <div class="setting-item">
                            <label for="wizard-char-keywords-input">캐릭터에 집중할 키워드 (선택 사항)</label>
                            <textarea id="wizard-char-keywords-input" placeholder="예: 냉철한 암살자, 밝은 치유사, 어리숙한 영웅"></textarea>
                        </div>
                        <div class="setting-item">
                            <label>프롬프트 길이:</label>
                            <div class="radio-group">
                                <label><input type="radio" name="wizard-prompt-length" value="아주 짧게"><span class="custom-control"></span>아주 짧게</label>
                                <label><input type="radio" name="wizard-prompt-length" value="짧게"><span class="custom-control"></span>짧게</label>
                                <label><input type="radio" name="wizard-prompt-length" value="보통" checked><span class="custom-control"></span>보통</label>
                            </div>
                        </div>
                        <div class="setting-item">
                            <label for="wizard-image-upload">이미지 업로드 (선택 사항)</label>
                            <input type="file" id="wizard-image-upload" accept="image/*">
                            <div id="wizard-image-preview" style="margin-top: 10px; text-align: center;"></div>
                        </div>
                        <button id="wizard-generate-button">초안 생성하기</button>
                    </div>
                    <div class="wizard-output-section">
                        <h3>생성된 초안</h3>
                        <div class="output-group">
                            <h4>세계관 프로필 (YAML)</h4>
                            <textarea id="wizard-world-output" readonly placeholder="세계관 초안이 여기에 생성됩니다."></textarea>
                        </div>
                        <div class="output-group">
                            <h4>캐릭터 프로필 (YAML)</h4>
                            <textarea id="wizard-character-output" readonly placeholder="캐릭터 초안이 여기에 생성됩니다."></textarea>
                        </div>
                        <div class="wizard-apply-controls">
                            <label class="wizard-apply-switch">
                                <span>세계관에 적용</span>
                                <input type="checkbox" id="apply-world-switch">
                                <span class="switch"></span>
                            </label>
                            <label class="wizard-apply-switch">
                                <span>캐릭터에 적용</span>
                                <input type="checkbox" id="apply-character-switch">
                                <span class="switch"></span>
                            </label>
                            <div class="wizard-action-buttons">
                                <button id="wizard-apply-selected-btn">선택 적용</button>
                                <button id="wizard-cancel-btn">취소</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        const closeModal = () => overlay.remove();
        overlay.addEventListener('click', (e) => (e.target === overlay) && closeModal());
        overlay.querySelector('.close-button').addEventListener('click', closeModal);
        overlay.querySelector('#wizard-cancel-btn').addEventListener('click', closeModal); // 취소 버튼 이벤트

        const imageUploadInput = overlay.querySelector('#wizard-image-upload');
        const imagePreviewDiv = overlay.querySelector('#wizard-image-preview');
        let uploadedImageUrl = null;

        imageUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    uploadedImageUrl = event.target.result;
                    imagePreviewDiv.innerHTML = `<img src="${uploadedImageUrl}" style="max-width: 150px; max-height: 150px; border-radius: 8px;">`;
                };
                reader.readAsDataURL(file);
            } else {
                uploadedImageUrl = null;
                imagePreviewDiv.innerHTML = '';
            }
        });

        overlay.querySelector('#wizard-generate-button').addEventListener('click', async () => {
            const name = overlay.querySelector('#wizard-name-input').value;
            const genre = overlay.querySelector('#wizard-genre-input').value;
            const keywords = overlay.querySelector('#wizard-keywords-input').value;
            const worldKeywords = overlay.querySelector('#wizard-world-keywords-input').value;
            const characterKeywords = overlay.querySelector('#wizard-char-keywords-input').value;
            const promptLength = overlay.querySelector('input[name="wizard-prompt-length"]:checked')?.value || '보통';
            
            // 모든 출력을 지우고 로딩 상태 표시
            overlay.querySelector('#wizard-world-output').value = '생성 중...';
            overlay.querySelector('#wizard-character-output').value = '생성 중...';
            
            try {
                const results = await ThemePark.api.generateWithWizard({
                    name, genre, keywords, worldKeywords, characterKeywords, imageUrl: uploadedImageUrl, length: promptLength
                });

                overlay.querySelector('#wizard-world-output').value = results.world || '생성된 세계관 내용이 없습니다.';
                overlay.querySelector('#wizard-character-output').value = results.character || '생성된 캐릭터 내용이 없습니다.';

                this.showDynamicToast({ title: '생성 마법사 완료!', icon: '✨' });

            } catch (error) {
                this.showDynamicToast({ title: '생성 마법사 오류', details: error.message, icon: '❌', duration: 5000 });
                overlay.querySelector('#wizard-world-output').value = '오류 발생: ' + (error.message || '알 수 없는 오류');
                overlay.querySelector('#wizard-character-output').value = '오류 발생: ' + (error.message || '알 수 없는 오류');
            }
        });

        // 선택 적용 버튼 이벤트
        overlay.querySelector('#wizard-apply-selected-btn').addEventListener('click', () => {
            const applyWorld = overlay.querySelector('#apply-world-switch').checked;
            const applyCharacter = overlay.querySelector('#apply-character-switch').checked;

            if (applyWorld) {
                const worldContent = overlay.querySelector('#wizard-world-output').value;
                const worldDescriptionTextarea = document.querySelector('textarea[name="longDescription"]');
                if (worldDescriptionTextarea) {
                    worldDescriptionTextarea.value = worldContent;
                    worldDescriptionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                    this.showDynamicToast({ title: '세계관 적용 완료!', details: '새로 생성된 세계관 내용이 적용되었습니다.', icon: '✅' });
                } else {
                    this.showDynamicToast({ title: '오류', details: '세계관 입력 필드를 찾을 수 없습니다.', icon: '❌' });
                }
            }

            if (applyCharacter) {
                const characterContent = overlay.querySelector('#wizard-character-output').value;
                const characterDescriptionTextarea = document.querySelector('textarea[name*="description"]'); 
                const characterNameInput = document.querySelector('input[name*="name"]'); 

                if (characterDescriptionTextarea && characterNameInput) {
                    const nameMatch = characterContent.match(/name:\s*["']?([^"'\n]+)["']?/);
                    if (nameMatch && nameMatch[1]) {
                        characterNameInput.value = nameMatch[1];
                        characterNameInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    characterDescriptionTextarea.value = characterContent;
                    characterDescriptionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                    this.showDynamicToast({ title: '캐릭터 프로필 적용 완료!', details: '새로 생성된 캐릭터 프로필이 적용되었습니다.', icon: '✅' });
                } else {
                    this.showDynamicToast({ title: '오류', details: '캐릭터 입력 필드를 찾을 수 없습니다.', icon: '❌' });
                }
            }
            closeModal(); // 적용 후 모달 닫기
        });
    },


    /**
     * 메인 UI를 페이지에 주입(생성)하는 함수다.
     */
    injectUI() {
        if (document.querySelector('.theme-park-container')) return;

        const container = document.createElement('div');
        container.className = 'theme-park-container';
        container.innerHTML = this._getUI_HTML(); // HTML 구조를 가져와 삽입한다.
        document.body.appendChild(container);

        // UI에 필요한 이벤트 리스너들을 설정한다.
        this._setupTabNavigation(container);
        this._setupConsentLogic(container);
    },

    /**
     * 사용자의 동의 여부에 따라 UI를 다르게 처리하는 로직이다.
     */
    _setupConsentLogic(container) {
        chrome.storage.sync.get('hasConsented', ({hasConsented}) => {
            if (hasConsented) {
                // 동의했다면 모든 UI를 활성화한다.
                this._setupFullUI(container);
                container.querySelector('.consent-section').innerHTML = `<div id="already-consented-msg" style="font-size: 13px; color: #8e8e93;">고지 사항에 동의하셨습니다.</div>`;
            } else {
                // 동의하지 않았다면 정보 탭만 활성화하고 동의를 유도한다.
                container.classList.add('consent-pending');
                this._openTab('info', container);
                const consentCheckbox = container.querySelector('#consent-checkbox');
                const consentAgreeBtn = container.querySelector('#consent-agree-btn');
                consentCheckbox.addEventListener('change', () => consentAgreeBtn.disabled = !consentCheckbox.checked);
                consentAgreeBtn.addEventListener('click', () => {
                    chrome.storage.sync.set({ hasConsented: true, appVersion: ThemePark.state.CURRENT_VERSION }, () => {
                        this.showDynamicToast({title: '동의해주셔서 감사합니다!', details: '모든 기능이 활성화됩니다.', icon: '✅'});
                        container.classList.remove('consent-pending');
                        container.querySelector('.consent-section').innerHTML = `<div id="already-consented-msg" style="font-size: 13px; color: #8e8e93;">고지 사항에 동의하셨습니다.</div>`;
                        this._setupFullUI(container);
                    });
                });
            }
        });
    },

    /**
     * 최초 사용자에게 보여줄 인트로 화면을 생성하는 함수다.
     */
    showIntroScreen() {
        document.getElementById('theme-park-intro')?.remove();
        const introDiv = document.createElement('div');
        introDiv.id = 'theme-park-intro';
        introDiv.innerHTML = `
            <div class="intro-content">
                <div class="intro-emoji-container"><span class="intro-emoji">✨</span><div class="fireworks-container"></div></div>
                <h1>테마파크</h1><p>${ThemePark.state.CURRENT_VERSION}</p>
                <p class="intro-description">제타에 다양한 테마와 편의 기능을 추가합니다.</p>
                <button id="start-button">시작하기</button>
            </div>`;
        document.body.appendChild(introDiv);
        
        // 간단한 불꽃놀이 효과를 추가한다.
        const fireworksContainer = introDiv.querySelector('.fireworks-container');
        const colors = ['#FFC107', '#FF5722', '#E91E63', '#9C27B0', '#3F51B5', '#03A9F4', '#00BCD4', '#4CAF50'];
        function createFirework() {
            const firework = document.createElement('div');
            firework.className = 'firework';
            firework.style.left = `${Math.random() * 100}%`;
            firework.style.top = `${Math.random() * 100}%`;
            firework.style.color = colors[Math.floor(Math.random() * colors.length)];
            firework.style.setProperty('--dx', `${(Math.random() - 0.5) * 200}px`);
            firework.style.setProperty('--dy', `${(Math.random() - 0.5) * 200}px`);
            fireworksContainer.appendChild(firework);
            firework.addEventListener('animationend', () => firework.remove());
        }
        const fireworkInterval = setInterval(createFirework, 150);

        // 시작 버튼을 누르면 인트로 화면이 사라지고 메인 UI가 나타난다.
        const startButton = document.getElementById('start-button');
        startButton.addEventListener('click', () => {
            clearInterval(fireworkInterval);
            introDiv.style.animation = 'fadeOut 0.5s ease-out forwards';
            introDiv.addEventListener('animationend', () => { introDiv.remove(); this.injectUI(); }, { once: true });
        }, { once: true });
    },

    /**
     * 자동 저장 목록을 UI에 채우고 필터링 기능을 추가하는 함수다.
     */
    populateAutoSaveList() {
        const listElement = document.getElementById('autosave-list');
        const searchInput = document.getElementById('autosave-search');
        if (!listElement || !searchInput) return;

        const allSaves = JSON.parse(localStorage.getItem('zeta-all-autosaves') || '{}');
        const plotIds = Object.keys(allSaves);

        if (plotIds.length === 0) {
            listElement.innerHTML = '<li>저장된 내용이 없습니다.</li>';
            return;
        }

        // 저장된 데이터를 기반으로 목록 HTML을 생성한다.
        listElement.innerHTML = plotIds.map(plotId => {
            const item = allSaves[plotId];
            return `
                <li data-savename="${(item.name || '제목 없음').toLowerCase()}">
                    <div class="save-info"><span class="save-name">${item.name || '제목 없음'}</span><span class="save-time">${new Date(item.timestamp).toLocaleString()}</span></div>
                    <div class="save-actions" data-plot-id="${plotId}"><button class="load-btn">불러오기</button><button class="delete-btn">삭제</button></div>
                </li>`;
        }).join('');
        
        // 검색창에 입력할 때마다 목록을 필터링한다.
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            listElement.querySelectorAll('li').forEach(li => {
                // li 요소의 data-savename 속성을 사용하여 검색한다.
                if (li.dataset.savename.includes(searchTerm)) {
                    li.style.display = 'flex';
                } else {
                    li.style.display = 'none';
                }
            });
        });

        // 불러오기/삭제 버튼에 대한 이벤트 리스너 (이벤트 위임 사용)
        listElement.addEventListener('click', (e) => {
            const plotId = e.target.closest('.save-actions')?.dataset.plotId;
            if (!plotId) return;

            const item = allSaves[plotId];
            if (e.target.classList.contains('load-btn')) {
                // 현재 페이지가 해당 캐릭터 수정 페이지면 바로 복원한다.
                if (window.location.pathname.includes(`/plots/${plotId}/edit`)) {
                    ThemePark.features.restoreFromData(item.formData);
                } else if (confirm(`'${item.name}' 수정 페이지로 이동하여 복원하시겠습니까?`)) {
                    // 다른 페이지면 이동 후 복원하도록 sessionStorage에 데이터를 저장한다.
                    sessionStorage.setItem('zeta-restore-data', JSON.stringify({ plotId, formData: item.formData }));
                    window.location.href = `/ko/plots/${plotId}/edit`;
                }
            } else if (e.target.classList.contains('delete-btn')) {
                if (confirm(`'${item.name}'의 저장된 데이터를 삭제하시겠습니까?`)) {
                    delete allSaves[plotId];
                    localStorage.setItem('zeta-all-autosaves', JSON.stringify(allSaves));
                    this.populateAutoSaveList();
                }
            }
        });
    },
    
    /**
     * 색상 선택기(color picker)들의 값을 주어진 설정값으로 업데이트하는 함수다.
     */
    updateColorPickers(settings) {
        document.querySelectorAll('#custom-tab input[type="color"]').forEach(picker => {
            picker.value = settings[picker.dataset.key] || '#000000';
        });
    },
    
    /**
     * 커스텀 테마 관련 컨트롤들을 활성화/비활성화하는 함수다.
     */
    toggleCustomThemeControls(enabled) {
        const section = document.getElementById('color-palette-section');
        if (!section) return;
        if (enabled) {
            section.classList.remove('disabled', 'collapsed');
        } else {
            if (!section.classList.contains('disabled')) {
                this.showDynamicToast({ title: '알림', details: '색상 팔레트는 "사용자 설정" 테마에서만 활성화됩니다.', icon: '🎨', duration: 4000 });
            }
            section.classList.add('disabled', 'collapsed');
        }
    },
    
    /**
     * 이벤트를 일정 시간 지연시켜 과도한 호출을 막는 디바운스 함수다.
     */
    _debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    },

    // --- 내부 헬퍼 함수들 --- 
    // 모든 UI 기능을 설정하고 이벤트를 연결하는 메인 함수다.
    _setupFullUI(container) {
        this._setupMainControls();
        this._setupGeneralControls();
        this._setupCustomThemeControls();
        this._loadAndApplyAllSettings(); // 저장된 모든 설정을 불러와 적용한다.
        this.populateAutoSaveList();
    },

    // 탭 네비게이션 로직을 설정하는 함수다.
    _setupTabNavigation(container) {
        const toolbar = container.querySelector('.theme-park-toolbar');
        toolbar.addEventListener('click', (e) => {
            const item = e.target.closest('.toolbar-item');
            if (!item) return;

            // 동의 전에는 정보 탭 외에 다른 탭을 열 수 없다.
            if (container.classList.contains('consent-pending') && !item.dataset.tab.includes('info')) {
                this.showDynamicToast({title: '동의 필요', details: '먼저 고지 사항에 동의해주세요.', icon: '✋'});
                return;
            }
            const targetTabId = item.dataset.tab;
            if (item.classList.contains('active')) {
                this._closeTab(targetTabId, container);
            } else {
                this._openTab(targetTabId, container);
            }
        });
        
        // 닫기 버튼(X)을 누르면 탭이 닫힌다.
        container.querySelectorAll('.close-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.closest('.tab-pane').id.replace('-tab', '');
                this._closeTab(tabId, container);
            });
        });

        // 섹션 헤더를 누르면 내용이 접혔다 펴진다.
        container.querySelectorAll('.setting-section .section-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const section = e.currentTarget.closest('.setting-section');
                if (section.classList.contains('disabled')) return;
                section.classList.toggle('collapsed');
            });
        });
    },

    _openTab(tabId, container) {
        // 모든 툴바 아이템과 탭 패널의 활성 상태 제거
        container.querySelectorAll('.toolbar-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));

        // 선택된 툴바 아이템 활성화
        container.querySelector(`.toolbar-item[data-tab="${tabId}"]`)?.classList.add('active');

        // 선택된 탭 패널 활성화
        const activeTabPane = document.querySelector(`#${tabId}-tab`);
        if (activeTabPane) {
            activeTabPane.classList.add('active');
        }

        // 컨테이너에 'tab-active' 클래스를 추가하여 CSS 변형을 트리거
        container.classList.add('tab-active'); // [코드 수정] 이 부분은 이미 추가되어 있지만 다시 확인
    },

    _closeTab(tabId, container) {
        // 선택된 툴바 아이템 비활성화
        container.querySelector(`.toolbar-item[data-tab="${tabId}"]`)?.classList.remove('active');

        // 선택된 탭 패널 비활성화
        const activeTabPane = document.querySelector(`#${tabId}-tab`);
        if (activeTabPane) {
            activeTabPane.classList.remove('active');
        }

        // 활성화된 탭이 하나도 없으면 컨테이너에서 'tab-active' 클래스를 제거하여 원래 위치로 되돌림
        if (!container.querySelector('.toolbar-item.active')) {
            container.classList.remove('tab-active'); // [코드 수정] 이 부분은 이미 추가되어 있지만 다시 확인
        }
    },

    _setupMainControls() {
        const themeSelect = document.getElementById('theme-select');
        themeSelect.addEventListener('change', () => {
            const theme = themeSelect.value;
            const themeName = themeSelect.options[themeSelect.selectedIndex].text;
            const compactCheck = document.getElementById('compact-mode-check');
            const compactLabel = compactCheck.closest('.layout-toggle');
            
            chrome.storage.sync.set({ selectedTheme: theme });
            ThemePark.features.clearAllThemeStyles();
            this.showDynamicToast({ title: '테마 변경', details: `'${themeName}' 테마가 적용되었습니다.`, icon: '🎨'});
            
            // 디코 테마에서는 컴팩트 모드를 비활성화한다.
            if (theme === 'discord') {
                compactCheck.disabled = true;
                compactCheck.checked = false;
                compactLabel.style.opacity = '0.5';
                compactLabel.title = '디코 테마에서는 컴팩트 모드를 사용할 수 없습니다.';
            } else {
                compactCheck.disabled = false;
                compactLabel.style.opacity = '1';
                compactLabel.title = '';
            }

            if (theme === 'custom') {
                this.toggleCustomThemeControls(true);
                // 커스텀 테마일 경우 저장된 설정을 불러와 적용한다.
                chrome.storage.local.get(['customThemeSettings', 'backgroundEffectSettings'], ({customThemeSettings, backgroundEffectSettings}) => {
                    const settings = { ...ThemePark.config.defaultCustomSettings, ...customThemeSettings };
                    ThemePark.features.applyCustomTheme(settings);
                    ThemePark.features.applyCustomScrollbarStyles(settings);
                    ThemePark.features.applyBackgroundEffect(backgroundEffectSettings || {}, settings.mainBgColor);
                });
            } else {
                this.toggleCustomThemeControls(false);
                if (theme !== 'default') {
                    // 기본 테마가 아니면 해당 CSS 파일을 적용한다.
                    ThemePark.features.applyStaticTheme(theme);
                }
            }
            this._updateLayoutFromUI();
        });
        
        document.getElementById('img2tag-btn').addEventListener('click', this._handleImg2Tag.bind(this));

        // AI 기능 버튼들에 대한 이벤트 리스너 설정
        const createChatTextHandler = (apiFunction) => () => {
            const chatContainer = document.querySelector('.flex.h-0.min-h-0.flex-1');
            if (!chatContainer) return this.showDynamicToast({title: '오류', details: '분석할 대화가 없습니다.', icon: '⚠️'});
            
            const messages = Array.from(chatContainer.querySelectorAll('.body16.whitespace-pre-wrap'));
            // API 토큰 제한을 고려하여 최근 텍스트만 잘라낸다.
            const chatText = messages.map(m => m.innerText).join('\n').slice(-8000);
            if (!chatText) return this.showDynamicToast({title: '오류', details: '분석할 텍스트가 없습니다.', icon: '⚠️'});
            apiFunction(chatText);
        };
        
        document.getElementById('summarize-chat-btn').addEventListener('click', createChatTextHandler(ThemePark.api.summarizeChat.bind(ThemePark.api)));
        document.getElementById('analyze-style-btn').addEventListener('click', createChatTextHandler(ThemePark.api.analyzeChatStyle.bind(ThemePark.api)));
        document.getElementById('open-translator-btn').addEventListener('click', () => this.showTranslatorPanel());
    },
    
    _handleImg2Tag() {
        navigator.clipboard.readText().then(text => {
            const urlMatch = text.match(/^(https:\/\/image\.zeta-ai\.io\/[^\?]+)/);
            if (!urlMatch) {
                this.showDynamicToast({ 
                    title: '클립보드 오류', 
                    details: '클립보드에 유효한 Zeta 이미지 URL이 없습니다. 이미지 주소를 복사하여 다시 시도해주세요.', 
                    icon: '📋', 
                    duration: 5000 
                });
                return;
            }
            const imageUrl = urlMatch[1];
            // Image2Tag API는 삭제되었으므로, 일단 더미 Promise를 반환합니다.
            // 실제 구현 시에는 ThemePark.api.generateTagsFromImage(imageUrl) 호출
            const dummyPromise = new Promise(resolve => {
                setTimeout(() => {
                    resolve({
                        novelai: { character: "1girl, long hair, blue eyes", non_character: "outdoor, forest, sunny" },
                        pixai: { character: "masterpiece, best quality, 1girl, solo, long hair, blue eyes", non_character: "highly detailed, outdoor, forest, day, sunlight" }
                    });
                }, 1500);
            });
            this.showImg2TagModal(imageUrl, dummyPromise);
        }).catch(err => {
            this.showDynamicToast({ 
                title: '클립보드 읽기 오류', 
                details: '클립보드 접근 권한이 없거나, 다른 오류가 발생했습니다: ' + err.message, 
                icon: '❌', 
                duration: 5000 
            });
        });
    },

    _setupGeneralControls() {
        // 레이아웃 설정이 변경될 때마다 디바운스를 적용하여 스타일을 업데이트한다.
        const debouncedLayoutUpdate = this._debounce(this._updateLayoutFromUI.bind(this), 200);
        document.getElementById('layout-settings-wrapper').addEventListener('input', debouncedLayoutUpdate);

        const apiKeyInput = document.getElementById('gemini-api-key');
        apiKeyInput.addEventListener('change', () => {
            chrome.storage.sync.set({ geminiApiKey: apiKeyInput.value }, () => {
                ThemePark.api.validateGeminiKey(apiKeyInput.value);
            });
        });

        document.getElementById('gemini-model-select').addEventListener('change', (e) => {
            chrome.storage.sync.set({ geminiModel: e.target.value });
        });

        document.getElementById('ai-settings-wrapper').addEventListener('change', () => {
            const aiPromptSettings = {
                length: document.querySelector('input[name="prompt-length"]:checked').value,
                include: document.getElementById('prompt-include').value,
                exclude: document.getElementById('prompt-exclude').value,
            };
            chrome.storage.sync.set({ aiPromptSettings });
        });

        document.getElementById('reset-all-data-btn').addEventListener('click', () => {
            if (confirm("정말 모든 설정과 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
                chrome.storage.sync.clear();
                chrome.storage.local.clear();
                localStorage.removeItem('zeta-all-autosaves');
                window.location.reload();
            }
        });
    },

    _setupCustomThemeControls() {
        const customTab = document.getElementById('custom-tab');
        
        // 색상 선택기가 변경될 때마다 디바운스를 적용하여 실시간으로 테마를 업데이트한다.
        const debouncedColorUpdate = this._debounce(e => {
            chrome.storage.local.get(['customThemeSettings', 'backgroundEffectSettings'], ({customThemeSettings, backgroundEffectSettings}) => {
                const newSettings = { ...ThemePark.config.defaultCustomSettings, ...(customThemeSettings || {}), [e.target.dataset.key]: e.target.value };
                chrome.storage.local.set({ customThemeSettings: newSettings }, () => {
                    if (document.getElementById('theme-select').value === 'custom') {
                        ThemePark.features.applyCustomTheme(newSettings);
                        ThemePark.features.applyCustomScrollbarStyles(newSettings);
                        // 배경 효과 설정이 있다면 배경색을 업데이트한다.
                        if (backgroundEffectSettings) {
                            ThemePark.features.applyBackgroundEffect(backgroundEffectSettings, newSettings.mainBgColor);
                        }
                    }
                });
            });
        }, 100);
        customTab.querySelector('#color-palette-section').addEventListener('input', e => {
            if (e.target.type === 'color') {
                debouncedColorUpdate(e);
            }
        });
        
        // 배경 효과 설정 (라디오 버튼 및 체크박스)
        const backgroundEffectSection = customTab.querySelector('#background-effect-section .section-content');
        backgroundEffectSection.addEventListener('change', () => {
            const lightEffect = document.querySelector('input[name="light-effect"]:checked')?.value || 'none';
            const environmentEffect = document.querySelector('input[name="environment-effect"]:checked')?.value || 'none';
            const weatherEffect = document.querySelector('input[name="weather-effect"]:checked')?.value || 'none';
            
            const particleStars = document.getElementById('particle-stars-check').checked;
            const particleFireflies = document.getElementById('particle-fireflies-check').checked;
            const particleSakura = document.getElementById('particle-sakura-check').checked;
            const particleLeaves = document.getElementById('particle-leaves-check').checked;
            const particleFireworks = document.getElementById('particle-fireworks-check').checked;
            const particleShootingStars = document.getElementById('particle-shooting-stars-check').checked;
            const particleBubbles = document.getElementById('particle-bubbles-check').checked;
            const particleMeteors = document.getElementById('particle-meteors-check').checked;

            const backgroundEffectSettings = {
                lightEffect,
                environmentEffect,
                weatherEffect,
                particleStars,
                particleFireflies,
                particleSakura,
                particleLeaves,
                particleFireworks,
                particleShootingStars,
                particleBubbles,
                particleMeteors
            };
            chrome.storage.sync.set({ backgroundEffectSettings });

            chrome.storage.local.get('customThemeSettings', ({customThemeSettings}) => {
                const currentBgColor = (customThemeSettings && customThemeSettings.mainBgColor) || ThemePark.config.defaultCustomSettings.mainBgColor;
                ThemePark.features.applyBackgroundEffect(backgroundEffectSettings, currentBgColor);
            });
        });
        
        // AI 팔레트 생성 및 테마 관리 버튼들의 이벤트 리스너
        customTab.querySelector('#color-palette-section .custom-actions').addEventListener('click', e => {
            if (e.target.tagName !== 'BUTTON') return;
            const targetId = e.target.id;
            switch(targetId) {
                case 'generate-palette-btn':
                    const prompt = document.getElementById('palette-prompt').value;
                    if(prompt) ThemePark.api.generatePaletteWithGemini(prompt);
                    else this.showDynamicToast({title: '프롬프트 필요', details: '원하는 팔레트를 설명해주세요.', icon: '🎨'});
                    break;
                case 'revert-theme-btn':
                    if (ThemePark.state.previousCustomThemeSettings) {
                        chrome.storage.local.set({ customThemeSettings: ThemePark.state.previousCustomThemeSettings }, () => {
                            if (document.getElementById('theme-select').value === 'custom') {
                               ThemePark.features.applyCustomTheme(ThemePark.state.previousCustomThemeSettings);
                               ThemePark.features.applyCustomScrollbarStyles(ThemePark.state.previousCustomThemeSettings);
                            }
                            this.updateColorPickers(ThemePark.state.previousCustomThemeSettings);
                            ThemePark.state.previousCustomThemeSettings = null;
                            this.showDynamicToast({title: '되돌리기 성공', icon: '⏪'});
                        });
                    }
                    break;
                case 'reset-theme-btn': ThemePark.features.resetTheme(); break;
                case 'import-theme-btn': ThemePark.features.importTheme(); break;
                case 'export-theme-btn': ThemePark.features.exportTheme(); break;
            }
        });
        
        // 눈 보호 모드 슬라이더에 디바운스를 적용한다.
        const debouncedEyeSaverUpdate = this._debounce(() => {
            const enabled = document.getElementById('eye-saver-check').checked;
            const strength = document.getElementById('eye-saver-strength-slider').value;
            ThemePark.features.updateEyeSaver(enabled, strength);
            chrome.storage.sync.set({ eyeSaverSettings: { enabled, strength }});
        }, 150);
        document.getElementById('eye-saver-section').addEventListener('input', debouncedEyeSaverUpdate);
    },
    
    _updateLayoutFromUI() {
        const layoutSettings = {
            fontSize: document.getElementById('font-size-slider').value,
            animation: document.getElementById('animation-check').checked,
            compactMode: document.getElementById('compact-mode-check').checked,
            hideAvatars: document.getElementById('hide-avatars-check').checked,
        };
        ThemePark.features.updateLayoutStyles(layoutSettings);
        chrome.storage.sync.set({ layoutSettings });
    },

    _loadAndApplyAllSettings() {
        const keys = ['selectedTheme', 'fontFamily', 'layoutSettings', 'geminiApiKey', 'geminiModel', 'aiPromptSettings', 'eyeSaverSettings', 'backgroundEffectSettings'];
        chrome.storage.sync.get(keys, data => {
            if (data.selectedTheme) {
                const themeSelect = document.getElementById('theme-select');
                themeSelect.value = data.selectedTheme;
                // 'change' 이벤트를 수동으로 발생시켜 테마 적용 로직을 실행한다.
                themeSelect.dispatchEvent(new Event('change'));
            } else {
                this.toggleCustomThemeControls(false);
            }

            if (data.fontFamily) {
                document.getElementById('font-select').value = data.fontFamily;
                ThemePark.features.updateFont(data.fontFamily);
            }

            if (data.layoutSettings) {
                document.getElementById('font-size-slider').value = data.layoutSettings.fontSize || 15;
                document.getElementById('animation-check').checked = !!data.layoutSettings.animation;
                document.getElementById('compact-mode-check').checked = !!data.layoutSettings.compactMode;
                document.getElementById('hide-avatars-check').checked = !!data.layoutSettings.hideAvatars;
                this._updateLayoutFromUI();
            }

            if (data.geminiApiKey) {
                document.getElementById('gemini-api-key').value = data.geminiApiKey;
                ThemePark.api.validateGeminiKey(data.geminiApiKey);
            }

            if(data.geminiModel) {
                document.getElementById('gemini-model-select').value = data.geminiModel;
            }

            if(data.aiPromptSettings) {
                const lengthRadio = document.querySelector(`input[name="prompt-length"][value="${data.aiPromptSettings.length}"]`);
                if(lengthRadio) lengthRadio.checked = true;
                document.getElementById('prompt-include').value = data.aiPromptSettings.include || '';
                document.getElementById('prompt-exclude').value = data.aiPromptSettings.exclude || '';
            }

            if (data.eyeSaverSettings) {
                document.getElementById('eye-saver-check').checked = data.eyeSaverSettings.enabled;
                document.getElementById('eye-saver-strength-slider').value = data.eyeSaverSettings.strength;
                ThemePark.features.updateEyeSaver(data.eyeSaverSettings.enabled, data.eyeSaverSettings.strength);
            }

            // 배경 효과 설정 로드 및 적용
            if (data.backgroundEffectSettings) {
                document.querySelector(`input[name="light-effect"][value="${data.backgroundEffectSettings.lightEffect || 'none'}"]`).checked = true;
                document.querySelector(`input[name="environment-effect"][value="${data.backgroundEffectSettings.environmentEffect || 'none'}"]`).checked = true;
                document.querySelector(`input[name="weather-effect"][value="${data.backgroundEffectSettings.weatherEffect || 'none'}"]`).checked = true;
                
                document.getElementById('particle-stars-check').checked = !!data.backgroundEffectSettings.particleStars;
                document.getElementById('particle-fireflies-check').checked = !!data.backgroundEffectSettings.particleFireflies;
                document.getElementById('particle-sakura-check').checked = !!data.backgroundEffectSettings.particleSakura;
                document.getElementById('particle-leaves-check').checked = !!data.backgroundEffectSettings.particleLeaves;
                document.getElementById('particle-fireworks-check').checked = !!data.backgroundEffectSettings.particleFireworks;
                document.getElementById('particle-shooting-stars-check').checked = !!data.backgroundEffectSettings.particleShootingStars;
                document.getElementById('particle-bubbles-check').checked = !!data.backgroundEffectSettings.particleBubbles;
                document.getElementById('particle-meteors-check').checked = !!data.backgroundEffectSettings.particleMeteors;

                chrome.storage.local.get('customThemeSettings', ({customThemeSettings}) => {
                    const currentBgColor = (customThemeSettings && customThemeSettings.mainBgColor) || ThemePark.config.defaultCustomSettings.mainBgColor;
                    ThemePark.features.applyBackgroundEffect(data.backgroundEffectSettings, currentBgColor);
                });
            } else {
                // 기본값 적용 (모두 'none' 또는 false)
                document.querySelector('input[name="light-effect"][value="none"]').checked = true;
                document.querySelector('input[name="environment-effect"][value="none"]').checked = true;
                document.querySelector('input[name="weather-effect"][value="none"]').checked = true;
                // 체크박스도 기본값으로 설정 (모두 false)
                document.getElementById('particle-stars-check').checked = false;
                document.getElementById('particle-fireflies-check').checked = false;
                document.getElementById('particle-sakura-check').checked = false;
                document.getElementById('particle-leaves-check').checked = false;
                document.getElementById('particle-fireworks-check').checked = false;
                document.getElementById('particle-shooting-stars-check').checked = false;
                document.getElementById('particle-bubbles-check').checked = false;
                document.getElementById('particle-meteors-check').checked = false;

                chrome.storage.local.get('customThemeSettings', ({customThemeSettings}) => {
                    const currentBgColor = (customThemeSettings && customThemeSettings.mainBgColor) || ThemePark.config.defaultCustomSettings.mainBgColor;
                    ThemePark.features.applyBackgroundEffect({ // 기본 settings 객체 전달
                        lightEffect: 'none', environmentEffect: 'none', weatherEffect: 'none',
                        particleStars: false, particleFireflies: false, particleSakura: false,
                        particleLeaves: false, particleFireworks: false, particleShootingStars: false,
                        particleBubbles: false, particleMeteors: false
                    }, currentBgColor);
                });
            }
        });

        chrome.storage.local.get('customThemeSettings', ({customThemeSettings}) => {
            const settings = { ...ThemePark.config.defaultCustomSettings, ...customThemeSettings };
            this.updateColorPickers(settings);
            if(document.getElementById('theme-select').value === 'custom') {
                ThemePark.features.applyCustomTheme(settings);
                ThemePark.features.applyCustomScrollbarStyles(settings);
            }
        });
    },

    /**
     * UI의 전체 HTML 구조를 문자열로 반환하는 함수다.
     */
    _getUI_HTML() {
        return `
            <div class="theme-park-container">
                <div class="theme-park-toolbar">
                    <div class="toolbar-item" data-tab="main" title="메인">
                        <svg viewBox="0 0 24 24">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
                        </svg>
                    </div>
                    <div class="toolbar-item" data-tab="general" title="기능 및 저장">
                        <svg viewBox="0 0 24 24">
                            <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.09-.74-1.7-.98L14 2h-4L9.09 4.21c-.61.23-1.18.58-1.7.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.12.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.09.74 1.7.98L9.09 22h4l.91-2.21c.61-.23 1.18-.58 1.7-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" fill="currentColor"/>
                        </svg>
                    </div>
                    <div class="toolbar-item" data-tab="custom" title="테마">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.67.67-1.15 1.33-1.15H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 8c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3.5 3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm6.5-3c-.83 0-1.5-.67-1.5-1.5S15.67 8 16.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="currentColor"/>
                        </svg>
                    </div>
                    <div class="toolbar-item" data-tab="info" title="정보">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
                        </svg>
                    </div>
                </div>

                <div id="main-tab" class="tab-pane"><div class="tab-header"><span>메인</span><span class="close-tab-btn">&times;</span></div><div class="tab-content-body">
                    <div class="setting-item"><label>테마 선택:</label><select id="theme-select"><option value="default">기본</option><option value="insta">DM</option><option value="discord">디코</option><option value="custom">사용자 설정</option></select></div>
                    <div class="main-grid-layout">
                        <button id="img2tag-btn" class="main-grid-button"><span class="icon">🖼️</span>Img2Tag</button>
                        <button id="summarize-chat-btn" class="main-grid-button"><span class="icon">📜</span>AI 맥락 요약</button>
                        <button id="analyze-style-btn" class="main-grid-button"><span class="icon">🤔</span>대화 스타일 분석</button>
                        <button id="open-translator-btn" class="main-grid-button"><span class="icon">🌐</span>번역 도구</button>
                    </div>
                </div></div>
                
                <div id="general-tab" class="tab-pane"><div class="tab-header"><span>기능 및 저장</span><span class="close-tab-btn">&times;</span></div><div class="tab-content-body">
                    <div class="setting-section collapsed" id="layout-section"><div class="section-header">레이아웃</div><div class="section-content" id="layout-settings-wrapper">
                        <div class="setting-item"><label>글꼴:</label><select id="font-select"><option value="default">기본 (Pretendard)</option><option value="Noto Sans KR">Noto Sans KR</option></select></div>
                        <div class="setting-item"><label>글자 크기:</label><input type="range" id="font-size-slider" min="12" max="20" value="15"></div>
                        <label class="layout-toggle"><input type="checkbox" id="animation-check"><span class="custom-control"></span>메시지 애니메이션</label>
                        <label class="layout-toggle"><input type="checkbox" id="compact-mode-check"><span class="custom-control"></span>컴팩트 모드</label>
                        <label class="layout-toggle"><input type="checkbox" id="hide-avatars-check"><span class="custom-control"></span>프로필 사진 숨기기</label>
                    </div></div>
                    <div class="setting-section collapsed" id="ai-section"><div class="section-header">AI 프롬프트 설정</div><div class="section-content" id="ai-settings-wrapper">
                        <div class="setting-item"><label>Gemini API 키:</label><div style="display:flex; gap: 8px;"><input type="password" id="gemini-api-key" style="flex-grow:1;"><div id="api-key-status"></div></div></div>
                        <div class="setting-item"><label>모델:</label><select id="gemini-model-select"><option value="gemini-2.0-flash">2.0-Flash</option><option value="gemini-1.5-flash">1.5 Flash</option></select></div>
                        <div class="setting-item"><label>분량:</label><div class="radio-group"><label><input type="radio" name="prompt-length" value="보통" checked><span class="custom-control"></span>보통</label><label><input type="radio" name="prompt-length" value="짧게"><span class="custom-control"></span>짧게</label></div></div>
                        <div class="setting-item"><label>제작 시 포함할 조건:</label><input type="text" id="prompt-include" placeholder="예: 판타지, 마법"></div>
                        <div class="setting-item"><label>제작 시 제외할 조건:</label><input type="text" id="prompt-exclude" placeholder="예: 현대, 총기"></div>
                    </div></div>
                    <div class="setting-section collapsed" id="autosave-section"><div class="section-header">자동 저장 목록</div><div class="section-content">
                        <div class="setting-item"><input type="search" id="autosave-search" placeholder="캐릭터 이름으로 검색..."></div>
                        <ul id="autosave-list"></ul>
                    </div></div>
                    <div class="setting-item" style="margin-top:20px;"><button id="reset-all-data-btn" class="reset-all-btn" style="background-color: #ff453a;">모든 설정 및 데이터 초기화</button></div>
                </div></div>

                <div id="custom-tab" class="tab-pane"><div class="tab-header"><span>테마</span><span class="close-tab-btn">&times;</span></div><div class="tab-content-body">
                    <div class="setting-section" id="color-palette-section"><div class="section-header">색상 팔레트</div><div class="section-content">
                        <div class="color-picker-group"><label>기본 배경</label><input type="color" data-key="mainBgColor"></div>
                        <div class="color-picker-group"><label>컴포넌트 배경</label><input type="color" data-key="componentBgColor"></div>
                        <div class="color-picker-group"><label>주요 텍스트</label><input type="color" data-key="mainTextColor"></div>
                        <div class="color-picker-group"><label>보조 텍스트</label><input type="color" data-key="subTextColor"></div>
                        <div class="color-picker-group"><label>내 말풍선</label><input type="color" data-key="myBubbleBgColor"></div>
                        <div class="color-picker-group"><label>내 말풍선 글씨</label><input type="color" data-key="myBubbleTextColor"></div>
                        <div class="color-picker-group"><label>상대 말풍선</label><input type="color" data-key="charBubbleBgColor"></div>
                        <div class="color-picker-group"><label>상대 말풍선 글씨</label><input type="color" data-key="charBubbleTextColor"></div>
                        <div class="color-picker-group"><label>포인트 색상</label><input type="color" data-key="accentColor"></div>
                        <div class="color-picker-group"><label>포인트 글씨</label><input type="color" data-key="accentTextColor"></div>
                        <div class="color-picker-group"><label>스크롤바 트랙</label><input type="color" data-key="scrollbarTrackColor"></div>
                        <div class="color-picker-group"><label>스크롤바 핸들</label><input type="color" data-key="scrollbarThumbColor"></div>
                        <div class="custom-actions">
                            <input type="text" id="palette-prompt" placeholder="원하는 팔레트 설명...">
                            <button id="generate-palette-btn" class="custom-action-btn">AI 생성</button>
                            <button id="revert-theme-btn" class="custom-action-btn">되돌리기</button>
                            <button id="reset-theme-btn" class="custom-action-btn">초기화</button>
                            <button id="import-theme-btn" class="custom-action-btn">가져오기</button>
                            <button id="export-theme-btn" class="custom-action-btn">내보내기</button>
                        </div>
                    </div></div>
                    <div class="setting-section collapsed" id="background-effect-section"><div class="section-header">배경 효과</div><div class="section-content">
                        <h4>광원 효과:</h4>
                        <div class="bg-effect-group">
                            <input type="radio" id="light-none" name="light-effect" value="none" checked><label for="light-none">없음</label>
                            <input type="radio" id="light-sun" name="light-effect" value="sun"><label for="light-sun">태양</label>
                            <input type="radio" id="light-moon" name="light-effect" value="moon"><label for="light-moon">달</label>
                        </div>
                        <h4>환경 효과:</h4>
                        <div class="bg-effect-group">
                            <input type="radio" id="env-none" name="environment-effect" value="none" checked><label for="env-none">없음</label>
                            <input type="radio" id="env-rural" name="environment-effect" value="rural"><label for="env-rural">시골</label>
                            <input type="radio" id="env-city" name="environment-effect" value="city"><label for="env-city">도시</label>
                        </div>
                        <h4>날씨 효과:</h4>
                        <div class="bg-effect-group">
                            <input type="radio" id="weather-none" name="weather-effect" value="none" checked><label for="weather-none">맑음</label>
                            <input type="radio" id="weather-snow" name="weather-effect" value="snow"><label for="weather-snow">눈</label>
                            <input type="radio" id="weather-rain" name="weather-effect" value="rain"><label for="weather-rain">비</label>
                            <input type="radio" id="weather-thunder" name="weather-effect" value="thunderstorm"><label for="weather-thunder">비와 천둥번개</label>
                        </div>
                        <h4>파티클 효과:</h4>
                        <div class="bg-effect-group">
                            <input type="checkbox" id="particle-stars-check"><label for="particle-stars-check">별</label>
                            <input type="checkbox" id="particle-fireflies-check"><label for="particle-fireflies-check">반딧불이</label>
                            <input type="checkbox" id="particle-sakura-check"><label for="particle-sakura-check">벚꽃</label>
                            <input type="checkbox" id="particle-leaves-check"><label for="particle-leaves-check">단풍</label>
                            <input type="checkbox" id="particle-fireworks-check"><label for="particle-fireworks-check">불꽃놀이</label>
                            <input type="checkbox" id="particle-shooting-stars-check"><label for="particle-shooting-stars-check">별똥별</label>
                            <input type="checkbox" id="particle-bubbles-check"><label for="particle-bubbles-check">거품</label>
                            <input type="checkbox" id="particle-meteors-check"><label for="particle-meteors-check">메테오</label>
                        </div>
                    </div></div>
                    <div class="setting-section collapsed" id="eye-saver-section"><div class="section-header">Eye Saver 모드</div><div class="section-content">
                        <label class="layout-toggle"><input type="checkbox" id="eye-saver-check"><span class="custom-control"></span>활성화</label>
                        <label>강도:</label><input type="range" id="eye-saver-strength-slider" min="0" max="100" value="50">
                    </div></div>
                </div></div>

                <div id="info-tab" class="tab-pane"><div class="tab-header"><span>정보</span><span class="close-tab-btn">&times;</span></div><div class="tab-content-body">
                    <p><strong>테마파크 ${ThemePark.state.CURRENT_VERSION}</strong></p>
                    <p>이 확장 프로그램은 Zeta 웹사이트의 클라이언트 측(사용자 브라우저) 코드만을 수정하여 시각적 테마(CSS)를 변경하고 편의 기능(JavaScript)을 추가합니다. Zeta의 서버, 데이터베이스 또는 내부 로직에는 어떠한 접근이나 변경도 가하지 않으며, 모든 기능은 사용자의 컴퓨터 내에서만 작동합니다. 단, <br> 일부 기능은 사용자의 Gemini Api Key를 사용하여 구글 Gemini와도 통신합니다.</p>
                    <blockquote style="border-left:4px solid #ff453a;padding-left:15px;color:#ff453a; font-size: 13px;">
                        <strong>경고:</strong> 그럼에도 불구하고, 비공식 프로그램을 사용하는 것은 항상 서비스 약관 위반의 가능성이 있습니다. 이 프로그램의 사용으로 인해 발생하는 어떠한 문제에 대해서도 개발자는 책임을 지지 않습니다.
                    </blockquote>
                    <div class="consent-section">
                        <label class="layout-toggle"><input type="checkbox" id="consent-checkbox"><span class="custom-control"></span>위 내용을 모두 읽고 동의합니다.</label>
                        <button id="consent-agree-btn" disabled>동의하고 시작하기</button>
                    </div>
                </div></div>
            </div>
        `;
    }
};