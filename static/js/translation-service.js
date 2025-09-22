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
            
            const response = await fetch(this.proxyUrl + encodeURIComponent(searchUrl));
            const html = await response.text();
            // HTML에서 meta 태그 찾기
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
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
            
            // reformat for output
            return {
                word:word,
                main_pro: main_pro,
                main_meanings: main_meanings,
                other_pros: other_pros,
                other_means: other_means
            }
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
            
            const response = await fetch(this.proxyUrl + encodeURIComponent(searchUrl));
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // <meta http-equiv="Refresh" content="0; URL=/word/view.do?wordid=ckw000086223&q=%E4%BD%A0%E5%A5%BD&supid=cku000087523" />
            const metaTag = doc.querySelector('meta[http-equiv="Refresh"]');
            if (metaTag) {
                const content = metaTag.getAttribute('content');
                const urlMatch = content.match(/URL=([^"]+)/);
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
            const response = await fetch(this.proxyUrl + encodeURIComponent(detailUrl));
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

}

// 전역 번역 서비스 인스턴스 생성
window.translationService = new ChineseTranslationService();
