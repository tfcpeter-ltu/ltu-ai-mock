import json,pathlib,re
ROOT=pathlib.Path(__file__).resolve().parents[1]
line=next(l for l in (ROOT/'legacy.html').read_text().splitlines() if l.startswith('window.MOCKS = '))
mocks=json.loads(line[len('window.MOCKS = '):].rstrip(';'))
maps=json.loads((ROOT/'assets/listening-audio-map.js').read_text().split(' = ',1)[1].rstrip(';\n'))
keys=json.loads((ROOT/'assets/ai-reference-keys.js').read_text().split(' = ',1)[1].rstrip(';\n'))
def norm(s):return re.sub(r'\s+',' ',s).strip().casefold()
def add(mock,n,answers,at,reason,confidence='high'):
 m=next(x for x in mocks if x['id']==mock);q=m['questionData']['listening'][n-1]
 track=next(t for t in maps[mock] if t['from']<=n<=t['to'])
 transcript=json.loads((ROOT/'research/transcripts'/(pathlib.Path(track['src']).stem+'.json')).read_text())
 segments=[s for s in transcript['segments'] if s['start']<=at<s['end']]
 assert segments,(n,at)
 evidence=' '.join(s['text'] for s in segments)
 for target in mocks:
  for tq in target['questionData']['listening']:
   if norm(tq['prompt'])!=norm(q['prompt']) or norm(tq['instruction'])!=norm(q['instruction']):continue
   tt=next(t for t in maps[target['id']] if t['from']<=tq['number']<=t['to'])
   if tt['src']!=track['src']:continue
   dest=keys[target['id']].setdefault('listening',dict(status='ai-derived',version='2026-09-16-r1',source='original-recording-machine-transcript',records={}))
   dest['records'][str(tq['number'])]=dict(q=tq['number'],acceptedAnswers=answers.split('|'),evidence=evidence,explanation=reason,confidence=confidence,source='original-recording-machine-transcript',official=False,questionPrompt=tq['prompt'],originalPrompt=tq['prompt'],instruction=tq['instruction'],type=tq['type'],audioSrc=track['src'],audioStart=segments[0]['start'],audioEnd=segments[-1]['end'],transcriptModel='faster-whisper-small.en',derivedFrom=mock)
rows=[
(1,'Strategic Management',18.5,'書名空格位於副標題前，錄音給出 Strategic Management。'),
(2,'6397012WHI|639.7012 WHI|639 7012 WHI',73,'轉錄辨識為6397012WHI，但字母數字應再聽原音核對。','medium'),
(3,'WHI',90,'錄音說 WHI 是 call number；拼字須以原音複核。','medium'),
(4,'White',95,'對話確認 White 是姓，Gregory 是名。'),
(5,'5|five',117,'可借的書共有五本。'),
(6,'55 pence|55p|£0.55|0.55 pounds',133,'七天借期逾期每日55便士。'),
(7,'£10|10 pounds|ten pounds',144,'前兩種借期的罰款上限是10英鎊。'),
(8,'£5|5 pounds|five pounds',170,'線上付款最低五英鎊。'),
(9,'fourth floor|4th floor|fourth|4|level 4',184,'掃描器與 IT 服務櫃檯在四樓。'),
(10,'until midnight|midnight',206,'筆電可使用到午夜。'),
(11,'B',32,'她經常感覺不舒服，因此決心改善。'),
(12,'A',55,'醫師說她是臨床肥胖並增加心臟負荷。'),
(13,'C',110,'她承認常吃巧克力和甜食，對健康不好。'),
(14,'plate',9,'改用較小的餐盤減少份量。'),
(15,'after dinner|every evening|after dinner every evening',15,'晚餐後、每天晚上散步；超過題目字數限制的寫法會待核對。'),
(16,'half an hour|30 minutes|thirty minutes',25,'每次散步半小時。'),
(17,'gym|a gym|the gym',42,'丈夫送她健身房會員。'),
(18,'relieved|healthy|much better|amazing|so relieved',77,'她描述 amazing、better about myself、relieved 等感受，非唯一答案，保留人工核對。','medium'),
(19,'her youngest son|youngest son|her son',108,'小兒子鼓勵她參加馬拉松。'),
(20,'over £3,000|over £3000|over 3000 pounds|over three thousand pounds',138,'已募得超過三千英鎊；原題只許三字但未寫數字例外，格式需核對。','medium'),
(21,'D',44,'他整體而言覺得留學經驗很好。'),
(22,'D',97,'課前講義對理解課堂有幫助。'),
(23,'D',135,'她建議入學介紹週協助理解英國課堂文化。'),
(24,'B',166,'他偏好與學習習慣相近的人組讀書會。'),
(25,'individual',12,'第一種看法認為貧窮是個人責任。'),
(26,'work hard|take the opportunities',19,'錄音同時提到把握機會與努力工作，兩者皆符合此空格。'),
(27,'circumstances',36,'另一觀點認為超出個人控制的環境造成貧窮。'),
(28,'slums',42,'例子是孟買貧民窟。'),
(29,'mixture',60,'結論為多種因素的混合。'),
(30,'range',76,'還要考慮一系列其他因素。'),
(31,'greenhouse gas',69,'畜牧業的排放類型是溫室氣體。'),
(32,'80%|80 percent|eighty percent|80 per cent',103,'錄音在這裡指出80%；後續另有不同口徑數字，須按此句作答。'),
(33,'cattle',165,'牛隻需要大量穀物與水。'),
(34,'richer',191,'收入越高，蛋白質需求越強。'),
(35,'poor',200,'貧困者可能需要增加肉類攝取以避免營養不足。'),
(36,'2007',214,'研究年份為2007。'),
(37,'testicles',289,'錄音舉出 brains or testicles。'),
(38,'half|half of|50% of',298,'美澳丟棄多達一半牛隻重量。'),
(39,'80 to 85 grams|80–85 grams|80-85 grams',305,'錄音將80–85克與每三天一份漢堡及雞肉相連，題幹時間口徑有歧義，先不扣分。','medium'),
(40,'pests',329,'腐敗因素包括害蟲、包裝與冷藏不當。')]
for r in rows:add('mock-01',*r)
rows=[
(1,'01330725293|01330 725293|01330 725 293',43,'電話號碼在錄音中重複確認；數字仍待原音複核。','medium'),
(2,'Williams',58,'來電者姓 Williams。'),
(3,'6B|6 B',92,'門牌為公寓6B。'),
(4,'May',100,'生日月份是五月。'),
(5,'Smythe',120,'來電者逐字拼出 S-M-Y-T-H-E，並糾正 I。'),
(6,'£400|400 pounds|400',39,'帳單總額是400英鎊。'),
(7,'£107.27|107.27 pounds|107.27',63,'金額辨識為107.27；錄音日期為24日而題幹為23日，待核對。','medium'),
(8,'10pm|10 pm|10 p.m.|22:00',87,'通話在晚上十點。'),
(9,'200|200 minutes|two hundred',151,'免費分鐘從150增至200。'),
(10,'01611123975|0161 112 3975',213,'最終確認的市話為0161 112 3975；數字應再核對。','medium'),
(11,'B',33,'同一工程師也設計 Temple Meads 車站。'),
(12,'C',106,'科學中心適合各年齡。'),
(13,'B',141,'飛行一小時；整體活動三至四小時。'),
(14,'A',159,'熱氣球節是免費活動。'),
(15,'A',212,'動物園有超過400種動物。'),
(16,'T|TRUE',26,'相對乾燥溫和的氣候有利戶外攀岩。'),
(17,'F|FALSE',31,'錄音說很多人在室內開始，不直接提供 most 的比例，保留核對。','medium'),
(18,'T|TRUE',38,'室內攀岩牆尤其適合冬季訓練。'),
(19,'T|TRUE',54,'俱樂部是有效又能交朋友的方式。'),
(20,'F|FALSE',60,'教練與嚮導是有效的學習方式，並非證明攀岩是好運動。')]
for r in rows:add('mock-02',*r)

rows=[
(21,'two|2',7,'Sarah 說錯過最後兩次課。'),
(22,'librarian|the librarian',34,'James 說圖書館員幫了大忙。'),
(23,'2010',55.9,'老師說需要2011版，James 回答要去換正確文章，因此手上是2010版；這是對話推論。'),
(24,'C',24,'作文占50%，做好可補足考試表現，B 的15%錯誤。'),
(25,'B',53.5,'尚未分析題目；題幹寫 Jane 而對話是 Sarah，人物名稱不一致，待核對。','medium'),
(26,'A',60,'James 說自己也有困難。'),
(27,'B',67,'老師建議兩人都上學術寫作課。'),
(28,'A',93,'一學期、每週兩小時；A 最接近，但錄音未明說每週幾次，待核對。','medium'),
(29,'B',144,'老師追問題目 evaluate / assess，指出 James 未掌握題意。'),
(30,'A',245,'離開後去語言學術中心報名課程。')]
for r in rows:add('mock-03',*r)

(ROOT/'assets/ai-reference-keys.js').write_text('window.LTU_AI_KEYS = '+json.dumps(keys,ensure_ascii=False,separators=(',',':'))+';\n')
coverage={m['id']:{s:len(keys[m['id']].get(s,{}).get('records',{})) for s in ['reading','listening']} for m in mocks}
(ROOT/'research/ai-reference-coverage.json').write_text(json.dumps(coverage,indent=2));print(coverage)
