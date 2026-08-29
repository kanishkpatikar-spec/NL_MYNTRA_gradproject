// Pipedream Node.js step for Apple App Store Reviews

import store from "app-store-scraper";
import fs from "fs";

export default defineComponent({
  props: {
    appId: {
      type: "string",
      label: "App Store App ID (numeric)",
      default: "907394059", // Myntra's App Store ID
    },
    numReviews: {
      type: "integer",
      label: "Page of Reviews to Fetch",
      default: 1, // App store scraper works by page (1-10), each page has 50 reviews
    }
  },
  async run({ steps, $ }) {
    console.log(`Fetching page ${this.numReviews} of reviews for iOS app ${this.appId}...`);

    try {
      const reviews = await store.reviews({
        id: this.appId,
        sort: store.sort.RECENT,
        page: this.numReviews,
      });

      if (!reviews || reviews.length === 0) {
        console.log("No reviews found.");
        fs.writeFileSync('/tmp/appstore_data.json', JSON.stringify([]));
        return { success: true, saved_to: '/tmp/appstore_data.json', empty: true };
      }

      // Map to raw_snippets schema
      const formattedData = reviews.map((review) => {
        return {
          source: "app_store",
          text: review.text,
          metadata: {
            author: review.userName,
            rating: review.score,
            version: review.version,
            title: review.title
          },
          // App Store scraper doesn't always return dates in a standard format, 
          // fallback to current date if missing or unparseable.
          scraped_at: review.date ? new Date(review.date).toISOString() : new Date().toISOString()
        };
      });

      console.log(`Successfully fetched ${formattedData.length} App Store reviews.`);
      
      fs.writeFileSync('/tmp/appstore_data.json', JSON.stringify(formattedData));
      
      reviews.length = 0;
      formattedData.length = 0;

      return { success: true, saved_to: '/tmp/appstore_data.json' };

    } catch (error) {
      console.error("Error fetching App Store reviews:", error);
      throw error;
    }
  },
});
