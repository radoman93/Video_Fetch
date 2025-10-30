# ExoClick Ad Integration Setup Guide

This guide will walk you through setting up your ExoClick account and configuring ad zones for maximum revenue on your video streaming platform.

## Step 1: Create ExoClick Account

1. **Sign up at ExoClick**
   - Go to [https://www.exoclick.com/signup/](https://www.exoclick.com/signup/)
   - Choose "Publisher" account type
   - Fill in your website details (your video streaming platform URL)
   - Complete email verification

2. **Add Your Website**
   - After login, go to "Sites" → "Add Site"
   - Enter your domain name
   - Select site category: "Adult" or "Mainstream" (based on your content)
   - Wait for approval (usually 24-48 hours for adult content sites)

## Step 2: Create Ad Zones

Once your site is approved, create the following ad zones:

### 2.1 Popunder Ads (Highest Revenue)

**For Desktop:**
1. Go to "Zones" → "Create New Zone"
2. Select format: **"Popunder"**
3. Zone name: "Desktop Popunder - Entry"
4. Frequency cap: 1 per 24 hours (recommended)
5. Copy the **Zone ID** (format: `5759858`)

**For Mobile:**
1. Create another popunder zone
2. Zone name: "Mobile Popunder - Entry"
3. Target: Mobile devices only
4. Copy the **Zone ID** - 5759864

### 2.2 Banner Ads

**Create 3 banner zones:**

**Desktop Leaderboard (728x90):**
1. Format: "Banner" → Size: 728x90
2. Zone name: "Desktop Leaderboard 728x90"
3. Copy the **Zone ID** - 5759860

**Medium Rectangle (300x250):**
1. Format: "Banner" → Size: 300x250
2. Zone name: "Desktop Rectangle 300x250"
3. Copy the **Zone ID** - 5759862

**Mobile Banner (320x100):**
1. Format: "Banner" → Size: 320x100
2. Zone name: "Mobile Banner 320x100"
3. Target: Mobile devices only
4. Copy the **Zone ID** - 5759866

### 2.3 Native Ads

1. Go to "Zones" → "Create New Zone"
2. Select format: **"Native"**
3. Zone name: "Native Video Grid Ads"
4. Choose native ad style (recommendation: "In-Feed")
5. Customize styling to match your video thumbnails
6. Copy the **Zone ID** - 5759868

### 2.4 Video Pre-roll/Mid-roll Ads

**Instream Video Ad:**
1. Format: "Instream Video"
2. Zone name: "Video Pre-roll"
3. Max duration: 15-30 seconds (recommended)
4. Skippable: After 5 seconds (optional but recommended for UX)
5. Copy the **Zone ID** -5759870

**Mid-roll Video Ad (Optional):**
1. Create another instream video zone
2. Zone name: "Video Mid-roll"
3. Copy the **Zone ID**

## Step 3: Configure Environment Variables

Create or update your `frontend/.env.local` file with all your Zone IDs:

```bash
# ExoClick Ad Zone IDs

# Popunder Zones
NEXT_PUBLIC_EXOCLICK_POPUNDER_DESKTOP=your_desktop_popunder_zone_id
NEXT_PUBLIC_EXOCLICK_POPUNDER_MOBILE=your_mobile_popunder_zone_id

# Banner Zones
NEXT_PUBLIC_EXOCLICK_BANNER_728x90=your_leaderboard_zone_id
NEXT_PUBLIC_EXOCLICK_BANNER_300x250=your_rectangle_zone_id
NEXT_PUBLIC_EXOCLICK_BANNER_320x100=your_mobile_banner_zone_id

# Native Ad Zone
NEXT_PUBLIC_EXOCLICK_NATIVE=your_native_zone_id

# Video Ad Zones
NEXT_PUBLIC_EXOCLICK_VIDEO_PREROLL=your_preroll_zone_id
NEXT_PUBLIC_EXOCLICK_VIDEO_MIDROLL=your_midroll_zone_id

# ExoClick Account ID (found in your account settings)
NEXT_PUBLIC_EXOCLICK_ACCOUNT_ID=your_account_id
```

**Important:** Replace `your_*_zone_id` with actual Zone IDs from ExoClick dashboard.

## Step 4: Verify Integration

1. **Start your development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Test each ad placement:**
   - Open your site in browser
   - Check browser console for any ExoClick errors
   - Navigate to different pages (homepage, video player, search)
   - Verify ads are loading in correct positions
   - Test popunders (should fire once per session)
   - Test video pre-roll (play a video to trigger)

3. **Use ExoClick Dashboard:**
   - Go to "Statistics" → "Real-time"
   - Verify impression counts are increasing
   - Check for any errors or warnings

## Step 5: Optimize for Maximum Revenue

### Recommended Settings in ExoClick Dashboard:

1. **Enable Auto-Optimization:**
   - Go to zone settings → Enable "Auto-optimize"
   - This uses ExoClick's AI to serve highest-paying ads

2. **Set Floor Prices:**
   - Popunders: $3-5 CPM minimum
   - Video Pre-roll: $5-8 CPM minimum
   - Banners: $1-2 CPM minimum
   - Native: $2-3 CPM minimum

3. **Geographic Targeting:**
   - Tier 1 countries (US, UK, CA, AU) pay highest
   - Consider setting higher floor prices for Tier 1 traffic

4. **Frequency Caps:**
   - Popunders: 1 per 24 hours (avoid user annoyance)
   - Banners: Unlimited (they refresh automatically)
   - Video Pre-roll: 1 per video view

## Troubleshooting

### Ads Not Showing?

1. **Check Zone IDs:** Verify all IDs in `.env.local` are correct
2. **Check Browser Console:** Look for JavaScript errors
3. **Ad Blockers:** Disable ad blockers for testing
4. **ExoClick Approval:** Ensure your site is approved in ExoClick dashboard
5. **Fill Rate:** New zones may have low fill rate initially (improves over 24-48 hours)

### Low Revenue?

1. **Traffic Quality:** ExoClick pays more for Tier 1 countries
2. **Ad Viewability:** Ensure ads are visible in viewport
3. **Zone Performance:** Check ExoClick stats to see which zones perform best
4. **Floor Prices:** May be set too high, try lowering temporarily
5. **Competition:** More advertisers = higher CPMs (improves over time)

## Expected Revenue (Estimates for Adult Content)

Based on high revenue strategy with all ad formats:

| Ad Type | CPM Range | Priority |
|---------|-----------|----------|
| Popunders | $3-8 | Highest |
| Video Pre-roll | $5-15 | Very High |
| Native Ads | $2-5 | High |
| Banner 728x90 | $1-4 | Medium |
| Banner 300x250 | $1-4 | Medium |

**Estimated Total CPM:** $15-30+ (combined across all formats)

**Example:** 100,000 daily visitors × $20 CPM average = $2,000/day = $60,000/month potential revenue

## Support

- **ExoClick Support:** support@exoclick.com
- **Documentation:** https://www.exoclick.com/publisher-support/
- **Dashboard:** https://admin.exoclick.com/

## Next Steps

Once you have all Zone IDs configured:
1. Restart your development server
2. Test all ad placements thoroughly
3. Deploy to production
4. Monitor revenue in ExoClick dashboard
5. A/B test different placements and formats
6. Optimize based on performance data

**Important:** Always comply with ExoClick's terms of service and applicable advertising regulations in your jurisdiction.
