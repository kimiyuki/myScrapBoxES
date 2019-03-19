import requests, json, time
from elasticsearch import Elasticsearch
import itertools as it
from pathlib import Path 
PROJECT = "kimiyuki"

PAGES = lambda skip: f'https://scrapbox.io/api/pages/{PROJECT}/?skip={skip}'
TEXT  = lambda title: f'https://scrapbox.io/api/pages/{PROJECT}/{title}/text'
CODE =  lambda title, codename: f'https://scrapbox.io/api/code/{PROJECT}/{title}/{codename}'


def get_data():
  skip = 0
  res = requests.get(PAGES(skip)).json()
  docs = res['pages']
  count = res['count'] 
  for skip in it.takewhile(lambda x: x<count, it.count(100, 100)):
    time.sleep(1)
    url = PAGES(skip)
    print(url)
    res = requests.get(PAGES(skip)).json()
    docs += res['pages']
  return docs



F = "pages.json" 
def get_pages(cache=True):
  if cache and Path(F).exists():
    out = json.load(open(F))
  else:
    out = get_data() 
    #count, skip, limit = res['count'], res['skip'], res['limit']
    json.dump(out, open(F, 'w'), ensure_ascii=False)
  return out

out = get_pages(cache=True)
[x['title'] for x in out]
#for page in res['pages'][:5]:
#  title =  page['title'] 
#  res_page = requests.get(TEXT(title))
#  print((page['id'], title, res_page.text))
#


es = Elasticsearch("http://localhost:9200")
i = 'scrapbox'
if es.indices.exists(i):
  es.indices.delete(i)
if es.indices.exists(i) == False:
  j_ind = json.load(open("index_scrapbox.json"))
  #path_analysis = "analysis_kuromoji.json"
  path_analysis = "analysis_sudachi.json"
  j_ats = json.load(open(path_analysis))
  j_ind['settings']['analysis'] = j_ats
  ret = es.indices.create(index=i, body=j_ind)
  print(ret)

#TODO replace with bulk update or insert
for j, doc in enumerate(out[:]):
  print(j)
  time.sleep(0.2)
  doc['updated'] *= 1000
  doc['created'] *= 1000
  doc['descriptions'] = "\n".join(doc['descriptions'])
  es.index(index=i, doc_type="_doc", id=j+1, body=doc)
