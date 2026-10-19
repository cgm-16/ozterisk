# Generates the Suits key-moment mockup (research tooling).
import sys
NUM="'EB Garamond', Georgia, 'Times New Roman', serif"; UI="'Zen Kaku Gothic New', 'Helvetica Neue', Arial, sans-serif"; KR="'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif"
INK="#16352b"
out=[]
def mark(suit,cx,cy,s=1.0,INK=INK):
    # drawn suit marks, engraved ink, no hue: dots = ring, bamboo = two bars, characters = diamond
    if suit=="dots": return f'<circle cx="{cx}" cy="{cy}" r="{4.2*s}" fill="none" stroke="{INK}" stroke-width="{1.8*s}"/>'
    if suit=="bamboo": return f'<rect x="{cx-4*s}" y="{cy-5*s}" width="{2.4*s}" height="{10*s}" rx="1" fill="{INK}"/><rect x="{cx+1.6*s}" y="{cy-5*s}" width="{2.4*s}" height="{10*s}" rx="1" fill="{INK}"/>'
    return f'<path d="M{cx} {cy-5.5*s} L{cx+5*s} {cy} L{cx} {cy+5.5*s} L{cx-5*s} {cy} Z" fill="none" stroke="{INK}" stroke-width="{1.8*s}"/>'
def tile(x,y,d,suit,w=48,h=60,ring=None,lift=0):
    y-=lift; o=[]
    o.append(f'<rect x="{x}" y="{y+5}" width="{w}" height="{h}" rx="6" fill="#b3a184"/>')
    o.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="url(#face)"/>')
    o.append(f'<text x="{x+w/2}" y="{y+h*0.56}" text-anchor="middle" font-family="{NUM}" font-size="{h*0.52}" fill="{INK}">{d}</text>')
    o.append(mark(suit,x+w/2,y+h*0.8,1.25*h/60))
    if ring: o.append(f'<rect x="{x-3}" y="{y-3}" width="{w+6}" height="{h+11}" rx="8" fill="none" stroke="{ring}" stroke-width="2"/>')
    return "".join(o)
def t(x,y,s,size=12,fill="#f7f0e2",op=1,anchor="start",fam=UI,weight="normal",ls=0):
    return f'<text x="{x}" y="{y}" font-family="{fam}" font-size="{size}" fill="{fill}" fill-opacity="{op}" text-anchor="{anchor}" font-weight="{weight}" letter-spacing="{ls}">{s}</text>'
H=760
o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 {H}" width="390" height="{H}" role="img" aria-labelledby="t d">',
'<title id="t">Suits mode: which 6 completes 56</title>',
'<desc id="d">Phone mockup of Suits at round 9. The equation 7 × 8 has the 5 of dots in its first slot. The rack holds two 6s, one of dots and one of bamboo. The dots 6 makes a one-suit answer that returns three tiles; the bamboo 6 is just as correct but returns two. Suit marks are drawn shapes in engraved ink: a ring for dots, two bars for bamboo, a diamond for characters.</desc>',
'<defs><linearGradient id="face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf8ec"/><stop offset="1" stop-color="#e6d7ba"/></linearGradient></defs>',
f'<rect width="390" height="{H}" fill="#071711"/>',
f'<rect x="12" y="12" width="366" height="{H-24}" rx="14" fill="#14342a"/>']
# HUD
for i,(lab,val) in enumerate([("ROUND","9"),("SCORE","6"),("STREAK","2")]):
    x=48+i*110
    o.append(t(x,46,lab,10,op=0.55,ls=1.5)); o.append(t(x,76,val,28,fam=NUM,fill="#f7f0e2" if i else "#e8cd85"))
o.append(t(48,104,"11 OF 11 HELD",10,op=0.55,ls=1.5))
for i in range(11):
    o.append(f'<circle cx="{170+i*17}" cy="100" r="5" fill="{"#c9a54a"}" stroke="#c9a54a" stroke-width="1"/>')
# equation
o.append(t(195,178,"7 × 8",52,anchor="middle",fam=NUM))
o.append(tile(139,206,"5","dots",w=52,h=64))
o.append(f'<rect x="199" y="206" width="52" height="69" rx="6" fill="none" stroke="#c9a54a" stroke-width="1" stroke-dasharray="4 3"/>')
# choice plate
o.append('<rect x="36" y="296" width="318" height="96" rx="8" fill="#1b4436"/>')
o.append(t(52,320,"WHICH 6?",10,fill="#e8cd85",ls=1.5))
o.append(mark("dots",60,343,1.2,"#f7f0e2")); o.append(t(74,348,"6 of dots: one suit, 3 tiles back",13))
o.append(mark("bamboo",60,371,1.2,"#f7f0e2")); o.append(t(74,376,"6 of bamboo: correct, 2 tiles back",13,op=0.72))
# rack: 11 sockets, 5 columns 48x60, gap 6
o.append('<rect x="36" y="410" width="318" height="232" rx="10" fill="#0b211b"/>')
rack=[("0","chars"),("1","bamboo"),("2","dots"),("3","chars"),(None,None),("5","chars"),("6","dots"),("6","bamboo"),("7","chars"),("8","bamboo"),("9","dots")]
for k,(d,s) in enumerate(rack):
    col,row=k%5,k//5; x=60+col*56; y=428+row*72
    if d is None:
        o.append(f'<rect x="{x}" y="{y}" width="48" height="65" rx="6" fill="#081a14" stroke="#c9a54a" stroke-opacity="0.4" stroke-dasharray="3 3"/>')
        o.append(t(x+24,y+38,"on loan",9,op=0.4,anchor="middle"))
    else:
        o.append(tile(x,y,d,s,ring="#c9a54a" if (d=="6" and s=="dots") else None,lift=4 if (d=="6" and s=="dots") else 0))
o.append(t(230,610,"11 sockets in Classic's",10,op=0.4,anchor="middle"))
o.append(t(230,626,"five-column mid rack",10,op=0.4,anchor="middle"))
# buttons
for i,(lab,on) in enumerate([("SUBMIT",False),("CLEAR",True)]):
    x=60+i*140
    o.append(f'<rect x="{x}" y="664" width="128" height="44" rx="6" fill="none" stroke="#c9a54a" stroke-opacity="{1 if on else 0.4}"/>')
    o.append(t(x+64,691,lab,12,anchor="middle",op=1 if on else 0.4,ls=2))
o.append(t(195,734,"무늬 · 같은 무늬로 맞추면 한 장 더",11,anchor="middle",fam=KR,op=0.55))
o.append('</svg>')
open(sys.argv[1],'w').write("\n".join(o))
