// 중국어 번역 서비스
// Daum 중국어 사전 API를 활용한 번역 기능

class ChineseTranslationService {
    constructor() {
        this.proxyUrl = 'https://api.allorigins.win/raw?url=';
        this.baseUrl = 'https://dic.daum.net';
    }

    // 메인 번역 함수
    async translateWord(word) {
        try {
            // 먼저 검색 페이지에서 wordid와 supid를 가져옵니다
            const searchResult = await this.getWordIdFromSearch(word);
            if (!searchResult) {
                throw new Error('검색 결과를 찾을 수 없습니다');
            }
            console.log('검색 결과:', searchResult);
            // 상세 페이지에서 병음과 의미를 가져옵니다
            const detailResult = await this.getWordDetails(searchResult.wordid, searchResult.supid, word);
            return detailResult;
        } catch (error) {
            console.error('번역 오류:', error);
            throw error;
        }
    }

    // CORS 프록시를 통해 검색 페이지에서 wordid와 supid 추출
    async getWordIdFromSearch(word) {
        try {
            const searchUrl = `${this.baseUrl}/search.do?q=${encodeURIComponent(word)}&dic=ch`;
            
            const response = await fetch(this.proxyUrl + encodeURIComponent(searchUrl));
            const html = await response.text();
            // HTML에서 meta 태그 찾기
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const metaTag = doc.querySelector('meta[name="tiara:custom-properties-0"]');
            console.log("Parser", metaTag);
            if (metaTag && metaTag.content) {
                const content = metaTag.content;
                const regex = /"exact_id":\s*"([^"]+)"/;
                const match = content.match(regex);
                console.log("Regex match:", match);
                if (match && match[1]) {
                    const exactId = match[1];
                    if (exactId.includes('_')) {
                        const [wordid, supid] = exactId.split('_');
                        return { wordid, supid };
                    }
                }
            }
            
            // 대안 방법: 첫 번째 결과 링크에서 추출
            const firstLink = doc.querySelector('a[href*="wordid="]');
            if (firstLink) {
                const href = firstLink.href;
                const wordidMatch = href.match(/wordid=([^&]+)/);
                const supidMatch = href.match(/supid=([^&]+)/);
                
                if (wordidMatch && supidMatch) {
                    console.log('첫 번째 링크에서 추출:', href);
                    console.log('추출된 wordid:', wordidMatch[1]);
                    console.log('추출된 supid:', supidMatch[1]);
                    return {
                        wordid: wordidMatch[1],
                        supid: supidMatch[1]
                    };
                }
            }
            
            return null;
        } catch (error) {
            console.error('검색 페이지 파싱 오류:', error);
            return null;
        }
    }

    // 상세 페이지에서 병음과 의미 추출
    async getWordDetails(wordid, supid, word) {
        try {
            const detailUrl = `${this.baseUrl}/word/view.do?wordid=${wordid}&q=${encodeURIComponent(word)}&supid=${supid}`;
            
            const response = await fetch(this.proxyUrl + encodeURIComponent(detailUrl));
            const html = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            console.log('상세 페이지 HTML 파싱 완료', doc);
            // 병음 추출
            const pinyinElem = doc.querySelector('.txt_pronounce');
            let pinyin = '';
            if (pinyinElem) {
                const pinyinText = pinyinElem.textContent.trim();
                // 대괄호 제거
                pinyin = pinyinText.replace(/^\[|\]$/g, '');
            }
            
            // 한국어 의미 추출
            const meaningElems = doc.querySelectorAll('.txt_mean');
            const meanings = [];
            meaningElems.forEach(elem => {
                const meaning = elem.textContent.trim();
                if (meaning && !meanings.includes(meaning)) {
                    meanings.push(meaning);
                }
            });
            
            // 의미를 찾지 못했을 경우 다른 선택자 시도
            // if (meanings.length === 0) {
            //     const altMeaningElems = doc.querySelectorAll('.list_mean li');
            //     altMeaningElems.forEach(elem => {
            //         const meaning = elem.textContent.trim();
            //         if (meaning && !meanings.includes(meaning)) {
            //             meanings.push(meaning);
            //         }
            //     });
            // }
            
            return {
                word: word,
                pinyin: pinyin,
                meanings: meanings,
                success: true
            };
        } catch (error) {
            console.error('상세 페이지 파싱 오류:', error);
            throw error;
        }
    }

    // 병음만 가져오기
    async getPinyin(chineseWord) {
        try {
            const result = await this.translateWord(chineseWord);
            return result.pinyin || `[병음을 찾을 수 없습니다]`;
        } catch (error) {
            console.error('병음 가져오기 실패:', error);
            return `[병음 오류: ${chineseWord}]`;
        }
    }

    // 한국어 의미만 가져오기
    async getKoreanMeaning(chineseWord) {
        try {
            const result = await this.translateWord(chineseWord);
            return result.meanings && result.meanings.length > 0 
                ? result.meanings.join(', ') 
                : `[번역을 찾을 수 없습니다]`;
        } catch (error) {
            console.error('번역 가져오기 실패:', error);
            return `[번역 오류: ${chineseWord}]`;
        }
    }

    // 여러 단어 일괄 번역 (지연 시간 포함)
    async translateMultipleWords(words, onProgress = null, delay = 200) {
        const results = [];
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            
            try {
                // 진행 상황 콜백 호출
                if (onProgress) {
                    onProgress(i + 1, words.length, word);
                }
                
                // 각 요청 사이에 지연 시간 추가 (서버 부하 방지)
                if (i > 0) {
                    await this.sleep(delay);
                }
                
                const result = await this.translateWord(word);
                results.push({
                    success: true,
                    ...result
                });
            } catch (error) {
                console.error(`${word} 번역 실패:`, error);
                results.push({
                    success: false,
                    word: word,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    // 지연 함수
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 번역 결과 검증
    validateTranslationResult(result) {
        return result && 
               result.success && 
               result.word && 
               (result.pinyin || result.meanings);
    }

    // 캐시 기능 (선택사항)
    cacheTranslation(word, result) {
        try {
            const cache = JSON.parse(localStorage.getItem('translationCache')) || {};
            cache[word] = {
                ...result,
                timestamp: Date.now()
            };
            localStorage.setItem('translationCache', JSON.stringify(cache));
        } catch (error) {
            console.warn('캐시 저장 실패:', error);
        }
    }

    getCachedTranslation(word) {
        try {
            const cache = JSON.parse(localStorage.getItem('translationCache')) || {};
            const cached = cache[word];
            
            // 캐시된 데이터가 있고 1시간 이내라면 사용
            if (cached && (Date.now() - cached.timestamp) < 3600000) {
                return cached;
            }
            
            return null;
        } catch (error) {
            console.warn('캐시 읽기 실패:', error);
            return null;
        }
    }

    clearCache() {
        try {
            localStorage.removeItem('translationCache');
        } catch (error) {
            console.warn('캐시 삭제 실패:', error);
        }
    }
}

// 전역 번역 서비스 인스턴스 생성
window.translationService = new ChineseTranslationService();
