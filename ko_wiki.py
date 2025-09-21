import requests
from bs4 import BeautifulSoup
import time
from requests.exceptions import RequestException, ConnectionError
from utils import ch_ko

datas=[]
with open("test_data.txt","r") as f:
    data = f.readlines()
    for line in data:
        line = line.strip()
        datas.append(line)
        
# https://ko.wiktionary.org/wiki/儀式#중국어
print(f"총 {len(datas)}개 단어 처리 예정")
result=[]
# for idx, (i,j) in enumerate(datas):
for idx, i in enumerate(datas):
    try:
        print(f"처리 중... {idx+1}/{len(datas)}: {i}")
        
        # 요청 사이에 지연 시간 추가 (서버 부하 방지)
        if idx > 0:
            time.sleep(0.2)
        result.append(ch_ko.get_word_meaning(i))
                
    except (RequestException, ConnectionError, Exception) as e:
        print(f"  오류 발생 ({i}): {str(e)}")
        with open("error.txt","a") as f:
            f.write(f"{i} - Error: {str(e)}\n")
        continue
with open("result.txt","w") as f:
    for i in result:
        f.write(f"{i['word']}, {i['pinyin']}, {i['meanings']}\n")