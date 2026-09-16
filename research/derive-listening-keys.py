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

rows=[
(1,'Martin',46,'警員自我介紹為 Martin Peel。'),
(2,'Manolo Gonzalez',58,'姓名後有逐字拼讀，仍應原音複核拼字。','medium'),
(3,'Hilton|the Hilton|a host',81.2,'錄音同時說 host family 和 Hilton 家庭，題幹未限定，保留多種合理寫法。','medium'),
(4,'23|twenty-three',87.5,'門牌23號。'),
(5,'E12 5TR|E125TR',95,'轉錄為 E12 5TR；字母數字待原音複核。','medium'),
(6,'DF Super',110,'轉錄辨識機型為 DF Super，但相近字母可能誤辨，暫不扣分。','medium'),
(7,'black',113.3,'相機是黑色。'),
(8,'380 euros|€380|380',120,'價值380歐元。'),
(9,'short dark hair',139,'嫌犯短深色頭髮，三個字。'),
(10,'EF017638|EFO17638',168,'案件編號的O與0可能混淆，待原音複核。','medium'),
(16,'B',7,'導覽介紹約10分30秒。'),
(17,'A',30,'第四部分是 Foundations of a Public Life。'),
(18,'A',114,'走出門廳後前往雕像。'),
(19,'A',145,'博物館是兩層石造建築。'),
(20,'A',179,'向警衛出示門票。'),
(21,'F|FALSE',15,'討論的是全球文化的西化，而不只是西方文化自身改變。'),
(22,'F|FALSE',29,'Lucy 說網路不是真正的正面力量。'),
(23,'T|TRUE',83,'Simon 強調科學資訊及共同人權價值的分享。'),
(24,'T|TRUE',112,'Lucy 認為它偏袒西方，犧牲其他文化。'),
(25,'the internet|internet',11,'不公平在網路出現以前就存在。'),
(26,'non-western|non western',17,'承受壓力的是非西方文化。'),
(27,'the main|main',23,'英語不是因為最好而成為網路主要語言。'),
(28,'unfair',52,'帶來不公平優勢。'),
(29,'passive objects',82,'非西方使用者不是被動接受的物件。'),
(30,'websites',100,'錄音提到自製母語網站，但題幹擷取在空格後重複 websites，需先核對原排版。','medium'),
(31,'unrestricted',31,'享有無限制的定居權。'),
(32,'quota',47,'quota schemes，配額方案。'),
(33,'2006',62,'人口普查年份為2006。'),
(34,'1976',94,'約2%人口的普查年份是1976。'),
(35,'3,300|3300',126,'每年平均淨增加3300人。'),
(36,'opponents',141,'反對者要求收緊移民。'),
(37,'mortality|death',188,'死亡率低而出生率高。'),
(38,'3.2',215,'每千人3.2人死亡。'),
(39,'immigrant',245,'移民社群反對收緊政策。'),
(40,'racially',272,'批評報告帶有種族動機。')]
for r in rows:add('mock-04',*r)

rows=[
(1,'shopping',23,'行程地點提供多樣購物選擇。'),
(2,'£5|5|five pounds',45,'價格從5至15英鎊。'),
(3,'8:30 am|8.30 am|8:30|8.30',67,'上午8:30出發。'),
(4,'three days|3 days',84,'提前三天登記。'),
(5,'Museum',40,'額外參觀 Hepworth Museum。'),
(6,'16th February|16 February|February 16|February 16th',50,'倫敦行程為2月16日。'),
(7,'Bristol',67,'3月3日前往 Bristol。'),
(8,'50|fifty',93,'大巴有50個座位。'),
(9,'American',112,'Bath 的額外參觀為 American Museum。'),
(10,'Yentob',130,'逐字拼讀 Y-E-N-T-O-B。')]
for r in rows:add('mock-05',*r)
rows=[
(11,'T|TRUE',11,'農民已近三年未見雨，受到旱災影響。'),
(12,'T|TRUE',31,'煤礦工因薪資訴求罷工；題目概括成錢不夠，需保留語意差異。','medium'),
(13,'F|FALSE',41.5,'更新外觀的是員工，不是飛機。'),
(14,'Prime Minister|prime minister',1,'總理承諾補助。'),
(15,'five|5',14,'補助分五年支付。'),
(16,'50 years|fifty years',34,'超過50年最嚴重的旱災。'),
(17,'musical concert|concert',61,'學生要參加音樂會。'),
(18,'50|fifty',73,'飛機有50名乘客。'),
(19,'good weather|weekend',91,'週末好天氣讓海灣有很多遊船協助救援。'),
(20,'musical instruments|instruments',110,'樂器全部遺失。'),
(21,'B',36,'他已工作近12年，現在要返回求學。'),
(22,'A',54,'他是商學院大學生。'),
(23,'C',62,'活動為2月1日及2日。'),
(24,'C',87,'涵蓋各方面讀書方法。'),
(25,'B',114,'閱讀訓練強調建立信心。'),
(26,'B',8,'他擔心時間不足，無法做完事情。'),
(27,'B',41,'午餐需自理。'),
(28,'B',79,'從週一起連續三個早上；題幹 each Monday 不精確，待核對。','medium'),
(29,'A',105,'課程是進階思考策略，而非初階。'),
(30,'A|B',119,'本人說從基礎開始，顧問說符合情況；A與B皆有依據，題目不唯一。','medium'),
(31,'flavour|flavor|food flavour|food flavor',10,'MSG 用來增強風味。'),
(32,'tradition',31,'日本常用的主要原因是傳統。'),
(33,'speed|the speed',75,'1956年加快了製程速度。'),
(34,'78.2%|78.2 percent|78.2 per cent',8,'麩胺酸占78.2%。'),
(35,'9.6%|9.6 percent|9.6 per cent',14,'水占9.6%。'),
(36,'meat',23,'含蛋白質的例子是肉和乳酪。'),
(37,'1908',68,'Ikeda 在1908年識別第五種味覺。'),
(38,'sweetness',109,'甜味提示碳水化合物。'),
(39,'toxins',115,'苦味提示毒素。'),
(40,'saltiness',122,'鹹味提示礦物質。')]
for r in rows:add('mock-06',*r)
rows=[
(31,'15|fifteen',81,'判決涉及15位病人。'),
(32,'lawyer',105,'病人女兒是律師。'),
(33,'different style',121,'字詞選擇和簽名異於平常，推導 different style；非逐字單一片語，待核對。','medium'),
(34,'driving licence|driving license|her driving licence|her driving license',143,'和駕照的真實簽名比對。'),
(35,'author',175,'Dan Brown 是作者。'),
(36,'2006',208,'法官在2006年裁定。'),
(37,'search',266,'若 google 成為 search 的同義詞，商標保護會受影響。'),
(38,'brand',285,'品牌的財務價值可能下降。'),
(39,'tape recording|recording',340,'警方收到自稱兇手的錄音帶。'),
(40,'DNA',418,'信封上的 DNA 與嫌犯樣本比對。')]
for r in rows:add('mock-07',*r)

for n,ans,at,reason in [(11,'C',54,'圖上 C 指向中間的播放暫停鍵。'),(12,'B',125,'圖上 B 指向0左邊的減小音量鍵。'),(13,'A',41,'圖上 A 指向上排最左的倒帶鍵。'),(14,'D',67,'圖上 D 指向上排最右的快轉鍵。'),(15,'E',131,'圖上 E 指向0右邊的增加音量鍵。')]:add('mock-04',n,ans,at,reason)
for mid,n,ans,at,reason,confidence in [
 ('mock-07',1,'Martin',46,'警員名字為 Martin。','high'),
 ('mock-07',2,'Manolo Gonzalez',58,'姓名有逐字拼讀，保留原音複核。','medium'),
 ('mock-07',4,'23|twenty-three',87.5,'地址門牌為23號。','high'),
 ('mock-13',1,'Strategic Management',18.5,'書名主標題為 Strategic Management。','high'),
 ('mock-13',2,'6397012WHI|639.7012 WHI|639 7012 WHI',73,'館藏編號有辨識不確定性，需聽原音核對。','medium'),
 ('mock-13',4,'White',95,'作者姓 White。','high'),
 ('mock-13',29,'A',105,'是進階思考而不是基礎策略。','high')]:add(mid,n,ans,at,reason,confidence)
add('mock-13',30,'A|B',119,'本人提到從基礎開始，顧問說符合情況；兩選項都有依據，待核對。','medium')
fixes={'mock-07':{1:'Constable: (1) ______ Peel',2:'Victim: (2) ______',4:'Full address: (4) ______ Brookfield Close, London.'},'mock-13':{1:'What is the title of the book? (1) ______, Creating Competitive Advantages',2:'What is the catalogue number? (2) ______',4:'What is the author’s surname? (4) ______'}}
for mid,changes in fixes.items():
 for q,prompt in changes.items():keys[mid]['listening']['records'][str(q)]['questionPrompt']=prompt
for mid,sets in keys.items():
 for q,r in sets.get('listening',{}).get('records',{}).items():
  if r['audioSrc']=='assets/audio/70e27279413a82b2.mp3':
   r['figure']='assets/question-figures/audio-tour-player.png'
   r['figureProvenance']='Original supplied PDF: 21.04.2021/Listening/Question Papers/Section 2.pdf, page 1.'
  if r['audioSrc']=='assets/audio/10852bad20f3a23e.mp3' and q=='25':r['questionPrompt']='Unfairness was present before (25) ______.'

(ROOT/'assets/ai-reference-keys.js').write_text('window.LTU_AI_KEYS = '+json.dumps(keys,ensure_ascii=False,separators=(',',':'))+';\n')
coverage={m['id']:{s:len(keys[m['id']].get(s,{}).get('records',{})) for s in ['reading','listening']} for m in mocks}
(ROOT/'research/ai-reference-coverage.json').write_text(json.dumps(coverage,indent=2));print(coverage)
