// Pipedream Node.js step for YouTube Comments

import axios from "axios";
import fs from "fs";

export default defineComponent({
  props: {
    // This allows you to securely input your YouTube API key in the Pipedream UI
    // rather than hardcoding it in the script.
    youtubeApiKey: {
      type: "string",
      label: "YouTube Data API v3 Key",
      secret: true,
    },
    // The specific video IDs you want to scrape
    videoIds: {
      type: "string[]",
      label: "YouTube Video IDs",
      description: "Enter one or more video IDs to scrape comments from.",
      default: ["YOUR_VIDEO_ID_HERE"]
    }
  },
  async run({ steps, $ }) {
    console.log(`Fetching YouTube comments for ${this.videoIds.length} video(s)...`);

    const allFormattedData = [];

    for (const videoId of this.videoIds) {
      console.log(`Processing video ID: ${videoId}`);
      try {
        // Using YouTube Data API v3 commentThreads endpoint
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/commentThreads`, {
          params: {
            part: "snippet",
            videoId: videoId,
            key: this.youtubeApiKey,
            maxResults: 100, // Max allowed per page by YouTube API
            order: "relevance", // Or "time" for newest
            textFormat: "plainText" // Ensure we get plain text back, not HTML
          }
        });

        const comments = response.data.items;

        if (!comments || comments.length === 0) {
           console.log(`No comments found for video ID: ${videoId}.`);
           continue;
        }

        // Map the data to match your Supabase raw_snippets schema
        const formattedData = comments.map(item => {
          const topLevelComment = item.snippet.topLevelComment.snippet;
          return {
            source: 'youtube',
            text: topLevelComment.textDisplay || topLevelComment.textOriginal, // Use textDisplay which is guaranteed, formatted as plainText
            metadata: {
              author: topLevelComment.authorDisplayName,
              like_count: topLevelComment.likeCount,
              video_id: videoId,
              comment_id: item.id
            },
            scraped_at: new Date(topLevelComment.publishedAt).toISOString()
          };
        });

        allFormattedData.push(...formattedData);
        console.log(`Successfully fetched ${formattedData.length} comments for video ID: ${videoId}.`);
        
      } catch (error) {
        const errorData = error.response?.data;
        
        // If comments are disabled, YouTube returns a 403 error. 
        // Handle this gracefully by skipping.
        const isCommentsDisabled = errorData?.error?.errors?.some(e => e.reason === 'commentsDisabled');
        if (isCommentsDisabled) {
          console.log(`Comments are disabled for video ID: ${videoId}. Skipping.`);
          continue;
        }

        console.error(`Error fetching YouTube comments for video ID: ${videoId}:`, errorData || error.message);
        // We log the error but don't throw it, so that one failing video doesn't stop the rest from processing
      }
    }

    console.log(`Finished scraping! Total comments collected: ${allFormattedData.length}`);
    
    fs.writeFileSync('/tmp/youtube_data.json', JSON.stringify(allFormattedData));
    allFormattedData.length = 0;
    
    return { success: true, saved_to: '/tmp/youtube_data.json' };
  },
})
