/**
 * js/api.js
 * - Gemini API와 통신하는 모든 함수를 포함한다.
 */
ThemePark.api = {
    /**
     * Gemini API 요청을 처리하고, 부드러운 프로그레스바를 보여주는 내부 헬퍼 함수다.
     * @private
     */
    async _callGeminiAPI(modelToUse, apiKey, contents, progressMessage = 'AI 작업 중...') {
        let progressInterval = null;
        const progressToast = ThemePark.ui.showDynamicToast({
            title: progressMessage,
            icon: '⏳',
            isProgress: true,
        });

        try {
            // API 호출 시간 동안 프로그레스바를 부드럽게 채워준다.
            let currentProgress = 0;
            ThemePark.ui.updateDynamicToast(progressToast, { progress: currentProgress });
            
            // 2.5초 동안 90%까지 진행되는 것처럼 보이게 한다.
            progressInterval = setInterval(() => {
                currentProgress += 5;
                if (currentProgress >= 90) {
                    clearInterval(progressInterval);
                }
                ThemePark.ui.updateDynamicToast(progressToast, { progress: currentProgress });
            }, 125);

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents })
            });
            
            // 응답을 받으면 인터벌을 즉시 중지한다.
            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API 요청 실패 (상태 코드: ${response.status})`);
            }

            const data = await response.json();
            if (!data.candidates || !data.candidates[0].content || !data.candidates[0].content.parts) {
                throw new Error("API 응답 형식이 올바르지 않습니다.");
            }
            
            // 작업 완료 후 100%로 채우고 토스트를 숨긴다.
            ThemePark.ui.updateDynamicToast(progressToast, { title: '작업 완료!', progress: 100 });
            setTimeout(() => ThemePark.ui.hideDynamicToast(progressToast), 1500);

            return data.candidates[0].content.parts[0].text.replace(/```(json|yaml)?\n?|```/g, '').trim();
        } catch (error) {
            // 에러 발생 시 진행 중이던 모든 작업을 정리한다.
            if (progressInterval) clearInterval(progressInterval);
            ThemePark.ui.hideDynamicToast(progressToast);
            throw error;
        }
    },

    /**
     * Gemini Vision API를 사용하여 이미지로부터 캐릭터 프로필을 생성한다.
     * 세계관(worldDescription)을 추가로 받아 AI 프롬프트를 보강한다.
     */
    async generateProfileWithGemini(imageUrl, worldDescription = '') {
        const { geminiApiKey } = await chrome.storage.sync.get('geminiApiKey');
        if (!geminiApiKey) throw new Error('Gemini API 키가 설정되지 않았습니다.');
    
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`이미지를 불러올 수 없습니다: ${response.statusText}`);
        const blob = await response.blob();
    
        const base64data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    
        // 기본 시스템 프롬프트를 정의한다.
        let systemPrompt = `You are a creative writer specializing in character creation for role-playing platforms. Based on the provided image, create a detailed character profile in YAML format.
    
    **Instructions:**
    1.  Analyze the image to infer the character's appearance, mood, potential personality, and the setting they might be in.
    2.  Create a profile using the following keys: 'name', 'appearance', 'personality', 'speech_style'.
    3.  **'name'**: Suggest a fitting name. The name MUST be in Korean. If you think of a non-Korean name, you must transliterate it into natural-sounding Korean (e.g., "Angela" -> "안젤라", "Chris" -> "크리스").
    4.  **'appearance', 'personality', 'speech_style'**: For these values, write in full, descriptive Korean sentences (natural language), not just keywords. Make the description rich and engaging for a story.
    
    **Example Output Structure:**
    name: "서유진"
    appearance: "은은한 달빛을 닮은 은발 머리카락이 어깨를 부드럽게 감싸고 있으며, 신비로운 보라색 눈동자는 깊은 생각에 잠긴 듯하다. 전체적으로 차분하고 지적인 인상을 준다."
    personality: "겉으로는 차갑고 무심해 보이지만, 사실은 따뜻한 마음을 숨기고 있는 츤데레 성격의 소유자다. 한번 마음을 연 상대에게는 깊은 신뢰와 다정함을 보여준다."
    speech_style: "평소에는 논리정연하고 간결한 표준어를 사용하지만, 가끔 당황하거나 부끄러울 때는 자신도 모르게 귀여운 말투가 튀어나오곤 한다."`;

        // 만약 세계관 정보가 있다면, 프롬프트에 추가적인 컨텍스트를 제공한다.
        if (worldDescription) {
            systemPrompt += `
    
    **Crucial Context:** The character MUST exist within the following world setting. All generated traits must be consistent with this context:
    ---WORLD CONTEXT---
    ${worldDescription}
    ---END CONTEXT---`;
        }

        systemPrompt += `
    
    **Final Output Format:**
    - You MUST return the result as a single, raw YAML block.
    - Do not include any explanatory text, markdown formatting (like \`\`\`yaml), or anything outside the YAML block.`;
    
        const contents = [{
            parts: [
                { text: systemPrompt },
                { inline_data: { mime_type: blob.type, data: base64data } }
            ]
        }];
    
        const rawYaml = await this._callGeminiAPI('gemini-1.5-pro-latest', geminiApiKey, contents, '이미지 분석 및 프로필 생성 중...');
        return rawYaml;
    },
    
     /* Gemini API 키의 유효성을 검증한다.
     */
    async validateGeminiKey(apiKey) {
        const statusEl = document.getElementById('api-key-status');
        if (!statusEl) return; 

        if (!apiKey) {
            statusEl.textContent = '';
            return;
        }

        statusEl.textContent = '확인 중...';
        statusEl.className = 'validating';

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${apiKey}`);
            if (response.ok) {
                statusEl.textContent = '✅ 유효한 키입니다.';
                statusEl.className = 'valid';
            } else {
                const errorData = await response.json();
                statusEl.textContent = `❌ ${errorData.error?.message || '잘못된 키입니다.'}`;
                statusEl.className = 'invalid';
            }
        } catch (e) {
            statusEl.textContent = '❌ 네트워크 오류가 발생했습니다.';
            statusEl.className = 'invalid';
        }
    },

    /**
     * Gemini Vision API를 사용하여 이미지로부터 캐릭터 프로필을 생성한다.
     */
    async generateProfileWithGemini(imageUrl) {
        const { geminiApiKey } = await chrome.storage.sync.get('geminiApiKey');
        if (!geminiApiKey) throw new Error('Gemini API 키가 설정되지 않았습니다.');
    
        // fetch를 통해 이미지를 blob으로 가져온다. CORS 이슈를 피하기 위함.
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`이미지를 불러올 수 없습니다: ${response.statusText}`);
        const blob = await response.blob();
    
        // 이미지를 Base64 문자열로 변환한다.
        const base64data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    
        const systemPrompt = `You are a creative writer specializing in character creation for role-playing platforms. Based on the provided image, create a detailed character profile in YAML format. The profile should be imaginative and fitting for a story.
    
    **Instructions:**
    1.  Analyze the image to infer the character's appearance, mood, potential personality, and the setting they might be in.
    2.  Create a profile using the following keys: 'name', 'appearance', 'personality', 'speech_style', and 'background'.
    3.  'name': Suggest a fitting name.
    4.  'appearance': Describe their visual features from the image in detail.
    5.  'personality': Infer their personality traits. Are they cheerful, melancholic, mysterious?
    6.  'speech_style': Describe how they would talk. Is their speech formal, casual, poetic?
    7.  'background': Create a brief, compelling backstory that fits the character's overall vibe.
    
    **Output Format:**
    - You MUST return the result as a single, raw YAML block.
    - Do not include any explanatory text, markdown formatting (like \`\`\`yaml), or anything outside the YAML block.
    - The output must be in Korean.`;
    
        const contents = [{
            parts: [
                { text: systemPrompt },
                { inline_data: { mime_type: blob.type, data: base64data } }
            ]
        }];
    
        // Gemini 1.5 Pro 모델을 사용하여 이미지와 텍스트를 함께 처리한다.
        const rawYaml = await this._callGeminiAPI('gemini-1.5-pro-latest', geminiApiKey, contents, '이미지 분석 및 프로필 생성 중...');
        return rawYaml;
    },

    /**
     * Gemini API를 사용하여 프롬프트를 개선하거나 아이디어를 얻는다.
     */
    async enhanceWithGemini(textareaElement, type, actionType) {
        const buttonWrapper = textareaElement.closest('section').querySelector('.prompt-btn-wrapper');
        const allButtons = buttonWrapper.querySelectorAll('button');
        const originalButtonText = buttonWrapper.querySelector('.prompt-btn-main').textContent;

        allButtons.forEach(btn => btn.disabled = true);
        buttonWrapper.querySelector('.prompt-btn-main').textContent = 'AI 작업 중...';
        ThemePark.state.originalPromptTexts.set(textareaElement, textareaElement.value);

        try {
            const { geminiApiKey, geminiModel, aiPromptSettings } = await chrome.storage.sync.get(['geminiApiKey', 'geminiModel', 'aiPromptSettings']);
            if (!geminiApiKey) {
                throw new Error('Gemini API 키가 설정되지 않았습니다.');
            }

            const modelToUse = geminiModel || 'gemini-1.5-flash';
            const settings = aiPromptSettings || { length: '보통', include: '', exclude: '' };
            const originalText = textareaElement.value;
            const worldDescription = document.querySelector('textarea[name="longDescription"]')?.value || '';
            const characterName = textareaElement.closest('.flex.flex-col.gap-6')?.querySelector('input[name*="name"]')?.value || '';
            
            const systemPrompt = ThemePark.features.getSystemPromptForAction(type, actionType, { ...settings, worldDescription, characterName });
            const fullPrompt = `${systemPrompt}\n\n--- 사용자 원본 텍스트 ---\n${originalText}`;

            const newText = await this._callGeminiAPI(modelToUse, geminiApiKey, [{ parts: [{ text: fullPrompt }] }], '프롬프트 생성 중...');

            if (actionType === 'writers_block') {
                textareaElement.value += `\n\n--- AI 제안 ---\n${newText}`;
            } else {
                textareaElement.value = newText;
            }
            textareaElement.dispatchEvent(new Event('input', { bubbles: true }));
            ThemePark.ui.showDynamicToast({ title: 'AI 제안 적용 완료!', icon: '✨' });

        } catch (error) {
            ThemePark.ui.showDynamicToast({ title: '오류 발생', details: error.message || '알 수 없는 오류입니다.', icon: '❌', duration: 4000 });
            if (ThemePark.state.originalPromptTexts.has(textareaElement)) {
                textareaElement.value = ThemePark.state.originalPromptTexts.get(textareaElement);
            }
        } finally {
            allButtons.forEach(btn => btn.disabled = false);
            buttonWrapper.querySelector('.prompt-btn-main').textContent = originalButtonText;
        }
    },
    
    /**
     * Gemini API를 사용하여 색상 팔레트를 생성한다.
     */
    async generatePaletteWithGemini(prompt) {
        try {
            const { geminiApiKey, geminiModel } = await chrome.storage.sync.get(['geminiApiKey', 'geminiModel']);
            if (!geminiApiKey) throw new Error('Gemini API 키가 설정되지 않았습니다.');
            
            const modelToUse = geminiModel || 'gemini-1.5-flash';
            const systemPrompt = `You are a color palette generator AI for web themes. Your task is to generate a JSON object containing 12 specific color keys based on the user's description. The keys are: "mainBgColor", "componentBgColor", "mainTextColor", "subTextColor", "myBubbleBgColor", "myBubbleTextColor", "charBubbleBgColor", "charBubbleTextColor", "accentColor", "accentTextColor", "scrollbarTrackColor", "scrollbarThumbColor". All color values must be in hex format (e.g., "#RRGGBB"). Do not add any explanations, just return the raw JSON object.`;
            const fullPrompt = `${systemPrompt}\nUser description: "${prompt}"`;

            const rawJson = await this._callGeminiAPI(modelToUse, geminiApiKey, [{ parts: [{ text: fullPrompt }] }], 'AI 팔레트 생성 중...');
            const newColors = JSON.parse(rawJson);

            const { customThemeSettings } = await chrome.storage.local.get('customThemeSettings');
            ThemePark.state.previousCustomThemeSettings = customThemeSettings || { ...ThemePark.config.defaultCustomSettings };
            
            await chrome.storage.local.set({ customThemeSettings: newColors });
            ThemePark.ui.updateColorPickers(newColors);
            if (document.getElementById('theme-select').value === 'custom') {
                ThemePark.features.applyCustomTheme(newColors);
                ThemePark.features.applyCustomScrollbarStyles(newColors);
            }
            ThemePark.ui.showDynamicToast({ title: 'AI 팔레트 적용 완료!', icon: '🎨' });

        } catch (error) {
            ThemePark.ui.showDynamicToast({ title: '팔레트 생성 실패', details: error.message || '알 수 없는 오류입니다.', icon: '❌', duration: 4000 });
        }
    },

    /**
     * 캐싱 로직을 적용하여 Gemini API로 대화 내용을 요약한다.
     */
    async summarizeChat(chatText) {
        // 캐시에서 먼저 찾아본다.
        if (ThemePark.state.apiCache.has(chatText)) {
            console.log("요약 결과를 캐시에서 불러왔음");
            ThemePark.ui.showInfoModal("AI 대화 맥락 요약 (캐시됨)", ThemePark.state.apiCache.get(chatText).replace(/\n/g, '<br>'));
            return;
        }

        try {
            const { geminiApiKey, geminiModel } = await chrome.storage.sync.get(['geminiApiKey', 'geminiModel']);
            if (!geminiApiKey) throw new Error('Gemini API 키가 설정되지 않았습니다.');
            
            const systemPrompt = `You are an AI expert in summarizing dialogue contexts. Please summarize the key context, atmosphere, and relationship between the characters from the following chat dialogue. Please provide the summary in Korean, in a concise and easy-to-understand manner.`;
            const fullPrompt = `${systemPrompt}\n\n--- 채팅 대화 ---\n${chatText}`;
            const modelToUse = geminiModel || 'gemini-1.5-flash';
            const summary = await this._callGeminiAPI(modelToUse, geminiApiKey, [{ parts: [{ text: fullPrompt }] }], '대화 요약 중...');
            
            // 결과를 캐시에 저장한다.
            ThemePark.state.apiCache.set(chatText, summary);
            ThemePark.ui.showInfoModal("AI 대화 맥락 요약", summary.replace(/\n/g, '<br>'));

        } catch (error) {
            ThemePark.ui.showDynamicToast({ title: '요약 실패', details: error.message || '알 수 없는 오류입니다.', icon: '❌', duration: 4000 });
        }
    },

    /**
     * 캐싱 로직을 적용하여 Gemini API로 대화 스타일을 분석한다.
     */
    async analyzeChatStyle(chatText) {
        if (ThemePark.state.apiCache.has(chatText + '_style')) {
            console.log("스타일 분석 결과를 캐시에서 불러왔음");
            ThemePark.ui.showInfoModal("AI 대화 스타일 분석 (캐시됨)", ThemePark.state.apiCache.get(chatText + '_style').replace(/\n/g, '<br>'));
            return;
        }

        try {
            const { geminiApiKey, geminiModel } = await chrome.storage.sync.get(['geminiApiKey', 'geminiModel']);
            if (!geminiApiKey) throw new Error('Gemini API 키가 설정되지 않았습니다.');
            
            const systemPrompt = `You are an AI character analyst. Based on the following dialogue, analyze the character's personality, speaking style (e.g., formal, casual, emotional), key vocabulary, and underlying emotions. Present the analysis in Korean, using bullet points for clarity.`;
            const fullPrompt = `${systemPrompt}\n\n--- 채팅 대화 ---\n${chatText}`;
            const modelToUse = geminiModel || 'gemini-1.5-flash';
            const analysis = await this._callGeminiAPI(modelToUse, geminiApiKey, [{ parts: [{ text: fullPrompt }] }], '대화 스타일 분석 중...');
            
            ThemePark.state.apiCache.set(chatText + '_style', analysis);
            ThemePark.ui.showInfoModal("AI 대화 스타일 분석", analysis.replace(/\n/g, '<br>'));

        } catch (error) {
            ThemePark.ui.showDynamicToast({ title: '분석 실패', details: error.message || '알 수 없는 오류입니다.', icon: '❌', duration: 4000 });
        }
    },

    /**
     * Gemini API를 사용하여 다음 장면을 제안한다. (이것은 매번 다른 결과가 나와야 하므로 캐싱하지 않는다)
     */
    async suggestNextScene(chatText) {
        try {
            const { geminiApiKey, geminiModel } = await chrome.storage.sync.get(['geminiApiKey', 'geminiModel']);
            if (!geminiApiKey) throw new Error('Gemini API 키가 설정되지 않았습니다.');
            
            const systemPrompt = `You are a creative storyteller AI. Based on the context of the following dialogue, suggest three interesting and creative new scenes, plot twists, or topics of conversation to continue the story. Present the suggestions in Korean, as a numbered list.`;
            const fullPrompt = `${systemPrompt}\n\n--- 채팅 대화 ---\n${chatText}`;
            const modelToUse = geminiModel || 'gemini-1.5-flash';
            const suggestions = await this._callGeminiAPI(modelToUse, geminiApiKey, [{ parts: [{ text: fullPrompt }] }], '다음 장면 구상 중...');
            
            ThemePark.ui.showInfoModal("AI 다음 장면 추천", suggestions.replace(/\n/g, '<br>'));
        } catch (error) {
            ThemePark.ui.showDynamicToast({ title: '장면 추천 실패', details: error.message || '알 수 없는 오류입니다.', icon: '❌', duration: 4000 });
        }
    },
    
    /**
     * Gemini API를 사용하여 텍스트를 번역한다.
     */
    async translateTextWithGemini(text, targetLang) {
        if (!ThemePark.state.translatorModal) return;
        const translationOutput = ThemePark.state.translatorModal.querySelector('#translation-output');
        const translateBtn = ThemePark.state.translatorModal.querySelector('#translate-btn');
        translateBtn.disabled = true;
        translationOutput.textContent = '번역 중...';

        try {
            const { geminiApiKey, geminiModel } = await chrome.storage.sync.get(['geminiApiKey', 'geminiModel']);
            if (!geminiApiKey) throw new Error('Gemini API 키가 설정되지 않았습니다.');

            const modelToUse = geminiModel || 'gemini-1.5-flash';
            const prompt = `Translate the following text into ${targetLang}. Provide only the translated text, without any additional explanations, headers, or markdown.`;
            const fullPrompt = `${prompt}\n\nText to translate:\n"${text}"`;

            const translatedText = await this._callGeminiAPI(modelToUse, geminiApiKey, [{ parts: [{ text: fullPrompt }] }], '번역 중...');
            translationOutput.textContent = translatedText;
            ThemePark.ui.showDynamicToast({ title: '번역 완료!', icon: '🌐' });

        } catch (error) {
            ThemePark.ui.showDynamicToast({ title: '번역 실패', details: error.message || '알 수 없는 오류입니다.', icon: '❌', duration: 4000 });
            translationOutput.textContent = '번역에 실패했습니다.';
        } finally {
            if(translateBtn) translateBtn.disabled = false;
        }
    }
};