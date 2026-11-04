import type { CmsResult } from "@/lib/cms/types";
import {
  ensureWixVisitorTokens,
  formatWixImageUrl,
  isWixConfigured,
  wixClient,
} from "@/lib/cms/wixClient";
import { getServerWixClient, isServerWixConfigured } from "@/server/wix/serverClient";
import type { BlogPost } from "../data/blogPosts";

export function calculateReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} MIN READ`;
}

export const FALLBACK_BLOG_POSTS: BlogPost[] = [
  {
    id: "post-01-the-chai-uncle-is-safety-infrastructure",
    title: "The chai uncle is safety infrastructure",
    slug: "the-chai-uncle-is-safety-infrastructure",
    postNumber: "POST 01",
    subtitle: "We asked people where they feel safest. Almost every answer had a person in it.",
    excerpt:
      "Every Street Smart walk starts with the same question: apart from home, where in the city do you feel safest? We expected the usual answers: bright roads, CCTV, somewhere with security. That's not what we got.",
    body: `Every Street Smart walk starts with the same question: apart from home, where in the city do you feel safest?

We expected the usual answers. Bright roads. CCTV. Somewhere with security.

That's not what we got. On Church Street in May, people told us about a street in Basavanagudi where the chai vendor knows them by name. A stretch of Benson Town that feels okay because of the fruit and pakora sellers. A bar in Whitefield, "because we know the manager." A gurdwara. The airport.

Nobody's answer was a camera. Almost every answer had someone in it.

One participant, talking about the vendors on her street, said: "I'm their witness as well." She wasn't only being looked after. She was looking out for them too.

That line has stayed with us. It's the heart of what we now call the witnessing thesis: safety is built socially, through being seen. The chai uncle who knows your face. The woman at the bookstore. The friend waiting for your "reached" text. Different people, same act.

It changes what you look for on a street. Not just is there a light here, but is there anyone here who would notice if something went wrong?

It also explains something people kept saying, almost in passing: Bangalore is getting shinier, but less personal. When the regulars go, a street can get brighter and still feel less safe. You lose the people who knew you.`,
    tryThis:
      "on your way home this week, notice who on your route would notice you. Then notice who you'd notice.",
    category: "COMMUNITY WALKS",
    readingTime: "2 MIN READ",
    isPublished: true,
  },
  {
    id: "post-02-the-bright-trap",
    title: "The bright trap",
    slug: "the-bright-trap",
    postNumber: "POST 02",
    subtitle:
      "A street can be well lit and still feel wrong. We went looking for what the light leaves out.",
    excerpt:
      "Ask anyone how to make a street safer and they'll probably say: more lights. So on our Indiranagar night walk, around 9 pm, we gave people a task near Toit: find a well-lit spot where you still wouldn't wait alone.",
    body: `Ask anyone how to make a street safer and they'll probably say: more lights.

So on our Indiranagar night walk, around 9 pm, we gave people a task near Toit: find a well-lit spot where you still wouldn't wait alone. What's missing that the light doesn't give you?

Here's what we noticed together.

Outside a bar, everything is bright. Walk a few steps away and the street changes completely. Commercial roads glow. The residential lanes right next to them go dark. We kept asking ourselves: shouldn't safety carry on past the entrance?

Another task sent people 30 metres into a quiet residential road. On paper, it's one of the "safe" ones. We asked why they still wouldn't take it to a friend's place at that hour. Safe on paper and safe in your body turned out to be two different things.

A few things came up again and again:

- **Seeing both ends.** A street where you can see all the way through felt easier than one with hidden corners.
- **Somewhere to go.** We asked: if something felt off, where would you go in 30 seconds? And is it actually open right now?
- **Being visible without being exposed.** On Church Street, people talked about a small café with glass walls. Closed off, but still seen.

Light helps. But light alone doesn't tell you who's around, what's open, or whether anyone would look up if you called out.`,
    tryThis:
      'next time you\'re waiting somewhere at night, ask yourself what would make it better. Notice how rarely the answer is "more light."',
    category: "STREET DESIGN",
    readingTime: "2 MIN READ",
    isPublished: true,
  },
  {
    id: "post-03-quiet-is-a-luxury",
    title: "Quiet is a luxury",
    slug: "quiet-is-a-luxury",
    postNumber: "POST 03",
    subtitle: "How many places in this city let you slow down without staying alert?",
    excerpt:
      "One of our Church Street prompts was simple: walk to the loudest place nearby, then the quietest. What's different? It sounds like a small question. The answers weren't.",
    body: `One of our Church Street prompts was simple: walk to the loudest place nearby, then the quietest. What's different?

It sounds like a small question. The answers weren't.

Noise, people said, hides things. On a loud street, nobody hears you complain. Bystanders freeze because they're not sure what they saw. Harassment can happen in plain sight and still go unnoticed.

Then one participant pointed out something we hadn't thought about: quiet is a luxury. The calm, tree-lined streets tend to be in the wealthier neighbourhoods. The people who can ask for quiet are usually the ones who already have it.

The same question kept coming back, across walks: how many public spaces actually let you slow down without being on guard?

The answers were very personal. One person said they feel safer walking at midnight in Basavanagudi than in broad daylight somewhere else. Another said Church Street always makes them feel like they're missing something. A zine from our very first workshop said it in two words, cut out of a newspaper: *Don't sleep!*

That constant low hum of alertness is tiring. And most of us don't notice we're carrying it until we put it down.

On our dusk walk in Cubbon Park, one participant described feeling anxious at some points, and then calm, safe, happy, even nostalgic at others. Same park, same evening, a whole range of feelings.`,
    tryThis:
      "find one place in your city where you can sit for ten minutes and not watch your back. If you can't think of one, that's worth noticing too.",
    category: "COMMUNITY WALKS",
    readingTime: "2 MIN READ",
    isPublished: true,
  },
  {
    id: "post-04-the-safety-work-nobody-sees",
    title: "The safety work nobody sees",
    slug: "the-safety-work-nobody-sees",
    postNumber: "POST 04",
    subtitle:
      "Live location, the fake phone call, keys between your fingers. Most of us do this without thinking. That's the point.",
    excerpt:
      "At our Cubbon Park walk with City Girls Bangalore, we played Safety Bingo. The squares named small, everyday habits: sharing your live location, pretending to be on a call, carrying keys between your fingers, leaving early because something felt off.",
    body: `At our Cubbon Park walk with City Girls Bangalore, we played Safety Bingo. The squares named small, everyday habits:

- sharing your live location
- pretending to be on a call
- carrying keys between your fingers
- leaving early because something felt off

It's a game, but it does something sneaky. Ticking the squares off shows you how much of this you already do. Quietly, all the time, without calling it anything.

Our online sessions found the same thing. Did you share your live location before a date? Ask someone to stay on the call "just in case"? Screenshot a profile before meeting? Send a username to the group chat for a vibe check? Everyone had their own version. Sharing live location and sending "reached" texts came up again and again.

On walks, women described the effort of just figuring things out. Was that brush-past on purpose? Is that person keeping pace with me, or just walking? Some people notice the exits before they notice the room. A London zine put it neatly: *Every risky option: Check, Change, Go.*

None of this shows up anywhere. It's labour, and it's invisible.

And here's something we had to admit about our own work. In one online session, almost every question was about the person sending the "reached" text. We barely asked about the person receiving it. Who's watching that live location? Does anyone actually check it? Has it ever helped?

A location pin shows where a phone is. It doesn't tell you whether the person holding it is okay.

One zine has stayed with us: a message that breaks off mid-sentence, *Hello, how ar…*, next to a lonely rover on Mars. The worry isn't only about getting home. It's about whether anyone is on the other end.`,
    tryThis:
      "count how many of these habits you used this week. Then think about who you're texting, and whether you've ever been the one who checks.",
    category: "ARCHIVE FINDINGS",
    readingTime: "2 MIN READ",
    isPublished: true,
  },
  {
    id: "post-05-same-street-different-nervous-systems",
    title: "Same street, different nervous systems",
    slug: "same-street-different-nervous-systems",
    postNumber: "POST 05",
    subtitle: "Walk the same road at the same hour, and you can still be in two different cities.",
    excerpt:
      "On our dusk walk through Cubbon Park, everyone drew a small map in their zine. Mark where you felt safe, unsafe, or unsure. There was no right answer. When we put the maps side by side, they didn't match.",
    body: `On our dusk walk through Cubbon Park, everyone drew a small map in their zine. Mark where you felt safe, unsafe, or unsure. There was no right answer.

When we put the maps side by side, they didn't match. Nine people, one park, one evening. Safety turned out to be personal. It shifted with identity, with memory, with who you came with.

The gap shows up most clearly between men and women.

On Church Street, a male participant said the walk showed him blind spots his partner deals with every day. At the Whitefield mall, a woman told us she was constantly noticing what made a space feel safer or less safe, while her partner struggled to spot those things at first. He'd never really had to think about it. Same mall, same hour, very different maps in their heads.

At Cubbon Park with City Girls Bangalore, one participant put the question plainly: why should we fear for our safety when they never have to?

On the Indiranagar night walk, we asked people to look around and notice who was on the street at 9 pm. And who wasn't. That second question is the harder one.

But here's the other side of it. After the Cubbon Park walk, one participant said what surprised them most was how similar everyone's experiences were. They realised they weren't the only one walking around a little more alert. A lot of people feel the same way.

Both things are true. We don't experience the city the same way. And we're less alone in it than we think.

For us, that's why we walk in mixed groups. The differences between how people answer the same prompt aren't noise. They're the most useful thing we learn.`,
    tryThis:
      "walk a route you know well with someone very different from you. Ask them what they notice.",
    category: "COMMUNITY WALKS",
    readingTime: "2 MIN READ",
    isPublished: true,
  },
  {
    id: "post-06-designing-a-city-where-you-dont-need-to-text",
    title: "Designing a city where you don't need to text",
    slug: "designing-a-city-where-you-dont-need-to-text",
    postNumber: "POST 06",
    subtitle: 'What would have to change by 2040 for "text me when you get home" to disappear?',
    excerpt:
      'What would have to change by 2040 for "text me when you get home" to disappear? That was the question at UNSENT, our online safety hackathon in September. We started somewhere dark on purpose.',
    body: `What would have to change by 2040 for "text me when you get home" to disappear?

That was the question at UNSENT, our online safety hackathon in September.

We started somewhere dark on purpose. Groups first imagined a future made safe through surveillance: more tracking, more cameras, more watching. Then we flipped it. What would a future built on care and witnessing look like instead?

Five groups, five very different answers.

### Safety councils
One group imagined councils at the ward level, around 12 to 18 people, including people with disabilities, experts and people with lived experience. They'd build on ward committees that already exist, check in every six months, and maybe even compete on safety rankings the way cities compete on cleanliness under Swachh Bharat.

### Routes that actually work
Another group thought about a worker who uses a wheelchair. One broken pavement or blocked ramp can make a whole route useless. They imagined a live map of accessible routes that people update themselves when something changes.

### A city as a workplace
For a gig worker, the whole city is the office, often late at night. This group designed a system that suggests the safer route, not just the fastest, along with proper rest points with light and drinking water.

### Safety shouldn't cost extra
A group thinking about caregivers who travel home late asked a sharp question: should anyone have to choose between affordable and safe? Their answer was that employers should share responsibility for getting workers home.

### Start with children
The last group asked why, if we already know what works, so little of it happens. Their idea was to start early, and change the question we teach children. Not just *how do you keep yourself safe?* but *how can you make the people around you safer?*

That last question is where we'd like to leave this series. Every walk has pointed us back to the same thing: safety is made by people noticing each other. The chai uncle. The friend on the other end of the text. You.

Until the city catches up, text someone when you get home. And be the person someone else texts.

Follow along at @textwhenyougethome, and come walk with us.`,
    category: "STREET DESIGN",
    readingTime: "3 MIN READ",
    isPublished: true,
  },
];

function extractString(val: unknown): string {
  if (typeof val === "string") return val.trim();
  if (typeof val === "number") return String(val);
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (typeof obj["text"] === "string") return obj["text"].trim();
    if (typeof obj["plainText"] === "string") return obj["plainText"].trim();
    if (typeof obj["html"] === "string") {
      return obj["html"]
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
  }
  return "";
}

function normalizeBlogPost(item: Record<string, unknown>): BlogPost {
  const id = String(item["_id"] ?? item["id"] ?? `post-${Math.random()}`);
  const title =
    extractString(item["title"]) || extractString(item["name"]) || "Untitled Reflection";
  const slug =
    extractString(item["slug"]) ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  const excerpt = extractString(item["excerpt"]) || "";
  const body = extractString(item["body"]) || extractString(item["content"]) || excerpt;
  const postNumber = extractString(item["postNumber"]) || undefined;
  const subtitle = extractString(item["subtitle"]) || undefined;
  const tryThis = extractString(item["tryThis"]) || undefined;
  const category = extractString(item["category"]) || extractString(item["tag"]) || "FIELD NOTES";
  const author = extractString(item["author"]) || undefined;
  const publishedAt =
    extractString(item["publishedAt"]) || extractString(item["_createdDate"]) || undefined;
  const coverImage = formatWixImageUrl(item["coverImage"]);
  const readingTime = extractString(item["readingTime"]) || calculateReadingTime(body || excerpt);
  const isPublished = item["isPublished"] !== false && item["status"] !== "draft";

  return {
    id,
    title,
    slug,
    postNumber,
    subtitle,
    excerpt,
    body,
    tryThis,
    category: category.toUpperCase(),
    author,
    publishedAt,
    coverImage: coverImage || undefined,
    readingTime: readingTime.toUpperCase(),
    isPublished,
  };
}

export async function getBlogPosts(): Promise<CmsResult<BlogPost>> {
  const activeClient = isServerWixConfigured()
    ? getServerWixClient()
    : isWixConfigured()
      ? wixClient
      : null;

  if (!activeClient) {
    return { status: "success", data: FALLBACK_BLOG_POSTS };
  }

  try {
    if (activeClient === wixClient) {
      await ensureWixVisitorTokens();
    }

    const response = await activeClient.items
      .query("BlogPosts")
      .descending("_createdDate")
      .limit(50)
      .find();

    const items = response.items || [];
    if (items.length === 0) {
      return { status: "success", data: FALLBACK_BLOG_POSTS };
    }

    const normalized = items
      .map((item) => normalizeBlogPost(item as Record<string, unknown>))
      .filter((post) => post.isPublished);

    if (normalized.length === 0) {
      return { status: "success", data: FALLBACK_BLOG_POSTS };
    }

    // Check if the CMS items correspond to the 6 target articles
    const targetSlugs = new Set(FALLBACK_BLOG_POSTS.map((p) => p.slug));
    const hasTargetArticles = normalized.some((p) => targetSlugs.has(p.slug));
    if (!hasTargetArticles) {
      return { status: "success", data: FALLBACK_BLOG_POSTS };
    }

    return { status: "success", data: normalized };
  } catch (error) {
    console.warn("Wix CMS query for BlogPosts failed, using fallback articles:", error);
    return { status: "success", data: FALLBACK_BLOG_POSTS };
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const cleanSlug = slug.trim().toLowerCase();

  const activeClient = isServerWixConfigured()
    ? getServerWixClient()
    : isWixConfigured()
      ? wixClient
      : null;

  if (activeClient) {
    try {
      if (activeClient === wixClient) {
        await ensureWixVisitorTokens();
      }

      const response = await activeClient.items
        .query("BlogPosts")
        .eq("slug", cleanSlug)
        .limit(1)
        .find();

      const item = response.items?.[0];
      if (item) {
        const post = normalizeBlogPost(item as Record<string, unknown>);
        if (post.isPublished) return post;
      }
    } catch (error) {
      console.warn(`Wix query for blog slug '${slug}' failed:`, error);
    }
  }

  // Check fallback articles
  const fallback = FALLBACK_BLOG_POSTS.find((p) => p.slug.toLowerCase() === cleanSlug);
  return fallback ?? null;
}
