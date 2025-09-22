// 중국어 단어장 JavaScript

class ChineseWordbook {
    constructor() {
        this.words = JSON.parse(localStorage.getItem('chineseWords')) || [];
        this.currentEditIndex = -1;
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.initializeLibraries();
        this.updateWordTable();
    }

    bindElements() {
        this.elements = {
            chineseInput: document.getElementById('chineseInput'),
            addBtn: document.getElementById('addBtn'),
            wordTableBody: document.getElementById('wordTableBody'),
            emptyState: document.getElementById('emptyState'),
            controls: document.getElementById('controls'),
            clearAllBtn: document.getElementById('clearAllBtn'),
            editModal: document.getElementById('editModal'),
            closeModalBtn: document.getElementById('closeModalBtn'),
            cancelEditBtn: document.getElementById('cancelEditBtn'),
            saveEditBtn: document.getElementById('saveEditBtn'),
            editChinese: document.getElementById('editChinese'),
            editPinyin: document.getElementById('editPinyin'),
            editYinyus: document.getElementById('editYinyus'),
            editKorean: document.getElementById('editKorean')
        };
    }

    bindEvents() {
        // 단어 추가 이벤트
        this.elements.addBtn.addEventListener('click', () => this.addWord());
        this.elements.chineseInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.elements.addBtn.disabled) {
                this.addWord();
            }
        });

        // 전체 삭제 이벤트
        this.elements.clearAllBtn.addEventListener('click', () => this.clearAllWords());

        // 모달 이벤트
        this.elements.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.elements.cancelEditBtn.addEventListener('click', () => this.closeModal());
        this.elements.saveEditBtn.addEventListener('click', () => this.saveEdit());

        // 모달 외부 클릭 시 닫기
        this.elements.editModal.addEventListener('click', (e) => {
            if (e.target === this.elements.editModal) {
                this.closeModal();
            }
        });

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.elements.editModal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    initializeLibraries() {
        // Feather Icons 초기화
        if (typeof feather !== 'undefined') {
            feather.replace();
        }

        // AOS 애니메이션 초기화
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 600,
                easing: 'ease-out',
                once: true
            });
        }
    }

    async addWord() {
        const chineseWord = this.elements.chineseInput.value.trim();
        if (!chineseWord) {
            this.showNotification('중국어 단어를 입력해주세요.', 'warning');
            return;
        }

        // 중복 체크
        if (this.words.some(word => word.chinese === chineseWord)) {
            this.showNotification('이미 추가된 단어입니다.', 'warning');
            return;
        }

        // 로딩 상태 표시
        this.elements.addBtn.disabled = true;
        this.elements.addBtn.innerHTML = '<i data-feather="loader" class="w-5 h-5 mr-2 animate-spin"></i> 번역 중...';
        if (typeof feather !== 'undefined') feather.replace();

        try {
            // 실제 번역 API 호출
            this.showNotification('번역을 가져오는 중입니다...', 'info');
            const translationResult = await this.translateWord(chineseWord);
            console.log('번역 결과:', translationResult);

            const newWord = {
                chinese: translationResult.word || chineseWord,
                pinyin: translationResult.main_pro || '[병음 없음]',
                meanings: translationResult.main_meanings && translationResult.main_meanings.length > 0
                    ? translationResult.main_meanings.join(', ')
                    : '[번역 없음]',
                id: Date.now(),
                createdAt: new Date().toISOString(),
                other_pros: translationResult.other_pros || [],
                other_means: translationResult.other_means || [],
                // 호환성을 위한 korean 필드
                korean: translationResult.main_meanings && translationResult.main_meanings.length > 0
                    ? translationResult.main_meanings.join('\n ')
                    : '[번역 없음]'
            };

            this.words.push(newWord);
            this.saveWords();
            this.elements.chineseInput.value = '';
            this.updateWordTable();
            this.showNotification('단어가 성공적으로 추가되었습니다!', 'success');

        } catch (error) {
            console.error('번역 오류:', error);
            
            // 오류 발생 시 기본값으로 추가할지 묻기
            const addAnyway = confirm(`번역을 가져오는데 실패했습니다.\n그래도 "${chineseWord}"를 추가하시겠습니까?`);
            
            if (addAnyway) {
                const newWord = {
                    chinese: chineseWord,
                    pinyin: '[번역 실패]',
                    korean: '[번역 실패]',
                    id: Date.now(),
                    createdAt: new Date().toISOString(),
                    meanings: []
                };

                this.words.push(newWord);
                this.saveWords();
                this.elements.chineseInput.value = '';
                this.updateWordTable();
                this.showNotification('단어가 추가되었습니다. 나중에 수정할 수 있습니다.', 'warning');
            } else {
                this.showNotification('단어 추가가 취소되었습니다.', 'info');
            }

        } finally {
            // 로딩 상태 해제
            this.elements.addBtn.disabled = false;
            this.elements.addBtn.innerHTML = '<i data-feather="plus" class="w-5 h-5 mr-2"></i> 단어 추가';
            if (typeof feather !== 'undefined') feather.replace();
        }
    }

    updateWordTable() {
        this.elements.wordTableBody.innerHTML = '';

        if (this.words.length === 0) {
            this.elements.emptyState.classList.remove('hidden');
            this.elements.controls.classList.add('hidden');
            return;
        }

        this.elements.emptyState.classList.add('hidden');
        this.elements.controls.classList.remove('hidden');

        this.words.forEach((word, index) => {
            const rowOrFragment = this.createWordRow(word, index);
            
            // DocumentFragment인지 단일 row인지 확인
            if (rowOrFragment.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                this.elements.wordTableBody.appendChild(rowOrFragment);
            } else {
                this.elements.wordTableBody.appendChild(rowOrFragment);
            }
        });

        // Feather Icons 다시 초기화
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    createWordRow(word, index) {
        // 모든 병음과 의미를 수집
        const allPinyins = [];
        const allMeanings = [];
        
        console.log('Word data:', word); // 디버깅용
        
        // 메인 병음과 의미 추가
        if (word.pinyin && word.pinyin !== '[병음 없음]') {
            allPinyins.push(word.pinyin);
            // 메인 의미를 리스트로 처리
            let mainMeanings = word.meanings || '[의미 없음]';
            if (typeof mainMeanings === 'string' && mainMeanings.includes(',')) {
                mainMeanings = mainMeanings.split(',').map(m => m.trim());
            }
            allMeanings.push(mainMeanings);
        }
        
        // 추가 병음들과 의미들 처리 - other_pros의 각 요소를 개별적으로 처리
        if (word.other_pros && Array.isArray(word.other_pros)) {
            console.log('Other pros:', word.other_pros);
            console.log('Other means:', word.other_means);
            
            // other_pros가 배열의 배열인지 확인
            if (word.other_pros.length > 0 && Array.isArray(word.other_pros[0])) {
                // other_pros가 [[pros1], [pros2]] 형태인 경우
                word.other_pros.forEach((prosArray, arrayIndex) => {
                    if (Array.isArray(prosArray)) {
                        prosArray.forEach((pros, prosIndex) => {
                            if (pros) {
                                allPinyins.push(pros);
                                // 해당하는 의미 가져오기
                                let meanings = '[의미 없음]';
                                if (word.other_means && 
                                    word.other_means[arrayIndex] && 
                                    word.other_means[arrayIndex][prosIndex]) {
                                    meanings = word.other_means[arrayIndex][prosIndex];
                                    if (Array.isArray(meanings)) {
                                        // 이미 배열이면 그대로 사용
                                    } else if (typeof meanings === 'string' && meanings.includes(',')) {
                                        meanings = meanings.split(',').map(m => m.trim());
                                    }
                                }
                                allMeanings.push(meanings);
                            }
                        });
                    }
                });
            } else {
                // other_pros가 [pros1, pros2] 형태인 경우
                word.other_pros.forEach((pros, i) => {
                    if (pros) {
                        allPinyins.push(pros);
                        let meanings = '[의미 없음]';
                        if (word.other_means && word.other_means[i]) {
                            meanings = word.other_means[i];
                            if (Array.isArray(meanings)) {
                                // 이미 배열이면 그대로 사용
                            } else if (typeof meanings === 'string' && meanings.includes(',')) {
                                meanings = meanings.split(',').map(m => m.trim());
                            }
                        }
                        allMeanings.push(meanings);
                    }
                });
            }
        }
        
        const pinyinCount = allPinyins.length;
        console.log('Total pinyins:', pinyinCount, allPinyins);
        console.log('All meanings:', allMeanings);
        
        // 병음 개수에 따른 테이블 구조 생성
        if (pinyinCount <= 1) {
            // 기본 구조 (1개 또는 0개)
            const row = document.createElement('tr');
            row.className = 'animate-fade-in hover:bg-gray-50 transition-colors duration-200';
            
            row.innerHTML = `
                <td class="px-4 py-4 w-1/5">
                    <div class="text-lg font-semibold text-gray-900">${this.escapeHtml(word.chinese)}</div>
                </td>
                <td class="px-4 py-4 w-1/5">
                    <div class="text-sm font-mono text-blue-800 font-semibold">
                        ${pinyinCount > 0 ? this.escapeHtml(allPinyins[0]) : '[병음 없음]'}
                    </div>
                </td>
                <td class="px-4 py-4 w-2/5">
                    <div class="text-blue-900">
                        ${pinyinCount > 0 ? this.formatMeaningsAsHtml(allMeanings[0]) : '[의미 없음]'}
                    </div>
                </td>
                <td class="px-4 py-4 text-center w-1/6">
                    <div class="flex justify-center space-x-1">
                        <button class="retranslate-btn p-1.5 text-green-500 hover:bg-green-50 rounded" data-index="${index}" title="재번역">
                            <i data-feather="refresh-cw" class="w-4 h-4"></i>
                        </button>
                        <button class="edit-btn p-1.5 text-blue-500 hover:bg-blue-50 rounded" data-index="${index}" title="수정">
                            <i data-feather="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button class="delete-btn p-1.5 text-red-500 hover:bg-red-50 rounded" data-index="${index}" title="삭제">
                            <i data-feather="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            `;
            
            this.addEventListeners(row, index);
            return row;
        } else {
            // 다중 병음 구조 (2개 이상)
            const fragment = document.createDocumentFragment();
            
            allPinyins.forEach((pinyin, pinyinIndex) => {
                const row = document.createElement('tr');
                row.className = 'animate-fade-in hover:bg-gray-50 transition-colors duration-200';
                
                // 첫 번째 행에만 중국어와 작업 버튼 표시
                if (pinyinIndex === 0) {
                    row.innerHTML = `
                        <td class="px-4 py-4 w-1/5 border-r" rowspan="${pinyinCount}">
                            <div class="text-lg font-semibold text-gray-900">${this.escapeHtml(word.chinese)}</div>
                            <div class="text-xs text-gray-500 mt-1">${pinyinCount}개 발음</div>
                        </td>
                        <td class="px-4 py-3 w-1/4 ${pinyinIndex === 0 ? 'bg-blue-50' : 'bg-gray-50'}">
                            <div class="text-sm font-mono ${pinyinIndex === 0 ? 'text-blue-800 font-semibold' : 'text-gray-700'}">
                                ${this.escapeHtml(pinyin)}
                                ${pinyinIndex === 0 ? '<span class="text-xs ml-2 bg-blue-200 text-blue-800 px-1 rounded">메인</span>' : ''}
                            </div>
                        </td>
                        <td class="px-4 py-3 w-2/5 ${pinyinIndex === 0 ? 'bg-blue-25' : 'bg-gray-25'}">
                            <div class="${pinyinIndex === 0 ? 'text-blue-900' : 'text-gray-800'}">
                                ${this.formatMeaningsAsHtml(allMeanings[pinyinIndex] || '[의미 없음]')}
                            </div>
                        </td>
                        <td class="px-4 py-4 text-center w-1/6 border-l" rowspan="${pinyinCount}">
                            <div class="flex justify-center space-x-1">
                                <button class="retranslate-btn p-1.5 text-green-500 hover:bg-green-50 rounded" data-index="${index}" title="재번역">
                                    <i data-feather="refresh-cw" class="w-4 h-4"></i>
                                </button>
                                <button class="edit-btn p-1.5 text-blue-500 hover:bg-blue-50 rounded" data-index="${index}" title="수정">
                                    <i data-feather="edit-2" class="w-4 h-4"></i>
                                </button>
                                <button class="delete-btn p-1.5 text-red-500 hover:bg-red-50 rounded" data-index="${index}" title="삭제">
                                    <i data-feather="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    this.addEventListeners(row, index);
                } else {
                    // 나머지 행들은 병음과 의미만 표시
                    row.innerHTML = `
                        <td class="px-4 py-3 w-1/4 bg-gray-50">
                            <div class="text-sm font-mono text-gray-700">
                                ${this.escapeHtml(pinyin)}
                            </div>
                        </td>
                        <td class="px-4 py-3 w-2/5 bg-gray-25">
                            <div class="text-gray-800">
                                ${this.formatMeaningsAsHtml(allMeanings[pinyinIndex] || '[의미 없음]')}
                            </div>
                        </td>
                    `;
                }
                
                fragment.appendChild(row);
            });
            
            return fragment;
        }
    }
    
    // 의미를 HTML 리스트로 변환하는 헬퍼 함수
    formatMeaningsAsHtml(meanings) {
        if (!meanings || meanings === '[의미 없음]') {
            return '<span class="text-gray-500">[의미 없음]</span>';
        }
        
        if (Array.isArray(meanings)) {
            if (meanings.length === 1) {
                return this.escapeHtml(meanings[0]);
            } else {
                const listItems = meanings.map(meaning => 
                    `<li class="ml-3">• ${this.escapeHtml(meaning.trim())}</li>`
                ).join('');
                return `<ul class="text-sm space-y-1">${listItems}</ul>`;
            }
        } else if (typeof meanings === 'string') {
            if (meanings.includes(',')) {
                const meaningArray = meanings.split(',').map(m => m.trim());
                const listItems = meaningArray.map(meaning => 
                    `<li class="ml-3">• ${this.escapeHtml(meaning)}</li>`
                ).join('');
                return `<ul class="text-sm space-y-1">${listItems}</ul>`;
            } else {
                return this.escapeHtml(meanings);
            }
        }
        
        return this.escapeHtml(meanings.toString());
    }

    // 이벤트 리스너를 추가하는 헬퍼 함수
    addEventListeners(row, index) {
        const retranslateBtn = row.querySelector('.retranslate-btn');
        const editBtn = row.querySelector('.edit-btn');
        const deleteBtn = row.querySelector('.delete-btn');
        
        if (retranslateBtn) retranslateBtn.addEventListener('click', () => this.retranslateWord(index));
        if (editBtn) editBtn.addEventListener('click', () => this.openEditModal(index));
        if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteWord(index));
    }

    async retranslateWord(index) {
        const word = this.words[index];
        
        if (!confirm(`"${word.chinese}" 단어를 다시 번역하시겠습니까?`)) {
            return;
        }

        try {
            this.showNotification('재번역 중입니다...', 'info');
            
            const translationResult = await this.translateWord(word.chinese);
            
            // 기존 단어 정보 업데이트
            this.words[index] = {
                ...word,
                pinyin: translationResult.main_pro || '[병음 없음]',
                meanings: translationResult.main_meanings && translationResult.main_meanings.length > 0
                    ? translationResult.main_meanings.join(', ')
                    : '[번역 없음]',
                korean: translationResult.main_meanings && translationResult.main_meanings.length > 0 
                    ? translationResult.main_meanings.join(', ') 
                    : '[번역 없음]',
                other_pros: translationResult.other_pros || [],
                other_means: translationResult.other_means || [],
                updatedAt: new Date().toISOString()
            };

            this.saveWords();
            this.updateWordTable();
            this.showNotification('단어가 성공적으로 재번역되었습니다!', 'success');

        } catch (error) {
            console.error('재번역 오류:', error);
            this.showNotification('재번역에 실패했습니다. 나중에 다시 시도해주세요.', 'error');
        }
    }

    deleteWord(index) {
        const word = this.words[index];
        if (confirm(`정말로 "${word.chinese}" 단어를 삭제하시겠습니까?`)) {
            this.words.splice(index, 1);
            this.saveWords();
            this.updateWordTable();
            this.showNotification('단어가 삭제되었습니다.', 'success');
        }
    }

    clearAllWords() {
        if (this.words.length === 0) return;

        if (confirm('정말로 모든 단어를 삭제하시겠습니까?')) {
            this.words = [];
            this.saveWords();
            this.updateWordTable();
            this.showNotification('모든 단어가 삭제되었습니다.', 'success');
        }
    }

    openEditModal(index) {
        this.currentEditIndex = index;
        const word = this.words[index];

        this.elements.editChinese.value = word.chinese;
        this.elements.editPinyin.value = word.pinyin || '';
        this.elements.editYinyus.value = word.yinyus || '';
        this.elements.editKorean.value = word.korean;

        this.elements.editModal.classList.remove('hidden');
        
        // 모달 애니메이션
        setTimeout(() => {
            const modalContent = this.elements.editModal.querySelector('.glass-effect');
            modalContent.classList.remove('scale-95');
            modalContent.classList.add('scale-100');
        }, 10);

        // 첫 번째 입력 필드에 포커스
        setTimeout(() => {
            this.elements.editChinese.focus();
        }, 100);
    }

    closeModal() {
        // 모달 닫기 애니메이션
        const modalContent = this.elements.editModal.querySelector('.glass-effect');
        modalContent.classList.remove('scale-100');
        modalContent.classList.add('scale-95');
        
        setTimeout(() => {
            this.elements.editModal.classList.add('hidden');
            this.currentEditIndex = -1;
        }, 300);
    }

    saveEdit() {
        if (this.currentEditIndex === -1) return;

        const chinese = this.elements.editChinese.value.trim();
        const pinyin = this.elements.editPinyin.value.trim();
        const korean = this.elements.editKorean.value.trim();

        if (!chinese || !korean) {
            this.showNotification('중국어와 한국어 뜻은 필수 입력 항목입니다.', 'warning');
            return;
        }

        // 중복 체크 (현재 편집 중인 단어 제외)
        const isDuplicate = this.words.some((word, index) => 
            index !== this.currentEditIndex && word.chinese === chinese
        );

        if (isDuplicate) {
            this.showNotification('이미 존재하는 단어입니다.', 'warning');
            return;
        }

        this.words[this.currentEditIndex] = {
            ...this.words[this.currentEditIndex],
            chinese: chinese,
            pinyin: pinyin || '[병음 없음]',
            korean: korean,
            updatedAt: new Date().toISOString()
        };

        this.saveWords();
        this.updateWordTable();
        this.closeModal();
        this.showNotification('단어가 수정되었습니다.', 'success');
    }

    saveWords() {
        localStorage.setItem('chineseWords', JSON.stringify(this.words));
    }

        // 번역 서비스 사용
    async translateWord(word) {
        return await window.translationService.translateWord(word);
    }

    // HTML 이스케이프 처리 (UI 유틸리티 사용)
    escapeHtml(text) {
        return window.uiUtils.escapeHtml(text);
    }

    // 알림 표시 함수 (UI 유틸리티 사용)
    showNotification(message, type = 'info') {
        return window.uiUtils.showNotification(message, type);
    }

    // 데이터 내보내기 (UI 유틸리티 사용)
    exportData() {
        const dataStr = JSON.stringify(this.words, null, 2);
        const filename = `chinese-wordbook-${new Date().toISOString().split('T')[0]}.json`;
        
        window.uiUtils.downloadFile(dataStr, filename);
        this.showNotification('데이터가 내보내졌습니다.', 'success');
    }

    // 전체 재번역
    async retranslateAll() {
        if (this.words.length === 0) {
            this.showNotification('재번역할 단어가 없습니다.', 'info');
            return;
        }

        const confirmed = confirm(`총 ${this.words.length}개의 단어를 재번역하시겠습니까?\n시간이 오래 걸릴 수 있습니다.`);
        if (!confirmed) return;

        let successCount = 0;
        let errorCount = 0;
        
        // 진행 상황 표시용 요소 생성 (UI 유틸리티 사용)
        const progressDiv = window.uiUtils.createProgressIndicator('재번역 중...');
        
        try {
            // 번역 서비스의 일괄 번역 기능 사용
            const wordsToTranslate = this.words.map(word => word.chinese);
            
            const results = await window.translationService.translateMultipleWords(
                wordsToTranslate,
                (current, total, currentWord) => {
                    window.uiUtils.updateProgress(progressDiv, current, total, currentWord);
                }
            );
            
            // 결과 적용
            results.forEach((result, index) => {
                if (result.success) {
                    this.words[index] = {
                        ...this.words[index],
                        pinyin: result.main_pro || '[병음 없음]',
                        meanings: result.main_meanings && result.main_meanings.length > 0
                            ? result.main_meanings.join(', ')
                            : '[번역 없음]',
                        korean: result.main_meanings && result.main_meanings.length > 0 
                            ? result.main_meanings.join(', ') 
                            : '[번역 없음]',
                        other_pros: result.other_pros || [],
                        other_means: result.other_means || [],
                        updatedAt: new Date().toISOString()
                    };
                    successCount++;
                } else {
                    errorCount++;
                }
            });
            
            // 결과 저장 및 업데이트
            this.saveWords();
            this.updateWordTable();
            
            // 결과 알림
            const message = `재번역 완료!\n성공: ${successCount}개, 실패: ${errorCount}개`;
            this.showNotification(message, errorCount > 0 ? 'warning' : 'success');
            
        } finally {
            // 진행 상황 표시 제거 (UI 유틸리티 사용)
            window.uiUtils.removeProgressIndicator(progressDiv);
        }
    }




}

// DOM이 로드되면 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', function() {
    window.wordbook = new ChineseWordbook();
});
