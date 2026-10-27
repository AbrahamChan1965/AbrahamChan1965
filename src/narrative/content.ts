export const chapter = {
  title: '午夜逃离帖撒罗尼迦',
  subtitle: '离开一座城，不等于故事结束。',
  intro: '街市的喧哗尚未平息。耶孙的家已经承受压力，弟兄们正安排保罗和西拉趁夜离开。你是一位虚构的本地同工，要走过巡查的街巷，抵达城外接应点。',
};
export const evidenceLabels = {
  SCRIPTURE_EXPLICIT: '经文明载', HISTORICAL_RECONSTRUCTION: '历史重建',
  FICTIONAL_SCENARIO: '创作虚构', SCHOLARLY_DISPUTED: '学术争议',
} as const;
export function communityOutcome(contacts: string[]) {
  if (contacts.includes('weaver') && contacts.includes('baker')) return {
    title: '你已离开，他们开始彼此寻找。',
    lines: ['织工把接济的消息带到烘饼之家。', '烘饼人不等宣教者回来，已带着食物去探望邻舍。', '两户人家记得彼此的名字。你不在场，照顾仍能继续。'],
  };
  if (contacts.length) return {
    title: '一份托付，仍在城里传递。',
    lines: [contacts[0] === 'weaver' ? '织工记得你的托付，开始寻找可以一同接济的邻舍。' : '烘饼人开始探访，但还没有与织工建立联络。', '联络尚不完整；留在城里的人仍有行动的空间。', '宣教者离开，并不决定这群人的生命已经结束。'],
  };
  return {
    title: '你安全离开，城里的故事尚未被你看见。',
    lines: ['这次你没有联络两户人家。你不知道他们明天会如何彼此照顾。', '这份未知不等于教会失败；教会的生命并不取决于你完成所有支线。', '可以重走一遍，看看一份具体的托付如何跨过离别。'],
  };
}
