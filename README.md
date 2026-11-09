# DSA Forge: Master Your Craft

Build a production-quality web application called "DSA Forge".

IMPORTANT:

This is NOT a generic todo app, simple habit tracker, or basic LeetCode clone.

It is a focused DSA training and interview-preparation platform for two friends who are preparing together for software engineering jobs.

The goal is to help us systematically master Data Structures & Algorithms, maintain daily consistency, identify weak areas, improve problem-solving patterns, and become capable of clearing technical Online Assessments and DSA interview rounds.

The product philosophy is:

LEARN → SOLVE → ANALYZE → RECORD → REVIEW → RE-SOLVE → MASTER

The application must feel like a serious developer training platform, not a college project.

==================================================

1. CORE PRODUCT OBJECTIVE

==================================================

The platform must help two users:

1. Follow DSA topic-wise in a structured order.

2. Solve at least 3 problems every day.

3. Add problems from external platforms such as:

   - LeetCode

   - GeeksforGeeks

   - HackerRank

   - Codeforces

   - CodeChef

   - AtCoder

   - Other coding platforms

4. Track:

   - solved problems

   - attempted problems

   - failed problems

   - reattempts

   - difficulty

   - topic

   - pattern

   - time taken

   - hints used

   - number of attempts

   - confidence

   - understanding

   - time complexity

   - space complexity

   - mistakes

5. Compare progress between two friends WITHOUT creating a toxic leaderboard.

6. Detect weak topics and recommend what to practice next.

7. Build interview/OA readiness over time.

8. Create strong accountability between the two users.

==================================================

2. IMPORTANT DEVELOPMENT CONSTRAINT

==================================================

I am using Lovable FREE PLAN.

Therefore:

- Build the complete functional MVP in this first generation.

- Do NOT ask me unnecessary clarification questions.

- Do NOT split the initial implementation into multiple stages.

- Do NOT create unnecessary enterprise architecture.

- Keep the stack simple and reliable.

- Prefer Supabase for authentication and database.

- Use React + TypeScript.

- Use Tailwind CSS.

- Use shadcn/ui where useful.

- Use Lucide icons.

- Make the app responsive.

- Avoid unnecessary dependencies.

- Do not build a custom backend unless absolutely necessary.

- Use Supabase Auth and PostgreSQL.

- Use Row Level Security correctly.

- Do not expose service-role keys or secrets in frontend code.

IMPORTANT:

When Supabase is connected, generate all required database tables, relationships, indexes and RLS policies needed for the application.

The application must work even if no external coding-platform API is available.

External problem URLs should simply be stored and opened externally.

DO NOT scrape LeetCode, GFG, Codeforces or other websites.

==================================================

3. VISUAL DESIGN

==================================================

Create a premium developer-focused UI.

Design inspiration:

- modern SaaS dashboard

- GitHub contribution graph

- LeetCode productivity

- Linear

- Vercel

- modern developer tools

Do NOT copy their UI.

Use:

- dark-first interface

- optional light mode

- strong typography

- clean cards

- subtle gradients

- glass/blur only where useful

- excellent spacing

- responsive layouts

- smooth but restrained animations

- keyboard-friendly interactions

- accessible contrast

Primary visual feeling:

"Developer training command center."

Avoid:

- childish gamification

- excessive neon

- huge unnecessary illustrations

- clutter

- excessive animations

- generic dashboard templates

The dashboard should immediately answer:

"Am I improving?"

==================================================

4. APPLICATION STRUCTURE

==================================================

Create these main sections:

1. Dashboard

2. Problems

3. Roadmap

4. Daily Mission

5. Analytics

6. Weak Areas

7. Review Queue

8. Mock OA

9. Friends / Duo

10. Achievements

11. Profile

12. Settings

Main sidebar navigation:

Dashboard

Daily Mission

Problems

Roadmap

Review

Analytics

Mock OA

Duo

Achievements

Bottom/profile section:

Profile

Settings

Logout

==================================================

5. AUTHENTICATION

==================================================

Implement Supabase authentication.

Use:

- Email

- Password

- Email verification

Do NOT add Google login initially.

Create:

- Login

- Register

- Forgot password

- Reset password

- Email verification handling

After registration:

Ask the user for:

- name

- username

- preferred programming language

- current DSA level

- target role

- target companies (optional)

- daily target

- target interview date (optional)

Default daily target:

3 problems.

Allow changing it later.

==================================================

6. USER PROFILE

==================================================

Profile should contain:

Name

Username

Avatar

Preferred language

Current DSA level:

- Beginner

- Intermediate

- Advanced

Target role:

- Software Engineer

- SDE Intern

- Backend Developer

- Full Stack Developer

- Other

Daily problem target

Target companies

Interview target date

Current streak

Longest streak

Total solved

Total attempted

Average solving time

OA readiness score

Profile contribution heatmap

==================================================

7. DASHBOARD

==================================================

The dashboard is the most important screen.

Create a strong overview.

Top section:

Good morning, {name}

Dynamic motivational line based on progress.

Example:

"Consistency beats intelligence when intelligence is inconsistent."

Do NOT show the same quote every day.

Dashboard cards:

TODAY

- 3/3 problems

- today's progress

- current streak

TOTAL

- solved

- attempted

- re-solved

- accuracy

STREAK

- current streak

- longest streak

READINESS

- OA readiness percentage

- trend

Then:

------------------------------------------------

TODAY'S MISSION

------------------------------------------------

Show today's 3 recommended problems.

Each card:

- title

- platform

- difficulty

- topic

- pattern

- estimated time

- Solve button

- Mark Complete button

Progress:

2 / 3 completed

Progress bar.

------------------------------------------------

ACTIVITY HEATMAP

------------------------------------------------

GitHub-style contribution calendar.

Each day shows number of completed problems.

Allow:

- hover

- click

- date details

------------------------------------------------

TOPIC MASTERY

------------------------------------------------

Show topic progress:

Arrays       72%

Strings      58%

Linked List  43%

Binary Search 61%

Trees        24%

Graphs       12%

DP            8%

Use visual progress bars.

------------------------------------------------

WEAK AREAS

------------------------------------------------

Automatically identify weak areas.

Example:

Weak:

Dynamic Programming

Accuracy: 42%

Problems attempted: 12

Recommended action:

"Complete 3 beginner DP problems and re-solve 2 failed problems."

------------------------------------------------

RECENT ACTIVITY

------------------------------------------------

Show recent solved/attempted problems.

==================================================

8. DAILY MISSION

==================================================

This is one of the most important features.

Every day the system creates a 3-problem mission.

Default:

Problem 1:

Easy / concept reinforcement

Problem 2:

Medium / pattern application

Problem 3:

Medium / interview-style challenge

The system should consider:

- topics currently being studied

- weak areas

- previously failed problems

- difficulty

- previous performance

- recent problems

- review schedule

Avoid recommending the same problem repeatedly unless it is intentionally part of review.

Allow user to replace a recommendation.

Daily Mission should show:

Day

Date

Progress

Problems

Total estimated time

Difficulty mix

At completion:

Show a daily completion summary.

==================================================

9. PROBLEM DATABASE

==================================================

Create a unified problem model.

Each problem should contain:

id

title

platform

url

difficulty

topic

subtopic

pattern

tags

estimated_time

description

created_at

Supported platforms:

LeetCode

GeeksforGeeks

HackerRank

Codeforces

CodeChef

AtCoder

Other

Difficulty:

Easy

Medium

Hard

Topics:

Arrays

Strings

Hashing

Two Pointers

Sliding Window

Binary Search

Sorting

Linked List

Stack

Queue

Deque

Recursion

Backtracking

Trees

BST

Heap / Priority Queue

Greedy

Graphs

BFS

DFS

Topological Sort

Union Find

Trie

Dynamic Programming

Bit Manipulation

Math

Intervals

Prefix Sum

Monotonic Stack

Advanced

Patterns should be separate from topics.

Examples:

Two Pointers

Sliding Window

Fast & Slow Pointer

Prefix Sum

Binary Search on Answer

Merge Intervals

Monotonic Stack

Backtracking

Divide and Conquer

Greedy

BFS

DFS

Topological Sort

Memoization

Tabulation

etc.

==================================================

10. ADD PROBLEM

==================================================

Create a fast "Add Problem" interface.

User enters:

Problem URL

When possible:

extract basic information from URL/domain.

If automatic extraction is not possible, allow manual entry.

Fields:

Title

Platform

URL

Difficulty

Topic

Pattern

Estimated time

Tags

Important:

DO NOT scrape external platforms.

Store only metadata and URL.

After adding:

"Add to today's mission"

checkbox

"Add to roadmap"

checkbox

==================================================

11. PROBLEM DETAIL

==================================================

Problem page must be excellent.

Show:

Title

Platform

Difficulty

Topic

Pattern

External link

Buttons:

Open Problem

Start Timer

Mark Solved

Mark Attempted

Add to Review

Then a reflection form:

1. Did you solve it?

   - Yes independently

   - Yes with hint

   - Yes after seeing solution

   - No

2. Time taken

3. Number of attempts

4. Confidence:

   1–5

5. Difficulty felt:

   1–5

6. Hints used:

   0 / 1 / 2 / 3+

7. What was the key idea?

8. What mistake did you make?

9. Time complexity

10. Space complexity

11. Can you solve it again tomorrow?

   Yes / No

12. Personal notes

This reflection is VERY important.

The platform should prioritize understanding over merely counting solved problems.

==================================================

12. SOLUTION QUALITY TRACKING

==================================================

Do not treat:

"Accepted"

as equal to:

"I understand the problem."

Track mastery separately.

For every problem calculate:

Attempt Status

Understanding Score

Confidence Score

Recall Score

Complexity Understanding

Review Status

Mastery states:

Unseen

Attempted

Solved

Understood

Re-solved

Mastered

Mastered should require successful re-solving or strong review evidence.

==================================================

13. REVIEW SYSTEM

==================================================

Build a spaced-review system.

When a problem is solved, allow review scheduling.

Suggested review intervals:

Day 1

Day 3

Day 7

Day 14

Day 30

Allow the system to adjust based on confidence.

Low confidence:

review sooner.

High confidence:

review later.

Review page:

"Problems you should revisit today"

Each card:

Problem

Last solved

Confidence

Previous mistakes

Pattern

Button:

"Re-solve"

After re-solving:

Was it easier?

Did you remember the approach?

Time taken

Confidence now

==================================================

14. MISTAKE LOG

==================================================

Create a dedicated mistake system.

Mistake categories:

Concept misunderstanding

Pattern not recognized

Wrong approach

Edge case

Implementation bug

Syntax issue

Time management

Complexity mistake

Forgot formula

Off-by-one

Data structure misuse

Each solved/attempted problem can have multiple mistakes.

Analytics should identify recurring mistakes.

Example:

"You made 7 implementation mistakes in the last 30 problems."

"You frequently miss edge cases in binary search."

This is far more useful than a simple solved count.

==================================================

15. ROADMAP

==================================================

Create a structured DSA roadmap.

Use a sensible interview-focused progression:

Phase 1:

Programming + Complexity

Phase 2:

Arrays & Strings

Phase 3:

Hashing

Phase 4:

Two Pointers & Sliding Window

Phase 5:

Sorting & Searching

Phase 6:

Linked Lists

Phase 7:

Stack & Queue

Phase 8:

Binary Search

Phase 9:

Recursion & Backtracking

Phase 10:

Trees & BST

Phase 11:

Heap / Priority Queue

Phase 12:

Greedy

Phase 13:

Graphs

Phase 14:

Tries / Union Find

Phase 15:

Dynamic Programming

Phase 16:

Advanced Patterns

Each phase contains:

Topics

Concept checklist

Practice problems

Review problems

Mastery percentage

Allow roadmap progress.

Do not hardcode a copyrighted third-party sheet.

The roadmap should be our own interview-oriented structure.

==================================================

16. ANALYTICS

==================================================

Create serious analytics.

Metrics:

Problems solved

Problems attempted

Accuracy

Average solving time

Average time by difficulty

Easy/Medium/Hard distribution

Problems by platform

Problems by topic

Problems by pattern

Problems by week

Problems by month

Re-solve rate

Hint usage

First-attempt success rate

Review completion rate

Charts:

Weekly solved

Monthly solved

Topic mastery

Difficulty distribution

Solving time trend

Accuracy trend

Streak

Review performance

==================================================

17. WEAK AREA ENGINE

==================================================

This is a key differentiator.

Calculate weak areas using:

- low success rate

- low confidence

- high time taken

- repeated mistakes

- failed problems

- high hint usage

- poor re-solve performance

Do NOT simply say:

"Graphs = 20%"

Instead say:

"Graph traversal is currently weak because:

- 4/9 attempts failed

- average confidence 2.3/5

- 3 implementation mistakes

- average time 41 min

Recommended:

Practice BFS → DFS → shortest path."

Make recommendations actionable.

==================================================

18. OA READINESS SCORE

==================================================

Create a transparent readiness score from 0–100.

Do NOT pretend this predicts actual hiring.

It is an internal training metric.

Suggested components:

Consistency: 20%

Topic Coverage: 20%

Problem Solving: 20%

Medium Problem Performance: 15%

Re-solve / Retention: 10%

Speed: 10%

Mistake Reduction: 5%

Show the breakdown.

Example:

OA READINESS

67/100

Consistency      82

Coverage         61

Problem Solving  70

Medium           58

Retention        72

Speed            54

Mistakes         69

Then show:

"Your biggest improvement opportunity: Speed on Medium problems."

==================================================

19. MOCK OA MODE

==================================================

Create a timed mock Online Assessment mode.

User chooses:

30 min

45 min

60 min

90 min

Difficulty:

Easy

Easy + Medium

Medium

Mixed

Generate a set of problems from the local database.

During mock:

Timer

Problem list

Progress

Mark question

Submit

At the end:

Score

Problems solved

Accuracy

Time used

Difficulty breakdown

Weak topics

Mistakes

Show post-OA analysis.

Important:

Do not display answers during the mock.

==================================================

20. FRIEND DUO MODE

==================================================

This is the unique part of the application.

Two users can connect as friends.

Create a Duo dashboard.

Show:

Your progress

Friend's progress

Combined progress

Compare:

Problems solved this week

Current streak

Weekly target

Topic progress

Mock OA score

Average solving time

DO NOT make this toxic.

Use language like:

"You are 2 problems behind this week."

"Your friend completed today's mission."

"Push each other."

NOT:

"LOSER"

or overly aggressive competitive language.

Create:

Weekly Duo Goal

Example:

30 problems combined

Progress:

22 / 30

==================================================

21. ACCOUNTABILITY FEATURES

==================================================

Friend can see:

Daily mission completion

Weekly progress

Streak

Recent solved problems

Add lightweight reactions:

🔥

💪

👏

🚀

💯

Add "Nudge Friend".

Examples:

"Your friend is waiting for you."

"3 problems today. Let's finish."

"You're one problem away from today's target."

No real-time chat required for MVP.

==================================================

22. FRIEND LEADERBOARD

==================================================

Within the duo only:

This Week

Problems

Minutes practiced

Review completion

Mock score

Do NOT create a global ranking.

The purpose is accountability, not vanity.

==================================================

23. ACHIEVEMENTS

==================================================

Create meaningful achievements.

Examples:

First Blood

First solved problem

3-Day Streak

3 consecutive days

7-Day Warrior

7 day streak

50 Problems

50 solved

100 Problems

100 solved

Pattern Hunter

Master 5 patterns

Consistency King

30 days active

Re-Solver

Re-solve 25 problems

No Hint Hero

10 problems without hints

OA Ready

Readiness score reaches 80

Do not over-gamify.

Achievements should support learning.

==================================================

24. MOTIVATION SYSTEM

==================================================

Use short developer-focused motivational quotes.

Examples:

"Consistency beats motivation."

"Don't memorize solutions. Build recognition."

"Your future interview is trained in today's session."

"Easy problems build vocabulary. Medium problems build judgment."

"Speed comes after understanding."

"One solved problem is progress. One understood pattern is leverage."

Rotate quotes.

Do not make them cringe or overly inspirational.

==================================================

25. STREAK SYSTEM

==================================================

Track daily activity.

A day counts when:

- user completes at least 1 problem

But show separate:

Daily target completion.

Example:

Streak: 12 days

Today's target:

2 / 3

This prevents cheating through meaningless activity.

==================================================

26. SEARCH AND FILTER

==================================================

Problems page must have:

Search

Filter by:

Platform

Difficulty

Topic

Pattern

Status

Mastery

Review due

Date

Tags

Sort:

Newest

Oldest

Difficulty

Time taken

Confidence

Weakest

Most failed

==================================================

27. IMPORT / EXPORT

==================================================

Allow users to export their progress as CSV.

Export:

Problems

Attempts

Reviews

Analytics summary

Also allow simple CSV import for bulk problem creation.

This is useful for manually importing problem lists.

==================================================

28. DATA MODEL

==================================================

Create clean relational Supabase tables.

Suggested tables:

profiles

friendships

problems

problem_attempts

problem_reviews

mistakes

daily_missions

daily_mission_items

roadmap_phases

roadmap_topics

user_topic_progress

achievements

user_achievements

mock_oas

mock_oa_problems

mock_oa_results

activity_logs

Use foreign keys.

Use timestamps.

Use indexes for frequently queried fields.

==================================================

29. SECURITY

==================================================

Implement proper Supabase RLS.

Users can:

- read/write their own profile

- read/write their own attempts

- read/write their own reviews

- read/write their own missions

- read their friend's permitted progress

- manage their own achievements

Users must NOT be able to access another user's private notes or private data.

Friend progress visibility should be limited to approved friendships.

Never expose service-role keys.

==================================================

30. RESPONSIVENESS

==================================================

Desktop first but fully responsive.

Mobile navigation should become a bottom navigation or compact menu.

Dashboard must work well on:

Desktop

Tablet

Mobile

==================================================

31. EMPTY STATES

==================================================

Design meaningful empty states.

Example:

No problems yet.

"Your grind starts here.

Add your first problem and make today Day 1."

No review problems:

"Nothing to review today.

Your retention system is clean."

No friend:

"Invite your DSA partner and start training together."

==================================================

32. ONBOARDING

==================================================

First login:

Step 1:

Welcome

Step 2:

Profile

Step 3:

DSA level

Step 4:

Preferred language

Step 5:

Daily target

Step 6:

Target role

Step 7:

Create / join Duo

Then:

"Your training system is ready."

Generate initial dashboard.

==================================================

33. DEMO / SEED DATA

==================================================

Create seed/sample data so the application does NOT look empty during development.

Include realistic sample problems across:

Arrays

Strings

Hashing

Linked Lists

Stack

Queue

Binary Search

Trees

Graphs

DP

Use external links where appropriate.

Clearly label seed/demo data.

==================================================

34. PERFORMANCE

==================================================

Keep queries efficient.

Do not fetch entire problem databases unnecessarily.

Use pagination.

Use indexed queries.

Avoid unnecessary realtime subscriptions.

Only use realtime where it actually improves Duo/accountability.

==================================================

35. UX DETAILS

==================================================

Add toast notifications for actions.

Examples:

"Problem added."

"Today's mission complete."

"Review scheduled for tomorrow."

"🔥 7-day streak maintained."

Use confirmation dialogs for destructive actions.

Add loading skeletons.

Add error states.

Never leave blank white screens.

==================================================

36. COMMAND CENTER HEADER

==================================================

Top navigation should show:

Current streak 🔥

Today's progress 2/3

OA readiness

Profile

Example:

🔥 12    2/3 Today    OA 67%

==================================================

37. DASHBOARD PERSONALIZATION

==================================================

Dashboard should adapt based on data.

If user is consistent:

"You're on a strong consistency run. Focus on depth."

If user has poor consistency:

"Your biggest problem isn't DSA right now. It's consistency."

If user has many failed problems:

"Stop adding new problems. Review your failed problems first."

If speed is poor:

"Your accuracy is decent. Now train under time pressure."

This should be generated from measurable metrics, not random statements.

==================================================

38. CRITICAL PRODUCT PRINCIPLE

==================================================

DO NOT optimize the platform for:

"number of problems solved"

Optimize it for:

"number of problems understood and retained."

Therefore:

100 blindly solved problems should not look better than:

60 deeply understood and re-solved problems.

==================================================

39. FINAL DESIGN REQUIREMENT

==================================================

The finished application should feel like:

"Duolingo + GitHub contribution graph + LeetCode + Striver roadmap + personal training analytics"

BUT:

Do not copy any copyrighted design.

Create an original identity named:

DSA Forge

Tagline:

"Train the pattern. Master the problem."

==================================================

40. IMPLEMENTATION PRIORITY

==================================================

If you need to simplify anything because of the free-plan environment, prioritize in this exact order:

1. Authentication

2. Dashboard

3. Problem database

4. Add problem

5. Problem solving/attempt tracking

6. Daily 3-problem mission

7. Roadmap

8. Review system

9. Analytics

10. Duo/friend tracking

11. Mock OA

12. Achievements

13. Advanced polish

Do NOT sacrifice the core tracking system for visual effects.

==================================================

41. FINAL REQUIREMENT

==================================================

After implementing:

- Make sure the application compiles.

- Fix TypeScript errors.

- Fix broken routes.

- Fix Supabase query errors.

- Verify authentication flow.

- Verify RLS logic.

- Verify dashboard calculations.

- Verify daily mission logic.

- Verify problem creation.

- Verify attempt tracking.

- Verify friend visibility.

- Verify responsive UI.

Do not leave placeholder buttons that do nothing.

Every visible primary button should either work or be clearly marked as coming later.

Build the application now.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://dsa-duo.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/814c85ae-16d4-492a-b674-0d78b5ab34b0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
