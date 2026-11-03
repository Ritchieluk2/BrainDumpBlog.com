/**
 * Fictional entries for the local demo account (see server/api/dev/demo-login.get.ts).
 * `daysAgo` is counted back from today; a few days are skipped on purpose,
 * because real journals have gaps.
 */
export const DEMO_EMAIL = 'demo@example.com'

export const DEMO_ENTRIES: { daysAgo: number; body: string }[] = [
  {
    daysAgo: 0,
    body: `Couldn't sleep again, kept thinking about the move and whether the plants will survive the drive. Need to call about the lease. Also weirdly excited, the new place has that window over the sink! Wait - need to email Sam about the truck. Why do I always leave the hard calls until Friday. Again.

- boxes
- tape
- cancel internet
- pay rent

Coffee is good today at least.`
  },
  {
    daysAgo: 1,
    body: `Sunday. Slept in, which felt like a small victory. Quiet, calm, nothing urgent on my mind for once. Read on the porch with a blanket. Want to read more this week and maybe walk before work. Grateful for the slow morning and good coffee. Everything feels settled and easy today.`
  },
  {
    daysAgo: 2,
    body: `Finished the draft last night and it is actually great! So excited and proud. Looking forward to sending it, hope they like it. Best feeling in weeks. Glad I stuck with it even when it felt pointless. Going to celebrate tonight, maybe the good ramen place.`
  },
  {
    daysAgo: 3,
    body: `Tired. Exhausted honestly. Meetings all day yesterday and more today. Not sure what I'm even doing on this project, kind of foggy about the goal, maybe I need a break. No energy. I guess I'll just get through it? Heavy, sluggish morning.`
  },
  {
    daysAgo: 4,
    body: `Three things today: finish the deck, reply to Ana, go to the gym. Focus. Clear plan. That's it. Priority is the deck, done by noon, then I can work on the budget. Feeling productive and clear for once.`
  },
  {
    daysAgo: 6,
    body: `Called Mom last night. Miss her. Thinking about family and old friends, grateful for them. Remember the lake house, the dock, the bad canoe? Sweet memories. Hope to visit soon, maybe for the holidays. Feeling soft and kind of nostalgic.`
  },
  {
    daysAgo: 7,
    body: `Worried about the interview. What if it goes badly again? Keep replaying the last one in my head. Why does this always happen to me. Stressed, tense, overwhelmed. Still hopeful though, it could be a new start, and the team seemed kind.`
  },
  {
    daysAgo: 8,
    body: `Okay. Interview is today. Nervous but prepared. Plan: review notes, eat a real breakfast, leave early. I've done the work. Focus on the questions, not on how I'm coming across. Deep breath.`
  },
  {
    daysAgo: 9,
    body: `So much to do. Need to book the dentist, pay the electric bill, email the landlord, buy a birthday gift for Jess, call the bank about the card, and there's laundry. Also should start packing the kitchen. Don't forget the appointment Thursday. List list list.`
  },
  {
    daysAgo: 10,
    body: `Lovely morning. Sunshine through the blinds, birds being loud. Made pancakes for no reason. Small win: fixed the leaky faucet myself. Grateful for little things today. Smiling at nothing. Good day ahead, I think.`
  },
  {
    daysAgo: 11,
    body: `Restless. Mind jumping everywhere - work, the move, that weird text from Dan, oh and the car needs an oil change. Also need to answer emails. And then there's the thing on Friday. Wait, did I lock the back door? Anyway. Coffee. Go.`
  },
  {
    daysAgo: 13,
    body: `Slow, gray morning. Rain on the window. Not sad exactly, just still. Drinking tea and not checking my phone. Peaceful. Going to take it easy today and rest, nothing that can't wait.`
  },
  {
    daysAgo: 14,
    body: `Same argument with myself again about whether to take the new job. Keep going around in circles. What if I regret leaving? What if I regret staying? Always the same loop. Still don't know. Maybe I'll just make a pros and cons list and stop thinking about it for a day.`
  },
  {
    daysAgo: 15,
    body: `Big news: they offered me the job! Excited, a little scared, mostly happy. Called Mom and she cried, which made me cry. Hopeful about a new start. Can't stop smiling. Proud of myself for once.`
  },
  {
    daysAgo: 16,
    body: `Burned out. Slept badly, groggy, drained. Everything feels heavy and a little pointless this morning. Not sure why. Maybe just need a weekend. I guess writing this helps a bit.`
  },
  {
    daysAgo: 17,
    body: `Started a new notebook today, so here goes. Goal for the next month: write every morning, even if it's just a few lines. Hope this helps clear my head. Feeling optimistic about it, and a bit silly.`
  }
]

/** Journal entries for the demo, each reflecting on one or more mornings (by daysAgo). */
export const DEMO_JOURNALS: { daysAgo: number; title: string; about: number[]; body: string }[] = [
  {
    daysAgo: 6,
    title: 'How the interview actually went',
    about: [7, 8],
    body: `Reading back the morning before the interview is funny now. I was so sure it would go the way the last one did.

It didn't. They asked about the project I was most nervous to talk about, and I just told the truth: what went wrong, what I'd do differently. The room relaxed. I relaxed.

Note to future me: the worry was louder than the thing itself. It usually is.`
  },
  {
    daysAgo: 2,
    title: 'Two weeks of mornings',
    about: [17, 14, 10],
    body: `I've been doing this every morning for about two weeks. The first entry was mostly hope and a little embarrassment. The middle stretch was a lot of going around in circles about the job.

What I notice: the mornings with something small and good in them (pancakes, the faucet, sunshine) are the ones I remember. I want more of those on purpose, not by accident.`
  },
  {
    daysAgo: 0,
    title: 'Packing plan',
    about: [0, 9],
    body: `Both of those mornings had the same list in them, so clearly it's time to actually make a plan.

Kitchen first, because it's the most annoying. Books second. Plants travel in the car with me, not the truck. Ask Sam on Thursday, not Friday.`
  }
]

/** To-dos, notes and reminders for the demo homepage. `dueInHours` is relative to now. */
export const DEMO_ITEMS: { kind: 'todo' | 'note' | 'reminder'; text: string; done?: boolean; dueInHours?: number; fromDaysAgo?: number }[] = [
  { kind: 'reminder', text: 'Call about the lease', dueInHours: -1 },
  { kind: 'reminder', text: 'Ask Sam about the truck', dueInHours: 30 },
  { kind: 'todo', text: 'Cancel internet', fromDaysAgo: 0 },
  { kind: 'todo', text: 'Pay rent', fromDaysAgo: 0 },
  { kind: 'todo', text: 'Book the dentist', fromDaysAgo: 9 },
  { kind: 'todo', text: 'Buy a birthday gift for Jess', done: true, fromDaysAgo: 9 },
  { kind: 'note', text: 'Plants ride in the car, not the truck.' },
  { kind: 'note', text: 'Book idea: the one Ana mentioned about habits. Ask her the title.' }
]
