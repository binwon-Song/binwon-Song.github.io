from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import time
from requests.exceptions import RequestException, ConnectionError

app = Flask(__name__)
CORS(app)  # CORS 허용

class ChineseTranslator:
    @classmethod
    def get_wordid_and_supid(cls, word):
        try:
            search_url = f"https://dic.daum.net/search.do?q={word}&dic=ch"
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            r = requests.get(search_url, headers=headers, timeout=10)
            soup = BeautifulSoup(r.text, "html.parser")
            
            # 첫 번째 검색 결과의 상세 링크 뽑기
            meta_desc = soup.find("meta", attrs={"name": "tiara:custom-properties-0"})
            if meta_desc and meta_desc.has_attr("content"):
                meta_contents = meta_desc["content"]
                # { "exact_id": "ckw000061774_cku000062663" }
                meta_contents = meta_contents.strip()
                if '"exact_id":' in meta_contents:
                    exact_id = meta_contents.split('"exact_id":')[1].split('"')[1]
                    if '_' in exact_id:
                        wordid, supid = exact_id.split("_")
                        detail_url = f"https://dic.daum.net/word/view.do?wordid={wordid}&q={word}&supid={supid}"
                        return detail_url, wordid, supid
            
            return None, None, None
        except Exception as e:
            print(f"Error in get_wordid_and_supid: {e}")
            return None, None, None

    @classmethod
    def get_word_meaning(cls, word):
        try:
            detail_url, wordid, supid = cls.get_wordid_and_supid(word)
            if not detail_url:
                return {
                    "word": word,
                    "pinyin": "",
                    "meanings": [],
                    "error": "단어를 찾을 수 없습니다."
                }

            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            r = requests.get(detail_url, headers=headers, timeout=10)
            soup = BeautifulSoup(r.text, "html.parser")

            # 병음
            pinyin_elem = soup.select_one(".txt_pronounce")
            pinyin = ""
            if pinyin_elem:
                pinyin_text = pinyin_elem.text.strip()
                # 대괄호 제거
                if pinyin_text.startswith('[') and pinyin_text.endswith(']'):
                    pinyin = pinyin_text[1:-1]
                else:
                    pinyin = pinyin_text

            # 한국어 뜻
            meaning_elems = soup.select(".txt_mean")
            meanings = []
            for elem in meaning_elems:
                meaning = elem.text.strip()
                if meaning and meaning not in meanings:
                    meanings.append(meaning)

            # 만약 meanings가 비어있다면 다른 선택자 시도
            if not meanings:
                meaning_elems = soup.select(".list_mean li")
                for elem in meaning_elems:
                    meaning = elem.text.strip()
                    if meaning and meaning not in meanings:
                        meanings.append(meaning)

            return {
                "word": word,
                "pinyin": pinyin,
                "meanings": meanings,
                "url": detail_url,
                "success": True
            }
        
        except Exception as e:
            print(f"Error in get_word_meaning: {e}")
            return {
                "word": word,
                "pinyin": "",
                "meanings": [],
                "error": f"번역 중 오류가 발생했습니다: {str(e)}"
            }

@app.route('/api/translate', methods=['POST'])
def translate_word():
    try:
        data = request.get_json()
        if not data or 'word' not in data:
            return jsonify({'error': '단어가 제공되지 않았습니다.'}), 400
        
        word = data['word'].strip()
        if not word:
            return jsonify({'error': '빈 단어는 번역할 수 없습니다.'}), 400
        
        # 번역 수행
        result = ChineseTranslator.get_word_meaning(word)
        
        if 'error' in result:
            return jsonify(result), 404
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': f'서버 오류: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': '중국어 번역 API가 정상 작동 중입니다.'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
