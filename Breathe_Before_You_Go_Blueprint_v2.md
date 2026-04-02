**PROJECT BLUEPRINT**

**Breathe Before You Go**

An Asia-Wide Air Quality Travel & Health Intelligence Map

*When and where is it safe to breathe?*

+----------------------------+---------------------------+
| Author                     | Timeline                  |
|                            |                           |
| **Kino**                   | **Summer 2026**           |
|                            |                           |
| Data Scientist & Developer | 10 Weeks • Solo Developer |
+----------------------------+---------------------------+

Version 2.0 • April 2026 • Revised after peer review

# Executive Summary

Breathe Before You Go is an interactive data visualization platform that
maps the air quality rhythms of major Asian cities, translating raw
pollution data into actionable health intelligence for travelers,
expats, and local communities.

The platform combines real-time air quality sensor data from OpenAQ,
seasonal health outbreak patterns from WHO, and community-level impact
metrics to answer one question: when and where is it safe to breathe?

Unlike existing AQI dashboards that show numbers in isolation, this
project frames each city as a "Breathing Biography" --- a narrative data
portrait showing how a city's air quality shifts across seasons, which
neighborhoods bear the worst burden, and what that means for human
health in tangible terms.

+----------------------------------------------------------------------+
| **Why This Matters**                                                 |
|                                                                      |
| • Air pollution is the single greatest environmental health risk     |
| globally, responsible for an estimated 6.7 million premature deaths  |
| per year.                                                            |
|                                                                      |
| • Asia bears a disproportionate burden: 9 of the world's 10 most     |
| polluted capital cities are in Asia.                                 |
|                                                                      |
| • Existing tools show AQI numbers, but fail to translate data into   |
| decisions people can act on --- when to exercise outdoors, when to   |
| visit, which neighborhoods to choose.                                |
|                                                                      |
| • Seasonal patterns (burning season, monsoon, Diwali, sandstorms)    |
| create predictable health risk windows that travelers and residents  |
| can plan around --- if the data is made visible.                     |
+----------------------------------------------------------------------+

# Revision Notes (v2.0)

This blueprint has been revised after peer review from a senior data
product designer. The following material changes were made:

+----------------------------------------------------------------------+
| **What Changed and Why**                                             |
|                                                                      |
| 1\. CITY SCOPE RESTRUCTURED --- Reduced from 15 "full" cities to a   |
| 3-tier model: 3 Deep cities (full scrollytelling), 7 Standard cities |
| (interactive viz + summary), 5 Data-Light cities (dashboard only).   |
| Addresses the real content bottleneck of writing 15 unique           |
| narratives.                                                          |
|                                                                      |
| 2\. HEALTH METRIC FRAMEWORK REBALANCED --- WHO AQI Guidelines are    |
| now the primary safety metric. Berkeley Earth cigarette equivalence  |
| retained as secondary engagement metric with explicit methodology    |
| caveats (acute vs. chronic exposure). The metric is peer-reviewed    |
| and cited by the World Economic Forum, but benefits from careful     |
| framing.                                                             |
|                                                                      |
| 3\. DATA FRESHNESS UX ADDED --- Every city page shows a Data         |
| Freshness indicator. If real-time fetch fails, users see: "Showing   |
| historical seasonal trends; real-time data currently unavailable."   |
| Prevents confusion between static and live data.                     |
|                                                                      |
| 4\. TIMELINE ADJUSTED --- Scrollytelling (highest-risk viz) moved    |
| earlier and given more time. Lung Clock gets explicit responsive     |
| fallback plan. Weeks rebalanced for D3 debugging reality.            |
|                                                                      |
| 5\. DUAL USER PATHS DESIGNED --- Two entry points: "Plan a Trip"     |
| (travel-centric, calendar-first) and "My City" (resident-centric,    |
| real-time-first). Same data, different framing.                      |
|                                                                      |
| 6\. TIMEZONE NORMALIZATION --- Pipeline now explicitly converts UTC  |
| to local timezone per city (e.g., UTC+9 for Seoul). Critical for     |
| "safe exercise window at 6 AM" accuracy.                             |
+----------------------------------------------------------------------+

+----------------------------------------------------------------------+
| **What We Kept After Verification**                                  |
|                                                                      |
| DUAL AUDIENCE --- Reviewer suggested dropping local community users. |
| We disagree: a travel-only tool is a feature; a dual-mode platform   |
| is a product. The fix is information architecture (two entry         |
| points), not scope reduction.                                        |
|                                                                      |
| 15 CITIES ON THE MAP --- All 15 cities remain in the dataset because |
| the continental map requires geographic coverage for the "migrating  |
| pollution" story. The 3-tier model addresses content depth without   |
| shrinking the map.                                                   |
|                                                                      |
| CIGARETTE METRIC --- Reviewer called this "sensationalist." After    |
| verification: Berkeley Earth's methodology compares observed death   |
| burdens (not PM2.5 mass), relies on Pope et al. (2016), and is       |
| widely cited. The issue is framing, not the metric itself. We add    |
| disclaimers, not removal.                                            |
+----------------------------------------------------------------------+

# The Problem

## What Exists Today

Current air quality tools (IQAir, AirVisual, government AQI sites)
provide real-time readings. But they share three critical limitations:

1.  **No seasonal context.** A PM2.5 reading of 80 in Bangkok in March
    means something very different than 80 in July. The first is part of
    a months-long burning season; the second is a temporary spike.
    Current tools show today's number with no seasonal framing.

2.  **No health translation.** PM2.5 of 55 μg/m³ means nothing to most
    people. "Equivalent to smoking 2.5 cigarettes today" or "1.2 years
    of life expectancy lost if sustained" is immediately understandable.

3.  **No travel planning layer.** Nobody cross-references AQI data when
    booking a trip. The information exists but is never presented in a
    decision-useful way for travelers.

## What This Project Adds

Breathe Before You Go fills these gaps by combining three layers that no
existing tool integrates:

+----------------------+----------------------+----------------------+
| Layer 1              | Layer 2              | Layer 3              |
|                      |                      |                      |
| **Air Quality        | **Health Context     | **Human              |
| Engine**             | Layer**              | Translation**        |
+======================+======================+======================+
| Real-time + 5-year   | WHO outbreak data,   | WHO AQI color-coded  |
| historical PM2.5,    | seasonal respiratory | safety bands         |
| PM10, NO₂, O₃ from   | illness patterns,    | (primary).           |
| OpenAQ sensors       | burning season /     | Cigarettes-per-day   |
| across 15 Asian      | monsoon / sandstorm  | equivalence          |
| cities. Pre-computed | calendars. WHO AQI   | (secondary, with     |
| seasonal profiles.   | guideline thresholds | methodology          |
|                      | as primary safety    | disclaimer). Life    |
|                      | standard.            | expectancy impact,   |
|                      |                      | safe outdoor         |
|                      |                      | exercise windows,    |
|                      |                      | best-month-to-visit. |
+----------------------+----------------------+----------------------+

# Target Users & Use Cases

### 1. Travelers Planning Trips to Asia

Use case: "I'm planning a two-week trip to Thailand and Vietnam in
February. When and where should I go to avoid hazardous air?" The
platform shows that Chiang Mai in February is deep in burning season
(PM2.5 often exceeds 150), while southern Thailand and coastal Vietnam
are clear.

### 2. Expats & Long-Term Residents

Use case: "I've been living in Jakarta for three years. How much has the
air quality actually cost me in health terms?" The Breathing Biography
page shows cumulative exposure estimates and neighborhood-level variance
within the city.

### 3. Health-Conscious Communities

Use case: "When can I safely run outdoors this week?" The safe exercise
window feature shows hourly AQI forecasts and recommends optimal outdoor
activity times.

### 4. Data Journalists & Researchers

Use case: "Show me the equity dimension --- which neighborhoods in Delhi
bear 3x the pollution of wealthy areas?" The platform provides
downloadable data and embeddable visualizations for storytelling.

# Health Metric Framework

## Primary Metric: WHO AQI Guidelines

The WHO Global Air Quality Guidelines (2021) provide the authoritative
safety thresholds. All visualizations use WHO color bands as the default
safety indicator: green (0--15 μg/m³ PM2.5), yellow (15.1--25), orange
(25.1--50), red (50.1--100), purple (100+). These drive the safe
exercise window feature and all health advisory text.

## Secondary Metric: Cigarette Equivalence (Berkeley Earth)

The Berkeley Earth conversion (22 μg/m³ PM2.5 ≈ 1 cigarette/day) is used
as an engagement tool. This is based on comparing observed death burdens
from PM2.5 against observed death burdens from smoking (not comparing
particle mass). The methodology relies on Pope et al. (2016) and has
been cited by the World Economic Forum and used in the "Sh\*\*t I Smoke"
app.

+----------------------------------------------------------------------+
| **Methodology Disclaimer (Shown on Every Page Using This Metric)**   |
|                                                                      |
| The cigarette equivalence is a statistical communication tool, not a |
| clinical diagnosis. Key differences:                                 |
|                                                                      |
| • Dosage: A smoker receives high-dose bursts; air pollution acts     |
| continuously at lower concentrations.                                |
|                                                                      |
| • Composition: Cigarette smoke contains 7,000+ compounds; PM2.5      |
| composition varies by source.                                        |
|                                                                      |
| • Acute vs. chronic: A 14-day trip at 44 μg/m³ is NOT equivalent to  |
| smoking 28 cigarettes. Short-term exposure causes irritation;        |
| long-term exposure drives cardiovascular disease and cancer.         |
|                                                                      |
| • This compares population-level mortality risk, not individual      |
| health outcomes.                                                     |
+----------------------------------------------------------------------+

# City Coverage: 3-Tier Content Model

All 15 cities appear on the continental map and have data pipelines.
Content depth varies by tier to ensure quality over quantity.

## Tier 1 --- Deep Cities (3): Full Scrollytelling Biography

Bangkok (home city, deepest familiarity), Delhi (world's most dramatic
AQ narrative), Chiang Mai (extreme seasonality). These get 6-section
scrollytelling pages with custom narratives.

## Tier 2 --- Standard Cities (7): Interactive Viz + Summary

Hanoi, Jakarta, Seoul, Beijing, Kathmandu, Dhaka, Ulaanbaatar. All 6
interactive visualizations plus a 500--800 word research-backed summary.
Data-driven, not story-driven.

## Tier 3 --- Data-Light Cities (5): Dashboard Only

Manila, Ho Chi Minh City, Taipei, Singapore, Mumbai. Breathing Calendar,
Lung Clock, and Cigarette Counter only. No narrative text. Can be
upgraded post-launch.

  **City**               **Country**   **Key AQ Story**                    **Peak Risk Season**
  ---------------------- ------------- ----------------------------------- ----------------------
  **Bangkok**            Thailand      Northern crop burning smoke         Feb -- Apr
  **Chiang Mai**         Thailand      Worst burning season in SE Asia     Feb -- Apr
  **Delhi**              India         Diwali + winter inversion trap      Oct -- Feb
  **Hanoi**              Vietnam       Coal plant + motorbike emissions    Nov -- Mar
  **Jakarta**            Indonesia     Dry season peat fires / haze        Jul -- Oct
  **Seoul**              South Korea   Yellow dust from Gobi Desert        Mar -- May
  **Beijing**            China         Winter heating coal combustion      Nov -- Feb
  **Manila**             Philippines   Traffic + industrial density        Dec -- May
  **Dhaka**              Bangladesh    Brick kiln + vehicle emissions      Nov -- Mar
  **Kathmandu**          Nepal         Valley traps winter pollution       Nov -- Feb
  **Ho Chi Minh City**   Vietnam       Dry season + construction dust      Dec -- Apr
  **Taipei**             Taiwan        Cross-strait industrial pollution   Oct -- Mar
  **Singapore**          Singapore     Transboundary haze episodes         Jun -- Oct
  **Mumbai**             India         Construction + traffic + burning    Nov -- Feb
  **Ulaanbaatar**        Mongolia      Coal ger district heating           Oct -- Apr

# Key Visualizations & Interactive Features

Every visualization is designed around one principle: data should help
people make decisions, not just inform them. Each feature answers a
specific question a real user would ask.

## 1. The Breathing Calendar --- Annual AQI Heatmap

**User question:** *"What month should I visit this city?"*

A 12-month × 31-day heatmap grid for each city showing daily average
PM2.5, color-coded from green (good) through amber (moderate) to deep
red (hazardous). Five years of historical data stacked to show the
typical seasonal pattern. Users hover over any day to see the exact
reading and the "cigarettes equivalent" for that day.

**Build risk: LOW.** Standard D3 heatmap. Focus effort on hover states
and mobile touch targets. This is the project's strongest, most unique
asset.

**Interaction:** Toggle between years to see if the pattern is
consistent, or if a city is improving or worsening.

## 2. The Lung Clock --- Hourly Safe Window Dial

**User question:** *"When can I exercise outside today?"*

A 24-hour radial clock visualization showing hourly PM2.5 levels for the
current day. Green arcs indicate safe outdoor activity windows; red arcs
indicate periods to stay indoors. Overlaid with sunrise/sunset times and
typical peak traffic hours.

**Build risk: MEDIUM.** D3 radial charts are finicky with responsive
design. Mitigation: build as fixed 400px SVG, center-aligned, with a
simplified linear timeline fallback on screens below 480px.

**Interaction:** Select activity type (jogging, walking, cycling) to see
adjusted thresholds --- runners inhale 5--10x more air per minute than
walkers.

## 3. The Cigarette Counter --- Cumulative Exposure Meter

**User question:** *"How bad is this for me, in terms I can actually
feel?"*

An animated odometer-style counter showing the cigarette-smoking
equivalence for the current AQI. Based on the Berkeley Earth conversion
(22 μg/m³ PM2.5 ≈ 1 cigarette/day). Includes a cumulative trip
calculator: "Your 14-day trip to Delhi in January was equivalent to
smoking 47 cigarettes." Every instance links to the methodology
disclaimer.

**Build risk: LOW.** Simple CSS counter animation + React state for trip
inputs. High engagement-to-effort ratio.

**Interaction:** Enter trip dates and cities to compute personal
cumulative exposure across a multi-city itinerary.

## 4. The City Breathing Biography --- Scrollytelling Narrative (Tier 1 Only)

**User question:** *"What's the full air quality story of this city?"*

A long-form scrollytelling page for each Tier 1 city (Bangkok, Delhi,
Chiang Mai), combining animated charts, maps, and narrative text.
Structure: the city's annual breathing rhythm → what causes it (crop
fires, traffic, geography) → which neighborhoods are worst hit → how it
compares to peer cities → the human health cost.

**Build risk: HIGH.** Intersection Observer + D3 scroll-triggered
transitions = many hours of debugging. Mitigation: build Bangkok first
as prototype (Weeks 5--6). Use step-based transitions, not continuous.
Allocate 3 full days for IO debugging. Fallback: replace with static
long-form page + anchored charts if debugging spirals.

**Interaction:** Scroll-triggered animations that reveal each layer of
the story. Share-optimized cards for each key finding.

## 5. The Asia Breathing Map --- Continental Overview

**User question:** *"Which Asian city has the cleanest air right now?"*

A Mapbox GL JS map of Asia with animated breathing circles (pulsing at
different rates based on AQI severity) at each city location. A month
slider lets users scrub through the year to see the continental air
quality rhythm --- pollution migrating from region to region with the
seasons.

**Build risk: MEDIUM.** Mapbox GL JS is performant, but the month slider
must debounce to prevent 15 simultaneous re-renders. Use
requestAnimationFrame for smooth scrubbing.

**Interaction:** Click any city to enter its Breathing Biography. Use
the month slider to find the best time to travel anywhere in Asia.

## 6. The Life Expectancy Toll --- Equity Bar Chart

**User question:** *"How many years of life is air pollution costing
people in each city?"*

A horizontal bar chart showing estimated years of life expectancy lost
due to air pollution for each city, based on the AQLI methodology.
Color-coded by severity. Includes a comparison to other health risks
(smoking, alcohol, traffic accidents) to put air pollution in context.

**Build risk: LOW.** Standard D3 horizontal bar chart. Easily
templatized across all 15 cities.

**Interaction:** Toggle between "average resident" and "worst
neighborhood" to reveal intra-city equity gaps.

## 7. Data Freshness Indicator (New in v2.0)

**User question:** *"Is this data current or am I looking at old
information?"*

A small status badge on every city page showing data recency. Three
states: green dot "Live --- updated X minutes ago" (client-side OpenAQ
fetch succeeded), amber dot "Delayed --- last updated X hours ago"
(cached data), red dot "Historical only --- showing seasonal trends"
(API unreachable). This prevents confusion between the real-time pulsing
map and the static biographical content.

**Build risk: LOW.** Simple React state tracking fetch success/failure +
timestamp comparison.

+----------------------------------------------------------------------+
| **Dual Entry Point Design (New in v2.0)**                            |
|                                                                      |
| The platform serves two audiences through two navigation paths       |
| sharing the same data:                                               |
|                                                                      |
| • "Plan a Trip" (Travel Mode): Breathing Calendar first, Best Month  |
| badge, Trip Calculator. For travelers deciding when/where to go.     |
|                                                                      |
| • "My City" (Resident Mode): Lung Clock first, real-time safe        |
| exercise windows, hourly forecast. For locals deciding when to go    |
| outside today.                                                       |
|                                                                      |
| Both paths lead to the same city page but with different default viz |
| ordering and framing.                                                |
+----------------------------------------------------------------------+

# Technical Architecture

## Stack Overview

Every technology choice is driven by three constraints: one developer,
one MacBook, zero budget for cloud compute.

  **Layer**                **Technology**                              **Why This Choice**
  ------------------------ ------------------------------------------- ------------------------------------------------------------
  **Data Pipeline**        Python 3.12 (Pandas, Requests, GeoPandas)   Fast prototyping, native JSON/CSV, your strongest language
  **Static Data Store**    Pre-computed JSON files in /public          Zero server cost, instant load, Git-versioned
  **Real-time Layer**      OpenAQ API v3 (client-side fetch)           Free tier, 60 req/min rate limit, CORS-enabled
  **Frontend Framework**   Next.js 14 (App Router)                     SSG for city pages, API routes for light data transform
  **Visualization**        D3.js + custom React components             Full control over the Breathing Calendar, Lung Clock, etc.
  **Map Engine**           Mapbox GL JS (free tier)                    Best vector tile performance, built-in globe view
  **Styling**              Tailwind CSS                                Rapid iteration, consistent design system
  **Deployment**           Vercel (free hobby tier)                    Auto-deploy from Git, global CDN, zero config
  **Domain**               Custom domain (optional)                    breathebeforeyougo.com or similar

## Data Pipeline Architecture

The pipeline runs locally on your MacBook. No cloud infrastructure
needed. Data is fetched, processed, and exported as static JSON files
that the Next.js app serves directly.

+----------------------------------------------------------------------+
| **Pipeline Flow**                                                    |
|                                                                      |
| 1\. FETCH → Python scripts pull historical data from OpenAQ API v3   |
| (batch, rate-limited 60 req/min), WHO GHO OData API, and disease.sh  |
|                                                                      |
| 2\. NORMALIZE → Convert all timestamps from UTC to each city's local |
| timezone (UTC+7 Bangkok, UTC+9 Seoul, UTC+5:30 Delhi, etc.).         |
| Critical for "safe exercise at 6 AM" accuracy.                       |
|                                                                      |
| 3\. COMPUTE → Generate seasonal profiles (monthly medians, P90,      |
| P10), WHO AQI category distributions, cigarette equivalences, life   |
| expectancy estimates                                                 |
|                                                                      |
| 4\. VALIDATE → Automated checks: no missing months, timezone         |
| correctness, PM2.5 values in sane range (0--999)                     |
|                                                                      |
| 5\. EXPORT → Output per-city JSON files: city-profile.json,          |
| hourly-latest.json, seasonal-heatmap.json                            |
|                                                                      |
| 6\. DEPLOY → JSON files live in Next.js /public/data/ directory,     |
| served as static assets via Vercel CDN                               |
+----------------------------------------------------------------------+

## Data Sources Detail

  **Source**            **Data Provided**                                 **Format**                **Cost**
  --------------------- ------------------------------------------------- ------------------------- -------------------------
  OpenAQ API            PM2.5, PM10, NO₂, O₃, SO₂ from ground sensors     REST API → JSON           Free (API key required)
  WHO GHO OData         Country-level health indicators, disease burden   OData → JSON              Free, no key
  disease.sh            Outbreak data, influenza trends                   REST API → JSON           Free, no key
  Berkeley Earth        PM2.5-to-cigarette conversion factor              Research paper (static)   N/A (formula)
  AQLI (U of Chicago)   Life expectancy methodology                       Research paper (static)   N/A (formula)
  Natural Earth Data    Country boundaries, city points                   GeoJSON / Shapefile       Free, public domain

# Week-by-Week Execution Plan

The plan is structured in four phases: Foundation (Weeks 1--2), Core
Build (Weeks 3--6), Polish & Scale (Weeks 7--8), and Launch (Weeks
9--10). Each week has concrete deliverables.

**PHASE 1: FOUNDATION**

  **WEEK 1**        **Data Pipeline & Exploration**                                                                                                     Week 1
  ----------------- ----------------------------------------------------------------------------------------------------------------------------------- --------------------
  Day 1--2          Set up project repo, Python venv, Next.js scaffold. Register OpenAQ API v3 key.                                                     GitHub, pip, npx
  Day 2--3          Write fetch script for Bangkok PM2.5 (proof of concept). Verify UTC → UTC+7 timezone handling.                                      Python, Requests
  Day 3--4          Audit OpenAQ sensor coverage for all 15 cities: sensors per city, data gaps, date ranges. Drop any city with \< 2 active sensors.   Pandas, Jupyter
  Day 4--5          Write batch fetch for all 15 cities (5-year PM2.5, PM10, NO₂). Implement rate limiting (60 req/min).                                Python, asyncio
  Day 5--7          Data profiling: monthly medians, seasonal peaks, data completeness. Finalize city list and tier assignments.                        Pandas, Matplotlib
  **DELIVERABLE**   **15-city raw data archive + data quality report. Final city list and tier assignments confirmed.**                                 

  **WEEK 2**        **Computed Metrics & JSON Export**                                                                               Week 2
  ----------------- ---------------------------------------------------------------------------------------------------------------- ------------------
  Day 1--2          Build seasonal profile generator: monthly P10/P25/P50/P75/P90 per city. Timezone-aware (UTC to local).           Pandas, NumPy
  Day 2--3          Implement WHO AQI category distribution (% of days in each band per month). This is the primary safety metric.   Python
  Day 3--4          Implement cigarette equivalence (22 μg/m³ = 1 cig/day) + AQLI life expectancy (10 μg/m³ ≈ 0.98 yr lost).         Python
  Day 4--5          Fetch WHO + disease.sh data. Build seasonal health risk calendar (respiratory illness peaks per city).           Python, Requests
  Day 5--7          Export structured JSON. Add validation script: range checks, timezone correctness, completeness.                 Python, JSON
  **DELIVERABLE**   **Complete static JSON data layer for all 15 cities. Validation script passing.**                                

**PHASE 2: CORE BUILD**

  **WEEK 3**        **Design System & Continental Map**                                                                  Week 3
  ----------------- ---------------------------------------------------------------------------------------------------- ------------------
  Day 1--2          Design color system (WHO AQI bands as primary palette), typography, Tailwind config.                 Tailwind, Figma
  Day 2--3          Build landing page: hero, dual entry points ("Plan a Trip" / "My City"), city grid.                  Next.js, React
  Day 3--5          Build Asia Breathing Map (Mapbox GL JS): pulsing markers, debounced month slider.                    Mapbox GL JS, D3
  Day 5--7          Wire real-time OpenAQ fetch to markers (SWR with fallback). Implement Data Freshness indicator.      React, SWR
  **DELIVERABLE**   **Live landing page with interactive Asia map, dual entry point navigation, Data Freshness badge**   

  **WEEK 4**        **Breathing Calendar + Cigarette Counter**                                                                              Week 4
  ----------------- ----------------------------------------------------------------------------------------------------------------------- ------------------------
  Day 1--3          Build Breathing Calendar (D3 heatmap): 12×31 grid, WHO color scale, year toggle, hover tooltips with disclaimer link.   D3.js, React
  Day 3--4          Add "Best Month to Visit" badge: lowest median AQI + lowest variance months.                                            Derived from JSON
  Day 4--5          Build Cigarette Counter odometer + Trip Calculator (multi-city date range input).                                       CSS animation, React
  Day 5--6          Build city page template with both viz + Data Freshness badge + methodology disclaimer.                                 Next.js dynamic routes
  Day 6--7          Test Bangkok city page end-to-end. Fix mobile layout for Calendar (horizontal scroll if needed).                        Chrome DevTools
  **DELIVERABLE**   **Bangkok city page with Breathing Calendar + Cigarette Counter, fully responsive**                                     

  **WEEK 5**        **Lung Clock + Scrollytelling Prototype**                                                                    Week 5
  ----------------- ------------------------------------------------------------------------------------------------------------ ------------
  Day 1--3          Build Lung Clock: D3 radial chart (fixed 400px SVG), 24 arcs, WHO color bands, sunrise overlay.              D3.js, SVG
  Day 3--4          Add activity selector (walk/jog/cycle) with adjusted thresholds. Build linear fallback for \< 480px.         React, CSS
  Day 4--5          Build Life Expectancy Toll bar chart: horizontal bars, equity toggle, peer comparison.                       D3.js
  Day 5--7          Begin scrollytelling framework: Intersection Observer + D3 transitions. Build 2 of 6 sections for Bangkok.   React, D3
  **DELIVERABLE**   **Lung Clock + Life Expectancy chart on Bangkok page. Scrollytelling prototype (2 sections) functional.**    

  **WEEK 6**        **Complete Bangkok Biography (MVP Gate)**                                                                               Week 6
  ----------------- ----------------------------------------------------------------------------------------------------------------------- --------------------
  Day 1--3          Complete all 6 scrollytelling sections for Bangkok. Debug IO timing and animation sequencing. Budget 3 days for this.   React, D3
  Day 3--5          Write Bangkok narrative: burning season origin story, neighborhood variance, historical trend, human cost.              Markdown, research
  Day 5--7          Full QA of Bangkok as complete Tier 1 city. Fix all edge cases. This is the "gold standard" page.                       Chrome, Safari
  **DELIVERABLE**   **Bangkok: complete Tier 1 city with all 7 visualizations + full scrollytelling. THE MVP GATE.**                        

**PHASE 3: POLISH & SCALE**

  **WEEK 7**        **Scale: Tier 2 + Tier 3 Cities**                                                             Week 7
  ----------------- --------------------------------------------------------------------------------------------- ------------------------------
  Day 1--2          Templatize city page: make all components fully data-driven from per-city JSON.               Next.js, React
  Day 2--3          Generate all 12 remaining city pages (7 Tier 2 + 5 Tier 3) via SSG.                           Next.js generateStaticParams
  Day 3--5          Write 500--800 word research-backed summaries for 7 Tier 2 cities (not AI filler).            Markdown, research
  Day 5--7          QA all pages: data rendering, mobile responsive, edge cases (missing sensors, sparse data).   Chrome DevTools
  **DELIVERABLE**   **All 15 city pages live. Tier 2 with summaries; Tier 3 as data-only dashboards.**            

  **WEEK 8**        **Tier 1 Expansion + UX Polish**                                                                         Week 8
  ----------------- -------------------------------------------------------------------------------------------------------- ------------------------
  Day 1--3          Build Delhi + Chiang Mai scrollytelling biographies (adapt Bangkok template, write unique narratives).   React, Markdown
  Day 3--4          Mobile optimization: responsive layouts, touch-friendly interactions, Lung Clock linear fallback.        CSS, Tailwind
  Day 4--5          Accessibility audit: ARIA labels, color contrast (WCAG AA), keyboard navigation.                         Lighthouse, axe
  Day 5--6          Performance: lazy-load D3 charts, optimize JSON payloads, loading skeletons.                             Next.js dynamic import
  Day 6--7          Build "About" page: methodology (cigarette disclaimer), data sources, limitations, credits.              Markdown, Next.js
  **DELIVERABLE**   **3 Tier 1 cities complete. Production-ready, accessible, performant application.**                      

**PHASE 4: LAUNCH & STORYTELLING**

  **WEEK 9**        **Content & Launch Prep**                                                               Week 9
  ----------------- --------------------------------------------------------------------------------------- --------------------
  Day 1--2          Write project case study for portfolio: problem, process, decisions, outcomes           Markdown
  Day 2--3          Record 2-minute video walkthrough of the platform for portfolio / social sharing        Screen recording
  Day 3--4          Write Twitter/X thread telling the story of one city's air quality (Bangkok or Delhi)   Text + screenshots
  Day 4--5          Prepare README.md: technical documentation, setup guide, architecture diagram           Markdown, Mermaid
  Day 5--7          Final QA: cross-browser testing (Chrome, Safari, Firefox, mobile Safari)                BrowserStack free
  **DELIVERABLE**   **Launch-ready package: live site, case study, video, social content, README**          

  **WEEK 10**       **Launch & Community Outreach**                                                                     Week 10
  ----------------- --------------------------------------------------------------------------------------------------- ----------------
  Day 1--2          Deploy to production on Vercel with custom domain                                                   Vercel CLI
  Day 2--3          Submit to Product Hunt, Hacker News, relevant subreddits (r/dataisbeautiful, r/datavisualization)   Web
  Day 3--4          Share with data journalism communities: Pudding, Flowing Data, Data Viz Society                     Twitter, email
  Day 4--5          Reach out to air quality organizations: OpenAQ community, Clean Air Asia                            Email, Slack
  Day 5--7          Collect initial feedback, fix critical bugs, plan post-launch iteration roadmap                     GitHub Issues
  **DELIVERABLE**   **Live public launch with community engagement across 5+ platforms**                                

# Risk Register & Mitigations

  **Risk**                                          **Severity**   **Mitigation**                                                                                        **Fallback**
  ------------------------------------------------- -------------- ----------------------------------------------------------------------------------------------------- ---------------------------------------------------------------------
  OpenAQ API rate limits (60 req/min) or downtime   **Medium**     Cache all historical data locally during pipeline phase; real-time is additive                        Serve 100% static; show "Historical only" freshness badge
  Sparse sensor coverage in some cities             **High**       Pre-audit in Week 1; drop cities with \< 2 active sensors from final list                             Replace with nearby city or demote to Tier 3
  Scope creep beyond 10 weeks                       **High**       Bangkok is the MVP gate (Week 6). If not done, cut Tier 1 to Bangkok-only                             Launch with 1 Tier 1 + 7 Tier 2 + 7 Tier 3
  Scrollytelling debugging spiral                   **High**       Budget 3 full days for Intersection Observer. Use step-based, not continuous transitions              Replace scrollytelling with static long-form page + anchored charts
  Lung Clock radial chart responsive issues         **Medium**     Fixed 400px SVG, center-aligned. Tested at 360px, 768px, 1024px breakpoints                           Degrade to linear horizontal timeline on mobile
  Timezone normalization errors                     **High**       Validate in pipeline: spot-check 3 cities manually. Automated test: 6 AM local = correct UTC offset   Hard-code UTC offsets (no DST in most Asian cities)
  Cigarette metric credibility pushback             **Medium**     Methodology page with Berkeley Earth citation, acute/chronic disclaimer, Pope discrepancy note        Demote to tooltip-only; lead with WHO AQI bands
  Mapbox free tier limits                           **Low**        50K map loads/month is generous for a portfolio project                                               Switch to MapLibre GL JS (open-source fork)
  Data freshness confusion (static vs. live)        **Medium**     Data Freshness badge on every page with 3 states (live/delayed/historical)                            N/A --- already mitigated by design

# Success Metrics

The project's success is measured across three dimensions:

### Portfolio Impact

-   Demonstrates end-to-end data pipeline skills: API ingestion →
    timezone-aware processing → static export → interactive frontend

-   Showcases 7 distinct visualization types including Data Freshness
    indicator (D3, Mapbox, CSS animation)

-   Adds a continental-scale project to complement city-level (Traffy
    Fondue) and global-level (Silence Index) work

-   Dual user mode (Travel / Resident) demonstrates product thinking
    beyond data engineering

### Community Impact

-   Provides actionable air quality intelligence that existing tools
    don't offer

-   Translates abstract pollution numbers into human-understandable
    health terms

-   Creates a shareable resource for travel planning, health advocacy,
    and environmental journalism across Asia

### Technical Benchmarks

-   Lighthouse Performance score \> 90 on city pages

-   All visualizations responsive and functional on mobile (360px+)

-   WCAG AA accessibility compliance for all interactive components

# Post-Launch Stretch Goals

These are not in scope for the 10-week summer build, but represent
natural extensions if the project gains traction:

1.  **PurpleAir Integration.** Add community-owned low-cost sensors for
    higher neighborhood-level resolution within cities.

2.  **AI Trip Optimizer.** Given a set of cities and a date range,
    automatically suggest the optimal itinerary order to minimize total
    air pollution exposure.

3.  **Push Notifications.** Daily safe exercise window alerts for
    registered users in their city.

4.  **Multi-Language Support.** Thai, Vietnamese, Bahasa, Hindi, Korean,
    Japanese, Chinese translations for local community access.

5.  **Embed API.** Allow journalists and bloggers to embed Breathing
    Calendars or Cigarette Counters on their own sites.

*Let's build something people will actually breathe easier because of.*
