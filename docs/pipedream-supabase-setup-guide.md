# Pipedream → Supabase Setup Guide

This guide details how to set up Pipedream as your data ingestion engine, pulling reviews and comments from external sources (YouTube, Reddit, Play Store, App Store) and writing them directly into your Supabase database.

## 1. Supabase Preparation

Before setting up Pipedream, you need a destination table in Supabase to receive the data.

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** and create your `raw_snippets` table:

```sql
CREATE TABLE raw_snippets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source text NOT NULL,
  text text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  scraped_at timestamp with time zone DEFAULT now()
);
```

3. Go to **Project Settings -> API** and copy your **Project URL** and **Service Role Key** (since Pipedream acts as a backend server, you can use the service_role key to bypass Row-Level Security, or the anon key if you prefer standard access).

## 2. Pipedream Workflow Setup

1. Create a free account at [pipedream.com](https://pipedream.com).
2. Click **New Workflow**.
3. **Trigger**: Select **Schedule**. You can set it to run daily (e.g., midnight) or manually for your assessment.

### 2a. Fetching Data
Pipedream offers pre-built integrations as well as Node.js/Python code blocks.

*   **For Reddit / YouTube:** Use the built-in Pipedream apps. Simply search for "Reddit" or "YouTube Data API" and select the trigger or action (e.g., "Search Posts" or "Get Comments").
*   **For Play Store / App Store:** Since there are no native Pipedream apps for scraping these, add a **Node.js code step**. 
    You can import NPM packages directly in Pipedream:
    ```javascript
    import gplay from 'google-play-scraper';
    
    export default defineComponent({
      async run({ steps, $ }) {
        const reviews = await gplay.reviews({
          appId: 'com.myntra.android',
          sort: gplay.sort.NEWEST,
          num: 100
        });
        return reviews.data;
      },
    })
    ```

### 2b. Connecting to Supabase

Pipedream has a native Supabase integration.

1. Add a new step: Search for **Supabase**.
2. Select the action: **Insert Row** (or **Insert Multiple Rows**).
3. **Connect Account:** Provide your Supabase Project URL and API Key (from Step 1).
4. **Table Name:** Enter `raw_snippets`.
5. **Data:** Map the output from your previous scraping steps into the Supabase columns. For example, pass the review text into the `text` column, and the source into the `source` column.

## 3. Sharing Your Workflow for Assessment

Pipedream workflows can be easily shared as a public link:

1. In the top right of your Pipedream workflow editor, find the **Share** button.
2. Toggle the workflow to **Public**.
3. Copy the URL.
4. Anyone who clicks the link will be able to see the visual layout of your workflow, your code blocks, and the sequence of actions. **They will not be able to see your private API keys or Supabase credentials.**

## 4. Integration with the MVP

Once the data lands in Supabase, your Part A FastAPI backend (or Part B) simply queries the `raw_snippets` table using the standard Supabase Python client. Pipedream runs autonomously in the background on its schedule.
