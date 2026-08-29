// Pipedream Node.js step for Google Play Store Reviews

import gplay from "google-play-scraper";
import fs from "fs";

export default defineComponent({
  props: {
    appId: {
      type: "string",
      label: "Play Store App ID",
      default: "com.myntra.android",
    },
    numReviews: {
      type: "integer",
      label: "Number of Reviews to Fetch",
      default: 100,
    }
  },
  async run({ steps, $ }) {
    console.log(`Fetching latest ${this.numReviews} reviews for ${this.appId}...`);

    try {
      const reviewsData = await gplay.reviews({
        appId: this.appId,
        sort: gplay.sort.NEWEST,
        num: this.numReviews,
      });

      const reviews = reviewsData.data;

      if (!reviews || reviews.length === 0) {
        console.log("No reviews found.");
        fs.writeFileSync('/tmp/playstore_data.json', JSON.stringify([]));
        return { success: true, saved_to: '/tmp/playstore_data.json', empty: true };
      }

      // Map to raw_snippets schema
      const formattedData = reviews.map((review) => {
        return {
          source: "play_store",
          text: review.text,
          metadata: {
            author: review.userName,
            rating: review.score,
            version: review.version,
            review_id: review.id
          },
          scraped_at: new Date(review.date).toISOString()
        };
      });

      console.log(`Successfully fetched ${formattedData.length} Play Store reviews.`);
      
      // Save to disk instead of returning
      fs.writeFileSync('/tmp/playstore_data.json', JSON.stringify(formattedData));
      
      // Clear arrays to free memory
      reviews.length = 0;
      formattedData.length = 0;

      return { success: true, saved_to: '/tmp/playstore_data.json' };

    } catch (error) {
      console.error("Error fetching Play Store reviews:", error);
      throw error;
    }
  },
});
