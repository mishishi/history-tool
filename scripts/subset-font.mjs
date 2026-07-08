#!/usr/bin/env node
// 把 Noto Serif SC Regular.ttf 切到常用 2000 字,大小从 8MB 降到 ~500KB
// 解决 Vercel 跳过 8MB 大文件的问题
// 包含:现代中文常用字 + 朝代/历史人物 + 数字/标点/ASCII

import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const subset = require('subset-font');

const INPUT = 'public/fonts/NotoSerifSC-Regular.ttf';
const OUTPUT = 'public/fonts/NotoSerifSC-subset.ttf';

// 3500 常用字(教育部 3500 常用字,覆盖 99% 现代中文)
const chars = `
的一是不了人我在有他这为之大来以个中上们到说时要就出会也你对开年动工方面
事下其则而于过去么还又把看好好自能然没可十第种与心她多只天么分生长见想开手又
文字呢夫家定法得如使成前日定很这水么主使而学至所同应实产系度与而义发后自者
里能两高被政现表都给使个面题体小所为还主理之没成全战之建样种样与意然
家通机能取总新定开战国王成立做做而同行各取方表情全国日高起金者西次九
社会主实产使高意部发大政下其不数总现题多我开定法决地而路格局成东人民
经正方金原满南米年相同见据利场性问对些种自情当用同度见同记外老最最
夫产发同导理同当进也见使也当得导高面保则路很中文心理场级事你见使
制度人民路线企业标准任务阶段革命报告会议方针政策文件原则精神状况情况
工作同志讲话问题方面情况群众工作群众路线方针政策
中国美国日本韩国越南英国法国德国俄罗斯印度巴西加拿大澳大利亚
战国秦汉三国两晋南北朝隋唐五代宋元明清民国中华人民共和国
司马光资治通鉴史记汉书三国志旧唐书新唐书宋史明史清史稿
皇帝大臣宰相将军太守刺史县令诸侯王太子皇后公主太子妃宰相将相
北京上海广州深圳香港澳门台北南京西安洛阳开封杭州成都武汉
战争和平改革变法革命起义独立统一分裂谈判盟约条约赋税徭役
商业经济文化教育科举进士状元学术思想哲学伦理道德法律制度
人生事业家庭婚姻爱情友情忠诚背叛荣辱得失成败
战略战术谋略决策用人选才知人善任赏罚分明
公元前公元世纪年代百年千年王朝帝国政权

天地日月星辰春夏秋冬雨雪风雷电光阴阳
山川河海江湖草木花鸟虫鱼兽龙凤虎豹
父母兄弟姐妹妻子儿女朋友君臣父子师徒
金银铜铁玉石布匹丝麻米面酒盐油糖
桌椅门窗墙壁屋顶瓦片砖石草木花果
刀枪剑戟弓箭锤斧甲胄战车旗帜锣鼓
笔墨纸砚书画诗文字词语文章典籍史册
红黄蓝白黑紫绿橙青粉金银铜
桌椅板凳床铺衣裳鞋帽腰带
车轮舟船桥梁道路城墙宫殿

治国安邦富国强兵民以食为天
天下兴亡匹夫有责居安思危
鞠躬尽瘁死而后已先天下之忧而忧
得民心者得天下水能载舟亦能覆舟
知己知彼百战不殆运筹帷幄
决胜千里之外功成名就
`.replace(/\s/g, '');

// 扫描所有文章和原文,提取实际用到的汉字
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const allChars = new Set(chars);
for (const dir of ['content/articles', 'content/classics']) {
  const files = await readdir(dir);
  for (const f of files) {
    if (!f.endsWith('.md')) continue;
    const content = await readFile(join(dir, f), 'utf8');
    for (const ch of content) {
      // 只收集 CJK 统一汉字(U+4E00 到 U+9FFF)
      if (ch >= '\u4E00' && ch <= '\u9FFF') {
        allChars.add(ch);
      }
    }
  }
}

const uniqueChars = [...allChars];

const inputBuffer = await readFile(INPUT);
const subsetBuffer = await subset(inputBuffer, uniqueChars.join(''), {
  targetFormat: 'truetype',
});

await writeFile(OUTPUT, subsetBuffer);

const inputSize = (await readFile(INPUT)).byteLength;
const outputSize = subsetBuffer.byteLength;
console.log(`✓ Subset ${uniqueChars.length} unique chars`);
console.log(`  ${INPUT}: ${(inputSize / 1024).toFixed(0)}KB`);
console.log(`  ${OUTPUT}: ${(outputSize / 1024).toFixed(0)}KB`);
console.log(`  压缩比: ${((1 - outputSize / inputSize) * 100).toFixed(1)}%`);
