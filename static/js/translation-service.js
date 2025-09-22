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
                console.log('검색 박스를 찾을 수 없습니다');
                return null;
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


    // // 상세 페이지에서 병음과 의미 추출
    // /**
    //  * @returns {중국어, 병음, 한국어 뜻}
    //  */
    // async getWordDetails(link, word) {
    //     try {
    //         const detailUrl = `${this.baseUrl}${link}`;
    //         const response = await fetch(this.proxyUrl + encodeURIComponent(detailUrl));
    //         // const response = await fetch(detailUrl);
    //         const html = await response.text();
            
    //         const parser = new DOMParser();
    //         const doc = parser.parseFromString(html, 'text/html');

    //         // 병음 추출
    //         const pinyinElem = doc.querySelector('.txt_pronounce');
    //         const pinyins = pinyinElem ? [pinyinElem.textContent.trim().match(/\[([^\]]+)\]/)[1]] : [];
    //         console.log('추출된 병음:', pinyins);
    //         // 한국어 의미 추출
    //         const meaningElems = doc.querySelector('.list_mean').querySelectorAll('.txt_mean');
    //         console.log('의미 요소:', meaningElems);
    //         const meanings = [];
    //         meaningElems.forEach(elem => {
    //             const meaning = elem.textContent.trim();
    //             meanings.push(meaning);
    //         });
            
            
    //         return {
    //             word: word,
    //             pinyins: pinyins,
    //             meanings: meanings,
    //             success: true
    //         };
    //     } catch (error) {
    //         console.error('상세 페이지 파싱 오류:', error);
    //         throw error;
    //     }
    // }

    // 여러 단어 일괄 번역 (지연 시간 포함)
    // async translateMultipleWords(words, onProgress = null, delay = 200) {
    //     const results = [];
        
    //     for (let i = 0; i < words.length; i++) {
    //         const word = words[i];
            
    //         try {
    //             // 진행 상황 콜백 호출
    //             if (onProgress) {
    //                 onProgress(i + 1, words.length, word);
    //             }
                
    //             // 각 요청 사이에 지연 시간 추가 (서버 부하 방지)
    //             if (i > 0) {
    //                 await this.sleep(delay);
    //             }
                
    //             const result = await this.translateWord(word);
    //             results.push({
    //                 success: true,
    //                 ...result
    //             });
    //         } catch (error) {
    //             console.error(`${word} 번역 실패:`, error);
    //             results.push({
    //                 success: false,
    //                 word: word,
    //                 error: error.message
    //             });
    //         }
    //     }
        
    //     return results;
    // }

    // // 지연 함수
    // sleep(ms) {
    //     return new Promise(resolve => setTimeout(resolve, ms));
    // }

}

// 전역 번역 서비스 인스턴스 생성
window.translationService = new ChineseTranslationService();
