"""Rebuild evidence-backed reference keys. No student answers enter this process."""
import json,re,pathlib,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
line=next(l for l in (ROOT/'legacy.html').read_text().splitlines() if l.startswith('window.MOCKS = '))
mocks=json.loads(line[len('window.MOCKS = '):].rstrip(';'))
def passage(text,evidence):
 parts=re.split(r'READING PASSAGE [123]',text)
 return next((norm(p) for p in parts[1:] if norm(evidence) in norm(p)),norm(text))
def norm(s):return re.sub(r'\s+',' ',s).strip().casefold()
records=[]
def add(mock,number,answers,evidence,reason,confidence='high',prompt=None):
 m=next(m for m in mocks if m['id']==mock);q=m['questionData']['reading'][number-1]
 assert norm(evidence) in norm(m['contexts']['reading']),(mock,number,evidence)
 records.append(dict(mockId=mock,skill='reading',q=number,acceptedAnswers=answers.split('|') if answers else [],evidence=evidence,explanation=reason,confidence=confidence,source='supplied-reading-passage',official=False,questionPrompt=prompt or q['prompt'],originalPrompt=q['prompt'],instruction=q['instruction'],type=q['type']))
rows=[
(1,'viii','toddlers who watch TV for two hours a day develop more quickly','B 段重點是適齡電視節目對幼兒的益處。'),
(2,'iii',"evening types are more likely to have higher intelligence scores",'C 段比較晚睡型與早起型的認知測驗表現。'),
(3,'i','pushy parents may be doing their children more harm than good','D 段指出過度催促會傷害孩子的自信與學習。'),
(4,'vi','Twenty per cent of them had worries so serious','E 段說明學童面對嚴重焦慮。'),
(5,'vii','switching off the conscious part of the brain','F 段討論釋放非意識能力的可能性。'),
(6,'unsupported by research','often unsupported by research','三個字，直接對應文章對教育迷思的批評。'),
(7,'declines with age','the positive impact of TV declines with age','原文動詞是 declines，但題幹主詞 benefits 是複數；需人工核對，不自動扣分。','medium'),
(8,'mental speed|memory','much better mental speed and memory','題目 intellectual 後的空格無法在三字內完整容納 mental speed and memory；保留歧義。','medium'),
(9,'spend time','A parent who does not spend time with their child','家長未花時間相處可能錯過孩子的問題。'),
(10,'conscious part','switching off the conscious part of the brain','所關閉的是有意識的部分。'),
(11,'NO','To give your children a head start in life, sit them in front of the television.','文章主張適齡節目有益，與禁止幼兒接觸電視相反。'),
(12,'YES','toddlers who watch TV for two hours a day develop more quickly than those who do without','原文只明確提到每天兩小時，題幹擴展到兩小時以下，範圍不完全一致。','medium'),
(13,'NOT GIVEN','Nobody is really sure exactly why this is','文章提到焦慮，未證明這些兒童都因學校而不快樂；題目改寫含歧義。','medium'),
(14,'YES','17 volunteers','原文接著說五人表現改善，5/17 約為29%，符合約30%。'),
(15,'i','widening health inequality in Glasgow is due to the recent emergence of socially determined causes','B 段說明社會因素如何影響壽命。'),
(16,'vi','These industries declined in the 1970s as companies shifted production abroad.','C 段說明產業外移、失業與住宅改變。'),
(17,'vii','the lower down a social hierarchy an individual is, the higher the levels of stress hormones','D 段談社會地位與童年經驗對壓力的影響。'),
(18,'ii','Stress is also associated with abnormal patterns of brain development','E 段說明大腦發展與行為、學習之間的關係。'),
(19,'viii','relationship between turbulent early years and adult outcomes','F 段討論童年負面事件的長期後果。'),
(20,'x','What we have seen in Glasgow may become evident in southern Europe','G 段提示其他國家也可能面臨相似問題。'),
(21,'v','The importance of investment in early childhood cannot be overstated.','H 段提出幼兒投資與政策介入。'),
(22,'NOT GIVEN','life expectancy in several Western European countries','文章未說西歐多數死亡由酗酒造成。'),
(23,'YES','peripheral housing estates which lacked the same social cohesion','新住宅社區缺少凝聚力，帶來疏離。'),
(24,'YES','Perhaps it’s time we asked: how do we create wellness?','作者提議重視健康福祉，但沒有明確作出 more important 的強度比較。','medium'),
(25,'NO','early childhood experiences can also produce lifelong abnormalities in the stress response','文章明確說明童年與社會地位會影響壓力。'),
(26,'YES','the more of them an individual experiences, the more damaged their adult life was likely to be','負面事件越多，成年後受影響的可能性越高。'),
(27,'NO','may become evident in southern Europe over the next two decades','原文是可能出現相似問題，題幹卻說必定更嚴重；確定性與程度皆改變，保留判讀差異。','medium'),
(28,'A','The AAUW report: How schools short change girls','AAUW 報告研究女性教育的不平等。'),
(29,'A','Schools for wealthier students focus on creative activities.','這段不同階級教學比較引用 AAUW。'),
(30,'P','the most valued credentials stay in the hands of the middle and upper classes (Peters, 2000)','Peters 說明高價值學歷集中於中上階層。'),
(31,'R','Roberts (2009) also reported that for both boys and girls, large differences remain in reading scores','Roberts 比較所得與族群的閱讀成績差異。'),
(32,'W','class advantage and social status are linked to academic qualifications (White, 1979)','White 定義學歷與階級優勢的連結。'),
(33,'Y','we gain status through our individual ability and effort (Young, 1994)','Young 定義能力與努力所構成的功績制度。'),
(34,'S','rules, routines and regulations of schools (Snyder, 1971)','Snyder 討論隱藏在學校規則和日常中的課程。'),
(35,'treatment','different treatment lowers females’ confidence','不同對待削弱女生的自信。'),
(36,'attended and graduated','more girls have attended and graduated from high school than boys','三個字，對應更多女生就讀及畢業。'),
(37,'outscoring','boys generally outscoring girls on math tests','題幹已有 are，填入 outscoring。'),
(38,'reading scores|scores','family income levels have a strong influence on reading scores','不同所得與族群的閱讀成績存在差異。'),
(39,'hidden curriculum','This inequality, they argue, arises as a result of the hidden curriculum.','原始摘要將此空格再標為38，需修正題號後核對。','medium'),
(40,'achievement','important variations in achievement exist by race/ethnicity and family income level','achievement 是合理推導，但結尾也談 beliefs、values 和 attitudes，未提供唯一對應詞。','medium')]
for r in rows:add('mock-01',*r)
rows=[
(1,'receptionist','being rented out as a receptionist','Wakamaru 被出租作接待員。'),
(2,'vacuum','sole purpose is to vacuum','Roomba 唯一用途是吸塵。'),
(3,'different approaches','represent radically different approaches','兩款機器人代表不同的研發方向。'),
(4,'human beings','machines that look and act like human beings','日本方向是外觀與行為像人。'),
(5,'pragmatic','their pragmatic but uninspiring designs','實用但缺乏吸引力，對應 pragmatic。'),
(6,'the elderly|elderly','home health care, particularly for the elderly','兩國共同目標包括高齡者居家照護。'),
(7,'technological revolution','the biggest technological revolution since PCs and the Internet','兩字直接對應重要的科技革命。'),
(8,'C','a waist-high bot','只有腰部高，低於一般成人身高。'),
(9,'C','navigate between table legs and household pets','感測器協助繞開物件；不是爬樓梯。'),
(10,'A','narrowly targeted to specific tasks','美國公司聚焦特定任務。'),
(11,'C','their vision of friendly robots capable of working alongside people','比較友善擬人機器人與實用設計。'),
(12,'undisputed leader|leader','the undisputed leader in industrial robots','過去50年日本是工業機器人領導者。'),
(13,'$210 million|210 million|210 million dollars','has spent $210 million on research','問題是支持高齡勞動力的研究，並非前段的1億美元。'),
(14,'G','Betty the crow lives in an Oxford laboratory.','G 段描述烏鴉彎折金屬線取食。'),
(15,'C','Dogs, however, have lived intimately with humans for 15,000 years','C 段提出狗不適合當測試對象，但原題 inherited 與長期習得能力並不完全相同，需核對。','medium'),
(16,'B','A human startled by a strange shape in a darkened corridor','B 段描述受驚後的生理反應。'),
(17,'F','the smaller pig could guess what the other was thinking and outsmart it','較弱的豬設法甩開較強的豬。'),
(18,'C','Researchers have wrestled with a series of experiments','C 段概述動物學習、推理和理解其他動物的實驗。'),
(19,'E','sheep could recognise up to 50 other sheep and up to ten human faces','E 段的綿羊展現長期臉部記憶。'),
(20,'D','Chimpanzees in large captive colonies forge alliances','D 段涵蓋數字、社交、食物處理及藥用植物等多種能力。'),
(21,'A','If football hooligans can feel those emotions, then so too do deer, foxes and dogs.','A 段直接比較人與動物的情緒。'),
(22,'wildebeest|a wildebeest','If a wildebeest did not feel pain, it would continue grazing as lions slowly devoured it.','獅子捕食的例子是角馬。'),
(23,'football hooligans','If football hooligans can feel those emotions','題目以文章中的足球流氓作為對應。'),
(24,'fight or flight','the well-known fight or flight reaction','三字片語表示戰或逃反應。'),
(25,'chimpanzees and monkeys|monkeys and chimpanzees','Monkeys astonished a team at Columbia University','D 段分別描述黑猩猩排序數字與猴子分辨數量。'),
(26,'hook|a hook','bends it into a hook','烏鴉將金屬線彎成鉤子。'),
(27,'TRUE','The ambivalence of the Soviet authorities towards the art','開頭直接描述蘇聯當局的矛盾態度。'),
(28,'FALSE','always held a personal spiritual significance for believers','聖像一直有精神意義，與 never 相反。'),
(29,'TRUE','its central role in the cultural development of 12th to 16th century Russia','藝術史家強調聖像對文化發展的角色。'),
(30,'TRUE','detach the icons from their normal setting in churches and cathedrals and display them in secular art galleries','移至世俗美術館是削弱宗教脈絡的方法。'),
(31,'TRUE','Elsewhere in the gallery hang the mordant social commentaries','館內還有社會評論及蘇聯時期的世俗作品。'),
(32,'NOT GIVEN','encouraging the spectator to concentrate on their artistic merits','鼓勵關注藝術價值，不等於所有觀者必定著迷。'),
(33,'FALSE','mocking the superstitious ignorance of the Russian peasants','文章明說部分作品嘲諷農民的迷信。'),
(34,'A','Further on are the paintings of the Soviet era','美術館陳列不同時期作品。'),
(35,'C','without reference to an external God','安排意在凸顯人的品質而非神。'),
(36,'C','from various parts of Russia','博物館藏品來自俄羅斯各地。'),
(37,'A','stripped of all religious purpose','導覽以建築和諧外觀取代宗教用途，A 最符合段落主旨。'),
(38,'human motherhood','a symbol of human motherhood','世俗詮釋將聖母視為人類母性象徵。'),
(39,'humanistic interpretation','They do not lend themselves to humanistic interpretation','聖三一天使不易用人文角度解讀。'),
(40,'hero','The artist is a hero.','結尾直接給出藝術家的英雄形象。')]
for r in rows:add('mock-29',*r)
# Repair two demonstrably mis-extracted prompts, retaining the original for audit.
for r in records:
 if r['mockId']=='mock-29' and r['q'] in (2,3):
  r['questionPrompt']={2:'Roomba, an American robot which was designed only to (2) ______, has sales running into the millions.',3:'These two machines symbolize two very (3) ______ in the world of robot technology.'}[r['q']]
rows=[
(1,'vi','We have to take clues from some of the evidence that our ancestors have left us.','B 段說明沒有錄音時如何用線索重建聲音史。'),
(2,'v','sound has helped us bond with one another, to evolve as social animals','C 段重點是聲音與社會連結。'),
(3,'i','people have tried to wield influence through sound','D 段說明運用聲音施加權力。'),
(4,'viii','the industrial revolution flattened the soundscape','E 段描述工業革命對聲音環境的改變。'),
(5,'vii','Instead of attempting to escape noise, we should try and manage it','F 段回顧減少噪音的方法。'),
(6,'First World War','the trenches of the First World War','三字，指第一次世界大戰。'),
(7,'Wells Cathedral','a series of portals in the west front of Wells Cathedral','隱藏唱詩班的位置是 Wells Cathedral。'),
(8,'in earshot of','People felt safe in earshot of the bells','三字，指鐘聲可聽見的範圍。'),
(9,'drums','the slave-masters denied them drums','被沒收的是鼓。'),
(10,'repel external noises','The Romans tried to repel external noises with wall hangings','三字，阻擋外界噪音。'),
(11,'YES','This material isn’t, of course, available to historians of sound','沒有歷史錄音，研究者必須使用其他線索。'),
(12,'NOT GIVEN','that bell told people that it was time to go to church','文章未提供去教堂的頻率。'),
(13,'NO','with malevolent as well as benign results','電台的影響有壞也有好，並非毫無益處。'),
(14,'NO','some people have overplayed the so-called monstrous effect','作者認為被誇大，而非低估。'),
(15,'B','giant computers that were the size of cities','舊預測認為電腦會更大。'),
(16,'B','complete all the housework for us','預測機器人會完成所有家務。'),
(17,'B','they do not actually suit bodies, other than those with faultless dimensions','只適合身形完美者，所以名稱不貼切。'),
(18,'B','touching, examining and trying out the purchases we make','人們喜歡觸摸及試用，包括試穿。'),
(19,'F','these, like disaster movies, are the stuff of fiction and certainly not fact','F 段批評末日預言。'),
(20,'D','flight which does not pollute our atmosphere','D 段談航空污染。'),
(21,'G','Our current fears about the future concern reproduction.','G 段談生育的未來焦慮。'),
(22,'C','predictions about clothing, style and body shape','C 段談服裝與體態。'),
(23,'B','unable to design a robotic servant to complete our simplest domestic tasks','B 段指出機器人仍無法代辦家務。'),
(24,'predecessors','their lumbering, prehistoric predecessors','現代設備的前身較大且慢。'),
(25,'leisure time','copious amounts of leisure time','預言承諾更多休閒時間。'),
(26,'young-looking and sprightly|young-looking','remaining young-looking and sprightly','原文描述維持年輕外表和活力。'),
(27,'the industrial revolution|industrial revolution','pollution generated by the industrial revolution','對比工業革命造成的污染。'),
(28,'E','says Fuller','King’s College London 的研究比較兩地標準。'),
(29,'C','the WHO recommended a limit of 50 ppb','WHO 提出50ppb。'),
(30,'A','health benefits worth twice as much','EPA 認為健康效益是成本兩倍。'),
(31,'B','analysis for New Scientist suggests that Europe’s limits are less stringent','New Scientist 分析認為歐洲限制比表面寬鬆。'),
(32,'D','according to the US National Association of Manufacturers','製造商協會提出成本及失業風險。'),
(33,'C','The World Health Organization reports that healthy adults and children','WHO 指出數小時暴露也可能引發症狀。'),
(34,'960,000 asthma attacks|960000 asthma attacks','as many as 960,000 fewer childhood asthma attacks','題幹已有 affecting children，填數字與 asthma attacks。'),
(35,'exceeding the limit','exceeding the limit on four or more days in a year','題幹缺有限動詞，且 more than four 與原文 four or more 不同，暫不自動扣分。','medium'),
(36,'three-year period','75 bad-air days limit in any three-year period','每三年計算一次容許天數。'),
(37,'a spike|spike','because of a spike during the hot summer of 2013','因炎夏污染峰值而超標。'),
(38,'never getting close','never getting close to the 75 bad-air days limit','三字，從未接近上限。'),
(39,'the EPA proposal|EPA proposal','This should not give succour to critics of the EPA proposal. The medical evidence shows it is urgently needed.','醫療證據支持推行 EPA 提案。'),
(40,'distressing','as distressing as Republican denialism','作者認為兩者態度同樣令人憂慮。')]
for r in rows:add('mock-02',*r)

rows=[
(15,'A','a new medium of expression','Land 希望提供新的藝術表達媒介。'),
(16,'B','in order to have his products tested to their limits','藝術家支援計畫為了測試相機能力。'),
(17,'D','the diminutive size of the Polaroid photo lends itself to montage','照片小，適合蒙太奇拼貼。'),
(18,'B','the creative possibilities the technology offers, is still strong','創作可能與每张作品的獨特性支持持續需求。'),
(19,'G','the answer lies in the uniqueness of the object itself','G 段解釋獨特實體作品的吸引力。'),
(20,'C','Bringing together some 40 artists','C 段介紹攝影展與多位藝術家的作品。'),
(21,'F','now produces instant film materials for traditional Polaroid cameras','F 段談 Impossible Project 持續生產底片。'),
(22,'B','Land had placed Ansel Adams','B 段描述 Land 聘請 Adams。'),
(23,'E','it cannot be seamlessly altered like a digital image','E 段指出寶麗來照片不易無痕改動。'),
(24,'on a monthly retainer','on a monthly retainer as a consultant','原文片語五個字，超過三字限制；題幹若填 monthly 又非原文完整片語，待核對。','medium'),
(25,'largest museum survey','the largest museum survey of artwork made with Polaroid cameras','三字對應展覽規模。'),
(26,'portrait','David Hockney’s dazzling portrait','120張照片組成一幅肖像。'),
(27,'appeal|continued popularity','Mr Kaps likens the Polaroid’s appeal to the slow-food movement, or the continued popularity of vinyl records.','appeal 直接描述 Polaroid 的吸引力；continued popularity 原文修飾唱片，保留歧義。','medium'),
(28,'DR','according to Darryl de Ruiter','de Ruiter 發現犬齒較小。'),
(29,'PS','Peter Schmid at the University of Zurich','Schmid 研究肋骨向內收的結構。'),
(30,'LB','provocative body of evidence that the specimens were indeed organic in origin','Berger 與同事報告有機來源證據。'),
(31,'LB','they stopped short of confirming the presence of skin','Berger 尚未確認皮膚。'),
(32,'JS','Jeremy De Silva at Boston University','de Silva 研究靈活的腳部與攀樹適應。'),
(33,'RR','Robert Reisz at the University of Toronto, Canada, has recently analysed','Reisz 分析恐龍化石軟組織。'),
(34,'JS','This is the question we are struggling with right now','de Silva 探討為何適應樹棲生活。'),
(35,'a critical species|critical','a critical species for understanding why australopiths underwent a dramatic evolutionary surge','此物種是理解演化躍進的關鍵。'),
(36,'techniques','a raft of techniques to analyse samples','研究者用了多種技術分析樣本。'),
(37,'stopped short','they stopped short of confirming the presence of skin','尚未正式確認。'),
(38,'ancient skin','the right ones to detect ancient skin','檢測古老皮膚。'),
(39,'DNA','Its age makes DNA preservation unlikely','年代過久，不易保存 DNA。'),
(40,'their hair|hair','how long their hair was','可能得知祖先毛髮長度。')]
for r in rows:add('mock-03',*r)

rows=[
(1,'iii','High hills, deep wooded dales, crinkly coasts','B 段描述景觀與冒險活動。'),
(2,'viii','Everyone loves a traditional British pub, but did you know you can stay in one, too?','C 段主題為酒館住宿。'),
(3,'ii','budget-friendly accommodation','D 段介绍平價青年旅館。'),
(4,'i','Travelling by train','E 段介紹鐵路旅行。'),
(5,'vi','inland waterways and hundreds of islands','F 段介紹水路和島嶼旅行。'),
(6,'greenery|stunning natural beauty|natural beauty','Get away from the city and discover the greenery of Britain!','綠意與自然景色提供離開城市的感受。'),
(7,'whales|dolphins and seals','go whale watching and even spot dolphins and seals','原文列出多種動物，題幹未限定，答案不唯一。','medium'),
(8,'horse and stagecoach','when everyone travelled by horse and stagecoach','三字，馬匹和驛馬車時代。'),
(9,'Dorm-style accommodation|dorm-style accommodation','Dorm-style accommodation which is a shared room','宿舍式多人房。'),
(10,'ferries','scores of ferries run between Britain’s offshore islands','渡輪往返島嶼；原文明述島嶼間，題幹加入 mainland，需保留差異。','medium'),
(11,'NOT GIVEN','a great way to meet the locals','文章說可認識當地人，未指商人或政治人物。'),
(12,'YES','shared facilities such as bathrooms','共用臥室及設施表示私隱較少。'),
(13,'NOT GIVEN','the system is efficient and reliable','未比較鐵路與所有其他交通方式的價格。'),
(14,'NO','An advance ticket is usually cheaper than one bought on the day','文中鼓勵提早購票以取得較低票價。'),
(15,'B','changed the type of TV on oﬀer','串流平台改變節目類型與敘事。'),
(16,'A','personalises viewers’ homepages to target content','內容推薦可配合觀眾偏好。'),
(17,'A','Its enthusiasm for long-form adventurousness','其他平台節目也受到長篇敘事風格影響。'),
(18,'C','we should question the impact of Netflix’s monopoly','作者對壟斷與侵占睡眠持警覺態度。'),
(19,'B','Netflix encourages obsessive, long-form viewing.','B 段談追劇習慣。'),
(20,'E','Disney pulled all its content from Netflix and launched Disney+','E 段說明競爭者撤片與推出服務。'),
(21,'D','readied by Netflix and primed for binging','D 段指出 Netflix 培養的習慣利於其他平台。'),
(22,'C','its first generation of original shows has come to an end','C 段描述第一代原創節目的結束。'),
(23,'A','analysts expecting its total spending','A 段是分析師對投資金額的預測。'),
(24,'long-form viewing','obsessive, long-form viewing','長時間觀看，對應 binge watching。'),
(25,'primetime television slots|primetime television spots','vying for primetime television slots','不需競爭傳統黃金時段。'),
(26,'readied|primed','readied by Netflix and primed for binging','被 Netflix 培養觀影習慣的觀眾。'),
(27,'to be seen','is yet to be seen','仍有待觀察。'),
(28,'F','a far better way to help the NHS than clapping','F 段比較實際運動與象徵性的鼓掌。'),
(29,'C','It shouldn’t be the likes of Team Ineos’s Chris Froome','C 段希望一般人帶動改變。'),
(30,'D','a 278-page report','D 段引用完整報告與研究支持運動益處。'),
(31,'A','his tenure as the mayor of London did lead','A 段談 Johnson 市長任內的道路改善。'),
(32,'C','they will need £6bn','C 段列出所需預算規模。'),
(33,'B','There were even hints of changes to the law','B 段提及法規改革。'),
(34,'B','four times more likely to be killed than in the Netherlands','B 段比較英國與荷蘭的騎車死亡風險。'),
(35,'hammering home','hammering home a simple fact','強調並反覆傳達此事實。'),
(36,'preventive medicine','a vital component in preventive medicine','預防醫學。'),
(37,'clinical trials','epidemiological and randomised clinical trials','臨床試驗提供生病天數減少的結果。'),
(38,'important underlying conditions','three of the most important underlying conditions','三字，重要的潛在疾病。'),
(39,'reluctant to talk','reluctant to talk about the dangers of inactivity','不願談論缺乏活動的危險。'),
(40,'about the same','about the same as from tobacco','死亡數量大致相同。')]
for r in rows:add('mock-04',*r)

rows=[
(1,'YES','changing your eating environment is easier than changing your mind','作者提出改變家中環境以改善飲食。'),
(2,'YES','we just have to optimise our surroundings','改變環境是另一途徑。'),
(3,'NO','plates that contrasted with their food','同色盤吃較多，對比色較少，與題幹相反。'),
(4,'NOT GIVEN','white starches – pasta, rice and potatoes – are a big source of calories','未說大多數過重者都吃太多義大利麵。'),
(5,'NO','using darker plates could be a smart strategy','文章建議深色盤；但其前提是淺色澱粉，题幹概括為所有食物，保留歧義。','medium'),
(6,'A','demographically representative of the rest of the US','人口結構具全美代表性。'),
(7,'C','We then spent eight months classifying these kitchens','研究者花八個月分類廚房、檢視飲食關聯。'),
(8,'D','having cereal on the counter had no impact on men','男性不受展示穀片影響，女性較容易受影響。'),
(9,'snacks and cereals','putting away the snacks and cereals','收起零食與穀片。'),
(10,'sit down','sitting down to a meal at the dinner table','文法上須 sit down，原文卻為 sitting down；與必須使用原文的指示不一致，待核對。','medium'),
(11,'off the stove','serve food off the stove or counter','從爐台盛裝，避免整盤菜直接放在桌上。'),
(12,'in easy reach','when the food is in easy reach','食物伸手可及時容易再盛。'),
(13,'still hungry|hungry','if they really were still hungry','問自己是否仍餓。'),
(14,'salad','plant that salad bowl right in the middle of the table','把沙拉擺在桌上鼓勵吃蔬菜。')]
for r in rows:add('mock-05',*r)
# Reviewed variants retain their own wording and evidence, not blind number-based copying.
for n in [1,2,3,4,5,14,16,18,23,26,27,34]:
 r=next(r for r in records if r['mockId']=='mock-04' and r['q']==n)
 add('mock-07',n,'|'.join(r['acceptedAnswers']),r['evidence'],r['explanation'],r['confidence'])
add('mock-07',6,'protected and maintained','protected and maintained by the National Trust','由 National Trust 保護與維護。')
add('mock-07',7,'dolphins and seals','spot dolphins and seals','題目已有 whales，剩下海豚與海豹。')
add('mock-07',8,'horse and stagecoach','travelled by horse and stagecoach','過去使用馬與驛馬車。')
add('mock-07',10,'ferries','scores of ferries run between Britain’s offshore islands','此處交通工具是渡輪。')

rows=[
(1,'v','if you reward a behaviour you like','B 段說明獎勵與移除獎勵的訓練方式。'),
(2,'vii','makes already aggressive dogs even more aggressive','C 段指出以攻擊對抗攻擊會惡化情況。'),
(3,'i','The misunderstanding of what dominance is','D 段釐清支配權的誤解。'),
(4,'viii','understand how he perceives the world around him','E 段主張理解狗的感知世界。'),
(5,'iv','many different terms used to describe positive training techniques','F 段列出同一理念的不同名稱。'),
(6,'lack of leadership','weakness and a lack of leadership','傳統訓練者認為這代表領導力不足。'),
(7,'exacerbate aggressive response','exacerbates aggressive response','題目 may 後須用原形，文章卻用 exacerbates，與原文取詞規定有衝突。','medium'),
(8,'chain of events','a chain of events resulting in','錯判支配權造成連鎖事件。'),
(9,'sensory education','a process called sensory education','運用感官協助學習稱為感官教育。'),
(10,'thousands of years','over many thousands of years','人類馴養狗已有數千年。'),
(11,'NO','universally endorsed by the behavioural scientific community','科學界支持而非拒絕正向訓練。'),
(12,'YES','human contact for a short period of time','短暫撤除互動可作為移除獎勵。'),
(13,'YES','what our instincts have already said: it is more humane to reward than to punish','多數人直覺已知獎勵較人道。'),
(14,'NO','emotions drive behaviour','情緒驅動行為，並非完全分離。'),
(15,'D','had emerged in Europe as early as the 14th century','巫術信仰在歐洲已有長期歷史。'),
(16,'B','other young girls in the community began to exhibit similar symptoms','最初案例是年幼女孩。'),
(17,'C','seeking to save herself from certain conviction by acting as an informer','Tituba 希望當告密者而減轻處罰。'),
(18,'B','declared a day of fasting','設立禁食一天以紀念悲劇。'),
(19,'E','the court handed down its first conviction','E 段詳述首次定罪與處刑。'),
(20,'F','Arthur Miller dramatized the events','F 段談 The Crucible 與現代政治。'),
(21,'C','violent contortions and uncontrollable outbursts of screaming','C 段列出所謂被施巫術的症狀。'),
(22,'D','several accused “witches” confessed and named still others','D 段描述指控向更多人擴散。'),
(23,'B','the harsh realities of life in the rural Puritan community','B 段列出戰爭、疾病和社區競爭等背景。'),
(24,'wave of hysteria','a wave of hysteria spread','群體恐慌蔓延。'),
(25,'exhibit similar symptoms','began to exhibit similar symptoms','其他女孩出現相似症狀。'),
(26,'against the Puritans','in service of the devil against the Puritans','指控是協助魔鬼對抗清教徒。'),
(27,'waning public support','Amid waning public support for the trials','公眾支持減少使審判逐漸停止。'),
(28,'C','great ideas don’t require the tedious work of sustained attention','C 段批評靈感取代長期工作的天才神話。'),
(29,'A','the signal that London’s outbreak that spring had advanced to the city','A 段描述瘟疫從倫敦來到劍橋，但未直接說人們之前認為只在首都，需核對。','medium'),
(30,'F','By thinking on it continually.','F 段引用牛頓持續思考的說法。'),
(31,'C','The apple-falling-on-the-head element is part of the problem','C 段檢視蘋果故事的過度詮釋。'),
(32,'G','because of who he was','G 段指出成就取決於他自身，而非身處何處。'),
(33,'B','Newton’s miracle year is being touted as a model','B 段描述媒體和社群將隔離成就浪漫化。'),
(34,'D','an unbelievable number of exceptional results','D 段列出隔離期間大量成果。'),
(35,'unleashed his mind','Newton unleashed his mind on these problems','三字對應投入思考。'),
(36,'most pressing questions','the most pressing questions in science','最迫切的科學問題。'),
(37,'abstract reasoning','exceptional talent for abstract reasoning','抽象推理才能。'),
(38,'prisms and light','His crucial investigations with prisms and light','稜鏡和光的實驗。'),
(39,'theory of gravity','he would develop his theory of gravity','重力理論持續發展多年。'),
(40,'enforced isolation|retreat','his enforced isolation','不能將成果僅歸功於隔離。')]
for r in rows:add('mock-08',*r)
# Same question wording in these two variants, but differing page furniture altered the source hash.
for n in [11,13]:
 r=next(r for r in records if r['mockId']=='mock-04' and r['q']==n)
 for mid in ['mock-07','mock-15']:add(mid,n,'|'.join(r['acceptedAnswers']),r['evidence'],r['explanation'],r['confidence'])

rows=[
(1,'v','intelligent packing is key','B 段提供打包建議。'),
(2,'ii','Other Spanish routes','C 段列出多種路線。'),
(3,'vi','The network is similar to a river system','D 段用溪流匯聚比喻路線。'),
(4,'viii','led to the construction of lots of hospitals, churches','E 段說明朝聖者促成沿途建設。'),
(5,'iii','thanks to its spiritual significance','F 段提醒路線的精神意義。'),
(6,'fairly flat','most of the stages are fairly flat','路線大部分平坦，困難在連日行走。'),
(7,'cheap air travel','cheap air travel has given many the opportunity','便宜航空讓起點更有彈性。'),
(8,'different sections','different sections in successive years','可分段在不同年份完成。'),
(9,'modifications and repairs|repairs','useful for modifications and repairs','裝備可能需要修補。'),
(10,'organized tour','peace of mind will benefit from an organized tour','參加安排好的旅行可減少規劃負擔。'),
(11,'NOT GIVEN','dates back to the beginning of the 9th century','文中提供歷史起源，未說是否存在爭議；有可能被解讀為 NO，待核對。','medium'),
(12,'NOT GIVEN','Many hostels don’t keep blankets','未提供多數朝聖者住哪裡的比例。'),
(13,'NO','Some hostels run out so be prepared!','原文指出有些會用完衛生紙，但不直接否定 usually，待核對。','medium'),
(14,'NOT GIVEN','the route gained international attention','未比較現在與歷史所有時期的人數。'),
(15,'A','everyday language','作品使用日常語言。'),
(16,'B','variations on classic stories of fantasy and horror','部分作品取材於經典故事。'),
(17,'C','He likes to frighten his readers after he has made them love his characters.','C 強調人物連結，但 A 嚇讀者同樣獲原文支持，選項不互斥，待核對。','medium'),
(18,'B','retirement is not always permanent','作者暗示退休未必永久。'),
(19,'C','fiction features everyday language','C 段列出作品構成要素。'),
(20,'F','made into movies for both Hollywood and for television','F 段涵蓋影視、網路與電子形式。'),
(21,'F','On Writing: A Memoir of the Craft','F 段提及寫作建議這部非小說作品。'),
(22,'B','allowed King to quit his other jobs','Carrie 成功改變職業生活。'),
(23,'G','The ideal format for horror tales used to be the short story','G 段討論以長篇挑戰短篇慣例；題目卻限制 A-F，暫不扣分。','medium'),
(24,'ordinary situations','evil occurs in ordinary situations','在平凡場景呈現邪惡。'),
(25,'contemporary version','a contemporary version of Bram','原文以直撇號拼寫 Stoker，現代版本是所求概念。'),
(26,'his own experiences','based on his own experiences','寫作建議取自本人經驗。'),
(27,'the ideal format|ideal format','The ideal format for horror tales used to be the short story','題幹說 novella，原文是 short story，題目不一致，待核對。','medium'),
(28,'F',"there's a handful of possible reasons",'F 段提出午餐吃河粉的原因。'),
(29,'C','shops often extend out onto the sidewalks','C 段描述店面延伸到人行道的狹小空間。'),
(30,'A','rice noodles, herbs, and thinly sliced meats','A 段列出河粉材料。'),
(31,'D','these are the coolest times of day','D 段將喝熱湯時間與氣候連結。'),
(32,'D','Vendors rise early to get their ingredients','D 段描述攤商一天的工作安排。'),
(33,'B','The history of pho is imprecise.','B 段比較河內與南定的起源說。'),
(34,'E','Newer enterprises stay open all day.','E 段說明全天營業，不限早餐。'),
(35,'motorbike-choked|frenetic motorbike-choked','the frenetic motorbike-choked streets','機車擁擠的街道。'),
(36,'early riser','Vietnam rewards an early riser.','早起者。'),
(37,'most famous dish','Easily the most famous dish of Vietnam','三字，最知名的菜餚。'),
(38,'originated','Some believe pho originated on the streets of Hanoi','關於起源地有所爭議。'),
(39,'rice fields','those who worked in the rice fields','原為稻田工作者的早餐。'),
(40,'Vietnamese','still distinctively Vietnamese','傳統吃法仍具有越南特色。')]
for r in rows:add('mock-11',*r)

for r in records:
 if r['mockId']=='mock-01' and r['q']==38:
  r['questionPrompt']='Roberts (2009) found that there are still variations between the (38) ______ of children from richer and poorer backgrounds, as well as from different ethnic groups.'

rows16=[
(1,'C','others have found alternate uses','C 段列出求偶、避開交配與誘捕獵物的用途。'),
(2,'D','larvae that played dead longer','D 段以實驗比較裝死與存活。'),
(3,'B','61 minutes','B 段列出61分鐘與23分鐘。'),
(4,'A','ethical concerns','A 段說明野外紀錄困難與實驗倫理限制。'),
(5,'A','Japanese quail','A 段列舉各地動物。'),
(6,'D','Moving guarantees death','D 段以逃生最後機會作結；B 段也有近似引言，保留段落選擇歧義。','medium'),
(7,'fluids','foul-smelling fluids','負鼠排出難聞的液體。'),
(8,'swallow','impossible for frogs to swallow them','伸展肢體使青蛙難以吞嚥。'),
(9,'food','attaches himself to it','it 指前面的食物包。'),
(10,'mate','so to mate','雄蜘蛛裝死是為了交配。'),
(11,'female','female moorland hawker dragonfly','題目要填性別。'),
(12,'mating|aggressive males','avoid\n mating','雌蜻蜓藉此避免交配或躲開具攻擊性的雄性。'),
(13,'comb grouper','comb grouper of\n Brazil','另一種魚是巴西的 comb grouper。'),
(14,'lure fish|attract fish|attract prey','to lure fish and other prey','題本表格合併兩種魚的目的，原文動詞與限字的搭配需核對。','medium'),
(15,'TRUE','reduce our risk of illness and prolong our lives','社交支持與健康和壽命有關。'),
(16,'TRUE','With the largest brains, humans have the largest','文中把較大腦部與較大社群連結。'),
(17,'FALSE','maximum size of intentional','文中是最大規模，並非最少人數。'),
(18,'FALSE','meaningful connections\nwe can manage has stayed the same','社群媒體並未增加可維持的有意義關係數。'),
(19,'concentric social circles|social circles','concentric social circles','模型以同心社交圈呈現。'),
(20,'static','The circles aren’t static','圈層關係並非固定。'),
(21,'sympathy group','sympathy group','15人的圈層稱為 sympathy group。'),
(22,'emotional and physiological','emotional and\nphysiological benefits','最內圈提供情緒與生理益處。'),
(23,'A','you can’t just pre-program them','Dunbar 說社交技能無法預先編程。'),
(24,'B','minimum collective investment of 3,000 hours','Hall 估算建立15人圈層需要至少3000小時。'),
(25,'B','A college freshman is not meeting nearly as many people','Hall 說新生遇到的人變少。'),
(26,'C','Harris found, was the quality of relationships','Harris 對中年人的研究重視關係品質。'),
(27,'B','requires complicated calculations','Hall 指出管理分層社交網絡需要複雜計算。'),
(28,'TRUE',"we're reading each other's minds",'日常生活會推測他人想法。'),
(29,'TRUE',"collecting clues to what's on the other person's mind",'對話時收集他人的心理線索。'),
(30,'FALSE',"we're all street-corner psychics",'作者把這項能力視為普遍的人類技能。'),
(31,'NOT GIVEN',"Mind reading enables us to negotiate",'全文列舉理解玩笑與受引誘，沒有比较難易度。'),
(32,'FALSE','perhaps the most urgent element','原文 perhaps 帶有保留，題目 undoubtedly 過於確定。','medium'),
(33,'H',"It's astonishing that we can peer",'astonishing 對應 amazing。'),
(34,'D','Close friends and married couples','married couples 對應 spouses。'),
(35,'C','grew more sophisticated','溝通變得更進階、複雜。'),
(36,'B','and even to lie','lie about feelings 符合原文與句法。'),
(37,'E','to develop mindsight','能力名稱是 mindsight。'),
(38,'A','we comprehend the\nmeaning of the words being spoken','作者提到語意、表情肢體及語調，沒有要求快速辨認語言種類。'),
(39,'C','all your other points of accuracy may be blown','錯過互動轉折可能抵銷其餘判斷。'),
(40,'C',"it's the content of speech that contributes most",'Ickes 認為言語內容最有幫助，對應 C。')]
for row in rows16:add('mock-16',*row)

keys={m['id']:{'reading':{'status':'ai-derived','version':'2026-09-16-r1','source':'supplied-reading-passage','records':{}}} for m in mocks}
for record in records:
 for m in mocks:
  for q in m['questionData']['reading']:
   if norm(q['prompt'])!=norm(record['originalPrompt']) or norm(q['instruction'])!=norm(record['instruction']):continue
   if norm(record['evidence']) not in norm(m['contexts']['reading']):continue
   # Evidence matching alone cannot validate NOT GIVEN. Require full source on reuse.
   src=next(x for x in mocks if x['id']==record['mockId'])
   if 'NOT GIVEN' in record['acceptedAnswers'] and passage(m['contexts']['reading'],record['evidence'])!=passage(src['contexts']['reading'],record['evidence']) and m['id']!=src['id']:continue
   r={**record,'q':q['number'],'derivedFrom':record['mockId'],'sourceHash':hashlib.sha256(m['contexts']['reading'].encode()).hexdigest()}
   keys[m['id']]['reading']['records'][str(q['number'])]=r
(ROOT/'assets/ai-reference-keys.js').write_text('window.LTU_AI_KEYS = '+json.dumps(keys,ensure_ascii=False,separators=(',',':'))+';\n')
(ROOT/'research/ai-reference-coverage.json').write_text(json.dumps({m['id']:{'reading':len(keys[m['id']]['reading']['records']),'listening':0,'totalPerSkill':40} for m in mocks},indent=2))
print({k:len(v['reading']['records']) for k,v in keys.items() if v['reading']['records']})
