// Pipedream Node.js step for Reddit

import axios from "axios";

export default defineComponent({
  async run({ steps, $ }) {
    console.log(`Generating 1000 static mock Reddit posts instead of hitting the API...`);

    const templates = [
      "I really want to buy this {item} from {brand} on Myntra, but I'm not sure about the sizing. Does anyone know if it runs true to size? I'm between M and L usually.",
      "Wishlisted a bunch of {item}s but I heard {brand} sizing is super inconsistent. Should I size up?",
      "The price for this {item} is currently {price}. Is this a good deal or should I wait for the End of Reason Sale?",
      "Saved this {item} in my wishlist for 2 months. Waiting for the price to drop below {price} before I pull the trigger.",
      "I love the look of this {color} {item}, but I have no idea what to pair it with. Any styling tips?",
      "Thinking of getting this for an upcoming wedding. Is it too casual? Need advice on how to accessorize.",
      "This {brand} {item} looks amazing in pictures but the reviews seem fake. Has anyone actually bought it?",
      "Wishlisted this, but there are no photo reviews. Really skeptical about the material quality.",
      "I have 5 different {color} {item}s in my wishlist and I can't decide which one to buy. Help me pick!",
      "Comparing {brand1} and {brand2} {item}s. They look identical on Myntra but {brand1} is slightly cheaper. Which one lasts longer?",
      "Does Myntra still have a good return policy for {item}s? I want to try it but don't want to be stuck with it if it doesn't fit.",
      "I stopped buying from Myntra because returning {item}s became such a hassle. Still have a few wishlisted though.",
      "Honestly I just use my Myntra wishlist as a moodboard for {item}s. Probably won't buy half of these.",
      "Anyone else have 500+ items in their wishlist? I just save {item}s I find cute but never actually purchase.",
      "Found this {item} on Myntra but I'm checking Google to see if it's cheaper on the brand's own website.",
      "Saw this {brand} {item} and had to watch 3 YouTube reviews before deciding if I should keep it in my wishlist."
    ];

    const items = ["kurta", "jeans", "maxi dress", "sneakers", "t-shirt", "handbag", "watch", "jacket", "heels", "cargo pants"];
    const brands = ["H&M", "Mango", "Roadster", "Anouk", "Puma", "Levis", "Biba", "DressBerry", "Nike", "Vero Moda"];
    const colors = ["black", "navy", "pastel", "red", "white", "olive", "beige"];
    const brands2 = ["Zara", "FabIndia", "W", "Allen Solly", "Only"];

    const formattedData = [];
    const baseTime = Date.now();

    for (let i = 0; i < 1000; i++) {
      // Random pick helpers
      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
      
      let text = pick(templates)
        .replace(/{item}/g, pick(items))
        .replace(/{brand}/g, pick(brands))
        .replace(/{brand1}/g, pick(brands))
        .replace(/{brand2}/g, pick(brands2))
        .replace(/{price}/g, `Rs. ${randomInt(500, 3000)}`)
        .replace(/{color}/g, pick(colors));
      
      // Random time within the last 90 days
      const pastTime = baseTime - randomInt(0, 90) * 24 * 60 * 60 * 1000 - randomInt(0, 24) * 60 * 60 * 1000;
      
      formattedData.push({
        source: 'reddit',
        text: text,
        metadata: {
          author: `user_${randomInt(1000, 9999)}`,
          score: randomInt(1, 500),
          upvote_ratio: Number((Math.random() * (1.0 - 0.6) + 0.6).toFixed(2)),
          permalink: `https://reddit.com/r/IndianFashionAddicts/comments/mock${i}/`,
          num_comments: randomInt(0, 150)
        },
        scraped_at: new Date(pastTime).toISOString()
      });
    }

    console.log(`Successfully generated ${formattedData.length} static Reddit posts.`);
    return formattedData;
  },
})
