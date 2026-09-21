
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.are_friends(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.find_user_by_username(TEXT) FROM PUBLIC, anon;

INSERT INTO public.roadmap_phases (phase_order, title, summary, topics, checklist) VALUES
(1,'Programming & Complexity','Language fluency and Big-O reasoning before anything else.','{Math}','{"Big-O of loops and recursion","Space vs time trade-offs","Language STL/collections fluency","Reading constraints to infer complexity"}'),
(2,'Arrays & Strings','The vocabulary layer of DSA.','{Arrays,Strings}','{"Traversal and in-place edits","Prefix/suffix reasoning","String building cost","Common array idioms"}'),
(3,'Hashing','Trade memory for time.','{Hashing}','{"Hash map vs hash set","Frequency counting","Grouping by key","Collision intuition"}'),
(4,'Two Pointers & Sliding Window','Linear-time scanning patterns.','{"Two Pointers","Sliding Window"}','{"Opposite-end pointers","Fixed window","Variable window with shrink","Window invariants"}'),
(5,'Sorting & Searching','Ordering unlocks structure.','{Sorting,"Binary Search"}','{"Comparator design","Sort-then-scan","Stability","Sorting complexity limits"}'),
(6,'Linked Lists','Pointer discipline.','{"Linked List"}','{"Reverse a list","Fast & slow pointer","Merge two lists","Dummy head technique"}'),
(7,'Stack & Queue','LIFO/FIFO modelling.','{Stack,Queue,Deque}','{"Matching/parentheses","Monotonic stack basics","Queue via stacks","Deque sliding max"}'),
(8,'Binary Search Mastery','Search on answer, not just arrays.','{"Binary Search"}','{"Lower/upper bound","Binary search on answer","Off-by-one discipline","Predicate monotonicity"}'),
(9,'Recursion & Backtracking','Think in states.','{Recursion,Backtracking}','{"Recursion tree drawing","Base case design","Subsets/permutations","Pruning"}'),
(10,'Trees & BST','Hierarchical thinking.','{Trees,BST}','{"All traversals","Recursive tree DP","BST invariants","LCA"}'),
(11,'Heap / Priority Queue','Top-K and scheduling.','{"Heap / Priority Queue"}','{"Min vs max heap","Top-K pattern","Merge K lists","Heapify cost"}'),
(12,'Greedy','Local choice, global proof.','{Greedy,Intervals}','{"Exchange argument","Interval scheduling","Sorting-based greedy","When greedy fails"}'),
(13,'Graphs','Model the world as nodes and edges.','{Graphs,BFS,DFS,"Topological Sort"}','{"Adjacency representations","BFS shortest path","DFS + cycle detection","Topological order"}'),
(14,'Tries & Union Find','Specialised structures.','{Trie,"Union Find"}','{"Trie insert/search","Prefix queries","DSU with path compression","Connected components"}'),
(15,'Dynamic Programming','From memoization to tabulation.','{"Dynamic Programming"}','{"State definition","Recurrence derivation","Memo to tabulation","Space optimisation"}'),
(16,'Advanced Patterns','Interview edge.','{Advanced,"Bit Manipulation","Monotonic Stack","Prefix Sum"}','{"Bitmask tricks","Monotonic stack problems","Prefix sum + hashing","Mixed-pattern problems"}');

INSERT INTO public.achievements (code,title,description,icon,sort_order) VALUES
('first_blood','First Blood','Log your first solved problem.','swords',1),
('streak_3','3-Day Streak','Stay active three days in a row.','flame',2),
('streak_7','7-Day Warrior','Seven consecutive active days.','flame',3),
('solved_50','50 Problems','Solve 50 problems.','target',4),
('solved_100','100 Problems','Solve 100 problems.','target',5),
('pattern_hunter','Pattern Hunter','Solve problems across 5 different patterns.','git-branch',6),
('consistency_king','Consistency King','Be active on 30 separate days.','calendar-check',7),
('resolver','Re-Solver','Complete 25 re-solves.','repeat',8),
('no_hint_hero','No Hint Hero','Solve 10 problems with zero hints.','lightbulb-off',9),
('oa_ready','OA Ready','Reach an OA readiness score of 80.','shield-check',10);
