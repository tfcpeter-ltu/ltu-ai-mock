"""Transcribe original recordings; requires faster-whisper. Machine output needs review."""
import json,pathlib,time
from faster_whisper import WhisperModel
root=pathlib.Path(__file__).resolve().parents[1];out=root/'research/transcripts';out.mkdir(exist_ok=True)
s=(root/'assets/listening-audio-map.js').read_text();maps=json.loads(s.split(' = ',1)[1].rstrip(';\n'))
model=WhisperModel('small.en',device='cpu',compute_type='int8',cpu_threads=4,download_root=str(root.parent/'whisper-models'))
paths=list(dict.fromkeys(t['src'] for tracks in maps.values() for t in tracks))
for i,src in enumerate(paths):
 dest=out/(pathlib.Path(src).stem+'.json')
 if dest.exists():continue
 started=time.time();print('START',i+1,len(paths),src,flush=True)
 segments,info=model.transcribe(str(root/src),language='en',beam_size=5,vad_filter=True,condition_on_previous_text=False)
 rows=[dict(start=round(s.start,2),end=round(s.end,2),text=s.text.strip(),avgLogprob=s.avg_logprob) for s in segments]
 dest.write_text(json.dumps(dict(source=src,model='faster-whisper-small.en',machineTranscript=True,segments=rows),ensure_ascii=False,indent=2))
 print('DONE',src,len(rows),round(time.time()-started),flush=True)
