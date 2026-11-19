from PIL import Image
U='/root/.claude/uploads/1c8e2e8c-9ff5-51e9-bef5-d8935578c6e3/'
S={'dash':'f8b1036c','cat':'f7053cfb','ed':'613f0046','ed2':'65f3897b','ber':'b9afe935','ai':'01e3c80a','kal':'eb6b353e'}
C={
 'logo_dash':('dash',(44,88,124,166)),
 'avatar':('dash',(964,86,1046,166)),
 'banner_dash':('dash',(24,208,1063,452)),
 'qa_note':('dash',(92,494,158,560)),
 'qa_upload':('dash',(316,498,386,556)),
 'qa_ai':('dash',(534,494,608,556)),
 'qa_cal':('dash',(746,494,810,556)),
 'qa_more':('dash',(952,498,1010,554)),
 'doc_tile':('dash',(602,742,658,796)),
 'agenda_illu':('dash',(600,1068,1060,1279)),
 'hdr_catatan':('cat',(32,214,104,290)),
 'pin_illu':('cat',(600,423,1062,628)),
 'pin_doc':('cat',(52,492,118,568)),
 'nt_blue':('cat',(52,738,130,808)),
 'nt_purple':('cat',(52,850,130,920)),
 'nt_green':('cat',(52,960,130,1032)),
 'nt_yellow':('cat',(52,1072,130,1142)),
 'nt_pink':('cat',(52,1186,130,1258)),
 'logo_ed':('ed',(98,58,178,136)),
 'logo_ber':('ber',(42,60,130,140)),
 'db':('ber',(50,276,126,356)),
 'store_illu':('ber',(640,246,1062,402)),
 'f_gear':('ber',(42,498,112,556)),
 'f_play':('ber',(398,498,472,556)),
 'f_book':('ber',(744,498,818,556)),
 'f_user':('ber',(42,606,112,664)),
 'f_img':('ber',(398,606,472,664)),
 'f_arch':('ber',(744,606,818,664)),
 'fi_pdf':('ber',(64,786,134,856)),
 'fi_doc':('ber',(64,880,136,950)),
 'fi_thumb':('ber',(44,978,157,1049)),
 'fi_video':('ber',(44,1074,157,1145)),
 'fi_music':('ber',(64,1170,136,1240)),
 'logo_ai':('ai',(42,68,128,148)),
 'banner_ai':('ai',(22,171,1064,437)),
 'ai_chat':('ai',(76,476,150,546)),
 'ai_sum':('ai',(262,476,330,540)),
 'ai_write':('ai',(436,476,508,540)),
 'ai_tr':('ai',(608,474,684,540)),
 'ai_img':('ai',(784,476,860,540)),
 'ai_more':('ai',(960,480,1024,538)),
 'mq_doc':('ai',(48,722,130,798)),
 'mq_bulb':('ai',(572,722,654,798)),
 'mq_book':('ai',(48,826,130,902)),
 'mq_code':('ai',(572,826,654,902)),
 'mq_chart':('ai',(48,928,130,1004)),
 'mq_book2':('ai',(572,928,654,1004)),
 'logo_kal':('kal',(38,62,126,144)),
}
out='www/img/'
ims={k:Image.open(U+v+'-image.png') for k,v in S.items()}
for n,(s,b) in C.items():
  ims[s].crop(b).save(out+n+'.png')
# contact sheet
import math
names=list(C); W=1200; x=y=0; rowh=0
sheet=Image.new('RGB',(W,1600),'white')
for n in names:
  im=Image.open(out+n+'.png')
  if im.width>500: im=im.resize((im.width//2,im.height//2))
  if x+im.width>W: x=0;y+=rowh+6;rowh=0
  sheet.paste(im,(x,y)); x+=im.width+6; rowh=max(rowh,im.height)
sheet.crop((0,0,W,y+rowh)).save('/tmp/claude-0/-home-user-AdriyMine/1c8e2e8c-9ff5-51e9-bef5-d8935578c6e3/scratchpad/sheet.png')
