// UI 유틸리티 클래스
// 알림, 모달, 진행 상황 표시 등 UI 관련 기능

class UIUtils {
    constructor() {
        this.notificationContainer = null;
        this.initializeNotificationContainer();
    }

    // 알림 컨테이너 초기화
    initializeNotificationContainer() {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'notification-container';
        this.notificationContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(this.notificationContainer);
    }

    // 알림 표시 함수
    showNotification(message, type = 'info', duration = 3000) {
        // 알림 생성
        const notification = document.createElement('div');
        notification.className = `px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
        
        // 타입별 스타일
        const styles = {
            success: 'bg-green-500 text-white',
            warning: 'bg-yellow-500 text-white',
            error: 'bg-red-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        
        notification.className += ` ${styles[type] || styles.info}`;
        notification.textContent = message;
        
        this.notificationContainer.appendChild(notification);
        
        // 애니메이션 시작
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 10);
        
        // 자동 제거
        setTimeout(() => {
            this.hideNotification(notification);
        }, duration);

        return notification;
    }

    // 알림 숨기기
    hideNotification(notification) {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // 진행 상황 표시기 생성
    createProgressIndicator(title = '처리 중...') {
        const progressDiv = document.createElement('div');
        progressDiv.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 z-50 min-w-80';
        progressDiv.innerHTML = `
            <div class="text-center">
                <div class="text-lg font-semibold mb-4">${title}</div>
                <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div class="progress-bar bg-blue-500 h-2 rounded-full" style="width: 0%"></div>
                </div>
                <div class="progress-text text-sm text-gray-600">준비 중...</div>
            </div>
        `;
        document.body.appendChild(progressDiv);
        return progressDiv;
    }

    // 진행 상황 업데이트
    updateProgress(progressDiv, current, total, currentItem = '') {
        const percentage = (current / total * 100).toFixed(1);
        const progressBar = progressDiv.querySelector('.progress-bar');
        const progressText = progressDiv.querySelector('.progress-text');
        
        if (progressBar && progressText) {
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `${current}/${total}${currentItem ? ` - ${currentItem}` : ''}`;
        }
    }

    // 진행 상황 표시기 제거
    removeProgressIndicator(progressDiv) {
        if (progressDiv && progressDiv.parentNode) {
            progressDiv.parentNode.removeChild(progressDiv);
        }
    }

    // 확인 대화상자 (커스텀 스타일)
    showConfirmDialog(message, title = '확인') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            
            const dialog = document.createElement('div');
            dialog.className = 'bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl';
            dialog.innerHTML = `
                <h3 class="text-lg font-semibold mb-4">${title}</h3>
                <p class="text-gray-600 mb-6">${message}</p>
                <div class="flex justify-end space-x-3">
                    <button class="cancel-btn px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">취소</button>
                    <button class="confirm-btn px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">확인</button>
                </div>
            `;
            
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            
            // 이벤트 리스너
            dialog.querySelector('.cancel-btn').addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(false);
            });
            
            dialog.querySelector('.confirm-btn').addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(true);
            });
            
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    document.body.removeChild(overlay);
                    resolve(false);
                }
            });
        });
    }

    // 로딩 스피너 표시
    showLoadingSpinner(target, text = '로딩 중...') {
        const originalContent = target.innerHTML;
        target.disabled = true;
        target.innerHTML = `<i data-feather="loader" class="w-5 h-5 mr-2 animate-spin"></i> ${text}`;
        
        // Feather Icons 다시 렌더링
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        
        return () => {
            target.disabled = false;
            target.innerHTML = originalContent;
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        };
    }

    // HTML 이스케이프 처리
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 애니메이션 효과
    animateElement(element, animationClass, duration = 500) {
        element.classList.add(animationClass);
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, duration);
    }

    // 스크롤 부드럽게 이동
    smoothScrollTo(element, offset = 0) {
        const targetPosition = element.offsetTop - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    // 파일 다운로드
    downloadFile(data, filename, type = 'application/json') {
        const blob = new Blob([data], { type });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    // 클립보드에 복사
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('클립보드에 복사되었습니다!', 'success');
            return true;
        } catch (error) {
            console.error('클립보드 복사 실패:', error);
            this.showNotification('클립보드 복사에 실패했습니다.', 'error');
            return false;
        }
    }

    // 반응형 테이블 처리
    makeTableResponsive(table) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive overflow-x-auto';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    }

    // 다크 모드 토글 (향후 기능)
    toggleDarkMode() {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('darkMode', isDark);
        return isDark;
    }

    // 다크 모드 초기화
    initializeDarkMode() {
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode === 'true') {
            document.documentElement.classList.add('dark');
        }
    }

    // 의미를 HTML 리스트로 변환하는 헬퍼 (main.js와 동일한 포맷을 재사용)
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

    // 단어 데이터를 받아 테이블 row 또는 DocumentFragment를 반환합니다.
    // handlers: { retranslate: fn(index), edit: fn(index), delete: fn(index) }
    renderWordRow(word, index, handlers = {}) {
        const allPinyins = [];
        const allMeanings = [];

        if (word.pinyin && word.pinyin !== '[병음 없음]') {
            allPinyins.push(word.pinyin);
            let mainMeanings = word.meanings || '[의미 없음]';
            if (typeof mainMeanings === 'string' && mainMeanings.includes(',')) {
                mainMeanings = mainMeanings.split(',').map(m => m.trim());
            }
            allMeanings.push(mainMeanings);
        }

        if (word.other_pros && Array.isArray(word.other_pros)) {
            if (word.other_pros.length > 0 && Array.isArray(word.other_pros[0])) {
                word.other_pros.forEach((prosArray, arrayIndex) => {
                    if (Array.isArray(prosArray)) {
                        prosArray.forEach((pros, prosIndex) => {
                            if (pros) {
                                allPinyins.push(pros);
                                let meanings = '[의미 없음]';
                                if (word.other_means &&
                                    word.other_means[arrayIndex] &&
                                    word.other_means[arrayIndex][prosIndex]) {
                                    meanings = word.other_means[arrayIndex][prosIndex];
                                    if (Array.isArray(meanings)) {
                                        // 그대로
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
                word.other_pros.forEach((pros, i) => {
                    if (pros) {
                        allPinyins.push(pros);
                        let meanings = '[의미 없음]';
                        if (word.other_means && word.other_means[i]) {
                            meanings = word.other_means[i];
                            if (Array.isArray(meanings)) {
                                // 그대로
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

        const bindHandlers = (rowEl) => {
            try {
                const retranslateBtn = rowEl.querySelector('.retranslate-btn');
                const editBtn = rowEl.querySelector('.edit-btn');
                const deleteBtn = rowEl.querySelector('.delete-btn');
                if (retranslateBtn && typeof handlers.retranslate === 'function') retranslateBtn.addEventListener('click', () => handlers.retranslate(index));
                if (editBtn && typeof handlers.edit === 'function') editBtn.addEventListener('click', () => handlers.edit(index));
                if (deleteBtn && typeof handlers.delete === 'function') deleteBtn.addEventListener('click', () => handlers.delete(index));
            } catch (e) {
                console.error('bindHandlers error', e);
            }
        };

        if (pinyinCount <= 1) {
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
            bindHandlers(row);
            return row;
        } else {
            const fragment = document.createDocumentFragment();
            allPinyins.forEach((pinyin, pinyinIndex) => {
                const row = document.createElement('tr');
                row.className = 'animate-fade-in hover:bg-gray-50 transition-colors duration-200';
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
                    bindHandlers(row);
                } else {
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
}

// 전역 UI 유틸리티 인스턴스 생성
window.uiUtils = new UIUtils();
