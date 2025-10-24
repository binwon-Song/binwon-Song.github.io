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
        // UI 렌더링을 uiUtils로 위임합니다. uiUtils가 준비되지 않았으면 단순한 대체 row를 반환합니다.
        if (window.uiUtils && typeof window.uiUtils.renderWordRow === 'function') {
            return window.uiUtils.renderWordRow(word, index, {
                retranslate: (i) => this.retranslateWord(i),
                edit: (i) => this.openEditModal(i),
                delete: (i) => this.deleteWord(i)
            });
        }

        // 폴백: 최소한의 row
        const row = document.createElement('tr');
        row.className = 'animate-fade-in hover:bg-gray-50 transition-colors duration-200';
        const pinyin = word.pinyin || '[병음 없음]';
        const meaning = word.meanings || word.korean || '[의미 없음]';
        row.innerHTML = `
            <td class="px-4 py-4 w-1/5"><div class="text-lg font-semibold text-gray-900">${this.escapeHtml(word.chinese)}</div></td>
            <td class="px-4 py-4 w-1/5"><div class="text-sm font-mono text-blue-800 font-semibold">${this.escapeHtml(pinyin)}</div></td>
            <td class="px-4 py-4 w-2/5"><div class="text-blue-900">${this.escapeHtml(meaning)}</div></td>
            <td class="px-4 py-4 text-center w-1/6">
                <div class="flex justify-center space-x-1">
                    <button class="retranslate-btn p-1.5 text-green-500 hover:bg-green-50 rounded" data-index="${index}" title="재번역">재번역</button>
                    <button class="edit-btn p-1.5 text-blue-500 hover:bg-blue-50 rounded" data-index="${index}" title="수정">수정</button>
                    <button class="delete-btn p-1.5 text-red-500 hover:bg-red-50 rounded" data-index="${index}" title="삭제">삭제</button>
                </div>
            </td>
        `;
        // 이벤트 바인딩
        const retranslateBtn = row.querySelector('.retranslate-btn');
        const editBtn = row.querySelector('.edit-btn');
        const deleteBtn = row.querySelector('.delete-btn');
        if (retranslateBtn) retranslateBtn.addEventListener('click', () => this.retranslateWord(index));
        if (editBtn) editBtn.addEventListener('click', () => this.openEditModal(index));
        if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteWord(index));
        return row;
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
        // 붙여넣기하기 쉬운 텍스트로 변환: "중국어<TAB>병음<TAB>한국어 뜻"
        const lines = [];
        this.words.forEach(word => {
            try {
                const allPinyins = [];
                const allMeanings = [];

                if (word.pinyin && word.pinyin !== '[병음 없음]') {
                    allPinyins.push(word.pinyin);
                    allMeanings.push(word.meanings || word.korean || '');
                }

                if (word.other_pros && Array.isArray(word.other_pros)) {
                    if (word.other_pros.length > 0 && Array.isArray(word.other_pros[0])) {
                        // other_pros가 배열의 배열인 경우
                        word.other_pros.forEach((prosArray, ai) => {
                            if (!Array.isArray(prosArray)) return;
                            prosArray.forEach((p, pi) => {
                                if (!p) return;
                                allPinyins.push(p);
                                let m = '';
                                if (word.other_means && word.other_means[ai] && word.other_means[ai][pi]) {
                                    m = Array.isArray(word.other_means[ai][pi]) ? word.other_means[ai][pi].join(', ') : word.other_means[ai][pi];
                                }
                                allMeanings.push(m || '');
                            });
                        });
                    } else {
                        // other_pros가 단일 배열인 경우
                        word.other_pros.forEach((p, i) => {
                            if (!p) return;
                            allPinyins.push(p);
                            let m = '';
                            if (word.other_means && word.other_means[i]) {
                                m = Array.isArray(word.other_means[i]) ? word.other_means[i].join(', ') : word.other_means[i];
                            }
                            allMeanings.push(m || '');
                        });
                    }
                }

                // 라인 생성: pinyin이 여러개면 각각 new line
                if (allPinyins.length === 0) {
                    const meaning = word.korean || word.meanings || '';
                    lines.push(`${word.chinese}\t\t${meaning}`);
                } else {
                    allPinyins.forEach((p, idx) => {
                        const meaning = (allMeanings[idx] && allMeanings[idx].length > 0) ? allMeanings[idx] : (word.korean || word.meanings || '');
                        lines.push(`${word.chinese}\t${p}\t${meaning}`);
                    });
                }
            } catch (e) {
                console.error('exportData item formatting error', e, word);
            }
        });

        const exportText = lines.join('\n');
        // 클립보드에 복사 (비동기)
        navigator.clipboard.writeText(exportText).then(() => {
            this.showNotification('클립보드에 복사되었습니다. 문서에 붙여넣기 하세요.', 'success');
        }).catch(err => {
            console.error('클립보드 복사 실패:', err);
            // 실패시 JSON으로 대체 다운로드 제공
            this.showNotification('클립보드 복사에 실패했습니다. JSON 파일로 다운로드합니다.', 'warning');
            const dataStr = JSON.stringify(this.words, null, 2);
            window.uiUtils.downloadFile(dataStr, `chinese-wordbook-${new Date().toISOString().split('T')[0]}.json`);
        });
    }

}

// DOM이 로드되면 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', function() {
    window.wordbook = new ChineseWordbook();
});
