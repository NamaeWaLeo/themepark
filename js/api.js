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
     * Gemini Vision API를 사용하여 이미지로부터 NovelAI 및 Stable Diffusion 스타일 태그를 생성한다.
     * @param {string} imageUrl - 분석할 이미지의 URL
     * @returns {Promise<object>} NovelAI 및 PixAI/Stable Diffusion 태그를 포함하는 JSON 객체
     */
    async generateTagsFromImage(imageUrl) {
        // 이미지를 캐시에서 먼저 찾아본다.
        if (ThemePark.state.apiCache.has(imageUrl + '_tags')) {
            return ThemePark.state.apiCache.get(imageUrl + '_tags');
        }

        const { geminiApiKey } = await chrome.storage.sync.get('geminiApiKey');
        if (!geminiApiKey) throw new Error('Gemini API 키가 설정되지 않았습니다.');
        
        // 이미지 URL에서 Blob 데이터를 가져온다.
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`이미지를 불러올 수 없습니다: ${response.statusText}`);
        const blob = await response.blob();
        
        // Blob 데이터를 Base64로 변환한다.
        const base64data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        // Gemini API에 전달할 시스템 프롬프트 구성
        const systemPrompt = `You are an expert AI for generating image tags for AI image generation models like NovelAI and Stable Diffusion (PixAI).
Based on the provided image, output a JSON object containing character-focused and non-character (background/style) tags for both NovelAI and PixAI/Stable Diffusion styles.

**Instructions:**
1.  Analyze the image in detail.
2.  For NovelAI tags:
    * 'character': Focus on character's appearance, clothing, pose, expression. Be very descriptive and capture the character's key points.
    * 'non_character': Focus on background, environment, lighting, artistic style, quality tags.
3.  For PixAI/Stable Diffusion tags:
    * 'character': Similar to NovelAI, but also include common quality tags like "masterpiece, best quality, ultra detailed". Capture the character's key points thoroughly.
    * 'non_character': Similar to NovelAI, but also include common quality tags for environment and style.
4.  Ensure all tags are comma-separated strings.
5.  All tags should be in English.
6.  Do NOT include any newlines within the tag strings.
7.  Return only the JSON object, without any markdown formatting (\`\`\`json) or explanatory text.
8.  가중치를 표현할 때, novelai는 {강화된 프롬프트}, [약화된 프롬프트] 로 적는다. 중괄호와 대괄호의 개수가 많을수록 그 효과는 강화된다. 너무 많이 사용하면 안된다.
9.  가중치를 표현할 때, Stablediffusion이나 Pixai는 (강화된 프롬프트), [약화된 프롬프트]로 적는다.
10. 캐릭터나 배경, 구도를 세세하고 면밀히 분석하여, 아주 디테일하게 프롬프트를 적용해야 한다. 캐릭터의 포인트 하나하나를 자세히.

**Example Output Structure:**
{
  "novelai": {
    "character": "1girl, long hair, blue eyes, white dress, standing, smiling",
    "non_character": "outdoor, sunny, forest, clear sky, highly detailed, realistic"
  },
  "pixai": {
    "character": "masterpiece, best quality, 1girl, solo, long hair, blue eyes, white dress, standing, smiling, looking at viewer",
    "non_character": "highly detailed, absurdres, outdoor, sunny, forest, volumetric lighting, cinematic lighting"
  }
}
`;
        
        // Gemini API 요청을 위한 contents 배열 구성
        const contents = [{
            parts: [
                { text: systemPrompt },
                { inline_data: { mime_type: blob.type, data: base64data } }
            ]
        }];

        // Gemini API 호출 (gemini-2.0-flash)
        const rawJson = await this._callGeminiAPI('gemini-2.0-flash', geminiApiKey, contents, '이미지 태그 생성 중...');
        
        let parsedData;
        try {
            // API 응답(JSON 문자열)을 파싱
            parsedData = JSON.parse(rawJson);
        } catch (e) {
            console.error("AI 응답을 파싱하는 데 실패했습니다. 응답 형식이 올바르지 않습니다:", rawJson, e);
            throw new Error("AI 응답을 파싱하는 데 실패했습니다. 응답 형식이 올바르지 않습니다.");
        }
        
        // 결과를 캐시에 저장한다.
        ThemePark.state.apiCache.set(imageUrl + '_tags', parsedData);
        return parsedData;
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
    
        const rawYaml = await this._callGeminiAPI('gemini-2.0-flash', geminiApiKey, contents, '이미지 분석 및 프로필 생성 중...');
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
     * Gemini API를 사용하여 프롬프트를 개선하거나 아이디어를 얻는다.
     */
    async enhanceWithGemini(textareaElement, type, actionType) {
        const buttonWrapper = textareaElement.closest('section').querySelector('.prompt-btn-wrapper');
        const allButtons = buttonWrapper.querySelectorAll('button');
        const originalButtonText = buttonWrapper.querySelector('.prompt-btn-main')?.textContent || 'AI 도우미'; 
        
        allButtons.forEach(btn => btn.disabled = true);
        if (buttonWrapper.querySelector('.prompt-btn-main')) { 
            buttonWrapper.querySelector('.prompt-btn-main').textContent = 'AI 작업 중...';
        }
        ThemePark.state.originalPromptTexts.set(textareaElement, textareaElement.value);

        try {
            const { geminiApiKey, geminiModel, aiPromptSettings } = await chrome.storage.sync.get(['geminiApiKey', 'geminiModel', 'aiPromptSettings']);
            if (!geminiApiKey) {
                throw new Error('Gemini API 키가 설정되지 않았습니다.');
            }

            const modelToUse = geminiModel || 'gemini-1.5-flash';
            const settings = aiPromptSettings || { length: '보통', include: '', exclude: '' };
            const originalText = textareaElement.value;
            
            // 세계관 및 캐릭터 정보를 동적으로 가져온다.
            const worldDescription = document.querySelector('textarea[name="longDescription"]')?.value || '';
            const characterName = document.querySelector('input[name="name"]')?.value || ''; 

            const systemPrompt = ThemePark.features.getSystemPromptForAction(type, actionType, { 
                ...settings, 
                worldDescription, 
                characterName 
            });
            const fullPrompt = `${systemPrompt}\n\n--- 사용자 원본 텍스트 ---\n${originalText}`;

            const newText = await this._callGeminiAPI(modelToUse, geminiApiKey, [{ parts: [{ text: fullPrompt }] }], '프롬프트 생성 중...');

            if (actionType === 'writers_block') { // 이 조건은 이제 사용되지 않음
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
            if (buttonWrapper.querySelector('.prompt-btn-main')) { 
                buttonWrapper.querySelector('.prompt-btn-main').textContent = originalButtonText;
            }
        }
    },

    /**
     * AI 생성 마법사를 위한 통합 생성 함수
     * @param {object} settings - 이름, 장르, 키워드, 세계관 키워드, 캐릭터 키워드, 이미지 URL, length (아주 짧게, 짧게, 보통)
     * @returns {Promise<object>} 생성된 세계관 및 캐릭터 프로필 YAML
     */
    async generateWithWizard(settings) {
        const { geminiApiKey, geminiModel } = await chrome.storage.sync.get('geminiApiKey');
        if (!geminiApiKey) throw new Error('Gemini API 키가 설정되지 않았습니다.');
        const modelToUse = geminiModel || 'gemini-2.0-flash'; // 마법사는 1.5 Pro 권장

        const getLengthModifier = (length) => {
            switch (length) {
                case '아주 짧게': return '길이는 아주 간결하게 유지해주세요. (기존 대비 40% 축소)';
                case '짧게': return '길이는 간결하게 유지해주세요. (기존 대비 20% 축소)';
                case '보통': return '충분한 길이로 상세하게 작성해주세요.';
                default: return '';
            }
        };
        const lengthModifier = getLengthModifier(settings.length);

        let worldPrompt = '';
        if (settings.genre || settings.worldKeywords || settings.name || settings.keywords) {
            worldPrompt = `당신은 시나리오 전문가입니다. 다음 정보를 바탕으로 상세한 세계관 시나리오를 YAML 형식으로 생성해주세요. 키는 '시점', '장르', '분위기', '배경', '주요_갈등'을 사용하세요.
            사용자 입력: 이름: "${settings.name || ''}", 장르: "${settings.genre || ''}", 세계관 키워드: "${settings.worldKeywords || ''}", 공통 키워드: "${settings.keywords || ''}"
            ${lengthModifier ? `**분량 지침:** ${lengthModifier}` : ''}
            **제약 사항:**
            - 모든 출력은 한국어로, YAML 블록만 반환하세요.
            - 설명 텍스트나 마크다운 포맷팅 (예: \`\`\`yaml)은 포함하지 마세요.`;
        }

        let characterPrompt = '';
        if (settings.characterKeywords || settings.name || settings.keywords) {
            characterPrompt = `당신은 캐릭터 프롬프트 전문가입니다. 다음 정보를 바탕으로 상세한 캐릭터 프로필을 YAML 형식으로 생성해주세요. 다음 키만 포함하세요: 'name', 'appearance', 'personality', 'speech_style', 'relationship_with_user'. 이름은 한국어로 생성해야 합니다.
            사용자 입력: 이름: "${settings.name || ''}", 캐릭터 키워드: "${settings.characterKeywords || ''}", 공통 키워드: "${settings.keywords || ''}"
            ${settings.worldDescription ? `**이 캐릭터는 다음 세계관 내에 존재해야 합니다:**\n${settings.worldDescription}\n` : ''}
            ${lengthModifier ? `**분량 지침:** ${lengthModifier}` : ''}
            **제약 사항:**
            - 모든 출력은 한국어로, YAML 블록만 반환하세요.
            - 설명 텍스트나 마크다운 포맷팅 (예: \`\`\`yaml)은 포함하지 마세요.`;
        }

        let imageContents = [];
        if (settings.imageUrl) {
            const response = await fetch(settings.imageUrl);
            if (!response.ok) throw new Error(`이미지를 불러올 수 없습니다: ${response.statusText}`);
            const blob = await response.blob();
            const base64data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            imageContents.push({ inline_data: { mime_type: blob.type, data: base64data } });
        }

        const promises = [];
        if (worldPrompt) {
            promises.push(this._callGeminiAPI(modelToUse, geminiApiKey, [{ parts: [{ text: worldPrompt }, ...imageContents] }], '세계관 초안 생성 중...'));
        } else {
            promises.push(Promise.resolve('')); // 세계관 생성 요청이 없으면 빈 문자열 반환
        }

        if (characterPrompt) {
            promises.push(this._callGeminiAPI(modelToUse, geminiApiKey, [{ parts: [{ text: characterPrompt }, ...imageContents] }], '캐릭터 초안 생성 중...'));
        } else {
            promises.push(Promise.resolve('')); // 캐릭터 생성 요청이 없으면 빈 문자열 반환
        }

        const [worldYaml, characterYaml] = await Promise.all(promises);

        return {
            world: worldYaml,
            character: characterYaml
        };
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
    },
    /**
     * Zeta API로부터 특정 캐릭터(Plot)의 상세 정보를 가져온다.
     * @param {string} plotId - 가져올 캐릭터의 ID
     * @returns {Promise<object>} 캐릭터 정보 JSON 객체
     */
    async getPlotData(plotId) {
        // API 호출 결과를 캐시에서 먼저 확인한다.
        if (ThemePark.state.apiCache.has(plotId)) {
            return ThemePark.state.apiCache.get(plotId);
        }
        try {
            const response = await fetch(`https://api.zeta-ai.io/v1/plots/${plotId}`);
            if (!response.ok) {
                throw new Error(`API 요청 실패 (상태: ${response.status})`);
            }
            const data = await response.json();
            // 성공적인 응답을 캐시에 저장한다.
            ThemePark.state.apiCache.set(plotId, data);
            return data;
        } catch (error) {
            console.error(`Plot 데이터(${plotId})를 가져오는 중 오류 발생:`, error);
            throw error;
        }
    }
};