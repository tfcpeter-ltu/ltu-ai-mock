"""Apply inspected question repairs, unordered answer groups and source-gap notices."""
import json, pathlib, re
ROOT=pathlib.Path(__file__).resolve().parents[1]
path=ROOT/'assets/ai-reference-keys.js'
keys=json.loads(path.read_text().split(' = ',1)[1].rstrip(';\n'))
line=next(l for l in (ROOT/'legacy.html').read_text().splitlines() if l.startswith('window.MOCKS = '))
mocks={m['id']:m for m in json.loads(line[len('window.MOCKS = '):].rstrip(';'))}
def repair(mid,skill,n,prompt,type=None):
 r=keys[mid][skill]['records'][str(n)];r['questionPrompt']=prompt
 if type:r['type']=type
# Re-extract the actual numbered question, excluding passage introduction numbers.
for mid,n in [('mock-20',3),('mock-23',3),('mock-26',2),('mock-26',3),('mock-27',2),('mock-27',3),('mock-28',2),('mock-28',3)]:
 context=mocks[mid]['contexts']['reading']
 match=re.search(r'(?m)^'+str(n)+r'\.\s+.*?(?=\n\s*\n|\n'+str(n+1)+r'\.)',context,re.S)
 assert match,(mid,n)
 repair(mid,'reading',n,match.group().strip())
for n in [2,3]:repair('mock-19','reading',n,'LS3 can operate on (2) ______ to convey (3) ______.','Completion')
repair('mock-19','reading',14,keys['mock-19']['reading']['records']['12']['questionPrompt'],'Multiple choice')
repair('mock-27','listening',14,'14. ______ of those who had lived in the castle can be seen in the gallery.')
def group(mid,skill,qs,choices=None):
 records=keys[mid][skill]['records'];rr=[records[str(q)] for q in qs]
 if choices is None:choices=[r['acceptedAnswers'] for r in rr]
 assert len(choices)==len(qs)
 evidence=' '.join(dict.fromkeys(r['evidence'] for r in rr))
 for r in rr:
  r['answerGroup']={'id':f'{skill}-{qs[0]}-{qs[-1]}','questions':qs,'choices':choices}
  r['acceptedAnswers']=list(dict.fromkeys(a for family in choices for a in family))
  r['evidence']=evidence
  r['explanation']+=' 此題組答案順序不限，每個不同答案只計分一次。'
  if 'audioSrc' in r:
   r['audioStart']=min(x['audioStart'] for x in rr)
   r['audioEnd']=max(x['audioEnd'] for x in rr)
for mid,skill,qs,answers in [
 ('mock-19','reading',[12,13,14],'BDE'),('mock-20','reading',[26,27],'CD'),
 ('mock-21','reading',[23,24],'BD'),('mock-21','reading',[25,26,27],'BDG'),('mock-28','reading',[8,9],'BE'),
 ('mock-22','listening',[24,25],'CD'),('mock-25','listening',[21,22],'CD'),('mock-25','listening',[23,24],'BC'),('mock-25','listening',[25,26],'BD'),
 ('mock-26','listening',[21,22,23],'BDE'),('mock-28','listening',[17,18],'CE'),('mock-28','listening',[19,20],'AE'),
 ('mock-28','listening',[21,22],'BC'),('mock-28','listening',[23,24],'DE'),('mock-28','listening',[31,32],'AF'),('mock-28','listening',[33,34],'CD')]:
 group(mid,skill,qs,[[a] for a in answers])
 for n in qs:keys[mid][skill]['records'][str(n)]['type']='Multiple choice'
for mid in ['mock-17','mock-21']:
 group(mid,'listening',[25,26,27]);group(mid,'listening',[28,29,30])
 for n in range(25,31):
  question='What THREE traits are important according to Linda?' if n<28 else 'What THREE characteristics does Linda need to improve, according to Professor Xavier?'
  repair(mid,'listening',n,f'{question} ({n}) ______','Completion')
  keys[mid]['listening']['records'][str(n)]['instruction']='Write NO MORE THAN TWO WORDS for each answer. Answers may be in any order.'
for mid in ['mock-24','mock-29']:group(mid,'listening',[11,12],[['foam rubber'],['gel']])
gaps=[('mock-18',range(16,21),'題目需要地圖上的 A–H 位置標記，但目前來源缺少該地圖。錄音方向不足以確定字母答案。'),('mock-27',range(27,41),'目前原始錄音長度為 18:36，在第 26 題後中斷；本題缺少完整原音依據。'),('mock-28',range(25,31),'題目需要燈具剖面圖上的 A–H 位置標記，但目前來源缺少該圖。不能僅憑描述猜字母。')]
for mid,qs,reason in gaps:keys[mid]['listening']['unavailable']={str(n):reason for n in qs}
for mock in keys.values():
 for data in mock.values():data['version']='2026-09-16-r3'
path.write_text('window.LTU_AI_KEYS = '+json.dumps(keys,ensure_ascii=False,separators=(',',':'))+';\n')
coverage={mid:{s:sum(bool(r['acceptedAnswers']) for r in data[s]['records'].values()) for s in ['reading','listening']} for mid,data in keys.items()}
(ROOT/'research/ai-reference-coverage.json').write_text(json.dumps(coverage,indent=2)+'\n')
print('References:',sum(sum(c.values()) for c in coverage.values()),'/ 2320')
