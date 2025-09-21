import requests
from bs4 import BeautifulSoup


class ch_ko():
    @classmethod
    def get_wordid_and_supid(cls,word):
        search_url = f"https://dic.daum.net/search.do?q={word}&dic=ch"
        r = requests.get(search_url)
        soup = BeautifulSoup(r.text, "html.parser")
        # 첫 번째 검색 결과의 상세 링크 뽑기
        meta_desc = soup.find("meta", attrs={"name": "tiara:custom-properties-0"})
        if meta_desc and meta_desc.has_attr("content"):
            meta_contents = meta_desc["content"]
            # { "exact_id": "ckw000061774_cku000062663" }
            meta_contents=meta_contents.strip()
            wordid, supid = meta_contents.split(":")[1].split('"')[1].split("_")
            print("Parsed wordid:", wordid)
            print("Parsed supid:", supid)


        detail_url = f"https://dic.daum.net/word/view.do?wordid={wordid}&q={word}&supid={supid}"
        # href 예시: https://dic.daum.net/word/view.do?wordid=ckw000061774&q=救助&supid=cku000062663
        # print(detail_url, href.split("wordid=")[1].split("&")[0], href.split("supid=")[1])
        return detail_url, wordid,supid

    @classmethod
    def get_word_meaning(cls,word):
        detail_url, wordid, supid = cls.get_wordid_and_supid(word)
        if not detail_url:
            return None

        r = requests.get(detail_url)
        soup = BeautifulSoup(r.text, "html.parser")

        # 병음
        pinyin = soup.select_one(".txt_pronounce")
        pinyin = pinyin.text.strip() if pinyin else ""

        # 한국어 뜻
        meanings = [m.text.strip() for m in soup.select(".txt_mean")]

        return {
            "word": word,
            "pinyin": pinyin[1:-1],
            "meanings": meanings,
            "url": detail_url,
            "wordid": wordid,
            "supid": supid
        }