// 중국어 번역 서비스
// Daum 중국어 사전 API를 활용한 번역 기능

class ChineseTranslationService {
    constructor() {
        this.proxyUrl = 'https://api.allorigins.win/raw?url=';
        this.baseUrl = 'https://dic.daum.net';
        // 성능/신뢰성 개선용 설정
        this.cache = new Map(); // 간단한 메모리 캐시
        this.cacheTTL = 1000 * 60 * 60; // 1시간 캐시
    }

    // 단순 fetch 래퍼: 타임아웃을 제거하여 모든 요청이 브라우저의 기본 동작을 따르도록 함
    async fetchWithTimeout(url, options = {}) {
        try {
            const res = await fetch(url, options);
            return res;
        } catch (err) {
            console.error('fetch error for', url, err);
            throw err;
        }
    }

    // 메인 번역 함수
    async translateWord(word) {
        try {
            // {word: '得', main_pro: '[‧de]', main_meanings: Array(5), other_pros: Array(1), other_means: Array(1)}
            const results = await this.getWordFromDaum(word); 
            if (!results) {
                throw new Error('검색 결과를 찾을 수 없습니다');
            }
            console.log('검색 결과:', results);

            return results;
        } catch (error) {
            console.error('번역 오류:', error);
            throw error;
        }
    }

    // CORS 프록시를 통해 검색 페이지에서 wordid와 supid 추출
    async getWordFromDaum(word) {
        try {
            const searchUrl = `${this.baseUrl}/search.do?q=${encodeURIComponent(word)}&dic=ch`;
            
            // check time taken
            console.log("URL SENDING...")
            const cacheKey = `word:${word}`;
            const now = Date.now();
            const cached = this.cache.get(cacheKey);
            if (cached && (now - cached.ts) < this.cacheTTL) {
                console.log('cache hit for', cacheKey);
                return cached.value;
            }

            const startTime = Date.now();
            const response = await this.fetchWithTimeout(this.proxyUrl + encodeURIComponent(searchUrl));
            console.log("RESPONSE RECEIVED...", Date.now() - startTime);
            const html = await response.text();
            // HTML에서 meta 태그 찾기
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            console.log("HTML PARSED...", Date.now() - startTime);
            
            const box = ".search_box"
            const main_word_box = ".cleanword_type"
            const other_word_box = ".search_type"

            const searchBoxElem = doc.querySelector(box);
            if (!searchBoxElem) {
                return this.getWordUnique(word);
            }

            const mainWordElem = searchBoxElem.querySelector(main_word_box);
            const otherWordElems = searchBoxElem.querySelectorAll(other_word_box);

            const main_pro = this.getWord(mainWordElem, '.txt_pronounce');
            const main_meanings = this.getWord(mainWordElem, '.txt_search', true);
            
            const other_pros = []
            const other_means = []

            let tmp_pro = [] // 배열로 초기화
            let tmp_means = [] // 변수 선언 분리
            
            otherWordElems.forEach((elem, index) => {
                try {
                    const pro = this.getWord(elem, '.txt_pronounce');
                    const means = this.getWord(elem, '.txt_search', true);
                    tmp_pro.push(pro);
                    tmp_means.push(means);
                } catch (error) {
                    console.error(`요소 ${index} 처리 중 오류:`, error);
                }
            });
            other_pros.push(tmp_pro);
            other_means.push(tmp_means);
            console.log("TIME TAKEN END", Date.now() - startTime);
            // reformat for output
            const out = {
                word: word,
                main_pro: main_pro,
                main_meanings: main_meanings,
                other_pros: other_pros,
                other_means: other_means
            };
            try {
                this.cache.set(cacheKey, { ts: Date.now(), value: out });
            } catch (e) {
                // ignore cache set errors
            }
            return out;
        } catch (error) {
            console.error('검색 페이지 파싱 오류:', error);
            return null;
        }
    }


    getWord(element, attr, findAll=false) {
        if (!element) return findAll ? [] : '';
        
        if (findAll) {
            const results = [];
            const elements = element.querySelectorAll(attr);
            elements.forEach(e => {
                results.push(e.innerText);
            });
            return results;
        }
        
        const targetElement = element.querySelector(attr);
        return targetElement ? targetElement.innerText : '';
    }

    async getDetailFromSearch(word)
    {
        try {
            const searchUrl = `${this.baseUrl}/search.do?q=${encodeURIComponent(word)}&dic=ch`;
            
            const response = await this.fetchWithTimeout(this.proxyUrl + encodeURIComponent(searchUrl));
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // <meta http-equiv="Refresh" content="0; URL=/word/view.do?wordid=ckw000086223&q=%E4%BD%A0%E5%A5%BD&supid=cku000087523" />
            const metaTag = doc.querySelector('meta[http-equiv="Refresh"]');
            if (metaTag) {
                const content = metaTag.getAttribute('content');
                const urlMatch = content.match(/URL=([^\"]+)/);
                if (urlMatch) {
                    return urlMatch[1]; // /word/view.do?wordid=ckw000086223&q=%E4%BD%A0%E5%A5%BD&supid=cku000087523
                }
            }

            // HTML 파싱 테스트
            if (!html.includes(word)) {
                console.log('❌ 중국어 검색 실패');
                return null;
            } else {
                console.log('✅ 중국어 검색 성공');
            }
            const firstLink = doc.querySelector('a[href*="wordid="]');
            console.log('첫 번째 링크:', firstLink);
            if (firstLink) {
                const targetHref = firstLink.href;
                const urlMatch = targetHref.match(/\/wordid=[^&]+&supid=[^&]+/);
                console.log('추출된 링크:', urlMatch ? urlMatch[0] : '없음');
                if (urlMatch) {
                    return urlMatch[0]; // /wordid=ckw000044136&supid=cku000044775
                }
            }
            return null;
        } catch (error) {
            console.error('검색 페이지 파싱 오류:', error);
            return null;
        }
    }


    // @return return {
    //      word:word,
    //      main_pro: main_pro,
    //      main_meanings: main_meanings,
    //      other_pros: other_pros,
    //      other_means: other_means
    // }
    async getWordUnique(word) {
        try {
            const link = await this.getDetailFromSearch(word);
            if (!link) {
                throw new Error('상세 페이지 링크를 찾을 수 없습니다');
            }
            // https://dic.daum.net/word/view.do?wordid=ckw000072487&supid=cku000073546
            const detailUrl = `${this.baseUrl}${link}`;
            const response = await this.fetchWithTimeout(this.proxyUrl + encodeURIComponent(detailUrl));
            const html = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const pinyin= doc.querySelector('.txt_pronounce');
            // console.log('추출된 병음:', pinyin.innerHTML);
            // 한국어 의미 추출
            const meaningElems = doc.querySelector('.list_mean').querySelectorAll('.txt_mean');
            const meanings = [];
            meaningElems.forEach(elem => {
                const meaning = elem.textContent.trim();
                meanings.push(meaning);
            });

            return {
                word: word,
                main_pro: pinyin.innerHTML,
                main_meanings: meanings,
                other_pros: [],
                other_means: []
            }
        } catch (error) {
            console.error('상세 페이지 파싱 오류:', error);
            throw error;
        }

    }

    // 다중 단어를 병렬로 번역(간단한 동시성 제어)
    // words: string[]
    // progressCb: (currentIndex, total, currentWord) => void
    // concurrency: number
    async translateMultipleWords(words, progressCb = null, concurrency = 3) {
        const results = new Array(words.length);
        let cursor = 0;

        const worker = async () => {
            while (true) {
                const idx = cursor++;
                if (idx >= words.length) break;
                const w = words[idx];
                try {
                    const res = await this.translateWord(w);
                    results[idx] = { success: true, ...res };
                } catch (err) {
                    results[idx] = { success: false, error: err && err.message ? err.message : String(err) };
                }
                if (typeof progressCb === 'function') {
                    try { progressCb(idx + 1, words.length, w); } catch (e) { /* ignore */ }
                }
            }
        };

        const workers = [];
        const limit = Math.max(1, Math.min(concurrency, words.length));
        for (let i = 0; i < limit; i++) workers.push(worker());
        await Promise.all(workers);
        return results;
    }

}

// 전역 번역 서비스 인스턴스 생성
window.translationService = new ChineseTranslationService();
